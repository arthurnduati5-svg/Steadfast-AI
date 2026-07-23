import { Router, Request, Response } from 'express';
import { dataClassificationRegistryService as task020DataClassificationRegistryService } from '../services/task020DataClassificationRegistryService';
import { roleAccessMatrixService as task020RoleAccessMatrixService } from '../services/task020RoleAccessMatrixService';
import { privacyBoundaryEnforcementService as task020PrivacyBoundaryEnforcementService } from '../services/task020PrivacyBoundaryEnforcementService';
import { aiEgressPrivacyGuardService as task020AiEgressPrivacyGuardService } from '../services/task020AiEgressPrivacyGuardService';
import { task020RetentionPolicyService } from '../services/task020RetentionPolicyService';
import { task020ExportRequestFoundationService } from '../services/task020ExportRequestFoundationService';
import { task020DeleteRequestFoundationService } from '../services/task020DeleteRequestFoundationService';
import { teacherVisibilityPolicyService as task020TeacherVisibilityPolicyService } from '../services/task020TeacherVisibilityPolicyService';
import { safeguardingAccessSeparationService as task020SafeguardingAccessSeparationService } from '../services/task020SafeguardingAccessSeparationService';
import { deenSensitiveDataBoundaryService as task020DeenSensitiveDataBoundaryService } from '../services/task020DeenSensitiveDataBoundaryService';
import { securityConfigValidationService as task020SecurityConfigValidationService } from '../services/task020SecurityConfigValidationService';
import { governanceAuditService as task020GovernanceAuditService } from '../services/task020GovernanceAuditService';
import { rejectForbiddenTask020PayloadFields, validateTask020GovernanceContext } from '../lib/task020SecurityPrivacyGovernanceValidation';
import type { Task020ActorRole, Task020DataCategory } from '../contracts/task020SecurityPrivacyGovernanceContracts';

const router = Router();

const ADMIN_ROLES: Task020ActorRole[] = ['admin', 'internal', 'safeguarding_staff'];
const LEARNER_ROLES: Task020ActorRole[] = ['student', 'learner'];
const PARENT_ROLES: Task020ActorRole[] = ['parent', 'guardian'];

function getActor(req: Request): { id: string; role: string; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: (req as any).user?.role || 'unknown',
    schoolId: (req as any).schoolId,
  };
}

function roleCheck(res: Response, role: string, allowed: string[]): boolean {
  const normalized = role.toLowerCase();
  if (!allowed.includes(normalized)) {
    res.status(403).json({ success: false, message: 'Forbidden: insufficient role.', role });
    return false;
  }
  return true;
}

function denyAnonymous(actor: { id: string; role: string }, res: Response): boolean {
  if (actor.role === 'anonymous' || actor.role === 'unknown') {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return false;
  }
  return true;
}

function checkPayload(req: Request, res: Response): boolean {
  const { valid, forbiddenFields } = rejectForbiddenTask020PayloadFields(req.body || {});
  if (!valid) {
    res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', forbiddenFields });
    return false;
  }
  return true;
}

router.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', service: 'task020-security-privacy-governance', timestamp: new Date().toISOString() });
});

router.post('/classify', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const { category } = req.body || {};
    if (!category) {
      return res.status(400).json({ success: false, message: 'category is required.' });
    }
    if (!task020DataClassificationRegistryService.isKnownCategory(category)) {
      return res.status(400).json({ success: false, message: `Unknown category: ${category}` });
    }
    const classification = task020DataClassificationRegistryService.getClassification(category);
    const summary = task020DataClassificationRegistryService.getSummary(category);
    res.json({ success: true, classification, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Classification failed.' });
  }
});

router.post('/access/decide', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { resourceCategory, requestedAction, targetLearnerId } = req.body || {};
    if (!resourceCategory) {
      return res.status(400).json({ success: false, message: 'resourceCategory is required.' });
    }
    const classification = task020DataClassificationRegistryService.getClassification(resourceCategory);
    if (!classification) {
      return res.status(400).json({ success: false, message: `Unknown resource category: ${resourceCategory}` });
    }
    const entry = task020RoleAccessMatrixService.hasAccess({
      role: normalizeRole(actor.role),
      schoolId: actor.schoolId || '',
      tutorLearnerId: targetLearnerId,
      resourceCategory: resourceCategory,
      resourceOwner: classification.ownerType,
      requestedAction: requestedAction || 'read',
      safeguardingRestricted: classification.safeguardingRestricted,
      deenSensitive: classification.deenSensitive,
      teacherVisible: classification.teacherVisible,
      adminVisible: classification.adminVisible,
      learnerVisible: classification.learnerVisible,
    });
    res.json({ success: true, decision: entry });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Access decision failed.' });
  }
});

router.post('/privacy/enforce', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { resourceCategory, action, context } = req.body || {};
    if (!resourceCategory) {
      return res.status(400).json({ success: false, message: 'resourceCategory is required.' });
    }
    const decision = task020PrivacyBoundaryEnforcementService.enforcePrivacy({
      role: normalizeRole(actor.role),
      schoolId: actor.schoolId || '',
      resourceCategory,
      action: action || 'read',
      payloadFields: context ? Object.keys(context) : [],
      context: context || {},
    });
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Privacy enforcement failed.' });
  }
});

