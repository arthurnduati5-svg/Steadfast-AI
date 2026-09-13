import type { SafetyPolicyInput, SafetyPolicyResult, SafetyRiskCategory, SafetyRiskLevel } from './safetyPolicyContracts';

const SELF_HARM_PATTERNS = [
  /\b(kill myself|end my life|i want to die|i will die|suicide|self harm|self-harm|cut myself|harm myself|i feel like dying|better off dead|no reason to live)\b/i,
  /\b(i want|i am going|i plan|i will).{0,30}(kill|end|hurt|harm|cut).{0,30}(myself|my life|me)\b/i,
];

const ABUSE_EXPLOITATION_PATTERNS = [
  /\b(raped|i was raped|sexual assault|molested|abused me|being exploited|forced to do|being groomed|grooming)\b/i,
  /\bsomeone.{0,30}(is hurting|is hitting|is touching|is making|is forcing|is threatening|is blackmailing).{0,30}(me|my)\b/i,
  /\b(hurting|hitting|touching|abusing|harming).{0,20}(me at home|me at school|me physically|me sexually)\b/i,
];

const THREAT_VIOLENCE_PATTERNS = [
  /\b(i will|i am going to).{0,30}(hurt|harm|kill).{0,30}(them|him|her|someone|people|classmate|teacher)\b/i,
  /\b(shooting|stabbing|bomb|terrorist attack|school shooting|weapon).{0,30}(school|class|attack)\b/i,
];

const NORMAL_FRUSTRATION_PATTERNS = [
  /\b(i hate|i don't understand|i am stuck|this is hard|i can't do this|confused|i struggle|i got it wrong|i made a mistake)\b/i,
];

const RELIGIOUS_DOUBT_PATTERNS = [
  /\b(i doubt|i am not sure about|questioning my (faith|religion|belief)|religious doubt)\b/i,
];

const ACADEMIC_USE_PATTERNS = [
  /\b(define|definition|meaning|what is|explain|history|essay|research|paper|project|homework|assignment|class|lesson|book|article)\b.*\b(suicide|depression|abuse|violence|self.?harm|grooming)\b/i,
];

function isAcademicUseOfSensitiveTerms(text: string): boolean {
  return ACADEMIC_USE_PATTERNS.some(p => p.test(text));
}

function isNormalFrustration(text: string): boolean {
  return NORMAL_FRUSTRATION_PATTERNS.some(p => p.test(text));
}

function isReligiousDoubt(text: string): boolean {
  return RELIGIOUS_DOUBT_PATTERNS.some(p => p.test(text));
}

export function evaluateSafetyPolicy(input: SafetyPolicyInput): SafetyPolicyResult {
  const text = String(input.messageText || '').trim();

  if (!text) {
    return {
      riskCategory: 'none',
      riskLevel: 'none',
      seriousRisk: false,
      safeguardingCandidate: false,
      continueTutoringAllowed: true,
      reasons: ['empty_message'],
    };
  }

  if (isAcademicUseOfSensitiveTerms(text)) {
    return {
      riskCategory: 'none',
      riskLevel: 'none',
      seriousRisk: false,
      safeguardingCandidate: false,
      continueTutoringAllowed: true,
      reasons: ['academic_use_of_sensitive_terms'],
    };
  }

  if (isNormalFrustration(text)) {
    return {
      riskCategory: 'normal_learning_frustration',
      riskLevel: 'none',
      seriousRisk: false,
      safeguardingCandidate: false,
      continueTutoringAllowed: true,
      reasons: ['normal_learning_frustration'],
    };
  }

  if (isReligiousDoubt(text)) {
    return {
      riskCategory: 'none',
      riskLevel: 'none',
      seriousRisk: false,
      safeguardingCandidate: false,
      continueTutoringAllowed: true,
      reasons: ['religious_doubt_not_safeguarding'],
    };
  }

  for (const pattern of SELF_HARM_PATTERNS) {
    if (pattern.test(text)) {
      const isImminent = /\b(now|tonight|today|right now|immediately)\b/i.test(text);
      return {
        riskCategory: 'self_harm',
        riskLevel: isImminent ? 'critical' : 'high',
        seriousRisk: true,
        safeguardingCandidate: true,
        continueTutoringAllowed: false,
        safeStudentMessage: 'I hear you. Please talk to a trusted adult nearby — a parent, teacher, or school counselor. You are not alone.',
        reasons: ['self_harm_detected', isImminent ? 'imminent_risk' : 'high_risk'],
      };
    }
  }

  for (const pattern of ABUSE_EXPLOITATION_PATTERNS) {
    if (pattern.test(text)) {
      return {
        riskCategory: 'abuse',
        riskLevel: 'high',
        seriousRisk: true,
        safeguardingCandidate: true,
        continueTutoringAllowed: false,
        safeStudentMessage: 'I hear you. It sounds like you are going through something difficult. Please consider talking to a trusted adult such as a parent, teacher, or school counselor who can support you.',
        reasons: ['abuse_or_exploitation_detected'],
      };
    }
  }

  for (const pattern of THREAT_VIOLENCE_PATTERNS) {
    if (pattern.test(text)) {
      return {
        riskCategory: 'violence',
        riskLevel: 'high',
        seriousRisk: true,
        safeguardingCandidate: true,
        continueTutoringAllowed: false,
        safeStudentMessage: 'I hear you. Please talk to a trusted adult nearby — a parent, teacher, or school counselor. You are not alone.',
        reasons: ['violence_or_threat_detected'],
      };
    }
  }

  return {
    riskCategory: 'none',
    riskLevel: 'none',
    seriousRisk: false,
    safeguardingCandidate: false,
    continueTutoringAllowed: true,
    reasons: ['no_safety_risk_detected'],
  };
}
