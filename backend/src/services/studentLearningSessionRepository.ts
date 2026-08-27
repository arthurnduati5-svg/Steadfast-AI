import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';
import type {
  StudentLearningSessionStatus,
  StudentLearningSessionStage,
  StudentLearningSessionMode,
  StudentLearningSessionTransitionType,
  StudentLearningSessionSourceTruthStatus,
  StudentLearningSessionConfidenceBucket,
  StudentLearningSessionReasonCode,
  StudentLearningSessionRecord,
  StudentLearningSessionActionHistoryEvent,
} from '../contracts/studentLearningSessionContracts';

interface StudentLearningSessionEvent {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId: string;
  eventType: string;
  transitionType?: StudentLearningSessionTransitionType;
  previousStatus?: StudentLearningSessionStatus;
  resultingStatus?: StudentLearningSessionStatus;
  previousMode?: StudentLearningSessionMode;
  nextMode?: StudentLearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeEventSummary?: string;
  safeEvidenceRefs: string[];
  reasonCodes: StudentLearningSessionReasonCode[];
  privacyMetadata: Record<string, unknown>;
  operationVersion: number;
  idempotencyKey?: string;
  requestFingerprint?: string;
  requestId?: string;
  correlationId?: string;
  createdAt: Date;
}

interface SessionStateRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId: string | null;
  externalStudentId: string | null;
  status: string;
  stage: string;
  currentMode: string;
  previousMode: string | null;
  subject: string | null;
  topic: string | null;
  skillTag: string | null;
  objectiveId: string | null;
  activeChallengeId: string | null;
  activeRemediationPathId: string | null;
  activeRevisionItemId: string | null;
  supportLevel: string | null;
  difficultyLevel: string | null;
  safeProgressSummary: string | null;
  safeEvidenceRefs: unknown;
  reasonCodes: unknown;
  privacyMetadata: unknown;
  sourceTruthStatus: string;
  confidenceBucket: string;
  stateVersion: number;
  lastTransitionAt: Date;
  endedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface SessionEventRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  sessionId: string;
  studentId: string | null;
  eventType: string;
  transitionType: string | null;
  previousStatus: string | null;
  resultingStatus: string | null;
  previousMode: string | null;
  nextMode: string | null;
  subject: string | null;
  topic: string | null;
  skillTag: string | null;
  safeEventSummary: string | null;
  safeEvidenceRefs: unknown;
  reasonCodes: unknown;
  privacyMetadata: unknown;
  operationVersion: number;
  idempotencyKey: string | null;
  requestFingerprint: string | null;
  requestId: string | null;
  correlationId: string | null;
  createdAt: Date;
}

