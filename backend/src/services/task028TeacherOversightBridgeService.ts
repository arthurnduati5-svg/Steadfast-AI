import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import type {
  Task028TeacherOversightSnapshot,
  Task028TeacherOversightInput,
} from '../contracts/task028ControlledExpansionExecutionContracts';
import { nowISO } from '../contracts/task028ControlledExpansionExecutionContracts';
import {
  validateTask028TeacherOversightInput,
  createSafeTask028ValidationError,
} from '../lib/task028ControlledExpansionExecutionValidation';

export async function generateTeacherOversightSnapshot(
  input: Task028TeacherOversightInput,
): Promise<Task028TeacherOversightSnapshot> {
  const errors = validateTask028TeacherOversightInput(input);
  if (errors.length > 0) {
    throw createSafeTask028ValidationError('Invalid teacher oversight input.', errors);
  }

  const { runId, schoolId, teacherId } = input;

  const run = await task028ExpansionExecutionRepository.getExecutionRun(runId);
  if (!run) {
    throw createSafeTask028ValidationError('Execution run not found.', ['execution_run_not_found']);
  }
  const runAny = run as any;

  const participants = await task028ExpansionExecutionRepository.listExpandedParticipants(runId);
  const teachers = participants.filter(
    (p: any) => p.role === 'teacher' && p.activationStatus === 'active',
  );
  const isAssignedTeacher = teachers.some((t: any) => t.actorIdHash === teacherId);

  const oversightItems = await task028ExpansionExecutionRepository.listOversightItems(runId);

  const safeEngagementCount = participants.filter(
    (p: any) => p.activationStatus === 'active',
  ).length;

  const blockedEventCount = oversightItems.filter(
    (o: any) => o.itemType === 'blocked_student_access',
  ).length;

  const supportNeededCount = oversightItems.filter(
    (o: any) => o.requiresTeacherReview === true && o.status === 'open',
  ).length;

  const interventionNeededCount = oversightItems.filter(
    (o: any) => o.requiresPause === true || o.requiresRollback === true,
  ).length;

  const safeguardingSignalCount = oversightItems.filter(
    (o: any) => o.severity === 'critical' && o.status === 'open',
  ).length;

  const incidentCount = oversightItems.filter(
    (o: any) => o.severity === 'high' || o.severity === 'critical',
  ).length;

  let oversightStatus: 'healthy' | 'watch' | 'needs_review' | 'critical' = 'healthy';
  const safeNextActions: string[] = [];

  if (safeguardingSignalCount > 0 || incidentCount > 3) {
    oversightStatus = 'critical';
    safeNextActions.push('Immediate admin review required.');
    safeNextActions.push('Consider pausing expansion.');
  } else if (interventionNeededCount > 0 || supportNeededCount > 3) {
    oversightStatus = 'needs_review';
    safeNextActions.push('Review outstanding intervention items.');
    safeNextActions.push('Address support requests.');
  } else if (blockedEventCount > 5 || supportNeededCount > 0) {
    oversightStatus = 'watch';
    safeNextActions.push('Monitor blocked events.');
    safeNextActions.push('Check support queue.');
  } else {
    safeNextActions.push('Continue monitoring.');
  }

  const pauseRecommended = oversightStatus === 'critical';
  const rollbackRecommended = oversightStatus === 'critical' && incidentCount > 5;

  return {
    runId,
    schoolId,
    teacherId: isAssignedTeacher ? teacherId : 'unassigned_teacher',
    oversightStatus,
    expansionRunStatus: runAny.status,
    expandedCohortSafeCount: participants.filter((p: any) => p.activationStatus === 'active').length,
    safeEngagementCount,
    blockedEventCount,
    supportNeededCount,
    interventionNeededCount,
    safeguardingSignalCount,
    incidentCount,
    safeNextActions,
    pauseRecommended,
    rollbackRecommended,
    generatedAt: nowISO(),
  };
}
