import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadTask027Proof } from '../services/task028Task027ProofLoaderService';
import * as fs from 'fs';
import * as path from 'path';

const REPORT_PATH = path.resolve(__dirname, '../../docs/ops/task-027/task-027-pilot-expansion-report.json');

describe('Task 028 Task027 Proof Loader Service', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  afterEach(() => {
    const dir = path.dirname(REPORT_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  it('should load proof and return safeToExecuteExpansion true when report is valid', async () => {
    const result = await loadTask027Proof();
    expect(result.safeToExecuteExpansion).toBe(true);
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.proofSummary.reportFound).toBe(true);
    expect(result.proofSummary.safeToStartTask028).toBe(true);
    expect(result.proofSummary.finalDecision).toBe('TASK_027_PASS_SAFE_TO_START_TASK_028');
  });

  it('should fail when report file is missing', async () => {
    const backup = REPORT_PATH + '.backup';
    if (fs.existsSync(REPORT_PATH)) {
      fs.renameSync(REPORT_PATH, backup);
    }
    try {
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
      expect(result.blockingIssues).toContain('task027_proof_invalid');
      expect(result.proofSummary.reportFound).toBe(false);
    } finally {
      if (fs.existsSync(backup)) {
        fs.renameSync(backup, REPORT_PATH);
      }
    }
  });

  it('should fail when report has invalid JSON', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    try {
      fs.writeFileSync(REPORT_PATH, '{invalid json}', 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
      expect(result.blockingIssues).toContain('task027_proof_invalid');
      expect(result.proofSummary.parseError).toBe(true);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });

  it('should fail when taskId is not 027', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    const corrupted = JSON.parse(original);
    corrupted.taskId = '026';
    try {
      fs.writeFileSync(REPORT_PATH, JSON.stringify(corrupted), 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });

  it('should fail when safeToStartTask028 is not true', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    const corrupted = JSON.parse(original);
    corrupted.safeToStartTask028 = false;
    try {
      fs.writeFileSync(REPORT_PATH, JSON.stringify(corrupted), 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThan(0);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });

  it('should fail when finalDecision is wrong', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    const corrupted = JSON.parse(original);
    corrupted.finalDecision = 'FAILED';
    try {
      fs.writeFileSync(REPORT_PATH, JSON.stringify(corrupted), 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });

  it('should fail when acceptanceScenario is not run', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    const corrupted = JSON.parse(original);
    corrupted.acceptanceScenario = { scenarioRun: false, safeToStartTask028: false };
    try {
      fs.writeFileSync(REPORT_PATH, JSON.stringify(corrupted), 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });

  it('should fail when blockingIssues are present', async () => {
    const original = fs.readFileSync(REPORT_PATH, 'utf-8');
    const corrupted = JSON.parse(original);
    corrupted.blockingIssues = ['issue-1'];
    try {
      fs.writeFileSync(REPORT_PATH, JSON.stringify(corrupted), 'utf-8');
      const result = await loadTask027Proof();
      expect(result.safeToExecuteExpansion).toBe(false);
    } finally {
      fs.writeFileSync(REPORT_PATH, original, 'utf-8');
    }
  });
});
