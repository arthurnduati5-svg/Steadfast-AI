import { describe, it, expect } from 'vitest';
import { getOperationalHealth } from '../services/task024OperationalHealthAggregator';

describe('Task024_Task023_DeploymentReadinessOperationalMonitoring', () => {
  it('getOperationalHealth returns a component for deployment_readiness', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-deployment-readiness');
    const component = report.components.find(c => c.component === 'deployment_readiness');
    expect(component).toBeDefined();
  });

  it('deployment_readiness component has a status and safeMessage', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-deployment-readiness');
    const component = report.components.find(c => c.component === 'deployment_readiness');
    expect(component).toBeDefined();
    expect(component).toHaveProperty('status');
    expect(component).toHaveProperty('safeMessage');
    expect(typeof component!.status).toBe('string');
    expect(typeof component!.safeMessage).toBe('string');
  });

  it('deployment_readiness check does not expose deployment secrets', { timeout: 10000 }, async () => {
    const report = await getOperationalHealth('test-deployment-readiness');
    const component = report.components.find(c => c.component === 'deployment_readiness');
    expect(component).toBeDefined();
    expect(component!.safeMessage).not.toMatch(/api[_-]?key/i);
    expect(component!.safeMessage).not.toMatch(/secret/i);
    expect(component!.safeMessage).not.toMatch(/token/i);
    expect(component!.safeMessage).not.toMatch(/password/i);
    expect(component!.safeMessage).not.toMatch(/credential/i);
    expect(component!.safeMessage).not.toMatch(/DATABASE_URL/i);
    expect(component!.safeMessage).not.toMatch(/JWT_SECRET/i);
    expect(component!.safeMessage).not.toMatch(/private[_-]?key/i);
    expect(component!.safeMessage).not.toMatch(/connection[_-]?string/i);
  });
});
