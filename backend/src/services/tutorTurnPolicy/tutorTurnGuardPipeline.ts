import type { TutorTurnPolicyInput, TutorTurnPolicyPacket, TutorTurnDecision, TutorTurnBlockReason } from './tutorTurnPolicyContracts';
import { evaluateSafetyPolicy } from './safetyPolicyService';
import { evaluateSafeguardingBoundary } from './safeguardingBoundaryService';
import { evaluateAcademicIntegrity } from './academicIntegrityPolicyService';
import { applyNoFinalAnswerPolicy } from './noFinalAnswerPolicyService';
import { buildSocraticTutorDirective } from './socraticTutorDirectiveService';
import { buildResponseBoundary } from './responseBoundaryService';

function assertValidIdentity(input: TutorTurnPolicyInput): TutorTurnDecision | null {
  if (!input.schoolId || !input.tutorLearnerId) {
    return 'block';
  }
  return null;
}

function assertSessionOwnership(input: TutorTurnPolicyInput): TutorTurnDecision | null {
  if (!input.tutorSessionId) {
    return 'block';
  }
  return null;
}

function assertValidMessage(input: TutorTurnPolicyInput): TutorTurnDecision | null {
  if (!input.messageText || String(input.messageText).trim().length === 0) {
    return 'clarify_first';
  }
  return null;
}

export async function runTutorTurnGuardPipeline(input: TutorTurnPolicyInput): Promise<TutorTurnPolicyPacket> {
  const requestId = input.requestId || `tt_${Date.now()}`;
  const blockReasons: TutorTurnBlockReason[] = [];
  let decision: TutorTurnDecision = 'allow';

  const identityBlock = assertValidIdentity(input);
  if (identityBlock === 'block') {
    blockReasons.push('missing_verified_identity');
    decision = 'block';
  }

  const sessionBlock = assertSessionOwnership(input);
  if (sessionBlock === 'block') {
    blockReasons.push('missing_session_ownership');
    decision = 'block';
  }

  const messageBlock = assertValidMessage(input);
  if (messageBlock === 'clarify_first') {
    blockReasons.push('invalid_input');
    decision = 'clarify_first';
  }

  const safety = evaluateSafetyPolicy({
    requestId,
    messageText: input.messageText || '',
    learnerAge: input.learnerAge,
    learnerGrade: input.learnerGrade,
  });

  const safeguardingBoundary = evaluateSafeguardingBoundary({
    requestId,
    safety,
  });

  if (safeguardingBoundary.safeguardingCandidate) {
    blockReasons.push('serious_safety_risk');
    blockReasons.push('safeguarding_candidate');
    decision = 'block';
  }

  const academicIntegrity = evaluateAcademicIntegrity({
    requestId,
    messageText: input.messageText || '',
    activeSchoolPage: input.clientContext?.activeSchoolPage,
    subjectHint: input.clientContext?.subjectHint,
    topicHint: input.clientContext?.topicHint,
  });

  if (academicIntegrity.category === 'test_or_exam_answer_request') {
    blockReasons.push('academic_integrity_violation');
    if (decision !== 'block') {
      decision = 'constrain';
    }
  }

  const noFinalAnswer = applyNoFinalAnswerPolicy({
    requestId,
    messageText: input.messageText || '',
    academicIntegrity,
  });

  if (noFinalAnswer.finalAnswerBlocked && decision !== 'block') {
    if (!blockReasons.includes('academic_integrity_violation')) {
      blockReasons.push('final_answer_request');
    }
    if (decision === 'allow') {
      decision = 'constrain';
    }
  }

  const socraticDirective = buildSocraticTutorDirective({
    requestId,
    noFinalAnswer,
    academicIntegrity,
    learnerAge: input.learnerAge,
    learnerGrade: input.learnerGrade,
  });

  const responseBoundary = buildResponseBoundary({
    requestId,
    safety,
    academicIntegrity,
    noFinalAnswer,
    socraticDirective,
  });

  const archivePolicyTags: string[] = [
    `safety_${safety.riskCategory}`,
    `integrity_${academicIntegrity.category}`,
    `decision_${decision}`,
    `no_final_answer_${noFinalAnswer.allowedAnswerDepth}`,
  ];

  if (safety.seriousRisk) {
    archivePolicyTags.push('safeguarding_candidate');
  }

  const allowedMode = decision === 'block' && safeguardingBoundary.safeguardingCandidate
    ? 'safe_refusal'
    : decision === 'block'
      ? 'safe_refusal'
      : decision === 'clarify_first'
        ? 'clarification_question'
        : noFinalAnswer.finalAnswerBlocked
          ? noFinalAnswer.allowedAnswerDepth === 'hint_only'
            ? 'hint_only'
            : noFinalAnswer.allowedAnswerDepth === 'clarify_only'
              ? 'study_support'
              : 'concept_explanation'
          : academicIntegrity.learnerAttemptPresent
            ? 'attempt_feedback'
            : 'normal_socratic_tutoring';

  const allowedResponseBehaviors = [...socraticDirective.teachingMethodRules, ...responseBoundary.allowedBehaviors];
  const disallowedResponseBehaviors = [...responseBoundary.disallowedBehaviors];

  return {
    requestId,
    decision,
    allowedMode,
    blockReasons,
    safety,
    academicIntegrity,
    noFinalAnswer,
    socraticDirective,
    responseBoundary,
    outputValidationRequired: responseBoundary.outputValidationRequired,
    archivePolicyTags,
    safeStudentMessage: safety.safeStudentMessage,
    safeClarifyingQuestion: decision === 'clarify_first'
      ? 'Could you share what you want help understanding? I will guide you step by step.'
      : undefined,
    allowedResponseBehaviors,
    disallowedResponseBehaviors,
  };
}
