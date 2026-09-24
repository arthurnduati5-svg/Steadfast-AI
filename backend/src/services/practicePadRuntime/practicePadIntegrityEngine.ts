// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-09: integrity-evidence engine
//
// ONE canonical integrity-evidence path:
//
//   PracticeAttempt observations → integrity evaluator
//   → PracticeIntegrityEvidence → learning-safe recommendation
//
// Laws enforced:
//   - Observation only. A visibility change means "Practice Pad was not
//     visible for this interval" — never an accusation. One tab switch
//     alone can raise at most LOW concern with an evidence-seeking action.
//   - Server timing is authoritative. Client timestamps are context only;
//     server receive order (serverSeq) decides pairing, intervals, and
//     rapid-submission windows. Out-of-order or malformed client
//     chronology degrades safely: no fabricated duration, no concern.
//   - No hidden-duration threshold exists anywhere in this file. Duration
//     is recorded as a factual interval property only.
//   - Counter-signals require explicit backend evidence via injected
//     readers. Absent evidence means an absent counter-signal — positive
//     signals are never manufactured.
//   - Separation: this engine never imports mastery, memory, revision,
//     Growth, grading, or check-mutation modules. It never writes checks,
//     never alters a correctness verdict, never decrements or increments
//     mastery. PP-10 owns later learning-state integration.
//   - Deterministic first: zero model calls. The future semantic seam is
//     present but not activated (see contracts).
//   - Durable/idempotent protected evidence via practicePadIntegrityStore.
//     Production never depends on a process-local Map. Storage failure
//     fails closed: PERSISTENCE_FAILED, no evidence success, no concern.
// ─────────────────────────────────────────────────────────────

import { createHash, randomUUID } from 'crypto';
import {
  PP09_ALLOWED_METADATA_KEYS,
  PP09_FORBIDDEN_METADATA_FRAGMENTS,
  PP09_LONG_FORM_REASONING_STEPS,
  PP09_MAX_INTERVALS_PER_EVIDENCE,
  PP09_MAX_METADATA_BYTES,
  PP09_MAX_METADATA_KEYS,
  PP09_MAX_OBSERVATIONS_PER_ATTEMPT,
  PP09_MAX_OBSERVATIONS_PER_EVALUATION,
  PP09_MIN_OBSERVATIONS_FOR_CALIBRATION,
  PP09_NORMAL_REVISION_COUNT,
  PP09_RAPID_SUBMISSION_COUNT,
  PP09_RAPID_SUBMISSION_WINDOW_MS,
  PP09_SHORT_RESPONSE_MS,
  PP09_SUBSTANTIAL_WORK_CHARS,
  PRACTICE_INTEGRITY_EVENT_TYPES,
  type PracticeIntegrityConcernLevel,
  type PracticeIntegrityCounterSignal,
  type PracticeIntegrityEventType,
  type PracticeIntegrityNextEvidenceAction,
  type PracticeIntegrityObservation,
  type PracticeIntegritySignal,
  type PracticeIntegrityVisibilityInterval,
  type PracticeIntegrityEvidence,
  type PracticeIntegrityOutcome,
} from './practicePadIntegrityContracts';
import { PracticePadIntegrityPersistenceError } from './practicePadIntegrityContracts';
import {
  parseIntegrityEvidence,
  parseIntegrityObservation,
  practicePadIntegrityStore,
} from './practicePadIntegrityStore';
import { practiceAttemptService } from '../practiceAttemptService';

export interface PracticePadIntegrityIdentity {
  schoolId: string;
  studentId: string;
  verifiedSchool: boolean;
}

/** Backend-owned facts PP-10 (or tests) inject. Every field is nullable:
 *  null means "unknown" and yields NO counter-signal. Nothing here is
 *  inferred, and nothing here touches learning state.
 *  PP-10: provenCorrectedAfterSupport must be true (backend PP-07 proof:
 *  support delivered after prior unresolved error AND a later durable
 *  revision/check repaired it with CORRECTED_AFTER_SUPPORT) before
 *  SUPPORT_USED_BEFORE_CORRECTION may be emitted. Mere coexistence of
 *  SUPPORT_DELIVERED + CHECK_COMPLETED events is never sufficient. */
