import type { MistakeAnalysis } from './mistakeTaxonomyContracts';
import type { StepCheckResult, StepCheckStatus } from './stepCheckingContracts';

export interface AttemptFeedbackInput {
  requestId: string;
  learnerAttempt: string;
  stepCheckResult?: StepCheckResult;
  mistakeAnalysis?: MistakeAnalysis;
  allowedAnswerDepth: string;
}

export interface AttemptFeedback {
  requestId: string;
  whatIsCorrect: string;
  whatNeedsCorrection: string;
  oneNextStep: string;
  guidingQuestion: string;
  encouragement: string;
  revealsFinalAnswer: boolean;
}

function buildEncouragement(): string {
  const phrases = [
    'Good effort! Keep going.',
    'You are making progress. Well done!',
    'Keep up the good work!',
    'You are thinking in the right direction.',
    'Practice makes progress. Keep trying!',
    'I can see you are working hard. That is great!',
    'Every attempt helps you learn. Well done!',
  ];
  return phrases[Math.floor(Math.random() * phrases.length)];
}

function buildGuidingQuestion(stepStatus?: StepCheckStatus): string {
  switch (stepStatus) {
    case 'correct': return 'Can you explain how you arrived at this answer?';
    case 'partially_correct': return 'Which part of your answer are you most confident about?';
    case 'incorrect': return 'What was your first step? Let us check it together.';
    case 'unclear': return 'Can you tell me more about how you got this answer?';
    case 'needs_source_check': return 'Which source are you using for your answer?';
    case 'needs_teacher_or_scholar': return 'Would you like me to help you understand this differently?';
    default: return 'What part of this problem would you like help with?';
  }
}

export function generateAttemptFeedback(input: AttemptFeedbackInput): AttemptFeedback {
  const status = input.stepCheckResult?.status;

  if (status === 'correct') {
    return {
      requestId: input.requestId,
      whatIsCorrect: 'Your answer is correct!',
      whatNeedsCorrection: 'Nothing - well done!',
      oneNextStep: 'Try explaining your reasoning to reinforce your understanding.',
      guidingQuestion: buildGuidingQuestion(status),
      encouragement: 'Excellent work! You have mastered this.',
      revealsFinalAnswer: input.allowedAnswerDepth !== 'hint_only',
    };
  }

  if (status === 'partially_correct') {
    return {
      requestId: input.requestId,
      whatIsCorrect: 'You have the right approach and your thinking is on track.',
      whatNeedsCorrection: 'There is a small error in your answer. Check your working carefully.',
      oneNextStep: 'Review each step one more time and see if you can spot the error.',
      guidingQuestion: buildGuidingQuestion(status),
      encouragement: buildEncouragement(),
      revealsFinalAnswer: false,
    };
  }

  if (status === 'incorrect') {
    const mistakeBasedHint = input.mistakeAnalysis
      ? `It looks like this might be a ${input.mistakeAnalysis.category.replace(/_/g, ' ')}. ${input.mistakeAnalysis.feedbackStrategy}`
      : 'Let us approach this differently.';

    return {
      requestId: input.requestId,
      whatIsCorrect: 'Thank you for submitting your attempt. Trying is the first step to learning.',
      whatNeedsCorrection: 'Your answer needs some revision. Let us work through it together.',
      oneNextStep: mistakeBasedHint,
      guidingQuestion: buildGuidingQuestion(status),
      encouragement: buildEncouragement(),
      revealsFinalAnswer: false,
    };
  }

  return {
    requestId: input.requestId,
    whatIsCorrect: input.learnerAttempt ? 'You have shared your thinking. That is a great start.' : '',
    whatNeedsCorrection: 'I need more information to give you useful feedback.',
    oneNextStep: 'Please share your answer or reasoning so I can help you.',
    guidingQuestion: buildGuidingQuestion(status),
    encouragement: buildEncouragement(),
    revealsFinalAnswer: false,
  };
}
