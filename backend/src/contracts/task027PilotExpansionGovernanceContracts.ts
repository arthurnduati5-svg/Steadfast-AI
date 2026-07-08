// ──────────────────────────────────────────────────────
// Task 027 – Pilot Expansion & Governance Contracts
// ──────────────────────────────────────────────────────

// ── Status Constants ──

export const TASK027_GOVERNANCE_STATUSES = [
  'pending',
  'gathering_evidence',
  'under_review',
  'approved_for_expansion',
  'blocked',
  'rejected',
  'completed',
] as const;

export const TASK027_EXPANSION_DECISIONS = [
  'approved_for_task028',
  'blocked_needs_review',
  'blocked_high_risk',
  'blocked_missing_evidence',
  'blocked_dependency_failure',
  'blocked_privacy_safeguarding',
  'blocked_content_governance',
  'blocked_operations_capacity',
  'rejected_do_not_expand',
] as const;

export const TASK027_REVIEW_ACTOR_ROLES = [
  'school_admin',
  'system_admin',
  'internal_operator',
  'authorized_pilot_coordinator',
  'authorized_expansion_reviewer',
  'teacher_assigned_to_pilot',
  'safeguarding_reviewer',
  'content_governance_reviewer',
  'deen_source_reviewer',
  'operations_reviewer',
] as const;

export const TASK027_REVIEW_GATE_STATUSES = [
  'passed',
  'failed',
  'blocked',
  'pending_review',
  'conditions_required',
] as const;

export const TASK027_EXPANSION_PROPOSAL_STATUSES = [
  'draft',
  'under_review',
  'approved',
  'rejected',
  'ready_to_expand',
  'expanded',
  'rolled_back',
] as const;

export const TASK027_EXPANSION_SCOPE_TYPES = [
  'same_school',
  'additional_class',
  'additional_grade',
  'additional_subject',
  'same_cohort',
] as const;

export const TASK027_RISK_LEVELS = [
  'low',
  'medium',
  'high',
  'critical',
] as const;

export const TASK027_EVIDENCE_EVENT_TYPES = [
  'pilot_completed',
  'session_started',
  'session_blocked',
  'support_needed',
  'incident_logged',
  'safeguarding_signal',
  'pause_triggered',
  'rollback_triggered',
  'teacher_review_submitted',
  'learner_feedback_collected',
] as const;

export const TASK027_TEACHER_REVIEW_STATUSES = [
  'not_started',
  'in_progress',
  'submitted',
  'approved',
  'rejected',
] as const;

export const TASK027_ADMIN_APPROVAL_STATUSES = [
  'pending',
  'approved_with_conditions',
  'approved',
  'rejected',
] as const;

export const TASK027_SAFEGUARDING_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_conditions',
  'blocked',
] as const;

export const TASK027_DEEN_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_referral',
  'blocked',
] as const;

export const TASK027_PRIVACY_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_conditions',
  'failed',
] as const;

export const TASK027_SOCRATIC_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_conditions',
  'failed',
] as const;

export const TASK027_OPERATIONS_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_conditions',
  'failed',
] as const;

export const TASK027_ACADEMIC_INTEGRITY_REVIEW_STATUSES = [
  'not_reviewed',
  'passed',
  'passed_with_conditions',
  'failed',
] as const;

export const TASK027_PARENT_LEARNER_FEEDBACK_STATUSES = [
  'not_available',
  'available_no_concerns',
  'available_with_concerns',
  'blocking',
] as const;

export const TASK027_BLOCKER_TYPES = [
  'dependency_failure',
  'missing_evidence',
  'high_risk',
  'critical_risk',
  'missing_review',
  'review_rejected',
  'privacy_concern',
  'safeguarding_concern',
  'deen_concern',
  'socratic_concern',
  'academic_integrity_concern',
  'operations_capacity',
  'rollback_not_ready',
  'parent_feedback_concern',
  'learner_feedback_concern',
  'cross_school_actor',
  'unverified_school',
  'missing_task026_commit',
  'missing_task025_acceptance',
  'missing_task024_acceptance',
  'missing_content_governance',
  'missing_deployment_readiness',
  'missing_governance_continuity',
] as const;

