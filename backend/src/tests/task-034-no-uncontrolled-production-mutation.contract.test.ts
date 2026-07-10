import { describe, it, expect } from 'vitest';
import { TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task034ControlledLimitedRolloutContracts';

describe('task034 no uncontrolled production mutation', () => {
  it('forbids prisma.migrate', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma.migrate');
  });

  it('forbids prisma.db.push', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('prisma.db.push');
  });

  it('forbids DROP TABLE', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('DROP TABLE');
  });

  it('forbids pg_dump', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('pg_dump');
  });

  it('prisma.migrate is in forbidden patterns', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('prisma.migrate')).toBe(true);
  });

  it('prisma.db.push is in forbidden patterns', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('prisma.db.push')).toBe(true);
  });

  it('DROP TABLE is in forbidden patterns', () => {
    expect(TASK034_FORBIDDEN_SIDE_EFFECT_PATTERNS.includes('DROP TABLE')).toBe(true);
  });
});
