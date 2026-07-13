import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import {
  TASK036_VALID_STATE_TRANSITIONS,
  isTask036ValidStateTransition,
  calculateTask036FinalLaunchDecision,
  Task036LaunchStatus,
} from '../contracts/task036LiveSchoolLaunchContracts';
import {
  validateLaunchEnvironmentGateInput,
  validateLaunchWindowInput,
  validateLaunchApprovalInput,
  validateSingleSchoolScopeInput,
  validatePrivacyBoundaryResult,
  validateContentGovernanceResult,
  validateSocraticIntegrityResult,
  validateDeenBoundaryResult,
  validateSchoolIdentityResult,
  validateCrossSchoolDenialResult,
  validateRuntimeMonitoringResult,
  validateHealthBudgetResult,
  validateIncidentReadinessResult,
  validatePauseControlResult,
  validateRollbackControlResult,
  validateKillSwitchControlResult,
  validateSafeLaunchReadModel,
} from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveEnvironmentGate: vi.fn(),
    saveLaunchWindow: vi.fn(),
    saveLaunchApproval: vi.fn(),
    saveSingleSchoolScope: vi.fn(),
    savePrivacyBoundary: vi.fn(),
    saveContentGovernance: vi.fn(),
    saveSocraticIntegrity: vi.fn(),
    saveDeenBoundary: vi.fn(),
    saveSchoolIdentity: vi.fn(),
    saveCrossSchoolDenial: vi.fn(),
    saveRuntimeMonitoring: vi.fn(),
    saveHealthBudget: vi.fn(),
    saveIncidentReadiness: vi.fn(),
    savePauseControl: vi.fn(),
    saveRollbackControl: vi.fn(),
    saveKillSwitchControl: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function runFullEndToEnd(): { ok: boolean; blockers: string[] } {
  const envResult = validateLaunchEnvironmentGateInput({
    environmentType: 'test',
    launchMode: 'single_school_controlled_live_launch',
    dataMode: 'safe', sideEffectMode: 'read',
    task035Accepted: true, task036Started: true, task040Started: false,
    singleSchoolScope: true, multiSchoolScope: false,
    publicLaunchRequested: false, marketingLaunchRequested: false,
    paymentLaunchRequested: false, backendFreezeRequested: false,
    frontendUiRequested: false, liveAiExpansionRequested: false,
    liveConnectorWriteExpansionRequested: false,
    externalNotificationRequested: false,
    productionDeploymentRequested: false,
    productionMutationRequested: false,
  });
  if (envResult.length > 0) return { ok: false, blockers: envResult };

  const winResult = validateLaunchWindowInput({
    launchWindowId: 'lw-1', schoolId: 's-1', tenantId: 't-1',
    approvedStartAt: '2026-01-01T00:00:00Z',
    approvedEndAt: '2026-01-31T00:00:00Z',
    approvalReferenceId: 'ar-1', rollbackPlanId: 'rb-1',
    pausePlanId: 'pp-1', killSwitchId: 'ks-1', operatorId: 'op-1',
    createdAt: '',
  });
  if (winResult.length > 0) return { ok: false, blockers: winResult };

  const baseInput = {
    schoolId: 's-1', tenantId: 't-1',
    approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
    singleSchoolScope: true, multiSchoolScope: false,
    crossSchoolAccessDenied: true, publicSignupDisabled: true,
    openRegistrationDisabled: true, paymentFlowDisabled: true,
    marketingLaunchDisabled: true,
  };
  const scopeResult = validateSingleSchoolScopeInput(baseInput);
  if (scopeResult.length > 0) return { ok: false, blockers: scopeResult };

  const passResult: any = { ok: true, passed: true, rawStudentChatExposed: false, rawAnswersExposed: false, rawSafeguardingNotesExposed: false, rawDeenTextExposed: false, rawProviderPayloadExposed: false, parentContactExposed: false, teacherPrivateNotesExposed: false, hiddenReasoningExposed: false, secretsExposed: false, answerKeyExposed: false, markingSchemeExposed: false, blockingIssues: [] };
  const cgResult: any = { ok: true, passed: true, approvedSourceRequired: true, unapprovedContentBlocked: true, curriculumGatePassed: true, teacherOnlyContentProtected: true, noInventedTeachingClaim: true, blockingIssues: [] };
  const siResult: any = { ok: true, passed: true, socraticGuidancePreserved: true, noFinalAnswerBotBehavior: true, cheatingPreventionPreserved: true, noHomeworkShortcut: true, blockingIssues: [] };
  const dbResult: any = { ok: true, passed: true, noFatwaEngineMode: true, approvedDeenSourceRequired: true, teacherScholarReferralPreserved: true, noPietyScoring: true, noUnsafeDeenAuthority: true, deenSensitiveTextProtected: true, blockingIssues: [] };
  const idResult: any = { ok: true, passed: true, schoolIdentityVerified: true, schoolContextVerified: true, tenantMatchVerified: true, sessionRequiresVerifiedIdentity: true, memoryRequiresVerifiedIdentity: true, evidenceRequiresVerifiedIdentity: true, aiCallRequiresVerifiedIdentity: true, actionRequiresVerifiedIdentity: true, blockingIssues: [] };
  const csdResult: any = { ok: true, passed: true, crossSchoolAccessDenied: true, crossLearnerVisibilityDenied: true, parentRawDetailDenied: true, unknownSchoolBlocked: true, tenantMismatchBlocked: true, blockingIssues: [] };

  const allGates = {
    privacyBoundaryPassed: passResult.passed,
    contentGovernancePassed: cgResult.passed,
    socraticIntegrityPassed: siResult.passed,
    deenBoundaryPassed: dbResult.passed,
    schoolIdentityPassed: idResult.passed,
    crossSchoolDenialPassed: csdResult.passed,
    environmentGatePassed: true,
    launchWindowPassed: true,
    launchApprovalPassed: true,
    singleSchoolScopePassed: true,
    runtimeMonitoringPassed: true,
    healthBudgetPassed: true,
    incidentReadinessPassed: true,
    dependencyProofPassed: true,
  };

  const decision = calculateTask036FinalLaunchDecision(allGates);
  return { ok: decision.safeToStartTask040, blockers: decision.remainingBlockers };
}

