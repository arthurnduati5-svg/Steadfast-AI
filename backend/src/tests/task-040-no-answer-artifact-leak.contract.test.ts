import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no answer artifact leak', () => {
  it('forbids answerKey', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('answerKey')).toBe(true); });
  it('forbids markingScheme', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('markingScheme')).toBe(true); });
});
