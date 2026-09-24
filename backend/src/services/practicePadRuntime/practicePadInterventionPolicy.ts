// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-06: deterministic intervention policy
//
// Backend-owned, model-free. Consumes PP-04/PP-05 truth; never
// recalculates it. Weakest-useful-help escalation is capped by
// trusted durable support provenance (PP-07 owned); the count is
// accepted as a number, never inferred from raw text here.
// ─────────────────────────────────────────────────────────────

import type {
  PracticeInterventionDecision,
  PracticeInterventionInput,
  PracticeInterventionLevel,
} from './practicePadInterventionContracts';

const MAX_LEVEL_INDEX = 5;

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

function levelAt(index: number): PracticeInterventionLevel {
  return (['L0', 'L1', 'L2', 'L3', 'L4', 'L5'] as const)[clamp(index, 0, MAX_LEVEL_INDEX)];
}

/**
 * Maximum intervention index allowed by trusted support history.
 * First contact: L1. Each trusted prior support unlocks one rung.
 * L5 requires >= 4 trusted prior supports. Never jumps on raw text.
 */
export function maxLevelIndexForTrustedSupport(trustedSupportCount: number): number {
  const n = Number.isInteger(trustedSupportCount) && trustedSupportCount > 0 ? trustedSupportCount : 0;
  return clamp(1 + n, 1, MAX_LEVEL_INDEX);
}

export function decidePracticeIntervention(input: PracticeInterventionInput): PracticeInterventionDecision {
  const trusted = Number.isInteger(input.trustedSupportCount) && (input.trustedSupportCount as number) > 0
    ? (input.trustedSupportCount as number)
    : 0;
  const cap = maxLevelIndexForTrustedSupport(trusted);
  const noAnswer = false as const;

  switch (input.checkStatus) {
    case 'CONFIRMED_CORRECT': {
      return {
        level: 'L0',
        move: 'acknowledge_and_extend',
        trigger: 'confirmed_correct',
        reasoningStatus: input.checkStatus,
        supportReason: 'Deterministic confirmation; no hint manufactured.',
        learnerActionRequired: 'Explain why the transformation was valid or continue to the next step.',
        mayRevealFinalAnswer: noAnswer,
        semanticLanguageRequired: false,
      };
    }
    case 'NEEDS_CLARIFICATION': {
      return {
        level: 'L1',
        move: 'metacognitive_clarification',
        trigger: 'needs_clarification',
        reasoningStatus: input.checkStatus,
        supportReason: 'Work cannot be parsed as written; clarification required.',
        learnerActionRequired: 'Rewrite or explain the ambiguous step.',
        mayRevealFinalAnswer: noAnswer,
        semanticLanguageRequired: false,
      };
    }
    case 'NEEDS_SEMANTIC_ANALYSIS': {
      return {
        level: 'L1',
        move: 'metacognitive_clarification',
        trigger: 'needs_semantic_analysis_unavailable',
        reasoningStatus: input.checkStatus,
        supportReason: 'Deterministic verification unavailable and semantic model disabled; safe L1 request only.',
        learnerActionRequired: 'Show or explain the step you want checked.',
        mayRevealFinalAnswer: noAnswer,
        semanticLanguageRequired: true,
      };
    }
    case 'CONFIRMED_INCORRECT': {
      if (input.firstDivergenceStepIndex === null || input.firstDivergenceStepIndex === undefined) {
        // Wrong final state without a localizable causal step: do not
        // fabricate a target; ask for reasoning at L1.
        return {
          level: 'L1',
          move: 'metacognitive_clarification',
          trigger: 'needs_semantic_analysis_unavailable',
          reasoningStatus: input.checkStatus,
          supportReason: 'Incorrect final state with no proven causal step; no target fabricated.',
          learnerActionRequired: 'Show the step-by-step reasoning behind your answer.',
          mayRevealFinalAnswer: noAnswer,
          semanticLanguageRequired: true,
        };
      }
      // PP-07 escalation: the delivered level IS the trusted cap. First
      // supported encounter delivers L1; each trusted prior support
      // unlocks exactly one further rung (L2…L5). The cap itself
      // enforces the no-jump law: raw learner text never moves it.
      const cappedIndex = cap;
      const level = levelAt(cappedIndex);
      return {
        level,
        move: 'metacognitive_clarification',
        trigger: 'first_divergence',
        targetStepIndex: input.firstDivergenceStepIndex,
        ...(input.firstDivergenceBlockId ? { targetBlockId: input.firstDivergenceBlockId } : {}),
        reasoningStatus: input.checkStatus,
        supportReason: input.reasonCode
          ? `Structural divergence (${input.reasonCode}) at step ${input.firstDivergenceStepIndex + 1}; structural candidate only.`
          : `Structural divergence at step ${input.firstDivergenceStepIndex + 1}; structural candidate only.`,
        learnerActionRequired: `Re-examine step ${input.firstDivergenceStepIndex + 1} and describe what you tried to do there.`,
        mayRevealFinalAnswer: noAnswer,
        semanticLanguageRequired: false,
      };
    }
    default: {
      // NOT_EVALUATED, STALE_VERSION, CONFLICT, FAILED_CLOSED, unknown:
      // reasoning unavailable → truthful fallback at L1.
      return {
        level: 'L1',
        move: 'truthful_fallback',
        trigger: 'reasoning_unavailable',
        reasoningStatus: input.checkStatus,
        supportReason: 'Reasoning unavailable; no diagnosis invented.',
        learnerActionRequired: 'Show or explain the step you want checked.',
        mayRevealFinalAnswer: noAnswer,
        semanticLanguageRequired: true,
      };
    }
  }
}

/**
 * Escalate one rung only when new trusted provenance arrives.
 * Pure helper enforcing the no-jump law (used by PP-07 callers).
 */
export function escalateInterventionLevel(current: PracticeInterventionLevel, trustedSupportCount: number): PracticeInterventionLevel {
  const order: PracticeInterventionLevel[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5'];
  const at = order.indexOf(current);
  const cap = maxLevelIndexForTrustedSupport(trustedSupportCount);
  const next = Math.min(at + 1, cap, MAX_LEVEL_INDEX);
  return order[Math.max(0, next)];
}
