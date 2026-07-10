import type { Task034StudentSafeFeedbackContinuationResult, Task034StudentSafeFeedbackCategory } from '../contracts/task034ControlledRolloutContracts';

export interface StudentSafeFeedbackInput {
  studentHash: string;
  rolloutRunId: string;
  feedbackCategory: Task034StudentSafeFeedbackCategory;
  safeSentiment: string;
  difficultyLevel: string;
  feltHelped: boolean;
  safeNextStepNeeded: string;
}

const ALLOWED_CATEGORIES: Task034StudentSafeFeedbackCategory[] = [
  'helpful', 'confusing', 'too_hard', 'too_easy',
  'technical_issue', 'needs_teacher_help', 'not_sure',
];

export function createStudentSafeFeedback(input: StudentSafeFeedbackInput): Task034StudentSafeFeedbackContinuationResult {
  const blockingIssues: string[] = [];

  const validCategory = ALLOWED_CATEGORIES.includes(input.feedbackCategory);
  if (!validCategory) {
    blockingIssues.push('INVALID_FEEDBACK_CATEGORY');
  }

  if (!input.studentHash || !input.studentHash.startsWith('student_hash_task034_safe_')) {
    blockingIssues.push('INVALID_STUDENT_HASH');
  }

  if (input.rolloutRunId !== 'rollout_run_task034_safe') {
    blockingIssues.push('INVALID_ROLLOUT_RUN_ID');
  }

  const forbiddenRawPatterns = ['raw student chat', 'private memory', 'teacher name', 'family private'];
  for (const pattern of forbiddenRawPatterns) {
    if (input.safeSentiment.toLowerCase().includes(pattern) ||
        input.safeNextStepNeeded.toLowerCase().includes(pattern)) {
      blockingIssues.push('RAW_PRIVATE_DATA_IN_FEEDBACK');
      break;
    }
  }

  const ok = validCategory && blockingIssues.length === 0;

  return {
    ok,
    studentHash: input.studentHash,
    rolloutRunId: input.rolloutRunId,
    feedbackCategory: input.feedbackCategory,
    safeSentiment: input.safeSentiment,
    difficultyLevel: input.difficultyLevel,
    feltHelped: input.feltHelped,
    safeNextStepNeeded: input.safeNextStepNeeded,
    createdAt: new Date().toISOString(),
    rawFreeformBlocked: true,
    blockingIssues,
  };
}
