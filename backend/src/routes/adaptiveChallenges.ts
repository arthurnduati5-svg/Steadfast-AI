import { Router, Request, Response } from 'express';
import { schoolAuthMiddleware } from '../middleware/schoolAuthMiddleware';
import { adaptiveChallengeGenerationRuntime } from '../services/adaptiveChallengeGenerationRuntime';
import { adaptiveChallengeRepository } from '../services/adaptiveChallengeRepository';
import { challengeAttemptIntegrationService } from '../services/challengeAttemptIntegrationService';
import { hintScaffoldPolicyService } from '../services/hintScaffoldPolicyService';
import { remediationPathRepository } from '../services/remediationPathRepository';
import { difficultyCalibrationRuntime } from '../services/difficultyCalibrationRuntime';
import { difficultyCalibrationRepository } from '../services/difficultyCalibrationRepository';
import { adaptiveChallengeAuditService } from '../services/adaptiveChallengeAuditService';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import type { AdaptiveChallengeRequestContext } from '../services/task015Contracts';

const router = Router();

function resolveIdentity(req: Request): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

function checkCrossStudentAccess(req: Request, identity: ResolvedTutorIdentity): boolean {
  const targetId = req.params.studentId || req.query.studentId as string;
  if (targetId && targetId !== identity.studentId) {
    return false;
  }
  return true;
}

