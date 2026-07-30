import type {
  MasteryActorContext,
  MasteryState,
  NormalizedMasteryEvidence,
  MasteryPolicyConfig,
  MasteryTarget,
  MasteryEstimationStrategy,
  EvidenceApplicationResult,
  MasteryChangeLog,
  CognitiveDiagnosis,
  NextBestAction,
  ReasonCode,
  DiagnosisStatus,
  VisibleMasteryLabel,
  PrerequisiteReader,
  PrerequisiteInfo,
} from './probabilisticMasteryContracts';

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `pm_${idCounter}`;
}

function applyDecay(state: MasteryState, policy: MasteryPolicyConfig, now: Date): MasteryState {
  if (!policy.decayEnabled) return state;
  if (!state.lastEvidenceAt) return state;

  const msSinceLastEvidence = now.getTime() - state.lastEvidenceAt.getTime();
  const daysSinceLastEvidence = msSinceLastEvidence / (1000 * 60 * 60 * 24);
  if (daysSinceLastEvidence <= 0) return state;

  const decayedProbability = Math.max(
    policy.decayMinProbability,
    state.probabilityOfMastery - daysSinceLastEvidence * policy.decayRatePerDay,
  );
  const loweredConfidence = Math.max(
    policy.decayMinProbability,
    state.confidence - daysSinceLastEvidence * policy.decayRatePerDay * 0.5,
  );
  const decayRisk = clamp(1 - Math.exp(-daysSinceLastEvidence / policy.recencyHalfLifeDays), 0, 1);

  return {
    ...state,
    probabilityOfMastery: decayedProbability,
    confidence: loweredConfidence,
    decayRisk,
  };
}

export function deriveVisibleLabel(
  probability: number,
  evidenceCount: number,
  policy: MasteryPolicyConfig,
): VisibleMasteryLabel {
  if (evidenceCount === 0) return 'not_started';
  if (evidenceCount < policy.minimumUsableEvidenceCount) {
    if (probability >= policy.labelThresholds.introduced) return 'introduced';
    return 'not_started';
  }

  const sortedLabels: [VisibleMasteryLabel, number][] = [
    ['mastered', policy.labelThresholds.mastered],
    ['near_mastery', policy.labelThresholds.near_mastery],
    ['developing', policy.labelThresholds.developing],
    ['attempted', policy.labelThresholds.attempted],
    ['introduced', policy.labelThresholds.introduced],
    ['not_started', policy.labelThresholds.not_started],
  ];

  for (const [label, threshold] of sortedLabels) {
    if (probability >= threshold) return label;
  }
  return 'not_started';
}

export function evaluatePrerequisites(
  target: MasteryTarget,
  reader: PrerequisiteReader | null,
  policy: MasteryPolicyConfig,
): { blocked: boolean; weakDirect: string[]; weakTransitive: string[] } {
  if (!reader) return { blocked: false, weakDirect: [], weakTransitive: [] };

  const weakDirect: string[] = [];
  const weakTransitive: string[] = [];

  const direct = reader.getDirectPrerequisites(target);
  for (const prereq of direct) {
    if (prereq.isPrerequisite && (!prereq.state || prereq.state.probabilityOfMastery < policy.prerequisiteThreshold)) {
      weakDirect.push(prereq.targetNodeId);
    }
  }

  const transitive = reader.getTransitivePrerequisites(target);
  for (const prereq of transitive) {
    if (prereq.isPrerequisite && (!prereq.state || prereq.state.probabilityOfMastery < policy.prerequisiteThreshold)) {
      weakTransitive.push(prereq.targetNodeId);
    }
  }

  return {
    blocked: weakDirect.length > 0 || weakTransitive.length > 0,
    weakDirect,
    weakTransitive,
  };
}

