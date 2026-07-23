import { Router, Request, Response } from 'express';
import { curriculumRegistryService } from '../services/task022CurriculumRegistryService';
import { curriculumVersioningService } from '../services/task022CurriculumVersioningService';
import { approvedSourceRegistryService } from '../services/task022ApprovedSourceRegistryService';
import { sourceApprovalWorkflowService } from '../services/task022SourceApprovalWorkflowService';
import { contentGroundingService } from '../services/task022ContentGroundingService';
import { contentGapDetectionService } from '../services/task022ContentGapDetectionService';
import { curriculumImportDryRunService } from '../services/task022CurriculumImportDryRunService';
import { deenContentGovernanceService } from '../services/task022DeenContentGovernanceService';
import { contentGovernanceDiagnosticsService } from '../services/task022ContentGovernanceDiagnosticsService';
import { contentGovernanceAuditService } from '../services/task022ContentGovernanceAuditService';
import { contentItemGovernanceService } from '../services/task022ContentItemGovernanceService';
import { curriculumRetrievalService } from '../services/task022CurriculumRetrievalService';
import { learningObjectiveGovernanceService } from '../services/task022LearningObjectiveGovernanceService';
import { topicSkillPrerequisiteMapService } from '../services/task022TopicSkillPrerequisiteMapService';
import { tutorContentPolicyIntegrationService } from '../services/task022TutorContentPolicyIntegrationService';
import type { CurriculumFamily, SourceApprovalStatus } from '../services/task022ContentGovernanceContracts';
import type { ImportProposal } from '../services/task022CurriculumImportDryRunService';
import type { GovernanceActor, GovernanceActorRole, SafeSourceResponse, SafeCurriculumResponse, SafeContentItemResponse } from '../contracts/task022CurriculumGovernanceContracts';
import {
  isValidCurriculumFamily, isValidSourceType, isValidTrustLevel,
  containsForbiddenFields, validateString, validateOptionalString,
  collectErrors, sanitizePayload,
} from '../lib/task022CurriculumGovernanceValidation';

const router = Router();

const ADMIN_INTERNAL_ROLES: GovernanceActorRole[] = ['school_admin', 'system_admin', 'internal_operator'];
const TEACHER_ADMIN_ROLES: GovernanceActorRole[] = ['teacher', 'school_admin', 'system_admin', 'internal_operator'];
const TEACHER_ADMIN_DEEN_ROLES: GovernanceActorRole[] = ['teacher', 'school_admin', 'system_admin', 'internal_operator', 'deen_reviewer'];
const LEARNER_SAFE_ROLES: GovernanceActorRole[] = ['learner', 'teacher', 'school_admin', 'system_admin', 'internal_operator'];

function getReqActor(req: Request): GovernanceActor {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: ((req as any).user?.role || 'unknown') as GovernanceActorRole,
    schoolId: (req as any).schoolId,
  };
}

function requireRole(req: Request, res: Response, allowedRoles: GovernanceActorRole[]): boolean {
  const actor = getReqActor(req);
  if (!allowedRoles.includes(actor.role)) {
    res.status(403).json({ success: false, message: 'Forbidden. Insufficient role.', role: actor.role });
    return false;
  }
  return true;
}

function requireSchoolContext(req: Request, res: Response): boolean {
  const actor = getReqActor(req);
  if (!actor.schoolId) {
    res.status(400).json({ success: false, message: 'School context required.' });
    return false;
  }
  return true;
}

function safeSource(source: any): SafeSourceResponse {
  return {
    id: source.id,
    title: source.title,
    sourceType: source.sourceType,
    curriculumFamily: source.curriculumFamily,
    subject: source.subject,
    topic: source.topic,
    trustLevel: source.trustLevel,
    approvalStatus: source.approvalStatus,
    reviewRequired: source.reviewRequired,
    restrictedUse: source.restrictedUse,
  };
}

