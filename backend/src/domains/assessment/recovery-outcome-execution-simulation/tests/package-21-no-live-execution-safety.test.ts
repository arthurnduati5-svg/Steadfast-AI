import { describe, it, expect } from 'vitest';
import { RecoveryOutcomeExecutionSimulationSafetyService } from '../services/recoveryOutcomeExecutionSimulationSafetyService';

describe('Package 21 - No Live Execution Safety', () => {
  const safety = new RecoveryOutcomeExecutionSimulationSafetyService();

  it('blocks live recovery execution policy for all roles', () => {
    const isValid = safety.validateNoLiveExecution('RECOVERY_OUTCOME_EXECUTION_NO_LIVE_EXECUTION');
    expect(isValid).toBe(false);
  });

  it('blocks live recovery activation for all roles', () => {
    const isValid = safety.validateNoLiveActivation();
    expect(isValid).toBe(false);
  });

  it('blocks live recovery completion for all roles', () => {
    const isValid = safety.validateNoLiveCompletion();
    expect(isValid).toBe(false);
  });

  it('blocks live recovery closure for all roles', () => {
    const isValid = safety.validateNoLiveClosure();
    expect(isValid).toBe(false);
  });

  it('blocks live assignment for all roles', () => {
    const isValid = safety.validateNoLiveAssignment();
    expect(isValid).toBe(false);
  });

  it('blocks live notification for all roles', () => {
    const isValid = safety.validateNoLiveNotification();
    expect(isValid).toBe(false);
  });

  it('blocks portal publishing for all roles', () => {
    const isValid = safety.validateNoPortalPublish();
    expect(isValid).toBe(false);
  });

  it('blocks score mutation for all roles', () => {
    const isValid = safety.validateNoScoreMutation();
    expect(isValid).toBe(false);
  });

  it('blocks mastery mutation for all roles', () => {
    const isValid = safety.validateNoMasteryMutation();
    expect(isValid).toBe(false);
  });

  it('blocks regrade execution for all roles', () => {
    const isValid = safety.validateNoRegradeExecution();
    expect(isValid).toBe(false);
  });

  it('blocks generated question for all roles', () => {
    const isValid = safety.validateNoGeneratedQuestion();
    expect(isValid).toBe(false);
  });

  it('blocks AI narrative for all roles', () => {
    const isValid = safety.validateNoAINarrative();
    expect(isValid).toBe(false);
  });

  it('blocks OCR for all roles', () => {
    const isValid = safety.validateNoOCR();
    expect(isValid).toBe(false);
  });

  it('blocks PDF for all roles', () => {
    const isValid = safety.validateNoPDF();
    expect(isValid).toBe(false);
  });

  it('blocks external sync for all roles', () => {
    const isValid = safety.validateNoExternalSync();
    expect(isValid).toBe(false);
  });

  it('forbidden fields are detected by safety service', () => {
    const blockedCodes = safety.validateContent('safe summary', {
      liveRecoveryActivationPayload: {},
      scoreMutationPayload: {},
      aiNarrative: 'test narration',
      generatedQuestionText: 'test question',
    });
    expect(blockedCodes.length).toBe(4);
    expect(blockedCodes).toContain('FORBIDDEN_FIELD:liveRecoveryActivationPayload');
    expect(blockedCodes).toContain('FORBIDDEN_FIELD:scoreMutationPayload');
    expect(blockedCodes).toContain('FORBIDDEN_FIELD:aiNarrative');
    expect(blockedCodes).toContain('FORBIDDEN_FIELD:generatedQuestionText');
  });

  it('empty safe summary is blocked', () => {
    const blockedCodes = safety.validateContent('', {});
    expect(blockedCodes).toContain('EMPTY_SAFE_SUMMARY');
  });

  it('valid content passes validation', () => {
    const blockedCodes = safety.validateContent('Valid summary', { someKey: 'some value' });
    expect(blockedCodes.length).toBe(0);
  });
});