export function diagnose(
  state: MasteryState,
  policy: MasteryPolicyConfig,
  prerequisiteResult: { blocked: boolean; weakDirect: string[]; weakTransitive: string[] },
): CognitiveDiagnosis {
  const reasonCodes: ReasonCode[] = [];
  let diagnosisStatus: DiagnosisStatus = 'healthy';
  const contributingEvidenceIds: string[] = [];

  if (state.evidenceCount < policy.minimumUsableEvidenceCount) {
    reasonCodes.push('insufficient_evidence');
    diagnosisStatus = 'insufficient_evidence';
  }

  if (prerequisiteResult.blocked) {
    reasonCodes.push('prerequisite_blocked');
    reasonCodes.push('weak_prerequisite');
    diagnosisStatus = 'weak_prerequisite';
  }

  if (state.misconceptionTags.length > 0) {
    reasonCodes.push('repeated_misconception');
    if (diagnosisStatus === 'healthy') diagnosisStatus = 'repeated_misconception';
  }

  if (state.hintDependencyScore > 0.3) {
    reasonCodes.push('evidence_weakened_by_hints');
    reasonCodes.push('evidence_weakened_by_low_independence');
    if (diagnosisStatus === 'healthy') diagnosisStatus = 'evidence_quality_weak';
  }

  if (state.decayRisk > 0.5) {
    reasonCodes.push('mastery_decay');
    reasonCodes.push('retention_risk');
    if (diagnosisStatus === 'healthy') diagnosisStatus = 'decay_risk';
  }

  if (state.confidence < policy.modelUncertaintyThreshold) {
    if (state.evidenceCount === 0) {
      reasonCodes.push('model_uncertainty_too_high');
      if (diagnosisStatus === 'healthy') diagnosisStatus = 'uncertain';
    }
  }

  if (state.probabilityOfMastery >= policy.labelThresholds.mastered && state.decayRisk < 0.3 && prerequisiteResult.weakDirect.length === 0) {
    reasonCodes.push('stable_progress');
    diagnosisStatus = 'stable_progress';
  }

  if (reasonCodes.length === 0) {
    reasonCodes.push('stable_progress');
  }

  return {
    diagnosisId: generateId(),
    schoolId: state.schoolId,
    learnerId: state.learnerId,
    targetNodeId: state.targetNodeId,
    diagnosisStatus,
    primaryReason: reasonCodes[0] || 'insufficient_evidence',
    reasonCodes,
    weakDirectPrerequisites: prerequisiteResult.weakDirect,
    weakTransitivePrerequisites: prerequisiteResult.weakTransitive,
    misconceptionTags: [...state.misconceptionTags],
    evidenceCount: state.evidenceCount,
    confidence: state.confidence,
    contributingEvidenceIds,
    generatedAt: new Date(),
    policyVersion: policy.policyVersion,
  };
}

export function classifyNextAction(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis,
): NextBestAction {
  if (state.evidenceCount < 3) {
    return { action: 'diagnose', reasonCodes: ['insufficient_evidence'], safeDescription: 'Gather more evidence before deciding next steps.' };
  }
  if (diagnosis.diagnosisStatus === 'weak_prerequisite') {
    return { action: 'remediate', reasonCodes: ['weak_prerequisite', 'prerequisite_blocked'], safeDescription: 'Strengthen prerequisite knowledge before advancing.' };
  }
  if (diagnosis.diagnosisStatus === 'repeated_misconception') {
    return { action: 'remediate', reasonCodes: ['repeated_misconception'], safeDescription: 'Address repeated misconceptions with targeted practice.' };
  }
  if (state.decayRisk > 0.5) {
    return { action: 'review', reasonCodes: ['mastery_decay', 'retention_risk'], safeDescription: 'Review this topic to refresh understanding.' };
  }
  if (state.probabilityOfMastery >= 0.75 && state.confidence >= 0.6) {
    return { action: 'advance', reasonCodes: ['stable_progress'], safeDescription: 'Ready to advance to the next topic.' };
  }
  if (state.evidenceCount >= 3) {
    return { action: 'practice', reasonCodes: ['stable_progress'], safeDescription: 'Continue practicing to build mastery.' };
  }
  return { action: 'diagnose', reasonCodes: ['insufficient_evidence'], safeDescription: 'Gather more information about current understanding.' };
}

export function validateEvidence(
  evidence: NormalizedMasteryEvidence,
  actor: MasteryActorContext,
  target: MasteryTarget,
  policy: MasteryPolicyConfig,
): string | null {
  if (!evidence.usable) return 'evidence not usable';
  if (evidence.schoolId !== target.schoolId) return 'foreign school';
  if (evidence.learnerId !== target.learnerId) return 'wrong learner';
  if (evidence.targetNodeId !== target.targetNodeId) return 'wrong target';
  if (evidence.curriculumVersionId !== target.curriculumVersionId) return 'curriculum version mismatch';
  if (!isFinite(evidence.outcome) || evidence.outcome < -1 || evidence.outcome > 1) return 'invalid outcome';
  if (!isFinite(evidence.markingConfidence) || evidence.markingConfidence < 0 || evidence.markingConfidence > 1) return 'invalid marking confidence';
  if (!isFinite(evidence.integrityRisk) || evidence.integrityRisk < 0 || evidence.integrityRisk > 1) return 'invalid integrity risk';
  if (!isFinite(evidence.independence) || evidence.independence < 0 || evidence.independence > 1) return 'invalid independence';
  if (!isFinite(evidence.hintDependency) || evidence.hintDependency < 0 || evidence.hintDependency > 1) return 'invalid hint dependency';

  if (evidence.integrityRisk > 0.7 && evidence.outcome > 0) {
    return 'high integrity risk cannot upgrade mastery';
  }
  return null;
}

