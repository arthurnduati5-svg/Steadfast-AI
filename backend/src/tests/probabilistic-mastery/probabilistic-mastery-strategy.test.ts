import { describe, it, expect } from 'vitest';
import { evidenceWeightedStrategy } from '../../services/probabilisticMasteryStrategy';

describe('EvidenceWeightedStrategy', () => {
  it('has correct identity', () => {
    expect(evidenceWeightedStrategy.strategyId).toBe('evidence-weighted-strategy');
    expect(evidenceWeightedStrategy.strategyVersion).toBe('1.0.0');
  });

  it('returns bounded probability between 0 and 1', () => {
    const result = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    expect(result.probabilityOfMastery).toBeGreaterThanOrEqual(0);
    expect(result.probabilityOfMastery).toBeLessThanOrEqual(1);
  });

  it('higher quality evidence contributes more than lower quality', () => {
    const highResult = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0.2,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    const lowResult = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 0.5, markingConfidence: 0.5, integrityRisk: 0.3,
      independence: 0.3, hintDependency: 0.7, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    expect(highResult.probabilityOfMastery).toBeGreaterThan(lowResult.probabilityOfMastery);
  });

  it('heavily hinted evidence contributes less than independent evidence', () => {
    const independent = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    const hinted = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 0.1, hintDependency: 0.9, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 1,
    });
    expect(independent.probabilityOfMastery).toBeGreaterThan(hinted.probabilityOfMastery);
  });

  it('low marking confidence reduces contribution', () => {
    const highConf = evidenceWeightedStrategy.estimate({
      priorProbability: 0.5, priorConfidence: 0.5, evidenceOutcome: 0.5,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    const lowConf = evidenceWeightedStrategy.estimate({
      priorProbability: 0.5, priorConfidence: 0.5, evidenceOutcome: 0.5,
      evidenceWeight: 1, markingConfidence: 0.1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    expect(highConf.probabilityOfMastery).toBeGreaterThan(lowConf.probabilityOfMastery);
  });

  it('old evidence contributes less than recent evidence', () => {
    const recent = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 1, totalEvidenceCount: 1,
    });
    const old = evidenceWeightedStrategy.estimate({
      priorProbability: 0, priorConfidence: 0, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 365, totalEvidenceCount: 1,
    });
    expect(recent.probabilityOfMastery).toBeGreaterThan(old.probabilityOfMastery);
  });

  it('deterministic output for identical inputs', () => {
    const input = {
      priorProbability: 0.3, priorConfidence: 0.4, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 0.8, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0.1,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 5, totalEvidenceCount: 3,
    };
    const r1 = evidenceWeightedStrategy.estimate(input);
    const r2 = evidenceWeightedStrategy.estimate(input);
    expect(r1.probabilityOfMastery).toBe(r2.probabilityOfMastery);
    expect(r1.confidence).toBe(r2.confidence);
  });

  it('negative outcome reduces probability', () => {
    const positive = evidenceWeightedStrategy.estimate({
      priorProbability: 0.5, priorConfidence: 0.5, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 5,
    });
    const negative = evidenceWeightedStrategy.estimate({
      priorProbability: 0.5, priorConfidence: 0.5, evidenceOutcome: -1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 5,
    });
    expect(positive.probabilityOfMastery).toBeGreaterThan(negative.probabilityOfMastery);
  });

  it('no NaN or Infinity in output', () => {
    for (let outcome = -1; outcome <= 1; outcome++) {
      const result = evidenceWeightedStrategy.estimate({
        priorProbability: Math.random(), priorConfidence: Math.random(), evidenceOutcome: outcome,
        evidenceWeight: Math.random(), markingConfidence: Math.random(), integrityRisk: Math.random(),
        independence: Math.random(), hintDependency: Math.random(), explanationAdjustment: Math.random() * 0.2,
        retentionSignal: Math.random(), transferSignal: Math.random(),
        evidenceAgeDays: Math.random() * 100, totalEvidenceCount: Math.floor(Math.random() * 20) + 1,
      });
      expect(isNaN(result.probabilityOfMastery)).toBe(false);
      expect(isFinite(result.probabilityOfMastery)).toBe(true);
      expect(isNaN(result.confidence)).toBe(false);
      expect(isFinite(result.confidence)).toBe(true);
    }
  });

  it('retention signal increases probability', () => {
    const withRetention = evidenceWeightedStrategy.estimate({
      priorProbability: 0.3, priorConfidence: 0.3, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: 0.9, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    const withoutRetention = evidenceWeightedStrategy.estimate({
      priorProbability: 0.3, priorConfidence: 0.3, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    expect(withRetention.probabilityOfMastery).toBeGreaterThanOrEqual(withoutRetention.probabilityOfMastery);
  });

  it('transfer signal increases probability', () => {
    const withTransfer = evidenceWeightedStrategy.estimate({
      priorProbability: 0.3, priorConfidence: 0.3, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: 0.85,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    const withoutTransfer = evidenceWeightedStrategy.estimate({
      priorProbability: 0.3, priorConfidence: 0.3, evidenceOutcome: 1,
      evidenceWeight: 1, markingConfidence: 1, integrityRisk: 0,
      independence: 1, hintDependency: 0, explanationAdjustment: 0,
      retentionSignal: null, transferSignal: null,
      evidenceAgeDays: 0, totalEvidenceCount: 3,
    });
    expect(withTransfer.probabilityOfMastery).toBeGreaterThanOrEqual(withoutTransfer.probabilityOfMastery);
  });
});
