'use client';

import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Check, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InterestSelectorProps {
  predefinedInterests: string[];
  selectedInterests: string[];
  onSelectInterests: (interests: string[]) => void;
  displayMode?: 'default' | 'explicit-remove';
}

function InterestChip({
  interest,
  selected,
  onClick,
  onRemove,
  removable = false,
}: {
  interest: string;
  selected: boolean;
  onClick?: () => void;
  onRemove?: () => void;
  removable?: boolean;
}) {
  const isRemoveButton = removable && selected;
  return (
    <button
      type="button"
      onClick={isRemoveButton ? onRemove : onClick}
      aria-pressed={selected}
      className={cn(
        'copilot-interest-chip',
        selected ? 'copilot-interest-chip-selected' : 'copilot-interest-chip-available',
        isRemoveButton ? 'copilot-interest-chip-removable' : ''
      )}
    >
      {selected ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Plus className="h-3.5 w-3.5 opacity-70" />
      )}
      <span>{interest}</span>
      {isRemoveButton ? <X className="h-3.5 w-3.5" /> : null}
    </button>
  );
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  predefinedInterests,
  selectedInterests,
  onSelectInterests,
  displayMode = 'default',
}) => {
  const { toast } = useToast();

  const toggleInterest = (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    if (isSelected) {
      onSelectInterests(selectedInterests.filter((item) => item !== interest));
      return;
    }

    if (selectedInterests.length >= 5) {
      toast({
        title: 'You can pick up to 5 interests',
        description: 'Remove one interest before adding another.',
        variant: 'destructive',
      });
      return;
    }

    onSelectInterests([...selectedInterests, interest]);
  };

  const availableInterests = predefinedInterests.filter((interest) => !selectedInterests.includes(interest));

  if (displayMode === 'explicit-remove') {
    return (
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="copilot-interest-panel space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Chosen interests</p>
            <span className="copilot-interest-count">
              {selectedInterests.length}/5
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedInterests.length > 0 ? (
              selectedInterests.map((interest) => (
                <InterestChip
                  key={interest}
                  interest={interest}
                  selected
                  removable
                  onRemove={() => onSelectInterests(selectedInterests.filter((item) => item !== interest))}
                />
              ))
            ) : (
              <p className="text-sm text-[var(--copilot-text-secondary)]">
                Choose 3 to 5 interests so examples feel familiar and easier to remember.
              </p>
            )}
          </div>
        </section>

        <section className="copilot-interest-panel space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">Explore interests</p>
            <span className="text-xs text-[var(--copilot-text-tertiary)]">{availableInterests.length} available</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableInterests.map((interest) => (
              <InterestChip key={interest} interest={interest} selected={false} onClick={() => toggleInterest(interest)} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {predefinedInterests.map((interest) => (
        <InterestChip
          key={interest}
          interest={interest}
          selected={selectedInterests.includes(interest)}
          onClick={() => toggleInterest(interest)}
        />
      ))}
    </div>
  );
};
