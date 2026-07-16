import { v4 as uuid } from 'uuid';
import { RecoveryCasePriorityBand, RecoveryCaseRiskRank, SCORING_POLICY_VERSION, RecoveryCaseTriageCommandContext } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCasePriorityInput, RecoveryCasePriorityAssessment, RecoveryCasePriorityFactor } from '../contracts/recoveryCasePriorityContracts';
import { RecoveryCaseQueueCandidate, RecoveryCaseQueueRankingResult } from '../contracts/recoveryCaseQueueContracts';

const RISK_SCORES: Record<string, number> = {
  critical: 35, high: 25, medium: 15, low: 5, none: 0,
};

const AGE_SCORES: Record<string, number> = {
  '14+': 15, '7-13': 10, '3-6': 5, '0-2': 0,
};

function getAgeBand(days: number): string {
  if (days >= 14) return '14+';
  if (days >= 7) return '7-13';
  if (days >= 3) return '3-6';
  return '0-2';
}

function calculateAgeScore(days: number): number {
  const band = getAgeBand(days);
  return AGE_SCORES[band] ?? 0;
}

function determineBand(score: number): RecoveryCasePriorityBand {
  if (score >= 80) return 'critical_review';
  if (score >= 60) return 'high';
  if (score >= 35) return 'normal';
  if (score >= 1) return 'low';
  return 'deferred';
}

function riskRankValue(rank: RecoveryCaseRiskRank | string): number {
  const map: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, none: 1 };
  return map[rank] ?? 0;
}

const RISK_RANK_ORDER: RecoveryCaseRiskRank[] = ['critical', 'high', 'medium', 'low', 'none'];

export class RecoveryCasePriorityEngineService {

  calculatePriorityScore(input: RecoveryCasePriorityInput): number {
    let total = 0;
    total += RISK_SCORES[input.riskLevel] ?? 0;
    if (input.hasActiveBlocker) total += 30;
    if (input.needsAdminReview) total += 20;
    if (input.needsTeacherReview) total += 12;
    if (input.isBoardStale) total += 10;
    if (input.authorizationBlocked) total += 20;
    if (input.simulationFailed) total += 15;
    total += calculateAgeScore(input.caseAgeDays);
    return Math.min(100, total);
  }

  determinePriorityBand(score: number): RecoveryCasePriorityBand {
    return determineBand(score);
  }

  calculateRiskRank(riskLevel: string): RecoveryCaseRiskRank {
    const lower = riskLevel.toLowerCase();
    if (RISK_RANK_ORDER.includes(lower as RecoveryCaseRiskRank)) return lower as RecoveryCaseRiskRank;
    return 'none';
  }

  buildPriorityFactors(input: RecoveryCasePriorityInput): Array<{ code: string; appliedPoints: number; explanation: string }> {
    const factors: Array<{ code: string; appliedPoints: number; explanation: string }> = [];
    const riskPts = RISK_SCORES[input.riskLevel] ?? 0;
    if (riskPts > 0) {
      factors.push({ code: 'risk_level', appliedPoints: riskPts, explanation: `Risk level ${input.riskLevel}: +${riskPts} points` });
    }
    if (input.hasActiveBlocker) {
      factors.push({ code: 'active_blocker', appliedPoints: 30, explanation: 'Active unresolved blocker: +30 points (capped at 30)' });
    }
    if (input.needsAdminReview) {
      factors.push({ code: 'admin_review_required', appliedPoints: 20, explanation: 'Admin review required: +20 points' });
    }
    if (input.needsTeacherReview) {
      factors.push({ code: 'teacher_review_required', appliedPoints: 12, explanation: 'Teacher review required: +12 points' });
    }
    if (input.isBoardStale) {
      factors.push({ code: 'board_stale', appliedPoints: 10, explanation: 'Board snapshot stale: +10 points' });
    }
    if (input.authorizationBlocked) {
      factors.push({ code: 'authorization_preview_concern', appliedPoints: 20, explanation: 'Authorization blocked/vetoed: +20 points' });
    }
    if (input.simulationFailed) {
      factors.push({ code: 'simulation_concern', appliedPoints: 15, explanation: 'Simulation failed/blocked: +15 points' });
    }
    const agePts = calculateAgeScore(input.caseAgeDays);
    if (agePts > 0) {
      factors.push({ code: 'case_age', appliedPoints: agePts, explanation: `Case age ${input.caseAgeDays} days: +${agePts} points` });
    }
    return factors;
  }

  validateRequiredReferences(schoolId: string, boardSnapshotId: string, boardCardId: string, resultRecoveryPlanId: string): string[] {
    const blocked: string[] = [];
    if (!schoolId) blocked.push('MISSING_SCHOOL_ID');
    if (!boardSnapshotId) blocked.push('MISSING_BOARD_SNAPSHOT_ID');
    if (!boardCardId) blocked.push('MISSING_BOARD_CARD_ID');
    if (!resultRecoveryPlanId) blocked.push('MISSING_RESULT_RECOVERY_PLAN_ID');
    return blocked;
  }

  validateChronology(oldestUnresolvedEvidenceAt: string | null | undefined): string[] {
    if (!oldestUnresolvedEvidenceAt) return [];
    const date = new Date(oldestUnresolvedEvidenceAt);
    if (isNaN(date.getTime())) return ['INVALID_EVIDENCE_DATE'];
    return [];
  }

  rankQueueCandidates(candidates: RecoveryCaseQueueCandidate[]): RecoveryCaseQueueRankingResult {
    if (candidates.length === 0) {
      return { queueSnapshotId: '', items: [], rankedCount: 0, totalCapacity: 0, exceededCount: 0 };
    }
    const sorted = this.applyStableTieBreaks(candidates);
    const ranked = sorted.map((c, i) => ({ ...c, queueRank: i + 1 } as RecoveryCaseQueueCandidate));
    return {
      queueSnapshotId: '',
      items: ranked,
      rankedCount: ranked.length,
      totalCapacity: 0,
      exceededCount: 0,
    };
  }

  applyStableTieBreaks(items: RecoveryCaseQueueCandidate[]): RecoveryCaseQueueCandidate[] {
    const clone = [...items];
    clone.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      const riskA = riskRankValue(a.riskRank);
      const riskB = riskRankValue(b.riskRank);
      if (riskB !== riskA) return riskB - riskA;
      if (a.boardCardId < b.boardCardId) return -1;
      if (a.boardCardId > b.boardCardId) return 1;
      return 0;
    });
    return clone;
  }

  buildSafePriorityExplanation(assessment: RecoveryCasePriorityAssessment, factors: RecoveryCasePriorityFactor[]): string {
    const factorLines = factors.map(f => `${f.factorCode}: ${f.appliedPoints}pts - ${f.factorExplanation}`);
    const band = assessment.priorityBand;
    const version = assessment.scoringPolicyVersion || SCORING_POLICY_VERSION;
    return [
      `Priority Assessment ${assessment.priorityAssessmentId}`,
      `Score: ${assessment.totalScore} | Band: ${band} | Risk: ${assessment.riskRank}`,
      '--- Factor Breakdown ---',
      ...factorLines,
      `--- Policy: ${version} ---`,
    ].join('\n');
  }

  calculateRequestHash(ctx: RecoveryCaseTriageCommandContext): string {
    const raw = `${ctx.schoolId}|${ctx.actorId}|${ctx.actorRole}|${ctx.correlationId}|${ctx.idempotencyKey}|${JSON.stringify(ctx.sourceRefsJson)}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }
}
