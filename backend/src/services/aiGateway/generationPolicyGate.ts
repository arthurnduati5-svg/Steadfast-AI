import type { SafeGenerationRequest, GenerationMode } from './safeGenerationContracts';

export interface GenerationPolicyResult {
  allowedToGenerate: boolean;
  generationMode: GenerationMode;
  blockedReason?: string;
  safeFallbackMessage?: string;
}

export function evaluateGenerationPolicy(input: SafeGenerationRequest): GenerationPolicyResult {
  const policy = input.policyPacket;

  if (policy.decision === 'block') {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_refusal',
      blockedReason: `Policy blocked: ${policy.blockReasons?.join(', ') || 'unknown'}`,
      safeFallbackMessage: policy.safeStudentMessage || 'I am not able to answer that right now. Please ask a learning-related question.',
    };
  }

  if (policy.decision === 'refer') {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_refusal',
      blockedReason: 'Policy decision: refer',
      safeFallbackMessage: policy.safeStudentMessage || 'I need to refer this to a teacher or scholar. Please ask your teacher for guidance.',
    };
  }

  if (policy.decision === 'clarify_first') {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_clarification',
      blockedReason: 'Policy decision: clarify_first',
      safeFallbackMessage: policy.safeClarifyingQuestion || 'Could you please clarify what you are asking?',
    };
  }

  if (policy.safety?.seriousRisk) {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_refusal',
      blockedReason: 'Serious safety risk detected',
      safeFallbackMessage: policy.safeStudentMessage || 'I am here to support you. Please reach out to a trusted adult or counselor for help.',
    };
  }

  if (policy.safety?.safeguardingCandidate) {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_refusal',
      blockedReason: 'Safeguarding candidate',
      safeFallbackMessage: policy.safeStudentMessage || 'Let us focus on your learning. If something is bothering you, please talk to a trusted adult.',
    };
  }

  if (policy.academicIntegrity?.directAnswerRequested && !policy.academicIntegrity?.learnerAttemptPresent) {
    return {
      allowedToGenerate: true,
      generationMode: 'hint_only',
      blockedReason: undefined,
    };
  }

  if (policy.noFinalAnswer?.finalAnswerBlocked) {
    const hasAttempt = policy.academicIntegrity?.learnerAttemptPresent;
    return {
      allowedToGenerate: true,
      generationMode: hasAttempt ? 'attempt_feedback' : 'hint_only',
      blockedReason: undefined,
    };
  }

  if (policy.allowedMode === 'hint_only') {
    return {
      allowedToGenerate: true,
      generationMode: 'hint_only',
    };
  }

  if (policy.allowedMode === 'attempt_feedback') {
    return {
      allowedToGenerate: true,
      generationMode: 'attempt_feedback',
    };
  }

  if (policy.allowedMode === 'concept_explanation') {
    return {
      allowedToGenerate: true,
      generationMode: 'concept_explanation',
    };
  }

  if (policy.allowedMode === 'referral_support') {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_deen_referral',
      blockedReason: 'Deen scholar referral required',
      safeFallbackMessage: policy.safeStudentMessage || 'For this question, it is best to ask a qualified scholar or teacher.',
    };
  }

  const deenCtx = input.safeContext?.deenPolicyContext as { requiresApprovedSource?: boolean; requiresScholarReferral?: boolean } | undefined;
  if (deenCtx?.requiresApprovedSource || deenCtx?.requiresScholarReferral) {
    return {
      allowedToGenerate: false,
      generationMode: 'safe_deen_referral',
      blockedReason: 'Deen policy requires approved source or scholar referral',
      safeFallbackMessage: 'For Islamic questions, I can only provide information from approved sources. Please ask a qualified scholar for detailed guidance.',
    };
  }

  return {
    allowedToGenerate: true,
    generationMode: 'socratic_tutoring',
  };
}
