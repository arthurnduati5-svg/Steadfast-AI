import {
  TeacherSafeSourceTruthResult,
  TeacherSafeSourceTruthStatus,
  TeacherSafeReasonCode,
} from '../contracts/teacherSafeInsightContracts';

export interface EvidenceSourceInfo {
  sourceQuality: 'real' | 'demo' | 'fallback' | 'synthetic_test' | 'unknown' | 'stale' | 'expired';
  isContentGap?: boolean;
  isDeenReferral?: boolean;
  isBlockedAnswerKey?: boolean;
  isBlockedModelAnswer?: boolean;
}

export function evaluateSourceTruth(
  sources: EvidenceSourceInfo[],
): TeacherSafeSourceTruthResult {
  if (sources.length === 0) {
    return {
      status: 'insufficient',
      canSupportTeacherInsight: false,
      realCount: 0,
      nonRealCount: 0,
      reasonCodes: ['no_safe_learning_evidence_yet'],
    };
  }

  let realCount = 0;
  let nonRealCount = 0;
  let hasContentGap = false;
  let hasDeenReferral = false;
  let hasBlockedAnswerKey = false;
  let hasBlockedModelAnswer = false;
  let hasStale = false;
  let hasExpired = false;
  let hasUnknown = false;

  for (const source of sources) {
    switch (source.sourceQuality) {
      case 'real':
        realCount++;
        break;
      case 'stale':
        realCount++;
        hasStale = true;
        break;
      default:
        nonRealCount++;
        break;
    }
    if (source.isContentGap) hasContentGap = true;
    if (source.isDeenReferral) hasDeenReferral = true;
    if (source.isBlockedAnswerKey) hasBlockedAnswerKey = true;
    if (source.isBlockedModelAnswer) hasBlockedModelAnswer = true;
    if (source.sourceQuality === 'expired') hasExpired = true;
    if (source.sourceQuality === 'unknown') hasUnknown = true;
  }

  const reasonCodes: TeacherSafeReasonCode[] = [];
  let status: TeacherSafeSourceTruthStatus;

  if (hasExpired && realCount === 0) {
    status = 'expired';
    reasonCodes.push('evidence_expired');
  } else if (hasContentGap) {
    status = 'content_gap';
    reasonCodes.push('content_gap_no_curriculum_context');
  } else if (hasDeenReferral) {
    status = 'source_required';
    reasonCodes.push('deen_referral_created');
  } else if (realCount > 0 && nonRealCount > 0) {
    status = 'mixed';
  } else if (realCount > 0) {
    status = 'real';
  } else   if (nonRealCount === sources.length) {
    const allDemo = sources.every(s => s.sourceQuality === 'demo');
    const allFallback = sources.every(s => s.sourceQuality === 'fallback');
    const allSynthetic = sources.every(s => s.sourceQuality === 'synthetic_test');
    const allUnknown = sources.every(s => s.sourceQuality === 'unknown');
    if (allDemo) {
      status = 'demo';
      reasonCodes.push('evidence_demo_only');
    } else if (allFallback) {
      status = 'fallback';
      reasonCodes.push('evidence_fallback_only');
    } else if (allSynthetic) {
      status = 'synthetic_test';
      reasonCodes.push('evidence_synthetic_only');
    } else if (allUnknown) {
      status = 'unknown';
    } else {
      status = 'insufficient';
    }
  } else if (hasUnknown) {
    status = 'unknown';
  } else {
    status = 'insufficient';
  }

  if (hasBlockedAnswerKey) reasonCodes.push('answer_key_safety_event');
  if (hasBlockedModelAnswer) reasonCodes.push('model_answer_safety_event');
  if (hasStale && realCount > 0) reasonCodes.push('evidence_stale');
  if (hasExpired && status !== 'expired') reasonCodes.push('evidence_expired');

  const canSupportTeacherInsight = status === 'real' || status === 'mixed';

  return {
    status,
    canSupportTeacherInsight,
    realCount,
    nonRealCount,
    reasonCodes,
  };
}

export function canSupportRealTeacherInsight(result: TeacherSafeSourceTruthResult): boolean {
  return result.canSupportTeacherInsight;
}

export function canSupportRealSupportQueueRecommendation(result: TeacherSafeSourceTruthResult): boolean {
  return result.status === 'real' || (result.status === 'mixed' && result.realCount >= 2);
}

export function canSupportRealNextAction(result: TeacherSafeSourceTruthResult): boolean {
  return result.status === 'real' || result.status === 'mixed';
}

export function canSupportClassLevelPattern(result: TeacherSafeSourceTruthResult): boolean {
  return result.realCount >= 3;
}
