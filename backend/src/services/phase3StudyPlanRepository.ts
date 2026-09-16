import type { Phase3StudyPlan, Phase3StudyPlanStep } from '../contracts/phase3StudyPlanContracts';

export class Phase3StudyPlanRepository {
  private readonly plans: Phase3StudyPlan[] = [];
  private readonly steps: Phase3StudyPlanStep[] = [];

  listStudyPlansForLearner(schoolId: string, studentId: string): Phase3StudyPlan[] {
    return this.plans.filter((plan) => plan.schoolId === schoolId && plan.studentId === studentId);
  }

  listStudyPlanSteps(planId: string): Phase3StudyPlanStep[] {
    return this.steps.filter((step) => step.planId === planId);
  }

  getStudyPlanStep(stepId: string): Phase3StudyPlanStep | undefined {
    return this.steps.find((step) => step.stepId === stepId);
  }

  listTeacherStudyPlanOverviews(schoolId: string, teacherId?: string) {
    return this.plans
      .filter((plan) => plan.schoolId === schoolId)
      .map((plan) => ({ ...plan, teacherId: teacherId || null }));
  }
}

export const phase3StudyPlanRepository = new Phase3StudyPlanRepository();