export const TASK027_AUDIT_EVENTS = [
  'governance_started',
  'evidence_loaded',
  'learning_quality_reviewed',
  'proposal_created',
  'eligibility_checked',
  'risk_assessed',
  'teacher_reviewed',
  'admin_approved',
  'parent_feedback_reviewed',
  'safeguarding_reviewed',
  'deen_reviewed',
  'privacy_reviewed',
  'socratic_reviewed',
  'academic_integrity_reviewed',
  'operations_reviewed',
  'rollback_readiness_checked',
  'evidence_pack_generated',
  'decision_made',
  'report_generated',
  'governance_completed',
  'expansion_blocked',
  'expansion_approved',
] as const;

export const TASK027_FORBIDDEN_FIELDS = [
  'rawStudentData',
  'rawLearnerData',
  'rawParentData',
  'rawTeacherNotes',
  'rawSafeguardingNotes',
  'rawDeenText',
  'rawProviderPayloads',
  'rawHiddenReasoning',
  'rawAnswerKey',
  'rawRubricData',
  'rawExamContent',
  'rawHomeworkSubmission',
  'rawSessionTranscript',
  'rawPII',
  'rawBiometricData',
  'rawLocationData',
  'rawDeviceData',
  'rawBehavioralProfile',
  'rawSafeguardingDisclosure',
  'rawFatwaText',
  'rawPietyScore',
  'rawSectarianLabel',
  'rawFinalAnswer',
  'rawReasoningTrace',
  'rawProviderLog',
  'rawModelOutput',
  'rawPromptData',
  'rawFeedbackContent',
  'rawParentFeedback',
  'rawLearnerFeedback',
] as const;

// ── Type Helpers ──

export type GovernanceStatus = (typeof TASK027_GOVERNANCE_STATUSES)[number];
export type ExpansionDecision = (typeof TASK027_EXPANSION_DECISIONS)[number];
export type ReviewActorRole = (typeof TASK027_REVIEW_ACTOR_ROLES)[number];
export type ReviewGateStatus = (typeof TASK027_REVIEW_GATE_STATUSES)[number];
export type ExpansionProposalStatus = (typeof TASK027_EXPANSION_PROPOSAL_STATUSES)[number];
export type ExpansionScopeType = (typeof TASK027_EXPANSION_SCOPE_TYPES)[number];
export type RiskLevel = (typeof TASK027_RISK_LEVELS)[number];
export type EvidenceEventType = (typeof TASK027_EVIDENCE_EVENT_TYPES)[number];
export type TeacherReviewStatus = (typeof TASK027_TEACHER_REVIEW_STATUSES)[number];
export type AdminApprovalStatus = (typeof TASK027_ADMIN_APPROVAL_STATUSES)[number];
export type SafeguardingReviewStatus = (typeof TASK027_SAFEGUARDING_REVIEW_STATUSES)[number];
export type DeenReviewStatus = (typeof TASK027_DEEN_REVIEW_STATUSES)[number];
export type PrivacyReviewStatus = (typeof TASK027_PRIVACY_REVIEW_STATUSES)[number];
export type SocraticReviewStatus = (typeof TASK027_SOCRATIC_REVIEW_STATUSES)[number];
export type OperationsReviewStatus = (typeof TASK027_OPERATIONS_REVIEW_STATUSES)[number];
export type AcademicIntegrityReviewStatus = (typeof TASK027_ACADEMIC_INTEGRITY_REVIEW_STATUSES)[number];
export type ParentLearnerFeedbackStatus = (typeof TASK027_PARENT_LEARNER_FEEDBACK_STATUSES)[number];
export type BlockerType = (typeof TASK027_BLOCKER_TYPES)[number];
export type AuditEvent = (typeof TASK027_AUDIT_EVENTS)[number];

