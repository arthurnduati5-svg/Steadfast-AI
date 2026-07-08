import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole } from '../lib/rbac';
import { loadTask028ProofForTask029, verifyTask028DependencyFromGit } from '../services/task029Task028ProofLoaderService';
import { getOperationsDashboard as getAggregatorDashboard, getStudentOwnStatusView } from '../services/task029ExpansionOperationsAggregatorService';
import {
  pauseExpansion,
  resumeExpansion,
  enableKillSwitch,
  disableKillSwitch,
} from '../services/task028ExpansionInterventionService';
import { executeRollback } from '../services/task028ExpansionRollbackExecutionService';
import { generateCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import { recordAuditEvent } from '../services/task028ExpansionExecutionAuditService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { resolveExpansionOpsRole, getRolePermissionsList } from '../contracts/task029ExpansionOperationsContracts';
import { resolveOperationsPermissions } from '../services/task029OperationsPermissionService';
import { getOperationsDashboard } from '../services/task029ExpansionOperationsDashboardService';
import { getExpansionRunStatus } from '../services/task029ExpansionRunStatusPanelService';
import { getCohortOperationsSummary } from '../services/task029CohortOperationsSummaryService';
import { getStageOperationsSummary } from '../services/task029StageOperationsSummaryService';
import { getHealthOperationsSummary } from '../services/task029HealthOperationsSummaryService';
import { getTeacherOversightOperations } from '../services/task029TeacherOversightOperationsService';
import { getLearnerOwnStatus } from '../services/task029LearnerOwnStatusService';
import { getInterventionQueueOperations } from '../services/task029InterventionQueueOperationsService';
import { getIncidentOperations } from '../services/task029IncidentOperationsService';
import { runControlActionPreflight } from '../services/task029ControlActionPreflightService';
import { executeControlAction } from '../services/task029ControlActionService';
import { executeRollbackCommand } from '../services/task029RollbackCommandService';
import { getSafeAuditTimeline } from '../services/task029SafeAuditTimelineService';
import { getEvidenceSummary } from '../services/task029EvidenceSummaryService';
import { getCompletionReviewSummary } from '../services/task029CompletionReviewSummaryService';
import { getOperationsDiagnostics } from '../services/task029OperationsDiagnosticsService';
import { generateTask029Report } from '../services/task029ExpansionOperationsReportService';

const router = Router();

const adminGuard = [schoolAuthMiddleware, requireRole('admin')];
const teacherAdminGuard = [schoolAuthMiddleware, requireRole('admin')];
const studentGuard = [schoolAuthMiddleware, requireRole('student')];

const dashboardReadGuard = [schoolAuthMiddleware, requireRole('admin')];
const teacherOversightGuard = [schoolAuthMiddleware, requireRole('admin')];
const interventionIncidentGuard = [schoolAuthMiddleware, requireRole('admin')];
const controlGuard = [schoolAuthMiddleware, requireRole('admin')];
const learnerGuard = [schoolAuthMiddleware, requireRole('student')];
const diagnosticsReportGuard = [schoolAuthMiddleware, requireRole('admin')];

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

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({ ok: false, error: { code, safeMessage, reasonCodes }, requestId });
}

function safeDeniedResponse(res: Response, requestId: string): void {
  res.status(403).json({
    ok: false,
    error: { code: 'EXPANSION_OPS_ACCESS_DENIED', safeMessage: 'This expansion operations action is not available for this account, role, school, or execution state.', reasonCodes: ['access_denied'] },
    requestId,
  });
}

// ── Dashboard ──

router.get('/pilot/expansion/operations/dashboard', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const executionRunId = req.query.executionRunId as string;
    const result = await getAggregatorDashboard(getActorRole(req), executionRunId);

    if (!result.ok && !result.data) {
      safeErrorEnvelope(res, 500, 'DASHBOARD_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    res.json({
      ok: true,
      dashboard: result.data,
      blockingIssues: result.blockingIssues,
      safeMessage: result.safeMessage,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DASHBOARD_FAILED', 'Failed to load expansion operations dashboard.', ['internal_error'], requestId);
  }
});

// ── Status ──

