import type {
  MetacognitiveErrorType,
  MetacognitivePrompt,
  TopicMasteryState,
  TutorState,
  WeakTopicRecoveryState,
} from '../lib/types';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isConfusionLanguage(text: string): boolean {
  return /\b(confused|stuck|lost|hard|tricky|not sure|i do not get it|don't understand)\b/i.test(text);
}

function isDenseSolvingTurn(args: {
  tutorActionId?: string;
  awaitingStudentAttempt?: boolean;
}): boolean {
  if (args.awaitingStudentAttempt) return true;
  const action = safeString(args.tutorActionId).trim();
  return ['hint', 'breakdown', 'practice'].includes(action);
}

function isFocusOrExamMode(state?: TutorState | null): boolean {
  const mode = safeString(state?.currentStudyMode).toLowerCase();
  if (!mode) return false;
  return (
    mode.includes('focus') ||
    mode.includes('exam') ||
    mode.includes('hybrid_focus_exam') ||
    mode.includes('hybrid_research_focus') ||
    mode.includes('hybrid_research_exam') ||
    mode.includes('hybrid_research_focus_exam')
  );
}

function buildPrompt(args: {
  type: MetacognitivePrompt['type'];
  variant: NonNullable<MetacognitivePrompt['variant']>;
  text: string;
  supportPrompt: string;
  acknowledgement: string;
  topic?: string | null;
  subject?: string | null;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
}): MetacognitivePrompt {
  return {
    type: args.type,
    variant: args.variant,
    text: args.text,
    supportPrompt: args.supportPrompt,
    acknowledgement: args.acknowledgement,
    topic: args.topic || null,
    subject: args.subject || null,
    topicMastery: args.topicMastery || null,
    weakTopicRecovery: args.weakTopicRecovery || null,
  };
}

export function buildReflectionPrompt(args: {
  userText?: string;
  assistantText?: string;
  tutorActionId?: string;
  isRevision?: boolean;
  isPracticePad?: boolean;
  awaitingStudentAttempt?: boolean;
  afterMistake?: boolean;
  afterSuccess?: boolean;
  currentErrorType?: MetacognitiveErrorType | null;
  topic?: string | null;
  subject?: string | null;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  priorTutorState?: TutorState | null;
}): MetacognitivePrompt | null {
  const userText = safeString(args.userText).trim();
  const confused = isConfusionLanguage(userText) || args.topicMastery?.label === 'still_learning';
  const denseSolvingTurn = isDenseSolvingTurn({
    tutorActionId: args.tutorActionId,
    awaitingStudentAttempt: args.awaitingStudentAttempt,
  });
  const constrainedMode = isFocusOrExamMode(args.priorTutorState);

  if (args.weakTopicRecovery?.active) {
    return buildPrompt({
      type: 'weak_topic_recovery',
      variant: 'weak_topic_recovery',
      text: 'Before we continue, where are you right now?',
      supportPrompt: 'What would help most?',
      acknowledgement: 'Thank you. I will adjust the next step quietly.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery,
    });
  }

  if (denseSolvingTurn && !args.afterSuccess) {
    return null;
  }

  if (args.tutorActionId === 'save') {
    return buildPrompt({
      type: 'revision_recheck',
      variant: 'revision_comeback',
      text: 'What is the one idea you want to remember next time?',
      supportPrompt: 'What would help lock this in?',
      acknowledgement: 'Great. I will keep the next step aligned with that.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery || null,
    });
  }

  if ((args.afterMistake && args.afterSuccess) || (args.isRevision && args.afterSuccess)) {
    return buildPrompt({
      type: 'revision_recheck',
      variant: 'revision_comeback',
      text: 'Nice recovery. Do you want one quick check before we move on?',
      supportPrompt: 'Pick the support that helps most now.',
      acknowledgement: 'Perfect. I will shape the next move around that.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery || null,
    });
  }

  if (args.afterMistake || args.currentErrorType) {
    if (denseSolvingTurn || constrainedMode) return null;
    return buildPrompt({
      type: 'progress_check',
      variant: 'after_correction',
      text: 'How does this feel now?',
      supportPrompt: 'What would help most?',
      acknowledgement: 'Thanks. I will guide the next move from there.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery || null,
    });
  }

  if (args.isRevision) {
    if (!(confused || args.afterSuccess) || denseSolvingTurn) return null;
    return buildPrompt({
      type: 'revision_recheck',
      variant: 'revision_comeback',
      text: 'How does this topic feel now?',
      supportPrompt: 'What would help most?',
      acknowledgement: 'Alright. I will shape the review around that.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery || null,
    });
  }

  if (confused) {
    if (denseSolvingTurn || constrainedMode) return null;
    return buildPrompt({
      type: 'reflect_checkin',
      variant: 'before_continue',
      text: 'Before we continue, where are you right now?',
      supportPrompt: 'What would help most?',
      acknowledgement: 'Thanks. I will use that to choose the next step.',
      topic: args.topic,
      subject: args.subject,
      topicMastery: args.topicMastery,
      weakTopicRecovery: args.weakTopicRecovery || null,
    });
  }

  return null;
}
