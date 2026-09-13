import type { TutorTurnPolicyInput, TutorTurnPolicyPacket } from './tutorTurnPolicyContracts';
import type { AcademicIntegrityPolicyResult } from './academicIntegrityContracts';
import { runTutorTurnGuardPipeline } from './tutorTurnGuardPipeline';

export async function evaluateTutorTurnPolicy(input: TutorTurnPolicyInput): Promise<TutorTurnPolicyPacket> {
  if (!input.requestId) {
    input = { ...input, requestId: `tt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` };
  }

  if (!input.schoolId || !input.tutorLearnerId) {
    return buildDeniedPacket(input.requestId, 'missing_verified_identity', 'Cannot evaluate policy without verified learner identity.');
  }

  if (!input.tutorSessionId) {
    return buildDeniedPacket(input.requestId, 'missing_session_ownership', 'Cannot evaluate policy without valid tutor session.');
  }

  return runTutorTurnGuardPipeline(input);
}

function buildDeniedPacket(
  requestId: string,
  reason: 'missing_verified_identity' | 'missing_session_ownership' | 'unknown',
  message: string,
): TutorTurnPolicyPacket {
  const emptySafety = {
    riskCategory: 'none' as const,
    riskLevel: 'none' as const,
    seriousRisk: false,
    safeguardingCandidate: false,
    continueTutoringAllowed: false,
    reasons: [reason],
  };

  const emptyIntegrity = {
    category: 'unknown' as const,
    integrityRisk: 'none' as const,
    directAnswerRequested: false,
    learnerAttemptPresent: false,
    allowedSupportModes: [] as AcademicIntegrityPolicyResult['allowedSupportModes'],
    disallowedBehaviors: [] as string[],
    reasons: [reason],
  };

  const emptyNoFinalAnswer = {
    finalAnswerBlocked: false,
    allowedAnswerDepth: 'clarify_only' as const,
    mustAskLearnerToTry: false,
    mustAvoidFinalAnswer: false,
    allowedResponsePattern: 'denied',
    disallowedPatterns: [] as string[],
  };

  const emptyDirective = {
    shouldUseSocraticMethod: false,
    maxQuestions: 0,
    maxHintsBeforeAttempt: 0,
    mustAskOneGuidingQuestion: false,
    mustCheckLearnerAttempt: false,
    mustAvoidFinalAnswer: false,
    explanationDepth: 'moderate' as const,
    toneRules: [] as string[],
    teachingMethodRules: [] as string[],
    validationModes: [] as string[],
    adaptivePacing: 'unknown' as const,
  };

  const emptyBoundary = {
    allowedBehaviors: [] as string[],
    disallowedBehaviors: [] as string[],
    requiredBehaviors: [] as string[],
    outputValidationRequired: false,
    policyTags: [] as string[],
  };

  return {
    requestId,
    decision: 'block',
    allowedMode: 'safe_refusal',
    blockReasons: [reason],
    safety: emptySafety,
    academicIntegrity: emptyIntegrity,
    noFinalAnswer: emptyNoFinalAnswer,
    socraticDirective: emptyDirective,
    responseBoundary: emptyBoundary,
    outputValidationRequired: false,
    archivePolicyTags: ['policy_denied', reason],
    safeStudentMessage: message,
    allowedResponseBehaviors: [],
    disallowedResponseBehaviors: [],
  };
}
