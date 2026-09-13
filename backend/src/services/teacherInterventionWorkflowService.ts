// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Workflow Service v1
// Manages intervention lifecycle transitions.
// Valid transitions:
//   draft -> assigned, draft -> cancelled, draft -> dismissed
//   assigned -> viewed_by_learner, assigned -> cancelled
//   viewed_by_learner -> started
//   started -> submitted
//   submitted -> completed, submitted -> needs_follow_up
//   needs_follow_up -> completed, needs_follow_up -> closed
//   completed -> closed
//   cancelled -> closed
//   dismissed -> closed
//   expired -> closed
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionAssignment,
  TeacherInterventionStatus,
  TeacherInterventionIdentity,
} from './teacherInterventionContracts';
import {
  getTeacherInterventionAssignment,
  updateTeacherInterventionStatus,
} from './teacherInterventionRepository';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

// ── Valid transitions map ──

const VALID_TRANSITIONS: Record<TeacherInterventionStatus, TeacherInterventionStatus[]> = {
  draft: ['assigned', 'cancelled', 'dismissed'],
  assigned: ['viewed_by_learner', 'cancelled'],
  viewed_by_learner: ['started'],
  started: ['submitted'],
  submitted: ['completed', 'needs_follow_up'],
  completed: ['closed', 'needs_follow_up'],
  cancelled: ['closed'],
  dismissed: ['closed'],
  expired: ['closed'],
  needs_follow_up: ['completed', 'closed'],
  closed: [],
};

export interface WorkflowResult {
  success: boolean;
  assignment?: TeacherInterventionAssignment;
  error?: string;
  code: 'ok' | 'not_found' | 'invalid_transition' | 'error';
}

// ── Public API ──

/**
 * Transition an intervention to a new status.
 */
export async function transitionInterventionStatus(
  identity: TeacherInterventionIdentity,
  interventionId: string,
  newStatus: TeacherInterventionStatus,
): Promise<WorkflowResult> {
  const assignment = await getTeacherInterventionAssignment(identity, interventionId);
  if (!assignment) {
    return { success: false, error: 'Intervention not found.', code: 'not_found' };
  }

  const allowed = VALID_TRANSITIONS[assignment.status];
  if (!allowed.includes(newStatus)) {
    return {
      success: false,
      error: `Invalid transition from '${assignment.status}' to '${newStatus}'. Allowed: ${allowed.join(', ')}`,
      code: 'invalid_transition',
    };
  }

  // Additional rules
  const now = nowISO();
  const updates: Record<string, unknown> = { status: newStatus };

  if (newStatus === 'assigned') {
    updates.startedAt = null;
    updates.completedAt = null;
  }
  if (newStatus === 'viewed_by_learner') {
    // No timestamp needed
  }
  if (newStatus === 'started') {
    updates.startedAt = now;
  }
  if (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'dismissed') {
    updates.completedAt = now;
  }

  const updated = await updateTeacherInterventionStatus(identity, {
    interventionId,
    teacherId: identity.teacherId,
    schoolId: identity.schoolId,
    ...updates,
  } as any);

  return { success: true, assignment: updated, code: 'ok' };
}

/**
 * Check if a transition is valid without performing it.
 */
export function isValidTransition(
  currentStatus: TeacherInterventionStatus,
  newStatus: TeacherInterventionStatus,
): boolean {
  const allowed = VALID_TRANSITIONS[currentStatus];
  return allowed.includes(newStatus);
}