function computeEvidenceAgeDays(evidence: NormalizedMasteryEvidence, now: Date): number {
  const ms = now.getTime() - evidence.occurredAt.getTime();
  return Math.max(0, ms / (1000 * 60 * 60 * 24));
}

function getSourceWeight(sourceType: string, policy: MasteryPolicyConfig): number {
  return policy.sourceWeights[sourceType as keyof typeof policy.sourceWeights] ?? 1.0;
}

function sortEvidence(evidenceList: NormalizedMasteryEvidence[]): NormalizedMasteryEvidence[] {
  return [...evidenceList].sort((a, b) => {
    const occurredDiff = a.occurredAt.getTime() - b.occurredAt.getTime();
    if (occurredDiff !== 0) return occurredDiff;
    const committedDiff = a.committedAt.getTime() - b.committedAt.getTime();
    if (committedDiff !== 0) return committedDiff;
    return a.evidenceId.localeCompare(b.evidenceId);
  });
}

function deduplicateAndFilterEvidence(
  evidenceList: NormalizedMasteryEvidence[],
): NormalizedMasteryEvidence[] {
  const supersededIds = new Set<string>();
  for (const e of evidenceList) {
    if (e.supersedes) {
      supersededIds.add(e.supersedes);
    }
  }

  const seen = new Map<string, NormalizedMasteryEvidence>();
  const result: NormalizedMasteryEvidence[] = [];

  for (const e of sortEvidence(evidenceList)) {
    if (supersededIds.has(e.evidenceId)) continue;

    const existing = seen.get(e.evidenceId);
    if (existing) {
      const existingContent = JSON.stringify(existing);
      const newContent = JSON.stringify(e);
      if (existingContent !== newContent) continue;
      continue;
    }

    seen.set(e.evidenceId, e);
    result.push(e);
  }

  return result;
}

function createInitialState(target: MasteryTarget, policy: MasteryPolicyConfig): MasteryState {
  return {
    schoolId: target.schoolId,
    learnerId: target.learnerId,
    targetNodeId: target.targetNodeId,
    targetNodeType: target.targetNodeType,
    curriculumVersionId: target.curriculumVersionId,
    probabilityOfMastery: 0,
    confidence: 0,
    evidenceCount: 0,
    lastEvidenceAt: null,
    decayRisk: 0,
    misconceptionTags: [],
    independenceScore: 0,
    hintDependencyScore: 0,
    retentionScore: 0,
    transferScore: 0,
    visibleLabel: 'not_started',
    policyVersion: policy.policyVersion,
    strategyId: policy.strategyId,
    strategyVersion: policy.strategyVersion,
    stateRevision: 0,
    updatedAt: new Date(),
  };
}

