import { describe, it, expect } from 'vitest';
import { TASK026_FORBIDDEN_FIELDS } from '../contracts/task026ControlledPilotExecutionContracts';
import { rejectTask026ForbiddenFields } from '../lib/task026ControlledPilotExecutionValidation';

describe('task026NoPrivateDeenLeak', () => {
  it('privateDeenText is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('privateDeenText');
  });

  it('deenSensitiveRaw is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('deenSensitiveRaw');
  });

  it('rejectTask026ForbiddenFields blocks privateDeenText', () => {
    expect(rejectTask026ForbiddenFields({ privateDeenText: 'sensitive-deen' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks deenSensitiveRaw', () => {
    expect(rejectTask026ForbiddenFields({ deenSensitiveRaw: 'raw-deen' })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks nested privateDeenText', () => {
    expect(rejectTask026ForbiddenFields({ meta: { privateDeenText: 'sensitive' } })).not.toBeNull();
  });

  it('rejectTask026ForbiddenFields blocks privateDeenText in array', () => {
    expect(rejectTask026ForbiddenFields({ items: [{ privateDeenText: 'sensitive' }] })).not.toBeNull();
  });

  it('teacherOnlyNote is forbidden (may contain deen context)', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('teacherOnlyNote');
  });

  it('teacherOnlyContent is forbidden', () => {
    expect(TASK026_FORBIDDEN_FIELDS).toContain('teacherOnlyContent');
  });
});
