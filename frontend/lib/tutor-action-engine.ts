import type { Message, TutorQuickAction, TutorState } from './types';
import { resolveAssistantEnvelopeMetadata } from './assistant-envelope';

export type TutorSurfaceActionId = TutorQuickAction | 'research' | 'video' | 'continue_video';
export type TutorActionTier = 'primary' | 'secondary';

export type TutorSurfaceActionDecision = {
  visibleActions: Array<{
    id: TutorSurfaceActionId;
    tier: TutorActionTier;
    label: string;
    tooltip: string;
  }>;
  bestNextAction?: TutorSurfaceActionId | null;
  nextMoveText?: string | null;
  followupQuestion?: string | null;
  hideNextMove?: boolean;
};

type ResolveTutorActionDecisionArgs = {
  message: Message;
  tutorState?: TutorState;
  allowTutorActions?: boolean;
  allowResearch?: boolean;
  allowVideo?: boolean;
  allowContinueVideo?: boolean;
};

type ActionCopy = {
  label: string;
  tooltip: string;
  nextMove: string;
};

const ACTION_COPY: Record<TutorSurfaceActionId, ActionCopy> = {
  hint: {
    label: 'Hint',
    tooltip: 'Get one small clue',
    nextMove: 'Check your level: name what you already know, then attempt one small step and share your reasoning.',
  },
  breakdown: {
    label: 'Break down',
    tooltip: 'Split it into shorter steps',
    nextMove: 'Take only step one now, then rate your confidence from 1 to 5 before step two.',
  },
  summarize: {
    label: 'Summarize',
    tooltip: 'Turn it into a short recap',
    nextMove: 'From memory, explain the core idea in one sentence, then test it with one short example.',
  },
  practice: {
    label: 'Practice',
    tooltip: 'Try one similar question',
    nextMove: 'Try one similar question, then tell me which step felt easiest and which felt hardest.',
  },
  save: {
    label: 'Save',
    tooltip: 'Keep this for revision later',
    nextMove: 'Write one takeaway and one mistake to avoid next time so your level keeps improving.',
  },
  research: {
    label: 'Research this',
    tooltip: 'Use trusted sources for this point',
    nextMove: 'Use research only if you need a source-backed or current answer.',
  },
  video: {
    label: 'Find video',
    tooltip: 'Find a useful visual explanation',
    nextMove: 'Use a short video if a visual explanation would help more than extra text.',
  },
  continue_video: {
    label: 'Use video',
    tooltip: 'Bring this video back into guided study chat',
    nextMove: 'Use the video, then come back for one quick check.',
  },
};

const GENERIC_NEXT_MOVE_PATTERNS = [
  /choose a next move below/i,
  /tell me where you want more help/i,
  /ask me where you want more support/i,
];
const QUICK_ACTION_DIRECTIVE_PATTERNS = [
  /\b(click|tap|press|choose|select)\b[^.?!\n]{0,40}\b(hint|break\s*down|summarize|practice|save)\b/i,
  /\buse\b[^.?!\n]{0,30}\b(hint|break\s*down|summarize|practice|save)\b/i,
  /\b(hint|break\s*down|summarize|practice|save)\b[^.?!\n]{0,24}\b(button|action|option)\b/i,
];

const USER_FACING_QUICK_ACTIONS: TutorQuickAction[] = ['hint', 'breakdown', 'summarize', 'practice', 'save'];

function normalizeText(value: unknown): string {
  return String(value || '').trim();
}

function getMetadataRecord(message: Message): Record<string, any> {
  return message.metadata && typeof message.metadata === 'object'
    ? (message.metadata as Record<string, any>)
    : {};
}

function pickUnique(ids: TutorSurfaceActionId[]): TutorSurfaceActionId[] {
  const seen = new Set<TutorSurfaceActionId>();
  const ordered: TutorSurfaceActionId[] = [];
  ids.forEach((id) => {
    if (!seen.has(id)) {
      seen.add(id);
      ordered.push(id);
    }
  });
  return ordered;
}

function shouldSuppressRawNextMove(raw: string): boolean {
  return GENERIC_NEXT_MOVE_PATTERNS.some((pattern) => pattern.test(raw));
}

function shouldRewriteRawNextMove(raw: string): boolean {
  return QUICK_ACTION_DIRECTIVE_PATTERNS.some((pattern) => pattern.test(raw));
}

function sanitizeExplicitNextMove(raw: string, fallback: string | null): string | null {
  const clean = normalizeText(raw);
  if (!clean) return fallback;
  if (!shouldRewriteRawNextMove(clean)) return clean;
  return (
    fallback ||
    'Check your current level in one sentence, then try one small challenge step and report what changed.'
  );
}

