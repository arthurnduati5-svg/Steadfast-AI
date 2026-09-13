import {
  Task023ProductionConfigResult,
  Task023EnvironmentGateStatus,
} from '../contracts/task023DeploymentReadinessContracts';

export interface Task020ProductionGateDecision {
  roleAccessMatrixAvailable: boolean;
  privacyBoundaryAvailable: boolean;
  dataClassificationAvailable: boolean;
  aiEgressPrivacyGuardAvailable: boolean;
  governanceAuditAvailable: boolean;
  operationalSensitive: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export function verifyTask020ProductionGate(): Task020ProductionGateDecision {
  const roleMatrixOk = verifyRoleAccessMatrixAvailable();
  const privacyBoundaryOk = verifyPrivacyBoundaryAvailable();
  const dataClassificationOk = verifyDataClassificationAvailable();
  const aiEgressOk = verifyAiEgressPrivacyGuardAvailable();
  const governanceAuditOk = verifyGovernanceAuditAvailable();

  const reasonCodes: string[] = [];
  let passed = true;

  if (roleMatrixOk) reasonCodes.push('ROLE_ACCESS_MATRIX_AVAILABLE');
  else { reasonCodes.push('ROLE_ACCESS_MATRIX_MISSING'); passed = false; }

  if (privacyBoundaryOk) reasonCodes.push('PRIVACY_BOUNDARY_AVAILABLE');
  else { reasonCodes.push('PRIVACY_BOUNDARY_MISSING'); passed = false; }

  if (dataClassificationOk) reasonCodes.push('DATA_CLASSIFICATION_AVAILABLE');
  else { reasonCodes.push('DATA_CLASSIFICATION_MISSING'); passed = false; }

  if (aiEgressOk) reasonCodes.push('AI_EGRESS_PRIVACY_GUARD_AVAILABLE');
  else { reasonCodes.push('AI_EGRESS_PRIVACY_GUARD_MISSING'); passed = false; }

  if (governanceAuditOk) reasonCodes.push('GOVERNANCE_AUDIT_AVAILABLE');
  else { reasonCodes.push('GOVERNANCE_AUDIT_MISSING'); passed = false; }

  return {
    roleAccessMatrixAvailable: roleMatrixOk,
    privacyBoundaryAvailable: privacyBoundaryOk,
    dataClassificationAvailable: dataClassificationOk,
    aiEgressPrivacyGuardAvailable: aiEgressOk,
    governanceAuditAvailable: governanceAuditOk,
    operationalSensitive: false,
    reasonCodes,
    passed,
  };
}

function verifyRoleAccessMatrixAvailable(): boolean {
  try {
    require('./task020RoleAccessMatrixService');
    return true;
  } catch {
    return false;
  }
}

function verifyPrivacyBoundaryAvailable(): boolean {
  try {
    require('./task020PrivacyBoundaryEnforcementService');
    return true;
  } catch {
    return false;
  }
}

function verifyDataClassificationAvailable(): boolean {
  try {
    require('./task020DataClassificationRegistryService');
    return true;
  } catch {
    return false;
  }
}

function verifyAiEgressPrivacyGuardAvailable(): boolean {
  try {
    require('./task020AiEgressPrivacyGuardService');
    return true;
  } catch {
    return false;
  }
}

function verifyGovernanceAuditAvailable(): boolean {
  try {
    require('./task020GovernanceAuditService');
    return true;
  } catch {
    return false;
  }
}

export function buildTask020ProductionGateDecision(gate: Task020ProductionGateDecision): string {
  if (gate.passed) return 'TASK020_PRODUCTION_GATE_PASSED';
  return `TASK020_PRODUCTION_GATE_FAILED: ${gate.reasonCodes.join(', ')}`;
}
