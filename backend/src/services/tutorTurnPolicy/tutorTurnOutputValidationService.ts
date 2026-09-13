import type { TutorTurnPolicyPacket } from './tutorTurnPolicyContracts';

export interface OutputValidationInput {
  requestId: string;
  draftOutput: string;
  policyPacket: TutorTurnPolicyPacket;
}

export interface OutputValidationResult {
  valid: boolean;
  requiresRevision: boolean;
  blocked: boolean;
  violationCodes: string[];
  repairInstructions: string[];
}

const FINAL_ANSWER_PATTERNS = [
  /\b(the answer is|the final answer is|here is the answer|the solution is)\b/i,
];

const DIRECT_RULING_PATTERNS = [
  /\b(in islam|according to islam|islam says|the islamic ruling|fatwa|haram|halal)\b.{0,100}\b(you should|you must|it is obligatory|it is forbidden)\b/i,
];

const FABRICATED_SOURCE_PATTERNS = [
  /\b(the quran says|quran says|in the quran|allah says in the quran)\b.{0,100}\b(verse|ayah|surah)\b.{0,50}\d+:\d+\b(?!\s*(?:says|states|mentions|commands))\b/i,
];

const UNSAFE_ESCALATION_PATTERNS = [
  /\b(i am escalating|this is a safeguarding concern|you need help|you are in danger|i am telling your teacher)\b/i,
  /\b(i will report you|i am reporting this|this is being reported)\b/i,
];

const PRIVATE_DATA_PATTERNS = [
  /\b(your password|your token|your session|api_key|secret_key|private_key)\b/i,
];

function hasViolation(text: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(text));
}

export function validateTutorTurnOutput(input: OutputValidationInput): OutputValidationResult {
  const { draftOutput, policyPacket } = input;
  const text = String(draftOutput || '').trim();
  const violationCodes: string[] = [];
  const repairInstructions: string[] = [];

  if (!text) {
    return {
      valid: true,
      requiresRevision: false,
      blocked: false,
      violationCodes: [],
      repairInstructions: [],
    };
  }

  if (policyPacket.noFinalAnswer.finalAnswerBlocked && hasViolation(text, FINAL_ANSWER_PATTERNS)) {
    violationCodes.push('final_answer_given_when_blocked');
    repairInstructions.push('Remove the final answer. Replace with a guiding question or hint.');
  }

  if (hasViolation(text, UNSAFE_ESCALATION_PATTERNS)) {
    violationCodes.push('unsafe_safeguarding_escalation');
    repairInstructions.push('Do not escalate normal learning frustration as safeguarding. Use supportive Socratic guidance.');
  }

  if (hasViolation(text, PRIVATE_DATA_PATTERNS)) {
    violationCodes.push('private_data_leak');
    repairInstructions.push('Remove any reference to private data, tokens, or secrets.');
  }

  if (policyPacket.deenPolicyContext) {
    if (hasViolation(text, DIRECT_RULING_PATTERNS)) {
      violationCodes.push('direct_ruling_when_referral_required');
      repairInstructions.push('Do not give direct Islamic rulings. Refer to a qualified scholar or use Deen policy boundaries.');
    }

    if (hasViolation(text, FABRICATED_SOURCE_PATTERNS)) {
      violationCodes.push('fabricated_islamic_source');
      repairInstructions.push('Do not fabricate Quran or Hadith references. Verify sources through IslamicSourceRegistryService.');
    }
  }

  if (policyPacket.responseBoundary.disallowedBehaviors.some(b => text.toLowerCase().includes(b.toLowerCase().replace(/_/g, ' ')))) {
    violationCodes.push('disallowed_behavior_detected');
    repairInstructions.push('Ensure the response does not use any disallowed behavior patterns from the response boundary.');
  }

  const requiresRevision = violationCodes.length > 0;
  const hasBlockingViolation = violationCodes.some(code =>
    ['final_answer_given_when_blocked', 'direct_ruling_when_referral_required', 'fabricated_islamic_source', 'private_data_leak'].includes(code)
  );

  return {
    valid: !requiresRevision,
    requiresRevision,
    blocked: hasBlockingViolation,
    violationCodes,
    repairInstructions,
  };
}
