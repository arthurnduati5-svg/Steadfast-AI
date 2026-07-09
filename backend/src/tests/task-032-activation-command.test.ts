import { describe, it, expect, beforeEach } from 'vitest';
import { createTask032CanaryActivationRecord } from '../services/task032CanaryActivationStateMachineService';
import { runTask032CanaryEnvironmentGate } from '../services/task032CanaryEnvironmentGateService';
import { createTask032ApprovedSchoolCanaryConfig } from '../services/task032ApprovedSchoolCanaryConfigService';
import { evaluateTask032CanaryCohortEligibility } from '../services/task032CanaryCohortEligibilityService';
import { verifyTask032CanaryConsentAuthorization } from '../services/task032CanaryConsentAuthorizationService';
import { runTask032LiveStudentPrivacyBoundary } from '../services/task032LiveStudentPrivacyBoundaryService';
import { runTask032CanaryRuntimeGuard } from '../services/task032CanaryRuntimeGuardService';
import { runTask032CanaryHealthBudget } from '../services/task032CanaryHealthBudgetService';
import { verifyTask032CanaryIncidentBridge } from '../services/task032CanaryIncidentBridgeService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import {
  validateTask032ActivationCommandInput,
  validateTask032CanaryEnvironmentGateInput,
} from '../lib/task032ControlledCanaryActivationValidation';

