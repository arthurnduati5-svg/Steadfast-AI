import type {
  MetacognitivePrompt,
  MetacognitiveStateSnapshot,
  TopicMasteryState,
  TutorState,
  WeakTopicRecoveryState,
} from '../lib/types';
// R6: Learner Loop reads canonical learning intelligence — NOT masteryInferenceService.
// masteryInferenceService derives scores from legacy Progress/Mistake rows and is no
// longer authoritative for this surface.
import { getLearningIntelligenceSnapshot } from './learningIntelligenceIntegrationService';
import { buildReflectionPrompt } from './reflectionService';
import { buildWeakTopicRecoveryState } from './weakTopicRecoveryService';

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

// R6: canonical read for Learner Loop topic mastery.
// Combines canonical mastery (when available) with recent canonical evidence and
// revision/recovery state. Never calculates a competing mastery score and never
// falls back to legacy Progress.mastery-derived inference.
async function readCanonicalTopicMastery(args: {
  userId: string;
  topic: string;
  subject: string | null;
}): Promise<TopicMasteryState | null> {
  try {
    const snapshot = await getLearningIntelligenceSnapshot({
      learnerId: args.userId,
      subject: args.subject,
    });

    const topicKey = args.topic.trim().toLowerCase();
    const canonicalForTopic = snapshot.mastery.states.find(
      (state) => safeString(state.targetNodeId).trim().toLowerCase() === topicKey,
    );

    const topicEvidence = snapshot.evidence.recent.filter(
      (item) => safeString(item.topic).trim().toLowerCase() === topicKey,
    );
    const correctCount = topicEvidence.filter((item) => item.outcome === 'correct').length;
    const incorrectCount = topicEvidence.filter((item) => item.outcome === 'incorrect').length;
    const partialCount = topicEvidence.filter((item) => item.outcome === 'partially_correct').length;

    if (!canonicalForTopic && topicEvidence.length === 0) {
      // No canonical mastery and no durable evidence: report unavailable state
      // rather than inferring from legacy Progress/Mistake rows.
      return null;
    }

    const probability = canonicalForTopic?.probabilityOfMastery ?? null;
    const evidenceCount = canonicalForTopic?.evidenceCount ?? topicEvidence.length;

    // Deterministic label from canonical inputs only (no competing score math).
    let label: TopicMasteryState['label'] = 'still_learning';
    if (probability !== null) {
      if (probability >= 0.82) label = 'confident';
      else if (probability >= 0.6) label = 'almost_there';
      else if (probability >= 0.35) label = 'getting_better';
      else label = 'still_learning';
    } else if (topicEvidence.length > 0) {
      if (incorrectCount > correctCount) label = 'still_learning';
      else if (correctCount > 0 && correctCount >= partialCount) label = 'getting_better';
      else label = 'still_learning';
    }

    const recentNegative = incorrectCount > 0;
    const recentPositive = correctCount > incorrectCount;
    const recentImprovement: 'improving' | 'flat' | 'declining' =
      recentPositive && !recentNegative ? 'improving' : recentNegative && !recentPositive ? 'declining' : 'flat';

    const dueRevision = snapshot.revision.due.find(
      (item) => item.topic.trim().toLowerCase() === topicKey,
    );

    return {
      topic: args.topic,
      subject: args.subject || undefined,
      label,
      evidenceScore:
        probability !== null
          ? probability
          : topicEvidence.length > 0
            ? Math.max(0, Math.min(1, (correctCount + partialCount * 0.5) / topicEvidence.length))
            : undefined,
      evidenceCount,
      lastPracticedAt: snapshot.evidence.lastEvidenceAt,
      recentImprovement,
      repeatedMistakeRate:
        topicEvidence.length > 0 ? incorrectCount / topicEvidence.length : null,
      supportDependenceLevel: null,
      summary:
        canonicalForTopic?.available
          ? `Canonical mastery: ${canonicalForTopic.visibleLabel || 'tracked'} (${evidenceCount} evidence).`
          : dueRevision
            ? 'Revision is due on this topic; canonical evidence shows it needs attention.'
            : topicEvidence.length > 0
              ? 'Recent canonical evidence is available for this topic.'
              : null,
      nextBestStep: dueRevision
        ? 'Clear the due revision item for this topic first.'
        : recentNegative
          ? 'Work one guided example before attempting independent questions.'
          : null,
    } satisfies TopicMasteryState;
  } catch {
    // Canonical read unavailable → no mastery state, never a legacy substitute.
    return null;
  }
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

  const topicMastery: TopicMasteryState | null = topic
    ? await readCanonicalTopicMastery({
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
