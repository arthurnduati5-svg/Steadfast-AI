'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import type { SelectionSourceKind } from '@/lib/types';

export type SelectionAction = 'ask' | 'breakdown' | 'summarize' | 'save' | 'copy';

export interface SelectionRangeMetadata {
  startOffset?: number;
  endOffset?: number;
  length?: number;
}

export interface SelectionActionPayload {
  text: string;
  messageId?: string;
  sourceKind?: SelectionSourceKind;
  artifactLabel?: string;
  videoTitle?: string;
  sourceType?: string;
  sourceDocumentId?: string;
  selectionRange?: SelectionRangeMetadata;
}

interface SelectionActionMenuProps {
  scopeRef: React.RefObject<HTMLElement>;
  onAction: (action: SelectionAction, payload: SelectionActionPayload) => void;
}

interface SelectionState {
  text: string;
  left: number;
  top: number;
  visible: boolean;
  placement: 'above' | 'below';
  messageId?: string;
  sourceKind?: SelectionSourceKind;
  artifactLabel?: string;
  videoTitle?: string;
  sourceType?: string;
  sourceDocumentId?: string;
  selectionRange?: SelectionRangeMetadata;
}

const INITIAL_SELECTION_STATE: SelectionState = {
  text: '',
  left: 0,
  top: 0,
  visible: false,
  placement: 'above',
};

function deriveSelectionRange(range: Range, sourceElement: HTMLElement, selectedText: string): SelectionRangeMetadata | undefined {
  try {
    const prefixRange = range.cloneRange();
    prefixRange.selectNodeContents(sourceElement);
    prefixRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = prefixRange.toString().length;
    const length = selectedText.length;
    if (!Number.isFinite(startOffset) || startOffset < 0 || length <= 0) return undefined;
    return {
      startOffset,
      endOffset: startOffset + length,
      length,
    };
  } catch {
    return undefined;
  }
}

function getSelectionState(scope: HTMLElement | null): SelectionState {
  if (!scope || typeof window === 'undefined') return INITIAL_SELECTION_STATE;

  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return INITIAL_SELECTION_STATE;

  const selectedText = selection.toString().replace(/\s+/g, ' ').trim();
  if (!selectedText) return INITIAL_SELECTION_STATE;

  const range = selection.getRangeAt(0);
  const commonAncestor = range.commonAncestorContainer;
  const anchorNode = commonAncestor.nodeType === Node.TEXT_NODE ? commonAncestor.parentElement : (commonAncestor as Element | null);
  if (!anchorNode || !scope.contains(anchorNode)) return INITIAL_SELECTION_STATE;
  const sourceElement = anchorNode.closest?.('[data-selection-source-kind]') as HTMLElement | null;
  if (!sourceElement) return INITIAL_SELECTION_STATE;
  const selectionRange = deriveSelectionRange(range, sourceElement, selectedText);

  const rect = range.getBoundingClientRect();
  if (!rect.width && !rect.height) return INITIAL_SELECTION_STATE;

  const scopeRect = scope.getBoundingClientRect();
  const padding = 16;
  const estimatedMenuWidth = Math.min(
    340,
    window.innerWidth - padding * 2,
    Math.max(220, scopeRect.width - padding * 2)
  );
  const left = Math.min(
    Math.max(
      rect.left + rect.width / 2,
      Math.max(scopeRect.left + padding + estimatedMenuWidth / 2, padding + estimatedMenuWidth / 2)
    ),
    Math.min(scopeRect.right - padding - estimatedMenuWidth / 2, window.innerWidth - padding - estimatedMenuWidth / 2)
  );

  const aboveSpace = rect.top - scopeRect.top;
  const belowSpace = scopeRect.bottom - rect.bottom;
  const placement = aboveSpace > 68 || aboveSpace >= belowSpace ? 'above' : 'below';
  const top = placement === 'above' ? rect.top - 14 : rect.bottom + 14;

  return {
    text: selectedText,
    left,
    top,
    visible: true,
    placement,
    messageId: sourceElement?.getAttribute('data-selection-message-id') || undefined,
    sourceKind: (sourceElement?.getAttribute('data-selection-source-kind') as SelectionSourceKind | null) || undefined,
    artifactLabel: sourceElement?.getAttribute('data-selection-artifact-label') || undefined,
    videoTitle: sourceElement?.getAttribute('data-selection-video-title') || undefined,
    sourceType: sourceElement?.getAttribute('data-selection-source-type') || undefined,
    sourceDocumentId: sourceElement?.getAttribute('data-selection-document-id') || undefined,
    selectionRange,
  };
}

export function SelectionActionMenu({ scopeRef, onAction }: SelectionActionMenuProps) {
  const [selectionState, setSelectionState] = useState<SelectionState>(INITIAL_SELECTION_STATE);

  useEffect(() => {
    const updateSelection = () => {
      setSelectionState(getSelectionState(scopeRef.current));
    };

    document.addEventListener('selectionchange', updateSelection);
    window.addEventListener('resize', updateSelection);
    window.addEventListener('scroll', updateSelection, true);

    return () => {
      document.removeEventListener('selectionchange', updateSelection);
      window.removeEventListener('resize', updateSelection);
      window.removeEventListener('scroll', updateSelection, true);
    };
  }, [scopeRef]);

  const actionText = useMemo(() => selectionState.text, [selectionState.text]);
  const actionPayload = useMemo<SelectionActionPayload>(() => ({
    text: actionText,
    messageId: selectionState.messageId,
    sourceKind: selectionState.sourceKind,
    artifactLabel: selectionState.artifactLabel,
    videoTitle: selectionState.videoTitle,
    sourceType: selectionState.sourceType,
    sourceDocumentId: selectionState.sourceDocumentId,
    selectionRange: selectionState.selectionRange,
  }), [
    actionText,
    selectionState.artifactLabel,
    selectionState.messageId,
    selectionState.selectionRange,
    selectionState.sourceDocumentId,
    selectionState.sourceKind,
    selectionState.sourceType,
    selectionState.videoTitle,
  ]);

  if (!selectionState.visible) return null;

  return (
    <div
      className="copilot-selection-menu"
      style={{
        left: selectionState.left,
        top: selectionState.top,
        transform: selectionState.placement === 'above' ? 'translate(-50%, -100%)' : 'translate(-50%, 0)',
      }}
      data-placement={selectionState.placement}
    >
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onAction('ask', actionPayload)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        <span>Ask Steadfast AI</span>
      </button>
    </div>
  );
}
