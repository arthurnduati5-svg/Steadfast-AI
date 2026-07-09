import { describe, it, expect, beforeEach } from 'vitest';
import {
  createTask031SmokeRun,
  advanceTask031SmokeRun,
  blockTask031SmokeRun,
  completeTask031SmokeRun,
} from '../services/task031SmokeRunStateMachineService';

describe('Task 031 - Smoke Run State Machine', () => {
  beforeEach(() => {
  });

  it('should create a smoke run with status created', () => {
    const run = createTask031SmokeRun({});
    expect(run.runId).toBeTruthy();
    expect(run.status).toBe('created');
    expect(run.blockingIssues).toEqual([]);
    expect(run.createdAt).toBeTruthy();
    expect(run.updatedAt).toBeTruthy();
  });

  it('should create a smoke run with provided runId', () => {
    const run = createTask031SmokeRun({ runId: 'my_custom_run' });
    expect(run.runId).toBe('my_custom_run');
  });

  it('should create a smoke run with stage results', () => {
    const run = createTask031SmokeRun({ stageResults: { env: true } });
    expect(run.stageResults).toEqual({ env: true });
  });

  it('should advance from created to dependency_checking', () => {
    const run = createTask031SmokeRun({ runId: 'test_advance_1' });
    const advanced = advanceTask031SmokeRun('test_advance_1', 'dependency_checking');
    expect(advanced.status).toBe('dependency_checking');
  });

  it('should block on invalid transition', () => {
    const run = createTask031SmokeRun({ runId: 'test_invalid' });
    const advanced = advanceTask031SmokeRun('test_invalid', 'smoke_running');
    expect(advanced.status).toBe('blocked');
    expect(advanced.blockingIssues).toContain('invalid_transition_from_created_to_smoke_running');
  });

  it('should advance through full valid path', () => {
    const run = createTask031SmokeRun({ runId: 'full_path' });
    const states = [
      'dependency_checking',
      'dependency_passed',
      'environment_checking',
      'environment_passed',
      'smoke_running',
      'observability_checking',
      'latency_budget_checking',
      'readiness_deciding',
      'report_generated',
    ];
    let current: any;
    for (const state of states) {
      current = advanceTask031SmokeRun('full_path', state);
      expect(current.status).toBe(state);
    }
  });

  it('should block run not found on advance', () => {
    const result = advanceTask031SmokeRun('nonexistent', 'dependency_checking');
    expect(result.status).toBe('blocked');
    expect(result.blockingIssues).toContain('run_not_found');
  });

  it('should block a run with blockers', () => {
    const run = createTask031SmokeRun({ runId: 'block_me' });
    const blocked = blockTask031SmokeRun('block_me', ['env_failure', 'config_missing']);
    expect(blocked.status).toBe('blocked');
    expect(blocked.blockingIssues).toContain('env_failure');
    expect(blocked.blockingIssues).toContain('config_missing');
  });

  it('should block run not found on block', () => {
    const result = blockTask031SmokeRun('nonexistent', ['error']);
    expect(result.status).toBe('blocked');
    expect(result.blockingIssues).toContain('run_not_found');
  });

  it('should deduplicate blocking issues on block', () => {
    const run = createTask031SmokeRun({ runId: 'dedup' });
    blockTask031SmokeRun('dedup', ['issue_a', 'issue_a']);
    const blocked = blockTask031SmokeRun('dedup', ['issue_a', 'issue_b']);
    expect(blocked.blockingIssues.filter((i: string) => i === 'issue_a')).toHaveLength(1);
    expect(blocked.blockingIssues).toContain('issue_b');
  });

  it('should complete a run to accepted_ready from report_generated', () => {
    const run = createTask031SmokeRun({ runId: 'complete_me' });
    advanceTask031SmokeRun('complete_me', 'dependency_checking');
    advanceTask031SmokeRun('complete_me', 'dependency_passed');
    advanceTask031SmokeRun('complete_me', 'environment_checking');
    advanceTask031SmokeRun('complete_me', 'environment_passed');
    advanceTask031SmokeRun('complete_me', 'smoke_running');
    advanceTask031SmokeRun('complete_me', 'observability_checking');
    advanceTask031SmokeRun('complete_me', 'latency_budget_checking');
    advanceTask031SmokeRun('complete_me', 'readiness_deciding');
    advanceTask031SmokeRun('complete_me', 'report_generated');
    const completed = completeTask031SmokeRun('complete_me');
    expect(completed.status).toBe('accepted_ready');
  });

  it('should block on complete from invalid state', () => {
    const run = createTask031SmokeRun({ runId: 'bad_complete' });
    const result = completeTask031SmokeRun('bad_complete');
    expect(result.status).toBe('blocked');
    expect(result.blockingIssues).toContain('cannot_complete_from_current_state');
  });

  it('should block on complete when run not found', () => {
    const result = completeTask031SmokeRun('nonexistent');
    expect(result.status).toBe('blocked');
    expect(result.blockingIssues).toContain('run_not_found');
  });

  it('should preserve existing blocking issues when advancing invalid', () => {
    const run = createTask031SmokeRun({ runId: 'preserve_issues' });
    blockTask031SmokeRun('preserve_issues', ['initial_problem']);
    const attempt = advanceTask031SmokeRun('preserve_issues', 'smoke_running');
    expect(attempt.blockingIssues).toContain('initial_problem');
    expect(attempt.blockingIssues).toContain('invalid_transition_from_blocked_to_smoke_running');
  });
});