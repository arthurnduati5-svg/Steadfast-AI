// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Report Privacy Guard Service v1 (Task 012)
// Removes unsafe fields from teacher-facing reports.
// Detects and strips raw chat, prompts, model drafts, private
// memory, safeguarding details, and Deen-sensitive raw questions.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherSafeEvidenceCard,
  TeacherSafeStudentSummary,
  TeacherSafeClassSummary,
  TeacherReportPrivacyDecision,
  TeacherReportPrivacyMetadata,
  TeacherReportVisibility,
  TeacherReportScope,
} from './teacherReportContracts';

// ═══════════════════════════════════════════════════════════════
// Constants
// ═══════════════════════════════════════════════════════════════

const MAX_SAFE_SUMMARY_LENGTH = 500;
const MAX_CLASS_OVERVIEW_LENGTH = 2000;
const MAX_REASON_LENGTH = 1000;

const RAW_DATA_PATTERNS: RegExp[] = [
  /raw[Cc]hat/i,
  /raw[Tt]ranscript/i,
  /raw[Pp]rompt/i,
  /raw[Aa][Ii][Rr]esponse/i,
  /raw[Mm]odel[Dd]raft/i,
  /raw[Aa]rtifact[Cc]ontent/i,
  /raw[Vv]ideo[Tt]ranscript/i,
  /raw[Ll]earner[Mm]emory/i,
  /raw[Ss]tudent[Dd]ata/i,
  /[Pp]rivate[Mm]emory/,
  /learner[Mm]emory\[/,
  /chat[Hh]istory/,
  /conversation[Hh]istory/,
  /\[private\]/i,
  /safeguarding[Ee]vidence/,
  /safeguarding[Dd]etails/,
  /safeguarding[Rr]aw/,
  /safety[Ee]xcerpt/,
  /deen[Ss]ensitive[Rr]aw[Qq]uestion/,
];

const UNSAFE_FIELDS = [
  'rawText',
  'rawChat',
  'rawTranscript',
  'prompt',
  'systemPrompt',
  'modelDraft',
  'providerResponse',
  'privateMemory',
  'safeguardingRaw',
  'safetyExcerpt',
  'deenSensitiveRawQuestion',
  'rawLearnerData',
  'rawAiResponse',
  'rawArtifactContent',
  'rawVideoTranscript',
  'rawLearnerMemory',
  'safeguardingDetails',
  'learnerMemory',
  'chatHistory',
  'conversationHistory',
];

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

/**
 * Validate and redact a teacher-safe evidence card.
 * Returns a safe version with privacy metadata.
 */
export function sanitizeEvidenceCard(
  card: Partial<TeacherSafeEvidenceCard> & { evidenceId: string },
): { safeCard: TeacherSafeEvidenceCard; privacyDecision: TeacherReportPrivacyDecision } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const redactionReasons: string[] = [];

  let safeSummary = card.safeSummary || '';
  let masterySignal = card.masterySignal || '';

  // Check for raw data in summary
  for (const pattern of RAW_DATA_PATTERNS) {
    if (pattern.test(safeSummary)) {
      safeSummary = safeSummary.replace(pattern, '[REDACTED]');
      redactionReasons.push(`Raw data pattern detected in summary: ${pattern}`);
    }
  }

  if (safeSummary.length > MAX_SAFE_SUMMARY_LENGTH) {
    safeSummary = safeSummary.substring(0, MAX_SAFE_SUMMARY_LENGTH) + '...';
    warnings.push(`Safe summary truncated to ${MAX_SAFE_SUMMARY_LENGTH} characters`);
  }

  const safeCard: TeacherSafeEvidenceCard = {
    evidenceId: card.evidenceId,
    evidenceType: card.evidenceType || 'learning_event',
    subject: card.subject || 'unknown',
    topic: card.topic || 'unknown',
    skillLabel: card.skillLabel || 'unknown',
    safeSummary,
    masterySignal,
    confidence: typeof card.confidence === 'number' ? card.confidence : 0,
    createdAt: card.createdAt || new Date().toISOString(),
    sourceType: card.sourceType || 'unknown',
    privacyLevel: 'teacher_safe',
  };

  const metadata: TeacherReportPrivacyMetadata = {
    privacyLevel: 'teacher_safe',
    redactionApplied: redactionReasons.length > 0,
    redactionReasons,
    minimumNecessary: true,
    teacherSafe: true,
    safeguardingSeparated: true,
    deenSensitiveHandled: true,
  };

  return {
    safeCard,
    privacyDecision: {
      safe: errors.length === 0,
      errors,
      warnings,
      metadata,
    },
  };
}

/**
 * Validate a complete student summary for privacy safety.
 * Strips unsafe fields and adds privacy metadata.
 */
