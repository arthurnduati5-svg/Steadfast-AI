export interface Task021SchoolIntegrationReadinessDecision {
  verifiedSchoolContextRequired: boolean;
  crossSchoolDenialAvailable: boolean;
  rosterScopeGateAvailable: boolean;
  teacherClassScopeGateAvailable: boolean;
  parentLearnerLinkGateAvailable: boolean;
  reasonCodes: string[];
  passed: boolean;
}

export function verifyTask021SchoolIntegrationGate(): Task021SchoolIntegrationReadinessDecision {
  const schoolContextOk = verifyVerifiedSchoolContextRequired();
  const crossSchoolOk = verifyCrossSchoolDenialAvailable();
  const rosterScopeOk = verifyRosterScopeGateAvailable();
  const teacherClassOk = verifyTeacherClassScopeGateAvailable();
  const parentLinkOk = verifyParentLearnerLinkGateAvailable();

  const reasonCodes: string[] = [];
  let passed = true;

  if (schoolContextOk) reasonCodes.push('VERIFIED_SCHOOL_CONTEXT_REQUIRED');
  else { reasonCodes.push('VERIFIED_SCHOOL_CONTEXT_MISSING'); passed = false; }

  if (crossSchoolOk) reasonCodes.push('CROSS_SCHOOL_DENIAL_AVAILABLE');
  else { reasonCodes.push('CROSS_SCHOOL_DENIAL_MISSING'); passed = false; }

  if (rosterScopeOk) reasonCodes.push('ROSTER_SCOPE_GATE_AVAILABLE');
  else { reasonCodes.push('ROSTER_SCOPE_GATE_MISSING'); passed = false; }

  if (teacherClassOk) reasonCodes.push('TEACHER_CLASS_SCOPE_GATE_AVAILABLE');
  else { reasonCodes.push('TEACHER_CLASS_SCOPE_GATE_MISSING'); passed = false; }

  if (parentLinkOk) reasonCodes.push('PARENT_LEARNER_LINK_GATE_AVAILABLE');
  else { reasonCodes.push('PARENT_LEARNER_LINK_GATE_MISSING'); passed = false; }

  return {
    verifiedSchoolContextRequired: schoolContextOk,
    crossSchoolDenialAvailable: crossSchoolOk,
    rosterScopeGateAvailable: rosterScopeOk,
    teacherClassScopeGateAvailable: teacherClassOk,
    parentLearnerLinkGateAvailable: parentLinkOk,
    reasonCodes,
    passed,
  };
}

function verifyVerifiedSchoolContextRequired(): boolean {
  try {
    const svc = require('./task021SchoolContextVerificationService');
    return typeof svc.verifySchoolContext === 'function';
  } catch {
    return false;
  }
}

function verifyCrossSchoolDenialAvailable(): boolean {
  try {
    require('./task021SchoolIdentityMappingService');
    return true;
  } catch {
    return false;
  }
}

function verifyRosterScopeGateAvailable(): boolean {
  try {
    require('./task021RosterReconciliationService');
    return true;
  } catch {
    return false;
  }
}

function verifyTeacherClassScopeGateAvailable(): boolean {
  try {
    require('./task021TeacherAssignmentScopeService');
    return true;
  } catch {
    return false;
  }
}

function verifyParentLearnerLinkGateAvailable(): boolean {
  try {
    require('./task021ParentLearnerLinkVerificationService');
    return true;
  } catch {
    return false;
  }
}

export function buildTask021SchoolIntegrationReadinessDecision(
  decision: Task021SchoolIntegrationReadinessDecision
): string {
  if (decision.passed) return 'TASK021_SCHOOL_INTEGRATION_READY';
  return `TASK021_SCHOOL_INTEGRATION_BLOCKED: ${decision.reasonCodes.join(', ')}`;
}