function safeCurriculum(curriculum: any): SafeCurriculumResponse {
  return {
    id: curriculum.id,
    curriculumFamily: curriculum.curriculumFamily,
    versionCode: curriculum.versionCode,
    title: curriculum.title,
    status: curriculum.status,
  };
}

function safeContentItem(item: any): SafeContentItemResponse {
  return {
    id: item.id,
    contentType: item.contentType,
    status: item.status,
    topicId: item.topicId,
    skillId: item.skillId,
  };
}

const HEALTH_START = Date.now();

// ─── Health ─────────────────────────────────────────────────────
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ok',
    serviceName: 'task022-curriculum-content-governance',
    uptimeSec: Math.round((Date.now() - HEALTH_START) / 1000),
    timestamp: new Date().toISOString(),
  });
});

// ─── Sources: Register (admin/internal) ──────────────────────────
router.post('/sources/register', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { sourceKey, title, sourceType, curriculumFamily, subject, topic, trustLevel } = body;

    const errors = collectErrors([
      validateString(sourceKey, 'sourceKey'),
      validateString(title, 'title'),
      validateString(sourceType, 'sourceType'),
      validateString(curriculumFamily, 'curriculumFamily'),
    ]);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors });
      return;
    }

    if (!isValidCurriculumFamily(curriculumFamily)) {
      res.status(400).json({ success: false, message: 'Invalid curriculumFamily.' });
      return;
    }

    if (!isValidSourceType(sourceType)) {
      res.status(400).json({ success: false, message: 'Invalid sourceType.' });
      return;
    }

    const source = {
      id: `src-${Date.now()}`,
      schoolId: actor.schoolId,
      sourceKey: sourceKey as string,
      title: title as string,
      sourceType: sourceType as string,
      curriculumFamily: curriculumFamily as CurriculumFamily,
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      trustLevel: (trustLevel && isValidTrustLevel(trustLevel) ? trustLevel : 'review_required') as string,
      approvalStatus: 'approved' as SourceApprovalStatus,
      reviewRequired: false,
      restrictedUse: false,
      approvedByActorId: actor.id,
      approvedByRole: actor.role,
      approvedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    approvedSourceRegistryService.registerSource(source as any);
    contentGovernanceAuditService.recordSourceAction('source_approved', source.id, actor.role);

    res.status(201).json({ success: true, source: safeSource(source) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to register source.' });
  }
});

// ─── Sources: List ──────────────────────────────────────────────
router.get('/sources', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const allSources = approvedSourceRegistryService.getAllSources();
    const schoolSources = actor.schoolId
      ? allSources.filter(s => !s.schoolId || s.schoolId === actor.schoolId)
      : allSources;
    const sources = schoolSources.map(safeSource);
    res.json({ success: true, count: sources.length, sources });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve sources.' });
  }
});

// ─── Sources: Get by ID ──────────────────────────────────────────
router.get('/sources/:sourceId', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const { sourceId } = req.params;
    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Source not found.' });
      return;
    }
    res.json({ success: true, source: safeSource(source) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve source.' });
  }
});

// ─── Sources: Approval Request ──────────────────────────────────
router.post('/sources/:sourceId/approval/request', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_DEEN_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const { sourceId } = req.params;

    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Source not found.' });
      return;
    }

    if (source.schoolId && source.schoolId !== actor.schoolId) {
      res.status(403).json({ success: false, message: 'Cross-school source access denied.' });
      return;
    }

    const decision = sourceApprovalWorkflowService.proposeSource(source, actor.role as any);

    res.json({
      success: true,
      sourceId,
      approvalStatus: source.approvalStatus,
      requiresReferral: decision.requiresReferral,
      referralRole: decision.referralRole,
      reasonCodes: decision.reasonCodes,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to request source approval.' });
  }
});

