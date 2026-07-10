import { describe, it, expect } from 'vitest';
import {
  validateTask032Task031DependencyProof,
  validateTask032CanaryEnvironmentGateInput,
  validateTask032ApprovedSchoolCanaryConfig,
  validateTask032CanaryCohortEligibilityInput,
  validateTask032ConsentAuthorizationInput,
  validateTask032PrivacyBoundaryInput,
  validateTask032RuntimeGuardInput,
  validateTask032ActivationRecordInput,
  validateTask032ActivationCommandInput,
  validateTask032ControlActionInput,
  validateTask032HealthBudgetInput,
  validateTask032IncidentBridgeInput,
  validateTask032CanarySafeViewInput,
  validateTask032ReportInput,
  rejectTask032ForbiddenFields,
  redactTask032SensitiveValue,
  createSafeTask032ValidationError,
} from '../lib/task032ControlledCanaryActivationValidation';

describe('Task 032 - validateTask032Task031DependencyProof', () => {
  function validProof() {
    return {
      ok: true,
      commitFound: true,
      task031ReportFound: true,
      task031OpsReportFound: true,
      verdict: 'ACCEPTED_READY_YES',
      safeToStartTask032: true,
      safeToStartTask033: false,
      safeToStartTask034: false,
      safeToStartTask035: false,
      safeToStartTask040: false,
      task031FocusedTestsPassed: true,
      task020To030RegressionPassed: true,
      phase3RegressionPassed: true,
      fullBackendSuitePassed: true,
      backendBuildPassed: true,
      backendTypecheckPassed: true,
      prismaValidatePassed: true,
      prismaGeneratePassed: true,
      task031VerificationScriptPassed: true,
      privacyScanPassed: true,
      noProductionMutationScanPassed: true,
      noLiveConnectorAiScanPassed: true,
      noLiveNotificationScanPassed: true,
      noFrontendUiScanPassed: true,
      noTask032ToTask040ScanPassed: true,
      noFalsePassScanPassed: true,
      remainingBlockers: [],
      blockingIssues: [],
    };
  }

  it('should pass validation with valid proof', () => {
    const result = validateTask032Task031DependencyProof(validProof());
    expect(result.ok).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should fail with null input', () => {
    const result = validateTask032Task031DependencyProof(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('should fail with missing ok field', () => {
    const input = { ...validProof(), ok: false };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('ok_not_true');
  });

  it('should fail with wrong verdict', () => {
    const input = { ...validProof(), verdict: 'WRONG' };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('verdict_not_ACCEPTED_READY_YES');
  });

  it('should fail when safeToStartTask032 is false', () => {
    const input = { ...validProof(), safeToStartTask032: false };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask032_not_true');
  });

  it('should fail when safeToStartTask033 is true instead of false', () => {
    const input = { ...validProof(), safeToStartTask033: true };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask033_not_false');
  });

  it('should fail when safeToStartTask034 is true instead of false', () => {
    const input = { ...validProof(), safeToStartTask034: true };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask034_not_false');
  });

  it('should fail when safeToStartTask040 is true instead of false', () => {
    const input = { ...validProof(), safeToStartTask040: true };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('safeToStartTask040_not_false');
  });

  it('should fail when remainingBlockers is not an array', () => {
    const input = { ...validProof(), remainingBlockers: 'not_array' };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('remainingBlockers_not_array');
  });

  it('should fail when blockingIssues is not an array', () => {
    const input = { ...validProof(), blockingIssues: null };
    const result = validateTask032Task031DependencyProof(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('blockingIssues_not_array');
  });
});

describe('Task 032 - validateTask032CanaryEnvironmentGateInput', () => {
  function validInput() {
    return {
      environmentType: 'controlled_canary',
      activationMode: 'internal_controlled_activation',
      dataMode: 'approved_canary_fixture',
      sideEffectMode: 'internal_state_only',
      productionDeploymentRequested: false,
      liveNotificationRequested: false,
      liveAiRequested: false,
      liveSchoolConnectorRequested: false,
      productionMutationRequested: false,
      canaryObservationRequested: false,
      rolloutRequested: false,
      schoolWideLaunchRequested: false,
      backendFreezeRequested: false,
    };
  }

  it('should pass validation with valid input', () => {
    const result = validateTask032CanaryEnvironmentGateInput(validInput());
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032CanaryEnvironmentGateInput(null).ok).toBe(false);
  });

  it('should fail with invalid environment type', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), environmentType: 'production_uncontrolled' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('environmentType_not_controlled_canary');
  });

  it('should fail with invalid activation mode', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), activationMode: 'broad_rollout' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('activationMode_not_internal_controlled_activation');
  });

  it('should fail with invalid data mode', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), dataMode: 'raw_live_student_payload' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('dataMode_not_approved_canary_fixture');
  });

  it('should fail with invalid side effect mode', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), sideEffectMode: 'external_write' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('sideEffectMode_not_internal_state_only');
  });

  it('should fail when productionDeploymentRequested is true', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), productionDeploymentRequested: true });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('productionDeploymentRequested_not_false');
  });

  it('should fail when liveAiRequested is true', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), liveAiRequested: true });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('liveAiRequested_not_false');
  });

  it('should fail when rolloutRequested is true', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), rolloutRequested: true });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('rolloutRequested_not_false');
  });

  it('should fail when schoolWideLaunchRequested is true', () => {
    const result = validateTask032CanaryEnvironmentGateInput({ ...validInput(), schoolWideLaunchRequested: true });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('schoolWideLaunchRequested_not_false');
  });
});