export function applyEvidence(
  currentState: MasteryState | null,
  evidence: NormalizedMasteryEvidence,
  actor: MasteryActorContext,
  target: MasteryTarget,
  policy: MasteryPolicyConfig,
  strategy: MasteryEstimationStrategy,
  prerequisiteReader: PrerequisiteReader | null,
  now: Date,
  correlationId: string,
): EvidenceApplicationResult & { rejected: boolean; rejectReason: string | null } {
  const validationError = validateEvidence(evidence, actor, target, policy);
  if (validationError) {
    return {
      state: currentState || createInitialState(target, policy),
      changeLog: null as unknown as MasteryChangeLog,
      diagnosis: null as unknown as CognitiveDiagnosis,
      nextAction: null as unknown as NextBestAction,
      rejected: true,
      rejectReason: validationError,
    };
  }

  let state = currentState ? { ...currentState } : createInitialState(target, policy);

  state = applyDecay(state, policy, now);

  const ageDays = computeEvidenceAgeDays(evidence, now);
  const sourceWeight = getSourceWeight(evidence.sourceType, policy);
  const explanationAdj = policy.explanationAdjustment[evidence.explanationQuality ?? 'missing'] ?? 0;

  const estimationInput = {
    priorProbability: state.probabilityOfMastery,
    priorConfidence: state.confidence,
    evidenceOutcome: evidence.outcome,
    evidenceWeight: sourceWeight,
    markingConfidence: evidence.markingConfidence,
    integrityRisk: evidence.integrityRisk,
    independence: evidence.independence,
    hintDependency: evidence.hintDependency,
    explanationAdjustment: explanationAdj,
    retentionSignal: evidence.retentionSignal,
    transferSignal: evidence.transferSignal,
    evidenceAgeDays: ageDays,
    totalEvidenceCount: state.evidenceCount + 1,
  };

  const estimation = strategy.estimate(estimationInput);

  const prevProbability = state.probabilityOfMastery;

  state.probabilityOfMastery = estimation.probabilityOfMastery;
  state.confidence = estimation.confidence;
  state.evidenceCount = state.evidenceCount + 1;
  state.lastEvidenceAt = evidence.occurredAt;
  state.independenceScore = (state.independenceScore * (state.evidenceCount - 1) + evidence.independence) / state.evidenceCount;
  state.hintDependencyScore = (state.hintDependencyScore * (state.evidenceCount - 1) + evidence.hintDependency) / state.evidenceCount;
  state.retentionScore = evidence.retentionSignal !== null
    ? (state.retentionScore * (state.evidenceCount - 1) + evidence.retentionSignal) / state.evidenceCount
    : state.retentionScore;
  state.transferScore = evidence.transferSignal !== null
    ? (state.transferScore * (state.evidenceCount - 1) + evidence.transferSignal) / state.evidenceCount
    : state.transferScore;

  if (evidence.misconceptionTags.length > 0) {
    const existingSet = new Set(state.misconceptionTags);
    for (const tag of evidence.misconceptionTags) {
      existingSet.add(tag);
    }
    state.misconceptionTags = [...existingSet];
  }

  if (evidence.outcome < 0 && prevProbability >= policy.labelThresholds.mastered) {
    const consecutiveMisses = 1;
    if (consecutiveMisses >= policy.masteredToNeedsRevisitMissCount) {
    }
  }

  const prerequisiteResult = evaluatePrerequisites(target, prerequisiteReader, policy);

  let effectiveProbability = state.probabilityOfMastery;
  if (prerequisiteResult.blocked) {
    const maxWithBlockedPrerequisite = policy.prerequisiteThreshold - 0.01;
    if (effectiveProbability > maxWithBlockedPrerequisite) {
      effectiveProbability = maxWithBlockedPrerequisite;
    }
  }

  state.probabilityOfMastery = effectiveProbability;
  state.visibleLabel = deriveVisibleLabel(state.probabilityOfMastery, state.evidenceCount, policy);
  state.stateRevision = (currentState?.stateRevision ?? 0) + 1;
  state.updatedAt = now;

  const diagnosisResult = diagnose(state, policy, prerequisiteResult);
  const nextAction = classifyNextAction(state, diagnosisResult);

  const reasonCodes: ReasonCode[] = [...diagnosisResult.reasonCodes];

  const changeLog: MasteryChangeLog = {
    changeId: generateId(),
    schoolId: state.schoolId,
    learnerId: state.learnerId,
    targetNodeId: state.targetNodeId,
    previousState: currentState ? { ...currentState } : null,
    newState: { ...state },
    contributingEvidenceIds: [evidence.evidenceId],
    policyVersion: policy.policyVersion,
    strategyId: strategy.strategyId,
    reasonCodes,
    createdAt: now,
    correlationId,
  };

  return {
    state,
    changeLog,
    diagnosis: diagnosisResult,
    nextAction,
    rejected: false,
    rejectReason: null,
  };
}

export type { EvidenceApplicationResult };

export function replayState(
  evidenceList: NormalizedMasteryEvidence[],
  target: MasteryTarget,
  policy: MasteryPolicyConfig,
  strategy: MasteryEstimationStrategy,
  prerequisiteReader: PrerequisiteReader | null,
  actor: MasteryActorContext,
  now: Date,
): { state: MasteryState; evidenceIdsUsed: string[] } {
  let state = createInitialState(target, policy);
  const evidenceIdsUsed: string[] = [];

  const filtered = deduplicateAndFilterEvidence(evidenceList);

  for (const evidence of filtered) {
    const result = applyEvidence(state, evidence, actor, target, policy, strategy, prerequisiteReader, now, 'replay');
    if (!result.rejected) {
      state = { ...result.state };
      evidenceIdsUsed.push(evidence.evidenceId);
    }
  }

  return { state, evidenceIdsUsed };
}
