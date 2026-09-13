// Steadfast AI - Socratic Question Ladder Service v1
// Provides graduated question types for Socratic tutoring.
// Selects question type based on learner state and keeps the
// tutor in question-first learning mode.

import type { QuestionType, ChallengeCalibrationLevel } from './socraticTutorPolicyContracts';

const QUESTION_TEMPLATES: Record<QuestionType, (topic: string, context?: string) => string> = {
  clarify_what_is_being_asked: (topic, context) =>
    `Let us look at this ${topic} problem. ${context || 'What is the question asking you to find?'}`,
  identify_knowns_and_unknowns: (topic, context) =>
    `For this ${topic} problem, ${context || 'what information do you already have, and what do you need to find out?'}`,
  activate_prior_knowledge: (topic, context) =>
    `What do you already know about ${topic}? ${context || 'How might that help us here?'}`,
  ask_for_first_step: (topic, _context) =>
    `What would be the first step to solve this ${topic} problem?`,
  check_misconception: (topic, context) =>
    `Some students think that for ${topic}, you should ${context || 'just apply the formula directly'}. Why might that not work here?`,
  ask_why: (topic, _context) =>
    `Why does that approach work for ${topic}? What is the reasoning behind it?`,
  ask_how_they_know: (topic, _context) =>
    `How do you know that is the right approach for ${topic}? What evidence supports your thinking?`,
  ask_for_alternative_method: (topic, context) =>
    `Is there another way to solve this ${topic} problem? ${context || 'How would that be different?'}`,
  ask_to_explain_in_own_words: (topic, _context) =>
    `Can you explain what ${topic} means in your own words?`,
  ask_to_transfer_idea_to_similar_problem: (topic, context) =>
    `How would you apply what you learned about ${topic} to ${context || 'a similar problem with different numbers?'}`,
};

export interface QuestionSelectionInput {
  topic: string;
  context?: string;
  masteryLevel?: number | null;
  attemptCount?: number | null;
  confidenceLevel?: number | null;
  challengeLevel?: ChallengeCalibrationLevel | null;
  hasMisconception?: boolean;
  isFirstInteraction?: boolean;
}

export interface QuestionSelectionOutput {
  selectedType: QuestionType;
  questionText: string;
  reason: string;
  nextRecommendedAction: 'ask_next_question' | 'give_hint' | 'reteach' | 'challenge' | 'reflection';
}

function buildQuestionOutput(input: {
  selectedType: QuestionType;
  templateType?: QuestionType;
  topic: string;
  context?: string;
  reason: string;
  nextRecommendedAction: QuestionSelectionOutput['nextRecommendedAction'];
}): QuestionSelectionOutput {
  const templateType = input.templateType || input.selectedType;
  return {
    selectedType: input.selectedType,
    questionText: QUESTION_TEMPLATES[templateType](input.topic, input.context),
    reason: input.reason,
    nextRecommendedAction: input.nextRecommendedAction,
  };
}

/**
 * Select the appropriate question type based on learner state.
 */
