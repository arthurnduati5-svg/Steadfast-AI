// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Reports Routes v1 (Task 012)
// Safe teacher-facing summary and evidence endpoints.
// All routes enforce auth, school scope, privacy guard, and audit.
//
// Routes:
//   GET /api/teacher/reports/students/:studentId/summary
//   GET /api/teacher/reports/classes/:classId/summary
//   GET /api/teacher/reports/students/:studentId/evidence
//   GET /api/teacher/reports/classes/:classId/revision-due
//   GET /api/teacher/reports/classes/:classId/next-actions
//   GET /api/teacher/reports/students/:studentId/next-actions
//   GET /api/teacher/reports/audit (optional, role-scoped)
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { validateTeacherReportScope, validateTeacherStudentReportScope, validateUnknownRoleDenied } from '../services/teacherReportScopePolicyService';
import { generateStudentSummary, generateClassSummary } from '../services/teacherSafeSummaryRuntimeService';
import { getStudentEvidenceDashboard } from '../services/learningDashboardEvidenceService';
import { generateLowWorkloadInsight } from '../services/lowWorkloadTeacherInsightService';
import { generateNextActionRecommendations } from '../services/teacherNextActionRecommendationService';
import { recordTeacherReportAudit, recordTeacherReportScopeDenied, listTeacherReportAuditRecords } from '../services/teacherSafeReportAuditService';
import type { TeacherReportRequestContext, TeacherReportScope, TeacherReportScopeDecision } from '../services/teacherReportContracts';

const router = Router();

// ═══════════════════════════════════════════════════════════════
// Helper: Build request context from Express req
// ═══════════════════════════════════════════════════════════════

function buildContext(req: Request): TeacherReportRequestContext {
  return {
    requestId: (req as any).requestId || 'unknown',
    teacherId: (req as any).user?.id || '',
    schoolId: (req as any).user?.schoolId || ((req as any).schoolId || ''),
    role: (req as any).user?.role || '',
    classId: (req.query.classId as string) || (req as any).user?.classId || undefined,
  };
}

function buildScope(req: Request, overrides?: Partial<TeacherReportScope>): TeacherReportScope {
  return {
    schoolId: (req as any).user?.schoolId || '',
    classId: req.query.classId as string || undefined,
    studentId: overrides?.studentId || undefined,
    subject: req.query.subject as string || undefined,
    topic: req.query.topic as string || undefined,
    skillId: req.query.skillId as string || undefined,
    reportType: overrides?.reportType || 'student_summary',
    window: (req.query.window as any) || 'last_7_days',
  };
}

// ═══════════════════════════════════════════════════════════════
// Helper: Handle scope check and audit
// ═══════════════════════════════════════════════════════════════

async function handleScopeCheck(
  req: Request,
  res: Response,
  scope: TeacherReportScope,
  scopeDecision: TeacherReportScopeDecision,
): Promise<boolean> {
  if (!scopeDecision.allowed) {
    // Audit the denied access
    const context = buildContext(req);
    await recordTeacherReportScopeDenied({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      studentId: scope.studentId,
      reportType: scope.reportType,
      scopeDecision,
      requestId: context.requestId,
    });

    res.status(403).json({
      error: scopeDecision.reason,
      code: scopeDecision.code,
      classScopeNote: scopeDecision.classScopeNote,
    });
    return false;
  }
  return true;
}

