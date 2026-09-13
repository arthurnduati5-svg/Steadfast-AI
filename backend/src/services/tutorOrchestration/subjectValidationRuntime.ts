import type { StepCheckResult } from './stepCheckingContracts';

export type SubjectValidationMode =
  | 'numeric_validation'
  | 'science_logic_validation'
  | 'reasoning_clarity_validation'
  | 'language_expression_validation'
  | 'phonics_sound_validation'
  | 'reflection_validation'
  | 'creativity_effort_validation'
  | 'deen_source_sensitive_validation'
  | 'no_strict_validation';

export interface SubjectValidationInput {
  requestId: string;
  learnerAttempt?: string;
  validationModes: SubjectValidationMode[];
  deenSourceSensitive?: boolean;
}

export interface SubjectValidationResult {
  requestId: string;
  modesApplied: SubjectValidationMode[];
  isValid: boolean;
  reasoning: string;
  validationDetails: Array<{
    mode: SubjectValidationMode;
    passed: boolean;
    note: string;
  }>;
}

function validateNumeric(attempt: string): { passed: boolean; note: string } {
  const hasNumber = /\d/.test(attempt);
  const hasOperator = /[+\-*/=]/.test(attempt);
  if (hasNumber && hasOperator) {
    return { passed: true, note: 'Numeric expression detected with operators.' };
  }
  if (hasNumber) {
    return { passed: true, note: 'Numeric content detected.' };
  }
  return { passed: false, note: 'No numeric content detected.' };
}

function validateScienceLogic(attempt: string): { passed: boolean; note: string } {
  const hasReasoning = /because|therefore|so|if|then|since|due to|as a result/i.test(attempt);
  const hasCauseEffect = /causes|leads to|results in|affects|influences/i.test(attempt);
  if (hasReasoning || hasCauseEffect) {
    return { passed: true, note: 'Cause-effect or reasoning language detected.' };
  }
  return { passed: false, note: 'Limited evidence of scientific reasoning.' };
}

function validateReasoningClarity(attempt: string): { passed: boolean; note: string } {
  const hasStructure = /first|second|third|next|then|finally|step|because/i.test(attempt);
  const hasExplanation = attempt.split(/\s+/).length >= 10;
  if (hasStructure && hasExplanation) {
    return { passed: true, note: 'Clear reasoning structure detected.' };
  }
  if (hasStructure || hasExplanation) {
    return { passed: true, note: 'Some reasoning structure present.' };
  }
  return { passed: false, note: 'Reasoning could be more clearly explained.' };
}

function validateLanguageExpression(attempt: string): { passed: boolean; note: string } {
  const wordCount = attempt.split(/\s+/).length;
  const hasSentences = (attempt.match(/[.!?]/g) || []).length >= 2;
  if (wordCount >= 20 && hasSentences) {
    return { passed: true, note: 'Good expression with multiple sentences.' };
  }
  if (wordCount >= 10) {
    return { passed: true, note: 'Expression detected, could be expanded.' };
  }
  return { passed: false, note: 'Expression is very brief.' };
}

function validatePhonicsSound(attempt: string): { passed: boolean; note: string } {
  if (attempt.length > 0) {
    return { passed: true, note: 'Phonics attempt recorded.' };
  }
  return { passed: false, note: 'No phonics content detected.' };
}

function validateReflection(attempt: string): { passed: boolean; note: string } {
  const hasReflection = /think|feel|believe|learn|understand|realise|realize|reflect|meaning/i.test(attempt);
  const hasPersonalPerspective = /i think|i feel|i believe|i learned|i understand|for me|my understanding/i.test(attempt);
  if (hasReflection || hasPersonalPerspective) {
    return { passed: true, note: 'Reflective thinking detected.' };
  }
  return { passed: false, note: 'Limited evidence of reflection.' };
}

function validateCreativityEffort(attempt: string): { passed: boolean; note: string } {
  if (attempt.length > 0) {
    return { passed: true, note: 'Effort acknowledged and valued.' };
  }
  return { passed: false, note: 'No content to evaluate.' };
}

function validateDeenSourceSensitive(_attempt: string): { passed: boolean; note: string } {
  return { passed: false, note: 'Deen source-sensitive validation requires policy referral.' };
}

function validateNoStrict(_attempt: string): { passed: boolean; note: string } {
  return { passed: true, note: 'No strict validation - effort acknowledged.' };
}

function validateSingle(attempt: string, mode: SubjectValidationMode): { passed: boolean; note: string } {
  switch (mode) {
    case 'numeric_validation': return validateNumeric(attempt);
    case 'science_logic_validation': return validateScienceLogic(attempt);
    case 'reasoning_clarity_validation': return validateReasoningClarity(attempt);
    case 'language_expression_validation': return validateLanguageExpression(attempt);
    case 'phonics_sound_validation': return validatePhonicsSound(attempt);
    case 'reflection_validation': return validateReflection(attempt);
    case 'creativity_effort_validation': return validateCreativityEffort(attempt);
    case 'deen_source_sensitive_validation': return validateDeenSourceSensitive(attempt);
    case 'no_strict_validation': return validateNoStrict(attempt);
  }
}

export function validateSubjectResponse(input: SubjectValidationInput): SubjectValidationResult {
  const attempt = input.learnerAttempt || '';
  const details = input.validationModes.map(mode => ({
    mode,
    ...validateSingle(attempt, mode),
  }));

  const allPassed = details.every(d => d.passed);
  const anyPassed = details.some(d => d.passed);

  return {
    requestId: input.requestId,
    modesApplied: input.validationModes,
    isValid: input.validationModes.length === 0 || allPassed || (attempt.length > 0 && anyPassed),
    reasoning: allPassed
      ? 'All validation checks passed.'
      : anyPassed
        ? 'Some validation checks passed. Review the details below.'
        : 'Validation checks did not pass. Encourage the learner to try again.',
    validationDetails: details,
  };
}
