import { describe, it, expect } from 'vitest';
import { TASK040_FORBIDDEN_SCOPES } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no AI runtime change', () => {
  it('forbids ai_runtime_change in forbidden scopes', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('ai_runtime_change')).toBe(true);
  });
});