// ── Interfaces ──

export interface Task027GovernanceContext {
  schoolId: string;
  actorId: string;
  actorRole: ReviewActorRole;
  pilotRunId: string;
  governanceReviewId?: string;
  verifiedSchoolIdentity: boolean;
  task026CommitVerified: boolean;
  task025Accepted: boolean;
  task024Accepted: boolean;
}

export interface Task027Task026DependencyGateInput {
  schoolId: string;
  actorRole: ReviewActorRole;
  executionRunId: string;
  commitHash: string;
}

export interface Task027Task026DependencyGateResult {
  ok: boolean;
  commitVerified: boolean;
  safeToStartTask027: boolean;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027PilotExecutionEvidenceInput {
  schoolId: string;
  pilotRunId: string;
  executionRunId: string;
}

export interface Task027PilotExecutionEvidenceSummary {
  pilotRunId: string;
  schoolId: string;
  cohortSafeCount: number;
  sessionsStartedCount: number;
  sessionsBlockedCount: number;
  supportNeededCount: number;
  incidentCount: number;
  safeguardingSignalCount: number;
  pauseCount: number;
  rollbackCount: number;
  safeLearningQualitySignals: Record<string, unknown>;
  safeSocraticIntegritySignals: Record<string, unknown>;
  safeContentGovernanceSignals: Record<string, unknown>;
  safeOperationsSignals: Record<string, unknown>;
}

export interface Task027LearningQualityReviewInput {
  schoolId: string;
  pilotRunId: string;
  evidenceSummary: Task027PilotExecutionEvidenceSummary;
}

export interface Task027LearningQualityReviewResult {
  ok: boolean;
  reviewStatus: ReviewGateStatus;
  safeSummary: string;
  blockingIssues: string[];
  recommendations: string[];
}

export interface Task027CohortExpansionProposalInput {
  schoolId: string;
  pilotRunId: string;
  proposedCohortSize: number;
  proposedScopeLabels: string[];
  proposedClassOrGradeIds: string[];
  teacherOwnerSafeRefs: string[];
  supportOwnerSafeRefs: string[];
  curriculumSourceScopeIds: string[];
  startReadinessWindow: string;
  rollbackReadinessPath: string;
}

export interface Task027CohortExpansionProposal extends Task027CohortExpansionProposalInput {
  id: string;
  status: ExpansionProposalStatus;
  governanceBlockers: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Task027CohortExpansionEligibilityInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
}

export interface Task027CohortExpansionEligibilityResult {
  ok: boolean;
  eligible: boolean;
  sameSchoolVerified: boolean;
  curriculumScopeApproved: boolean;
  cohortSizeWithinLimits: boolean;
  teacherCoverageAdequate: boolean;
  supportCoverageAdequate: boolean;
  safeguardingPathExists: boolean;
  operationsCapacityAdequate: boolean;
  rollbackCapacityAdequate: boolean;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027ExpansionRiskAssessmentInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
}

export interface Task027ExpansionRiskAssessmentResult {
  ok: boolean;
  overallRiskLevel: RiskLevel;
  learningQualityRisk: RiskLevel;
  socraticIntegrityRisk: RiskLevel;
  academicIntegrityRisk: RiskLevel;
  privacyRisk: RiskLevel;
  safeguardingRisk: RiskLevel;
  deenContentRisk: RiskLevel;
  teacherWorkloadRisk: RiskLevel;
  operationsCapacityRisk: RiskLevel;
  rollbackReadinessRisk: RiskLevel;
  studentSupportRisk: RiskLevel;
  riskReasons: string[];
  mitigations: string[];
  requiresHumanReview: boolean;
  humanReviewReasonCodes: string[];
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027TeacherReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  teacherSafeId: string;
  safeSummary: string;
  supportConcerns: string[];
  learningQualityConcerns: string[];
  workloadConcerns: string[];
  recommendedDecision: string;
  safeReasonCodes: string[];
}

export interface Task027TeacherReviewResult {
  ok: boolean;
  reviewStatus: TeacherReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027SchoolAdminApprovalInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  adminSafeId: string;
  teacherReviewCompleted: boolean;
  riskAssessmentAcceptable: boolean;
  operationsCapacityAcceptable: boolean;
  privacyReviewPassed: boolean;
  safeguardingReviewPassed: boolean;
  contentDeenReviewPassed: boolean;
  rollbackPathReady: boolean;
  evidencePackGenerated: boolean;
  safeSummary: string;
  conditions: string[];
}

export interface Task027SchoolAdminApprovalResult {
  ok: boolean;
  approvalStatus: AdminApprovalStatus;
  blockingIssues: string[];
  safeMessage: string;
  safeToStartTask028: boolean;
}

export interface Task027ParentLearnerFeedbackReadinessInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
}

