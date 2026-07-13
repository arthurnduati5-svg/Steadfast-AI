import { describe, it, expect } from 'vitest';
import {
  validateTask035DependencyProof,
  validateLaunchEnvironmentGateInput,
  validateLaunchWindowInput,
  validateLaunchWindowResult,
  validateLaunchApprovalInput,
  validateLaunchApprovalResult,
  validateSingleSchoolScopeInput,
  validateSingleSchoolScopeResult,
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
  validateFinalLaunchDecision,
  validateReportTruth,
  validateForbiddenOutputFields,
  validateForbiddenSideEffects,
  validateFutureTaskBoundaries,
} from '../lib/task036LiveSchoolLaunchValidation';

describe('Validation - Task035 Dependency Proof', () => {
  it('returns no errors for a valid proof', () => {
    const proof = {
      ok: true,
      handoffExists: true,
      reportExists: true,
      jsonReportExists: true,
      verdictIsAcceptedReadyYes: true,
      safeToStartTask036: true,
      safeToStartTask040: false,
      remainingBlockersEmpty: true,
      focusedTestsPassed: true,
      continuityTestsPassed: true,
      routeContractsPassed: true,
      roleSecurityTestsPassed: true,
      noSafetyTestsPassed: true,
      verificationScriptPassed: true,
      typeScriptPassed: true,
      backendBuildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      noTask036InsideTask035: true,
      noTask040InsideTask035: true,
      noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true,
      blockingIssues: [],
      loadedAt: new Date().toISOString(),
    };
    const errors = validateTask035DependencyProof(proof);
    expect(errors).toEqual([]);
  });

  it('returns errors when proof fails', () => {
    const proof = {
      ok: false,
      handoffExists: false,
      reportExists: false,
      jsonReportExists: false,
      verdictIsAcceptedReadyYes: false,
      safeToStartTask036: false,
      safeToStartTask040: true,
      remainingBlockersEmpty: false,
      focusedTestsPassed: false,
      continuityTestsPassed: false,
      routeContractsPassed: true,
      roleSecurityTestsPassed: true,
      noSafetyTestsPassed: true,
      verificationScriptPassed: true,
      typeScriptPassed: true,
      backendBuildPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      noTask036InsideTask035: true,
      noTask040InsideTask035: true,
      noFrontendUiInsideTask035: true,
      noLiveLaunchInsideTask035: true,
      blockingIssues: ['issue1'],
      loadedAt: new Date().toISOString(),
    };
    const errors = validateTask035DependencyProof(proof);
    expect(errors).toContain('task035_dependency_proof_not_ok');
    expect(errors).toContain('task035_handoff_not_found');
    expect(errors).toContain('task035_report_not_found');
    expect(errors).toContain('task035_json_report_not_found');
    expect(errors).toContain('task035_verdict_not_accepted_ready_yes');
    expect(errors).toContain('task035_safeToStartTask036_not_true');
    expect(errors).toContain('task035_safeToStartTask040_should_be_false');
    expect(errors).toContain('task035_remaining_blockers_not_empty');
    expect(errors).toContain('task035_focused_tests_not_passed');
    expect(errors).toContain('task035_continuity_tests_not_passed');
  });
});

describe('Validation - Launch Environment Gate Input', () => {
  it('returns no errors for valid input', () => {
    const input = {
      environmentType: 'controlled_live_school_launch' as const,
      launchMode: 'single_school_controlled_live_launch' as const,
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      task036Started: true,
      task040Started: false,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    };
    const errors = validateLaunchEnvironmentGateInput(input);
    expect(errors).toEqual([]);
  });

  it('returns errors for disallowed environment type', () => {
    const input = {
      environmentType: 'production' as any,
      launchMode: 'single_school_controlled_live_launch' as any,
      dataMode: 'safe_summary_only',
      sideEffectMode: 'read_only',
      task035Accepted: true,
      task036Started: true,
      task040Started: false,
      singleSchoolScope: true,
      multiSchoolScope: false,
      publicLaunchRequested: false,
      marketingLaunchRequested: false,
      paymentLaunchRequested: false,
      backendFreezeRequested: false,
      frontendUiRequested: false,
      liveAiExpansionRequested: false,
      liveConnectorWriteExpansionRequested: false,
      externalNotificationRequested: false,
      productionDeploymentRequested: false,
      productionMutationRequested: false,
    };
    const errors = validateLaunchEnvironmentGateInput(input);
    expect(errors).toContain('disallowed_environment_type');
  });
});

