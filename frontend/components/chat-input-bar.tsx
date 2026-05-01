'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Plus,
  Mic,
  Paperclip,
  Send,
  X,
  Search,
  History,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { getSteadfastUiCopy } from '@/lib/steadfast-product';
import type {
  CopilotSurfaceKind,
  CopilotSurfaceProfile,
  FullscreenModeFlags,
  FullscreenPlusAction,
} from '@/lib/types';
import './ui/chat-input-bar.css';

interface ChatInputBarProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendMessage: (e: React.FormEvent | null, overrideText?: string) => void;
  isLoading: boolean;
  selectedFiles: File[];
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index?: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  forceWebSearch: boolean;
  setForceWebSearch: (value: boolean) => void;
  includeVideos: boolean;
  setIncludeVideos: (value: boolean) => void;
  level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
  setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
  languageHint: 'English' | 'Swahili mix';
  setLanguageHint: (value: 'English' | 'Swahili mix') => void;
  isVoiceProcessing?: boolean;
  onVoiceModeStart?: () => void;
  setIsVoiceRecording?: (value: boolean) => void;
  setIsVoiceProcessing?: (value: boolean) => void;
  onVoiceAutoSend?: (text: string) => void;
  onPlusAction?: (action: FullscreenPlusAction) => void;
  onPlusMenuOpenChange?: (isOpen: boolean) => void;
  onSearchWorkspace?: () => void;
  modeFlags?: Partial<FullscreenModeFlags>;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  variant?: 'widget' | 'fullscreen';
  recentFiles?: RecentSessionFilePreview[];
  recentFilesModalOpen?: boolean;
  onRecentFilesModalOpenChange?: (isOpen: boolean) => void;
  onAttachRecentFile?: (fileId: string) => void;
  researchStatus?: {
    phase: string;
    label: string;
    timestamp: string;
  } | null;
  selectedContext?: ComposerSelectedContextPreview | null;
  onClearSelectedContext?: () => void;
  inputPlaceholderOverride?: string;
  focusSignal?: number;
}

const DEFAULT_ACCEPT =
  'image/jpeg,image/png,image/webp,application/pdf,.pdf,text/plain,text/markdown,text/csv,application/json,text/json,application/xml,text/xml,.txt,.md,.csv,.json,.xml,.ts,.tsx,.js,.jsx,.py,.java,.c,.cpp,.cs,.go,.rs,.php,.html,.css,.sql';

type ComposerMenuAction = {
  id: FullscreenPlusAction | 'search_workspace';
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  onSelect: () => void;
};

export type RecentSessionFilePreview = {
  id: string;
  name: string;
  sizeKb: number;
  mimeType?: string | null;
  addedAt?: string | null;
  isAttached?: boolean;
};

