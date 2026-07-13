import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_MUTATION_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no production deployment', () => {
  it('forbids production_deployment in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('production_deployment')).toBe(true);
  });

  it('forbids kubectl apply pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('kubectl apply')).toBe(true);
  });

  it('forbids vercel deploy pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('vercel deploy')).toBe(true);
  });
});
