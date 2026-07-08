import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { requireRole, resolveRequestRole } from '../lib/rbac';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness, getPilotReadinessStatus, assertPilotCanStart } from '../services/task025PilotReadinessService';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { runPilotDryRun } from '../services/task025PilotDryRunService';
import { pausePilot, rollbackPilot, engageKillSwitch } from '../services/task025PilotRollbackService';
import type { PilotProgramStatus, PilotEligibilityStatus } from '../contracts/task025PilotContracts';
import { PILOT_PROGRAM_STATUSES, PILOT_ELIGIBILITY_STATUSES } from '../contracts/task025PilotContracts';

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
    error: {
      code: 'PILOT_ACCESS_DENIED',
      safeMessage: 'You do not have permission to access this pilot resource.',
      reasonCodes: ['access_denied'],
    },
    requestId,
  });
}

function safeErrorEnvelope(res: Response, status: number, code: string, safeMessage: string, reasonCodes: string[], requestId: string): void {
  res.status(status).json({
    ok: false,
    error: { code, safeMessage, reasonCodes },
    requestId,
  });
}

async function requireInternalAccess(req: Request, res: Response): Promise<boolean> {
  const role = getActorRole(req);
  if (role !== 'admin' && role !== 'counselor') {
    safeDeniedResponse(res, getRequestId(req));
    return false;
  }
  return true;
}

async function requireAdminAccess(req: Request, res: Response): Promise<boolean> {
  const role = getActorRole(req);
  if (role !== 'admin') {
    safeDeniedResponse(res, getRequestId(req));
    return false;
  }
  return true;
}

// GET /pilot/readiness
router.get('/pilot/readiness', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const schoolId = getSchoolId(req);
    const programs = await task025PilotRepository.listPilotPrograms(schoolId);

    const readinessResults = [];
    for (const program of programs as any[]) {
      const readiness = await getPilotReadinessStatus(program.id);
      readinessResults.push({
        pilotProgramId: program.id,
        name: program.name,
        status: program.status,
        safeToStartPilot: readiness?.safeToStartPilot ?? false,
        blockingIssues: readiness?.blockingIssues ?? [],
        safeSummary: readiness?.safeSummary ?? 'Readiness unavailable',
      });
    }

    res.json({ ok: true, count: readinessResults.length, results: readinessResults, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'READINESS_EVALUATION_FAILED', 'Failed to evaluate pilot readiness.', ['internal_error'], requestId);
  }
});

// GET /pilot/readiness/:pilotProgramId
router.get('/pilot/readiness/:pilotProgramId', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const readiness = await getPilotReadinessStatus(req.params.pilotProgramId);
    if (!readiness) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }
    res.json({ ok: true, readiness, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'READINESS_EVALUATION_FAILED', 'Failed to evaluate pilot readiness.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs
router.post('/pilot/programs', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { schoolId, name, scopeSummarySafe, allowedSubjects, allowedYearGroups, allowedCurriculumTracks, allowedRoles, maxStudents, maxTeachers } = req.body;

    if (!schoolId || !name || !scopeSummarySafe) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'schoolId, name, and scopeSummarySafe are required.', ['missing_required_fields'], requestId);
      return;
    }

    const program = await task025PilotRepository.createPilotProgram({
      schoolId,
      name,
      scopeSummarySafe,
      allowedSubjects,
      allowedYearGroups,
      allowedCurriculumTracks,
      allowedRoles,
      maxStudents: maxStudents ?? 50,
      maxTeachers: maxTeachers ?? 10,
      createdByRole: getActorRole(req),
      createdByActorIdHash: getActorId(req),
    });

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId: (program as any).id,
      schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'program_created',
      safeSummary: `Pilot program "${name}" created for school ${schoolId}`,
      requestId,
    });

    res.status(201).json({ ok: true, program: { id: (program as any).id, name, schoolId, status: (program as any).status }, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PROGRAM_CREATION_FAILED', 'Failed to create pilot program.', ['internal_error'], requestId);
  }
});

