// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Privacy & Governance API Routes
// Security, privacy, data governance, and compliance hardening routes.
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { dataClassificationRegistryService } from '../services/task020DataClassificationRegistryService';
import { roleAccessMatrixService } from '../services/task020RoleAccessMatrixService';
import { privacyBoundaryEnforcementService } from '../services/task020PrivacyBoundaryEnforcementService';
import { piiMinimizationService } from '../services/task020PiiMinimizationService';
import { teacherVisibilityPolicyService } from '../services/task020TeacherVisibilityPolicyService';
import { safeguardingAccessSeparationService } from '../services/task020SafeguardingAccessSeparationService';
import { deenSensitiveDataBoundaryService } from '../services/task020DeenSensitiveDataBoundaryService';
import { dataRetentionGovernanceService } from '../services/task020DataRetentionGovernanceService';
import { dataExportGovernanceService } from '../services/task020DataExportGovernanceService';
import { dataDeletionGovernanceService } from '../services/task020DataDeletionGovernanceService';
import { aiEgressPrivacyGuardService } from '../services/task020AiEgressPrivacyGuardService';
import { securityConfigValidationService } from '../services/task020SecurityConfigValidationService';
import { governanceAuditService } from '../services/task020GovernanceAuditService';
import { privacyGovernanceRuntime } from '../services/task020PrivacyGovernanceRuntime';
import type { TutorRole, DataCategory } from '../contracts/task020GovernanceContracts';

const router = Router();

function getReqActor(req: Request): { id: string; role: string; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: (req as any).user?.role || 'unknown',
    schoolId: (req as any).schoolId,
  };
}

const ADMIN_INTERNAL_ROLES = ['school_admin', 'system_admin', 'internal_operator'];

function requireAdminInternal(req: Request, res: Response): boolean {
  const actor = getReqActor(req);
  if (!ADMIN_INTERNAL_ROLES.includes(actor.role)) {
    res.status(403).json({
      success: false,
      message: 'Forbidden. Admin/internal role required.',
      role: actor.role,
    });
    return false;
  }
  return true;
}

// ─── GET /api/governance/data-classification ────────────────
router.get('/data-classification', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const summaries = dataClassificationRegistryService.getAllSummaries();
    res.json({
      success: true,
      count: summaries.length,
      classifications: summaries,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve data classification registry.' });
  }
});

