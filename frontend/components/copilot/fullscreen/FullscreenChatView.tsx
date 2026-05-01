'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Loader2, Pencil, Copy, Search, Video, BookOpen } from 'lucide-react';
import type { Message, RecommendedVideo, SelectionSourceKind, TutorQuickAction, TutorState, VideoData } from '@/lib/types';
import { cn } from '@/lib/utils';
import { getSteadfastUiCopy } from '@/lib/steadfast-product';
import ReactMarkdown from 'react-markdown';
import YouTubePlayer from '@/components/ui/youtube-player';
import { SourceChips } from '../SourceChips';
import { EvidencePanels } from '../EvidencePanels';
import { AssistantLogo } from '../AssistantLogo';
import type { MetacognitiveChoicePayload } from '../MetacognitivePromptCard';
import { AssistantSupportSurface } from '../AssistantSupportSurface';
import type { SelectionAction, SelectionActionPayload } from '../SelectionActionMenu';
import { SelectionActionMenu } from '../SelectionActionMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AttachmentSummaryCard,
  CopyableInlineCode,
  CopyablePre,
  TUTOR_ACTIONS,
  getAssistantNextStep,
  getAssistantStatusLine,
  injectInlineCitationTokens,
  renderCitationNodes,
  stripYoutubeLinksFromText,
  writeTextToClipboard,
} from '@/components/chat-tab';
import {
  resolveTutorSurfaceDecision,
  type TutorSurfaceActionId,
} from '@/lib/tutor-action-engine';
import { resolveAssistantEnvelopeMetadata } from '@/lib/assistant-envelope';
import {
  resolveLatestReflectionMessageKey,
  resolveReflectionSurface,
} from '@/lib/assistant-message-presentation';
import type { CopilotSurfaceKind, CopilotSurfaceProfile } from '@/lib/types';

