import type { LearnerSafeChallengeResponse, ChallengeBlueprint } from './task015Contracts';

const FORBIDDEN_PATTERNS = [
  /answer\s*key/i,
  /solution\s*steps?/i,
  /final\s*answer/i,
  /expected\s*answer/i,
  /hidden\s*scor/i,
  /model\s*draft/i,
  /provider\s*Response/i,
  /internal\s*check/i,
  /rubric\s*internal/i,
  /teacher.only/i,
  /private\s*memory/i,
  /safeguarding\s*raw/i,
  /deen\s*sensitive\s*private/i,
];

const SHAME_PATTERNS = [
  /you\s+failed/i,
  /you\s+are\s+weak/i,
  /you\s+are\s+behind/i,
  /you\s+cannot\s+do/i,
  /you\s+must\s+go\s+back/i,
];

export interface SafetyGuardResult {
  safe: boolean;
  sanitizedChallenge: LearnerSafeChallengeResponse | null;
  redactionApplied: boolean;
  redactionReasons: string[];
  blockedReason?: string;
}

export class ChallengeSafetyGuardService {
  validateChallenge(blueprint: ChallengeBlueprint): SafetyGuardResult {
    const redactionReasons: string[] = [];
    let sanitized = { ...blueprint };
    let blocked = false;
    let blockReason: string | undefined;

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.test(sanitized.learnerPrompt)) {
        sanitized.learnerPrompt = sanitized.learnerPrompt.replace(pattern, '[redacted]');
        redactionReasons.push(`redacted_pattern: ${pattern.source}`);
      }
      if (sanitized.socraticOpeningQuestion && pattern.test(sanitized.socraticOpeningQuestion)) {
        sanitized.socraticOpeningQuestion = sanitized.socraticOpeningQuestion.replace(pattern, '[redacted]');
        redactionReasons.push(`redacted_pattern: ${pattern.source}`);
      }
    }

    for (const pattern of SHAME_PATTERNS) {
      if (pattern.test(sanitized.learnerPrompt)) {
        blocked = true;
        blockReason = 'Challenge contains shaming language';
        redactionReasons.push('shame_language_detected');
      }
    }

    if (sanitized.challengeType === 'deen_teacher_referral') {
      redactionReasons.push('deen_teacher_referral_boundary');
    }

    const allowedActions = ['submit_attempt', 'request_hint', 'skip_current'];
    if (sanitized.challengeType === 'foundation_remediation') {
      allowedActions.push('request_teacher_help');
      allowedActions.push('try_similar');
    }

    const response: LearnerSafeChallengeResponse = {
      challengeId: sanitized.challengeId,
      challengeType: sanitized.challengeType,
      subject: sanitized.subject,
      topic: sanitized.topic,
      skillTag: sanitized.skillTag,
      difficultyLevel: sanitized.difficultyLevel,
      learnerPrompt: sanitized.learnerPrompt,
      socraticOpeningQuestion: sanitized.socraticOpeningQuestion,
      allowedActions,
      hintPolicy: sanitized.challengeType === 'foundation_remediation'
        ? 'More hints available for guided support'
        : 'Start with fewer hints, more available on request',
      whyThisLevel: '',
      privacyMetadata: sanitized.privacyMetadata as Record<string, unknown>,
      generatedAt: new Date().toISOString(),
    };

    return {
      safe: !blocked,
      sanitizedChallenge: response,
      redactionApplied: redactionReasons.length > 0,
      redactionReasons,
      blockedReason: blockReason,
    };
  }
}

export const challengeSafetyGuardService = new ChallengeSafetyGuardService();
