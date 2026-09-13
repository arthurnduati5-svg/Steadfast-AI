import type { SparseLearnerState } from '../contracts/sparseLearnerStateContracts';
import type { LearnerDataTruthState } from '../contracts/learnerDataReliabilityContracts';
import { readLearnerGrowthDataAvailability } from './learnerGrowthDataReaderService';

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

export interface SparseLearnerCheckResult {
  hasLearnerMemory: boolean;
  hasTutorState: boolean;
  hasMasteryEvidence: boolean;
  hasPracticeAttempts: boolean;
  hasRevisionItems: boolean;
  hasArtifactSignals: boolean;
  hasVideoSignals: boolean;
  hasTeacherSafeSignals: boolean;
}

const STALE_THRESHOLD_DAYS = 30;

function classifyTruthState(
  checks: SparseLearnerCheckResult,
  latestEvidenceAt?: string
): { truthState: LearnerDataTruthState; safeReason: string } {
  const totalSources = Object.values(checks).filter(Boolean).length;

  if (totalSources === 0) {
    return {
      truthState: 'empty',
      safeReason: 'No learner growth data sources found. Learner has not yet engaged with practice, revision, or mastery activities.',
    };
  }

  if (totalSources >= 4) {
    return {
      truthState: 'live',
      safeReason: `Sufficient evidence across ${totalSources} data sources.`,
    };
  }

  if (totalSources >= 2) {
    return {
      truthState: 'partial',
      safeReason: `Partial evidence from ${totalSources} data sources. Some growth categories lack sufficient data.`,
    };
  }

  return {
    truthState: 'sparse',
    safeReason: `Minimal evidence from only ${totalSources} data source(s). Not enough for strong growth conclusions.`,
  };
}

function checkStaleness(latestEvidenceAt?: string): boolean {
  if (!latestEvidenceAt) return false;
  try {
    const latest = new Date(latestEvidenceAt).getTime();
    const now = Date.now();
    return (now - latest) > STALE_THRESHOLD_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    return false;
  }
}

async function defaultReader(input: {
  studentId: string;
  schoolId?: string | null;
}): Promise<SparseLearnerCheckResult & { latestEvidenceAt?: string }> {
  try {
    const availability = await readLearnerGrowthDataAvailability({
      studentId: input.studentId,
      schoolId: input.schoolId,
    });
    return {
      hasLearnerMemory: availability.hasLearnerMemory,
      hasTutorState: availability.hasTutorState,
      hasMasteryEvidence: availability.hasMasteryEvidence,
      hasPracticeAttempts: availability.hasPracticeAttempts,
      hasRevisionItems: availability.hasRevisionItems,
      hasArtifactSignals: availability.hasArtifactSignals,
      hasVideoSignals: availability.hasVideoSignals,
      hasTeacherSafeSignals: availability.hasTeacherSafeSignals,
      latestEvidenceAt: availability.latestEvidenceAt,
    };
  } catch {
    return {
      hasLearnerMemory: false,
      hasTutorState: false,
      hasMasteryEvidence: false,
      hasPracticeAttempts: false,
      hasRevisionItems: false,
      hasArtifactSignals: false,
      hasVideoSignals: false,
      hasTeacherSafeSignals: false,
      latestEvidenceAt: undefined,
    };
  }
}

export async function resolveSparseLearnerState(input: {
  studentId: string;
  schoolId?: string | null;
  checkFn?: () => Promise<SparseLearnerCheckResult>;
}): Promise<SparseLearnerState> {
  let checks: SparseLearnerCheckResult & { latestEvidenceAt?: string };

  if (input.checkFn) {
    const result = await input.checkFn();
    checks = { ...result, latestEvidenceAt: undefined };
  } else {
    checks = await defaultReader({
      studentId: input.studentId,
      schoolId: input.schoolId,
    });
  }

  const { truthState, safeReason } = classifyTruthState(checks, checks.latestEvidenceAt);

  let effectiveTruthState = truthState;
  let effectiveSafeReason = safeReason;

  if (truthState === 'live' || truthState === 'partial') {
    if (checkStaleness(checks.latestEvidenceAt)) {
      effectiveTruthState = 'stale';
      effectiveSafeReason = `Evidence exists but is older than ${STALE_THRESHOLD_DAYS} days. Growth signals should be treated as stale.`;
    }
  }

  return {
    studentIdHash: hashId(input.studentId),
    schoolIdHash: hashId(input.schoolId),
    hasLearnerMemory: checks.hasLearnerMemory,
    hasTutorState: checks.hasTutorState,
    hasMasteryEvidence: checks.hasMasteryEvidence,
    hasPracticeAttempts: checks.hasPracticeAttempts,
    hasRevisionItems: checks.hasRevisionItems,
    hasArtifactSignals: checks.hasArtifactSignals,
    hasVideoSignals: checks.hasVideoSignals,
    hasTeacherSafeSignals: checks.hasTeacherSafeSignals,
    truthState: effectiveTruthState,
    safeReason: effectiveSafeReason,
  };
}
