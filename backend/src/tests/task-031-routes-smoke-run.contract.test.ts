import { describe, it, expect } from 'vitest';
import { createTask031SmokeRun, getTask031SmokeRun } from '../services/task031SmokeRunStateMachineService';

describe('Task 031 - POST /smoke-runs / GET /smoke-runs/:runId contract', () => {
  it('should create a smoke run with created status', () => {
    const run = createTask031SmokeRun({});
    expect(run.runId).toBeTruthy();
    expect(run.status).toBe('created');
    expect(run.createdAt).toBeTruthy();
    expect(run.updatedAt).toBeTruthy();
    expect(run.blockingIssues).toHaveLength(0);
  });

  it('should retrieve a created smoke run by runId', () => {
    const run = createTask031SmokeRun({});
    const fetched = getTask031SmokeRun(run.runId);
    expect(fetched).not.toBeNull();
    expect(fetched!.runId).toBe(run.runId);
    expect(fetched!.status).toBe('created');
  });

  it('should return null for non-existent runId', () => {
    const fetched = getTask031SmokeRun('nonexistent_run_id');
    expect(fetched).toBeNull();
  });

  it('should accept stageResults in creation', () => {
    const run = createTask031SmokeRun({ stageResults: { smoke: true } });
    expect(run.stageResults.smoke).toBe(true);
  });
});
