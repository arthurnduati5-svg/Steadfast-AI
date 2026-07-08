import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';

describe('Task024_Task021_SchoolGateOperationalMonitoring', () => {
  it('getOperationalHealth returns a component for school_integration', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-school-integration');
    const component = report.components.find(c => c.component === 'school_integration');
    expect(component).toBeDefined();
  });

  it('school_integration component has a status field and safeMessage field', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-school-integration');
    const component = report.components.find(c => c.component === 'school_integration');
    expect(component).toBeDefined();
    expect(component).toHaveProperty('status');
    expect(component).toHaveProperty('safeMessage');
    expect(typeof component!.status).toBe('string');
    expect(typeof component!.safeMessage).toBe('string');
  });

  it('school_integration check does not expose raw school identity data', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-school-integration');
    const component = report.components.find(c => c.component === 'school_integration');
    expect(component).toBeDefined();
    expect(component!.safeMessage).not.toMatch(/school[_-]?name/i);
    expect(component!.safeMessage).not.toMatch(/school[_-]?id/i);
    expect(component!.safeMessage).not.toMatch(/tenant[_-]?id/i);
    expect(component!.safeMessage).not.toMatch(/organization/i);
    expect(component!.safeMessage).not.toMatch(/student[_-]?id/i);
    expect(component!.safeMessage).not.toMatch(/learner[_-]?id/i);
  });

  it('school_integration check does not pass private school information in the safe message', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-school-integration');
    const component = report.components.find(c => c.component === 'school_integration');
    expect(component).toBeDefined();
    const forbiddenPatterns = [
      /\b[A-Z][a-zA-Z]+(?:School|Academy|Institute|College|University)\b/,
      /skool/i,
      /private.*data/i,
      /confidential/i,
      /personally.*identifiable/i,
    ];
    for (const pattern of forbiddenPatterns) {
      expect(component!.safeMessage).not.toMatch(pattern);
    }
  });
});
