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
import type { CurriculumFamily, SourceApprovalStatus } from '../services/task022ContentGovernanceContracts';
import type { ImportProposal } from '../services/task022CurriculumImportDryRunService';

const router = Router();

function getReqActor(req: Request): { id: string; role: string; schoolId?: string } {
  return {
    id: (req as any).user?.id || 'anonymous',
    role: (req as any).user?.role || 'unknown',
    schoolId: (req as any).schoolId,
  };
}

const ADMIN_INTERNAL_ROLES = ['school_admin', 'system_admin', 'internal_operator'];
const TEACHER_ADMIN_ROLES = ['teacher', 'school_admin', 'system_admin', 'internal_operator'];

function requireRole(req: Request, res: Response, allowedRoles: string[]): boolean {
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

router.get('/curriculum/summary', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const families: CurriculumFamily[] = ['cambridge_academic', 'madrasa_deen', 'school_custom', 'system_seed'];
    const summary = families.map(family => {
      const versions = curriculumVersioningService.getVersionsForFamily(family);
      return {
        curriculumFamily: family,
        versionCount: versions.length,
        activeVersions: versions.filter(v => v.status === 'active').length,
        versions: versions.map(v => ({
          id: v.id,
          versionCode: v.versionCode,
          title: v.title,
          status: v.status,
        })),
      };
    });
    res.json({ success: true, curriculumSummary: summary });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve curriculum summary.' });
  }
});

router.get('/curriculum/active', (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  if (!requireSchoolContext(req, res)) return;
  try {
    const actor = getReqActor(req);
    const families: CurriculumFamily[] = ['cambridge_academic', 'madrasa_deen', 'school_custom'];
    const activeVersions = families.map(family => {
      const version = curriculumRegistryService.getActiveVersion(actor.schoolId!, family);
      return version ? { curriculumFamily: family, version } : null;
    }).filter(Boolean);
    res.json({ success: true, activeVersions });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve active curriculum versions.' });
  }
});

