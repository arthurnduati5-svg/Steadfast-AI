import { describe, it, expect } from 'vitest';
import { composePedagogyPrompt } from '../services/tutorOrchestration/tutorPedagogyPromptComposer';
import { validateOrchestrationOutput } from '../services/tutorOrchestration/tutorOrchestrationOutputValidator';
import { planLearningResponse } from '../services/tutorOrchestration/learningResponsePlanner';
import type { LearningResponsePlan } from '../services/tutorOrchestration/learningResponsePlannerContracts';
import type { TutorTurnIntent, TutorResponseMove } from '../services/tutorOrchestration/tutorOrchestrationContracts';

function makePlan(responseMove: TutorResponseMove, generationInstruction = '', allowedAnswerDepth = 'concept_explanation'): LearningResponsePlan {
  return {
    requestId: 'req-test',
    responseMove,
    requiresAiGeneration: true,
    requiresStepCheck: false,
    requiresHint: false,
    requiresPracticeQuestion: false,
    requiresEvidenceWrite: false,
    requiresRevisionUpdate: false,
    allowedAnswerDepth,
    planReason: 'test',
    generationInstruction,
    validationRequirements: [],
  };
}

describe('AI-INTELLIGENCE-02 pedagogy calibration', () => {
  it('TEST A: curriculum sentinel + slow_support + grade-only young learner + Swahili reach the final prompt', () => {
    const result = composePedagogyPrompt({
      requestId: 'a',
      messageText: 'What is a fraction?',
      plan: makePlan('concept_explanation'),
      intent: 'ask_concept',
      learnerGrade: 'Grade 2',
      pacingDirective: 'slow_support',
      preferredLanguage: 'swahili',
      curriculumDirectives: ['SENTINEL-DIRECTIVE-XYZ teach fractions with physical objects'],
    });
    expect(result.combinedPrompt).toContain('SENTINEL-DIRECTIVE-XYZ');
    expect(result.combinedPrompt).toContain('slow_support');
    expect(result.combinedPrompt).toContain('AGE CALIBRATION (early learner)');
    expect(result.combinedPrompt).toContain('Kiswahili');
    expect(result.combinedPrompt).toContain('ONE-QUESTION RULE');
  });

  it('TEST B: broad concept teaching is foundation-first with a contextual next move, no generic filler', () => {
    const result = composePedagogyPrompt({
      requestId: 'b',
      messageText: 'Teach me photosynthesis',
      plan: makePlan('concept_explanation'),
      intent: 'ask_concept',
    });
    expect(result.combinedPrompt).toContain('FOUNDATION-FIRST');
    expect(result.combinedPrompt).toContain('one foundational idea');
    expect(result.combinedPrompt).toContain('comprehension check');
    expect(result.combinedPrompt).not.toMatch(/Choose a next move|What would you like to do next\?|Tell me where you want more help/i);
  });

  it('TEST C: validated incorrect attempt gets diagnostic mistake handling, not restart or final answer', () => {
    const result = composePedagogyPrompt({
      requestId: 'c',
      messageText: 'I added the denominators so 1/2 + 1/3 = 2/5',
      plan: makePlan('attempt_feedback', '', 'attempt_feedback'),
      intent: 'submit_attempt',
      mistakeAnalysis: {
        category: 'procedure_error',
        feedbackStrategy: 'targeted_repair',
      } as any,
      attemptFeedback: {
        whatIsCorrect: 'Found a common denominator idea',
        whatNeedsCorrection: 'Denominator addition',
        oneNextStep: 'Recompute the denominator',
        guidingQuestion: 'What happens to the size of the pieces when the denominator changes?',
      } as any,
    });
    expect(result.combinedPrompt).toContain('DIAGNOSTIC MISTAKE HANDLING');
    expect(result.combinedPrompt).toContain('got right');
    expect(result.combinedPrompt).toContain('repair that specific incorrect step');
    expect(result.combinedPrompt).toContain('Do not restart the entire lesson');
  });

  it('TEST D: confusion and frustration change instructional strategy', () => {
    const confusion = composePedagogyPrompt({
      requestId: 'd1',
      messageText: 'I am confused',
      plan: makePlan('concept_explanation'),
      intent: 'express_confusion',
    });
    expect(confusion.combinedPrompt).toContain('CONFUSION RESPONSE');
    expect(confusion.combinedPrompt).toContain('diagnostic question');

    const frustration = composePedagogyPrompt({
      requestId: 'd2',
      messageText: 'This is too hard, I give up',
      plan: makePlan('socratic_hint', '', 'hint_only'),
      intent: 'express_frustration',
    });
    expect(frustration.combinedPrompt).toContain('FRUSTRATION RESPONSE');
    expect(frustration.combinedPrompt).toContain('one achievable next step');
    expect(frustration.combinedPrompt).toContain('motivational speech');
  });

  it('TEST E: practice is one-question-at-a-time with hidden answer; revision is retrieval-first', () => {
    const practice = composePedagogyPrompt({
      requestId: 'e1',
      messageText: 'Give me practice',
      plan: makePlan('practice_question', '', 'practice_generation'),
      intent: 'ask_for_practice',
      practiceQuestion: { questionText: 'What is 1/2 + 1/3?' } as any,
    });
    expect(practice.combinedPrompt).toContain('ONE question at a time');
    expect(practice.combinedPrompt).toContain('Do NOT reveal the answer');

    const revision = composePedagogyPrompt({
      requestId: 'e2',
      messageText: 'Help me revise fractions',
      plan: makePlan('revision_prompt', '', 'revision_prompt'),
      intent: 'ask_for_revision',
    });
    expect(revision.combinedPrompt).toContain('RETRIEVAL-FIRST');
    expect(revision.combinedPrompt).toContain('retrieval/recall question');
  });

  it('TEST F: output validation enforces one-question rule including Arabic question mark', () => {
    const single = validateOrchestrationOutput({
      requestId: 'f1',
      responseText: 'Here is a hint: look at the denominator. What do you notice?',
      responseMove: 'socratic_hint',
      plan: makePlan('socratic_hint', '', 'hint_only'),
      includesGuidingQuestion: false,
      revealsFinalAnswer: false,
    });
    expect(single.valid).toBe(true);

    const overloaded = validateOrchestrationOutput({
      requestId: 'f2',
      responseText: 'What is this? Why does it work? How would you check it?',
      responseMove: 'concept_explanation',
      plan: makePlan('concept_explanation'),
      includesGuidingQuestion: false,
      revealsFinalAnswer: false,
    });
    expect(overloaded.valid).toBe(false);
    expect(overloaded.violations).toContain('question_overload');

    const arabicOverload = validateOrchestrationOutput({
      requestId: 'f3',
      responseText: 'هل فهمت؟ ما رأيك؟ جرب الآن؟',
      responseMove: 'concept_explanation',
      plan: makePlan('concept_explanation'),
      includesGuidingQuestion: false,
      revealsFinalAnswer: false,
    });
    expect(arabicOverload.valid).toBe(false);
    expect(arabicOverload.violations).toContain('question_overload');
  });

  it('TEST G: planner stops claiming tutor activity as learning evidence', () => {
    const intents: TutorTurnIntent[] = [
      'ask_concept',
      'ask_for_hint',
      'ask_for_final_answer',
      'ask_for_practice',
      'ask_for_revision',
      'ask_deen_question',
      'express_confusion',
      'express_frustration',
      'serious_safety_risk',
    ];
    for (const intent of intents) {
      const plan = planLearningResponse({
        requestId: `g-${intent}`,
        messageText: 'test',
        intent,
        policyPacket: undefined,
      });
      expect(plan.requiresEvidenceWrite).toBe(false);
    }
    const attempt = planLearningResponse({
      requestId: 'g-attempt',
      messageText: 'my answer is 2/5',
      intent: 'submit_attempt',
      policyPacket: undefined,
    });
    expect(attempt.requiresEvidenceWrite).toBe(true);
  });
});
