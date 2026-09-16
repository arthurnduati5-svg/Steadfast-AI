import type { Phase3StudyPlan, Phase3StudyPlanStep } from '../contracts/phase3StudyPlanContracts';

export class Phase3StudyPlanDailyFeedBridgeService {
  createDailyFeedItemsFromStudyPlan(plan: Phase3StudyPlan, steps: Phase3StudyPlanStep[]) {
    return steps
      .filter((step) => step.status === 'active')
      .map((step) => ({
        schoolId: plan.schoolId,
        studentId: plan.studentId,
        stepId: step.stepId,
        priority: 'medium',
        sourceType: 'study_plan_step',
        title: step.title,
        safeDescription: plan.safeDescription || 'This study plan step is ready for today.',
        safeReasonCode: step.reasonCode || 'study_plan_due',
        createdAt: step.createdAt,
      }));
  }
}

export const phase3StudyPlanDailyFeedBridgeService = new Phase3StudyPlanDailyFeedBridgeService();