// ─── Sources: Approval Decision (admin/internal) ────────────────
router.post('/sources/:sourceId/approval/decide', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const { sourceId } = req.params;
    const body = sanitizePayload(req.body);
    const { action } = body;

    if (!action || !['approve', 'reject', 'block'].includes(action as string)) {
      res.status(400).json({ success: false, message: 'action must be approve, reject, or block.' });
      return;
    }

    const source = approvedSourceRegistryService.getSource(sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Source not found.' });
      return;
    }

    const actionStr = action as string;
    let success = false;

    if (actionStr === 'approve') {
      if (source.curriculumFamily === 'madrasa_deen' && !['deen_reviewer', 'system_admin', 'internal_operator'].includes(actor.role)) {
        res.status(403).json({ success: false, message: 'Deen-sensitive source requires Deen reviewer role.' });
        return;
      }
      success = sourceApprovalWorkflowService.approveSource(sourceId, actor.role as any);
      if (success) {
        contentGovernanceAuditService.recordSourceAction('source_approved', sourceId, actor.role);
      }
    } else if (actionStr === 'reject') {
      success = sourceApprovalWorkflowService.rejectSource(sourceId, actor.role as any);
      if (success) {
        contentGovernanceAuditService.recordSourceAction('source_rejected', sourceId, actor.role);
      }
    } else if (actionStr === 'block') {
      success = sourceApprovalWorkflowService.blockSource(sourceId, actor.role as any);
      if (success) {
        contentGovernanceAuditService.recordSourceAction('source_deprecated', sourceId, actor.role);
      }
    }

    res.json({ success, sourceId, newStatus: source.approvalStatus, action: actionStr });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to decide source approval.' });
  }
});

// ─── Curricula: Register (admin/internal) ───────────────────────
router.post('/curricula/register', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { curriculumFamily, versionCode, title } = body;

    const errors = collectErrors([
      validateString(curriculumFamily, 'curriculumFamily'),
      validateString(versionCode, 'versionCode'),
      validateString(title, 'title'),
    ]);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors });
      return;
    }

    if (!isValidCurriculumFamily(curriculumFamily)) {
      res.status(400).json({ success: false, message: 'Invalid curriculumFamily.' });
      return;
    }

    const versionId = `cur-ver-${Date.now()}`;
    const family = curriculumFamily as CurriculumFamily;
    const version = {
      id: versionId,
      schoolId: actor.schoolId,
      curriculumFamily: family,
      versionCode: versionCode as string,
      title: title as string,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    curriculumVersioningService.registerVersion(family, version as any);
    curriculumRegistryService.registerFamily(family, [version as any]);

    res.status(201).json({
      success: true,
      curriculum: safeCurriculum(version),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to register curriculum.' });
  }
});

// ─── Curricula: List ──────────────────────────────────────────
router.get('/curricula', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const families: CurriculumFamily[] = ['cambridge_academic', 'madrasa_deen', 'school_custom', 'system_seed'];
    const curricula = families.flatMap(family => {
      const versions = curriculumVersioningService.getVersionsForFamily(family);
      return versions.map(safeCurriculum);
    });
    res.json({ success: true, count: curricula.length, curricula });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve curricula.' });
  }
});

// ─── Curricula: Get by ID ─────────────────────────────────────
router.get('/curricula/:curriculumId', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const { curriculumId } = req.params;
    const families: CurriculumFamily[] = ['cambridge_academic', 'madrasa_deen', 'school_custom', 'system_seed'];
    let found = null;
    for (const family of families) {
      const versions = curriculumVersioningService.getVersionsForFamily(family);
      found = versions.find(v => v.id === curriculumId);
      if (found) break;
    }
    if (!found) {
      res.status(404).json({ success: false, message: 'Curriculum not found.' });
      return;
    }
    res.json({ success: true, curriculum: safeCurriculum(found) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve curriculum.' });
  }
});