describe('Task 032 - validateTask032ApprovedSchoolCanaryConfig', () => {
  function validConfig() {
    return {
      configId: 'config_task032_safe',
      schoolId: 'school_task032_safe',
      approvedByRole: 'school_admin',
      activationMode: 'internal_controlled_activation',
      maxCanaryLearners: 25,
      allowedClassIds: ['class_task032_safe_001'],
      allowedSubjectIds: ['subject_task032_safe_math_001'],
      allowedCohortIds: ['cohort_task032_safe_001'],
      canaryStartWindow: '2026-07-01T00:00:00Z',
      canaryEndWindow: '2026-07-31T23:59:59Z',
      rollbackPolicyId: 'rollback_policy_001',
      incidentPolicyId: 'incident_policy_001',
      privacyBoundaryId: 'privacy_boundary_001',
      healthBudgetId: 'health_budget_001',
      consentAuthorizationPolicyId: 'consent_policy_001',
      sourceGovernancePolicyId: 'governance_policy_001',
      deenBoundaryPolicyId: 'deen_policy_001',
      socraticIntegrityPolicyId: 'socratic_policy_001',
    };
  }

  it('should pass validation with valid config', () => {
    const result = validateTask032ApprovedSchoolCanaryConfig(validConfig());
    expect(result.ok).toBe(true);
    expect(result.reasonCodes).toHaveLength(0);
  });

  it('should fail with null input', () => {
    const result = validateTask032ApprovedSchoolCanaryConfig(null);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('input_is_null');
  });

  it('should fail with missing schoolId', () => {
    const input = { ...validConfig(), schoolId: '' };
    const result = validateTask032ApprovedSchoolCanaryConfig(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_schoolId');
  });

  it('should fail with maxCanaryLearners exceeding cap of 50', () => {
    const input = { ...validConfig(), maxCanaryLearners: 100 };
    const result = validateTask032ApprovedSchoolCanaryConfig(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes.some((r: string) => r.includes('maxCanaryLearners'))).toBe(true);
  });

  it('should fail with missing allowedClassIds', () => {
    const input = { ...validConfig(), allowedClassIds: null };
    const result = validateTask032ApprovedSchoolCanaryConfig(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('allowedClassIds_not_array');
  });

  it('should fail with missing allowedSubjectIds', () => {
    const input = { ...validConfig(), allowedSubjectIds: null };
    const result = validateTask032ApprovedSchoolCanaryConfig(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('allowedSubjectIds_not_array');
  });

  it('should fail with missing allowedCohortIds', () => {
    const input = { ...validConfig(), allowedCohortIds: null };
    const result = validateTask032ApprovedSchoolCanaryConfig(input);
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('allowedCohortIds_not_array');
  });
});

describe('Task 032 - validateTask032CanaryCohortEligibilityInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032CanaryCohortEligibilityInput({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: { schoolId: 'school_task032_safe' },
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032CanaryCohortEligibilityInput(null).ok).toBe(false);
  });

  it('should fail with missing config', () => {
    const result = validateTask032CanaryCohortEligibilityInput({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_config');
  });

  it('should fail with null config', () => {
    const result = validateTask032CanaryCohortEligibilityInput({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('config_is_not_object');
  });
});

describe('Task 032 - validateTask032ConsentAuthorizationInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032ConsentAuthorizationInput({
      schoolId: 'school_task032_safe',
      config: { schoolId: 'school_task032_safe' },
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032ConsentAuthorizationInput(null).ok).toBe(false);
  });

  it('should fail with missing fields', () => {
    const result = validateTask032ConsentAuthorizationInput({});
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_schoolId');
    expect(result.reasonCodes).toContain('missing_config');
  });
});

