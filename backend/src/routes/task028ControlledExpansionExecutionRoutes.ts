import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireVerifiedSchoolContext } from '../middleware/schoolContextGuardMiddleware';
import { requireRole } from '../lib/rbac';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';
import { verifyTask026Continuity } from '../services/task028Task026ContinuityService';
import { verifyGovernanceContinuity } from '../services/task028GovernanceContinuityService';
import { loadApprovedExpansionPlan } from '../services/task028ApprovedExpansionPlanService';
import { transitionExecutionState } from '../services/task028ExpansionExecutionStateMachine';
import {
  createRun, activateRun, pauseRun, resumeRun,
  markInterventionRequired, requestRollback, completeRollback,
  completeExpansion, cancelExpansion, blockExpansion,
} from '../services/task028ControlledExpansionRunService';
import { activateExpandedCohort } from '../services/task028StagedCohortActivationService';
import { evaluateExpandedLearnerAccess } from '../services/task028ExpandedLearnerAccessGateService';
import { checkExpandedSessionGate } from '../services/task028ExpandedRuntimeGuardService';
import { generateTeacherOversightSnapshot } from '../services/task028TeacherOversightBridgeService';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';
import { createHealthSnapshot } from '../services/task028ExpansionHealthSnapshotService';
import { bridgeIncident } from '../services/task028ExpansionIncidentBridgeService';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';
import { recordEvidenceEvent } from '../services/task028ExpansionEvidenceLedgerService';
import { generateDailySummary } from '../services/task028DailyExpansionSummaryService';
import { generateControlledExpansionCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import { generateDiagnostics } from '../services/task028ExecutionDiagnosticsService';
import { recordAuditEvent, listAuditEvents } from '../services/task028ExecutionAuditService';
import { generateControlledExpansionExecutionReport } from '../services/task028ExpansionExecutionReportService';
import {
  nowISO,
  TASK028_EXECUTION_STATUSES,
  TASK028_CONTROL_ROLES,
} from '../contracts/task028ControlledExpansionExecutionContracts';

const router = Router();

function getActorRole(req: Request): string {
  return (req as any).user?.role || 'unauthenticated';
}

function getActorId(req: Request): string {
  return (req as any).user?.id || 'unknown';
}

function getSchoolId(req: Request): string | undefined {
  return (req as any).schoolId || (req as any).verifiedSchoolIdentity?.schoolId;
}

function getRequestId(req: Request): string {
  return (req as any).requestId || 'unknown';
}

function safeDenied(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'CONTROLLED_EXPANSION_DENIED', safeMessage: 'This action is not available for this account, role, school, or execution state.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

function safeError(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

function isControlRole(role: string): boolean {
  return (TASK028_CONTROL_ROLES as readonly string[]).includes(role);
}

// ─── Health ───

router.get('/health', schoolAuthMiddleware, requireVerifiedSchoolContext, (_req: Request, res: Response) => {
  res.json({ ok: true, status: 'healthy', service: 'controlled-expansion-execution-runtime', timestamp: nowISO() });
});

// ─── Preflight ───

router.post('/preflight', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const proof = await loadTask027Proof();
    const continuityTask026 = await verifyTask026Continuity(getSchoolId(req) || '');
    const governanceContinuity = await verifyGovernanceContinuity(getSchoolId(req) || '');

    const preflightPassed = proof?.safeToExecuteExpansion === true
      && continuityTask026?.ok === true
      && governanceContinuity?.ok === true;

    res.json({
      ok: true,
      preflightPassed,
      task027Proof: proof?.proofSummary || {},
      task026Continuity: { ok: continuityTask026?.ok ?? false },
      governanceContinuity: governanceContinuity?.continuityStatuses ?? {},
      requestId,
    });
  } catch (err: unknown) {
    safeError(res, 500, 'PREFLIGHT_FAILED', 'Preflight check failed.', ['internal_error'], requestId);
  }
});

// ─── Runs ───

router.post('/runs', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) { safeError(res, 400, 'NO_SCHOOL', 'School context required.', ['no_school'], requestId); return; }

    const { proposalId, governanceDecisionId, pilotRunId, approvedPlan } = req.body;
    if (!proposalId || !governanceDecisionId || !pilotRunId || !approvedPlan) {
      safeError(res, 400, 'INVALID_INPUT', 'proposalId, governanceDecisionId, pilotRunId, and approvedPlan are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await createRun({
      schoolId, proposalId, governanceDecisionId, pilotRunId,
      approvedPlan, actorRole, actorId: getActorId(req),
    } as any);

    if (!result.ok) {
      safeError(res, 400, 'RUN_CREATE_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.status(201).json({ ok: true, runId: result.runId, status: result.status, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'RUN_CREATE_FAILED', 'Failed to create run.', ['internal_error'], requestId);
  }
});

