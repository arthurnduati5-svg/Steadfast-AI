import { getActiveSessionState } from './studentLearningSessionStateRepository';
import type { LearningSessionStateRecord, SessionContextSnapshot } from './studentLearningSessionContracts';

export interface HydrationInput {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
}

export async function hydrateSessionContext(
  input: HydrationInput,
): Promise<SessionContextSnapshot> {
  let sessionState: LearningSessionStateRecord | null = null;

  if (input.sessionId) {
    const { getSessionStateForLearner } = await import('./studentLearningSessionStateRepository');
    sessionState = await getSessionStateForLearner(input.schoolId, input.tutorLearnerId, input.sessionId);
  }

  if (!sessionState) {
    sessionState = await getActiveSessionState(input.schoolId, input.tutorLearnerId);
  }

  if (!sessionState) {
    const { createSessionState } = await import('./studentLearningSessionStateRepository');
    sessionState = await createSessionState({
      schoolId: input.schoolId,
      tutorLearnerId: input.tutorLearnerId,
      studentId: input.studentId,
      subject: input.subject,
      topic: input.topic,
      skillTag: input.skillTag,
    });
  }

  const snapshot: SessionContextSnapshot = {
    sessionState,
  };

  // Load mastery state (safe metadata only)
  try {
    const masteryModule = await import('./masteryService');
    if (typeof (masteryModule as any).getMasterySummaryForLearner === 'function') {
      const masterySummary = await (masteryModule as any).getMasterySummaryForLearner(input.schoolId, input.tutorLearnerId);
      if (masterySummary) {
        snapshot.masteryState = masterySummary as any;
      }
    }
  } catch {
    // Non-blocking - mastery data may not exist
  }

  // Load revision due state
  try {
    const revisionModule = await import('./revisionQueueService');
    if (typeof (revisionModule as any).getRevisionDueItemsForLearner === 'function') {
      const dueItems = await (revisionModule as any).getRevisionDueItemsForLearner(input.schoolId, input.tutorLearnerId);
      if (dueItems && dueItems.length > 0) {
        snapshot.revisionDue = dueItems.map((item: any) => ({
          id: item.id,
          skillTag: item.skillTag || item.skillId,
          dueAt: item.dueAt?.toISOString?.() || item.dueAt,
        }));
      }
    }
  } catch {
    // Non-blocking
  }

  // Load spaced review due
  try {
    const spacedModule = await import('./spacedReviewService');
    if (typeof (spacedModule as any).getSpacedReviewDueForLearner === 'function') {
      const dueReviews = await (spacedModule as any).getSpacedReviewDueForLearner(input.schoolId, input.tutorLearnerId);
      if (dueReviews && dueReviews.length > 0) {
        snapshot.spacedReviewDue = dueReviews.map((item: any) => ({
          id: item.id,
          skillTag: item.skillTag || item.skillId,
          dueAt: item.dueAt?.toISOString?.() || item.dueAt,
        }));
      }
    }
  } catch {
    // Non-blocking
  }

  // Load weak skill state
  try {
    const weakModule = await import('./weakAreaAggregationService');
    if (typeof (weakModule as any).getWeakSkillsForLearner === 'function') {
      const weakSkills = await (weakModule as any).getWeakSkillsForLearner(input.schoolId, input.tutorLearnerId);
      if (weakSkills && weakSkills.length > 0) {
        snapshot.weakSkillState = weakSkills.map((w: any) => ({
          skillId: w.skillId || w.id,
          weaknessScore: w.weaknessScore ?? 0.5,
          label: w.label || w.skillLabel,
        }));
      }
    }
  } catch {
    // Non-blocking
  }

  // Load growth summary
  try {
    const growthModule = await import('./growthProofService');
    if (typeof (growthModule as any).getGrowthSummaryForLearner === 'function') {
      const summary = await (growthModule as any).getGrowthSummaryForLearner(input.schoolId, input.tutorLearnerId);
      if (summary) {
        snapshot.growthSummary = typeof summary === 'string' ? summary : summary.summary;
      }
    }
  } catch {
    // Non-blocking
  }

  // Load adaptive recommendation profile
  try {
    const profileModule = await import('./adaptiveRecommendationProfileService');
    if (typeof (profileModule as any).getProfileForLearner === 'function') {
      const profile = await (profileModule as any).getProfileForLearner(input.schoolId, input.tutorLearnerId);
      if (profile) {
        snapshot.adaptiveProfile = {
          preferredSupportLevel: (profile as any).preferredSupportLevel,
          challengeReadinessSignal: (profile as any).challengeReadinessSignal,
          difficultyCalibration: (profile as any).difficultyCalibration,
        };
      }
    }
  } catch {
    // Non-blocking
  }

  // Load difficulty calibration
  try {
    const diffModule = await import('./difficultyCalibrationRuntime');
    if (typeof (diffModule as any).getDifficultyCalibrationForLearner === 'function') {
      const calibration = await (diffModule as any).getDifficultyCalibrationForLearner(input.schoolId, input.tutorLearnerId);
      if (calibration) {
        snapshot.difficultyCalibration = calibration as any;
      }
    }
  } catch {
    // Non-blocking
  }

  // Load active challenge
  if (sessionState.activeChallengeId) {
    try {
      const challengeModule = await import('./adaptiveChallengeRepository');
      if (typeof (challengeModule as any).getChallengeById === 'function') {
        const challenge = await (challengeModule as any).getChallengeById(sessionState.activeChallengeId);
        if (challenge) {
          snapshot.activeChallenge = {
            id: challenge.id,
            challengeType: (challenge as any).challengeType,
            difficultyLevel: (challenge as any).difficultyLevel,
            status: (challenge as any).status,
          };
        }
      }
    } catch {
      // Non-blocking
    }
  }

  // Load active remediation path
  if (sessionState.activeRemediationPathId) {
    try {
      const remediationModule = await import('./remediationPathRepository');
      if (typeof (remediationModule as any).getRemediationPathById === 'function') {
        const path = await (remediationModule as any).getRemediationPathById(sessionState.activeRemediationPathId);
        if (path) {
          snapshot.activeRemediationPath = {
            id: path.id,
            currentStepIndex: (path as any).currentStepIndex,
            status: (path as any).status,
            totalSteps: Array.isArray((path as any).steps) ? (path as any).steps.length : 0,
          };
        }
      }
    } catch {
      // Non-blocking
    }
  }

  return snapshot;
}
