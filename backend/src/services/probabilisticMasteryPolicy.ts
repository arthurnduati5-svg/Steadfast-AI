import type { EvidenceSourceType, ExplanationQuality, MasteryPolicyConfig, VisibleMasteryLabel } from './probabilisticMasteryContracts';

function monotonicThresholds(labels: VisibleMasteryLabel[], values: number[]): void {
  const excluded = new Set<VisibleMasteryLabel>(['needs_revisit']);
  let lastLabel: VisibleMasteryLabel | null = null;
  let lastValue = -Infinity;
  for (let i = 0; i < labels.length; i++) {
    if (excluded.has(labels[i])) continue;
    if (lastLabel !== null && values[i] < lastValue) {
      throw new Error(`Label threshold not monotonic: ${lastLabel}(${lastValue}) >= ${labels[i]}(${values[i]})`);
    }
    lastLabel = labels[i];
    lastValue = values[i];
  }
}

export function validatePolicy(policy: MasteryPolicyConfig): void {
  if (!policy.policyVersion) throw new Error('policyVersion is required');
  if (!policy.strategyId) throw new Error('strategyId is required');
  if (!policy.strategyVersion) throw new Error('strategyVersion is required');

  for (const [key, value] of Object.entries(policy.sourceWeights)) {
    if (!isFinite(value)) throw new Error(`sourceWeight ${key} is not finite`);
  }
  if (!isFinite(policy.minimumUsableEvidenceCount) || policy.minimumUsableEvidenceCount < 0 || !Number.isInteger(policy.minimumUsableEvidenceCount)) {
    throw new Error('minimumUsableEvidenceCount must be a non-negative integer');
  }
  if (!isFinite(policy.markingConfidenceAdjustment)) throw new Error('markingConfidenceAdjustment must be finite');
  if (!isFinite(policy.integrityRiskPenalty)) throw new Error('integrityRiskPenalty must be finite');
  if (!isFinite(policy.independenceBonus)) throw new Error('independenceBonus must be finite');
  if (!isFinite(policy.hintDependencyPenalty)) throw new Error('hintDependencyPenalty must be finite');
  if (!isFinite(policy.recencyHalfLifeDays) || policy.recencyHalfLifeDays <= 0) throw new Error('recencyHalfLifeDays must be positive finite');
  if (!isFinite(policy.decayRatePerDay) || policy.decayRatePerDay < 0) throw new Error('decayRatePerDay must be non-negative');
  if (!isFinite(policy.decayMinProbability) || policy.decayMinProbability < 0 || policy.decayMinProbability > 1) throw new Error('decayMinProbability in [0,1]');
  if (!isFinite(policy.retentionContribution)) throw new Error('retentionContribution must be finite');
  if (!isFinite(policy.transferContribution)) throw new Error('transferContribution must be finite');
  if (!isFinite(policy.misconceptionPenalty)) throw new Error('misconceptionPenalty must be finite');
  if (!isFinite(policy.prerequisiteThreshold)) throw new Error('prerequisiteThreshold must be finite');
  if (!isFinite(policy.modelUncertaintyThreshold) || policy.modelUncertaintyThreshold < 0 || policy.modelUncertaintyThreshold > 1) throw new Error('modelUncertaintyThreshold in [0,1]');
  if (!isFinite(policy.masteredToNeedsRevisitMissCount) || policy.masteredToNeedsRevisitMissCount < 0) throw new Error('masteredToNeedsRevisitMissCount must be non-negative');
  if (!isFinite(policy.masteredToNeedsRevisitDecayDays) || policy.masteredToNeedsRevisitDecayDays < 0) throw new Error('masteredToNeedsRevisitDecayDays must be non-negative');

  const labelsWithUndefined: VisibleMasteryLabel[] = [
    'not_started', 'introduced', 'attempted', 'developing',
    'near_mastery', 'mastered', 'needs_revisit',
  ];
  const valuesWithUndefined = labelsWithUndefined.map(l => policy.labelThresholds[l]);
  if (valuesWithUndefined.some(v => v === undefined)) {
    throw new Error('All label thresholds must be defined');
  }
  const definedLabels = labelsWithUndefined;
  const definedValues = labelsWithUndefined.map(l => policy.labelThresholds[l] as number);
  for (const v of definedValues) {
    if (!isFinite(v) || v < 0 || v > 1) throw new Error('Label thresholds must be in [0,1]');
  }

  const masteredIdx = definedLabels.indexOf('mastered');
  const nearMasteryIdx = definedLabels.indexOf('near_mastery');
  if (masteredIdx >= 0 && nearMasteryIdx >= 0) {
    if ((definedValues[masteredIdx] as number) < (definedValues[nearMasteryIdx] as number)) {
      throw new Error('mastered threshold cannot be below near_mastery threshold');
    }
  }

  monotonicThresholds(definedLabels, definedValues as number[]);

  if (policy.integrityRiskPenalty > 0) {
    throw new Error('integrityRiskPenalty must not increase evidence weight');
  }
  if (policy.hintDependencyPenalty > 0) {
    throw new Error('hintDependencyPenalty must not increase independence');
  }
}

export const FIXTURE_POLICY_VERSION = 'fixture-policy-v1';
export const FIXTURE_STRATEGY_ID = 'evidence-weighted-strategy';
export const FIXTURE_STRATEGY_VERSION = '1.0.0';

export function createFixturePolicy(): MasteryPolicyConfig {
  const policy: MasteryPolicyConfig = {
    policyVersion: FIXTURE_POLICY_VERSION,
    sourceWeights: {
      tutor_attempt: 1.0,
      daily_objective_check: 1.0,
      practice_attempt: 1.0,
      teach_back: 1.2,
      reflection: 0.8,
      revision_recall: 1.1,
      assessment_result: 1.0,
      teacher_observation: 0.9,
      artifact_activity: 1.0,
      video_learning_checkpoint: 0.7,
      manual_seed_fixture: 1.0,
    },
    minimumUsableEvidenceCount: 3,
    markingConfidenceAdjustment: 0.3,
    integrityRiskPenalty: -0.5,
    independenceBonus: 0.2,
    hintDependencyPenalty: -0.3,
    explanationAdjustment: {
      missing: 0.0,
      weak: 0.05,
      partial: 0.1,
      strong: 0.2,
    },
    recencyHalfLifeDays: 30,
    decayEnabled: true,
    decayRatePerDay: 0.01,
    decayMinProbability: 0.05,
    retentionContribution: 0.1,
    transferContribution: 0.1,
    misconceptionPenalty: -0.15,
    labelThresholds: {
      not_started: 0.0,
      introduced: 0.05,
      attempted: 0.1,
      developing: 0.25,
      near_mastery: 0.5,
      mastered: 0.75,
      needs_revisit: 0.2,
    },
    prerequisiteThreshold: 0.5,
    modelUncertaintyThreshold: 0.3,
    masteredToNeedsRevisitMissCount: 3,
    masteredToNeedsRevisitDecayDays: 60,
    strategyId: FIXTURE_STRATEGY_ID,
    strategyVersion: FIXTURE_STRATEGY_VERSION,
  };

  validatePolicy(policy);
  return policy;
}
