import { describe, it, expect } from 'vitest';
import {
  validateTask035DependencyProof,
  validateLaunchEnvironmentGateInput,
  validateFinalLaunchDecision,
  validateReportTruth,
  validateLaunchApprovalInput,
  validateSingleSchoolScopeInput,
} from '../lib/task036LiveSchoolLaunchValidation';
import {
  calculateTask036FinalLaunchDecision,
} from '../contracts/task036LiveSchoolLaunchContracts';

describe('No False Pass Contract', () => {
  it('rejects dependency proof with handoff missing', () => {
    const proof: any = {
      ok: true, handoffExists: false, reportExists: true,
      jsonReportExists: true, verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true, safeToStartTask040: false,
      remainingBlockersEmpty: true, focusedTestsPassed: true,
      continuityTestsPassed: true, routeContractsPassed: true,
      roleSecurityTestsPassed: true, noSafetyTestsPassed: true,
      verificationScriptPassed: true, typeScriptPassed: true,
      backendBuildPassed: true, prismaValidatePassed: true,
      prismaGeneratePassed: true, noTask036InsideTask035: true,
      noTask040InsideTask035: true, noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true, blockingIssues: [],
      loadedAt: '',
    };
    const errors = validateTask035DependencyProof(proof);
    expect(errors).toContain('task035_handoff_not_found');
  });

  it('rejects environment gate with production environment', () => {
    const errors = validateLaunchEnvironmentGateInput({
      environmentType: 'production' as any,
      launchMode: 'single_school_controlled_live_launch' as any,
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
    expect(errors).toContain('disallowed_environment_type');
  });

  it('rejects approval from denied role', () => {
    const errors = validateLaunchApprovalInput({
      approvalId: 'a-1', sessionId: 's-1', role: 'student' as const,
      schoolId: 'sch-1', tenantId: 't-1', approvedAt: '',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    });
    expect(errors).toContain('role_denied_approval_authority');
  });

  it('rejects single school scope without cross school denial', () => {
    const errors = validateSingleSchoolScopeInput({
      schoolId: 's-1', tenantId: 't-1',
      approvedSchoolConfigExists: true, approvedRosterSnapshotExists: true,
      singleSchoolScope: true, multiSchoolScope: false,
      crossSchoolAccessDenied: false, publicSignupDisabled: true,
      openRegistrationDisabled: true, paymentFlowDisabled: true,
      marketingLaunchDisabled: true,
    });
    expect(errors).toContain('cross_school_access_not_denied');
  });

  it('final decision blocks when gate is false', () => {
    const decision = calculateTask036FinalLaunchDecision({
      dependencyProofPassed: true,
      environmentGatePassed: false,
    });
    expect(decision.safeToStartTask040).toBe(false);
    expect(decision.finalDecision).toBe('TASK_036_BLOCKED');
  });

  it('report validation detects false safeToStartTask040', () => {
    const report: any = {
      safeToStartTask040: true,
      verdict: 'ACCEPTED_READY_YES',
      remainingBlockers: ['blocker'],
    };
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_safe_to_start_true_with_blockers');
  });

  it('final decision validation detects inconsistency', () => {
    const errors = validateFinalLaunchDecision({
      safeToStartTask040: true,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040',
      remainingBlockers: ['blocker'],
      allGatesPassed: false,
      dependencyProofPassed: false, environmentGatePassed: false,
      launchWindowPassed: false, launchApprovalPassed: false,
      singleSchoolScopePassed: false, privacyBoundaryPassed: false,
      contentGovernancePassed: false, socraticIntegrityPassed: false,
      deenBoundaryPassed: false, schoolIdentityPassed: false,
      crossSchoolDenialPassed: false, runtimeMonitoringPassed: false,
      healthBudgetPassed: false, incidentReadinessPassed: false,
      computedAt: '',
    });
    expect(errors).toContain('safe_to_start_task040_true_with_blockers');
  });
});
