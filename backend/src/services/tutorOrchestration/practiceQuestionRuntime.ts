import type { PracticeQuestionPlan, PracticeQuestionType } from './practiceQuestionContracts';

export interface PracticeQuestionInput {
  requestId: string;
  subjectContext?: string;
  topicContext?: string;
  learnerGrade?: string;
  learnerAge?: number;
  preferredType?: PracticeQuestionType;
  deenSourceSensitive?: boolean;
}

const PRACTICE_TEMPLATES: Record<PracticeQuestionType, {
  generate: (input: PracticeQuestionInput) => { questionText: string; targetSkill: string; expectedValidationMode: string; followUpPrompt: string };
}> = {
  similar_question: {
    generate: (input) => ({
      questionText: `Try a similar question: ${input.topicContext || 'on this topic'}. Work through it step by step.`,
      targetSkill: `${input.subjectContext || 'general'} - similar problem solving`,
      expectedValidationMode: 'numeric_validation',
      followUpPrompt: 'Show your working step by step.',
    }),
  },
  easier_question: {
    generate: (input) => ({
      questionText: `Let us try an easier version first: ${input.topicContext || 'a basic question on this topic'}. Take your time.`,
      targetSkill: `${input.subjectContext || 'general'} - foundational understanding`,
      expectedValidationMode: 'numeric_validation',
      followUpPrompt: 'Try this simpler version and let me know your answer.',
    }),
  },
  harder_question: {
    generate: (input) => ({
      questionText: `Now try a more challenging question: ${input.topicContext || 'an advanced problem on this topic'}. Think carefully.`,
      targetSkill: `${input.subjectContext || 'general'} - advanced application`,
      expectedValidationMode: 'science_logic_validation',
      followUpPrompt: 'Explain your reasoning as you solve it.',
    }),
  },
  mixed_review_question: {
    generate: (input) => ({
      questionText: `Review question covering multiple ideas: ${input.topicContext || 'key concepts from this topic'}.`,
      targetSkill: `${input.subjectContext || 'general'} - mixed review and transfer`,
      expectedValidationMode: 'reasoning_clarity_validation',
      followUpPrompt: 'Try this review question and show your thinking.',
    }),
  },
  concept_check: {
    generate: (input) => ({
      questionText: `Concept check: Can you explain ${input.topicContext || 'the key idea'} in your own words?`,
      targetSkill: `${input.subjectContext || 'general'} - conceptual understanding`,
      expectedValidationMode: 'reasoning_clarity_validation',
      followUpPrompt: 'Write your explanation below.',
    }),
  },
  retrieval_practice: {
    generate: (input) => ({
      questionText: `Retrieval practice: Without looking back, try to recall ${input.topicContext || 'the key facts about this topic'}.`,
      targetSkill: `${input.subjectContext || 'general'} - retrieval and memory`,
      expectedValidationMode: 'no_strict_validation',
      followUpPrompt: 'Write what you remember, then check your notes.',
    }),
  },
  deen_reflection_question: {
    generate: (input) => ({
      questionText: `Reflection: Think about what we learned and how it applies to ${input.topicContext || 'your understanding'}.\nPlease reflect thoughtfully.`,
      targetSkill: `Deen reflection - ${input.subjectContext || 'general'}`,
      expectedValidationMode: 'reflection_validation',
      followUpPrompt: 'Share your reflection.',
    }),
  },
  language_expression_question: {
    generate: (input) => ({
      questionText: `Expression practice: Write a short paragraph about ${input.topicContext || 'this topic'} using complete sentences.`,
      targetSkill: `${input.subjectContext || 'general'} - language expression`,
      expectedValidationMode: 'language_expression_validation',
      followUpPrompt: 'Write your response.',
    }),
  },
};

export function generatePracticeQuestion(input: PracticeQuestionInput): PracticeQuestionPlan {
  if (input.deenSourceSensitive) {
    return {
      requestId: input.requestId,
      questionType: 'deen_reflection_question',
      questionText: `Based on what you have learned, reflect on how this knowledge applies to your understanding.\nPlease answer thoughtfully.`,
      targetSkill: 'Deen reflection',
      expectedValidationMode: 'reflection_validation',
      answerHidden: true,
      followUpPrompt: 'Share your reflection when you are ready.',
    };
  }

  const type = input.preferredType || 'similar_question';
  const template = PRACTICE_TEMPLATES[type];
  const result = template.generate(input);

  return {
    requestId: input.requestId,
    questionType: type,
    questionText: result.questionText,
    targetSkill: result.targetSkill,
    expectedValidationMode: result.expectedValidationMode,
    answerHidden: true,
    followUpPrompt: result.followUpPrompt,
  };
}
