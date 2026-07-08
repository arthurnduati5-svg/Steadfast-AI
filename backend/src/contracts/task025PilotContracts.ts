export type PilotProgramStatus =
  | 'draft'
  | 'preflight_required'
  | 'ready'
  | 'active'
  | 'paused'
  | 'completed'
  | 'blocked'
  | 'rolled_back';

export type PilotEligibilityStatus =
  | 'eligible'
  | 'blocked'
  | 'pending_review'
  | 'removed';

export type PilotProgramApprovalStatus =
  | 'pending'
  | 'approved'
  | 'rejected';

export type PilotReadinessCheckType =
  | 'school_identity'
  | 'cohort_configuration'
  | 'participant_scope'
  | 'teacher_admin_access'
  | 'curriculum_scope'
  | 'approved_sources'
  | 'content_governance'
  | 'socratic_safety'
  | 'academic_integrity'
  | 'deen_governance'
  | 'privacy_gate'
  | 'safeguarding_escalation'
  | 'operations_health'
  | 'backup_readiness'
  | 'restore_drill'
  | 'rate_limit_policy'
  | 'rollback_ready'
  | 'kill_switch_ready'
  | 'dry_run_passed';

export type PilotReadinessCheckStatus =
  | 'not_run'
  | 'passed'
  | 'failed'
  | 'blocked';

export type PilotDryRunStatus =
  | 'pending'
  | 'running'
  | 'passed'
  | 'failed'
  | 'error';

export type PilotAuditAction =
  | 'program_created'
  | 'program_updated'
  | 'program_status_changed'
  | 'cohort_created'
  | 'participant_added'
  | 'participant_removed'
  | 'readiness_check_run'
  | 'dry_run_started'
  | 'dry_run_completed'
  | 'pilot_activated'
  | 'pilot_paused'
  | 'pilot_rolled_back'
  | 'kill_switch_engaged'
  | 'report_generated'
  | 'preflight_triggered';

export type PilotReadinessResult = {
  pilotProgramExists: boolean;
  pilotProgramApproved: boolean;
  pilotProgramStatusValid: boolean;
  schoolIdentityVerified: boolean;
  cohortConfigured: boolean;
  participantScopeValid: boolean;
  teacherAdminAccessConfigured: boolean;
  curriculumScopeApproved: boolean;
  approvedSourcesAvailable: boolean;
  contentGovernanceReady: boolean;
  socraticSafetyReady: boolean;
  academicIntegrityReady: boolean;
  deenGovernanceReady: boolean;
  privacyGateReady: boolean;
  safeguardingEscalationReady: boolean;
  operationsHealthy: boolean;
  backupReadinessKnown: boolean;
  restoreDrillKnown: boolean;
  rateLimitPolicyReady: boolean;
  rollbackReady: boolean;
  killSwitchReady: boolean;
  dryRunPassed: boolean;
  safeToStartPilot: boolean;
  blockingIssues: string[];
  warnings: string[];
  safeSummary: string;
};

export type PilotAccessGateResult = {
  allowed: boolean;
  reasonCodes: string[];
  safeMessage: string;
};

export type PilotDryRunInput = {
  pilotProgramId: string;
  scenarioName?: string;
};

export type PilotDryRunOutput = {
  id: string;
  status: PilotDryRunStatus;
  scenarioName: string;
  checksPassed: string[];
  checksFailed: string[];
  blockingIssues: string[];
  warnings: string[];
  safeSummary: string;
  artifactRefs: string[];
};

export type PilotRollbackResult = {
  success: boolean;
  previousStatus: string;
  newStatus: string;
  studentAccessBlocked: boolean;
  dataDestructivelyDeleted: boolean;
  auditPreserved: boolean;
  safeSummary: string;
};

export type PilotCreateProgramInput = {
  schoolId: string;
  name: string;
  scopeSummarySafe: string;
  allowedSubjects?: string[];
  allowedYearGroups?: string[];
  allowedCurriculumTracks?: string[];
  allowedRoles?: string[];
  maxStudents?: number;
  maxTeachers?: number;
  createdByRole: string;
  createdByActorIdHash?: string;
};

export type PilotCreateCohortInput = {
  pilotProgramId: string;
  schoolId: string;
  name: string;
  allowedClassIds?: string[];
  allowedSubjectIds?: string[];
  allowedCurriculumScopes?: string[];
};

export type PilotAddParticipantInput = {
  pilotProgramId: string;
  schoolId: string;
  actorIdHash: string;
  role: string;
  cohortId?: string;
};

export type PilotReportContent = {
  taskId: string;
  taskName: string;
  generatedAt: string;
  gitBranch: string;
  gitCommit: string;
  workingTreeStatus: string;
  environment: string;
  filesChanged: string[];
  migrationsChanged: string[];
  pilotReadiness: Record<string, boolean | string>;
  pilotAccessGate: Record<string, boolean | string>;
  pilotDryRun: Record<string, unknown>;
  rollbackReadiness: Record<string, boolean | string>;
  privacyLeakChecks: Record<string, boolean>;
  securityGateChecks: Record<string, boolean>;
  deenGateChecks: Record<string, boolean>;
  socraticGateChecks: Record<string, boolean>;
  curriculumGateChecks: Record<string, boolean>;
  verificationCommands: { command: string; exitCode: number; logPath: string; result: string; summary: string }[];
  testResults: { testFile: string; passed: number; failed: number; skipped: number; result: string }[];
  blockingIssues: string[];
  knownLimitations: string[];
  safeToStartTask026: boolean;
  finalDecision: string;
};

export const PILOT_PROGRAM_STATUSES: PilotProgramStatus[] = [
  'draft', 'preflight_required', 'ready', 'active', 'paused', 'completed', 'blocked', 'rolled_back',
];

export const PILOT_ELIGIBILITY_STATUSES: PilotEligibilityStatus[] = [
  'eligible', 'blocked', 'pending_review', 'removed',
];

export const PILOT_APPROVAL_STATUSES: PilotProgramApprovalStatus[] = [
  'pending', 'approved', 'rejected',
];

export const PILOT_READINESS_CHECK_TYPES: PilotReadinessCheckType[] = [
  'school_identity', 'cohort_configuration', 'participant_scope', 'teacher_admin_access',
  'curriculum_scope', 'approved_sources', 'content_governance', 'socratic_safety',
  'academic_integrity', 'deen_governance', 'privacy_gate', 'safeguarding_escalation',
  'operations_health', 'backup_readiness', 'restore_drill', 'rate_limit_policy',
  'rollback_ready', 'kill_switch_ready', 'dry_run_passed',
];

export const PRIVATE_CONTENT_PATTERNS = [
  'rawChat', 'raw_chat', 'rawMessage', 'raw_message',
  'rawTranscript', 'raw_transcript', 'rawPrompt', 'raw_prompt',
  'systemPrompt', 'system_prompt', 'developerPrompt', 'developer_prompt',
  'providerResponse', 'provider_response',
  'answerKey', 'answer_key',
  'teacherOnlyContent', 'teacher_only_note', 'teacherOnlyNote',
  'privateMemory', 'private_memory', 'studentPrivateMemory',
  'authorization', 'bearer', 'token', 'secret', 'apikey', 'api_key',
  'databaseUrl', 'database_url', 'connectionString', 'connection_string',
  'cookie', 'stackTrace', 'stack_trace', 'rawException', 'raw_exception',
  'deenSensitive', 'deen_sensitive', 'safeguardingRaw', 'safeguarding_raw',
  'aiPrompt', 'ai_prompt', 'llmPrompt', 'llm_prompt',
];
