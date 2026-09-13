import type {
  Phase3WeakTopicLane,
  Phase3WeakTopicLaneStatus,
  Phase3GrowthPagePriority,
  Phase3GrowthPageAction,
  Phase3GrowthPageSourceType,
  Phase3GrowthPageSignalType,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';

let counter = 0;
function generateId(): string {
  return `wtl_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

interface WeakTopicSource {
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  objectiveIds: string[];
  status: Phase3WeakTopicLaneStatus;
  safeTitle: string;
  safeSummary: string;
  recommendedAction: Phase3GrowthPageAction;
  priority: Phase3GrowthPagePriority;
}

export class Phase3WeakTopicLaneService {
  detectWeakTopicLanes(schoolId: string, studentId: string): Phase3WeakTopicLane[] {
    return phase3GrowthPageRepository.listWeakTopicLanesForLearner(schoolId, studentId);
  }

  deriveWeakTopicLaneFromObjectiveMastery(schoolId: string, studentId: string, sources: WeakTopicSource[]): Phase3WeakTopicLane[] {
    return this.createLanes(schoolId, studentId, sources);
  }

  deriveWeakTopicLaneFromDailyObjectiveChecks(schoolId: string, studentId: string, sources: WeakTopicSource[]): Phase3WeakTopicLane[] {
    return this.createLanes(schoolId, studentId, sources);
  }

  deriveWeakTopicLaneFromMistakePatterns(schoolId: string, studentId: string, sources: WeakTopicSource[]): Phase3WeakTopicLane[] {
    return this.createLanes(schoolId, studentId, sources);
  }

  private createLanes(schoolId: string, studentId: string, sources: WeakTopicSource[]): Phase3WeakTopicLane[] {
    return sources.map(s => {
      const lane: Phase3WeakTopicLane = {
        laneId: generateId(),
        schoolId,
        studentId,
        subjectId: s.subjectId,
        topicId: s.topicId,
        skillId: s.skillId,
        objectiveIds: s.objectiveIds,
        status: s.status,
        safeTitle: s.safeTitle,
        safeSummary: s.safeSummary,
        recommendedAction: s.recommendedAction,
        priority: s.priority,
        safeEvidenceRefs: [],
        safeReasonCodes: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
      };
      phase3GrowthPageRepository.upsertWeakTopicLane(lane);
      return lane;
    });
  }

  deriveWeakTopicLaneStatus(signalType: string): Phase3WeakTopicLaneStatus {
    const statusMap: Record<string, Phase3WeakTopicLaneStatus> = {
      objective_needs_teacher_support: 'needs_teacher_support',
      objective_needs_rescue: 'needs_rescue',
      daily_check_needs_recheck: 'needs_recheck',
      weak_topic_repeated: 'practice_next',
      source_required: 'source_required',
      recent_improvement: 'improving',
      objective_getting_better: 'stabilizing',
      objective_not_started: 'watch',
    };
    return statusMap[signalType] ?? 'watch';
  }

  buildWeakTopicLaneLearnerMessage(lane: Phase3WeakTopicLane): string {
    if (lane.status === 'improving') return `You are making progress on this topic. Keep going.`;
    if (lane.status === 'stabilizing') return `This topic is getting more consistent for you.`;
    if (lane.status === 'practice_next') return `This topic could use a short practice session.`;
    if (lane.status === 'needs_recheck') return `A quick recheck of this topic may help strengthen your understanding.`;
    if (lane.status === 'needs_rescue') return `This topic needs some focused review.`;
    if (lane.status === 'needs_teacher_support') return `Your teacher can help you with this topic.`;
    if (lane.status === 'source_required') return `This topic needs an approved source before continuing.`;
    return `This topic is worth keeping an eye on.`;
  }

  buildWeakTopicLaneTeacherSummary(lane: Phase3WeakTopicLane): string {
    if (lane.status === 'improving') return `Learner is showing recent improvement on this topic.`;
    if (lane.status === 'needs_teacher_support') return `Learner may need teacher guidance on this topic.`;
    if (lane.status === 'needs_rescue') return `Learner has repeated weak evidence on this topic.`;
    if (lane.status === 'source_required') return `This topic requires an approved source before learner can proceed.`;
    return `Learner has a weak topic signal on this area.`;
  }

  rankWeakTopicLanes(lanes: Phase3WeakTopicLane[]): Phase3WeakTopicLane[] {
    const priorityOrder: Record<string, number> = {
      needs_teacher_support: 0,
      needs_rescue: 1,
      needs_recheck: 2,
      practice_next: 3,
      source_required: 4,
      stabilizing: 5,
      improving: 6,
      watch: 7,
    };
    return [...lanes].sort((a, b) => (priorityOrder[a.status] ?? 99) - (priorityOrder[b.status] ?? 99));
  }

  deriveLanePriority(status: Phase3WeakTopicLaneStatus): Phase3GrowthPagePriority {
    const map: Record<Phase3WeakTopicLaneStatus, Phase3GrowthPagePriority> = {
      needs_teacher_support: 'urgent',
      needs_rescue: 'high',
      needs_recheck: 'high',
      practice_next: 'medium',
      source_required: 'blocked',
      stabilizing: 'medium',
      improving: 'low',
      watch: 'low',
    };
    return map[status];
  }
}

export const phase3WeakTopicLaneService = new Phase3WeakTopicLaneService();
