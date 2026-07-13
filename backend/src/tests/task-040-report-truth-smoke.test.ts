import { describe, it, expect } from 'vitest';
import {
  TASK040_ACCEPTED_TASK_IDS,
  TASK040_FORBIDDEN_SCOPES,
  TASK040_FINAL_BACKEND_FREEZE_VERSION,
} from '../contracts/task040BackendFreezeContracts';

describe('Task 040 - Report Truth Smoke', () => {
  it('accepted task IDs are non-empty', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.length).toBeGreaterThan(0);
  });

  it('freeze version is defined', () => {
    expect(TASK040_FINAL_BACKEND_FREEZE_VERSION).toBeTruthy();
  });

  it('forbidden scopes do not include freeze scopes', () => {
    const freezeScopes = ['freeze_contract', 'freeze_validation', 'freeze_test'];
    for (const scope of freezeScopes) {
      expect(TASK040_FORBIDDEN_SCOPES.includes(scope as any)).toBe(false);
    }
  });

  it('forbidden scopes include new_product_feature', () => {
    expect(TASK040_FORBIDDEN_SCOPES.includes('new_product_feature')).toBe(true);
  });

  it('task count is 17', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.length).toBe(17);
  });
});
