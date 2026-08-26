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
  requestId?: string;
  correlationId?: string;
}

export interface IdempotencyCheckResult {
  exists: boolean;
  event?: StudentLearningSessionEvent;
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
        requestId: input.requestId || null,
        correlationId: input.correlationId || null,
      },
    });
    return toEventRecord(row);
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
  ): Promise<IdempotencyCheckResult> {
    const row = await prisma.studentLearningSessionEvent.findFirst({
      where: {
        idempotencyKey,
        schoolId,
      },
    });
    return row ? { exists: true, event: toEventRecord(row) } : { exists: false };
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
}

export const studentLearningSessionRepository = new StudentLearningSessionRepository();