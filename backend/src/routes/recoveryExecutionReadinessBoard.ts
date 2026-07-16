import { Router, Request, Response } from 'express';

const router = Router();

function buildContext(req: Request) {
  return {
    schoolId: (req as any).schoolId || (req.headers['x-school-id'] as string) || '',
    actorId: (req as any).userId || (req.headers['x-user-id'] as string) || '',
    actorRole: (req as any).userRole || (req.headers['x-user-role'] as string) || '',
    correlationId: (req.headers['x-correlation-id'] as string) || `corr-${Date.now()}`,
    idempotencyKey: (req.headers['x-idempotency-key'] as string) || `ik-${Date.now()}`,
  };
}

function extractSchoolId(req: Request): string {
  return (req as any).schoolId || (req.headers['x-school-id'] as string) || '';
}

function sendResponse(res: Response, result: any) {
  if (result.success) {
    res.status(200).json(result);
  } else {
    res.status(400).json(result);
  }
}

function safeStub(data: any = null, message = 'Stub endpoint — service pending') {
  return { success: true, data, message };
}

// ─── GROUP 1: Board Snapshots ─────────────────────────────────────────
router.post('/board-snapshots', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/board-snapshots', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/board-snapshots/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ studentRef: req.params.studentRef }));
});

router.get('/board-snapshots/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/board-snapshots/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ status: req.params.status }));
});

router.get('/board-snapshots/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/board-snapshots/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-snapshots/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 2: Board Lanes ────────────────────────────────────────────
router.post('/board-lanes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/board-lanes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/board-lanes/by-key/:laneKey', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ laneKey: req.params.laneKey }));
});

router.get('/board-lanes/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ status: req.params.status }));
});

router.get('/board-lanes/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-lanes/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-lanes/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-lanes/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/board-lanes/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 3: Board Cards ─────────────────────────────────────────────
router.post('/board-cards', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/board-cards', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/board-cards/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ studentRef: req.params.studentRef }));
});

router.get('/board-cards/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/board-cards/by-key/:laneKey', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ laneKey: req.params.laneKey }));
});

router.get('/board-cards/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ status: req.params.status }));
});

router.get('/board-cards/by-priority/:priority', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ priority: req.params.priority }));
});

router.get('/board-cards/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-cards/:id/ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-cards/:id/needs-teacher-review', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-cards/:id/needs-admin-review', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-cards/:id/risk-flagged', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-cards/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/board-cards/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 4: Filter Presets ─────────────────────────────────────────
router.post('/filter-presets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/filter-presets', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/filter-presets/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ actorId: req.params.actorId }));
});

router.get('/filter-presets/by-role/:role', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ role: req.params.role }));
});

router.get('/filter-presets/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.put('/filter-presets/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id, body: req.body }));
});

router.post('/filter-presets/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/filter-presets/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 5: Risk Signals ───────────────────────────────────────────
router.post('/risk-signals', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/risk-signals', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/risk-signals/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ studentRef: req.params.studentRef }));
});

router.get('/risk-signals/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/risk-signals/by-level/:riskLevel', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ riskLevel: req.params.riskLevel }));
});

router.get('/risk-signals/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/risk-signals/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/risk-signals/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/risk-signals/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/risk-signals/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 6: Board Blockers ─────────────────────────────────────────
router.post('/board-blockers', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/board-blockers', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/board-blockers/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ studentRef: req.params.studentRef }));
});

router.get('/board-blockers/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/board-blockers/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ status: req.params.status }));
});

router.get('/board-blockers/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-blockers/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-blockers/:id/resolve', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-blockers/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-blockers/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 7: Governance Notes ───────────────────────────────────────
router.post('/governance-notes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/governance-notes', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/governance-notes/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/governance-notes/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ actorId: req.params.actorId }));
});

router.get('/governance-notes/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/governance-notes/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/governance-notes/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/governance-notes/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 8: Role Projections ───────────────────────────────────────
router.post('/role-projections', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/role-projections', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/role-projections/by-role/:role', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ role: req.params.role }));
});

router.get('/role-projections/by-actor/:actorId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ actorId: req.params.actorId }));
});

router.get('/role-projections/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/role-projections/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/role-projections/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/role-projections/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/role-projections/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 9: Teacher Queues ─────────────────────────────────────────
router.post('/teacher-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/teacher-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/teacher-queues/by-teacher/:teacherRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ teacherRef: req.params.teacherRef }));
});

router.get('/teacher-queues/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/teacher-queues/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/teacher-queues/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/teacher-queues/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/teacher-queues/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 10: Admin Queues ──────────────────────────────────────────
router.post('/admin-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/admin-queues', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/admin-queues/by-admin/:adminRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ adminRef: req.params.adminRef }));
});

router.get('/admin-queues/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/admin-queues/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/admin-queues/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/admin-queues/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/admin-queues/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 11: Student Safe Status Drafts ────────────────────────────
router.post('/student-safe-status-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/student-safe-status-drafts/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/student-safe-status-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/student-safe-status-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/student-safe-status-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/student-safe-status-drafts/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/student-safe-status-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 12: Parent Safe Status Drafts ─────────────────────────────
router.post('/parent-safe-status-drafts', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/parent-safe-status-drafts/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/parent-safe-status-drafts/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/parent-safe-status-drafts/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/parent-safe-status-drafts/:id/suppress', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/parent-safe-status-drafts/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/parent-safe-status-drafts/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 13: Refresh Jobs ──────────────────────────────────────────
router.post('/refresh-jobs', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/refresh-jobs', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/refresh-jobs/by-snapshot/:snapshotId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ snapshotId: req.params.snapshotId }));
});

router.get('/refresh-jobs/by-status/:status', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ status: req.params.status }));
});

router.get('/refresh-jobs/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/refresh-jobs/:id/running', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/refresh-jobs/:id/completed', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/refresh-jobs/:id/failed', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/refresh-jobs/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

// ─── GROUP 14: Board Summaries ───────────────────────────────────────
router.post('/board-summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId is required' }); return; }
  sendResponse(res, safeStub({ schoolId, body: req.body }));
});

router.get('/board-summaries', async (req: Request, res: Response) => {
  const schoolId = extractSchoolId(req);
  if (!schoolId) { sendResponse(res, { success: false, message: 'schoolId query param is required' }); return; }
  sendResponse(res, safeStub({ schoolId }));
});

router.get('/board-summaries/by-student/:studentRef', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ studentRef: req.params.studentRef }));
});

router.get('/board-summaries/by-plan/:planId', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ planId: req.params.planId }));
});

router.get('/board-summaries/:id', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-summaries/:id/refresh', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-summaries/:id/stale', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-summaries/:id/review-ready', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

router.post('/board-summaries/:id/block', async (req: Request, res: Response) => {
  const reasonCodes: string[] = req.body?.reasonCodes || [];
  sendResponse(res, safeStub({ id: req.params.id, reasonCodes }));
});

router.post('/board-summaries/:id/void', async (req: Request, res: Response) => {
  sendResponse(res, safeStub({ id: req.params.id }));
});

export default router;
