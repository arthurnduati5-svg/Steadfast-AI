import { describe, it, expect } from 'vitest';
import { TASK040_ACCEPTED_TASK_IDS } from '../contracts/task040BackendFreezeContracts';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 040 continuity from task 033', () => {
  it('includes task 033 in accepted task IDs', () => { expect(TASK040_ACCEPTED_TASK_IDS.includes('033')).toBe(true); });
  it('has route file for task 033', () => { const d = path.resolve(__dirname, '..', 'routes'); const f = fs.readdirSync(d); expect(f.some(x => x.includes('task033'))).toBe(true); });
});
