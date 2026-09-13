// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Tutor Policy Contracts v1
// Defines the core types for the Socratic automation policy layer:
// equal rights, no-final-answer, academic integrity, challenge
// calibration, weak-area growth, privacy, safeguarding, teacher
// insight, and the runtime policy packet.
// ─────────────────────────────────────────────────────────────

export type SocraticSupportMode =
  | 'question_first'
  | 'hint_first'
  | 'guided_steps'
  | 'concept_reteach'
  | 'misconception_check'
  | 'worked_example_without_final_answer'
  | 'similar_practice'
  | 'challenge_extension'
  | 'reflection_prompt'
  | 'safeguarding_escalation';

export type SocraticRiskLevel =
  | 'none'
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type AcademicIntegritySignal =
  | 'none'
  | 'possible_homework_answer_request'
  | 'direct_final_answer_request'
  | 'copy_paste_solution_request'
  | 'exam_or_quiz_cheating_signal'
  | 'plagiarism_signal'
  | 'repeated_shortcut_seeking'
  | 'allowed_learning_help';

export type SafeguardingSignal =
  | 'none'
  | 'self_harm'
  | 'suicidal_intent'
  | 'severe_depression_or_crisis'
  | 'harm_to_others'
  | 'abuse'
  | 'exploitation'
  | 'grooming'
  | 'violence'
  | 'serious_coercion'
  | 'credible_child_safety_risk';

export type ChallengeCalibrationLevel =
  | 'too_easy'
  | 'productive_struggle'
  | 'too_hard'
  | 'blocked'
  | 'ready_for_challenge'
  | 'needs_reteach'
  | 'needs_foundation';

export type EqualStudentRightsPolicy = {
  canAccessTutor: true;
  canAccessHints: true;
  canAccessPractice: true;
  canAccessArtifactHelp: true;
  canAccessVideoSupport: true;
  canAccessRevisionSupport: true;
  canReceiveSocraticGuidance: true;
  canReceiveFinalAnswers: false;
  canBypassAcademicIntegrity: false;
  canBypassSafeguardingPolicy: false;
};

export type LearnerAdaptationContext = {
  studentId: string;
  gradeLevel?: string | null;
  educationLevel?: string | null;
  languagePreference?: string | null;
  learningPreferences: string[];
  masteryLevel?: number | null;
  confidenceLevel?: number | null;
  thinkingLevel?: 'foundation' | 'developing' | 'secure' | 'advanced' | null;
  recentMistakePatterns: string[];
  misconceptions: string[];
  weakAreas: string[];
  strengths: string[];
  recentActivityRefs: string[];
  artifactContextRefs: string[];
};

export type SocraticRuntimePolicyPacket = {
  studentRights: EqualStudentRightsPolicy;
  supportMode: SocraticSupportMode;
  integritySignal: AcademicIntegritySignal;
  safeguardingSignal: SafeguardingSignal;
  safeguardingRiskLevel: SocraticRiskLevel;
  challengeLevel: ChallengeCalibrationLevel;
  noFinalAnswerRequired: boolean;
  shouldEscalateToHuman: boolean;
  teacherAdminInsightAllowed: boolean;
  privacyMode: 'private_by_default' | 'minimum_necessary_safeguarding_disclosure';
  recommendedTutorMove: string;
  forbiddenTutorMoves: string[];
  allowedTutorMoves: string[];
  learnerAdaptation: LearnerAdaptationContext;
  auditWarnings: string[];
};

// ── Hint Ladder Types ──

export type HintLevel =
  | 1  // orientation hint
  | 2  // recall prompt
  | 3  // concept clue
  | 4  // worked micro-step
  | 5  // misconception contrast
  | 6  // similar example
  | 7  // next-step prompt
  | 8; // reflection check

export type QuestionType =
  | 'clarify_what_is_being_asked'
  | 'identify_knowns_and_unknowns'
  | 'activate_prior_knowledge'
  | 'ask_for_first_step'
  | 'check_misconception'
  | 'ask_why'
  | 'ask_how_they_know'
  | 'ask_for_alternative_method'
  | 'ask_to_explain_in_own_words'
  | 'ask_to_transfer_idea_to_similar_problem';

// ── Growth Evidence Types ──

export type GrowthEvidenceLevel = 'none' | 'weak' | 'moderate' | 'strong' | 'mastery_candidate';

export interface GrowthEvidenceAssessment {
  level: GrowthEvidenceLevel;
  reason: string;
  requiresLearnerWork: boolean;
  teacherInsightAllowed: boolean;
  warnings: string[];
}

// ── Safeguarding Disclosure Packet ──

export interface SafeguardingDisclosurePacket {
  studentId: string;
  riskType: SafeguardingSignal;
  riskLevel: SocraticRiskLevel;
  safeSummary: string;
  minimumNecessaryEvidenceRefs: string[];
  recommendedHumanRole: string;
  auditRequired: boolean;
  rawChatIncluded: boolean;
}

// ── Teacher/Admin Insight Types ──

export type TeacherInsightCategory =
  | 'repeated_weakness_after_automation'
  | 'class_wide_misconception_pattern'
  | 'resource_not_helping'
  | 'student_blocked_after_multiple_support_attempts'
  | 'academic_integrity_pattern'
  | 'safeguarding_exception'
  | 'system_confidence_low';

export type ForbiddenInsightCategory =
  | 'ordinary_wrong_answer'
  | 'single_confusion'
  | 'slow_learning'
  | 'different_belief'
  | 'student_preference'
  | 'normal_hint_usage'
  | 'normal_practice_failure';