describe('Task 032 - Activation Command (Orchestration Steps)', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  it('should validate activation command input for valid data', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: { schoolId: 'school_task032_safe' },
      environmentInput: { environmentType: 'controlled_canary' },
    });
    expect(result.ok).toBe(true);
  });

  it('should reject activation command input with null config', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: null,
      environmentInput: {},
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('config_is_not_object');
  });

  it('should reject activation command input with null environmentInput', () => {
    const result = validateTask032ActivationCommandInput({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      config: {},
      environmentInput: null,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('environmentInput_is_not_object');
  });

  it('should create activation record as first orchestration step', async () => {
    const record = await createTask032CanaryActivationRecord({
      schoolId: 'school_task032_safe',
      configuredCohortSize: 25,
    });
    expect(record.status).toBe('created');
    expect(record.schoolId).toBe('school_task032_safe');
    expect(record.configuredCohortSize).toBe(25);
  });

  it('should validate environment gate input before running gate', () => {
    const valid = validateTask032CanaryEnvironmentGateInput({
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
    });
    expect(valid.ok).toBe(true);
  });

  it('should run environment gate and pass with valid input', async () => {
    const envResult = await runTask032CanaryEnvironmentGate({
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
    });
    expect(envResult.passed).toBe(true);
    expect(envResult.environmentTypeValid).toBe(true);

    await task032ControlledCanaryActivationRepository.recordEnvironmentGate(envResult);
    const stored = await task032ControlledCanaryActivationRepository.listEnvironmentGates();
    expect(stored).toHaveLength(1);
  });

  it('should create approved school canary config as orchestration step', async () => {
    const config = await createTask032ApprovedSchoolCanaryConfig({
      schoolId: 'school_task032_safe',
      approvedByRole: 'school_admin',
      activationMode: 'internal_controlled_activation',
      maxCanaryLearners: 25,
      allowedClassIds: ['class_task032_safe_001'],
      allowedSubjectIds: ['subject_task032_safe_math_001'],
      allowedCohortIds: ['cohort_task032_safe_001'],
      canaryStartWindow: '2026-07-01T00:00:00Z',
      canaryEndWindow: '2026-07-31T23:59:59Z',
      rollbackPolicyId: 'rp_001',
      incidentPolicyId: 'ip_001',
      privacyBoundaryId: 'pb_001',
      healthBudgetId: 'hb_001',
      consentAuthorizationPolicyId: 'cap_001',
      sourceGovernancePolicyId: 'sgp_001',
      deenBoundaryPolicyId: 'dbp_001',
      socraticIntegrityPolicyId: 'sip_001',
    });
    expect(config.blockingIssues).toHaveLength(0);
    expect(config.schoolId).toBe('school_task032_safe');

    await task032ControlledCanaryActivationRepository.recordApprovedSchoolCanaryConfig(config);
    const stored = await task032ControlledCanaryActivationRepository.getApprovedSchoolCanaryConfig(config.configId);
    expect(stored).not.toBeNull();
  });

  it('should evaluate cohort eligibility as orchestration step', async () => {
    const config = {
      schoolId: 'school_task032_safe',
      approvedByRole: 'school_admin',
      activationMode: 'internal_controlled_activation',
      maxCanaryLearners: 25,
      allowedClassIds: ['class_001'],
      allowedSubjectIds: ['subj_001'],
      allowedCohortIds: ['cohort_task032_safe_001'],
      canaryStartWindow: '',
      canaryEndWindow: '',
      rollbackPolicyId: 'rp_001',
      incidentPolicyId: 'ip_001',
      privacyBoundaryId: 'pb_001',
      healthBudgetId: 'hb_001',
      consentAuthorizationPolicyId: 'cap_001',
      sourceGovernancePolicyId: 'sgp_001',
      deenBoundaryPolicyId: 'dbp_001',
      socraticIntegrityPolicyId: 'sip_001',
      blockingIssues: [],
    };
    const cohortResult = await evaluateTask032CanaryCohortEligibility({
      schoolId: 'school_task032_safe',
      cohortId: 'cohort_task032_safe_001',
      actorRole: 'school_admin',
      config,
    });
    expect(cohortResult.ok).toBe(true);

    await task032ControlledCanaryActivationRepository.recordCohortEligibility(cohortResult);
    const stored = await task032ControlledCanaryActivationRepository.listCohortEligibilityResults();
    expect(stored).toHaveLength(1);
  });

  it('should verify consent authorization as orchestration step', async () => {
    const config = {
      schoolId: 'school_task032_safe',
      approvedByRole: 'school_admin',
      activationMode: 'internal_controlled_activation',
      maxCanaryLearners: 25,
      allowedClassIds: ['class_001'],
      allowedSubjectIds: ['subj_001'],
      allowedCohortIds: ['cohort_001'],
      canaryStartWindow: '',
      canaryEndWindow: '',
      rollbackPolicyId: 'rp_001',
      incidentPolicyId: 'ip_001',
      privacyBoundaryId: 'pb_001',
      healthBudgetId: 'hb_001',
      consentAuthorizationPolicyId: 'cap_001',
      sourceGovernancePolicyId: 'sgp_001',
      deenBoundaryPolicyId: 'dbp_001',
      socraticIntegrityPolicyId: 'sip_001',
      blockingIssues: [],
    };
    const consentResult = await verifyTask032CanaryConsentAuthorization({
      schoolId: 'school_task032_safe',
      config,
      actorRole: 'school_admin',
    });
    expect(consentResult.ok).toBe(true);

    await task032ControlledCanaryActivationRepository.recordConsentAuthorization(consentResult);
    const stored = await task032ControlledCanaryActivationRepository.listConsentAuthorizationResults();
    expect(stored).toHaveLength(1);
  });

  it('should run privacy boundary as orchestration step', async () => {
    const privacyResult = await runTask032LiveStudentPrivacyBoundary({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
    });
    expect(privacyResult.ok).toBe(true);
    expect(privacyResult.rawLearnerProfilesBlocked).toBe(true);

    await task032ControlledCanaryActivationRepository.recordPrivacyBoundary(privacyResult);
    const stored = await task032ControlledCanaryActivationRepository.listPrivacyBoundaryResults();
    expect(stored).toHaveLength(1);
  });

  it('should run runtime guard as orchestration step', async () => {
    const record = await createTask032CanaryActivationRecord({ schoolId: 'school_task032_safe', configuredCohortSize: 25 });
    const guardResult = await runTask032CanaryRuntimeGuard({
      schoolId: 'school_task032_safe',
      actorRole: 'school_admin',
      activationId: record.activationId,
    });
    expect(guardResult.ok).toBe(true);

    await task032ControlledCanaryActivationRepository.recordRuntimeGuard(guardResult);
    const stored = await task032ControlledCanaryActivationRepository.listRuntimeGuardResults();
    expect(stored).toHaveLength(1);
  });

  it('should run health budget as orchestration step', async () => {
    const healthResult = await runTask032CanaryHealthBudget({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(healthResult.overallPassed).toBe(true);

    await task032ControlledCanaryActivationRepository.recordHealthBudget(healthResult);
    const stored = await task032ControlledCanaryActivationRepository.listHealthBudgetResults();
    expect(stored).toHaveLength(1);
  });

  it('should verify incident bridge as orchestration step', async () => {
    const incidentResult = await verifyTask032CanaryIncidentBridge({
      activationId: 'act_001',
      schoolId: 'school_task032_safe',
    });
    expect(incidentResult.ok).toBe(true);
    expect(incidentResult.noNotificationSent).toBe(true);

    await task032ControlledCanaryActivationRepository.recordIncidentBridge(incidentResult);
    const stored = await task032ControlledCanaryActivationRepository.listIncidentBridgeResults();
    expect(stored).toHaveLength(1);
  });

  it('should record all gate results in repository after each step', async () => {
    const envResult = await runTask032CanaryEnvironmentGate({
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
    });
    await task032ControlledCanaryActivationRepository.recordEnvironmentGate(envResult);

    const healthResult = await runTask032CanaryHealthBudget({ activationId: 'act_001', schoolId: 'school_task032_safe' });
    await task032ControlledCanaryActivationRepository.recordHealthBudget(healthResult);

    const incidentResult = await verifyTask032CanaryIncidentBridge({ activationId: 'act_001', schoolId: 'school_task032_safe' });
    await task032ControlledCanaryActivationRepository.recordIncidentBridge(incidentResult);

    const envGates = await task032ControlledCanaryActivationRepository.listEnvironmentGates();
    const healthBudgets = await task032ControlledCanaryActivationRepository.listHealthBudgetResults();
    const incidents = await task032ControlledCanaryActivationRepository.listIncidentBridgeResults();

    expect(envGates.length).toBeGreaterThanOrEqual(1);
    expect(healthBudgets.length).toBeGreaterThanOrEqual(1);
    expect(incidents.length).toBeGreaterThanOrEqual(1);
  });
});
