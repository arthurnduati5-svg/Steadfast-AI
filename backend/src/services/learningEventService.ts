// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learning Event Service
// Append-only event logs that later reduce into durable memory.
// Uses Prisma when available; falls back to in-memory store.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  LearningEvent,
  LearningEventKind,
  LearningEventSource,
  LearningSignal,
  PrivacyLevel,
  CreateLearningEventRequest,
} from './learnerMemoryContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// ── In-memory fallback store ──
const eventMemoryStore = new Map<string, LearningEvent>();

// ── Prisma availability ──
// Map fallback is explicitly test/non-production only (R2.2/R2.3).
function isTestFallbackAllowed(): boolean {
  return process.env.NODE_ENV === 'test';
}

let _prismaAvailable: boolean | null = null;

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) {
    if (_prismaAvailable === false && !isTestFallbackAllowed()) {
      throw new Error('Prisma unavailable — fail closed in production');
    }
    return _prismaAvailable;
  }
  try {
    await (prisma as any).$queryRaw`SELECT 1`;
    _prismaAvailable = true;
  } catch {
    if (!isTestFallbackAllowed()) {
      _prismaAvailable = false;
      throw new Error('Prisma unavailable — fail closed in production');
    }
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

function resetPrismaAvailabilityForTest(): void {
  _prismaAvailable = null;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/**
 * Compute privacy level based on event source and kind.
 */
function computePrivacyLevel(
  kind: LearningEventKind,
  source: LearningEventSource,
): PrivacyLevel {
  // Teacher notes and system events default to medium
  if (source === 'teacher') return 'medium';
  if (source === 'system') return 'low';

  // Mistakes and hints are sensitive but essential
  if (kind === 'made_mistake' || kind === 'requested_hint') return 'high';
  if (kind === 'memory_corrected' || kind === 'memory_deleted') return 'high';

  // Practice events are medium
  if (kind === 'completed_practice' || kind === 'answered_question') return 'medium';

  return 'low';
}

// ── LearningEventService ──

export class LearningEventService {
  /**
   * Create a new learning event (append-only).
   * identity is resolved from auth context — never from request body.
   */
  /**
   * Pure builder: construct a LearningEvent from identity + input.
   * Performs no persistence. Used by createLearningEvent and by the
   * transactional event→memory orchestrator.
   */
  buildLearningEvent(
    identity: ResolvedTutorIdentity,
    input: CreateLearningEventRequest,
  ): LearningEvent {
    const now = nowISO();
    const eventId = generateId();

    // Normalize signals
    const signals: LearningSignal[] = (input.signals || []).map((s, i) => ({
      signalId: `sig_${eventId}_${i}`,
      kind: s.kind,
      label: s.label.trim().slice(0, 160),
      summary: s.summary.trim().slice(0, 1200),
      subject: s.subject?.trim().slice(0, 256) || null,
      topic: s.topic?.trim().slice(0, 256) || null,
      skillIds: uniqueStrings(s.skillIds || []),
      confidence: typeof s.confidence === 'number' ? Math.max(0, Math.min(1, s.confidence)) : 0.5,
      evidenceSummary: s.evidenceSummary.trim().slice(0, 800),
      artifactId: s.artifactId?.trim() || null,
      artifactBlockId: s.artifactBlockId?.trim() || null,
    }));

    const source = input.source || 'chat';
    const privacyLevel = computePrivacyLevel(input.kind, source);

    return {
      eventId,
      schoolId: identity.schoolId,
      studentId: identity.studentId,
      sessionId: input.sessionId?.trim() || null,
      kind: input.kind,
      subject: input.subject?.trim().slice(0, 256) || null,
      topic: input.topic?.trim().slice(0, 256) || null,
      skillIds: uniqueStrings(input.skillIds || []),
      artifactId: input.artifactId?.trim() || null,
      artifactBlockId: input.artifactBlockId?.trim() || null,
      promptSummary: input.promptSummary?.trim().slice(0, 1000) || null,
      responseSummary: input.responseSummary?.trim().slice(0, 1000) || null,
      outcomeSummary: input.outcomeSummary?.trim().slice(0, 1000) || null,
      signals,
      source,
      privacyLevel,
      createdAt: now,
    };
  }

  /**
   * Map a LearningEvent to Prisma create data. Reused by the orchestrator
   * so a single transaction can persist both the event and the memory.
   */
  toPrismaCreateData(event: LearningEvent): Record<string, unknown> {
    return {
      id: event.eventId,
      schoolId: event.schoolId,
      studentId: event.studentId,
      sessionId: event.sessionId,
      kind: event.kind,
      subject: event.subject,
      topic: event.topic,
      skillIds: event.skillIds as any,
      artifactId: event.artifactId,
      artifactBlockId: event.artifactBlockId,
      promptSummary: event.promptSummary,
      responseSummary: event.responseSummary,
      outcomeSummary: event.outcomeSummary,
      signals: event.signals as any,
      source: event.source,
      privacyLevel: event.privacyLevel,
    };
  }

  async createLearningEvent(
    identity: ResolvedTutorIdentity,
    input: CreateLearningEventRequest,
  ): Promise<LearningEvent> {
    const event = this.buildLearningEvent(identity, input);

    if (!isTestFallbackAllowed()) {
      // Production: Prisma is authoritative — fail closed, never use Map.
      await (prisma as any).learningEvent.create({
        data: this.toPrismaCreateData(event),
      });
      return event;
    }

    // Test / isolated no-DB mode: try Prisma, fallback to Map.
    const available = await isPrismaAvailable().catch(() => false as boolean);
    if (available) {
      try {
        await (prisma as any).learningEvent.create({
          data: this.toPrismaCreateData(event),
        });
        // Also keep in Map for deterministic test reads when mock DB is empty.
        eventMemoryStore.set(event.eventId, event);
        return event;
      } catch {
        // Prisma write failed in test — fallback to Map.
      }
    }
    // Non-DB fallback only — explicitly test-only.
    eventMemoryStore.set(event.eventId, event);
    return event;
  }

  /**
   * List learning events for a learner, scoped by school and student.
   */
  async listLearningEventsForLearner(
    identity: ResolvedTutorIdentity,
    options?: {
      kind?: LearningEventKind;
      sessionId?: string | null;
      subject?: string | null;
      topic?: string | null;
      limit?: number;
    },
  ): Promise<LearningEvent[]> {
    const limit = options?.limit || 50;

    if (!isTestFallbackAllowed()) {
      // Production: Prisma only — fail closed, never fallback to Map.
      const where: Record<string, unknown> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.kind) where.kind = options.kind;
      if (options?.sessionId) where.sessionId = options.sessionId;
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;
      const records = await (prisma as any).learningEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      if (!records || records.length === 0) return [];
      return records.map((r: any) => this._mapPrismaEvent(r)).slice(0, limit);
    }

    // Test: try Prisma first, fallback to Map.
    const fromDb = await this._listPrismaEvents(identity, options).catch(() => null);
    if (fromDb && fromDb.length > 0) {
      return fromDb.slice(0, limit);
    }

    // Fallback: in-memory — explicitly test-only.
    const all: LearningEvent[] = [];
    for (const event of eventMemoryStore.values()) {
      if (event.schoolId !== identity.schoolId) continue;
      if (event.studentId !== identity.studentId) continue;
      if (options?.kind && event.kind !== options.kind) continue;
      if (options?.sessionId && event.sessionId !== options.sessionId) continue;
      if (options?.subject && event.subject !== options.subject) continue;
      if (options?.topic && event.topic !== options.topic) continue;
      all.push(event);
    }

    // Sort by createdAt descending, then limit
    all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return all.slice(0, limit);
  }

  /**
   * Get a single event for a learner.
   */
  async getLearningEventForLearner(
    identity: ResolvedTutorIdentity,
    eventId: string,
  ): Promise<LearningEvent | null> {
    if (!isTestFallbackAllowed()) {
      // Production: Prisma only — fail closed.
      return this._getPrismaEvent(identity, eventId);
    }

    // Test: check Map first, fallback to Prisma.
    const memEvent = eventMemoryStore.get(eventId);
    if (memEvent) {
      if (memEvent.schoolId !== identity.schoolId) return null;
      if (memEvent.studentId !== identity.studentId) return null;
      return memEvent;
    }

    // Try Prisma — in test, swallow transient failures and fallback to null.
    return this._getPrismaEvent(identity, eventId).catch(() => null);
  }

  // ── Prisma persistence helpers ──

  private async _persistPrismaEvent(event: LearningEvent): Promise<void> {
    const available = await isPrismaAvailable();
    if (!available) {
      if (!isTestFallbackAllowed()) {
        throw new Error('Prisma unavailable — fail closed in production');
      }
      return;
    }
    try {
      await (prisma as any).learningEvent.create({
        data: {
          id: event.eventId,
          schoolId: event.schoolId,
          studentId: event.studentId,
          sessionId: event.sessionId,
          kind: event.kind,
          subject: event.subject,
          topic: event.topic,
          skillIds: event.skillIds as any,
          artifactId: event.artifactId,
          artifactBlockId: event.artifactBlockId,
          promptSummary: event.promptSummary,
          responseSummary: event.responseSummary,
          outcomeSummary: event.outcomeSummary,
          signals: event.signals as any,
          source: event.source,
          privacyLevel: event.privacyLevel,
        },
      });
    } catch (err) {
      if (!isTestFallbackAllowed()) throw err;
      // Prisma unavailable in test — in-memory copy is already stored
    }
  }

  private async _listPrismaEvents(
    identity: ResolvedTutorIdentity,
    options?: {
      kind?: LearningEventKind;
      sessionId?: string | null;
      subject?: string | null;
      topic?: string | null;
      limit?: number;
    },
  ): Promise<LearningEvent[] | null> {
    const available = await isPrismaAvailable();
    if (!available) {
      if (!isTestFallbackAllowed()) {
        throw new Error('Prisma unavailable — fail closed in production');
      }
      return null;
    }
    try {
      const where: Record<string, unknown> = {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
      };
      if (options?.kind) where.kind = options.kind;
      if (options?.sessionId) where.sessionId = options.sessionId;
      if (options?.subject) where.subject = options.subject;
      if (options?.topic) where.topic = options.topic;

      const records = await (prisma as any).learningEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 50,
      });

      if (!records || records.length === 0) return null;
      return records.map((r: any) => this._mapPrismaEvent(r));
    } catch (err) {
      if (!isTestFallbackAllowed()) throw err;
      return null;
    }
  }

  private async _getPrismaEvent(
    identity: ResolvedTutorIdentity,
    eventId: string,
  ): Promise<LearningEvent | null> {
    const available = await isPrismaAvailable();
    if (!available) {
      if (!isTestFallbackAllowed()) {
        throw new Error('Prisma unavailable — fail closed in production');
      }
      return null;
    }
    try {
      const record = await (prisma as any).learningEvent.findUnique({
        where: { id: eventId },
      });
      if (!record) return null;
      if (record.schoolId !== identity.schoolId) return null;
      if (record.studentId !== identity.studentId) return null;
      return this._mapPrismaEvent(record);
    } catch (err) {
      if (!isTestFallbackAllowed()) throw err;
      return null;
    }
  }

  private _mapPrismaEvent(record: any): LearningEvent {
    return {
      eventId: record.id,
      schoolId: record.schoolId,
      studentId: record.studentId,
      sessionId: record.sessionId ?? null,
      kind: record.kind as LearningEventKind,
      subject: record.subject ?? null,
      topic: record.topic ?? null,
      skillIds: Array.isArray(record.skillIds) ? record.skillIds : [],
      artifactId: record.artifactId ?? null,
      artifactBlockId: record.artifactBlockId ?? null,
      promptSummary: record.promptSummary ?? null,
      responseSummary: record.responseSummary ?? null,
      outcomeSummary: record.outcomeSummary ?? null,
      signals: Array.isArray(record.signals) ? record.signals : [],
      source: (record.source || 'chat') as LearningEventSource,
      privacyLevel: (record.privacyLevel || 'medium') as PrivacyLevel,
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
    };
  }
}

// Singleton
export const learningEventService = new LearningEventService();

// For testing
export function _clearEventMemoryStoreForTest(): void {
  eventMemoryStore.clear();
  resetPrismaAvailabilityForTest();
}

export function _resetLearningEventPrismaAvailabilityForTest(): void {
  resetPrismaAvailabilityForTest();
}