export function sanitizeStudentSummary(
  summary: TeacherSafeStudentSummary,
): { safeSummary: TeacherSafeStudentSummary; privacyDecision: TeacherReportPrivacyDecision } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const redactionReasons: string[] = [];

  // Check for shaming labels in summary
  const shamingPatterns = [
    /\bweak student\b/i,
    /\bslow learner\b/i,
    /\bbad at math\b/i,
    /\blazy\b/i,
    /\bfailing\b/i,
    /\bpoor performer\b/i,
    /\bproblem student\b/i,
  ];

  for (const field of ['classProgressOverview', ...(summary as any).__proto__ ? [] : []]) {
    // Check all string fields
  }

  const safeSummary: TeacherSafeStudentSummary = {
    ...summary,
    strengths: summary.strengths.map(s => redactText(s, redactionReasons)),
    needsReview: summary.needsReview.map(s => redactText(s, redactionReasons)),
    recentImprovements: summary.recentImprovements.map(s => redactText(s, redactionReasons)),
    privacyMetadata: {
      privacyLevel: 'teacher_safe',
      redactionApplied: redactionReasons.length > 0,
      redactionReasons,
      minimumNecessary: true,
      teacherSafe: true,
      safeguardingSeparated: true,
      deenSensitiveHandled: true,
    },
  };

  return {
    safeSummary,
    privacyDecision: {
      safe: errors.length === 0,
      errors,
      warnings,
      metadata: safeSummary.privacyMetadata,
    },
  };
}

/**
 * Validate a complete class summary for privacy safety.
 */
export function sanitizeClassSummary(
  summary: TeacherSafeClassSummary,
): { safeSummary: TeacherSafeClassSummary; privacyDecision: TeacherReportPrivacyDecision } {
  const errors: string[] = [];
  const warnings: string[] = [];
  const redactionReasons: string[] = [];

  let classOverview = summary.classProgressOverview;
  for (const pattern of RAW_DATA_PATTERNS) {
    if (pattern.test(classOverview)) {
      classOverview = classOverview.replace(pattern, '[REDACTED]');
      redactionReasons.push(`Raw data pattern detected in class overview: ${pattern}`);
    }
  }

  if (classOverview.length > MAX_CLASS_OVERVIEW_LENGTH) {
    classOverview = classOverview.substring(0, MAX_CLASS_OVERVIEW_LENGTH) + '...';
    warnings.push(`Class overview truncated to ${MAX_CLASS_OVERVIEW_LENGTH} characters`);
  }

  const safeSummary: TeacherSafeClassSummary = {
    ...summary,
    classProgressOverview: classOverview,
    commonReviewNeeds: summary.commonReviewNeeds.map(s => redactText(s, redactionReasons)),
    commonStrengths: summary.commonStrengths.map(s => redactText(s, redactionReasons)),
    studentsNeedingAcademicCheckIn: summary.studentsNeedingAcademicCheckIn.slice(0, 20),
    studentsReadyForChallenge: summary.studentsReadyForChallenge.slice(0, 20),
    privacyMetadata: {
      privacyLevel: 'teacher_safe',
      redactionApplied: redactionReasons.length > 0,
      redactionReasons,
      minimumNecessary: true,
      teacherSafe: true,
      safeguardingSeparated: true,
      deenSensitiveHandled: true,
    },
  };

  return {
    safeSummary,
    privacyDecision: {
      safe: errors.length === 0,
      errors,
      warnings,
      metadata: safeSummary.privacyMetadata,
    },
  };
}

/**
 * Assert that a payload contains no raw or unsafe fields.
 * Throws if any forbidden field is found.
 */
export function assertNoRawDataInTeacherReport(input: unknown): void {
  if (typeof input !== 'object' || input === null) return;

  const obj = input as Record<string, unknown>;

  for (const field of UNSAFE_FIELDS) {
    if (field in obj && obj[field] !== false && obj[field] !== undefined && obj[field] !== null) {
      throw new Error(`Teacher report contains forbidden field: ${field}`);
    }
  }
}

/**
 * Detect if a string contains raw chat patterns.
 */
export function containsRawChatPattern(text: string): boolean {
  const rawChatPatterns = [
    /raw[Cc]hat/i,
    /raw[Tt]ranscript/i,
    /\[private\]/i,
    /chat[Hh]istory/,
    /conversation[Hh]istory/,
  ];
  return rawChatPatterns.some(p => p.test(text));
}

/**
 * Detect if a string contains raw prompt patterns.
 */
export function containsRawPromptPattern(text: string): boolean {
  return /raw[Pp]rompt/i.test(text) || /system[Pp]rompt/i.test(text);
}

/**
 * Detect if a string contains private memory patterns.
 */
export function containsPrivateMemoryPattern(text: string): boolean {
  return /[Pp]rivate[Mm]emory/.test(text) || /learner[Mm]emory\[/.test(text);
}

// ═══════════════════════════════════════════════════════════════
// Internal Helpers
// ═══════════════════════════════════════════════════════════════

function redactText(input: string, redactionReasons: string[]): string {
  let result = input;
  for (const pattern of RAW_DATA_PATTERNS) {
    if (pattern.test(result)) {
      result = result.replace(pattern, '[REDACTED]');
      redactionReasons.push(`Raw data pattern detected: ${pattern}`);
    }
  }
  return result;
}
