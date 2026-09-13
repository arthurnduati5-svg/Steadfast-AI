import type {
  Phase3DailyObjectiveCheckSeed,
  Phase3MasteryStatus,
  Phase3ObjectiveType,
  Phase3ModeDestination,
  Phase3DifficultyBucket,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';

function nowISO(): string {
  return new Date().toISOString();
}

function plus24Hours(): string {
  return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
}

export class Phase3DailyObjectiveSeedService {
  createDailyObjectiveCheckSeed(
    schoolId: string,
    studentId: string,
    objectiveId: string,
    classId?: string,
  ): Phase3DailyObjectiveCheckSeed | { error: string } {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    if (!objective) {
      return { error: 'Objective not found' };
    }
    if (objective.isArchived) {
      return { error: 'Objective is archived' };
    }
    if (objective.sourceTruthStatus.status === 'source_required' || objective.sourceTruthStatus.status === 'blocked') {
      return { error: 'source_required' };
    }

    const snapshot = phase3ObjectiveRepository.getObjectiveMasterySnapshot(objectiveId, studentId);
    const masteryStatus: Phase3MasteryStatus = snapshot?.status || 'not_started';
    const priority = this.deriveSeedPriorityFromObjectiveStatus(masteryStatus);
    const modeDestination = this.deriveSeedModeDestination(objective.objectiveType);
    const antiCheatPolicy = this.derivePolicyFromDifficulty(objective.difficultyBucket, 'antiCheat');
    const evidencePolicy = this.derivePolicyFromDifficulty(objective.difficultyBucket, 'evidence');

    return phase3ObjectiveRepository.createDailyObjectiveSeed({
      schoolId,
      studentId,
      classId: classId || objective.classId,
      sourceType: 'daily_objective_check',
      title: objective.title,
      safeDescription: objective.safeDescription,
      targetObjectiveId: objectiveId,
      topicId: objective.topicId,
      skillId: objective.skillId,
      modeDestination,
      priority,
      estimatedTimeMinutes: objective.estimatedMinutes,
      reasonCode: `status_${masteryStatus}`,
      antiCheatPolicy,
      evidencePolicy,
      dueAt: plus24Hours(),
    });
  }

  listDailyObjectiveCheckSeedsForLearner(schoolId: string, studentId: string): Phase3DailyObjectiveCheckSeed[] {
    return phase3ObjectiveRepository.listDailyObjectiveSeeds(studentId, schoolId);
  }

  markDailyObjectiveSeedCompleted(seedId: string): Phase3DailyObjectiveCheckSeed | null {
    return phase3ObjectiveRepository.markDailyObjectiveSeedCompleted(seedId);
  }

  deriveSeedPriorityFromObjectiveStatus(status: Phase3MasteryStatus): 'low' | 'medium' | 'high' {
    switch (status) {
      case 'needs_rescue':
      case 'needs_teacher_support':
      case 'blocked':
        return 'high';
      case 'still_learning':
      case 'early_signal':
      case 'almost_there':
        return 'medium';
      case 'not_started':
      case 'getting_better':
      case 'confident':
      case 'source_required':
        return 'low';
    }
  }

  deriveSeedModeDestination(objectiveType: Phase3ObjectiveType): Phase3ModeDestination {
    switch (objectiveType) {
      case 'lesson_objective':
        return 'focus';
      case 'topic_objective':
        return 'quiz';
      case 'skill_objective':
        return 'teach_back';
      case 'study_plan_objective':
        return 'focus';
      case 'revision_objective':
        return 'revision';
      case 'teacher_daily_objective':
        return 'none';
      case 'exam_preparation_objective':
        return 'exam';
      case 'group_challenge_objective':
        return 'quiz';
    }
  }

  private derivePolicyFromDifficulty(difficulty: Phase3DifficultyBucket, policyType: 'antiCheat' | 'evidence'): string {
    const policyMap: Record<Phase3DifficultyBucket, { antiCheat: string; evidence: string }> = {
      foundation: { antiCheat: 'standard', evidence: 'basic' },
      core: { antiCheat: 'enhanced', evidence: 'standard' },
      challenge: { antiCheat: 'strict', evidence: 'full' },
      advanced: { antiCheat: 'strict', evidence: 'full' },
    };
    return policyMap[difficulty][policyType];
  }
}

export const phase3DailyObjectiveSeedService = new Phase3DailyObjectiveSeedService();
