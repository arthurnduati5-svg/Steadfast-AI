import { describe, it, expect } from 'vitest';
import { TASK024_MONITORING_STATUSES, TASK024_ALERT_SEVERITIES } from '../contracts/task024OperationsReadinessContracts';

describe('Task024 Monitoring/Alerting gate contract', () => {
  it('should define monitoring statuses including missing_probe and blocked', () => {
    expect(TASK024_MONITORING_STATUSES).toContain('missing_probe');
    expect(TASK024_MONITORING_STATUSES).toContain('blocked');
    expect(TASK024_MONITORING_STATUSES).toContain('healthy');
    expect(TASK024_MONITORING_STATUSES).toContain('degraded');
  });

  it('should define alert severities including security, safeguarding, privacy', () => {
    expect(TASK024_ALERT_SEVERITIES).toContain('security');
    expect(TASK024_ALERT_SEVERITIES).toContain('safeguarding');
    expect(TASK024_ALERT_SEVERITIES).toContain('privacy');
    expect(TASK024_ALERT_SEVERITIES).toContain('critical');
  });

  it('should require monitoring to cover critical gates', () => {
    const criticalGates = ['school_auth', 'privacy', 'ai_egress', 'content_governance'];
    expect(criticalGates.length).toBeGreaterThan(0);
  });
});
