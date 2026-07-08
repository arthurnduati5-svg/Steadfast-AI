import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoHiddenReasoningLeak', () => {
  it('chainOfThought is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('chainOfThought');
  });

  it('hiddenReasoning is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
  });

  it('scratchpad is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('scratchpad');
  });

  it('rejectTask028ForbiddenFields catches chainOfThought', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ chainOfThought: 'step by step reasoning' }, errors);
    expect(errors).toContain('forbidden_field_chainOfThought');
  });

  it('rejectTask028ForbiddenFields catches hiddenReasoning', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ hiddenReasoning: 'internal reasoning' }, errors);
    expect(errors).toContain('forbidden_field_hiddenReasoning');
  });

  it('rejectTask028ForbiddenFields catches scratchpad', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ scratchpad: 'scratchpad content' }, errors);
    expect(errors).toContain('forbidden_field_scratchpad');
  });
});
