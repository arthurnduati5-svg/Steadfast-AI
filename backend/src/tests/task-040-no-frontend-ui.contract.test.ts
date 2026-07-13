import { describe, it, expect } from 'vitest';
import {
  TASK040_FORBIDDEN_SCOPES,
  TASK040_FORBIDDEN_STAGED_PATH_PATTERNS,
} from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no frontend UI', () => {
  it('forbids frontend_ui in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('frontend_ui')).toBe(true);
  });

  it('forbids frontend/ in staged path patterns', () => {
    expect(TASK040_FORBIDDEN_STAGED_PATH_PATTERNS.includes('frontend/')).toBe(true);
  });

  it('forbids docs/frontend/ in staged path patterns', () => {
    expect(TASK040_FORBIDDEN_STAGED_PATH_PATTERNS.includes('docs/frontend/')).toBe(true);
  });

  it('forbids docs/ui-polish/ in staged path patterns', () => {
    expect(TASK040_FORBIDDEN_STAGED_PATH_PATTERNS.includes('docs/ui-polish/')).toBe(true);
  });
});
