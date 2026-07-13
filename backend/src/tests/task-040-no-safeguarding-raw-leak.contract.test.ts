import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no safeguarding raw leak', () => {
  it('forbids rawSafeguardingNote', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawSafeguardingNote')).toBe(true); });
});