export interface Task027ParentLearnerFeedbackReadinessResult {
  ok: boolean;
  feedbackAvailable: boolean;
  feedbackSummarySafe: Record<string, unknown>;
  seriousUnresolvedConcerns: boolean;
  unresolvedSafeguardingSignal: boolean;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027SafeguardingReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  safeguardingOwnerSafeRef: string;
  seriousRiskDisclosureMinimal: boolean;
  humanReviewPathExists: boolean;
  roleScopedDisclosureOnly: boolean;
}

export interface Task027SafeguardingReviewResult {
  ok: boolean;
  reviewStatus: SafeguardingReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027DeenContentReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  approvedDeenSourcesVerified: boolean;
  deenContentPresent: boolean;
  noFatwaEngineBehavior: boolean;
  noPietyScoring: boolean;
  noSectarianJudgment: boolean;
  scholarReferralPathExists: boolean;
  contentSourcePolicyPassed: boolean;
}

export interface Task027DeenContentReviewResult {
  ok: boolean;
  reviewStatus: DeenReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027PrivacyReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  noRawLearnerData: boolean;
  noRawParentData: boolean;
  noRawTeacherNotes: boolean;
  noRawSafeguardingNotes: boolean;
  noPrivateDeenText: boolean;
  noProviderPayloads: boolean;
  noHiddenReasoning: boolean;
  minimalSafeMetadataOnly: boolean;
  roleScopedReportVisibility: boolean;
}

export interface Task027PrivacyReviewResult {
  ok: boolean;
  reviewStatus: PrivacyReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027SocraticIntegrityReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  noFinalAnswerShortcut: boolean;
  noAnswerKeyLeakage: boolean;
  hintLadderPreserved: boolean;
  studentAgencyPreserved: boolean;
  reflectionPromptsPreserved: boolean;
  cheatingPreventionPreserved: boolean;
  teacherOnlyMaterialProtected: boolean;
}

export interface Task027SocraticIntegrityReviewResult {
  ok: boolean;
  reviewStatus: SocraticReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027AcademicIntegrityReviewInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  noAnswerKeyLeakage: boolean;
  noHomeworkShortcutPattern: boolean;
  noFinalAnswerFirstBehavior: boolean;
  noProtectedRubricLeakage: boolean;
  noExamBypass: boolean;
  studentEffortEvidenceExists: boolean;
}

export interface Task027AcademicIntegrityReviewResult {
  ok: boolean;
  reviewStatus: AcademicIntegrityReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027OperationsHealthBudgetInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  monitoringCapacityOk: boolean;
  supportQueueCapacityOk: boolean;
  incidentResponseReadinessOk: boolean;
  latencyErrorBudgetAcceptable: boolean;
  pausePathReady: boolean;
  rollbackPathReady: boolean;
  killSwitchReady: boolean;
  teacherWorkloadAcceptable: boolean;
}

