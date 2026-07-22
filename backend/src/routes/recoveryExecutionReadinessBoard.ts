import { Router, Request, Response } from 'express';
import {
  RecoveryExecutionReadinessBoardSnapshotService,
  RecoveryExecutionReadinessBoardLaneService,
  RecoveryExecutionReadinessBoardCardService,
  RecoveryExecutionReadinessBoardBlockerService,
  RecoveryExecutionReadinessBoardRiskService,
  RecoveryExecutionReadinessBoardFilterService,
  RecoveryExecutionReadinessBoardGovernanceService,
  RecoveryExecutionReadinessBoardProjectionService,
  RecoveryExecutionReadinessBoardQueueService,
  RecoveryExecutionReadinessBoardStakeholderDraftService,
  RecoveryExecutionReadinessBoardRefreshService,
  RecoveryExecutionReadinessBoardSummaryService,
  RecoveryExecutionReadinessBoardAuditBridge,
  RecoveryExecutionReadinessBoardIdempotencyService,
} from '../domains/assessment/recovery-execution-readiness-board/services';
import type { RecoveryExecutionReadinessBoardSnapshotRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardLaneRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardCardRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardBlockerRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardRiskSignalRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardFilterPresetRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardGovernanceNoteRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardRoleProjectionRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardTeacherQueueRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardAdminQueueRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardRefreshJobRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardSummaryRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardAuditRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';
import type { RecoveryExecutionReadinessBoardIdempotencyRepository } from '../domains/assessment/recovery-execution-readiness-board/contracts/recoveryExecutionReadinessBoardRepositoryContracts';

export function createRecoveryExecutionReadinessBoardRouter(
  snapshotRepo: RecoveryExecutionReadinessBoardSnapshotRepository,
  laneRepo: RecoveryExecutionReadinessBoardLaneRepository,
  cardRepo: RecoveryExecutionReadinessBoardCardRepository,
  blockerRepo: RecoveryExecutionReadinessBoardBlockerRepository,
  riskRepo: RecoveryExecutionReadinessBoardRiskSignalRepository,
  filterRepo: RecoveryExecutionReadinessBoardFilterPresetRepository,
  governanceRepo: RecoveryExecutionReadinessBoardGovernanceNoteRepository,
  projectionRepo: RecoveryExecutionReadinessBoardRoleProjectionRepository,
  teacherQueueRepo: RecoveryExecutionReadinessBoardTeacherQueueRepository,
  adminQueueRepo: RecoveryExecutionReadinessBoardAdminQueueRepository,
  studentDraftRepo: RecoveryExecutionReadinessBoardStudentSafeStatusDraftRepository,
  parentDraftRepo: RecoveryExecutionReadinessBoardParentSafeStatusDraftRepository,
  refreshJobRepo: RecoveryExecutionReadinessBoardRefreshJobRepository,
  summaryRepo: RecoveryExecutionReadinessBoardSummaryRepository,
  auditRepo: RecoveryExecutionReadinessBoardAuditRepository,
  idempotencyRepo: RecoveryExecutionReadinessBoardIdempotencyRepository,
): Router {
  const router = Router();

const snapshotService = new RecoveryExecutionReadinessBoardSnapshotService(snapshotRepo);
const laneService = new RecoveryExecutionReadinessBoardLaneService(laneRepo);
const cardService = new RecoveryExecutionReadinessBoardCardService(cardRepo);
const blockerService = new RecoveryExecutionReadinessBoardBlockerService(blockerRepo);
const riskService = new RecoveryExecutionReadinessBoardRiskService(riskRepo);
const filterService = new RecoveryExecutionReadinessBoardFilterService(filterRepo);
const governanceService = new RecoveryExecutionReadinessBoardGovernanceService(governanceRepo);
const projectionService = new RecoveryExecutionReadinessBoardProjectionService(projectionRepo);
const queueService = new RecoveryExecutionReadinessBoardQueueService(teacherQueueRepo, adminQueueRepo);
const stakeholderDraftService = new RecoveryExecutionReadinessBoardStakeholderDraftService(studentDraftRepo, parentDraftRepo);
const refreshService = new RecoveryExecutionReadinessBoardRefreshService(refreshJobRepo);
const summaryService = new RecoveryExecutionReadinessBoardSummaryService(summaryRepo);
const auditBridge = new RecoveryExecutionReadinessBoardAuditBridge(auditRepo);
const idempotencyService = new RecoveryExecutionReadinessBoardIdempotencyService(idempotencyRepo);

function buildContext(req: Request): any {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || '',
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || '',
    sourceRefsJson: req.body?.sourceRefsJson ?? {},
  };
}

function extractSchoolId(req: Request): string {
  return (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
}

function sendResponse(res: Response, result: any) {
  if (result.success) {
    res.status(200).json(result);
  } else {
    const status = result.status === 'NOT_FOUND' ? 404 : result.status === 'DENIED' ? 403 : 400;
    res.status(status).json(result);
  }
}

// ─── GROUP 1: Board Snapshots ─────────────────────────────────────────
router.post('/board-snapshots', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await snapshotService.createBoardSnapshot(buildContext(req), schoolId, req.body));
});

