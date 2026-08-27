import { vi } from 'vitest';
import * as path from 'path';

// Load backend .env so JWT_SECRET and other env vars are available at module import time
import { config } from 'dotenv';
config({ path: path.resolve(__dirname, '../../.env') });

// In-memory stores for test isolation
const sessionStateStore = new Map<string, any>();
const sessionEventStore = new Map<string, any>();
let sessionIdCounter = 0;
let eventIdCounter = 0;
let forceNextEventFailure = false;
function setForceNextEventFailure(v: boolean) { forceNextEventFailure = v; }
function shouldFailNextEvent() { if (forceNextEventFailure) { forceNextEventFailure = false; return true; } return false; }

function resetSessionStores() {
  sessionStateStore.clear();
  sessionEventStore.clear();
  sessionIdCounter = 0;
  eventIdCounter = 0;
}

function generateSessionId() {
  return `sls_${++sessionIdCounter}_${Date.now()}`;
}

function generateEventId() {
  return `evt_${++eventIdCounter}_${Date.now()}`;
}

vi.mock('../lib/prisma', () => {
  const mockQueryRaw = vi.fn().mockRejectedValue(new Error('prisma unavailable (test mock)'));
  return {
    default: {
      $queryRaw: mockQueryRaw,
      $transaction: vi.fn().mockImplementation(async (callback: any) => {
        const txCreatedStateIds = new Set<string>();
        const txCreatedEventIds = new Set<string>();
        const txUpdatedStateIds = new Set<string>();
        const eventCreateWithUniqueCheckTx = async (data: any) => {
          if (shouldFailNextEvent()) {
            const err: any = new Error('simulated event failure');
            err.code = 'SIMULATED_FAILURE';
            throw err;
          }
          if (data.idempotencyKey) {
            for (const existing of sessionEventStore.values()) {
              if (
                existing.idempotencyKey === data.idempotencyKey &&
                existing.schoolId === data.schoolId &&
                existing.tutorLearnerId === data.tutorLearnerId
              ) {
                const err: any = new Error('Unique constraint failed on idempotencyKey');
                err.code = 'P2002';
                err.name = 'PrismaClientKnownRequestError';
                throw err;
              }
            }
          }
          const id = generateEventId();
          const event = { id, ...data, createdAt: new Date() };
          sessionEventStore.set(id, event);
          txCreatedEventIds.add(id);
          return event;
        };
        try {
          return await callback({
          studentLearningSessionState: {
            findUnique: vi.fn().mockImplementation(({ where }: any) => {
              const session = sessionStateStore.get(where.id);
              return Promise.resolve(session || null);
            }),
            findFirst: vi.fn().mockImplementation(({ where }: any) => {
              for (const session of sessionStateStore.values()) {
                if (where.id && session.id !== where.id) continue;
                if (where.schoolId && session.schoolId !== where.schoolId) continue;
                if (where.tutorLearnerId && session.tutorLearnerId !== where.tutorLearnerId) continue;
                if (where.stateVersion !== undefined && session.stateVersion !== where.stateVersion) continue;
                return Promise.resolve(session);
              }
              return Promise.resolve(null);
            }),
            findMany: vi.fn().mockImplementation(({ where, orderBy, take }: any) => {
              let sessions = Array.from(sessionStateStore.values());
              if (where) {
                sessions = sessions.filter(s => {
                  if (where.schoolId && s.schoolId !== where.schoolId) return false;
                  if (where.tutorLearnerId && s.tutorLearnerId !== where.tutorLearnerId) return false;
                  return true;
                });
              }
              if (orderBy && orderBy.updatedAt === 'desc') {
                sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
              }
              if (take) {
                sessions = sessions.slice(0, take);
              }
              return Promise.resolve(sessions);
            }),
            create: vi.fn().mockImplementation(({ data }: any) => {
              const id = generateSessionId();
              const session = {
                id,
                ...data,
                createdAt: data.createdAt || new Date(),
                updatedAt: data.updatedAt || new Date(),
              };
              sessionStateStore.set(id, session);
              txCreatedStateIds.add(id);
              return Promise.resolve(session);
            }),
            update: vi.fn().mockImplementation(({ where, data }: any) => {
              const session = sessionStateStore.get(where.id);
              if (!session) return Promise.resolve(null);
              const updated = { ...session, ...data, updatedAt: data.updatedAt || new Date() };
              sessionStateStore.set(where.id, updated);
              txUpdatedStateIds.add(where.id);
              return Promise.resolve(updated);
            }),
            updateMany: vi.fn().mockImplementation(({ where, data }: any) => {
              let count = 0;
              for (const [id, session] of sessionStateStore.entries()) {
                if (where.id && session.id !== where.id) continue;
                if (where.schoolId && session.schoolId !== where.schoolId) continue;
                if (where.tutorLearnerId && session.tutorLearnerId !== where.tutorLearnerId) continue;
                if (where.stateVersion !== undefined && session.stateVersion !== where.stateVersion) continue;
                const updated = { ...session, ...data, updatedAt: data.updatedAt || new Date() };
                sessionStateStore.set(id, updated);
                count++;
              }
              return Promise.resolve({ count });
            }),
            delete: vi.fn().mockImplementation(({ where }: any) => {
              const deleted = sessionStateStore.delete(where.id);
              return Promise.resolve(deleted ? { id: where.id } : null);
            }),
            count: vi.fn().mockResolvedValue(0),
          },
          studentLearningSessionEvent: {
            findUnique: vi.fn().mockImplementation(({ where }: any) => {
              const event = sessionEventStore.get(where.id);
              return Promise.resolve(event || null);
            }),
            findFirst: vi.fn().mockImplementation(({ where }: any) => {
              for (const event of sessionEventStore.values()) {
                if (where.idempotencyKey && event.idempotencyKey !== where.idempotencyKey) continue;
                if (where.schoolId && event.schoolId !== where.schoolId) continue;
                if (where.tutorLearnerId && event.tutorLearnerId !== where.tutorLearnerId) continue;
                return Promise.resolve(event);
              }
              return Promise.resolve(null);
            }),
            findMany: vi.fn().mockImplementation(({ where, orderBy, take }: any) => {
              let events = Array.from(sessionEventStore.values());
              if (where) {
                events = events.filter(e => {
                  if (where.sessionId && e.sessionId !== where.sessionId) return false;
                  if (where.schoolId && e.schoolId !== where.schoolId) return false;
                  if (where.tutorLearnerId && e.tutorLearnerId !== where.tutorLearnerId) return false;
                  return true;
                });
              }
              if (orderBy && orderBy.createdAt === 'asc') {
                events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
              }
              if (take) {
                events = events.slice(0, take);
              }
              return Promise.resolve(events);
            }),
            create: vi.fn().mockImplementation(({ data }: any) => eventCreateWithUniqueCheckTx(data)),
            update: vi.fn().mockResolvedValue({}),
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
            delete: vi.fn().mockResolvedValue({}),
            count: vi.fn().mockResolvedValue(0),
          },
        });
        } catch (e) {
          // Roll back only mutations performed within THIS transaction. Winner
          // transactions running concurrently commit their own rows which must
          // remain durable (mirrors real Postgres transaction isolation).
          for (const id of txCreatedStateIds) sessionStateStore.delete(id);
          for (const id of txCreatedEventIds) sessionEventStore.delete(id);
          for (const id of txUpdatedStateIds) sessionStateStore.delete(id);
          throw e;
        }
      }),
      learningArtifact: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      learningArtifactBlock: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        createMany: vi.fn().mockResolvedValue({ count: 0 }),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
      tutorLearnerIdentityMap: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
      },
      tutorState: {
        findUnique: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
      },
      learnerMemory: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      learnerMemoryEvent: {
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
      },
      learningModeSession: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      learningModeSignal: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      learningModeAttempt: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      learningModeHintEvent: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        create: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      learningModeExitSummary: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      studentLearningProfileSnapshot: {
        findUnique: vi.fn().mockResolvedValue(null),
        findFirst: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        upsert: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      studentSupportPatternSnapshot: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
        count: vi.fn().mockResolvedValue(0),
      },
      studentMasteryAggregationRun: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      skillMasterySnapshot: {
        findUnique: vi.fn().mockResolvedValue(null),
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        upsert: vi.fn().mockResolvedValue({}),
        create: vi.fn().mockResolvedValue({}),
        update: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
      practiceAttempt: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      growthWeakTopicState: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      growthMistakePatternState: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
      },
      learnerMemoryItem: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(0),
      },
      studentLearningSessionState: {
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const session = sessionStateStore.get(where.id);
          return Promise.resolve(session || null);
        }),
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          for (const session of sessionStateStore.values()) {
            if (where.id && session.id !== where.id) continue;
            if (where.schoolId && session.schoolId !== where.schoolId) continue;
            if (where.tutorLearnerId && session.tutorLearnerId !== where.tutorLearnerId) continue;
            if (where.stateVersion !== undefined && session.stateVersion !== where.stateVersion) continue;
            return Promise.resolve(session);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockImplementation(({ where, orderBy, take }: any) => {
          let sessions = Array.from(sessionStateStore.values());
          if (where) {
            sessions = sessions.filter(s => {
              if (where.schoolId && s.schoolId !== where.schoolId) return false;
              if (where.tutorLearnerId && s.tutorLearnerId !== where.tutorLearnerId) return false;
              return true;
            });
          }
          if (orderBy && orderBy.updatedAt === 'desc') {
            sessions.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          }
          if (take) {
            sessions = sessions.slice(0, take);
          }
          return Promise.resolve(sessions);
        }),
        create: vi.fn().mockImplementation(({ data }: any) => {
          const id = generateSessionId();
          const session = {
            id,
            ...data,
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
          };
          sessionStateStore.set(id, session);
          return Promise.resolve(session);
        }),
        update: vi.fn().mockImplementation(({ where, data }: any) => {
          const session = sessionStateStore.get(where.id);
          if (!session) return Promise.resolve(null);
          const updated = { ...session, ...data, updatedAt: data.updatedAt || new Date() };
          sessionStateStore.set(where.id, updated);
          return Promise.resolve(updated);
        }),
        updateMany: vi.fn().mockImplementation(({ where, data }: any) => {
          let count = 0;
          for (const [id, session] of sessionStateStore.entries()) {
            if (where.id && session.id !== where.id) continue;
            if (where.schoolId && session.schoolId !== where.schoolId) continue;
            if (where.tutorLearnerId && session.tutorLearnerId !== where.tutorLearnerId) continue;
            if (where.stateVersion !== undefined && session.stateVersion !== where.stateVersion) continue;
            const updated = { ...session, ...data, updatedAt: data.updatedAt || new Date() };
            sessionStateStore.set(id, updated);
            count++;
          }
          return Promise.resolve({ count });
        }),
        delete: vi.fn().mockImplementation(({ where }: any) => {
          const deleted = sessionStateStore.delete(where.id);
          return Promise.resolve(deleted ? { id: where.id } : null);
        }),
        count: vi.fn().mockResolvedValue(0),
      },
      studentLearningSessionEvent: {
        findUnique: vi.fn().mockImplementation(({ where }: any) => {
          const event = sessionEventStore.get(where.id);
          return Promise.resolve(event || null);
        }),
        findFirst: vi.fn().mockImplementation(({ where }: any) => {
          for (const event of sessionEventStore.values()) {
            if (where.idempotencyKey && event.idempotencyKey !== where.idempotencyKey) continue;
            if (where.schoolId && event.schoolId !== where.schoolId) continue;
            if (where.tutorLearnerId && event.tutorLearnerId !== where.tutorLearnerId) continue;
            return Promise.resolve(event);
          }
          return Promise.resolve(null);
        }),
        findMany: vi.fn().mockImplementation(({ where, orderBy, take }: any) => {
          let events = Array.from(sessionEventStore.values());
          if (where) {
            events = events.filter(e => {
              if (where.sessionId && e.sessionId !== where.sessionId) return false;
              if (where.schoolId && e.schoolId !== where.schoolId) return false;
              if (where.tutorLearnerId && e.tutorLearnerId !== where.tutorLearnerId) return false;
              return true;
            });
          }
          if (orderBy && orderBy.createdAt === 'asc') {
            events.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
          }
          if (take) {
            events = events.slice(0, take);
          }
          return Promise.resolve(events);
        }),
        create: vi.fn().mockImplementation(({ data }: any) => {
          if (shouldFailNextEvent()) {
            const err: any = new Error('simulated event failure');
            err.code = 'SIMULATED_FAILURE';
            throw err;
          }
          if (data.idempotencyKey) {
            for (const existing of sessionEventStore.values()) {
              if (
                existing.idempotencyKey === data.idempotencyKey &&
                existing.schoolId === data.schoolId &&
                existing.tutorLearnerId === data.tutorLearnerId
              ) {
                const err: any = new Error('Unique constraint failed on idempotencyKey');
                err.code = 'P2002';
                err.name = 'PrismaClientKnownRequestError';
                throw err;
              }
            }
          }
          const id = generateEventId();
          const event = {
            id,
            ...data,
            createdAt: new Date(),
          };
          sessionEventStore.set(id, event);
          return Promise.resolve(event);
        }),
        update: vi.fn().mockResolvedValue({}),
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        delete: vi.fn().mockResolvedValue({}),
        count: vi.fn().mockResolvedValue(0),
      },
    } as any,
  };
});

// Export reset function for tests
export { resetSessionStores, setForceNextEventFailure };

vi.mock('redis', () => {
  const mockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setEx: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    exists: vi.fn().mockResolvedValue(0),
    expire: vi.fn().mockResolvedValue(true),
    ttl: vi.fn().mockResolvedValue(-1),
    on: vi.fn().mockReturnThis(),
    quit: vi.fn().mockResolvedValue('OK'),
    isOpen: false,
  };
  return {
    createClient: vi.fn().mockReturnValue(mockClient),
    default: { createClient: vi.fn().mockReturnValue(mockClient) },
  };
});
