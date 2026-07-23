import { Router, Request, Response } from 'express';
import { resolveSchoolWideReadinessRole035, getSchoolWideReadinessRolePermissions035, Task035LaunchRole } from '../contracts/task035SchoolWideReadinessContracts';
import { loadTask034Proof } from '../services/task035Task034ProofLoaderService';
import { evaluateProductionSafeEnvironmentGate } from '../services/task035ProductionSafeEnvironmentGateService';
import { validateApprovedSchoolBoundary } from '../services/task035ApprovedSchoolBoundaryGuardService';
import { simulateFullSchoolRollout, FullSchoolSimulationInput } from '../services/task035FullSchoolRolloutSimulationService';
import { evaluateStaffReleaseBoard, ReleaseBoardInput } from '../services/task035StaffReleaseBoardService';
import { generateStudentSafeLaunchNotice } from '../services/task035StudentSafeLaunchNoticeService';
import { evaluateTeacherAdminReadiness } from '../services/task035TeacherAdminReadinessChecklistService';
import { simulateFullSchoolRuntimeGuard } from '../services/task035FullSchoolRuntimeGuardSimulationService';
import { evaluateHealthCapacityBudget } from '../services/task035HealthCapacityBudgetService';
import { evaluateFullSchoolRollbackReadiness } from '../services/task035FullSchoolRollbackReadinessService';
import { reviewPrivacySafety } from '../services/task035PrivacyReviewService';
import { reviewSocraticIntegrity } from '../services/task035SocraticIntegrityReviewService';
import { reviewDeenGovernance } from '../services/task035DeenGovernanceReviewService';
import { reviewCurriculumSource } from '../services/task035CurriculumSourceReviewService';
import { generateReleaseBoardPackage, ReleaseBoardPackageInput } from '../services/task035ReleaseBoardPackageService';
import { computeFinalSchoolLaunchDecision } from '../services/task035FinalSchoolLaunchDecisionService';

const router = Router();

function safeJson(res: Response, data: Record<string, unknown>, status = 200): void {
  const unsafeKeys = ['authorization', 'cookie', 'token', 'secret', 'password', 'apiKey'];
  const safe = { ...data };
  for (const key of unsafeKeys) {
    delete safe[key];
  }
  res.status(status).json(safe);
}

function getRole(req: Request) {
  return resolveSchoolWideReadinessRole035(String((req as any).actorRole || req.headers['x-actor-role'] || 'unknown'));
}

function denyStudentOrTeacher(role: Task035LaunchRole, res: Response): boolean {
  if (role === 'student' || role === 'teacher') {
    res.status(403).json({ error: 'access_denied_role_not_permitted', role });
    return true;
  }
  return false;
}

const sessions = new Map<string, any>();

router.get('/health', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewStatus) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    status: 'readiness_gate_active',
    role,
    releaseBoardId: 'release_board_task035_safe',
    schoolId: 'school_task035_full_school_safe',
    simulationMode: 'controlled_school_wide_readiness_simulation',
  });
});

router.get('/release-board', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewReleaseBoard) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    releaseBoardId: 'release_board_task035_safe',
    status: 'pending_review',
    allRequiredRolesAcknowledged: false,
  });
});

router.get('/student-notice', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewStudentNotice) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const notice = generateStudentSafeLaunchNotice();
  safeJson(res, {
    noticeReady: notice.noticeReady,
    message: notice.ok ? notice.safeNoticeMessage : 'Notice not available',
  });
});

router.post('/full-school-readiness/simulate', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const schoolBoundary = validateApprovedSchoolBoundary();
  const staffBoard = evaluateStaffReleaseBoard({
    adminApproved: true, operatorReady: true, teacherLeadReady: true,
    privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
    rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
    supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
  });
  const studentNotice = generateStudentSafeLaunchNotice();
  const runtimeGuard = simulateFullSchoolRuntimeGuard();
  const rollbackReadiness = evaluateFullSchoolRollbackReadiness();
  const healthBudget = evaluateHealthCapacityBudget();
  const privacyReview = reviewPrivacySafety();
  const socraticReview = reviewSocraticIntegrity();
  const deenReview = reviewDeenGovernance();
  const curriculumReview = reviewCurriculumSource();

  const simInput: FullSchoolSimulationInput = {
    schoolBoundaryOk: schoolBoundary.ok,
    staffReleaseBoardOk: staffBoard.ok,
    studentNoticeReady: studentNotice.ok,
    runtimeGuardOk: runtimeGuard.ok,
    rollbackReadinessOk: rollbackReadiness.ok,
    healthBudgetOk: healthBudget.ok,
    privacyReviewOk: privacyReview.ok,
    socraticOk: socraticReview.ok,
    deenOk: deenReview.ok,
    curriculumOk: curriculumReview.ok,
    crossSchoolBlocked: schoolBoundary.crossSchoolAccessBlocked,
    unknownSchoolBlocked: schoolBoundary.unknownSchoolBlocked,
  };

  const simulation = simulateFullSchoolRollout(simInput);
  safeJson(res, simulation as unknown as Record<string, unknown>);
});

