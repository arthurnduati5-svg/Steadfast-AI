import type {
  Phase3LearnerObjectiveProgressView,
  Phase3LearnerObjectiveProgressCard,
  Phase3LearnerSafeObjectiveExplanation,
  Phase3DailyObjectiveCheckSeed,
  Phase3MasteryStatus,
  Phase3RecommendedAction,
  Phase3ModeDestination,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';

export class Phase3LearnerObjectiveProgressService {
  getLearnerObjectiveProgressView(
    schoolId: string, learnerId: string, classId?: string,
  ): Phase3LearnerObjectiveProgressView {
    const cards = phase3ObjectiveRepository.listLearnerObjectiveProgress(schoolId, learnerId, classId);
    return {
      schoolId,
      learnerId,
      classId,
      cards,
      totalObjectives: cards.length,
      confidentCount: cards.filter(c => c.masteryStatus === 'confident').length,
      needingSupportCount: cards.filter(c =>
        ['needs_rescue', 'needs_teacher_support', 'source_required', 'blocked'].includes(c.masteryStatus),
      ).length,
      generatedAt: new Date().toISOString(),
    };
  }

  getLearnerObjectiveProgressCard(
    schoolId: string, learnerId: string, objectiveId: string,
  ): Phase3LearnerObjectiveProgressCard | null {
    const objectives = phase3ObjectiveRepository.listObjectivesBySchool(schoolId);
    const obj = objectives.find(o => o.objectiveId === objectiveId);
    if (!obj) return null;

    const snapshot = phase3ObjectiveRepository.getObjectiveMasterySnapshot(objectiveId, learnerId);
    const status = snapshot?.status || 'not_started';

    return {
      objectiveId: obj.objectiveId,
      title: obj.title,
      safeDescription: obj.safeDescription,
      masteryStatus: status,
      statusReason: this.getSafeStatusReason(status),
      nextAction: this.getNextAction(status),
      modeDestination: this.getModeForStatus(status),
      safeEvidenceRefs: [],
      estimatedTimeMinutes: obj.estimatedMinutes,
      updatedAt: snapshot?.updatedAt || obj.updatedAt,
    };
  }

  getLearnerSafeObjectiveExplanation(
    schoolId: string, learnerId: string, objectiveId: string,
  ): Phase3LearnerSafeObjectiveExplanation {
    const objectives = phase3ObjectiveRepository.listObjectivesBySchool(schoolId);
    const obj = objectives.find(o => o.objectiveId === objectiveId);
    const snapshot = phase3ObjectiveRepository.getObjectiveMasterySnapshot(objectiveId, learnerId);
    const status = snapshot?.status || 'not_started';

    return {
      objectiveId,
      title: obj?.title || 'Unknown objective',
      safeExplanation: this.getSafeExplanation(status, obj?.safeDescription),
      status,
      nextStep: this.getNextStep(status),
      modeDestination: this.getModeForStatus(status),
      estimatedTimeMinutes: obj?.estimatedMinutes || 15,
      safeEvidenceRefs: [],
    };
  }

  getLearnerNextObjectiveAction(
    schoolId: string, learnerId: string,
  ): { objectiveId: string; action: string; mode: string } {
    const cards = phase3ObjectiveRepository.listLearnerObjectiveProgress(schoolId, learnerId);
    const prioritized = cards.filter(c => c.masteryStatus !== 'confident' && c.masteryStatus !== 'blocked');
    if (prioritized.length === 0) {
      if (cards.length === 0) {
        return {
          objectiveId: '',
          action: 'start learning',
          mode: 'focus',
        };
      }
      return {
        objectiveId: cards[0].objectiveId,
        action: 'review',
        mode: 'revision',
      };
    }
    const target = prioritized[0];
    return {
      objectiveId: target.objectiveId,
      action: this.getActionLabel(target.nextAction),
      mode: target.modeDestination,
    };
  }

  getLearnerObjectiveDailySeeds(
    schoolId: string, learnerId: string,
  ): Phase3DailyObjectiveCheckSeed[] {
    return phase3ObjectiveRepository.listDailyObjectiveSeeds(learnerId, schoolId);
  }

  private getSafeStatusReason(status: Phase3MasteryStatus): string {
    switch (status) {
      case 'not_started': return 'You have not started working on this objective yet.';
      case 'early_signal': return 'You have started learning this objective. Keep building your understanding.';
      case 'still_learning': return 'You are still developing your understanding of this objective.';
      case 'getting_better': return 'Your understanding is improving. Continue practising to strengthen it.';
      case 'almost_there': return 'You are close to mastering this objective. One more check will help confirm.';
      case 'confident': return 'You have shown strong understanding across multiple checks.';
      case 'needs_rescue': return 'This objective needs more focused attention. Take time to go through it again.';
      case 'needs_teacher_support': return 'You may need help from your teacher to work through this objective.';
      case 'source_required': return 'This objective needs reference material before you can continue.';
      case 'blocked': return 'This objective cannot be progressed right now due to a policy requirement.';
    }
  }

  private getNextAction(status: Phase3MasteryStatus): Phase3RecommendedAction {
    switch (status) {
      case 'not_started': return 'start_focus_mode';
      case 'early_signal': return 'start_quiz_mode';
      case 'still_learning': return 'start_teach_back_mode';
      case 'getting_better': return 'start_quiz_mode';
      case 'almost_there': return 'start_quiz_mode';
      case 'confident': return 'start_revision_mode';
      case 'needs_rescue': return 'start_focus_mode';
      case 'needs_teacher_support': return 'ask_teacher_for_help';
      case 'source_required': return 'ask_teacher_for_help';
      case 'blocked': return 'ask_teacher_for_help';
    }
  }

  private getModeForStatus(status: Phase3MasteryStatus): Phase3ModeDestination {
    switch (status) {
      case 'not_started': return 'focus';
      case 'early_signal': return 'quiz';
      case 'still_learning': return 'teach_back';
      case 'getting_better': return 'quiz';
      case 'almost_there': return 'quiz';
      case 'confident': return 'revision';
      case 'needs_rescue': return 'focus';
      case 'needs_teacher_support': return 'none';
      case 'source_required': return 'none';
      case 'blocked': return 'none';
    }
  }

  private getSafeExplanation(status: Phase3MasteryStatus, safeDescription?: string): string {
    const base = safeDescription || 'Work through the learning materials for this objective.';
    switch (status) {
      case 'not_started':
        return `You can begin this objective by going through the learning materials. ${base}`;
      case 'early_signal':
        return 'You are building understanding. Try a quiz to check what you know so far.';
      case 'still_learning':
        return 'Keep working on this area. Explaining what you know to someone else can help clarify your thinking.';
      case 'getting_better':
        return 'Your progress is moving in the right direction. A quick check will help confirm your understanding.';
      case 'almost_there':
        return 'You are very close. One more check should confirm your understanding of this topic.';
      case 'confident':
        return 'You have demonstrated solid understanding. Review periodically to keep it fresh.';
      case 'needs_rescue':
        return 'This objective needs more attention. Go back through the core ideas and try again.';
      case 'needs_teacher_support':
        return 'Reaching out to your teacher will help you work through the parts that are unclear.';
      case 'source_required':
        return 'Approved learning materials are needed before you can continue with this objective.';
      case 'blocked':
        return 'There is a policy restriction on this objective. Your teacher can help you understand next steps.';
    }
  }

  private getNextStep(status: Phase3MasteryStatus): string {
    switch (status) {
      case 'not_started': return 'Start with focus mode to build initial understanding.';
      case 'early_signal': return 'Try a quiz to check what you know.';
      case 'still_learning': return 'Use teach-back mode to explain what you understand so far.';
      case 'getting_better': return 'Take a short quiz to confirm your progress.';
      case 'almost_there': return 'Complete one more check to solidify your understanding.';
      case 'confident': return 'Review this objective periodically to keep your knowledge current.';
      case 'needs_rescue': return 'Use focus mode to rebuild your understanding from the ground up.';
      case 'needs_teacher_support': return 'Ask your teacher for help with this objective.';
      case 'source_required': return 'Your teacher needs to provide approved materials first.';
      case 'blocked': return 'Speak with your teacher about next steps.';
    }
  }

  private getActionLabel(action: Phase3RecommendedAction): string {
    switch (action) {
      case 'complete_daily_objective': return 'complete daily objective';
      case 'start_focus_mode': return 'focus';
      case 'start_quiz_mode': return 'quiz';
      case 'start_teach_back_mode': return 'teach back';
      case 'start_revision_mode': return 'revision';
      case 'ask_teacher_for_help': return 'ask teacher';
    }
  }
}

export const phase3LearnerObjectiveProgressService = new Phase3LearnerObjectiveProgressService();
