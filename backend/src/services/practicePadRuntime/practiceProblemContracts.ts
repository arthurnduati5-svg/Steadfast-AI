// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-02: durable PracticeProblem contracts
//
// Canonical ownership:
//   Question bank owns governed source questions (referenced, never
//     duplicated or mutated here).
//   PracticeProblem owns the exact issued practice problem/version used
//     by Practice Pad (this module).
//   PracticeAttempt remains the canonical learner attempt owner and binds
//     (problemId, problemVersion) exactly.
//
// Reuse decision (§1): QuestionVersionRecord / AnswerKeyVersionRecord own
// exam-governance lifecycle (draft/pending_approval/approved/...) coupled
// to teacher explanations. PP-02 does NOT reuse those rows as issued
// practice problems: it references them through source provenance
// (QUESTION_BANK sourceRef = "questionId:questionVersionId") and keeps a
// separate immutable READY-gated issuance record with learner-safe
// projection. No new question bank, no answer-key duplication.
// ─────────────────────────────────────────────────────────────

/** Source families justified by current repository owners. Closed set. */
export type PracticeProblemSourceType =
  | 'QUESTION_BANK'
  | 'TUTOR_GENERATED'
  | 'ARTIFACT_DERIVED'
  | 'VIDEO_DERIVED'
  | 'REVISION_DERIVED';

/** Smallest explicit validation lifecycle. Only READY may be issued. */
export type PracticeProblemValidationStatus =
  | 'PROPOSED'
  | 'VALIDATING'
  | 'READY'
  | 'REJECTED'
  | 'REQUIRES_SEMANTIC_VALIDATION';

/**
 * Deterministic evaluation vocabulary. Reuses the PP-01 deterministic
 * checker paths; `semantic_deferred` is issuable but always degrades
 * truthfully (NEEDS_SEMANTIC_ANALYSIS) until PP-03. No model is
 * activated in PP-02.
 */
export type PracticeProblemEvaluationType =
  | 'deterministic_exact'
  | 'deterministic_numeric'
  | 'deterministic_algebraic'
  | 'semantic_deferred';

/** Deterministic validation verdict for a proposed problem. */
export type PracticeProblemValidationVerdict =
  | 'valid'
  | 'invalid'
  | 'needs_semantic_review';

/** Explicit PP-02 failure codes (§14). Mapped to existing check failure
 * categories at the runtime boundary; never invented elsewhere. */
export type PracticeProblemFailureCode =
  | 'PROBLEM_NOT_FOUND'
  | 'PROBLEM_NOT_READY'
  | 'PROBLEM_REJECTED'
  | 'PROBLEM_VERSION_NOT_FOUND'
  | 'PROBLEM_SCOPE_MISMATCH'
  | 'PROBLEM_SOURCE_INVALID'
  | 'PROBLEM_EVALUATION_INVALID'
  | 'PROBLEM_PERSISTENCE_FAILED';

/** Material fields: changing any of these requires a new problemVersion.
 * Issued versions are immutable; old attempts keep their original version. */
export const PRACTICE_PROBLEM_MATERIAL_FIELDS = [
  'prompt',
  'expectedAnswer',
  'acceptableAnswerForms',
  'evaluationPlan',
  'evaluationType',
  'curriculumVersionId',
  'curriculumObjectiveId',
  'curriculumSkillId',
  'allowedResources',
] as const;

export type PracticeProblemMaterialField = (typeof PRACTICE_PROBLEM_MATERIAL_FIELDS)[number];

/** Candidate input for proposing a practice problem. Server-side only. */
export interface ProposePracticeProblemInput {
  problemId: string;
  schoolId: string;
  sourceType: PracticeProblemSourceType;
  sourceRef: string;
  sourceVersion?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  gradeBand?: string | null;
  prompt: string;
  allowedResources?: string[];
  curriculumVersionId?: string | null;
  curriculumObjectiveId?: string | null;
  curriculumSkillId?: string | null;
  evaluationType: PracticeProblemEvaluationType;
  evaluationPlan?: string | null;
  /** Server-only. Never serialized to the learner. */
  expectedAnswer?: string | null;
  /** Server-only. Never serialized to the learner. */
  acceptableAnswerForms?: string[];
}

/** Canonical durable PracticeProblem record (server-owned, full truth). */
export interface PracticeProblemRecord {
  problemId: string;
  problemVersion: number;
  schoolId: string;
  sourceType: PracticeProblemSourceType;
  sourceRef: string;
  sourceVersion?: string | null;
  subject?: string | null;
  topic?: string | null;
  subtopic?: string | null;
  gradeBand?: string | null;
  prompt: string;
  allowedResources: string[];
  curriculumVersionId?: string | null;
  curriculumObjectiveId?: string | null;
  curriculumSkillId?: string | null;
  evaluationType: PracticeProblemEvaluationType;
  evaluationPlan?: string | null;
  /** Server-only. Never serialized to the learner. */
  expectedAnswer?: string | null;
  /** Server-only. Never serialized to the learner. */
  acceptableAnswerForms: string[];
  validationStatus: PracticeProblemValidationStatus;
  createdAt: string;
  validatedAt?: string | null;
  retiredAt?: string | null;
}

/** Learner-safe projection. The ONLY shape that may reach the frontend. */
export interface PracticeProblemLearnerProjection {
  problemId: string;
  problemVersion: number;
  prompt: string;
  subject?: string | null;
  topic?: string | null;
  allowedResources: string[];
}

/** Fields that must never appear in a learner projection. */
export const PRACTICE_PROBLEM_PROTECTED_FIELDS = [
  'expectedAnswer',
  'acceptableAnswerForms',
  'evaluationPlan',
  'evaluationType',
  'validationStatus',
  'sourceRef',
  'sourceVersion',
] as const;

export function toPracticeProblemLearnerProjection(
  record: PracticeProblemRecord,
): PracticeProblemLearnerProjection {
  return {
    problemId: record.problemId,
    problemVersion: record.problemVersion,
    prompt: record.prompt,
    subject: record.subject ?? null,
    topic: record.topic ?? null,
    allowedResources: [...record.allowedResources],
  };
}

/** Typed PP-02 problem failure. The check runtime maps codes to existing
 * PracticePadFailureCategory values; the code is preserved in the message
 * so the distinction stays explicit end to end. */
export class PracticeProblemError extends Error {
  readonly code: PracticeProblemFailureCode;

  constructor(code: PracticeProblemFailureCode, message: string) {
    super(`[${code}] ${message}`);
    this.name = 'PracticeProblemError';
    this.code = code;
  }
}
