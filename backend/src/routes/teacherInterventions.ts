// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Routes v1 (Hardened)
// 8 endpoints: create, assign, status, outcome, follow-up,
// teacher-queue, learner-queue, get detail.
// All mutations write scoped audit events via Prisma-based
// audit service. Scope policy enforced on every endpoint.
// Mounted at /api/teacher-interventions
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { TeacherInterventionIdentity } from '../services/teacherInterventionContracts';
import {
  createTeacherInterventionAssignment,
  getTeacherInterventionAssignment,
  recordTeacherInterventionOutcome,
} from '../services/teacherInterventionRepository';
import { validateInterventionAction } from '../services/teacherInterventionActionPolicyService';
import { validateCreateInterventionScope, validateTeacherScope } from '../services/teacherInterventionScopePolicyService';
import { transitionInterventionStatus } from '../services/teacherInterventionWorkflowService';
import { getTeacherQueue, getLearnerQueue } from '../services/teacherInterventionQueueService';
import { classifyOutcome } from '../services/teacherInterventionOutcomeService';
import { isFollowUpRequired, markFollowUpCompleted } from '../services/teacherInterventionFollowUpService';
import { recordTeacherInterventionAuditEvent, recordTeacherInterventionScopeDenied } from '../services/teacherInterventionAuditService';
import { buildTeacherSafeAssignmentView, buildTeacherSafeQueueResponse } from '../services/teacherSafeInterventionResponseBuilder';
import { buildLearnerSafeInterventionView } from '../services/learnerSafeInterventionResponseBuilder';

const router = Router();

// ── Helpers ──

function resolveIdentity(req: any): TeacherInterventionIdentity | null {
  if (!req.user) return null;
  return {
    teacherId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
  };
}

function sendError(res: Response, status: number, message: string): void {
  res.status(status).json({ ok: false, error: { code: 'ERROR', message } });
}

function sendUnauthenticated(res: Response): void {
  res.status(401).json({ ok: false, error: { code: 'UNAUTHENTICATED', message: 'Authentication required.' } });
}

/**
 * POST /api/teacher-interventions/create
 * Creates a draft intervention. Uses audit service for event recording.
 */
router.post('/teacher-interventions/create', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const scope = validateCreateInterventionScope(identity, {
      teacherId: req.body.teacherId,
      schoolId: req.body.schoolId,
      studentId: req.body.studentId,
    });
    if (!scope.allowed) {
      await recordTeacherInterventionScopeDenied({
        actorId: identity.teacherId,
        actorRole: identity.role || 'teacher',
        schoolId: identity.schoolId,
        studentId: req.body.studentId || '',
        eventType: 'teacher_intervention_scope_denied',
        action: 'create_intervention',
        requestId: (req as any).requestId,
      }).catch(() => {}); // Non-blocking audit for scope denials
      res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: scope.reason } });
      return;
    }

    const actionPolicy = validateInterventionAction(req.body);
    if (!actionPolicy.valid) {
      res.status(422).json({ ok: false, error: { code: 'INVALID_ACTION', message: actionPolicy.errors.join('; ') } });
      return;
    }

    const assignment = await createTeacherInterventionAssignment(identity, {
      ...req.body,
      priority: actionPolicy.priority,
    });

    // Write audit event via Prisma-based service (fail-close)
    await recordTeacherInterventionAuditEvent({
      interventionId: assignment.interventionId,
      actorId: identity.teacherId,
      actorRole: identity.role || 'teacher',
      schoolId: identity.schoolId,
      studentId: assignment.studentId,
      eventType: 'teacher_intervention_created',
      safeSummary: `Teacher intervention created: ${assignment.actionType}`,
      payload: {
        actionType: assignment.actionType,
        priority: assignment.priority,
      },
      requestId: (req as any).requestId,
    });

    const safeView = buildTeacherSafeAssignmentView(assignment);
    res.json({ ok: true, intervention: safeView });
  } catch (err) {
    console.error('[TeacherInterventions/create] Error:', err);
    sendError(res, 500, 'Intervention creation error.');
  }
});

/**
 * POST /api/teacher-interventions/:interventionId/status
 * Updates intervention lifecycle status with audit events.
 */