router.get('/pilot/expansion/operations/status', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const proof = await loadTask028ProofForTask029();
    const executionRunId = req.query.executionRunId as string;
    let executionStatus = null;

    if (executionRunId) {
      const run = await task028ExpansionExecutionRepository.getExecutionRun(executionRunId);
      if (run) {
        const r = run as any;
        executionStatus = {
          runId: r.id,
          status: r.status,
          currentStage: r.currentStage,
          killSwitchEnabled: r.killSwitchEnabled || false,
          startedAt: r.startedAt,
          safeSummary: r.safeSummary,
        };
      }
    }

    res.json({
      ok: true,
      task028Proof: proof.proofStatus,
      executionStatus,
      blockingIssues: proof.blockingIssues,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STATUS_FAILED', 'Failed to load expansion operations status.', ['internal_error'], requestId);
  }
});

// ── Stages ──

router.get('/pilot/expansion/operations/stages', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId query param is required.', ['missing_required_fields'], requestId);
      return;
    }

    const stages = await task028ExpansionExecutionRepository.listStagesByRun(executionRunId);
    const stageSafe = (stages as any[]).map((s: any) => ({
      stageNumber: s.stageNumber,
      status: s.status,
      plannedStudentCount: s.plannedStudentCount ?? 0,
      activatedStudentCount: s.activatedStudentCount ?? 0,
      plannedTeacherCount: s.plannedTeacherCount ?? 0,
      activatedTeacherCount: s.activatedTeacherCount ?? 0,
      allowedClassCount: Array.isArray(s.allowedClassIds) ? s.allowedClassIds.length : 0,
      allowedSubjectCount: Array.isArray(s.allowedSubjectIds) ? s.allowedSubjectIds.length : 0,
      allowedCurriculumScopeCount: Array.isArray(s.allowedCurriculumScopes) ? s.allowedCurriculumScopes.length : 0,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      safeSummary: s.safeSummary || '',
    }));

    res.json({ ok: true, count: stageSafe.length, stages: stageSafe, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAGES_FAILED', 'Failed to load stages.', ['internal_error'], requestId);
  }
});

// ── Health ──

router.get('/pilot/expansion/operations/health', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId query param is required.', ['missing_required_fields'], requestId);
      return;
    }

    const snapshots = await task028ExpansionExecutionRepository.listHealthSnapshots(executionRunId);
    const latest = snapshots.length > 0 ? (snapshots[0] as any) : null;

    res.json({
      ok: true,
      health: latest
        ? {
            healthClassification: latest.healthClassification,
            activeExpandedSessions: latest.activeExpandedSessions,
            blockedSessionStarts: latest.blockedExpandedSessionStarts,
            errorCount: latest.errorCount,
            safeSummary: latest.safeSummary,
          }
        : null,
      safeExplanation: 'These are aggregate operational signals. They do not expose raw student messages, private memory, prompts, provider responses, answer keys, or sensitive reports.',
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'HEALTH_FAILED', 'Failed to load health data.', ['internal_error'], requestId);
  }
});

// ── Events ──

router.get('/pilot/expansion/operations/events', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId query param is required.', ['missing_required_fields'], requestId);
      return;
    }

    const audits = await task028ExpansionExecutionRepository.listAuditRecords(executionRunId);
    const events = (audits as any[]).slice(0, 100).map((a: any) => ({
      eventId: a.id || a.auditId,
      eventType: a.action,
      status: 'recorded',
      safeSummary: a.safeSummary || '',
      createdAt: a.createdAt || a.timestamp,
      actorRoleCategory: a.actorRole,
    }));

    res.json({ ok: true, count: events.length, events, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVENTS_FAILED', 'Failed to load monitoring events.', ['internal_error'], requestId);
  }
});

// ── Oversight ──

router.get('/pilot/expansion/operations/oversight', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId query param is required.', ['missing_required_fields'], requestId);
      return;
    }

    const items = await task028ExpansionExecutionRepository.listOversightItems(executionRunId);
    const safeItems = (items as any[]).map((o: any) => ({
      itemId: o.id || o.itemId,
      itemType: o.itemType,
      severity: o.severity,
      status: o.status,
      safeSummary: o.safeSummary,
      assignedRole: o.assignedRole || '',
      requiresPause: !!o.requiresPause,
      requiresRollback: !!o.requiresRollback,
      createdAt: o.createdAt,
    }));

    res.json({ ok: true, count: safeItems.length, oversightItems: safeItems, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'OVERSIGHT_FAILED', 'Failed to load oversight queue.', ['internal_error'], requestId);
  }
});

