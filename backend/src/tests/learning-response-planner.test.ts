import { describe, it, expect } from 'vitest';
import { planLearningResponse } from '../services/tutorOrchestration/learningResponsePlanner';
import type { LearningResponsePlanInput } from '../services/tutorOrchestration/learningResponsePlannerContracts';

describe('LearningResponsePlanner', () => {
  const baseInput: LearningResponsePlanInput = {
    requestId: 'test-001',
    messageText: '',
    intent: 'unknown',
    policyPacket: {},
  };

  it('ask_concept maps to concept_explanation', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_concept' });
    expect(plan.responseMove).toBe('concept_explanation');
    expect(plan.requiresAiGeneration).toBe(true);
    // Tutor activity alone is not learning evidence (AI-INTELLIGENCE-02).
    expect(plan.requiresEvidenceWrite).toBe(false);
  });

  it('ask_for_hint maps to socratic_hint', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_for_hint' });
    expect(plan.responseMove).toBe('socratic_hint');
    expect(plan.requiresHint).toBe(true);
    expect(plan.requiresAiGeneration).toBe(false);
  });

  it('ask_for_final_answer does not map to final answer', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_for_final_answer' });
    expect(plan.responseMove).toBe('one_step_guidance');
    expect(plan.requiresAiGeneration).toBe(true);
    expect(plan.requiresHint).toBe(true);
    expect(plan.allowedAnswerDepth).not.toBe('final_answer');
  });

  it('submit_attempt maps to attempt_feedback', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'submit_attempt' });
    expect(plan.responseMove).toBe('attempt_feedback');
    expect(plan.requiresStepCheck).toBe(true);
    expect(plan.requiresEvidenceWrite).toBe(true);
    expect(plan.requiresRevisionUpdate).toBe(true);
  });

  it('ask_for_practice maps to practice_question', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_for_practice' });
    expect(plan.responseMove).toBe('practice_question');
    expect(plan.requiresPracticeQuestion).toBe(true);
  });

  it('ask_deen_question respects Deen policy', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_deen_question' });
    expect(plan.responseMove).toBe('deen_referral');
    expect(plan.requiresAiGeneration).toBe(false);
  });

  it('unknown maps to clarify_question', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'unknown' });
    expect(plan.responseMove).toBe('clarify_question');
    expect(plan.requiresAiGeneration).toBe(true);
  });

  it('serious_safety_risk maps to safety_support', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'serious_safety_risk' });
    expect(plan.responseMove).toBe('safety_support_message');
    expect(plan.requiresAiGeneration).toBe(false);
    expect(plan.requiresEvidenceWrite).toBe(false);
  });

  it('express_confusion maps to concept_explanation', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'express_confusion' });
    expect(plan.responseMove).toBe('concept_explanation');
  });

  it('express_frustration maps to socratic_hint', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'express_frustration' });
    expect(plan.responseMove).toBe('socratic_hint');
  });

  it('ask_for_revision maps to revision_prompt', () => {
    const plan = planLearningResponse({ ...baseInput, intent: 'ask_for_revision' });
    expect(plan.responseMove).toBe('revision_prompt');
    expect(plan.requiresPracticeQuestion).toBe(true);
    // Tutor activity alone is not learning evidence (AI-INTELLIGENCE-02).
    expect(plan.requiresEvidenceWrite).toBe(false);
    expect(plan.requiresRevisionUpdate).toBe(true);
  });
});
