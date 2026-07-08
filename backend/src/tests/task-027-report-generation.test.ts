import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { generateExpansionReport } from '../services/task027PilotExpansionReportService';

describe('Task 027 Report Generation', () => {
  beforeEach(() => {
    task027PilotExpansionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
  });

  it('should generate a report', async () => {
    const result = await generateExpansionReport('027');
    expect(result.ok).toBe(true);
    expect(result.reportId).toBeTruthy();
    expect(result.safeSummary).toBeTruthy();
  });

  it('should include safeToStartTask028 in report', async () => {
    const result = await generateExpansionReport('027');
    expect(typeof result.safeToStartTask028).toBe('boolean');
  });

  it('should persist report in repository', async () => {
    const result = await generateExpansionReport('027');
    expect(result.ok).toBe(true);

    const report = await task027PilotExpansionRepository.getExpansionReport(result.reportId!);
    expect(report).toBeTruthy();
    expect((report as any).taskId).toBe('027');
  });

  it('should list reports by task id', async () => {
    await generateExpansionReport('027');
    await generateExpansionReport('027');

    const list = await task027PilotExpansionRepository.listExpansionReports('027');
    expect(list.length).toBe(2);
  });

  it('should not leak private content in reports', async () => {
    const result = await generateExpansionReport('027');
    expect(result.ok).toBe(true);

    const report = await task027PilotExpansionRepository.getExpansionReport(result.reportId!);
    const jsonStr = JSON.stringify(report);
    expect(jsonStr).not.toContain('Bearer ');
    expect(jsonStr).not.toContain('postgres://');
    expect(jsonStr).not.toContain('postgresql://');
    expect(jsonStr).not.toContain('sk-proj-');
  });
});