// ── Oversight: Acknowledge ──

router.post('/pilot/expansion/operations/oversight/:itemId/acknowledge', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { itemId } = req.params;
    if (!itemId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'itemId is required.', ['missing_required_fields'], requestId);
      return;
    }

    safeErrorEnvelope(res, 501, 'NOT_IMPLEMENTED', 'Oversight item acknowledge is not yet implemented in the repository layer.', ['not_implemented'], requestId);
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'OVERSIGHT_ACK_FAILED', 'Failed to acknowledge oversight item.', ['internal_error'], requestId);
  }
});

// ── Pause ──

router.post('/pilot/expansion/operations/pause', ...adminGuard, async (req: Request, res: Response) => {
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

    const result = await pauseExpansion(executionRunId, getActorRole(req), getActorId(req), requestId);
    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'PAUSE_FAILED', result?.safeMessage || 'Pause failed.', result?.reasonCodes || ['pause_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_FAILED', 'Failed to pause expansion.', ['internal_error'], requestId);
  }
});

// ── Resume ──

router.post('/pilot/expansion/operations/resume', ...adminGuard, async (req: Request, res: Response) => {
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

    const result = await resumeExpansion(executionRunId, getActorRole(req), getActorId(req), requestId);
    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'RESUME_FAILED', result?.safeMessage || 'Resume failed.', result?.reasonCodes || ['resume_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RESUME_FAILED', 'Failed to resume expansion.', ['internal_error'], requestId);
  }
});

// ── Kill Switch: Enable ──

router.post('/pilot/expansion/operations/kill-switch/enable', ...adminGuard, async (req: Request, res: Response) => {
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

    const result = await enableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', result?.safeMessage || 'Kill switch enable failed.', result?.reasonCodes || ['kill_switch_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to enable kill switch.', ['internal_error'], requestId);
  }
});

// ── Kill Switch: Disable ──

router.post('/pilot/expansion/operations/kill-switch/disable', ...adminGuard, async (req: Request, res: Response) => {
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

    const result = await disableKillSwitch(executionRunId, getActorRole(req), getActorId(req), requestId);
    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', result?.safeMessage || 'Kill switch disable failed.', result?.reasonCodes || ['kill_switch_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to disable kill switch.', ['internal_error'], requestId);
  }
});

// ── Rollback ──

router.post('/pilot/expansion/operations/rollback', ...adminGuard, async (req: Request, res: Response) => {
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

    const result = await executeRollback(executionRunId, getActorRole(req), getActorId(req), rollbackReason, requestId);
    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'ROLLBACK_FAILED', result?.safeMessage || 'Rollback failed.', result?.reasonCodes || ['rollback_failed'], requestId);
      return;
    }

    res.json({ ok: true, rollbackId: result.rollbackId, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to execute rollback.', ['internal_error'], requestId);
  }
});

// ── Completion Review: Generate ──

router.post('/pilot/expansion/operations/completion-review/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    const review = await generateCompletionReview(executionRunId);
    if (!review || !review.ok) {
      safeErrorEnvelope(res, 400, 'COMPLETION_REVIEW_FAILED', review?.safeMessage || 'Completion review generation failed.', ['completion_review_failed'], requestId);
      return;
    }

    res.status(201).json({ ok: true, completionReviewId: review.reviewId, safeToStartTask029: review.safeToStartTask029, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COMPLETION_REVIEW_FAILED', 'Failed to generate completion review.', ['internal_error'], requestId);
  }
});

// ── Completion Review: Get ──

router.get('/pilot/expansion/operations/completion-review', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const executionRunId = req.query.executionRunId as string;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId query param is required.', ['missing_required_fields'], requestId);
      return;
    }

    const review = await task028ExpansionExecutionRepository.getCompletionReviewByRun(executionRunId);
    if (!review) {
      safeErrorEnvelope(res, 404, 'COMPLETION_REVIEW_NOT_FOUND', 'Completion review not yet generated.', ['not_found'], requestId);
      return;
    }

    res.json({ ok: true, completionReview: review, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COMPLETION_REVIEW_FAILED', 'Failed to get completion review.', ['internal_error'], requestId);
  }
});

