import { describe, it, expect } from 'vitest';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - No Production Deployment Contract', () => {
  it('should report productionDeploymentIntroduced as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.productionDeploymentIntroduced).toBe(false);
  });

  it('should have forbidden side-effect patterns that include deploy', () => {
    expect(TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain('deploy');
  });

  it('should have stagingEnvironmentOnly set to true in report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.stagingEnvironmentOnly).toBe(true);
  });

  it('should not have any deploy-related commands in the commandsRun list', async () => {
    const report: Task031Report = await generateTask031Report({});
    const cmds = report.commandsRun.join(' ').toLowerCase();
    const hasDeployCommand = cmds.includes('deploy') || cmds.includes('release') || cmds.includes('ship');
    expect(hasDeployCommand).toBe(false);
  });
});