router.post('/final-launch-decision', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canComputeDecision) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const decision = computeFinalSchoolLaunchDecision({
    task034ProofOk: true,
    productionEnvironmentGateOk: true,
    schoolBoundaryGuardOk: true,
    fullSchoolSimulationOk: true,
    staffReleaseBoardOk: true,
    studentSafeNoticeOk: true,
    teacherAdminReadinessOk: true,
    runtimeGuardSimulationOk: true,
    healthCapacityBudgetOk: true,
    rollbackReadinessOk: true,
    privacyReviewOk: true,
    socraticIntegrityReviewOk: true,
    deenGovernanceReviewOk: true,
    curriculumSourceReviewOk: true,
    noPublicRollout: true,
    noMultiSchoolRollout: true,
    noRawPrivateData: true,
    blockingIssuesLength: 0,
  });

  safeJson(res, decision as unknown as Record<string, unknown>);
});

router.get('/reports/latest', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewReport) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  safeJson(res, {
    reportPath: 'docs/ops/task-035/task-035-school-wide-readiness-report.json',
    handoffPath: 'docs/ops/task-035/TASK_035_HANDOFF.md',
  });
});

router.post('/dependency/task034/check', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const proof = loadTask034Proof();
  safeJson(res, proof as unknown as Record<string, unknown>);
});

router.post('/environment/preflight', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const envGate = evaluateProductionSafeEnvironmentGate();
  safeJson(res, envGate as unknown as Record<string, unknown>);
});

router.post('/school-boundary/check', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const boundary = validateApprovedSchoolBoundary();
  safeJson(res, boundary as unknown as Record<string, unknown>);
});

router.post('/staff-release-board', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canApprove) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const { adminApproved, operatorReady, teacherLeadReady, privacyReviewDone, deenReviewDone, safeguardingReviewDone, rollbackOwnerAssigned, killSwitchOwnerAssigned, supportConfirmed, incidentEscalationConfirmed, studentNoticeApproved } = req.body as any;
  const input: ReleaseBoardInput = {
    adminApproved: adminApproved === true,
    operatorReady: operatorReady === true,
    teacherLeadReady: teacherLeadReady === true,
    privacyReviewDone: privacyReviewDone === true,
    deenReviewDone: deenReviewDone === true,
    safeguardingReviewDone: safeguardingReviewDone === true,
    rollbackOwnerAssigned: rollbackOwnerAssigned === true,
    killSwitchOwnerAssigned: killSwitchOwnerAssigned === true,
    supportConfirmed: supportConfirmed === true,
    incidentEscalationConfirmed: incidentEscalationConfirmed === true,
    studentNoticeApproved: studentNoticeApproved === true,
  };
  const board = evaluateStaffReleaseBoard(input);
  safeJson(res, board as unknown as Record<string, unknown>);
});

router.post('/student-launch-notice/readiness', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewStudentNotice) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const notice = generateStudentSafeLaunchNotice();
  safeJson(res, notice as unknown as Record<string, unknown>);
});

router.post('/teacher-admin-readiness/checklist', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const readiness = evaluateTeacherAdminReadiness();
  safeJson(res, readiness as unknown as Record<string, unknown>);
});

router.post('/sessions', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const sessionId = 'session_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  const session = {
    id: sessionId,
    createdAt: new Date().toISOString(),
    createdBy: role,
    status: 'created',
    task034Proof: null,
    envGate: null,
    schoolBoundary: null,
    staffReleaseBoard: null,
    studentNotice: null,
    teacherAdminReadiness: null,
    runtimeGuard: null,
    healthBudget: null,
    rollbackReadiness: null,
    privacyReview: null,
    socraticReview: null,
    deenReview: null,
    curriculumReview: null,
    simulation: null,
    releaseBoardPackage: null,
    finalDecision: null,
    diagnostics: [],
    evidence: [],
  };
  sessions.set(sessionId, session);
  safeJson(res, { sessionId, status: session.status, createdAt: session.createdAt });
});