export interface PracticeIntegrityEvidenceReaders {
  workChars?: number | null;
  revisionCount?: number | null;
  reasoningSteps?: number | null;
  hadIncorrectBeforeCorrect?: boolean | null;
  transferCorrect?: boolean | null;
  attemptVersion?: number | null;
  provenCorrectedAfterSupport?: boolean | null;
}

export interface PracticePadIntegrityDependencies {
  attemptOwner?: Pick<typeof practiceAttemptService, 'getPracticeAttempt'>;
  store?: typeof practicePadIntegrityStore;
  readers?: PracticeIntegrityEvidenceReaders;
  clock?: () => string;
  newEventSeqId?: () => string;
  newEvidenceId?: () => string;
}

export interface RecordIntegrityObservationInput {
  attemptId: string;
  eventId: string;
  eventType: string;
  clientObservedAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface EvaluateIntegrityInput {
  attemptId: string;
  idempotencyKey: string;
}

function fail(outcome: Extract<PracticeIntegrityOutcome, { ok: false }>): PracticeIntegrityOutcome {
  return outcome;
}

function checkIdentity(identity: PracticePadIntegrityIdentity): PracticeIntegrityOutcome | null {
  const schoolId = (identity.schoolId || '').trim();
  const studentId = (identity.studentId || '').trim();
  if (!schoolId || !identity.verifiedSchool) {
    return fail({ ok: false, code: 'FORBIDDEN', message: 'Verified school identity is required for integrity observations.' });
  }
  if (!studentId) {
    return fail({ ok: false, code: 'FORBIDDEN', message: 'Verified learner identity is required for integrity observations.' });
  }
  return null;
}

async function loadOwnedAttempt(
  attemptOwner: Pick<typeof practiceAttemptService, 'getPracticeAttempt'>,
  identity: PracticePadIntegrityIdentity,
  attemptId: string,
): Promise<{ ok: true } | { ok: false; outcome: PracticeIntegrityOutcome }> {
  if (!attemptId) {
    return { ok: false, outcome: fail({ ok: false, code: 'ATTEMPT_NOT_FOUND', message: 'attemptId is required.' }) };
  }
  let attempt: unknown;
  try {
    attempt = await attemptOwner.getPracticeAttempt(
      { schoolId: identity.schoolId, studentId: identity.studentId },
      attemptId,
    );
  } catch {
    return {
      ok: false,
      outcome: fail({
        ok: false,
        code: 'PERSISTENCE_FAILED',
        message: 'Attempt store unavailable; integrity cannot succeed. No concern is recorded.',
      }),
    };
  }
  if (!attempt) {
    // Null means not found OR not owned by this learner/school. To avoid
    // an ownership oracle we report not-found here; explicit ownership
    // mismatches on visible records report FORBIDDEN below.
    return { ok: false, outcome: fail({ ok: false, code: 'ATTEMPT_NOT_FOUND', message: 'Practice attempt not found for this learner and school.' }) };
  }
  const record = attempt as { schoolId?: unknown; studentId?: unknown };
  if (typeof record.schoolId === 'string' && record.schoolId !== identity.schoolId) {
    return { ok: false, outcome: fail({ ok: false, code: 'FORBIDDEN', message: 'Practice attempt belongs to a different school.' }) };
  }
  if (typeof record.studentId === 'string' && record.studentId !== identity.studentId) {
    return { ok: false, outcome: fail({ ok: false, code: 'FORBIDDEN', message: 'Practice attempt belongs to a different learner.' }) };
  }
  return { ok: true };
}

function sanitizeMetadata(raw: Record<string, unknown> | undefined | null): {
  ok: true;
  metadata: Record<string, string | number | boolean>;
} | { ok: false; outcome: PracticeIntegrityOutcome } {
  const source = raw ?? {};
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { ok: false, outcome: fail({ ok: false, code: 'INVALID_EVENT', message: 'metadata must be a bounded object.' }) };
  }
  const entries = Object.entries(source);
  if (entries.length > PP09_MAX_METADATA_KEYS) {
    return { ok: false, outcome: fail({ ok: false, code: 'EVENT_TOO_LARGE', message: `metadata exceeds ${PP09_MAX_METADATA_KEYS} keys.` }) };
  }
  const metadata: Record<string, string | number | boolean> = {};
  for (const [key, value] of entries) {
    const lowered = key.toLowerCase();
    if (PP09_FORBIDDEN_METADATA_FRAGMENTS.some((frag) => lowered.includes(frag))) {
      // Forbidden surveillance content is rejected and never persisted.
      return { ok: false, outcome: fail({ ok: false, code: 'INVALID_EVENT', message: `metadata key "${key}" is not an allowed integrity observation.` }) };
    }
    if (!PP09_ALLOWED_METADATA_KEYS.includes(key)) {
      // Arbitrary client blobs are not accepted.
      return { ok: false, outcome: fail({ ok: false, code: 'INVALID_EVENT', message: `metadata key "${key}" is not allowlisted.` }) };
    }
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      return { ok: false, outcome: fail({ ok: false, code: 'INVALID_EVENT', message: `metadata key "${key}" must be a scalar.` }) };
    }
    if (typeof value === 'string' && value.length > 280) {
      return { ok: false, outcome: fail({ ok: false, code: 'EVENT_TOO_LARGE', message: `metadata key "${key}" exceeds 280 chars.` }) };
    }
    metadata[key] = value;
  }
  if (JSON.stringify(metadata).length > PP09_MAX_METADATA_BYTES) {
    return { ok: false, outcome: fail({ ok: false, code: 'EVENT_TOO_LARGE', message: 'metadata exceeds the byte bound.' }) };
  }
  return { ok: true, metadata };
}

