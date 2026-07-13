import { describe, it, expect } from 'vitest';
import { TASK040_ACCEPTED_TASK_IDS, TASK040_REQUIRED_TASK036_COMMIT_PREFIXES } from '../contracts/task040BackendFreezeContracts';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 040 continuity from task 036', () => {
  it('includes task 036 in accepted task IDs', () => {
    expect(TASK040_ACCEPTED_TASK_IDS.includes('036')).toBe(true);
  });

  it('has the expected commit prefix for task 036', () => {
    expect(TASK040_REQUIRED_TASK036_COMMIT_PREFIXES[0]).toBe('45f361c');
  });

  it('has route file for task 036', () => {
    const d = path.resolve(__dirname, '..', 'routes');
    const f = fs.readdirSync(d);
    expect(f.some(x => x.includes('task036'))).toBe(true);
  });

  it('has handoff document for task 036', () => {
    expect(fs.existsSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'ops', 'task-036', 'TASK_036_HANDOFF.md'))).toBe(true);
  });

  it('has report document for task 036', () => {
    expect(fs.existsSync(path.resolve(__dirname, '..', '..', '..', 'docs', 'ops', 'task-036', 'TASK_036_LIVE_SCHOOL_LAUNCH_REPORT.md'))).toBe(true);
  });
});
