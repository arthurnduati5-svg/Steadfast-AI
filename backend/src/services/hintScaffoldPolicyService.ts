import type { HintScaffoldDecision } from './task015Contracts';

export class HintScaffoldPolicyService {
  getHint(input: {
    currentAttemptNumber: number;
    totalHintsRequested: number;
    challengeType: string;
    skillTag?: string;
    subject?: string;
  }): HintScaffoldDecision {
    const { currentAttemptNumber, totalHintsRequested, challengeType } = input;
    const isRemediation = challengeType === 'foundation_remediation';

    if (isRemediation) {
      if (totalHintsRequested <= 2) {
        return {
          scaffoldType: 'question_based',
          scaffoldText: `Think about what the question is asking. What information do you already have?`,
          hintLevel: 1,
          isFinalAnswer: false,
        };
      }
      if (totalHintsRequested <= 4) {
        return {
          scaffoldType: 'stronger_scaffold',
          scaffoldText: `Here is a way to think about it: break the problem into two smaller steps. What would the first step look like?`,
          hintLevel: 2,
          isFinalAnswer: false,
        };
      }
      return {
        scaffoldType: 'worked_pattern',
        scaffoldText: `Here is a similar type of problem worked out step by step. Notice the pattern, then try your version.`,
        hintLevel: 3,
        isFinalAnswer: false,
      };
    }

    if (totalHintsRequested <= 1) {
      return {
        scaffoldType: 'question_based',
        scaffoldText: `What does the question ask you to find? Can you restate it in your own words?`,
        hintLevel: 1,
        isFinalAnswer: false,
      };
    }

    if (totalHintsRequested <= 3) {
      return {
        scaffoldType: 'stronger_scaffold',
        scaffoldText: `Consider what similar problems have in common. How would you approach the first step?`,
        hintLevel: 2,
        isFinalAnswer: false,
      };
    }

    if (totalHintsRequested <= 5) {
      return {
        scaffoldType: 'worked_pattern',
        scaffoldText: `Here is a pattern to consider. Apply the same reasoning to your question without copying the final result.`,
        hintLevel: 3,
        isFinalAnswer: false,
      };
    }

    return {
      scaffoldType: 'no_more_hints',
      scaffoldText: `Try your best with what you have. If you are stuck, ask your teacher for guidance.`,
      hintLevel: 4,
      isFinalAnswer: false,
    };
  }
}

export const hintScaffoldPolicyService = new HintScaffoldPolicyService();
