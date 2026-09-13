// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Queue Service v1
// Sorted queues for teacher and learner views.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionAssignment,
  TeacherInterventionQueueRequest,
  TeacherInterventionQueueResponse,
  TeacherInterventionIdentity,
} from './teacherInterventionContracts';
import {
  listTeacherInterventionQueue,
  listLearnerInterventions,
} from './teacherInterventionRepository';
import { validateTeacherScope, validateLearnerScope } from './teacherInterventionScopePolicyService';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function isOverdue(assignment: TeacherInterventionAssignment): boolean {
  if (!assignment.dueAt) return false;
  return assignment.dueAt < nowISO() && !['completed', 'closed', 'cancelled', 'dismissed', 'expired'].includes(assignment.status);
}

function isUrgent(assignment: TeacherInterventionAssignment): boolean {
  return assignment.priority === 'urgent' && !['completed', 'closed', 'cancelled', 'dismissed', 'expired'].includes(assignment.status);
}

function needsFollowUp(assignment: TeacherInterventionAssignment): boolean {
  return assignment.followUpRequired && assignment.followUpStatus !== 'completed' && assignment.status !== 'closed';
}

// ── Public API ──

/**
 * Get teacher intervention queue with sorting and counts.
 */
export async function getTeacherQueue(
  identity: TeacherInterventionIdentity,
  request: TeacherInterventionQueueRequest,
): Promise<TeacherInterventionQueueResponse> {
  // Validate scope
  const scope = validateTeacherScope(identity, request.studentId, request.schoolId, request.classId);
  if (!scope.allowed) {
    return {
      status: 'forbidden',
      assignments: [],
      urgentCount: 0,
      overdueCount: 0,
      needsFollowUpCount: 0,
      warnings: [scope.reason],
      metadata: {},
    };
  }

  const assignments = await listTeacherInterventionQueue(identity, request);

  // Calculate counts
  const urgentCount = assignments.filter(isUrgent).length;
  const overdueCount = assignments.filter(isOverdue).length;
  const needsFollowUpCount = assignments.filter(needsFollowUp).length;

  return {
    status: assignments.length > 0 ? 'ok' : 'empty',
    assignments,
    urgentCount,
    overdueCount,
    needsFollowUpCount,
    warnings: [],
    metadata: { generatedAt: nowISO(), totalCount: assignments.length },
  };
}

/**
 * Get learner's active assignment queue.
 */
export async function getLearnerQueue(
  identity: TeacherInterventionIdentity,
  studentId: string,
): Promise<TeacherInterventionQueueResponse> {
  // Validate learner scope
  const scope = validateLearnerScope(identity, studentId, identity.schoolId);
  if (!scope.allowed) {
    return {
      status: 'forbidden',
      assignments: [],
      urgentCount: 0,
      overdueCount: 0,
      needsFollowUpCount: 0,
      warnings: [scope.reason],
      metadata: {},
    };
  }

  const assignments = await listLearnerInterventions(identity, studentId);

  // Filter to active (non-closed) assignments
  const active = assignments.filter((a) => !['closed', 'cancelled', 'dismissed', 'expired'].includes(a.status));

  // Sort: urgent first, then by priority, then by due date
  active.sort((a, b) => {
    const priorityRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    const pa = priorityRank[a.priority] ?? 99;
    const pb = priorityRank[b.priority] ?? 99;
    if (pa !== pb) return pa - pb;
    if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
    if (a.dueAt) return -1;
    if (b.dueAt) return 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return {
    status: active.length > 0 ? 'ok' : 'empty',
    assignments: active.slice(0, 10),
    urgentCount: active.filter(isUrgent).length,
    overdueCount: active.filter(isOverdue).length,
    needsFollowUpCount: active.filter(needsFollowUp).length,
    warnings: [],
    metadata: { generatedAt: nowISO(), totalActive: active.length },
  };
}
