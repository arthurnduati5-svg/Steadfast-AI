import type { Task034ExpandedPrivacyBoundaryResult } from '../contracts/task034ControlledRolloutContracts';

const PATTERN_TO_FINDING: Array<{ pattern: string; key: string }> = [
  { pattern: 'raw student chat', key: 'rawStudentChatExposed' },
  { pattern: 'private learner memory', key: 'privateLearnerMemoryExposed' },
  { pattern: 'student full name', key: 'rawStudentIdentityExposed' },
  { pattern: 'student email', key: 'rawStudentIdentityExposed' },
  { pattern: 'student phone', key: 'rawStudentIdentityExposed' },
  { pattern: 'real roster', key: 'rawStudentIdentityExposed' },
  { pattern: 'teacher-only notes', key: 'teacherOnlyNotesExposed' },
  { pattern: 'teacher-only content', key: 'teacherOnlyContentExposed' },
  { pattern: 'protected rubric', key: 'protectedRubricsExposed' },
  { pattern: 'safeguarding raw details', key: 'safeguardingRawDetailsExposed' },
  { pattern: 'deen-sensitive private text', key: 'deenSensitivePrivateTextExposed' },
  { pattern: 'ai prompt', key: 'aiPromptsExposed' },
  { pattern: 'provider response', key: 'providerResponsesExposed' },
  { pattern: 'api token', key: 'tokensSecretsExposed' },
  { pattern: 'bearer token', key: 'tokensSecretsExposed' },
  { pattern: 'auth token', key: 'tokensSecretsExposed' },
  { pattern: 'access token', key: 'tokensSecretsExposed' },
  { pattern: 'client secret', key: 'tokensSecretsExposed' },
  { pattern: 'api secret', key: 'tokensSecretsExposed' },
  { pattern: 'secret key', key: 'tokensSecretsExposed' },
  { pattern: 'database url', key: 'databaseUrlsExposed' },
  { pattern: 'postgres://', key: 'databaseUrlsExposed' },
  { pattern: 'postgresql://', key: 'databaseUrlsExposed' },
  { pattern: 'mysql://', key: 'databaseUrlsExposed' },
  { pattern: 'authorization header', key: 'authHeadersExposed' },
  { pattern: 'cookie', key: 'cookiesExposed' },
  { pattern: 'answer key', key: 'answerKeysExposed' },
  { pattern: 'raw exception object', key: 'tokensSecretsExposed' },
  { pattern: 'unredacted stack trace', key: 'tokensSecretsExposed' },
];

const SAFE_IDENTIFIERS = [
  'school_task034_limited_rollout_safe',
  'tenant_task034_limited_rollout_safe',
  'cohort_task034_limited_rollout_safe',
  'rollout_run_task034_safe',
  'rollout_window_task034_safe',
  'student_hash_task034_safe_001',
  'student_hash_task034_safe_002',
  'student_hash_task034_safe_003',
  'student_hash_task034_safe_004',
  'teacher_hash_task034_safe_001',
  'teacher_hash_task034_safe_002',
  'admin_hash_task034_safe_001',
  'operator_hash_task034_safe_001',
  'class_task034_safe_001',
  'subject_task034_safe_math_001',
  'curriculum_scope_task034_safe_001',
  'source_scope_task034_safe_001',
  'rollback_plan_task034_safe',
  'incident_review_task034_safe',
  'post_limited_rollout_decision_task034_safe',
];

export function scanPrivacyBoundary(content: string): Task034ExpandedPrivacyBoundaryResult {
  const blockingIssues: string[] = [];

  const findings: Record<string, boolean> = {
    rawStudentIdentityExposed: false,
    rawStudentChatExposed: false,
    privateLearnerMemoryExposed: false,
    teacherOnlyNotesExposed: false,
    safeguardingRawDetailsExposed: false,
    deenSensitivePrivateTextExposed: false,
    tokensSecretsExposed: false,
    databaseUrlsExposed: false,
    authHeadersExposed: false,
    cookiesExposed: false,
    answerKeysExposed: false,
    teacherOnlyContentExposed: false,
    protectedRubricsExposed: false,
    aiPromptsExposed: false,
    providerResponsesExposed: false,
  };

  for (const entry of PATTERN_TO_FINDING) {
    const regex = new RegExp(entry.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (regex.test(content)) {
      findings[entry.key] = true;
    }
  }

  for (const [key, exposed] of Object.entries(findings)) {
    if (exposed) {
      blockingIssues.push(`PRIVACY_LEAK: ${key}`);
    }
  }

  return {
    ok: blockingIssues.length === 0,
    ...findings,
    blockingIssues,
  } as Task034ExpandedPrivacyBoundaryResult;
}


