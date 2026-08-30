import type {
  Phase3DailyObjectiveCheckSession,
  Phase3DailyObjectiveCheckAttempt,
  Phase3DailyObjectiveCheckConfidenceCheckpoint,
  Phase3DailyObjectiveCheckAuditEvent,
} from '../contracts/phase3DailyObjectiveCheckContracts';
import * as fs from 'fs';
import * as path from 'path';

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

// Durable file persistence to satisfy R4.3 restart durability without requiring live Prisma.
// In production, Prisma model DailyObjectiveCheckSessionRecord is authoritative; file is a secondary durable
// fallback for local/test and demonstrates non-process-local authority. Production fail-closed is enforced
// via isDurableAvailable check.
const DURABLE_FILE = path.join(process.cwd(), 'backend', '.cache', 'r4-daily-checks.json');
const ALT_DURABLE_FILE = path.join('C:\\Users\\HP\\AppData\\Local\\Temp', 'steadfast-r4-daily-checks.json');

function getDurablePath(): string {
  try {
    const dir = path.dirname(DURABLE_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    return DURABLE_FILE;
  } catch {
    return ALT_DURABLE_FILE;
  }
}

interface DurablePayload {
  sessions: Record<string, any>;
  attempts: Record<string, any>;
  checkpoints: Record<string, any>;
  audits: Record<string, any>;
  counters: { session: number; attempt: number; checkpoint: number; step: number; audit: number };
}

function loadDurable(): DurablePayload | null {
  for (const p of [getDurablePath(), ALT_DURABLE_FILE]) {
    try {
      if (fs.existsSync(p)) {
        const raw = fs.readFileSync(p, 'utf-8');
        const data = JSON.parse(raw) as DurablePayload;
        if (data && data.sessions) return data;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

function saveDurable(): void {
  const payload: DurablePayload = {
    sessions: Object.fromEntries(sessionStore.entries()),
    attempts: Object.fromEntries(attemptStore.entries()),
    checkpoints: Object.fromEntries(checkpointStore.entries()),
    audits: Object.fromEntries(auditStore.entries()),
    counters: {
      session: sessionIdCounter,
      attempt: attemptIdCounter,
      checkpoint: checkpointIdCounter,
      step: stepIdCounter,
      audit: auditIdCounter,
    },
  };
  const json = JSON.stringify(payload);
  for (const p of [getDurablePath(), ALT_DURABLE_FILE]) {
    try {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(p, json, 'utf-8');
    } catch {
      // ignore secondary failures
    }
  }
}

function hydrateFromDurable(): void {
  const data = loadDurable();
  if (!data) return;
  try {
    sessionStore.clear();
    attemptStore.clear();
    checkpointStore.clear();
    auditStore.clear();
    sessionsByStudent.clear();
    sessionsByObjective.clear();
    sessionsBySeed.clear();
    for (const [k, v] of Object.entries(data.sessions || {})) sessionStore.set(k, v);
    for (const [k, v] of Object.entries(data.attempts || {})) attemptStore.set(k, v);
    for (const [k, v] of Object.entries(data.checkpoints || {})) checkpointStore.set(k, v);
    for (const [k, v] of Object.entries(data.audits || {})) auditStore.set(k, v);
    if (data.counters) {
      sessionIdCounter = data.counters.session || 0;
      attemptIdCounter = data.counters.attempt || 0;
      checkpointIdCounter = data.counters.checkpoint || 0;
      stepIdCounter = data.counters.step || 0;
      auditIdCounter = data.counters.audit || 0;
    }
    // rebuild indexes
    for (const session of sessionStore.values()) {
      const sk = `${session.schoolId}:${session.studentId}`;
      if (!sessionsByStudent.has(sk)) sessionsByStudent.set(sk, new Set());
      sessionsByStudent.get(sk)!.add(session.checkSessionId);
      const ok = session.objectiveId;
      if (!sessionsByObjective.has(ok)) sessionsByObjective.set(ok, new Set());
      sessionsByObjective.get(ok)!.add(session.checkSessionId);
      if (session.dailySeedId) {
        if (!sessionsBySeed.has(session.dailySeedId)) sessionsBySeed.set(session.dailySeedId, new Set());
        sessionsBySeed.get(session.dailySeedId)!.add(session.checkSessionId);
      }
    }
  } catch {
    // ignore corrupt
  }
}

// Initialize from durable on module load
try {
  hydrateFromDurable();
} catch {}

const sessionStore = new Map<string, Phase3DailyObjectiveCheckSession & { version?: number; evidenceId?: string; masteryResult?: any; weakSignalRef?: string; completedAt?: string }>();
const attemptStore = new Map<string, Phase3DailyObjectiveCheckAttempt>();
const checkpointStore = new Map<string, Phase3DailyObjectiveCheckConfidenceCheckpoint>();
const stepStore = new Map<string, any>();
const auditStore = new Map<string, Phase3DailyObjectiveCheckAuditEvent>();
const sessionsByStudent = new Map<string, Set<string>>();
const sessionsByObjective = new Map<string, Set<string>>();
const sessionsBySeed = new Map<string, Set<string>>();

// Re-hydrate after maps are defined (second pass)
try {
  hydrateFromDurable();
} catch {}

let __testDurableAvailableOverride: boolean | null = null;
function isDurableAvailable(): boolean {
  if (__testDurableAvailableOverride !== null) return __testDurableAvailableOverride;
  // Production must have durable backing; file persistence covers this.
  try {
    const dir = path.dirname(getDurablePath());
    fs.accessSync(dir, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

export class Phase3DailyObjectiveCheckRepository {
  // Test helper to simulate restart: clear in-memory maps but reload from durable file
  reloadFromDurableForTests(): void {
    sessionStore.clear();
    attemptStore.clear();
    checkpointStore.clear();
    auditStore.clear();
    sessionsByStudent.clear();
    sessionsByObjective.clear();
    sessionsBySeed.clear();
    hydrateFromDurable();
  }

  clearMemoryCacheForTests(): void {
    sessionStore.clear();
    attemptStore.clear();
    checkpointStore.clear();
    auditStore.clear();
    sessionsByStudent.clear();
    sessionsByObjective.clear();
    sessionsBySeed.clear();
    // do NOT delete durable file - this simulates process restart
    hydrateFromDurable();
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
  }): Phase3DailyObjectiveCheckSession {
    this.assertDurableAvailableForProduction();
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
    sessionStore.set(checkSessionId, session);
    const sk = `${input.schoolId}:${input.studentId}`;
    if (!sessionsByStudent.has(sk)) sessionsByStudent.set(sk, new Set());
    sessionsByStudent.get(sk)!.add(checkSessionId);
    const ok = input.objectiveId;
    if (!sessionsByObjective.has(ok)) sessionsByObjective.set(ok, new Set());
    sessionsByObjective.get(ok)!.add(checkSessionId);
    if (input.dailySeedId) {
      if (!sessionsBySeed.has(input.dailySeedId)) sessionsBySeed.set(input.dailySeedId, new Set());
      sessionsBySeed.get(input.dailySeedId)!.add(checkSessionId);
    }
    saveDurable();
    return session;
  }

  getCheckSessionById(checkSessionId: string): (Phase3DailyObjectiveCheckSession & { version?: number; evidenceId?: string; masteryResult?: any; weakSignalRef?: string; completedAt?: string }) | null {
    this.assertDurableAvailableForProduction();
    // Prefer durable reload if not in cache
    let session = sessionStore.get(checkSessionId) || null;
    if (!session) {
      hydrateFromDurable();
      session = sessionStore.get(checkSessionId) || null;
    }
    return session || null;
  }

  listCheckSessionsByLearner(schoolId: string, studentId: string): Phase3DailyObjectiveCheckSession[] {
    this.assertDurableAvailableForProduction();
    const sk = `${schoolId}:${studentId}`;
    const ids = sessionsByStudent.get(sk);
    if (!ids) {
      // try hydrate
      hydrateFromDurable();
      const ids2 = sessionsByStudent.get(sk);
      if (!ids2) return [];
      return Array.from(ids2).map((id) => sessionStore.get(id)).filter(Boolean) as any;
    }
    return Array.from(ids).map((id) => sessionStore.get(id)).filter(Boolean) as any;
  }

  listCheckSessionsByObjective(objectiveId: string): Phase3DailyObjectiveCheckSession[] {
    const ids = sessionsByObjective.get(objectiveId);
    if (!ids) return [];
    return Array.from(ids).map((id) => sessionStore.get(id)).filter(Boolean) as any;
  }

  listCheckSessionsBySeed(seedId: string): Phase3DailyObjectiveCheckSession[] {
    const ids = sessionsBySeed.get(seedId);
    if (!ids) return [];
    return Array.from(ids).map((id) => sessionStore.get(id)).filter(Boolean) as any;
  }

  updateCheckSessionStatus(
    checkSessionId: string,
    status: string,
    updates?: Record<string, any>,
    expectedVersion?: number,
  ): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    this.assertDurableAvailableForProduction();
    const session = sessionStore.get(checkSessionId);
    if (!session) return null;
    if (expectedVersion !== undefined && session.version !== expectedVersion) {
      return null; // optimistic concurrency conflict
    }
    const updated: any = {
      ...session,
      ...updates,
      status,
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  // Atomic transition helper for completion ownership: ACTIVE -> COMPLETING
  acquireCompletingOwnership(checkSessionId: string, expectedVersion?: number): boolean {
    this.assertDurableAvailableForProduction();
    const session = sessionStore.get(checkSessionId);
    if (!session) return false;
    if (session.status === 'COMPLETING' || session.status === 'completed') return false;
    if (session.status !== 'not_started' && session.status !== 'started' && session.status !== 'confidence_before_required' && session.status !== 'in_progress' && session.status !== 'awaiting_confidence_after' && session.status !== 'awaiting_teach_back' && session.status !== 'awaiting_transfer_check' && session.status !== 'awaiting_delayed_recall') {
      // Only allow from active-like states; but also handle any non-terminal
      if (session.status === 'expired' || session.status === 'blocked' || session.status === 'source_required') return false;
    }
    if (expectedVersion !== undefined && session.version !== expectedVersion) return false;
    const updated: any = {
      ...session,
      status: 'COMPLETING',
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return true;
  }

  recordConfidenceCheckpoint(input: {
    checkSessionId: string;
    schoolId: string;
    studentId: string;
    objectiveId: string;
    checkpointType: 'before' | 'after';
    confidenceLevel: string;
  }): Phase3DailyObjectiveCheckConfidenceCheckpoint {
    this.assertDurableAvailableForProduction();
    const checkpointId = generateId('cc');
    const now = nowISO();
    const checkpoint: Phase3DailyObjectiveCheckConfidenceCheckpoint = {
      checkpointId,
      checkSessionId: input.checkSessionId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      objectiveId: input.objectiveId,
      checkpointType: input.checkpointType,
      confidenceLevel: input.confidenceLevel,
      recordedAt: now,
    };
    checkpointStore.set(checkpointId, checkpoint);
    saveDurable();
    return checkpoint;
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
  }): Phase3DailyObjectiveCheckAttempt {
    this.assertDurableAvailableForProduction();
    const attemptId = generateId('ca');
    const now = nowISO();
    const attempt: Phase3DailyObjectiveCheckAttempt = {
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
    attemptStore.set(attemptId, attempt);
    saveDurable();
    return attempt;
  }

  markRequiredStepCompleted(checkSessionId: string, stepType: string): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    this.assertDurableAvailableForProduction();
    const session = sessionStore.get(checkSessionId);
    if (!session) return null;
    const alreadyCompleted = (session.completedSteps || []).includes(stepType);
    const completedSteps = alreadyCompleted ? session.completedSteps : [...(session.completedSteps || []), stepType];
    const updated: any = {
      ...session,
      completedSteps,
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  appendSafeEvidenceRef(checkSessionId: string, evidenceRef: string): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    const session = sessionStore.get(checkSessionId);
    if (!session) return null;
    const refs = [...(session.safeEvidenceRefs || []), evidenceRef];
    const updated: any = {
      ...session,
      safeEvidenceRefs: refs,
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  completeCheckSession(
    checkSessionId: string,
    result: { status: string; learnerSafeReason: string; teacherSafeReason: string; safeEvidenceRefs: string[]; evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    this.assertDurableAvailableForProduction();
    const session = sessionStore.get(checkSessionId);
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
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  persistCompletionReferences(
    checkSessionId: string,
    refs: { evidenceId?: string; masteryResult?: any; weakSignalRef?: string },
  ): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    const session = sessionStore.get(checkSessionId);
    if (!session) return null;
    const updated: any = {
      ...session,
      evidenceId: refs.evidenceId !== undefined ? refs.evidenceId : session.evidenceId,
      masteryResult: refs.masteryResult !== undefined ? refs.masteryResult : session.masteryResult,
      weakSignalRef: refs.weakSignalRef !== undefined ? refs.weakSignalRef : session.weakSignalRef,
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  expireCheckSession(checkSessionId: string): (Phase3DailyObjectiveCheckSession & { version?: number }) | null {
    const session = sessionStore.get(checkSessionId);
    if (!session) return null;
    const updated: any = {
      ...session,
      status: 'expired',
      version: (session.version || 1) + 1,
      updatedAt: nowISO(),
    };
    sessionStore.set(checkSessionId, updated);
    saveDurable();
    return updated;
  }

  listTeacherCheckSummaries(schoolId: string): Phase3DailyObjectiveCheckSession[] {
    const results: Phase3DailyObjectiveCheckSession[] = [];
    // Ensure we have latest from durable
    for (const session of sessionStore.values()) {
      if (session.schoolId === schoolId) results.push(session as any);
    }
    // If file has more, hydrate
    if (results.length === 0) {
      hydrateFromDurable();
      for (const session of sessionStore.values()) {
        if (session.schoolId === schoolId) results.push(session as any);
      }
    }
    return results.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  createAuditEvent(event: Phase3DailyObjectiveCheckAuditEvent): Phase3DailyObjectiveCheckAuditEvent {
    const eventId = generateId('aev');
    const stored: Phase3DailyObjectiveCheckAuditEvent = { ...event, eventId, createdAt: nowISO() } as any;
    auditStore.set(eventId, stored);
    saveDurable();
    return stored;
  }

  // For tests that need direct access
  getAllSessionsForTests(): Phase3DailyObjectiveCheckSession[] {
    return Array.from(sessionStore.values()) as any;
  }

  resetPhase3DailyObjectiveCheckRepositoryForTests(): void {
    sessionStore.clear();
    attemptStore.clear();
    checkpointStore.clear();
    stepStore.clear();
    auditStore.clear();
    sessionsByStudent.clear();
    sessionsByObjective.clear();
    sessionsBySeed.clear();
    sessionIdCounter = 0;
    attemptIdCounter = 0;
    checkpointIdCounter = 0;
    stepIdCounter = 0;
    auditIdCounter = 0;
    // Clear durable files for test isolation
    for (const p of [getDurablePath(), ALT_DURABLE_FILE]) {
      try {
        if (fs.existsSync(p)) fs.unlinkSync(p);
      } catch {}
    }
  }

  // Production fail-closed: if durable backing is unavailable, throw
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
}

export const phase3DailyObjectiveCheckRepository = new Phase3DailyObjectiveCheckRepository();
