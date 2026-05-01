'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  User,
  Pencil,
  Copy,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Lightbulb,
  Rows3,
  AlignLeft,
  BookOpen,
  PenLine,
  Bookmark,
  ArrowRight,
  Search,
  Video,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type {
  Message,
  ConversationState,
  RecommendedVideo,
  SelectionSourceKind,
  TutorActionRequest,
  TutorActionUiMeta,
  TutorQuickAction,
  TutorState,
  VideoData,
} from '@/lib/types';
import {
  resolveTutorSurfaceDecision,
  type TutorSurfaceActionId,
} from '@/lib/tutor-action-engine';
import { resolveAssistantEnvelopeMetadata } from '@/lib/assistant-envelope';
import {
  resolveLatestReflectionMessageKey,
  resolveReflectionSurface,
} from '@/lib/assistant-message-presentation';
import { cn } from '@/lib/utils';
import YouTubePlayer from './ui/youtube-player';
import { ChatInputBar } from './chat-input-bar';
import type { ComposerSelectedContextPreview } from './chat-input-bar';
import { AssistantLogo } from './copilot/AssistantLogo';
import type { MetacognitiveChoicePayload } from './copilot/MetacognitivePromptCard';
import { AssistantSupportSurface } from './copilot/AssistantSupportSurface';
import ReactMarkdown from 'react-markdown';
import type { VoiceController } from '../../AI/useVoiceController';
import { SourceChips } from './copilot/SourceChips';
import { EvidencePanels } from './copilot/EvidencePanels';
import type { SelectionAction, SelectionActionPayload } from './copilot/SelectionActionMenu';
import { SelectionActionMenu } from './copilot/SelectionActionMenu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) return extractText(node.props.children);
  return '';
};

const extractLanguage = (node: React.ReactNode): string | null => {
  if (!node) return null;
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = extractLanguage(child);
      if (found) return found;
    }
    return null;
  }
  if (React.isValidElement(node)) {
    const className = node.props?.className;
    if (typeof className === 'string') {
      const match = className.match(/language-([a-z0-9+-]+)/i);
      if (match) return match[1];
    }
    return extractLanguage(node.props?.children);
  }
  return null;
};

const CITE_TOKEN_REGEX = /\[\[cite:(\d+)]]/g;
const MAX_INLINE_CITATIONS = 3;

export const TUTOR_ACTIONS: Array<{
  id: TutorSurfaceActionId;
  label: string;
  tooltip: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'hint', label: 'Hint', tooltip: 'Get a small hint', icon: Lightbulb },
  { id: 'breakdown', label: 'Break down', tooltip: 'Break down the problem', icon: Rows3 },
  { id: 'summarize', label: 'Summarize', tooltip: 'Say it in a simpler way', icon: AlignLeft },
  { id: 'practice', label: 'Practice', tooltip: 'Try a similar question', icon: PenLine },
  { id: 'save', label: 'Save', tooltip: 'Save to revision', icon: Bookmark },
  { id: 'research', label: 'Research this', tooltip: 'Use trusted sources for this point', icon: Search },
  { id: 'video', label: 'Find video', tooltip: 'Find a visual explanation', icon: Video },
  { id: 'continue_video', label: 'Use video', tooltip: 'Bring this video back into guided study chat', icon: ArrowRight },
];

export function stripYoutubeLinksFromText(text: string): string {
  return String(text || '')
    .replace(/\[([^\]]+)\]\((https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)[^)]+)\)/gi, '$1')
    .replace(/https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be)\S*/gi, '')
    .replace(/\s+\./g, '.')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function looksFactualSentence(sentence: string): boolean {
  const clean = sentence.trim();
  if (clean.length < 36) return false;
  if (/[?]$/.test(clean)) return false;

  const hasSignalWord =
    /\b(is|are|was|were|has|have|includes|reported|reports|found|shows|states|according)\b/i.test(clean);
  const hasNumericSignal = /\b\d{2,4}\b|%|\b(one|two|three|four|five|million|billion)\b/i.test(clean);

  return hasSignalWord || hasNumericSignal;
}