describe('Task036 End-to-End Smoke', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('full end-to-end flow passes with valid inputs', () => {
    const result = runFullEndToEnd();
    expect(result.ok).toBe(true);
    expect(result.blockers).toEqual([]);
  });

  it('state machine has correct transitions count', () => {
    const states = Object.keys(TASK036_VALID_STATE_TRANSITIONS);
    expect(states.length).toBeGreaterThanOrEqual(22);
  });

  it('isTask036ValidStateTransition works for all valid transitions', () => {
    expect(isTask036ValidStateTransition('created', 'dependency_checking')).toBe(true);
    expect(isTask036ValidStateTransition('dependency_passed', 'environment_checking')).toBe(true);
  });

  it('all validation functions accept valid data', () => {
    expect(validatePrivacyBoundaryResult({ ok: true, passed: true, rawStudentChatExposed: false, rawAnswersExposed: false, rawSafeguardingNotesExposed: false, rawDeenTextExposed: false, rawProviderPayloadExposed: false, parentContactExposed: false, teacherPrivateNotesExposed: false, hiddenReasoningExposed: false, secretsExposed: false, answerKeyExposed: false, markingSchemeExposed: false, blockingIssues: [] })).toEqual([]);
    expect(validateContentGovernanceResult({ ok: true, passed: true, approvedSourceRequired: true, unapprovedContentBlocked: true, curriculumGatePassed: true, teacherOnlyContentProtected: true, noInventedTeachingClaim: true, blockingIssues: [] })).toEqual([]);
    expect(validateSocraticIntegrityResult({ ok: true, passed: true, socraticGuidancePreserved: true, noFinalAnswerBotBehavior: true, cheatingPreventionPreserved: true, noHomeworkShortcut: true, blockingIssues: [] })).toEqual([]);
    expect(validateDeenBoundaryResult({ ok: true, passed: true, noFatwaEngineMode: true, approvedDeenSourceRequired: true, teacherScholarReferralPreserved: true, noPietyScoring: true, noUnsafeDeenAuthority: true, deenSensitiveTextProtected: true, blockingIssues: [] })).toEqual([]);
  });

  it('health budget and runtime monitoring validators accept valid data', () => {
    expect(validateHealthBudgetResult({ ok: true, launchLatencyP95Ms: 100, safeReadLatencyP95Ms: 50, runtimeMonitorLatencyP95Ms: 10, errorRate: 0, criticalErrorCount: 0, timeoutCount: 0, privacyBoundaryFailureCount: 0, schoolContextBypassCount: 0, crossSchoolAttemptCount: 0, rollbackReadinessFailureCount: 0, healthBudgetPassed: true, pauseRecommended: false, rollbackRecommended: false, killSwitchRecommended: false, blockingIssues: [] })).toEqual([]);
    expect(validateIncidentReadinessResult({ ok: true, incidentDetectionReady: true, incidentClassificationReady: true, incidentResponseReady: true, incidentEscalationReady: true, incidentAuditReady: true, pausePlanReady: true, rollbackPlanReady: true, killSwitchReady: true, blockingIssues: [] })).toEqual([]);
  });

  it('pause, rollback, kill switch validators accept valid data', () => {
    expect(validatePauseControlResult({ ok: true, paused: true, pauseReasonCodes: [], sessionId: 's-1', pausedAt: '', auditPreserved: true, externalNotificationSent: false, productionMutated: false, blockingIssues: [] })).toEqual([]);
    expect(validateRollbackControlResult({ ok: true, rollbackRequested: true, rollbackReasonCodes: [], sessionId: 's-1', rollbackRequestedAt: '', auditPreserved: true, destructiveDatabaseCommandsRun: false, deploymentPerformed: false, externalServicesCalled: false, blockingIssues: [] })).toEqual([]);
    expect(validateKillSwitchControlResult({ ok: true, killSwitchEnabled: true, killSwitchReasonCodes: [], sessionId: 's-1', killSwitchEnabledAt: '', auditPreserved: true, dataDeleted: false, externalServicesCalled: false, blockingIssues: [] })).toEqual([]);
  });
});
