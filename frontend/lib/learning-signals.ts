import type { RevisionItem, RevisionMastery } from '@/lib/types';
import type {
  StudyResponseEvaluation,
  StudyTeachBackEvaluation,
  StudyToolId,
} from '@/lib/study-tool-recommendation';

export type LearningSignalConfidenceTrend = 'up' | 'steady' | 'down';
export type LearningSignalRiskLevel = 'low' | 'medium' | 'high';
export type LearningRecoveryState = 'stuck' | 'recovering' | 'stabilized' | 'fragile';
export type LearningTeachBackQuality = 'strong' | 'partial' | 'struggling' | 'unavailable';
export type LearningTransferReadiness = 'ready' | 'developing' | 'not_ready';
export type LearningRecallStrength = 'strong' | 'medium' | 'weak';
export type LearningFrictionLevel = 'low' | 'medium' | 'high';
export type LearningSupportTrend = 'helpful' | 'mixed' | 'limited';
export type LearningRevisitPriority = 'low' | 'medium' | 'high';
export type LearningSignalEvidenceTier = 'tier1' | 'tier2' | 'tier3';
export type LearningSignalUncertainty = 'low' | 'medium' | 'high';

export type LearningSupportActionId =
  | 'quick_check'
  | 'teach_back'
  | 'transfer_question'
  | 'compare_table'
  | 'concept_map'
  | 'flow_diagram'
  | 'recall_sheet'
  | 'flashcards'
  | 'review_recap_first'
  | 'practice_similar_question'
  | 'revisit_tomorrow'
  | 'rescue_weak_pattern'
  | 'visual_tools';

export interface LearningSupportEffectivenessEntry {
  support: LearningSupportActionId;
  trend: LearningSupportTrend;
  evidenceWeight: number;
  summary: string;
}

export interface LearningSignalsEvidenceSummary {
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  tier1Weight: number;
  tier2Weight: number;
  tier3Weight: number;
  positiveEvidenceCount: number;
  negativeEvidenceCount: number;
  uncertainty: LearningSignalUncertainty;
}

export interface LearningSignalsNextBestSupport {
  action: LearningSupportActionId;
  label: string;
  reason: string;
  toolId: StudyToolId | null;
}

export interface LearningSignalsDirectPrompt {
  question: string;
  options: string[];
}

export interface LearningSignalsSnapshot {
  version: 1;
  masteryLabel: RevisionMastery;
  confidenceTrendEstimate: LearningSignalConfidenceTrend;
  misconceptionRisk: LearningSignalRiskLevel;
  supportEffectiveness: LearningSupportEffectivenessEntry[];
  nextBestSupport: LearningSignalsNextBestSupport;
  revisitPriority: LearningRevisitPriority;
  recoveryState: LearningRecoveryState;
  teachBackQuality: LearningTeachBackQuality;
  transferReadiness: LearningTransferReadiness;
  recallStrength: LearningRecallStrength;
  frictionLevel: LearningFrictionLevel;
  lastMeaningfulEvidenceAt: string | null;
  coachNote: string;
  evidenceSummary: LearningSignalsEvidenceSummary;
  askDirectFeedback: boolean;
  directFeedbackPrompt: LearningSignalsDirectPrompt | null;
}

export interface LearningSignalsRuntimeInput {
  openedTools: StudyToolId[];
  completedTools: StudyToolId[];
  savedArtifacts: StudyToolId[];
  quickCheckResults: StudyResponseEvaluation[];
  quickCheckCompleted: boolean;
  teachBackResult: StudyTeachBackEvaluation | null;
  transferResult: StudyResponseEvaluation | null;
  responseWordSamples: number[];
  quickDismissCount: number;
  directFeedbackSignals: string[];
  lastMeaningfulEvidenceAt: string | null;
}

export interface BuildLearningSignalsInput {
  item: RevisionItem;
  runtime: LearningSignalsRuntimeInput;
}

type EvidenceEvent = {
  tier: LearningSignalEvidenceTier;
  weight: number;
  positive: boolean;
};

type RawSupportMetric = {
  support: LearningSupportActionId;
  score: number;
  evidence: number;
};

const MASTERY_RANK: Record<RevisionMastery, number> = {
  still_learning: 0,
  getting_better: 1,
  almost_there: 2,
  confident: 3,
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Date.parse(trimmed);
  return Number.isNaN(parsed) ? null : new Date(parsed).toISOString();
}

