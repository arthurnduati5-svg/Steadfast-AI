import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoSafeguardingRawLeak', () => {
  it('rawSafeguardingNote is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawSafeguardingNote');
  });

  it('rawSafeguardingCase is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('rawSafeguardingCase');
  });

  it('safeguardingRaw is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('safeguardingRaw');
  });

  it('rejectTask026ForbiddenFields blocks rawSafeguardingNote', () => {
    expect(rejectTask026ForbiddenFields({ rawSafeguardingNote: 'confidential' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks rawSafeguardingCase', () => {
    expect(rejectTask026ForbiddenFields({ rawSafeguardingCase: 'case-file' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks safeguardingRaw', () => {
    expect(rejectTask026ForbiddenFields({ safeguardingRaw: 'raw-data' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks nested rawSafeguardingNote', () => {
    expect(rejectTask026ForbiddenFields({ details: { rawSafeguardingNote: 'leaked' } })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks nested safeguardingRaw in array', () => {
    expect(rejectTask026ForbiddenFields({ items: [{ safeguardingRaw: 'leaked' }] })).not.toBeNull();
  });

  it('total safeguarding-related forbidden fields count is at least 3', () => {
    const safeguardingFields = TASK026_FORBIDDEN_FIELDS.filter(f => f.toLowerCase().includes('safeguard'));
    expect(safeguardingFields.length).toBeGreaterThanOrEqual(3);
  });
});