router.get('/runs', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'teacher_assigned_to_expansion') { safeDenied(res, requestId); return; }

  try {
    const schoolId = getSchoolId(req);
    const runs = schoolId ? await task028ExpansionExecutionRepository.listExecutionRuns(schoolId) : [];
    const safeRuns = (runs as any[]).map(r => ({
      id: r.id, status: r.status, proposalId: r.expansionProposalId,
      createdAt: r.createdAt, safeSummary: r.safeSummary,
    }));
    res.json({ ok: true, count: safeRuns.length, runs: safeRuns, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'RUNS_LIST_FAILED', 'Failed to list runs.', ['internal_error'], requestId);
  }
});

router.get('/runs/:runId', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'teacher_assigned_to_expansion') { safeDenied(res, requestId); return; }

  try {
    const run = await task028ExpansionExecutionRepository.getExecutionRun(req.params.runId);
    if (!run) { safeError(res, 404, 'RUN_NOT_FOUND', 'Run not found.', ['not_found'], requestId); return; }
    const r = run as any;
    res.json({
      ok: true, run: {
        id: r.id, status: r.status, proposalId: r.expansionProposalId,
        createdAt: r.createdAt, safeSummary: r.safeSummary,
        blockingIssues: r.blockingIssues ?? [],
      }, requestId,
    });
  } catch (err: unknown) {
    safeError(res, 500, 'RUN_GET_FAILED', 'Failed to get run.', ['internal_error'], requestId);
  }
});

// ─── Run Actions ───

async function runAction(req: Request, res: Response, action: string, actionFn: Function): Promise<void> {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  const { runId } = req.body;
  if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

  try {
    const result = await actionFn(runId, actorRole, getActorId(req), requestId);
    if (!result.ok) {
      safeError(res, 400, `${action.toUpperCase()}_FAILED`, result.safeMessage, result.reasonCodes, requestId);
      return;
    }
    res.json({ ok: true, action, status: result.status || result.newStatus, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeError(res, 500, `${action.toUpperCase()}_FAILED`, `Failed to ${action}.`, ['internal_error'], requestId);
  }
}

router.post('/runs/:runId/activate', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'activate', activateRun));
router.post('/runs/:runId/pause', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'pause', pauseRun));
router.post('/runs/:runId/resume', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'resume', resumeRun));
router.post('/runs/:runId/intervention-required', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'intervention-required', markInterventionRequired));
router.post('/runs/:runId/rollback', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'rollback', requestRollback));
router.post('/runs/:runId/cancel', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'cancel', cancelExpansion));
router.post('/runs/:runId/complete', schoolAuthMiddleware, requireVerifiedSchoolContext, (req, res) => runAction(req, res, 'complete', completeExpansion));

// ─── Expanded Cohort ───

router.post('/expanded-cohort/activate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) { safeError(res, 400, 'NO_SCHOOL', 'School context required.', ['no_school'], requestId); return; }

    const { runId, cohortIds, learnerSafeRefs, teacherSafeRefs, curriculumScopeIds } = req.body;
    if (!runId || !cohortIds) {
      safeError(res, 400, 'INVALID_INPUT', 'runId and cohortIds are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await activateExpandedCohort({
      executionRunId: runId,
      pilotProgramId: req.body.pilotProgramId || '',
      schoolId,
      stageNumber: 1,
      plannedStudentCount: (learnerSafeRefs || []).length,
      plannedTeacherCount: (teacherSafeRefs || []).length,
      allowedClassIds: cohortIds,
      allowedCurriculumScopes: curriculumScopeIds || [],
      expansionProposalId: req.body.proposalId || '',
      actorRole,
      actorIdHash: getActorId(req),
      requestId,
    } as any);

    if (!result.ok) {
      safeError(res, 400, 'COHORT_ACTIVATE_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.status(201).json({ ok: true, stageId: result.stageId, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'COHORT_ACTIVATE_FAILED', 'Failed to activate cohort.', ['internal_error'], requestId);
  }
});

// ─── Learner Access ───

router.post('/expanded-learner-access/evaluate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId, learnerId, curriculumScopeId, requestType } = req.body;
    if (!runId || !learnerId || !requestType) {
      safeError(res, 400, 'INVALID_INPUT', 'runId, learnerId, and requestType are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await evaluateExpandedLearnerAccess({
      schoolId: getSchoolId(req) || '',
      learnerId, runId, curriculumScopeId, requestType,
    });

    res.json({
      ok: result.allowed,
      allowed: result.allowed,
      status: result.status,
      safeMessage: result.safeMessage,
      requestId,
    });
  } catch (err: unknown) {
    safeError(res, 500, 'ACCESS_EVALUATE_FAILED', 'Failed to evaluate access.', ['internal_error'], requestId);
  }
});