router.get('/board-snapshots', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await snapshotService.listBoardSnapshotsForSchool(schoolId));
});

router.get('/board-snapshots/by-student/:studentRef', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  sendResponse(res, await snapshotService.listBoardSnapshotsForStudent(schoolId, req.params.studentRef));
});

router.get('/board-snapshots/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.listBoardSnapshotsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/board-snapshots/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.listBoardSnapshotsByStatus(extractSchoolId(req), req.params.status));
});

router.get('/board-snapshots/:id', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.getBoardSnapshot(extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.markBoardSnapshotReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.markBoardSnapshotReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.markBoardSnapshotStale(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.suppressBoardSnapshot(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.blockBoardSnapshot(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.voidBoardSnapshot(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-snapshots/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await snapshotService.refreshBoardSnapshot(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 2: Board Lanes ────────────────────────────────────────────
router.post('/board-lanes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await laneService.createBoardLane(buildContext(req), schoolId, req.body));
});

router.get('/board-lanes', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await laneService.listBoardLanesForSnapshot(snapshotId));
});

router.get('/board-lanes/by-key/:laneKey', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.listBoardLanesByLaneKey(req.params.laneKey));
});

router.get('/board-lanes/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.listBoardLanesByStatus(req.params.status));
});

router.get('/board-lanes/:id', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.getBoardLane(extractSchoolId(req), req.params.id));
});

router.post('/board-lanes/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.markBoardLaneReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-lanes/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.markBoardLaneStale(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-lanes/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.blockBoardLane(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-lanes/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await laneService.voidBoardLane(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 3: Board Cards ─────────────────────────────────────────────
router.post('/board-cards', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await cardService.createBoardCard(buildContext(req), schoolId, req.body));
});

router.get('/board-cards', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await cardService.listBoardCardsForSnapshot(snapshotId));
});

router.get('/board-cards/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.listBoardCardsForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/board-cards/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.listBoardCardsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/board-cards/by-key/:laneKey', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.listBoardCardsByLaneKey(req.params.laneKey));
});

router.get('/board-cards/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.listBoardCardsByStatus(req.params.status));
});

router.get('/board-cards/by-priority/:priority', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.listBoardCardsByPriority(req.params.priority));
});

router.get('/board-cards/:id', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.getBoardCard(extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.markBoardCardReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/needs-teacher-review', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.markBoardCardNeedsTeacherReview(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/needs-admin-review', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.markBoardCardNeedsAdminReview(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/risk-flagged', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.markBoardCardRiskFlagged(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.blockBoardCard(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-cards/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await cardService.voidBoardCard(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 4: Filter Presets ─────────────────────────────────────────
router.post('/filter-presets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await filterService.createFilterPreset(buildContext(req), schoolId, req.body));
});

router.get('/filter-presets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await filterService.listFilterPresetsForSchool(schoolId));
});

router.get('/filter-presets/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.listFilterPresetsByActor(extractSchoolId(req), req.params.actorId));
});

router.get('/filter-presets/by-role/:role', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.listFilterPresetsByRole(extractSchoolId(req), req.params.role));
});

router.get('/filter-presets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.getFilterPreset(extractSchoolId(req), req.params.id));
});

router.put('/filter-presets/:id', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.updateFilterPreset(buildContext(req), extractSchoolId(req), req.params.id, req.body));
});

