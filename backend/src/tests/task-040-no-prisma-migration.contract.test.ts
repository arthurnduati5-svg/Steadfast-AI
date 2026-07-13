import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES, TASK040_FORBIDDEN_MUTATION_PATTERNS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no Prisma migration', () => {
  it('forbids prisma_migration in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('prisma_migration')).toBe(true);
  });

  it('forbids prisma migrate deploy pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('prisma migrate deploy')).toBe(true);
  });

  it('forbids prisma db push pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('prisma db push')).toBe(true);
  });

  it('forbids prisma migrate reset pattern', () => {
    expect(TASK040_FORBIDDEN_MUTATION_PATTERNS.includes('prisma migrate reset')).toBe(true);
  });
});
