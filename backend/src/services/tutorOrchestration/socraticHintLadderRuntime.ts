import type { HintLevel, SocraticHint } from './hintLadderContracts';

export interface HintLadderInput {
  requestId: string;
  hintLevel?: HintLevel;
  learnerGrade?: string;
  learnerAge?: number;
  subjectContext?: string;
  previousHintsUsed?: number;
  adaptivePacing?: 'slow_support' | 'balanced' | 'fast_challenge' | 'unknown';
}

const HINT_LEVEL_ORDER: HintLevel[] = [
  'level_0_clarify_problem',
  'level_1_remind_concept',
  'level_2_point_to_first_step',
  'level_3_give_partial_structure',
  'level_4_check_attempt',
  'level_5_explain_mistake_without_final_answer',
];

function getHintForLevel(
  level: HintLevel,
  pacing: 'slow_support' | 'balanced' | 'fast_challenge' | 'unknown',
  context?: string,
): { hintText: string; guidingQuestion: string; nextLearnerAction: string } {
  const isFast = pacing === 'fast_challenge';
  const isSlow = pacing === 'slow_support';

  switch (level) {
    case 'level_0_clarify_problem':
      return {
        hintText: isSlow
          ? `Let us look at the problem together. What do you think it is asking?`
          : `What is the problem asking you to find or do?`,
        guidingQuestion: isFast
          ? `What key information does the problem give you?`
          : `Can you tell me what the problem says in your own words?`,
        nextLearnerAction: 'Read the problem again and identify what is being asked.',
      };

    case 'level_1_remind_concept':
      return {
        hintText: isSlow
          ? `Remember what we learned about ${context || 'this topic'}. What do you recall?`
          : `Think about the concept of ${context || 'this topic'}. How does it apply here?`,
        guidingQuestion: isFast
          ? `Which part of the concept is most relevant to this problem?`
          : `What do you remember about ${context || 'this topic'} that might help?`,
        nextLearnerAction: 'Recall the key concept and think about how it connects.',
      };

    case 'level_2_point_to_first_step':
      return {
        hintText: isSlow
          ? `The first step is to ${context || 'identify what you know'}. Can you try that?`
          : `Start by ${context || 'identifying the known values'}. What do you get?`,
        guidingQuestion: isFast
          ? `What is the very first thing you should do here?`
          : `What would be a good first step?`,
        nextLearnerAction: 'Try the first step of the problem.',
      };

    case 'level_3_give_partial_structure':
      return {
        hintText: isSlow
          ? `Here is a partial structure to help you:\n${getPartialStructure(context, true)}`
          : `Here is a partial structure:\n${getPartialStructure(context, false)}`,
        guidingQuestion: isFast
          ? `Using this structure, what would the next part look like?`
          : `Can you fill in the next part using this structure?`,
        nextLearnerAction: 'Use the partial structure to continue solving.',
      };

    case 'level_4_check_attempt':
      return {
        hintText: `Let me check what you have done so far. Show me your working.`,
        guidingQuestion: `Which part of your answer are you most unsure about?`,
        nextLearnerAction: 'Share your attempt so it can be checked.',
      };

    case 'level_5_explain_mistake_without_final_answer':
      return {
        hintText: `I can see where the misunderstanding is. The issue is with how we ${context || 'approach this type of problem'}.`,
        guidingQuestion: `If we adjust that part, what do you think changes?`,
        nextLearnerAction: 'Try again with the corrected approach.',
      };
  }
}

function getPartialStructure(context?: string, simplified?: boolean): string {
  if (!context) {
    return simplified ? 'Step 1: ...\nStep 2: ...' : 'Step 1: Identify what is given\nStep 2: Identify what is needed\nStep 3: ...';
  }
  if (context.includes('math') || context.includes('calculate') || context.includes('number')) {
    return simplified
      ? 'Write what you know: ...\nThen do the calculation: ...'
      : 'Given: ...\nFormula: ...\nSubstitute: ...\nCalculate: ...';
  }
  if (context.includes('write') || context.includes('essay') || context.includes('paragraph')) {
    return simplified
      ? 'Main idea: ...\nSupporting detail: ...'
      : 'Introduction sentence: ...\nBody: ...\nConclusion: ...';
  }
  return simplified
    ? 'Step 1: ...\nStep 2: ...'
    : 'Step 1: ...\nStep 2: ...\nStep 3: ...';
}

function getLevelForPacing(
  learnerAge?: number,
  learnerGrade?: string,
  adaptivePacing?: 'slow_support' | 'balanced' | 'fast_challenge' | 'unknown',
): HintLevel {
  if (learnerAge !== undefined && learnerAge <= 6) {
    return 'level_1_remind_concept';
  }
  if (learnerGrade && ['kindergarten', 'kg', 'reception', 'grade 1', 'grade1'].includes(learnerGrade.toLowerCase().trim())) {
    return 'level_1_remind_concept';
  }
  if (adaptivePacing === 'slow_support') {
    return 'level_0_clarify_problem';
  }
  if (adaptivePacing === 'fast_challenge') {
    return 'level_2_point_to_first_step';
  }
  return 'level_1_remind_concept';
}

export function generateSocraticHint(input: HintLadderInput): SocraticHint {
  const level = input.hintLevel || getLevelForPacing(input.learnerAge, input.learnerGrade, input.adaptivePacing);
  const pacing = input.adaptivePacing || 'balanced';
  const hintData = getHintForLevel(level, pacing, input.subjectContext);

  return {
    requestId: input.requestId,
    hintLevel: level,
    hintText: hintData.hintText,
    guidingQuestion: hintData.guidingQuestion,
    revealsFinalAnswer: false,
    nextLearnerAction: hintData.nextLearnerAction,
  };
}