router.post('/filter-presets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.suppressFilterPreset(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/filter-presets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await filterService.voidFilterPreset(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 5: Risk Signals ───────────────────────────────────────────
router.post('/risk-signals', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await riskService.createRiskSignal(buildContext(req), schoolId, req.body));
});

router.get('/risk-signals', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await riskService.listRiskSignalsForSnapshot(snapshotId));
});

router.get('/risk-signals/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.listRiskSignalsForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/risk-signals/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.listRiskSignalsForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/risk-signals/by-level/:riskLevel', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.listRiskSignalsByRiskLevel(req.params.riskLevel));
});

router.get('/risk-signals/:id', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.getRiskSignal(extractSchoolId(req), req.params.id));
});

router.post('/risk-signals/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.markRiskSignalReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-signals/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.suppressRiskSignal(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-signals/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.blockRiskSignal(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/risk-signals/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await riskService.voidRiskSignal(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 6: Board Blockers ─────────────────────────────────────────
router.post('/board-blockers', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await blockerService.createBoardBlocker(buildContext(req), schoolId, req.body));
});

router.get('/board-blockers', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await blockerService.listBoardBlockersForSnapshot(snapshotId));
});

router.get('/board-blockers/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.listBoardBlockersForStudent(extractSchoolId(req), req.params.studentRef));
});

router.get('/board-blockers/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.listBoardBlockersForPlan(extractSchoolId(req), req.params.planId));
});

router.get('/board-blockers/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.listBoardBlockersByStatus(req.params.status));
});

router.get('/board-blockers/:id', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.getBoardBlocker(extractSchoolId(req), req.params.id));
});

router.post('/board-blockers/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.markBoardBlockerReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-blockers/:id/resolve', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.resolveBoardBlockerForFutureReviewOnly(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-blockers/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.suppressBoardBlocker(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/board-blockers/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await blockerService.voidBoardBlocker(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 7: Governance Notes ───────────────────────────────────────
router.post('/governance-notes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await governanceService.createGovernanceNote(buildContext(req), schoolId, req.body));
});

router.get('/governance-notes', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await governanceService.listGovernanceNotesForSnapshot(snapshotId));
});

router.get('/governance-notes/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.listGovernanceNotesForPlan(req.params.planId));
});

router.get('/governance-notes/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.listGovernanceNotesByActor(req.params.actorId));
});

router.get('/governance-notes/:id', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.getGovernanceNote(extractSchoolId(req), req.params.id));
});

router.post('/governance-notes/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.markGovernanceNoteReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/governance-notes/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.suppressGovernanceNote(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/governance-notes/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await governanceService.voidGovernanceNote(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 8: Role Projections ───────────────────────────────────────
router.post('/role-projections', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await projectionService.createRoleProjection(buildContext(req), schoolId, req.body));
});

router.get('/role-projections', async (req: Request, res: Response) => {
  const snapshotId = (req.query.snapshotId as string) || '';
  sendResponse(res, await projectionService.listRoleProjectionsForSnapshot(snapshotId));
});

router.get('/role-projections/by-role/:role', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.listRoleProjectionsByRole(req.params.role));
});

router.get('/role-projections/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.listRoleProjectionsByActor(req.params.actorId));
});

router.get('/role-projections/:id', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.getRoleProjection(extractSchoolId(req), req.params.id));
});

router.post('/role-projections/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.markRoleProjectionReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/role-projections/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.suppressRoleProjection(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/role-projections/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.blockRoleProjection(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/role-projections/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await projectionService.voidRoleProjection(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 9: Teacher Queues ─────────────────────────────────────────
router.post('/teacher-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await queueService.createTeacherQueue(buildContext(req), schoolId, req.body));
});

router.get('/teacher-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await queueService.listTeacherQueuesForSchool(schoolId));
});

router.get('/teacher-queues/by-teacher/:teacherRef', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.listTeacherQueuesByTeacher(req.params.teacherRef));
});

router.get('/teacher-queues/:id', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.getTeacherQueue(extractSchoolId(req), req.params.id));
});

router.post('/teacher-queues/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.markTeacherQueueReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/teacher-queues/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.refreshTeacherQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/teacher-queues/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.blockTeacherQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/teacher-queues/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.voidTeacherQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 10: Admin Queues ──────────────────────────────────────────
router.post('/admin-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await queueService.createAdminQueue(buildContext(req), schoolId, req.body));
});

