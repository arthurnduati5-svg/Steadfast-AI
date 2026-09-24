// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-04: deterministic math/step checker
//
// Wires ONLY reliable deterministic evaluation through the bounded
// mathematical evaluation engine (practicePadMathEvaluator):
//   1. normalized exact equality
//   2. numeric equality (bounded tolerance)
//   3. exact rational equivalence
//   4. bounded arithmetic expressions (precedence-safe, no code exec)
//   5. single-variable algebraic equivalence (polynomial normalization)
//   6. single-variable linear-equation equivalence (solution-set proof)
//   7. server-owned expected-answer + acceptable-form comparison
//
// PP-04 law: no `eval`, no `new Function`, no Function constructor, no VM,
// no shell. Everything undecidable degrades to NEEDS_SEMANTIC_ANALYSIS
// (unsupported) or NEEDS_CLARIFICATION (invalid). Phrase/keyword cues are
// NEVER correctness authority; they survive only as an explicit
// low-confidence supplementary signal (see heuristicSupplementarySignal).
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import type {
  PracticePadDeterministicVerdict,
  PracticePadCheckerPath,
} from './practicePadCheckContracts';
import {
  evaluateMathDeterministically,
  normalizeMathInput,
  type DeterministicMathEvaluator,
  type ServerEvaluationType,
} from './practicePadMathEvaluator';

export interface DeterministicCheckInput {
  workText: string;
  selectedStep?: string | null;
  /** Server-owned expected answer. Absent = cannot confirm by comparison. */
  expectedAnswer?: string | null;
  /** Server-owned evaluation metadata. Never client-chosen. */
  evaluationType?: ServerEvaluationType | null;
  /** Server-only acceptable forms. Never serialized to the learner. */
  acceptableAnswerForms?: string[];
}

export interface DeterministicCheckOutput {
  verdict: PracticePadDeterministicVerdict;
  checkerPath: PracticePadCheckerPath;
  confidence: number;
  suspectedIssue?: string;
}

export function normalizeMathText(value: unknown): string {
  return normalizeMathInput(value);
}

function checkerPathForEvaluator(evaluator: DeterministicMathEvaluator): PracticePadCheckerPath {
  switch (evaluator) {
    case 'NUMERIC':
      return 'deterministic_numeric';
    case 'RATIONAL':
      return 'deterministic_rational';
    case 'ARITHMETIC':
      return 'deterministic_arithmetic';
    case 'ALGEBRAIC_EQUIVALENCE':
      return 'deterministic_algebraic_sample';
    case 'LINEAR_EQUATION':
      return 'deterministic_linear';
    case 'EXACT_TEXT':
    default:
      return 'deterministic_exact';
  }
}

export function requestFingerprint(workText: string, selectedStep?: string | null): string {
  return createHash('sha256')
    .update(`${normalizeMathText(workText)}::${normalizeMathText(selectedStep ?? '')}`)
    .digest('hex');
}

export function checkDeterministically(input: DeterministicCheckInput): DeterministicCheckOutput {
  const work = normalizeMathText(input.workText);
  const step = normalizeMathText(input.selectedStep ?? '');
  const expected = normalizeMathText(input.expectedAnswer ?? '');

  if (!work && !step) {
    return {
      verdict: 'unknown',
      checkerPath: 'validation_failed',
      confidence: 0,
      suspectedIssue: 'No learner work was submitted for this version.',
    };
  }

  const candidate = step || work;

  // Server-owned expected answer present: authoritative math evaluation.
  if (expected) {
    const math = evaluateMathDeterministically({
      candidate,
      expected,
      serverEvaluationType: input.evaluationType ?? null,
      acceptableAnswerForms: input.acceptableAnswerForms ?? [],
    });
    if (math.status === 'CORRECT') {
      return {
        verdict: 'correct',
        checkerPath: checkerPathForEvaluator(math.evaluator),
        confidence: math.confidence,
      };
    }
    if (math.status === 'INCORRECT') {
      // PP-05 law: a wrong final answer alone never identifies a causal
      // step. First divergence comes only from the anchored reasoning
      // analysis in the check runtime.
      return {
        verdict: 'incorrect',
        checkerPath: checkerPathForEvaluator(math.evaluator),
        confidence: math.confidence,
        suspectedIssue: math.safeSummary || 'The working does not match the expected result.',
      };
    }
    if (math.status === 'INVALID') {
      return {
        verdict: 'unknown',
        checkerPath: 'deterministic_invalid',
        confidence: 0.2,
        suspectedIssue: 'This working cannot be read as written; clarification is required.',
      };
    }
    // UNSUPPORTED: representation outside the decidable grammar.
    // Never incorrect, never misconception evidence.
    return {
      verdict: 'unknown',
      checkerPath: 'deterministic_unsupported',
      confidence: 0.2,
      suspectedIssue: 'This working cannot be verified deterministically yet; semantic analysis is required.',
    };
  }

  // No server-owned expected answer: mathematical correctness cannot be
  // determined. Never confirm or deny based on phrasing.
  return {
    verdict: 'unknown',
    checkerPath: 'semantic_unavailable',
    confidence: 0.15,
    suspectedIssue: 'No authoritative expected answer is registered for this problem yet.',
  };
}

// ── Demoted heuristic: supplementary low-confidence signal only ──
// Ported keyword scan from backend/src/services/practicePadService.ts
// (detectErrorType). It MUST NOT decide correctness; it only suggests
// where a future semantic model could look first.

export interface HeuristicSupplementarySignal {
  hint: string | null;
  confidence: 'low';
  mustNotDecideCorrectness: true;
}

const HEURISTIC_PATTERNS: Array<[RegExp, string]> = [
  [/\bforgot|can't remember|dont remember|do not remember|memory|recall\b/, 'possible recall gap'],
  [/\bwrong formula|wrong method|used .* instead|method\b/, 'possible method choice issue'],
  [/\bmissed step|skipped|jumped|went straight\b/, 'possible missing bridge step'],
  [/\bsign|minus|plus|arithmetic|calculation|careless|small mistake\b/, 'possible small calculation slip'],
  [/\bconfused|misunderstand|not the same|mixed up|concept\b/, 'possible concept mix-up'],
];

export function heuristicSupplementarySignal(args: {
  workText: string;
  selectedStep?: string | null;
}): HeuristicSupplementarySignal {
  const text = `${normalizeMathText(args.selectedStep ?? '')} ${normalizeMathText(args.workText)}`;
  for (const [pattern, hint] of HEURISTIC_PATTERNS) {
    if (pattern.test(text)) return { hint, confidence: 'low', mustNotDecideCorrectness: true };
  }
  return { hint: null, confidence: 'low', mustNotDecideCorrectness: true };
}
