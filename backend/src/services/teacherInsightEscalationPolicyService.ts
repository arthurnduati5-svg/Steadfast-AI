// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher/Admin Insight Escalation Policy Service v1
// Decides when teacher/admin insight is allowed. Keeps routine
// learning automated. Prevents approval workload. Escalates
// repeated unresolved weakness only as insight (not permission).
// Escalates safeguarding risk as controlled exception.
// Produces privacy-safe summary.
// ─────────────────────────────────────────────────────────────

import type { TeacherInsightCategory, SocraticRiskLevel } from './socraticTutorPolicyContracts';

// ═══════════════════════════════════════════════════════════════
// Allowed vs Forbidden Insight Categories
// ═══════════════════════════════════════════════════════════════

const ALLOWED_INSIGHT_CATEGORIES: TeacherInsightCategory[] = [
  'repeated_weakness_after_automation',
  'class_wide_misconception_pattern',
  'resource_not_helping',
  'student_blocked_after_multiple_support_attempts',
  'academic_integrity_pattern',
  'safeguarding_exception',
  'system_confidence_low',
];

const FORBIDDEN_INSIGHT_REASONS = [
  'ordinary_wrong_answer',
  'single_confusion',
  'slow_learning',
  'different_belief',
  'student_preference',
  'normal_hint_usage',
  'normal_practice_failure',
];

// ═══════════════════════════════════════════════════════════════
// Thresholds
// ═══════════════════════════════════════════════════════════════

const BLOCKED_ATTEMPT_THRESHOLD = 5;
const PERSISTENT_WEAKNESS_THRESHOLD = 4;

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface InsightEscalationInput {
  studentId: string;
  category: string;
  riskLevel?: SocraticRiskLevel;
  attemptCount?: number;
  weaknessPersistenceCount?: number;
  isSafeguardingException?: boolean;
  isAcademicIntegrityPattern?: boolean;
  isClassWidePattern?: boolean;
  recentSupportAttempts?: number;
  systemConfidence?: number;
}

export interface InsightEscalationOutput {
  insightAllowed: boolean;
  insightCategory: TeacherInsightCategory | null;
  reason: string;
  privacySafeSummary: string;
  isException: boolean;
  requiresAudit: boolean;
  warnings: string[];
}

// ═══════════════════════════════════════════════════════════════
// Escalation Logic
// ═══════════════════════════════════════════════════════════════

/**
 * Evaluate whether a teacher/admin insight should be generated.
 * Prevents approval workload — insight is informational only.
 */