describe('Validation - Launch Window Input', () => {
  it('returns no errors for valid input', () => {
    const input = {
      launchWindowId: 'lw-1',
      schoolId: 'school-1',
      tenantId: 'tenant-1',
      approvedStartAt: '2026-01-01T00:00:00Z',
      approvedEndAt: '2026-01-31T00:00:00Z',
      approvalReferenceId: 'ar-1',
      rollbackPlanId: 'rb-1',
      pausePlanId: 'pp-1',
      killSwitchId: 'ks-1',
      operatorId: 'op-1',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const errors = validateLaunchWindowInput(input);
    expect(errors).toEqual([]);
  });

  it('returns errors when required fields are missing', () => {
    const input = {
      launchWindowId: '',
      schoolId: '',
      tenantId: '',
      approvedStartAt: '',
      approvedEndAt: '',
      approvalReferenceId: '',
      rollbackPlanId: '',
      pausePlanId: '',
      killSwitchId: '',
      operatorId: '',
      createdAt: '2026-01-01T00:00:00Z',
    };
    const errors = validateLaunchWindowInput(input);
    expect(errors.length).toBe(10);
    expect(errors).toContain('missing_launch_window_id');
    expect(errors).toContain('missing_school_id');
    expect(errors).toContain('missing_tenant_id');
    expect(errors).toContain('missing_approved_start_at');
    expect(errors).toContain('missing_approved_end_at');
    expect(errors).toContain('missing_rollback_plan_id');
    expect(errors).toContain('missing_kill_switch_id');
  });
});

describe('Validation - Launch Window Result', () => {
  it('returns errors when result indicates failure', () => {
    const result = {
      ok: false,
      passed: false,
      launchWindowId: 'lw-1',
      schoolId: 's-1',
      tenantId: 't-1',
      approvedStartAt: '',
      approvedEndAt: '',
      approvalReferenceId: '',
      rollbackPlanId: '',
      pausePlanId: '',
      killSwitchId: '',
      operatorId: '',
      isExpired: true,
      isOpenEnded: true,
      isWithinApprovedTime: false,
      hasRollbackPlan: false,
      hasPausePlan: false,
      hasKillSwitch: false,
      blockingIssues: [],
    };
    const errors = validateLaunchWindowResult(result);
    expect(errors).toContain('launch_window_not_ok');
    expect(errors).toContain('launch_window_not_passed');
    expect(errors).toContain('launch_window_expired');
    expect(errors).toContain('launch_window_open_ended');
    expect(errors).toContain('launch_window_outside_approved_time');
    expect(errors).toContain('launch_window_no_rollback_plan');
    expect(errors).toContain('launch_window_no_pause_plan');
    expect(errors).toContain('launch_window_no_kill_switch');
  });
});

describe('Validation - Launch Approval Input', () => {
  it('returns no errors for valid input', () => {
    const input = {
      approvalId: 'a-1',
      sessionId: 's-1',
      role: 'school_admin' as const,
      schoolId: 'sch-1',
      tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const errors = validateLaunchApprovalInput(input);
    expect(errors).toEqual([]);
  });

  it('returns errors for denied role', () => {
    const input = {
      approvalId: 'a-1',
      sessionId: 's-1',
      role: 'student' as const,
      schoolId: 'sch-1',
      tenantId: 't-1',
      approvedAt: '2026-01-01T00:00:00Z',
      approvalRefersToRawPrivateData: false,
      approvalRequestsPublicLaunch: false,
      approvalRequestsMultiSchoolLaunch: false,
      approvalRequestsBackendFreeze: false,
    };
    const errors = validateLaunchApprovalInput(input);
    expect(errors).toContain('role_denied_approval_authority');
  });
});

describe('Validation - Privacy Boundary Result', () => {
  it('returns errors when privacy is breached', () => {
    const result = {
      ok: false,
      passed: false,
      rawStudentChatExposed: true,
      rawAnswersExposed: true,
      rawSafeguardingNotesExposed: false,
      rawDeenTextExposed: false,
      rawProviderPayloadExposed: false,
      parentContactExposed: true,
      teacherPrivateNotesExposed: false,
      hiddenReasoningExposed: true,
      secretsExposed: false,
      answerKeyExposed: false,
      markingSchemeExposed: false,
      blockingIssues: [],
    };
    const errors = validatePrivacyBoundaryResult(result);
    expect(errors).toContain('privacy_boundary_not_ok');
    expect(errors).toContain('privacy_boundary_not_passed');
    expect(errors).toContain('raw_student_chat_exposed');
    expect(errors).toContain('raw_answers_exposed');
    expect(errors).toContain('parent_contact_exposed');
    expect(errors).toContain('hidden_reasoning_exposed');
  });
});

describe('Validation - Content Governance Result', () => {
  it('returns errors when governance gate fails', () => {
    const result = {
      ok: false,
      passed: false,
      approvedSourceRequired: false,
      unapprovedContentBlocked: false,
      curriculumGatePassed: false,
      teacherOnlyContentProtected: false,
      noInventedTeachingClaim: false,
      blockingIssues: [],
    };
    const errors = validateContentGovernanceResult(result);
    expect(errors.length).toBe(7);
    expect(errors).toContain('content_governance_not_ok');
    expect(errors).toContain('approved_source_not_required');
    expect(errors).toContain('unapproved_content_not_blocked');
    expect(errors).toContain('curriculum_gate_not_passed');
    expect(errors).toContain('teacher_only_content_not_protected');
  });
});

describe('Validation - Socratic Integrity Result', () => {
  it('returns errors when integrity gate fails', () => {
    const result = {
      ok: false,
      passed: false,
      socraticGuidancePreserved: false,
      noFinalAnswerBotBehavior: true,
      cheatingPreventionPreserved: false,
      noHomeworkShortcut: true,
      blockingIssues: [],
    };
    const errors = validateSocraticIntegrityResult(result);
    expect(errors).toContain('socratic_integrity_not_ok');
    expect(errors).toContain('socratic_guidance_not_preserved');
    expect(errors).toContain('cheating_prevention_not_preserved');
    expect(errors.length).toBe(4);
  });
});

describe('Validation - Deen Boundary Result', () => {
  it('returns errors when deen boundary gate fails', () => {
    const result = {
      ok: false,
      passed: false,
      noFatwaEngineMode: false,
      approvedDeenSourceRequired: false,
      teacherScholarReferralPreserved: false,
      noPietyScoring: false,
      noUnsafeDeenAuthority: false,
      deenSensitiveTextProtected: false,
      blockingIssues: [],
    };
    const errors = validateDeenBoundaryResult(result);
    expect(errors).toContain('deen_boundary_not_ok');
    expect(errors).toContain('fatwa_engine_mode_detected');
    expect(errors).toContain('approved_deen_source_not_required');
    expect(errors).toContain('piety_scoring_detected');
    expect(errors).toContain('unsafe_deen_authority_detected');
    expect(errors).toContain('deen_sensitive_text_not_protected');
  });
});

describe('Validation - School Identity Result', () => {
  it('returns errors when identity gate fails', () => {
    const result = {
      ok: false,
      passed: false,
      schoolIdentityVerified: false,
      schoolContextVerified: false,
      tenantMatchVerified: false,
      sessionRequiresVerifiedIdentity: false,
      memoryRequiresVerifiedIdentity: false,
      evidenceRequiresVerifiedIdentity: false,
      aiCallRequiresVerifiedIdentity: false,
      actionRequiresVerifiedIdentity: false,
      blockingIssues: [],
    };
    const errors = validateSchoolIdentityResult(result);
    expect(errors.length).toBe(10);
    expect(errors).toContain('school_identity_not_verified');
    expect(errors).toContain('tenant_mismatch');
    expect(errors).toContain('session_identity_not_required');
    expect(errors).toContain('ai_call_identity_not_required');
  });
});

describe('Validation - Cross School Denial Result', () => {
  it('returns errors when denial gate fails', () => {
    const result = {
      ok: false,
      passed: false,
      crossSchoolAccessDenied: false,
      crossLearnerVisibilityDenied: false,
      parentRawDetailDenied: false,
      unknownSchoolBlocked: false,
      tenantMismatchBlocked: false,
      blockingIssues: [],
    };
    const errors = validateCrossSchoolDenialResult(result);
    expect(errors.length).toBe(7);
    expect(errors).toContain('cross_school_access_not_denied');
    expect(errors).toContain('cross_learner_visibility_not_denied');
  });
});

describe('Validation - Runtime Monitoring Result', () => {
  it('detects forbidden fields in monitoring result', () => {
    const result = {
      ok: false,
      activeLaunchSessionCount: 0,
      safeRequestCount: 0,
      safeDeniedRequestCount: 0,
      runtimeGuardDenialCount: 0,
      schoolContextBypassAttemptCount: 0,
      crossSchoolAttemptCount: 0,
      privacyBoundaryFailureCount: 0,
      contentGovernanceFailureCount: 0,
      socraticIntegrityFailureCount: 0,
      deenBoundaryFailureCount: 0,
      incidentSignalCount: 0,
      criticalIncidentSignalCount: 0,
      pauseRecommended: false,
      rollbackRecommended: false,
      killSwitchRecommended: false,
      generatedAt: new Date().toISOString(),
      blockingIssues: [],
    };
    const errors = validateRuntimeMonitoringResult(result);
    expect(errors).toContain('runtime_monitoring_not_ok');
  });
});

describe('Validation - Health Budget Result', () => {
  it('returns errors when budget not passed', () => {
    const result = {
      ok: false,
      launchLatencyP95Ms: 0,
      safeReadLatencyP95Ms: 0,
      runtimeMonitorLatencyP95Ms: 0,
      errorRate: 0,
      criticalErrorCount: 0,
      timeoutCount: 0,
      privacyBoundaryFailureCount: 0,
      schoolContextBypassCount: 0,
      crossSchoolAttemptCount: 0,
      rollbackReadinessFailureCount: 0,
      healthBudgetPassed: false,
      pauseRecommended: false,
      rollbackRecommended: false,
      killSwitchRecommended: false,
      blockingIssues: [],
    };
    const errors = validateHealthBudgetResult(result);
    expect(errors).toContain('health_budget_not_ok');
    expect(errors).toContain('health_budget_not_passed');
  });
});

describe('Validation - Incident Readiness Result', () => {
  it('returns errors when not ready', () => {
    const result = {
      ok: false,
      incidentDetectionReady: false,
      incidentClassificationReady: false,
      incidentResponseReady: false,
      incidentEscalationReady: false,
      incidentAuditReady: false,
      pausePlanReady: false,
      rollbackPlanReady: false,
      killSwitchReady: false,
      blockingIssues: [],
    };
    const errors = validateIncidentReadinessResult(result);
    expect(errors.length).toBe(9);
    expect(errors).toContain('incident_detection_not_ready');
    expect(errors).toContain('incident_classification_not_ready');
    expect(errors).toContain('kill_switch_not_ready');
  });
});

describe('Validation - Pause Control Result', () => {
  it('returns errors when pause fails', () => {
    const result = {
      ok: false,
      paused: false,
      pauseReasonCodes: [],
      sessionId: 's-1',
      pausedAt: '',
      auditPreserved: false,
      externalNotificationSent: true,
      productionMutated: true,
      blockingIssues: [],
    };
    const errors = validatePauseControlResult(result);
    expect(errors).toContain('pause_control_not_ok');
    expect(errors).toContain('pause_not_executed');
    expect(errors).toContain('pause_audit_not_preserved');
    expect(errors).toContain('pause_sent_external_notification');
    expect(errors).toContain('pause_produced_mutation');
  });
});

describe('Validation - Rollback Control Result', () => {
  it('returns errors when rollback fails', () => {
    const result = {
      ok: false,
      rollbackRequested: false,
      rollbackReasonCodes: [],
      sessionId: 's-1',
      rollbackRequestedAt: '',
      auditPreserved: false,
      destructiveDatabaseCommandsRun: true,
      deploymentPerformed: true,
      externalServicesCalled: true,
      blockingIssues: [],
    };
    const errors = validateRollbackControlResult(result);
    expect(errors).toContain('rollback_control_not_ok');
    expect(errors).toContain('rollback_not_requested');
    expect(errors).toContain('rollback_audit_not_preserved');
    expect(errors).toContain('rollback_ran_destructive_db_commands');
    expect(errors).toContain('rollback_called_external_services');
  });
});

describe('Validation - Kill Switch Control Result', () => {
  it('returns errors when kill switch fails', () => {
    const result = {
      ok: false,
      killSwitchEnabled: false,
      killSwitchReasonCodes: [],
      sessionId: 's-1',
      killSwitchEnabledAt: '',
      auditPreserved: false,
      dataDeleted: true,
      externalServicesCalled: true,
      blockingIssues: [],
    };
    const errors = validateKillSwitchControlResult(result);
    expect(errors).toContain('kill_switch_control_not_ok');
    expect(errors).toContain('kill_switch_not_enabled');
    expect(errors).toContain('kill_switch_audit_not_preserved');
    expect(errors).toContain('kill_switch_deleted_data');
    expect(errors).toContain('kill_switch_called_external_services');
  });
});

describe('Validation - Safe Launch Read Model', () => {
  it('returns errors when model is invalid', () => {
    const model = {
      ok: false,
      sessionId: '',
      schoolId: '',
      status: 'blocked',
      launchWindowResult: null,
      environmentGateResult: null,
      approvalResult: null,
      singleSchoolScopeResult: null,
      privacyBoundaryResult: null,
      contentGovernanceResult: null,
      socraticIntegrityResult: null,
      deenBoundaryResult: null,
      schoolIdentityResult: null,
      crossSchoolDenialResult: null,
      runtimeMonitoringResult: null,
      healthBudgetResult: null,
      incidentReadinessResult: null,
      safeSummariesOnly: false,
      generatedAt: new Date().toISOString(),
    };
    const errors = validateSafeLaunchReadModel(model);
    expect(errors).toContain('safe_launch_read_model_not_ok');
    expect(errors).toContain('safe_launch_read_model_no_session_id');
    expect(errors).toContain('safe_launch_read_model_not_safe_summaries_only');
  });
});

describe('Validation - Final Launch Decision', () => {
  it('errors when safe to start with blockers present', () => {
    const decision = {
      safeToStartTask040: true,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040' as const,
      remainingBlockers: ['some_blocker'],
      allGatesPassed: true,
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
      computedAt: new Date().toISOString(),
    };
    const errors = validateFinalLaunchDecision(decision);
    expect(errors).toContain('safe_to_start_task040_true_with_blockers');
  });

  it('errors when decision mismatches safe flag', () => {
    const decision = {
      safeToStartTask040: false,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040' as const,
      remainingBlockers: [],
      allGatesPassed: false,
      dependencyProofPassed: false,
      environmentGatePassed: false,
      launchWindowPassed: false,
      launchApprovalPassed: false,
      singleSchoolScopePassed: false,
      privacyBoundaryPassed: false,
      contentGovernancePassed: false,
      socraticIntegrityPassed: false,
      deenBoundaryPassed: false,
      schoolIdentityPassed: false,
      crossSchoolDenialPassed: false,
      runtimeMonitoringPassed: false,
      healthBudgetPassed: false,
      incidentReadinessPassed: false,
      computedAt: new Date().toISOString(),
    };
    const errors = validateFinalLaunchDecision(decision);
    expect(errors).toContain('final_decision_mismatch_safe_to_start');
  });

  it('passes when consistent and correct', () => {
    const decision = {
      safeToStartTask040: true,
      finalDecision: 'TASK_036_PASS_SAFE_TO_START_TASK_040' as const,
      remainingBlockers: [],
      allGatesPassed: true,
      dependencyProofPassed: true,
      environmentGatePassed: true,
      launchWindowPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
      computedAt: new Date().toISOString(),
    };
    expect(validateFinalLaunchDecision(decision)).toEqual([]);
  });
});

describe('Validation - Report Truth', () => {
  it('errors when verdict accepted but blockers remain', () => {
    const report = {
      taskId: 'task036',
      scope: 'live_school_launch',
      task035DependencyVerified: true,
      task036Started: true,
      task040Started: false,
      frontendUiCreated: false,
      publicLaunchCreated: false,
      multiSchoolRolloutCreated: false,
      backendFreezeCreated: false,
      productionDeploymentIntroduced: false,
      realNotificationsSent: false,
      liveAiExpansionIntroduced: false,
      liveSchoolConnectorWriteExpansionIntroduced: false,
      productionDataMutationExecuted: false,
      rawPrivateDataStored: false,
      controlledLiveSchoolLaunchCreated: true,
      contractsCreatedOrUpdated: true,
      validationCreatedOrUpdated: true,
      repositoryCreatedOrUpdated: true,
      servicesCreatedOrUpdated: true,
      routesCreatedOrUpdated: true,
      routesMountedOrDirectlyTested: false,
      verifiedSchoolContextRequired: true,
      task035AcceptanceRequired: true,
      launchEnvironmentGatePassed: true,
      launchWindowControlPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      liveLaunchStateMachinePassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
      pauseControlPassed: true,
      rollbackControlPassed: true,
      killSwitchControlPassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      safeLaunchReadModelPassed: true,
      evidenceLedgerPassed: true,
      diagnosticsPassed: true,
      finalLaunchDecisionPassed: true,
      reportPassed: true,
      task036FocusedTestsRun: true,
      task036FocusedTestsPassed: true,
      task036FocusedTestFiles: 70,
      task036FocusedTestsPassedCount: 70,
      task036FocusedTestsFailedCount: 0,
      task020To035RegressionRun: true,
      task020To035RegressionPassed: true,
      phase3RegressionRun: true,
      phase3RegressionPassed: true,
      fullBackendSuiteRun: true,
      fullBackendSuitePassed: true,
      fullBackendSuiteFailedFiles: [],
      fullBackendSuiteFailedTests: [],
      prismaValidateRun: true,
      prismaValidatePassed: true,
      prismaGenerateRun: true,
      prismaGeneratePassed: true,
      backendBuildRun: true,
      backendBuildPassed: true,
      backendTypecheckRun: true,
      backendTypecheckPassed: true,
      task036VerificationScriptRun: true,
      task036VerificationScriptPassed: true,
      privacyScanRun: true,
      privacyScanPassed: true,
      noProductionMutationScanRun: true,
      noProductionMutationScanPassed: true,
      noLiveConnectorAiScanRun: true,
      noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanRun: true,
      noLiveNotificationScanPassed: true,
      noFrontendUiScanRun: true,
      noFrontendUiScanPassed: true,
      noTask040ScanRun: true,
      noTask040ScanPassed: true,
      noFalsePassScanRun: true,
      noFalsePassScanPassed: true,
      safeToStartTask040: true,
      verdict: 'ACCEPTED_READY_YES',
      commandsRun: [],
      filesCreated: [],
      filesModified: [],
      filesStaged: [],
      filesIntentionallyNotStaged: [],
      remainingBlockers: ['blocker1'],
      generatedAt: new Date().toISOString(),
    };
    const errors = validateReportTruth(report);
    expect(errors).toContain('report_safe_to_start_true_with_blockers');
    expect(errors).toContain('report_verdict_accepted_with_blockers');
  });

  it('passes when report is consistent', () => {
    const report = {
      taskId: 'task036',
      scope: 'live_school_launch',
      task035DependencyVerified: true,
      task036Started: true,
      task040Started: false,
      frontendUiCreated: false,
      publicLaunchCreated: false,
      multiSchoolRolloutCreated: false,
      backendFreezeCreated: false,
      productionDeploymentIntroduced: false,
      realNotificationsSent: false,
      liveAiExpansionIntroduced: false,
      liveSchoolConnectorWriteExpansionIntroduced: false,
      productionDataMutationExecuted: false,
      rawPrivateDataStored: false,
      controlledLiveSchoolLaunchCreated: true,
      contractsCreatedOrUpdated: true,
      validationCreatedOrUpdated: true,
      repositoryCreatedOrUpdated: true,
      servicesCreatedOrUpdated: true,
      routesCreatedOrUpdated: true,
      routesMountedOrDirectlyTested: true,
      verifiedSchoolContextRequired: true,
      task035AcceptanceRequired: true,
      launchEnvironmentGatePassed: true,
      launchWindowControlPassed: true,
      launchApprovalPassed: true,
      singleSchoolScopePassed: true,
      liveLaunchStateMachinePassed: true,
      runtimeMonitoringPassed: true,
      healthBudgetPassed: true,
      incidentReadinessPassed: true,
      pauseControlPassed: true,
      rollbackControlPassed: true,
      killSwitchControlPassed: true,
      privacyBoundaryPassed: true,
      contentGovernancePassed: true,
      socraticIntegrityPassed: true,
      deenBoundaryPassed: true,
      schoolIdentityPassed: true,
      crossSchoolDenialPassed: true,
      safeLaunchReadModelPassed: true,
      evidenceLedgerPassed: true,
      diagnosticsPassed: true,
      finalLaunchDecisionPassed: true,
      reportPassed: true,
      task036FocusedTestsRun: true,
      task036FocusedTestsPassed: true,
      task036FocusedTestFiles: 70,
      task036FocusedTestsPassedCount: 70,
      task036FocusedTestsFailedCount: 0,
      task020To035RegressionRun: true,
      task020To035RegressionPassed: true,
      phase3RegressionRun: true,
      phase3RegressionPassed: true,
      fullBackendSuiteRun: true,
      fullBackendSuitePassed: true,
      fullBackendSuiteFailedFiles: [],
      fullBackendSuiteFailedTests: [],
      prismaValidateRun: true,
      prismaValidatePassed: true,
      prismaGenerateRun: true,
      prismaGeneratePassed: true,
      backendBuildRun: true,
      backendBuildPassed: true,
      backendTypecheckRun: true,
      backendTypecheckPassed: true,
      task036VerificationScriptRun: true,
      task036VerificationScriptPassed: true,
      privacyScanRun: true,
      privacyScanPassed: true,
      noProductionMutationScanRun: true,
      noProductionMutationScanPassed: true,
      noLiveConnectorAiScanRun: true,
      noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanRun: true,
      noLiveNotificationScanPassed: true,
      noFrontendUiScanRun: true,
      noFrontendUiScanPassed: true,
      noTask040ScanRun: true,
      noTask040ScanPassed: true,
      noFalsePassScanRun: true,
      noFalsePassScanPassed: true,
      safeToStartTask040: true,
      verdict: 'ACCEPTED_READY_YES',
      commandsRun: [],
      filesCreated: [],
      filesModified: [],
      filesStaged: [],
      filesIntentionallyNotStaged: [],
      remainingBlockers: [],
      generatedAt: new Date().toISOString(),
    };
    expect(validateReportTruth(report)).toEqual([]);
  });
});

describe('Validation - Forbidden Output Fields', () => {
  it('detects forbidden fields on an object', () => {
    const obj = {
      safeField: 'ok',
      rawLearnerData: { name: 'test' },
      rawChat: 'some chat',
      normalField: 42,
    };
    const errors = validateForbiddenOutputFields(obj);
    expect(errors).toContain('forbidden_field_present:rawLearnerData');
    expect(errors).toContain('forbidden_field_present:rawChat');
    expect(errors.length).toBe(2);
  });

  it('passes when no forbidden fields present', () => {
    const obj = { safeField: 'ok', anotherField: 42 };
    expect(validateForbiddenOutputFields(obj)).toEqual([]);
  });
});

describe('Validation - Forbidden Side Effects', () => {
  it('detects side effect patterns in code', () => {
    const code = 'const result = await openai.chat.completions.create();';
    const errors = validateForbiddenSideEffects(code);
    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some(e => e.includes('openai'))).toBe(true);
  });

  it('passes with clean code', () => {
    const code = 'const result = safeReadOperation();';
    expect(validateForbiddenSideEffects(code)).toEqual([]);
  });
});

describe('Validation - Future Task Boundaries', () => {
  it('detects references to future tasks', () => {
    const code = '// TODO: implement task040 backend freeze';
    const errors = validateFutureTaskBoundaries(code);
    expect(errors).toContain('future_task_pattern_detected:task040');
    expect(errors).toContain('future_task_pattern_detected:backend freeze');
  });

  it('passes with clean code', () => {
    const code = 'export function handleLaunch() {}';
    expect(validateFutureTaskBoundaries(code)).toEqual([]);
  });
});
