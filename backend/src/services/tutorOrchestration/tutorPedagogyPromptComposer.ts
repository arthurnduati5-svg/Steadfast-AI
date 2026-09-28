import type { LearningResponsePlan } from './learningResponsePlannerContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';
import type { AttemptFeedback } from './attemptFeedbackRuntime';
import type { PracticeQuestionPlan } from './practiceQuestionContracts';
import type { SubjectValidationResult } from './subjectValidationRuntime';
import type { TutorSpecialistResult } from './tutorSpecialistContracts';

export interface PedagogyPromptInput {
  requestId: string;
  messageText: string;
  plan: LearningResponsePlan;
  intent?: string;
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
  pacingDirective?: string;
  preferredLanguage?: string;
  /** R11: bounded specialist context. Rendered AFTER hard policy/boundaries; can never override sections 1–3. */
  specialist?: TutorSpecialistResult;
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

const MAX_CURRICULUM_DIRECTIVES = 5;
const MAX_DIRECTIVE_LENGTH = 160;

type AgeCalibrationBucket = 'EARLY' | 'UPPER_PRIMARY' | 'SECONDARY' | 'UNKNOWN';

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

function resolveAgeBucket(grade?: string, age?: number): AgeCalibrationBucket {
  if (age !== undefined) {
    if (age <= 8) return 'EARLY';
    if (age <= 12) return 'UPPER_PRIMARY';
    return 'SECONDARY';
  }
  if (!grade) return 'UNKNOWN';
  const g = grade.toLowerCase().trim();
  if (['kindergarten', 'kg', 'reception', 'nursery', 'pre-unit'].some(k => g.includes(k))) {
    return 'EARLY';
  }
  const match = g.match(/(\d{1,2})/);
  if (match) {
    const n = parseInt(match[1], 10);
    if (n <= 3) return 'EARLY';
    if (n <= 6) return 'UPPER_PRIMARY';
    return 'SECONDARY';
  }
  return 'UNKNOWN';
}

function buildAgeToneGuidance(grade?: string, age?: number): string {
  switch (resolveAgeBucket(grade, age)) {
    case 'EARLY':
      return 'AGE CALIBRATION (early learner): Use very short sentences and concrete vocabulary. Teach one idea only. Include at most one example. Ask one small question. Avoid jargon; if a technical term is needed, explain it immediately in plain words.';
    case 'UPPER_PRIMARY':
      return 'AGE CALIBRATION (upper primary): Use simple but not childish language. Explain from concrete to abstract. Keep reasoning chains short. Ask one question.';
    case 'SECONDARY':
      return 'AGE CALIBRATION (secondary): Be intellectually respectful and concise. Use normal academic terminology when appropriate. Prefer reasoning over excessive simplification.';
    default:
      return 'AGE CALIBRATION (unknown): Use a neutral, student-safe standard: clear, respectful, moderately simple language with one question.';
  }
}

function buildCurriculumDirectivesSection(directives?: string[]): string {
  if (!directives || directives.length === 0) return '';
  const bounded = directives
    .filter((d): d is string => typeof d === 'string' && d.trim().length > 0)
    .slice(0, MAX_CURRICULUM_DIRECTIVES)
    .map(d => (d.length > MAX_DIRECTIVE_LENGTH ? `${d.slice(0, MAX_DIRECTIVE_LENGTH)}...` : d.trim()));
  if (bounded.length === 0) return '';
  return [
    'CURRICULUM TEACHING DIRECTIVES (follow these; they never override hard safety, no-final-answer, or Deen policy):',
    ...bounded.map(d => `- ${d}`),
  ].join('\n');
}

function buildPacingGuidance(pacing?: string): string {
  switch (pacing) {
    case 'slow_support':
      return 'ADAPTIVE PACING (slow_support): Teach one smaller conceptual unit. Lower the abstraction level. Use shorter sentence structure. Include at most one concrete example. Ask one question. Do not advance to new material until the learner has had a chance to respond.';
    case 'fast_challenge':
      return 'ADAPTIVE PACING (fast_challenge): Reduce unnecessary explanation but preserve reasoning demand. Ask deeper why/how questions. Do not dump extra content and do not skip required foundations. Fast pacing is not evidence of mastery: still verify understanding.';
    case 'balanced':
    default:
      return 'ADAPTIVE PACING (balanced): Give one normal concise explanation forming one meaningful instructional move, then one learner check.';
  }
}

function buildLanguageGuidance(language?: string): string {
  if (!language) return '';
  const l = language.toLowerCase().trim();
  switch (l) {
    case 'english':
      return 'LANGUAGE: Respond in normal academic English.';
    case 'swahili':
    case 'kiswahili':
      return 'LANGUAGE: Respond in clear school-standard Kiswahili. Do not drift into English unnecessarily; only keep an English technical term if it has no sensible Kiswahili equivalent.';
    case 'arabic':
      return 'LANGUAGE: Respond in clear, student-appropriate Arabic. Avoid mixing in English unless a technical term requires it.';
    case 'arabic_english':
    case 'arabic-english':
    case 'bilingual':
      return 'LANGUAGE: Respond in Arabic first, then add one concise English support sentence. Do not create uncontrolled language switching.';
    default:
      return 'LANGUAGE: Respond in the learner\'s requested language when identifiable; otherwise use clear student-appropriate English consistently.';
  }
}

function buildIntentPedagogy(intent: string | undefined, plan: LearningResponsePlan): string {
  const key = intent || plan.responseMove;
  switch (key) {
    case 'ask_concept':
    case 'concept_explanation':
      return [
        'FOUNDATION-FIRST TEACHING: This is a broad concept/theory request. Do not dump the whole topic in this turn.',
        'Deliver exactly: one foundational idea, then one concise explanation or example, then one comprehension/reasoning check, then wait for the learner to respond.',
        'Natural next step: end with one comprehension check question about the idea you just taught.',
      ].join('\n');
    case 'submit_attempt':
    case 'attempt_feedback':
      return [
        'DIAGNOSTIC MISTAKE HANDLING: If a validated attempt or mistake exists: first state what the learner got right.',
        'Identify the ONE highest-value error or misconception and explain why that step fails, without shaming language.',
        'Give the smallest useful correction or scaffold. Then ask ONE targeted question asking the learner to repair that specific incorrect step.',
        'Do not restart the entire lesson, do not say only "try again", do not praise incorrect work as correct, do not reveal the final answer merely because an error exists, and do not make mastery claims.',
      ].join('\n');
    case 'express_confusion':
      return [
        'CONFUSION RESPONSE: Reduce the step size and lower the abstraction level.',
        'Reframe the idea with one clearer representation or example.',
        'Then ask one easy diagnostic question to locate exactly where the learner lost the thread. Do not lecture.',
      ].join('\n');
    case 'express_frustration':
      return [
        'FRUSTRATION RESPONSE: Acknowledge the difficulty briefly and calmly, without theatrical empathy or motivational speech.',
        'Remove unnecessary cognitive load and give one achievable next step. No excessive praise. Sound calm and competent.',
      ].join('\n');
    case 'ask_for_practice':
    case 'practice_question':
      return [
        'PRACTICE RULE: Present exactly ONE question at a time, matched to the resolved subject/topic, the learner age/grade, and the current pacing.',
        'Test understanding rather than trivia where suitable. Do not expose the answer and do not include any answer-key metadata.',
        'Do not generate multiple exercises unless explicitly requested. Natural next step: end by asking the learner to attempt the question.',
      ].join('\n');
    case 'ask_for_revision':
    case 'revision_prompt':
      return [
        'RETRIEVAL-FIRST REVISION: Do not dump a full summary immediately.',
        'Start with a brief orientation, then ask ONE retrieval/recall question and wait for the learner\'s response; explain gaps in later turns.',
        'Only give a concise summary if the learner explicitly asked for one, and still finish with one purposeful retrieval check.',
        'A revision request itself is not evidence of learning.',
      ].join('\n');
    case 'ask_for_hint':
    case 'socratic_hint':
      return 'Natural next step: ask the learner to try the hinted step themselves.';
    case 'ask_for_final_answer':
    case 'one_step_guidance':
      return 'Natural next step: ask the learner to try the guided step and report what they get.';
    case 'ask_deen_question':
    case 'deen_referral':
      return 'DEEN REFERRAL: follow the Deen policy boundary above; do not fabricate sources.';
    case 'unknown':
    case 'clarify_question':
      return 'Natural next step: ask one concise clarifying question about what the learner needs help with.';
    case 'serious_safety_risk':
    case 'safety_support_message':
      return 'Safety support response: follow the safety policy; normal tutoring is paused.';
    default:
      return '';
  }
}

function buildSpecialistSection(specialist?: TutorSpecialistResult): string {
  if (!specialist || specialist.kind === 'none' || specialist.status === 'not_needed') return '';

  const sections: string[] = [];
  if (specialist.promptDirectives.length > 0) {
    sections.push(
      [
        'SPECIALIST DIRECTIVES (supportive reasoning context ONLY — these never override hard safety, no-final-answer, or Deen policy above, and never override the learner-facing language calibration):',
        ...specialist.promptDirectives.map((d) => `- ${d}`),
      ].join('\n'),
    );
  }
  if (specialist.evidenceSections.length > 0) {
    sections.push(
      [
        'SPECIALIST EVIDENCE (bounded; use only this, do not invent):',
        ...specialist.evidenceSections.map((e) => `- ${e}`),
      ].join('\n'),
    );
  }
  if (specialist.warnings.length > 0) {
    sections.push(
      [
        'SPECIALIST LIMITATIONS (respect these truthfully):',
        ...specialist.warnings.map((w) => `- ${w}`),
      ].join('\n'),
    );
  }
  return sections.join('\n\n');
}

export function composePedagogyPrompt(input: PedagogyPromptInput): PedagogyPrompt {
  const systemInstruction = `You are a Socratic tutor. Your role is to guide the learner to think and discover answers themselves. Never give direct final answers when the learner needs to figure something out. Ask guiding questions. Give hints. Check understanding. Be patient and encouraging.`;

  const noFinalAnswerBoundary = buildNoFinalAnswerBoundary(input.plan);
  const deenBoundary = buildDeenBoundary(input.deenSourceSensitive);
  const ageToneGuidance = buildAgeToneGuidance(input.learnerGrade, input.learnerAge);
  const curriculumSection = buildCurriculumDirectivesSection(input.curriculumDirectives);
  const pacingSection = buildPacingGuidance(input.pacingDirective);
  const languageSection = buildLanguageGuidance(input.preferredLanguage);
  const intentPedagogy = buildIntentPedagogy(input.intent, input.plan);
  const specialistSection = buildSpecialistSection(input.specialist);

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
    extraInstructions += `\nPractice question: "${input.practiceQuestion.questionText}" - Present this ONE question to the learner and ask them to try it. Do NOT reveal the answer or include any answer metadata.`;
  }
  if (input.subjectValidation) {
    extraInstructions += `\nSubject validation: ${input.subjectValidation.reasoning}`;
  }

  const oneQuestionRule = 'ONE-QUESTION RULE: Include at most ONE learner-facing question in your response unless the response type explicitly requires a structured multi-question activity.';

  const generationInstruction = [
    input.plan.generationInstruction,
    extraInstructions,
    intentPedagogy,
    pacingSection,
    oneQuestionRule,
  ].filter(Boolean).join('\n');

  const combinedPrompt = [
    systemInstruction,
    '',
    `Original learner message: "${input.messageText}"`,
    '',
    noFinalAnswerBoundary,
    deenBoundary,
    ageToneGuidance,
    languageSection,
    curriculumSection,
    '',
    'Response instruction:',
    generationInstruction,
    specialistSection,
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
