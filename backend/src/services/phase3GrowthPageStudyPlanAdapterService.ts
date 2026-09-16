import type {
  Phase3GrowthPageStudyPlanAdapterResult,
  Phase3GrowthPageCard,
  Phase3DueNowItem,
  Phase3GrowthPagePriority,
} from '../contracts/phase3GrowthPageContracts';
import type { Phase3StudyPlan, Phase3StudyPlanStep } from '../contracts/phase3StudyPlanContracts';
import { phase3StudyPlanDailyFeedBridgeService } from './phase3StudyPlanDailyFeedBridgeService';
import { phase3StudyPlanRepository } from './phase3StudyPlanRepository';

let cardCounter = 0;
let dueNowCounter = 0;
function nowISO(): string { return new Date().toISOString(); }
function cardId(): string { return `gpsp_${Date.now().toString(36)}_${(++cardCounter).toString(36)}`; }
function dueNowId(): string { return `gpsp_due_${Date.now().toString(36)}_${(++dueNowCounter).toString(36)}`; }

const sourceMessage = 'This item needs an approved source or teacher confirmation before you continue.';

export class Phase3GrowthPageStudyPlanAdapterService {
  loadStudyPlansForGrowthPage(schoolId: string, studentId: string): Phase3GrowthPageStudyPlanAdapterResult {
    if (!schoolId || !studentId) return this.buildStudyPlanAdapterEmptyState();
    const plans = phase3StudyPlanRepository.listStudyPlansForLearner(schoolId, studentId)
      .filter(plan => plan.schoolId === schoolId && plan.studentId === studentId && !plan.isArchived);
    const planCards = this.mapPlansToGrowthCards(plans);
    const dueNowItems = this.mapPlansToDueNow(plans);
    const blockedCards = this.mapPlansToBlockedCards(plans);
    return {
      planCards: this.dedupeCards(planCards),
      dueNowItems: this.dedupeDueNow(dueNowItems),
      blockedCards: this.dedupeCards(blockedCards),
      summary: this.mapStudyPlanFollowThroughToGrowthSummary(schoolId, studentId),
    };
  }

  mapStudyPlansToGrowthCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return this.loadStudyPlansForGrowthPage(schoolId, studentId).planCards;
  }

  mapStudyPlanStepsToDueNow(schoolId: string, studentId: string): Phase3DueNowItem[] {
    return this.loadStudyPlansForGrowthPage(schoolId, studentId).dueNowItems;
  }

  mapStudyPlanBlocksToGrowthCards(schoolId: string, studentId: string): Phase3GrowthPageCard[] {
    return this.loadStudyPlansForGrowthPage(schoolId, studentId).blockedCards;
  }

  mapStudyPlanFollowThroughToGrowthSummary(schoolId: string, studentId: string): string {
    const plans = phase3StudyPlanRepository.listStudyPlansForLearner(schoolId, studentId)
      .filter(plan => plan.schoolId === schoolId && plan.studentId === studentId && !plan.isArchived);
    if (plans.length === 0) return 'No active study plan signals yet.';
    const active = plans.filter(p => p.status === 'active').length;
    const completed = plans.filter(p => p.status === 'completed').length;
    const support = plans.filter(p => p.status === 'needs_teacher_support').length;
    const sourceRequired = plans.filter(p => p.status === 'source_required').length;
    return `${plans.length} study plan signal${plans.length === 1 ? '' : 's'} found. ${active} active, ${completed} completed, ${support} need teacher support, ${sourceRequired} need source confirmation.`;
  }

  buildStudyPlanAdapterEmptyState(): Phase3GrowthPageStudyPlanAdapterResult {
    return { planCards: [], dueNowItems: [], blockedCards: [], summary: 'No active study plan signals yet.' };
  }

  private mapPlansToGrowthCards(plans: Phase3StudyPlan[]): Phase3GrowthPageCard[] {
    const cards: Phase3GrowthPageCard[] = [];
    for (const plan of plans) {
      const steps = phase3StudyPlanRepository.listStudyPlanSteps(plan.planId).filter(step => step.schoolId === plan.schoolId);
      if (plan.status === 'active' || plan.status === 'needs_adjustment') {
        cards.push({
          cardId: cardId(),
          cardType: plan.status === 'needs_adjustment' ? 'weak_topic_lane' : 'study_plan_due',
          priority: plan.status === 'needs_adjustment' ? 'high' : 'medium',
          safeTitle: plan.title,
          safeSummary: plan.safeDescription || 'This study plan step is ready for today.',
          recommendedAction: plan.status === 'needs_adjustment' ? 'review_weak_topic' : 'open_study_plan',
          sourceType: 'study_plan',
          signalType: plan.status === 'needs_adjustment' ? 'objective_needs_rescue' : 'study_plan_due',
          studyPlanId: plan.planId,
          objectiveId: plan.goal.targetObjectiveIds[0],
          safeEvidenceRefs: plan.safeEvidenceRefs,
          safeReasonCodes: plan.safeReasonCodes,
          createdAt: plan.createdAt,
        });
      }
      for (const step of steps.filter(s => s.status === 'completed' && this.isToday(s.completedAt || s.updatedAt))) {
        cards.push(this.completedStepCard(plan, step));
      }
    }
    return cards;
  }

  private mapPlansToDueNow(plans: Phase3StudyPlan[]): Phase3DueNowItem[] {
    const items: Phase3DueNowItem[] = [];
    for (const plan of plans) {
      const bridgeItems = phase3StudyPlanDailyFeedBridgeService.createDailyFeedItemsFromStudyPlan(plan, phase3StudyPlanRepository.listStudyPlanSteps(plan.planId));
      for (const bridge of bridgeItems) {
        if (bridge.schoolId !== plan.schoolId || bridge.studentId !== plan.studentId) continue;
        if (bridge.priority === 'blocked' || bridge.sourceType === 'study_plan_step_blocked' || bridge.sourceType === 'study_plan_source_required') continue;
        if (bridge.sourceType === 'study_plan_completed_today') continue;
        items.push({
          dueNowItemId: dueNowId(),
          schoolId: plan.schoolId,
          studentId: plan.studentId,
          sourceType: 'study_plan',
          signalType: 'study_plan_due',
          priority: this.priorityFor(bridge.priority),
          safeTitle: bridge.title,
          safeSummary: bridge.safeDescription,
          recommendedAction: 'start_study_plan_step',
          objectiveId: phase3StudyPlanRepository.getStudyPlanStep(bridge.stepId || '')?.objectiveId || plan.goal.targetObjectiveIds[0],
          studyPlanId: plan.planId,
          studyPlanStepId: bridge.stepId,
          actionPayload: { planId: plan.planId, stepId: bridge.stepId || '' },
          isCompleted: false,
          safeEvidenceRefs: plan.safeEvidenceRefs,
          safeReasonCodes: [bridge.safeReasonCode],
          createdAt: bridge.createdAt,
          updatedAt: bridge.createdAt,
        });
      }
    }
    return items;
  }

  private mapPlansToBlockedCards(plans: Phase3StudyPlan[]): Phase3GrowthPageCard[] {
    const cards: Phase3GrowthPageCard[] = [];
    for (const plan of plans) {
      if (plan.status === 'source_required' || plan.sourceTruthStatus === 'source_required' || plan.status === 'blocked') {
        cards.push(this.blockedPlanCard(plan));
      }
      if (plan.status === 'needs_teacher_support') {
        cards.push(this.teacherSupportPlanCard(plan));
      }
      for (const step of phase3StudyPlanRepository.listStudyPlanSteps(plan.planId)) {
        if (step.schoolId !== plan.schoolId) continue;
        if (step.status === 'source_required' || step.sourceTruthStatus === 'source_required' || step.status === 'blocked') {
          cards.push(this.blockedStepCard(plan, step));
        }
        if (step.status === 'needs_teacher_support') {
          cards.push(this.teacherSupportStepCard(plan, step));
        }
      }
    }
    return cards;
  }

  private completedStepCard(plan: Phase3StudyPlan, step: Phase3StudyPlanStep): Phase3GrowthPageCard {
    return {
      cardId: cardId(),
      cardType: 'recently_improving',
      priority: 'low',
      safeTitle: step.title,
      safeSummary: 'You completed this study plan step today.',
      recommendedAction: 'view_progress_explanation',
      sourceType: 'study_plan',
      signalType: 'study_plan_completed',
      objectiveId: step.objectiveId,
      studyPlanId: plan.planId,
      safeEvidenceRefs: step.safeEvidenceRefs,
      safeReasonCodes: step.reasonCode ? [step.reasonCode] : plan.safeReasonCodes,
      createdAt: step.completedAt || step.updatedAt || step.createdAt,
    };
  }

  private blockedPlanCard(plan: Phase3StudyPlan): Phase3GrowthPageCard {
    return {
      cardId: cardId(),
      cardType: 'source_required',
      priority: 'blocked',
      safeTitle: plan.title,
      safeSummary: sourceMessage,
      recommendedAction: 'ask_teacher_for_source',
      sourceType: 'study_plan',
      signalType: 'source_required',
      studyPlanId: plan.planId,
      objectiveId: plan.goal.targetObjectiveIds[0],
      safeEvidenceRefs: plan.safeEvidenceRefs,
      safeReasonCodes: plan.safeReasonCodes.length ? plan.safeReasonCodes : ['study_plan_source_required'],
      createdAt: plan.createdAt,
    };
  }

  private blockedStepCard(plan: Phase3StudyPlan, step: Phase3StudyPlanStep): Phase3GrowthPageCard {
    return {
      ...this.blockedPlanCard(plan),
      cardId: cardId(),
      safeTitle: step.title || plan.title,
      studyPlanId: plan.planId,
      objectiveId: step.objectiveId,
      safeEvidenceRefs: step.safeEvidenceRefs,
      safeReasonCodes: step.reasonCode ? [step.reasonCode] : ['study_plan_source_required'],
      createdAt: step.createdAt,
    };
  }

  private teacherSupportPlanCard(plan: Phase3StudyPlan): Phase3GrowthPageCard {
    return {
      cardId: cardId(),
      cardType: 'teacher_support_needed',
      priority: 'urgent',
      safeTitle: plan.title,
      safeSummary: 'This area needs teacher support before the next step can continue.',
      recommendedAction: 'ask_teacher_for_help',
      sourceType: 'study_plan',
      signalType: 'teacher_support_required',
      studyPlanId: plan.planId,
      objectiveId: plan.goal.targetObjectiveIds[0],
      safeEvidenceRefs: plan.safeEvidenceRefs,
      safeReasonCodes: plan.safeReasonCodes.length ? plan.safeReasonCodes : ['study_plan_teacher_support_needed'],
      createdAt: plan.createdAt,
    };
  }

  private teacherSupportStepCard(plan: Phase3StudyPlan, step: Phase3StudyPlanStep): Phase3GrowthPageCard {
    return {
      ...this.teacherSupportPlanCard(plan),
      cardId: cardId(),
      safeTitle: step.title || plan.title,
      objectiveId: step.objectiveId,
      safeEvidenceRefs: step.safeEvidenceRefs,
      safeReasonCodes: step.reasonCode ? [step.reasonCode] : ['study_plan_teacher_support_needed'],
      createdAt: step.createdAt,
    };
  }

  private priorityFor(priority: string): Phase3GrowthPagePriority {
    return ['low', 'medium', 'high', 'urgent', 'blocked'].includes(priority) ? priority as Phase3GrowthPagePriority : 'medium';
  }

  private isToday(iso?: string): boolean {
    if (!iso) return false;
    const value = new Date(iso);
    const today = new Date();
    return value.getFullYear() === today.getFullYear() && value.getMonth() === today.getMonth() && value.getDate() === today.getDate();
  }

  private dedupeCards(cards: Phase3GrowthPageCard[]): Phase3GrowthPageCard[] {
    const seen = new Set<string>();
    return cards.filter(card => {
      const key = `${card.studyPlanId ?? ''}:${card.objectiveId ?? ''}:${card.cardType}:${card.recommendedAction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private dedupeDueNow(items: Phase3DueNowItem[]): Phase3DueNowItem[] {
    const seen = new Set<string>();
    return items.filter(item => {
      const key = `${item.studyPlanId ?? ''}:${item.studyPlanStepId ?? ''}:${item.recommendedAction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

export const phase3GrowthPageStudyPlanAdapterService = new Phase3GrowthPageStudyPlanAdapterService();
