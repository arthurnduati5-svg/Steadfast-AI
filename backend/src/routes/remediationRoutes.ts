import { Router, Request, Response } from 'express';
import { validateRemediationPathRequest } from '../lib/adaptiveChallengeValidation';
import { rejectForbiddenAdaptiveChallengeFields } from '../services/adaptiveChallengePrivacyGuard';
import { adaptiveChallengeAccessPolicy } from '../services/adaptiveChallengeAccessPolicy';
import { noFakeChallengeReadinessGuard } from '../services/noFakeChallengeReadinessGuard';
import { remediationPathPlanner } from '../services/remediationPathPlanner';
import { remediationReadinessEvaluator } from '../services/remediationReadinessEvaluator';
import { remediationPathRepository } from '../services/remediationPathRepository';
import { adaptiveChallengeAuditService } from '../services/adaptiveChallengeAuditService';
import * as responseBuilder from '../services/adaptiveChallengeResponseBuilder';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';

const router = Router();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || 'student',
  };
}

function nowISO(): string {
  return new Date().toISOString();
}

function checkCrossStudentAccess(req: Request, identity: ResolvedTutorIdentity): boolean {
  const targetId = req.params.studentId || req.query.studentId as string || req.body?.studentId;
  if (targetId && targetId !== identity.studentId) {
    return false;
  }
  return true;
}

// POST /evaluate - Evaluate remediation readiness
router.post('/evaluate', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateRemediationPathRequest(req.body || {});
    if (!parsed.success) {
      const message = parsed.error instanceof Error ? parsed.error.message : 'Validation failed';
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected', message]));
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    const remediationResult = remediationReadinessEvaluator.evaluate({
      currentStepIndex: 0,
      totalSteps: 3,
      recentStepOutcomes: req.body.recentOutcomes || [],
      recentHintLevels: req.body.recentHintLevels || [],
      repeatedConfusionCount: req.body.repeatedConfusionCount || 0,
      independentSuccessCount: req.body.independentSuccessCount || 0,
    });

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      reasonCodes: remediationResult.reasonCodes,
      safeEvidenceRefs: [],
      privacyDecision: 'remediation_evaluated',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json(responseBuilder.buildRemediationResponse({
      safeReasonCodes: remediationResult.reasonCodes,
      readinessLevel: remediationResult.verdict as any,
      confidenceBucket: remediationResult.confidence >= 0.7 ? 'high' : remediationResult.confidence >= 0.4 ? 'medium' : 'low',
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['remediation_evaluation_failed', message]));
  }
});

// POST /path - Plan remediation path
router.post('/path', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const parsed = validateRemediationPathRequest(req.body || {});
    if (!parsed.success) {
      const message = parsed.error instanceof Error ? parsed.error.message : 'Validation failed';
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected', message]));
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body);
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    const path = remediationPathPlanner.planPath({
      subject: req.body.subjectId || 'general',
      topic: req.body.topicId,
      skillTag: req.body.skillId,
      blockingSkillTag: req.body.blockingSkillId || null,
      supportLevel: req.body.supportLevel || 'moderate',
    });

    await remediationPathRepository.createRemediationPath({
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      subject: path.subject,
      topic: path.topic,
      skillTag: path.skillTag,
      blockingSkillTag: path.blockingSkill,
      prerequisiteSkillTags: path.prerequisiteFocus,
      steps: path.steps,
      reasonCodes: ['remediation_path_planned'],
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
    });

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      remediationPathId: path.pathId,
      reasonCodes: ['remediation_path_planned'],
      safeEvidenceRefs: [],
      privacyDecision: 'remediation_path_created',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json(responseBuilder.buildRemediationResponse({
      data: {
        pathId: path.pathId,
        subject: path.subject,
        topic: path.topic,
        skillTag: path.skillTag,
        blockingSkill: path.blockingSkill,
        prerequisiteFocus: path.prerequisiteFocus,
        steps: path.steps,
        currentStepIndex: path.currentStepIndex,
        whyThisPath: path.whyThisPath,
        returnToMainSkillCondition: path.returnToMainSkillCondition,
      },
      safeReasonCodes: ['remediation_path_planned'],
      readinessLevel: 'ready_for_foundation',
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['remediation_path_planning_failed', message]));
  }
});

// GET /:pathId - Get remediation path by ID
router.get('/:pathId', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const path = await remediationPathRepository.getRemediationPathById(
      identity.schoolId,
      identity.studentId,
      req.params.pathId,
    );

    if (!path) {
      res.status(404).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['remediation_path_not_found']));
      return;
    }

    res.json(responseBuilder.buildRemediationResponse({
      data: path,
      safeReasonCodes: ['remediation_path_retrieved'],
      readinessLevel: 'ready_for_foundation',
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['remediation_path_retrieval_failed', message]));
  }
});

// POST /:pathId/audit - Record audit for remediation path
router.post('/:pathId/audit', async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      res.status(401).json(responseBuilder.buildErrorResponse('blocked_no_learner_identity', ['unauthenticated']));
      return;
    }

    if (!checkCrossStudentAccess(req, identity)) {
      res.status(403).json(responseBuilder.buildErrorResponse('blocked_cross_learner', ['learner_ownership_not_proven']));
      return;
    }

    const { safe: privacySafe } = rejectForbiddenAdaptiveChallengeFields(req.body || {});
    if (!privacySafe) {
      res.status(400).json(responseBuilder.buildErrorResponse('blocked_forbidden_raw_field', ['forbidden_raw_field_detected']));
      return;
    }

    await adaptiveChallengeAuditService.record({
      actorId: identity.studentId,
      actorRole: identity.role || 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      remediationPathId: req.params.pathId,
      reasonCodes: req.body.reasonCodes || ['remediation_audit_recorded'],
      safeEvidenceRefs: [],
      privacyDecision: 'remediation_audit_recorded',
      deenSensitivityHandled: false,
      safeguardingBoundaryApplied: false,
      createdAt: nowISO(),
    });

    res.json(responseBuilder.buildRemediationResponse({
      safeReasonCodes: ['remediation_audit_recorded'],
    }));
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(500).json(responseBuilder.buildErrorResponse('blocked_not_ready', ['remediation_audit_failed', message]));
  }
});

export default router;
