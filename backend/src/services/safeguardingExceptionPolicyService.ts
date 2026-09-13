// ─────────────────────────────────────────────────────────────
// Steadfast AI — Safeguarding Exception Policy Service v1
// Detects serious safeguarding signals (self-harm, suicidal
// intent, severe crisis, harm, abuse, exploitation, grooming,
// violence, coercion, child safety risk). Builds minimum
// necessary disclosure packets. Requires audit events.
// Does NOT escalate ordinary learning struggle, beliefs alone,
// or weakness alone.
// ─────────────────────────────────────────────────────────────

import type { SafeguardingSignal, SocraticRiskLevel } from './socraticTutorPolicyContracts';
import type { SafeguardingDisclosurePacket } from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Safeguarding Signal Detection
// ═══════════════════════════════════════════════════════════════

const SAFEGUARDING_PATTERNS: Array<{ signal: SafeguardingSignal; patterns: RegExp[]; level: SocraticRiskLevel }> = [
  {
    signal: 'self_harm',
    patterns: [
      /(i want|i am going|i plan).*(cut|hurt|harm|kill).*(myself|me)/i,
      /(self.?harm|self.?harming)/i,
      /(cut myself|hurt myself)/i,
    ],
    level: 'urgent',
  },
  {
    signal: 'suicidal_intent',
    patterns: [
      /(i want|i am going|i plan).*(kill|end).*(myself|my life)/i,
      /(suicide|suicidal|want to die|feel like dying)/i,
      /(better off dead|no reason to live|end my life)/i,
    ],
    level: 'urgent',
  },
  {
    signal: 'severe_depression_or_crisis',
    patterns: [
      /(severe depression|mental health crisis|i can't go on|i can't take it anymore)/i,
      /(numb|hopeless|worthless|despair)/i,
    ],
    level: 'high',
  },
  {
    signal: 'harm_to_others',
    patterns: [
      /(i will|i am going to).*(hurt|harm|kill).*(them|him|her|someone|people)/i,
      /(want to hurt|planning to hurt).*(people|someone|classmate|teacher)/i,
    ],
    level: 'urgent',
  },
  {
    signal: 'abuse',
    patterns: [
      /(being abused|am abused|getting abused)/i,
      /(someone is hurting|someone is hitting|someone is touching)/i,
      /(is hurting|is hitting|is touching).*(me|my)/i,
      /(abuse at home|abuse at school)/i,
    ],
    level: 'high',
  },
  {
    signal: 'exploitation',
    patterns: [
      /(being exploited|being taken advantage of|forced to do)/i,
      /(someone is making me|someone is forcing me)/i,
    ],
    level: 'high',
  },
  {
    signal: 'grooming',
    patterns: [
      /(someone online|someone older).*(asking|making|pressuring)/i,
      /(grooming|groomed|being groomed)/i,
      /(secret relationship|keep this secret|keep secrets).*(adult|older|teacher|parents|from)/i,
    ],
    level: 'high',
  },
  {
    signal: 'violence',
    patterns: [
      /(shooting|stabbing|bomb|terrorist attack|school shooting)/i,
      /(violent|violence|weapon|gun|knife).*(school|class|attack)/i,
    ],
    level: 'urgent',
  },
  {
    signal: 'serious_coercion',
    patterns: [
      /(being forced|being threatened|being blackmailed)/i,
      /(someone is threatening|someone is blackmailing)/i,
    ],
    level: 'high',
  },
  {
    signal: 'credible_child_safety_risk',
    patterns: [
      /(csam|child abuse material|trafficking|exploitation of a minor)/i,
      /(unsafe home|not safe at home|afraid to go home)/i,
    ],
    level: 'urgent',
  },
];

// ═══════════════════════════════════════════════════════════════
// Non-escalation patterns
// ═══════════════════════════════════════════════════════════════

const ACADEMIC_USE_PATTERNS = [
  /\b(define|definition|meaning|what is|explain|history|essay|research|paper|project)\b.*(suicide|depression|abuse|violence|self.?harm)/i,
  /\b(homework|assignment|class|course|study|lesson|chapter|article|book).*(suicide|depression|abuse|violence)/i,
];

