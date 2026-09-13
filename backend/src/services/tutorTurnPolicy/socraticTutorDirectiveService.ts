import type { SocraticTutorDirective } from './socraticDirectiveContracts';
import type { NoFinalAnswerPolicyResult } from './noFinalAnswerContracts';
import type { AcademicIntegrityPolicyResult } from './academicIntegrityContracts';

export interface SocraticDirectiveInput {
  requestId: string;
  noFinalAnswer: NoFinalAnswerPolicyResult;
  academicIntegrity: AcademicIntegrityPolicyResult;
  curriculumContext?: unknown;
  deenPolicyContext?: unknown;
  learnerAge?: number;
  learnerGrade?: string;
}

export function buildSocraticTutorDirective(input: SocraticDirectiveInput): SocraticTutorDirective {
  const { noFinalAnswer, academicIntegrity, curriculumContext, deenPolicyContext, learnerAge, learnerGrade } = input;

  const isKindergarten = learnerAge !== undefined && learnerAge <= 6;
  const isYoungLearner = learnerAge !== undefined && learnerAge <= 10;
  const isDeenActive = deenPolicyContext !== undefined && deenPolicyContext !== null;
  const integrityHighRisk = academicIntegrity.integrityRisk === 'high';

  const explanationDepth = isKindergarten
    ? 'very_simple'
    : isYoungLearner
      ? 'simple'
      : 'moderate';

  const adaptivePacing = isKindergarten || isYoungLearner
    ? 'slow_support'
    : 'balanced';

  const toneRules: string[] = [
    'use_encouraging_language',
    'do_not_shame_student',
    'do_not_dismiss_confusion',
  ];

  if (isKindergarten) {
    toneRules.push('use_warm_gentle_tone', 'keep_sentences_short');
  }
  if (isYoungLearner) {
    toneRules.push('use_simple_words', 'give_positive_reinforcement');
  }
  if (isDeenActive) {
    toneRules.push('respect_islamic_sensitivity', 'do_not_invent_sources');
  }

  const teachingMethodRules: string[] = [
    'ask_guiding_question_before_explaining',
    'check_learner_understanding',
    'build_on_prior_knowledge',
  ];

  if (integrityHighRisk) {
    teachingMethodRules.push('maintain_firm_socratic_stance');
    teachingMethodRules.push('redirect_to_concept_understanding');
  }

  const validationModes: string[] = ['reasoning_check', 'step_validation'];

  if (isDeenActive) {
    validationModes.push('deen_source_validation');
  }

  return {
    shouldUseSocraticMethod: true,
    maxQuestions: isKindergarten ? 1 : 1,
    maxHintsBeforeAttempt: isKindergarten ? 1 : 1,
    mustAskOneGuidingQuestion: true,
    mustCheckLearnerAttempt: integrityHighRisk || noFinalAnswer.mustAskLearnerToTry,
    mustAvoidFinalAnswer: noFinalAnswer.mustAvoidFinalAnswer || integrityHighRisk,
    explanationDepth,
    toneRules,
    teachingMethodRules,
    validationModes,
    adaptivePacing,
  };
}
