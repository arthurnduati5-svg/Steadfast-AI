import type { LearningEvidenceWriteResult } from './evidenceAndRevisionContracts';
import type { TutorTurnIntent, TutorResponseMove } from './tutorOrchestrationContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';

export interface EvidenceWriteInput {
  requestId: string;
  tutorLearnerId: string;
  intent: TutorTurnIntent;
  responseMove: TutorResponseMove;
  hint?: SocraticHint;
  stepCheck?: StepCheckResult;
  mistakeAnalysis?: MistakeAnalysis;
  skillTag?: string;
}

export function writeLearningEvidence(input: EvidenceWriteInput): LearningEvidenceWriteResult {
  if (input.intent === 'serious_safety_risk') {
    return {
      requestId: input.requestId,
      evidenceWritten: false,
      evidenceType: 'none',
      reason: 'Safety support turn - no learning evidence recorded.',
    };
  }

  if (input.mistakeAnalysis && input.mistakeAnalysis.category !== 'unknown') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'mistake',
      skillTag: input.skillTag || input.mistakeAnalysis.revisionTag,
      confidence: input.mistakeAnalysis.confidence === 'high' ? 'high' : input.mistakeAnalysis.confidence === 'medium' ? 'medium' : 'low',
      reason: `Mistake classified: ${input.mistakeAnalysis.category}. Strategy: ${input.mistakeAnalysis.feedbackStrategy}`,
    };
  }

  if (input.stepCheck && input.stepCheck.status === 'correct') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'concept_understood',
      skillTag: input.skillTag,
      confidence: 'high',
      reason: 'Learner demonstrated correct understanding.',
    };
  }

  if (input.hint) {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'hint_used',
      skillTag: input.skillTag,
      confidence: 'medium',
      reason: `Hint level ${input.hint.hintLevel} provided to learner.`,
    };
  }

  if (input.responseMove === 'practice_question') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'practice_completed',
      skillTag: input.skillTag,
      confidence: 'medium',
      reason: 'Practice question generated for learner.',
    };
  }

  if (input.responseMove === 'attempt_feedback' || input.intent === 'submit_attempt') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'attempt',
      skillTag: input.skillTag,
      confidence: 'low',
      reason: 'Learner submitted an attempt for review.',
    };
  }

  if (input.intent === 'ask_concept' || input.intent === 'express_confusion') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'concept_understood',
      skillTag: input.skillTag,
      confidence: 'low',
      reason: 'Concept explanation provided to learner.',
    };
  }

  if (input.intent === 'ask_deen_question') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'revision_needed',
      skillTag: input.skillTag || 'deen_question',
      confidence: 'low',
      reason: 'Deen question referred per policy.',
    };
  }

  if (input.intent === 'ask_for_revision') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'revision_needed',
      skillTag: input.skillTag,
      confidence: 'medium',
      reason: 'Revision request processed.',
    };
  }

  return {
    requestId: input.requestId,
    evidenceWritten: true,
    evidenceType: 'none',
    reason: 'Turn completed - general tracking.',
  };
}