function toSessionRecord(row: SessionStateRow): StudentLearningSessionRecord {
  return {
    id: row.id,
    schoolId: row.schoolId,
    studentId: row.studentId ?? undefined,
    tutorLearnerId: row.tutorLearnerId,
    subjectId: row.subject ?? undefined,
    topicId: row.topic ?? undefined,
    skillId: row.skillTag ?? undefined,
    objectiveId: row.objectiveId ?? undefined,
    status: row.status as StudentLearningSessionStatus,
    stage: row.stage as StudentLearningSessionStage,
    currentMode: row.currentMode as StudentLearningSessionMode,
    previousMode: row.previousMode as StudentLearningSessionMode | undefined,
    transitionStatus: undefined,
    allowedTransitions: [],
    blockedTransitions: [],
    safeReasonCodes: Array.isArray(row.reasonCodes) ? row.reasonCodes as StudentLearningSessionReasonCode[] : [],
    safeEvidenceRefs: Array.isArray(row.safeEvidenceRefs) ? row.safeEvidenceRefs as string[] : [],
    safeActionRefs: [],
    lastGrowthActionId: row.activeChallengeId ?? undefined,
    lastTutorTurnId: undefined,
    lastChallengeId: row.activeChallengeId ?? undefined,
    lastRemediationPathId: row.activeRemediationPathId ?? undefined,
    lastRecommendationId: undefined,
    lastEvidenceEventId: undefined,
    startedAt: row.createdAt,
    lastActiveAt: row.lastTransitionAt,
    endedAt: row.endedAt ?? undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toEventRecord(row: SessionEventRow): StudentLearningSessionEvent {
  return {
    id: row.id,
    schoolId: row.schoolId,
    tutorLearnerId: row.tutorLearnerId,
    studentId: row.studentId ?? undefined,
    sessionId: row.sessionId,
    eventType: row.eventType,
    transitionType: row.transitionType as StudentLearningSessionTransitionType | undefined,
    previousStatus: row.previousStatus as StudentLearningSessionStatus | undefined,
    resultingStatus: row.resultingStatus as StudentLearningSessionStatus | undefined,
    previousMode: row.previousMode as StudentLearningSessionMode | undefined,
    nextMode: row.nextMode as StudentLearningSessionMode | undefined,
    subject: row.subject ?? undefined,
    topic: row.topic ?? undefined,
    skillTag: row.skillTag ?? undefined,
    safeEventSummary: row.safeEventSummary ?? undefined,
    safeEvidenceRefs: Array.isArray(row.safeEvidenceRefs) ? row.safeEvidenceRefs as string[] : [],
    reasonCodes: Array.isArray(row.reasonCodes) ? row.reasonCodes as StudentLearningSessionReasonCode[] : [],
    privacyMetadata: (row.privacyMetadata && typeof row.privacyMetadata === 'object') ? row.privacyMetadata as Record<string, unknown> : {},
    operationVersion: row.operationVersion,
    idempotencyKey: row.idempotencyKey ?? undefined,
    requestFingerprint: row.requestFingerprint ?? undefined,
    requestId: row.requestId ?? undefined,
    correlationId: row.correlationId ?? undefined,
    createdAt: row.createdAt,
  };
}

function toActionHistoryEvent(row: SessionEventRow): StudentLearningSessionActionHistoryEvent {
  return {
    eventId: row.id,
    sessionId: row.sessionId,
    schoolId: row.schoolId,
    studentId: row.studentId ?? undefined,
    tutorLearnerId: row.tutorLearnerId,
    actionType: row.eventType,
    mode: (row.nextMode || row.previousMode || 'none') as StudentLearningSessionMode,
    transitionType: row.transitionType as StudentLearningSessionTransitionType | undefined,
    status: row.resultingStatus || row.previousStatus || 'unknown',
    safeReasonCodes: Array.isArray(row.reasonCodes) ? row.reasonCodes as StudentLearningSessionReasonCode[] : [],
    safeEvidenceRefs: Array.isArray(row.safeEvidenceRefs) ? row.safeEvidenceRefs as string[] : [],
    createdAt: row.createdAt.toISOString(),
  };
}

export interface CreateSessionInput {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  externalStudentId?: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveId?: string;
}

export interface UpdateSessionInput {
  status?: StudentLearningSessionStatus;
  stage?: StudentLearningSessionStage;
  currentMode?: StudentLearningSessionMode;
  previousMode?: StudentLearningSessionMode;
  subject?: string | null;
  topic?: string | null;
  skillTag?: string | null;
  objectiveId?: string | null;
  activeChallengeId?: string | null;
  activeRemediationPathId?: string | null;
  activeRevisionItemId?: string | null;
  supportLevel?: string | null;
  difficultyLevel?: string | null;
  safeProgressSummary?: string | null;
  safeEvidenceRefs?: string[];
  reasonCodes?: StudentLearningSessionReasonCode[];
  privacyMetadata?: Record<string, unknown>;
  sourceTruthStatus?: StudentLearningSessionSourceTruthStatus;
  confidenceBucket?: StudentLearningSessionConfidenceBucket;
}

export interface AppendEventInput {
  schoolId: string;
  tutorLearnerId: string;
  sessionId: string;
  studentId?: string;
  eventType: string;
  transitionType?: StudentLearningSessionTransitionType;
  previousStatus?: StudentLearningSessionStatus;
  resultingStatus?: StudentLearningSessionStatus;
  previousMode?: StudentLearningSessionMode;
  nextMode?: StudentLearningSessionMode;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeEventSummary?: string;
  safeEvidenceRefs?: string[];
  reasonCodes?: StudentLearningSessionReasonCode[];
  privacyMetadata?: Record<string, unknown>;
  operationVersion: number;
  idempotencyKey?: string;
  requestFingerprint?: string;
  requestId?: string;
  correlationId?: string;
}

export interface IdempotencyCheckResult {
  exists: boolean;
  event?: StudentLearningSessionEvent;
  fingerprintMatch?: boolean;
}

export interface VersionedSessionRecord {
  record: StudentLearningSessionRecord;
  stateVersion: number;
}

export interface TransactionalMutationInput {
  sessionId: string;
  schoolId: string;
  tutorLearnerId: string;
  expectedVersion: number;
  updates: UpdateSessionInput;
  event: Omit<AppendEventInput, 'schoolId' | 'tutorLearnerId' | 'sessionId' | 'operationVersion'>;
  idempotencyKey?: string;
  requestFingerprint?: string;
}

export interface TransactionalMutationResult {
  record: StudentLearningSessionRecord;
  event: StudentLearningSessionEvent;
  success: boolean;
  conflict?: 'version' | 'idempotency';
}

export interface CreateSessionWithEventResult {
  record: StudentLearningSessionRecord;
  event: StudentLearningSessionEvent | null;
  created: boolean;
  conflict?: 'idempotency';
}

export class StudentLearningSessionRepository {
  async createSession(input: CreateSessionInput): Promise<StudentLearningSessionRecord> {
    const now = new Date();
    const row = await prisma.studentLearningSessionState.create({
      data: {
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId || null,
        externalStudentId: input.externalStudentId || null,
        status: 'created',
        stage: 'orienting',
        currentMode: 'none',
        subject: input.subjectId || null,
        topic: input.topicId || null,
        skillTag: input.skillId || null,
        objectiveId: input.objectiveId || null,
        safeEvidenceRefs: [],
        reasonCodes: ['session_created'],
        privacyMetadata: {},
        sourceTruthStatus: 'unknown',
        confidenceBucket: 'not_enough_evidence',
        stateVersion: 1,
        lastTransitionAt: now,
        createdAt: now,
        updatedAt: now,
      },
    });
    return toSessionRecord(row);
  }

  async getSessionWithVersion(
    sessionId: string,
    schoolId: string,
    tutorLearnerId: string,
  ): Promise<VersionedSessionRecord | null> {
    const row = await prisma.studentLearningSessionState.findFirst({
      where: {
        id: sessionId,
        schoolId,
        tutorLearnerId,
      },
    });
    if (!row) return null;
    return {
      record: toSessionRecord(row),
      stateVersion: row.stateVersion,
    };
  }

  async getSession(
    sessionId: string,
    schoolId: string,
    tutorLearnerId: string,
  ): Promise<StudentLearningSessionRecord | null> {
    const row = await prisma.studentLearningSessionState.findFirst({
      where: {
        id: sessionId,
        schoolId,
        tutorLearnerId,
      },
    });
    return row ? toSessionRecord(row) : null;
  }

  async listSessionsForLearner(
    schoolId: string,
    tutorLearnerId: string,
    limit = 50,
  ): Promise<StudentLearningSessionRecord[]> {
    const rows = await prisma.studentLearningSessionState.findMany({
      where: {
        schoolId,
        tutorLearnerId,
      },
      orderBy: { updatedAt: 'desc' },
      take: limit,
    });
    return rows.map(toSessionRecord);
  }

  async updateSession(
    sessionId: string,
    schoolId: string,
    tutorLearnerId: string,
    expectedVersion: number,
    updates: UpdateSessionInput,
  ): Promise<{ record: StudentLearningSessionRecord; success: boolean }> {
    const now = new Date();
    const data: Record<string, unknown> = {
      updatedAt: now,
      lastTransitionAt: now,
    };

    if (updates.status !== undefined) data.status = updates.status;
    if (updates.stage !== undefined) data.stage = updates.stage;
    if (updates.currentMode !== undefined) {
      data.currentMode = updates.currentMode;
      data.previousMode = updates.previousMode ?? undefined;
    }
    if (updates.previousMode !== undefined) data.previousMode = updates.previousMode;
    if (updates.subject !== undefined) data.subject = updates.subject;
    if (updates.topic !== undefined) data.topic = updates.topic;
    if (updates.skillTag !== undefined) data.skillTag = updates.skillTag;
    if (updates.objectiveId !== undefined) data.objectiveId = updates.objectiveId;
    if (updates.activeChallengeId !== undefined) data.activeChallengeId = updates.activeChallengeId;
    if (updates.activeRemediationPathId !== undefined) data.activeRemediationPathId = updates.activeRemediationPathId;
    if (updates.activeRevisionItemId !== undefined) data.activeRevisionItemId = updates.activeRevisionItemId;
    if (updates.supportLevel !== undefined) data.supportLevel = updates.supportLevel;
    if (updates.difficultyLevel !== undefined) data.difficultyLevel = updates.difficultyLevel;
    if (updates.safeProgressSummary !== undefined) data.safeProgressSummary = updates.safeProgressSummary;
    if (updates.safeEvidenceRefs !== undefined) data.safeEvidenceRefs = updates.safeEvidenceRefs;
    if (updates.reasonCodes !== undefined) data.reasonCodes = updates.reasonCodes;
    if (updates.privacyMetadata !== undefined) data.privacyMetadata = updates.privacyMetadata;
    if (updates.sourceTruthStatus !== undefined) data.sourceTruthStatus = updates.sourceTruthStatus;
    if (updates.confidenceBucket !== undefined) data.confidenceBucket = updates.confidenceBucket;

    if (updates.status && ['completed', 'abandoned', 'expired'].includes(updates.status)) {
      data.endedAt = now;
    }

    const result = await prisma.studentLearningSessionState.updateMany({
      where: {
        id: sessionId,
        schoolId,
        tutorLearnerId,
        stateVersion: expectedVersion,
      },
      data: {
        ...data,
        stateVersion: expectedVersion + 1,
      },
    });

    if (result.count === 0) {
      const current = await this.getSession(sessionId, schoolId, tutorLearnerId);
      return { record: current!, success: false };
    }

    const updated = await prisma.studentLearningSessionState.findUnique({
      where: { id: sessionId },
    });
    return { record: toSessionRecord(updated!), success: true };
  }

  async appendEvent(input: AppendEventInput): Promise<StudentLearningSessionEvent> {
    const row = await prisma.studentLearningSessionEvent.create({
      data: {
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        sessionId: input.sessionId,
        studentId: input.studentId || null,
        eventType: input.eventType,
        transitionType: input.transitionType || null,
        previousStatus: input.previousStatus || null,
        resultingStatus: input.resultingStatus || null,
        previousMode: input.previousMode || null,
        nextMode: input.nextMode || null,
        subject: input.subject || null,
        topic: input.topic || null,
        skillTag: input.skillTag || null,
        safeEventSummary: input.safeEventSummary || null,
        safeEvidenceRefs: input.safeEvidenceRefs || [],
        reasonCodes: input.reasonCodes || [],
        privacyMetadata: (input.privacyMetadata || {}) as Prisma.InputJsonValue,
        operationVersion: input.operationVersion,
        idempotencyKey: input.idempotencyKey || null,
        requestFingerprint: input.requestFingerprint || null,
        requestId: input.requestId || null,
        correlationId: input.correlationId || null,
      },
    });
    return toEventRecord(row);
  }

  async createSessionWithEvent(
    input: CreateSessionInput,
    idempotencyKey?: string,
    requestFingerprint?: string,
  ): Promise<CreateSessionWithEventResult> {
    const isKeyed = !!idempotencyKey && !!requestFingerprint;

    if (!isKeyed) {
      const record = await this.createSession(input);
      return { record, event: null, created: true };
    }

    const scopedKey = idempotencyKey!;
    const scopedFp = requestFingerprint!;

    try {
      return await prisma.$transaction(async (tx) => {
        const existingEvent = await tx.studentLearningSessionEvent.findFirst({
          where: {
            idempotencyKey: scopedKey,
            schoolId: input.schoolId,
            tutorLearnerId: input.tutorLearnerId,
          },
        });

        if (existingEvent) {
          if (existingEvent.requestFingerprint === scopedFp) {
            const session = await tx.studentLearningSessionState.findUnique({
              where: { id: existingEvent.sessionId },
            });
            if (session) {
              return {
                record: toSessionRecord(session as SessionStateRow),
                event: toEventRecord(existingEvent as SessionEventRow),
                created: false,
              };
            }
            return { record: null as unknown as StudentLearningSessionRecord, event: null, created: false, conflict: 'idempotency' };
          }
          return { record: null as unknown as StudentLearningSessionRecord, event: null, created: false, conflict: 'idempotency' };
        }

        const now = new Date();
        const sessionRow = await tx.studentLearningSessionState.create({
          data: {
            schoolId: input.schoolId,
            tutorLearnerId: input.tutorLearnerId,
            studentId: input.studentId || null,
            externalStudentId: input.externalStudentId || null,
            status: 'created',
            stage: 'orienting',
            currentMode: 'none',
            subject: input.subjectId || null,
            topic: input.topicId || null,
            skillTag: input.skillId || null,
            objectiveId: input.objectiveId || null,
            safeEvidenceRefs: [],
            reasonCodes: ['session_created'],
            privacyMetadata: {},
            sourceTruthStatus: 'unknown',
            confidenceBucket: 'not_enough_evidence',
            stateVersion: 1,
            lastTransitionAt: now,
            createdAt: now,
            updatedAt: now,
          },
        });

        const eventRow = (await tx.studentLearningSessionEvent.create({
          data: {
            schoolId: input.schoolId,
            tutorLearnerId: input.tutorLearnerId,
            sessionId: sessionRow.id,
            studentId: input.studentId || null,
            eventType: 'session_created',
            transitionType: null,
            previousStatus: null,
            resultingStatus: null,
            previousMode: null,
            nextMode: null,
            subject: input.subjectId || null,
            topic: input.topicId || null,
            skillTag: input.skillId || null,
            safeEventSummary: 'session_created',
            safeEvidenceRefs: [],
            reasonCodes: ['session_created'],
            privacyMetadata: {},
            operationVersion: 1,
            idempotencyKey: scopedKey,
            requestFingerprint: scopedFp,
            requestId: null,
            correlationId: null,
          },
        })) as unknown as SessionEventRow;

        return {
          record: toSessionRecord(sessionRow as SessionStateRow),
          event: toEventRecord(eventRow),
          created: true,
        };
      });
    } catch (err: unknown) {
      const code = (err as unknown as { code?: string })?.code;
      const isP2002 =
        (err instanceof Prisma.PrismaClientKnownRequestError && (err as unknown as { code: string }).code === 'P2002') ||
        code === 'P2002';
      if (isP2002) {
        const winnerEvent = await prisma.studentLearningSessionEvent.findFirst({
          where: { idempotencyKey: scopedKey, schoolId: input.schoolId, tutorLearnerId: input.tutorLearnerId },
        });
        if (winnerEvent) {
          if (winnerEvent.requestFingerprint === scopedFp) {
            const session = await prisma.studentLearningSessionState.findUnique({
              where: { id: winnerEvent.sessionId },
            });
            if (session) {
              return {
                record: toSessionRecord(session as SessionStateRow),
                event: toEventRecord(winnerEvent as SessionEventRow),
                created: false,
              };
            }
          } else {
            return { record: null as unknown as StudentLearningSessionRecord, event: null, created: false, conflict: 'idempotency' };
          }
        }
        return { record: null as unknown as StudentLearningSessionRecord, event: null, created: false, conflict: 'idempotency' };
      }
      throw err;
    }
  }

  async listEvents(
    sessionId: string,
    schoolId: string,
    tutorLearnerId: string,
    limit = 50,
  ): Promise<StudentLearningSessionEvent[]> {
    const rows = await prisma.studentLearningSessionEvent.findMany({
      where: {
        sessionId,
        schoolId,
        tutorLearnerId,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(toEventRecord);
  }

  async listActionHistory(
    sessionId: string,
    schoolId: string,
    tutorLearnerId: string,
    limit = 50,
  ): Promise<StudentLearningSessionActionHistoryEvent[]> {
    const rows = await prisma.studentLearningSessionEvent.findMany({
      where: {
        sessionId,
        schoolId,
        tutorLearnerId,
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });
    return rows.map(toActionHistoryEvent);
  }

  async checkIdempotency(
    idempotencyKey: string,
    schoolId: string,
    tutorLearnerId: string,
    requestFingerprint: string,
  ): Promise<IdempotencyCheckResult> {
    const row = await prisma.studentLearningSessionEvent.findFirst({
      where: {
        idempotencyKey,
        schoolId,
        tutorLearnerId,
      },
    });
    if (!row) return { exists: false };
    const fingerprintMatch = row.requestFingerprint === requestFingerprint;
    return { exists: true, event: toEventRecord(row), fingerprintMatch };
  }

  async getSessionByIdLegacy(sessionId: string): Promise<StudentLearningSessionRecord | null> {
    const row = await prisma.studentLearningSessionState.findUnique({
      where: { id: sessionId },
    });
    return row ? toSessionRecord(row as unknown as SessionStateRow) : null;
  }

  async getSessionByIdempotencyKey(
    idempotencyKey: string,
    schoolId: string,
    tutorLearnerId: string,
  ): Promise<StudentLearningSessionRecord | null> {
    const event = await prisma.studentLearningSessionEvent.findFirst({
      where: {
        idempotencyKey,
        schoolId,
        tutorLearnerId,
      },
    });
    if (!event) return null;
    return this.getSession(event.sessionId, schoolId, tutorLearnerId);
  }

  async mutateSessionWithEvent(
    input: TransactionalMutationInput,
  ): Promise<TransactionalMutationResult> {
    const { sessionId, schoolId, tutorLearnerId, expectedVersion, updates, event, idempotencyKey, requestFingerprint } = input;

    return await prisma.$transaction(async (tx) => {
      if (idempotencyKey && requestFingerprint) {
        const existingEvent = await tx.studentLearningSessionEvent.findFirst({
          where: {
            idempotencyKey,
            schoolId,
            tutorLearnerId,
          },
        });

        if (existingEvent) {
          if (existingEvent.requestFingerprint === requestFingerprint) {
            const session = await tx.studentLearningSessionState.findUnique({
              where: { id: sessionId },
            });
            if (session) {
              return {
                record: toSessionRecord(session),
                event: toEventRecord(existingEvent),
                success: true,
              };
            }
            return { record: null!, event: null!, success: false, conflict: 'idempotency' };
          } else {
            return { record: null!, event: null!, success: false, conflict: 'idempotency' };
          }
        }
      }

      const now = new Date();
      const data: Record<string, unknown> = {
        updatedAt: now,
        lastTransitionAt: now,
      };

      if (updates.status !== undefined) data.status = updates.status;
      if (updates.stage !== undefined) data.stage = updates.stage;
      if (updates.currentMode !== undefined) {
        data.currentMode = updates.currentMode;
        data.previousMode = updates.previousMode ?? undefined;
      }
      if (updates.previousMode !== undefined) data.previousMode = updates.previousMode;
      if (updates.subject !== undefined) data.subject = updates.subject;
      if (updates.topic !== undefined) data.topic = updates.topic;
      if (updates.skillTag !== undefined) data.skillTag = updates.skillTag;
      if (updates.objectiveId !== undefined) data.objectiveId = updates.objectiveId;
      if (updates.activeChallengeId !== undefined) data.activeChallengeId = updates.activeChallengeId;
      if (updates.activeRemediationPathId !== undefined) data.activeRemediationPathId = updates.activeRemediationPathId;
      if (updates.activeRevisionItemId !== undefined) data.activeRevisionItemId = updates.activeRevisionItemId;
      if (updates.supportLevel !== undefined) data.supportLevel = updates.supportLevel;
      if (updates.difficultyLevel !== undefined) data.difficultyLevel = updates.difficultyLevel;
      if (updates.safeProgressSummary !== undefined) data.safeProgressSummary = updates.safeProgressSummary;
      if (updates.safeEvidenceRefs !== undefined) data.safeEvidenceRefs = updates.safeEvidenceRefs;
      if (updates.reasonCodes !== undefined) data.reasonCodes = updates.reasonCodes;
      if (updates.privacyMetadata !== undefined) data.privacyMetadata = updates.privacyMetadata;
      if (updates.sourceTruthStatus !== undefined) data.sourceTruthStatus = updates.sourceTruthStatus;
      if (updates.confidenceBucket !== undefined) data.confidenceBucket = updates.confidenceBucket;

      if (updates.status && ['completed', 'abandoned', 'expired'].includes(updates.status)) {
        data.endedAt = now;
      }

      const updateResult = await tx.studentLearningSessionState.updateMany({
        where: {
          id: sessionId,
          schoolId,
          tutorLearnerId,
          stateVersion: expectedVersion,
        },
        data: {
          ...data,
          stateVersion: expectedVersion + 1,
        },
      });

      if (updateResult.count === 0) {
        if (idempotencyKey && requestFingerprint) {
          const winner = await tx.studentLearningSessionEvent.findFirst({
            where: { idempotencyKey, schoolId, tutorLearnerId },
          });
          if (winner) {
            if (winner.requestFingerprint === requestFingerprint) {
              const session = await tx.studentLearningSessionState.findUnique({
                where: { id: sessionId },
              });
              if (session) {
                return {
                  record: toSessionRecord(session),
                  event: toEventRecord(winner),
                  success: true,
                };
              }
            } else {
              return { record: null!, event: null!, success: false, conflict: 'idempotency' };
            }
          }
        }
        const current = await tx.studentLearningSessionState.findFirst({
          where: { id: sessionId, schoolId, tutorLearnerId },
        });
        if (!current) {
          return { record: null!, event: null!, success: false, conflict: 'version' };
        }
        return { record: toSessionRecord(current), event: null!, success: false, conflict: 'version' };
      }

      const updated = await tx.studentLearningSessionState.findUnique({
        where: { id: sessionId },
      });

      const newVersion = expectedVersion + 1;
      let eventRow;
      try {
        eventRow = await tx.studentLearningSessionEvent.create({
          data: {
            schoolId,
            tutorLearnerId,
            sessionId,
            studentId: event.studentId || null,
            eventType: event.eventType,
            transitionType: event.transitionType || null,
            previousStatus: event.previousStatus || null,
            resultingStatus: event.resultingStatus || null,
            previousMode: event.previousMode || null,
            nextMode: event.nextMode || null,
            subject: event.subject || null,
            topic: event.topic || null,
            skillTag: event.skillTag || null,
            safeEventSummary: event.safeEventSummary || null,
            safeEvidenceRefs: event.safeEvidenceRefs || [],
            reasonCodes: event.reasonCodes || [],
            privacyMetadata: (event.privacyMetadata || {}) as any,
            operationVersion: newVersion,
            idempotencyKey: idempotencyKey || null,
            requestFingerprint: requestFingerprint || null,
            requestId: event.requestId || null,
            correlationId: event.correlationId || null,
          },
        });
      } catch (err: unknown) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const winner = await tx.studentLearningSessionEvent.findFirst({
            where: { idempotencyKey, schoolId, tutorLearnerId },
          });
          if (winner) {
            if (winner.requestFingerprint === requestFingerprint) {
              const session = await tx.studentLearningSessionState.findUnique({
                where: { id: sessionId },
              });
              if (session) {
                return {
                  record: toSessionRecord(session),
                  event: toEventRecord(winner),
                  success: true,
                };
              }
            } else {
              return { record: null!, event: null!, success: false, conflict: 'idempotency' };
            }
          }
          return { record: null!, event: null!, success: false, conflict: 'idempotency' };
        }
        throw err;
      }

      return {
        record: toSessionRecord(updated!),
        event: toEventRecord(eventRow),
        success: true,
      };
    });
  }
}

export const studentLearningSessionRepository = new StudentLearningSessionRepository();