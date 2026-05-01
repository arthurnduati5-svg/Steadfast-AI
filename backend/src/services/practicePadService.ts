import type {
  MetacognitiveErrorType,
  PracticePadCheckStepRequest,
  PracticePadCheckStepResponse,
  PracticePadSupportChoice,
} from '../lib/types';
import {
  chooseMetacognitivePrompt,
  getMetacognitiveProfile,
  recordMetacognitiveEvent,
} from './metacognitionService';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeText(value: unknown): string {
  return safeString(value).replace(/\s+/g, ' ').trim();
}

function detectErrorType(args: {
  workText: string;
  selectedStep?: string | null;
  reflectionErrorType?: MetacognitiveErrorType | null;
}): MetacognitiveErrorType | null {
  if (args.reflectionErrorType) return args.reflectionErrorType;
  const text = `${normalizeText(args.selectedStep)} ${normalizeText(args.workText)}`.toLowerCase();
  if (!text) return null;
  if (/\bforgot|can't remember|dont remember|do not remember|memory|recall\b/.test(text)) {
    return 'memory_gap';
  }
  if (/\bwrong formula|wrong method|used .* instead|method\b/.test(text)) {
    return 'wrong_method';
  }
  if (/\bmissed step|skipped|jumped|went straight\b/.test(text)) {
    return 'skipped_step';
  }
  if (/\bsign|minus|plus|arithmetic|calculation|careless|small mistake\b/.test(text)) {
    return 'careless_error';
  }
  if (/\bconfused|misunderstand|not the same|mixed up|concept\b/.test(text)) {
    return 'concept_misunderstanding';
  }
  return 'not_sure_yet';
}

function chooseSuggestedSupport(args: {
  errorType: MetacognitiveErrorType | null;
  supportChoice?: PracticePadSupportChoice | null;
}): PracticePadSupportChoice | null {
  if (args.supportChoice) return args.supportChoice;
  switch (args.errorType) {
    case 'wrong_method':
    case 'concept_misunderstanding':
      return 'break_down';
    case 'memory_gap':
      return 'example';
    case 'careless_error':
      return 'retry_first';
    case 'skipped_step':
      return 'hint';
    default:
      return 'hint';
  }
}

function buildDiagnosis(errorType: MetacognitiveErrorType | null): string | null {
  switch (errorType) {
    case 'concept_misunderstanding':
      return 'This looks more like a concept mix-up than a small slip.';
    case 'wrong_method':
      return 'The main issue looks like method choice rather than effort.';
    case 'skipped_step':
      return 'A key connecting step seems to be missing here.';
    case 'careless_error':
      return 'This looks close. It may be a small sign or calculation slip.';
    case 'memory_gap':
      return 'This looks like a recall gap more than a full misunderstanding.';
    case 'not_sure_yet':
      return 'The work shows uncertainty, so we should slow it down and inspect one step.';
    default:
      return null;
  }
}

function buildFeedback(args: {
  topic: string;
  selectedStep: string;
  errorType: MetacognitiveErrorType | null;
  supportChoice: PracticePadSupportChoice | null;
  confidence?: string | null;
}): string {
  const stepLead = args.selectedStep
    ? `Let's look at this step first: "${args.selectedStep}".`
    : `Let's inspect your working on ${args.topic || 'this problem'} one step at a time.`;

  const diagnosisLead =
    args.errorType === 'careless_error'
      ? 'You seem close to the right method.'
      : args.errorType === 'wrong_method'
        ? 'The main issue is likely the approach, not your effort.'
        : args.errorType === 'memory_gap'
          ? 'It looks like you need a quick memory anchor here.'
          : args.errorType === 'concept_misunderstanding'
            ? 'The key idea needs a cleaner reset before we continue.'
            : args.errorType === 'skipped_step'
              ? 'There is a missing bridge step in the middle.'
              : 'We can slow this down and make the next move clearer.';

  const supportLead =
    args.supportChoice === 'retry_first'
      ? 'Try the step again once, but this time check the sign, operation, and what each symbol stands for.'
      : args.supportChoice === 'example'
        ? 'Use one short example beside your working so the pattern becomes easier to see.'
        : args.supportChoice === 'break_down'
          ? 'Break the method into very small moves and do only the next one.'
          : 'Take one small hint from the pattern already in your work, then try the next move yourself.';

  const confidenceLead =
    args.confidence === 'confused'
      ? 'Since this felt confusing, we should keep the pace gentle.'
      : args.confidence === 'partly_sure'
        ? 'Since you were partly sure, we can keep the next step focused and short.'
        : '';

  return [stepLead, diagnosisLead, confidenceLead, supportLead]
    .filter(Boolean)
    .join(' ');
}