function resolveFallbackActions(args: {
  tutorActionId?: string;
  cardKind?: string;
  awaitingStudentAttempt: boolean;
  hasSources: boolean;
  hasVideo: boolean;
  hasArtifacts: boolean;
  contentLength: number;
}): TutorQuickAction[] {
  if (args.hasVideo) return ['summarize', 'practice', 'save'];
  if (args.hasSources) return ['summarize', 'save', 'practice'];

  switch (args.tutorActionId) {
    case 'hint':
      return ['breakdown', 'practice', 'save'];
    case 'breakdown':
      return ['hint', 'practice', 'summarize', 'save'];
    case 'summarize':
      return ['save', 'practice', 'breakdown'];
    case 'practice':
      return ['hint', 'breakdown', 'save'];
    case 'save':
      return ['practice', 'summarize'];
    default:
      break;
  }

  switch (args.cardKind) {
    case 'summary':
      return ['save', 'practice', 'breakdown'];
    case 'practice':
      return ['hint', 'breakdown', 'save'];
    case 'breakdown':
      return ['hint', 'practice', 'save'];
    case 'source_supported':
      return ['summarize', 'save', 'practice'];
    default:
      break;
  }

  if (args.awaitingStudentAttempt) return ['hint', 'breakdown', 'practice', 'save'];
  if (args.hasArtifacts) return ['breakdown', 'summarize', 'practice', 'save'];
  if (args.contentLength >= 520) return ['summarize', 'breakdown', 'save', 'practice'];
  return ['hint', 'practice', 'breakdown', 'save'];
}

function resolveFollowupQuestion(args: {
  tutorActionId?: string;
  awaitingStudentAttempt: boolean;
  reflectionPrompt?: string | null;
  inlineReflectionPrompt?: string | null;
  reflectLevel?: string | null;
  turnType?: string | null;
  bestNextAction?: TutorSurfaceActionId | null;
  assistantContentHasQuestion?: boolean;
}): string | null {
  if (args.assistantContentHasQuestion) return null;
  if (normalizeText(args.reflectLevel) === 'full') return null;
  const inlinePrompt = normalizeText(args.inlineReflectionPrompt);
  if (inlinePrompt) return inlinePrompt;
  if (normalizeText(args.reflectionPrompt)) return null;
  if (normalizeText(args.turnType) === 'checkpoint') {
    return 'What changed in your understanding after this step?';
  }
  if (normalizeText(args.turnType) === 'recovery') {
    return 'Which single part feels hardest right now?';
  }
  if (args.awaitingStudentAttempt || args.tutorActionId === 'practice') {
    return 'What is your first step before the final answer?';
  }
  if (args.tutorActionId === 'hint') {
    return 'What do you already know that can guide the next step?';
  }
  if (args.tutorActionId === 'breakdown') {
    return 'Which one step can you solve confidently right now?';
  }
  if (args.bestNextAction === 'practice') {
    return 'Ready to test yourself with one similar question?';
  }
  return null;
}