// ── Student Own Status ──

router.get('/pilot/expansion/operations/student/own-status', ...studentGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const actorIdHash = getActorId(req);
    const executionRunId = req.query.executionRunId as string;

    const result = await getStudentOwnStatusView(actorIdHash, executionRunId);
    res.json({ ok: true, status: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STUDENT_STATUS_FAILED', 'Failed to get student expansion status.', ['internal_error'], requestId);
  }
});

// ── Report: Get ──

router.get('/pilot/expansion/operations/report/task-029', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const reports = await task028ExpansionExecutionRepository.listExecutionReports('029');
    const latest = reports.length > 0 ? reports[0] : null;

    res.json({
      ok: true,
      reportCount: reports.length,
      latestReport: latest
        ? { id: (latest as any).id, status: (latest as any).status, generatedAt: (latest as any).generatedAt }
        : null,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FAILED', 'Failed to get Task 029 report info.', ['internal_error'], requestId);
  }
});

// ── Report: Generate ──

router.post('/pilot/expansion/operations/report/task-029/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { executionRunId } = req.body;
    if (!executionRunId) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'executionRunId is required.', ['missing_required_fields'], requestId);
      return;
    }

    safeErrorEnvelope(res, 501, 'NOT_IMPLEMENTED', 'Task 029 report generation via API is delegated to the scripts/gen-task029-report.cjs script. Use the script instead.', ['delegated_to_script'], requestId);
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_GENERATE_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// New Task 029 Expansion Operations Routes
// Prefix: /api/task029/expansion-operations (wired in index.ts)
// ═══════════════════════════════════════════════════════════════════════════

// ── Health ──

router.get('/task029/expansion-operations/health', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const proof = await loadTask028ProofForTask029();
    res.json({ ok: true, healthy: proof.ok, task028ProofStatus: proof.proofStatus.safeToStartTask029, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'HEALTH_FAILED', 'Health check failed.', ['internal_error'], requestId);
  }
});

// ── Dependency: Task 028 Check ──

router.post('/task029/expansion-operations/dependency/task028/check', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await verifyTask028DependencyFromGit();
    res.json({ ok: result.ok, dependencyCheck: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DEPENDENCY_CHECK_FAILED', 'Task 028 dependency check failed.', ['internal_error'], requestId);
  }
});

// ── Permissions ──

router.get('/task029/expansion-operations/permissions', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const result = await resolveOperationsPermissions({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });
    res.json({ ok: result.ok, role: result.role, permissions: result.permissions, blockingIssues: result.blockingIssues, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PERMISSIONS_FAILED', 'Failed to resolve operations permissions.', ['internal_error'], requestId);
  }
});

// ── Dashboard ──

router.get('/task029/expansion-operations/dashboard', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const expansionRunId = req.query.executionRunId as string | undefined;
    const result = await getOperationsDashboard({
      schoolId,
      actorId: getActorId(req),
      actorRole: getActorRole(req),
      expansionRunId,
    });

    if (!result.ok && !result.data) {
      safeErrorEnvelope(res, 500, 'DASHBOARD_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, dashboard: result.data, blockingIssues: result.blockingIssues, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DASHBOARD_FAILED', 'Failed to load expansion operations dashboard.', ['internal_error'], requestId);
  }
});

// ── Run: Status ──

router.get('/task029/expansion-operations/runs/:runId/status', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getExpansionRunStatus(runId, schoolId);

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'RUN_STATUS_FAILED', result.blockingIssues.includes('cross_school_access_denied') ? 'Cross-school access denied.' : 'Run not found or status unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, status: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RUN_STATUS_FAILED', 'Failed to get run status.', ['internal_error'], requestId);
  }
});

// ── Run: Cohort Summary ──

router.get('/task029/expansion-operations/runs/:runId/cohort-summary', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getCohortOperationsSummary(runId, schoolId);

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'COHORT_SUMMARY_FAILED', 'Cohort summary unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, cohortSummary: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_SUMMARY_FAILED', 'Failed to load cohort summary.', ['internal_error'], requestId);
  }
});