function parseServerTime(value: string | null | undefined): number | null {
  if (!value) return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function integrityEvidenceScopeHash(attemptId: string, idempotencyKey: string): string {
  return createHash('sha256').update(`${attemptId}::${idempotencyKey}`).digest('hex');
}

/**
 * Record one bounded integrity observation. Client time is context only;
 * server receive order (serverSeq) is authoritative. Malformed client time
 * yields OUT_OF_ORDER with nothing persisted and no concern. Forbidden or
 * arbitrary metadata yields INVALID_EVENT with nothing persisted.
 */
export async function recordIntegrityObservation(
  identity: PracticePadIntegrityIdentity,
  input: RecordIntegrityObservationInput,
  deps: PracticePadIntegrityDependencies = {},
): Promise<PracticeIntegrityOutcome & { deduplicated?: boolean }> {
  const attemptOwner = deps.attemptOwner ?? practiceAttemptService;
  const store = deps.store ?? practicePadIntegrityStore;
  const now = deps.clock ?? (() => new Date().toISOString());

  const identityFailure = checkIdentity(identity);
  if (identityFailure) return identityFailure;

  const attemptId = (input.attemptId || '').trim();
  const eventId = (input.eventId || '').trim();
  if (!attemptId || !eventId) {
    return fail({ ok: false, code: 'INVALID_EVENT', message: 'attemptId and eventId are required.' });
  }
  if (!PRACTICE_INTEGRITY_EVENT_TYPES.includes(input.eventType as PracticeIntegrityEventType)) {
    return fail({ ok: false, code: 'INVALID_EVENT', message: `eventType "${input.eventType}" is not a bounded integrity event.` });
  }
  const eventType = input.eventType as PracticeIntegrityEventType;

  const owned = await loadOwnedAttempt(attemptOwner, identity, attemptId);
  if (!owned.ok) return owned.outcome;

  const sanitized = sanitizeMetadata(input.metadata);
  if (!sanitized.ok) return sanitized.outcome;

  const rawClientTime = input.clientObservedAt ?? null;
  if (rawClientTime !== null && parseServerTime(rawClientTime) === null) {
    return fail({ ok: false, code: 'OUT_OF_ORDER', message: 'clientObservedAt is not a parseable timestamp; nothing was recorded.' });
  }

  // Idempotent replay: the same eventId returns the stored observation.
  try {
    const existing = await store.findObservation(eventId);
    if (existing) {
      if (existing.attemptId !== attemptId || existing.schoolId !== identity.schoolId || existing.studentId !== identity.studentId) {
        return fail({ ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'eventId is already owned by a different attempt scope.' });
      }
      return { ok: true, observation: parseIntegrityObservation(existing), deduplicated: true };
    }
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
    }
    throw cause;
  }

  // Retention bound: explicit, never silent concern.
  try {
    const { total } = await store.listObservationsByAttempt(attemptId, 1);
    if (total >= PP09_MAX_OBSERVATIONS_PER_ATTEMPT) {
      return fail({ ok: false, code: 'EVENT_TOO_LARGE', message: 'Attempt observation bound reached; further observations are refused, never converted to concern.' });
    }
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
    }
    throw cause;
  }

  const serverReceivedAt = now();
  // PP-12: prefer the cross-replica-safe single-statement claim
  // (allocation + insert under PostgreSQL authority). Custom test doubles
  // without the atomic method fall back to the legacy split path.
  // NOTE: invoked as a store method (receiver preserved) — the atomic
  // claim re-reads the winner through the same store instance.
  const atomicStore = store as unknown as {
    insertObservationAtomic?: (
      record: Omit<import('./practicePadIntegrityStore').PracticeIntegrityObservationRecord, 'serverSeq'>,
    ) => Promise<{ won: boolean; serverSeq: number }>;
  };
  const useAtomicClaim = typeof atomicStore.insertObservationAtomic === 'function';
  let serverSeq: number | null = null;
  if (!useAtomicClaim) {
    try {
      serverSeq = await store.nextServerSeq(attemptId);
    } catch (cause) {
      if (cause instanceof PracticePadIntegrityPersistenceError) {
        return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
      }
      throw cause;
    }
  }

  // Client chronology is compared against server order only to FLAG
  // unreliability. Server order always wins for pairing and intervals.
  let outOfOrder = false;
  if (rawClientTime) {
    try {
      const { rows } = await store.listObservationsByAttempt(attemptId, PP09_MAX_OBSERVATIONS_PER_EVALUATION);
      const clientMs = parseServerTime(rawClientTime);
      for (const row of rows) {
        const priorClientMs = parseServerTime(row.clientObservedAt);
        if (clientMs !== null && priorClientMs !== null && clientMs < priorClientMs) {
          outOfOrder = true;
          break;
        }
      }
    } catch (cause) {
      if (cause instanceof PracticePadIntegrityPersistenceError) {
        return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
      }
      throw cause;
    }
  }

  const recordBase = {
    eventId,
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    attemptId,
    eventType,
    clientObservedAt: rawClientTime,
    serverReceivedAt,
    outOfOrder,
    metadataJson: JSON.stringify(sanitized.metadata),
    createdAt: serverReceivedAt,
  };
  if (useAtomicClaim) {
    try {
      const claimed = await atomicStore.insertObservationAtomic!(recordBase);
      if (!claimed.won) {
        const winner = await store.findObservation(eventId);
        if (winner) return { ok: true, observation: parseIntegrityObservation(winner), deduplicated: true };
        return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Observation claim failed; nothing was recorded.' });
      }
      return {
        ok: true,
        observation: {
          ...recordBase,
          serverSeq: claimed.serverSeq,
          metadata: sanitized.metadata,
        } as PracticeIntegrityObservation,
        deduplicated: false,
      };
    } catch (cause) {
      if (cause instanceof PracticePadIntegrityPersistenceError) {
        return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
      }
      throw cause;
    }
  }
  const record = {
    ...recordBase,
    serverSeq: serverSeq as number,
  };
  try {
    const won = await store.insertObservation(record);
    if (!won) {
      const winner = await store.findObservation(eventId);
      if (winner) return { ok: true, observation: parseIntegrityObservation(winner), deduplicated: true };
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Observation claim failed; nothing was recorded.' });
    }
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity store unavailable; observation cannot succeed.' });
    }
    throw cause;
  }
  return {
    ok: true,
    observation: {
      ...record,
      metadata: sanitized.metadata,
    } as PracticeIntegrityObservation,
    deduplicated: false,
  };
}

