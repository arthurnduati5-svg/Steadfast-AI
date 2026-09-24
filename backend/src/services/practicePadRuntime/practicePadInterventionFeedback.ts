// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-06: deterministic Socratic feedback
//
// Deterministic fallback renderer + mandatory leakage/policy
// validation. Reuses the canonical `checkResponseSafety` boundary
// (no third answer-key validator). Zero model calls. Zero
// learning-state mutation: pure functions over the decision plus
// server-owned secrets held only for substring validation.
// ─────────────────────────────────────────────────────────────

import { checkResponseSafety } from '../socraticResponseSafetyService';
import { practicePadSemanticPort } from './practicePadSemanticPort';
import { decidePracticeIntervention } from './practicePadInterventionPolicy';
import type {
  PracticeInterventionDecision,
  PracticeInterventionInput,
  PracticeInterventionLevel,
  PracticeInterventionProposal,
} from './practicePadInterventionContracts';

export const TRUTHFUL_FALLBACK_TEXT =
  "I can see your work, but I can't check this part reliably yet. Show or explain the step you want me to check.";

const SAFE_FALLBACK_NEXT_ACTION = 'Show or explain the step you want me to check.';

function stepRef(decision: PracticeInterventionDecision): string {
  return decision.targetStepIndex === undefined || decision.targetStepIndex === null
    ? 'this step'
    : `step ${decision.targetStepIndex + 1}`;
}

/** Deterministic, problem-agnostic renderer. No answers, no solutions. */
export function renderInterventionFeedback(decision: PracticeInterventionDecision): { feedbackText: string; nextLearnerAction: string } {
  const ref = stepRef(decision);
  switch (decision.level) {
    case 'L0':
      return {
        feedbackText: 'Your reasoning checks out so far. Can you explain why that transformation was valid?',
        nextLearnerAction: decision.learnerActionRequired,
      };
    case 'L1':
      if (decision.move === 'truthful_fallback' || decision.trigger === 'reasoning_unavailable') {
        return { feedbackText: TRUTHFUL_FALLBACK_TEXT, nextLearnerAction: SAFE_FALLBACK_NEXT_ACTION };
      }
      return {
        feedbackText: `What were you trying to do in ${ref}? Explain it in your own words, then try that step again.`,
        nextLearnerAction: decision.learnerActionRequired,
      };
    case 'L2':
      return {
        feedbackText: `Look again at what the outside factor applies to in ${ref}. Which parts must it reach?`,
        nextLearnerAction: decision.learnerActionRequired,
      };
    case 'L3':
      return {
        feedbackText: `In ${ref}, which term still needs the same operation? Do just that part next.`,
        nextLearnerAction: decision.learnerActionRequired,
      };
    case 'L4':
      return {
        feedbackText: 'Try the same operation on a simpler expression first, then bring the idea back here.',
        nextLearnerAction: decision.learnerActionRequired,
      };
    case 'L5':
      return {
        feedbackText: "Let's rebuild this one step at a time. What should happen first?",
        nextLearnerAction: decision.learnerActionRequired,
      };
    default:
      return { feedbackText: TRUTHFUL_FALLBACK_TEXT, nextLearnerAction: SAFE_FALLBACK_NEXT_ACTION };
  }
}

export interface InterventionValidationSecrets {
  expectedAnswer?: string | null;
  acceptableAnswerForms?: string[];
  evaluationPlan?: string | null;
}

function normalized(value: unknown): string {
  return String(value ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

export interface InterventionValidationResult {
  valid: boolean;
  reasons: string[];
}

/** Mandatory pre-visibility gate. Fails closed to the safe fallback. */
export function validateInterventionFeedback(args: {
  feedbackText: string;
  nextLearnerAction: string;
  level: PracticeInterventionLevel;
  decision: PracticeInterventionDecision;
  secrets: InterventionValidationSecrets;
}): InterventionValidationResult {
  const reasons: string[] = [];
  const text = String(args.feedbackText ?? '');
  const action = String(args.nextLearnerAction ?? '');
  if (!text.trim()) reasons.push('feedbackText must not be empty');
  if (!action.trim()) reasons.push('nextLearnerAction must not be empty');
  if (args.decision.mayRevealFinalAnswer !== false) reasons.push('mayRevealFinalAnswer must be false');

  const normText = normalized(text);
  const expected = normalized(args.secrets.expectedAnswer);
  if (expected && expected.length >= 2 && normText.includes(expected)) {
    reasons.push('feedback exposes the protected expected answer');
  }
  for (const form of args.secrets.acceptableAnswerForms ?? []) {
    const f = normalized(form);
    if (f && f.length >= 2 && normText.includes(f)) reasons.push('feedback exposes an acceptable answer form');
  }
  const plan = normalized(args.secrets.evaluationPlan);
  if (plan && plan.length >= 4 && normText.includes(plan)) {
    reasons.push('feedback exposes the hidden evaluation plan');
  }

  const safety = checkResponseSafety(text);
  if (safety.status === 'possible_final_answer_leak' || safety.status === 'possible_answer_key_leak') {
    reasons.push(`final-answer validator blocked feedback (${safety.status})`);
  }
  return { valid: reasons.length === 0, reasons };
}

export function safeFallbackProposal(decision: PracticeInterventionDecision): PracticeInterventionProposal {
  return {
    decision: {
      ...decision,
      move: 'truthful_fallback',
      trigger: 'validation_failure_fallback',
      mayRevealFinalAnswer: false,
    },
    feedbackText: TRUTHFUL_FALLBACK_TEXT,
    nextLearnerAction: SAFE_FALLBACK_NEXT_ACTION,
    ...(decision.targetStepIndex !== undefined ? { targetStepIndex: decision.targetStepIndex } : {}),
    validated: true,
    fallbackUsed: true,
    liveModelCalls: 0,
  };
}

export function proposePracticeIntervention(
  input: PracticeInterventionInput,
  secrets: InterventionValidationSecrets = {},
): PracticeInterventionProposal {
  // Semantic port stays disabled in PP-06; the call below only records
  // the seam usage with zero live calls (proof B8).
  void practicePadSemanticPort.liveCallCount();
  const decision = decidePracticeIntervention(input);
  const rendered = renderInterventionFeedback(decision);
  const validation = validateInterventionFeedback({
    feedbackText: rendered.feedbackText,
    nextLearnerAction: rendered.nextLearnerAction,
    level: decision.level,
    decision,
    secrets,
  });
  if (!validation.valid) return safeFallbackProposal(decision);
  return {
    decision,
    feedbackText: rendered.feedbackText,
    nextLearnerAction: rendered.nextLearnerAction,
    ...(decision.targetStepIndex !== undefined ? { targetStepIndex: decision.targetStepIndex } : {}),
    validated: true,
    fallbackUsed: false,
    liveModelCalls: 0,
  };
}
