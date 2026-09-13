import type { LearningResponsePlan, LearningResponsePlanInput } from './learningResponsePlannerContracts';
import type { TutorTurnIntent, TutorResponseMove } from './tutorOrchestrationContracts';

function planForIntent(intent: TutorTurnIntent): {
  responseMove: TutorResponseMove;
  requiresAiGeneration: boolean;
  requiresStepCheck: boolean;
  requiresHint: boolean;
  requiresPracticeQuestion: boolean;
  requiresEvidenceWrite: boolean;
  requiresRevisionUpdate: boolean;
  allowedAnswerDepth: string;
  planReason: string;
  generationInstruction: string;
  validationRequirements: string[];
} {
  switch (intent) {
    case 'ask_concept':
      return {
        responseMove: 'concept_explanation',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'concept_explanation',
        planReason: 'Learner asked for concept explanation',
        generationInstruction: 'Explain the concept clearly and simply. Include a guiding question at the end to check understanding. Do not provide the final answer to any specific homework problem.',
        validationRequirements: ['reasoning_clarity_validation', 'no_strict_validation'],
      };

    case 'ask_for_hint':
      return {
        responseMove: 'socratic_hint',
        requiresAiGeneration: false,
        requiresStepCheck: false,
        requiresHint: true,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'hint_only',
        planReason: 'Learner requested a hint',
        generationInstruction: '',
        validationRequirements: [],
      };

    case 'ask_for_final_answer':
      return {
        responseMove: 'one_step_guidance',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: true,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'one_step_guidance',
        planReason: 'Learner asked for final answer - providing guidance instead',
        generationInstruction: 'The learner is asking for the final answer. Do not provide it. Instead, give one step of guidance and ask them to try. Include a Socratic question that leads them to discover the answer themselves.',
        validationRequirements: ['no_final_answer'],
      };

    case 'submit_attempt':
      return {
        responseMove: 'attempt_feedback',
        requiresAiGeneration: true,
        requiresStepCheck: true,
        requiresHint: false,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: true,
        allowedAnswerDepth: 'attempt_feedback',
        planReason: 'Learner submitted an attempt',
        generationInstruction: 'Review the learner\'s attempt. Give specific feedback on what is correct and what needs correction. Include one next step. Ask a guiding question. Do not provide the full final answer if the learner should figure it out.',
        validationRequirements: ['attempt_feedback_validation'],
      };

    case 'ask_for_practice':
      return {
        responseMove: 'practice_question',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: true,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'practice_generation',
        planReason: 'Learner requested practice',
        generationInstruction: 'Generate a practice question relevant to the current topic. The question should test understanding, not just recall. Hide the answer. Ask the learner to try the question.',
        validationRequirements: ['practice_question_validation'],
      };

    case 'ask_for_revision':
      return {
        responseMove: 'revision_prompt',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: true,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: true,
        allowedAnswerDepth: 'revision_prompt',
        planReason: 'Learner requested revision',
        generationInstruction: 'Summarise key concepts from the topic. Include a quick practice question or retrieval prompt. Encourage the learner and identify areas for focused review.',
        validationRequirements: ['reasoning_clarity_validation'],
      };

    case 'ask_deen_question':
      return {
        responseMove: 'deen_referral',
        requiresAiGeneration: false,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'deen_policy_controlled',
        planReason: 'Deen-related question - policy controls the response',
        generationInstruction: '',
        validationRequirements: ['deen_source_sensitive_validation'],
      };

    case 'express_confusion':
      return {
        responseMove: 'concept_explanation',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: true,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'concept_explanation',
        planReason: 'Learner expressed confusion',
        generationInstruction: 'The learner is confused. Explain the concept more simply. Break it into smaller parts. Use an analogy or example. Ask a simple question to check understanding.',
        validationRequirements: ['reasoning_clarity_validation'],
      };

    case 'express_frustration':
      return {
        responseMove: 'socratic_hint',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: true,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: true,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'hint_only',
        planReason: 'Learner expressed frustration - supportive guidance needed',
        generationInstruction: 'The learner is frustrated. Be encouraging and supportive. Validate their effort. Break the problem into smaller steps. Ask them to try just the next small step.',
        validationRequirements: ['reasoning_clarity_validation'],
      };

    case 'serious_safety_risk':
      return {
        responseMove: 'safety_support_message',
        requiresAiGeneration: false,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: false,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'safety_support',
        planReason: 'Serious safety risk detected - normal tutoring paused',
        generationInstruction: '',
        validationRequirements: [],
      };

    case 'unknown':
    default:
      return {
        responseMove: 'clarify_question',
        requiresAiGeneration: true,
        requiresStepCheck: false,
        requiresHint: false,
        requiresPracticeQuestion: false,
        requiresEvidenceWrite: false,
        requiresRevisionUpdate: false,
        allowedAnswerDepth: 'clarify_only',
        planReason: 'Learner intent unclear - need clarification',
        generationInstruction: 'The learner\'s intent is unclear. Ask a clarifying question to understand what they need help with. Offer options: concept explanation, hint, practice, or attempt review.',
        validationRequirements: [],
      };
  }
}

function mergeValidationRequirements(
  intentValidation: string[],
  curriculumModes?: string[],
): string[] {
  if (!curriculumModes || curriculumModes.length === 0) {
    return intentValidation;
  }
  const merged = new Set([...intentValidation, ...curriculumModes]);
  return Array.from(merged);
}

export function planLearningResponse(input: LearningResponsePlanInput): LearningResponsePlan {
  const plan = planForIntent(input.intent);

  const mergedValidation = mergeValidationRequirements(
    plan.validationRequirements,
    input.curriculumValidationModes,
  );

  const planReason = input.deenSourceSensitive && plan.planReason
    ? `${plan.planReason} (Deen-sensitive curriculum context)`
    : plan.planReason;

  return {
    requestId: input.requestId,
    ...plan,
    validationRequirements: mergedValidation,
    planReason,
  };
}