export interface Task027OperationsHealthBudgetResult {
  ok: boolean;
  reviewStatus: OperationsReviewStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027PauseRollbackReadinessInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  pauseCanBlockNewLearnerAccess: boolean;
  rollbackCanBlockExpansion: boolean;
  killSwitchExists: boolean;
  auditPreserved: boolean;
  noDestructiveDeletion: boolean;
  manualReviewPathExists: boolean;
}

export interface Task027PauseRollbackReadinessResult {
  ok: boolean;
  reviewStatus: ReviewGateStatus;
  blockingIssues: string[];
  safeMessage: string;
}

export interface Task027ExpansionEvidencePackInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
}

export interface Task027ExpansionEvidencePack {
  id: string;
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  safePilotExecutionSummary: Record<string, unknown>;
  learningQualityReview: Record<string, unknown>;
  cohortEligibilityResult: Record<string, unknown>;
  riskAssessmentResult: Record<string, unknown>;
  teacherReviewResult: Record<string, unknown>;
  adminApprovalResult: Record<string, unknown>;
  parentLearnerFeedbackResult: Record<string, unknown>;
  safeguardingReviewResult: Record<string, unknown>;
  deenContentReviewResult: Record<string, unknown>;
  privacyReviewResult: Record<string, unknown>;
  socraticIntegrityReviewResult: Record<string, unknown>;
  academicIntegrityReviewResult: Record<string, unknown>;
  operationsHealthBudgetReview: Record<string, unknown>;
  pauseRollbackReadinessReview: Record<string, unknown>;
  safeBlockers: string[];
  safeNextActions: string[];
  createdAt: Date;
}

export interface Task027GovernanceDecisionInput {
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
}

export interface Task027GovernanceDecision {
  id: string;
  schoolId: string;
  proposalId: string;
  pilotRunId: string;
  decision: ExpansionDecision;
  safeToStartTask028: boolean;
  safeToStartTask029: boolean;
  safeToStartTask040: boolean;
  blockingIssues: string[];
  conditions: string[];
  decisionSummary: string;
  decisionDetail: Record<string, unknown>;
  madeAt: Date;
}

export interface Task027GovernanceAuditEvent {
  id: string;
  schoolId: string;
  actorRole: ReviewActorRole;
  action: AuditEvent;
  safeSummary: string;
  metadataSafe: Record<string, unknown>;
  createdAt: Date;
}

export interface Task027GovernanceDiagnostics {
  governanceStarted: boolean;
  evidenceLoaded: boolean;
  learningQualityReviewed: boolean;
  proposalCreated: boolean;
  eligibilityChecked: boolean;
  riskAssessed: boolean;
  teacherReviewed: boolean;
  adminApproved: boolean;
  parentFeedbackReviewed: boolean;
  safeguardingReviewed: boolean;
  deenReviewed: boolean;
  privacyReviewed: boolean;
  socraticReviewed: boolean;
  academicIntegrityReviewed: boolean;
  operationsReviewed: boolean;
  rollbackReadinessChecked: boolean;
  evidencePackGenerated: boolean;
  decisionMade: boolean;
  currentDecision: string;
  safeToStartTask028: boolean;
  safeToStartTask029: boolean;
  safeToStartTask040: boolean;
  gateStatuses: Record<string, string>;
  blockingIssues: string[];
}

export interface Task027SafeExpansionGovernanceReport {
  taskId: string;
  scope: string;
  schoolId: string;
  pilotRunId: string;
  generatedAt: string;
  governanceDecision: Task027GovernanceDecision;
  evidencePack: Task027ExpansionEvidencePack;
  diagnostics: Task027GovernanceDiagnostics;
  safeSummary: string;
  safeToStartTask028: boolean;
  safeToStartTask029: boolean;
  safeToStartTask040: boolean;
}

export interface Task027AcceptanceReport {
  taskId: string;
  verdict: string;
  commandsRun: string[];
  filesCreated: string[];
  filesModified: string[];
  filesStaged: string[];
  remainingBlockers: string[];
  safeToStartTask028: boolean;
}