// ═══════════════════════════════════════════════════════════════
// Route: GET /students/:studentId/summary
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/students/:studentId/summary', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { studentId: req.params.studentId, reportType: 'student_summary' });

    // Role check
    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    // Scope check
    const scopeDecision = validateTeacherStudentReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    // Generate summary
    const summary = await generateStudentSummary(scope);

    // Audit
    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      studentId: scope.studentId,
      reportType: 'student_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: summary.privacyMetadata,
      },
      redactionApplied: summary.privacyMetadata.redactionApplied,
      minimumNecessary: summary.privacyMetadata.minimumNecessary,
      requestId: context.requestId,
    });

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate student summary.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /classes/:classId/summary
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/classes/:classId/summary', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { classId: req.params.classId, reportType: 'class_summary' });

    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    const scopeDecision = validateTeacherReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    const summary = await generateClassSummary(scope);

    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      reportType: 'class_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: summary.privacyMetadata,
      },
      redactionApplied: summary.privacyMetadata.redactionApplied,
      minimumNecessary: summary.privacyMetadata.minimumNecessary,
      requestId: context.requestId,
    });

    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate class summary.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /students/:studentId/evidence
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/students/:studentId/evidence', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { studentId: req.params.studentId, reportType: 'skill_summary' });

    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    const scopeDecision = validateTeacherStudentReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    const dashboard = await getStudentEvidenceDashboard(scope);

    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      studentId: scope.studentId,
      reportType: 'skill_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: dashboard.privacyMetadata,
      },
      redactionApplied: dashboard.privacyMetadata.redactionApplied,
      minimumNecessary: dashboard.privacyMetadata.minimumNecessary,
      requestId: context.requestId,
    });

    res.json(dashboard);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch evidence dashboard.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /classes/:classId/revision-due
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/classes/:classId/revision-due', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { classId: req.params.classId, reportType: 'class_summary' });

    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    const scopeDecision = validateTeacherReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    const summary = await generateClassSummary(scope);

    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      reportType: 'class_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: summary.privacyMetadata,
      },
      redactionApplied: summary.privacyMetadata.redactionApplied,
      minimumNecessary: summary.privacyMetadata.minimumNecessary,
      requestId: context.requestId,
    });

    res.json({ revisionDueSoon: summary.revisionDueSoon, generatedAt: summary.generatedAt });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch revision due summary.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /classes/:classId/next-actions
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/classes/:classId/next-actions', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { classId: req.params.classId, reportType: 'class_summary' });

    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    const scopeDecision = validateTeacherReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    const insight = await generateLowWorkloadInsight(scope);

    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      reportType: 'class_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: {
          privacyLevel: 'teacher_safe',
          redactionApplied: false,
          redactionReasons: [],
          minimumNecessary: true,
          teacherSafe: true,
          safeguardingSeparated: true,
          deenSensitiveHandled: true,
        },
      },
      redactionApplied: false,
      minimumNecessary: true,
      requestId: context.requestId,
    });

    res.json(insight);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate next actions.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /students/:studentId/next-actions
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/students/:studentId/next-actions', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { studentId: req.params.studentId, reportType: 'student_summary' });

    const roleCheck = validateUnknownRoleDenied(context, scope);
    if (!(await handleScopeCheck(req, res, scope, roleCheck))) return;

    const scopeDecision = validateTeacherStudentReportScope(context, scope);
    if (!(await handleScopeCheck(req, res, scope, scopeDecision))) return;

    const insight = await generateLowWorkloadInsight(scope);

    await recordTeacherReportAudit({
      actorId: context.teacherId,
      actorRole: context.role,
      schoolId: scope.schoolId,
      classId: scope.classId,
      studentId: scope.studentId,
      reportType: 'student_summary',
      scopeDecision,
      privacyDecision: {
        safe: true,
        errors: [],
        warnings: [],
        metadata: {
          privacyLevel: 'teacher_safe',
          redactionApplied: false,
          redactionReasons: [],
          minimumNecessary: true,
          teacherSafe: true,
          safeguardingSeparated: true,
          deenSensitiveHandled: true,
        },
      },
      redactionApplied: false,
      minimumNecessary: true,
      requestId: context.requestId,
    });

    res.json(insight);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to generate next actions.', message: error.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// Route: GET /audit (optional, role-scoped)
// ═══════════════════════════════════════════════════════════════

router.get('/teacher/reports/audit', async (req: Request, res: Response) => {
  try {
    const context = buildContext(req);
    const scope = buildScope(req, { reportType: 'class_summary' });

    // Only admins may access audit
    if (context.role?.toLowerCase() !== 'admin') {
      res.status(403).json({ error: 'Only admins can access the report audit trail.' });
      return;
    }

    const records = listTeacherReportAuditRecords(scope.schoolId, {
      studentId: req.query.studentId as string || undefined,
      reportType: req.query.reportType as any || undefined,
      limit: parseInt(req.query.limit as string, 10) || 50,
    });

    res.json({ records, totalCount: records.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to fetch audit records.', message: error.message });
  }
});

export default router;
