import { Router, Request, Response } from 'express';
import { verifyTask029DependencyForTask030 } from '../services/task030Task029ProofLoaderService';
import { runTask030StagingEnvironmentGate } from '../services/task030StagingEnvironmentGateService';
import { createTask030SyntheticSchoolFixture } from '../services/task030SyntheticSchoolFixtureService';
import { createTask030RoleTokenMatrix } from '../services/task030RoleTokenMatrixService';
import { createTask030RehearsalRun, getTask030RehearsalRun, completeTask030RehearsalRun, blockTask030RehearsalRun } from '../services/task030RehearsalRunService';
import { runTask030StagingPreflight } from '../services/task030StagingPreflightService';
import { runTask030AdminOperatorJourney } from '../services/task030AdminOperatorJourneyService';
import { runTask030TeacherJourney } from '../services/task030TeacherJourneyService';
import { runTask030StudentJourney } from '../services/task030StudentJourneyService';
import { runTask030UnknownRoleDenial } from '../services/task030UnknownRoleDenialService';
import { runTask030OperationsConsoleRehearsal } from '../services/task030OperationsConsoleRehearsalService';
import { runTask030ControlActionRehearsal } from '../services/task030ControlActionRehearsalService';
import { runTask030RollbackDrill } from '../services/task030RollbackDrillService';
import { generateTask030StaffTrainingPack } from '../services/task030StaffTrainingPackService';
import { recordTask030SafeEvidenceEvent, listTask030SafeEvidenceEvents } from '../services/task030RehearsalEvidenceLedgerService';
import { generateTask030ControlledStagingReport } from '../services/task030ControlledStagingReportService';
import { getTask030ControlledStagingDiagnostics } from '../services/task030ControlledStagingDiagnosticsService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

const router = Router();

function safeError(res: Response, status: number, message: string, code: string): void {
  res.status(status).json({ ok: false, error: { message, code } });
}

function safeData<T>(res: Response, data: T): void {
  res.json({ ok: true, data });
}

// GET /health
router.get('/task030/controlled-staging-rehearsal/health', async (_req: Request, res: Response) => {
  try {
    safeData(res, {
      status: 'ok',
      taskId: 'TASK-030',
      environmentType: 'staging',
      dataMode: 'synthetic',
      executionMode: 'dry_run',
    });
  } catch (err: unknown) {
    safeError(res, 500, 'Health check failed.', 'HEALTH_FAILED');
  }
});

// POST /dependency/task029/check
router.post('/task030/controlled-staging-rehearsal/dependency/task029/check', async (_req: Request, res: Response) => {
  try {
    const result = await verifyTask029DependencyForTask030();
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Task 029 dependency check failed.', 'DEPENDENCY_CHECK_FAILED');
  }
});

// POST /environment/preflight
router.post('/task030/controlled-staging-rehearsal/environment/preflight', async (req: Request, res: Response) => {
  try {
    const result = await runTask030StagingEnvironmentGate(req.body);
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Environment preflight failed.', 'ENVIRONMENT_PREFLIGHT_FAILED');
  }
});

// POST /fixtures/synthetic-school
router.post('/task030/controlled-staging-rehearsal/fixtures/synthetic-school', async (req: Request, res: Response) => {
  try {
    const result = await createTask030SyntheticSchoolFixture(req.body);
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Synthetic school fixture creation failed.', 'FIXTURE_CREATION_FAILED');
  }
});

// POST /role-token-matrix
router.post('/task030/controlled-staging-rehearsal/role-token-matrix', async (req: Request, res: Response) => {
  try {
    const result = await createTask030RoleTokenMatrix(req.body);
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Role token matrix creation failed.', 'ROLE_TOKEN_MATRIX_FAILED');
  }
});

// POST /runs
router.post('/task030/controlled-staging-rehearsal/runs', async (req: Request, res: Response) => {
  try {
    const result = await createTask030RehearsalRun(req.body);
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Rehearsal run creation failed.', 'RUN_CREATION_FAILED');
  }
});

// GET /runs/:runId
router.get('/task030/controlled-staging-rehearsal/runs/:runId', async (req: Request, res: Response) => {
  try {
    const result = await getTask030RehearsalRun(req.params.runId);
    if (!result) {
      safeError(res, 404, 'Rehearsal run not found.', 'RUN_NOT_FOUND');
      return;
    }
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Failed to get rehearsal run.', 'RUN_GET_FAILED');
  }
});

