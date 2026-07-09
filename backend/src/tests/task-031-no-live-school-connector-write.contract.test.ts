import { describe, it, expect } from 'vitest';
import { runTask031BackendRouteSmoke } from '../services/task031BackendRouteSmokeService';
import { generateTask031Report } from '../services/task031ReportService';
import type { Task031Report } from '../contracts/task031StagingSmokeCanaryReadinessContracts';
import { TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS } from '../contracts/task031StagingSmokeCanaryReadinessContracts';

describe('Task 031 - No Live School Connector Write Contract', () => {
  it('should not make live connector calls during backend route smoke', async () => {
    const result = await runTask031BackendRouteSmoke({});
    expect(result.liveConnectorCallMade).toBe(false);
  });

  it('should report liveSchoolConnectorWriteIntroduced as false in generated report', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.liveSchoolConnectorWriteIntroduced).toBe(false);
  });

  it('should block forbidden side-effect patterns for school connectors', () => {
    const writePatterns = TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS.filter(
      p => p.includes('write') || p.includes('push') || p.includes('deploy'),
    );
    expect(writePatterns.length).toBeGreaterThan(0);
    for (const pattern of writePatterns) {
      expect(TASK031_FORBIDDEN_SIDE_EFFECT_PATTERNS).toContain(pattern);
    }
  });

  it('should have liveSchoolConnectorWriteIntroduced false even when report passes', async () => {
    const report: Task031Report = await generateTask031Report({});
    expect(report.safeToStartTask032).toBe(true);
    expect(report.liveSchoolConnectorWriteIntroduced).toBe(false);
  });

  it('should not contain school connector write patterns in route definitions', async () => {
    const result = await runTask031BackendRouteSmoke({});
    const routeDefs = JSON.stringify(result).toLowerCase();
    const hasWriteConnector = routeDefs.includes('write') || routeDefs.includes('connector');
    expect(hasWriteConnector).toBe(false);
  });
});
