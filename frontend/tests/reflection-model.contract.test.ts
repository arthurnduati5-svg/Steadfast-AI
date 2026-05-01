import { describe, expect, it } from 'vitest';
import type { MetacognitivePrompt } from '@/lib/types';
import {
  buildMetacognitivePromptSpec,
  resolveMetacognitiveVariant,
} from '@/lib/reflect-model';

describe('reflection model contract', () => {
  it('maps legacy shallow prompt types into the new calm reflection flow', () => {
    const legacyPrompt: MetacognitivePrompt = {
      type: 'frame_problem',
      text: 'What is the question asking?',
    };

    const variant = resolveMetacognitiveVariant(legacyPrompt);
    const spec = buildMetacognitivePromptSpec(legacyPrompt);

    expect(variant).toBe('before_continue');
    expect(spec.mainPrompt).toBe('Before we continue, where are you right now?');
    expect(spec.primaryChoices.map((choice) => choice.label)).toEqual([
      'I understand this well',
      'I partly understand',
      'I am confused',
    ]);
    expect(spec.primaryChoices.map((choice) => choice.label)).not.toContain('It is a concept');
  });

  it('uses direct readiness choices before practice instead of a two-step survey', () => {
    const practicePrompt: MetacognitivePrompt = {
      type: 'practice_readiness',
      variant: 'before_practice',
      text: 'Are you ready to try one now?',
    };

    const spec = buildMetacognitivePromptSpec(practicePrompt);

    expect(spec.autoSubmitPrimary).toBe(true);
    expect(spec.primaryChoices.map((choice) => choice.label)).toEqual([
      'Yes, let me try',
      'Give me a small hint first',
      'Show one worked example',
    ]);
  });
});
