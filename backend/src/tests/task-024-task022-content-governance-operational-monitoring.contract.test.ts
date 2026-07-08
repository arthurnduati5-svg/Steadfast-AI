import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';

describe('Task024_Task022_ContentGovernanceOperationalMonitoring', () => {
  it('getOperationalHealth returns a component for content_governance', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-content-governance');
    const component = report.components.find(c => c.component === 'content_governance');
    expect(component).toBeDefined();
  });

  it('content_governance component has a status field and safeMessage field', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-content-governance');
    const component = report.components.find(c => c.component === 'content_governance');
    expect(component).toBeDefined();
    expect(component).toHaveProperty('status');
    expect(component).toHaveProperty('safeMessage');
    expect(typeof component!.status).toBe('string');
    expect(typeof component!.safeMessage).toBe('string');
  });

  it('content_governance check does not expose raw content data', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-content-governance');
    const component = report.components.find(c => c.component === 'content_governance');
    expect(component).toBeDefined();
    expect(component!.safeMessage).not.toMatch(/curriculum/i);
    expect(component!.safeMessage).not.toMatch(/lesson[_-]?plan/i);
    expect(component!.safeMessage).not.toMatch(/module[_-]?content/i);
    expect(component!.safeMessage).not.toMatch(/source[_-]?material/i);
    expect(component!.safeMessage).not.toMatch(/approved[_-]?source/i);
  });

  it('content_governance check does not expose answer keys or teacher-only content', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-content-governance');
    const component = report.components.find(c => c.component === 'content_governance');
    expect(component).toBeDefined();
    expect(component!.safeMessage).not.toMatch(/answer[_-]?key/i);
    expect(component!.safeMessage).not.toMatch(/marking[_-]?scheme/i);
    expect(component!.safeMessage).not.toMatch(/rubric/i);
    expect(component!.safeMessage).not.toMatch(/teacher[_-]?only/i);
    expect(component!.safeMessage).not.toMatch(/staff[_-]?guide/i);
    expect(component!.safeMessage).not.toMatch(/answer/i);
  });
});