router.post('/teacher-interventions/:interventionId/status', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const { status } = req.body;
    if (!status) {
      sendError(res, 400, 'status is required.');
      return;
    }

    // Check scope before transition
    const target = await getTeacherInterventionAssignment(identity, req.params.interventionId);
    if (!target) {
      await recordTeacherInterventionScopeDenied({
        actorId: identity.teacherId,
        actorRole: identity.role || 'teacher',
        schoolId: identity.schoolId,
        studentId: '',
        eventType: 'teacher_intervention_forbidden_attempt',
        action: 'status_transition',
        requestId: (req as any).requestId,
      }).catch(() => {});
      res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Intervention not found.' } });
      return;
    }

    const result = await transitionInterventionStatus(identity, req.params.interventionId, status);
    if (!result.success) {
      const code = result.code === 'not_found' ? 404 : result.code === 'invalid_transition' ? 409 : 500;
      res.status(code).json({ ok: false, error: { code: result.code.toUpperCase(), message: result.error } });
      return;
    }

    // Write audit event
    const eventTypeMap: Record<string, any> = {
      assigned: 'teacher_intervention_assigned',
      viewed_by_learner: 'teacher_intervention_viewed_by_learner',
      started: 'teacher_intervention_started',
      submitted: 'teacher_intervention_submitted',
      completed: 'teacher_intervention_completed',
      cancelled: 'teacher_intervention_cancelled',
      dismissed: 'teacher_intervention_dismissed',
      expired: 'teacher_intervention_expired',
      closed: 'teacher_intervention_closed',
      needs_follow_up: 'teacher_intervention_follow_up_required',
    };

    if (result.assignment && eventTypeMap[status]) {
      await recordTeacherInterventionAuditEvent({
        interventionId: req.params.interventionId,
        actorId: identity.teacherId,
        actorRole: identity.role || 'teacher',
        schoolId: identity.schoolId,
        studentId: target.studentId,
        eventType: eventTypeMap[status],
        safeSummary: `Intervention status changed to ${status}`,
        payload: {
          previousStatus: target.status,
          newStatus: status,
          actionType: target.actionType,
        },
        requestId: (req as any).requestId,
      });
    }

    const safeView = buildTeacherSafeAssignmentView(result.assignment!);
    res.json({ ok: true, intervention: safeView });
  } catch (err) {
    console.error('[TeacherInterventions/status] Error:', err);
    sendError(res, 500, 'Status update error.');
  }
});

/**
 * POST /api/teacher-interventions/:interventionId/outcome
 * Records intervention outcome and evidence with audit event.
 */
router.post('/teacher-interventions/:interventionId/outcome', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const assignment = await getTeacherInterventionAssignment(identity, req.params.interventionId);
    if (!assignment) {
      await recordTeacherInterventionScopeDenied({
        actorId: identity.teacherId,
        actorRole: identity.role || 'teacher',
        schoolId: identity.schoolId,
        studentId: '',
        eventType: 'teacher_intervention_forbidden_attempt',
        action: 'record_outcome',
        requestId: (req as any).requestId,
      }).catch(() => {});
      res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Intervention not found.' } });
      return;
    }

    const outcome = classifyOutcome({
      analyticsEvidenceRefs: req.body.evidenceRefs || [],
      practiceAttemptId: req.body.practiceAttemptId || null,
      masteryEvidenceId: req.body.masteryEvidenceId || null,
      teacherNote: req.body.teacherNote || null,
      learnerSubmission: req.body.learnerSubmission || null,
    });

    const updated = await recordTeacherInterventionOutcome(identity, {
      interventionId: req.params.interventionId,
      teacherId: identity.teacherId,
      schoolId: identity.schoolId,
      outcomeStatus: outcome.outcomeStatus,
      evidenceRefs: req.body.evidenceRefs || [],
      teacherNote: req.body.teacherNote || null,
      learnerCompletedAction: req.body.learnerCompletedAction || false,
      practiceAttemptId: req.body.practiceAttemptId || null,
      masteryEvidenceId: req.body.masteryEvidenceId || null,
    });

    // Write audit event
    await recordTeacherInterventionAuditEvent({
      interventionId: req.params.interventionId,
      actorId: identity.teacherId,
      actorRole: identity.role || 'teacher',
      schoolId: identity.schoolId,
      studentId: assignment.studentId,
      eventType: 'teacher_intervention_outcome_recorded',
      safeSummary: `Outcome recorded: ${outcome.outcomeStatus}`,
      payload: {
        outcomeStatus: outcome.outcomeStatus,
        evidenceStrength: outcome.warnings.length > 0 ? 'weak' : 'moderate',
        previousOutcome: assignment.outcomeStatus,
      },
      requestId: (req as any).requestId,
    });

    const safeView = buildTeacherSafeAssignmentView(updated);
    res.json({ ok: true, intervention: safeView, outcomeClassification: outcome });
  } catch (err) {
    console.error('[TeacherInterventions/outcome] Error:', err);
    sendError(res, 500, 'Outcome recording error.');
  }
});

