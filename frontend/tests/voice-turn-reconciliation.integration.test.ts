import { describe, expect, it } from 'vitest';
import {
  reconcileInterruptedAssistantText,
  resolveAssistantTurnLanguage,
  resolveStudentTurnLanguage,
} from '../lib/voice-turn-reconciliation';

describe('voice turn reconciliation integration', () => {
  it('reconciles interrupted assistant speech into a stable partial transcript', () => {
    const fullTranscript =
      'Good. First isolate x. What operation appears around it before we move to the next step?';
    const interrupted = reconcileInterruptedAssistantText({
      fullTranscript,
      spokenChars: 31,
      typedAssistantTranscript: 'Good. First isolate x.',
    });

    expect(interrupted).toBe('Good. First isolate x. What opera');
    expect(interrupted.length).toBeGreaterThan(18);
    expect(interrupted.length).toBeLessThan(fullTranscript.length);
  });

  it('preserves language continuity across mixed-language student turns and assistant replies', () => {
    const firstStudent = resolveStudentTurnLanguage({
      detectedLanguage: 'english',
      previousStableLanguage: null,
    });
    expect(firstStudent.displayLanguage).toBe('english');
    expect(firstStudent.nextStableLanguage).toBe('english');

    const mixedStudent = resolveStudentTurnLanguage({
      detectedLanguage: 'mixed',
      previousStableLanguage: firstStudent.nextStableLanguage,
    });
    expect(mixedStudent.displayLanguage).toBe('english');
    expect(mixedStudent.nextStableLanguage).toBe('english');

    const assistantWhenSelectedMissing = resolveAssistantTurnLanguage({
      selectedLanguage: null,
      fallbackStudentLanguage: mixedStudent.nextStableLanguage,
    });
    expect(assistantWhenSelectedMissing).toBe('english');

    const secondStableStudent = resolveStudentTurnLanguage({
      detectedLanguage: 'arabic',
      previousStableLanguage: mixedStudent.nextStableLanguage,
    });
    expect(secondStableStudent.displayLanguage).toBe('arabic');
    expect(secondStableStudent.nextStableLanguage).toBe('arabic');

    const assistantWithExplicitSelection = resolveAssistantTurnLanguage({
      selectedLanguage: 'english',
      fallbackStudentLanguage: secondStableStudent.nextStableLanguage,
    });
    expect(assistantWithExplicitSelection).toBe('english');
  });
});