export function resolveTutorSurfaceDecision({
  message,
  tutorState,
  allowTutorActions = true,
  allowResearch = false,
  allowVideo = false,
  allowContinueVideo = false,
}: ResolveTutorActionDecisionArgs): TutorSurfaceActionDecision {
  if (!allowTutorActions || message.role !== 'model' || message.isError) {
    return { visibleActions: [], bestNextAction: null, nextMoveText: null, followupQuestion: null };
  }

  const metadata = getMetadataRecord(message);
  const canonicalAssistantMeta = resolveAssistantEnvelopeMetadata(metadata);
  const presentation = (canonicalAssistantMeta.presentation || {}) as Record<string, any>;
  const tutorUi = (canonicalAssistantMeta.tutorUi || {}) as Record<string, any>;
  const systemNotices = canonicalAssistantMeta.systemNotices;
  const researchMeta = metadata.research && typeof metadata.research === 'object'
    ? (metadata.research as Record<string, any>)
    : {};

  const tutorActionId = normalizeText(tutorUi.actionId || '');
  const cardKind = normalizeText(presentation.cardKind || '');
  const turnType = normalizeText(presentation.turnType || '');
  const reflectLevel = normalizeText(presentation.reflectLevel || '');
  const inlineReflectionPrompt = normalizeText(presentation.inlineReflectionPrompt || '');
  const rawSuggestedActions = Array.isArray(presentation.suggestedActions)
    ? (presentation.suggestedActions as TutorQuickAction[])
    : [];
  const suggestedActions = rawSuggestedActions.filter(
    (action): action is TutorQuickAction =>
      USER_FACING_QUICK_ACTIONS.includes(action as TutorQuickAction)
  );

  const hasSources = Array.isArray(message.sources) && message.sources.length > 0;
  const hasVideo = Boolean(message.videoData);
  const hasArtifacts =
    Boolean(message.image) ||
    (Array.isArray(metadata.attachments) && metadata.attachments.length > 0) ||
    (Array.isArray(metadata.tutorArtifacts) && metadata.tutorArtifacts.length > 0);
  const awaitingStudentAttempt =
    Boolean(presentation.awaitingStudentAttempt) || Boolean(tutorState?.awaitingStudentAttempt);
  const contentLength = normalizeText(message.content).length;

  const baseActions = suggestedActions.length > 0
    ? suggestedActions
    : resolveFallbackActions({
        tutorActionId,
        cardKind,
        awaitingStudentAttempt,
        hasSources,
        hasVideo,
        hasArtifacts,
        contentLength,
      });

  let primaryIds: TutorSurfaceActionId[] = [];
  let secondaryIds: TutorSurfaceActionId[] = [];

  if (hasVideo && allowContinueVideo) {
    primaryIds = ['continue_video', ...baseActions.slice(0, 2)];
    secondaryIds = baseActions.slice(2);
  } else {
    primaryIds = baseActions.slice(0, Math.min(2, baseActions.length));
    secondaryIds = baseActions.slice(Math.min(2, baseActions.length), 4);
  }

  const researchNoticeCodes = systemNotices
    .map((notice) => normalizeText(notice?.code))
    .filter(Boolean);
  const researchMetaNoticeCodes = Array.isArray(researchMeta.notices)
    ? (researchMeta.notices as Array<{ code?: unknown }>)
        .map((notice) => normalizeText(notice?.code))
        .filter(Boolean)
    : [];
  const allResearchNoticeCodes = [...researchNoticeCodes, ...researchMetaNoticeCodes];
  const sourceConfidence = normalizeText(presentation.sourceConfidence || researchMeta.confidenceState || '');
  const lowSourceConfidence =
    sourceConfidence === 'limited' ||
    sourceConfidence === 'low' ||
    sourceConfidence === 'mixed' ||
    sourceConfidence === 'insufficient';
  const shouldOfferResearch =
    allowResearch &&
    !hasVideo &&
    (
      (
        !hasSources &&
        (
          normalizeText(tutorState?.currentStudyMode) === 'research' ||
          allResearchNoticeCodes.includes('current_info_risk') ||
          sourceConfidence === 'limited' ||
          normalizeText(researchMeta.researchIntent) === 'verification'
        )
      ) ||
      (
        hasSources &&
        (
          lowSourceConfidence ||
          (Array.isArray(message.sources) && message.sources.length <= 2) ||
          allResearchNoticeCodes.includes('mixed_sources') ||
          allResearchNoticeCodes.includes('research_confidence_low')
        )
      )
    );

  const shouldOfferVideo =
    allowVideo &&
    !hasVideo &&
    !allowContinueVideo &&
    (
      hasArtifacts ||
      cardKind === 'breakdown' ||
      cardKind === 'explanation' ||
      tutorActionId === 'breakdown' ||
      contentLength >= 380 ||
      Array.isArray(researchMeta.recommendedVideos) && researchMeta.recommendedVideos.length > 0
    );

  if (shouldOfferResearch) secondaryIds.push('research');
  if (shouldOfferVideo) secondaryIds.push('video');

  const resolveActionCopy = (id: TutorSurfaceActionId): ActionCopy => {
    const base = ACTION_COPY[id];
    if (id === 'summarize' && hasSources) {
      return {
        ...base,
        label: 'Simplify this',
        tooltip: 'Explain this in simpler language',
      };
    }
    if (id === 'research' && hasSources) {
      if (lowSourceConfidence || allResearchNoticeCodes.includes('research_confidence_low')) {
        return {
          ...base,
          label: 'More trusted source',
          tooltip: 'Find a stronger source to verify this',
          nextMove: 'Bring one stronger source, then compare the key claim.',
        };
      }
      return {
        ...base,
        label: 'Compare sources',
        tooltip: 'Cross-check with another source',
        nextMove: 'Compare this answer with one more source for confidence.',
      };
    }
    if (id === 'video' && hasSources) {
      return {
        ...base,
        label: 'Find visual explanation',
        tooltip: 'Find a visual or video explanation',
      };
    }
    return base;
  };

  const visibleActionIds = pickUnique([...primaryIds, ...secondaryIds]).slice(0, 5);
  const visibleActions = visibleActionIds.map((id) => ({
    id,
    tier: (primaryIds.includes(id) ? 'primary' : 'secondary') as TutorActionTier,
    label: resolveActionCopy(id).label,
    tooltip: resolveActionCopy(id).tooltip,
  }));

  const bestNextAction = visibleActions[0]?.id || null;
  const followupQuestion = resolveFollowupQuestion({
    tutorActionId,
    awaitingStudentAttempt,
    reflectionPrompt: normalizeText(presentation.reflectionPrompt || ''),
    inlineReflectionPrompt,
    reflectLevel,
    turnType,
    bestNextAction,
    assistantContentHasQuestion: /\?/.test(normalizeText(message.content)),
  });
  const hideNextMove = Boolean(followupQuestion);
  const nextMoveText = hideNextMove
    ? null
    : (() => {
        const explicitNextMove = normalizeText(tutorUi.nextStep || presentation.nextStepPrompt || '');
        if (explicitNextMove && !shouldSuppressRawNextMove(explicitNextMove)) {
          const fallback = bestNextAction ? resolveActionCopy(bestNextAction).nextMove : null;
          return sanitizeExplicitNextMove(explicitNextMove, fallback);
        }
        if (!bestNextAction) return null;
        return resolveActionCopy(bestNextAction).nextMove;
      })();

  return {
    visibleActions,
    bestNextAction,
    nextMoveText,
    followupQuestion,
    hideNextMove,
  };
}
