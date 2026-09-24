// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-08: interpretation authority
//
// RAW WORK IS AUTHORITATIVE. Interpretation is DERIVED. An
// interpretation must NEVER overwrite or silently replace raw work.
// Ambiguous work is valid learner input — never permission to guess.
//
// One derived PracticeWorkInterpretation binds exactly one raw source:
// (attemptId, documentVersion, sourceBlockId, sourceContentHash).
// A candidate is never confirmed truth until the learner/backend
// confirmation boundary selects one backend-owned candidate.
// ─────────────────────────────────────────────────────────────

export type PracticeInterpretationRepresentationClass = 'TEXT' | 'EQUATION' | 'DIAGRAM' | 'UNKNOWN';

export type PracticeInterpretationStatus =
  | 'UNINTERPRETED'
  | 'CANDIDATES_AVAILABLE'
  | 'CONFIRMATION_REQUIRED'
  | 'CONFIRMED'
  | 'REJECTED'
  | 'UNSUPPORTED';

export interface PracticeInterpretationCandidate {
  candidateId: string;
  representationClass: PracticeInterpretationRepresentationClass;
  /** Safe normalized representation (equation/text). Never chain-of-thought. */
  normalizedValue: string;
  confidence: number;
  provenance: string;
}

export interface PracticeWorkInterpretation {
  interpretationId: string;
  schoolId: string;
  studentId: string;
  attemptId: string;
  documentVersion: number;
  sourceBlockId: string;
  sourceContentHash: string;
  representationClass: PracticeInterpretationRepresentationClass;
  candidates: PracticeInterpretationCandidate[];
  status: PracticeInterpretationStatus;
  interpreter: string;
  interpreterVersion: string;
  createdAt: string;
  confirmedAt: string | null;
  confirmedCandidateId: string | null;
}

export type PracticeInterpretationFailureCode =
  | 'INTERPRETATION_REQUIRED'
  | 'INTERPRETATION_NOT_FOUND'
  | 'INTERPRETATION_STALE'
  | 'INTERPRETATION_FORBIDDEN'
  | 'CANDIDATE_NOT_FOUND'
  | 'UNSUPPORTED_REPRESENTATION'
  | 'INVALID_INK'
  | 'WORK_TOO_LARGE'
  | 'PERSISTENCE_FAILED';

export class PracticeInterpretationError extends Error {
  readonly code: PracticeInterpretationFailureCode;

  constructor(code: PracticeInterpretationFailureCode, message: string) {
    super(message);
    this.name = 'PracticeInterpretationError';
    this.code = code;
  }
}

export const PRACTICE_INTERPRETATION_MAX_CANDIDATES = 5;
export const PRACTICE_INTERPRETATION_MAX_VALUE_LENGTH = 2000;
export const PRACTICE_INTERPRETATION_ID_MAX_LENGTH = 64;

const REPRESENTATION_CLASSES: ReadonlySet<string> = new Set(['TEXT', 'EQUATION', 'DIAGRAM', 'UNKNOWN']);
const CONFIRMABLE_CLASSES: ReadonlySet<string> = new Set(['TEXT', 'EQUATION']);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Learner-safe projection: id + class + display value + confidence band only. */
export function toLearnerSafeCandidate(candidate: PracticeInterpretationCandidate): {
  candidateId: string;
  representationClass: PracticeInterpretationRepresentationClass;
  displayValue: string;
  confidenceBand: 'low' | 'medium' | 'high';
} {
  return {
    candidateId: candidate.candidateId,
    representationClass: candidate.representationClass,
    displayValue: candidate.normalizedValue,
    confidenceBand: candidate.confidence >= 0.8 ? 'high' : candidate.confidence >= 0.5 ? 'medium' : 'low',
  };
}

/** Only TEXT/EQUATION confirmations may feed PP-04/PP-05 checking. */
export function isCheckableRepresentation(value: string): value is 'TEXT' | 'EQUATION' {
  return CONFIRMABLE_CLASSES.has(value);
}

export function isValidRepresentationClass(value: unknown): value is PracticeInterpretationRepresentationClass {
  return typeof value === 'string' && REPRESENTATION_CLASSES.has(value);
}

export type CandidateValidation =
  | { ok: true; candidates: PracticeInterpretationCandidate[] }
  | { ok: false; code: 'CANDIDATE_NOT_FOUND' | 'UNSUPPORTED_REPRESENTATION'; message: string };

/**
 * Backend-owned candidate validation: candidates are created server-side
 * with safe normalized values. No chain-of-thought or model reasoning is
 * stored. UNKNOWN with no safe value yields UNSUPPORTED, never a guess.
 */
export function validateInterpretationCandidates(input: unknown): CandidateValidation {
  if (!Array.isArray(input) || input.length < 1) {
    return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: 'At least one interpretation candidate is required.' };
  }
  if (input.length > PRACTICE_INTERPRETATION_MAX_CANDIDATES) {
    return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: 'Too many interpretation candidates.' };
  }
  const clean: PracticeInterpretationCandidate[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < input.length; i += 1) {
    const raw = input[i];
    if (!isRecord(raw)) {
      return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: `Candidate ${i} must be an object.` };
    }
    const candidateId = typeof raw.candidateId === 'string' ? raw.candidateId.trim() : '';
    if (!candidateId || candidateId.length > PRACTICE_INTERPRETATION_ID_MAX_LENGTH || seen.has(candidateId)) {
      return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: `Candidate ${i} has an invalid or duplicate candidateId.` };
    }
    seen.add(candidateId);
    if (!isValidRepresentationClass(raw.representationClass)) {
      return { ok: false, code: 'UNSUPPORTED_REPRESENTATION', message: `Candidate ${candidateId} has an unsupported representation class.` };
    }
    const normalizedValue = typeof raw.normalizedValue === 'string' ? raw.normalizedValue : '';
    if (!normalizedValue || normalizedValue.length > PRACTICE_INTERPRETATION_MAX_VALUE_LENGTH) {
      return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: `Candidate ${candidateId} has an invalid normalized value.` };
    }
    const confidence = raw.confidence;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
      return { ok: false, code: 'CANDIDATE_NOT_FOUND', message: `Candidate ${candidateId} has an invalid confidence.` };
    }
    const provenance = typeof raw.provenance === 'string' ? raw.provenance.slice(0, 128) : 'backend';
    clean.push({ candidateId, representationClass: raw.representationClass, normalizedValue, confidence, provenance });
  }
  return { ok: true, candidates: clean };
}