export function evaluateTeacherInsightEscalation(input: InsightEscalationInput): InsightEscalationOutput {
  const warnings: string[] = [];
  const {
    studentId,
    category,
    riskLevel,
    attemptCount,
    weaknessPersistenceCount,
    isSafeguardingException,
    isAcademicIntegrityPattern,
    isClassWidePattern,
    recentSupportAttempts,
    systemConfidence,
  } = input;

  // Safeguarding exception — always escalate as insight (not approval)
  if (isSafeguardingException) {
    return {
      insightAllowed: true,
      insightCategory: 'safeguarding_exception',
      reason: `Safeguarding exception triggered. Insight generated for designated safeguarding personnel. No approval required.`,
      privacySafeSummary: `Safeguarding exception alert. Risk level: ${riskLevel || 'high'}. Minimum necessary disclosure. Audit required.`,
      isException: true,
      requiresAudit: true,
      warnings: ['Safeguarding exception — minimum necessary disclosure only.'],
    };
  }

  // Academic integrity pattern
  if (isAcademicIntegrityPattern) {
    return {
      insightAllowed: true,
      insightCategory: 'academic_integrity_pattern',
      reason: `Academic integrity pattern detected. Insight only — no action required.`,
      privacySafeSummary: `Academic integrity signals detected. Pattern summary: repeated shortcut attempts. No raw chat data exposed.`,
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // Class-wide pattern
  if (isClassWidePattern) {
    return {
      insightAllowed: true,
      insightCategory: 'class_wide_misconception_pattern',
      reason: `Class-wide misconception pattern detected. Aggregate insight — no individual student data exposed.`,
      privacySafeSummary: `Class-wide pattern: multiple students showing similar misconception on topic. Consider whole-class review.`,
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // Repeated weakness after automation attempts
  if (category === 'repeated_weakness_after_automation' && weaknessPersistenceCount !== undefined) {
    if (weaknessPersistenceCount >= PERSISTENT_WEAKNESS_THRESHOLD) {
      return {
        insightAllowed: true,
        insightCategory: 'repeated_weakness_after_automation',
        reason: `Student shows repeated weakness persisting after ${weaknessPersistenceCount} automation cycles. Insight only — no approval required.`,
        privacySafeSummary: `Weakness in topic persists after automated support. Current state: automation attempting varied approaches.`,
        isException: false,
        requiresAudit: false,
        warnings: [],
      };
    }
    return {
      insightAllowed: false,
      insightCategory: null,
      reason: `Weakness persistence count (${weaknessPersistenceCount}) below threshold (${PERSISTENT_WEAKNESS_THRESHOLD}). Automation continuing.`,
      privacySafeSummary: '',
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // Student blocked after multiple support attempts
  if (category === 'student_blocked_after_multiple_support_attempts' && attemptCount !== undefined) {
    if (attemptCount >= BLOCKED_ATTEMPT_THRESHOLD) {
      return {
        insightAllowed: true,
        insightCategory: 'student_blocked_after_multiple_support_attempts',
        reason: `Student appears blocked after ${attemptCount} support attempts. Automation exhausted. Insight only.`,
        privacySafeSummary: `Multiple support approaches exhausted for current topic. May need human review of approach.`,
        isException: false,
        requiresAudit: false,
        warnings: [],
      };
    }
    return {
      insightAllowed: false,
      insightCategory: null,
      reason: `Support attempts (${attemptCount}) below threshold (${BLOCKED_ATTEMPT_THRESHOLD}). Automation continuing.`,
      privacySafeSummary: '',
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // System confidence low
  if (category === 'system_confidence_low' && systemConfidence !== undefined) {
    if (systemConfidence < 30) {
      return {
        insightAllowed: true,
        insightCategory: 'system_confidence_low',
        reason: `System confidence is low (${systemConfidence}%). Review may be needed.`,
        privacySafeSummary: `System confidence low. Recommend checking whether current approach is effective. No raw data exposed.`,
        isException: false,
        requiresAudit: false,
        warnings: ['Low system confidence — may indicate need for human review.'],
      };
    }
    return {
      insightAllowed: false,
      insightCategory: null,
      reason: `System confidence (${systemConfidence}%) is acceptable. No escalation needed.`,
      privacySafeSummary: '',
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // Check if category is in allowed list
  if (ALLOWED_INSIGHT_CATEGORIES.includes(category as TeacherInsightCategory)) {
    return {
      insightAllowed: true,
      insightCategory: category as TeacherInsightCategory,
      reason: `Insight category "${category}" is allowed. Insight only — no approval workload.`,
      privacySafeSummary: `Insight: ${category}. Privacy-safe summary.`,
      isException: false,
      requiresAudit: false,
      warnings: [],
    };
  }

  // Deny by default
  return {
    insightAllowed: false,
    insightCategory: null,
    reason: `Category "${category}" is not an allowed insight category. Routine learning remains automated. No approval needed.`,
    privacySafeSummary: '',
    isException: false,
    requiresAudit: false,
    warnings: [`Category "${category}" is not an allowed insight. This may be a routine learning event.`],
  };
}

/**
 * Check if a category is a forbidden insight reason (should never be escalated).
 */
export function isForbiddenInsightReason(reason: string): boolean {
  return (FORBIDDEN_INSIGHT_REASONS as readonly string[]).includes(reason);
}

/**
 * Get all allowed insight categories.
 */
export function getAllowedInsightCategories(): TeacherInsightCategory[] {
  return [...ALLOWED_INSIGHT_CATEGORIES];
}

/**
 * Explain the teacher/admin insight policy.
 */
export function explainTeacherInsightPolicy(): string {
  return (
    'Teachers and admins receive insights only when the automated system cannot resolve an issue alone, ' +
    'or when a safeguarding exception occurs. ' +
    'Routine learning (wrong answers, confusion, slow progress, different beliefs, preferences, ' +
    'normal hint usage, normal practice failure) is NOT escalated. ' +
    'Insights are informational only — they do not require approval or action from teachers/admins. ' +
    'All insights are privacy-safe summaries without raw chat, raw memory, or raw transcript exposure.'
  );
}
