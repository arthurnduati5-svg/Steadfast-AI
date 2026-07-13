import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_MUTATION_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no production mutation', () => {
  it('forbids production_data_mutation in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('production_data_mutation')).toBe(true);
  });

  it('forbids DROP TABLE pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('DROP TABLE')).toBe(true);
  });

  it('forbids DELETE FROM pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('DELETE FROM')).toBe(true);
  });
});
