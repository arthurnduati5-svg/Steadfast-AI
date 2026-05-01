'use client';

import React from 'react';
import { Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RevisionWorkspaceOverlayProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function RevisionWorkspaceOverlay({
  open,
  onClose,
  children,
}: RevisionWorkspaceOverlayProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 md:p-5">
      <div
        className="absolute inset-0 bg-slate-950/58 backdrop-blur-[3px]"
        onClick={onClose}
      />
      <div className="copilot-surface copilot-revision-workspace-shell relative z-10 flex h-[calc(100dvh-1.5rem)] w-full max-w-[1280px] flex-col overflow-hidden rounded-[1.3rem] border shadow-2xl md:h-[82dvh] md:max-h-[820px]">
        <div className="copilot-revision-workspace-header flex items-center justify-between border-b px-4 py-2 md:px-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
              Revision workspace
            </p>
            <p className="text-xs text-[var(--copilot-text-secondary)]">
              Open saved notes, review one item at a time, and revise actively with Steadfast.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="copilot-icon-button h-9 w-9 rounded-full"
            onClick={onClose}
            title="Close revision workspace"
          >
            <Minimize2 className="h-4.5 w-4.5" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </div>
  );
}