// PATCH /pilot/programs/:pilotProgramId/status
router.patch('/pilot/programs/:pilotProgramId/status', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { status } = req.body;
    if (!status || !PILOT_PROGRAM_STATUSES.includes(status as PilotProgramStatus)) {
      safeErrorEnvelope(res, 400, 'INVALID_STATUS', `Invalid status. Allowed: ${PILOT_PROGRAM_STATUSES.join(', ')}`, ['invalid_status'], requestId);
      return;
    }

    const program = await task025PilotRepository.getPilotProgram(req.params.pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    const updated = await task025PilotRepository.updatePilotProgramStatus(req.params.pilotProgramId, status);

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId: req.params.pilotProgramId,
      schoolId: (program as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'program_status_changed',
      safeSummary: `Pilot program status changed to "${status}"`,
      requestId,
    });

    res.json({ ok: true, program: { id: req.params.pilotProgramId, status }, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'STATUS_UPDATE_FAILED', 'Failed to update pilot program status.', ['internal_error'], requestId);
  }
});

// GET /pilot/programs/:pilotProgramId/cohorts
router.get('/pilot/programs/:pilotProgramId/cohorts', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const cohorts = await task025PilotRepository.listCohorts(req.params.pilotProgramId);
    const safe = cohorts.map((c: any) => ({
      id: c.id, name: c.name, status: c.status, studentCount: c.studentCount, teacherCount: c.teacherCount,
    }));
    res.json({ ok: true, count: safe.length, cohorts: safe, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_LIST_FAILED', 'Failed to list cohorts.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/cohorts
router.post('/pilot/programs/:pilotProgramId/cohorts', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.params.pilotProgramId;
    const { name, allowedClassIds, allowedSubjectIds, allowedCurriculumScopes } = req.body;

    const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    if (!name) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'name is required.', ['missing_required_fields'], requestId);
      return;
    }

    const cohort = await task025PilotRepository.createCohort({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      name,
      allowedClassIds,
      allowedSubjectIds,
      allowedCurriculumScopes,
    });

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'cohort_created',
      safeSummary: `Cohort "${name}" created for pilot program`,
      requestId,
    });

    res.status(201).json({ ok: true, cohort: { id: (cohort as any).id, name }, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'COHORT_CREATION_FAILED', 'Failed to create cohort.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/participants
router.post('/pilot/programs/:pilotProgramId/participants', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.params.pilotProgramId;
    const { actorIdHash, role, cohortId } = req.body;

    const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    if (!actorIdHash || !role) {
      safeErrorEnvelope(res, 400, 'INVALID_INPUT', 'actorIdHash and role are required.', ['missing_required_fields'], requestId);
      return;
    }

    const existing = await task025PilotRepository.getParticipantByActorIdHash(pilotProgramId, actorIdHash);
    if (existing) {
      safeErrorEnvelope(res, 409, 'PARTICIPANT_ALREADY_EXISTS', 'Participant already added to this pilot.', ['duplicate'], requestId);
      return;
    }

    const participant = await task025PilotRepository.addParticipant({
      pilotProgramId,
      cohortId,
      schoolId: (program as any).schoolId,
      actorIdHash,
      role,
    });

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'participant_added',
      safeSummary: `Participant with role "${role}" added to pilot program`,
      requestId,
    });

    res.status(201).json({ ok: true, participant: { id: (participant as any).id, actorIdHash: actorIdHash.substring(0, 8) + '...', role }, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PARTICIPANT_ADD_FAILED', 'Failed to add participant.', ['internal_error'], requestId);
  }
});

