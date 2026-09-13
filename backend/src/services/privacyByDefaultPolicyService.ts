// ─────────────────────────────────────────────────────────────
// Steadfast AI — Privacy-by-Default Policy Service v1
// Student privacy is protected by default. Raw chat, private
// memory, raw transcripts, and unnecessary sensitive details
// are never exposed. Aggregate or safe summary insight only.
// Safeguarding disclosure is handled through safeguarding
// exception policy only.
// ─────────────────────────────────────────────────────────────

export type PrivacyCheckResult = {
  allowed: boolean;
  reason: string;
  safeAlternative?: string;
};

export type AllowedInsightType =
  | 'aggregate_growth_trends'
  | 'weak_topic_summaries'
  | 'repeated_misconception_summaries'
  | 'class_wide_pattern_summaries'
  | 'system_health_and_flow_quality'
  | 'unresolved_exception_alert'
  | 'unresolved_exception_alerts';

export type ForbiddenDataType =
  | 'raw_student_chat'
  | 'raw_private_learner_memory'
  | 'raw_mental_health_disclosure'
  | 'raw_transcript'
  | 'personal_belief_statements'
  | 'unnecessary_sensitive_details';

// ═══════════════════════════════════════════════════════════════
// Privacy Checks
// ═══════════════════════════════════════════════════════════════

/**
 * Check whether a data type is allowed for teacher/admin insight.
 * By default, only safe aggregate/summary insight types are allowed.
 */
function checkTeacherInsightDataType(dataType: string): PrivacyCheckResult {
  const allowedTypes: AllowedInsightType[] = [
    'aggregate_growth_trends',
    'weak_topic_summaries',
    'repeated_misconception_summaries',
    'class_wide_pattern_summaries',
    'system_health_and_flow_quality',
    'unresolved_exception_alert',
    'unresolved_exception_alerts',
  ];

  const forbiddenTypes: ForbiddenDataType[] = [
    'raw_student_chat',
    'raw_private_learner_memory',
    'raw_mental_health_disclosure',
    'raw_transcript',
    'personal_belief_statements',
    'unnecessary_sensitive_details',
  ];

  if (allowedTypes.includes(dataType as AllowedInsightType)) {
    return {
      allowed: true,
      reason: `"${dataType}" is an allowed insight type for teacher/admin view.`,
    };
  }

  if (forbiddenTypes.includes(dataType as ForbiddenDataType)) {
    return {
      allowed: false,
      reason: `"${dataType}" is forbidden by default under privacy-by-default policy.`,
      safeAlternative: getSafeAlternativeFor(dataType as ForbiddenDataType),
    };
  }

  // Unknown data type — deny by default
  return {
    allowed: false,
    reason: `"${dataType}" is not recognized as an allowed insight type. Denied by default.`,
    safeAlternative: 'If you need information about this student, request a privacy-safe summary through the teacher insight escalation policy.',
  };
}

export function checkTeacherInsightDataTypeAllowed(dataType: string): boolean {
  return checkTeacherInsightDataType(dataType).allowed;
}

/**
 * Get the safe alternative for a forbidden data type.
 */
function getSafeAlternativeFor(dataType: ForbiddenDataType): string {
  switch (dataType) {
    case 'raw_student_chat':
      return 'A summary of learning progress and topics covered, without raw chat content.';
    case 'raw_private_learner_memory':
      return 'Safe bounded growth signals (strengths, weaknesses, progress trends) without raw memory content.';
    case 'raw_mental_health_disclosure':
      return 'Safeguarding exception alert with minimum necessary information (risk type, risk level, safe summary).';
    case 'raw_transcript':
      return 'A topic summary and learning outcome assessment, without verbatim transcript.';
    case 'personal_belief_statements':
      return 'This information is private by default and should not be stored or disclosed.';
    case 'unnecessary_sensitive_details':
      return 'Omit sensitive details. Only minimum necessary information for educational support should be shared.';
    default:
      return 'Request a safe summary instead of raw data.';
  }
}

/**
 * Check whether a disclosure is allowed under privacy-by-default.
 * Returns true only if the disclosure is a safeguarding exception
 * or an allowed aggregate insight.
 */
export function checkDisclosureAllowed(input: {
  dataType: string;
  isSafeguardingException?: boolean;
  isAggregateInsight?: boolean;
  isMinimumNecessary?: boolean;
}): PrivacyCheckResult {
  const { dataType, isSafeguardingException, isAggregateInsight, isMinimumNecessary } = input;

  // Safeguarding exception with minimum necessary data
  if (isSafeguardingException && isMinimumNecessary) {
    return {
      allowed: true,
      reason: 'Safeguarding exception with minimum necessary disclosure is permitted.',
    };
  }

  // Aggregate insight that doesn't identify individual students
  if (isAggregateInsight) {
    return {
      allowed: true,
      reason: 'Aggregate insight that does not identify individual students is permitted.',
    };
  }

  // Check specific data type
  return checkTeacherInsightDataType(dataType);
}

/**
 * Get the privacy mode for the current context.
 * Default is 'private_by_default'. Changes to
 * 'minimum_necessary_safeguarding_disclosure' only when
 * a valid safeguarding exception is active.
 */
export function getPrivacyMode(isSafeguardingExceptionActive: boolean): 'private_by_default' | 'minimum_necessary_safeguarding_disclosure' {
  if (isSafeguardingExceptionActive) {
    return 'minimum_necessary_safeguarding_disclosure';
  }
  return 'private_by_default';
}

/**
 * Get the list of forbidden insight data types (privacy-protected).
 */
export function getForbiddenInsightDataTypes(): ForbiddenDataType[] {
  return [
    'raw_student_chat',
    'raw_private_learner_memory',
    'raw_mental_health_disclosure',
    'raw_transcript',
    'personal_belief_statements',
    'unnecessary_sensitive_details',
  ];
}

/**
 * Get the list of allowed insight data types.
 */
export function getAllowedInsightDataTypes(): AllowedInsightType[] {
  return [
    'aggregate_growth_trends',
    'weak_topic_summaries',
    'repeated_misconception_summaries',
    'class_wide_pattern_summaries',
    'system_health_and_flow_quality',
    'unresolved_exception_alert',
    'unresolved_exception_alerts',
  ];
}

/**
 * Explain the privacy-by-default policy.
 */
export function explainPrivacyByDefaultPolicy(): string {
  return (
    'Steadfast protects student privacy by default. ' +
    'Raw chat logs, private learner memory, raw transcripts, mental health disclosures, ' +
    'personal belief statements, and unnecessary sensitive details are never exposed to teachers or admins. ' +
    'Teachers and admins receive only: aggregate growth trends, weak topic summaries, ' +
    'repeated misconception summaries, class-wide pattern summaries, system health data, ' +
    'and unresolved exception alerts. ' +
    'Safeguarding disclosures are handled through the safeguarding exception policy only, ' +
    'with minimum necessary information and mandatory audit.'
  );
}

// Alias for backward compatibility
export const explainPrivacyPolicy = explainPrivacyByDefaultPolicy;
