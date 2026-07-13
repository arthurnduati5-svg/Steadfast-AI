import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no private deen leak', () => {
  it('forbids privateDeenText', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('privateDeenText')).toBe(true); });
});
