import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadTask028ProofForTask029, verifyTask028DependencyFromGit } from '../services/task029Task028ProofLoaderService';

vi.mock('fs', () => ({
  default: {
    readFileSync: vi.fn(),
  },
  readFileSync: vi.fn(),
}));

vi.mock('path', () => ({
  default: {
    resolve: vi.fn((...args: string[]) => args.join('/')),
  },
  resolve: vi.fn((...args: string[]) => args.join('/')),
}));

import * as fs from 'fs';

const mockReadFileSync = fs.readFileSync as unknown as ReturnType<typeof vi.fn>;

describe('loadTask028ProofForTask029', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ok:false when no proof file exists (readFileSync throws)', async () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    const result = await loadTask028ProofForTask029();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task028_proof_not_found');
    expect(result.proofStatus.reportFound).toBe(false);
  });

  it('should return ok:false when report JSON is malformed', async () => {
    mockReadFileSync.mockReturnValue('not json');
    const result = await loadTask028ProofForTask029();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task028_proof_not_found');
  });

  it('should return ok:false when taskId is not 028', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '029',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task028_taskid_mismatch');
  });

  it('should return ok:true for completely valid proof', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.ok).toBe(true);
    expect(result.proofStatus.reportFound).toBe(true);
    expect(result.proofStatus.proofValid).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.safeMessage).toContain('proof is valid');
  });

  it('should detect unsafe to start task 029', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: false,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.blockingIssues).toContain('task028_safe_to_start_task_029_not_true');
  });

  it('should detect wrong final decision', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'SOMETHING_ELSE',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.blockingIssues).toContain('task028_final_decision_not_pass');
  });

  it('should detect blocking issues in report', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: ['some_issue'],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.blockingIssues).toContain('task028_blocking_issues_not_empty');
  });

  it('should detect missing acceptance scenario', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: false, safeToStartTask029: false },
      verificationScriptPassed: true,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.blockingIssues).toContain('task028_acceptance_scenario_not_run');
    expect(result.blockingIssues).toContain('task028_acceptance_scenario_safe_to_start_not_true');
  });

  it('should detect verification script failure', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: false,
    }));
    const result = await loadTask028ProofForTask029();
    expect(result.blockingIssues).toContain('task028_verification_script_not_passed');
  });
});

describe('verifyTask028DependencyFromGit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ok:false when proof fails', async () => {
    mockReadFileSync.mockImplementation(() => { throw new Error('ENOENT'); });
    const result = await verifyTask028DependencyFromGit();
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('task028_proof_not_found');
  });

  it('should return ok:true with commit hash when proof passes', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({
      taskId: '028',
      safeToStartTask029: true,
      finalDecision: 'TASK_028_PASS_SAFE_TO_START_TASK_029',
      blockingIssues: [],
      acceptanceScenario: { scenarioRun: true, safeToStartTask029: true },
      verificationScriptPassed: true,
    }));
    const result = await verifyTask028DependencyFromGit();
    expect(result.ok).toBe(true);
    expect(result.commitHash).toBe('028');
    expect(result.acceptanceVerdict).toBe('TASK_028_PASS_SAFE_TO_START_TASK_029');
    expect(result.safeToStartTask029).toBe(true);
  });
});
