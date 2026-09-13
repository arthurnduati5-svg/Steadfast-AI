import type { GenerationOutputValidationInput, GenerationOutputValidationResult, GenerationValidationDecision } from './generationOutputValidationContracts';
import { logger } from '../../utils/logger';

const FINAL_ANSWER_PATTERNS = [
  /\bthe answer is\b/i,
  /\bhere is the solution\b/i,
  /\bthe correct answer\b/i,
  /\byou should get\b/i,
  /\bthe result is\b/i,
  /\bhere's the answer\b/i,
  /\banswer:?\s*\d+[\s.]*$/im,
  /\bfinal answer:?\b/i,
  /\bthe answer to your (homework|question|problem)\b/i,
];

const FABRICATED_QURAN_PATTERNS = [
  /\b(as Allah says|the Qur'an says|Qur'an [\d]+:[\d]+|Surah [\w]+|ayat [\d]+)\b/i,
  /"[^"]*" \(Qur'an\b/i,
];

const FABRICATED_HADITH_PATTERNS = [
  /\b(the Prophet said|hadith (reported|narrated)|narrated by|Sahih (al-Bukhari|Muslim))\b/i,
  /\b(according to hadith|hadith number)\b/i,
];

const DIRECT_RULING_PATTERNS = [
  /\b(islamically|according to islam|sharia says|fatwa|halal|haram)\s*(,|\.|:)/i,
  /\byou must (do|follow|observe)\b.*\b(islam|allah|quran|hadith)\b/i,
];

const PRIVATE_LEAKAGE_PATTERNS = [
  /\b(password|secret|token|api[_-]?key|apikey)\s*[:=]\s*\S+/i,
  /\b(password|secret|token|api\s*key)\s+is\s+\S+/i,
  /\b(bearer\s+\S+)\b/i,
  /\b(authorization\s*:\s*\S+)\b/i,
];

function checkFinalAnswerViolation(output: string): string[] {
  const violations: string[] = [];
  for (const pattern of FINAL_ANSWER_PATTERNS) {
    if (pattern.test(output)) {
      violations.push('final_answer_violation');
      break;
    }
  }
  return violations;
}

function checkDeenSourceViolation(output: string): string[] {
  const violations: string[] = [];
  for (const pattern of FABRICATED_QURAN_PATTERNS) {
    if (pattern.test(output)) {
      violations.push('fabricated_quran_claim');
      break;
    }
  }
  for (const pattern of FABRICATED_HADITH_PATTERNS) {
    if (pattern.test(output)) {
      violations.push('fabricated_hadith_claim');
      break;
    }
  }
  return violations;
}

function checkDirectRulingViolation(output: string): string[] {
  const violations: string[] = [];
  for (const pattern of DIRECT_RULING_PATTERNS) {
    if (pattern.test(output)) {
      violations.push('direct_ruling_violation');
      break;
    }
  }
  return violations;
}

function checkPrivacyLeakage(output: string): string[] {
  const violations: string[] = [];
  for (const pattern of PRIVATE_LEAKAGE_PATTERNS) {
    if (pattern.test(output)) {
      violations.push('private_data_leakage');
      break;
    }
  }
  return violations;
}

function checkEmptyOutput(output: string): boolean {
  return !output || output.trim().length === 0;
}

function attemptRepair(output: string, violationCodes: string[]): string | null {
  if (violationCodes.includes('final_answer_violation')) {
    return 'I cannot give you the final answer directly. Let me guide you: think about what you already know. What is the first step?';
  }

  if (violationCodes.includes('fabricated_quran_claim') || violationCodes.includes('fabricated_hadith_claim')) {
    return 'I should not interpret Islamic texts without verified sources. Please consult a qualified scholar or your teacher for guidance on this topic.';
  }

  if (violationCodes.includes('direct_ruling_violation')) {
    return 'Islamic rulings should be obtained from qualified scholars. I am not able to issue religious rulings. Please ask your teacher or a local imam.';
  }

  if (violationCodes.includes('private_data_leakage')) {
    return null;
  }

  return null;
}

export async function validateGenerationOutput(
  input: GenerationOutputValidationInput,
): Promise<GenerationOutputValidationResult> {
  const { requestId, draftOutput, generationRequest } = input;
  const violationCodes: string[] = [];
  const repairInstructions: string[] = [];

  if (checkEmptyOutput(draftOutput)) {
    return {
      decision: 'requires_regeneration',
      valid: false,
      violationCodes: ['empty_output'],
      repairInstructions: ['Provider returned empty output, request regeneration'],
    };
  }

  const finalAnswerViolations = checkFinalAnswerViolation(draftOutput);
  violationCodes.push(...finalAnswerViolations);
  if (finalAnswerViolations.length > 0) {
    repairInstructions.push('Output contains a final answer. Repairing with hint-only guidance.');
  }

  const deenViolations = checkDeenSourceViolation(draftOutput);
  violationCodes.push(...deenViolations);
  if (deenViolations.length > 0) {
    repairInstructions.push('Output contains fabricated or unsourced Islamic claims. Repairing with referral message.');
  }

  const rulingViolations = checkDirectRulingViolation(draftOutput);
  violationCodes.push(...rulingViolations);
  if (rulingViolations.length > 0) {
    repairInstructions.push('Output contains direct religious ruling. Repairing with referral message.');
  }

  const privacyViolations = checkPrivacyLeakage(draftOutput);
  violationCodes.push(...privacyViolations);
  if (privacyViolations.length > 0) {
    repairInstructions.push('Output contains private data leakage. Blocking output.');
  }

  const deenCtx = generationRequest.safeContext?.deenPolicyContext as { requiresApprovedSource?: boolean } | undefined;
  if (deenCtx?.requiresApprovedSource) {
    const sourceViolations = checkDeenSourceViolation(draftOutput);
    if (sourceViolations.length > 0) {
      violationCodes.push(...sourceViolations);
      repairInstructions.push('Deen source policy violation. Refer to approved sources only.');
    }
  }

  if (violationCodes.length === 0) {
    logger.info({ requestId }, 'Output validation passed');
    return {
      decision: 'valid_return',
      valid: true,
      violationCodes: [],
      repairInstructions: [],
    };
  }

  if (privacyViolations.length > 0) {
    logger.warn({ requestId, violationCodes }, 'Output validation blocked - private data leakage');
    return {
      decision: 'blocked',
      valid: false,
      violationCodes,
      repairInstructions,
      fallbackOutput: 'I encountered an issue generating a response. Please try asking your question again.',
    };
  }

  const repaired = attemptRepair(draftOutput, violationCodes);
  if (repaired) {
    logger.info({ requestId, violationCodes }, 'Output validation repaired output');
    return {
      decision: 'requires_repair',
      valid: false,
      repairedOutput: repaired,
      violationCodes,
      repairInstructions,
    };
  }

  logger.warn({ requestId, violationCodes }, 'Output validation could not repair - using safe fallback');
  return {
    decision: 'safe_fallback',
    valid: false,
    violationCodes,
    repairInstructions,
    fallbackOutput: 'I am not able to provide a complete answer to that right now. Let us focus on a smaller step. What have you learned so far?',
  };
}