function wordCount(value: string): number {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function latestIso(...values: Array<string | null | undefined>): string | null {
  const valid = values
    .map((value) => (typeof value === 'string' ? toIsoOrNull(value) : null))
    .filter((value): value is string => Boolean(value))
    .sort();
  return valid[valid.length - 1] || null;
}

function qualityFromTeachBack(result: StudyTeachBackEvaluation | null): LearningTeachBackQuality {
  if (!result) return 'unavailable';
  if (result.correctness === 'strong') return 'strong';
  if (result.correctness === 'partial') return 'partial';
  return 'struggling';
}

function readPersistedStudyToolsSignals(item: RevisionItem): {
  quickCheckAverage: number | null;
  transferScore: number | null;
  teachBackScore: number | null;
  teachBackCorrectness: string | null;
  transferCorrectness: string | null;
  updatedAt: string | null;
} {
  const metadataRecord = asRecord(item.metadata);
  const studyToolsRecord = asRecord(metadataRecord?.studyTools);
  const latestSignals = asRecord(studyToolsRecord?.latestSignals);
  const quickCheck = asRecord(latestSignals?.quickCheck);
  const transferQuestion = asRecord(latestSignals?.transferQuestion);
  const teachBack = asRecord(latestSignals?.teachBack);

  const quickCheckAverage = Number(quickCheck?.averageScore);
  const transferScore = Number(transferQuestion?.score);
  const teachBackScore = Number(teachBack?.score);
  const transferCorrectness = typeof transferQuestion?.correctness === 'string' ? transferQuestion.correctness : null;
  const teachBackCorrectness = typeof teachBack?.correctness === 'string' ? teachBack.correctness : null;
  const updatedAt = latestIso(
    toIsoOrNull(quickCheck?.updatedAt),
    toIsoOrNull(transferQuestion?.updatedAt),
    toIsoOrNull(teachBack?.updatedAt)
  );

  return {
    quickCheckAverage: Number.isFinite(quickCheckAverage) ? quickCheckAverage : null,
    transferScore: Number.isFinite(transferScore) ? transferScore : null,
    teachBackScore: Number.isFinite(teachBackScore) ? teachBackScore : null,
    teachBackCorrectness,
    transferCorrectness,
    updatedAt,
  };
}

function readTier3Signals(item: RevisionItem, runtimeSignals: string[]): string[] {
  const fromNote = typeof item.studentNote === 'string' && item.studentNote.trim()
    ? [item.studentNote.trim()]
    : [];
  return [...fromNote, ...runtimeSignals].slice(0, 4);
}

function tier3Polarity(signal: string): number {
  const lowered = signal.toLowerCase();
  if (/\b(confused|hard|stuck|still hard|not helping|don\'t get|dont get)\b/.test(lowered)) return -1;
  if (/\b(helped|clear|clearer|get it|understand now|worked)\b/.test(lowered)) return 1;
  return 0;
}

function scoreToMastery(score: number): RevisionMastery {
  if (score >= 78) return 'confident';
  if (score >= 58) return 'almost_there';
  if (score >= 38) return 'getting_better';
  return 'still_learning';
}

function evaluateSupportEffectiveness(args: {
  runtime: LearningSignalsRuntimeInput;
  quickCheckAverage: number | null;
  teachBackQuality: LearningTeachBackQuality;
  transferReadiness: LearningTransferReadiness;
  misconceptionRisk: LearningSignalRiskLevel;
}): LearningSupportEffectivenessEntry[] {
  const metrics: RawSupportMetric[] = [];

  const quickScore =
    args.quickCheckAverage === null
      ? 0
      : args.quickCheckAverage >= 72
        ? 2.4
        : args.quickCheckAverage >= 55
          ? 1.2
          : -1.4;
  metrics.push({ support: 'quick_check', score: quickScore, evidence: args.quickCheckAverage === null ? 0 : 1 });

  const teachBackScore =
    args.teachBackQuality === 'strong'
      ? 2.3
      : args.teachBackQuality === 'partial'
        ? 1.1
        : args.teachBackQuality === 'struggling'
          ? -1.5
          : 0;
  metrics.push({ support: 'teach_back', score: teachBackScore, evidence: args.teachBackQuality === 'unavailable' ? 0 : 1 });

  const transferScore =
    args.transferReadiness === 'ready'
      ? 2.4
      : args.transferReadiness === 'developing'
        ? 1
        : args.runtime.transferResult
          ? -1.7
          : 0;
  metrics.push({ support: 'transfer_question', score: transferScore, evidence: args.runtime.transferResult ? 1 : 0 });

  const visualOpened = args.runtime.openedTools.some((toolId) => toolId === 'concept_map' || toolId === 'flow_diagram');
  metrics.push({
    support: 'visual_tools',
    score: visualOpened && (args.transferReadiness !== 'not_ready' || args.teachBackQuality === 'strong') ? 1.3 : visualOpened ? 0.4 : 0,
    evidence: visualOpened ? 1 : 0,
  });

  const compareOpened = args.runtime.openedTools.includes('compare_table');
  metrics.push({
    support: 'compare_table',
    score: compareOpened
      ? args.misconceptionRisk === 'high'
        ? 1.5
        : args.transferReadiness === 'ready' || args.teachBackQuality !== 'struggling'
          ? 1
          : 0.3
      : 0,
    evidence: compareOpened ? 1 : 0,
  });

  const recapBeforeCheck =
    args.runtime.openedTools.includes('recall_sheet') &&
    args.quickCheckAverage !== null &&
    args.quickCheckAverage >= 62;
  metrics.push({
    support: 'review_recap_first',
    score: recapBeforeCheck ? 1.8 : 0,
    evidence: recapBeforeCheck ? 1 : 0,
  });

  return metrics
    .filter((entry) => entry.evidence > 0 || Math.abs(entry.score) >= 1.2)
    .map((entry) => {
      const trend: LearningSupportTrend = entry.score >= 1.4 ? 'helpful' : entry.score <= -0.9 ? 'limited' : 'mixed';
      const summary =
        entry.support === 'quick_check'
          ? trend === 'helpful'
            ? 'Quick check is producing reliable retrieval wins.'
            : trend === 'limited'
              ? 'Quick check alone is not enough yet.'
              : 'Quick check helps, but still needs support around it.'
          : entry.support === 'teach_back'
            ? trend === 'helpful'
              ? 'Teach-back improves understanding quality.'
              : trend === 'limited'
                ? 'Teach-back responses still show unstable understanding.'
                : 'Teach-back is useful but still developing.'
            : entry.support === 'review_recap_first'
              ? 'Quick check works better after recap.'
              : entry.support === 'compare_table'
                ? 'Compare view helps separate confusing ideas.'
                : entry.support === 'visual_tools'
                  ? 'Visual tools are helping concept clarity.'
                  : trend === 'helpful'
                    ? 'Transfer checks are improving adaptability.'
                    : trend === 'limited'
                      ? 'Transfer still needs stronger grounding.'
                      : 'Transfer performance is mixed right now.';

      return {
        support: entry.support,
        trend,
        evidenceWeight: Number((entry.score * 10).toFixed(1)),
        summary,
      };
    })
    .sort((a, b) => b.evidenceWeight - a.evidenceWeight)
    .slice(0, 4);
}

function nextSupportFromSignals(args: {
  recoveryState: LearningRecoveryState;
  frictionLevel: LearningFrictionLevel;
  recallStrength: LearningRecallStrength;
  teachBackQuality: LearningTeachBackQuality;
  transferReadiness: LearningTransferReadiness;
  misconceptionRisk: LearningSignalRiskLevel;
  supportEffectiveness: LearningSupportEffectivenessEntry[];
}): LearningSignalsNextBestSupport {
  if (args.recoveryState === 'stuck') {
    return {
      action: 'rescue_weak_pattern',
      label: 'Rescue this weak pattern now',
      reason: 'Recent evidence shows repeated breakdowns before stable success.',
      toolId: args.misconceptionRisk === 'high' ? 'compare_table' : 'flow_diagram',
    };
  }
  if (args.frictionLevel === 'high') {
    return {
      action: 'review_recap_first',
      label: 'Review recap first',
      reason: 'Friction is high, so the fastest stabilizer is a short recap before testing again.',
      toolId: 'recall_sheet',
    };
  }
  if (args.recallStrength === 'weak') {
    return {
      action: 'quick_check',
      label: 'Do a quick check',
      reason: 'Recall evidence is still weak and needs a fast retrieval pass.',
      toolId: 'quick_check',
    };
  }
  if (args.misconceptionRisk === 'high') {
    return {
      action: 'compare_table',
      label: 'Open compare table',
      reason: 'Confusion risk is still high and contrast support reduces false mixing.',
      toolId: 'compare_table',
    };
  }
  if (args.teachBackQuality === 'struggling' || args.teachBackQuality === 'partial') {
    return {
      action: 'teach_back',
      label: 'Try teach-back',
      reason: 'Explaining it cleanly will expose and fix remaining gaps.',
      toolId: 'teach_back',
    };
  }
  if (args.transferReadiness !== 'ready') {
    return {
      action: 'practice_similar_question',
      label: 'Practice a similar question',
      reason: 'Transfer evidence is not stable yet, so one new-case check is the best next step.',
      toolId: 'transfer_question',
    };
  }

  const strongest = args.supportEffectiveness[0];
  if (strongest?.support === 'quick_check') {
    return {
      action: 'quick_check',
      label: 'Do a quick check',
      reason: strongest.summary,
      toolId: 'quick_check',
    };
  }

  return {
    action: 'revisit_tomorrow',
    label: 'Revisit tomorrow',
    reason: 'Current evidence looks stable; a spaced revisit will test durability.',
    toolId: null,
  };
}

export function buildLearningSignalsSnapshot(args: BuildLearningSignalsInput): LearningSignalsSnapshot {
  const persisted = readPersistedStudyToolsSignals(args.item);
  const tier3Signals = readTier3Signals(args.item, args.runtime.directFeedbackSignals);
  const events: EvidenceEvent[] = [];

  const quickCheckAverage = args.runtime.quickCheckResults.length
    ? Math.round(
        args.runtime.quickCheckResults.reduce((sum, result) => sum + Number(result.score || 0), 0) /
          args.runtime.quickCheckResults.length
      )
    : persisted.quickCheckAverage;

  if (quickCheckAverage !== null) {
    const weight = quickCheckAverage >= 72 ? 28 : quickCheckAverage >= 55 ? 14 : -18;
    events.push({ tier: 'tier1', weight, positive: weight > 0 });
  }

  const teachBackQuality = args.runtime.teachBackResult
    ? qualityFromTeachBack(args.runtime.teachBackResult)
    : persisted.teachBackCorrectness === 'strong'
      ? 'strong'
      : persisted.teachBackCorrectness === 'partial'
        ? 'partial'
        : persisted.teachBackCorrectness === 'struggled'
          ? 'struggling'
          : 'unavailable';

  if (teachBackQuality !== 'unavailable') {
    const weight = teachBackQuality === 'strong' ? 22 : teachBackQuality === 'partial' ? 10 : -20;
    events.push({ tier: 'tier1', weight, positive: weight > 0 });
  }

  const transferScore = args.runtime.transferResult ? args.runtime.transferResult.score : persisted.transferScore;
  const transferCorrectness = args.runtime.transferResult
    ? args.runtime.transferResult.correctness
    : persisted.transferCorrectness === 'correct' || persisted.transferCorrectness === 'partial' || persisted.transferCorrectness === 'struggled'
      ? persisted.transferCorrectness
      : null;
  const transferReadiness: LearningTransferReadiness =
    transferCorrectness === 'correct' || (typeof transferScore === 'number' && transferScore >= 70)
      ? 'ready'
      : transferCorrectness === 'partial' || (typeof transferScore === 'number' && transferScore >= 42)
        ? 'developing'
        : transferCorrectness === 'struggled'
          ? 'not_ready'
          : teachBackQuality === 'strong' && (quickCheckAverage || 0) >= 72
            ? 'developing'
            : 'not_ready';

  if (transferCorrectness) {
    const weight = transferReadiness === 'ready' ? 24 : transferReadiness === 'developing' ? 10 : -22;
    events.push({ tier: 'tier1', weight, positive: weight > 0 });
  }

  if (Number(args.item.successCount || 0) >= 3) {
    events.push({ tier: 'tier1', weight: 12, positive: true });
  }
  if (Number(args.item.struggleCount || 0) >= 3 && Number(args.item.successCount || 0) <= 1) {
    events.push({ tier: 'tier1', weight: -16, positive: false });
  }
  if (Number(args.item.reviewCount || 0) >= 3 && Number(args.item.successCount || 0) >= 2) {
    events.push({ tier: 'tier1', weight: 10, positive: true });
  }

  if (args.runtime.quickCheckCompleted) {
    events.push({ tier: 'tier2', weight: 6, positive: true });
  }
  if (args.runtime.openedTools.length > 0) {
    events.push({ tier: 'tier2', weight: Math.min(8, args.runtime.openedTools.length * 2), positive: true });
  }
  if (args.runtime.savedArtifacts.length > 0) {
    events.push({ tier: 'tier2', weight: Math.min(9, args.runtime.savedArtifacts.length * 3), positive: true });
  }
  const abandonedTools = Math.max(0, args.runtime.openedTools.length - args.runtime.completedTools.length);
  if (abandonedTools > 0) {
    events.push({ tier: 'tier2', weight: -Math.min(14, abandonedTools * 5), positive: false });
  }
  if (args.runtime.quickDismissCount > 0) {
    events.push({ tier: 'tier2', weight: -Math.min(12, args.runtime.quickDismissCount * 4), positive: false });
  }

  for (const signal of tier3Signals) {
    const polarity = tier3Polarity(signal);
    if (!polarity) continue;
    events.push({ tier: 'tier3', weight: polarity > 0 ? 3 : -3, positive: polarity > 0 });
  }

  const tier1Weight = events.filter((event) => event.tier === 'tier1').reduce((sum, event) => sum + event.weight, 0);
  const tier2Weight = events.filter((event) => event.tier === 'tier2').reduce((sum, event) => sum + event.weight, 0);
  const tier3Weight = events.filter((event) => event.tier === 'tier3').reduce((sum, event) => sum + event.weight, 0);
  const combinedScore = Math.round(45 + tier1Weight + tier2Weight * 0.45 + tier3Weight * 0.2);
  const normalizedScore = Math.max(0, Math.min(100, combinedScore));

  const tier1Count = events.filter((event) => event.tier === 'tier1').length;
  const tier2Count = events.filter((event) => event.tier === 'tier2').length;
  const tier3Count = events.filter((event) => event.tier === 'tier3').length;
  const positiveEvidenceCount = events.filter((event) => event.positive).length;
  const negativeEvidenceCount = events.filter((event) => !event.positive).length;
  const uncertainty: LearningSignalUncertainty =
    tier1Count >= 4
      ? 'low'
      : tier1Count >= 2
        ? 'medium'
        : 'high';

  const masteryFromEvidence = scoreToMastery(normalizedScore);
  const itemMastery = (args.item.mastery || 'still_learning') as RevisionMastery;
  const masteryGap = MASTERY_RANK[masteryFromEvidence] - MASTERY_RANK[itemMastery];
  const masteryLabel =
    uncertainty === 'high'
      ? itemMastery
      : Math.abs(masteryGap) <= 1
        ? masteryFromEvidence
        : masteryGap > 0
          ? (Object.keys(MASTERY_RANK).find(
              (key) => MASTERY_RANK[key as RevisionMastery] === MASTERY_RANK[itemMastery] + 1
            ) as RevisionMastery)
          : itemMastery;

  const confidenceTrendEstimate: LearningSignalConfidenceTrend =
    positiveEvidenceCount >= negativeEvidenceCount + 2
      ? 'up'
      : negativeEvidenceCount >= positiveEvidenceCount + 2
        ? 'down'
        : (args.item.confidenceTrend || 'steady');

  const misconceptionRisk: LearningSignalRiskLevel =
    args.item.isMistakeBased ||
    (teachBackQuality === 'struggling' && transferReadiness === 'not_ready') ||
    negativeEvidenceCount >= positiveEvidenceCount + 2
      ? 'high'
      : teachBackQuality === 'partial' || transferReadiness === 'developing'
        ? 'medium'
        : 'low';

  const recallStrength: LearningRecallStrength =
    quickCheckAverage === null
      ? Number(args.item.successCount || 0) >= 3
        ? 'medium'
        : 'weak'
      : quickCheckAverage >= 76
        ? 'strong'
        : quickCheckAverage >= 55
          ? 'medium'
          : 'weak';

  const shallowResponses = args.runtime.responseWordSamples.filter((sample) => sample <= 2).length;
  const frictionScore =
    args.runtime.quickDismissCount * 16 +
    abandonedTools * 12 +
    shallowResponses * 9 +
    (args.runtime.openedTools.length >= 3 && positiveEvidenceCount === 0 ? 12 : 0);
  const frictionLevel: LearningFrictionLevel =
    frictionScore >= 35 ? 'high' : frictionScore >= 18 ? 'medium' : 'low';

  const recoveryState: LearningRecoveryState =
    negativeEvidenceCount >= positiveEvidenceCount + 2
      ? 'stuck'
      : positiveEvidenceCount >= 3 && negativeEvidenceCount >= 1
        ? 'recovering'
        : positiveEvidenceCount >= 4 && misconceptionRisk === 'low' && frictionLevel !== 'high'
          ? 'stabilized'
          : 'fragile';

  const revisitPriority: LearningRevisitPriority =
    recoveryState === 'stuck' || transferReadiness === 'not_ready' || recallStrength === 'weak'
      ? 'high'
      : recoveryState === 'recovering' || frictionLevel === 'medium'
        ? 'medium'
        : 'low';

  const supportEffectiveness = evaluateSupportEffectiveness({
    runtime: args.runtime,
    quickCheckAverage,
    teachBackQuality,
    transferReadiness,
    misconceptionRisk,
  });

  const nextBestSupport = nextSupportFromSignals({
    recoveryState,
    frictionLevel,
    recallStrength,
    teachBackQuality,
    transferReadiness,
    misconceptionRisk,
    supportEffectiveness,
  });

  const coachNote =
    recoveryState === 'stuck'
      ? 'You are still getting trapped by the same pattern, so use one scaffold and retest immediately.'
      : recoveryState === 'recovering'
        ? 'Recovery is visible now; keep one more check to lock it in.'
        : recoveryState === 'stabilized'
          ? 'Recent evidence looks stable across checks and follow-up use.'
          : frictionLevel === 'high'
            ? 'Progress is present, but friction is rising, so keep support short and direct.'
            : supportEffectiveness[0]?.summary || 'You are improving; keep one short evidence check next.';

  const evidenceSummary: LearningSignalsEvidenceSummary = {
    tier1Count,
    tier2Count,
    tier3Count,
    tier1Weight,
    tier2Weight,
    tier3Weight,
    positiveEvidenceCount,
    negativeEvidenceCount,
    uncertainty,
  };

  const lastMeaningfulEvidenceAt = latestIso(
    args.runtime.lastMeaningfulEvidenceAt,
    persisted.updatedAt,
    args.item.lastReviewedAt || null,
    args.item.updatedAt || null
  );

  const askDirectFeedback =
    tier3Signals.length === 0 &&
    ((uncertainty === 'high' && tier1Count < 2) || (frictionLevel === 'high' && recoveryState !== 'stuck'));

  return {
    version: 1,
    masteryLabel,
    confidenceTrendEstimate,
    misconceptionRisk,
    supportEffectiveness,
    nextBestSupport,
    revisitPriority,
    recoveryState,
    teachBackQuality,
    transferReadiness,
    recallStrength,
    frictionLevel,
    lastMeaningfulEvidenceAt,
    coachNote,
    evidenceSummary,
    askDirectFeedback,
    directFeedbackPrompt: askDirectFeedback
      ? {
          question: 'Want a simpler example or a quick test next?',
          options: ['Simpler example', 'Quick test', 'Compare ideas'],
        }
      : null,
  };
}

export function readLearningSignalsFromRevisionItem(item: RevisionItem): LearningSignalsSnapshot | null {
  const metadataRecord = asRecord(item.metadata);
  const studyToolsRecord = asRecord(metadataRecord?.studyTools);
  const learningSignals = asRecord(studyToolsRecord?.learningSignals);
  if (!learningSignals) return null;
  if (Number(learningSignals.version || 0) !== 1) return null;
  const masteryLabel = typeof learningSignals.masteryLabel === 'string' ? learningSignals.masteryLabel : '';
  if (
    masteryLabel !== 'still_learning' &&
    masteryLabel !== 'getting_better' &&
    masteryLabel !== 'almost_there' &&
    masteryLabel !== 'confident'
  ) {
    return null;
  }
  return learningSignals as unknown as LearningSignalsSnapshot;
}
