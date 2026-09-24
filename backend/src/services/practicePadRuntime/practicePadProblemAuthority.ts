// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02: canonical problem authority adapter
//
// PP-01 IS ACCEPTED AND CLOSED. This module preserves the accepted PP-01
// test seam byte-for-byte in behavior (registerProblem / sync
// resolveForAttempt / resetForTest) and routes production resolution
// through the ONE durable backend-owned PracticeProblem authority
// (practiceProblemStore).
//
// Semantic split enforced here (unchanged):
//   learner-visible: prompt, subject/topic, allowed resources
//   server-only:     expected result, evaluation plan, hidden solution
//                    material (NEVER sent to the frontend)
//
// Production durability law (PP-02 §3):
//   - The exact-binding path (problemId + problemVersion) resolves ONLY
//     through the durable store. It never consults the process-local map.
//   - The process-local map below is an EXPLICIT injected test double:
//     entries exist only after an explicit registerProblem /
//     __enablePracticeProblemAuthorityMemoryForTest call. Production code
//     never calls either, so in production the map is empty and a
//     database failure fails closed (PracticeProblemError
//     PROBLEM_PERSISTENCE_FAILED) instead of succeeding from memory.
//   - DB unavailable / table unavailable → fail closed. Never silently
//     fall back to memory in production.
// ─────────────────────────────────────────────────────────────

import type {
  PracticeProblemLearnerView,
  PracticeProblemServerRecord,
} from './practicePadCheckContracts';
import {
  practiceProblemStore,
  __enablePracticeProblemMemoryForTest,
} from './practiceProblemStore';
import {
  PracticeProblemError,
  type PracticeProblemRecord,
} from './practiceProblemContracts';

// ── Explicit injected test double (PP-01 seam, preserved) ──
// Entries exist only after explicit injection. `testDoubleInstalled` is
// false until registerProblem / __enable... is called; production never
// calls either.
const serverRecords = new Map<string, PracticeProblemServerRecord>();
let testDoubleInstalled = false;
const MAX_REGISTERED_PROBLEMS = 2000;

function evictIfNeeded(): void {
  if (serverRecords.size <= MAX_REGISTERED_PROBLEMS) return;
  const oldest = serverRecords.keys().next();
  if (!oldest.done) serverRecords.delete(oldest.value);
}

function toLearnerView(record: PracticeProblemServerRecord): PracticeProblemLearnerView {
  return {
    problemId: record.problemId,
    prompt: record.prompt,
    subject: record.subject ?? null,
    topic: record.topic ?? null,
    allowedResources: [...record.allowedResources],
  };
}

function adaptDurableRecord(record: PracticeProblemRecord): ProblemResolution {
  const serverRecord: PracticeProblemServerRecord = {
    problemId: record.problemId,
    prompt: record.prompt,
    subject: record.subject ?? null,
    topic: record.topic ?? null,
    allowedResources: [...record.allowedResources],
    expectedAnswer: record.expectedAnswer ?? null,
    evaluationPlan: record.evaluationPlan ?? null,
    evaluationType: record.evaluationType ?? null,
    acceptableAnswerForms: [...(record.acceptableAnswerForms ?? [])],
    schoolId: record.schoolId,
  };
  return {
    problem: serverRecord,
    learnerView: toLearnerView(serverRecord),
    hasAuthoritativeAnswer: !!record.expectedAnswer,
    problemVersion: record.problemVersion,
    durable: true,
  };
}

export interface ProblemResolution {
  problem: PracticeProblemServerRecord;
  learnerView: PracticeProblemLearnerView;
  /** True when a server-owned expected answer is available for checking. */
  hasAuthoritativeAnswer: boolean;
  /** Exact durable problem version, when resolved through PP-02 authority. */
  problemVersion?: number;
  /** True when resolved from durable PostgreSQL truth (never the map). */
  durable?: boolean;
}

export interface ProblemResolutionArgs {
  schoolId: string;
  attemptSourceQuestionId?: string | null;
  attemptPromptSummary?: string | null;
  attemptSubject?: string | null;
  attemptTopic?: string | null;
  problemId?: string | null;
  /** Exact version binding. Required with problemId for durable resolution. */
  problemVersion?: number | null;
}

/**
 * Install the explicit in-memory test double without registering a
 * problem. Focused tests only; never called by production code.
 */
export function __enablePracticeProblemAuthorityMemoryForTest(): void {
  testDoubleInstalled = true;
  __enablePracticeProblemMemoryForTest();
}