router.post('/ai-egress/decide', (req: Request, res: Response) => {
  if (!roleCheck(res, getActor(req).role, [...ADMIN_ROLES, ...LEARNER_ROLES])) return;
  if (!checkPayload(req, res)) return;
  try {
    const { payloadFields, tutorMode } = req.body || {};
    if (!tutorMode) {
      return res.status(400).json({ success: false, message: 'tutorMode is required.' });
    }
    const decision = task020AiEgressPrivacyGuardService.checkEgress({
      payloadFields: payloadFields || [],
      tutorMode,
      containsTeacherOnlyNotes: !!(req.body?.containsTeacherOnlyNotes),
      containsSafeguardingRaw: !!(req.body?.containsSafeguardingRaw),
      containsPrivateMemory: !!(req.body?.containsPrivateMemory),
      containsAnswerKeys: !!(req.body?.containsAnswerKeys),
      containsDeenSensitive: !!(req.body?.containsDeenSensitive),
      containsDiagnostics: !!(req.body?.containsDiagnostics),
      containsSecrets: !!(req.body?.containsSecrets),
    });
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'AI egress decision failed.' });
  }
});

router.post('/retention/decide', (req: Request, res: Response) => {
  if (!roleCheck(res, getActor(req).role, ADMIN_ROLES)) return;
  if (!checkPayload(req, res)) return;
  try {
    const { category } = req.body || {};
    if (!category) {
      return res.status(400).json({ success: false, message: 'category is required.' });
    }
    const decision = task020RetentionPolicyService.decideRetentionAction(category);
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Retention decision failed.' });
  }
});

router.post('/export/request', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { targetLearnerId, exportType } = req.body || {};
    const request = task020ExportRequestFoundationService.createExportRequest(
      normalizeRole(actor.role),
      actor.schoolId || 'default',
      targetLearnerId,
      exportType || 'learner_self',
    );
    res.json({ success: true, dryRunOnly: true, request: task020ExportRequestFoundationService.buildExportSafeSummary(request) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Export request failed.' });
  }
});

router.post('/delete/request', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { targetLearnerId, deleteType } = req.body || {};
    const request = task020DeleteRequestFoundationService.createDeleteRequest(
      normalizeRole(actor.role),
      actor.schoolId || 'default',
      targetLearnerId,
      deleteType || 'learner_self',
    );
    res.json({ success: true, dryRunOnly: true, request: task020DeleteRequestFoundationService.buildDeleteSafeSummary(request) });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Delete request failed.' });
  }
});

router.post('/teacher-visibility/decide', (req: Request, res: Response) => {
  if (!roleCheck(res, getActor(req).role, ['teacher', ...ADMIN_ROLES])) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { targetLearnerId, resourceCategory, requestedFields } = req.body || {};
    const decision = task020TeacherVisibilityPolicyService.checkVisibility({
      schoolId: actor.schoolId || '',
      studentId: targetLearnerId,
      resourceCategory: resourceCategory || 'teacher_safe_summary',
      requestedFields: requestedFields || ['id', 'summary', 'createdAt'],
    });
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Teacher visibility decision failed.' });
  }
});

router.post('/safeguarding/decide', (req: Request, res: Response) => {
  if (!roleCheck(res, getActor(req).role, ['safeguarding_staff', ...ADMIN_ROLES])) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { triggerType, studentId } = req.body || {};
    const decision = task020SafeguardingAccessSeparationService.checkAccess({
      triggerType: triggerType || 'unknown',
      role: normalizeRole(actor.role),
      schoolId: actor.schoolId || '',
      studentId: studentId,
      context: {},
    });
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Safeguarding decision failed.' });
  }
});

router.post('/deen/decide', (req: Request, res: Response) => {
  if (!denyAnonymous(getActor(req), res)) return;
  if (!checkPayload(req, res)) return;
  try {
    const actor = getActor(req);
    const { contentCategory, targetAudience, containsRawQuestion } = req.body || {};
    const decision = task020DeenSensitiveDataBoundaryService.checkBoundary({
      role: normalizeRole(actor.role),
      schoolId: actor.schoolId || '',
      contentCategory: contentCategory || 'basic_curriculum',
      targetAudience: targetAudience || 'learner_self',
      containsRawQuestion: !!(containsRawQuestion),
      context: {},
    });
    res.json({ success: true, decision });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Deen decision failed.' });
  }
});

router.get('/audit', async (req: Request, res: Response) => {
  if (!roleCheck(res, getActor(req).role, ADMIN_ROLES)) return;
  try {
    const actor = getActor(req);
    const schoolId = actor.schoolId || '';
    const records = await task020GovernanceAuditService.getAuditRecords({ schoolId });
    const summary = task020GovernanceAuditService.getAuditSummary();
    res.json({ success: true, records, summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit records.' });
  }
});

function normalizeRole(role: string): any {
  const r = (role || '').trim().toLowerCase();
  if (r === 'student' || r === 'learner') return 'learner';
  if (r === 'teacher') return 'teacher';
  if (r === 'parent' || r === 'guardian') return 'learner';
  if (r === 'admin' || r === 'school_admin') return 'school_admin';
  if (r === 'safeguarding_staff' || r === 'counselor') return 'safeguarding_officer';
  if (r === 'system_admin') return 'system_admin';
  if (r === 'internal' || r === 'internal_operator') return 'internal_operator';
  return 'unknown';
}

export default router;
