import React from 'react';
import { ArrowRight } from 'lucide-react';
import type { MetacognitivePrompt, WeakTopicRecoveryState } from '@/lib/types';
import {
  MetacognitivePromptCard,
  type MetacognitiveChoicePayload,
} from './MetacognitivePromptCard';
import { WeakTopicRecoveryCard } from './WeakTopicRecoveryCard';

interface AssistantSupportSurfaceProps {
  reflectionPrompt: MetacognitivePrompt | null;
  weakTopicRecovery: WeakTopicRecoveryState | null;
  followupQuestion: string | null;
  nextStepText: string | null;
  busy?: boolean;
  showNextMoveLabel?: boolean;
  onMetacognitiveChoice?: (payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: () => void;
}

export function AssistantSupportSurface({
  reflectionPrompt,
  weakTopicRecovery,
  followupQuestion,
  nextStepText,
  busy = false,
  showNextMoveLabel = false,
  onMetacognitiveChoice,
  onOpenPracticePad,
}: AssistantSupportSurfaceProps) {
  const hasRecovery = Boolean(weakTopicRecovery?.active);
  const hasFullReflection = Boolean(reflectionPrompt);

  if (hasFullReflection) {
    return (
      <MetacognitivePromptCard
        prompt={reflectionPrompt}
        compact
        busy={busy}
        onChoose={onMetacognitiveChoice}
        onOpenPracticePad={onOpenPracticePad}
      />
    );
  }

  if (hasRecovery) {
    return <WeakTopicRecoveryCard state={weakTopicRecovery} compact />;
  }

  if (followupQuestion) {
    return (
      <div className="copilot-followup-card rounded-2xl px-4 py-3">
        <p className="copilot-followup-kicker text-[11px] font-semibold uppercase tracking-[0.18em]">
          Try this next
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--copilot-text-primary)]">{followupQuestion}</p>
      </div>
    );
  }

  if (!nextStepText) return null;

  return (
    <div className="copilot-next-step">
      <ArrowRight className="copilot-next-step-icon mt-0.5 h-4 w-4 flex-shrink-0" />
      {showNextMoveLabel ? (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-workspace-strong)]">
            Next move
          </p>
          <p className="mt-1">{nextStepText}</p>
        </div>
      ) : (
        <p>{nextStepText}</p>
      )}
    </div>
  );
}

