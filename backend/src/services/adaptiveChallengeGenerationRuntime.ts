import type {
  AdaptiveChallengeRequestContext,
  AdaptiveChallengeType,
  ChallengeReadinessDecision,
  LearnerSafeChallengeResponse,
  AdaptiveChallengeAuditRecord,
} from './task015Contracts';
import { challengeReadinessEvaluator } from './challengeReadinessEvaluator';
import { remediationPathPlanner } from './remediationPathPlanner';
import { prerequisiteSkillResolver } from './prerequisiteSkillResolver';
import { difficultyCalibrationRuntime } from './difficultyCalibrationRuntime';
import { challengeBlueprintService } from './challengeBlueprintService';
import { challengeSafetyGuardService } from './challengeSafetyGuardService';
import { adaptiveChallengeAuditService } from './adaptiveChallengeAuditService';
import { adaptiveChallengeRepository } from './adaptiveChallengeRepository';
import { remediationPathRepository } from './remediationPathRepository';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

// These imports represent the consumption of Task 011 and Task 014 services
import type {
  MasterySignalLevel,
  RevisionPriority,
  LearnerProgressState,
  WeakSkillStatus,
} from './mastery/task011Contracts';
// AdaptiveRecommendationProfileRecord is a Prisma model imported via its generated types
// We reference it loosely since it's used for optional profile context only

function nowISO(): string {
  return new Date().toISOString();
}

export interface ChallengeGenerationResult {
  ok: boolean;
  challenge?: LearnerSafeChallengeResponse;
  remediationPath?: {
    pathId: string;
    subject: string;
    topic?: string;
    skillTag?: string;
    steps: Array<{
      stepId: string;
      stepType: string;
      studentInstruction: string;
      checkQuestion: string;
    }>;
    currentStepIndex: number;
    whyThisPath: string;
  };
  decision: ChallengeReadinessDecision;
  warnings: string[];
  errors: string[];
  auditRecord?: AdaptiveChallengeAuditRecord;
}