export function injectInlineCitationTokens(content: string, sourceCount: number): string {
  if (!content || sourceCount <= 0) return content;
  CITE_TOKEN_REGEX.lastIndex = 0;
  if (CITE_TOKEN_REGEX.test(content)) return content;

  const maxCitations = Math.min(MAX_INLINE_CITATIONS, sourceCount);
  const sentences = content.split(/(?<=[.!?])\s+/);
  const candidateIndexes = sentences
    .map((sentence, index) => (looksFactualSentence(sentence) ? index : -1))
    .filter((index) => index >= 0)
    .slice(0, maxCitations);

  if (candidateIndexes.length === 0) return content;

  candidateIndexes.forEach((sentenceIndex, i) => {
    const marker = ` [[cite:${i + 1}]]`;
    sentences[sentenceIndex] = `${sentences[sentenceIndex].trim()}${marker}`;
  });

  return sentences.join(' ');
}

export function renderCitationNodes(
  node: React.ReactNode,
  bubbleId: string,
  activeCitation: number | null,
  onActivate: (index: number, scroll: boolean) => void
): React.ReactNode {
  if (typeof node === 'string') {
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    CITE_TOKEN_REGEX.lastIndex = 0;

    while ((match = CITE_TOKEN_REGEX.exec(node)) !== null) {
      const before = node.slice(lastIndex, match.index);
      if (before) parts.push(before);
      const index = Number(match[1]);
      parts.push(
        <button
          key={`${bubbleId}-cite-${index}-${match.index}`}
          type="button"
          className={cn('inline-citation-pill', activeCitation === index && 'inline-citation-pill-active')}
          onMouseEnter={() => onActivate(index, false)}
          onFocus={() => onActivate(index, false)}
          onClick={(event) => {
            event.preventDefault();
            onActivate(index, true);
          }}
          aria-label={`Citation ${index}`}
        >
          [{index}]
        </button>
      );
      lastIndex = match.index + match[0].length;
    }

    const after = node.slice(lastIndex);
    if (after) parts.push(after);
    return parts;
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={`${bubbleId}-node-${idx}`}>
        {renderCitationNodes(child, bubbleId, activeCitation, onActivate)}
      </React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const children = renderCitationNodes(
      (node.props as any)?.children,
      bubbleId,
      activeCitation,
      onActivate
    );
    return React.cloneElement(node as React.ReactElement<any>, {
      ...(node.props as any),
      children,
    });
  }

  return node;
}

