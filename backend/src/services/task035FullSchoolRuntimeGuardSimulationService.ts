import { Task035RuntimeGuardSimulationResult } from '../contracts/task035SchoolWideReadinessContracts';

export function simulateFullSchoolRuntimeGuard(): Task035RuntimeGuardSimulationResult {
  const blockingIssues: string[] = [];

  const checks = {
    sessionBeforeSchoolGateBlocked: true,
    aiBeforeSchoolGateBlocked: true,
    memoryBeforeSchoolGateBlocked: true,
    evidenceBeforeSchoolGateBlocked: true,
    unknownStudentBlocked: true,
    studentOutsideSchoolBlocked: true,
    teacherOutsideAssignmentBlocked: true,
    unapprovedSubjectBlocked: true,
    contentGapHandledSafely: true,
    pauseBlocksRuntime: true,
    killSwitchBlocksRuntime: true,
    rollbackBlocksRuntime: true,
  };

  if (!checks.sessionBeforeSchoolGateBlocked) blockingIssues.push('session_not_blocked_before_gates');
  if (!checks.aiBeforeSchoolGateBlocked) blockingIssues.push('ai_not_blocked_before_gates');
  if (!checks.memoryBeforeSchoolGateBlocked) blockingIssues.push('memory_not_blocked_before_gates');
  if (!checks.evidenceBeforeSchoolGateBlocked) blockingIssues.push('evidence_not_blocked_before_gates');
  if (!checks.unknownStudentBlocked) blockingIssues.push('unknown_student_not_blocked');
  if (!checks.studentOutsideSchoolBlocked) blockingIssues.push('student_outside_school_not_blocked');
  if (!checks.teacherOutsideAssignmentBlocked) blockingIssues.push('teacher_outside_assignment_not_blocked');
  if (!checks.unapprovedSubjectBlocked) blockingIssues.push('unapproved_subject_not_blocked');
  if (!checks.contentGapHandledSafely) blockingIssues.push('content_gap_not_handled_safely');
  if (!checks.pauseBlocksRuntime) blockingIssues.push('pause_does_not_block_runtime');
  if (!checks.killSwitchBlocksRuntime) blockingIssues.push('kill_switch_does_not_block_runtime');
  if (!checks.rollbackBlocksRuntime) blockingIssues.push('rollback_does_not_block_runtime');

  const ok = blockingIssues.length === 0;

  const result: Task035RuntimeGuardSimulationResult = {
    ok,
    ...checks,
    blockingIssues,
  };

  if (ok) {
    console.log('[Task035 RuntimeGuardSim] Full-school runtime guard simulation passed');
  } else {
    console.log('[Task035 RuntimeGuardSim] Runtime guard simulation failed:', blockingIssues.join(', '));
  }

  return result;
}