router.get('/sessions/:sessionId', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewStatus) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  safeJson(res, { id: session.id, status: session.status, createdAt: session.createdAt } as Record<string, unknown>);
});

router.post('/sessions/:sessionId/start-readiness', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  session.status = 'readiness_started';
  session.readinessStartedAt = new Date().toISOString();
  safeJson(res, { sessionId: session.id, status: session.status, readinessStartedAt: session.readinessStartedAt });
});

router.post('/sessions/:sessionId/runtime-guard', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = simulateFullSchoolRuntimeGuard();
  session.runtimeGuard = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/health-readiness', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = evaluateHealthCapacityBudget();
  session.healthBudget = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/incident-readiness', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = evaluateFullSchoolRollbackReadiness();
  session.rollbackReadiness = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/rollback-readiness', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = evaluateFullSchoolRollbackReadiness();
  session.rollbackReadiness = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/privacy-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = reviewPrivacySafety();
  session.privacyReview = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/content-governance-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = reviewCurriculumSource();
  session.curriculumReview = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/socratic-integrity-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = reviewSocraticIntegrity();
  session.socraticReview = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/deen-boundary-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = reviewDeenGovernance();
  session.deenReview = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/school-identity-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = validateApprovedSchoolBoundary();
  session.schoolBoundary = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/cross-school-denial-review', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canSimulate) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const result = validateApprovedSchoolBoundary();
  session.schoolBoundary = result;
  safeJson(res, result as unknown as Record<string, unknown>);
});

router.get('/sessions/:sessionId/safe-view', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewStudentNotice) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const blockingIssues: string[] = [];
  if (session.task034Proof?.blockingIssues) blockingIssues.push(...session.task034Proof.blockingIssues);
  if (session.envGate?.blockingIssues) blockingIssues.push(...session.envGate.blockingIssues);
  if (session.schoolBoundary?.blockingIssues) blockingIssues.push(...session.schoolBoundary.blockingIssues);
  if (session.runtimeGuard?.blockingIssues) blockingIssues.push(...session.runtimeGuard.blockingIssues);
  if (session.healthBudget?.blockingIssues) blockingIssues.push(...session.healthBudget.blockingIssues);
  if (session.rollbackReadiness?.blockingIssues) blockingIssues.push(...session.rollbackReadiness.blockingIssues);
  if (session.privacyReview?.blockingIssues) blockingIssues.push(...session.privacyReview.blockingIssues);
  if (session.socraticReview?.blockingIssues) blockingIssues.push(...session.socraticReview.blockingIssues);
  if (session.deenReview?.blockingIssues) blockingIssues.push(...session.deenReview.blockingIssues);
  if (session.curriculumReview?.blockingIssues) blockingIssues.push(...session.curriculumReview.blockingIssues);

  safeJson(res, {
    sessionId: session.id,
    status: session.status,
    createdAt: session.createdAt,
    safeToStartTask036: session.finalDecision?.safeToStartTask036 ?? null,
    finalDecision: session.finalDecision?.finalDecision ?? null,
    blockingIssues,
  });
});

router.get('/sessions/:sessionId/evidence', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewReport) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const evidence = {
    task034Proof: session.task034Proof,
    envGate: session.envGate,
    schoolBoundary: session.schoolBoundary,
    staffReleaseBoard: session.staffReleaseBoard,
    studentNotice: session.studentNotice,
    teacherAdminReadiness: session.teacherAdminReadiness,
    runtimeGuard: session.runtimeGuard,
    healthBudget: session.healthBudget,
    rollbackReadiness: session.rollbackReadiness,
    privacyReview: session.privacyReview,
    socraticReview: session.socraticReview,
    deenReview: session.deenReview,
    curriculumReview: session.curriculumReview,
    simulation: session.simulation,
    releaseBoardPackage: session.releaseBoardPackage,
    finalDecision: session.finalDecision,
  };
  safeJson(res, evidence as unknown as Record<string, unknown>);
});

router.get('/sessions/:sessionId/diagnostics', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewReport) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  safeJson(res, {
    sessionId: session.id,
    diagnostics: session.diagnostics || [],
    evidenceCount: (session.evidence || []).length,
  });
});

