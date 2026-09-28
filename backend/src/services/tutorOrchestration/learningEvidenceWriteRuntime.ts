import type { LearningEvidenceWriteResult } from './evidenceAndRevisionContracts';
import type { TutorTurnIntent, TutorResponseMove } from './tutorOrchestrationContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';

/**
 * R5 — Learning evidence must represent LEARNER behavior, not tutor activity.
 *
 * Frozen semantics:
 * A. serious_safety_risk           → evidenceWritten=false
 * B. validated incorrect attempt   → evidenceWritten=true (mistake/attempt)
 * C. validated correct step        → evidenceWritten=true (attempt; no auto-mastery)
 * D. unevaluated submitted attempt → observed attempt, LOW confidence, no correctness implied
 * E. tutor supplied hint only      → evidenceWritten=false
 * F. tutor generated practice      → evidenceWritten=false
 * G. tutor explained a concept     → evidenceWritten=false
 * H. learner expressed confusion   → evidenceWritten=false
 * I. learner asked a question      → evidenceWritten=false
 * J. deen question/referral        → no mastery/understanding evidence
 * K. revision request              → no proof-of-learning evidence
 * General default: evidenceWritten=false.
 */
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
  // A. Safety turn — never a learning evidence event.
  if (input.intent === 'serious_safety_risk') {
    return {
      requestId: input.requestId,
      evidenceWritten: false,
      evidenceType: 'none',
      reason: 'Safety support turn - no learning evidence recorded.',
    };
  }

  // B/C. Validated learner step (correct or incorrect) is real learner evidence.
  if (input.stepCheck && input.stepCheck.status === 'correct') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'attempt',
      skillTag: input.skillTag,
      confidence: 'high',
      reason: 'Learner step validated as correct (single attempt - not permanent mastery).',
    };
  }

  if (input.stepCheck && input.stepCheck.status === 'incorrect') {
    if (input.mistakeAnalysis && input.mistakeAnalysis.category !== 'unknown') {
      return {
        requestId: input.requestId,
        evidenceWritten: true,
        evidenceType: 'mistake',
        skillTag: input.skillTag || input.mistakeAnalysis.revisionTag,
        confidence: input.mistakeAnalysis.confidence === 'high' ? 'high' : input.mistakeAnalysis.confidence === 'medium' ? 'medium' : 'low',
        reason: `Validated incorrect attempt. Mistake classified: ${input.mistakeAnalysis.category}.`,
      };
    }
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'attempt',
      skillTag: input.skillTag,
      confidence: 'medium',
      reason: 'Learner step validated as incorrect.',
    };
  }

  // D. Learner submitted an attempt without a correctness verdict:
  //    observed attempt only, LOW confidence, no correctness/mastery implied.
  if (input.stepCheck || input.intent === 'submit_attempt' || input.responseMove === 'attempt_feedback') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'attempt',
      skillTag: input.skillTag,
      confidence: 'low',
      reason: 'Learner attempt observed without a correctness verdict - no mastery implied.',
    };
  }

  // B (alternative). A validated mistake without any step check verdict.
  if (input.mistakeAnalysis && input.mistakeAnalysis.category !== 'unknown') {
    return {
      requestId: input.requestId,
      evidenceWritten: true,
      evidenceType: 'mistake',
      skillTag: input.skillTag || input.mistakeAnalysis.revisionTag,
      confidence: input.mistakeAnalysis.confidence === 'high' ? 'high' : input.mistakeAnalysis.confidence === 'medium' ? 'medium' : 'low',
      reason: `Validated learner mistake classified: ${input.mistakeAnalysis.category}. Strategy: ${input.mistakeAnalysis.feedbackStrategy}`,
    };
  }

  // J. Deen question/referral — no mastery/understanding evidence.
  if (input.intent === 'ask_deen_question' || input.responseMove === 'deen_referral') {
    return {
      requestId: input.requestId,
      evidenceWritten: false,
      evidenceType: 'none',
      reason: 'Deen referral turn - no mastery or understanding evidence recorded.',
    };
  }

  // K. Revision request — workflow intent, not proof of learning.
  if (input.intent === 'ask_for_revision' || input.responseMove === 'revision_prompt') {
    return {
      requestId: input.requestId,
      evidenceWritten: false,
      evidenceType: 'none',
      reason: 'Revision request drives workflow intent only - not learning evidence.',
    };
  }

  // E/F/G/H/I + general default (evidenceWritten=false):
  // tutor hint, tutor practice question, tutor explanation, learner
  // confusion, learner questions, and all other tutor activity are NOT
  // learner evidence.
  return {
    requestId: input.requestId,
    evidenceWritten: false,
    evidenceType: 'none',
    reason: 'No validated learner behavior this turn - no evidence recorded.',
  };
}