describe('Task 032 - validateTask032PrivacyBoundaryInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032PrivacyBoundaryInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032PrivacyBoundaryInput(null).ok).toBe(false);
  });

  it('should fail with missing schoolId', () => {
    const result = validateTask032PrivacyBoundaryInput({ actorRole: 'school_admin' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_schoolId');
  });
});

describe('Task 032 - validateTask032RuntimeGuardInput', () => {
  it('should pass with valid school_admin input', () => {
    const result = validateTask032RuntimeGuardInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
  });

  it('should pass with valid system_admin input', () => {
    const result = validateTask032RuntimeGuardInput({
      schoolId: 'school_task032_safe',
      actorRole: 'system_admin',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032RuntimeGuardInput(null).ok).toBe(false);
  });

  it('should fail with student role', () => {
    const result = validateTask032RuntimeGuardInput({
      schoolId: 'school_task032_safe',
      actorRole: 'student',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('actorRole_not_admin_or_operator');
  });

  it('should fail with teacher role', () => {
    const result = validateTask032RuntimeGuardInput({
      schoolId: 'school_task032_safe',
      actorRole: 'teacher',
      activationId: 'act_001',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('actorRole_not_admin_or_operator');
  });

  it('should fail with missing activationId', () => {
    const result = validateTask032RuntimeGuardInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_activationId');
  });
});

describe('Task 032 - validateTask032ActivationRecordInput', () => {
  function validRecordInput() {
    return {
      schoolId: 'school_task032_safe',
      config: {
        configId: 'cfg_001',
        schoolId: 'school_task032_safe',
        approvedByRole: 'school_admin',
        activationMode: 'internal_controlled_activation',
        maxCanaryLearners: 25,
        allowedClassIds: ['class_task032_safe_001'],
        allowedSubjectIds: ['subject_task032_safe_math_001'],
        allowedCohortIds: ['cohort_task032_safe_001'],
        rollbackPolicyId: 'rollback_001',
        incidentPolicyId: 'incident_001',
        privacyBoundaryId: 'privacy_001',
        healthBudgetId: 'health_001',
        consentAuthorizationPolicyId: 'consent_001',
        sourceGovernancePolicyId: 'governance_001',
        deenBoundaryPolicyId: 'deen_001',
        socraticIntegrityPolicyId: 'socratic_001',
      },
    };
  }

  it('should pass with valid input', () => {
    const result = validateTask032ActivationRecordInput(validRecordInput());
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032ActivationRecordInput(null).ok).toBe(false);
  });

  it('should fail with null config', () => {
    const result = validateTask032ActivationRecordInput({ schoolId: 'school_task032_safe', config: null });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('config_is_not_object');
  });

  it('should fail with missing config fields', () => {
    const result = validateTask032ActivationRecordInput({ schoolId: 'school_task032_safe', config: { schoolId: 'test' } });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes.some((r: string) => r.startsWith('config_missing_'))).toBe(true);
  });
});

describe('Task 032 - validateTask032ActivationCommandInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: { schoolId: 'test' },
      environmentInput: { environmentType: 'controlled_canary' },
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032ActivationCommandInput(null).ok).toBe(false);
  });

  it('should fail with missing environmentInput', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: { schoolId: 'test' },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_environmentInput');
  });

  it('should fail with null config', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: null,
      environmentInput: {},
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('config_is_not_object');
  });
});

describe('Task 032 - validateTask032ControlActionInput', () => {
  it('should pass with valid pause action', () => {
    const result = validateTask032ControlActionInput({
      activationId: 'act_001',
      action: 'pause_internal_canary',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(true);
  });

  it('should pass with valid kill switch action', () => {
    const result = validateTask032ControlActionInput({
      activationId: 'act_001',
      action: 'enable_internal_kill_switch',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032ControlActionInput(null).ok).toBe(false);
  });

  it('should fail with unknown action', () => {
    const result = validateTask032ControlActionInput({
      activationId: 'act_001',
      action: 'invalid_action',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('action_not_in_TASK032_CONTROL_ACTION_IDS');
  });

  it('should fail with missing activationId', () => {
    const result = validateTask032ControlActionInput({
      action: 'pause_internal_canary',
      actorRole: 'school_admin',
      schoolId: 'school_task032_safe',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_activationId');
  });
});

describe('Task 032 - validateTask032HealthBudgetInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032HealthBudgetInput({ activationId: 'act_001', schoolId: 'school_task032_safe' });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032HealthBudgetInput(null).ok).toBe(false);
  });

  it('should fail with missing activationId', () => {
    const result = validateTask032HealthBudgetInput({ schoolId: 'school_task032_safe' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_activationId');
  });
});

describe('Task 032 - validateTask032IncidentBridgeInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032IncidentBridgeInput({ activationId: 'act_001', schoolId: 'school_task032_safe' });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032IncidentBridgeInput(null).ok).toBe(false);
  });

  it('should fail with missing schoolId', () => {
    const result = validateTask032IncidentBridgeInput({ activationId: 'act_001' });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_schoolId');
  });
});

describe('Task 032 - validateTask032CanarySafeViewInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032CanarySafeViewInput({ activationId: 'act_001' });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032CanarySafeViewInput(null).ok).toBe(false);
  });

  it('should fail with missing activationId', () => {
    const result = validateTask032CanarySafeViewInput({});
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_activationId');
  });
});

