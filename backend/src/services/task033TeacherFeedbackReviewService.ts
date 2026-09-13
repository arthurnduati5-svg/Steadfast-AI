import type { Task033TeacherFeedbackItem, Task033TeacherFeedbackCategory } from '../contracts/task033CanaryObservationContracts';

const FORBIDDEN_TEACHER_FEEDBACK_PATTERNS = [
  /raw student chat/i,
  /student full name/i,
  /student email/i,
  /student phone/i,
  /private learner memory/i,
  /teacher-only notes/i,
  /safeguarding raw details/i,
  /Deen-sensitive private text/i,
  /answer keys/i,
  /protected rubrics/i,
];

export interface TeacherFeedbackInput {
  teacherHash: string;
  canaryRunId: string;
  category: Task033TeacherFeedbackCategory;
  safeSummary: string;
  assignmentScope: string[];
}

export function submitTeacherFeedback(input: TeacherFeedbackInput): Task033TeacherFeedbackItem {
  const blockingIssues: string[] = [];

  const rawText = JSON.stringify(input).toLowerCase();
  for (const pattern of FORBIDDEN_TEACHER_FEEDBACK_PATTERNS) {
    if (pattern.test(rawText)) {
      blockingIssues.push(`forbidden_content_in_teacher_feedback: ${pattern}`);
    }
  }

  return {
    feedbackId: `teacher_feedback_task033_safe_${Date.now()}`,
    teacherHash: input.teacherHash,
    canaryRunId: input.canaryRunId || 'canary_run_task032_safe',
    category: input.category,
    safeSummary: input.safeSummary,
    createdAt: new Date().toISOString(),
    assignmentScope: input.assignmentScope || [],
    rawChatExposed: false,
    privateMemoryExposed: false,
    blockingIssues,
  };
}

export function validateTeacherScope(teacherHash: string, assignmentScope: string[], allowedScope: string[]): boolean {
  return assignmentScope.every(s => allowedScope.includes(s));
}

export function canTeacherSubmitAdminDecision(role: string): boolean {
  return role === 'admin' || role === 'operator';
}
