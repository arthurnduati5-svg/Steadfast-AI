import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoHiddenReasoningLeak', () => {
  it('chainOfThought is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('chainOfThought');
  });

  it('hiddenReasoning is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('hiddenReasoning');
  });

  it('scratchpad is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('scratchpad');
  });

  it('rejectTask026ForbiddenFields blocks chainOfThought', () => {
    expect(rejectTask026ForbiddenFields({ chainOfThought: 'step-by-step' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks hiddenReasoning', () => {
    expect(rejectTask026ForbiddenFields({ hiddenReasoning: 'internal' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks scratchpad', () => {
    expect(rejectTask026ForbiddenFields({ scratchpad: 'notes' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks nested chainOfThought', () => {
    expect(rejectTask026ForbiddenFields({ meta: { chainOfThought: 'leaked' } })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks array nested hiddenReasoning', () => {
    expect(rejectTask026ForbiddenFields({ steps: [{ hiddenReasoning: 'internal' }] })).not.toBeNull();
  });
});