export class AdaptiveChallengeGenerationRuntime {
  async generateOrGetNext(ctx: {
    identity: ResolvedTutorIdentity;
    request: AdaptiveChallengeRequestContext;
    learnerProgressState?: LearnerProgressState | null;
    adaptiveProfile?: Record<string, unknown> | null;
    subject?: string;
    topic?: string;
    skillTag?: string;
  }): Promise<ChallengeGenerationResult> {
    const warnings: string[] = [];
    const errors: string[] = [];
    const identity = ctx.identity;
    const request = ctx.request;
    const subject = ctx.subject ?? request.subject ?? 'general';
    const topic = ctx.topic ?? request.topic;
    const skillTag = ctx.skillTag ?? request.skillTag ?? '';
    const mode = request.mode ?? 'auto';

    const progress = ctx.learnerProgressState;
    const profile = ctx.adaptiveProfile;

    const masteryLevel: MasterySignalLevel = progress?.strengths?.find(s => s.skillId === skillTag)?.level
      ?? progress?.readyForChallenge?.find(s => s.skillId === skillTag)?.level
      ?? 'not_started';
    const evidenceCount = 0;
    const revisionPriority: RevisionPriority = 'none';

    const readiness = challengeReadinessEvaluator.evaluate({
      masteryLevel,
      evidenceCount,
      recentIndependentSuccessCount: progress?.strengths?.length ?? 0,
      recentHintUsage: 0,
      recentMistakeCount: progress?.needsReview?.length ?? 0,
      repeatedMistakeSignals: 0,
      revisionPriority,
      spacedReviewDue: false,
      learnerChallengePreference: (profile?.challengeReadinessSignal as string) ?? 'medium',
      difficultyCalibration: 'standard',
      supportLevel: (profile?.preferredSupportLevel as any) ?? 'moderate',
      subject,
      topic,
      skillTag,
    });

    const deenSensitiveTopics = ['quran', 'hadith', 'fiqh', 'tafsir', 'aqidah', 'sharia'];
    const isDeenSensitive = deenSensitiveTopics.some(dt =>
      subject.toLowerCase().includes(dt) || (topic?.toLowerCase().includes(dt)),
    );

    const safeguardingTerms = ['self_harm', 'abuse', 'suicide', 'violence', 'trauma', 'crisis'];
    const isSafeguarding = safeguardingTerms.some(st =>
      subject.toLowerCase().includes(st) || (topic?.toLowerCase().includes(st)),
    );

    if (isSafeguarding) {
      warnings.push('Safeguarding boundary applied: challenge generation paused');
      readiness.suggestedChallengeType = 'teacher_supported_step';
      readiness.whyThisLevel = 'A teacher-supported step is best right now.';
    }

    const effectiveChallengeType: AdaptiveChallengeType = isDeenSensitive && readiness.verdict.includes('challenge')
      ? 'deen_teacher_referral'
      : readiness.suggestedChallengeType;

    if (isDeenSensitive) {
      warnings.push('Deen-sensitive content: using teacher referral instead of direct challenge');
    }

    if (effectiveChallengeType === 'foundation_remediation' || effectiveChallengeType === 'similar_practice') {
      const prereq = prerequisiteSkillResolver.resolvePrerequisites({
        subject,
        topic,
        skillTag,
        blockingSkillTag: null,
      });

      const path = remediationPathPlanner.planPath({
        subject,
        topic,
        skillTag,
        blockingSkillTag: prereq.blockingSkill ?? undefined,
        supportLevel: (profile?.preferredSupportLevel as any) ?? 'moderate',
      });

      await remediationPathRepository.createRemediationPath({
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        subject,
        topic,
        skillTag,
        blockingSkillTag: prereq.blockingSkill ?? undefined,
        prerequisiteSkillTags: prereq.prerequisiteSkills,
        steps: path.steps,
        reasonCodes: readiness.reasonCodes,
        privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
      });

      const safeSteps = path.steps.map(s => ({
        stepId: s.stepId,
        stepType: s.stepType,
        studentInstruction: s.studentInstruction,
        checkQuestion: s.checkQuestion,
      }));

      const auditRecord: AdaptiveChallengeAuditRecord = {
        actorId: identity.studentId,
        actorRole: 'learner',
        schoolId: identity.schoolId,
        tutorLearnerId: identity.studentId,
        sessionId: request.sessionId,
        remediationPathId: path.pathId,
        challengeType: effectiveChallengeType,
        difficultyLevel: readiness.suggestedDifficultyLevel,
        reasonCodes: readiness.reasonCodes,
        safeEvidenceRefs: [],
        privacyDecision: 'learner_safe_remediation',
        deenSensitivityHandled: isDeenSensitive,
        safeguardingBoundaryApplied: isSafeguarding,
        createdAt: nowISO(),
      };
      await adaptiveChallengeAuditService.record(auditRecord);

      return {
        ok: true,
        remediationPath: {
          pathId: path.pathId,
          subject: path.subject,
          topic: path.topic,
          skillTag: path.skillTag,
          steps: safeSteps,
          currentStepIndex: 0,
          whyThisPath: path.whyThisPath,
        },
        decision: readiness,
        warnings,
        errors,
        auditRecord,
      };
    }

    const blueprint = challengeBlueprintService.generateBlueprint({
      challengeType: effectiveChallengeType,
      subject,
      topic,
      skillTag,
      difficultyLevel: readiness.suggestedDifficultyLevel,
    });

    const guardResult = challengeSafetyGuardService.validateChallenge(blueprint);
    if (!guardResult.safe) {
      warnings.push(`Challenge safety guard blocked: ${guardResult.blockedReason}`);
      const fallbackBlueprint = challengeBlueprintService.generateBlueprint({
        challengeType: 'similar_practice',
        subject,
        topic,
        skillTag,
        difficultyLevel: 'standard',
      });
      const fallbackGuard = challengeSafetyGuardService.validateChallenge(fallbackBlueprint);
      if (fallbackGuard.safe && fallbackGuard.sanitizedChallenge) {
        const challenge = fallbackGuard.sanitizedChallenge;
        challenge.whyThisLevel = readiness.whyThisLevel;

        await adaptiveChallengeRepository.createChallenge({
          schoolId: identity.schoolId,
          tutorLearnerId: identity.studentId,
          subject,
          topic,
          skillTag: skillTag ?? '',
          challengeType: 'similar_practice',
          difficultyLevel: 'standard',
          learnerPrompt: challenge.learnerPrompt,
          socraticOpeningQuestion: challenge.socraticOpeningQuestion,
          allowedHints: challenge.allowedActions,
          safeEvidenceRefs: [],
          reasonCodes: readiness.reasonCodes,
          privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
        });

        const auditRecord: AdaptiveChallengeAuditRecord = {
          actorId: identity.studentId,
          actorRole: 'learner',
          schoolId: identity.schoolId,
          tutorLearnerId: identity.studentId,
          sessionId: request.sessionId,
          challengeId: challenge.challengeId,
          challengeType: 'similar_practice',
          difficultyLevel: 'standard',
          reasonCodes: [...readiness.reasonCodes, 'safety_fallback'],
          safeEvidenceRefs: [],
          privacyDecision: 'learner_safe_challenge',
          deenSensitivityHandled: isDeenSensitive,
          safeguardingBoundaryApplied: isSafeguarding,
          createdAt: nowISO(),
        };
        await adaptiveChallengeAuditService.record(auditRecord);

        return {
          ok: true,
          challenge,
          decision: readiness,
          warnings,
          errors,
          auditRecord,
        };
      }
      errors.push('Failed to generate safe challenge fallback');
      return {
        ok: false,
        decision: readiness,
        warnings,
        errors,
      };
    }

    const safeChallenge = guardResult.sanitizedChallenge;
    if (!safeChallenge) {
      errors.push('Safety guard returned no challenge');
      return {
        ok: false,
        decision: readiness,
        warnings,
        errors,
      };
    }

    safeChallenge.whyThisLevel = readiness.whyThisLevel;

    await adaptiveChallengeRepository.createChallenge({
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      subject,
      topic,
      skillTag: skillTag ?? '',
      challengeType: effectiveChallengeType,
      difficultyLevel: readiness.suggestedDifficultyLevel,
      learnerPrompt: safeChallenge.learnerPrompt,
      socraticOpeningQuestion: safeChallenge.socraticOpeningQuestion,
      allowedHints: safeChallenge.allowedActions,
      safeEvidenceRefs: [],
      reasonCodes: readiness.reasonCodes,
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
    });

    const auditRecord: AdaptiveChallengeAuditRecord = {
      actorId: identity.studentId,
      actorRole: 'learner',
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      sessionId: request.sessionId,
      challengeId: safeChallenge.challengeId,
      challengeType: effectiveChallengeType,
      difficultyLevel: readiness.suggestedDifficultyLevel,
      reasonCodes: readiness.reasonCodes,
      safeEvidenceRefs: [],
      privacyDecision: 'learner_safe_challenge',
      deenSensitivityHandled: isDeenSensitive,
      safeguardingBoundaryApplied: isSafeguarding,
      createdAt: nowISO(),
    };
    await adaptiveChallengeAuditService.record(auditRecord);

    return {
      ok: true,
      challenge: safeChallenge,
      decision: readiness,
      warnings,
      errors,
      auditRecord,
    };
  }
}

export const adaptiveChallengeGenerationRuntime = new AdaptiveChallengeGenerationRuntime();