router.get('/challenges/next', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const request: AdaptiveChallengeRequestContext = {
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      studentId: identity.studentId,
      sessionId: req.query.sessionId as string | undefined,
      subject: req.query.subject as string | undefined,
      topic: req.query.topic as string | undefined,
      skillTag: req.query.skillTag as string | undefined,
      mode: (req.query.mode as any) ?? 'auto',
    };

    const result = await adaptiveChallengeGenerationRuntime.generateOrGetNext({
      identity,
      request,
      subject: request.subject,
      topic: request.topic,
      skillTag: request.skillTag,
    });

    if (!result.ok) {
      return sendError(res, 500, 'generation_failed', result.errors.join('; '));
    }

    res.json({
      ok: true,
      data: {
        challenge: result.challenge ?? null,
        remediationPath: result.remediationPath ?? null,
        decision: result.decision,
        warnings: result.warnings,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.post('/challenges', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const { subject, topic, skillTag, requestedMode, sessionId } = req.body;
    const mode = requestedMode || 'challenge';

    const request: AdaptiveChallengeRequestContext = {
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      studentId: identity.studentId,
      sessionId: sessionId || req.query.sessionId as string,
      subject,
      topic,
      skillTag,
      mode,
    };

    const result = await adaptiveChallengeGenerationRuntime.generateOrGetNext({
      identity,
      request,
      subject,
      topic,
      skillTag,
    });

    if (!result.ok) {
      return sendError(res, 500, 'generation_failed', result.errors.join('; '));
    }

    res.json({
      ok: true,
      data: {
        challenge: result.challenge ?? null,
        remediationPath: result.remediationPath ?? null,
        decision: result.decision,
        warnings: result.warnings,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/challenges/:challengeId', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');
    if (!checkCrossStudentAccess(req, identity)) return sendError(res, 403, 'access_denied', 'Cross-student access denied');

    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      identity.schoolId,
      identity.studentId,
      req.params.challengeId,
    );

    if (!challenge) {
      return sendError(res, 404, 'not_found', 'Challenge not found');
    }

    res.json({
      ok: true,
      data: {
        challengeId: challenge.id,
        challengeType: challenge.challengeType,
        subject: challenge.subject,
        topic: challenge.topic,
        skillTag: challenge.skillTag,
        difficultyLevel: challenge.difficultyLevel,
        learnerPrompt: challenge.learnerPrompt,
        socraticOpeningQuestion: challenge.socraticOpeningQuestion,
        allowedActions: ['submit_attempt', 'request_hint', 'skip_current'],
        hintPolicy: challenge.challengeType === 'foundation_remediation'
          ? 'More hints available for guided support'
          : 'Start with fewer hints, more available on request',
        status: challenge.status,
        createdAt: challenge.createdAt.toISOString(),
        privacyMetadata: challenge.privacyMetadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.post('/challenges/:challengeId/attempt', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      identity.schoolId,
      identity.studentId,
      req.params.challengeId,
    );

    if (!challenge) {
      return sendError(res, 404, 'not_found', 'Challenge not found');
    }

    if (challenge.status !== 'active') {
      return sendError(res, 400, 'challenge_inactive', 'Challenge is no longer active');
    }

    const result = await challengeAttemptIntegrationService.processAttempt({
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      challengeId: req.params.challengeId,
      attempt: {
        attemptText: req.body.attemptText || '',
        sessionId: req.body.sessionId,
        hintLevelUsed: req.body.hintLevelUsed,
      },
      subject: challenge.subject,
      topic: challenge.topic ?? undefined,
      skillTag: challenge.skillTag,
    });

    res.json({
      ok: true,
      data: {
        attemptAccepted: result.attemptAccepted,
        outcome: result.outcome,
        feedback: result.feedback,
        hintPolicy: result.hintPolicy,
        difficultyUpdated: result.difficultyUpdated,
        remediationProgressed: result.remediationProgressed,
        evidencePersisted: result.evidencePersisted,
        privacyMetadata: result.privacyMetadata,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/challenges/:challengeId/hint', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      identity.schoolId,
      identity.studentId,
      req.params.challengeId,
    );

    if (!challenge) {
      return sendError(res, 404, 'not_found', 'Challenge not found');
    }

    const hintRequestCount = challenge.hintLevelUsed;
    const hint = hintScaffoldPolicyService.getHint({
      currentAttemptNumber: 1,
      totalHintsRequested: hintRequestCount + 1,
      challengeType: challenge.challengeType,
      skillTag: challenge.skillTag,
      subject: challenge.subject,
    });

    await adaptiveChallengeRepository.updateChallengeStatus(
      req.params.challengeId,
      challenge.status,
      undefined,
      hintRequestCount + 1,
    );

    res.json({
      ok: true,
      data: {
        scaffoldType: hint.scaffoldType,
        scaffoldText: hint.scaffoldText,
        hintLevel: hint.hintLevel,
        isFinalAnswer: hint.isFinalAnswer,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/remediation/path', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const subject = req.query.subject as string | undefined;
    const topic = req.query.topic as string | undefined;
    const skillTag = req.query.skillTag as string | undefined;

    let path = await remediationPathRepository.getActiveRemediationPath(
      identity.schoolId,
      identity.studentId,
      subject,
      skillTag,
    );

    if (!path) {
      const { remediationPathPlanner } = require('../services/remediationPathPlanner');
      const { prerequisiteSkillResolver } = require('../services/prerequisiteSkillResolver');

      const prereq = prerequisiteSkillResolver.resolvePrerequisites({
        subject: subject ?? 'general',
        topic,
        skillTag,
        blockingSkillTag: null,
      });

      const planned = remediationPathPlanner.planPath({
        subject: subject ?? 'general',
        topic,
        skillTag,
        blockingSkillTag: prereq.blockingSkill,
        supportLevel: 'moderate',
      });

      path = await remediationPathRepository.createRemediationPath({
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        subject: subject ?? 'general',
        topic,
        skillTag,
        blockingSkillTag: prereq.blockingSkill,
        prerequisiteSkillTags: prereq.prerequisiteSkills,
        steps: planned.steps,
        reasonCodes: ['learner_requested_remediation'],
        privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
      });
    }

    res.json({
      ok: true,
      data: {
        pathId: path.id,
        subject: path.subject,
        topic: path.topic,
        skillTag: path.skillTag,
        blockingSkill: path.blockingSkillTag,
        prerequisiteFocus: path.prerequisiteSkillTags,
        steps: path.steps.map((s: any) => ({
          stepId: s.stepId,
          stepType: s.stepType,
          studentInstruction: s.studentInstruction,
          checkQuestion: s.checkQuestion,
          supportLevel: s.supportLevel,
          completionSignal: s.completionSignal,
        })),
        currentStepIndex: path.currentStepIndex,
        status: path.status,
        createdAt: path.createdAt.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.post('/remediation/:pathId/steps/:stepIndex/complete', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const path = await remediationPathRepository.getRemediationPathById(
      identity.schoolId,
      identity.studentId,
      req.params.pathId,
    );

    if (!path) {
      return sendError(res, 404, 'not_found', 'Remediation path not found');
    }

    const stepIndex = parseInt(req.params.stepIndex, 10);
    if (isNaN(stepIndex) || stepIndex < 0 || stepIndex >= path.steps.length) {
      return sendError(res, 400, 'invalid_step', 'Invalid step index');
    }

    const nextIndex = stepIndex + 1;
    const isComplete = nextIndex >= path.steps.length;

    await remediationPathRepository.updateRemediationPathProgress(
      req.params.pathId,
      Math.min(nextIndex, path.steps.length - 1),
      isComplete ? 'completed' : undefined,
    );

    res.json({
      ok: true,
      data: {
        stepCompleted: true,
        nextStepIndex: isComplete ? null : nextIndex,
        pathCompleted: isComplete,
        message: isComplete
          ? 'Well done! You have completed the remediation path. You are ready to return to the main topic.'
          : 'Step completed. Continue to the next step.',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

router.get('/difficulty/calibration', schoolAuthMiddleware, async (req: Request, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) return sendError(res, 401, 'unauthenticated', 'Authentication required');

    const subject = req.query.subject as string || 'general';
    const skillTag = req.query.skillTag as string | undefined;

    const calibration = await difficultyCalibrationRepository.getCalibration(
      identity.schoolId,
      identity.studentId,
      subject,
      skillTag,
    );

    if (!calibration) {
      res.json({
        ok: true,
        data: {
          currentDifficultyLevel: 'standard',
          supportLevel: 'moderate',
          calibrationReason: 'No calibration data yet; starting at default.',
          recentSignalSummary: 'awaiting_first_evidence',
          nextAdjustmentCondition: 'After first practice attempt, calibration will be updated.',
          confidence: 0.3,
          privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
          updatedAt: new Date().toISOString(),
        },
      });
      return;
    }

    const levelLabels: Record<string, string> = {
      foundation: 'foundation support is best for building confidence',
      easy: 'guided practice helps reinforce the basics',
      standard: 'balanced practice at the right level',
      challenging: 'well-scaffolded challenges will stretch understanding',
      stretch: 'advanced challenges are appropriate for this skill',
    };

    const supportLabels: Record<string, string> = {
      minimal: 'You are working independently.',
      moderate: 'Guided support is available when needed.',
      significant: 'More structured support is recommended.',
      intensive: 'Close guidance is helpful for this skill.',
      maximum: 'Step-by-step support is best right now.',
    };

    const reason = levelLabels[calibration.currentDifficultyLevel] ?? 'balanced practice at the right level';
    const supportReason = supportLabels[calibration.supportLevel] ?? 'Guided support is available when needed.';

    res.json({
      ok: true,
      data: {
        currentDifficultyLevel: calibration.currentDifficultyLevel,
        supportLevel: calibration.supportLevel,
        calibrationReason: `${reason}. ${supportReason}`,
        recentSignalSummary: calibration.recentSuccessCount > 0
          ? `Recent success: ${calibration.recentSuccessCount}, struggles: ${calibration.recentStruggleCount}`
          : 'Building initial calibration data',
        nextAdjustmentCondition: calibration.recentSuccessCount >= 3
          ? 'After more independent success, difficulty may increase.'
          : 'Continue practicing for updated calibration.',
        confidence: Math.min(0.9, 0.3 + calibration.recentSuccessCount * 0.1),
        privacyMetadata: calibration.privacyMetadata,
        updatedAt: calibration.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    sendError(res, 500, 'internal_error', message);
  }
});

export default router;
