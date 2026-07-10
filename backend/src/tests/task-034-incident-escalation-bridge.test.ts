import { describe, it, expect } from 'vitest';
import { evaluateTask034IncidentSignals } from '../services/task034IncidentEscalationBridgeService';

describe('Task034 Incident Escalation Bridge', () => {
  it('No signals returns ok with no_incident category', () => {
    const result = evaluateTask034IncidentSignals([], []);
    expect(result.ok).toBe(true);
    expect(result.safeSeverity).toBe('none');
    expect(result.safeCategory).toBe('no_incident');
    expect(result.safeSummary).toBe('no_incident_signals');
  });

  it('Signals present sets severity to info', () => {
    const result = evaluateTask034IncidentSignals(['latency_spike'], ['Latency spike detected']);
    expect(result.safeSeverity).toBe('info');
    expect(result.safeCategory).toBe('controlled_limited_rollout_internal');
  });

  it('Signals present triggers pauseRecommended and operatorReviewRequired', () => {
    const result = evaluateTask034IncidentSignals(['error_rate_high'], ['Error rate above threshold']);
    expect(result.pauseRecommended).toBe(true);
    expect(result.operatorReviewRequired).toBe(true);
  });

  it('rollbackRecommended is always false', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['test']);
    expect(result.rollbackRecommended).toBe(false);
  });

  it('killSwitchRecommended is always false', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['test']);
    expect(result.killSwitchRecommended).toBe(false);
  });

  it('No real alerts are ever sent', () => {
    const result = evaluateTask034IncidentSignals([], []);
    expect(result.realAlertSent).toBe(false);
    expect(result.realEmailSent).toBe(false);
    expect(result.realSmsSent).toBe(false);
    expect(result.realWhatsappSent).toBe(false);
  });

  it('No external tickets or webhooks are ever called', () => {
    const result = evaluateTask034IncidentSignals([], []);
    expect(result.externalTicketCreated).toBe(false);
    expect(result.webhookCalled).toBe(false);
  });

  it('rawIncidentDetailsExposed is true when forbidden patterns found in summaries', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['send email alert']);
    expect(result.rawIncidentDetailsExposed).toBe(true);
    expect(result.ok).toBe(false);
  });

  it('Forbidden alert pattern "real alert" is detected', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['this is a real alert notification']);
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.some(i => i.includes('forbidden_real_alert_pattern'))).toBe(true);
  });

  it('Forbidden alert pattern "send sms" is detected', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['send sms to admin']);
    expect(result.ok).toBe(false);
  });

  it('Forbidden alert pattern "webhook" is detected', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['webhook notification sent']);
    expect(result.ok).toBe(false);
  });

  it('Forbidden alert pattern "pagerduty" is detected', () => {
    const result = evaluateTask034IncidentSignals(['test'], ['PagerDuty alert triggered']);
    expect(result.ok).toBe(false);
  });

  it('safeReasonCodes returns the signals array', () => {
    const signals = ['signal1', 'signal2'];
    const result = evaluateTask034IncidentSignals(signals, ['summary']);
    expect(result.safeReasonCodes).toEqual(signals);
  });
});