// ── Run: Stage Summary ──

router.get('/task029/expansion-operations/runs/:runId/stage-summary', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getStageOperationsSummary(runId, schoolId);

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'STAGE_SUMMARY_FAILED', 'Stage summary unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, count: result.data.length, stages: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STAGE_SUMMARY_FAILED', 'Failed to load stage summary.', ['internal_error'], requestId);
  }
});

// ── Run: Health Summary ──

router.get('/task029/expansion-operations/runs/:runId/health-summary', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getHealthOperationsSummary(runId, schoolId);

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'HEALTH_SUMMARY_FAILED', 'Health summary unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, healthSummary: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'HEALTH_SUMMARY_FAILED', 'Failed to load health summary.', ['internal_error'], requestId);
  }
});

// ── Run: Teacher Oversight ──

router.get('/task029/expansion-operations/runs/:runId/teacher-oversight', ...teacherOversightGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getTeacherOversightOperations(runId, schoolId, getActorId(req));

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'TEACHER_OVERSIGHT_FAILED', 'Teacher oversight data unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, teacherOversight: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'TEACHER_OVERSIGHT_FAILED', 'Failed to load teacher oversight data.', ['internal_error'], requestId);
  }
});

// ── Run: Interventions ──

router.get('/task029/expansion-operations/runs/:runId/interventions', ...interventionIncidentGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getInterventionQueueOperations({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'INTERVENTIONS_FAILED', 'Intervention queue data unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, count: result.data.length, interventions: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INTERVENTIONS_FAILED', 'Failed to load intervention queue.', ['internal_error'], requestId);
  }
});

// ── Run: Incidents ──

router.get('/task029/expansion-operations/runs/:runId/incidents', ...interventionIncidentGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getIncidentOperations({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'INCIDENTS_FAILED', 'Incident data unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, count: result.data.length, incidents: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INCIDENTS_FAILED', 'Failed to load incident data.', ['internal_error'], requestId);
  }
});

// ── Run: Audit Timeline ──

router.get('/task029/expansion-operations/runs/:runId/audit-timeline', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getSafeAuditTimeline({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'AUDIT_TIMELINE_FAILED', 'Audit timeline unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, auditTimeline: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'AUDIT_TIMELINE_FAILED', 'Failed to load audit timeline.', ['internal_error'], requestId);
  }
});

// ── Run: Evidence Summary ──

router.get('/task029/expansion-operations/runs/:runId/evidence-summary', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getEvidenceSummary({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'EVIDENCE_SUMMARY_FAILED', 'Evidence summary unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, evidenceSummary: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'EVIDENCE_SUMMARY_FAILED', 'Failed to load evidence summary.', ['internal_error'], requestId);
  }
});

// ── Run: Completion Review Summary ──