router.post('/curriculum/resolve', async (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  // R8-G.3A-D2: gap detection resolves through the durable gap owner.
  try {
    const { curriculumFamily, subject, stage, topic, skill } = req.body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    const subjectContext = subject ? curriculumRegistryService.resolveSubject(curriculumFamily, subject) : null;
    const topicContext = subject && topic ? curriculumRegistryService.resolveTopic(curriculumFamily, subject, topic) : null;

    let skills: any[] = [];
    let objectives: any[] = [];
    let prerequisites: any[] = [];

    if (topicContext) {
      skills = curriculumRegistryService.resolveSkill(topicContext.topicId).map(s => ({
        skillId: s.skillId,
        title: s.title,
        studentSafeDescription: s.studentSafeDescription,
        difficultyBand: s.difficultyBand,
        status: s.status,
      }));
      objectives = skills.flatMap(s => {
        const { topicSkillPrerequisiteMapService } = require('../services/task022TopicSkillPrerequisiteMapService');
        return topicSkillPrerequisiteMapService.getObjectivesForSkill(s.skillId).map((o: any) => ({
          objectiveId: o.objectiveId,
          title: o.title,
          studentSafeDescription: o.studentSafeDescription,
          status: o.status,
        }));
      });
      prerequisites = skills.flatMap((s: any) => {
        const { topicSkillPrerequisiteMapService } = require('../services/task022TopicSkillPrerequisiteMapService');
        return topicSkillPrerequisiteMapService.getPrerequisiteLinks(s.skillId).map((p: any) => ({
          fromSkillId: p.fromSkillId,
          toSkillId: p.toSkillId,
          relationshipType: p.relationshipType,
        }));
      });
    }

    const gap = topic ? await contentGapDetectionService.detectGapDurable(curriculumFamily, subject, topic, skill) : null;

    res.json({
      success: true,
      curriculumFamily,
      subject: subjectContext ? { subjectId: subjectContext.subjectId, name: subjectContext.name } : null,
      topic: topicContext ? {
        topicId: topicContext.topicId,
        title: topicContext.title,
        descriptionSafe: topicContext.descriptionSafe,
        status: topicContext.status,
      } : null,
      skills,
      objectives,
      prerequisites,
      gap: gap ? { gapType: gap.gapType, safeSummary: gap.safeSummary } : null,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to resolve curriculum.' });
  }
});

// R8-G.3A-D2: reads durable canonical source state.
router.get('/sources', async (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const sources = (await approvedSourceRegistryService.getAllSourcesDurable()).map(s => ({
      id: s.id,
      title: s.title,
      sourceType: s.sourceType,
      curriculumFamily: s.curriculumFamily,
      subject: s.subject,
      topic: s.topic,
      trustLevel: s.trustLevel,
      approvalStatus: s.approvalStatus,
      reviewRequired: s.reviewRequired,
      restrictedUse: s.restrictedUse,
      approvedByRole: s.approvedByRole,
      approvedAt: s.approvedAt,
    }));
    res.json({ success: true, count: sources.length, sources });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve sources.' });
  }
});

// R8-G.3A-D2: durable proposal — async.
router.post('/sources/propose', async (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const { sourceKey, title, sourceType, curriculumFamily, subject, topic, trustLevel } = req.body;

    if (!sourceKey || !title || !sourceType || !curriculumFamily) {
      res.status(400).json({ success: false, message: 'sourceKey, title, sourceType, and curriculumFamily are required.' });
      return;
    }

    const source = {
      id: `src-${Date.now()}`,
      schoolId: actor.schoolId,
      sourceKey,
      title,
      sourceType,
      curriculumFamily,
      subject,
      topic,
      trustLevel: trustLevel || 'review_required',
      approvalStatus: 'teacher_proposed' as SourceApprovalStatus,
      reviewRequired: true,
      restrictedUse: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const decision = await sourceApprovalWorkflowService.proposeSourceDurable(source, actor.role as any);

    res.json({
      success: true,
      sourceId: source.id,
      approvalStatus: source.approvalStatus,
      requiresReferral: decision.requiresReferral,
      referralRole: decision.referralRole,
      reasonCodes: decision.reasonCodes,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to propose source.' });
  }
});

// R8-G.3A-D2: durable lifecycle mutation + awaited required audit.
router.post('/sources/:sourceId/review', async (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const { sourceId } = req.params;
    const { action } = req.body;

    if (!action || !['approve', 'reject', 'block'].includes(action)) {
      res.status(400).json({ success: false, message: 'action must be approve, reject, or block.' });
      return;
    }

    const source = await approvedSourceRegistryService.getSourceDurable(sourceId);
    if (!source) {
      res.status(404).json({ success: false, message: 'Source not found.' });
      return;
    }

    let success = false;
    if (action === 'approve') {
      if (source.curriculumFamily === 'madrasa_deen' && !['deen_reviewer', 'system_admin', 'internal_operator'].includes(actor.role)) {
        res.status(403).json({ success: false, message: 'Deen-sensitive source requires Deen reviewer role.' });
        return;
      }
      const approved = await sourceApprovalWorkflowService.approveSourceDurable(sourceId, actor.role as any);
      if (approved) {
        success = true;
        await contentGovernanceAuditService.recordSourceActionDurable('source_approved', sourceId, actor.role);
      }
    } else if (action === 'reject') {
      const rejected = await sourceApprovalWorkflowService.rejectSourceDurable(sourceId, actor.role as any);
      if (rejected) {
        success = true;
        await contentGovernanceAuditService.recordSourceActionDurable('source_rejected', sourceId, actor.role);
      }
    } else if (action === 'block') {
      const blocked = await sourceApprovalWorkflowService.blockSourceDurable(sourceId, actor.role as any);
      if (blocked) {
        success = true;
        await contentGovernanceAuditService.recordSourceActionDurable('source_deprecated', sourceId, actor.role);
      }
    }

    res.json({
      success,
      sourceId,
      newStatus: source.approvalStatus,
      action,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to review source.' });
  }
});

// R8-G.3A-D2: durable approval truth, fail-closed + awaited required audit.
router.post('/grounding/check', async (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const actor = getReqActor(req);
    const { curriculumFamily, subject, topic, skill, routePurpose, text } = req.body;

    if (!curriculumFamily) {
      res.status(400).json({ success: false, message: 'curriculumFamily is required.' });
      return;
    }

    const result = await contentGroundingService.checkDurable({
      curriculumFamily,
      subject,
      topic,
      skill,
      schoolId: actor.schoolId,
      routePurpose: routePurpose || 'tutor_context',
      learnerFacing: routePurpose === 'learner_facing',
      text,
    });

    if (result.decision === 'grounded') {
      await contentGovernanceAuditService.recordContentGroundingDurable('content_grounding_allowed', curriculumFamily, actor.role, result.reasonCodes);
    } else if (result.decision === 'referral_required') {
      await contentGovernanceAuditService.recordDeenReferralDurable(actor.role, curriculumFamily, result.reasonCodes);
    } else {
      await contentGovernanceAuditService.recordContentGroundingDurable('content_grounding_denied', curriculumFamily, actor.role, result.reasonCodes);
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to check content grounding.' });
  }
});

// R8-G.3A-D2: gap summary reads durable canonical gap state.
router.get('/gaps/summary', async (req: Request, res: Response) => {
  if (!requireRole(req, res, TEACHER_ADMIN_ROLES)) return;
  try {
    const gaps = await contentGapDetectionService.getAllGapsDurable();
    const byType = await Promise.all(
      (['missing_curriculum_mapping', 'missing_approved_source', 'missing_content_item', 'source_pending_review', 'source_restricted', 'deen_referral_required', 'deprecated_curriculum_version', 'blocked_content', 'teacher_review_required'] as const)
        .map(async gapType => ({ gapType, count: (await contentGapDetectionService.getGapsByTypeDurable(gapType)).length })),
    );
    const summary = byType.filter(s => s.count > 0);
    res.json({
      success: true,
      totalGaps: gaps.length,
      gapSummary: summary,
      gaps: gaps.map(g => ({
        id: g.id,
        curriculumFamily: g.curriculumFamily,
        subject: g.subject,
        topic: g.topic,
        skill: g.skill,
        gapType: g.gapType,
        safeSummary: g.safeSummary,
      })),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve gap summary.' });
  }
});

router.post('/import/dry-run', async (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const proposal: ImportProposal = req.body;
    if (!proposal || !proposal.curriculumFamily) {
      res.status(400).json({ success: false, message: 'Import proposal with curriculumFamily is required.' });
      return;
    }

    const result = curriculumImportDryRunService.validate(proposal);
    await contentGovernanceAuditService.recordDurable({
      actorRole: getReqActor(req).role,
      eventType: 'curriculum_import_dry_run',
      curriculumFamily: proposal.curriculumFamily,
      decision: result.valid ? 'valid' : 'invalid',
      reasonCodes: result.items.filter(i => i.severity === 'error').map(i => i.issues.join(', ')),
      privacyMetadata: { safe: true },
    });

    res.json({
      success: true,
      valid: result.valid,
      itemCount: result.itemCount,
      issues: result.items,
      duplicateTopics: result.duplicateTopics,
      duplicateSkills: result.duplicateSkills,
      missingSourceApprovals: result.missingSourceApprovals,
      deenSensitiveItemsRequiringReview: result.deenSensitiveItemsRequiringReview,
      teacherOnlyFieldsDetected: result.teacherOnlyFieldsDetected,
      answerKeyFieldsDetected: result.answerKeyFieldsDetected,
      summary: result.summary,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to run import dry-run.' });
  }
});

router.post('/deen/review-decision', (req: Request, res: Response) => {
  if (!requireRole(req, res, [...ADMIN_INTERNAL_ROLES, 'deen_reviewer'])) return;
  try {
    const { text, topic, subject } = req.body;

    if (!text) {
      res.status(400).json({ success: false, message: 'text is required.' });
      return;
    }

    const classification = deenContentGovernanceService.classify(text, topic, subject);
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
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to review Deen content.' });
  }
});

// R8-G.3A-D2: audit count reads durable append-only sink.
router.get('/diagnostics', async (req: Request, res: Response) => {
  if (!requireRole(req, res, ADMIN_INTERNAL_ROLES)) return;
  try {
    const diagnostics = contentGovernanceDiagnosticsService.getDiagnostics();
    const auditRecordCount = await contentGovernanceAuditService.getTotalRecordCountDurable();
    res.json({
      success: true,
      diagnostics,
      auditRecordCount,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve diagnostics.' });
  }
});

router.get('/learner/curriculum/context', (req: Request, res: Response) => {
  try {
    const actor = getReqActor(req);
    if (actor.role !== 'learner') {
      res.status(403).json({ success: false, message: 'Learner role required.' });
      return;
    }
    if (!actor.schoolId) {
      res.json({ success: true, context: null, message: 'No school context for learner curriculum.' });
      return;
    }

    const families: CurriculumFamily[] = ['cambridge_academic', 'madrasa_deen'];
    const contexts = families.map(family => {
      const version = curriculumRegistryService.getActiveVersion(actor.schoolId!, family);
      if (!version) return null;
      return {
        curriculumFamily: family,
        versionCode: version.versionCode,
        title: version.title,
        status: version.status,
      };
    }).filter(Boolean);

    res.json({
      success: true,
      context: contexts.length > 0 ? { curriculumContexts: contexts } : null,
      message: contexts.length > 0 ? undefined : 'No active curriculum for your school.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Failed to retrieve learner curriculum context.' });
  }
});

export default router;
