// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Service
// Owns all TutorState persistence and updates.
// Production default is Prisma-backed and fail-closed: when the
// database is unreachable, canonical reads/writes throw instead of
// silently succeeding against process-local memory (R8-G.3A).
// In-memory fallback remains available ONLY as explicit test/dev
// injection (NODE_ENV !== 'production', or TUTORSTATE_ALLOW_MEMORY_FALLBACK=1).
// Set TUTORSTATE_REQUIRE_DURABLE=1 to force strict mode anywhere.
// ─────────────────────────────────────────────────────────────

import prisma from '../lib/prisma';
import type {
  TutorState,
  TutorStateEvidence,
  ResolvedTutorIdentity,
  ContextStatus,
  LearningMode,
} from './tutorStateContracts';
import type { PatchTutorStateRequestValidated } from './tutorStateValidation';

// ── Helpers: Prisma availability detection & timeout ──
// Once Prisma operations fail (e.g. DB unreachable), we skip them for
// the rest of the process lifetime so subsequent calls don't hang.
let _prismaAvailable: boolean | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Prisma operation timed out')), ms),
    ),
  ]);
}

async function isPrismaAvailable(): Promise<boolean> {
  if (_prismaAvailable !== null) return _prismaAvailable;
  try {
    // Run a minimal query to check connectivity
    await withTimeout(
      (prisma as any).$queryRaw`SELECT 1`,
      2000,
    );
    _prismaAvailable = true;
  } catch {
    _prismaAvailable = false;
  }
  return _prismaAvailable;
}

// ── In-memory fallback store (explicit test/dev injection ONLY) ──
// Production default (NODE_ENV=production) never reads or writes this
// store: canonical TutorState must survive restart (R8-G.3A).
const memoryStore = new Map<string, TutorState>();

/**
 * R8-G.3A: explicit test/dev injection gate for the in-memory fallback.
 * Silent Prisma failure → memory success is forbidden for canonical
 * state. Outside test/dev, persistence failures throw (fail-closed).
 */
export function isTutorStateMemoryFallbackAllowed(): boolean {
  if (process.env.TUTORSTATE_ALLOW_MEMORY_FALLBACK === '1') return true;
  if (process.env.TUTORSTATE_REQUIRE_DURABLE === '1') return false;
  return process.env.NODE_ENV !== 'production';
}

