// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Tutor Automation Policy Service v1
// Central orchestration of the Socratic policy layer.
// Coordinates equal rights, no-final-answer, academic integrity,
// challenge calibration, weak-area growth, privacy, safeguarding,
// and teacher insight policies into one decision flow.
//
// This service is a convenience wrapper that calls individual
// policy services and aggregates their results. Each individual
// policy can also be called independently.
// ─────────────────────────────────────────────────────────────

import { getEqualStudentRightsPolicy } from './equalStudentRightsPolicyService';
import { classifyFinalAnswerRisk } from './noFinalAnswerPolicyService';
import { classifyAcademicIntegritySignal } from './academicIntegrityGuardService';
import { calibrateChallengeLevel } from './challengeCalibrationService';
import { buildWeakAreaGrowthPlan } from './weakAreaGrowthLoopService';
import { assessSafeguardingRisk } from './safeguardingExceptionPolicyService';
import { checkDisclosureAllowed, getPrivacyMode } from './privacyByDefaultPolicyService';
import { evaluateTeacherInsightEscalation } from './teacherInsightEscalationPolicyService';
import type {
  AcademicIntegritySignal,
  SocraticRuntimePolicyPacket,
  LearnerAdaptationContext,
} from './socraticTutorPolicyContracts';

export interface AutomationPolicyInput {
  studentId: string;
  message: string;
  topic?: string | null;
  gradeLevel?: string | null;
  masteryLevel?: number | null;
  confidenceLevel?: number | null;
  attemptCount?: number;
  recentIntegritySignals?: AcademicIntegritySignal[];
  weakAreas?: string[];
  misconceptions?: string[];
  artifactContext?: unknown;
  learningMode?: string | null;
}

export interface AutomationPolicyOutput {
  packet: SocraticRuntimePolicyPacket;
  auditWarnings: string[];
}

/**
 * Build a complete Socratic automation policy assessment for a tutor turn.
 */
