import type {
  Task025TeacherWorkflowStatus,
  Task025ReadinessBlocker,
  Task025RiskLevel,
} from '../contracts/task025ControlledPilotReadinessContracts';

export interface TeacherWorkflowValidationResult {
  teacherWorkflowStatus: Task025TeacherWorkflowStatus;
  riskLevel: Task025RiskLevel;
  safeSummary: string;
  safeBlockers: Task025ReadinessBlocker[];
  teacherCount: number;
  validatedTeachers: number;
  allTeachersUnderstandScope: boolean;
  escalationPathKnown: boolean;
  privacyBoundaryUnderstood: boolean;
}

export async function validateTeacherWorkflow(params: {
  teacherCount: number;
  validatedTeachers: number;
  allTeachersUnderstandScope: boolean;
  escalationPathKnown: boolean;
  privacyBoundaryUnderstood: boolean;
}): Promise<TeacherWorkflowValidationResult> {
  const blockers: Task025ReadinessBlocker[] = [];

  if (params.teacherCount === 0) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'No teachers available for pilot workflow validation.',
      requiredAction: 'Assign teachers to the pilot before validation.',
    });
    return {
      teacherWorkflowStatus: 'teacher_workflow_blocked',
      riskLevel: 'high',
      safeSummary: 'No teachers available.',
      safeBlockers: blockers,
      teacherCount: 0,
      validatedTeachers: 0,
      allTeachersUnderstandScope: false,
      escalationPathKnown: false,
      privacyBoundaryUnderstood: false,
    };
  }

  if (params.validatedTeachers < params.teacherCount) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'medium',
      safeDescription: `${params.teacherCount - params.validatedTeachers} teacher(s) have not been validated.`,
      requiredAction: 'Complete workflow validation for all teachers.',
    });
  }

  if (!params.allTeachersUnderstandScope) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'Not all teachers understand the pilot scope.',
      requiredAction: 'Ensure all teachers understand the pilot scope and expectations.',
    });
  }

  if (!params.escalationPathKnown) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'Teachers do not know the escalation path.',
      requiredAction: 'Communicate the escalation path to all teachers.',
    });
  }

  if (!params.privacyBoundaryUnderstood) {
    blockers.push({
      type: 'teacher_workflow',
      severity: 'high',
      safeDescription: 'Teachers do not understand privacy boundaries.',
      requiredAction: 'Ensure teachers understand privacy boundaries and no raw data access policy.',
    });
  }

  const hasHighBlocker = blockers.some((b) => b.severity === 'high');
  const status: Task025TeacherWorkflowStatus = hasHighBlocker
    ? 'teacher_workflow_blocked'
    : blockers.length > 0
      ? 'teacher_workflow_pending'
      : 'teacher_workflow_validated';
  const riskLevel: Task025RiskLevel = hasHighBlocker ? 'high' : blockers.length > 0 ? 'medium' : 'low';

  return {
    teacherWorkflowStatus: status,
    riskLevel,
    safeSummary: status === 'teacher_workflow_validated'
      ? `All ${params.validatedTeachers}/${params.teacherCount} teachers validated.`
      : `Teacher workflow validation has ${blockers.length} issue(s).`,
    safeBlockers: blockers,
    teacherCount: params.teacherCount,
    validatedTeachers: params.validatedTeachers,
    allTeachersUnderstandScope: params.allTeachersUnderstandScope,
    escalationPathKnown: params.escalationPathKnown,
    privacyBoundaryUnderstood: params.privacyBoundaryUnderstood,
  };
}