function isHide(t: PracticeIntegrityEventType): boolean {
  return t === 'PRACTICE_HIDDEN' || t === 'FOCUS_LOST';
}

function isShow(t: PracticeIntegrityEventType): boolean {
  return t === 'PRACTICE_VISIBLE' || t === 'FOCUS_GAINED';
}

/** Reconstruct factual visibility intervals from SERVER order only.
 *  Duplicate hides, duplicate shows, missing returns, and unreliable
 *  client chronology never fabricate a duration. */
export function reconstructVisibilityIntervals(
  ordered: PracticeIntegrityObservation[],
): PracticeIntegrityVisibilityInterval[] {
  const intervals: PracticeIntegrityVisibilityInterval[] = [];
  let openHiddenAt: string | null = null;
  for (const obs of ordered) {
    if (isHide(obs.eventType)) {
      if (openHiddenAt === null) openHiddenAt = obs.serverReceivedAt;
      // Duplicate hide while already hidden: ignored, never a signal.
      continue;
    }
    if (isShow(obs.eventType)) {
      if (openHiddenAt !== null) {
        const startMs = parseServerTime(openHiddenAt);
        const endMs = parseServerTime(obs.serverReceivedAt);
        intervals.push({
          hiddenAt: openHiddenAt,
          returnedAt: obs.serverReceivedAt,
          durationMs: startMs !== null && endMs !== null ? Math.max(0, endMs - startMs) : null,
        });
        openHiddenAt = null;
      }
      // Stray show with no open hide: ignored.
    }
  }
  // Missing return at the end: no interval is invented.
  return intervals;
}

