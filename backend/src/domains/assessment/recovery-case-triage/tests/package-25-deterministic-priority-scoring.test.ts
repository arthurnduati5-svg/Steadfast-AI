import { describe, it, expect, beforeEach } from 'vitest';
import { RecoveryCasePriorityEngineService } from '../services/recoveryCasePriorityEngineService';
import type { RecoveryCasePriorityInput } from '../contracts/recoveryCasePriorityContracts';

describe('Package 25 - Deterministic Priority Scoring', () => {
  let engine: RecoveryCasePriorityEngineService;

  beforeEach(() => {
    engine = new RecoveryCasePriorityEngineService();
  });

  it('Vector A: risk=critical(35) + activeBlock(30) + adminReview(20) + age>=14(15) = 100, band=critical_review', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'critical',
      hasActiveBlocker: true,
      needsAdminReview: true,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 14,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    expect(score).toBe(100);
    expect(band).toBe('critical_review');
  });

  it('Vector B: risk=high(25) + teacherReview(12) + stale(10) + age7(10) = 57, band=normal', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'high',
      hasActiveBlocker: false,
      needsAdminReview: false,
      needsTeacherReview: true,
      isBoardStale: true,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 7,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    expect(score).toBe(57);
    expect(band).toBe('normal');
  });

  it('Vector C: risk=medium(15) + authBlocked(20) + simFailed(15) + age3(5) = 55, band=normal', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'medium',
      hasActiveBlocker: false,
      needsAdminReview: false,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: true,
      simulationFailed: true,
      caseAgeDays: 3,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    expect(score).toBe(55);
    expect(band).toBe('normal');
  });

  it('Vector D: no factors = 0, band=deferred', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'none',
      hasActiveBlocker: false,
      needsAdminReview: false,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 0,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    expect(score).toBe(0);
    expect(band).toBe('deferred');
  });

  it('Vector E: sum exceeds 100, stored score=100, band=critical_review', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'critical',
      hasActiveBlocker: true,
      needsAdminReview: true,
      needsTeacherReview: true,
      isBoardStale: true,
      authorizationBlocked: true,
      simulationFailed: true,
      caseAgeDays: 21,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    expect(score).toBe(100);
    expect(band).toBe('critical_review');
  });

  it('same input produces same result (determinism)', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'high',
      hasActiveBlocker: true,
      needsAdminReview: false,
      needsTeacherReview: true,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 10,
    };
    const score1 = engine.calculatePriorityScore(input);
    const score2 = engine.calculatePriorityScore(input);
    const score3 = engine.calculatePriorityScore(input);
    expect(score1).toBe(score2);
    expect(score2).toBe(score3);
    expect(score1).toBe(77);
  });

  it('score is capped at 100', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'critical',
      hasActiveBlocker: true,
      needsAdminReview: true,
      needsTeacherReview: true,
      isBoardStale: true,
      authorizationBlocked: true,
      simulationFailed: true,
      caseAgeDays: 100,
    };
    const score = engine.calculatePriorityScore(input);
    expect(score).toBeLessThanOrEqual(100);
    expect(score).toBe(100);
  });

  it('only locked factors affect scoring (no score from untriggered factors)', () => {
    const baseline: RecoveryCasePriorityInput = {
      riskLevel: 'none',
      hasActiveBlocker: false,
      needsAdminReview: false,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 0,
    };
    const baselineScore = engine.calculatePriorityScore(baseline);
    expect(baselineScore).toBe(0);

    const withRisk: RecoveryCasePriorityInput = { ...baseline, riskLevel: 'high' };
    expect(engine.calculatePriorityScore(withRisk)).toBe(25);

    const withBlocker: RecoveryCasePriorityInput = { ...baseline, hasActiveBlocker: true };
    expect(engine.calculatePriorityScore(withBlocker)).toBe(30);

    const withAdmin: RecoveryCasePriorityInput = { ...baseline, needsAdminReview: true };
    expect(engine.calculatePriorityScore(withAdmin)).toBe(20);

    const withTeacher: RecoveryCasePriorityInput = { ...baseline, needsTeacherReview: true };
    expect(engine.calculatePriorityScore(withTeacher)).toBe(12);

    const withStale: RecoveryCasePriorityInput = { ...baseline, isBoardStale: true };
    expect(engine.calculatePriorityScore(withStale)).toBe(10);

    const withAuthBlock: RecoveryCasePriorityInput = { ...baseline, authorizationBlocked: true };
    expect(engine.calculatePriorityScore(withAuthBlock)).toBe(20);

    const withSimFail: RecoveryCasePriorityInput = { ...baseline, simulationFailed: true };
    expect(engine.calculatePriorityScore(withSimFail)).toBe(15);
  });

  it('negative scores are not possible (min 0)', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'none',
      hasActiveBlocker: false,
      needsAdminReview: false,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 0,
    };
    const score = engine.calculatePriorityScore(input);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBe(0);
  });

  it('hard-block conditions block the assessment via validateRequiredReferences', () => {
    const blocked1 = engine.validateRequiredReferences('', 'snap-1', 'card-1', 'plan-1');
    expect(blocked1).toContain('MISSING_SCHOOL_ID');

    const blocked2 = engine.validateRequiredReferences('school-1', '', 'card-1', 'plan-1');
    expect(blocked2).toContain('MISSING_BOARD_SNAPSHOT_ID');

    const blocked3 = engine.validateRequiredReferences('school-1', 'snap-1', '', 'plan-1');
    expect(blocked3).toContain('MISSING_BOARD_CARD_ID');

    const blocked4 = engine.validateRequiredReferences('school-1', 'snap-1', 'card-1', '');
    expect(blocked4).toContain('MISSING_RESULT_RECOVERY_PLAN_ID');

    const blocked5 = engine.validateRequiredReferences('', '', '', '');
    expect(blocked5.length).toBe(4);
  });

  it('calculateRiskRank returns correct risk rank', () => {
    expect(engine.calculateRiskRank('critical')).toBe('critical');
    expect(engine.calculateRiskRank('high')).toBe('high');
    expect(engine.calculateRiskRank('medium')).toBe('medium');
    expect(engine.calculateRiskRank('low')).toBe('low');
    expect(engine.calculateRiskRank('none')).toBe('none');
    expect(engine.calculateRiskRank('unknown')).toBe('none');
  });

  it('buildPriorityFactors returns array with correct factor codes and points', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'high',
      hasActiveBlocker: true,
      needsAdminReview: false,
      needsTeacherReview: true,
      isBoardStale: true,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 14,
    };
    const factors = engine.buildPriorityFactors(input);
    const codes = factors.map(f => f.code);
    expect(codes).toContain('risk_level');
    expect(codes).toContain('active_blocker');
    expect(codes).toContain('teacher_review_required');
    expect(codes).toContain('board_stale');
    expect(codes).toContain('case_age');
    expect(codes).not.toContain('admin_review_required');
    expect(codes).not.toContain('authorization_preview_concern');
    expect(codes).not.toContain('simulation_concern');

    const riskFactor = factors.find(f => f.code === 'risk_level');
    expect(riskFactor!.appliedPoints).toBe(25);

    const blockerFactor = factors.find(f => f.code === 'active_blocker');
    expect(blockerFactor!.appliedPoints).toBe(30);
  });

  it('buildSafePriorityExplanation includes score, band, factors, and policy version', () => {
    const input: RecoveryCasePriorityInput = {
      riskLevel: 'high',
      hasActiveBlocker: true,
      needsAdminReview: false,
      needsTeacherReview: false,
      isBoardStale: false,
      authorizationBlocked: false,
      simulationFailed: false,
      caseAgeDays: 0,
    };
    const score = engine.calculatePriorityScore(input);
    const band = engine.determinePriorityBand(score);
    const riskRank = engine.calculateRiskRank(input.riskLevel);
    const factors = engine.buildPriorityFactors(input);

    const assessment = {
      priorityAssessmentId: 'pa-1',
      totalScore: score,
      priorityBand: band,
      riskRank: riskRank,
      scoringPolicyVersion: 'RECOVERY_CASE_TRIAGE_PRIORITY_V1',
    } as any;

    const explanation = engine.buildSafePriorityExplanation(assessment, [] as any);
    expect(explanation).toContain('pa-1');
    expect(explanation).toContain('Score:');

    const explanationWithFactors = engine.buildSafePriorityExplanation(assessment, factors.map(f => ({
      priorityFactorId: 'pf-1',
      priorityAssessmentId: 'pa-1',
      schoolId: 'school-1',
      factorCode: f.code,
      appliedPoints: f.appliedPoints,
      factorWeight: f.appliedPoints,
      factorExplanation: f.explanation,
      factorSourceJson: {},
      createdByActorId: 'actor-1',
      createdByRole: 'teacher',
      createdAt: new Date().toISOString(),
    })));
    expect(explanationWithFactors).toContain('risk_level');
    expect(explanationWithFactors).toContain('active_blocker');
    expect(explanationWithFactors).toContain('RECOVERY_CASE_TRIAGE_PRIORITY_V1');
  });
});