export const CopyablePre: React.FC<React.HTMLAttributes<HTMLPreElement>> = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);

  const codeText = useMemo(() => extractText(children), [children]);
  const language = useMemo(() => extractLanguage(children), [children]);
  const displayLanguage = useMemo(() => {
    if (!language) return 'CODE';
    const normalized = language.trim().toLowerCase();
    if (normalized === 'text' || normalized === 'plain' || normalized === 'plaintext') return 'CODE';
    return normalized.toUpperCase();
  }, [language]);

  const handleCopy = useCallback(async () => {
    if (!codeText) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(codeText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [codeText]);

  return (
    <div className="md-pre">
      <div className="md-pre-header">
        <span className="md-pre-lang">{displayLanguage}</span>
        <button
          type="button"
          className="md-copy-btn"
          onClick={handleCopy}
          aria-label="Copy code"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre {...props} className={cn('md-pre-scroll', className)}>
        {children}
      </pre>
    </div>
  );
};

export const writeTextToClipboard = async (text: string) => {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

export const CopyableInlineCode: React.FC<React.HTMLAttributes<HTMLElement>> = ({ children, className, ...props }) => {
  const [copied, setCopied] = useState(false);
  const codeText = useMemo(() => extractText(children), [children]);

  const handleCopyInline = useCallback(async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (!codeText) return;

    try {
      await writeTextToClipboard(codeText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }, [codeText]);

  return (
    <span className="md-inline-code-wrap">
      <code {...props} className={cn('md-inline-code', className)}>
        {children}
      </code>
      <button
        type="button"
        className="md-inline-copy-btn"
        onClick={handleCopyInline}
        aria-label="Copy inline code"
      >
        {copied ? 'Copied' : 'Copy'}
      </button>
    </span>
  );
};

export function formatArtifactTypeLabel(kind?: string, fallback?: string) {
  const raw = String(kind || fallback || '').trim();
  if (!raw) return 'Study material';
  return raw
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getAssistantStatusLine(message: Message) {
  const tutorUi = resolveAssistantEnvelopeMetadata((message.metadata as any) || null).tutorUi as
    | TutorActionUiMeta
    | undefined;
  if (tutorUi?.statusLine) return tutorUi.statusLine;
  if (message.isError) return 'Connection note';
  if (message.videoData) return 'Video suggestion';
  if (Array.isArray(message.sources) && message.sources.length > 0) return 'Research-backed guidance';
  if (Array.isArray((message.metadata as any)?.tutorArtifacts) && (message.metadata as any)?.tutorArtifacts.length > 0) {
    return 'Study material reviewed';
  }
  return 'Socratic Response';
}

export function getAssistantNextStep(message: Message, tutorState?: TutorState) {
  const tutorUi = resolveAssistantEnvelopeMetadata((message.metadata as any) || null).tutorUi as
    | TutorActionUiMeta
    | undefined;
  if (tutorUi?.nextStep) return tutorUi.nextStep;
  const topic = String(tutorState?.activeTopic || '').trim();
  if (message.videoData) {
    return `Use the video, then try one short practice question on ${topic || 'this topic'}.`;
  }
  if (Array.isArray((message.metadata as any)?.tutorArtifacts) && (message.metadata as any)?.tutorArtifacts.length > 0) {
    return 'Start with a short breakdown, then focus on one question from the material.';
  }
  if (Array.isArray(message.sources) && message.sources.length > 0) {
    return 'Start with a short summary, then compare the sources only if you still need it.';
  }
  return `Pick one clear next step${topic ? ` for ${topic}` : ''}, then keep going.`;
}

export const AttachmentSummaryCard: React.FC<{ message: Message; isUser: boolean }> = ({ message, isUser }) => {
  const attachments = Array.isArray((message.metadata as any)?.attachments)
    ? (message.metadata as any).attachments
    : [];
  const tutorArtifacts = Array.isArray((message.metadata as any)?.tutorArtifacts)
    ? (message.metadata as any).tutorArtifacts
    : [];
  const hasAttachmentCard = attachments.length > 0 || Boolean(message.image);
  if (!hasAttachmentCard) return null;

  const leadArtifact = tutorArtifacts[0];
  const sourceDocumentId = String(
    (message.metadata as any)?.revisionItemId ||
      (message.metadata as any)?.savedRevisionNote?.id ||
      (message.metadata as any)?.revisionNoteId ||
      ''
  ).trim() || undefined;
  const materialLabel = formatArtifactTypeLabel(
    leadArtifact?.artifactType,
    attachments[0]?.kind || (message.image ? 'image' : 'file')
  );

  return (
    <div
      className={cn(
        'copilot-material-card mt-3 overflow-hidden',
        isUser && 'border-[var(--copilot-accent-border)] bg-[var(--copilot-surface-1)]'
      )}
      data-selection-source-kind="artifact"
      data-selection-message-id={message.id}
      data-selection-artifact-label={leadArtifact?.label || materialLabel}
      data-selection-source-type="artifact_attachment"
      data-selection-document-id={sourceDocumentId}
    >
      <div
        className={cn(
          'flex items-start justify-between gap-3 border-b px-4 py-3',
          isUser
            ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)]'
            : 'border-slate-200/70 bg-slate-50/75'
        )}
      >
        <div className="space-y-1">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Study material</div>
          <div className="text-sm font-semibold text-slate-900">{materialLabel}</div>
        </div>
        <span className="copilot-material-pill text-[11px]">
          {(attachments.length || 1) > 1 ? `${attachments.length} files` : '1 file'}
        </span>
      </div>

      {message.image && (
        <div className="bg-slate-950/5 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <ImageIcon className="h-3.5 w-3.5" />
            <span>{message.image.alt || 'Image attachment'}</span>
          </div>
          <div className="overflow-hidden rounded-2xl border border-black/10 bg-white shadow-sm">
            <img src={message.image.src} alt={message.image.alt} className="block h-auto max-h-[360px] w-full object-contain" />
          </div>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-4 py-3">
          {attachments.map((attachment: any, index: number) => {
            const kind = String(attachment?.kind || '').toLowerCase();
            const Icon = kind === 'image' ? ImageIcon : kind === 'pdf' ? FileText : Paperclip;
            const sizeBytes = Number(attachment?.sizeBytes || 0);
            const sizeLabel = sizeBytes > 0 ? `${Math.max(1, Math.round(sizeBytes / 1024))} KB` : null;
            return (
              <div
                key={`${attachment?.name || 'attachment'}-${index}`}
                className="copilot-material-pill"
              >
                <Icon className="h-3.5 w-3.5 text-[var(--copilot-accent-text)]" />
                <span className="max-w-[180px] truncate font-medium">{attachment?.name || `Attachment ${index + 1}`}</span>
                {sizeLabel ? <span className="text-muted-foreground">{sizeLabel}</span> : null}
              </div>
            );
          })}
        </div>
      )}

      {tutorArtifacts.length > 0 && (
        <div className="border-t border-black/5 px-4 py-4">
          <div className="space-y-3">
            {tutorArtifacts.slice(0, 2).map((artifact: any) => (
              <div key={artifact.id || artifact.label} className="rounded-2xl border border-black/5 bg-white/85 px-3 py-3 shadow-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{artifact.label}</p>
                  {artifact.subject ? (
                    <span className="rounded-full bg-[var(--copilot-accent-soft)] px-2 py-0.5 text-[10px] font-medium text-[var(--copilot-accent-text)]">
                      {artifact.subject}
                    </span>
                  ) : null}
                  {artifact.artifactType ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{artifact.artifactType}</span>
                  ) : null}
                </div>
                <p className="mt-2 text-[12px] leading-5 text-muted-foreground">{artifact.summary}</p>
                {Array.isArray(artifact.questions) && artifact.questions.length > 0 && (
                  <p className="mt-2 text-[11px] text-[var(--copilot-accent-text)]">
                    Detected questions: {artifact.questions.length}
                  </p>
                )}
                {Array.isArray(artifact.headings) && artifact.headings.length > 0 && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Headings: {artifact.headings.slice(0, 3).join(' | ')}</p>
                )}
                {Array.isArray(artifact.actionableTasks) && artifact.actionableTasks.length > 0 && (
                  <p className="mt-1 text-[11px] text-emerald-800">Study tasks: {artifact.actionableTasks.slice(0, 2).join(' | ')}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const MessageBubble: React.FC<{
  message: Message;
  isResearchModeActive: boolean;
  isPlayingAudio?: boolean;
  showReflectionPrompt?: boolean;
  isCurrentlyStreaming?: boolean;
  canEdit?: boolean;
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
  showReflectionPrompt = false,
  isCurrentlyStreaming = false,
  canEdit = false,
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
  const canonicalAssistantMeta = React.useMemo(
    () => resolveAssistantEnvelopeMetadata((message.metadata as any) || null),
    [message.metadata]
  );
  const currentVideo = message.videoData ?? null;
  const hasVideo = !!currentVideo;
  const hasSources = !isUser && Array.isArray(message.sources) && message.sources.length > 0;
  const bubbleId = React.useMemo(() => (message.id || `msg-${Math.abs(message.content.length)}`).replace(/[^\w-]/g, ''), [message.id, message.content]);
  const [activeCitation, setActiveCitation] = useState<number | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draftContent, setDraftContent] = useState(message.content);
  const [copied, setCopied] = useState(false);
  const [activeTutorActionId, setActiveTutorActionId] = useState<TutorSurfaceActionId | null>(null);
  const tutorActionResetTimerRef = useRef<number | null>(null);
  const visibleMessageContent = React.useMemo(() => {
    if (!message.videoData) return message.content;
    return stripYoutubeLinksFromText(message.content);
  }, [message.content, message.videoData]);

  const messageContentWithCitations = React.useMemo(() => {
    if (!hasSources) return visibleMessageContent;
    return injectInlineCitationTokens(visibleMessageContent, message.sources?.length || 0);
  }, [hasSources, visibleMessageContent, message.sources]);

  React.useEffect(() => {
    setActiveCitation(null);
    setDraftContent(message.content);
    setIsEditing(false);
    setActiveTutorActionId(null);
  }, [message.id, message.content]);

  React.useEffect(() => {
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

  const canShowEdit = isUser && canEdit && !message.image && !Array.isArray((message.metadata as any)?.attachments);
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
  const tutorSurfaceDecision = React.useMemo(
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
    <div className={cn('flex items-start gap-4 w-full min-w-0', isUser ? 'flex-row-reverse' : 'flex-row')}>
      {isUser ? (
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback>
            <User className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
      ) : (
        <AssistantLogo size={32} className="mt-0.5" />
      )}

      <div className={cn('flex flex-col min-w-0 flex-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'relative min-w-0 overflow-hidden text-sm break-words [overflow-wrap:anywhere]',
            isUser
              ? 'w-fit rounded-2xl rounded-br-none px-4 py-3 copilot-user-bubble max-w-[calc(100%-2.75rem)] md:max-w-[75%]'
              : 'copilot-teaching-card max-w-[calc(100%-1.25rem)] md:max-w-[78%]'
          )}
          data-selection-source-kind={selectionSourceKind}
          data-selection-message-id={message.id}
          data-selection-video-title={message.videoData?.title || undefined}
          data-selection-source-type={selectionSourceType}
          data-selection-document-id={sourceDocumentId}
        >
          {isUser && isEditing ? (
            <div className="space-y-2">
              <textarea
                value={draftContent}
                onChange={(event) => setDraftContent(event.target.value)}
                className="w-full min-h-[88px] max-h-52 overflow-y-auto rounded-lg border border-primary/20 bg-background/70 p-2 text-sm resize-none outline-none focus:border-primary/40"
                autoFocus
                disabled={isBusy}
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full h-10 px-5 text-sm font-semibold bg-[#1f1f1f] text-white hover:bg-[#2a2a2a] disabled:opacity-50"
                  onClick={() => {
                    setDraftContent(message.content);
                    setIsEditing(false);
                  }}
                  disabled={isBusy}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center rounded-full h-10 px-5 text-sm font-semibold bg-white text-[#161616] hover:bg-[#f3f3f3] disabled:opacity-50"
                  onClick={handleSaveEdit}
                  disabled={saveDisabled}
                >
                  Update
                </button>
              </div>
            </div>
          ) : isUser ? (
            <div className="space-y-2">
              {message.content && (
                <div className="markdown-bubble">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="md-img my-2 h-auto w-full cursor-pointer rounded-lg shadow-md transition-opacity hover:opacity-90"
                          style={{ maxHeight: '200px', objectFit: 'cover' }}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="md-link copilot-md-link underline font-medium"
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p {...props} className="md-p mb-2 last:mb-0 leading-relaxed">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </p>
                      ),
                      ul: ({ node, ...props }) => <ul {...props} className="md-ul mb-2 ml-4 list-disc" />,
                      ol: ({ node, ...props }) => <ol {...props} className="md-ol mb-2 ml-4 list-decimal" />,
                      li: ({ node, ...props }) => (
                        <li {...props} className="md-li mb-1">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </li>
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote {...props} className="md-blockquote my-2 border-l-2 pl-3 opacity-80">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </blockquote>
                      ),
                      pre: ({ node, ...props }) => <CopyablePre {...props} />,
                      code: ({ node, inline, className, children, ...props }: any) =>
                        inline ? (
                          <CopyableInlineCode {...props} className={className}>
                            {children}
                          </CopyableInlineCode>
                        ) : (
                          <code {...props} className={cn('md-code-block', className)}>
                            {children}
                          </code>
                        ),
                      table: ({ node, ...props }) => (
                        <div className="md-table-wrap">
                          <table {...props} className="md-table" />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead {...props} className="md-thead" />,
                      th: ({ node, ...props }) => <th {...props} className="md-th" />,
                      td: ({ node, ...props }) => <td {...props} className="md-td" />,
                    }}
                  >
                    {messageContentWithCitations}
                  </ReactMarkdown>
                </div>
              )}
              <AttachmentSummaryCard message={message} isUser />
            </div>
          ) : (
            <div className="space-y-4 px-4 py-4 md:px-5 md:py-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn('copilot-teaching-kicker', message.isError && 'bg-amber-100 text-amber-800')}>
                  {hasVideo ? <Video className="h-3.5 w-3.5" /> : hasSources ? <Search className="h-3.5 w-3.5" /> : <BookOpen className="h-3.5 w-3.5" />}
                  {assistantStatusLine}
                </span>
                {hasSources ? (
                  <span className="text-[11px] font-medium text-slate-500">
                    {message.sources?.length} source{(message.sources?.length || 0) > 1 ? 's' : ''}
                  </span>
                ) : null}
              </div>

              {message.content ? (
                <div className="markdown-bubble copilot-assistant-text text-[15px] leading-7">
                  <ReactMarkdown
                    components={{
                      img: ({ node, ...props }) => (
                        <img
                          {...props}
                          className="md-img my-2 h-auto w-full cursor-pointer rounded-lg shadow-md transition-opacity hover:opacity-90"
                          style={{ maxHeight: '220px', objectFit: 'cover' }}
                        />
                      ),
                      a: ({ node, ...props }) => (
                        <a
                          {...props}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="md-link copilot-md-link underline font-medium"
                        />
                      ),
                      p: ({ node, ...props }) => (
                        <p {...props} className="md-p mb-3 last:mb-0 leading-7">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </p>
                      ),
                      ul: ({ node, ...props }) => <ul {...props} className="md-ul mb-3 ml-4 list-disc" />,
                      ol: ({ node, ...props }) => <ol {...props} className="md-ol mb-3 ml-4 list-decimal" />,
                      li: ({ node, ...props }) => (
                        <li {...props} className="md-li mb-1.5">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </li>
                      ),
                      blockquote: ({ node, ...props }) => (
                        <blockquote {...props} className="md-blockquote my-3 border-l-2 pl-3 opacity-80">
                          {renderCitationNodes(props.children, bubbleId, activeCitation, activateCitation)}
                        </blockquote>
                      ),
                      pre: ({ node, ...props }) => <CopyablePre {...props} />,
                      code: ({ node, inline, className, children, ...props }: any) =>
                        inline ? (
                          <CopyableInlineCode {...props} className={className}>
                            {children}
                          </CopyableInlineCode>
                        ) : (
                          <code {...props} className={cn('md-code-block', className)}>
                            {children}
                          </code>
                        ),
                      table: ({ node, ...props }) => (
                        <div className="md-table-wrap">
                          <table {...props} className="md-table" />
                        </div>
                      ),
                      thead: ({ node, ...props }) => <thead {...props} className="md-thead" />,
                      th: ({ node, ...props }) => <th {...props} className="md-th" />,
                      td: ({ node, ...props }) => <td {...props} className="md-td" />,
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
                  <YouTubePlayer videoId={currentVideo.id} mode="embedded" />
                  <p className="px-1 text-xs font-medium text-muted-foreground">{currentVideo.title}</p>
                </div>
              )}

              <EvidencePanels
                message={message}
                onContinueFromVideo={onContinueFromVideo}
              />

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
                onMetacognitiveChoice={(payload) => onMetacognitiveChoice?.(message, payload)}
                onOpenPracticePad={onOpenPracticePad ? () => onOpenPracticePad(message) : undefined}
              />
            </div>
          )}
        </div>
        {(canShowEdit || canCopyMessage) && !isEditing && (
          <div className="copilot-message-actions mt-1">
            {canCopyMessage && (
              <button
                type="button"
                className="copilot-message-action"
                onClick={handleCopyMessage}
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="copilot-message-action-label" data-open={copied ? 'true' : undefined}>
                  {copied ? 'Copied' : 'Copy'}
                </span>
              </button>
            )}
            {canShowEdit && (
              <button
                type="button"
                className="copilot-message-action disabled:opacity-50"
                onClick={() => setIsEditing(true)}
                disabled={isBusy}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span className="copilot-message-action-label" data-open="true">Edit</span>
              </button>
            )}
          </div>
        )}
        {canShowTutorActions && !isEditing && (
          <div className="mt-3 flex flex-wrap gap-2">
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
                          'copilot-tutor-action disabled:cursor-not-allowed disabled:opacity-55',
                          action.tier === 'secondary' && 'copilot-tutor-action-secondary'
                        )}
                        onClick={() => void handleTutorSurfaceAction(action.id)}
                        disabled={isBusy || activeTutorActionId !== null}
                      >
                        <Icon className="h-3.5 w-3.5" />
                        <span>{label}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p>{tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        )}
      </div>
    </div>
  );
};

interface ChatTabProps {
  messages: Message[];
  studentName: string;
  displayedWelcomeText: string;
  scrollAreaRef: React.RefObject<HTMLDivElement>;
  selectedFiles: File[];
  handleRemoveFile: (index?: number) => void;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.FormEvent | null, overrideText?: string) => void;
  isLoading: boolean;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  forceWebSearch: boolean;
  setForceWebSearch: (value: boolean) => void;
  includeVideos: boolean;
  setIncludeVideos: (value: boolean) => void;
  level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
  setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
  languageHint: 'English' | 'Swahili mix';
  setLanguageHint: (value: 'English' | 'Swahili mix') => void;
  conversationState: ConversationState;
  tutorState?: TutorState;
  isNewChat: boolean;
  isPlayingAudio?: boolean;

  // ✅ Global Voice Controller
  voiceController: VoiceController;
  onVoiceModeStart: () => void;
  onEditMessage?: (messageId: string, content: string) => void;
  onTutorQuickAction?: (action: TutorQuickAction, message: Message) => void;
  onRunResearch?: (message: Message) => void;
  onRecommendVideos?: (message: Message) => void;
  onContinueFromVideo?: (message: Message, video: RecommendedVideo | VideoData) => void;
  onSelectionAction?: (action: Exclude<SelectionAction, 'copy'>, payload: SelectionActionPayload) => void;
  onMetacognitiveChoice?: (message: Message, payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: (message?: Message) => void;
  researchStreamStatus?: {
    phase: string;
    label: string;
    timestamp: string;
  } | null;
  selectedContext?: ComposerSelectedContextPreview | null;
  onClearSelectedContext?: () => void;
  inputPlaceholderOverride?: string;
  focusSignal?: number;
}

export const ChatTab: React.FC<ChatTabProps> = ({
  messages,
  studentName,
  displayedWelcomeText,
  scrollAreaRef,
  selectedFiles,
  handleRemoveFile,
  input,
  setInput,
  handleSendMessage,
  isLoading,
  handleFileChange,
  fileInputRef,
  forceWebSearch,
  setForceWebSearch,
  includeVideos,
  setIncludeVideos,
  level,
  setLevel,
  languageHint,
  setLanguageHint,
  conversationState,
  tutorState,
  isNewChat,
  isPlayingAudio,
  voiceController,
  onVoiceModeStart,
  onEditMessage,
  onTutorQuickAction,
  onRunResearch,
  onRecommendVideos,
  onContinueFromVideo,
  onSelectionAction,
  onMetacognitiveChoice,
  onOpenPracticePad,
  researchStreamStatus,
  selectedContext,
  onClearSelectedContext,
  inputPlaceholderOverride,
  focusSignal,
}) => {
  const selectionScopeRef = useRef<HTMLDivElement>(null);
  const latestReflectionMessageKey = React.useMemo(
    () => resolveLatestReflectionMessageKey(messages),
    [messages]
  );

  const handleSelectionAction = useCallback(
    async (action: SelectionAction, payload: SelectionActionPayload) => {
      const selectedText = payload.text.trim();
      if (!selectedText) return;

      if (action === 'copy') {
        await writeTextToClipboard(selectedText);
        window.getSelection()?.removeAllRanges();
        return;
      }
      onSelectionAction?.(action, payload);
      window.getSelection()?.removeAllRanges();
    },
    [onSelectionAction]
  );

  return (
    <div className="relative grid h-full min-h-0 flex-1 grid-rows-[minmax(0,1fr)_auto] overflow-hidden">
      {/* 🛑 NO LEGACY VOICE OVERLAY HERE */}

      <div ref={selectionScopeRef} className="relative min-h-0 overflow-hidden">
      <ScrollArea className="h-full min-h-0" ref={scrollAreaRef}>
        <div className="flex min-h-full flex-col space-y-5 p-4 pb-6 md:p-5 md:pb-7">
          {messages.length === 0 && isNewChat ? (
            <div className="flex min-h-[50vh] flex-col items-center justify-center space-y-8">
              <div className="chat-empty-logo-spotlight" aria-hidden="true">
                <span className="chat-empty-logo-ring chat-empty-logo-ring-one" />
                <span className="chat-empty-logo-ring chat-empty-logo-ring-two" />
                <AssistantLogo
                  size={84}
                  className="chat-empty-logo-core border-primary/30 bg-white/95 p-2 rounded-[1.75rem]"
                />
              </div>

              <Card className="mx-auto max-w-md border border-slate-200/70 bg-white/90 text-center shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl">Ready to study, {studentName}?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-6 text-slate-600">
                    {displayedWelcomeText || 'Bring a question, a worksheet, or a topic you want to understand better.'}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                showReflectionPrompt={(msg.id || `idx-${index}`) === latestReflectionMessageKey}
                isCurrentlyStreaming={isLoading && index === messages.length - 1 && msg.role === 'model'}
                isResearchModeActive={conversationState.researchModeActive}
                isPlayingAudio={isPlayingAudio}
                canEdit
                onEditMessage={onEditMessage}
                isBusy={isLoading}
                tutorState={tutorState}
                onTutorQuickAction={onTutorQuickAction}
                onRunResearch={onRunResearch}
                onRecommendVideos={onRecommendVideos}
                onContinueFromVideo={onContinueFromVideo}
                onMetacognitiveChoice={onMetacognitiveChoice}
                onOpenPracticePad={(message) => onOpenPracticePad?.(message)}
              />
            ))
          )}
        </div>
      </ScrollArea>
      <SelectionActionMenu scopeRef={selectionScopeRef} onAction={handleSelectionAction} />
      </div>

      <div className="shrink-0">
      <ChatInputBar
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        selectedFiles={selectedFiles}
        handleFileChange={handleFileChange}
        handleRemoveFile={handleRemoveFile}
        fileInputRef={fileInputRef}
        forceWebSearch={forceWebSearch}
        setForceWebSearch={setForceWebSearch}
        includeVideos={includeVideos}
        setIncludeVideos={setIncludeVideos}
        level={level}
        setLevel={setLevel}
        languageHint={languageHint}
        setLanguageHint={setLanguageHint}
        researchStatus={researchStreamStatus}
        selectedContext={selectedContext}
        onClearSelectedContext={onClearSelectedContext}
        inputPlaceholderOverride={inputPlaceholderOverride}
        focusSignal={focusSignal}

        // ✅ UI states derived from global controller
        isVoiceProcessing={voiceController.state !== 'idle'}

        // ✅ Mic button triggers the overlay opening sequence
        onVoiceModeStart={onVoiceModeStart}
      />
      </div>
    </div>
  );
};
