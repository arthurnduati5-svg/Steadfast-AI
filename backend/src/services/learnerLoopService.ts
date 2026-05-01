import type {
  MetacognitivePrompt,
  MetacognitiveStateSnapshot,
  TopicMasteryState,
  TutorState,
  WeakTopicRecoveryState,
} from '../lib/types';
import { getTopicMasteryState } from './masteryInferenceService';
import { buildReflectionPrompt } from './reflectionService';
import { buildWeakTopicRecoveryState } from './weakTopicRecoveryService';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export async function buildLearnerLoopState(args: {
  userId: string;
  userText?: string;
  assistantText?: string;
  topic?: string | null;
  subject?: string | null;
  tutorActionId?: string;
  isRevision?: boolean;
  isPracticePad?: boolean;
  awaitingStudentAttempt?: boolean;
  afterMistake?: boolean;
  afterSuccess?: boolean;
  currentMetacognitiveState?: MetacognitiveStateSnapshot | null;
  priorTutorState?: TutorState | null;
}): Promise<{
  topicMastery: TopicMasteryState | null;
  weakTopicRecovery: WeakTopicRecoveryState | null;
  reflectionPrompt: MetacognitivePrompt | null;
}> {
  const topic = safeString(args.topic).trim();
  const subject = safeString(args.subject).trim() || null;

  const topicMastery = topic
    ? await getTopicMasteryState({
        userId: args.userId,
        topic,
        subject,
      })
    : null;

  const weakTopicRecovery = buildWeakTopicRecoveryState({
    topic,
    subject,
    topicMastery,
    metacognitiveState: args.currentMetacognitiveState || args.priorTutorState?.metacognitiveState || null,
    priorRecoveryState: args.priorTutorState?.weakTopicRecovery || null,
    afterMistake: args.afterMistake,
    afterSuccess: args.afterSuccess,
    awaitingStudentAttempt: args.awaitingStudentAttempt,
  });

  const reflectionPrompt = buildReflectionPrompt({
    userText: args.userText,
    assistantText: args.assistantText,
    tutorActionId: args.tutorActionId,
    isRevision: args.isRevision,
    isPracticePad: args.isPracticePad,
    awaitingStudentAttempt: args.awaitingStudentAttempt,
    afterMistake: args.afterMistake,
    afterSuccess: args.afterSuccess,
    topic,
    subject,
    topicMastery,
    weakTopicRecovery,
    currentErrorType: args.currentMetacognitiveState?.errorType || null,
  });

  return {
    topicMastery,
    weakTopicRecovery,
    reflectionPrompt,
  };
}
