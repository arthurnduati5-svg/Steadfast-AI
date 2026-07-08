import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('task028NoSafeguardingRawLeak', () => {
  it('rawSafeguardingNote is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
  });

  it('rawSafeguardingCase is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('rawSafeguardingCase');
  });

  it('safeguardingRaw is a forbidden field', () => {
    expect(TASK028_FORBIDDEN_FIELDS).toContain('safeguardingRaw');
  });

  it('rejectTask028ForbiddenFields catches rawSafeguardingNote', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawSafeguardingNote: 'sensitive case details' }, errors);
    expect(errors).toContain('forbidden_field_rawSafeguardingNote');
  });

  it('rejectTask028ForbiddenFields catches safeguardingRaw', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ safeguardingRaw: 'raw data' }, errors);
    expect(errors).toContain('forbidden_field_safeguardingRaw');
  });

  it('no safeguarding evidence event type leaks raw data', () => {
    const { TASK028_EVIDENCE_EVENT_TYPES } = require('../contracts/task028ControlledExpansionExecutionContracts');
    const rawEvents = TASK028_EVIDENCE_EVENT_TYPES.filter(e => e.toLowerCase().includes('raw'));
    expect(rawEvents).toHaveLength(0);
  });
});
