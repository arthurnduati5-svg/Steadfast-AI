import { describe, it, expect } from 'vitest';
import { TASK040_ACCEPTED_TASK_IDS } from '../contracts/task040BackendFreezeContracts';

describe('Task 040 no false pass', () => {
  it('has all accepted task IDs', () => {
    const expected = ['020', '021', '022', '023', '024', '025', '026', '027', '028', '029', '030', '031', '032', '033', '034', '035', '036'];
    for (const id of expected) {
      expect(TASK040_ACCEPTED_TASK_IDS.includes(id as any)).toBe(true);
    }
  });

  it('does not include non-accepted task IDs', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.includes('001' as any)).toBe(false);
    expect(TASK040_ACCEPTED_TASK_IDS.includes('041' as any)).toBe(false);
  });

  it('does not include empty strings', () => {
    for (const id of TASK040_ACCEPTED_TASK_IDS) {
      expect(id.trim()).toBeTruthy();
    }
  });
});
