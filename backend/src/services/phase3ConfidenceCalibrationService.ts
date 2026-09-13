import {
  Phase3ConfidenceLevel,
  Phase3ConfidenceObservation,
  Phase3ConfidenceCalibrationResult,
  Phase3ConfidenceRecoveryContext,
  Phase3RecoveryAction,
  Phase3RecoverySourceType,
} from '../contracts/phase3ConfidenceRecoveryContracts';
import * as repo from './phase3ConfidenceRecoveryRepository';

function generateId(): string {
  return `cal-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function recordConfidenceObservation(
  context: Phase3ConfidenceRecoveryContext,
  confidenceLevel: Phase3ConfidenceLevel,
  sourceType?: Phase3RecoverySourceType,
  sourceRef?: string,
  safeReasonCodes?: string[],
  safeSummary?: string
): Phase3ConfidenceObservation {
  const obs: Phase3ConfidenceObservation = {
    observationId: generateId(),
    schoolId: context.schoolId,
    studentId: context.studentId,
    objectiveId: context.objectiveId,
    topicId: context.topicId,
    skillId: context.skillId,
    confidenceLevel,
    sourceType: sourceType || 'confidence_self_report',
    sourceRef: sourceRef || '',
    evidenceStrength: 0,
    safeReasonCodes: safeReasonCodes || [],
    safeSummary: safeSummary || `Confidence reported as ${confidenceLevel}.`,
    createdAt: new Date().toISOString(),
  };
  return repo.recordConfidenceObservation(obs);
}

function confidenceScore(level: Phase3ConfidenceLevel): number {
  const map: Record<Phase3ConfidenceLevel, number> = {
    not_sure: 1,
    confused: 2,
    partly_know: 3,
    know_this: 4,
    very_confident: 5,
    not_reported: 0,
  };
  return map[level] ?? 0;
}

function deriveAlignmentStatus(
  confidenceLevel: Phase3ConfidenceLevel,
  evidenceStrength: number
): Phase3ConfidenceCalibrationResult['alignmentStatus'] {
  if (confidenceLevel === 'not_reported') return 'missing';
  const cs = confidenceScore(confidenceLevel);
  if (cs >= 4 && evidenceStrength <= 2) return 'over_confident';
  if (cs <= 2 && evidenceStrength >= 4) return 'under_confident';
  if (evidenceStrength === 0) return 'missing';
  const diff = Math.abs(cs - evidenceStrength);
  if (diff >= 3) return 'unstable';
  return 'aligned';
}

function deriveRecommendedAction(
  alignmentStatus: Phase3ConfidenceCalibrationResult['alignmentStatus'],
  confidenceLevel: Phase3ConfidenceLevel
): Phase3RecoveryAction {
  if (alignmentStatus === 'over_confident') return 'start_recall_check';
  if (alignmentStatus === 'under_confident') return 'start_teach_back';
  if (alignmentStatus === 'unstable') return 'open_revision_node';
  if (alignmentStatus === 'missing') return 'no_action_needed';
  if (confidenceLevel === 'very_confident' || confidenceLevel === 'know_this') return 'no_action_needed';
  return 'no_action_needed';
}

export function calibrateConfidenceForObjective(
  context: Phase3ConfidenceRecoveryContext,
  objectiveMasteryStrength: number,
  dailyCheckStrength: number,
  mistakePatternCount: number,
  explanationGapDetected: boolean,
  delayedRecallRequired: boolean,
  revisionDue: boolean,
  studyPlanBlocked: boolean,
  sourceTruthStatus?: string
): Phase3ConfidenceCalibrationResult {
  const observations = repo.listConfidenceObservationsForLearner(context.schoolId, context.studentId)
    .filter((o) => !context.objectiveId || o.objectiveId === context.objectiveId);

  const latest = observations[0];
  const confidenceLevel: Phase3ConfidenceLevel = latest?.confidenceLevel || 'not_reported';

  let evidenceStrength = objectiveMasteryStrength;
  evidenceStrength = Math.min(evidenceStrength + dailyCheckStrength, 5);
  if (explanationGapDetected) evidenceStrength = Math.max(evidenceStrength - 1, 1);
  if (delayedRecallRequired) evidenceStrength = Math.max(evidenceStrength - 1, 1);
  if (revisionDue) evidenceStrength = Math.max(evidenceStrength - 1, 0);
  if (studyPlanBlocked) evidenceStrength = Math.max(evidenceStrength - 1, 0);
  if (mistakePatternCount > 2) evidenceStrength = Math.max(evidenceStrength - 1, 0);

  if (sourceTruthStatus === 'source_required' || sourceTruthStatus === 'blocked' || sourceTruthStatus === 'unknown') {
    evidenceStrength = 0;
  }

  const alignmentStatus = deriveAlignmentStatus(confidenceLevel, evidenceStrength);

  const safeReasonCodes: string[] = [];
  if (alignmentStatus === 'over_confident') safeReasonCodes.push('overconfidence_detected');
  if (alignmentStatus === 'under_confident') safeReasonCodes.push('underconfidence_detected');
  if (explanationGapDetected) safeReasonCodes.push('explanation_gap');
  if (delayedRecallRequired) safeReasonCodes.push('delayed_recall_needed');
  if (mistakePatternCount > 2) safeReasonCodes.push('repeated_mistake_pattern');
  if (revisionDue) safeReasonCodes.push('revision_due');
  if (sourceTruthStatus === 'source_required') safeReasonCodes.push('source_required');
  if (sourceTruthStatus === 'blocked') safeReasonCodes.push('blocked');

  const result: Phase3ConfidenceCalibrationResult = {
    calibrationId: generateId(),
    schoolId: context.schoolId,
    studentId: context.studentId,
    objectiveId: context.objectiveId,
    topicId: context.topicId,
    skillId: context.skillId,
    confidenceLevel,
    evidenceStrength,
    alignmentStatus,
    safeSummary: buildCalibrationSafeSummary(alignmentStatus, confidenceLevel, sourceTruthStatus),
    safeReasonCodes,
    safeEvidenceRefs: [],
    recommendedRecoveryAction: deriveRecommendedAction(alignmentStatus, confidenceLevel),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return repo.upsertConfidenceCalibrationResult(result);
}

export function calibrateConfidenceForTopic(
  context: Phase3ConfidenceRecoveryContext,
  objectiveMasteryAverages: number[]
): Phase3ConfidenceCalibrationResult[] {
  return objectiveMasteryAverages.map((avg) => {
    const obs = repo.listConfidenceObservationsForLearner(context.schoolId, context.studentId)
      .filter((o) => !context.topicId || o.topicId === context.topicId);
    const latest = obs[0];
    const confidenceLevel: Phase3ConfidenceLevel = latest?.confidenceLevel || 'not_reported';
    const evidenceStrength = Math.min(Math.round(avg), 5);
    const alignmentStatus = deriveAlignmentStatus(confidenceLevel, evidenceStrength);

    const result: Phase3ConfidenceCalibrationResult = {
      calibrationId: generateId(),
      schoolId: context.schoolId,
      studentId: context.studentId,
      topicId: context.topicId,
      confidenceLevel,
      evidenceStrength,
      alignmentStatus,
      safeSummary: buildCalibrationSafeSummary(alignmentStatus, confidenceLevel),
      safeReasonCodes: [],
      safeEvidenceRefs: [],
      recommendedRecoveryAction: deriveRecommendedAction(alignmentStatus, confidenceLevel),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return repo.upsertConfidenceCalibrationResult(result);
  });
}

export function calibrateLearnerConfidence(
  context: Phase3ConfidenceRecoveryContext
): Phase3ConfidenceCalibrationResult[] {
  const observations = repo.listConfidenceObservationsForLearner(context.schoolId, context.studentId);
  const calibrations = repo.listConfidenceCalibrationResultsForLearner(context.schoolId, context.studentId);

  if (observations.length === 0 && calibrations.length === 0) {
    return [];
  }

  const latestObs = observations[0];
  const confidenceLevel: Phase3ConfidenceLevel = latestObs?.confidenceLevel || 'not_reported';
  const evidenceStrength = calibrations.length > 0
    ? Math.round(calibrations.reduce((s, c) => s + c.evidenceStrength, 0) / calibrations.length)
    : 0;
  const alignmentStatus = deriveAlignmentStatus(confidenceLevel, evidenceStrength);

  const result: Phase3ConfidenceCalibrationResult = {
    calibrationId: generateId(),
    schoolId: context.schoolId,
    studentId: context.studentId,
    confidenceLevel,
    evidenceStrength,
    alignmentStatus,
    safeSummary: buildCalibrationSafeSummary(alignmentStatus, confidenceLevel),
    safeReasonCodes: [],
    safeEvidenceRefs: [],
    recommendedRecoveryAction: deriveRecommendedAction(alignmentStatus, confidenceLevel),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return [repo.upsertConfidenceCalibrationResult(result)];
}

export function buildConfidenceCalibrationResult(
  params: Pick<Phase3ConfidenceCalibrationResult, 'confidenceLevel' | 'evidenceStrength' | 'alignmentStatus' | 'safeSummary' | 'safeReasonCodes' | 'recommendedRecoveryAction'> & {
    schoolId: string;
    studentId: string;
    objectiveId?: string;
    topicId?: string;
    skillId?: string;
  }
): Phase3ConfidenceCalibrationResult {
  const result: Phase3ConfidenceCalibrationResult = {
    calibrationId: generateId(),
    schoolId: params.schoolId,
    studentId: params.studentId,
    objectiveId: params.objectiveId,
    topicId: params.topicId,
    skillId: params.skillId,
    confidenceLevel: params.confidenceLevel,
    evidenceStrength: params.evidenceStrength,
    alignmentStatus: params.alignmentStatus,
    safeSummary: params.safeSummary,
    safeReasonCodes: params.safeReasonCodes,
    safeEvidenceRefs: [],
    recommendedRecoveryAction: params.recommendedRecoveryAction,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return repo.upsertConfidenceCalibrationResult(result);
}

export function deriveConfidenceAlignment(
  confidenceLevel: Phase3ConfidenceLevel,
  evidenceStrength: number
): Phase3ConfidenceCalibrationResult['alignmentStatus'] {
  return deriveAlignmentStatus(confidenceLevel, evidenceStrength);
}

export function deriveConfidenceTrend(
  observations: Phase3ConfidenceObservation[]
): 'improving' | 'declining' | 'stable' | 'unstable' | 'insufficient' {
  if (observations.length < 2) return 'insufficient';
  const recent = observations.slice(0, Math.min(5, observations.length));
  const scores = recent.map((o) => confidenceScore(o.confidenceLevel));
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  const firstAvg = firstHalf.reduce((s, v) => s + v, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((s, v) => s + v, 0) / secondHalf.length;
  const diff = secondAvg - firstAvg;
  if (diff > 1) return 'improving';
  if (diff < -1) return 'declining';
  const variance = scores.reduce((s, v) => s + Math.abs(v - (firstAvg + secondAvg) / 2), 0) / scores.length;
  if (variance > 2) return 'unstable';
  return 'stable';
}

export function dedupeConfidenceObservations(
  observations: Phase3ConfidenceObservation[]
): Phase3ConfidenceObservation[] {
  const seen = new Set<string>();
  return observations.filter((o) => {
    const key = `${o.studentId}-${o.objectiveId || ''}-${o.confidenceLevel}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function limitConfidenceObservations(
  observations: Phase3ConfidenceObservation[],
  max = 50
): Phase3ConfidenceObservation[] {
  return observations.slice(0, max);
}

function buildCalibrationSafeSummary(
  alignmentStatus: Phase3ConfidenceCalibrationResult['alignmentStatus'],
  confidenceLevel: Phase3ConfidenceLevel,
  sourceTruthStatus?: string
): string {
  if (sourceTruthStatus === 'source_required') {
    return 'This confidence check needs an approved source before it can continue.';
  }
  if (sourceTruthStatus === 'blocked') {
    return 'This confidence check is blocked by missing source context.';
  }
  switch (alignmentStatus) {
    case 'over_confident':
      return 'Your confidence and evidence do not fully match yet. A short recall check may help.';
    case 'under_confident':
      return 'You know this more than you think. A teach-back may show your real progress.';
    case 'unstable':
      return 'Your confidence varies. A short review session may help stabilize your understanding.';
    case 'missing':
      return 'Show what you know with a quick check to help us understand your confidence.';
    case 'aligned':
      if (confidenceLevel === 'very_confident' || confidenceLevel === 'know_this') {
        return 'Your confidence matches your evidence well.';
      }
      return 'Your confidence and evidence are aligned. Keep going.';
    default:
      return 'Confidence calibration completed.';
  }
}