// ─── GET /api/governance/role-access-matrix ─────────────────
router.get('/role-access-matrix', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const entries = roleAccessMatrixService.getAllEntries();
    res.json({
      success: true,
      count: entries.length,
      entries: entries.map(e => ({
        role: e.role,
        category: e.category,
        canRead: e.canRead,
        canWrite: e.canWrite,
        canUpdate: e.canUpdate,
        canDelete: e.canDelete,
        canExport: e.canExport,
        canDiagnose: e.canDiagnose,
        canAudit: e.canAudit,
        canSafeguardingReview: e.canSafeguardingReview,
        scopeLimit: e.scopeLimit,
        notes: e.notes,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve role access matrix.' });
  }
});

// ─── POST /api/governance/privacy/check ─────────────────────
router.post('/privacy/check', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const { resourceCategory, action, targetTutorLearnerId, context } = req.body || {};
    const actor = getReqActor(req);

    if (!resourceCategory || !action) {
      return res.status(400).json({ success: false, message: 'resourceCategory and action are required.' });
    }

    if (!dataClassificationRegistryService.isKnownCategory(resourceCategory)) {
      return res.status(400).json({ success: false, message: `Unknown resource category: ${resourceCategory}` });
    }

    const role = normalizeTutorRole(actor.role);
    const decision = privacyBoundaryEnforcementService.enforcePrivacy({
      role,
      schoolId: actor.schoolId || '',
      resourceCategory: resourceCategory as DataCategory,
      action: action as any,
      payloadFields: context ? Object.keys(context) : [],
      context: context || {},
    });

    res.json({
      success: true,
      decision: {
        allowed: decision.allowed,
        blocked: decision.blocked,
        redactionApplied: decision.redactionApplied,
        safeFieldCount: decision.safeFields.length,
        removedFieldCount: decision.removedFields.length,
        removedFields: decision.removedFields,
        reasonCodes: decision.reasonCodes,
        privacyMetadata: decision.privacyMetadata,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Privacy check failed.' });
  }
});

// ─── POST /api/governance/data-export/plan ──────────────────
router.post('/data-export/plan', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const { targetLearnerId, exportType } = req.body || {};
    const actor = getReqActor(req);

    const plan = dataExportGovernanceService.createExportPlan({
      requesterRole: normalizeTutorRole(actor.role),
      targetLearnerId: targetLearnerId || undefined,
      schoolId: actor.schoolId || 'default',
      exportType: exportType || 'school_admin',
    });

    res.json({
      success: true,
      dryRunOnly: true,
      plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Export plan creation failed.' });
  }
});

// ─── POST /api/governance/data-deletion/plan ────────────────
router.post('/data-deletion/plan', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const { targetLearnerId, deletionType } = req.body || {};
    const actor = getReqActor(req);

    const plan = dataDeletionGovernanceService.createDeletionPlan({
      requesterRole: normalizeTutorRole(actor.role),
      targetLearnerId: targetLearnerId || undefined,
      schoolId: actor.schoolId || 'default',
      deletionType: deletionType || 'school_admin',
    });

    res.json({
      success: true,
      dryRunOnly: true,
      plan,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Deletion plan creation failed.' });
  }
});

// ─── GET /api/governance/retention/summary ──────────────────
router.get('/retention/summary', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const summary = dataRetentionGovernanceService.getRetentionSummary();
    res.json({
      success: true,
      categories: summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve retention summary.' });
  }
});

// ─── GET /api/governance/security/config-check ──────────────
router.get('/security/config-check', (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const result = securityConfigValidationService.validateAll();
    res.json({
      success: true,
      status: result.status,
      checks: result.checks.map(c => ({
        checkName: c.checkName,
        status: c.status,
        safeMessage: c.safeMessage,
        required: c.required,
      })),
      safeWarnings: result.safeWarnings,
      safeErrors: result.safeErrors,
      createdAt: result.createdAt,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Security config check failed.' });
  }
});

// ─── GET /api/governance/audit/summary ──────────────────────
router.get('/audit/summary', async (req: Request, res: Response) => {
  if (!requireAdminInternal(req, res)) return;
  try {
    const summary = governanceAuditService.getAuditSummary();
    res.json({
      success: true,
      totalEvents: summary.totalEvents,
      eventTypeCounts: summary.eventTypeCounts,
      roleCounts: summary.roleCounts,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit summary.' });
  }
});

// ─── GET /api/learner/privacy/summary ───────────────────────
router.get('/privacy/learner-summary', (req: Request, res: Response) => {
  try {
    const summary = {
      tutorRemembers: [
        'Topics and skills you practice',
        'Your preferred support level',
        'Summary of what you have learned',
        'Your mastery progress in each topic',
      ],
      teacherCanSee: [
        'Topics you have practiced',
        'Skills that may need support',
        'Your progress summaries',
        'General misconceptions',
        'Recommended next steps',
      ],
      teacherCannotSee: [
        'Your private chat messages',
        'Your personal thoughts or feelings',
        'Your religious questions or doubts',
        'Your private memory summaries',
        'Detailed AI responses you received',
      ],
      safeguardingBoundary: 'Serious safety concerns (self-harm, abuse, threats) are handled separately and only shared with authorized safeguarding staff.',
      deenBoundary: 'Your Islamic studies and religious questions are handled respectfully. Private religious doubts are not shared with teachers or in reports.',
      dataRetainedDays: 'Learning evidence is retained for the current academic year plus one additional year.',
      exportAvailable: true,
      deletionAvailable: true,
    };

    res.json({
      success: true,
      summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve privacy summary.' });
  }
});

function normalizeTutorRole(role: string): TutorRole {
  const r = (role || '').trim().toLowerCase();
  if (r === 'student' || r === 'learner') return 'learner';
  if (r === 'teacher') return 'teacher';
  if (r === 'admin' || r === 'school_admin') return 'school_admin';
  if (r === 'safeguarding_officer' || r === 'counselor') return 'safeguarding_officer';
  if (r === 'system_admin') return 'system_admin';
  if (r === 'internal_operator') return 'internal_operator';
  return 'unknown';
}

export default router;
