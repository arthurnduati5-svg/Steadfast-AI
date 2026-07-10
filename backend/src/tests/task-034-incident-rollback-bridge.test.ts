import { describe, it, expect } from 'vitest';
import { evaluateIncidentSignals } from '../services/task034IncidentRollbackBridgeService';

describe('Task034IncidentRollbackBridge', () => {
  it('should pass with no signals', () => {
    const result = evaluateIncidentSignals({ signals: [], safeSummaries: ['All clear'] });
    expect(result.ok).toBe(true);
    expect(result.pauseRecommended).toBe(false);
    expect(result.killSwitchRecommended).toBe(false);
    expect(result.rollbackRecommended).toBe(false);
    expect(result.rawPrivateDataExposed).toBe(false);
  });

  it('should recommend pause for performance risk', () => {
    const result = evaluateIncidentSignals({
      signals: ['performance_risk'],
      safeSummaries: ['High latency detected'],
    });

    expect(result.pauseRecommended).toBe(true);
    expect(result.adminReviewRequired).toBe(true);
  });

  it('should recommend kill switch for privacy risk', () => {
    const result = evaluateIncidentSignals({
      signals: ['privacy_risk'],
      safeSummaries: ['Privacy boundary breach detected'],
    });

    expect(result.killSwitchRecommended).toBe(true);
    expect(result.privacyEscalationRequired).toBe(true);
  });

  it('should recommend rollback for open rollout risk', () => {
    const result = evaluateIncidentSignals({
      signals: ['open_rollout_risk'],
      safeSummaries: ['Open registration detected'],
    });

    expect(result.rollbackRecommended).toBe(true);
  });

  it('should strip forbidden patterns from summaries', () => {
    const result = evaluateIncidentSignals({
      signals: ['system_error_risk'],
      safeSummaries: ['raw student chat detected in system', 'System error occurred'],
    });

    expect(result.safeSummaries.length).toBe(1);
    expect(result.safeSummaries[0]).not.toContain('raw student chat');
  });

  it('should flag safeguarding escalation needed', () => {
    const result = evaluateIncidentSignals({
      signals: ['safeguarding_risk'],
      safeSummaries: ['Safeguarding concern'],
    });

    expect(result.safeguardingEscalationRequired).toBe(true);
  });

  it('should flag deen review needed', () => {
    const result = evaluateIncidentSignals({
      signals: ['deen_governance_risk'],
      safeSummaries: ['Deen governance question'],
    });

    expect(result.deenReviewRequired).toBe(true);
  });
});
