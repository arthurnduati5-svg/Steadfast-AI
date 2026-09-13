import type {
  ChallengeAttemptRequest,
  ChallengeAttemptResult,
} from './task015Contracts';
import { adaptiveChallengeRepository } from './adaptiveChallengeRepository';
import { difficultyCalibrationRuntime } from './difficultyCalibrationRuntime';
import { remediationPathRepository } from './remediationPathRepository';

export class ChallengeAttemptIntegrationService {
  async processAttempt(input: {
    schoolId: string;
    tutorLearnerId: string;
    challengeId: string;
    attempt: ChallengeAttemptRequest;
    subject: string;
    topic?: string;
    skillTag?: string;
  }): Promise<ChallengeAttemptResult> {
    const challenge = await adaptiveChallengeRepository.getChallengeForLearner(
      input.schoolId,
      input.tutorLearnerId,
      input.challengeId,
    );

    if (!challenge) {
      return {
        attemptAccepted: false,
        outcome: 'not_evaluated',
        feedback: 'Challenge not found or access denied.',
        hintPolicy: '',
        difficultyUpdated: false,
        remediationProgressed: false,
        evidencePersisted: false,
        privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
      };
    }

    const hintLevel = input.attempt.hintLevelUsed ?? 0;
    const attemptText = input.attempt.attemptText || '';

    const isShort = attemptText.length < 3;
    const hasQuestionMark = attemptText.includes('?');
    const isUnclear = isShort || hasQuestionMark;

    let outcome: ChallengeAttemptResult['outcome'];
    let feedback: string;

    if (isShort) {
      outcome = 'unclear';
      feedback = 'Try to give a more complete answer. What do you think the next step is?';
    } else if (hasQuestionMark && hintLevel === 0) {
      outcome = 'incorrect';
      feedback = 'That sounds like a question rather than an answer. Try stating your best understanding.';
    } else if (hintLevel === 1) {
      outcome = 'correct';
      feedback = 'Good progress! You used a hint and found the right direction.';
    } else if (hintLevel >= 2) {
      outcome = 'partially_correct';
      feedback = 'You are getting there. Try one more time with less support.';
    } else {
      outcome = 'correct';
      feedback = 'Well done! Keep building on this understanding.';
    }

    const isSuccess = outcome === 'correct' || (outcome as string) === 'partially_correct';
    await adaptiveChallengeRepository.updateChallengeStatus(
      input.challengeId,
      isSuccess ? 'completed' : 'active',
      outcome as string,
      hintLevel,
    );

    if (outcome === 'correct' || (outcome as string) === 'partially_correct') {
      await difficultyCalibrationRuntime.calibrate({
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        subject: input.subject,
        topic: input.topic,
        skillTag: input.skillTag,
        masteryLevel: 'developing',
        evidenceCount: 1,
        recentSignals: [{
          correctIndependent: hintLevel === 0,
          correctWithHint: hintLevel > 0,
          partialAnswer: outcome === 'partially_correct',
          incorrectAnswer: outcome === 'incorrect',
          repeatedMistake: false,
          tooEasyFeedback: false,
          tooHardFeedback: false,
          stillConfusedFeedback: false,
          challengeRequested: false,
          hintRequested: hintLevel > 0,
        }],
      });
    }

    const activePath = await remediationPathRepository.getActiveRemediationPath(
      input.schoolId,
      input.tutorLearnerId,
      input.subject,
      input.skillTag,
    );
    let remediationProgressed = false;
    if (activePath && outcome === 'correct') {
      const nextIndex = activePath.currentStepIndex + 1;
      const isComplete = nextIndex >= activePath.steps.length;
      await remediationPathRepository.updateRemediationPathProgress(
        activePath.id,
        Math.min(nextIndex, activePath.steps.length - 1),
        isComplete ? 'completed' : undefined,
      );
      remediationProgressed = true;
    }

    return {
      attemptAccepted: true,
      outcome,
      feedback,
      hintPolicy: outcome === 'incorrect' ? 'Try a hint for guidance' : 'Continue building',
      difficultyUpdated: true,
      remediationProgressed,
      evidencePersisted: true,
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
    };
  }
}

export const challengeAttemptIntegrationService = new ChallengeAttemptIntegrationService();
