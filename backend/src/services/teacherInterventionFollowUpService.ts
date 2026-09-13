// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Follow-Up Service v1
// Determines if follow-up is needed and manages follow-up state.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionAssignment,
  TeacherInterventionIdentity,
  TeacherInterventionFollowUpStatus,
} from './teacherInterventionContracts';
import {
  getTeacherInterventionAssignment,
  recordTeacherInterventionFollowUp,
  updateTeacherInterventionStatus,
} from './teacherInterventionRepository';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

// ── Public API ──

/**
 * Determine if follow-up is required based on assignment state.
 */
export function isFollowUpRequired(assignment: TeacherInterventionAssignment): boolean {
  // High/urgent priority always needs follow-up
  if (assignment.priority === 'high' || assignment.priority === 'urgent') return true;

  // Certain outcomes require follow-up
  if (assignment.outcomeStatus === 'unchanged' || assignment.outcomeStatus === 'worsened') return true;
  if (assignment.outcomeStatus === 'needs_reteach' || assignment.outcomeStatus === 'needs_teacher_check_in') return true;
  if (assignment.outcomeStatus === 'blocked') return true;

  // Student didn't start before due date
  if (assignment.dueAt && assignment.dueAt < nowISO() && assignment.status === 'assigned') return true;

  // Expired assignments need follow-up
  if (assignment.status === 'expired') return true;

  return false;
}

/**
 * Mark follow-up as pending.
 */
export async function markFollowUpPending(
  identity: TeacherInterventionIdentity,
  interventionId: string,
): Promise<TeacherInterventionAssignment> {
  const assignment = await getTeacherInterventionAssignment(identity, interventionId);
  if (!assignment) throw new Error('Intervention not found');

  await updateTeacherInterventionStatus(identity, {
    interventionId,
    teacherId: identity.teacherId,
    schoolId: identity.schoolId,
    followUpRequired: true,
    status: 'needs_follow_up',
  });

  return recordTeacherInterventionFollowUp(identity, interventionId, 'pending');
}

/**
 * Mark follow-up as overdue.
 */
export async function markFollowUpOverdue(
  identity: TeacherInterventionIdentity,
  interventionId: string,
): Promise<TeacherInterventionAssignment> {
  const assignment = await getTeacherInterventionAssignment(identity, interventionId);
  if (!assignment) throw new Error('Intervention not found');

  return recordTeacherInterventionFollowUp(identity, interventionId, 'overdue');
}

/**
 * Mark follow-up as completed.
 */
export async function markFollowUpCompleted(
  identity: TeacherInterventionIdentity,
  interventionId: string,
): Promise<TeacherInterventionAssignment> {
  const assignment = await getTeacherInterventionAssignment(identity, interventionId);
  if (!assignment) throw new Error('Intervention not found');

  await updateTeacherInterventionStatus(identity, {
    interventionId,
    teacherId: identity.teacherId,
    schoolId: identity.schoolId,
    followUpRequired: false,
    status: 'needs_follow_up',
  });

  return recordTeacherInterventionFollowUp(identity, interventionId, 'completed');
}

/**
 * Recommend next follow-up action based on current state.
 */
export function recommendNextFollowUpAction(assignment: TeacherInterventionAssignment): string {
  if (assignment.outcomeStatus === 'unchanged') {
    return 'Student outcome unchanged — consider alternative approach or reteach.';
  }
  if (assignment.outcomeStatus === 'worsened') {
    return 'Student outcome worsened — immediate teacher check-in recommended.';
  }
  if (assignment.outcomeStatus === 'needs_reteach') {
    return 'Student needs reteaching — assign foundation practice or alternative explanation.';
  }
  if (assignment.outcomeStatus === 'needs_teacher_check_in') {
    return 'Student needs teacher check-in — schedule a brief meeting or chat.';
  }
  if (assignment.priority === 'urgent') {
    return 'Urgent intervention — verify student received instruction and offer support.';
  }
  if (assignment.status === 'expired') {
    return 'Assignment expired — consider creating a new assignment with adjusted due date.';
  }
  return 'Follow-up completed — no further action needed at this time.';
}
