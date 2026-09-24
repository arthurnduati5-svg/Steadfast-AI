// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-09: integrity-evidence contracts
//
// Practice Pad integrity is NOT a verdict system. It converts bounded,
// privacy-safe learner/session observations into PracticeIntegrityEvidence
// that helps the tutor/backend decide whether additional LEARNING evidence
// is needed.
//
// Product law:
//
//   OBSERVATION → bounded factual signals → counter-signals
//   → calibrated concern → recommended next evidence action
//
// This module never declares fault, never authorizes penalties, never mutates mastery,
// memory, revision, Growth, grades, completion, or understanding, and never
// alters a PracticeCheck correctness verdict. Correct mathematics remains
// correct mathematics.
//
// Privacy law (allowlisted observations only):
//   Allowed: hidden/visible transitions, focus lost/gained, server-received
//   timing, check lifecycle facts, document revision timing, support usage
//   already known to the backend, attempt lifecycle facts, retry patterns.
//   Forbidden: destination URLs, browser history, other-tab content, other
//   applications, unrelated keystrokes, clipboard contents, device
//   screenshots, camera, microphone, screen recording, browsing inspection.
//   A visibility change means ONLY "Practice Pad was not visible for this
//   interval" — never an accusation.
//
// Determinism law: ZERO model calls. No OpenAI, no semantic port, no OCR.
// A future semantic port may be exposed later; it is not activated here.
// ─────────────────────────────────────────────────────────────

export type PracticeIntegrityEventType =
  | 'PRACTICE_VISIBLE'
  | 'PRACTICE_HIDDEN'
  | 'FOCUS_GAINED'
  | 'FOCUS_LOST'
  | 'CHECK_REQUESTED'
  | 'CHECK_COMPLETED'
  | 'SUPPORT_DELIVERED';

export const PRACTICE_INTEGRITY_EVENT_TYPES: readonly PracticeIntegrityEventType[] = [
  'PRACTICE_VISIBLE',
  'PRACTICE_HIDDEN',
  'FOCUS_GAINED',
  'FOCUS_LOST',
  'CHECK_REQUESTED',
  'CHECK_COMPLETED',
  'SUPPORT_DELIVERED',
];

/** Bounded, non-accusatory concern vocabulary. No fault verdicts exist. */
export type PracticeIntegrityConcernLevel =
  | 'NONE'
  | 'LOW'
  | 'MODERATE'
  | 'INSUFFICIENT_EVIDENCE';

/** Factual or carefully derived signals. Each must be directly supported
 *  by backend-owned observations. Visibility duration is contextual only:
 *  there is deliberately NO hidden-duration threshold that raises concern
 *  on its own. */
export type PracticeIntegritySignal =
  | 'VISIBILITY_INTERRUPTION'
  | 'UNUSUALLY_SHORT_RESPONSE_INTERVAL'
  | 'REPEATED_RAPID_SUBMISSIONS'
  | 'SUPPORT_USED_BEFORE_CORRECTION';

/** Counter-signals require explicit backend evidence. They are never
 *  manufactured: absent evidence means an absent counter-signal. */
export type PracticeIntegrityCounterSignal =
  | 'SUBSTANTIAL_WORK_TRACE'
  | 'NORMAL_REVISION_SEQUENCE'
  | 'SELF_CORRECTION_PRESENT'
  | 'LONG_FORM_REASONING_PRESENT'
  | 'TRANSFER_SUCCESS_PRESENT';

/** Learning-safe evidence actions only. Punitive, disciplinary, grading, or
 *  mastery-mutating recommendations are not representable here. */
export type PracticeIntegrityNextEvidenceAction =
  | 'NONE'
  | 'ASK_REASONING_QUESTION'
  | 'REQUEST_NEXT_STEP'
  | 'REQUEST_TRANSFER_PROBLEM'
  | 'REQUEST_EXPLANATION'
  | 'REQUIRE_MORE_WORK_EVIDENCE';

export type PracticeIntegrityFailureCode =
  | 'ATTEMPT_NOT_FOUND'
  | 'FORBIDDEN'
  | 'INVALID_EVENT'
  | 'EVENT_TOO_LARGE'
  | 'OUT_OF_ORDER'
  | 'INSUFFICIENT_EVIDENCE'
  | 'IDEMPOTENCY_CONFLICT'
  | 'PERSISTENCE_FAILED';

export interface PracticeIntegrityObservation {
  eventId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  eventType: PracticeIntegrityEventType;
  /** Client-supplied time is context only — never authority. */
  clientObservedAt: string | null;
  /** Backend-received time is the authority for ordering and intervals. */
  serverReceivedAt: string;
  serverSeq: number;
  /** True when client chronology disagreed with server receive order.
   *  Flagged, never treated as a concern signal. */
  outOfOrder: boolean;
  metadata: Record<string, string | number | boolean>;
  createdAt: string;
}

