'use client';

import React from 'react';
import { RotateCcw, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { WeakTopicRecoveryStage, WeakTopicRecoveryState } from '@/lib/types';
import { cn } from '@/lib/utils';

const STAGE_LABELS: Record<WeakTopicRecoveryStage, string> = {
  revisit_prerequisite: 'Foundation first',
  simpler_example: 'Simpler example',
  small_recall: 'Small recall check',
  similar_problem: 'Similar problem',
  check_again: 'Check again',
  completed: 'Recovery complete',
};

export interface WeakTopicRecoveryCardProps {
  state?: WeakTopicRecoveryState | null;
  compact?: boolean;
  className?: string;
}

export function WeakTopicRecoveryCard({
  state,
  compact = false,
  className,
}: WeakTopicRecoveryCardProps) {
  if (!state?.active) return null;

  const stageLabel = state.stage ? STAGE_LABELS[state.stage] : 'Recovery path';
  const detailLine =
    state.prerequisiteFocus ||
    state.recallQuestion ||
    state.simplerExample ||
    state.similarProblemPrompt ||
    state.checkAgainPrompt ||
    state.summary ||
    null;
  const nextMove =
    state.checkAgainPrompt ||
    state.similarProblemPrompt ||
    state.recallQuestion ||
    state.prerequisiteFocus ||
    null;

  return (
    <div
      className={cn(
        'copilot-recovery-card rounded-2xl shadow-sm',
        compact ? 'space-y-3 p-3' : 'space-y-3.5 p-4',
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-2xl bg-[var(--copilot-surface-1)] text-[var(--copilot-accent-text)] shadow-sm">
          <RotateCcw className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="copilot-guidance-kicker">
            Weak topic recovery
          </p>
          <p className="text-sm font-semibold text-slate-900">
            {state.title || "Let's rebuild this step by step."}
          </p>
        </div>
        <span className="copilot-revision-pill">
          {stageLabel}
        </span>
      </div>

      {state.summary ? (
        <p className="text-sm leading-6 text-slate-700">{state.summary}</p>
      ) : null}

      {detailLine ? (
        <div className="copilot-recovery-step rounded-2xl px-3 py-2.5">
          <div className="flex items-start gap-2">
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--copilot-accent-text)]" />
            <p className="text-sm leading-6 text-slate-700">{detailLine}</p>
          </div>
        </div>
      ) : null}

      {nextMove && nextMove !== detailLine ? (
        <div className="copilot-revision-next-move px-3.5 py-3">
          <div className="flex items-start gap-2 text-sm text-slate-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div>
              <p className="copilot-guidance-kicker">Next move</p>
              <p className="mt-1 leading-6">{nextMove}</p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
