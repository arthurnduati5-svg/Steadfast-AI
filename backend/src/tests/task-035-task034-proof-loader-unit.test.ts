import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadTask034Proof } from '../services/task035Task034ProofLoaderService';
import * as fs from 'fs';

vi.mock('fs');

describe('task035 task034 proof loader unit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssue task034_report_not_found when report file does not exist', () => {
    vi.mocked(fs.existsSync).mockReturnValue(false);
    const result = loadTask034Proof();
    expect(result.reportFound).toBe(false);
    expect(result.blockingIssues).toContain('task034_report_not_found');
    expect(result.ok).toBe(false);
  });

  it('adds blocking issue when report has wrong taskId', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      taskId: '033',
      safeToStartTask035: true,
      finalDecision: 'TASK_034_PASS_SAFE_TO_START_TASK_035',
      blockingIssues: [],
    }));
    const result = loadTask034Proof();
    expect(result.blockingIssues).toContain('task034_report_wrong_task_id');
    expect(result.ok).toBe(false);
  });

  it('adds blocking issue when safeToStartTask035 is not true', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      taskId: '034',
      safeToStartTask035: false,
      finalDecision: 'TASK_034_PASS_SAFE_TO_START_TASK_035',
      blockingIssues: [],
    }));
    const result = loadTask034Proof();
    expect(result.blockingIssues).toContain('task034_safeToStartTask035_not_true');
    expect(result.ok).toBe(false);
  });

  it('adds blocking issue when finalDecision is not the expected pass value', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      taskId: '034',
      safeToStartTask035: true,
      finalDecision: 'TASK_034_FAIL',
      blockingIssues: [],
    }));
    const result = loadTask034Proof();
    expect(result.blockingIssues).toContain('task034_finalDecision_not_pass');
    expect(result.ok).toBe(false);
  });

  it('adds blocking issue when report has non-empty blockingIssues', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({
      taskId: '034',
      safeToStartTask035: true,
      finalDecision: 'TASK_034_PASS_SAFE_TO_START_TASK_035',
      blockingIssues: ['some issue'],
    }));
    const result = loadTask034Proof();
    expect(result.blockingIssues).toContain('task034_blockingIssues_not_empty');
    expect(result.ok).toBe(false);
  });

  it('reports unreadable report when JSON parse fails', () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue('not valid json');
    const result = loadTask034Proof();
    expect(result.blockingIssues.some(i => i.startsWith('task034_report_unreadable'))).toBe(true);
    expect(result.ok).toBe(false);
  });
});
