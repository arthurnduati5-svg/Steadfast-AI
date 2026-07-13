import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_OUTPUT_FIELDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no raw private data', () => {
  it('forbids rawLearnerData', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawLearnerData')).toBe(true); });
  it('forbids rawChat', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawChat')).toBe(true); });
  it('forbids rawAnswer', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawAnswer')).toBe(true); });
  it('forbids parentContact', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('parentContact')).toBe(true); });
  it('forbids rawSafeguardingNote', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('rawSafeguardingNote')).toBe(true); });
  it('forbids studentPhone', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('studentPhone')).toBe(true); });
  it('forbids studentEmail', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('studentEmail')).toBe(true); });
  it('forbids parentPhone', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('parentPhone')).toBe(true); });
  it('forbids parentEmail', () => { expect(TASK040_FORBIDDEN_OUTPUT_FIELDS.includes('parentEmail')).toBe(true); });
});
