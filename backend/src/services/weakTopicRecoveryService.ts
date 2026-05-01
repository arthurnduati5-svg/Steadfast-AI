import type {
  MetacognitiveStateSnapshot,
  TopicMasteryState,
  WeakTopicRecoveryStage,
  WeakTopicRecoveryState,
} from '../lib/types';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

const RECOVERY_SEQUENCE: WeakTopicRecoveryStage[] = [
  'revisit_prerequisite',
  'simpler_example',
  'small_recall',
  'similar_problem',
  'check_again',
  'completed',
];

function nextRecoveryStage(stage?: WeakTopicRecoveryStage | null): WeakTopicRecoveryStage {
  const currentIndex = RECOVERY_SEQUENCE.indexOf(stage || 'revisit_prerequisite');
  if (currentIndex < 0) return 'revisit_prerequisite';
  return RECOVERY_SEQUENCE[Math.min(currentIndex + 1, RECOVERY_SEQUENCE.length - 1)];
}

function inferPrerequisiteFocus(topic: string, subject?: string | null): string {
  const normalizedTopic = safeString(topic).toLowerCase();
  const normalizedSubject = safeString(subject).toLowerCase();

  if (normalizedTopic.includes('equation')) return 'inverse operations and keeping both sides balanced';
  if (normalizedTopic.includes('fraction')) return 'finding common denominators and simplifying carefully';
  if (normalizedTopic.includes('density')) return 'what mass and volume mean inside the formula';
  if (normalizedTopic.includes('osmosis')) return 'how water moves across a partially permeable membrane';
  if (normalizedTopic.includes('photosynthesis')) return 'what plants take in and what they give out';
  if (normalizedTopic.includes('grammar')) return 'the job each part of the sentence is doing';
  if (normalizedSubject.includes('math')) return 'the small rule underneath the step that keeps the working consistent';
  if (normalizedSubject.includes('biology')) return 'the key definition and input-output relationship inside the idea';
  return 'the foundation step underneath this topic';
}

function buildSimplerExample(topic: string, subject?: string | null): string {
  const normalizedSubject = safeString(subject).toLowerCase();
  if (normalizedSubject.includes('math') || safeString(topic).toLowerCase().includes('equation')) {
    return 'Try a smaller version with easier numbers first, then check whether the same rule still holds.';
  }
  if (normalizedSubject.includes('biology') || normalizedSubject.includes('science')) {
    return 'Use one direct example with only the key parts shown, then name what each part is doing.';
  }
  if (normalizedSubject.includes('grammar') || normalizedSubject.includes('language')) {
    return 'Use one short sentence first, then point to the part you are checking.';
  }
  return 'Use one simpler version with less noise so the weak point is easier to see.';
}

function buildRecallQuestion(topic: string, subject?: string | null): string {
  const normalizedTopic = safeString(topic).toLowerCase();
  const normalizedSubject = safeString(subject).toLowerCase();

  if (normalizedTopic.includes('equation')) return 'What should stay equal on both sides?';
  if (normalizedTopic.includes('density')) return 'What does the formula connect?';
  if (normalizedTopic.includes('osmosis')) return 'Which way does water move in osmosis?';
  if (normalizedTopic.includes('photosynthesis')) return 'What are the main inputs and outputs here?';
  if (normalizedSubject.includes('grammar')) return 'What job is this word or phrase doing in the sentence?';
  return 'What is the one small idea that must stay true here?';
}

function buildSimilarProblemPrompt(topic: string): string {
  return `Try one similar ${safeString(topic).trim() || 'topic'} question now, but keep the corrected step in mind from the start.`;
}

function buildCheckAgainPrompt(topic: string): string {
  return `Now check this ${safeString(topic).trim() || 'idea'} again. What will you do differently this time?`;
}

export function buildWeakTopicRecoveryState(args: {
  topic?: string | null;
  subject?: string | null;
  topicMastery?: TopicMasteryState | null;
  metacognitiveState?: MetacognitiveStateSnapshot | null;
  priorRecoveryState?: WeakTopicRecoveryState | null;
  afterMistake?: boolean;
  afterSuccess?: boolean;
  awaitingStudentAttempt?: boolean;
}): WeakTopicRecoveryState | null {
  const topic = safeString(args.topic).trim();
  if (!topic) return null;

  const label = args.topicMastery?.label || 'getting_better';
  const repeatedMistakeRate = Number(args.topicMastery?.repeatedMistakeRate || 0);
  const supportDependenceLevel = Number(args.topicMastery?.supportDependenceLevel || 0);
  const confused = args.metacognitiveState?.confidenceSelfCheck === 'confused' || args.metacognitiveState?.confidence === 'confused';
  const shouldTrigger =
    args.afterMistake ||
    label === 'still_learning' ||
    repeatedMistakeRate >= 0.34 ||
    supportDependenceLevel >= 0.45 ||
    confused;

  if (!shouldTrigger && !args.priorRecoveryState?.active) {
    return null;
  }

  const isSameTopic = safeString(args.priorRecoveryState?.topic).trim().toLowerCase() === topic.toLowerCase();
  let stage: WeakTopicRecoveryStage = 'revisit_prerequisite';

  if (args.afterSuccess && isSameTopic && args.priorRecoveryState?.active) {
    stage = 'completed';
  } else if (args.awaitingStudentAttempt && isSameTopic && args.priorRecoveryState?.active) {
    stage = args.priorRecoveryState.stage === 'small_recall'
      ? 'similar_problem'
      : args.priorRecoveryState.stage === 'similar_problem'
        ? 'check_again'
        : nextRecoveryStage(args.priorRecoveryState.stage);
  } else if (args.priorRecoveryState?.active && isSameTopic) {
    stage = args.priorRecoveryState.stage || 'revisit_prerequisite';
  }

  const prerequisiteFocus = inferPrerequisiteFocus(topic, args.subject);
  const summary =
    stage === 'completed'
      ? 'That recovery pass helped. We can test the topic more normally again.'
      : 'We will rebuild the exact weak point step by step instead of repeating the same explanation.';

  return {
    topic,
    subject: args.subject || null,
    active: stage !== 'completed',
    stage,
    triggerReason:
      stage === 'completed'
        ? 'recent_recovery_success'
        : args.afterMistake
          ? 'repeated_struggle'
          : confused
            ? 'student_reported_confusion'
            : label === 'still_learning'
              ? 'low_mastery_signal'
              : 'support_dependence',
    title: stage === 'completed' ? 'That is getting steadier.' : 'Let’s rebuild this step by step.',
    summary,
    prerequisiteFocus,
    simplerExample: buildSimplerExample(topic, args.subject),
    recallQuestion: buildRecallQuestion(topic, args.subject),
    similarProblemPrompt: buildSimilarProblemPrompt(topic),
    checkAgainPrompt: buildCheckAgainPrompt(topic),
  };
}
