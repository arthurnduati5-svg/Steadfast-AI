import type {
  SchoolSystemProviderMode,
  SchoolConnectorReadinessResult,
  SchoolConnectorActivationChecklist,
} from '../contracts/schoolSystemBridgeContracts';
import {
  getDefaultSchoolProviderMode,
  getDefaultSchoolConnectorChecklist,
} from '../contracts/schoolSystemBridgeContracts';

export interface ActivationGate {
  gateName: string;
  passed: boolean;
  blocking: boolean;
}

const FUTURE_ACTIVATION_GATES: ActivationGate[] = [
  { gateName: 'frontend_integration_complete', passed: false, blocking: true },
  { gateName: 'school_system_owner_approval_recorded', passed: false, blocking: true },
  { gateName: 'school_connector_provider_selected', passed: false, blocking: true },
  { gateName: 'secure_credential_storage_configured', passed: false, blocking: true },
  { gateName: 'school_identity_signature_validation_configured', passed: false, blocking: true },
  { gateName: 'role_claim_mapping_approved', passed: false, blocking: true },
  { gateName: 'roster_sync_dry_run_passed', passed: false, blocking: true },
  { gateName: 'teacher_scope_dry_run_passed', passed: false, blocking: true },
  { gateName: 'student_mapping_dry_run_passed', passed: false, blocking: true },
  { gateName: 'privacy_scan_passed', passed: false, blocking: true },
  { gateName: 'audit_path_configured', passed: false, blocking: true },
  { gateName: 'rollback_plan_exists', passed: false, blocking: true },
  { gateName: 'manual_activation_approval_recorded', passed: false, blocking: true },
  { gateName: 'staging_only_smoke_test_passed', passed: false, blocking: true },
];

const TASK039_BLOCKING_GATES: ActivationGate[] = [
  { gateName: 'task039_school_bridge_contracts_built', passed: true, blocking: true },
  { gateName: 'task039_live_connector_not_activated', passed: true, blocking: true },
  { gateName: 'task039_mock_only_mode_default', passed: true, blocking: true },
  { gateName: 'task039_no_bypass_routes', passed: true, blocking: true },
];

export function checkSchoolConnectorActivationReadiness(
  currentMode?: SchoolSystemProviderMode,
): SchoolConnectorReadinessResult {
  const mode = currentMode || getDefaultSchoolProviderMode();
  const blockedReasons: string[] = [];
  const futureRequiredGates: string[] = [];

  if (mode === 'live_enabled') {
    blockedReasons.push('Live school connector mode is not allowed in Task 039');
  }

  for (const gate of FUTURE_ACTIVATION_GATES) {
    futureRequiredGates.push(gate.gateName);
    if (!gate.passed && gate.blocking) {
      blockedReasons.push(`Future gate not passed: ${gate.gateName}`);
    }
  }

  if (blockedReasons.length > 0) {
    return {
      ready: false,
      allowed: false,
      activationState: 'blocked',
      blockedReasons,
      futureRequiredGates,
      safeNextSteps: [
        'Complete frontend integration (future task)',
        'Select school-system provider (future task)',
        'Configure secure credential storage (future task)',
        'Run roster sync dry-run (Task 039 provides the service)',
        'Run teacher scope dry-run (Task 039 provides the service)',
        'Run student mapping dry-run (Task 039 provides the service)',
        'Run privacy scan (future task)',
        'Run staging-only smoke test (future task)',
        'Receive manual activation approval (future task)',
        'Enable live school connector in future activation task only',
      ],
    };
  }

  return {
    ready: true,
    allowed: true,
    activationState: 'mock_only',
    blockedReasons: [],
    futureRequiredGates,
    safeNextSteps: [],
  };
}

export function getTask039ActivationState(): SchoolConnectorReadinessResult {
  return {
    ready: true,
    allowed: true,
    activationState: 'mock_only',
    blockedReasons: [],
    futureRequiredGates: FUTURE_ACTIVATION_GATES.map(g => g.gateName),
    safeNextSteps: [
      'Task 039 complete: School connector bridge ready for future activation.',
    ],
  };
}

export function isLiveSchoolConnectorAllowedByGuard(): boolean {
  const result = checkSchoolConnectorActivationReadiness();
  return result.allowed;
}

export function checkChecklistAgainstActivationGates(
  checklist: SchoolConnectorActivationChecklist,
): SchoolConnectorReadinessResult {
  const blockedReasons: string[] = [];
  const futureRequiredGates: string[] = [];
  const gates: ActivationGate[] = [
    { gateName: 'frontend_integration_complete', passed: checklist.frontendIntegrationComplete, blocking: true },
    { gateName: 'school_system_owner_approval_recorded', passed: checklist.schoolSystemOwnerApprovalRecorded, blocking: true },
    { gateName: 'school_connector_provider_selected', passed: checklist.schoolConnectorProviderSelected, blocking: true },
    { gateName: 'secure_credential_storage_configured', passed: checklist.secureCredentialStorageConfigured, blocking: true },
    { gateName: 'school_identity_signature_validation_configured', passed: checklist.schoolIdentitySignatureValidationConfigured, blocking: true },
    { gateName: 'role_claim_mapping_approved', passed: checklist.roleClaimMappingApproved, blocking: true },
    { gateName: 'roster_sync_dry_run_passed', passed: checklist.rosterSyncDryRunPassed, blocking: true },
    { gateName: 'teacher_scope_dry_run_passed', passed: checklist.teacherScopeDryRunPassed, blocking: true },
    { gateName: 'student_mapping_dry_run_passed', passed: checklist.studentMappingDryRunPassed, blocking: true },
    { gateName: 'privacy_scan_passed', passed: checklist.privacyScanPassed, blocking: true },
    { gateName: 'audit_path_configured', passed: checklist.auditPathConfigured, blocking: true },
    { gateName: 'rollback_plan_exists', passed: checklist.rollbackPlanExists, blocking: true },
    { gateName: 'manual_activation_approval_recorded', passed: checklist.manualActivationApprovalRecorded, blocking: true },
    { gateName: 'staging_only_smoke_test_passed', passed: checklist.stagingOnlySmokeTestPassed, blocking: true },
  ];

  for (const gate of gates) {
    futureRequiredGates.push(gate.gateName);
    if (!gate.passed && gate.blocking) {
      blockedReasons.push(`Checklist gate not passed: ${gate.gateName}`);
    }
  }

  if (blockedReasons.length > 0) {
    return {
      ready: false,
      allowed: false,
      activationState: 'blocked',
      blockedReasons,
      futureRequiredGates,
      safeNextSteps: ['Complete all checklist items before enabling live connector.'],
    };
  }

  return {
    ready: true,
    allowed: true,
    activationState: 'live_ready_not_enabled',
    blockedReasons: [],
    futureRequiredGates,
    safeNextSteps: ['All checklist items pass. Ready for live connector activation in a future task.'],
  };
}