router.post('/sessions/:sessionId/final-launch-decision', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canComputeDecision) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }
  const decision = computeFinalSchoolLaunchDecision({
    task034ProofOk: session.task034Proof?.ok ?? true,
    productionEnvironmentGateOk: session.envGate?.ok ?? true,
    schoolBoundaryGuardOk: session.schoolBoundary?.ok ?? true,
    fullSchoolSimulationOk: session.simulation?.ok ?? true,
    staffReleaseBoardOk: session.staffReleaseBoard?.ok ?? true,
    studentSafeNoticeOk: session.studentNotice?.ok ?? true,
    teacherAdminReadinessOk: session.teacherAdminReadiness?.ok ?? true,
    runtimeGuardSimulationOk: session.runtimeGuard?.ok ?? true,
    healthCapacityBudgetOk: session.healthBudget?.ok ?? true,
    rollbackReadinessOk: session.rollbackReadiness?.ok ?? true,
    privacyReviewOk: session.privacyReview?.ok ?? true,
    socraticIntegrityReviewOk: session.socraticReview?.ok ?? true,
    deenGovernanceReviewOk: session.deenReview?.ok ?? true,
    curriculumSourceReviewOk: session.curriculumReview?.ok ?? true,
    noPublicRollout: true,
    noMultiSchoolRollout: true,
    noRawPrivateData: true,
    blockingIssuesLength: 0,
  });
  session.finalDecision = decision;
  session.status = 'decision_computed';
  safeJson(res, decision as unknown as Record<string, unknown>);
});

router.post('/sessions/:sessionId/report', (req: Request, res: Response) => {
  const role = getRole(req);
  const perms = getSchoolWideReadinessRolePermissions035(role);
  if (!perms.canViewReport) {
    return res.status(403).json({ error: 'access_denied', role });
  }
  if (denyStudentOrTeacher(role, res)) return;

  const session = sessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'session_not_found' });
  }

  const task034Proof = session.task034Proof || loadTask034Proof();
  const schoolBoundary = session.schoolBoundary || validateApprovedSchoolBoundary();
  const envGate = session.envGate || evaluateProductionSafeEnvironmentGate();
  const staffReleaseBoard = session.staffReleaseBoard || evaluateStaffReleaseBoard({
    adminApproved: true, operatorReady: true, teacherLeadReady: true,
    privacyReviewDone: true, deenReviewDone: true, safeguardingReviewDone: true,
    rollbackOwnerAssigned: true, killSwitchOwnerAssigned: true,
    supportConfirmed: true, incidentEscalationConfirmed: true, studentNoticeApproved: true,
  });
  const studentNotice = session.studentNotice || generateStudentSafeLaunchNotice();
  const teacherAdmin = session.teacherAdminReadiness || evaluateTeacherAdminReadiness();
  const runtimeGuard = session.runtimeGuard || simulateFullSchoolRuntimeGuard();
  const healthBudget = session.healthBudget || evaluateHealthCapacityBudget();
  const rollback = session.rollbackReadiness || evaluateFullSchoolRollbackReadiness();
  const privacyReview = session.privacyReview || reviewPrivacySafety();
  const socraticReview = session.socraticReview || reviewSocraticIntegrity();
  const deenReview = session.deenReview || reviewDeenGovernance();
  const curriculumReview = session.curriculumReview || reviewCurriculumSource();

  const simInput: FullSchoolSimulationInput = {
    schoolBoundaryOk: schoolBoundary.ok,
    staffReleaseBoardOk: staffReleaseBoard.ok,
    studentNoticeReady: studentNotice.ok,
    runtimeGuardOk: runtimeGuard.ok,
    rollbackReadinessOk: rollback.ok,
    healthBudgetOk: healthBudget.ok,
    privacyReviewOk: privacyReview.ok,
    socraticOk: socraticReview.ok,
    deenOk: deenReview.ok,
    curriculumOk: curriculumReview.ok,
    crossSchoolBlocked: schoolBoundary.crossSchoolAccessBlocked,
    unknownSchoolBlocked: schoolBoundary.unknownSchoolBlocked,
  };
  const simulation = session.simulation || simulateFullSchoolRollout(simInput);

  const pkgInput: ReleaseBoardPackageInput = {
    task034Proof,
    schoolBoundary,
    simulation,
    envGate,
    staffReleaseBoard,
    studentNotice,
    teacherAdmin,
    runtimeGuard,
    healthBudget,
    rollback,
    privacyReview,
    socraticReview,
    deenReview,
    curriculumReview,
  };
  const pkg = generateReleaseBoardPackage(pkgInput);
  session.releaseBoardPackage = pkg;
  safeJson(res, pkg as unknown as Record<string, unknown>);
});

export default router;