// ─── Curricula: Create Version (admin/internal) ───────────────
router.post('/curricula/:curriculumId/versions', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const { curriculumId } = req.params;
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { versionCode, title } = body;
    const errors = collectErrors([
      validateString(versionCode, 'versionCode'),
      validateString(title, 'title'),
    ]);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors });
      return;
    }

    const newVersion = {
      id: `ver-${Date.now()}`,
      schoolId: actor.schoolId,
      curriculumFamily: curriculumId as CurriculumFamily,
      versionCode: versionCode as string,
      title: title as string,
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    curriculumVersioningService.registerVersion(curriculumId as CurriculumFamily, newVersion as any);

    res.status(201).json({ success: true, version: safeCurriculum(newVersion) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create curriculum version.' });
  }
});

// ─── Curricula: Activate Version (admin/internal) ──────────────
router.post('/curricula/:curriculumId/versions/:versionId/activate', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const { curriculumId, versionId } = req.params;

    if (!isValidCurriculumFamily(curriculumId)) {
      res.status(400).json({ success: false, message: 'Invalid curriculum family.' });
      return;
    }

    const success = curriculumRegistryService.activateVersion(actor.schoolId!, curriculumId as CurriculumFamily, versionId);
    if (!success) {
      res.status(400).json({ success: false, message: 'Failed to activate version. Check version exists and is valid.' });
      return;
    }

    res.json({ success: true, curriculumFamily: curriculumId, versionId, status: 'active' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to activate curriculum version.' });
  }
});

// ─── Content Items: Create (admin/internal) ────────────────────
router.post('/content-items', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { topicId, skillId, contentType, studentSafeContent, teacherOnly, answerKeyProtected } = body;
    const errors = collectErrors([
      validateString(contentType, 'contentType'),
    ]);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors });
      return;
    }

    const item = {
      id: `ci-${Date.now()}`,
      schoolId: actor.schoolId,
      topicId: topicId as string | undefined,
      skillId: skillId as string | undefined,
      contentType: contentType as string,
      status: 'draft' as const,
      sensitivity: 'basic' as const,
      studentSafeContent: studentSafeContent as string | undefined,
      teacherSafeContent: undefined as string | undefined,
      answerKeyProtected: answerKeyProtected === true,
      teacherOnly: teacherOnly === true,
      reviewState: 'not_reviewed' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    contentItemGovernanceService.registerItem(item as any);

    res.status(201).json({ success: true, contentItem: safeContentItem(item) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to create content item.' });
  }
});

// ─── Content Items: List ───────────────────────────────────────
router.get('/content-items', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const allItems = contentItemGovernanceService.getAllItems();
    const safeItems = allItems
      .filter(item => {
        if (actor.role === 'learner') return false;
        return true;
      })
      .map(safeContentItem);
    res.json({ success: true, count: safeItems.length, contentItems: safeItems });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve content items.' });
  }
});

// ─── Content Items: Get by ID ─────────────────────────────────
router.get('/content-items/:contentItemId', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const { contentItemId } = req.params;
    const item = contentItemGovernanceService.getItem(contentItemId);
    if (!item) {
      res.status(404).json({ success: false, message: 'Content item not found.' });
      return;
    }
    res.json({ success: true, contentItem: safeContentItem(item) });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve content item.' });
  }
});

// ─── Maps: Topic-Skill-Objective (admin/internal) ──────────────
router.post('/maps/topic-skill-objective', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { topicId, topic, skillId, skill, objectiveId, objective, prerequisiteLinks } = body;

    if (topic && topicId) {
      const topicEntry = {
        topicId: topicId as string,
        curriculumVersionId: body.curriculumVersionId as string | undefined,
        subject: body.subject as string || '',
        title: (topic as any).title || (topic as string),
        descriptionSafe: (topic as any).descriptionSafe,
        status: 'active' as const,
      };
      topicSkillPrerequisiteMapService.registerTopic(topicEntry as any);
    }

    if (skill && skillId) {
      const skillEntry = {
        skillId: skillId as string,
        curriculumTopicId: topicId as string || '',
        title: (skill as any).title || (skill as string),
        status: 'active' as const,
      };
      topicSkillPrerequisiteMapService.registerSkill(skillEntry as any);
    }

    if (objective && objectiveId) {
      const objEntry = {
        objectiveId: objectiveId as string,
        curriculumSkillId: skillId as string || '',
        title: (objective as any).title || (objective as string),
        status: 'active' as const,
      };
      topicSkillPrerequisiteMapService.registerObjective(objEntry as any);
      learningObjectiveGovernanceService.registerObjective(objEntry as any);
    }

    if (prerequisiteLinks && Array.isArray(prerequisiteLinks)) {
      for (const link of prerequisiteLinks) {
        topicSkillPrerequisiteMapService.registerPrerequisite(link);
      }
    }

    res.status(201).json({ success: true, message: 'Map entry registered.' });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to register map entry.' });
  }
});

