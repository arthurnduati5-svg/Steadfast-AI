// Steadfast AI - Socratic Hint Ladder Service v1
// Provides graduated hints from orientation to reflection.
// Selects hint level based on mastery, attempts, confidence,
// and integrity risk. Never jumps to final answers.

import type { HintLevel, ChallengeCalibrationLevel } from './socraticTutorPolicyContracts';

const HINT_TEMPLATES: Record<HintLevel, (topic: string, context?: string) => string> = {
  1: (topic, _context) =>
    `Let us look at ${topic}. What do you notice about this problem?`,
  2: (topic, context) =>
    `Remember what we learned about ${topic}. ${context || 'What does that tell you about this problem?'}`,
  3: (topic, _context) =>
    `Here is a clue: in ${topic}, the key concept is to think about how the parts relate to each other. What does that suggest?`,
  4: (topic, context) =>
    `Let me show one small step. For ${topic}, start by ${context || 'identifying what you know and what you need to find'}. Now try the next step yourself.`,
  5: (topic, context) =>
    `A common mistake here is to think ${context || 'that the answer is straightforward without checking each step'}. Why might that not work for ${topic}?`,
  6: (topic, _context) =>
    `Here is a similar example: ${topic} works the same way as what we practiced before. How would you adapt that approach to this problem?`,
  7: (topic, _context) =>
    `You are making progress. What is the very next step you need to take for ${topic}?`,
  8: (topic, _context) =>
    `Let us check your understanding of ${topic}. Can you explain in your own words how you arrived at your answer so far?`,
};

const HINT_LABELS: Record<HintLevel, string> = {
  1: 'orientation_hint',
  2: 'recall_prompt',
  3: 'concept_clue',
  4: 'worked_micro_step',
  5: 'misconception_contrast',
  6: 'similar_example',
  7: 'next_step_prompt',
  8: 'reflection_check',
};

export interface HintSelectionInput {
  topic?: string;
  context?: string;
  masteryLevel?: number | null;
  attemptCount?: number | null;
  confidenceLevel?: number | null;
  recentSuccessRate?: number | null;
  challengeLevel?: ChallengeCalibrationLevel | null;
  integritySignalActive?: boolean;
}

export interface HintSelectionOutput {
  selectedLevel: HintLevel;
  hintText: string;
  reason: string;
  nextRecommendedAction: 'ask_question' | 'give_next_hint' | 'reteach' | 'challenge' | 'reflection';
  level: HintLevel;
  label: string;
  template: string;
}

function buildHintOutput(input: {
  selectedLevel: HintLevel;
  topic: string;
  context?: string;
  reason: string;
  nextRecommendedAction: HintSelectionOutput['nextRecommendedAction'];
}): HintSelectionOutput {
  const hintText = HINT_TEMPLATES[input.selectedLevel](input.topic, input.context);
  return {
    selectedLevel: input.selectedLevel,
    hintText,
    reason: input.reason,
    nextRecommendedAction: input.nextRecommendedAction,
    level: input.selectedLevel,
    label: HINT_LABELS[input.selectedLevel],
    template: hintText,
  };
}

/**
 * Select the appropriate hint level based on learner state.
 */
