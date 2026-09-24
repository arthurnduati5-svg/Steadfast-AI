// ─────────────────────────────────────────────────────────────
// Steadfast AI — Practice Pad PP-05: deterministic reasoning graph +
// first causal divergence.
//
// DERIVED analysis, never learner truth. PracticeDocumentRevision stays
// the raw authoritative work; this module builds an ordered,
// deterministic view over it:
//
//   anchored authoritative equation (server-owned problem prompt only)
//   → learner step 0 → learner step 1 → …
//
// and walks transitions in order using ONLY the PP-04 bounded math
// engine (evaluateMathDeterministically). No parser/equivalence logic
// is duplicated here; no model calls; no persistence; no mastery,
// memory, revision, or misconception writes.
//
// FIRST-DIVERGENCE LAW: a transition may become `firstDivergence` only
// when reasoning is anchored, every previous transition is VALID, and
// this transition is deterministically INVALID. An earlier
// UNSUPPORTED (or MALFORMED) transition blocks any later causal claim:
// the result is NEEDS_SEMANTIC_ANALYSIS (or NEEDS_CLARIFICATION) with
// firstDivergence unset.
// ─────────────────────────────────────────────────────────────

import type { PracticePadCheckerPath } from './practicePadCheckContracts';
import type { PracticeWorkSnapshot } from './practicePadDocumentContracts';
import {
  evaluateMathDeterministically,
  normalizeMathInput,
  parseMathExpression,
  type DeterministicMathEvaluator,
} from './practicePadMathEvaluator';

// ── Bounds (§3) ──

export const REASONING_MAX_STEPS = 30;
export const REASONING_MAX_STEP_CHARS = 300;

export type ReasoningTransitionVerdict = 'VALID' | 'INVALID' | 'UNSUPPORTED' | 'MALFORMED';

export type ReasoningReasonCode =
  | 'EQUIVALENCE_CONFIRMED'
  | 'SOLUTION_SET_CHANGED'
  | 'VALUE_CHANGED'
  | 'ALGEBRAIC_EQUIVALENCE_BROKEN'
  | 'INVALID_TRANSFORMATION'
  | 'UNSUPPORTED_TRANSITION'
  | 'MALFORMED_STEP';

export type ReasoningAnalysisStatus =
  | 'ALL_VALID'
  | 'DIVERGED'
  | 'NEEDS_SEMANTIC_ANALYSIS'
  | 'NEEDS_CLARIFICATION';

export interface ReasoningStep {
  index: number;
  blockId: string;
  raw: string;
  normalized: string;
}

export interface ReasoningTransition {
  /** null source = trusted authoritative anchor. */
  fromIndex: number | null;
  toIndex: number;
  verdict: ReasoningTransitionVerdict;
  reasonCode: ReasoningReasonCode;
  checkerPath: PracticePadCheckerPath;
}

export interface ReasoningFirstDivergence {
  stepIndex: number;
  reasonCode: ReasoningReasonCode;
  observedSummary: string;
}