// ─── Objectives: Govern (admin/internal) ───────────────────────
router.post('/objectives/govern', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { objectiveId, action: governAction } = body;
    const errors = collectErrors([
      validateString(objectiveId, 'objectiveId'),
      validateString(governAction, 'action'),
    ]);
    if (errors.length > 0) {
      res.status(400).json({ success: false, message: 'Validation failed.', errors });
      return;
    }

    const objective = learningObjectiveGovernanceService.getObjective(objectiveId as string);
    if (!objective) {
      res.status(404).json({ success: false, message: 'Objective not found.' });
      return;
    }

    const allowedActions = ['approve', 'reject', 'block', 'set_active', 'set_draft'];
    if (!allowedActions.includes(governAction as string)) {
      res.status(400).json({ success: false, message: `action must be one of: ${allowedActions.join(', ')}` });
      return;
    }

    const action = governAction as string;
    let newStatus: string;
    if (action === 'approve' || action === 'set_active') newStatus = 'active';
    else if (action === 'reject') newStatus = 'rejected';
    else if (action === 'block') newStatus = 'blocked';
    else newStatus = 'draft';

    objective.status = newStatus as any;

    res.json({ success: true, objectiveId, newStatus });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to govern objective.' });
  }
});

// ─── Grounding: Decide ──────────────────────────────────────────
router.post('/grounding/decide', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { curriculumFamily, subject, topic, skill, routePurpose, text } = body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    if (actor.role === 'learner' && routePurpose !== 'learner_facing') {
      res.status(403).json({ success: false, message: 'Learner may only request learner-facing grounding.' });
      return;
    }

    const result = contentGroundingService.check({
      curriculumFamily: curriculumFamily as CurriculumFamily,
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      skill: skill as string | undefined,
      schoolId: actor.schoolId,
      routePurpose: (routePurpose as any) || 'tutor_context',
      learnerFacing: routePurpose === 'learner_facing',
      text: text as string | undefined,
    });

    if (result.decision === 'grounded') {
      contentGovernanceAuditService.recordContentGrounding('content_grounding_allowed', curriculumFamily as CurriculumFamily, actor.role, result.reasonCodes);
    } else if (result.decision === 'referral_required') {
      contentGovernanceAuditService.recordDeenReferral(actor.role, curriculumFamily as CurriculumFamily, result.reasonCodes);
    } else {
      contentGovernanceAuditService.recordContentGrounding('content_grounding_denied', curriculumFamily as CurriculumFamily, actor.role, result.reasonCodes);
    }

    res.json({
      success: true,
      decision: result.decision,
      safeContentContext: result.safeContentContext,
      approvedSourceIds: result.approvedSourceIds,
      learningObjectiveIds: result.learningObjectiveIds,
      referralDecision: result.referralDecision,
      gapReason: result.gapReason,
      reasonCodes: result.reasonCodes,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to decide grounding.' });
  }
});

