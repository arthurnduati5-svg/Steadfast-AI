import type {
  Phase3Objective,
  Phase3ObjectiveCheckBlueprint,
  Phase3ObjectiveCheckItem,
  Phase3ObjectiveCheckPolicy,
  Phase3ObjectiveType,
  Phase3ModeDestination,
  Phase3DifficultyBucket,
} from '../contracts/phase3ObjectiveMasteryContracts';
import { phase3ObjectiveRepository } from './phase3ObjectiveRepository';

const ITEM_DEFS: Record<Phase3ObjectiveType, Array<{ itemType: Phase3ObjectiveCheckItem['itemType']; mode: Phase3ModeDestination; minutes: number }>> = {
  lesson_objective: [
    { itemType: 'recall', mode: 'focus', minutes: 3 },
    { itemType: 'understanding', mode: 'quiz', minutes: 5 },
    { itemType: 'application', mode: 'quiz', minutes: 7 },
  ],
  topic_objective: [
    { itemType: 'recall', mode: 'focus', minutes: 3 },
    { itemType: 'understanding', mode: 'quiz', minutes: 5 },
    { itemType: 'application', mode: 'quiz', minutes: 7 },
  ],
  skill_objective: [
    { itemType: 'recall', mode: 'focus', minutes: 2 },
    { itemType: 'application', mode: 'focus', minutes: 5 },
    { itemType: 'understanding', mode: 'quiz', minutes: 5 },
  ],
  study_plan_objective: [
    { itemType: 'recall', mode: 'focus', minutes: 3 },
    { itemType: 'understanding', mode: 'quiz', minutes: 5 },
  ],
  revision_objective: [
    { itemType: 'recall', mode: 'revision', minutes: 2 },
    { itemType: 'understanding', mode: 'revision', minutes: 4 },
  ],
  teacher_daily_objective: [
    { itemType: 'recall', mode: 'focus', minutes: 2 },
    { itemType: 'understanding', mode: 'quiz', minutes: 4 },
    { itemType: 'application', mode: 'quiz', minutes: 5 },
  ],
  exam_preparation_objective: [
    { itemType: 'recall', mode: 'exam', minutes: 3 },
    { itemType: 'understanding', mode: 'exam', minutes: 5 },
    { itemType: 'application', mode: 'exam', minutes: 8 },
  ],
  group_challenge_objective: [
    { itemType: 'recall', mode: 'quiz', minutes: 3 },
    { itemType: 'understanding', mode: 'quiz', minutes: 5 },
    { itemType: 'application', mode: 'quiz', minutes: 7 },
  ],
};

const MODE_BY_TYPE: Record<Phase3ObjectiveType, Phase3ModeDestination> = {
  lesson_objective: 'focus',
  topic_objective: 'focus',
  skill_objective: 'focus',
  study_plan_objective: 'focus',
  revision_objective: 'revision',
  teacher_daily_objective: 'focus',
  exam_preparation_objective: 'exam',
  group_challenge_objective: 'quiz',
};

function difficultyPolicy(bucket: Phase3DifficultyBucket): { teachBack: boolean; transfer: boolean; delayedRecall: boolean } {
  switch (bucket) {
    case 'foundation': return { teachBack: false, transfer: false, delayedRecall: false };
    case 'core': return { teachBack: true, transfer: false, delayedRecall: false };
    case 'challenge': return { teachBack: true, transfer: true, delayedRecall: false };
    case 'advanced': return { teachBack: true, transfer: true, delayedRecall: true };
  }
}

function buildSafeInstructions(objectiveType: Phase3ObjectiveType, difficulty: Phase3DifficultyBucket): string {
  const base = 'Explain what you understand in your own words without looking up answers. The goal is to see what you already know.';

  if (difficulty === 'foundation') {
    return `Start with what feels familiar. ${base} If something is unclear, note it — that shows where to focus.`;
  }
  if (difficulty === 'advanced') {
    return `Describe your understanding in detail, including connections to related concepts. ${base} Identify any gaps and explain how you would explore them.`;
  }
  return `Think carefully before responding. ${base} If unsure, describe what is confusing and why.`;
}

export class Phase3ObjectiveCheckBlueprintService {
  createObjectiveCheckBlueprint(
    objectiveId: string,
    schoolId: string,
    requesterRole: string,
  ): Phase3ObjectiveCheckBlueprint | { error: string } {
    const objective = phase3ObjectiveRepository.getObjectiveById(objectiveId);
    if (!objective) {
      return { error: 'Objective not found' };
    }
    if (objective.schoolId !== schoolId) {
      return { error: 'School mismatch' };
    }

    const srcStatus = objective.sourceTruthStatus.status;
    if (srcStatus === 'source_required' || srcStatus === 'blocked') {
      return { error: `Cannot create check blueprint while sourceTruthStatus is '${srcStatus}'. Resolve the source issue first.` };
    }

    const defs = ITEM_DEFS[objective.objectiveType];
    const checkItems: Phase3ObjectiveCheckItem[] = defs.map((d, i) => ({
      itemId: `ci_${objectiveId}_${i}`,
      itemType: d.itemType,
      promptSafeRef: `prompt_${objective.objectiveType}_${d.itemType}`,
      orderIndex: i,
      modeDestination: d.mode,
      estimatedTimeMinutes: d.minutes,
    }));

    const policy = difficultyPolicy(objective.difficultyBucket);

    const checkPolicy: Phase3ObjectiveCheckPolicy = {
      requiresConfidenceBefore: true,
      requiresConfidenceAfter: true,
      requiresTeachBack: policy.teachBack,
      requiresTransferQuestion: policy.transfer,
      requiresDelayedRecall: policy.delayedRecall,
      hintPolicy: objective.difficultyBucket === 'foundation' ? 'allow_hints' : 'limit_hints',
      antiCheatPolicy: objective.difficultyBucket === 'advanced' ? 'strict' : 'standard',
      evidencePolicy: 'standard',
      maxAttempts: objective.difficultyBucket === 'foundation' ? 5 : 3,
      minTimeSeconds: 30,
    };

    return phase3ObjectiveRepository.createObjectiveCheckBlueprint({
      objectiveId: objective.objectiveId,
      schoolId: objective.schoolId,
      classId: objective.classId,
      subjectId: objective.subjectId,
      topicId: objective.topicId,
      skillId: objective.skillId,
      recommendedModeDestination: this.selectCheckModeDestination(objective.objectiveType),
      checkItems,
      successCriteriaRefs: objective.successCriteria.map(c => c.criterionId),
      checkPolicy,
      confidenceBeforeRequired: true,
      confidenceAfterRequired: true,
      teachBackRequired: policy.teachBack,
      transferQuestionRequired: policy.transfer,
      delayedRecallRequired: policy.delayedRecall,
      sourceTruthStatus: objective.sourceTruthStatus,
      safeInstructions: buildSafeInstructions(objective.objectiveType, objective.difficultyBucket),
    });
  }