function requestTimes(ordered: PracticeIntegrityObservation[], type: PracticeIntegrityEventType): number[] {
  const times: number[] = [];
  for (const obs of ordered) {
    if (obs.eventType !== type) continue;
    const ms = parseServerTime(obs.serverReceivedAt);
    if (ms !== null) times.push(ms);
  }
  return times.sort((a, b) => a - b);
}

/**
 * Evaluate bounded attempt observations into PracticeIntegrityEvidence.
 * Never mutates mastery, memory, revision, Growth, grades, completion,
 * understanding, or any check verdict. Correct work stays correct.
 */
export async function evaluatePracticeIntegrity(
  identity: PracticePadIntegrityIdentity,
  input: EvaluateIntegrityInput,
  deps: PracticePadIntegrityDependencies = {},
): Promise<PracticeIntegrityOutcome> {
  const attemptOwner = deps.attemptOwner ?? practiceAttemptService;
  const store = deps.store ?? practicePadIntegrityStore;
  const readers = deps.readers ?? {};
  const now = deps.clock ?? (() => new Date().toISOString());
  const newEvidenceId = deps.newEvidenceId ?? (() => `ppinev_${randomUUID()}`);

  const identityFailure = checkIdentity(identity);
  if (identityFailure) return identityFailure;

  const attemptId = (input.attemptId || '').trim();
  const idempotencyKey = (input.idempotencyKey || '').trim();
  if (!attemptId || !idempotencyKey) {
    return fail({ ok: false, code: 'INVALID_EVENT', message: 'attemptId and idempotencyKey are required.' });
  }

  const owned = await loadOwnedAttempt(attemptOwner, identity, attemptId);
  if (!owned.ok) return owned.outcome;

  const scopeHash = integrityEvidenceScopeHash(attemptId, idempotencyKey);

  let rows: Awaited<ReturnType<typeof store.listObservationsByAttempt>>['rows'];
  let total = 0;
  try {
    const listed = await store.listObservationsByAttempt(attemptId, PP09_MAX_OBSERVATIONS_PER_EVALUATION);
    rows = listed.rows;
    total = listed.total;
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      // Storage failure never becomes learner concern.
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity observations unavailable; no evidence is returned.' });
    }
    throw cause;
  }
  const truncated = total > rows.length;
  const ordered = rows.map(parseIntegrityObservation);

  // ── Factual signals (each at most once; observation-only) ──
  const signals: PracticeIntegritySignal[] = [];
  const intervals = reconstructVisibilityIntervals(ordered);
  if (intervals.length > 0) signals.push('VISIBILITY_INTERRUPTION');

  const requestedAt = requestTimes(ordered, 'CHECK_REQUESTED');
  const completedAt = requestTimes(ordered, 'CHECK_COMPLETED');
  if (requestedAt.length > 0 && completedAt.length > 0) {
    // Pair each completion with the latest request at or before it.
    let short = false;
    for (const done of completedAt) {
      const candidates = requestedAt.filter((r) => r <= done);
      if (candidates.length === 0) continue;
      const latest = Math.max(...candidates);
      if (done - latest < PP09_SHORT_RESPONSE_MS) {
        short = true;
        break;
      }
    }
    if (short) signals.push('UNUSUALLY_SHORT_RESPONSE_INTERVAL');
  }
  let rapid = false;
  for (let i = 0; i + PP09_RAPID_SUBMISSION_COUNT - 1 < requestedAt.length; i += 1) {
    if (requestedAt[i + PP09_RAPID_SUBMISSION_COUNT - 1] - requestedAt[i] <= PP09_RAPID_SUBMISSION_WINDOW_MS) {
      rapid = true;
      break;
    }
  }
  if (rapid) signals.push('REPEATED_RAPID_SUBMISSIONS');
  // PP-10 repair: SUPPORT_USED_BEFORE_CORRECTION requires backend proof
  // that support was delivered after the prior unresolved error AND a
  // later durable revision/check repaired it (CORRECTED_AFTER_SUPPORT).
  // Unrelated SUPPORT_DELIVERED + CHECK_COMPLETED coexistence is
  // explicitly insufficient; without provenCorrectedAfterSupport === true
  // the signal MUST NOT be emitted.
  if (
    ordered.some((o) => o.eventType === 'SUPPORT_DELIVERED') &&
    completedAt.length > 0 &&
    readers.provenCorrectedAfterSupport === true
  ) {
    signals.push('SUPPORT_USED_BEFORE_CORRECTION');
  }

  // ── Counter-signals (explicit backend evidence only) ──
  const counterSignals: PracticeIntegrityCounterSignal[] = [];
  if (readers.workChars !== null && readers.workChars !== undefined && readers.workChars >= PP09_SUBSTANTIAL_WORK_CHARS) {
    counterSignals.push('SUBSTANTIAL_WORK_TRACE');
  }
  if (readers.revisionCount !== null && readers.revisionCount !== undefined && readers.revisionCount >= PP09_NORMAL_REVISION_COUNT) {
    counterSignals.push('NORMAL_REVISION_SEQUENCE');
  }
  if (readers.hadIncorrectBeforeCorrect === true) counterSignals.push('SELF_CORRECTION_PRESENT');
  if (readers.reasoningSteps !== null && readers.reasoningSteps !== undefined && readers.reasoningSteps >= PP09_LONG_FORM_REASONING_STEPS) {
    counterSignals.push('LONG_FORM_REASONING_PRESENT');
  }
  if (readers.transferCorrect === true) counterSignals.push('TRANSFER_SUCCESS_PRESENT');

  // ── Calibrated, non-accusatory concern ──
  let concernLevel: PracticeIntegrityConcernLevel;
  if (truncated || (ordered.length < PP09_MIN_OBSERVATIONS_FOR_CALIBRATION && signals.length === 0)) {
    concernLevel = 'INSUFFICIENT_EVIDENCE';
  } else if (signals.length === 0) {
    concernLevel = 'NONE';
  } else if (signals.length >= 2 && counterSignals.length < 2) {
    concernLevel = 'MODERATE';
  } else {
    concernLevel = 'LOW';
  }

  const confidence =
    concernLevel === 'NONE' ? 0.9 : concernLevel === 'LOW' ? 0.55 : concernLevel === 'MODERATE' ? 0.6 : 0.2;

  let recommendedNextEvidenceAction: PracticeIntegrityNextEvidenceAction;
  if (concernLevel === 'NONE') recommendedNextEvidenceAction = 'NONE';
  else if (concernLevel === 'INSUFFICIENT_EVIDENCE') recommendedNextEvidenceAction = 'REQUIRE_MORE_WORK_EVIDENCE';
  else if (concernLevel === 'MODERATE') recommendedNextEvidenceAction = 'REQUEST_TRANSFER_PROBLEM';
  else recommendedNextEvidenceAction = 'ASK_REASONING_QUESTION';

  const first = ordered[0]?.serverReceivedAt ?? null;
  const last = ordered[ordered.length - 1]?.serverReceivedAt ?? null;
  const window = {
    from: first,
    to: last,
    observationCount: ordered.length,
    truncated,
    visibilityIntervals: intervals.slice(0, PP09_MAX_INTERVALS_PER_EVIDENCE),
  };

  const fingerprint = createHash('sha256')
    .update(
      JSON.stringify({
        attemptId,
        events: ordered.map((o) => `${o.eventType}@${o.serverSeq}`),
        signals,
        counterSignals,
        concernLevel,
        recommendedNextEvidenceAction,
        readers: {
          workChars: readers.workChars ?? null,
          revisionCount: readers.revisionCount ?? null,
          reasoningSteps: readers.reasoningSteps ?? null,
          hadIncorrectBeforeCorrect: readers.hadIncorrectBeforeCorrect ?? null,
          transferCorrect: readers.transferCorrect ?? null,
          attemptVersion: readers.attemptVersion ?? null,
          provenCorrectedAfterSupport: readers.provenCorrectedAfterSupport ?? null,
        },
      }),
    )
    .digest('hex');

  // Idempotent durable evidence: same scope + same fingerprint → stored
  // result; same scope + different fingerprint → explicit conflict.
  try {
    const existing = await store.findEvidenceByScope(scopeHash);
    if (existing) {
      if (existing.fingerprint === fingerprint) {
        return { ok: true, evidence: { ...parseIntegrityEvidence(existing), deduplicated: true } };
      }
      return fail({ ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency key was already used with different observations.' });
    }
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity evidence store unavailable; no evidence is returned.' });
    }
    throw cause;
  }

  const createdAt = now();
  const evidence: PracticeIntegrityEvidence = {
    integrityEvidenceId: newEvidenceId(),
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    attemptId,
    basedOnAttemptVersion:
      readers.attemptVersion !== null && readers.attemptVersion !== undefined ? readers.attemptVersion : 0,
    observationWindow: window,
    concernLevel,
    signals,
    counterSignals,
    confidence,
    recommendedNextEvidenceAction,
    createdAt,
    deduplicated: false,
  };

  try {
    const won = await store.insertEvidence({
      scopeHash,
      integrityEvidenceId: evidence.integrityEvidenceId,
      schoolId: evidence.schoolId,
      studentId: evidence.studentId,
      attemptId,
      basedOnAttemptVersion: evidence.basedOnAttemptVersion,
      idempotencyKey,
      observationWindow: JSON.stringify(window),
      concernLevel,
      signalsJson: JSON.stringify(signals),
      counterSignalsJson: JSON.stringify(counterSignals),
      confidence,
      recommendedNextEvidenceAction,
      fingerprint,
      resultJson: JSON.stringify(evidence),
      createdAt,
    });
    if (!won) {
      const winner = await store.findEvidenceByScope(scopeHash);
      if (winner) {
        if (winner.fingerprint === fingerprint) {
          return { ok: true, evidence: { ...parseIntegrityEvidence(winner), deduplicated: true } };
        }
        return fail({ ok: false, code: 'IDEMPOTENCY_CONFLICT', message: 'Idempotency key was already used with different observations.' });
      }
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Evidence claim failed; no evidence is returned.' });
    }
  } catch (cause) {
    if (cause instanceof PracticePadIntegrityPersistenceError) {
      return fail({ ok: false, code: 'PERSISTENCE_FAILED', message: 'Integrity evidence store unavailable; no evidence is returned.' });
    }
    throw cause;
  }
  return { ok: true, evidence };
}
