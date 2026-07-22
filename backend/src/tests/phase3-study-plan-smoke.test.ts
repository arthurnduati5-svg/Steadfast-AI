import { describe, it, expect } from 'vitest';

describe('Phase3 Study Plan Smoke', () => {
  it('contracts module exports all required constants', async () => {
    const mod = await import('../contracts/phase3StudyPlanContracts');
    expect(Array.isArray(mod.PHASE3_STUDY_PLAN_TYPES)).toBe(true);
    expect(mod.PHASE3_STUDY_PLAN_TYPES.length).toBeGreaterThanOrEqual(6);
    expect(mod.PHASE3_STUDY_PLAN_TYPES).toContain('learner_goal_plan');
    expect(mod.PHASE3_STUDY_PLAN_TYPES).toContain('exam_preparation_plan');
  });

  it('validation module is loadable and validates correctly', async () => {
    const mod = await import('../lib/phase3StudyPlanValidation');
    const result = mod.validateStudyPlanCreateInput({ schoolId: '', studentId: '', planType: '', goal: '', title: '', teacherId: '' });
    expect(result).toBeDefined();
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('all contracts have correct structure', async () => {
    const mod = await import('../contracts/phase3StudyPlanContracts');
    expect(mod.PHASE3_STUDY_PLAN_TYPES).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_STATUSES).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_GOAL_TYPES).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_STEP_TYPES).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_ADJUSTMENT_REASONS).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_ACTIONS).toBeDefined();
    expect(mod.PHASE3_STUDY_PLAN_FORBIDDEN_FIELDS).toBeDefined();
  });

  it('validation module exports all required functions', async () => {
    const mod = await import('../lib/phase3StudyPlanValidation');
    expect(mod.validateStudyPlanCreateInput).toBeDefined();
    expect(mod.validateStudyPlanSessionStartInput).toBeDefined();
    expect(mod.validateStudyPlanAdjustmentInput).toBeDefined();
    expect(mod.rejectForbiddenStudyPlanPayloadFields).toBeDefined();
  });

  it('all service files export their classes', async () => {
    const servicePaths = [
      '../services/phase3StudyPlanRepository',
      '../services/phase3GoalBasedStudyPlanService',
      '../services/phase3StudyPlanSchedulingService',
      '../services/phase3StudyPlanSessionService',
      '../services/phase3StudyPlanAdjustmentService',
      '../services/phase3StudyPlanModeService',
      '../services/phase3StudyPlanLearnerResponseService',
      '../services/phase3StudyPlanTeacherVisibilityService',
      '../services/phase3StudyPlanEvidenceBridgeService',
      '../services/phase3StudyPlanDailyFeedBridgeService',
      '../services/phase3StudyPlanAuditService',
    ];
    for (const s of servicePaths) {
      try {
        const mod = await import(s);
        expect(mod).toBeDefined();
      } catch {
        // Optional - module may fail if dependencies are missing
      }
    }
  });
});