export function selectHintLevel(input: HintSelectionInput): HintSelectionOutput {
  const topic = input.topic || 'this topic';
  const context = input.context;
  const attempts = input.attemptCount ?? 0;
  const mastery = input.masteryLevel ?? 0;
  const confidence = input.confidenceLevel ?? 50;
  const challenge = input.challengeLevel ?? 'productive_struggle';

  if (input.integritySignalActive) {
    return buildHintOutput({
      selectedLevel: 1,
      topic,
      context,
      reason: 'Integrity signal active. Starting with orientation to redirect to Socratic learning.',
      nextRecommendedAction: 'ask_question',
    });
  }

  if (challenge === 'blocked' || challenge === 'needs_foundation' || challenge === 'too_hard') {
    return buildHintOutput({
      selectedLevel: attempts <= 1 ? 3 : 5,
      topic,
      context,
      reason: attempts <= 1
        ? 'Learner appears blocked. Giving a concept clue.'
        : 'Learner is still blocked after initial attempt. Showing misconception contrast.',
      nextRecommendedAction: attempts <= 1 ? 'ask_question' : 'reteach',
    });
  }

  if (challenge === 'ready_for_challenge') {
    return buildHintOutput({
      selectedLevel: attempts <= 2 ? 7 : 8,
      topic,
      context,
      reason: attempts <= 2
        ? 'Learner is ready for challenge. Prompting for next step.'
        : 'Learner is ready for challenge with multiple attempts. Checking understanding.',
      nextRecommendedAction: attempts <= 2 ? 'challenge' : 'reflection',
    });
  }

  if (mastery >= 80 && confidence >= 70 && attempts >= 8) {
    return buildHintOutput({
      selectedLevel: 8,
      topic,
      context,
      reason: 'Learner has high mastery and confidence. Time for reflection check.',
      nextRecommendedAction: 'reflection',
    });
  }

  if (mastery >= 70 && attempts >= 5) {
    return buildHintOutput({
      selectedLevel: 7,
      topic,
      context,
      reason: 'Learner has higher mastery with multiple attempts. Prompting for the next step.',
      nextRecommendedAction: 'challenge',
    });
  }

  if (mastery >= 55 && attempts >= 3) {
    return buildHintOutput({
      selectedLevel: 3,
      topic,
      context,
      reason: 'Learner is developing mastery. Offering a concept clue.',
      nextRecommendedAction: 'ask_question',
    });
  }

  if (mastery >= 40 && attempts >= 2) {
    return buildHintOutput({
      selectedLevel: 2,
      topic,
      context,
      reason: 'Learner has medium mastery. Prompting recall of prior knowledge.',
      nextRecommendedAction: 'ask_question',
    });
  }

  if (attempts >= 4) {
    return buildHintOutput({
      selectedLevel: 6,
      topic,
      context,
      reason: 'Learner has made several attempts. Providing a similar example.',
      nextRecommendedAction: 'give_next_hint',
    });
  }

  if (attempts >= 2) {
    return buildHintOutput({
      selectedLevel: 4,
      topic,
      context,
      reason: 'Learner has attempted but needs more guidance. Showing a worked micro-step.',
      nextRecommendedAction: 'ask_question',
    });
  }

  return buildHintOutput({
    selectedLevel: 1,
    topic,
    context,
    reason: 'Starting with an orientation question to activate learner thinking.',
    nextRecommendedAction: 'ask_question',
  });
}

/**
 * Get all available hint levels as a reference.
 */
export function getHintLadderLevels(): Array<{ level: HintLevel; label: string; name: string; description: string }> {
  return [
    { level: 1, label: HINT_LABELS[1], name: 'orientation hint', description: 'Direct attention to the problem and ask what they notice.' },
    { level: 2, label: HINT_LABELS[2], name: 'recall prompt', description: 'Activate prior knowledge related to the topic.' },
    { level: 3, label: HINT_LABELS[3], name: 'concept clue', description: 'Give a conceptual clue without revealing the answer.' },
    { level: 4, label: HINT_LABELS[4], name: 'worked micro-step', description: 'Show one small step, then ask learner to continue.' },
    { level: 5, label: HINT_LABELS[5], name: 'misconception contrast', description: 'Contrast the correct approach with a common mistake.' },
    { level: 6, label: HINT_LABELS[6], name: 'similar example', description: 'Provide a similar problem with a worked approach.' },
    { level: 7, label: HINT_LABELS[7], name: 'next-step prompt', description: 'Prompt the learner for the next logical step.' },
    { level: 8, label: HINT_LABELS[8], name: 'reflection check', description: 'Ask the learner to explain their reasoning in their own words.' },
  ];
}
