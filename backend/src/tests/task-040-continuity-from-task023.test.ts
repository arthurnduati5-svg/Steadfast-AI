import { describe, it, expect } from 'vitest';
import { TASK040_ACCEPTED_TASK_IDS } from '../contracts/task040BackendFreezeContracts';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 040 continuity from task 023', () => {
  it('includes task 023 in accepted task IDs', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.includes('023')).toBe(true);
  });

  it('has route file for task 023', () => {
    const dir = path.resolve(__dirname, '..', 'routes');
    const files = fs.readdirSync(dir);
    expect(files.some(f => f.includes('task023'))).toBe(true);
  });
});
