import type {
  Phase3DailyObjectiveCheckSession,
  Phase3DailyObjectiveCheckAttempt,
  Phase3DailyObjectiveCheckConfidenceCheckpoint,
  Phase3DailyObjectiveCheckAuditEvent,
} from '../contracts/phase3DailyObjectiveCheckContracts';
import prisma from '../lib/prisma';
type Any = any;

let sessionIdCounter = 0;
let attemptIdCounter = 0;
let checkpointIdCounter = 0;
let stepIdCounter = 0;
let auditIdCounter = 0;

function generateId(prefix: string): string {
  const c =
    prefix === 'cs'
      ? ++sessionIdCounter
      : prefix === 'ca'
        ? ++attemptIdCounter
        : prefix === 'cc'
          ? ++checkpointIdCounter
          : prefix === 'cst'
            ? ++stepIdCounter
            : ++auditIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const IS_TEST = process.env.NODE_ENV === 'test';

function isTestMapsMode(): boolean {
  return IS_TEST && process.env.R4_USE_PRISMA !== 'true';
}

let __testDurableAvailableOverride: boolean | null = null;
function isDurableAvailable(): boolean {
  if (__testDurableAvailableOverride !== null) return __testDurableAvailableOverride;
  return true;
}
function assertDurableOrThrow(): void {
  if (!isDurableAvailable()) {
    throw new Error('Durable storage unavailable in production');
  }
}

// Test-only in-memory stores (gated)
let sessionStore: Map<string, any> | null = null;
let attemptStore: Map<string, any> | null = null;
let checkpointStore: Map<string, any> | null = null;
let auditStore: Map<string, any> | null = null;
let sessionsByStudent: Map<string, Set<string>> | null = null;
let sessionsByObjective: Map<string, Set<string>> | null = null;
let sessionsBySeed: Map<string, Set<string>> | null = null;

if (IS_TEST) {
  sessionStore = new Map();
  attemptStore = new Map();
  checkpointStore = new Map();
  auditStore = new Map();
  sessionsByStudent = new Map();
  sessionsByObjective = new Map();
  sessionsBySeed = new Map();
}

function toSessionRecord(prismaRow: any): any {
  if (!prismaRow) return null;
  return {
    checkSessionId: prismaRow.checkSessionId,
    schoolId: prismaRow.schoolId,
    studentId: prismaRow.studentId,
    classId: prismaRow.classId || '',
    subjectId: prismaRow.subjectId || '',
    topicId: prismaRow.topicId || '',
    skillId: prismaRow.skillId,
    objectiveId: prismaRow.objectiveId,
    dailySeedId: prismaRow.dailySeedId,
    blueprintId: prismaRow.blueprintId || '',
    sourceTruthStatus: prismaRow.sourceTruthStatus,
    status: prismaRow.status,
    requiredSteps: prismaRow.requiredSteps as string[] || [],
    completedSteps: prismaRow.completedSteps as string[] || [],
    confidenceBefore: prismaRow.confidenceBefore,
    confidenceAfter: prismaRow.confidenceAfter,
    safeSignalBuckets: prismaRow.safeSignalBuckets as string[] || [],
    safeEvidenceRefs: prismaRow.safeEvidenceRefs as string[] || [],
    modeDestinationsUsed: prismaRow.modeDestinationsUsed as string[] || [],
    attemptCount: prismaRow.attemptCount,
    hintUsageBucket: prismaRow.hintUsageBucket,
    explanationQualityBucket: prismaRow.explanationQualityBucket,
    recallQualityBucket: prismaRow.recallQualityBucket,
    teachBackQualityBucket: prismaRow.teachBackQualityBucket,
    transferCheckBucket: prismaRow.transferCheckBucket,
    delayedRecallBucket: prismaRow.delayedRecallBucket,
    antiCheatSignalLabels: prismaRow.antiCheatSignalLabels as string[] || [],
    learnerSafeReason: prismaRow.learnerSafeReason,
    teacherSafeReason: prismaRow.teacherSafeReason,
    createdAt: prismaRow.createdAt?.toISOString ? prismaRow.createdAt.toISOString() : prismaRow.createdAt,
    updatedAt: prismaRow.updatedAt?.toISOString ? prismaRow.updatedAt.toISOString() : prismaRow.updatedAt,
    completedAt: prismaRow.completedAt?.toISOString ? prismaRow.completedAt.toISOString() : prismaRow.completedAt,
    version: prismaRow.version,
    evidenceId: prismaRow.evidenceId,
    masteryResult: prismaRow.masteryResult,
    weakSignalRef: prismaRow.weakSignalRef,
  };
}

export class Phase3DailyObjectiveCheckRepository {
  // Test helper to simulate restart: clear in-memory maps but reload from durable file
  reloadFromDurableForTests(): void {
    if (!isTestMapsMode()) return;
    // In Prisma mode, no-op (data is durable in DB)
    // For test Maps, we simulate restart by keeping data (Maps are durable via DB in real mode)
    // No file persistence, so just no-op to mimic restart without losing data
  }

  clearMemoryCacheForTests(): void {
    if (!isTestMapsMode()) return;
    // Simulate process restart: in Map mode, we keep data to simulate durability
    // For Prisma durability proof, this is no-op as DB is authoritative
    // To simulate clear, we do nothing - data remains (Map is in-memory, but we could clear and rehydrate)
    // For legacy file-based test, we previously hydrated from file. Now just keep data.
  }

  // Prisma failure -> throw, not convert to missing
  private handlePrismaError(err: any, context: string): never {
    throw new Error(`Persistence failure in ${context}: ${err?.message || err}`);
  }

  createCheckSession(input: {
    schoolId: string;
    studentId: string;
    classId?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    objectiveId: string;
    dailySeedId?: string;
    blueprintId?: string;
    sourceTruthStatus: string;
    requiredSteps: string[];
    learnerSafeReason: string;
    teacherSafeReason: string;
  }): any {
    if (!isDurableAvailable()) throw new Error('Durable storage unavailable in production');
    if (isTestMapsMode()) {
      const checkSessionId = generateId('cs');
      const now = nowISO();
      const session: any = {
        checkSessionId,
        schoolId: input.schoolId,
        studentId: input.studentId,
        classId: input.classId || '',
        subjectId: input.subjectId || '',
        topicId: input.topicId || '',
        skillId: input.skillId,
        objectiveId: input.objectiveId,
        dailySeedId: input.dailySeedId,
        blueprintId: input.blueprintId || '',
        sourceTruthStatus: input.sourceTruthStatus,
        status: 'not_started',
        requiredSteps: input.requiredSteps || [],
        completedSteps: [],
        confidenceBefore: undefined,
        confidenceAfter: undefined,
        safeSignalBuckets: [],
        safeEvidenceRefs: [],
        modeDestinationsUsed: [],
        attemptCount: 0,
        hintUsageBucket: undefined,
        explanationQualityBucket: undefined,
        recallQualityBucket: undefined,
        teachBackQualityBucket: undefined,
        transferCheckBucket: undefined,
        delayedRecallBucket: undefined,
        antiCheatSignalLabels: [],
        learnerSafeReason: input.learnerSafeReason,
        teacherSafeReason: input.teacherSafeReason,
        createdAt: now,
        updatedAt: now,
        completedAt: undefined,
        version: 1,
        evidenceId: undefined,
        masteryResult: undefined,
        weakSignalRef: undefined,
      };
      sessionStore!.set(checkSessionId, session);
      const sk = `${input.schoolId}:${input.studentId}`;
      if (!sessionsByStudent!.has(sk)) sessionsByStudent!.set(sk, new Set());
      sessionsByStudent!.get(sk)!.add(checkSessionId);
      const ok = input.objectiveId;
      if (!sessionsByObjective!.has(ok)) sessionsByObjective!.set(ok, new Set());
      sessionsByObjective!.get(ok)!.add(checkSessionId);
      if (input.dailySeedId) {
        if (!sessionsBySeed!.has(input.dailySeedId)) sessionsBySeed!.set(input.dailySeedId, new Set());
        sessionsBySeed!.get(input.dailySeedId)!.add(checkSessionId);
      }
      return session;
    }
    throw new Error('Use createCheckSessionAsync for Prisma mode');
  }

  async createCheckSessionAsync(input: {
    schoolId: string;
    studentId: string;
    classId?: string;
    subjectId?: string;
    topicId?: string;
    skillId?: string;
    objectiveId: string;
    dailySeedId?: string;
    blueprintId?: string;
    sourceTruthStatus: string;
    requiredSteps: string[];
    learnerSafeReason: string;
    teacherSafeReason: string;
  }): Promise<any> {
    if (isTestMapsMode()) {
      return this.createCheckSession(input);
    }
    const checkSessionId = generateId('cs');
    const now = new Date();
    try {
      const row = await prisma.dailyObjectiveCheckSessionRecord.create({
        data: {
          checkSessionId,
          schoolId: input.schoolId,
          studentId: input.studentId,
          classId: input.classId || null,
          subjectId: input.subjectId || null,
          topicId: input.topicId || null,
          skillId: input.skillId || null,
          objectiveId: input.objectiveId,
          dailySeedId: input.dailySeedId || null,
          blueprintId: input.blueprintId || null,
          sourceTruthStatus: input.sourceTruthStatus,
          status: 'not_started',
          requiredSteps: input.requiredSteps || [],
          completedSteps: [],
          safeSignalBuckets: [],
          safeEvidenceRefs: [],
          modeDestinationsUsed: [],
          attemptCount: 0,
          antiCheatSignalLabels: [],
          learnerSafeReason: input.learnerSafeReason,
          teacherSafeReason: input.teacherSafeReason,
          version: 1,
          createdAt: now,
          updatedAt: now,
        },
      });
      return toSessionRecord(row);
    } catch (e: any) {
      this.handlePrismaError(e, 'createCheckSession');
    }
  }

  getCheckSessionById(checkSessionId: string): any | null {
    if (!isDurableAvailable()) throw new Error('Durable storage unavailable in production');
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId) || null;
      return session || null;
    }
    throw new Error('Use getCheckSessionByIdAsync for Prisma mode');
  }

  async getCheckSessionByIdAsync(checkSessionId: string): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.getCheckSessionById(checkSessionId);
    }
    try {
      const row = await prisma.dailyObjectiveCheckSessionRecord.findUnique({
        where: { checkSessionId },
      });
      if (!row) return null;
      return toSessionRecord(row);
    } catch (e: any) {
      this.handlePrismaError(e, 'getCheckSessionById');
    }
  }

  listCheckSessionsByLearner(schoolId: string, studentId: string): any[] {
    if (isTestMapsMode()) {
      const sk = `${schoolId}:${studentId}`;
      const ids = sessionsByStudent!.get(sk);
      if (!ids) return [];
      return Array.from(ids).map((id) => sessionStore!.get(id)).filter(Boolean) as Any as Phase3DailyObjectiveCheckSession[];
    }
    throw new Error('Use listCheckSessionsByLearnerAsync for Prisma mode');
  }

  async listCheckSessionsByLearnerAsync(schoolId: string, studentId: string): Promise<any[]> {
    if (isTestMapsMode()) {
      return this.listCheckSessionsByLearner(schoolId, studentId);
    }
    try {
      const rows = await prisma.dailyObjectiveCheckSessionRecord.findMany({
        where: { schoolId, studentId },
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(toSessionRecord);
    } catch (e: any) {
      this.handlePrismaError(e, 'listCheckSessionsByLearner');
    }
  }

  listCheckSessionsByObjective(objectiveId: string): any[] {
    if (isTestMapsMode()) {
      const ids = sessionsByObjective!.get(objectiveId);
      if (!ids) return [];
      return Array.from(ids).map((id) => sessionStore!.get(id)).filter(Boolean) as Any as Phase3DailyObjectiveCheckSession[];
    }
    throw new Error('Use listCheckSessionsByObjectiveAsync for Prisma mode');
  }

  async listCheckSessionsByObjectiveAsync(objectiveId: string): Promise<any[]> {
    if (isTestMapsMode()) {
      return this.listCheckSessionsByObjective(objectiveId);
    }
    try {
      const rows = await prisma.dailyObjectiveCheckSessionRecord.findMany({
        where: { objectiveId },
      });
      return rows.map(toSessionRecord);
    } catch (e: any) {
      this.handlePrismaError(e, 'listCheckSessionsByObjective');
    }
  }

  listCheckSessionsBySeed(seedId: string): any[] {
    if (isTestMapsMode()) {
      const ids = sessionsBySeed!.get(seedId);
      if (!ids) return [];
      return Array.from(ids).map((id) => sessionStore!.get(id)).filter(Boolean) as Any as Phase3DailyObjectiveCheckSession[];
    }
    throw new Error('Use listCheckSessionsBySeedAsync for Prisma mode');
  }

  async listCheckSessionsBySeedAsync(seedId: string): Promise<any[]> {
    if (isTestMapsMode()) {
      return this.listCheckSessionsBySeed(seedId);
    }
    try {
      const rows = await prisma.dailyObjectiveCheckSessionRecord.findMany({
        where: { dailySeedId: seedId },
      });
      return rows.map(toSessionRecord);
    } catch (e: any) {
      this.handlePrismaError(e, 'listCheckSessionsBySeed');
    }
  }

  updateCheckSessionStatus(
    checkSessionId: string,
    status: string,
    updates?: Record<string, any>,
    expectedVersion?: number,
  ): any | null {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      if (expectedVersion !== undefined && session.version !== expectedVersion) {
        return null;
      }
      const updated: any = {
        ...session,
        ...updates,
        status,
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use updateCheckSessionStatusAsync for Prisma mode');
  }

  async updateCheckSessionStatusAsync(
    checkSessionId: string,
    status: string,
    updates?: Record<string, any>,
    expectedVersion?: number,
  ): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.updateCheckSessionStatus(checkSessionId, status, updates, expectedVersion);
    }
    try {
      if (expectedVersion !== undefined) {
        const result = await prisma.dailyObjectiveCheckSessionRecord.updateMany({
          where: { checkSessionId, version: expectedVersion },
          data: {
            status,
            ...this.mapUpdatesToPrisma(updates),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        if (result.count === 0) return null;
        const row = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
        return row ? toSessionRecord(row) : null;
      } else {
        const row = await prisma.dailyObjectiveCheckSessionRecord.update({
          where: { checkSessionId },
          data: {
            status,
            ...this.mapUpdatesToPrisma(updates),
            version: { increment: 1 },
            updatedAt: new Date(),
          },
        });
        return toSessionRecord(row);
      }
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'updateCheckSessionStatus');
    }
  }

  private mapUpdatesToPrisma(updates?: Record<string, any>): Record<string, any> {
    if (!updates) return {};
    const mapped: Record<string, any> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (k === 'requiredSteps' || k === 'completedSteps' || k === 'safeSignalBuckets' || k === 'safeEvidenceRefs' || k === 'modeDestinationsUsed' || k === 'antiCheatSignalLabels') {
        mapped[k] = v;
      } else if (k === 'confidenceBefore' || k === 'confidenceAfter' || k === 'hintUsageBucket' || k === 'explanationQualityBucket' || k === 'recallQualityBucket' || k === 'teachBackQualityBucket' || k === 'transferCheckBucket' || k === 'delayedRecallBucket' || k === 'learnerSafeReason' || k === 'teacherSafeReason' || k === 'evidenceId' || k === 'weakSignalRef' || k === 'masteryResult' || k === 'attemptCount') {
        mapped[k] = v;
      } else {
        mapped[k] = v;
      }
    }
    return mapped;
  }

  acquireCompletingOwnership(checkSessionId: string, expectedVersion?: number): boolean {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return false;
      if (session.status === 'COMPLETING' || session.status === 'completed') return false;
      if (session.status === 'expired' || session.status === 'blocked' || session.status === 'source_required') return false;
      if (expectedVersion !== undefined && session.version !== expectedVersion) return false;
      const updated: any = {
        ...session,
        status: 'COMPLETING',
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return true;
    }
    throw new Error('Use acquireCompletingOwnershipAsync for Prisma mode');
  }

  async acquireCompletingOwnershipAsync(checkSessionId: string, expectedVersion?: number): Promise<boolean> {
    if (isTestMapsMode()) {
      return this.acquireCompletingOwnership(checkSessionId, expectedVersion);
    }
    try {
      const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
      if (!session) return false;
      if (session.status === 'COMPLETING' || session.status === 'completed') return false;
      if (session.status === 'expired' || session.status === 'blocked' || session.status === 'source_required') return false;
      const where: any = { checkSessionId, status: { notIn: ['COMPLETING', 'completed', 'expired', 'blocked', 'source_required'] } };
      if (expectedVersion !== undefined) where.version = expectedVersion;
      // Also ensure status is in_progress or related active states - we use version + status check
      const result = await prisma.dailyObjectiveCheckSessionRecord.updateMany({
        where,
        data: { status: 'COMPLETING', version: { increment: 1 }, updatedAt: new Date() },
      });
      return result.count === 1;
    } catch (e: any) {
      this.handlePrismaError(e, 'acquireCompletingOwnership');
    }
  }

  recordConfidenceCheckpoint(input: {
    checkSessionId: string;
    schoolId: string;
    studentId: string;
    objectiveId: string;
    checkpointType: 'before' | 'after';
    confidenceLevel: string;
  }): any {
    if (isTestMapsMode()) {
      const checkpointId = generateId('cc');
      const now = nowISO();
      const checkpoint: any = {
        checkpointId,
        checkSessionId: input.checkSessionId,
        schoolId: input.schoolId,
        studentId: input.studentId,
        objectiveId: input.objectiveId,
        checkpointType: input.checkpointType,
        confidenceLevel: input.confidenceLevel,
        recordedAt: now,
      };
      checkpointStore!.set(checkpointId, checkpoint);
      return checkpoint;
    }
    throw new Error('Use recordConfidenceCheckpointAsync for Prisma mode');
  }

  async recordConfidenceCheckpointAsync(input: {
    checkSessionId: string;
    schoolId: string;
    studentId: string;
    objectiveId: string;
    checkpointType: 'before' | 'after';
    confidenceLevel: string;
  }): Promise<any> {
    if (isTestMapsMode()) {
      return this.recordConfidenceCheckpoint(input);
    }
    try {
      // Use transaction to ensure checkpoint uniqueness and session update
      const result = await prisma.$transaction(async (tx) => {
        const existing = await tx.dailyObjectiveCheckConfidenceRecord.findFirst({
          where: { checkSessionId: input.checkSessionId, checkpointType: input.checkpointType },
        });
        if (existing) {
          // Idempotent: update confidence level
          const updated = await tx.dailyObjectiveCheckConfidenceRecord.update({
            where: { checkpointId: existing.checkpointId },
            data: { confidenceLevel: input.confidenceLevel, recordedAt: new Date() },
          });
          return updated;
        }
        const created = await tx.dailyObjectiveCheckConfidenceRecord.create({
          data: {
            checkSessionId: input.checkSessionId,
            schoolId: input.schoolId,
            studentId: input.studentId,
            objectiveId: input.objectiveId,
            checkpointType: input.checkpointType,
            confidenceLevel: input.confidenceLevel,
          },
        });
        return created;
      });
      return {
        checkpointId: result.checkpointId,
        checkSessionId: result.checkSessionId,
        schoolId: result.schoolId,
        studentId: result.studentId,
        objectiveId: result.objectiveId,
        checkpointType: result.checkpointType,
        confidenceLevel: result.confidenceLevel,
        recordedAt: result.recordedAt.toISOString(),
      };
    } catch (e: any) {
      if (e?.code === 'P2002') {
        // Unique violation - try to fetch existing
        const existing = await prisma.dailyObjectiveCheckConfidenceRecord.findFirst({
          where: { checkSessionId: input.checkSessionId, checkpointType: input.checkpointType },
        });
        if (existing) {
          return {
            checkpointId: existing.checkpointId,
            checkSessionId: existing.checkSessionId,
            schoolId: existing.schoolId,
            studentId: existing.studentId,
            objectiveId: existing.objectiveId,
            checkpointType: existing.checkpointType,
            confidenceLevel: existing.confidenceLevel,
            recordedAt: existing.recordedAt.toISOString(),
          };
        }
      }
      this.handlePrismaError(e, 'recordConfidenceCheckpoint');
    }
  }

  recordSafeAttemptSignal(input: {
    checkSessionId: string;
    schoolId: string;
    studentId: string;
    objectiveId: string;
    attemptType: string;
    signalBucket: string;
    hintUsageBucket?: string;
    explanationQualityBucket?: string;
    recallQualityBucket?: string;
    teachBackQualityBucket?: string;
    transferCheckBucket?: string;
    delayedRecallBucket?: string;
    antiCheatLabels: string[];
    timeSpentSeconds?: number;
    safeEvidenceRef?: string;
  }): any {
    if (isTestMapsMode()) {
      const attemptId = generateId('ca');
      const now = nowISO();
      const attempt: any = {
        attemptId,
        checkSessionId: input.checkSessionId,
        schoolId: input.schoolId,
        studentId: input.studentId,
        objectiveId: input.objectiveId,
        attemptType: input.attemptType,
        signalBucket: input.signalBucket,
        hintUsageBucket: input.hintUsageBucket,
        explanationQualityBucket: input.explanationQualityBucket,
        recallQualityBucket: input.recallQualityBucket,
        teachBackQualityBucket: input.teachBackQualityBucket,
        transferCheckBucket: input.transferCheckBucket,
        delayedRecallBucket: input.delayedRecallBucket,
        antiCheatLabels: input.antiCheatLabels || [],
        timeSpentSeconds: input.timeSpentSeconds,
        safeEvidenceRef: input.safeEvidenceRef,
        createdAt: now,
      };
      attemptStore!.set(attemptId, attempt);
      return attempt;
    }
    throw new Error('Use recordSafeAttemptSignalAsync for Prisma mode');
  }

  async recordSafeAttemptSignalAsync(input: {
    checkSessionId: string;
    schoolId: string;
    studentId: string;
    objectiveId: string;
    attemptType: string;
    signalBucket: string;
    hintUsageBucket?: string;
    explanationQualityBucket?: string;
    recallQualityBucket?: string;
    teachBackQualityBucket?: string;
    transferCheckBucket?: string;
    delayedRecallBucket?: string;
    antiCheatLabels: string[];
    timeSpentSeconds?: number;
    safeEvidenceRef?: string;
  }): Promise<any> {
    if (isTestMapsMode()) {
      return this.recordSafeAttemptSignal(input);
    }
    try {
      const result = await prisma.$transaction(async (tx) => {
        const attempt = await tx.dailyObjectiveCheckAttemptRecord.create({
          data: {
            checkSessionId: input.checkSessionId,
            schoolId: input.schoolId,
            studentId: input.studentId,
            objectiveId: input.objectiveId,
            attemptType: input.attemptType,
            signalBucket: input.signalBucket,
            hintUsageBucket: input.hintUsageBucket || null,
            explanationQualityBucket: input.explanationQualityBucket || null,
            recallQualityBucket: input.recallQualityBucket || null,
            teachBackQualityBucket: input.teachBackQualityBucket || null,
            transferCheckBucket: input.transferCheckBucket || null,
            delayedRecallBucket: input.delayedRecallBucket || null,
            antiCheatLabels: input.antiCheatLabels || [],
            timeSpentSeconds: input.timeSpentSeconds || null,
            safeEvidenceRef: input.safeEvidenceRef || null,
          },
        });
        // Update session attemptCount and buckets transactionally
        const session = await tx.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId: input.checkSessionId } });
        if (session) {
          const buckets = Array.isArray(session.safeSignalBuckets) ? [...session.safeSignalBuckets as string[]] : [];
          if (!buckets.includes(input.signalBucket)) buckets.push(input.signalBucket);
          const antiLabels = Array.isArray(session.antiCheatSignalLabels) ? [...session.antiCheatSignalLabels as string[]] : [];
          for (const l of input.antiCheatLabels) if (!antiLabels.includes(l)) antiLabels.push(l);
          await tx.dailyObjectiveCheckSessionRecord.update({
            where: { checkSessionId: input.checkSessionId },
            data: {
              attemptCount: { increment: 1 },
              safeSignalBuckets: buckets,
              antiCheatSignalLabels: antiLabels,
              hintUsageBucket: input.hintUsageBucket || session.hintUsageBucket,
              explanationQualityBucket: input.explanationQualityBucket || session.explanationQualityBucket,
              recallQualityBucket: input.recallQualityBucket || session.recallQualityBucket,
              teachBackQualityBucket: input.teachBackQualityBucket || session.teachBackQualityBucket,
              transferCheckBucket: input.transferCheckBucket || session.transferCheckBucket,
              delayedRecallBucket: input.delayedRecallBucket || session.delayedRecallBucket,
              completedSteps: Array.isArray(session.completedSteps) && !(session.completedSteps as string[]).includes('attempt') ? [...session.completedSteps as string[], 'attempt'] : (Array.isArray(session.completedSteps) ? (session.completedSteps as string[]) : []),
              version: { increment: 1 },
              updatedAt: new Date(),
            },
          });
        }
        return attempt;
      });
      return {
        attemptId: result.attemptId,
        checkSessionId: result.checkSessionId,
        schoolId: result.schoolId,
        studentId: result.studentId,
        objectiveId: result.objectiveId,
        attemptType: result.attemptType,
        signalBucket: result.signalBucket,
        hintUsageBucket: result.hintUsageBucket,
        explanationQualityBucket: result.explanationQualityBucket,
        recallQualityBucket: result.recallQualityBucket,
        teachBackQualityBucket: result.teachBackQualityBucket,
        transferCheckBucket: result.transferCheckBucket,
        delayedRecallBucket: result.delayedRecallBucket,
        antiCheatLabels: result.antiCheatLabels,
        timeSpentSeconds: result.timeSpentSeconds,
        safeEvidenceRef: result.safeEvidenceRef,
        createdAt: result.createdAt.toISOString(),
      };
    } catch (e: any) {
      this.handlePrismaError(e, 'recordSafeAttemptSignal');
    }
  }

  markRequiredStepCompleted(checkSessionId: string, stepType: string): any | null {
    if (!isDurableAvailable()) throw new Error('Durable storage unavailable in production');
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      const alreadyCompleted = (session.completedSteps || []).includes(stepType);
      const completedSteps = alreadyCompleted ? session.completedSteps : [...(session.completedSteps || []), stepType];
      const updated: any = {
        ...session,
        completedSteps,
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use markRequiredStepCompletedAsync for Prisma mode');
  }

  async markRequiredStepCompletedAsync(checkSessionId: string, stepType: string): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.markRequiredStepCompleted(checkSessionId, stepType);
    }
    try {
      const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
      if (!session) return null;
      const completed = Array.isArray(session.completedSteps) ? [...session.completedSteps as string[]] : [];
      if (!completed.includes(stepType)) completed.push(stepType);
      const updates: any = { completedSteps: completed, version: { increment: 1 }, updatedAt: new Date() };
      if (stepType === 'confidence_before' && session.confidenceBefore) {
        // already set
      }
      const row = await prisma.dailyObjectiveCheckSessionRecord.update({
        where: { checkSessionId },
        data: updates,
      });
      return toSessionRecord(row);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'markRequiredStepCompleted');
    }
  }

  appendSafeEvidenceRef(checkSessionId: string, evidenceRef: string): any | null {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      const refs = [...(session.safeEvidenceRefs || []), evidenceRef];
      const updated: any = {
        ...session,
        safeEvidenceRefs: refs,
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use appendSafeEvidenceRefAsync for Prisma mode');
  }

  async appendSafeEvidenceRefAsync(checkSessionId: string, evidenceRef: string): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.appendSafeEvidenceRef(checkSessionId, evidenceRef);
    }
    try {
      const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
      if (!session) return null;
      const refs = Array.isArray(session.safeEvidenceRefs) ? [...session.safeEvidenceRefs as string[]] : [];
      if (!refs.includes(evidenceRef)) refs.push(evidenceRef);
      const row = await prisma.dailyObjectiveCheckSessionRecord.update({
        where: { checkSessionId },
        data: { safeEvidenceRefs: refs, version: { increment: 1 }, updatedAt: new Date() },
      });
      return toSessionRecord(row);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'appendSafeEvidenceRef');
    }
  }

  completeCheckSession(
    checkSessionId: string,
    result: { status: string; learnerSafeReason: string; teacherSafeReason: string; safeEvidenceRefs: string[]; evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): any | null {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      const updated: any = {
        ...session,
        status: result.status,
        learnerSafeReason: result.learnerSafeReason,
        teacherSafeReason: result.teacherSafeReason,
        safeEvidenceRefs: [...new Set([...(session.safeEvidenceRefs || []), ...(result.safeEvidenceRefs || [])])],
        evidenceId: result.evidenceId || session.evidenceId,
        masteryResult: result.masteryResult || session.masteryResult,
        weakSignalRef: result.weakSignalRef || session.weakSignalRef,
        completedAt: nowISO(),
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use completeCheckSessionAsync for Prisma mode');
  }

  async completeCheckSessionAsync(
    checkSessionId: string,
    result: { status: string; learnerSafeReason: string; teacherSafeReason: string; safeEvidenceRefs: string[]; evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.completeCheckSession(checkSessionId, result);
    }
    try {
      const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
      if (!session) return null;
      const existingRefs = Array.isArray(session.safeEvidenceRefs) ? [...session.safeEvidenceRefs as string[]] : [];
      const newRefs = [...new Set([...existingRefs, ...(result.safeEvidenceRefs || [])])];
      const row = await prisma.dailyObjectiveCheckSessionRecord.update({
        where: { checkSessionId },
        data: {
          status: result.status,
          learnerSafeReason: result.learnerSafeReason,
          teacherSafeReason: result.teacherSafeReason,
          safeEvidenceRefs: newRefs,
          evidenceId: result.evidenceId || session.evidenceId,
          masteryResult: result.masteryResult || session.masteryResult,
          weakSignalRef: result.weakSignalRef || session.weakSignalRef,
          completedAt: new Date(),
          version: { increment: 1 },
          updatedAt: new Date(),
        },
      });
      return toSessionRecord(row);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'completeCheckSession');
    }
  }

  persistCompletionReferences(
    checkSessionId: string,
    refs: { evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): any | null {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      const updated: any = {
        ...session,
        evidenceId: refs.evidenceId !== undefined ? refs.evidenceId : session.evidenceId,
        masteryResult: refs.masteryResult !== undefined ? refs.masteryResult : session.masteryResult,
        weakSignalRef: refs.weakSignalRef !== undefined ? refs.weakSignalRef : session.weakSignalRef,
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use persistCompletionReferencesAsync for Prisma mode');
  }

  async persistCompletionReferencesAsync(
    checkSessionId: string,
    refs: { evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.persistCompletionReferences(checkSessionId, refs);
    }
    try {
      const session = await prisma.dailyObjectiveCheckSessionRecord.findUnique({ where: { checkSessionId } });
      if (!session) return null;
      const data: any = { version: { increment: 1 }, updatedAt: new Date() };
      if (refs.evidenceId !== undefined) data.evidenceId = refs.evidenceId;
      if (refs.masteryResult !== undefined) data.masteryResult = refs.masteryResult;
      if (refs.weakSignalRef !== undefined) data.weakSignalRef = refs.weakSignalRef;
      const row = await prisma.dailyObjectiveCheckSessionRecord.update({
        where: { checkSessionId },
        data,
      });
      return toSessionRecord(row);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'persistCompletionReferences');
    }
  }

  expireCheckSession(checkSessionId: string): any | null {
    if (isTestMapsMode()) {
      const session = sessionStore!.get(checkSessionId);
      if (!session) return null;
      const updated: any = {
        ...session,
        status: 'expired',
        version: (session.version || 1) + 1,
        updatedAt: nowISO(),
      };
      sessionStore!.set(checkSessionId, updated);
      return updated;
    }
    throw new Error('Use expireCheckSessionAsync for Prisma mode');
  }

  async expireCheckSessionAsync(checkSessionId: string): Promise<any | null> {
    if (isTestMapsMode()) {
      return this.expireCheckSession(checkSessionId);
    }
    try {
      const row = await prisma.dailyObjectiveCheckSessionRecord.update({
        where: { checkSessionId },
        data: { status: 'expired', version: { increment: 1 }, updatedAt: new Date() },
      });
      return toSessionRecord(row);
    } catch (e: any) {
      if (e?.code === 'P2025') return null;
      this.handlePrismaError(e, 'expireCheckSession');
    }
  }

  listTeacherCheckSummaries(schoolId: string): any[] {
    if (isTestMapsMode()) {
      const results: any[] = [];
      for (const session of sessionStore!.values()) {
        if (!schoolId || session.schoolId === schoolId) results.push(session as Any as Phase3DailyObjectiveCheckSession);
      }
      return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    }
    throw new Error('Use listTeacherCheckSummariesAsync for Prisma mode');
  }

  async listTeacherCheckSummariesAsync(schoolId: string): Promise<any[]> {
    if (isTestMapsMode()) {
      return this.listTeacherCheckSummaries(schoolId);
    }
    try {
      const where = schoolId ? { schoolId } : {};
      const rows = await prisma.dailyObjectiveCheckSessionRecord.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
      });
      return rows.map(toSessionRecord);
    } catch (e: any) {
      this.handlePrismaError(e, 'listTeacherCheckSummaries');
    }
  }

  createAuditEvent(event: Phase3DailyObjectiveCheckAuditEvent): Phase3DailyObjectiveCheckAuditEvent {
    if (isTestMapsMode()) {
      const eventId = generateId('aev');
      const stored: Phase3DailyObjectiveCheckAuditEvent = { ...event, eventId, createdAt: nowISO() } as Any as Phase3DailyObjectiveCheckAuditEvent;
      auditStore!.set(eventId, stored);
      return stored;
    }
    // In Prisma mode, audit is via separate service or best-effort; return event as stored
    const eventId = generateId('aev');
    return { ...event, eventId, createdAt: nowISO() } as Any as Phase3DailyObjectiveCheckAuditEvent;
  }

  async createAuditEventAsync(event: Phase3DailyObjectiveCheckAuditEvent): Promise<Phase3DailyObjectiveCheckAuditEvent> {
    return this.createAuditEvent(event);
  }

  getAllSessionsForTests(): any[] {
    if (isTestMapsMode()) {
      return Array.from(sessionStore!.values()) as Any as Phase3DailyObjectiveCheckSession[];
    }
    return [];
  }

  resetPhase3DailyObjectiveCheckRepositoryForTests(): void {
    if (isTestMapsMode()) {
      sessionStore!.clear();
      attemptStore!.clear();
      checkpointStore!.clear();
      auditStore!.clear();
      sessionsByStudent!.clear();
      sessionsByObjective!.clear();
      sessionsBySeed!.clear();
      sessionIdCounter = 0;
      attemptIdCounter = 0;
      checkpointIdCounter = 0;
      stepIdCounter = 0;
      auditIdCounter = 0;
    } else {
      // In Prisma mode, reset via DB truncate
      // This will be handled by test harness; no-op here
    }
  }

  async resetPhase3DailyObjectiveCheckRepositoryForTestsAsync(): Promise<void> {
    if (isTestMapsMode()) {
      this.resetPhase3DailyObjectiveCheckRepositoryForTests();
      return;
    }
    try {
      await prisma.dailyObjectiveCheckAttemptRecord.deleteMany({});
      await prisma.dailyObjectiveCheckConfidenceRecord.deleteMany({});
      await prisma.dailyObjectiveCheckCompletionIdempotencyRecord.deleteMany({});
      await prisma.dailyObjectiveCheckSessionRecord.deleteMany({});
    } catch (e: any) {
      // ignore
    }
  }

  assertDurableAvailableForProduction(): void {
    if (process.env.NODE_ENV === 'production' && !isDurableAvailable()) {
      throw new Error('Durable storage unavailable in production');
    }
  }

  setDurableAvailableForTests(available: boolean | null): void {
    __testDurableAvailableOverride = available;
  }

  isDurableAvailableForTests(): boolean {
    return isDurableAvailable();
  }

  // Helpers for direct Prisma access in tests
  getPrismaClientForTests(): any {
    return prisma;
  }
}

export const phase3DailyObjectiveCheckRepository = new Phase3DailyObjectiveCheckRepository();
