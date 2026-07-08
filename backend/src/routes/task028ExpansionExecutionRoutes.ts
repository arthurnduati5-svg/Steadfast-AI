import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';
import { transitionExecutionState } from '../services/task028ExpansionExecutionStateMachine';
import { activateExpandedCohort } from '../services/task028StagedCohortActivationService';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';
import { createHealthSnapshot } from '../services/task028ExpansionHealthSnapshotService';
import { createOversightItem } from '../services/task028ExpansionOversightQueueService';
import {
  pauseExpansion,
  resumeExpansion,
  enableKillSwitch,
  disableKillSwitch,
  requestIntervention,
  completeIntervention,
} from '../services/task028ExpansionInterventionService';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';
import { generateCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import { generateExecutionReport } from '../services/task028ExpansionExecutionReportService';
import { recordAuditEvent } from '../services/task028ExpansionExecutionAuditService';

const router = Router();

const adminGuard = [schoolAuthMiddleware, requireRole('admin')];
const internalGuard = [schoolAuthMiddleware, requireRole('admin', 'counselor')];
const teacherAdminGuard = [schoolAuthMiddleware, requireRole('admin')];
const studentGuard = [schoolAuthMiddleware, requireRole('student')];

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'anonymous';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'anonymous';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeDeniedResponse(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'EXPANSION_EXECUTION_ACCESS_DENIED', safeMessage: 'This expansion execution action is not available for this account, role, school, or execution state.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

// ── Execution Status ──

router.get('/pilot/expansion/execution/status', ...teacherAdminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    const pilotProgramId = req.query.pilotProgramId as string;
    const runs = schoolId
      ? await task028ExpansionExecutionRepository.listExecutionRuns(schoolId, pilotProgramId)
      : await task028ExpansionExecutionRepository.listExecutionRuns();

    const statusCounts: Record<string, number> = {};
    for (const r of runs as any[]) {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    }

    res.json({ ok: true, totalRuns: runs.length, statusCounts, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EXECUTION_STATUS_FAILED', 'Failed to get execution status.', ['internal_error'], requestId);
  }
});

// ── Preflight Check ──

router.post('/pilot/expansion/execution/preflight', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { expansionProposalId, pilotProgramId } = req.body;
    if (!expansionProposalId || !pilotProgramId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'expansionProposalId and pilotProgramId are required.', ['missing_required_fields'], requestId);
      return;
    }

    let proof: any;
    try {
      proof = await loadTask027Proof();
    } catch {
      safeErrorEnvelope(res, 400, 'PREFLIGHT_FAILED', 'Could not load Task 027 proof for this proposal.', ['proof_load_failed'], requestId);
      return;
    }

    if (!proof || !proof.safeToExecuteExpansion) {
      safeErrorEnvelope(res, 400, 'PREFLIGHT_FAILED', 'Preflight check failed: Task 027 proof does not confirm safeToExecuteExpansion.', ['preflight_failed', 'proof_not_safe'], requestId);
      return;
    }

    try {
      await recordExpansionMonitoringEvent({
        executionRunId: '',
        pilotProgramId,
        schoolId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        eventType: 'expansion_preflight_passed',
        eventStatus: 'completed',
        safeSummary: 'Expansion execution preflight check passed.',
        reasonCodes: [],
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.json({ ok: true, preflightPassed: true, safeToExecuteExpansion: proof.safeToExecuteExpansion, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PREFLIGHT_FAILED', 'Failed to run preflight check.', ['internal_error'], requestId);
  }
});

// ── Start Execution ──

router.post('/pilot/expansion/execution/start', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { expansionProposalId, pilotProgramId, approvedDecisionRef, task027ReportRef, stagePlan, approvedScopeSnapshot, safeSummary } = req.body;
    if (!expansionProposalId || !pilotProgramId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'expansionProposalId and pilotProgramId are required.', ['missing_required_fields'], requestId);
      return;
    }

    let proof: any;
    try {
      proof = await loadTask027Proof();
    } catch {
      safeErrorEnvelope(res, 400, 'START_FAILED', 'Could not load Task 027 proof.', ['proof_load_failed'], requestId);
      return;
    }

    if (!proof || !proof.safeToExecuteExpansion) {
      safeErrorEnvelope(res, 400, 'START_FAILED', 'Task 027 proof does not confirm safeToExecuteExpansion.', ['preflight_failed', 'proof_not_safe'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId,
      pilotProgramId,
      schoolId,
      status: 'not_started',
      approvedDecisionRef: approvedDecisionRef || (proof as any).approvedDecisionRef,
      task027ReportRef: task027ReportRef || (proof as any).task027ReportRef,
      safeSummary: safeSummary || `Expansion execution for proposal ${expansionProposalId}`,
      stagePlan: stagePlan ?? {},
      approvedScopeSnapshot: approvedScopeSnapshot ?? {},
      startedByRole: getActorRole(req),
      startedByActorIdHash: getActorId(req),
    });

    let stateResult: any;
    try {
      stateResult = await transitionExecutionState((run as any).id, 'preflight_required', getActorRole(req), getActorId(req), requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'START_FAILED', 'Execution run created but state transition failed.', ['state_transition_failed'], requestId);
      return;
    }

    try {
      await recordAuditEvent({
        pilotProgramId,
        schoolId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        action: 'execution_started',
        safeSummary: 'Expansion execution started.',
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({
      ok: true,
      executionRunId: (run as any).id,
      currentStatus: 'preflight_required',
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'START_FAILED', 'Failed to start expansion execution.', ['internal_error'], requestId);
  }
});

// ── Activate Stage ──

router.post('/pilot/expansion/execution/stages/:stageNumber/activate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const stageNumber = parseInt(req.params.stageNumber, 10);
    if (isNaN(stageNumber) || stageNumber < 1) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'stageNumber must be a positive integer.', ['invalid_stage_number'], requestId);
      return;
    }

    const { executionRunId, expansionProposalId, plannedStudentCount, plannedTeacherCount, allowedClassIds, allowedSubjectIds, allowedCurriculumScopes } = req.body;
    if (!executionRunId || !expansionProposalId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId and expansionProposalId are required.', ['missing_required_fields'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
      return;
    }

    let stageResult: any;
    try {
      stageResult = await activateExpandedCohort({
        executionRunId,
        pilotProgramId: (run as any).pilotProgramId,
        schoolId,
        stageNumber,
        plannedStudentCount: plannedStudentCount ?? 0,
        plannedTeacherCount: plannedTeacherCount ?? 0,
        allowedClassIds: allowedClassIds ?? [],
        allowedSubjectIds: allowedSubjectIds ?? [],
        allowedCurriculumScopes: allowedCurriculumScopes ?? [],
        expansionProposalId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        requestId,
      });
    } catch {
      safeErrorEnvelope(res, 500, 'STAGE_ACTIVATE_FAILED', 'Stage activation service failed.', ['stage_activation_failed'], requestId);
      return;
    }

    if (!stageResult || !stageResult.ok) {
      safeErrorEnvelope(res, 400, 'STAGE_ACTIVATE_FAILED', stageResult?.safeMessage || 'Stage activation failed.', stageResult?.reasonCodes || ['stage_activation_failed'], requestId);
      return;
    }

    try {
      await recordAuditEvent({
        executionRunId,
        schoolId,
        pilotProgramId: (run as any).pilotProgramId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        action: 'stage_activated',
        safeSummary: `Stage ${stageNumber} activated.`,
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({ ok: true, stageId: stageResult.stageId, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAGE_ACTIVATE_FAILED', 'Failed to activate stage.', ['internal_error'], requestId);
  }
});

// ── Pause Stage (pauses entire expansion) ──

router.post('/pilot/expansion/execution/stages/:stageNumber/pause', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
      return;
    }

    let pauseResult: any;
    try {
      pauseResult = await pauseExpansion(executionRunId, getActorRole(req), getActorId(req), requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'STAGE_PAUSE_FAILED', 'Stage pause service failed.', ['stage_pause_failed'], requestId);
      return;
    }

    if (!pauseResult || !pauseResult.ok) {
      safeErrorEnvelope(res, 400, 'STAGE_PAUSE_FAILED', pauseResult?.safeMessage || 'Stage pause failed.', pauseResult?.reasonCodes || ['stage_pause_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: pauseResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAGE_PAUSE_FAILED', 'Failed to pause stage.', ['internal_error'], requestId);
  }
});

// ── Resume Stage (resumes entire expansion) ──

router.post('/pilot/expansion/execution/stages/:stageNumber/resume', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
      return;
    }

    let resumeResult: any;
    try {
      resumeResult = await resumeExpansion(executionRunId, getActorRole(req), getActorId(req), requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'STAGE_RESUME_FAILED', 'Stage resume service failed.', ['stage_resume_failed'], requestId);
      return;
    }

    if (!resumeResult || !resumeResult.ok) {
      safeErrorEnvelope(res, 400, 'STAGE_RESUME_FAILED', resumeResult?.safeMessage || 'Stage resume failed.', resumeResult?.reasonCodes || ['stage_resume_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: resumeResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAGE_RESUME_FAILED', 'Failed to resume stage.', ['internal_error'], requestId);
  }
});

// ── Session Preflight ──

router.post('/pilot/expansion/execution/session/preflight', ...studentGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { executionRunId, classId, subjectId, curriculumScope } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    let gateResult: any;
    try {
      gateResult = await checkExpandedSessionGate({
        schoolId,
        executionRunId,
        actorIdHash: getActorId(req),
        role: getActorRole(req),
        classId,
        subjectId,
        curriculumScope,
      });
    } catch {
      safeErrorEnvelope(res, 500, 'SESSION_PREFLIGHT_FAILED', 'Runtime gate check failed.', ['runtime_gate_error'], requestId);
      return;
    }

    if (!gateResult || !gateResult.allowed) {
      safeErrorEnvelope(res, 403, 'SESSION_PREFLIGHT_DENIED', gateResult?.safeMessage || 'Session preflight denied by runtime guard.', gateResult?.reasonCodes || ['gate_denied'], requestId);
      return;
    }

    res.json({ ok: true, sessionAllowed: true, safeMessage: gateResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SESSION_PREFLIGHT_FAILED', 'Failed to run session preflight.', ['internal_error'], requestId);
  }
});

// ── Create Monitoring Event ──

router.post('/pilot/expansion/execution/events', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { executionRunId, stageId, pilotProgramId, eventType, eventStatus, safeSummary, reasonCodes, metadataSafeJson, correlationId } = req.body;
    if (!executionRunId || !pilotProgramId || !eventType || !eventStatus || !safeSummary) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId, pilotProgramId, eventType, eventStatus, and safeSummary are required.', ['missing_required_fields'], requestId);
      return;
    }

    let eventRecord: any;
    try {
      eventRecord = await recordExpansionMonitoringEvent({
        executionRunId,
        stageId,
        pilotProgramId,
        schoolId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        eventType,
        eventStatus: eventStatus || 'completed',
        safeSummary,
        reasonCodes,
        metadataSafeJson,
        requestId,
        correlationId,
      });
    } catch {
      safeErrorEnvelope(res, 500, 'EVENT_CREATE_FAILED', 'Failed to record monitoring event.', ['event_record_failed'], requestId);
      return;
    }

    res.status(201).json({ ok: true, eventId: eventRecord.eventId, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVENT_CREATE_FAILED', 'Failed to create monitoring event.', ['internal_error'], requestId);
  }
});

// ── Health Snapshot ──

router.get('/pilot/expansion/execution/health', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const executionRunId = req.query.executionRunId as string;
    const pilotProgramId = req.query.pilotProgramId as string;
    if (!executionRunId || !pilotProgramId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId and pilotProgramId query params are required.', ['missing_required_fields'], requestId);
      return;
    }

    let snapshot: any;
    try {
      snapshot = await createHealthSnapshot({
        executionRunId,
        pilotProgramId,
        schoolId,
        activeExpandedSessions: 0,
        allowedExpandedSessionStarts: 0,
        blockedExpandedSessionStarts: 0,
        schoolAuthBlocks: 0,
        cohortScopeBlocks: 0,
        curriculumGateBlocks: 0,
        socraticGateBlocks: 0,
        deenGateBlocks: 0,
        privacyGateBlocks: 0,
        aiCallBlocks: 0,
        memoryAccessBlocks: 0,
        evidenceWriteBlocks: 0,
        feedbackCount: 0,
        oversightItemCount: 0,
        interventionCount: 0,
        incidentBridgeCount: 0,
        errorCount: 0,
        safeSummary: 'Health snapshot generated on demand.',
      });
    } catch {
      safeErrorEnvelope(res, 500, 'HEALTH_SNAPSHOT_FAILED', 'Failed to generate health snapshot.', ['health_snapshot_failed'], requestId);
      return;
    }

    try {
      await recordAuditEvent({
        executionRunId,
        schoolId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        action: 'health_snapshot_viewed',
        safeSummary: 'Health snapshot viewed.',
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.json({ ok: true, health: snapshot, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'HEALTH_SNAPSHOT_FAILED', 'Failed to get health snapshot.', ['internal_error'], requestId);
  }
});

// ── Oversight Queue ──

router.get('/pilot/expansion/execution/oversight', ...teacherAdminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    const items = executionRunId
      ? await task028ExpansionExecutionRepository.listOversightItems(executionRunId)
      : [];

    res.json({ ok: true, count: items.length, oversightItems: items, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'OVERSIGHT_FETCH_FAILED', 'Failed to fetch oversight queue.', ['internal_error'], requestId);
  }
});

// ── Request Intervention ──

router.post('/pilot/expansion/execution/interventions', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { executionRunId, interventionType, safeSummary } = req.body;
    if (!executionRunId || !interventionType || !safeSummary) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId, interventionType, and safeSummary are required.', ['missing_required_fields'], requestId);
      return;
    }

    let intervention: any;
    try {
      intervention = await requestIntervention(executionRunId, interventionType, getActorRole(req), getActorId(req), safeSummary, requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'INTERVENTION_REQUEST_FAILED', 'Intervention request service failed.', ['intervention_request_failed'], requestId);
      return;
    }

    if (!intervention || !intervention.ok) {
      safeErrorEnvelope(res, 400, 'INTERVENTION_REQUEST_FAILED', intervention?.safeMessage || 'Intervention request failed.', intervention?.reasonCodes || ['intervention_request_failed'], requestId);
      return;
    }

    res.status(201).json({ ok: true, interventionId: intervention.interventionId, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INTERVENTION_REQUEST_FAILED', 'Failed to request intervention.', ['internal_error'], requestId);
  }
});

// ── Complete Intervention ──

router.post('/pilot/expansion/execution/interventions/:interventionId/complete', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { interventionId } = req.params;
    const { safeSummary } = req.body;

    let result: any;
    try {
      result = await completeIntervention(interventionId, getActorRole(req), getActorId(req), safeSummary, undefined, undefined, undefined, requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'INTERVENTION_COMPLETE_FAILED', 'Intervention completion service failed.', ['intervention_complete_failed'], requestId);
      return;
    }

    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'INTERVENTION_COMPLETE_FAILED', result?.safeMessage || 'Intervention completion failed.', result?.reasonCodes || ['intervention_complete_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INTERVENTION_COMPLETE_FAILED', 'Failed to complete intervention.', ['internal_error'], requestId);
  }
});

// ── Execute Rollback ──

router.post('/pilot/expansion/execution/rollback', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { executionRunId, rollbackReason } = req.body;
    if (!executionRunId || !rollbackReason) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId and rollbackReason are required.', ['missing_required_fields'], requestId);
      return;
    }

    let rollbackResult: any;
    try {
      rollbackResult = await executeRollback(executionRunId, getActorRole(req), getActorId(req), rollbackReason, requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Rollback execution service failed.', ['rollback_failed'], requestId);
      return;
    }

    if (!rollbackResult || !rollbackResult.ok) {
      safeErrorEnvelope(res, 400, 'ROLLBACK_FAILED', rollbackResult?.safeMessage || 'Rollback failed.', rollbackResult?.reasonCodes || ['rollback_failed'], requestId);
      return;
    }

    res.json({ ok: true, rollbackId: rollbackResult.rollbackId, safeMessage: rollbackResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to execute rollback.', ['internal_error'], requestId);
  }
});

// ── Kill Switch: Enable ──

router.post('/pilot/expansion/execution/kill-switch/enable', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
      return;
    }

    let killResult: any;
    try {
      killResult = await enableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Kill switch enable service failed.', ['kill_switch_failed'], requestId);
      return;
    }

    if (!killResult || !killResult.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', killResult?.safeMessage || 'Kill switch enable failed.', killResult?.reasonCodes || ['kill_switch_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: killResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to enable kill switch.', ['internal_error'], requestId);
  }
});