// ─── Runtime Guard ───

router.post('/runtime-guard/evaluate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { runId, action } = req.body;
    if (!runId || !action) {
      safeError(res, 400, 'INVALID_INPUT', 'runId and action are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await checkExpandedSessionGate({
      schoolId: getSchoolId(req) || '',
      executionRunId: runId,
      actorIdHash: getActorId(req),
      role: getActorRole(req),
    } as any);

    res.json({
      ok: result?.allowed === true,
      allowed: result?.allowed === true,
      safeMessage: result?.safeMessage || 'Runtime gate check failed.',
      reasonCodes: result?.reasonCodes || [],
      requestId,
    });
  } catch (err: unknown) {
    safeError(res, 500, 'GUARD_EVALUATE_FAILED', 'Failed to evaluate guard.', ['internal_error'], requestId);
  }
});

// ─── Teacher Oversight ───

router.post('/teacher-oversight/snapshot', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'teacher_assigned_to_expansion') { safeDenied(res, requestId); return; }

  try {
    const { runId, teacherId } = req.body;
    if (!runId || !teacherId) {
      safeError(res, 400, 'INVALID_INPUT', 'runId and teacherId are required.', ['missing_fields'], requestId);
      return;
    }

    const snapshot = await generateTeacherOversightSnapshot({ runId, schoolId: getSchoolId(req) || '', teacherId });
    res.json({ ok: true, snapshot, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'OVERSIGHT_FAILED', 'Failed to generate oversight snapshot.', ['internal_error'], requestId);
  }
});

// ─── Monitoring Events ───

router.post('/monitoring-events/record', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const { runId, eventType, safeSummary, metadataSafeJson } = req.body;
    if (!runId || !eventType || !safeSummary) {
      safeError(res, 400, 'INVALID_INPUT', 'runId, eventType, and safeSummary are required.', ['missing_fields'], requestId);
      return;
    }

    const event = await recordExpansionMonitoringEvent({
      executionRunId: runId,
      pilotProgramId: req.body.pilotProgramId || '',
      schoolId: getSchoolId(req) || '',
      actorRole,
      actorIdHash: getActorId(req),
      eventType, eventStatus: 'completed',
      safeSummary, metadataSafeJson, requestId,
    } as any);

    res.status(201).json({ ok: true, eventId: (event as any)?.eventId || (event as any)?.id, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'EVENT_RECORD_FAILED', 'Failed to record event.', ['internal_error'], requestId);
  }
});

// ─── Health Snapshot ───

router.post('/health-snapshot/generate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const { runId } = req.body;
    if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

    const snapshot = await createHealthSnapshot({
      executionRunId: runId,
      pilotProgramId: req.body.pilotProgramId || '',
      schoolId: getSchoolId(req) || '',
      activeExpandedSessions: 0, allowedExpandedSessionStarts: 0,
      blockedExpandedSessionStarts: 0, schoolAuthBlocks: 0,
      cohortScopeBlocks: 0, curriculumGateBlocks: 0,
      socraticGateBlocks: 0, deenGateBlocks: 0, privacyGateBlocks: 0,
      aiCallBlocks: 0, memoryAccessBlocks: 0, evidenceWriteBlocks: 0,
      feedbackCount: 0, oversightItemCount: 0, interventionCount: 0,
      incidentBridgeCount: 0, errorCount: 0,
      safeSummary: 'Health snapshot generated.',
    } as any);

    res.json({ ok: true, health: snapshot, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'HEALTH_FAILED', 'Failed to generate health snapshot.', ['internal_error'], requestId);
  }
});

// ─── Interventions ───

router.post('/interventions', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'safeguarding_reviewer') { safeDenied(res, requestId); return; }

  try {
    const { runId, interventionReason, safeSummary } = req.body;
    if (!runId || !interventionReason || !safeSummary) {
      safeError(res, 400, 'INVALID_INPUT', 'runId, interventionReason, and safeSummary are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await task028ExpansionExecutionRepository.createInterventionRecord({
      executionRunId: runId,
      stageId: req.body.stageId,
      pilotProgramId: req.body.pilotProgramId || '',
      schoolId: getSchoolId(req) || '',
      interventionType: interventionReason,
      status: 'open',
      actorRole,
      actorIdHash: getActorId(req),
      safeSummary,
      reasonCodes: [],
      metadataSafeJson: {},
    });

    res.status(201).json({ ok: true, interventionId: (result as any).id, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'INTERVENTION_FAILED', 'Failed to add intervention.', ['internal_error'], requestId);
  }
});

