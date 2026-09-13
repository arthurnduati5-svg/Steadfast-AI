// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher-Safe Intervention Response Builder v1
// Builds teacher-safe intervention queue/detail views.
// Includes: assignment summary, student id, topic/skill, action,
// priority, status, due date, evidence summary, outcome, follow-up.
// Excludes: raw learner chat logs, raw transcripts, private memory.
// ─────────────────────────────────────────────────────────────

import type {
  TeacherInterventionAssignment,
  TeacherInterventionQueueResponse,
  TeacherInterventionSafeTeacherView,
  TeacherInterventionIdentity,
} from './teacherInterventionContracts';
import { validateTeacherScope } from './teacherInterventionScopePolicyService';

/**
 * Build a teacher-safe assignment detail view.
 * Strips raw learner data while preserving actionable information.
 */
export function buildTeacherSafeAssignmentView(
  assignment: TeacherInterventionAssignment,
): TeacherInterventionSafeTeacherView {
  // Strip any raw data that may have leaked
  const safeEvidenceSummary = stripRawData(assignment.evidenceSummary);
  const safeTeacherReason = assignment.teacherReason.slice(0, 1000);
  const safePrivateNote = assignment.teacherPrivateNote ? assignment.teacherPrivateNote.slice(0, 2000) : null;

  return {
    interventionId: assignment.interventionId,
    studentId: assignment.studentId,
    actionType: assignment.actionType,
    priority: assignment.priority,
    status: assignment.status,
    outcomeStatus: assignment.outcomeStatus,
    subject: assignment.subject,
    topic: assignment.topic,
    skillLabel: assignment.skillLabel,
    learnerFacingInstruction: assignment.learnerFacingInstruction,
    teacherPrivateNote: safePrivateNote,
    teacherReason: safeTeacherReason,
    dueAt: assignment.dueAt,
    followUpRequired: assignment.followUpRequired,
    followUpStatus: assignment.followUpStatus,
    evidenceSummary: safeEvidenceSummary,
    createdAt: assignment.createdAt,
    updatedAt: assignment.updatedAt,
    warnings: assignment.warnings.slice(0, 5),
  };
}

/**
 * Build a teacher-safe queue response from a raw queue.
 * Strips unsafe fields from every assignment.
 */
export function buildTeacherSafeQueueResponse(
  identity: TeacherInterventionIdentity,
  queue: TeacherInterventionQueueResponse,
): TeacherInterventionQueueResponse {
  // Validate scope
  const scope = validateTeacherScope(identity);
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

  // Build safe views for each assignment
  const safeAssignments = queue.assignments.map((a) => buildTeacherSafeAssignmentView(a));

  return {
    status: queue.status,
    assignments: safeAssignments as any,
    urgentCount: queue.urgentCount,
    overdueCount: queue.overdueCount,
    needsFollowUpCount: queue.needsFollowUpCount,
    warnings: queue.warnings,
    metadata: queue.metadata,
  };
}

/**
 * Strip raw data patterns from text.
 */
function stripRawData(text: string): string {
  let safe = text;
  // Remove potential raw data patterns
  safe = safe.replace(/rawTranscript[:=].*?(?:\n|$)/gi, '[transcript stripped] ');
  safe = safe.replace(/rawChatLog[:=].*?(?:\n|$)/gi, '[chat log stripped] ');
  safe = safe.replace(/privateMemory[:=].*?(?:\n|$)/gi, '[private memory stripped] ');
  safe = safe.replace(/learnerMemory[:=].*?(?:\n|$)/gi, '[memory stripped] ');
  return safe.slice(0, 2000);
}
