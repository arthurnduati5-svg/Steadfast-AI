// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intelligent Intent Resolver Contracts v1
// Domain: context-aware tutoring intent resolution.
// No keyword-only routing. No fake certainty.
// ─────────────────────────────────────────────────────────────

// ── Tutor Intent Enum ──
export type TutorIntent =
  | 'explain'
  | 'reteach'
  | 'simplify'
  | 'practice'
  | 'quiz'
  | 'review'
  | 'revise'
  | 'check_answer'
  | 'artifact_help'
  | 'artifact_question_help'
  | 'source_verification'
  | 'video_help'
  | 'next_practice'
  | 'progress_check'
  | 'study_plan'
  | 'general_chat'
  | 'clarification_needed'
  | 'unsupported'
  | 'unsafe';

// ── Tutor Task Kind Enum ──
export type TutorTaskKind =
  | 'answer_with_scaffold'
  | 'explain_concept'
  | 'reteach_concept'
  | 'simplify_explanation'
  | 'select_or_generate_practice'
  | 'generate_quiz'
  | 'review_due_material'
  | 'revision_plan'
  | 'evaluate_answer'
  | 'query_artifact'
  | 'explain_artifact_block'
  | 'verify_sources'
  | 'explain_video_context'
  | 'recommend_next_practice'
  | 'summarize_progress'
  | 'ask_clarifying_question'
  | 'refuse_or_redirect'
  | 'general_response';

// ── Intent Resolution Status Enum ──
export type IntentResolutionStatus =
  | 'resolved'
  | 'needs_clarification'
  | 'partial'
  | 'unsupported'
  | 'unsafe'
  | 'error';

// ── Intent Confidence Enum ──
export type IntentConfidence =
  | 'low'
  | 'medium'
  | 'high';

// ── Intent Evidence Source Enum ──
export type IntentEvidenceSource =
  | 'message'
  | 'tutor_state'
  | 'tutor_context'
  | 'artifact_context'
  | 'learner_memory'
  | 'practice_mastery'
  | 'source_trust'
  | 'video_context'
  | 'system_default'
  | 'safety_policy';

// ── Clarification Reason Enum ──
export type ClarificationReason =
  | 'missing_topic'
  | 'missing_artifact'
  | 'missing_answer'
  | 'missing_source'
  | 'missing_video'
  | 'ambiguous_task'
  | 'multiple_possible_intents'
  | 'unsafe_or_unsupported'
  | 'low_confidence';

// ── Output Expectation Enum ──
export type OutputExpectation =
  | 'scaffolded_explanation'
  | 'question_only'
  | 'step_by_step'
  | 'hint_first'
  | 'answer_check'
  | 'quiz'
  | 'revision_plan'
  | 'source_verification'
  | 'clarification_question'
  | 'safe_refusal'
  | 'general';

// ── Allowed Context Enum ──
export type AllowedContext =
  | 'message_only'
  | 'tutor_state'
  | 'learner_profile'
  | 'artifact_context'
  | 'practice_mastery'
  | 'source_trust'
  | 'combined';

// ── Suggested Downstream Service ──
export type SuggestedService =
  | 'chat_generation'
  | 'artifact_query'
  | 'practice_mastery'
  | 'learner_memory'
  | 'source_trust'
  | 'video_context'
  | 'tutor_state'
  | 'clarification'
  | 'safety_refusal'
  | 'none';

// ── Tutor Intent Evidence ──
export interface TutorIntentEvidence {
  evidenceId: string;
  source: IntentEvidenceSource;
  signal: string;
  summary: string;
  confidence: number;
}

// ── Tutor Task Plan ──
export interface TutorTaskPlan {
  taskKind: TutorTaskKind;

  subject?: string | null;
  topic?: string | null;
  skillIds: string[];

  artifactIds: string[];
  artifactBlockIds: string[];

  videoId?: string | null;
  sourceIds: string[];

  practiceRecommendationIds: string[];
  memoryIds: string[];
  masteryIds: string[];

  instruction: string;

  allowedContext: AllowedContext;

  forbiddenContext: string[];

  outputExpectation: OutputExpectation;
}

// ── Clarification Question ──
export interface ClarificationQuestion {
  reason: ClarificationReason;
  question: string;
  options: string[];
  canProceedWithSafeDefault: boolean;
  safeDefaultIntent?: TutorIntent | null;
}

