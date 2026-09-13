import type {
  AdaptiveChallengeType,
  DifficultyLevel,
  ChallengeBlueprint,
} from './task015Contracts';

function makeId(): string {
  return `ch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

const socraticOpeners: Record<string, string> = {
  foundation_remediation: 'Let us start with the building blocks. What do you already know about this?',
  similar_practice: 'Here is a question similar to one you have tried before. How would you begin?',
  light_challenge: 'Let us try a gentle challenge. What is the first step you would take?',
  standard_challenge: 'Here is a question that will stretch your thinking. What approach feels right?',
  stretch_challenge: 'This is a deeper question. What patterns do you notice?',
  mastery_check: 'Let us confirm your understanding. How would you explain this to a friend?',
  spaced_review_item: 'Quick review question. What do you remember about this topic?',
  teacher_supported_step: 'Your teacher has suggested focusing here. What makes this step tricky?',
  deen_teacher_referral: 'This question benefits from teacher guidance. Let us note it for your next class.',
};

const promptTemplates: Record<string, string> = {
  foundation_remediation: 'Focus on the core idea of {skillTag} in {subject}. Try this foundation question.',
  similar_practice: 'Practice a question similar to one you have seen before on {skillTag}.',
  light_challenge: 'Try this question on {skillTag}. It builds on what you know.',
  standard_challenge: 'Here is a challenge question on {skillTag} in {subject}. Think carefully before answering.',
  stretch_challenge: 'Deepen your understanding of {skillTag} with this advanced question.',
  mastery_check: 'Show what you know about {skillTag} in {subject}.',
  spaced_review_item: 'Review: {skillTag} in {subject}.',
  teacher_supported_step: 'Guided step on {skillTag}. Follow along.',
  deen_teacher_referral: 'This Deen topic needs teacher guidance. Discuss {skillTag} in your next class.',
};

export class ChallengeBlueprintService {
  generateBlueprint(input: {
    challengeType: AdaptiveChallengeType;
    subject: string;
    topic?: string;
    skillTag?: string;
    difficultyLevel: DifficultyLevel;
    learnerDisplayName?: string;
  }): ChallengeBlueprint {
    const type = input.challengeType;
    const skill = input.skillTag ?? input.topic ?? 'core_skill';
    const subject = input.subject;

    const learnerPrompt = (promptTemplates[type] ?? promptTemplates.foundation_remediation)
      .replace('{skillTag}', skill)
      .replace('{subject}', subject)
      .replace('{topic}', input.topic ?? skill);

    const socraticOpeningQuestion = socraticOpeners[type] ?? socraticOpeners.foundation_remediation;

    const hintsByDifficulty: Record<string, string[]> = {
      foundation: ['Think about the first step.', 'What similar problems have you solved?', 'Break the problem into smaller parts.'],
      easy: ['What do you know so far?', 'Try a simpler version first.', 'Check each step carefully.'],
      standard: ['What approach fits best?', 'What assumptions are you making?', 'Verify your reasoning.'],
      challenging: ['Consider edge cases.', 'What patterns do you see?', 'Test your solution with an example.'],
      stretch: ['What deeper principle applies?', 'Can you generalize this?', 'How would you prove your answer?'],
    };

    return {
      challengeId: makeId(),
      challengeType: type,
      subject: input.subject,
      topic: input.topic,
      skillTag: input.skillTag,
      difficultyLevel: input.difficultyLevel,
      learnerPrompt,
      socraticOpeningQuestion,
      allowedHints: hintsByDifficulty[input.difficultyLevel] ?? hintsByDifficulty.standard,
      expectedSkillSignal: `${skill}_${type}_attempt`,
      safeEvidenceRefs: [],
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
    };
  }
}

export const challengeBlueprintService = new ChallengeBlueprintService();
