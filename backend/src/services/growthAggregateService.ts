import type { GrowthAggregate, WeakAreaTruthSignal, MasterySummary, RevisionReadiness, PracticeReadiness, SafeMeta } from '../contracts/growthAggregateContracts';
import type { LearnerDataTruthState } from '../contracts/learnerDataReliabilityContracts';
import { resolveSparseLearnerState } from './sparseLearnerStateResolverService';
import type { SparseLearnerCheckResult } from './sparseLearnerStateResolverService';
import { buildWeakAreaTruthSignals } from './weakAreaAggregationService';
import type { WeakAreaEvidenceInput } from './weakAreaAggregationService';
import { resolveRevisionReadiness } from './revisionReadinessResolverService';
import type { RevisionItemInput } from './revisionReadinessResolverService';
import { resolvePracticeReadiness } from './practiceReadinessResolverService';
import type { PracticeEvidenceInput } from './practiceReadinessResolverService';
import { runFullNoFakeGrowthGuard } from './noFakeGrowthGuardService';

function hashId(id: string | null | undefined): string {
  if (!id) return '';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `h_${Math.abs(hash).toString(36)}`;
}

function computeMasterySummary(weakAreas: WeakAreaTruthSignal[]): MasterySummary {
  let weakCount = 0;
  let stableCount = 0;
  let unknownCount = 0;

  for (const wa of weakAreas) {
    if (wa.strength === 'weak' || wa.strength === 'emerging') weakCount++;
    else if (wa.strength === 'stable') stableCount++;
    else unknownCount++;
  }

  const totalEvidence = weakAreas.reduce((sum, wa) => sum + wa.evidenceCount, 0);
  let confidence: MasterySummary['confidence'] = 'unknown';
  if (totalEvidence >= 10) confidence = 'high';
  else if (totalEvidence >= 3) confidence = 'medium';
  else if (totalEvidence > 0) confidence = 'low';

  return {
    knownSkillCount: weakAreas.length,
    weakSkillCount: weakCount,
    stableSkillCount: stableCount,
    unknownSkillCount: unknownCount,
    confidence,
  };
}

function determineAggregateTruthState(
  sparseState: { truthState: LearnerDataTruthState },
  weakAreas: WeakAreaTruthSignal[],
  revision: RevisionReadiness,
  practice: PracticeReadiness
): LearnerDataTruthState {
  if (sparseState.truthState === 'empty') return 'empty';

  const hasWeakAreas = weakAreas.length > 0;
  const hasRevision = revision.truthState === 'live' || revision.truthState === 'partial' || revision.truthState === 'stale';
  const hasPractice = practice.truthState === 'live' || practice.truthState === 'stale';

  if (hasWeakAreas && (hasRevision || hasPractice)) return 'live';
  if (hasWeakAreas || hasRevision || hasPractice) return 'partial';

  return sparseState.truthState;
}

export async function buildGrowthAggregate(input: {
  studentId: string;
  schoolId?: string | null;
  includeRevision?: boolean;
  includePractice?: boolean;
  includeArtifactSignals?: boolean;
  includeVideoSignals?: boolean;
  sparseCheckResult?: SparseLearnerCheckResult;
  weakAreaEvidenceInputs?: WeakAreaEvidenceInput[];
  revisionItemInputs?: RevisionItemInput[];
  practiceEvidenceInputs?: PracticeEvidenceInput[];
}): Promise<GrowthAggregate> {
  const sparseState = await resolveSparseLearnerState({
    studentId: input.studentId,
    schoolId: input.schoolId,
    checkFn: input.sparseCheckResult ? async () => input.sparseCheckResult! : undefined,
  });

  let weakAreas: WeakAreaTruthSignal[] = [];
  let revisionReadiness: RevisionReadiness;
  let practiceReadiness: PracticeReadiness;

  weakAreas = await buildWeakAreaTruthSignals({
    studentId: input.studentId,
    schoolId: input.schoolId,
    evidenceInputs: input.weakAreaEvidenceInputs,
  });

  if (input.includeRevision !== false) {
    revisionReadiness = await resolveRevisionReadiness({
      studentId: input.studentId,
      schoolId: input.schoolId,
      revisionItems: input.revisionItemInputs,
    });
  } else {
    revisionReadiness = { dueCount: 0, staleCount: 0, truthState: 'unavailable', unavailableReason: 'Revision data excluded by request.' };
  }

  if (input.includePractice !== false) {
    practiceReadiness = await resolvePracticeReadiness({
      studentId: input.studentId,
      schoolId: input.schoolId,
      weakAreas: input.practiceEvidenceInputs || input.weakAreaEvidenceInputs?.map(w => ({
        skillId: w.skillId,
        strength: w.strength,
        observedAt: w.observedAt,
      })),
    });
  } else {
    practiceReadiness = { recommendedCount: 0, truthState: 'unavailable', unavailableReason: 'Practice data excluded by request.' };
  }

  const masterySummary = computeMasterySummary(weakAreas);
  const truthState = determineAggregateTruthState(sparseState, weakAreas, revisionReadiness, practiceReadiness);

  const safeMeta: SafeMeta = {
    rawChatIncluded: false,
    rawLearnerMemoryIncluded: false,
    rawTranscriptIncluded: false,
    rawPromptIncluded: false,
    demoDataIncluded: false,
    frontendSynthesized: false,
  };

  const aggregate: GrowthAggregate = {
    studentIdHash: sparseState.studentIdHash,
    schoolIdHash: sparseState.schoolIdHash,
    generatedAt: new Date().toISOString(),
    truthState,
    weakAreas,
    masterySummary,
    revisionReadiness,
    practiceReadiness,
    safeMeta,
  };

  const guardResult = runFullNoFakeGrowthGuard(aggregate);
  if (!guardResult.safe) {
    aggregate.truthState = 'fallback_safe_empty';
    aggregate.weakAreas = [];
    aggregate.masterySummary = { knownSkillCount: 0, weakSkillCount: 0, stableSkillCount: 0, unknownSkillCount: 0, confidence: 'unknown' };
    aggregate.revisionReadiness = { dueCount: 0, staleCount: 0, truthState: 'fallback_safe_empty', unavailableReason: `Guard blocked: ${guardResult.violations.join(', ')}` };
    aggregate.practiceReadiness = { recommendedCount: 0, truthState: 'fallback_safe_empty', unavailableReason: `Guard blocked: ${guardResult.violations.join(', ')}` };
  }

  return aggregate;
}

export async function buildFallbackSafeEmptyGrowthAggregate(input: {
  studentId: string;
  schoolId?: string | null;
  reason: string;
}): Promise<GrowthAggregate> {
  return {
    studentIdHash: hashId(input.studentId),
    schoolIdHash: hashId(input.schoolId),
    generatedAt: new Date().toISOString(),
    truthState: 'fallback_safe_empty',
    weakAreas: [],
    masterySummary: {
      knownSkillCount: 0,
      weakSkillCount: 0,
      stableSkillCount: 0,
      unknownSkillCount: 0,
      confidence: 'unknown',
    },
    revisionReadiness: {
      dueCount: 0,
      staleCount: 0,
      truthState: 'fallback_safe_empty',
      unavailableReason: input.reason,
    },
    practiceReadiness: {
      recommendedCount: 0,
      truthState: 'fallback_safe_empty',
      unavailableReason: input.reason,
    },
    safeMeta: {
      rawChatIncluded: false,
      rawLearnerMemoryIncluded: false,
      rawTranscriptIncluded: false,
      rawPromptIncluded: false,
      demoDataIncluded: false,
      frontendSynthesized: false,
    },
  };
}