// ── Intent Context Use ──
export interface IntentContextUse {
  usedTutorState: boolean;
  usedLearnerMemory: boolean;
  usedPracticeMastery: boolean;
  usedArtifactContext: boolean;
  usedSourceTrust: boolean;
  usedVideoContext: boolean;

  activeSubject?: string | null;
  activeTopic?: string | null;
  activeArtifactIds: string[];
  activeVideoId?: string | null;

  notes: string[];
}

// ── Intent Safety Decision ──
export interface IntentSafetyDecision {
  safeToProceed: boolean;
  reason: string;
  blockedReasons: string[];
  promptInjectionSuspected: boolean;
  answerKeyExposureRisk: boolean;
  sourceFabricationRisk: boolean;
  crossStudentRisk: boolean;
}

// ── Intent Downstream Routing ──
export interface IntentDownstreamRouting {
  suggestedService: SuggestedService;

  suggestedEndpoint?: string | null;

  shouldCallAi: boolean;
  shouldQueryArtifact: boolean;
  shouldUsePracticeMastery: boolean;
  shouldUseLearnerMemory: boolean;
  shouldUseSourceTrust: boolean;
  shouldAskClarification: boolean;
}

// ── Tutor Intent Resolution (main output contract) ──
export interface TutorIntentResolution {
  resolutionId: string;

  status: IntentResolutionStatus;

  primaryIntent: TutorIntent;
  secondaryIntents: TutorIntent[];

  task: TutorTaskPlan;

  confidence: IntentConfidence;
  confidenceScore: number;

  evidence: TutorIntentEvidence[];

  clarification?: ClarificationQuestion | null;

  contextUse: IntentContextUse;

  safety: IntentSafetyDecision;

  downstream: IntentDownstreamRouting;

  warnings: string[];
  errors: string[];

  resolverVersion: 'intent-resolver-v1';
  resolvedAt: string;
}

// ── Request Contracts ──

export interface ResolveTutorIntentRequest {
  sessionId?: string | null;
  message: string;

  activeSubject?: string | null;
  activeTopic?: string | null;
  activeSkillIds?: string[];

  activeArtifactIds?: string[];
  activeVideoId?: string | null;

  learnerAnswerSummary?: string | null;
  sourceCandidateIds?: string[];
  requestedMode?: string | null;

  includeDebug?: boolean;
}

export interface IntentResolutionEventRecord {
  eventId: string;
  schoolId: string;
  studentId: string;
  sessionId?: string | null;

  primaryIntent: string;
  status: string;
  confidenceScore: number;
  taskKind: string;

  messageSummary?: string | null;
  evidenceSummary: any[];
  warnings: string[];

  createdAt: string;
}

// ── Response Contracts ──

export interface ResolveTutorIntentResponse {
  ok: true;
  intentResolution: TutorIntentResolution;
}

export interface IntentHistoryResponse {
  ok: true;
  events: IntentResolutionEventRecord[];
  status: 'resolved' | 'no_data_yet' | 'not_integrated_yet';
}

// ── Confidence Helpers ──

export const INTENT_CONFIDENCE_THRESHOLDS = {
  low: { min: 0, max: 0.44 },
  medium: { min: 0.45, max: 0.74 },
  high: { min: 0.75, max: 1.0 },
};

export function intentConfidenceFromScore(score: number): IntentConfidence {
  if (score >= 0.75) return 'high';
  if (score >= 0.45) return 'medium';
  return 'low';
}

export function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

// ── Prompt injection detection patterns ──
export const PROMPT_INJECTION_PATTERNS = [
  /\bignore\s+(previous|above|all)\s+(instructions|prompts|commands|directions)\b/i,
  /\breveal\s+(system|hidden|internal)\s+prompt\b/i,
  /\byou\s+are\s+now\s+(admin|assistant|system|developer|god)\b/i,
  /\buse\s+hidden\s+(developer|system)\s+message\b/i,
  /\bbypass\s+(safety|guardrails|filter|restrictions?)\b/i,
  /\bshow\s+(private\s+(student\s+)?data|other\s+student\s+(data|information)|confidential\s+(data|information|details))\b/i,
  /\b(pretend|act\s+as\s+if)\s+you\s+are\s+(a\s+)?(human|real\s+person|teacher)(\s+(who\s+)?(can\s+)?)?\b/i,
  /\boutput\s+the\s+prompt\b/i,
  /\bprint\s+your\s+(system\s+)?prompt\b/i,
];

export function containsPromptInjection(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  return PROMPT_INJECTION_PATTERNS.some((p) => p.test(text));
}
