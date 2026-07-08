import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Parent role denied contract', () => {
  it('no parent guard is defined for ops console', () => {
    expect(content).not.toContain("requireRole('parent')");
  });

  it('no route uses parent role', () => {
    const parentRoleMatch = content.match(/requireRole\('parent'\)/);
    expect(parentRoleMatch).toBeNull();
  });

  it('all routes require admin or student, excluding parent by omission', () => {
    const uniqueRoles = [...content.matchAll(/requireRole\('(\w+)'\)/g)].map(m => m[1]);
    const uniqueSet = new Set(uniqueRoles);
    expect(uniqueSet.has('admin')).toBe(true);
    expect(uniqueSet.has('student')).toBe(true);
    expect(uniqueSet.has('parent')).toBe(false);
  });
});
