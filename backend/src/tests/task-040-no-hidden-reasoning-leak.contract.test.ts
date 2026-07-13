import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no hidden reasoning leak', () => {
  it('forbids hiddenReasoning', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('hiddenReasoning')).toBe(true); });
  it('forbids providerPayload', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('providerPayload')).toBe(true); });
});
