import type {
  LearningEffectivenessSummary,
  ProductConstitutionHealth,
} from '../lib/types';
import { getLearningEffectivenessSummary } from './learningEffectivenessService';

type HealthGrade = 'strong' | 'mixed' | 'weak';

function safeNumber(value: unknown): number {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function scoreToHealth(score: number): HealthGrade {
  if (score >= 0.7) return 'strong';
  if (score >= 0.4) return 'mixed';
  return 'weak';
}

function buildTutoringDiscipline(summary: LearningEffectivenessSummary): {
  grade: HealthGrade;
  note?: string;
} {
  const positiveSignals =
    safeNumber(summary.effortSignals.attempted_before_help) +
    safeNumber(summary.effortSignals.selected_try_again) +
    safeNumber(summary.learningSignals.correction_after_feedback);

  const riskSignals =
    safeNumber(summary.productIntegritySignals.no_attempt_before_solution_rate) +
    safeNumber(summary.productIntegritySignals.excessive_answer_dumping_rate) +
    safeNumber(summary.productIntegritySignals.answer_dump_risk_detected) +
    safeNumber(summary.productIntegritySignals.noisy_or_overlong_response_rate);

  const score = positiveSignals / Math.max(positiveSignals + riskSignals, 1);
  const grade = scoreToHealth(score);
  if (grade === 'weak') {
    return { grade, note: 'Tutor turns are trending answer-heavy relative to effort prompts.' };
  }
  if (grade === 'mixed') {
    return { grade, note: 'Tutor discipline is mixed; effort prompts and pacing can be tightened.' };
  }
  return { grade, note: 'Tutor pacing and effort-first guidance are generally healthy.' };
}

function buildMultilingualConsistency(summary: LearningEffectivenessSummary): {
  grade: HealthGrade;
  note?: string;
} {
  const driftSignals =
    safeNumber(summary.multilingualSignals.language_drift_rate) +
    safeNumber(summary.productIntegritySignals.language_drift_rate);
  const positiveSignals =
    safeNumber(summary.multilingualSignals.response_language_match_rate) +
    safeNumber(summary.multilingualSignals.bilingual_mode_stability) +
    safeNumber(summary.multilingualSignals.voice_language_mismatch_handled);
  const score = positiveSignals / Math.max(positiveSignals + driftSignals, 1);
  const grade = scoreToHealth(score);
  if (grade === 'weak') return { grade, note: 'Language drift is high relative to stable multilingual behavior.' };
  if (grade === 'mixed') return { grade, note: 'Multilingual behavior is usable but still shows occasional drift.' };
  return { grade, note: 'Multilingual response behavior is stable and intentional.' };
}

function buildTrustAndHonesty(summary: LearningEffectivenessSummary): {
  grade: HealthGrade;
  note?: string;
} {
  const honestySignals =
    safeNumber(summary.productIntegritySignals.fallback_honesty_rate) +
    safeNumber(summary.productIntegritySignals.fallback_notice_honest);
  const unclearSignals =
    safeNumber(summary.productIntegritySignals.fallback_notice_shown) -
    safeNumber(summary.productIntegritySignals.fallback_notice_honest);
  const score = honestySignals / Math.max(honestySignals + Math.max(0, unclearSignals), 1);
  const grade = scoreToHealth(score);
  if (grade === 'weak') return { grade, note: 'Fallback transparency appears inconsistent in this period.' };
  if (grade === 'mixed') return { grade, note: 'Fallback honesty is present but not yet consistently strong.' };
  return { grade, note: 'Fallback and uncertainty signaling are generally transparent.' };
}

function buildPassivityRisk(summary: LearningEffectivenessSummary): ProductConstitutionHealth['passivityRisk'] {
  const activeSignals =
    safeNumber(summary.effortSignals.attempted_before_help) +
    safeNumber(summary.effortSignals.retried_after_correction) +
    safeNumber(summary.learningSignals.practice_completion);
  const passiveSignals =
    safeNumber(summary.productIntegritySignals.no_attempt_before_solution_rate) +
    safeNumber(summary.productIntegritySignals.excessive_answer_dumping_rate) +
    safeNumber(summary.productIntegritySignals.answer_dump_risk_detected);

  const passiveRatio = passiveSignals / Math.max(activeSignals + passiveSignals, 1);
  if (passiveRatio >= 0.55) return 'high';
  if (passiveRatio >= 0.3) return 'medium';
  return 'low';
}

export async function getProductConstitutionHealth(args: {
  userId: string;
  days?: number;
  summary?: LearningEffectivenessSummary;
}): Promise<ProductConstitutionHealth> {
  const summary = args.summary || (await getLearningEffectivenessSummary({ userId: args.userId, days: args.days }));
  const tutoringDiscipline = buildTutoringDiscipline(summary);
  const multilingual = buildMultilingualConsistency(summary);
  const trust = buildTrustAndHonesty(summary);
  const passivityRisk = buildPassivityRisk(summary);

  const notes: string[] = [];
  if (summary.notes?.length) notes.push(...summary.notes.slice(0, 6));
  if (tutoringDiscipline.note) notes.push(tutoringDiscipline.note);
  if (multilingual.note) notes.push(multilingual.note);
  if (trust.note) notes.push(trust.note);
  if (summary.revisionVitality.notes?.length) {
    notes.push(...summary.revisionVitality.notes.slice(0, 3));
  }

  return {
    passivityRisk,
    revisionVitality: summary.revisionVitality.vitality,
    tutoringDiscipline: tutoringDiscipline.grade,
    multilingualConsistency: multilingual.grade,
    trustAndHonesty: trust.grade,
    notes,
  };
}