router.get('/interventions', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'safeguarding_reviewer' && actorRole !== 'teacher_assigned_to_expansion') {
    safeDenied(res, requestId); return;
  }

  try {
    const runId = req.query.runId as string;
    const items = runId
      ? await task028ExpansionExecutionRepository.listInterventionRecords(runId)
      : [];
    const safeItems = (items as any[]).map(i => ({
      id: i.id, interventionReason: i.interventionType, status: i.status,
      safeSummary: i.safeSummary, createdAt: i.createdAt,
    }));
    res.json({ ok: true, count: safeItems.length, interventions: safeItems, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'INTERVENTIONS_LIST_FAILED', 'Failed to list interventions.', ['internal_error'], requestId);
  }
});

// ─── Incidents ───

router.post('/incidents/bridge', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole) && actorRole !== 'operations_reviewer' && actorRole !== 'safeguarding_reviewer') {
    safeDenied(res, requestId); return;
  }

  try {
    const { runId, severity, safeSummary, metadataSafeJson } = req.body;
    if (!runId || !severity || !safeSummary) {
      safeError(res, 400, 'INVALID_INPUT', 'runId, severity, and safeSummary are required.', ['missing_fields'], requestId);
      return;
    }

    const result = await bridgeIncident({ runId, schoolId: getSchoolId(req) || '', severity, safeSummary, metadataSafeJson });
    res.status(201).json({ ok: result.ok, incidentId: result.incidentId, recommendedAction: result.recommendedAction, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'INCIDENT_BRIDGE_FAILED', 'Failed to bridge incident.', ['internal_error'], requestId);
  }
});

// ─── Evidence ───

router.post('/evidence/record', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const { runId, eventType, safeMetadata } = req.body;
    if (!runId || !eventType) {
      safeError(res, 400, 'INVALID_INPUT', 'runId and eventType are required.', ['missing_fields'], requestId);
      return;
    }

    const event = await task028ExpansionExecutionRepository.createRuntimeEvent({
      executionRunId: runId,
      pilotProgramId: req.body.pilotProgramId || '',
      schoolId: getSchoolId(req) || '',
      actorRole,
      actorIdHash: getActorId(req),
      eventType,
      eventStatus: 'recorded',
      safeSummary: eventType,
      reasonCodes: [],
      metadataSafeJson: safeMetadata || {},
      requestId,
    });

    res.status(201).json({ ok: true, eventId: (event as any).id, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'EVIDENCE_FAILED', 'Failed to record evidence.', ['internal_error'], requestId);
  }
});

// ─── Daily Summary ───

router.post('/daily-summary/generate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const { runId } = req.body;
    if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

    const summary = await generateDailySummary({ runId, schoolId: getSchoolId(req) || '' } as any);
    res.json({ ok: true, summary, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'SUMMARY_FAILED', 'Failed to generate daily summary.', ['internal_error'], requestId);
  }
});

// ─── Completion Review ───

router.post('/completion-review/generate', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const { runId } = req.body;
    if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

    const review = await generateControlledExpansionCompletionReview(runId, getSchoolId(req) || '');
    res.status(201).json({
      ok: true,
      completionReviewId: runId,
      safeToStartTask029: review?.safeToStartTask029 === true,
      requestId,
    });
  } catch (err: unknown) {
    safeError(res, 500, 'REVIEW_FAILED', 'Failed to generate completion review.', ['internal_error'], requestId);
  }
});

// ─── Diagnostics ───

router.get('/diagnostics', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const runId = req.query.runId as string;
    const schoolId = getSchoolId(req) || '';
    if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

    const diagnostics = await generateDiagnostics(runId, schoolId);
    res.json({ ok: true, diagnostics, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to get diagnostics.', ['internal_error'], requestId);
  }
});

// ─── Audit ───

router.get('/audit', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const runId = req.query.runId as string;
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const events = await listAuditEvents(runId, limit);
    const safeEvents = (events as any[]).map(e => ({
      id: e.id, action: e.action, role: e.actorRole,
      safeSummary: e.safeSummary, createdAt: e.createdAt,
    }));
    res.json({ ok: true, count: safeEvents.length, events: safeEvents, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'AUDIT_FAILED', 'Failed to get audit events.', ['internal_error'], requestId);
  }
});

// ─── Report ───

router.get('/report', schoolAuthMiddleware, requireVerifiedSchoolContext, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  const actorRole = getActorRole(req);
  if (!isControlRole(actorRole)) { safeDenied(res, requestId); return; }

  try {
    const runId = req.query.runId as string;
    const schoolId = getSchoolId(req) || '';
    if (!runId) { safeError(res, 400, 'INVALID_INPUT', 'runId is required.', ['missing_runId'], requestId); return; }

    const report = await generateControlledExpansionExecutionReport(runId, schoolId);
    res.json({ ok: true, report, requestId });
  } catch (err: unknown) {
    safeError(res, 500, 'REPORT_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

export default router;