export interface PracticeIntegrityVisibilityInterval {
  hiddenAt: string;
  returnedAt: string;
  /** Deterministically established from server-received order only.
   *  Null when the interval could not be closed without invention. */
  durationMs: number | null;
}

export interface PracticeIntegrityObservationWindow {
  from: string | null;
  to: string | null;
  observationCount: number;
  truncated: boolean;
  visibilityIntervals: PracticeIntegrityVisibilityInterval[];
}

export interface PracticeIntegrityEvidence {
  integrityEvidenceId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  basedOnAttemptVersion: number;
  observationWindow: PracticeIntegrityObservationWindow;
  concernLevel: PracticeIntegrityConcernLevel;
  signals: PracticeIntegritySignal[];
  counterSignals: PracticeIntegrityCounterSignal[];
  confidence: number;
  recommendedNextEvidenceAction: PracticeIntegrityNextEvidenceAction;
  createdAt: string;
  deduplicated: boolean;
}

export type PracticeIntegrityOutcome =
  | { ok: true; observation?: PracticeIntegrityObservation; evidence?: PracticeIntegrityEvidence }
  | {
      ok: false;
      code: PracticeIntegrityFailureCode;
      message: string;
    };

export class PracticePadIntegrityPersistenceError extends Error {
  readonly code = 'PERSISTENCE_FAILED';
  constructor(message: string) {
    super(message);
    this.name = 'PracticePadIntegrityPersistenceError';
  }
}

// ── Bounds (hard, explicit) ──────────────────────────────────
// No bound below may silently raise concern when exceeded: exceeding the
// observation bound truncates deterministically and yields
// INSUFFICIENT_EVIDENCE, never a higher concern level.

/** Maximum observations retrieved for one evaluation (attempt-scoped). */
export const PP09_MAX_OBSERVATIONS_PER_EVALUATION = 100;
/** Maximum observations durably retained per attempt. */
export const PP09_MAX_OBSERVATIONS_PER_ATTEMPT = 200;
/** Maximum allowlisted metadata keys per observation. */
export const PP09_MAX_METADATA_KEYS = 8;
/** Maximum serialized metadata bytes per observation. */
export const PP09_MAX_METADATA_BYTES = 1024;
/** Maximum visibility intervals projected into one evidence record. */
export const PP09_MAX_INTERVALS_PER_EVIDENCE = 50;
/** Minimum server-ordered observations before a calibrated (non-
 *  insufficient) concern may be returned. */
export const PP09_MIN_OBSERVATIONS_FOR_CALIBRATION = 2;
/** A completed check faster than this after its request is factual timing
 *  context (UNUSUALLY_SHORT_RESPONSE_INTERVAL). It is one signal among
 *  others — never a verdict, never a hidden-duration rule. */
export const PP09_SHORT_RESPONSE_MS = 1500;
/** Rapid-submission window for REPEATED_RAPID_SUBMISSIONS. Counts check
 *  requests only — never visibility time. */
export const PP09_RAPID_SUBMISSION_WINDOW_MS = 60000;
export const PP09_RAPID_SUBMISSION_COUNT = 3;
/** Work-trace thresholds for counter-signals (require backend evidence). */
export const PP09_SUBSTANTIAL_WORK_CHARS = 120;
export const PP09_NORMAL_REVISION_COUNT = 2;
export const PP09_LONG_FORM_REASONING_STEPS = 3;

/** Metadata keys the backend accepts. Anything else — including any
 *  surveillance-shaped key — is rejected as INVALID_EVENT. */
export const PP09_ALLOWED_METADATA_KEYS: readonly string[] = [
  'basedOnVersion',
  'checkId',
  'checkStatus',
  'supportLevel',
  'revisionVersion',
  'reasonCode',
  'workChars',
  'stepCount',
  'idempotencyKey',
  'observationWindow',
];

/** Key fragments that always indicate forbidden surveillance content.
 *  Matched case-insensitively against every metadata key. */
export const PP09_FORBIDDEN_METADATA_FRAGMENTS: readonly string[] = [
  'url',
  'href',
  'link',
  'history',
  'clipboard',
  'keystroke',
  'screenshot',
  'capture',
  'camera',
  'microphone',
  'audio',
  'video',
  'screen',
  'recording',
  'tab',
  'browser',
  'window',
  'app',
  'process',
  'location',
  'geoloc',
];

/** Future semantic seam — present but NOT activated. Zero live calls. */
export const practicePadIntegritySemanticPort = {
  isAvailable(): false {
    return false;
  },
  liveCallCount(): 0 {
    return 0;
  },
};
