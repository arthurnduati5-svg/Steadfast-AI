import type { Phase3SourceTruthStatus } from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';
import type { Phase3DailyLearningFeedItem } from '../contracts/phase3DailyLearningFeedContracts';

const ALLOWED_ACTIONABLE_STATUSES: Phase3SourceTruthStatus[] = ['approved', 'teacher_created', 'school_created'];
const NON_ACTIONABLE_STATUSES: Phase3SourceTruthStatus[] = ['source_required', 'content_gap', 'blocked', 'unknown'];

export class Phase3DailyLearningFeedSourceTruthService {
  canShowObjectiveInLearnerFeed(objectiveId: string): boolean {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    if (!objective) return false;
    if (objective.isArchived) return false;
    return ALLOWED_ACTIONABLE_STATUSES.includes(objective.sourceTruthStatus.status);
  }

  canStartActionFromFeedItem(item: Phase3DailyLearningFeedItem): boolean {
    if (item.itemType === 'source_required') return false;
    if (item.priority === 'blocked') return false;
    return ALLOWED_ACTIONABLE_STATUSES.includes(item.sourceTruthStatus as Phase3SourceTruthStatus);
  }

  deriveSourceTruthFeedStatus(objectiveId: string): {
    status: Phase3SourceTruthStatus;
    actionable: boolean;
    reason: string;
  } {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    if (!objective) {
      return { status: 'unknown', actionable: false, reason: 'Objective not found.' };
    }
    const status = objective.sourceTruthStatus.status;
    const actionable = ALLOWED_ACTIONABLE_STATUSES.includes(status);
    const reason = actionable
      ? 'Source is approved for checks.'
      : 'Objective needs an approved source or teacher confirmation before checks can continue.';
    return { status, actionable, reason };
  }

  buildSourceRequiredFeedItem(objectiveId: string, schoolId: string, studentId: string): Partial<Phase3DailyLearningFeedItem> {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    return {
      schoolId,
      studentId,
      objectiveId,
      itemType: 'source_required',
      priority: 'urgent',
      title: objective?.title || 'Objective',
      safeDescription: objective?.safeDescription || '',
      learnerSafeReason: 'This objective needs an approved source or teacher confirmation before checks can continue.',
      teacherSafeReason: 'Objective requires approved source/context before learner check can proceed.',
      nextAction: 'ask_teacher_for_source',
      sourceTruthStatus: 'source_required',
      safeReasonCodes: ['source_required_status'],
    };
  }

  buildSafeSourceTruthMessage(status: Phase3SourceTruthStatus): string {
    switch (status) {
      case 'approved':
      case 'teacher_created':
      case 'school_created':
        return 'This objective has an approved source and is ready for checks.';
      case 'source_required':
      case 'content_gap':
      case 'blocked':
      case 'unknown':
      default:
        return 'This objective needs an approved source or teacher confirmation before checks can continue.';
    }
  }

  isSourceTruthActionable(status: string): boolean {
    return ALLOWED_ACTIONABLE_STATUSES.includes(status as Phase3SourceTruthStatus);
  }
}

export const phase3DailyLearningFeedSourceTruthService = new Phase3DailyLearningFeedSourceTruthService();
