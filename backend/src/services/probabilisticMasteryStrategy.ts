import type { MasteryEstimationInput, MasteryEstimationResult, MasteryEstimationStrategy } from './probabilisticMasteryContracts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class EvidenceWeightedStrategy implements MasteryEstimationStrategy {
  readonly strategyId = 'evidence-weighted-strategy';
  readonly strategyVersion = '1.0.0';

  estimate(input: MasteryEstimationInput): MasteryEstimationResult {
    let baseWeight = input.evidenceWeight * 0.4;

    const confidenceFactor = 1 + input.markingConfidence * 0.2;
    baseWeight *= confidenceFactor;

    const integrityFactor = 1 + input.integrityRisk * (-0.4);
    baseWeight *= clamp(integrityFactor, 0, 1.3);

    const independenceFactor = 1 + input.independence * 0.15;
    baseWeight *= independenceFactor;

    const hintFactor = 1 + input.hintDependency * (-0.25);
    baseWeight *= clamp(hintFactor, 0, 1.3);

    const explanationFactor = 1 + input.explanationAdjustment;
    baseWeight *= clamp(explanationFactor, 0.6, 1.3);

    let retentionBoost = 0;
    if (input.retentionSignal !== null) {
      retentionBoost = input.retentionSignal * 0.05;
    }

    let transferBoost = 0;
    if (input.transferSignal !== null) {
      transferBoost = input.transferSignal * 0.05;
    }

    const recencyFactor = Math.exp(-input.evidenceAgeDays / 60);
    const adjustedWeight = baseWeight * recencyFactor;

    const evidenceOutcome = input.evidenceOutcome;
    const effectiveWeight = clamp(adjustedWeight, 0, 1.5);

    const evidenceDelta = evidenceOutcome * effectiveWeight + retentionBoost + transferBoost;

    let newProbability: number;
    if (evidenceDelta >= 0) {
      const gap = 1 - input.priorProbability;
      newProbability = input.priorProbability + (evidenceDelta * gap) / (1 + evidenceDelta);
    } else {
      const absDelta = Math.abs(evidenceDelta);
      newProbability = input.priorProbability - (absDelta * input.priorProbability) / (1 + absDelta);
    }
    newProbability = clamp(newProbability, 0, 1);

    let newConfidence = input.priorConfidence;
    const evidenceCountFactor = Math.min(input.totalEvidenceCount / 15, 0.4);
    const accuracyFactor = Math.abs(evidenceOutcome) * 0.15;
    newConfidence = 0.15 + evidenceCountFactor * 0.5 + accuracyFactor;
    newConfidence = clamp(newConfidence, 0, 1);

    if (isNaN(newProbability) || !isFinite(newProbability)) {
      newProbability = input.priorProbability;
    }
    if (isNaN(newConfidence) || !isFinite(newConfidence)) {
      newConfidence = input.priorConfidence;
    }

    return {
      probabilityOfMastery: newProbability,
      confidence: newConfidence,
      effectiveEvidenceWeight: effectiveWeight,
    };
  }
}

export const evidenceWeightedStrategy = new EvidenceWeightedStrategy();
