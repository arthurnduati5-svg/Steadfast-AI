import type { ResponseBoundary } from './responseBoundaryContracts';
import type { SafetyPolicyResult } from './safetyPolicyContracts';
import type { AcademicIntegrityPolicyResult } from './academicIntegrityContracts';
import type { NoFinalAnswerPolicyResult } from './noFinalAnswerContracts';
import type { SocraticTutorDirective } from './socraticDirectiveContracts';

export interface ResponseBoundaryInput {
  requestId: string;
  safety: SafetyPolicyResult;
  academicIntegrity: AcademicIntegrityPolicyResult;
  noFinalAnswer: NoFinalAnswerPolicyResult;
  socraticDirective: SocraticTutorDirective;
  deenPolicyContext?: unknown;
}

export function buildResponseBoundary(input: ResponseBoundaryInput): ResponseBoundary {
  const { safety, academicIntegrity, noFinalAnswer, socraticDirective, deenPolicyContext } = input;

  const allowedBehaviors: string[] = [];
  const disallowedBehaviors: string[] = [];
  const requiredBehaviors: string[] = [];
  const policyTags: string[] = [];

  if (safety.seriousRisk) {
    policyTags.push('safety_serious_risk');
    policyTags.push(`safety_category_${safety.riskCategory}`);
    allowedBehaviors.push('provide_safe_support_message');
    allowedBehaviors.push('encourage_talking_to_trusted_adult');
    disallowedBehaviors.push('provide_normal_tutoring');
    disallowedBehaviors.push('give_final_answer');
    disallowedBehaviors.push('continue_academic_instruction');
    requiredBehaviors.push('use_minimum_necessary_disclosure');
    requiredBehaviors.push('include_safe_message');
  } else {
    allowedBehaviors.push('explain_concept');
    allowedBehaviors.push('ask_guiding_question');
    allowedBehaviors.push('check_learner_understanding');
    allowedBehaviors.push('provide_hint');
    allowedBehaviors.push('give_encouragement');
    allowedBehaviors.push('validate_reasoning');

    if (socraticDirective.shouldUseSocraticMethod) {
      requiredBehaviors.push('ask_one_guiding_question_first');
    }
  }

  if (academicIntegrity.integrityRisk !== 'none') {
    policyTags.push(`integrity_risk_${academicIntegrity.integrityRisk}`);
    policyTags.push(`integrity_category_${academicIntegrity.category}`);
    for (const disallowed of academicIntegrity.disallowedBehaviors) {
      if (!disallowedBehaviors.includes(disallowed)) {
        disallowedBehaviors.push(disallowed);
      }
    }
  }

  if (noFinalAnswer.finalAnswerBlocked) {
    policyTags.push('no_final_answer_blocked');
    for (const pattern of noFinalAnswer.disallowedPatterns) {
      if (!disallowedBehaviors.includes(pattern)) {
        disallowedBehaviors.push(pattern);
      }
    }
    if (noFinalAnswer.mustAskLearnerToTry) {
      requiredBehaviors.push('ask_for_learner_attempt');
    }
  }

  if (socraticDirective.mustAvoidFinalAnswer) {
    disallowedBehaviors.push('give_final_answer');
    disallowedBehaviors.push('provide_complete_solution');
    disallowedBehaviors.push('solve_exact_problem_for_learner');
  }

  if (deenPolicyContext) {
    policyTags.push('deen_policy_active');
    disallowedBehaviors.push('invent_islamic_source');
    disallowedBehaviors.push('provide_direct_ruling');
    disallowedBehaviors.push('make_fatwa');
    requiredBehaviors.push('use_deen_policy_boundaries');
  }

  const outputValidationRequired = safety.seriousRisk || noFinalAnswer.finalAnswerBlocked || !!deenPolicyContext;

  return {
    allowedBehaviors: [...new Set(allowedBehaviors)],
    disallowedBehaviors: [...new Set(disallowedBehaviors)],
    requiredBehaviors: [...new Set(requiredBehaviors)],
    outputValidationRequired,
    policyTags: [...new Set(policyTags)],
    safeFallbackMessage: safety.safeStudentMessage,
  };
}
