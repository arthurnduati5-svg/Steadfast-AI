import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 031 - No Frontend UI in Backend Services Contract', () => {
  it('should report frontendUiCreated as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.frontendUiCreated).toBe(false);
  });

  it('should have noFrontendUiScanPassed as true in report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.noFrontendUiScanPassed).toBe(true);
  });

  it('should not contain frontend file extensions in forbidden patterns', () => {
    const frontendPatterns = TASK031_FORBIDDEN_OUTPUT_PATTERNS.filter(
      p => p.includes('.html') || p.includes('.jsx') || p.includes('.tsx') || p.includes('.vue'),
    );
    expect(frontendPatterns).toHaveLength(0);
  });

  it('should not have frontend HTML or CSS patterns in report commands', async () => {
    const report: Task031Report = await generateTask031Report({});
    const cmds = report.commandsRun.join(' ').toLowerCase();
    const hasFrontendRefs = cmds.includes('npm run dev') || cmds.includes('index.html') || cmds.includes('app.tsx');
    expect(hasFrontendRefs).toBe(false);
  });
});