export const practicePadProblemAuthority = {
  /**
   * Register a canonical problem (explicit test injection seam, PP-01
   * behavior preserved). Calling this installs the in-memory test double.
   * Protected answer material lives here and never leaves the backend.
   */
  registerProblem(record: PracticeProblemServerRecord): PracticeProblemServerRecord {
    testDoubleInstalled = true;
    evictIfNeeded();
    const stored: PracticeProblemServerRecord = {
      ...record,
      subject: record.subject ?? null,
      topic: record.topic ?? null,
      allowedResources: [...(record.allowedResources || [])],
      acceptableAnswerForms: [...(record.acceptableAnswerForms || [])],
    };
    serverRecords.set(record.problemId, stored);
    return stored;
  },

  /**
   * Legacy synchronous resolution (PP-01 behavior preserved). Reads ONLY
   * the explicit test double plus the derived minimal problem; it never
   * touches the database. Production check flow uses
   * resolveForAttemptAsync below.
   *
   * Precedence:
   *   1. explicit problemId in the injected double
   *   2. attempt.sourceQuestionId in the injected double
   *   3. minimal problem derived from the attempt's own server-owned
   *      promptSummary (learner-visible only; NO expected answer)
   */
  resolveForAttempt(args: ProblemResolutionArgs): ProblemResolution | null {
    const readDouble = (id: string): ProblemResolution | null => {
      if (!testDoubleInstalled) return null;
      const record = serverRecords.get(id);
      if (!record || record.schoolId !== args.schoolId) return null;
      return { problem: record, learnerView: toLearnerView(record), hasAuthoritativeAnswer: !!record.expectedAnswer };
    };
    const directId = (args.problemId || '').trim();
    if (directId) {
      return readDouble(directId);
    }
    const sourceId = (args.attemptSourceQuestionId || '').trim();
    if (sourceId) {
      const record = readDouble(sourceId);
      if (record) return record;
      // Known source reference without registered server material:
      // problem identity exists, but no authoritative answer.
      return null;
    }
    const prompt = (args.attemptPromptSummary || '').trim();
    if (!prompt) return null;
    const derived: PracticeProblemServerRecord = {
      problemId: `derived:${prompt.slice(0, 48)}`,
      prompt: prompt.slice(0, 1200),
      subject: args.attemptSubject ?? null,
      topic: args.attemptTopic ?? null,
      allowedResources: [],
      expectedAnswer: null,
      evaluationPlan: null,
      evaluationType: null,
      acceptableAnswerForms: [],
      schoolId: args.schoolId,
    };
    return { problem: derived, learnerView: toLearnerView(derived), hasAuthoritativeAnswer: false };
  },

  /**
   * Production resolution (PP-02). Exact (problemId, problemVersion)
   * bindings resolve ONLY through the durable store — never the map, never
   * derived, never client data. Explicit PracticeProblemError codes fail
   * closed at the runtime boundary.
   *
   * Unbound attempts keep accepted PP-01 behavior: durable latest-READY
   * lookup first, then the explicit test double, then the derived minimal
   * problem. When durable truth knows the problemId, durable truth wins.
   */
  async resolveForAttemptAsync(args: ProblemResolutionArgs): Promise<ProblemResolution | null> {
    const directId = (args.problemId || '').trim();
    const version = args.problemVersion;
    if (directId && Number.isInteger(version) && (version as number) >= 1) {
      // Exact binding: durable authority only. Throws explicit PP-02 codes
      // (including PROBLEM_PERSISTENCE_FAILED on DB failure) — the runtime
      // maps them to fail-closed check outcomes. No map, no fallback.
      const record = await practiceProblemStore.resolveReadyProblem({
        problemId: directId,
        problemVersion: version as number,
        schoolId: args.schoolId,
      });
      return adaptDurableRecord(record);
    }
    const sourceId = (args.attemptSourceQuestionId || '').trim() || directId;
    if (sourceId) {
      try {
        const latest = await practiceProblemStore.loadLatestVersion(sourceId);
        if (latest.schoolId === args.schoolId) {
          if (latest.validationStatus === 'READY' && !latest.retiredAt) {
            return adaptDurableRecord(latest);
          }
          // Durable truth knows this problem but it is not issuable:
          // never bypass readiness through the test double.
          return null;
        }
        return null;
      } catch (cause) {
        if (cause instanceof PracticeProblemError) {
          // PROBLEM_NOT_FOUND / VERSION_NOT_FOUND: durable truth does not
          // know it — fall through to the explicit test double below.
          // PROBLEM_PERSISTENCE_FAILED: DB down — explicit double only.
          // Scope/rejected/readiness errors from loadLatestVersion cannot
          // occur (it performs no gating); rethrow anything else.
          if (cause.code !== 'PROBLEM_NOT_FOUND' && cause.code !== 'PROBLEM_PERSISTENCE_FAILED') throw cause;
        } else {
          throw cause;
        }
      }
      const legacy = this.resolveForAttempt(args);
      if (legacy) return legacy;
      // Known source reference without registered server material:
      // problem identity exists, but no authoritative answer.
      return null;
    }
    return this.resolveForAttempt(args);
  },

  resetForTest(): void {
    serverRecords.clear();
    testDoubleInstalled = false;
  },
};