export type ComposerSelectedContextPreview = {
  text: string;
  sourceLabel?: string | null;
  sourceKind?: string | null;
};

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  selectedFiles,
  handleFileChange,
  handleRemoveFile,
  fileInputRef,
  forceWebSearch,
  setForceWebSearch,
  isVoiceProcessing = false,
  onVoiceModeStart,
  onPlusAction,
  onPlusMenuOpenChange,
  onSearchWorkspace,
  modeFlags,
  surfaceKind,
  surfaceProfile,
  variant = 'widget',
  recentFiles = [],
  recentFilesModalOpen,
  onRecentFilesModalOpenChange,
  onAttachRecentFile,
  researchStatus,
  selectedContext,
  onClearSelectedContext,
  inputPlaceholderOverride,
  focusSignal,
}) => {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [internalRecentFilesOpen, setInternalRecentFilesOpen] = useState(false);
  const [uploadAccept, setUploadAccept] = useState(DEFAULT_ACCEPT);
  const [captureMode, setCaptureMode] = useState<string | undefined>(undefined);
  const resolvedSurfaceKind = surfaceKind || (variant === 'fullscreen' ? 'fullscreen' : 'widget');
  const resolvedSurfaceProfile = surfaceProfile || (resolvedSurfaceKind === 'fullscreen' ? 'expanded' : 'comfortable');
  const isWidgetVariant = resolvedSurfaceKind === 'widget';
  const isFullscreenSurface = resolvedSurfaceKind === 'fullscreen';
  const isCompactWidget = isWidgetVariant && resolvedSurfaceProfile === 'compact';
  const isCozyWidget = isWidgetVariant && resolvedSurfaceProfile === 'cozy';
  const usesFloatingCommandDeck = isWidgetVariant && (isCompactWidget || isCozyWidget);
  const supportsExternalRecentFilesSheet = !isWidgetVariant && Boolean(onPlusAction);
  const isResearchSignalActive = modeFlags?.research === true || forceWebSearch;
  const isFocusModeActive = modeFlags?.focus === true;
  const isExamModeActive = modeFlags?.exam === true;

  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const effectiveRecentFiles = useMemo<RecentSessionFilePreview[]>(() => {
    if (recentFiles.length > 0) return recentFiles;
    return selectedFiles.map((file) => ({
      id: `${file.name}:${file.size}:${file.lastModified}`,
      name: file.name,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      mimeType: file.type || null,
      addedAt: null,
      isAttached: true,
    }));
  }, [recentFiles, selectedFiles]);
  const isRecentFilesSheetOpen = supportsExternalRecentFilesSheet
    ? Boolean(recentFilesModalOpen)
    : internalRecentFilesOpen;
  const setRecentFilesSheetOpen = (open: boolean) => {
    if (supportsExternalRecentFilesSheet) {
      onRecentFilesModalOpenChange?.(open);
      return;
    }
    setInternalRecentFilesOpen(open);
  };
  const openRecentFilesSheet = () => setRecentFilesSheetOpen(true);

  useEffect(() => {
    onPlusMenuOpenChange?.(isMenuOpen);
  }, [isMenuOpen, onPlusMenuOpenChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node) &&
        plusButtonRef.current &&
        !plusButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openFilePicker = (accept = DEFAULT_ACCEPT, capture?: string) => {
    setUploadAccept(accept);
    setCaptureMode(capture);
    setIsMenuOpen(false);
    setRecentFilesSheetOpen(false);
    window.setTimeout(() => fileInputRef.current?.click(), 0);
  };

  const handleVoiceClick = () => {
    if (onVoiceModeStart) {
      onVoiceModeStart();
      return;
    }
    toast({
      title: 'Voice is not ready here',
      description: 'Try typing for now while voice mode finishes setting up.',
      variant: 'destructive',
    });
  };

  const closePlusMenu = () => {
    setIsMenuOpen(false);
  };

  const triggerPlusAction = (action: FullscreenPlusAction) => {
    onPlusAction?.(action);
  };

  const menuActions = useMemo<ComposerMenuAction[]>(
    () => [
      ...(onSearchWorkspace
        ? [
            {
              id: 'search_workspace' as const,
              label: 'Search Workspace',
              description: 'Jump into past chats, revision notes, and saved study trails',
              icon: Search,
              onSelect: () => {
                onSearchWorkspace();
                closePlusMenu();
              },
            },
          ]
        : []),
      {
        id: 'focus_mode',
        label: isFocusModeActive ? 'Focus mode active' : 'Focus mode',
        description: isFocusModeActive
          ? 'Single-target pacing is already enabled for this study flow'
          : 'Narrow the tutor onto one target with calmer, steadier guidance',
        icon: Sparkles,
        onSelect: () => {
          triggerPlusAction('focus_mode');
          closePlusMenu();
        },
      },
      {
        id: 'exam_mode',
        label: isExamModeActive ? 'Exam mode active' : 'Exam mode',
        description: isExamModeActive
          ? 'Exam precision is already active for marks, method, and timing'
          : 'Shift into marks, method, timing, and exam-style precision',
        icon: Target,
        onSelect: () => {
          triggerPlusAction('exam_mode');
          closePlusMenu();
        },
      },
      {
        id: 'web_research',
        label: isResearchSignalActive ? 'Web research active' : 'Web research',
        description: isResearchSignalActive
          ? 'Fresh source-backed lookup is already active for this turn'
          : 'Pull current, source-backed evidence into this study run',
        icon: ShieldCheck,
        onSelect: () => {
          triggerPlusAction('web_research');
          closePlusMenu();
        },
      },
      {
        id: 'add_files',
        label: 'Add photos & files',
        description: isWidgetVariant ? 'Bring in study material' : 'Bring in a photo, PDF, worksheet, or notes',
        icon: Paperclip,
        onSelect: () => {
          triggerPlusAction('add_files');
          if (isWidgetVariant || !onPlusAction) {
            openFilePicker(DEFAULT_ACCEPT);
            return;
          }
          closePlusMenu();
        },
      },
      {
        id: 'recent_files',
        label: 'Recent files',
        description:
          effectiveRecentFiles.length > 0
            ? `${effectiveRecentFiles.length} available in this study flow`
            : 'Reuse files already attached here',
        icon: History,
        onSelect: () => {
          triggerPlusAction('recent_files');
          closePlusMenu();
          if (supportsExternalRecentFilesSheet) return;
          openRecentFilesSheet();
        },
      },
    ],
    [
      isWidgetVariant,
      isExamModeActive,
      isFocusModeActive,
      isResearchSignalActive,
      onPlusAction,
      onSearchWorkspace,
      effectiveRecentFiles.length,
      supportsExternalRecentFilesSheet,
    ]
  );

  const inputPlaceholder = useMemo(() => {
    const overridden = String(inputPlaceholderOverride || '').trim();
    if (overridden) return overridden;
    if (selectedFiles.length > 0) return getSteadfastUiCopy('chat.inputWithMaterials');
    if (isResearchSignalActive) return getSteadfastUiCopy('chat.inputResearch');
    return getSteadfastUiCopy('chat.inputDefault');
  }, [inputPlaceholderOverride, isResearchSignalActive, selectedFiles.length]);
  const selectedContextPreview = useMemo(() => {
    const raw = String(selectedContext?.text || '').replace(/\s+/g, ' ').trim();
    if (!raw) return '';
    return raw.length > 220 ? `${raw.slice(0, 220)}...` : raw;
  }, [selectedContext?.text]);
  const selectedContextLabel = useMemo(() => {
    const explicit = String(selectedContext?.sourceLabel || '').trim();
    if (explicit) return explicit;
    const kind = String(selectedContext?.sourceKind || '').trim();
    if (kind === 'assistant_message') return 'From assistant message';
    if (kind === 'user_message') return 'From your message';
    if (kind === 'artifact') return 'From study material';
    if (kind === 'video_summary') return 'From video context';
    if (kind === 'study_material') return 'From study material';
    return 'From selected text';
  }, [selectedContext?.sourceKind, selectedContext?.sourceLabel]);

  useEffect(() => {
    if (!focusSignal || isLoading) return;
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const cursor = textarea.value.length;
    textarea.setSelectionRange(cursor, cursor);
  }, [focusSignal, isLoading]);

  const handleSendMessageWrapper = (e: React.FormEvent | null) => {
    handleSendMessage(e);
  };

  return (
    <TooltipProvider>
      <div
        className={cn(
          'chat-input-bar-container',
          'shrink-0',
          isFullscreenSurface
            ? 'border-0 bg-transparent px-0 pb-0 pt-0'
            : 'border-t border-border bg-background px-4 pb-4 pt-3'
        )}
        data-copilot-surface-kind={resolvedSurfaceKind}
        data-copilot-surface-profile={resolvedSurfaceProfile}
      >
        {(selectedFiles.length > 0 || isResearchSignalActive || Boolean(researchStatus) || Boolean(selectedContextPreview)) && (
          <div className="mb-3 space-y-2">
            {researchStatus ? (
              <div className="copilot-research-status-line" role="status" aria-live="polite" aria-atomic="true">
                <Search className="h-3.5 w-3.5" />
                <span>{researchStatus.label}</span>
              </div>
            ) : null}
            {selectedContextPreview ? (
              <div className="copilot-hover-reveal-group copilot-future-hover rounded-2xl border border-cyan-200/80 bg-cyan-50/65 p-3 shadow-sm" data-testid="composer-selected-context">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-700">Selected context</p>
                    <p className="mt-1 text-xs font-medium text-slate-700">{selectedContextLabel}</p>
                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-800">"{selectedContextPreview}"</p>
                  </div>
                  {onClearSelectedContext ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onClearSelectedContext}
                      className="h-8 rounded-full px-3 text-xs text-slate-700 hover:bg-cyan-100"
                      data-testid="composer-selected-context-clear"
                    >
                      Remove
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
            {selectedFiles.length > 0 && (
              <div className="copilot-hover-reveal-group copilot-future-hover rounded-2xl border border-slate-200 bg-white/90 p-3 shadow-sm">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Study material ready</p>
                    <p className="mt-1 text-sm font-medium text-slate-900">
                      {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} attached
                    </p>
                    <p className="hidden" aria-hidden="true">
                      Add a short instruction like "solve question 3" or "summarize this page."
                    </p>
                    <p className="copilot-hover-reveal-copy text-[11px] leading-5 text-slate-500">
                      Add a short instruction like "solve question 3" or "summarize this page."
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile()}
                    className="copilot-control-destructive h-8 rounded-full px-3 text-xs"
                  >
                    Clear all
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={`${file.name}:${file.size}:${file.lastModified}`} className="file-preview-chip">
                      <div className="file-preview-thumbnail flex items-center justify-center bg-primary/10">
                        <Paperclip className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <span className="block max-w-[170px] truncate text-xs font-medium text-slate-900">{file.name}</span>
                        <span className="text-[10px] text-slate-500">{Math.max(1, Math.round(file.size / 1024))} KB</span>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveFile(index)} className="remove-file-button">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        <div
          className={cn(
            'chat-input-bar relative flex items-end gap-2 rounded-[28px] border border-white/20 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(241,245,249,0.82))] p-2 shadow-[0_16px_40px_rgba(15,23,42,0.08)] transition-shadow focus-within:shadow-[0_22px_48px_rgba(14,165,233,0.12)]',
            isFullscreenSurface && 'chat-input-bar-fullscreen',
            isCompactWidget && 'gap-1.5 rounded-[24px] p-1.5'
          )}
        >
          <div className="plus-button-container relative shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="composer-plus-button"
                  onClick={() =>
                    setIsMenuOpen((prev) => {
                      const next = !prev;
                      return next;
                    })
                  }
                  className={cn(
                    'plus-button copilot-control-utility rounded-full border border-white/10 bg-[linear-gradient(145deg,rgba(240,249,255,0.94),rgba(224,242,254,0.78))] text-cyan-700 shadow-[0_12px_24px_rgba(14,165,233,0.16)] transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(14,165,233,0.2)]',
                    isCompactWidget ? 'h-8 w-8' : isWidgetVariant ? 'h-9 w-9' : 'h-10 w-10'
                  )}
                  ref={plusButtonRef}
                >
                  <Plus className={cn(isCompactWidget ? 'h-4 w-4' : isWidgetVariant ? 'h-[18px] w-[18px]' : 'h-5 w-5')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Search, modes, files, and recent uploads</p></TooltipContent>
            </Tooltip>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.98 }}
                  className={cn(
                    'plus-menu z-[140] overflow-y-auto rounded-[1.35rem] border border-white/20 bg-[linear-gradient(165deg,rgba(255,255,255,0.98),rgba(241,245,249,0.9))] p-2 shadow-[0_28px_80px_rgba(15,23,42,0.16)] backdrop-blur-2xl',
                    usesFloatingCommandDeck
                      ? isCompactWidget
                        ? 'fixed inset-x-3 bottom-[max(5.5rem,calc(env(safe-area-inset-bottom)+5rem))] max-h-[min(56vh,22rem)]'
                        : 'fixed inset-x-4 bottom-[max(5.75rem,calc(env(safe-area-inset-bottom)+5.25rem))] max-h-[min(58vh,23rem)]'
                      : isWidgetVariant
                        ? 'absolute bottom-[calc(100%+0.85rem)] left-0 max-h-[min(58vh,21rem)] w-[248px] max-w-[min(calc(100vw-3rem),248px)]'
                        : 'absolute bottom-[calc(100%+0.85rem)] left-0 max-h-[min(70vh,28rem)] w-[280px]'
                  )}
                  ref={plusMenuRef}
                >
                  <div className="mb-2 px-2 pt-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                      {isWidgetVariant ? 'Command deck' : 'Action launcher'}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {menuActions.map((action) => {
                      const Icon = action.icon;
                      return (
                        <button
                          key={action.id}
                          type="button"
                          data-testid={`plus-action-${action.id}`}
                          onClick={action.onSelect}
                          className={cn(
                            'copilot-hover-reveal-group copilot-future-hover flex w-full items-start text-left transition-all hover:-translate-y-0.5 hover:bg-white/78 hover:shadow-[0_12px_22px_rgba(14,165,233,0.08)]',
                            isCompactWidget
                              ? 'gap-2 rounded-xl border border-transparent px-2 py-2'
                              : isWidgetVariant
                                ? 'gap-2.5 rounded-xl border border-transparent px-2.5 py-2.5'
                                : 'gap-3 rounded-2xl border border-transparent px-3 py-3'
                          )}
                        >
                          <span
                            className={cn(
                              'mt-0.5 inline-flex items-center justify-center bg-[linear-gradient(145deg,rgba(240,249,255,0.94),rgba(224,242,254,0.76))] text-cyan-700 shadow-[0_10px_22px_rgba(14,165,233,0.12)]',
                              isCompactWidget
                                ? 'h-7 w-7 rounded-lg'
                                : isWidgetVariant
                                  ? 'h-8 w-8 rounded-lg'
                                  : 'h-9 w-9 rounded-xl'
                            )}
                          >
                            <Icon className={cn(isCompactWidget ? 'h-3 w-3' : isWidgetVariant ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
                          </span>
                          <span className="min-w-0">
                            <span className={cn('block font-medium text-slate-900', isCompactWidget ? 'text-xs' : isWidgetVariant ? 'text-[13px]' : 'text-sm')}>
                              {action.label}
                            </span>
                            <span
                              className={cn(
                                'copilot-hover-reveal-copy block text-slate-500',
                                isCompactWidget
                                  ? 'truncate text-[10px] leading-4'
                                  : isWidgetVariant
                                    ? 'truncate text-[11px] leading-4'
                                    : 'text-xs leading-5'
                              )}
                              title={action.description}
                            >
                              {action.description}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Textarea
            ref={textareaRef}
            placeholder={inputPlaceholder}
            className={cn(
              'chat-textarea !min-h-[52px] max-h-40 flex-1 resize-none border-0 bg-transparent px-2 py-3 text-[15px] leading-6 shadow-none focus-visible:ring-0',
              isCompactWidget && '!min-h-[48px] px-1.5 py-2.5 text-[14px] leading-5',
              isResearchSignalActive && 'chat-textarea-web'
            )}
            value={input}
            rows={1}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessageWrapper(e as any);
              }
            }}
            disabled={isLoading}
          />

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceClick}
                disabled={isVoiceProcessing}
                className={cn(
                  'mic-button copilot-control-utility shrink-0 rounded-full text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                  isCompactWidget ? 'h-9 w-9' : 'h-10 w-10'
                )}
              >
                <Mic className={cn(isCompactWidget ? 'h-4.5 w-4.5' : 'h-5 w-5')} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isVoiceProcessing ? 'Voice active' : 'Voice input'}</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                data-testid="composer-send-button"
                className={cn(
                  'send-button copilot-control-commit shrink-0 rounded-full',
                  isCompactWidget ? 'h-9 w-9' : 'h-10 w-10'
                )}
                disabled={isLoading || (!input.trim() && selectedFiles.length === 0)}
                onClick={handleSendMessageWrapper}
              >
                {isLoading ? (
                  <Send className={cn(isCompactWidget ? 'h-4.5 w-4.5 animate-pulse' : 'h-5 w-5 animate-pulse')} />
                ) : (
                  <Send className={cn(isCompactWidget ? 'h-4.5 w-4.5' : 'h-5 w-5')} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Enter to send | Shift+Enter for a new line</p></TooltipContent>
          </Tooltip>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept={uploadAccept}
            capture={captureMode as any}
          />
        </div>

        <Sheet open={isRecentFilesSheetOpen} onOpenChange={setRecentFilesSheetOpen}>
          <SheetContent
            side={isWidgetVariant ? 'bottom' : 'right'}
            className={cn(
              'z-[90] border-slate-200 bg-white',
              isWidgetVariant ? 'max-h-[70vh] rounded-t-3xl px-4 py-4' : 'w-[360px] max-w-[90vw] px-4 py-4'
            )}
          >
            <SheetHeader className="copilot-hover-reveal-group space-y-1 pb-2">
              <SheetTitle className="text-base font-semibold text-slate-900">Recent files</SheetTitle>
              <SheetDescription className="copilot-hover-reveal-copy text-xs leading-5 text-slate-600">
                Reuse files from this study session without leaving your current workspace.
              </SheetDescription>
            </SheetHeader>

            {effectiveRecentFiles.length === 0 ? (
              <div className="copilot-hover-reveal-group copilot-future-hover mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-sm font-medium text-slate-900">No recent files yet</p>
                <p className="copilot-hover-reveal-copy text-xs text-slate-600">Upload your first file to reuse it quickly in this session.</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-3 h-8 rounded-full px-3 text-xs"
                  onClick={() => openFilePicker(DEFAULT_ACCEPT)}
                >
                  Add photos & files
                </Button>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {effectiveRecentFiles.slice(0, 20).map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-900">{file.name}</p>
                      <p className="text-[11px] text-slate-500">
                        {Math.max(1, file.sizeKb)} KB
                        {file.addedAt ? ` | ${file.addedAt}` : ''}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant={file.isAttached ? 'secondary' : 'outline'}
                      size="sm"
                      className="h-7 rounded-full px-3 text-[11px]"
                      onClick={() => {
                        onAttachRecentFile?.(file.id);
                      }}
                      disabled={Boolean(file.isAttached)}
                    >
                      {file.isAttached ? 'Attached' : 'Attach'}
                    </Button>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="ghost"
                  className="h-8 w-full justify-start rounded-xl px-2.5 text-xs text-slate-700 hover:bg-slate-100"
                  onClick={() => openFilePicker(DEFAULT_ACCEPT)}
                >
                  <Paperclip className="mr-2 h-3.5 w-3.5" />
                  Add another file
                </Button>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </TooltipProvider>
  );
};