export interface PracticeReasoningAnalysis {
  attemptId: string;
  basedOnVersion: number;
  anchored: boolean;
  anchorForm?: string;
  steps: ReasoningStep[];
  transitions: ReasoningTransition[];
  confirmedPrefixCount: number;
  firstDivergence?: ReasoningFirstDivergence;
  status: ReasoningAnalysisStatus;
  unresolvedReason?: string;
  /** Deterministic confidence for a proven divergence. */
  confidence: number;
  checkerPath: PracticePadCheckerPath;
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

// ── Step extraction (§3): stored TEXT/EQUATION blocks only, in order ──

export function extractReasoningSteps(snapshot: PracticeWorkSnapshot): ReasoningStep[] {
  const ordered = [...snapshot.blocks]
    .filter((b) => b.kind === 'TEXT' || b.kind === 'EQUATION')
    .sort((a, b) => a.order - b.order || (a.blockId < b.blockId ? -1 : a.blockId > b.blockId ? 1 : 0));
  const steps: ReasoningStep[] = [];
  for (const block of ordered) {
    const parts = String(block.content ?? '').split(/[\n;]+/);
    for (const part of parts) {
      const raw = part.trim();
      if (!raw) continue;
      steps.push({
        index: steps.length,
        blockId: block.blockId,
        raw,
        normalized: normalizeMathInput(raw),
      });
    }
  }
  return steps;
}

// ── Authoritative anchor (§4): server-owned problem prompt only ──

const ANCHOR_EDGE_CHARS = /[.:;?!]/;

export function extractAnchorEquation(problemPrompt: string): string | null {
  const prompt = String(problemPrompt ?? '');
  if (!prompt) return null;
  const equalsCount = (prompt.match(/=/g) || []).length;
  // Multiple equations are ambiguous: never guess which one anchors.
  if (equalsCount !== 1) return null;
  const eqPos = prompt.indexOf('=');
  let leftStart = 0;
  for (let i = eqPos - 1; i >= 0; i -= 1) {
    if (ANCHOR_EDGE_CHARS.test(prompt[i])) {
      leftStart = i + 1;
      break;
    }
  }
  let rightEnd = prompt.length;
  for (let i = eqPos + 1; i < prompt.length; i += 1) {
    if (ANCHOR_EDGE_CHARS.test(prompt[i])) {
      rightEnd = i;
      break;
    }
  }
  const candidate = prompt.slice(leftStart, rightEnd).trim();
  if (!candidate || candidate.length > 500 || !/\d/.test(candidate)) return null;
  const sides = candidate.split('=');
  if (sides.length !== 2) return null;
  const left = sides[0].trim();
  const right = sides[1].trim();
  if (!left || !right) return null;
  // Both sides must parse inside the decidable grammar; single variable max.
  const parsedLeft = parseMathExpression(left);
  const parsedRight = parseMathExpression(right);
  if (!parsedLeft.ok || !parsedRight.ok) return null;
  const vars = new Set([...parsedLeft.variables, ...parsedRight.variables]);
  if (vars.size > 1) return null;
  return candidate;
}

// ── Transition validation (§5): PP-04 engine only, never duplicated ──

export function validateReasoningTransition(previous: string, next: string): {
  verdict: ReasoningTransitionVerdict;
  reasonCode: ReasoningReasonCode;
  checkerPath: PracticePadCheckerPath;
} {
  const math = evaluateMathDeterministically({ candidate: next, expected: previous });
  const checkerPath = checkerPathForEvaluator(math.evaluator === 'NONE' ? 'EXACT_TEXT' : math.evaluator);
  if (math.status === 'CORRECT') {
    return { verdict: 'VALID', reasonCode: 'EQUIVALENCE_CONFIRMED', checkerPath };
  }
  if (math.status === 'INCORRECT') {
    let reasonCode: ReasoningReasonCode = 'INVALID_TRANSFORMATION';
    if (math.evaluator === 'LINEAR_EQUATION') reasonCode = 'SOLUTION_SET_CHANGED';
    else if (math.evaluator === 'NUMERIC' || math.evaluator === 'RATIONAL' || math.evaluator === 'ARITHMETIC') {
      reasonCode = 'VALUE_CHANGED';
    } else if (math.evaluator === 'ALGEBRAIC_EQUIVALENCE') reasonCode = 'ALGEBRAIC_EQUIVALENCE_BROKEN';
    return { verdict: 'INVALID', reasonCode, checkerPath };
  }
  if (math.status === 'INVALID') {
    return { verdict: 'MALFORMED', reasonCode: 'MALFORMED_STEP', checkerPath };
  }
  return { verdict: 'UNSUPPORTED', reasonCode: 'UNSUPPORTED_TRANSITION', checkerPath };
}

// ── Graph analysis (§§6–9): ordered walk with the divergence law ──

export interface AnalyzeReasoningGraphArgs {
  attemptId: string;
  basedOnVersion: number;
  snapshot: PracticeWorkSnapshot;
  /** Server-owned learner-safe problem prompt. Never client text. */
  problemPrompt: string;
}

const DIVERGENCE_CONFIDENCE = 0.86;

export function analyzeReasoningGraph(args: AnalyzeReasoningGraphArgs): PracticeReasoningAnalysis {
  const base = {
    attemptId: args.attemptId,
    basedOnVersion: args.basedOnVersion,
    steps: [] as ReasoningStep[],
    transitions: [] as ReasoningTransition[],
    confirmedPrefixCount: 0,
    confidence: 0.2,
    checkerPath: 'deterministic_unsupported' as PracticePadCheckerPath,
  };

  const steps = extractReasoningSteps(args.snapshot);
  if (steps.length === 0) {
    return {
      ...base,
      anchored: false,
      status: 'NEEDS_CLARIFICATION',
      unresolvedReason: 'No mathematical steps were found in the stored work.',
    };
  }
  const oversize = steps.find((s) => s.raw.length > REASONING_MAX_STEP_CHARS);
  if (oversize) {
    return {
      ...base,
      steps,
      anchored: false,
      status: 'NEEDS_CLARIFICATION',
      unresolvedReason: `Step ${oversize.index} exceeds the readable length bound; clarification is required.`,
    };
  }
  if (steps.length > REASONING_MAX_STEPS) {
    return {
      ...base,
      steps,
      anchored: false,
      status: 'NEEDS_SEMANTIC_ANALYSIS',
      unresolvedReason: `Work exceeds the bounded reasoning length (${REASONING_MAX_STEPS} steps).`,
    };
  }

  const anchor = extractAnchorEquation(args.problemPrompt);
  if (!anchor) {
    // Unanchored work: learner-to-learner transitions may be inspected,
    // but a globally first causal divergence must never be fabricated.
    // A malformed learner step still needs clarification, never blame.
    const transitions: ReasoningTransition[] = [];
    for (let i = 1; i < steps.length; i += 1) {
      const checked = validateReasoningTransition(steps[i - 1].raw, steps[i].raw);
      transitions.push({ fromIndex: i - 1, toIndex: i, ...checked });
      if (checked.verdict === 'MALFORMED') {
        return {
          ...base,
          steps,
          transitions,
          anchored: false,
          status: 'NEEDS_CLARIFICATION',
          unresolvedReason: `Step ${i} cannot be parsed as written; clarification is required.`,
        };
      }
    }
    return {
      ...base,
      steps,
      transitions,
      anchored: false,
      status: 'NEEDS_SEMANTIC_ANALYSIS',
      unresolvedReason: 'No deterministic anchor could be established from the authoritative problem.',
    };
  }

  // Anchored walk: every earlier transition must be VALID before a later
  // one can be claimed as the first causal divergence.
  const transitions: ReasoningTransition[] = [];
  const sources: Array<{ form: string; index: number | null }> = [
    { form: anchor, index: null },
    ...steps.map((s) => ({ form: s.raw, index: s.index as number | null })),
  ];
  for (let to = 0; to < steps.length; to += 1) {
    const checked = validateReasoningTransition(sources[to].form, steps[to].raw);
    transitions.push({ fromIndex: sources[to].index, toIndex: to, ...checked });
    if (checked.verdict === 'VALID') continue;
    if (checked.verdict === 'INVALID') {
      return {
        ...base,
        steps,
        transitions,
        anchored: true,
        anchorForm: anchor,
        confirmedPrefixCount: to,
        firstDivergence: {
          stepIndex: to,
          reasonCode: checked.reasonCode,
          observedSummary: steps[to].raw.slice(0, 280),
        },
        status: 'DIVERGED',
        confidence: DIVERGENCE_CONFIDENCE,
        checkerPath: checked.checkerPath,
      };
    }
    if (checked.verdict === 'MALFORMED') {
      return {
        ...base,
        steps,
        transitions,
        anchored: true,
        anchorForm: anchor,
        confirmedPrefixCount: to,
        status: 'NEEDS_CLARIFICATION',
        unresolvedReason: `Step ${to} cannot be parsed as written; clarification is required.`,
        checkerPath: checked.checkerPath,
      };
    }
    return {
      ...base,
      steps,
      transitions,
      anchored: true,
      anchorForm: anchor,
      confirmedPrefixCount: to,
      status: 'NEEDS_SEMANTIC_ANALYSIS',
      unresolvedReason: `Step ${to} cannot be verified deterministically; semantic analysis is required.`,
      checkerPath: checked.checkerPath,
    };
  }

  return {
    ...base,
    steps,
    transitions,
    anchored: true,
    anchorForm: anchor,
    confirmedPrefixCount: steps.length,
    status: 'ALL_VALID',
    confidence: DIVERGENCE_CONFIDENCE,
    checkerPath: transitions.length > 0 ? transitions[transitions.length - 1].checkerPath : 'deterministic_linear',
  };
}
