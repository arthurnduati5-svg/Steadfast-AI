'use client';

import React from 'react';
import { ArrowRight, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type {
  MetacognitivePrompt,
} from '@/lib/types';
import type {
  ChoiceDefinition,
  MetacognitiveChoicePayload,
} from '@/lib/reflect-model';
import {
  buildMetacognitivePromptSpec,
  resolveMetacognitiveVariant,
} from '@/lib/reflect-model';
import { cn } from '@/lib/utils';
import { TopicMasteryChip } from './TopicMasteryChip';
import { WeakTopicRecoveryCard } from './WeakTopicRecoveryCard';

export type { MetacognitiveChoicePayload } from '@/lib/reflect-model';

function mergePayload(
  first: MetacognitiveChoicePayload | null,
  second: MetacognitiveChoicePayload
): MetacognitiveChoicePayload {
  return {
    eventType: second.eventType || first?.eventType || 'confidence_check',
    confidence: second.confidence ?? first?.confidence ?? null,
    problemFraming: second.problemFraming ?? first?.problemFraming ?? null,
    errorType: second.errorType ?? first?.errorType ?? null,
    strategyPreference: second.strategyPreference ?? first?.strategyPreference ?? null,
    transferReadiness: second.transferReadiness ?? first?.transferReadiness ?? null,
    confidenceSelfCheck: second.confidenceSelfCheck ?? first?.confidenceSelfCheck ?? null,
    supportPreference: second.supportPreference ?? first?.supportPreference ?? null,
    progressCheck: second.progressCheck ?? first?.progressCheck ?? null,
    note: second.note ?? first?.note ?? null,
    snapshotPatch: {
      ...(first?.snapshotPatch || {}),
      ...(second.snapshotPatch || {}),
    },
  };
}

function OptionRow({
  choices,
  onSelect,
  busy,
  compact,
  selectedLabel,
}: {
  choices: ChoiceDefinition[];
  onSelect: (choice: ChoiceDefinition) => void;
  busy: boolean;
  compact: boolean;
  selectedLabel?: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {choices.map((choice) => {
        const selected = selectedLabel === choice.label;
        return (
          <Button
            key={choice.label}
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            className={cn(
              'copilot-reflect-option rounded-full text-slate-700 shadow-sm',
              compact ? 'h-8 px-3 text-[12px]' : 'h-9 px-3.5 text-sm',
              selected && 'copilot-selection-chip-active'
            )}
            data-selected={selected ? 'true' : 'false'}
            onClick={() => onSelect(choice)}
          >
            {choice.label}
          </Button>
        );
      })}
    </div>
  );
}

export interface MetacognitivePromptCardProps {
  prompt?: MetacognitivePrompt | null;
  onChoose?: (payload: MetacognitiveChoicePayload) => void;
  onOpenPracticePad?: () => void;
  busy?: boolean;
  compact?: boolean;
  className?: string;
}

export function MetacognitivePromptCard({
  prompt,
  onChoose,
  onOpenPracticePad,
  busy = false,
  compact = false,
  className,
}: MetacognitivePromptCardProps) {
  const [primaryChoice, setPrimaryChoice] = React.useState<ChoiceDefinition | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  React.useEffect(() => {
    setPrimaryChoice(null);
    setSubmitted(false);
  }, [prompt?.type, prompt?.variant, prompt?.text, prompt?.topic, prompt?.subject]);

  if (!prompt) return null;

  const spec = buildMetacognitivePromptSpec(prompt);
  const variant = resolveMetacognitiveVariant(prompt);
  const showPracticePadCta =
    Boolean(onOpenPracticePad) &&
    (variant === 'before_practice' || variant === 'after_correction' || variant === 'weak_topic_recovery');

  const handlePrimarySelect = (choice: ChoiceDefinition) => {
    if (spec.autoSubmitPrimary || !spec.supportChoices?.length) {
      setSubmitted(true);
      onChoose?.(choice.payload);
      return;
    }
    setPrimaryChoice(choice);
  };

  const handleSupportSelect = (choice: ChoiceDefinition) => {
    const merged = mergePayload(primaryChoice?.payload || null, choice.payload);
    setSubmitted(true);
    onChoose?.(merged);
  };

  return (
    <div
      className={cn(
        'copilot-reflect-card rounded-2xl shadow-sm',
        compact ? 'space-y-3 p-3' : 'space-y-4 p-4',
        className
      )}
    >
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="copilot-guidance-kicker">
            {spec.headline}
          </p>
          {prompt.topicMastery?.label ? (
            <TopicMasteryChip label={prompt.topicMastery.label} topic={prompt.topic || null} compact />
          ) : null}
        </div>
        <p className="text-sm font-medium leading-6 text-slate-900">{spec.mainPrompt}</p>
        {prompt.topic ? (
          <p className="text-xs leading-5 text-slate-500">Topic: {prompt.topic}</p>
        ) : null}
        <p className="copilot-guidance-note text-xs leading-5">
          This check-in helps Steadfast choose the next step.
        </p>
      </div>

      {prompt.weakTopicRecovery?.active ? (
        <WeakTopicRecoveryCard state={prompt.weakTopicRecovery} compact={compact} />
      ) : null}

      {submitted ? (
        <div className="copilot-guidance-panel rounded-2xl px-3.5 py-3 text-sm text-slate-700 shadow-sm">
          {prompt.acknowledgement || 'Thanks. I will adjust the next step quietly.'}
        </div>
      ) : (
        <div className="space-y-3">
          <OptionRow
            choices={spec.primaryChoices}
            onSelect={handlePrimarySelect}
            busy={busy}
            compact={compact}
            selectedLabel={primaryChoice?.label || null}
          />

          {primaryChoice && spec.supportChoices?.length ? (
            <div className="space-y-2">
              <p className="text-xs font-medium text-slate-600">{spec.supportPrompt}</p>
              <OptionRow
                choices={spec.supportChoices}
                onSelect={handleSupportSelect}
                busy={busy}
                compact={compact}
              />
            </div>
          ) : null}
        </div>
      )}

      {showPracticePadCta ? (
        <button
          type="button"
          onClick={onOpenPracticePad}
          disabled={busy}
          className="copilot-control-nav inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm font-medium disabled:opacity-60"
        >
          <PenLine className="h-4 w-4" />
          Open Practice Pad
          <ArrowRight className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