router.get('/task029/expansion-operations/runs/:runId/completion-review-summary', ...dashboardReadGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await getCompletionReviewSummary({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 404, 'COMPLETION_REVIEW_FAILED', 'Completion review summary unavailable.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, completionReviewSummary: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COMPLETION_REVIEW_FAILED', 'Failed to load completion review summary.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Preflight ──

router.post('/task029/expansion-operations/runs/:runId/control/preflight', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const { action } = req.body;

    if (!action) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'action is required in request body.', ['missing_required_fields'], requestId);
      return;
    }

    const result = await runControlActionPreflight({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, action });
    res.json({ ok: result.ok, preflight: result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'CONTROL_PREFLIGHT_FAILED', 'Control action preflight failed.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Pause ──

router.post('/task029/expansion-operations/runs/:runId/control/pause', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await executeControlAction({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, action: 'pause_expansion' });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'PAUSE_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.json({ ok: true, action: result.action, status: result.status, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_FAILED', 'Failed to pause expansion.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Resume ──

router.post('/task029/expansion-operations/runs/:runId/control/resume', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await executeControlAction({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, action: 'resume_expansion' });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'RESUME_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.json({ ok: true, action: result.action, status: result.status, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'RESUME_FAILED', 'Failed to resume expansion.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Intervention ──

router.post('/task029/expansion-operations/runs/:runId/control/intervention', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const reason = req.body.reason || 'Intervention requested via operations console.';
    const result = await executeControlAction({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, action: 'request_intervention', reason });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'INTERVENTION_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.json({ ok: true, action: result.action, status: result.status, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'INTERVENTION_FAILED', 'Failed to request intervention.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Rollback ──

router.post('/task029/expansion-operations/runs/:runId/control/rollback', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const { rollbackReason } = req.body;

    if (!rollbackReason) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'rollbackReason is required in request body.', ['missing_required_fields'], requestId);
      return;
    }

    const result = await executeRollbackCommand({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, rollbackReason });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'ROLLBACK_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.json({ ok: true, rollbackId: result.rollbackId, status: result.status, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to execute rollback.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Kill Switch / Enable ──

router.post('/task029/expansion-operations/runs/:runId/control/kill-switch/enable', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await executeControlAction({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId: runId, action: 'execute_kill_switch' });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', result.safeMessage, result.reasonCodes, requestId);
      return;
    }

    res.json({ ok: true, action: result.action, status: result.status, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to enable kill switch.', ['internal_error'], requestId);
  }
});

// ── Run: Control / Kill Switch / Disable ──

router.post('/task029/expansion-operations/runs/:runId/control/kill-switch/disable', ...controlGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const { runId } = req.params;
    const result = await disableKillSwitch(runId, getActorRole(req), getActorId(req), requestId);

    if (!result || !result.ok) {
      safeErrorEnvelope(res, 400, 'KILL_SWITCH_FAILED', result?.safeMessage || 'Kill switch disable failed.', result?.reasonCodes || ['kill_switch_failed'], requestId);
      return;
    }

    res.json({ ok: true, message: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to disable kill switch.', ['internal_error'], requestId);
  }
});

// ── Learner Own Status ──

router.get('/task029/expansion-operations/learner/own-status', ...learnerGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const actorId = getActorId(req);
    const expansionRunId = req.query.expansionRunId as string | undefined;

    const result = await getLearnerOwnStatus({
      schoolId,
      actorId,
      actorRole: getActorRole(req),
      learnerSafeRef: actorId,
      expansionRunId,
    });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 403, 'LEARNER_STATUS_FAILED', 'Learner status is not available.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, status: result.data, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'LEARNER_STATUS_FAILED', 'Failed to get learner status.', ['internal_error'], requestId);
  }
});

// ── Diagnostics ──

router.get('/task029/expansion-operations/diagnostics', ...diagnosticsReportGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const result = await getOperationsDiagnostics({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req) });

    if (!result.ok || !result.data) {
      safeErrorEnvelope(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to run diagnostics.', result.blockingIssues, requestId);
      return;
    }

    res.json({ ok: true, diagnostics: result.data, blockingIssues: result.blockingIssues, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DIAGNOSTICS_FAILED', 'Failed to run diagnostics.', ['internal_error'], requestId);
  }
});

// ── Report: Get ──

router.get('/task029/expansion-operations/report', ...diagnosticsReportGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const reports = await task028ExpansionExecutionRepository.listExecutionReports('029');
    const latest = reports.length > 0 ? reports[0] : null;

    res.json({
      ok: true,
      reportCount: reports.length,
      latestReport: latest
        ? { id: (latest as any).id, status: (latest as any).status, generatedAt: (latest as any).generatedAt }
        : null,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FAILED', 'Failed to get Task 029 report info.', ['internal_error'], requestId);
  }
});

// ── Report: Generate ──

router.post('/task029/expansion-operations/report/generate', ...diagnosticsReportGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    if (!schoolId) {
      safeErrorEnvelope(res, 400, 'NO_SCHOOL_CONTEXT', 'School context required.', ['no_school_context'], requestId);
      return;
    }

    const expansionRunId = req.body.expansionRunId as string | undefined;
    const result = await generateTask029Report({ schoolId, actorId: getActorId(req), actorRole: getActorRole(req), expansionRunId });

    if (!result.ok) {
      safeErrorEnvelope(res, 400, 'REPORT_GENERATE_FAILED', result.safeMessage, result.blockingIssues, requestId);
      return;
    }

    res.status(201).json({ ok: true, reportId: result.reportId, safeMessage: result.safeMessage, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_GENERATE_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

export default router;