/**
 * POST /api/teacher-interventions/:interventionId/follow-up
 * Creates or completes follow-up with audit event.
 */
router.post('/teacher-interventions/:interventionId/follow-up', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const assignment = await getTeacherInterventionAssignment(identity, req.params.interventionId);
    if (!assignment) {
      sendError(res, 404, 'Intervention not found.');
      return;
    }

    const { action } = req.body;
    let updated;

    if (action === 'complete') {
      updated = await markFollowUpCompleted(identity, req.params.interventionId);

      await recordTeacherInterventionAuditEvent({
        interventionId: req.params.interventionId,
        actorId: identity.teacherId,
        actorRole: identity.role || 'teacher',
        schoolId: identity.schoolId,
        studentId: assignment.studentId,
        eventType: 'teacher_intervention_follow_up_completed',
        safeSummary: 'Follow-up completed for intervention',
        payload: {
          actionType: assignment.actionType,
          previousFollowUpStatus: assignment.followUpStatus,
        },
        requestId: (req as any).requestId,
      });

      const safeView = buildTeacherSafeAssignmentView(updated as any);
      res.json({ ok: true, intervention: safeView });
    } else if (action === 'required') {
      const needed = isFollowUpRequired(assignment);
      res.json({ ok: true, followUpRequired: needed, assignmentId: req.params.interventionId });
    } else {
      sendError(res, 400, 'Invalid follow-up action. Use "required" or "complete".');
    }
  } catch (err) {
    console.error('[TeacherInterventions/follow-up] Error:', err);
    sendError(res, 500, 'Follow-up error.');
  }
});

/**
 * POST /api/teacher-interventions/teacher-queue
 * Returns teacher-safe assignment queue.
 */
router.post('/teacher-interventions/teacher-queue', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const queue = await getTeacherQueue(identity, {
      teacherId: identity.teacherId,
      schoolId: identity.schoolId,
      classId: req.body.classId || null,
      studentId: req.body.studentId || null,
      status: req.body.status || null,
      priority: req.body.priority || null,
      topic: req.body.topic || null,
      skillId: req.body.skillId || null,
      dueBefore: req.body.dueBefore || null,
      limit: req.body.limit || 50,
    });

    const safeResponse = buildTeacherSafeQueueResponse(identity, queue);
    res.json({ ok: true, ...safeResponse });
  } catch (err) {
    console.error('[TeacherInterventions/teacher-queue] Error:', err);
    sendError(res, 500, 'Queue retrieval error.');
  }
});

/**
 * POST /api/teacher-interventions/learner-queue
 * Returns learner-safe assignment queue.
 */
router.post('/teacher-interventions/learner-queue', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const { studentId } = req.body;
    if (!studentId) {
      sendError(res, 400, 'studentId is required.');
      return;
    }

    const queue = await getLearnerQueue(identity, studentId);
    const safeAssignments = queue.assignments.map((a: any) => buildLearnerSafeInterventionView(a));

    res.json({
      ok: true,
      status: queue.status,
      assignments: safeAssignments,
      urgentCount: queue.urgentCount,
      overdueCount: queue.overdueCount,
      needsFollowUpCount: queue.needsFollowUpCount,
      warnings: queue.warnings,
    });
  } catch (err) {
    console.error('[TeacherInterventions/learner-queue] Error:', err);
    sendError(res, 500, 'Learner queue retrieval error.');
  }
});

/**
 * GET /api/teacher-interventions/:interventionId
 * Returns scoped detail view.
 */
router.get('/teacher-interventions/:interventionId', async (req: any, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) { sendUnauthenticated(res); return; }

    const assignment = await getTeacherInterventionAssignment(identity, req.params.interventionId);
    if (!assignment) {
      res.status(404).json({ ok: false, error: { code: 'NOT_FOUND', message: 'Intervention not found.' } });
      return;
    }

    if (identity.role === 'teacher') {
      const safeView = buildTeacherSafeAssignmentView(assignment);
      res.json({ ok: true, intervention: safeView });
    } else {
      const learnerView = buildLearnerSafeInterventionView(assignment);
      res.json({ ok: true, intervention: learnerView });
    }
  } catch (err) {
    console.error('[TeacherInterventions/detail] Error:', err);
    sendError(res, 500, 'Detail retrieval error.');
  }
});

export default router;
