import type {
  Phase3DueNowItem,
  Phase3GrowthPageSourceType,
  Phase3GrowthPageSignalType,
  Phase3GrowthPagePriority,
  Phase3GrowthPageAction,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';

let counter = 0;
function generateId(): string {
  return `dni_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

interface DueNowSource {
  sourceType: Phase3GrowthPageSourceType;
  signalType: Phase3GrowthPageSignalType;
  safeTitle: string;
  safeSummary: string;
  priority: Phase3GrowthPagePriority;
  recommendedAction: Phase3GrowthPageAction;
  objectiveId?: string;
  topicId?: string;
  skillId?: string;
  studyPlanId?: string;
  studyPlanStepId?: string;
}

export class Phase3GrowthPageDueNowService {
  getDueNowItemsForLearner(schoolId: string, studentId: string): Phase3DueNowItem[] {
    return phase3GrowthPageRepository.listDueNowItemsForLearner(schoolId, studentId)
      .filter(i => !i.isCompleted)
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = { urgent: 0, blocked: 1, high: 2, medium: 3, low: 4 };
        return (priorityOrder[a.priority] ?? 5) - (priorityOrder[b.priority] ?? 5);
      });
  }

  deriveDueNowFromDailyLearningFeed(schoolId: string, studentId: string, items: DueNowSource[]): Phase3DueNowItem[] {
    return this.createDueNowItems(schoolId, studentId, items);
  }

  deriveDueNowFromStudyPlans(schoolId: string, studentId: string, items: DueNowSource[]): Phase3DueNowItem[] {
    return this.createDueNowItems(schoolId, studentId, items);
  }

  deriveDueNowFromObjectiveMastery(schoolId: string, studentId: string, items: DueNowSource[]): Phase3DueNowItem[] {
    return this.createDueNowItems(schoolId, studentId, items);
  }

  deriveDueNowFromDailyObjectiveChecks(schoolId: string, studentId: string, items: DueNowSource[]): Phase3DueNowItem[] {
    return this.createDueNowItems(schoolId, studentId, items);
  }

  private createDueNowItems(schoolId: string, studentId: string, sources: DueNowSource[]): Phase3DueNowItem[] {
    return sources.map(s => {
      const item: Phase3DueNowItem = {
        dueNowItemId: generateId(),
        schoolId,
        studentId,
        sourceType: s.sourceType,
        signalType: s.signalType,
        priority: s.priority,
        safeTitle: s.safeTitle,
        safeSummary: s.safeSummary,
        recommendedAction: s.recommendedAction,
        objectiveId: s.objectiveId,
        topicId: s.topicId,
        skillId: s.skillId,
        studyPlanId: s.studyPlanId,
        studyPlanStepId: s.studyPlanStepId,
        isCompleted: false,
        safeEvidenceRefs: [],
        safeReasonCodes: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      phase3GrowthPageRepository.upsertDueNowItem(item);
      return item;
    });
  }

  deriveDueNowPriority(signalType: string): Phase3GrowthPagePriority {
    const priorityMap: Record<string, Phase3GrowthPagePriority> = {
      objective_needs_rescue: 'urgent',
      objective_needs_teacher_support: 'urgent',
      daily_check_pending: 'high',
      daily_check_in_progress: 'high',
      study_plan_due: 'high',
      study_plan_blocked: 'blocked',
      source_required: 'blocked',
      teacher_support_required: 'urgent',
      daily_check_needs_recheck: 'medium',
      daily_check_completed: 'low',
      study_plan_completed: 'low',
      objective_almost_there: 'medium',
      objective_getting_better: 'medium',
      objective_still_learning: 'medium',
      objective_not_started: 'high',
    };
    return priorityMap[signalType] ?? 'medium';
  }

  buildDueNowReason(item: Phase3DueNowItem): string {
    if (item.priority === 'urgent') return 'This needs your attention now.';
    if (item.priority === 'blocked') return 'This needs a source or teacher confirmation before continuing.';
    if (item.priority === 'high') return 'This is a good next step for today.';
    if (item.priority === 'medium') return 'Consider reviewing this when you have time.';
    return 'This can wait.';
  }

  dedupeDueNowItems(items: Phase3DueNowItem[]): Phase3DueNowItem[] {
    const seen = new Set<string>();
    return items.filter(i => {
      const key = `${i.objectiveId ?? i.studyPlanStepId ?? i.studyPlanId ?? ''}:${i.recommendedAction}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  limitDueNowItems(items: Phase3DueNowItem[], max: number = 10): Phase3DueNowItem[] {
    return items.slice(0, max);
  }

  markDueNowCompleted(schoolId: string, dueNowItemId: string): Phase3DueNowItem | null {
    return phase3GrowthPageRepository.markDueNowItemCompleted(schoolId, dueNowItemId);
  }
}

export const phase3GrowthPageDueNowService = new Phase3GrowthPageDueNowService();