// ── Kill Switch: Disable ──

router.post('/pilot/expansion/execution/kill-switch/disable', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
    if (!run) {
      safeErrorEnvelope(res, 404, 'RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
      return;
    }

    let killResult: any;
    try {
      killResult = await disableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    } catch {
      safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Kill switch disable service failed.', ['kill_switch_failed'], requestId);
      return;
    }

    if (!killResult || !killResult.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', killResult?.safeMessage || 'Kill switch disable failed.', killResult?.reasonCodes || ['kill_switch_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: killResult.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to disable kill switch.', ['internal_error'], requestId);
  }
});

// ── Generate Completion Review ──

router.post('/pilot/expansion/execution/completion-review/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    let review: any;
    try {
      review = await generateCompletionReview(executionRunId);
    } catch {
      safeErrorEnvelope(res, 500, 'COMPLETION_REVIEW_FAILED', 'Completion review generation service failed.', ['completion_review_failed'], requestId);
      return;
    }

    if (!review || !review.ok) {
      safeErrorEnvelope(res, 400, 'COMPLETION_REVIEW_FAILED', review?.safeMessage || 'Completion review generation failed.', review?.reasonCodes || ['completion_review_failed'], requestId);
      return;
    }

    try {
      await recordAuditEvent({
        executionRunId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        action: 'completion_review_generated',
        safeSummary: 'Completion review generated.',
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({ ok: true, completionReviewId: review.reviewId, safeToStartTask029: review.safeToStartTask029, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COMPLETION_REVIEW_FAILED', 'Failed to generate completion review.', ['internal_error'], requestId);
  }
});

// ── Get Report Info ──

router.get('/pilot/expansion/execution/reports/task-028', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const reports = await task028ExpansionExecutionRepository.listExecutionReports('028');
    const latestReport = reports.length > 0 ? reports[0] : null;

    res.json({
      ok: true,
      reportCount: reports.length,
      latestReport: latestReport
        ? { id: (latestReport as any).id, status: (latestReport as any).status, generatedAt: (latestReport as any).generatedAt }
        : null,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FETCH_FAILED', 'Failed to fetch report info.', ['internal_error'], requestId);
  }
});

// ── Generate Report ──

router.post('/pilot/expansion/execution/reports/task-028/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    let report: any;
    try {
      report = await generateExecutionReport(executionRunId);
    } catch {
      safeErrorEnvelope(res, 500, 'REPORT_GENERATION_FAILED', 'Report generation service failed.', ['report_generation_failed'], requestId);
      return;
    }

    if (!report || !report.ok) {
      safeErrorEnvelope(res, 400, 'REPORT_GENERATION_FAILED', report?.safeMessage || 'Report generation failed.', report?.reasonCodes || ['report_generation_failed'], requestId);
      return;
    }

    try {
      await recordAuditEvent({
        executionRunId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        action: 'task028_report_generated',
        safeSummary: 'Task 028 execution report generated.',
        requestId,
      });
    } catch {
      // non-blocking
    }

    res.status(201).json({ ok: true, reportId: report.reportId, safeToStartTask029: report.safeToStartTask029, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_GENERATION_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

export default router;