  createObjectiveCheckBlueprintFromResolvedObjective(
    objective: Phase3Objective,
    schoolId: string,
    requesterRole: string,
  ): Phase3ObjectiveCheckBlueprint | { error: string } {
    if (objective.schoolId !== schoolId) {
      return { error: 'School mismatch' };
    }

    const srcStatus = objective.sourceTruthStatus.status;
    if (srcStatus === 'source_required' || srcStatus === 'blocked') {
      return { error: `Cannot create check blueprint while sourceTruthStatus is '${srcStatus}'. Resolve the source issue first.` };
    }

    const defs = ITEM_DEFS[objective.objectiveType];
    const checkItems: Phase3ObjectiveCheckItem[] = defs.map((d, i) => ({
      itemId: `ci_${objective.objectiveId}_${i}`,
      itemType: d.itemType,
      promptSafeRef: `prompt_${objective.objectiveType}_${d.itemType}`,
      orderIndex: i,
      modeDestination: d.mode,
      estimatedTimeMinutes: d.minutes,
    }));

    const policy = difficultyPolicy(objective.difficultyBucket);

    const checkPolicy: Phase3ObjectiveCheckPolicy = {
      requiresConfidenceBefore: true,
      requiresConfidenceAfter: true,
      requiresTeachBack: policy.teachBack,
      requiresTransferQuestion: policy.transfer,
      requiresDelayedRecall: policy.delayedRecall,
      hintPolicy: objective.difficultyBucket === 'foundation' ? 'allow_hints' : 'limit_hints',
      antiCheatPolicy: objective.difficultyBucket === 'advanced' ? 'strict' : 'standard',
      evidencePolicy: 'standard',
      maxAttempts: objective.difficultyBucket === 'foundation' ? 5 : 3,
      minTimeSeconds: 30,
    };

    return phase3ObjectiveRepository.createObjectiveCheckBlueprint({
      objectiveId: objective.objectiveId,
      schoolId: objective.schoolId,
      classId: objective.classId,
      subjectId: objective.subjectId,
      topicId: objective.topicId,
      skillId: objective.skillId,
      recommendedModeDestination: this.selectCheckModeDestination(objective.objectiveType),
      checkItems,
      successCriteriaRefs: objective.successCriteria.map(c => c.criterionId),
      checkPolicy,
      confidenceBeforeRequired: true,
      confidenceAfterRequired: true,
      teachBackRequired: policy.teachBack,
      transferQuestionRequired: policy.transfer,
      delayedRecallRequired: policy.delayedRecall,
      sourceTruthStatus: objective.sourceTruthStatus,
      safeInstructions: buildSafeInstructions(objective.objectiveType, objective.difficultyBucket),
    });
  }

  getObjectiveCheckBlueprint(objectiveId: string): Phase3ObjectiveCheckBlueprint | null {
    return phase3ObjectiveRepository.getObjectiveCheckBlueprint(objectiveId);
  }

  selectCheckModeDestination(objectiveType: Phase3ObjectiveType): Phase3ModeDestination {
    return MODE_BY_TYPE[objectiveType] ?? 'focus';
  }

  createTransferCheckRequirement(objectiveId: string): { requiresTransferCheck: boolean; safeInstruction: string } {
    return {
      requiresTransferCheck: true,
      safeInstruction: 'Apply what you have learned to a new context. Explain how the concept works when the situation changes.',
    };
  }

  createDelayedRecallRequirement(objectiveId: string): { requiresDelayedRecall: boolean; safeInstruction: string } {
    return {
      requiresDelayedRecall: true,
      safeInstruction: 'After some time away, recall what you learned without notes. This strengthens long-term memory.',
    };
  }

  createTeachBackRequirement(objectiveId: string): { requiresTeachBack: boolean; safeInstruction: string } {
    return {
      requiresTeachBack: true,
      safeInstruction: 'Teach this concept to someone learning it for the first time. Use simple language and your own examples.',
    };
  }

  createConfidencePromptRequirement(objectiveId: string): { requiresConfidencePrompt: boolean; safePromptRef: string } {
    return {
      requiresConfidencePrompt: true,
      safePromptRef: `confidence_prompt_${objectiveId}`,
    };
  }
}

export const phase3ObjectiveCheckBlueprintService = new Phase3ObjectiveCheckBlueprintService();
