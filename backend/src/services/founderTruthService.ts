import type { FounderTruthSummary } from '../lib/types';
import { getInterventionEffectiveness, getWeakTopics } from './studySupportService';
import { getProductConstitutionHealth } from './constitutionHealthService';
import { getLearningEffectivenessSummary } from './learningEffectivenessService';

function safeNumber(value: unknown): number {
  const numeric = Number(value || 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function pushIfTruthy(target: string[], value: string | null | undefined) {
  if (value && value.trim()) target.push(value.trim());
}

export async function getFounderTruthSummary(args: {
  userId: string;
  days?: number;
}): Promise<FounderTruthSummary> {
  const summary = await getLearningEffectivenessSummary({ userId: args.userId, days: args.days });
  const constitution = await getProductConstitutionHealth({
    userId: args.userId,
    days: args.days,
    summary,
  });
  const [interventionEffectiveness, weakTopics] = await Promise.all([
    getInterventionEffectiveness(args.userId),
    getWeakTopics(args.userId),
  ]);

  const strengths: string[] = [];
  const weaknesses: string[] = [];
  const emergingRisks: string[] = [];
  const promisingSignals: string[] = [];
  const interventionInsights: string[] = [];
  const revisionInsights: string[] = [];
  const multilingualInsights: string[] = [];
  const voiceInsights: string[] = [];
  const researchVideoInsights: string[] = [];
  const recommendedNextFixes: string[] = [];

  if (constitution.passivityRisk === 'low') {
    strengths.push('Learner activity signals suggest students are attempting before heavy assistance.');
  } else {
    weaknesses.push('Passivity risk is elevated and students may be receiving answers too early.');
    recommendedNextFixes.push('Tighten hint-first and retry-first tutor scaffolding in high-risk subjects.');
  }

  if (constitution.revisionVitality === 'strong') {
    strengths.push('Revision is being reused meaningfully rather than acting as dead storage.');
  } else if (constitution.revisionVitality === 'mixed') {
    weaknesses.push('Revision reuse is mixed; some saved items are still not reactivated enough.');
    recommendedNextFixes.push('Increase quiz and due-review prompts for recently saved revision items.');
  } else {
    weaknesses.push('Revision vitality is weak with too many items not revisited.');
    emergingRisks.push('Revision may become a storage archive instead of an active learning loop.');
    recommendedNextFixes.push('Introduce stronger due-now queue nudges and revision quiz activation.');
  }

  if (constitution.multilingualConsistency === 'strong') {
    strengths.push('Learning-language consistency is stable across recent turns.');
  } else {
    weaknesses.push('Multilingual consistency needs improvement to avoid language drift.');
    recommendedNextFixes.push('Prioritize strict response-language enforcement and bilingual mode guardrails.');
  }

  if (constitution.trustAndHonesty !== 'strong') {
    emergingRisks.push('Fallback transparency and trust signaling need strengthening.');
    recommendedNextFixes.push('Increase explicit source/transcript limitation notices in weak-evidence turns.');
  }

  const topInterventions = interventionEffectiveness.slice(0, 4);
  for (const insight of topInterventions) {
    const trendText =
      insight.recentTrend === 'up'
        ? 'improving'
        : insight.recentTrend === 'down'
          ? 'declining'
          : 'steady';
    interventionInsights.push(
      `${insight.interventionType.replace(/_/g, ' ')} shows ${trendText} impact with ${insight.evidenceCount} evidence point(s).`
    );
    if (insight.improvementRate >= 0.6) {
      promisingSignals.push(
        `${insight.interventionType.replace(/_/g, ' ')} is a high-performing intervention candidate.`
      );
    }
  }

  if (weakTopics.length > 0) {
    const lead = weakTopics.slice(0, 3).map((entry) => entry.topic).join(', ');
    revisionInsights.push(`Weak-topic revision pressure remains highest around: ${lead}.`);
  }

  pushIfTruthy(
    revisionInsights,
    summary.revisionVitality.notes?.[0] ? `Revision signal: ${summary.revisionVitality.notes[0]}` : null
  );
  pushIfTruthy(
    multilingualInsights,
    constitution.multilingualConsistency === 'strong'
      ? 'Multilingual tutoring remains stable in this period.'
      : 'Language drift signals appeared and should be reviewed per route/flow.'
  );

  const voiceHelped = safeNumber(summary.voiceSignals.voice_mode_helped);
  const voiceUsed = safeNumber(summary.voiceSignals.voice_mode_used);
  if (voiceUsed > 0) {
    voiceInsights.push(`Voice mode usage events: ${voiceUsed}.`);
  }
  if (voiceHelped > 0) {
    voiceInsights.push('Voice mode shows direct helpfulness signals in recent sessions.');
  } else if (voiceUsed > 0) {
    voiceInsights.push('Voice mode is used, but measured learning lift remains limited so far.');
  }

  const researchHelped = safeNumber(summary.researchVideoSignals.research_mode_helped);
  const videoHelped = safeNumber(summary.researchVideoSignals.video_recommendation_helped);
  const transcriptUnavailable = safeNumber(summary.researchVideoSignals.transcript_unavailable_rate);

  if (researchHelped > 0 || videoHelped > 0) {
    researchVideoInsights.push('Research and video pathways are showing measurable learning support signals.');
  } else {
    researchVideoInsights.push('Research/video effectiveness signals are still limited and need stronger evidence loops.');
    recommendedNextFixes.push('Instrument follow-up outcomes after research and recommended video usage.');
  }
  if (transcriptUnavailable > 0) {
    researchVideoInsights.push(`Transcript unavailable signal count: ${transcriptUnavailable}.`);
  }

  if (constitution.tutoringDiscipline !== 'strong') {
    recommendedNextFixes.push('Audit long responses and direct-answer leakage in tutoring turns.');
  }

  if (!strengths.length) strengths.push('Early quality signals exist, but sustained evidence depth is still building.');
  if (!weaknesses.length && constitution.passivityRisk === 'low') {
    weaknesses.push('No major drift flags in this window, but maintain strict constitution monitoring.');
  }

  return {
    periodLabel: summary.periodLabel,
    strengths,
    weaknesses,
    emergingRisks,
    promisingSignals,
    interventionInsights,
    revisionInsights,
    multilingualInsights,
    voiceInsights,
    researchVideoInsights,
    recommendedNextFixes,
  };
}