export function selectQuestionType(input: QuestionSelectionInput): QuestionSelectionOutput {
  const topic = input.topic || 'this topic';
  const context = input.context;
  const attempts = input.attemptCount ?? 0;
  const mastery = input.masteryLevel ?? 0;
  const confidence = input.confidenceLevel ?? 50;
  const challenge = input.challengeLevel ?? 'productive_struggle';

  if (input.isFirstInteraction || (mastery < 20 && attempts <= 0)) {
    return buildQuestionOutput({
      selectedType: 'clarify_what_is_being_asked',
      topic,
      context,
      reason: 'Starting by clarifying what the question is asking.',
      nextRecommendedAction: 'ask_next_question',
    });
  }

  if (input.hasMisconception) {
    return buildQuestionOutput({
      selectedType: 'check_misconception',
      topic,
      context,
      reason: 'Active misconception detected. Checking understanding of common error.',
      nextRecommendedAction: 'give_hint',
    });
  }

  if (challenge === 'blocked' || challenge === 'needs_foundation') {
    return buildQuestionOutput({
      selectedType: attempts >= 3 ? 'ask_why' : 'identify_knowns_and_unknowns',
      topic,
      context,
      reason: attempts >= 3
        ? 'Learner is blocked after several attempts. Probing reasoning to identify gap.'
        : 'Learner may be blocked. Helping to break down the problem.',
      nextRecommendedAction: attempts >= 3 ? 'reteach' : 'ask_next_question',
    });
  }

  if (challenge === 'too_easy' || challenge === 'ready_for_challenge') {
    return buildQuestionOutput({
      selectedType: confidence >= 80 ? 'ask_to_transfer_idea_to_similar_problem' : 'ask_for_alternative_method',
      topic,
      context,
      reason: confidence >= 80
        ? 'Learner finds this easy. Testing transfer of knowledge.'
        : 'Learner shows understanding. Asking for an alternative method to deepen knowledge.',
      nextRecommendedAction: confidence >= 80 ? 'challenge' : 'ask_next_question',
    });
  }

  if (mastery >= 85 && attempts >= 8 && confidence >= 80) {
    return buildQuestionOutput({
      selectedType: 'ask_to_transfer_idea' as QuestionType,
      templateType: 'ask_to_transfer_idea_to_similar_problem',
      topic,
      context,
      reason: 'Learner is advanced. Testing transfer of the idea to a related problem.',
      nextRecommendedAction: 'challenge',
    });
  }

  if (mastery >= 70 && attempts >= 2 && confidence >= 60) {
    return buildQuestionOutput({
      selectedType: 'ask_to_explain_in_own_words',
      topic,
      context,
      reason: 'Learner shows good mastery. Asking to explain in own words to solidify understanding.',
      nextRecommendedAction: 'reflection',
    });
  }

  if (mastery < 40 && attempts <= 1) {
    return buildQuestionOutput({
      selectedType: 'identify_knowns_and_unknowns',
      topic,
      context,
      reason: 'Learner is early in the process. Helping identify knowns and unknowns.',
      nextRecommendedAction: 'ask_next_question',
    });
  }

  if (mastery >= 40 && mastery < 55 && attempts >= 2) {
    return buildQuestionOutput({
      selectedType: 'activate_prior_knowledge',
      topic,
      context,
      reason: 'Learner is developing. Activating relevant prior knowledge.',
      nextRecommendedAction: 'ask_next_question',
    });
  }

  if (mastery >= 55 && mastery < 70 && attempts >= 4) {
    return buildQuestionOutput({
      selectedType: 'ask_for_first_step',
      topic,
      context,
      reason: 'Learner is in productive struggle. Asking for the first actionable step.',
      nextRecommendedAction: 'ask_next_question',
    });
  }

  if (mastery >= 40 && attempts >= 2) {
    return buildQuestionOutput({
      selectedType: 'ask_how_they_know',
      topic,
      context,
      reason: 'Learner has made progress. Asking for evidence of their reasoning.',
      nextRecommendedAction: 'ask_next_question',
    });
  }

  return buildQuestionOutput({
    selectedType: 'ask_for_first_step',
    topic,
    context,
    reason: 'Default question to engage learner in active problem-solving.',
    nextRecommendedAction: 'ask_next_question',
  });
}

/**
 * Get all available question types as a reference.
 */
export function getQuestionLadderTypes(): Array<{ type: QuestionType; name: string; description: string }> {
  return [
    { type: 'clarify_what_is_being_asked' as QuestionType, name: 'Clarify', description: 'Ask the learner to restate the question in their own words.' },
    { type: 'identify_knowns_and_unknowns' as QuestionType, name: 'Known/Unknown', description: 'Help the learner identify given information and what needs to be found.' },
    { type: 'activate_prior_knowledge' as QuestionType, name: 'Prior Knowledge', description: 'Prompt the learner to recall relevant concepts they already know.' },
    { type: 'ask_for_first_step' as QuestionType, name: 'First Step', description: 'Ask the learner what the first logical step would be.' },
    { type: 'check_misconception' as QuestionType, name: 'Misconception Check', description: 'Address a common misconception related to the topic.' },
    { type: 'ask_why' as QuestionType, name: 'Why', description: 'Ask the learner to explain why a particular approach works.' },
    { type: 'ask_how_they_know' as QuestionType, name: 'Evidence', description: 'Ask the learner how they know their approach is correct.' },
    { type: 'ask_for_alternative_method' as QuestionType, name: 'Alternative Method', description: 'Challenge the learner to find another way to solve the problem.' },
    { type: 'ask_to_explain_in_own_words' as QuestionType, name: 'Own Words', description: 'Ask the learner to explain the concept in their own words.' },
    { type: 'ask_to_transfer_idea_to_similar_problem' as QuestionType, name: 'Transfer', description: 'Ask the learner to apply the concept to a similar but different problem.' },
  ];
}
