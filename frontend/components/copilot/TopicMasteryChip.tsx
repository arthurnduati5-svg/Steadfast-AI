'use client';

import React from 'react';
import type { MicroMasteryLabel } from '@/lib/types';
import { cn } from '@/lib/utils';

const LABELS: Record<MicroMasteryLabel, string> = {
  still_learning: 'Still learning',
  getting_better: 'Getting better',
  almost_there: 'Almost there',
  confident: 'Confident',
};

const TONES: Record<MicroMasteryLabel, string> = {
  still_learning: 'border-amber-200/80 bg-amber-50 text-amber-800',
  getting_better:
    'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]',
  almost_there: 'border-violet-200/80 bg-violet-50 text-violet-800',
  confident: 'border-emerald-200/80 bg-emerald-50 text-emerald-800',
};

export function getMicroMasteryLabel(label?: MicroMasteryLabel | null): string | null {
  if (!label) return null;
  return LABELS[label] || null;
}

export interface TopicMasteryChipProps {
  label?: MicroMasteryLabel | null;
  topic?: string | null;
  compact?: boolean;
  className?: string;
}

export function TopicMasteryChip({
  label,
  topic,
  compact = false,
  className,
}: TopicMasteryChipProps) {
  if (!label) return null;

  return (
    <span
      className={cn(
        'copilot-mastery-chip inline-flex items-center gap-1.5 rounded-full border font-medium',
        compact ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs',
        TONES[label],
        className
      )}
      data-mastery={label}
      title={topic ? `${LABELS[label]} in ${topic}` : LABELS[label]}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {LABELS[label]}
    </span>
  );
}
