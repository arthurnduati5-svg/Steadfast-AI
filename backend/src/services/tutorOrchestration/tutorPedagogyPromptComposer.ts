import type { LearningResponsePlan } from './learningResponsePlannerContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';
import type { AttemptFeedback } from './attemptFeedbackRuntime';
import type { PracticeQuestionPlan } from './practiceQuestionContracts';
import type { SubjectValidationResult } from './subjectValidationRuntime';

export interface PedagogyPromptInput {
  requestId: string;
  messageText: string;
  plan: LearningResponsePlan;
  hint?: SocraticHint;
  stepCheck?: StepCheckResult;
  mistakeAnalysis?: MistakeAnalysis;
  attemptFeedback?: AttemptFeedback;
  practiceQuestion?: PracticeQuestionPlan;
  subjectValidation?: SubjectValidationResult;
  learnerGrade?: string;
  learnerAge?: number;
  deenSourceSensitive?: boolean;
  curriculumDirectives?: string[];
}

export interface PedagogyPrompt {
  requestId: string;
  systemInstruction: string;
  generationInstruction: string;
  noFinalAnswerBoundary: string;
  deenBoundary: string;
  ageToneGuidance: string;
  combinedPrompt: string;
}

function buildNoFinalAnswerBoundary(plan: LearningResponsePlan): string {
  if (plan.allowedAnswerDepth === 'hint_only' || plan.allowedAnswerDepth === 'one_step_guidance') {
    return 'CRITICAL: You must NOT provide the final answer. Guide the learner to discover it themselves. Give hints, ask Socratic questions, and encourage thinking.';
  }
  return 'You may explain concepts but do not complete specific homework problems or give direct answers that bypass learning.';
}

function buildDeenBoundary(deenSensitive?: boolean): string {
  if (deenSensitive) {
    return 'DEEN POLICY: If the topic involves Islamic content: (1) Do not invent Quranic verses or hadith. (2) Do not give fatwa-like rulings. (3) Refer to approved sources only. (4) Use humble, careful language. (5) Recommend consulting a knowledgeable scholar for advanced fiqh, tafsir, or hadith authenticity questions.';
  }
  return '';
}

function buildAgeToneGuidance(grade?: string, age?: number): string {
  if (age !== undefined && age <= 6) {
    return 'Use very simple words. Short sentences. One small question at a time. Be warm and encouraging.';
  }
  if (age !== undefined && age <= 10) {
    return 'Use simple language with clear examples. Be encouraging. Ask one question at a time.';
  }
  if (grade && ['kindergarten', 'kg', 'reception'].includes(grade.toLowerCase().trim())) {
    return 'Use very simple words. Short sentences. One small question at a time. Be warm and encouraging.';
  }
  if (grade && ['grade 1', 'grade 2', 'grade 3'].some(g => grade.toLowerCase().includes(g))) {
    return 'Use simple language. Clear examples. Be encouraging and patient.';
  }
  return 'Use clear, respectful language appropriate for a student. Be encouraging and supportive.';
}

export function composePedagogyPrompt(input: PedagogyPromptInput): PedagogyPrompt {
  const systemInstruction = `You are a Socratic tutor. Your role is to guide the learner to think and discover answers themselves. Never give direct final answers when the learner needs to figure something out. Ask guiding questions. Give hints. Check understanding. Be patient and encouraging.`;

  const noFinalAnswerBoundary = buildNoFinalAnswerBoundary(input.plan);
  const deenBoundary = buildDeenBoundary(input.deenSourceSensitive);
  const ageToneGuidance = buildAgeToneGuidance(input.learnerGrade, input.learnerAge);

  let extraInstructions = '';
  if (input.hint) {
    extraInstructions += `\nHint required: "${input.hint.hintText}" - Guide towards this hint without revealing the full answer.`;
  }
  if (input.stepCheck) {
    extraInstructions += `\nStep check result: ${input.stepCheck.status}. ${input.stepCheck.nextStepSuggestion}`;
  }
  if (input.mistakeAnalysis && input.mistakeAnalysis.category !== 'unknown') {
    extraInstructions += `\nLearner mistake: ${input.mistakeAnalysis.category}. Feedback strategy: ${input.mistakeAnalysis.feedbackStrategy}`;
  }
  if (input.attemptFeedback) {
    extraInstructions += `\nFeedback to incorporate: ${input.attemptFeedback.whatIsCorrect} ${input.attemptFeedback.whatNeedsCorrection}`;
    extraInstructions += `\nNext step: ${input.attemptFeedback.oneNextStep}`;
    extraInstructions += `\nGuiding question: ${input.attemptFeedback.guidingQuestion}`;
  }
  if (input.practiceQuestion) {
    extraInstructions += `\nPractice question: "${input.practiceQuestion.questionText}" - Present this to the learner and ask them to try it. Do NOT reveal the answer.`;
  }
  if (input.subjectValidation) {
    extraInstructions += `\nSubject validation: ${input.subjectValidation.reasoning}`;
  }

  const generationInstruction = `${input.plan.generationInstruction}\n\n${extraInstructions}`;

  const combinedPrompt = [
    systemInstruction,
    '',
    `Original learner message: "${input.messageText}"`,
    '',
    noFinalAnswerBoundary,
    deenBoundary,
    ageToneGuidance,
    '',
    'Response instruction:',
    generationInstruction,
  ].filter(Boolean).join('\n');

  return {
    requestId: input.requestId,
    systemInstruction,
    generationInstruction,
    noFinalAnswerBoundary,
    deenBoundary,
    ageToneGuidance,
    combinedPrompt,
  };
}
