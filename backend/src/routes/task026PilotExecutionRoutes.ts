import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { checkPilotRuntimeAccess } from '../services/task026PilotRuntimeGuardService';
import { recordPilotEvent } from '../services/task026PilotExecutionEventService';
import { submitPilotFeedback } from '../services/task026PilotFeedbackService';
import { createSafetySignal, listSafetySignals } from '../services/task026PilotSafetySignalService';
import { createPilotIncident } from '../services/task026PilotIncidentBridgeService';
import { recordMetricSnapshot, getLatestMetrics } from '../services/task026PilotMetricService';
import { startPilotExecution, pausePilotExecution, resumePilotExecution, requestPilotRollback, completePilotExecution, enableKillSwitch, disableKillSwitch } from '../services/task026PilotExecutionControlService';
import { generatePostPilotReview } from '../services/task026PostPilotReviewService';

const router = Router();

const adminGuard = [schoolAuthMiddleware, requireRole('admin')];
const internalGuard = [schoolAuthMiddleware, requireRole('admin', 'counselor')];

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
    error: { code: 'PILOT_EXECUTION_ACCESS_DENIED', safeMessage: 'You do not have permission to access this resource.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

// ── Pilot Execution Status ──

router.get('/pilot/execution/status', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (executionRunId) {
      const run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
      if (!run) {
        safeErrorEnvelope(res, 404, 'EXECUTION_RUN_NOT_FOUND', 'Execution run not found.', ['not_found'], requestId);
        return;
      }
      res.json({ ok: true, executionRun: run, requestId });
    } else {
      const pilotProgramId = req.query.pilotProgramId as string;
      if (pilotProgramId) {
        const runs = await task026PilotExecutionRepository.listExecutionRuns(pilotProgramId);
        res.json({ ok: true, count: runs.length, executionRuns: runs, requestId });
      } else {
        safeErrorEnvelope(res, 400, 'MISSING_QUERY_PARAM', 'Provide executionRunId or pilotProgramId.', ['missing_query_param'], requestId);
      }
    }
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STATUS_FAILED', 'Failed to get execution status.', ['internal_error'], requestId);
  }
});

// ── Start Pilot Execution ──

router.post('/pilot/execution/start', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { pilotProgramId, schoolId, allowedCohortIds } = req.body;
    if (!pilotProgramId || !schoolId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'pilotProgramId and schoolId are required.', ['missing_required_fields'], requestId);
      return;
    }

    const result = await startPilotExecution({
      pilotProgramId,
      schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      allowedCohortIds,
      requestId,
    });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'EXECUTION_START_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.status(201).json({ ok: true, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'START_FAILED', 'Failed to start pilot execution.', ['internal_error'], requestId);
  }
});

// ── Pause, Resume, Rollback, Kill Switch ──

router.post('/pilot/execution/pause', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await pausePilotExecution(executionRunId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.ok, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_FAILED', 'Failed to pause execution.', ['internal_error'], requestId);
  }
});

router.post('/pilot/execution/resume', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await resumePilotExecution(executionRunId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.ok, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RESUME_FAILED', 'Failed to resume execution.', ['internal_error'], requestId);
  }
});

router.post('/pilot/execution/rollback', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await requestPilotRollback(executionRunId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.ok, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to rollback execution.', ['internal_error'], requestId);
  }
});

router.post('/pilot/execution/kill-switch/enable', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await enableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.ok, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_ENABLE_FAILED', 'Failed to enable kill switch.', ['internal_error'], requestId);
  }
});

router.post('/pilot/execution/kill-switch/disable', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await disableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.ok, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_DISABLE_FAILED', 'Failed to disable kill switch.', ['internal_error'], requestId);
  }
});

// ── Session Preflight ──

router.post('/pilot/execution/session/preflight', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { pilotProgramId, executionRunId, subject, curriculumTrack, cohortId } = req.body;
    const schoolId = getSchoolId(req);

    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const result = await checkPilotRuntimeAccess({
      schoolId,
      actorIdHash: getActorId(req),
      role: getActorRole(req),
      pilotProgramId: pilotProgramId ?? '',
      executionRunId,
      cohortId,
      subject,
      curriculumTrack,
    });

    if (result.allowed) {
      await recordPilotEvent({
        executionRunId: result.gateSnapshot.executionRunId as string || executionRunId || '',
        pilotProgramId: pilotProgramId ?? '',
        schoolId,
        actorRole: getActorRole(req),
        actorIdHash: getActorId(req),
        eventType: 'pilot_session_start_allowed',
        eventStatus: 'completed',
        safeSummary: 'Session preflight passed.',
        metadataSafeJson: { reasonCodes: result.reasonCodes },
        requestId,
      });
    }

    res.json({ ok: result.allowed, preflight: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PREFLIGHT_FAILED', 'Preflight check failed.', ['internal_error'], requestId);
  }
});

// ── Events ──

router.post('/pilot/execution/events', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await recordPilotEvent({ ...req.body, requestId, actorRole: getActorRole(req), actorIdHash: getActorId(req) });
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'EVENT_RECORD_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }
    res.status(201).json({ ok: true, eventId: result.eventId, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVENT_FAILED', 'Failed to record event.', ['internal_error'], requestId);
  }
});

// ── Feedback (student-accessible) ──

router.post('/pilot/execution/feedback', schoolAuthMiddleware, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const feedbackData = { ...req.body, schoolId, actorRole: getActorRole(req), actorIdHash: getActorId(req) };
    const result = await submitPilotFeedback(feedbackData);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'FEEDBACK_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }
    res.status(201).json({ ok: true, feedbackId: result.feedbackId, redactionStatus: result.redactionStatus, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'FEEDBACK_FAILED', 'Failed to submit feedback.', ['internal_error'], requestId);
  }
});

// ── Metrics (admin only) ──

router.get('/pilot/execution/metrics', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'MISSING_QUERY_PARAM', 'executionRunId required.', ['missing_query_param'], requestId);
      return;
    }
    const metrics = await getLatestMetrics(executionRunId);
    res.json({ ok: true, metrics, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'METRICS_FAILED', 'Failed to get metrics.', ['internal_error'], requestId);
  }
});

// ── Safety Signals (admin only) ──

router.get('/pilot/execution/safety-signals', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'MISSING_QUERY_PARAM', 'executionRunId required.', ['missing_query_param'], requestId);
      return;
    }
    const signals = await listSafetySignals(executionRunId);
    res.json({ ok: true, count: signals.length, safetySignals: signals, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'SIGNALS_FAILED', 'Failed to list safety signals.', ['internal_error'], requestId);
  }
});

// ── Post-Pilot Review ──

router.post('/pilot/execution/post-review/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId required.', ['missing_required_fields'], requestId);
      return;
    }
    const result = await generatePostPilotReview(executionRunId);
    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'REVIEW_GENERATION_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }
    res.status(201).json({ ok: true, reviewId: result.reviewId, safeToStartTask027: result.safeToStartTask027, recommendedDecision: result.recommendedDecision, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REVIEW_FAILED', 'Failed to generate post-pilot review.', ['internal_error'], requestId);
  }
});

// ── Reports ──

router.get('/pilot/execution/reports/task-026', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    res.json({ ok: true, message: 'Generate report via verify-task026.ps1 or gen-task026-report.cjs', requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FETCH_FAILED', 'Failed to fetch report.', ['internal_error'], requestId);
  }
});

export default router;
