import { describe, it, expect } from 'vitest';
import { TASK040_ACCEPTED_TASK_IDS } from '../contracts/task040BackendFreezeContracts';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 040 continuity from task 024', () => {
  it('includes task 024 in accepted task IDs', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.includes('024')).toBe(true);
  });

  it('has route file for task 024', () => {
    const dir = path.resolve(__dirname, '..', 'routes');
    const files = fs.readdirSync(dir);
    expect(files.some(f => f.includes('task024'))).toBe(true);
  });
});
