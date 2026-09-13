import type { TeachBackModeState } from '../contracts/teachBackModeContracts';
import { getTeachBackSessionById, serializeTeachBackSession } from './teachBackModeSessionService';
import { getCurrentPromptState, serializePromptState } from './teachBackModePromptStateService';
import { getNextTeachBackAction } from './teachBackModeTutorActionBridgeService';
import { evaluateTeachBackAnswerProtection } from './teachBackModeAnswerProtectionPolicyService';
import { evaluateFeedbackPolicy } from './teachBackModeFeedbackPolicyService';
import { classifyExplanation } from './teachBackModeExplanationClassificationService';

export interface BuildTeachBackStateInput {
  teachBackSession: any;
  currentPromptState?: any;
  explanationQuality?: string;
  conceptCoverageBucket?: string;
  clarityBucket?: string;
  misconceptionSignal?: string;
  approvedContextAvailable?: boolean;
  deenSensitive?: boolean;
  answerKeyRisk?: boolean;
  correctAnswerRisk?: boolean;
  markingSchemeRisk?: boolean;
  modelAnswerRisk?: boolean;
  unsafeRequest?: boolean;
  weakExplanationCount?: number;
  attemptCount?: number;
  profileSignals?: {
    masteryLevel?: string;
    masteryStatus?: string;
    profileConfidence?: number;
    weakTopicDetected?: boolean;
    highHintDependency?: boolean;
    repeatedMistakeDetected?: boolean;
  };
}

export async function loadTeachBackState(teachBackSessionId: string): Promise<TeachBackModeState | null> {
  const session = await getTeachBackSessionById(teachBackSessionId);
  if (!session) return null;

  const currentPrompt = await getCurrentPromptState(teachBackSessionId, session.currentPromptIndex);

  return buildTeachBackState({
    teachBackSession: session,
    currentPromptState: currentPrompt || undefined,
    attemptCount: session.attemptCount,
    weakExplanationCount: session.weakExplanationCount,
  });
}

export async function buildTeachBackState(input: BuildTeachBackStateInput): Promise<TeachBackModeState> {
  const session = serializeTeachBackSession(input.teachBackSession);
  const promptState = input.currentPromptState ? serializePromptState(input.currentPromptState) : undefined;

  const hasAttempt = (input.teachBackSession.attemptCount || 0) > 0;

  const protectionInput = {
    hasAttempt,
    answerKeyRisk: input.answerKeyRisk || false,
    correctAnswerRisk: input.correctAnswerRisk || input.answerKeyRisk || false,
    markingSchemeRisk: input.markingSchemeRisk || input.answerKeyRisk || false,
    modelAnswerRisk: input.modelAnswerRisk || input.answerKeyRisk || false,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    unsafeRequest: input.unsafeRequest ?? false,
  };
  const protection = evaluateTeachBackAnswerProtection(protectionInput);

  const feedbackInput = {
    hasAttempt,
    explanationQuality: promptState?.explanationQuality || input.explanationQuality,
    conceptCoverageBucket: promptState?.conceptCoverageBucket || input.conceptCoverageBucket,
    clarityBucket: promptState?.clarityBucket || input.clarityBucket,
    misconceptionSignal: promptState?.misconceptionSignal || input.misconceptionSignal,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    answerKeyRisk: input.answerKeyRisk || false,
    correctAnswerRisk: input.correctAnswerRisk || false,
    markingSchemeRisk: input.markingSchemeRisk || false,
    modelAnswerRisk: input.modelAnswerRisk || false,
    unsafeRequest: input.unsafeRequest ?? false,
    attemptCount: input.teachBackSession.attemptCount || 0,
    weakExplanationCount: input.teachBackSession.weakExplanationCount || 0,
  };
  const feedback = evaluateFeedbackPolicy(feedbackInput);

  const classification = input.explanationQuality ? classifyExplanation({
    explanationQuality: input.explanationQuality,
    conceptCoverageBucket: input.conceptCoverageBucket,
    clarityBucket: input.clarityBucket,
    misconceptionSignal: input.misconceptionSignal,
    attemptNumber: input.teachBackSession.attemptCount || 0,
    usedHint: false,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
  }) : undefined;

  const nextAction = await getNextTeachBackAction({
    modeSessionId: session.modeSessionId,
    conversationId: session.conversationId,
    stage: session.currentStage,
    subjectId: session.subjectId,
    topicId: session.topicId,
    skillId: session.skillId,
    explanationQuality: promptState?.explanationQuality || input.explanationQuality,
    conceptCoverageBucket: promptState?.conceptCoverageBucket || input.conceptCoverageBucket,
    clarityBucket: promptState?.clarityBucket || input.clarityBucket,
    misconceptionSignal: promptState?.misconceptionSignal || input.misconceptionSignal,
    masterySignal: classification?.masterySignal,
    readinessSignal: classification?.readinessSignal,
    approvedContextAvailable: input.approvedContextAvailable ?? true,
    deenSensitive: input.deenSensitive ?? false,
    answerKeyRisk: input.answerKeyRisk || false,
    modelAnswerRisk: input.modelAnswerRisk || false,
    attemptCount: input.teachBackSession.attemptCount || 0,
    hintCount: input.teachBackSession.hintCount || 0,
    stuckCount: input.teachBackSession.stuckCount || 0,
    recoveryCount: input.teachBackSession.recoveryCount || 0,
    reflectionCount: input.teachBackSession.reflectionCount || 0,
    strongExplanationCount: input.teachBackSession.strongExplanationCount || 0,
    partialExplanationCount: input.teachBackSession.partialExplanationCount || 0,
    weakExplanationCount: input.teachBackSession.weakExplanationCount || 0,
    misconceptionCount: input.teachBackSession.misconceptionCount || 0,
    profileSignals: input.profileSignals,
  });

  return {
    session,
    currentStage: session.currentStage,
    currentPromptState: promptState,
    attemptCount: session.attemptCount,
    strongExplanationCount: session.strongExplanationCount,
    partialExplanationCount: session.partialExplanationCount,
    weakExplanationCount: session.weakExplanationCount,
    misconceptionCount: session.misconceptionCount,
    hintCount: session.hintCount,
    stuckCount: session.stuckCount,
    recoveryCount: session.recoveryCount,
    reflectionCount: session.reflectionCount,
    nextAction: {
      selectedAction: nextAction.selectedAction,
      hintLevel: nextAction.hintLevel,
      supportLevel: nextAction.supportLevel,
      learnerNeedCategory: nextAction.learnerNeedCategory,
      reasonCodes: nextAction.reasonCodes,
      explanationStrengthBucket: classification?.explanationStrengthBucket,
      supportNeed: classification?.supportNeed,
    },
    feedbackPolicy: {
      decision: feedback.decision,
      reasonCodes: feedback.reasonCodes,
    },
    answerProtection: {
      decision: protection.decision,
      reasonCodes: protection.reasonCodes,
    },
    safeEvidenceRefs: session.safeEvidenceRefs,
    safeReasonCodes: [
      ...(classification?.safeReasonCodes || []),
      ...feedback.reasonCodes,
      ...protection.reasonCodes,
      ...nextAction.reasonCodes,
    ],
  };
}
