import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PROOF_PATH = path.resolve(__dirname, '../../../docs/ops/task-028/task-028-expansion-execution-report.json');

describe('Task 029 - Task 028 Proof Loader', () => {
  it('should have Task 028 proof report file', () => {
    const exists = fs.existsSync(PROOF_PATH);
    expect(exists).toBe(true);
  });

  it('should have valid Task 028 proof data', () => {
    const raw = fs.readFileSync(PROOF_PATH, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);

    expect(report.taskId).toBe('028');
    expect(report.safeToStartTask029).toBe(true);
    expect(report.finalDecision).toBe('TASK_028_PASS_SAFE_TO_START_TASK_029');
    expect(Array.isArray(report.blockingIssues)).toBe(true);
    expect(report.blockingIssues.length).toBe(0);
    expect(report.verificationScriptPassed).toBe(true);
  });

  it('should have acceptance scenario passing', () => {
    const raw = fs.readFileSync(PROOF_PATH, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);
    const scenario = report.acceptanceScenario;

    expect(scenario).toBeDefined();
    expect(scenario.scenarioRun).toBe(true);
    expect(scenario.safeToStartTask029).toBe(true);
    expect(Array.isArray(scenario.blockingIssues)).toBe(true);
    expect(scenario.blockingIssues.length).toBe(0);
    expect(scenario.rawPrivateDataUsed).toBe(false);
    expect(scenario.liveProductionExpansionPerformed).toBe(false);
  });

  it('should have verification exit code 0', () => {
    const raw = fs.readFileSync(PROOF_PATH, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);
    const commands = report.verificationCommands;
    expect(Array.isArray(commands)).toBe(true);
    for (const cmd of commands) {
      expect(cmd.exitCode).toBe(0);
    }
  });

  it('should have no privacy leak', () => {
    const raw = fs.readFileSync(PROOF_PATH, 'utf8').replace(/^\uFEFF/, '');
    const report = JSON.parse(raw);
    const privacy = report.privacyLeakChecks;
    expect(privacy).toBeDefined();
    for (const [key, value] of Object.entries(privacy as Record<string, unknown>)) {
      expect(value).toBe(false);
    }
  });
});