function buildNextStep(args: {
  selectedStep: string;
  supportChoice: PracticePadSupportChoice | null;
}): string {
  if (args.supportChoice === 'retry_first') {
    return args.selectedStep
      ? `Retry that step and tell me exactly what changes in "${args.selectedStep}".`
      : 'Retry the next line of your working and tell me what changed.';
  }
  if (args.supportChoice === 'example') {
    return 'Write one tiny example beside your working, then compare the pattern.';
  }
  if (args.supportChoice === 'break_down') {
    return 'Do only the next small move, not the whole problem.';
  }
  return 'Tell me your next move, and I will check only that part.';
}

export async function checkPracticePadStep(args: {
  userId: string;
  payload: PracticePadCheckStepRequest;
}): Promise<PracticePadCheckStepResponse> {
  const topic = normalizeText(args.payload.topic) || normalizeText(args.payload.subject) || 'this topic';
  const workText = normalizeText(args.payload.workText);
  const selectedStep = normalizeText(args.payload.selectedStep);
  const reflection = args.payload.reflection || null;
  const errorType = detectErrorType({
    workText,
    selectedStep: selectedStep || null,
    reflectionErrorType: reflection?.errorType || null,
  });
  const supportChoice = chooseSuggestedSupport({
    errorType,
    supportChoice: args.payload.supportChoice || reflection?.supportChoice || null,
  });

  const events: Array<Promise<unknown>> = [];
  if (reflection?.confidence) {
    events.push(recordMetacognitiveEvent({
      userId: args.userId,
      sessionId: args.payload.sessionId || null,
      sourceMessageId: args.payload.sourceMessageId || null,
      eventType: 'confidence_check',
      confidence: reflection.confidence,
      note: null,
      metadata: { source: 'practice_pad', topic },
    }));
  }
  if (errorType) {
    events.push(recordMetacognitiveEvent({
      userId: args.userId,
      sessionId: args.payload.sessionId || null,
      sourceMessageId: args.payload.sourceMessageId || null,
      eventType: 'error_located',
      errorType,
      note: null,
      metadata: { source: 'practice_pad', topic },
    }));
  }
  if (supportChoice) {
    const strategyPreference =
      supportChoice === 'example'
        ? 'example_helped'
        : supportChoice === 'break_down'
          ? 'breakdown_helped'
          : supportChoice === 'hint'
            ? 'hint_helped'
            : 'practice_helped';
    events.push(recordMetacognitiveEvent({
      userId: args.userId,
      sessionId: args.payload.sessionId || null,
      sourceMessageId: args.payload.sourceMessageId || null,
      eventType: 'strategy_selected',
      strategyPreference,
      note: null,
      metadata: { source: 'practice_pad', topic },
    }));
  }
  if (reflection?.studentReflectionNote) {
    events.push(recordMetacognitiveEvent({
      userId: args.userId,
      sessionId: args.payload.sessionId || null,
      sourceMessageId: args.payload.sourceMessageId || null,
      eventType: 'reflection_note',
      note: normalizeText(reflection.studentReflectionNote),
      metadata: { source: 'practice_pad', topic },
    }));
  }
  await Promise.all(events);

  const updatedMetacognitiveProfile = await getMetacognitiveProfile(args.userId);
  const reflectionPrompt = chooseMetacognitivePrompt({
    userText: selectedStep || workText,
    isPracticePad: true,
    awaitingStudentAttempt: true,
    afterMistake: Boolean(errorType && errorType !== 'not_sure_yet'),
    currentErrorType: errorType,
  });

  return {
    sessionId: args.payload.sessionId || null,
    message: null,
    feedback: buildFeedback({
      topic,
      selectedStep,
      errorType,
      supportChoice,
      confidence: reflection?.confidence || null,
    }),
    diagnosis: buildDiagnosis(errorType),
    nextStep: buildNextStep({
      selectedStep,
      supportChoice,
    }),
    suggestedSupport: supportChoice,
    reflectionPrompt,
    detectedErrorType: errorType,
    updatedMetacognitiveProfile,
  };
}
