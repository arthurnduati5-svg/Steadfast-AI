import { describe, it, expect } from 'vitest';
import { validateTask031CopilotBootstrapSmokeSync } from '../services/task031CopilotBootstrapSmokeService';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - No Live AI Call Contract', () => {
  it('should not make AI provider calls during copilot bootstrap smoke', () => {
    const result = validateTask031CopilotBootstrapSmokeSync();
    expect(result.aiProviderCallMade).toBe(false);
  });

  it('should not make AI calls during student preflight smoke', () => {
    const result = validateTask031StudentPreflightSmokeSync();
    expect(result.aiCallMade).toBe(false);
  });

  it('should report liveAiCallIntroduced as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.liveAiCallIntroduced).toBe(false);
  });

  it('should report noLiveConnectorAiScanPassed as true in report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.noLiveConnectorAiScanPassed).toBe(true);
  });

  it('should have zero blocking issues related to AI calls when no AI is invoked', () => {
    const copilotResult = validateTask031CopilotBootstrapSmokeSync();
    const preflightResult = validateTask031StudentPreflightSmokeSync();
    const allAiBlockers = [
      ...copilotResult.blockingIssues.filter(i => i.includes('ai')),
      ...preflightResult.blockingIssues.filter(i => i.includes('ai')),
    ];
    expect(allAiBlockers).toHaveLength(0);
  });
});