// ─── Gaps: Detect ──────────────────────────────────────────────
router.post('/gaps/detect', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const { curriculumFamily, subject, topic, skill } = body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    const gap = contentGapDetectionService.detectGap(
      curriculumFamily as CurriculumFamily,
      subject as string | undefined,
      topic as string | undefined,
      skill as string | undefined,
      actor.schoolId,
    );

    if (gap) {
      contentGovernanceAuditService.recordGapDetected(actor.role, curriculumFamily as CurriculumFamily, gap.reasonCodes);
    }

    res.json({
      success: true,
      gap: gap ? { gapType: gap.gapType, safeSummary: gap.safeSummary, reasonCodes: gap.reasonCodes } : null,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to detect gaps.' });
  }
});

// ─── Retrieval: Query ──────────────────────────────────────────
router.post('/retrieval/query', (req: Request, res: Response) => {
  if (!requireRole(req, res, LEARNER_SAFE_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { curriculumFamily, subject, topic, skill, stage, sourceTrustLevel } = body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    const result = curriculumRetrievalService.retrieve({
      curriculumFamily: curriculumFamily as CurriculumFamily,
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      skill: skill as string | undefined,
      stage: stage as string | undefined,
      sourceTrustLevel: sourceTrustLevel as any,
      schoolId: actor.schoolId,
    });

    if (actor.role === 'learner') {
      res.json({
        success: true,
        found: result.found,
        topics: result.topics.map(t => ({ topicId: t.topicId, title: t.title })),
        reasonCodes: result.reasonCodes,
      });
      return;
    }

    res.json({
      success: true,
      found: result.found,
      topics: result.topics,
      skills: result.skills,
      objectives: result.objectives,
      sources: result.sources.map(safeSource),
      contentItems: result.contentItems,
      reasonCodes: result.reasonCodes,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to query retrieval.' });
  }
});

// ─── Imports: Dry Run (admin/internal) ─────────────────────────
router.post('/imports/dry-run', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const proposal: ImportProposal = body as any;
    if (!proposal || !proposal.curriculumFamily) {
      res.status(400).json({ success: false, message: 'Import proposal with curriculumFamily is required.' });
      return;
    }

    const result = curriculumImportDryRunService.validate(proposal);
    contentGovernanceAuditService.record({
      actorRole: actor.role,
      eventType: 'curriculum_import_dry_run',
      curriculumFamily: proposal.curriculumFamily,
      decision: result.valid ? 'valid' : 'invalid',
      reasonCodes: result.items.filter(i => i.severity === 'error').flatMap(i => i.issues),
      privacyMetadata: { safe: true },
    });

    res.json({
      success: true,
      valid: result.valid,
      itemCount: result.itemCount,
      duplicateTopics: result.duplicateTopics,
      duplicateSkills: result.duplicateSkills,
      missingSourceApprovals: result.missingSourceApprovals,
      deenSensitiveItemsRequiringReview: result.deenSensitiveItemsRequiringReview,
      teacherOnlyFieldsDetected: result.teacherOnlyFieldsDetected,
      answerKeyFieldsDetected: result.answerKeyFieldsDetected,
      summary: result.summary,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to run import dry-run.' });
  }
});

// ─── Cambridge: Decide (teacher/admin/internal) ────────────────
router.post('/cambridge/decide', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const { subject, topic, skill, routePurpose, text } = body;

    const result = contentGroundingService.check({
      curriculumFamily: 'cambridge_academic',
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      skill: skill as string | undefined,
      schoolId: actor.schoolId,
      routePurpose: (routePurpose as any) || 'tutor_context',
      learnerFacing: routePurpose === 'learner_facing',
      text: text as string | undefined,
    });

    res.json({
      success: true,
      decision: result.decision,
      safeContentContext: result.safeContentContext,
      approvedSourceIds: result.approvedSourceIds,
      learningObjectiveIds: result.learningObjectiveIds,
      gapReason: result.gapReason,
      reasonCodes: result.reasonCodes,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to decide Cambridge content.' });
  }
});

// ─── Deen: Decide (teacher/admin/internal/deen_reviewer) ───────
router.post('/deen/decide', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_DEEN_ROLES)) return;
  try {
    const body = sanitizePayload(req.body);
    const forbidden = containsForbiddenFields(body);
    if (forbidden.length > 0) {
      res.status(400).json({ success: false, message: 'Payload contains forbidden fields.', fields: forbidden });
      return;
    }

    const { text, topic, subject } = body;

    if (!text) {
      res.status(400).json({ success: false, message: 'text is required.' });
      return;
    }

    if (typeof text === 'string' && text.length > 10000) {
      res.status(400).json({ success: false, message: 'Text exceeds maximum length.' });
      return;
    }

    const classification = deenContentGovernanceService.classify(text as string, topic as string | undefined, subject as string | undefined);
    const handling = deenContentGovernanceService.decideHandling(classification);

    res.json({
      success: true,
      classification: {
        level: classification.level,
        confidence: classification.confidence,
        reasonCodes: classification.reasonCodes,
      },
      handling: {
        referral: handling.referral,
        safeSummary: handling.safeSummary,
        reasonCodes: handling.reasonCodes,
      },
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to decide Deen content.' });
  }
});

// ─── Challenge Remediation: Decide (teacher/admin/internal) ────
router.post('/challenge-remediation/decide', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const body = sanitizePayload(req.body);
    const { curriculumFamily, subject, topic, skill, challengeType, learnerFacing } = body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    const isLearnerFacing = learnerFacing === true;
    const routePurpose = challengeType === 'remediation' ? 'remediation_planning' : 'challenge_generation';

    const groundingResult = contentGroundingService.check({
      curriculumFamily: curriculumFamily as CurriculumFamily,
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      skill: skill as string | undefined,
      schoolId: actor.schoolId,
      routePurpose: routePurpose as any,
      learnerFacing: isLearnerFacing,
    });

    const policyResult = tutorContentPolicyIntegrationService.prepareTutorContext({
      curriculumFamily: curriculumFamily as CurriculumFamily,
      subject: subject as string | undefined,
      topic: topic as string | undefined,
      skill: skill as string | undefined,
      schoolId: actor.schoolId,
      learnerFacing: isLearnerFacing,
    });

    res.json({
      success: true,
      challengeType: challengeType || 'challenge',
      grounding: {
        decision: groundingResult.decision,
        safeContentContext: groundingResult.safeContentContext,
      },
      policy: {
        canProceed: policyResult.canProceed,
        gapReason: policyResult.gapReason,
      },
      reasonCodes: [...groundingResult.reasonCodes, ...policyResult.reasonCodes],
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to decide challenge remediation.' });
  }
});

// ─── Diagnostics (admin/internal) ──────────────────────────────
router.get('/diagnostics', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const diagnostics = contentGovernanceDiagnosticsService.getDiagnostics();
    const auditRecordCount = contentGovernanceAuditService.getTotalRecordCount();
    res.json({
      success: true,
      diagnostics,
      auditRecordCount,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve diagnostics.' });
  }
});

// ─── Audit (admin/internal) ────────────────────────────────────
router.get('/audit', (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const { eventType, schoolId, limit } = req.query;
    const options: Record<string, any> = {};
    if (eventType) options.eventType = eventType;
    if (schoolId) options.schoolId = schoolId;
    if (limit) options.limit = parseInt(limit as string, 10);

    const records = contentGovernanceAuditService.getRecords(options);
    const eventTypeCounts = contentGovernanceAuditService.getEventCountByType();

    const safeRecords = records.map(r => ({
      id: r.id,
      eventType: r.eventType,
      actorRole: r.actorRole,
      curriculumFamily: r.curriculumFamily,
      decision: r.decision,
      reasonCodes: r.reasonCodes,
      createdAt: r.createdAt,
    }));

    res.json({
      success: true,
      totalRecords: contentGovernanceAuditService.getTotalRecordCount(),
      returnedCount: safeRecords.length,
      records: safeRecords,
      eventTypeCounts,
    });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to retrieve audit records.' });
  }
});

export default router;