// DELETE /pilot/programs/:pilotProgramId/participants/:participantId
router.delete('/pilot/programs/:pilotProgramId/participants/:participantId', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { pilotProgramId, participantId } = req.params;

    const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    const removed = await task025PilotRepository.removeParticipant(participantId);
    if (!removed) {
      safeErrorEnvelope(res, 404, 'PARTICIPANT_NOT_FOUND', 'Participant not found.', ['not_found'], requestId);
      return;
    }

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'participant_removed',
      safeSummary: 'Participant removed from pilot program',
      requestId,
    });

    res.json({ ok: true, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PARTICIPANT_REMOVE_FAILED', 'Failed to remove participant.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/preflight
router.post('/pilot/programs/:pilotProgramId/preflight', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.params.pilotProgramId;
    const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    const readiness = await evaluatePilotReadiness(pilotProgramId, (program as any).schoolId);

    await task025PilotRepository.writeReadinessCheck({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      checkType: 'school_identity',
      status: readiness.safeToStartPilot ? 'passed' : 'failed',
      safeSummary: readiness.safeSummary,
      blockingIssues: readiness.blockingIssues,
      warnings: readiness.warnings,
    });

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId,
      schoolId: (program as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'preflight_triggered',
      safeSummary: `Preflight completed: safeToStartPilot=${readiness.safeToStartPilot}`,
      requestId,
    });

    res.json({
      ok: true,
      preflight: readiness,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PREFLIGHT_FAILED', 'Failed to run preflight.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/dry-run
router.post('/pilot/programs/:pilotProgramId/dry-run', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.params.pilotProgramId;
    const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
    if (!program) {
      safeErrorEnvelope(res, 404, 'PILOT_PROGRAM_NOT_FOUND', 'Pilot program not found.', ['not_found'], requestId);
      return;
    }

    const dryRunResult = await runPilotDryRun(
      pilotProgramId,
      (program as any).schoolId,
      req.body?.scenarioName,
    );

    res.json({
      ok: true,
      dryRun: dryRunResult,
      requestId,
    });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'DRY_RUN_FAILED', 'Failed to run dry run.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/activate
router.post('/pilot/programs/:pilotProgramId/activate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.params.pilotProgramId;

    const canStart = await assertPilotCanStart(pilotProgramId);
    if (!canStart.ok) {
      res.status(400).json({
        ok: false,
        error: { code: 'PILOT_CANNOT_START', safeMessage: canStart.safeMessage, reasonCodes: canStart.reasonCodes },
        requestId,
      });
      return;
    }

    const updated = await task025PilotRepository.updatePilotProgramStatus(pilotProgramId, 'active', getActorRole(req));

    await task025PilotRepository.writeAuditRecord({
      pilotProgramId,
      schoolId: (updated as any).schoolId,
      actorRole: getActorRole(req),
      actorIdHash: getActorId(req),
      action: 'pilot_activated',
      safeSummary: 'Pilot program activated',
      requestId,
    });

    res.json({ ok: true, program: { id: pilotProgramId, status: 'active' }, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ACTIVATION_FAILED', 'Failed to activate pilot.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/pause
router.post('/pilot/programs/:pilotProgramId/pause', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await pausePilot(req.params.pilotProgramId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.success, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'PAUSE_FAILED', 'Failed to pause pilot.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/rollback
router.post('/pilot/programs/:pilotProgramId/rollback', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await rollbackPilot(req.params.pilotProgramId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.success, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'ROLLBACK_FAILED', 'Failed to rollback pilot.', ['internal_error'], requestId);
  }
});

// POST /pilot/programs/:pilotProgramId/kill-switch
router.post('/pilot/programs/:pilotProgramId/kill-switch', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const result = await engageKillSwitch(req.params.pilotProgramId, getActorRole(req), getActorId(req), requestId);
    res.json({ ok: result.success, result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'KILL_SWITCH_FAILED', 'Failed to engage kill switch.', ['internal_error'], requestId);
  }
});

// GET /pilot/audit
router.get('/pilot/audit', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const pilotProgramId = req.query.pilotProgramId as string | undefined;
    const records = await task025PilotRepository.listAuditRecords(pilotProgramId);
    const safe = records.map((r: any) => ({
      id: r.id,
      action: r.action,
      actorRole: r.actorRole,
      safeSummary: r.safeSummary,
      createdAt: r.createdAt,
    }));
    res.json({ ok: true, count: safe.length, records: safe, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'AUDIT_LIST_FAILED', 'Failed to list audit records.', ['internal_error'], requestId);
  }
});

// GET /pilot/reports/task-025
router.get('/pilot/reports/task-025', ...internalGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    res.json({ ok: true, report: null, message: 'Generate report via POST /pilot/reports/task-025/generate', requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_FETCH_FAILED', 'Failed to fetch report.', ['internal_error'], requestId);
  }
});

// POST /pilot/reports/task-025/generate
router.post('/pilot/reports/task-025/generate', ...adminGuard, async (req: Request, res: Response) => {
  const requestId = getRequestId(req);
  try {
    const { generateTask025Report } = await import('../services/task025PilotReportService');
    const result = generateTask025Report();
    res.json({ ok: true, ...result, requestId });
  } catch (err: unknown) {
    safeErrorEnvelope(res, 500, 'REPORT_GENERATION_FAILED', 'Failed to generate report.', ['internal_error'], requestId);
  }
});

export default router;