describe('Task 032 - validateTask032ReportInput', () => {
  it('should pass with valid input', () => {
    const result = validateTask032ReportInput({ activationId: 'act_001' });
    expect(result.ok).toBe(true);
  });

  it('should fail with null input', () => {
    expect(validateTask032ReportInput(null).ok).toBe(false);
  });

  it('should fail with missing activationId', () => {
    const result = validateTask032ReportInput({});
    expect(result.ok).toBe(false);
  });
});

describe('Task 032 - rejectTask032ForbiddenFields', () => {
  it('should detect forbidden fields in object', () => {
    const result = rejectTask032ForbiddenFields({ studentName: 'John', safeField: 'ok' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields).toContain('studentName');
  });

  it('should detect multiple forbidden fields', () => {
    const result = rejectTask032ForbiddenFields({ studentEmail: 'test@test.com', studentPhone: '123', rawChat: 'chat' });
    expect(result.hasForbiddenFields).toBe(true);
    expect(result.matchedFields.length).toBeGreaterThanOrEqual(3);
  });

  it('should return no forbidden fields for safe objects', () => {
    const result = rejectTask032ForbiddenFields({ activationId: 'act_001', schoolId: 'safe_school', status: 'ok' });
    expect(result.hasForbiddenFields).toBe(false);
    expect(result.matchedFields).toHaveLength(0);
  });

  it('should handle null input gracefully', () => {
    const result = rejectTask032ForbiddenFields(null);
    expect(result.hasForbiddenFields).toBe(false);
  });

  it('should handle non-object input gracefully', () => {
    const result = rejectTask032ForbiddenFields('string');
    expect(result.hasForbiddenFields).toBe(false);
  });
});

describe('Task 032 - redactTask032SensitiveValue', () => {
  it('should redact email addresses', () => {
    const result = redactTask032SensitiveValue('contact user@example.com here');
    expect(result).toBe('contact REDACTED here');
    expect(result).not.toContain('user@example.com');
  });

  it('should redact phone numbers', () => {
    const result = redactTask032SensitiveValue('Call +447123456789 now');
    expect(result).toContain('REDACTED');
    expect(result).not.toContain('+447123456789');
  });

  it('should redact Bearer tokens', () => {
    const result = redactTask032SensitiveValue('Authorization: Bearer mysecrettoken123');
    expect(result).toContain('Bearer REDACTED');
    expect(result).not.toContain('mysecrettoken123');
  });

  it('should redact sk-proj- tokens', () => {
    const result = redactTask032SensitiveValue('key=sk-proj-abc123def456');
    expect(result).toContain('sk-proj-REDACTED');
    expect(result).not.toContain('abc123def456');
  });

  it('should redact sk-ant- tokens', () => {
    const result = redactTask032SensitiveValue('ant=sk-ant-xyz789');
    expect(result).toContain('sk-ant-REDACTED');
  });

  it('should return empty string for empty input', () => {
    expect(redactTask032SensitiveValue('')).toBe('');
  });

  it('should preserve safe text without sensitive data', () => {
    const result = redactTask032SensitiveValue('This is a safe message with no private data');
    expect(result).toBe('This is a safe message with no private data');
  });
});

describe('Task 032 - createSafeTask032ValidationError', () => {
  it('should create a safe validation error object', () => {
    const result = createSafeTask032ValidationError('Test error', ['reason1', 'reason2']);
    expect(result.error).toContain('TASK032_VALIDATION_ERROR');
    expect(result.error).toContain('Test error');
    expect(result.reasonCodes).toEqual(['reason1', 'reason2']);
    expect(result.safe).toBe(true);
    expect(typeof result.timestamp).toBe('string');
  });

  it('should deduplicate reason codes', () => {
    const result = createSafeTask032ValidationError('Duplicate test', ['dup', 'dup', 'unique']);
    expect(result.reasonCodes).toEqual(['dup', 'unique']);
  });

  it('should include timestamp in ISO format', () => {
    const result = createSafeTask032ValidationError('Timestamp test', []);
    const parsed = new Date(result.timestamp);
    expect(parsed.toISOString()).toBe(result.timestamp);
  });
});
