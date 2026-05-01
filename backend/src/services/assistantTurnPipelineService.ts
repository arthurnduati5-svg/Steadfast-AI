import type {
  AssistantTurnType,
  DetectedInputLanguage,
  MessagePresentationMeta,
  MetacognitivePrompt,
  MetacognitivePromptType,
  MetacognitiveStateSnapshot,
  SessionLanguageState,
  SupportedLearningLanguage,
  SystemNotice,
  TopicMasteryState,
  TutorActionId,
  TutorActionUiMeta,
  TutorRevisionNote,
  TutorState,
  WeakTopicRecoveryState,
} from '../lib/types';
import { buildLearnerLoopState } from './learnerLoopService';

type LearnerLoopState = Awaited<ReturnType<typeof buildLearnerLoopState>>;
type SystemNoticeSeverity = 'info' | 'warning' | 'error';
type ReflectionLevel = 'silent' | 'inline' | 'full';

type ReflectionPresentationPatchResult = {
  presentationPatch: Partial<MessagePresentationMeta>;
  statePatch: Partial<TutorState>;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function limitText(value: string, maxLength: number): string {
  const clean = safeString(value).trim();
  if (!clean) return '';
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
}

function sanitizeSystemNotices(notices: Array<SystemNotice | undefined | null>): SystemNotice[] {
  const cleaned: SystemNotice[] = [];
  const seen = new Set<string>();
  for (const notice of notices) {
    if (!notice) continue;
    const code = safeString(notice.code).trim();
    const message = safeString(notice.message).trim();
    const rawSeverity = safeString(notice.severity).trim() as SystemNoticeSeverity;
    const severity: SystemNoticeSeverity =
      rawSeverity === 'warning' || rawSeverity === 'error' || rawSeverity === 'info'
        ? rawSeverity
        : 'info';
    if (!code || !message) continue;
    const dedupeKey = `${code}:${message}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    cleaned.push({ code, message: limitText(message, 220), severity });
  }
  return cleaned;
}

function clampNumber(value: number, min = 0, max = 1): number {
  if (!Number.isFinite(value)) return min;
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function parseIsoDate(value: unknown): number | null {
  const raw = safeString(value).trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildReflectSequenceId(): string {
  return `reflect-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function resolveTurnType(args: {
  priorTutorState: TutorState;
  tutorActionId?: TutorActionId;
  afterMistake: boolean;
  afterSuccess: boolean;
  savedRevisionNote?: TutorRevisionNote;
  basePresentation?: MessagePresentationMeta;
  aiPresentation?: Record<string, unknown> | null;
  learnerLoopState: LearnerLoopState;
}): AssistantTurnType {
  const aiTurnType = safeString(args.aiPresentation?.turnType).trim() as AssistantTurnType;
  if (aiTurnType) return aiTurnType;
  if (args.basePresentation?.turnType) return args.basePresentation.turnType;

  const studyMode = safeString(args.priorTutorState.currentStudyMode).toLowerCase();
  if (studyMode.includes('research')) return 'research';
  if (studyMode.includes('exam')) return 'exam';
  if (studyMode.includes('focus')) return 'focus';
  if (args.tutorActionId === 'save' || args.savedRevisionNote) return 'save_ready';
  if (args.learnerLoopState.weakTopicRecovery?.active) return 'recovery';
  if (args.afterMistake) return 'correction';
  if (args.afterSuccess) return 'checkpoint';
  if (args.tutorActionId === 'practice') return 'checkpoint';
  if (args.tutorActionId === 'breakdown' || args.tutorActionId === 'hint') return 'explanation';
  return 'explanation';
}

function resolveInlineReflectionPrompt(
  prompt: MetacognitivePrompt | null | undefined
): string | null {
  if (!prompt) return null;
  switch (prompt.type) {
    case 'progress_check':
      return 'Did that correction help, or should I simplify once more?';
    case 'practice_readiness':
      return 'Want one quick check, or are you ready to try it yourself?';
    case 'revision_recheck':
      return 'Feeling clearer now, or do you want one more short example?';
    case 'weak_topic_recovery':
      return 'Which part felt hardest: the concept, the step, or recall?';
    case 'reflect_checkin':
      return 'Which part still feels unclear right now?';
    default:
      return 'Want one quick check before we continue?';
  }
}

function buildReflectionSuggestionFlags(
  promptType?: MetacognitivePromptType | null
): Partial<MessagePresentationMeta> {
  if (!promptType) {
    return {
      confidenceCheckSuggested: false,
      errorCheckSuggested: false,
      transferCheckSuggested: false,
      strategyCheckSuggested: false,
    };
  }
  return {
    confidenceCheckSuggested:
      promptType === 'check_confidence' || promptType === 'reflect_checkin',
    errorCheckSuggested:
      promptType === 'locate_error' || promptType === 'progress_check',
    transferCheckSuggested:
      promptType === 'transfer_learning' || promptType === 'explain_success',
    strategyCheckSuggested:
      promptType === 'inspect_step' ||
      promptType === 'choose_support' ||
      promptType === 'practice_readiness',
  };
}

function buildReflectionPresentationPatch(args: {
  prompt: MetacognitivePrompt | null | undefined;
  priorTutorState: TutorState;
  currentMetacognitiveState: MetacognitiveStateSnapshot | null;
  topic?: string;
  turnType: AssistantTurnType;
  tutorActionId?: TutorActionId;
  awaitingStudentAttempt: boolean;
  afterMistake: boolean;
  afterSuccess: boolean;
  topicMastery?: TopicMasteryState | null;
  weakTopicRecovery?: WeakTopicRecoveryState | null;
  systemNotices: SystemNotice[];
}): ReflectionPresentationPatchResult {
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const prompt = args.prompt;
  const promptType = prompt?.type || null;
  const studyMode = safeString(args.priorTutorState.currentStudyMode).toLowerCase();
  const inFocusOrExam = studyMode.includes('focus') || studyMode.includes('exam');
  const lastReflectAtMs = parseIsoDate(args.priorTutorState.lastReflectAt);
  const withinCooldown = Boolean(lastReflectAtMs && now - lastReflectAtMs < 6 * 60 * 1000);
  const topic = safeString(args.topic || '').trim();
  const lastReflectTopic = safeString(args.priorTutorState.lastReflectTopic || '').trim();
  const sameTopic = Boolean(topic && lastReflectTopic && topic.toLowerCase() === lastReflectTopic.toLowerCase());
  const inferredRecentAnswer = Boolean(
    args.currentMetacognitiveState?.confidenceSelfCheck ||
    args.currentMetacognitiveState?.supportPreference ||
    args.currentMetacognitiveState?.studentReflectionNote
  );
  const inferredDismissedFromSkip = Boolean(
    !inferredRecentAnswer &&
      lastReflectAtMs &&
      now - lastReflectAtMs < 7 * 60 * 1000 &&
      sameTopic
  );
  const dismissedRecently = Boolean(
    args.priorTutorState.reflectDismissedRecently || inferredDismissedFromSkip
  );
  const answeredRecently = Boolean(
    args.priorTutorState.reflectAnsweredRecently || inferredRecentAnswer
  );
  const denseSolving = args.awaitingStudentAttempt || args.tutorActionId === 'practice';
  const supportSurfaceCount =
    (args.topicMastery ? 1 : 0) +
    (args.weakTopicRecovery?.active ? 1 : 0) +
    (args.systemNotices.length > 0 ? 1 : 0);

  const essentialMoment =
    promptType === 'weak_topic_recovery' ||
    args.turnType === 'save_ready' ||
    args.turnType === 'revision_handoff';
  const highSignalMoment =
    essentialMoment ||
    args.turnType === 'checkpoint' ||
    args.turnType === 'recovery' ||
    args.turnType === 'correction';
  const meaningfulChange = args.afterMistake || args.afterSuccess || args.tutorActionId === 'save';

  let eligibilityScore = 0.24;
  if (args.afterMistake) eligibilityScore += 0.24;
  if (args.afterSuccess) eligibilityScore += 0.17;
  if (promptType === 'weak_topic_recovery') eligibilityScore += 0.34;
  if (args.turnType === 'save_ready' || args.tutorActionId === 'save') eligibilityScore += 0.24;
  if (args.turnType === 'checkpoint') eligibilityScore += 0.08;
  if (denseSolving) eligibilityScore -= 0.32;
  if (withinCooldown) eligibilityScore -= 0.22;
  if (sameTopic && !meaningfulChange) eligibilityScore -= 0.18;
  if (dismissedRecently) eligibilityScore -= 0.2;
  if (answeredRecently) eligibilityScore -= 0.08;
  if (inFocusOrExam && !essentialMoment) eligibilityScore -= 0.18;
  if (supportSurfaceCount > 1) eligibilityScore -= 0.14;
  eligibilityScore = clampNumber(eligibilityScore, 0, 1);

  const hardSuppressed =
    !essentialMoment &&
    (denseSolving || dismissedRecently || (inFocusOrExam && args.turnType !== 'checkpoint'));
  const suppressForRepetition =
    !essentialMoment && sameTopic && !meaningfulChange;

  let reflectLevel: ReflectionLevel = 'silent';
  if (prompt?.text && !hardSuppressed && !suppressForRepetition) {
    if (highSignalMoment && eligibilityScore >= 0.72 && (!withinCooldown || essentialMoment)) {
      reflectLevel = 'full';
    } else if (eligibilityScore >= 0.44) {
      reflectLevel = 'inline';
    }
  }

  const sequenceId =
    reflectLevel === 'silent'
      ? safeString(args.priorTutorState.reflectSequenceId).trim() || undefined
      : safeString(args.priorTutorState.reflectSequenceId).trim() &&
          !essentialMoment &&
          sameTopic
        ? safeString(args.priorTutorState.reflectSequenceId).trim()
        : buildReflectSequenceId();

  const statePatch: Partial<TutorState> = {
    reflectEligibilityScore: eligibilityScore,
    ...(reflectLevel !== 'silent'
      ? {
          lastReflectAt: nowIso,
          lastReflectTopic: topic || args.priorTutorState.lastReflectTopic,
          lastReflectType: promptType || args.priorTutorState.lastReflectType,
          reflectSequenceId: sequenceId,
          reflectAnsweredRecently: false,
          reflectDismissedRecently: false,
        }
      : {
          reflectAnsweredRecently: inferredRecentAnswer || answeredRecently,
          reflectDismissedRecently: dismissedRecently,
        }),
  };

  const suggestionFlags = buildReflectionSuggestionFlags(promptType);
  const basePatch: Partial<MessagePresentationMeta> = {
    turnType: args.turnType,
    reflectLevel,
    reflectSequenceId: sequenceId,
    reflectEligibilityScore: eligibilityScore,
    reflectionPrompt: undefined,
    reflectionPromptType: undefined,
    reflectCard: undefined,
    inlineReflectionPrompt: undefined,
    inlineReflectionType: undefined,
    ...suggestionFlags,
    ...(args.topicMastery ? { topicMastery: args.topicMastery } : {}),
    ...(args.weakTopicRecovery ? { weakTopicRecovery: args.weakTopicRecovery } : {}),
  };

  if (reflectLevel === 'full' && prompt?.text) {
    return {
      presentationPatch: {
        ...basePatch,
        reflectionPrompt: prompt.text,
        reflectionPromptType: prompt.type as MetacognitivePromptType,
        reflectCard: prompt,
      },
      statePatch,
    };
  }

  if (reflectLevel === 'inline') {
    const inlinePrompt = resolveInlineReflectionPrompt(prompt);
    if (inlinePrompt) {
      return {
        presentationPatch: {
          ...basePatch,
          inlineReflectionPrompt: inlinePrompt,
          inlineReflectionType: (promptType || 'reflect_checkin') as MetacognitivePromptType,
        },
        statePatch,
      };
    }
  }

  return {
    presentationPatch: basePatch,
    statePatch,
  };
}

export type AssistantMessageEnvelopeRoute = 'chat' | 'voice_chat';

export type AssistantMessageEnvelope = {
  version: 'v1';
  route: AssistantMessageEnvelopeRoute;
  generatedAt: string;
  tutorUi?: TutorActionUiMeta;
  presentation?: MessagePresentationMeta;
  systemNotices?: SystemNotice[];
  savedRevisionNote?: TutorRevisionNote;
  language?: Record<string, unknown>;
  metacognition?: MetacognitiveStateSnapshot | null;
};

export type AssistantResponseMeta = {
  tutorUi?: TutorActionUiMeta;
  presentation?: MessagePresentationMeta;
  systemNotices?: SystemNotice[];
  savedRevisionNote?: TutorRevisionNote;
  language?: Record<string, unknown>;
  metacognition?: MetacognitiveStateSnapshot | null;
  assistantEnvelope?: AssistantMessageEnvelope;
};

export type BuildAssistantTurnPipelineArgs = {
  route: AssistantMessageEnvelopeRoute;
  userId: string;
  userText: string;
  assistantText: string;
  topic?: string;
  subject?: string;
  tutorActionId?: TutorActionId;
  priorTutorState: TutorState;
  currentMetacognitiveState: MetacognitiveStateSnapshot | null;
  awaitingStudentAttempt: boolean;
  afterMistake: boolean;
  afterSuccess: boolean;
  basePresentation?: MessagePresentationMeta;
  forceAwaitingStudentAttempt?: boolean;
  tutorUi?: TutorActionUiMeta;
  aiAssistantMetadata?: Record<string, unknown> | null;
  sessionLanguageState: SessionLanguageState;
  detectedInputLanguage?: DetectedInputLanguage | null;
  generatedLanguage: SupportedLearningLanguage;
  systemNotices: SystemNotice[];
  savedRevisionNote?: TutorRevisionNote;
  buildMessageLanguageMetadata: (args: {
    text: string;
    sessionLanguageState: SessionLanguageState;
    detectedInputLanguage?: DetectedInputLanguage | null;
  }) => Record<string, unknown>;
  learnerLoopStateOverride?: LearnerLoopState | null;
};

export type BuildAssistantTurnPipelineResult = {
  learnerLoopState: LearnerLoopState;
  presentation?: MessagePresentationMeta;
  assistantMetadata: AssistantResponseMeta;
  reflectionStatePatch: Partial<TutorState>;
};

export async function buildAssistantTurnPipeline(
  args: BuildAssistantTurnPipelineArgs
): Promise<BuildAssistantTurnPipelineResult> {
  const learnerLoopState =
    args.learnerLoopStateOverride ||
    (await buildLearnerLoopState({
      userId: args.userId,
      userText: args.userText,
      assistantText: args.assistantText,
      topic: args.topic,
      subject: args.subject,
      tutorActionId: args.tutorActionId,
      priorTutorState: args.priorTutorState,
      currentMetacognitiveState: args.currentMetacognitiveState,
      awaitingStudentAttempt: args.awaitingStudentAttempt,
      afterMistake: args.afterMistake,
      afterSuccess: args.afterSuccess,
    }));

  const aiAssistantMetadata = asRecord(args.aiAssistantMetadata) || {};
  const aiTutorUi = asRecord(aiAssistantMetadata.tutorUi);
  const aiPresentation = asRecord(aiAssistantMetadata.presentation);
  const turnType = resolveTurnType({
    priorTutorState: args.priorTutorState,
    tutorActionId: args.tutorActionId,
    afterMistake: args.afterMistake,
    afterSuccess: args.afterSuccess,
    savedRevisionNote: args.savedRevisionNote,
    basePresentation: args.basePresentation,
    aiPresentation,
    learnerLoopState,
  });
  const { presentationPatch: reflectionPatch, statePatch: reflectionStatePatch } =
    buildReflectionPresentationPatch({
      prompt: learnerLoopState.reflectionPrompt,
      priorTutorState: args.priorTutorState,
      currentMetacognitiveState: args.currentMetacognitiveState,
      topic: args.topic,
      turnType,
      tutorActionId: args.tutorActionId,
      awaitingStudentAttempt: args.awaitingStudentAttempt,
      afterMistake: args.afterMistake,
      afterSuccess: args.afterSuccess,
      topicMastery: learnerLoopState.topicMastery,
      weakTopicRecovery: learnerLoopState.weakTopicRecovery,
      systemNotices: args.systemNotices,
    });

  const mergedTutorUi = aiTutorUi || args.tutorUi
    ? ({
        ...(aiTutorUi || {}),
        ...(args.tutorUi || {}),
      } as TutorActionUiMeta)
    : undefined;

  const mergedPresentation =
    aiPresentation ||
    args.basePresentation ||
    Object.keys(reflectionPatch).length > 0 ||
    args.forceAwaitingStudentAttempt
      ? ({
          ...(aiPresentation || {}),
          ...(args.basePresentation || {}),
          ...reflectionPatch,
          ...(args.forceAwaitingStudentAttempt ? { awaitingStudentAttempt: true } : {}),
        } as MessagePresentationMeta)
      : undefined;

  const mergedSystemNotices = sanitizeSystemNotices([
    ...((Array.isArray(aiAssistantMetadata.systemNotices)
      ? aiAssistantMetadata.systemNotices
      : []) as SystemNotice[]),
    ...args.systemNotices,
  ]);

  const languageMetadata = {
    ...args.buildMessageLanguageMetadata({
      text: args.userText,
      sessionLanguageState: args.sessionLanguageState,
      detectedInputLanguage: args.detectedInputLanguage,
    }),
    generatedLanguage: args.generatedLanguage,
  };

  const assistantEnvelope: AssistantMessageEnvelope = {
    version: 'v1',
    route: args.route,
    generatedAt: new Date().toISOString(),
    ...(mergedTutorUi ? { tutorUi: mergedTutorUi } : {}),
    ...(mergedPresentation ? { presentation: mergedPresentation } : {}),
    ...(mergedSystemNotices.length > 0 ? { systemNotices: mergedSystemNotices } : {}),
    ...(args.savedRevisionNote ? { savedRevisionNote: args.savedRevisionNote } : {}),
    language: languageMetadata,
    metacognition: args.currentMetacognitiveState,
  };

  const assistantMetadata: AssistantResponseMeta = {
    ...aiAssistantMetadata,
    ...(mergedTutorUi ? { tutorUi: mergedTutorUi } : {}),
    ...(mergedPresentation ? { presentation: mergedPresentation } : {}),
    ...(mergedSystemNotices.length > 0 ? { systemNotices: mergedSystemNotices } : {}),
    ...(args.savedRevisionNote ? { savedRevisionNote: args.savedRevisionNote } : {}),
    language: languageMetadata,
    metacognition: args.currentMetacognitiveState,
    assistantEnvelope,
  };

  return {
    learnerLoopState,
    presentation: mergedPresentation,
    assistantMetadata,
    reflectionStatePatch,
  };
}