router.get('/admin-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await queueService.listAdminQueuesForSchool(schoolId));
});

router.get('/admin-queues/by-admin/:adminRef', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.listAdminQueuesByAdmin(req.params.adminRef));
});

router.get('/admin-queues/:id', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.getAdminQueue(extractSchoolId(req), req.params.id));
});

router.post('/admin-queues/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.markAdminQueueReviewReady(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/admin-queues/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.refreshAdminQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/admin-queues/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.blockAdminQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

router.post('/admin-queues/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await queueService.voidAdminQueue(buildContext(req), extractSchoolId(req), req.params.id));
});

// ─── GROUP 11: Student Safe Status Drafts ────────────────────────────
router.post('/student-safe-status-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.createStudentSafeStatusDraft(buildContext(req), req.body));
});

router.get('/student-safe-status-drafts/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listStudentSafeStatusDraftsForPlan(req.params.planId));
});

router.get('/student-safe-status-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.getStudentSafeStatusDraft(req.params.id));
});

router.post('/student-safe-status-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.markStudentSafeStatusDraftReviewReady(req.params.id));
});

router.post('/student-safe-status-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.suppressStudentSafeStatusDraft(req.params.id));
});

router.post('/student-safe-status-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.blockStudentSafeStatusDraft(req.params.id));
});

router.post('/student-safe-status-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.voidStudentSafeStatusDraft(req.params.id));
});

// ─── GROUP 12: Parent Safe Status Drafts ─────────────────────────────
router.post('/parent-safe-status-drafts', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.createParentSafeStatusDraft(buildContext(req), req.body));
});

router.get('/parent-safe-status-drafts/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.listParentSafeStatusDraftsForPlan(req.params.planId));
});

router.get('/parent-safe-status-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.getParentSafeStatusDraft(req.params.id));
});

router.post('/parent-safe-status-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.markParentSafeStatusDraftReviewReady(req.params.id));
});

router.post('/parent-safe-status-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.suppressParentSafeStatusDraft(req.params.id));
});

router.post('/parent-safe-status-drafts/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.blockParentSafeStatusDraft(req.params.id));
});

router.post('/parent-safe-status-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await stakeholderDraftService.voidParentSafeStatusDraft(req.params.id));
});

// ─── GROUP 13: Refresh Jobs ──────────────────────────────────────────
router.post('/refresh-jobs', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.createRefreshJob(buildContext(req), req.body));
});

router.get('/refresh-jobs', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await refreshService.listRefreshJobsForSchool(schoolId));
});

router.get('/refresh-jobs/by-snapshot/:snapshotId', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.listRefreshJobsForSnapshot(req.params.snapshotId));
});

router.get('/refresh-jobs/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.listRefreshJobsByStatus(req.params.status));
});

router.get('/refresh-jobs/:id', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.getRefreshJob(req.params.id));
});

router.post('/refresh-jobs/:id/running', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.markRefreshJobRunning(req.params.id));
});

router.post('/refresh-jobs/:id/completed', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.markRefreshJobCompleted(req.params.id));
});

router.post('/refresh-jobs/:id/failed', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.markRefreshJobFailed(req.params.id));
});

router.post('/refresh-jobs/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await refreshService.voidRefreshJob(req.params.id));
});

// ─── GROUP 14: Board Summaries ───────────────────────────────────────
router.post('/board-summaries', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.createBoardSummary(buildContext(req), req.body));
});

router.get('/board-summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, status: 'error', message: 'schoolId is required' }); return; }
  sendResponse(res, await summaryService.listBoardSummariesForSchool(schoolId));
});

router.get('/board-summaries/by-student/:studentRef', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  sendResponse(res, await summaryService.listBoardSummariesForStudent(schoolId, req.params.studentRef));
});

router.get('/board-summaries/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.listBoardSummariesForPlan(req.params.planId));
});

router.get('/board-summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.getBoardSummary(req.params.id));
});

router.post('/board-summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.refreshBoardSummary(req.params.id));
});

router.post('/board-summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markBoardSummaryStale(req.params.id));
});

router.post('/board-summaries/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.markBoardSummaryReviewReady(req.params.id));
});

router.post('/board-summaries/:id/block', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.blockBoardSummary(req.params.id));
});

router.post('/board-summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, await summaryService.voidBoardSummary(req.params.id));
});

  return router;
}