const BELIEF_PATTERNS = [
  /\b(my religion|my faith|my belief|i believe|religious views|my values)\b/i,
];

const WEAKNESS_ALONE_PATTERNS = [
  /\b(i am weak|i am bad|i don't understand|i struggle|this is hard|i can't do this)\b/i,
  /\b(i got it wrong|i failed|i made a mistake|i don't know how)\b/i,
];

// ═══════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════

function isLikelyAcademicUse(text: string): boolean {
  return ACADEMIC_USE_PATTERNS.some((p) => p.test(text));
}

function isBeliefStatementOnly(text: string): boolean {
  return BELIEF_PATTERNS.some((p) => p.test(text));
}

function isWeaknessAlone(text: string): boolean {
  return WEAKNESS_ALONE_PATTERNS.some((p) => p.test(text));
}

/**
 * Get the recommended human role for a safeguarding signal.
 */
function getRecommendedHumanRole(signal: SafeguardingSignal): string {
  switch (signal) {
    case 'self_harm':
    case 'suicidal_intent':
    case 'severe_depression_or_crisis':
      return 'school_counselor_or_crisis_team';
    case 'harm_to_others':
    case 'violence':
      return 'school_security_or_administration';
    case 'abuse':
    case 'exploitation':
    case 'grooming':
    case 'serious_coercion':
    case 'credible_child_safety_risk':
      return 'designated_safeguarding_lead_or_child_protection_services';
    default:
      return 'teacher_or_admin';
  }
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

export interface SafeguardingAssessmentInput {
  message: string;
  studentId: string;
}

export interface SafeguardingAssessmentOutput {
  signal: SafeguardingSignal;
  riskLevel: SocraticRiskLevel;
  isActiveSafeguardingEvent: boolean;
  disclosurePacket: SafeguardingDisclosurePacket | null;
  studentFacingResponseMode: string;
  safeResponseMode: string;
  warnings: string[];
}

/**
 * Assess a student message for safeguarding signals.
 * Returns the assessment result including a disclosure packet
 * if a serious risk is detected.
 */
export function assessSafeguardingRisk(input: SafeguardingAssessmentInput): SafeguardingAssessmentOutput {
  const warnings: string[] = [];
  const message = String(input.message || '').trim();
  const studentId = String(input.studentId || '').trim();

  if (!message) {
    return {
      signal: 'none',
      riskLevel: 'none',
      isActiveSafeguardingEvent: false,
      disclosurePacket: null,
      studentFacingResponseMode: 'normal_tutoring',
      safeResponseMode: 'normal_tutoring',
      warnings: ['No message to assess.'],
    };
  }

  // Check if this is academic use (research paper, homework, etc.)
  if (isLikelyAcademicUse(message)) {
    return {
      signal: 'none',
      riskLevel: 'none',
      isActiveSafeguardingEvent: false,
      disclosurePacket: null,
      studentFacingResponseMode: 'normal_tutoring',
      safeResponseMode: 'normal_tutoring',
      warnings: ['Message appears to be academic use of sensitive terms. Not escalated.'],
    };
  }

  // Check for beliefs alone
  if (isBeliefStatementOnly(message)) {
    return {
      signal: 'none',
      riskLevel: 'none',
      isActiveSafeguardingEvent: false,
      disclosurePacket: null,
      studentFacingResponseMode: 'normal_tutoring',
      safeResponseMode: 'normal_tutoring',
      warnings: ['Message expresses personal beliefs. Not escalated.'],
    };
  }

  // Check for weakness alone
  if (isWeaknessAlone(message)) {
    return {
      signal: 'none',
      riskLevel: 'none',
      isActiveSafeguardingEvent: false,
      disclosurePacket: null,
      studentFacingResponseMode: 'normal_tutoring',
      safeResponseMode: 'normal_tutoring',
      warnings: ['Message expresses academic struggle. Not escalated. Safeguarding is for serious risk only.'],
    };
  }

  // Check against safeguarding patterns
  for (const entry of SAFEGUARDING_PATTERNS) {
    if (entry.patterns.some((p) => p.test(message))) {
      const riskLevel = entry.level;
      const isUrgent = riskLevel === 'urgent';

      // Build minimum necessary disclosure packet
      const disclosurePacket: SafeguardingDisclosurePacket = {
        studentId,
        riskType: entry.signal,
        riskLevel,
        safeSummary: buildSafeSummary(entry.signal, riskLevel),
        minimumNecessaryEvidenceRefs: [`safeguarding_${Date.now()}`],
        recommendedHumanRole: getRecommendedHumanRole(entry.signal),
        auditRequired: true,
        rawChatIncluded: false,
      };

      warnings.push(`Safeguarding signal detected: ${entry.signal} (${riskLevel}). Audit required.`);

      const responseMode = isUrgent ? 'safeguarding_escalation_urgent' : 'safeguarding_escalation_support';

      return {
        signal: entry.signal,
        riskLevel,
        isActiveSafeguardingEvent: true,
        disclosurePacket,
        studentFacingResponseMode: responseMode,
        safeResponseMode: responseMode,
        warnings,
      };
    }
  }

  // No safeguarding risk detected
  return {
    signal: 'none',
    riskLevel: 'none',
    isActiveSafeguardingEvent: false,
    disclosurePacket: null,
    studentFacingResponseMode: 'normal_tutoring',
    safeResponseMode: 'normal_tutoring',
    warnings: [],
  };
}

/**
 * Build a safe summary of the safeguarding situation.
 * Never includes raw chat content.
 */
function buildSafeSummary(signal: SafeguardingSignal, riskLevel: SocraticRiskLevel): string {
  const urgencyPrefix = riskLevel === 'urgent' ? 'URGENT: ' : '';
  switch (signal) {
    case 'self_harm':
      return `${urgencyPrefix}Student may be at risk of self-harm. Provide immediate support.`;
    case 'suicidal_intent':
      return `${urgencyPrefix}Student may be experiencing suicidal thoughts. Immediate crisis intervention recommended.`;
    case 'severe_depression_or_crisis':
      return 'Student may be experiencing severe emotional distress. Mental health support recommended.';
    case 'harm_to_others':
      return `${urgencyPrefix}Student may be considering harm to others. Security assessment recommended.`;
    case 'abuse':
      return 'Student may be experiencing abuse. Child protection assessment recommended.';
    case 'exploitation':
      return 'Student may be at risk of exploitation. Safeguarding assessment recommended.';
    case 'grooming':
      return 'Student may be at risk of grooming. Safeguarding investigation recommended.';
    case 'violence':
      return `${urgencyPrefix}Student may be involved in violent activity. Security assessment recommended.`;
    case 'serious_coercion':
      return 'Student may be experiencing serious coercion. Safeguarding assessment recommended.';
    case 'credible_child_safety_risk':
      return `${urgencyPrefix}Credible child safety risk detected. Immediate safeguarding intervention required.`;
    default:
      return 'Safeguarding concern detected. Assessment recommended.';
  }
}

/**
 * Build a minimum necessary disclosure packet for safeguarding escalation.
 * Does NOT include raw chat by default.
 * Requires audit event.
 */
export function buildSafeguardingDisclosurePacket(input: {
  studentId: string;
  signal: SafeguardingSignal;
  riskLevel: SocraticRiskLevel;
}): SafeguardingDisclosurePacket {
  const { studentId, signal, riskLevel } = input;
  return {
    studentId,
    riskType: signal,
    riskLevel,
    safeSummary: buildSafeSummary(signal, riskLevel),
    minimumNecessaryEvidenceRefs: [`safeguarding_${Date.now()}`],
    recommendedHumanRole: getRecommendedHumanRole(signal),
    auditRequired: true,
    rawChatIncluded: false,
  };
}

/**
 * Get the student-facing response mode for a safeguarding situation.
 */
export function getSafeguardingStudentResponse(riskLevel: SocraticRiskLevel, signal: SafeguardingSignal): string {
  if (riskLevel === 'urgent') {
    return 'I hear you. Please talk to a trusted adult nearby — a parent, teacher, or school counselor. You are not alone. Would you like me to help you find someone to talk to?';
  }
  if (riskLevel === 'high') {
    return 'I hear you. It sounds like you are going through something difficult. Please consider talking to a trusted adult such as a parent, teacher, or school counselor who can support you.';
  }
  return 'I hear you. Would you like to talk about what is on your mind, or would you prefer to continue with your learning?';
}
