import type { Task033StudentSafeFeedbackItem, Task033StudentSafeFeedbackCategory } from '../contracts/task033CanaryObservationContracts';

const ALLOWED_CATEGORIES: Task033StudentSafeFeedbackCategory[] = [
  'helpful',
  'confusing',
  'too_hard',
  'too_easy',
  'technical_issue',
  'needs_teacher_help',
  'not_sure',
];

const FORBIDDEN_PATTERNS = [
  /raw student chat/i,
  /private learner memory/i,
  /other student references/i,
  /teacher name/i,
  /family private information/i,
  /safeguarding raw details/i,
  /Deen-sensitive private text/i,
];

export interface StudentSafeFeedbackInput {
  studentHash: string;
  canaryRunId: string;
  feedbackCategory: Task033StudentSafeFeedbackCategory;
  safeSentiment: string;
  difficultyLevel?: string;
  feltHelped?: boolean;
  safeNextStepNeeded?: string;
}

export function submitStudentSafeFeedback(input: StudentSafeFeedbackInput): Task033StudentSafeFeedbackItem {
  if (!ALLOWED_CATEGORIES.includes(input.feedbackCategory)) {
    throw new Error(`Invalid feedback category: ${input.feedbackCategory}. Must be one of: ${ALLOWED_CATEGORIES.join(', ')}`);
  }

  const rawText = JSON.stringify(input).toLowerCase();
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(rawText)) {
      throw new Error(`Forbidden content detected in student feedback: ${pattern}`);
    }
  }

  return {
    studentHash: input.studentHash,
    canaryRunId: input.canaryRunId || 'canary_run_task032_safe',
    feedbackCategory: input.feedbackCategory,
    safeSentiment: input.safeSentiment || 'neutral',
    difficultyLevel: input.difficultyLevel || 'unknown',
    feltHelped: input.feltHelped ?? false,
    safeNextStepNeeded: input.safeNextStepNeeded || 'none',
    createdAt: new Date().toISOString(),
  };
}

export function getStudentSafeFeedbackCategories(): Task033StudentSafeFeedbackCategory[] {
  return [...ALLOWED_CATEGORIES];
}

export function sanitizeFreeformToCategories(rawText: string): Task033StudentSafeFeedbackCategory {
  const lower = rawText.toLowerCase();
  if (lower.includes('help') || lower.includes('good') || lower.includes('yes')) return 'helpful';
  if (lower.includes('confus') || lower.includes('dont understand') || lower.includes('unclear')) return 'confusing';
  if (lower.includes('hard') || lower.includes('difficult') || lower.includes('too much')) return 'too_hard';
  if (lower.includes('easy') || lower.includes('simple') || lower.includes('too easy')) return 'too_easy';
  if (lower.includes('error') || lower.includes('broken') || lower.includes('bug')) return 'technical_issue';
  if (lower.includes('teacher') || lower.includes('help') || lower.includes('need')) return 'needs_teacher_help';
  return 'not_sure';
}