export function buildAutomationPolicy(input: AutomationPolicyInput): AutomationPolicyOutput {
  const auditWarnings: string[] = [];
  const {
    studentId,
    message,
    topic,
    gradeLevel,
    masteryLevel,
    confidenceLevel,
    attemptCount,
    recentIntegritySignals,
    weakAreas,
    misconceptions,
    artifactContext,
    learningMode,
  } = input;

  // 1. Equal rights (always the same for every student)
  const studentRights = getEqualStudentRightsPolicy(studentId);

  // 2. No-final-answer policy
  const finalAnswerRisk = classifyFinalAnswerRisk({
    message,
    artifactContext,
    learningMode,
  });

  // 3. Academic integrity guard
  const integrityResult = classifyAcademicIntegritySignal({
    message,
    recentIntegritySignals: recentIntegritySignals || [],
    activityType: learningMode,
  });

  // 4. Safeguarding assessment
  const safeguardingResult = assessSafeguardingRisk({
    message,
    studentId,
  });

  // 5. Privacy mode
  const privacyMode = getPrivacyMode(safeguardingResult.isActiveSafeguardingEvent);

  // 6. Disclosure check
  checkDisclosureAllowed({
    dataType: 'raw_student_chat',
    isSafeguardingException: safeguardingResult.isActiveSafeguardingEvent,
    isMinimumNecessary: safeguardingResult.isActiveSafeguardingEvent,
  });

  // 7. Challenge calibration
  const calibration = calibrateChallengeLevel({
    masteryLevel: masteryLevel ?? null,
    confidenceLevel: confidenceLevel ?? null,
    attemptCount: attemptCount ?? 0,
    misconceptionCount: misconceptions?.length ?? 0,
    repeatedWeakArea: (weakAreas?.length ?? 0) > 0,
    gradeLevel: gradeLevel ?? null,
  });

  // 8. Weak-area growth plan
  const growthPlan = buildWeakAreaGrowthPlan({
    studentId,
    topic: topic ?? undefined,
    weakAreas: weakAreas || [],
    misconceptions: misconceptions || [],
    masteryLevel: masteryLevel ?? null,
    recentAttemptCount: attemptCount ?? null,
    confidenceLevel: confidenceLevel ?? null,
  });

  // 9. Teacher/admin insight assessment
  const insightResult = evaluateTeacherInsightEscalation({
    studentId,
    category: growthPlan.nextAction === 'escalate_exception' ? 'repeated_weakness_after_automation' : 'system_confidence_low',
    riskLevel: safeguardingResult.riskLevel,
    attemptCount: attemptCount ?? 0,
    isSafeguardingException: safeguardingResult.isActiveSafeguardingEvent,
  });

  // 10. Build learner adaptation context
  const learnerAdaptation: LearnerAdaptationContext = {
    studentId,
    gradeLevel: gradeLevel || null,
    masteryLevel: masteryLevel ?? null,
    confidenceLevel: confidenceLevel ?? null,
    thinkingLevel: (masteryLevel ?? -1) >= 0
      ? ((masteryLevel ?? 0) >= 75 ? 'secure' : (masteryLevel ?? 0) >= 45 ? 'developing' : 'foundation')
      : null,
    learningPreferences: [],
    recentMistakePatterns: [],
    misconceptions: misconceptions || [],
    weakAreas: weakAreas || [],
    strengths: [],
    recentActivityRefs: [],
    artifactContextRefs: [],
  };

  // 11. Build the runtime policy packet
  const noFinalAnswerRequired = finalAnswerRisk.noFinalAnswerRequired || integrityResult.signal !== 'none';

  const allowedMoves = [
    ...finalAnswerRisk.allowedTutorMoves,
    integrityResult.allowedResponseMode === 'question_first' ? 'ask_question' : 'give_hint',
    growthPlan.nextAction === 'assign_foundation_practice' ? 'foundation_practice' : 'standard_practice',
    growthPlan.nextAction === 'assign_challenge_practice' ? 'challenge_practice' : null,
  ].filter(Boolean) as string[];

  const forbiddenMoves = [
    ...finalAnswerRisk.forbiddenTutorMoves,
    'give_final_answer',
    'provide_solution',
    'output_answer_key',
  ];

  const packet: SocraticRuntimePolicyPacket = {
    studentRights,
    supportMode: safeguardingResult.isActiveSafeguardingEvent
      ? 'safeguarding_escalation'
      : integrityResult.allowedResponseMode === 'reflection_prompt'
        ? 'reflection_prompt'
        : calibration.recommendedSupportMode,
    integritySignal: integrityResult.signal !== 'none' ? integrityResult.signal : finalAnswerRisk.integritySignal,
    safeguardingSignal: safeguardingResult.signal,
    safeguardingRiskLevel: safeguardingResult.riskLevel,
    challengeLevel: calibration.challengeLevel,
    noFinalAnswerRequired,
    shouldEscalateToHuman: safeguardingResult.isActiveSafeguardingEvent || growthPlan.nextAction === 'escalate_exception',
    teacherAdminInsightAllowed: insightResult.insightAllowed,
    privacyMode,
    recommendedTutorMove: noFinalAnswerRequired
      ? finalAnswerRisk.redirectInstruction || integrityResult.studentFacingRedirect || calibration.recommendedTutorMove
      : growthPlan.nextAction === 'escalate_exception'
        ? `Teacher insight needed for: ${growthPlan.targetWeakArea}`
        : calibration.recommendedTutorMove,
    forbiddenTutorMoves: [...new Set(forbiddenMoves)],
    allowedTutorMoves: [...new Set(allowedMoves)],
    learnerAdaptation,
    auditWarnings: [
      ...auditWarnings,
      ...integrityResult.studentFacingRedirect ? [`Integrity: ${integrityResult.signal}`] : [],
      ...safeguardingResult.warnings,
      ...calibration.warnings,
      ...growthPlan.warnings,
      ...insightResult.warnings,
    ],
  };

  return { packet, auditWarnings: packet.auditWarnings };
}
