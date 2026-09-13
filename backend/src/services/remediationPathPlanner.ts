import type {
  RemediationPath,
  RemediationPathStep,
  RemediationPathStepType,
  SupportLevel,
  PrerequisiteSkillResult,
} from './task015Contracts';
import { prerequisiteSkillResolver } from './prerequisiteSkillResolver';

function makeId(): string {
  return `step_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export class RemediationPathPlanner {
  planPath(input: {
    subject: string;
    topic?: string;
    skillTag?: string;
    blockingSkillTag?: string | null;
    supportLevel: SupportLevel;
  }): RemediationPath {
    const prerequisite = prerequisiteSkillResolver.resolvePrerequisites({
      subject: input.subject,
      topic: input.topic,
      skillTag: input.skillTag,
      blockingSkillTag: input.blockingSkillTag,
    });

    const steps: RemediationPathStep[] = [];
    const prereqs = prerequisite.prerequisiteSkills;
    const usePrereq = prereqs.length > 0 ? prereqs[0] : input.skillTag ?? input.subject;

    steps.push(this.makeStep('micro_explanation_check', usePrereq, input.supportLevel));
    if (prereqs.length > 0) {
      steps.push(this.makeStep('foundation_question', prereqs[0], input.supportLevel));
    } else {
      steps.push(this.makeStep('foundation_question', input.skillTag ?? 'core_skill', input.supportLevel));
    }
    steps.push(this.makeStep('mistake_pattern_repair', input.skillTag ?? 'core_skill', input.supportLevel));

    return {
      pathId: `rp_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      subject: input.subject,
      topic: input.topic,
      skillTag: input.skillTag,
      blockingSkill: prerequisite.blockingSkill ?? undefined,
      prerequisiteFocus: prereqs.slice(0, 3),
      steps,
      currentStepIndex: 0,
      whyThisPath: `We will focus on strengthening one skill at a time. Each small step builds confidence for the next.`,
      returnToMainSkillCondition: `Complete all steps with improving accuracy and reduced hint dependency.`,
      privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
      createdAt: new Date().toISOString(),
    };
  }

  private makeStep(stepType: RemediationPathStepType, skillLabel: string, supportLevel: SupportLevel): RemediationPathStep {
    const steps: Record<string, { instruction: string; question: string }> = {
      micro_explanation_check: {
        instruction: `Let us check your understanding of ${skillLabel} with a quick thought question.`,
        question: `In your own words, what does ${skillLabel} mean? Try to give a short example.`,
      },
      foundation_question: {
        instruction: `Now try this foundation question about ${skillLabel}. Take your time.`,
        question: `How would you approach a problem involving ${skillLabel}? What is the first step?`,
      },
      guided_example_without_final_answer: {
        instruction: `Here is a similar example. Look at the pattern but do not copy the final answer.`,
        question: `What changes when we apply the same pattern to this problem?`,
      },
      similar_practice: {
        instruction: `Try a similar question to the one you attempted before.`,
        question: `Using what you just practiced, solve this step by step.`,
      },
      mistake_pattern_repair: {
        instruction: `Let us look at a common approach to ${skillLabel}.`,
        question: `What is the difference between the correct approach and the one that leads to mistakes?`,
      },
      confidence_check: {
        instruction: `Quick confidence check on ${skillLabel}.`,
        question: `On a scale from 1 to 5, how sure do you feel about ${skillLabel}? What makes you say that?`,
      },
      return_to_main_skill: {
        instruction: `Let us return to ${skillLabel} and try again with what you have practiced.`,
        question: `Now try the original type of problem again. Apply the repair step you just learned.`,
      },
    };

    const template = steps[stepType] ?? steps.micro_explanation_check;

    return {
      stepId: makeId(),
      stepType,
      studentInstruction: template.instruction,
      checkQuestion: template.question,
      supportLevel,
      completionSignal: `${stepType}_completed`,
    };
  }
}

export const remediationPathPlanner = new RemediationPathPlanner();