// POST /runs/:runId/preflight
router.post('/task030/controlled-staging-rehearsal/runs/:runId/preflight', async (req: Request, res: Response) => {
  try {
    const result = await runTask030StagingPreflight({ schoolId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Staging preflight failed.', 'PREFLIGHT_FAILED');
  }
});

// POST /runs/:runId/admin-operator-journey
router.post('/task030/controlled-staging-rehearsal/runs/:runId/admin-operator-journey', async (req: Request, res: Response) => {
  try {
    const result = await runTask030AdminOperatorJourney({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Admin operator journey failed.', 'ADMIN_OPERATOR_JOURNEY_FAILED');
  }
});

// POST /runs/:runId/teacher-journey
router.post('/task030/controlled-staging-rehearsal/runs/:runId/teacher-journey', async (req: Request, res: Response) => {
  try {
    const result = await runTask030TeacherJourney({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Teacher journey failed.', 'TEACHER_JOURNEY_FAILED');
  }
});

// POST /runs/:runId/student-journey
router.post('/task030/controlled-staging-rehearsal/runs/:runId/student-journey', async (req: Request, res: Response) => {
  try {
    const result = await runTask030StudentJourney({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Student journey failed.', 'STUDENT_JOURNEY_FAILED');
  }
});

// POST /runs/:runId/unknown-role-denial
router.post('/task030/controlled-staging-rehearsal/runs/:runId/unknown-role-denial', async (req: Request, res: Response) => {
  try {
    const result = await runTask030UnknownRoleDenial({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Unknown role denial failed.', 'UNKNOWN_ROLE_DENIAL_FAILED');
  }
});

// POST /runs/:runId/operations-console-rehearsal
router.post('/task030/controlled-staging-rehearsal/runs/:runId/operations-console-rehearsal', async (req: Request, res: Response) => {
  try {
    const result = await runTask030OperationsConsoleRehearsal({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Operations console rehearsal failed.', 'CONSOLE_REHEARSAL_FAILED');
  }
});

// POST /runs/:runId/control-action-rehearsal
router.post('/task030/controlled-staging-rehearsal/runs/:runId/control-action-rehearsal', async (req: Request, res: Response) => {
  try {
    const result = await runTask030ControlActionRehearsal({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Control action rehearsal failed.', 'CONTROL_ACTION_REHEARSAL_FAILED');
  }
});

// POST /runs/:runId/rollback-drill
router.post('/task030/controlled-staging-rehearsal/runs/:runId/rollback-drill', async (req: Request, res: Response) => {
  try {
    const result = await runTask030RollbackDrill({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Rollback drill failed.', 'ROLLBACK_DRILL_FAILED');
  }
});

// POST /runs/:runId/staff-training-pack
router.post('/task030/controlled-staging-rehearsal/runs/:runId/staff-training-pack', async (req: Request, res: Response) => {
  try {
    const result = await generateTask030StaffTrainingPack({ runId: req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Staff training pack generation failed.', 'TRAINING_PACK_FAILED');
  }
});

// GET /runs/:runId/evidence
router.get('/task030/controlled-staging-rehearsal/runs/:runId/evidence', async (req: Request, res: Response) => {
  try {
    const result = await listTask030SafeEvidenceEvents(req.params.runId);
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Failed to list evidence events.', 'EVIDENCE_LIST_FAILED');
  }
});

// POST /runs/:runId/report
router.post('/task030/controlled-staging-rehearsal/runs/:runId/report', async (req: Request, res: Response) => {
  try {
    const result = await generateTask030ControlledStagingReport({ runId: req.params.runId, schoolId: req.body.schoolId || req.params.runId });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Report generation failed.', 'REPORT_GENERATION_FAILED');
  }
});

// GET /reports/latest
router.get('/task030/controlled-staging-rehearsal/reports/latest', async (_req: Request, res: Response) => {
  try {
    const report = await task030ControlledStagingRehearsalRepository.getLatestReport();
    if (!report) {
      safeError(res, 404, 'No report found.', 'REPORT_NOT_FOUND');
      return;
    }
    safeData(res, report);
  } catch (err: unknown) {
    safeError(res, 500, 'Failed to get latest report.', 'REPORT_GET_FAILED');
  }
});

// GET /diagnostics
router.get('/task030/controlled-staging-rehearsal/diagnostics', async (req: Request, res: Response) => {
  try {
    const result = await getTask030ControlledStagingDiagnostics({ schoolId: (req.query.schoolId as string) || 'default' });
    safeData(res, result);
  } catch (err: unknown) {
    safeError(res, 500, 'Diagnostics failed.', 'DIAGNOSTICS_FAILED');
  }
});

export default router;
