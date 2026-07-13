import { describe, it, expect } from 'vitest';
import { reviewSocraticIntegrity } from '../services/task035SocraticIntegrityReviewService';
import { reviewDeenGovernance } from '../services/task035DeenGovernanceReviewService';
import { reviewCurriculumSource } from '../services/task035CurriculumSourceReviewService';

describe('task035 continuity from task033 (canary observation)', () => {
  it('socratic integrity review importable', () => {
    expect(typeof reviewSocraticIntegrity).toBe('function');
  });

  it('deen governance review importable', () => {
    expect(typeof reviewDeenGovernance).toBe('function');
  });

  it('curriculum source review importable', () => {
    expect(typeof reviewCurriculumSource).toBe('function');
  });

  it('socratic review preserves key policies', () => {
    const result = reviewSocraticIntegrity();
    expect(result.socraticGatePassed).toBe(true);
    expect(result.noFinalAnswerPolicyWeakened).toBe(false);
    expect(result.answerKeyExposureDetected).toBe(false);
    expect(result.homeworkShortcutDetected).toBe(false);
  });

  it('deen review blocks fatwa and private text exposure', () => {
    const result = reviewDeenGovernance();
    expect(result.deenGatePassed).toBe(true);
    expect(result.fatwaEngineIntroduced).toBe(false);
    expect(result.inventedRulingDetected).toBe(false);
    expect(result.deenSensitivePrivateTextExposed).toBe(false);
  });

  it('curriculum review requires approved scope', () => {
    const result = reviewCurriculumSource();
    expect(result.curriculumGatePassed).toBe(true);
    expect(result.approvedCurriculumScopeRequired).toBe(true);
    expect(result.approvedSourceScopeRequired).toBe(true);
    expect(result.unapprovedSubjectBlocked).toBe(true);
  });
});