interface FullscreenChatViewProps {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  studentName: string;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  onEditMessage?: (messageId: string, content: string) => void;
  tutorState?: TutorState;
  onTutorQuickAction?: (action: TutorQuickAction, message: Message) => void;
  onRunResearch?: (message: Message) => void;
  onRecommendVideos?: (message: Message) => void;
  onContinueFromVideo?: (message: Message, video: RecommendedVideo | VideoData) => void;
  onSelectionAction?: (action: Exclude<SelectionAction, 'copy'>, payload: SelectionActionPayload) => void;
  onMetacognitiveChoice?: (message: Message, payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: (message?: Message) => void;
}

const FullscreenMessageBubble: React.FC<{
  message: Message;
  idx: number;
  isCurrentlyStreaming: boolean;
  showReflectionPrompt?: boolean;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  onEditMessage?: (messageId: string, content: string) => void;
  isBusy?: boolean;
  tutorState?: TutorState;
  onTutorQuickAction?: (action: TutorQuickAction, message: Message) => void;
  onRunResearch?: (message: Message) => void;
  onRecommendVideos?: (message: Message) => void;
  onContinueFromVideo?: (message: Message, video: RecommendedVideo | VideoData) => void;
  onMetacognitiveChoice?: (message: Message, payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: (message: Message) => void;
}> = ({
  message,
  idx,
  isCurrentlyStreaming,
  showReflectionPrompt = false,
  surfaceKind = 'fullscreen',
  surfaceProfile = 'expanded',
  onEditMessage,
  isBusy = false,
  tutorState,
  onTutorQuickAction,
  onRunResearch,
  onRecommendVideos,
  onContinueFromVideo,
  onMetacognitiveChoice,
  onOpenPracticePad,
}) => {
  const isUser = message.role === 'user';
  const isWidgetSurface = surfaceKind === 'widget';
  const isCompactWidget = isWidgetSurface && surfaceProfile === 'compact';
  const isCozyWidget = isWidgetSurface && surfaceProfile === 'cozy';
  const canonicalAssistantMeta = useMemo(
    () => resolveAssistantEnvelopeMetadata((message.metadata as any) || null),
    [message.metadata]
  );
  const currentVideo = message.videoData ?? null;
  const hasVideo = Boolean(currentVideo);
  const hasSources = !isUser && Array.isArray(message.sources) && message.sources.length > 0;
  const bubbleId = useMemo(() => (message.id || `msg-${idx}`).replace(/[^\w-]/g, ''), [message.id, idx]);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [activeTutorActionId, setActiveTutorActionId] = useState<TutorSurfaceActionId | null>(null);
  const tutorActionResetTimerRef = useRef<number | null>(null);
  const visibleMessageContent = useMemo(() => {
    if (!message.videoData) return message.content;
    return stripYoutubeLinksFromText(message.content);
  }, [message.content, message.videoData]);
  const messageContentWithCitations = useMemo(() => {
    if (!hasSources) return visibleMessageContent;
    return injectInlineCitationTokens(visibleMessageContent, message.sources?.length || 0);
  }, [hasSources, visibleMessageContent, message.sources]);

  useEffect(() => {
    setActiveCitation(null);
    setDraftContent(message.content);
    setIsEditing(false);
    setActiveTutorActionId(null);
  }, [message.id, message.content]);

  useEffect(() => {
    return () => {
      if (tutorActionResetTimerRef.current) {
        window.clearTimeout(tutorActionResetTimerRef.current);
        tutorActionResetTimerRef.current = null;
      }
    };
  }, []);

  const activateCitation = useCallback(
    (index: number, scroll: boolean) => {
      setActiveCitation(index);
      if (!scroll) return;
      const chipEl = document.getElementById(`source-chip-${bubbleId}-${index}`);
      chipEl?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    },
    [bubbleId]
  );

  const canShowEdit = isUser && !message.image && !Array.isArray((message.metadata as any)?.attachments) && !isCurrentlyStreaming;
  const canCopyMessage = isUser && Boolean(String(message.content || '').trim()) && !isEditing;
  const canShowTutorActions =
    !isUser &&
    !message.isError &&
    Boolean(onTutorQuickAction || onRunResearch || onRecommendVideos || onContinueFromVideo);
  const canShowResearchAction = !isUser && !message.isError && Boolean(onRunResearch);
  const canShowVideoAction = !isUser && !message.isError && Boolean(onRecommendVideos);
  const canContinueVideo = !isUser && !message.isError && Boolean(onContinueFromVideo && currentVideo);
  const hasAttachments = Boolean(message.image) || (Array.isArray((message.metadata as any)?.attachments) && (message.metadata as any)?.attachments.length > 0);
  const trimmedDraft = draftContent.trim();
  const saveDisabled = isBusy || !trimmedDraft || trimmedDraft === message.content.trim();
  const assistantStatusLine = getAssistantStatusLine(message);
  const tutorSurfaceDecision = useMemo(
    () =>
      resolveTutorSurfaceDecision({
        message,
        tutorState,
        allowTutorActions: canShowTutorActions,
        allowResearch: canShowResearchAction,
        allowVideo: canShowVideoAction,
        allowContinueVideo: canContinueVideo,
      }),
    [message, tutorState, canShowTutorActions, canShowResearchAction, canShowVideoAction, canContinueVideo]
  );
  const nextStepText = tutorSurfaceDecision.hideNextMove
    ? null
    : tutorSurfaceDecision.nextMoveText || getAssistantNextStep(message, tutorState);
  const followupQuestion = tutorSurfaceDecision.followupQuestion;
  const selectionSourceKind: SelectionSourceKind = isUser ? 'user_message' : 'assistant_message';
  const sourceDocumentId = String(
    (message.metadata as any)?.revisionItemId ||
      (message.metadata as any)?.savedRevisionNote?.id ||
      (message.metadata as any)?.revisionNoteId ||
      ''
  ).trim() || undefined;
  const selectionSourceType = isUser ? 'message:user' : 'message:assistant';
  const reflectionSurface = !isUser
    ? resolveReflectionSurface({ message, showReflectionPrompt })
    : { reflectionPrompt: null, weakTopicRecovery: null, reflectLevel: 'silent' as const };
  const reflectionPrompt = reflectionSurface.reflectionPrompt;
  const weakTopicRecovery = reflectionSurface.weakTopicRecovery;

  const handleSaveEdit = useCallback(() => {
    if (!canShowEdit || saveDisabled || !onEditMessage) return;
    onEditMessage(message.id, trimmedDraft);
    setIsEditing(false);
  }, [canShowEdit, saveDisabled, onEditMessage, message.id, trimmedDraft]);

  const handleCopyMessage = useCallback(async () => {
    try {
      await writeTextToClipboard(String(message.content || ''));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [message.content]);

  const handleTutorSurfaceAction = useCallback(
    async (actionId: TutorSurfaceActionId) => {
      if (isBusy || activeTutorActionId) return;
      setActiveTutorActionId(actionId);
      const startedAt = Date.now();
      try {
        switch (actionId) {
          case 'research':
            await Promise.resolve(onRunResearch?.(message));
            break;
          case 'video':
            await Promise.resolve(onRecommendVideos?.(message));
            break;
          case 'continue_video':
            if (currentVideo) await Promise.resolve(onContinueFromVideo?.(message, currentVideo));
            break;
          default:
            await Promise.resolve(onTutorQuickAction?.(actionId, message));
        }
      } finally {
        const elapsed = Date.now() - startedAt;
        const releaseDelay = elapsed >= 260 ? 0 : 260 - elapsed;
        if (tutorActionResetTimerRef.current) {
          window.clearTimeout(tutorActionResetTimerRef.current);
        }
        tutorActionResetTimerRef.current = window.setTimeout(() => {
          setActiveTutorActionId(null);
          tutorActionResetTimerRef.current = null;
        }, releaseDelay);
      }
    },
    [activeTutorActionId, currentVideo, isBusy, message, onContinueFromVideo, onRecommendVideos, onRunResearch, onTutorQuickAction]
  );

  return (
    <div
      className={cn(
        'flex w-full items-start',
        isWidgetSurface ? (isCompactWidget ? 'gap-3' : 'gap-4') : 'gap-5',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {isUser ? (
        <Avatar className={cn('mt-0.5 flex-shrink-0', isCompactWidget ? 'h-8 w-8' : 'h-9 w-9')}>
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <AssistantLogo size={isCompactWidget ? 30 : 34} className="mt-0.5" />
      )}

      <div className={cn('flex min-w-0 flex-1 flex-col', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative min-w-0 overflow-hidden text-sm break-words [overflow-wrap:anywhere]',
            isUser
              ? isWidgetSurface
                ? cn(
                    'copilot-user-bubble w-fit rounded-3xl rounded-br-none',
                    isCompactWidget
                      ? 'max-w-[calc(100%-2rem)] px-4 py-3'
                      : isCozyWidget
                        ? 'max-w-[calc(100%-2.25rem)] px-4 py-3.5'
                        : 'max-w-[calc(100%-2.75rem)] px-4 py-3.5 md:max-w-[75%]'
                  )
                : 'copilot-user-bubble w-fit max-w-[calc(100%-3rem)] rounded-3xl rounded-br-none px-5 py-4 md:max-w-[70%]'
              : isWidgetSurface
                ? isCompactWidget
                  ? 'copilot-teaching-card max-w-[calc(100%-0.25rem)]'
                  : 'copilot-teaching-card max-w-[min(100%,760px)]'
                : 'copilot-teaching-card max-w-[min(820px,100%)]'
          )}
          data-selection-source-kind={selectionSourceKind}
          data-selection-message-id={message.id}
          data-selection-video-title={message.videoData?.title || undefined}
          data-selection-source-type={selectionSourceType}
          data-selection-document-id={sourceDocumentId}
        >
          {isUser && isEditing ? (
            <div className="space-y-3">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="w-full min-h-[104px] max-h-60 resize-none overflow-y-auto rounded-2xl border border-primary/20 bg-background/70 p-3 text-sm outline-none focus:border-primary/40"
                autoFocus
                disabled={isBusy}
              />
              <div className="flex items-center justify-end gap-2">
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-full bg-[#1f1f1f] px-5 text-sm font-semibold text-white hover:bg-[#2a2a2a]" onClick={() => { setDraftContent(message.content); setIsEditing(false); }} disabled={isBusy}>Cancel</button>
                <button type="button" className="inline-flex h-10 items-center justify-center rounded-full bg-white px-5 text-sm font-semibold text-[#161616] hover:bg-[#f3f3f3] disabled:opacity-50" onClick={handleSaveEdit} disabled={saveDisabled}>Update</button>
              </div>
            </div>
          ) : isUser ? (
            <div className="space-y-2">
              {message.content && (
                <div className="markdown-bubble">
                  <ReactMarkdown
                    components={{
                      a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="copilot-md-link underline font-medium" />,
                      p: ({ ...props }) => <p {...props} className="mb-2 leading-relaxed last:mb-0">{renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}</p>,
                      ul: ({ ...props }) => <ul {...props} className="mb-2 ml-4 list-disc" />,
                      ol: ({ ...props }) => <ol {...props} className="mb-2 ml-4 list-decimal" />,
                      li: ({ ...props }) => <li {...props} className="mb-1">{renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}</li>,
                      pre: ({ ...props }) => <CopyablePre {...props} />,
                      code: ({ inline, className, children, ...props }: any) => inline ? <CopyableInlineCode {...props} className={className}>{children}</CopyableInlineCode> : <code {...props} className={cn('md-code-block', className)}>{children}</code>,
                    }}
                  >
                    {messageContentWithCitations}
                  </ReactMarkdown>
                </div>
              )}
              <AttachmentSummaryCard message={message} isUser />
            </div>
          ) : (
            <div className="space-y-5 px-5 py-5 md:px-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('copilot-teaching-kicker', message.isError && 'bg-amber-100 text-amber-800')}>
                  {hasVideo ? <Video className="h-3.5 w-3.5" /> : hasSources ? <Search className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                  {assistantStatusLine}
                </span>
                {hasSources ? <span className="text-[11px] font-medium text-slate-500">{message.sources?.length} source{(message.sources?.length || 0) > 1 ? 's' : ''}</span> : null}
              </div>

              {message.content ? (
                <div className="markdown-bubble copilot-assistant-text text-[15px] leading-7">
                  <ReactMarkdown
                    components={{
                      a: ({ ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="copilot-md-link underline font-medium" />,
                      p: ({ ...props }) => <p {...props} className="mb-3 leading-7 last:mb-0">{renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}</p>,
                      ul: ({ ...props }) => <ul {...props} className="mb-3 ml-4 list-disc" />,
                      ol: ({ ...props }) => <ol {...props} className="mb-3 ml-4 list-decimal" />,
                      li: ({ ...props }) => <li {...props} className="mb-1.5">{renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}</li>,
                      pre: ({ ...props }) => <CopyablePre {...props} />,
                      code: ({ inline, className, children, ...props }: any) => inline ? <CopyableInlineCode {...props} className={className}>{children}</CopyableInlineCode> : <code {...props} className={cn('md-code-block', className)}>{children}</code>,
                    }}
                  >
                    {messageContentWithCitations}
                  </ReactMarkdown>
                  {isCurrentlyStreaming ? <span className="copilot-stream-cursor" aria-hidden="true" /> : null}
                </div>
              ) : isCurrentlyStreaming ? (
                <div className="copilot-stream-typing" aria-label="Steadfast is typing">
                  <span className="copilot-stream-dot" />
                  <span className="copilot-stream-dot" />
                  <span className="copilot-stream-dot" />
                </div>
              ) : null}

              {hasAttachments ? <AttachmentSummaryCard message={message} isUser={false} /> : null}
              {hasVideo && currentVideo && (
                <div
                  className="space-y-2"
                  data-selection-source-kind="video_summary"
                  data-selection-message-id={message.id}
                  data-selection-video-title={currentVideo.title || undefined}
                  data-selection-source-type="video_summary"
                  data-selection-document-id={sourceDocumentId}
                >
                  <YouTubePlayer videoId={currentVideo.id} mode="fullscreen" />
                  <p className="px-1 text-xs font-medium text-muted-foreground">{currentVideo.title}</p>
                </div>
              )}
              <EvidencePanels message={message} onContinueFromVideo={onContinueFromVideo} />
              {hasSources && (
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Sources</p>
                  <SourceChips sources={message.sources} compact bubbleId={bubbleId} activeCitation={activeCitation} />
                </div>
              )}
              <AssistantSupportSurface
                reflectionPrompt={reflectionPrompt}
                weakTopicRecovery={weakTopicRecovery}
                followupQuestion={followupQuestion ?? null}
                nextStepText={nextStepText ?? null}
                busy={isBusy}
                showNextMoveLabel
                onMetacognitiveChoice={(payload) => onMetacognitiveChoice?.(message, payload)}
                onOpenPracticePad={onOpenPracticePad ? () => onOpenPracticePad(message) : undefined}
              />
            </div>
          )}
        </div>

        {(canShowEdit || canCopyMessage) && !isEditing && (
          <div className="copilot-message-actions mt-2">
            {canCopyMessage && (
              <button type="button" className="copilot-message-action" onClick={handleCopyMessage}>
                <Copy className="h-3.5 w-3.5" />
                <span className="copilot-message-action-label" data-open={copied ? 'true' : undefined}>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            )}
            {canShowEdit && (
              <button type="button" className="copilot-message-action disabled:opacity-50" onClick={() => setIsEditing(true)} disabled={isBusy}>
                <Pencil className="h-3.5 w-3.5" />
                <span className="copilot-message-action-label" data-open="true">Edit</span>
              </button>
            )}
          </div>
        )}

        {canShowTutorActions && !isEditing && (
          <div className="mt-3">
            <div className="flex flex-wrap gap-2">
              <TooltipProvider delayDuration={100}>
                {tutorSurfaceDecision.visibleActions.map((action) => {
                  const actionConfig = TUTOR_ACTIONS.find((entry) => entry.id === action.id);
                  if (!actionConfig) return null;
                  const Icon = actionConfig.icon;
                  const label = String(action.label || actionConfig.label || '').trim() || actionConfig.label;
                  const tooltip = String(action.tooltip || actionConfig.tooltip || '').trim() || actionConfig.tooltip;
                  return (
                    <Tooltip key={action.id}>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className={cn(
                            'copilot-tutor-action copilot-control-tutor disabled:cursor-not-allowed disabled:opacity-55',
                            action.tier === 'secondary' && 'copilot-tutor-action-secondary'
                          )}
                          onClick={() => void handleTutorSurfaceAction(action.id)}
                          disabled={isBusy || activeTutorActionId !== null}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top"><p>{tooltip}</p></TooltipContent>
                    </Tooltip>
                  );
                })}
              </TooltipProvider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export function FullscreenChatView({
  messages,
  isLoading,
  isStreaming,
  studentName,
  surfaceKind = 'fullscreen',
  surfaceProfile = 'expanded',
  onEditMessage,
  tutorState,
  onTutorQuickAction,
  onRunResearch,
  onRecommendVideos,
  onContinueFromVideo,
  onSelectionAction,
  onMetacognitiveChoice,
  onOpenPracticePad,
}: FullscreenChatViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const selectionScopeRef = useRef<HTMLDivElement>(null);
  const isWidgetSurface = surfaceKind === 'widget';
  const isCompactWidget = isWidgetSurface && surfaceProfile === 'compact';
  const isCozyWidget = isWidgetSurface && surfaceProfile === 'cozy';
  const latestReflectionMessageKey = useMemo(
    () => resolveLatestReflectionMessageKey(messages),
    [messages]
  );

  useEffect(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) viewport.scrollTop = viewport.scrollHeight;
  }, [messages, isStreaming]);

  const handleSelectionAction = useCallback(async (action: SelectionAction, payload: SelectionActionPayload) => {
    const selectedText = payload.text.trim();
    if (!selectedText) return;
    if (action === 'copy') {
      await writeTextToClipboard(selectedText);
      window.getSelection()?.removeAllRanges();
      return;
    }

    onSelectionAction?.(action, payload);
    window.getSelection()?.removeAllRanges();
  }, [onSelectionAction]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-transparent">
      <div ref={selectionScopeRef} className="relative flex min-h-0 flex-1 flex-col">
        <ScrollArea className="flex-1 min-h-0" ref={scrollAreaRef}>
          <div
            className={cn(
              'w-full',
              isWidgetSurface
                ? isCompactWidget
                  ? 'px-3 py-4'
                  : isCozyWidget
                    ? 'px-4 py-5'
                    : 'px-4 py-6 sm:px-5'
                : 'mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-10'
            )}
            data-copilot-surface-kind={surfaceKind}
            data-copilot-surface-profile={surfaceProfile}
          >
            {messages.length === 0 && !isLoading ? (
              <div
                className={cn(
                  'flex items-center justify-center px-4',
                  isWidgetSurface ? (isCompactWidget ? 'min-h-[40vh]' : 'min-h-[46vh]') : 'min-h-[58vh] px-6'
                )}
              >
                <div className="copilot-workspace-hero copilot-future-hover copilot-hover-reveal-group max-w-3xl text-center">
                  <div className="relative z-[1] flex flex-col items-center">
                    <AssistantLogo
                      size={isWidgetSurface ? (isCompactWidget ? 68 : 76) : 84}
                      className="border-primary/20 bg-white/95 p-2.5 shadow-lg"
                    />
                    <div className={cn('max-w-2xl space-y-3', isWidgetSurface ? 'mt-6' : 'mt-8')}>
                      <p className="copilot-workspace-eyebrow">Study studio</p>
                      <h2 className={cn('font-semibold tracking-tight text-slate-950', isWidgetSurface ? 'text-2xl' : 'text-3xl')}>
                        {getSteadfastUiCopy('chat.heroTitle')} {studentName}?
                      </h2>
                      <p
                        className={cn(
                          'copilot-hover-reveal-copy text-slate-600',
                          isWidgetSurface ? 'text-sm leading-6' : 'text-base leading-7'
                        )}
                      >
                        {getSteadfastUiCopy('chat.heroBody')}
                      </p>
                    </div>

                    <div className="copilot-hover-reveal-copy flex flex-wrap justify-center gap-2">
                      <span className="copilot-revision-pill">Ask one clear question</span>
                      <span className="copilot-revision-pill">Upload a worksheet when needed</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(isWidgetSurface ? 'space-y-5' : 'space-y-8')}>
                {messages.map((message, idx) => (
                  <FullscreenMessageBubble
                    key={message.id || idx}
                    message={message}
                    idx={idx}
                    isCurrentlyStreaming={isStreaming && idx === messages.length - 1 && message.role === 'model'}
                    showReflectionPrompt={(message.id || `idx-${idx}`) === latestReflectionMessageKey}
                    surfaceKind={surfaceKind}
                    surfaceProfile={surfaceProfile}
                    onEditMessage={onEditMessage}
                    isBusy={isLoading || isStreaming}
                    tutorState={tutorState}
                    onTutorQuickAction={onTutorQuickAction}
                    onRunResearch={onRunResearch}
                    onRecommendVideos={onRecommendVideos}
                    onContinueFromVideo={onContinueFromVideo}
                    onMetacognitiveChoice={onMetacognitiveChoice}
                    onOpenPracticePad={(message) => onOpenPracticePad?.(message)}
                  />
                ))}

                {isLoading && !isStreaming && (
                  <div className={cn('flex items-start', isWidgetSurface ? 'gap-4' : 'gap-5')}>
                    <AssistantLogo size={isCompactWidget ? 30 : 34} />
                    <div className="rounded-3xl border border-slate-200/80 bg-white/90 px-5 py-4 shadow-sm">
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">Working...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
        <SelectionActionMenu scopeRef={selectionScopeRef} onAction={handleSelectionAction} />
      </div>
    </div>
  );
}
