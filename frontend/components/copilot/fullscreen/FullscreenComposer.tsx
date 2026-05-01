'use client';

import React, { useRef } from 'react';
import { Search, Sparkles, Square, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  ChatInputBar,
  type ComposerSelectedContextPreview,
  type RecentSessionFilePreview,
} from '@/components/chat-input-bar';
import { useCopilotSurfaceProfile } from '@/lib/use-copilot-surface-profile';
import type {
  CopilotSurfaceKind,
  CopilotSurfaceProfile,
  FullscreenModeFlags,
  FullscreenPlusAction,
} from '@/lib/types';

interface FullscreenComposerProps {
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  isLoading: boolean;
  isStreaming: boolean;
  onSend: (e: React.FormEvent | null) => void;
  onStopGenerating: () => void;
  selectedFiles: File[];
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: (index?: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  forceWebSearch: boolean;
  setForceWebSearch: (val: boolean) => void;
  includeVideos: boolean;
  setIncludeVideos: (value: boolean) => void;
  level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
  setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
  languageHint: 'English' | 'Swahili mix';
  setLanguageHint: (value: 'English' | 'Swahili mix') => void;
  onVoiceToggle?: () => void;
  isVoiceProcessing?: boolean;
  onPlusAction?: (action: FullscreenPlusAction) => void;
  onPlusMenuOpenChange?: (isOpen: boolean) => void;
  onSearchWorkspace?: () => void;
  modeFlags?: Partial<FullscreenModeFlags>;
  onClearFocusMode?: () => void;
  onClearExamMode?: () => void;
  onClearResearchMode?: () => void;
  surfaceKind?: CopilotSurfaceKind;
  surfaceProfile?: CopilotSurfaceProfile;
  devLatencyDiagnostics?: {
    turnId: string;
    source: 'chat' | 'tutor_action' | 'voice';
    firstTokenMs: number | null;
    fullResponseMs: number | null;
    tutorActionTurnaroundMs: number | null;
    updatedAtIso: string;
  } | null;
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

export function FullscreenComposer({
  input,
  setInput,
  isLoading,
  isStreaming,
  onSend,
  onStopGenerating,
  selectedFiles,
  handleFileChange,
  handleRemoveFile,
  fileInputRef,
  forceWebSearch,
  setForceWebSearch,
  includeVideos,
  setIncludeVideos,
  level,
  setLevel,
  languageHint,
  setLanguageHint,
  onVoiceToggle,
  isVoiceProcessing,
  onPlusAction,
  onPlusMenuOpenChange,
  onSearchWorkspace,
  modeFlags,
  onClearFocusMode,
  onClearExamMode,
  onClearResearchMode,
  surfaceKind = 'fullscreen',
  surfaceProfile,
  devLatencyDiagnostics,
  recentFiles = [],
  recentFilesModalOpen,
  onRecentFilesModalOpenChange,
  onAttachRecentFile,
  researchStatus,
  selectedContext,
  onClearSelectedContext,
  inputPlaceholderOverride,
  focusSignal,
}: FullscreenComposerProps) {
  const composerRef = useRef<HTMLDivElement | null>(null);
  const resolvedSurfaceProfile = useCopilotSurfaceProfile(
    composerRef,
    surfaceProfile || (surfaceKind === 'fullscreen' ? 'expanded' : 'comfortable')
  );
  const isFocusModeActive = modeFlags?.focus === true;
  const isExamModeActive = modeFlags?.exam === true;
  const isResearchModeActive = modeFlags?.research === true || forceWebSearch;
  const shouldShowModeRow =
    selectedFiles.length > 0 || isFocusModeActive || isExamModeActive || isResearchModeActive;
  const isWidgetSurface = surfaceKind === 'widget';
  const isCompactWidget = isWidgetSurface && resolvedSurfaceProfile === 'compact';

  return (
    <div
      ref={composerRef}
      className={
        isWidgetSurface
          ? 'w-full px-3 py-3 sm:px-4 sm:py-4'
          : 'mx-auto w-full max-w-4xl px-4 py-4 md:px-6'
      }
      data-copilot-surface-kind={surfaceKind}
      data-copilot-surface-profile={resolvedSurfaceProfile}
    >
      <div className="copilot-composer-shell">
        {shouldShowModeRow ? (
          <div
            className={
              isCompactWidget
                ? 'copilot-composer-mode-row -mx-1 flex gap-2 overflow-x-auto px-1 pb-1'
                : 'copilot-composer-mode-row'
            }
          >
            {selectedFiles.length > 0 ? (
              <span className="copilot-composer-mode-pill">
                {selectedFiles.length} material{selectedFiles.length === 1 ? '' : 's'} ready
              </span>
            ) : null}
            {isFocusModeActive ? (
              <span className="copilot-composer-mode-pill copilot-mode-chip" data-testid="mode-chip-focus">
                <Sparkles className="h-3.5 w-3.5 text-cyan-600" />
                <span>Focus mode</span>
                {onClearFocusMode ? (
                  <button
                    type="button"
                    className="copilot-mode-chip-close"
                    data-testid="mode-chip-focus-clear"
                    aria-label="Clear focus mode"
                    onClick={onClearFocusMode}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            ) : null}
            {isExamModeActive ? (
              <span className="copilot-composer-mode-pill copilot-mode-chip" data-testid="mode-chip-exam">
                <Target className="h-3.5 w-3.5 text-sky-700" />
                <span>Exam mode</span>
                {onClearExamMode ? (
                  <button
                    type="button"
                    className="copilot-mode-chip-close"
                    data-testid="mode-chip-exam-clear"
                    aria-label="Clear exam mode"
                    onClick={onClearExamMode}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            ) : null}
            {isResearchModeActive ? (
              <span className="copilot-composer-mode-pill copilot-mode-chip" data-testid="mode-chip-research">
                <Search className="h-3.5 w-3.5 text-emerald-600" />
                <span>Web research</span>
                {onClearResearchMode ? (
                  <button
                    type="button"
                    className="copilot-mode-chip-close"
                    data-testid="mode-chip-research-clear"
                    aria-label="Clear web research mode"
                    onClick={onClearResearchMode}
                  >
                    <X className="h-3 w-3" />
                  </button>
                ) : null}
              </span>
            ) : null}
          </div>
        ) : null}

      {isStreaming && (
        <div className="mb-3 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={onStopGenerating}
            className="copilot-control-nav h-9 rounded-full px-4 text-sm"
          >
            <Square className="mr-2 h-3.5 w-3.5 fill-current" />
            Stop generating
          </Button>
        </div>
      )}

      {process.env.NODE_ENV !== 'production' && devLatencyDiagnostics ? (
        <details className="mb-3 rounded-xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]/75 px-3 py-2 text-xs text-[var(--copilot-text-secondary)]">
          <summary className="cursor-pointer select-none font-medium text-[var(--copilot-text-primary)]">
            Dev diagnostics
          </summary>
          <div className="mt-2 grid gap-1 sm:grid-cols-2">
            <p>
              First token: <span className="font-semibold text-[var(--copilot-text-primary)]">{devLatencyDiagnostics.firstTokenMs ?? '-'}ms</span>
            </p>
            <p>
              Full response: <span className="font-semibold text-[var(--copilot-text-primary)]">{devLatencyDiagnostics.fullResponseMs ?? '-'}ms</span>
            </p>
            <p>
              Tutor action turnaround:{' '}
              <span className="font-semibold text-[var(--copilot-text-primary)]">
                {devLatencyDiagnostics.tutorActionTurnaroundMs ?? '-'}ms
              </span>
            </p>
            <p className="truncate">
              Turn: <span className="font-mono text-[10px] text-[var(--copilot-text-tertiary)]">{devLatencyDiagnostics.turnId}</span>
            </p>
          </div>
        </details>
      ) : null}

        <ChatInputBar
          surfaceKind={surfaceKind}
          surfaceProfile={resolvedSurfaceProfile}
          variant={surfaceKind === 'fullscreen' ? 'fullscreen' : 'widget'}
          input={input}
          setInput={setInput}
          handleSendMessage={onSend}
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
          isVoiceProcessing={isVoiceProcessing}
          onVoiceModeStart={onVoiceToggle}
          onPlusAction={onPlusAction}
          onPlusMenuOpenChange={onPlusMenuOpenChange}
          onSearchWorkspace={onSearchWorkspace}
          modeFlags={modeFlags}
          recentFiles={recentFiles}
          recentFilesModalOpen={recentFilesModalOpen}
          onRecentFilesModalOpenChange={onRecentFilesModalOpenChange}
          onAttachRecentFile={onAttachRecentFile}
          researchStatus={researchStatus}
          selectedContext={selectedContext}
          onClearSelectedContext={onClearSelectedContext}
          inputPlaceholderOverride={inputPlaceholderOverride}
          focusSignal={focusSignal}
        />
      </div>
    </div>
  );
}