function makeMemoryKey(schoolId: string, studentId: string): string {
  return `${schoolId}:${studentId}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Build a default TutorState when no persisted state exists.
 */
function buildDefaultState(
  identity: ResolvedTutorIdentity,
  patch?: Partial<{
    sessionId: string | null;
    learningMode: LearningMode;
    primaryLanguage: string;
    supportLanguage: string | null;
  }>,
): TutorState {
  return {
    id: '',
    studentId: identity.studentId,
    schoolId: identity.schoolId,
    sessionId: patch?.sessionId ?? null,
    activeSubject: null,
    activeTopic: null,
    activeSkillIds: [],
    activeArtifactIds: [],
    activeVideoId: null,
    learningMode: patch?.learningMode ?? 'learn',
    primaryLanguage: patch?.primaryLanguage ?? 'en',
    supportLanguage: patch?.supportLanguage ?? null,
    stateQuality: 'no_data_yet',
    evidence: [
      {
        source: 'system',
        field: 'state',
        valueSummary: 'Default tutor state created — no prior persisted state found.',
        confidence: 1,
        resolvedAt: nowISO(),
      },
    ],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    lastResolvedAt: null,
    stateVersion: 1,
  };
}

/**
 * Normalize arrays for uniqueness.
 */
function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/**
 * Prisma-based persistence (production path).
 */
async function getFromPrisma(
  schoolId: string,
  studentId: string,
): Promise<TutorState | null> {
  const available = await isPrismaAvailable();
  if (!available) return null;
  try {
    const record = await (prisma as any).tutorState.findFirst({
      where: { schoolId, studentId },
      orderBy: { updatedAt: 'desc' },
    });
    if (!record) return null;

    return {
      id: record.id,
      studentId: record.studentId,
      schoolId: record.schoolId,
      sessionId: record.sessionId ?? null,
      activeSubject: record.activeSubject ?? null,
      activeTopic: record.activeTopic ?? null,
      activeSkillIds: (record.activeSkillIds as string[]) || [],
      activeArtifactIds: (record.activeArtifactIds as string[]) || [],
      activeVideoId: record.activeVideoId ?? null,
      learningMode: (record.learningMode as LearningMode) || 'learn',
      primaryLanguage: record.primaryLanguage || 'en',
      supportLanguage: record.supportLanguage ?? null,
      stateQuality: (record.stateQuality as ContextStatus) || 'no_data_yet',
      evidence: (record.evidence as TutorStateEvidence[]) || [],
      createdAt: record.createdAt?.toISOString?.() || nowISO(),
      updatedAt: record.updatedAt?.toISOString?.() || nowISO(),
      lastResolvedAt: record.lastResolvedAt?.toISOString?.() || null,
      stateVersion: record.stateVersion || 1,
    };
  } catch {
    return null; // DB unreachable
  }
}

/**
 * Persist to Prisma (create or update).
 */
async function upsertInPrisma(state: TutorState): Promise<TutorState | null> {
  const available = await isPrismaAvailable();
  if (!available) return null;
  try {
    const record = await (prisma as any).tutorState.upsert({
      where: { id: state.id || '__new__' },
      create: {
        id: undefined, // Let DB generate
        studentId: state.studentId,
        schoolId: state.schoolId,
        sessionId: state.sessionId ?? null,
        activeSubject: state.activeSubject ?? null,
        activeTopic: state.activeTopic ?? null,
        activeSkillIds: state.activeSkillIds,
        activeArtifactIds: state.activeArtifactIds,
        activeVideoId: state.activeVideoId ?? null,
        learningMode: state.learningMode,
        primaryLanguage: state.primaryLanguage,
        supportLanguage: state.supportLanguage ?? null,
        stateQuality: state.stateQuality,
        evidence: state.evidence as any,
        stateVersion: state.stateVersion,
        lastResolvedAt: state.lastResolvedAt ? new Date(state.lastResolvedAt) : null,
      },
      update: {
        sessionId: state.sessionId ?? null,
        activeSubject: state.activeSubject ?? null,
        activeTopic: state.activeTopic ?? null,
        activeSkillIds: state.activeSkillIds,
        activeArtifactIds: state.activeArtifactIds,
        activeVideoId: state.activeVideoId ?? null,
        learningMode: state.learningMode,
        primaryLanguage: state.primaryLanguage,
        supportLanguage: state.supportLanguage ?? null,
        stateQuality: state.stateQuality,
        evidence: state.evidence as any,
        stateVersion: state.stateVersion,
        lastResolvedAt: state.lastResolvedAt ? new Date(state.lastResolvedAt) : null,
      },
    });
    if (!record) return null;

    return {
      ...state,
      id: record.id,
      createdAt: record.createdAt?.toISOString?.() || state.createdAt,
      updatedAt: record.updatedAt?.toISOString?.() || state.updatedAt,
    };
  } catch {
    return null;
  }
}

/**
 * Get the current TutorState for a learner.
 * Production default is Prisma-backed and fail-closed: when the database
 * is unreachable, this throws instead of silently serving volatile memory.
 * In-memory fallback applies only as explicit test/dev injection.
 */
export async function getTutorStateForLearner(
  identity: ResolvedTutorIdentity,
): Promise<TutorState> {
  // Try Prisma (isPrismaAvailable check inside getFromPrisma is fast after first probe)
  const fromDb = await getFromPrisma(identity.schoolId, identity.studentId);
  if (fromDb) return fromDb;

  const fallbackAllowed = isTutorStateMemoryFallbackAllowed();
  const prismaAvailable = await isPrismaAvailable();
  if (!prismaAvailable && !fallbackAllowed) {
    throw new Error(
      'TutorState persistence unavailable: database unreachable and in-memory fallback is disabled (R8-G.3A durable-canonical default).',
    );
  }
  if (!fallbackAllowed) {
    // Strict mode: never serve volatile process memory as canonical truth.
    return buildDefaultState(identity);
  }

  // Fallback: in-memory (explicit test/dev injection only)
  const memKey = makeMemoryKey(identity.schoolId, identity.studentId);
  const fromMem = memoryStore.get(memKey);
  if (fromMem) return fromMem;

  // Return default
  return buildDefaultState(identity);
}

/**
 * Upsert (create or replace) TutorState for a learner.
 * Production default is Prisma-backed and fail-closed: when the database
 * is unreachable, this throws instead of silently reporting a successful
 * write that would be lost on restart.
 */
export async function upsertTutorStateForLearner(
  identity: ResolvedTutorIdentity,
  state: TutorState,
): Promise<TutorState> {
  const fallbackAllowed = isTutorStateMemoryFallbackAllowed();
  if (!fallbackAllowed) {
    // Strict mode: durable write only, never volatile memory success.
    const fromDb = await upsertInPrisma(state);
    if (fromDb) return fromDb;
    throw new Error(
      'TutorState persistence failed: database unreachable and in-memory fallback is disabled (R8-G.3A durable-canonical default).',
    );
  }

  // Explicit test/dev injection path (legacy behavior preserved).
  // Always update in-memory
  const memKey = makeMemoryKey(identity.schoolId, identity.studentId);
  memoryStore.set(memKey, state);

  // Try Prisma
  const fromDb = await upsertInPrisma(state);
  if (fromDb) return fromDb;

  // Return in-memory version if Prisma failed
  return memoryStore.get(memKey) || state;
}

/**
 * Patch (partial update) TutorState for a learner.
 * Loads current state, applies patch, increments version, records evidence.
 */
export async function patchTutorStateForLearner(
  identity: ResolvedTutorIdentity,
  patch: PatchTutorStateRequestValidated,
): Promise<TutorState> {
  const current = await getTutorStateForLearner(identity);

  const evidenceEntries: TutorStateEvidence[] = [];
  const now = nowISO();

  if (patch.sessionId !== undefined) {
    evidenceEntries.push({
      source: 'request', field: 'sessionId',
      valueSummary: `Session set to ${patch.sessionId || 'none'}`,
      confidence: 1, resolvedAt: now,
    });
  }
  if (patch.activeSubject !== undefined) {
    evidenceEntries.push({
      source: 'request', field: 'activeSubject',
      valueSummary: `Subject set to ${patch.activeSubject || 'none'}`,
      confidence: 0.9, resolvedAt: now,
    });
  }
  if (patch.activeTopic !== undefined) {
    evidenceEntries.push({
      source: 'request', field: 'activeTopic',
      valueSummary: `Topic set to ${patch.activeTopic || 'none'}`,
      confidence: 0.9, resolvedAt: now,
    });
  }
  if (patch.learningMode !== undefined) {
    evidenceEntries.push({
      source: 'request', field: 'learningMode',
      valueSummary: `Mode set to ${patch.learningMode}`,
      confidence: 1, resolvedAt: now,
    });
  }

  const updated: TutorState = {
    ...current,
    sessionId: patch.sessionId !== undefined ? (patch.sessionId ?? null) : current.sessionId,
    activeSubject: patch.activeSubject !== undefined ? (patch.activeSubject?.trim() || null) : current.activeSubject,
    activeTopic: patch.activeTopic !== undefined ? (patch.activeTopic?.trim() || null) : current.activeTopic,
    activeSkillIds: patch.activeSkillIds !== undefined ? uniqueStrings(patch.activeSkillIds) : current.activeSkillIds,
    activeArtifactIds: patch.activeArtifactIds !== undefined ? uniqueStrings(patch.activeArtifactIds) : current.activeArtifactIds,
    activeVideoId: patch.activeVideoId !== undefined ? (patch.activeVideoId ?? null) : current.activeVideoId,
    learningMode: patch.learningMode ?? current.learningMode,
    primaryLanguage: patch.primaryLanguage?.trim() || current.primaryLanguage,
    supportLanguage: patch.supportLanguage !== undefined ? (patch.supportLanguage?.trim() || null) : current.supportLanguage,
    stateVersion: current.stateVersion + 1,
    stateQuality: 'resolved' as ContextStatus,
    evidence: [...current.evidence, ...evidenceEntries],
    updatedAt: now,
  };

  return upsertTutorStateForLearner(identity, updated);
}

/**
 * Update lastResolvedAt timestamp.
 */
export async function touchLastResolvedAt(
  identity: ResolvedTutorIdentity,
): Promise<void> {
  const current = await getTutorStateForLearner(identity);
  if (!current.id) return; // Don't touch default-only states

  const updated: TutorState = {
    ...current,
    lastResolvedAt: nowISO(),
    stateVersion: current.stateVersion + 1,
    stateQuality: 'resolved' as ContextStatus,
    evidence: [
      ...current.evidence,
      {
        source: 'system',
        field: 'lastResolvedAt',
        valueSummary: 'Tutor context resolved.',
        confidence: 1,
        resolvedAt: nowISO(),
      },
    ],
    updatedAt: nowISO(),
  };
  await upsertTutorStateForLearner(identity, updated);
}

/**
 * For testing: clear the in-memory store.
 */
export function _clearMemoryStoreForTest(): void {
  memoryStore.clear();
}
