// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Response Safety Service v1
// Deterministic guardrail for detecting final-answer and
// answer-key leakage patterns in AI responses.
// NOT a perfect semantic judge — a deterministic test boundary
// that flags common leakage patterns.
// ─────────────────────────────────────────────────────────────

export type SocraticResponseSafetyStatus =
  | 'safe'
  | 'possible_final_answer_leak'
  | 'possible_answer_key_leak'
  | 'needs_socratic_redirect';

export interface SocraticResponseSafetyDecision {
  status: SocraticResponseSafetyStatus;
  reasons: string[];
  matchedPatterns: string[];
}

/**
 * Patterns that suggest a final answer is being leaked.
 * These are deterministic — not semantic — and intentionally
 * narrow to avoid blocking legitimate conceptual explanations.
 */
const FINAL_ANSWER_PATTERNS: RegExp[] = [
  /\bthe\s+(correct\s+)?answer\s+is\b/i,
  /\bhere\s+(is|are)\s+(the\s+)?(final\s+)?answers?\b/i,
  /\byour\s+(final\s+)?answer\s+(should\s+)?be\b/i,
  /\bthe\s+solution\s+is\b/i,
  /\bexactly\s+(this|that|it)\s+is\b/i,
  /\bcopy\s+this\s+answer\b/i,
  /\bpaste\s+this\s+response\b/i,
  /\blet\s+me\s+(just\s+)?give\s+you\s+(the\s+)?answer\b/i,
];

/**
 * Patterns that suggest an answer key is being exposed.
 * These are distinct from final-answer patterns because they
 * reference answer keys, marking schemes, or rubric solutions
 * that should not be shared with the learner.
 */
const ANSWER_KEY_PATTERNS: RegExp[] = [
  /\b(answer\s+key|marking\s+scheme|rubric)\b/i,
  /\bhere\s+(is|are)\s+(all\s+)?(the\s+)?answers?\b/i,
  /\bhere\s+(is|are)\s+(the\s+)?(solutions?|solved)\b/i,
  /\bnumber\s+one\s+is\b/i,
  /\bquestion\s+\d+\s+(answer|solution)\b/i,
];

/**
 * Patterns indicating the response needs a Socratic redirect.
 * The model is giving away hints that bypass the student's own reasoning.
 */
const SOCRATIC_REDIRECT_PATTERNS: RegExp[] = [
  /\bjust\s+(do|write|put|say|answer)\b/i,
  /\bthe\s+(only|single|correct)\s+(way|method|approach)\s+is\b/i,
  /\bhere's?\s+(exactly|precisely)\s+how\b/i,
];

/**
 * Check an AI response for final-answer leakage patterns.
 * Returns a safety status and the list of matched patterns.
 */
export function checkResponseSafety(responseText: string): SocraticResponseSafetyDecision {
  const text = String(responseText || '');
  const reasons: string[] = [];
  const matchedPatterns: string[] = [];

  // Check final answer patterns
  for (const pattern of FINAL_ANSWER_PATTERNS) {
    if (pattern.test(text)) {
      matchedPatterns.push(pattern.source);
    }
  }

  if (matchedPatterns.length > 0) {
    reasons.push(`Detected ${matchedPatterns.length} final-answer leakage pattern(s).`);
  }

  // Check answer key patterns
  const matchedKeyPatterns: string[] = [];
  for (const pattern of ANSWER_KEY_PATTERNS) {
    if (pattern.test(text)) {
      matchedKeyPatterns.push(pattern.source);
    }
  }

  if (matchedKeyPatterns.length > 0) {
    matchedPatterns.push(...matchedKeyPatterns);
    reasons.push(`Detected ${matchedKeyPatterns.length} answer-key exposure pattern(s).`);
  }

  // Check Socratic redirect patterns
  const matchedRedirectPatterns: string[] = [];
  for (const pattern of SOCRATIC_REDIRECT_PATTERNS) {
    if (pattern.test(text)) {
      matchedRedirectPatterns.push(pattern.source);
    }
  }

  if (matchedRedirectPatterns.length > 0) {
    reasons.push(`Detected ${matchedRedirectPatterns.length} Socratic redirect-needed pattern(s).`);
  }

  // Determine status
  let status: SocraticResponseSafetyStatus = 'safe';

  if (matchedKeyPatterns.length > 0) {
    status = 'possible_answer_key_leak';
  } else if (matchedPatterns.length > 0) {
    status = 'possible_final_answer_leak';
  } else if (matchedRedirectPatterns.length > 0) {
    status = 'needs_socratic_redirect';
  }

  // If no actual content, return safe
  if (!text.trim() || text.trim().length < 10) {
    return {
      status: 'safe',
      reasons: ['Response is empty or too short to evaluate.'],
      matchedPatterns: [],
    };
  }

  return {
    status,
    reasons,
    matchedPatterns,
  };
}

/**
 * Check if a response is a legitimate conceptual explanation
 * (not a final answer leak). This is a heuristic — the model
 * saying "the answer is X" in a step-by-step guide about how
 * to derive it may be legitimate. This function checks for
 * Socratic framing signals.
 */
export function hasSocraticFraming(responseText: string): boolean {
  const text = String(responseText || '').toLowerCase();

  const socraticSignals = [
    /\b(?:first|next|then)\b.*\b(?:think|consider|ask|reflect|check|verify)\b/i,
    /\b(?:what|why|how)\s+(?:would|should|could|might|do)\s+(?:you|we)\b/i,
    /\b(?:try|attempt|work)\s+(?:this|through|out|on)\b/i,
    /\blet'?s?\s+(?:work|break|walk|go)\s+through\b/i,
    /\b(?:hint|clue|reminder|consider|think\s+about)\b/i,
    /\bwhat\s+do\s+you\s+(?:think|notice|wonder)\b/i,
    /\b(?:can|could)\s+you\s+(?:explain|describe|tell)\b/i,
    /\bcheck\s+(?:your|the)\s+(?:understanding|reasoning|work)\b/i,
  ];

  return socraticSignals.some((signal) => signal.test(text));
}

/**
 * Combined check: returns whether the response is safe to return
 * to the learner based on Socratic policy.
 */
export function isSocraticallySafe(responseText: string): {
  safe: boolean;
  decision: SocraticResponseSafetyDecision;
} {
  const decision = checkResponseSafety(responseText);

  // Safe if no leaks detected
  if (decision.status === 'safe') {
    return { safe: true, decision };
  }

  // If answer key exposure, never safe
  if (decision.status === 'possible_answer_key_leak') {
    return { safe: false, decision };
  }

  // If final answer leak but has Socratic framing, could be borderline
  if (decision.status === 'possible_final_answer_leak' && hasSocraticFraming(responseText)) {
    return { safe: true, decision };
  }

  // If final answer leak without Socratic framing, not safe
  if (decision.status === 'possible_final_answer_leak') {
    return { safe: false, decision };
  }

  // Needs redirect — borderline but not blocking
  if (decision.status === 'needs_socratic_redirect') {
    return { safe: true, decision };
  }

  return { safe: true, decision };
}

export function enforceSocraticNoFinalAnswer(input: {
  answer: string;
  noFinalAnswerRequired: boolean;
  recommendedTutorMove?: string | null;
}): {
  answer: string;
  transformed: boolean;
  decision: SocraticResponseSafetyDecision;
  warnings: string[];
} {
  const decision = checkResponseSafety(input.answer);
  const requiresTransform =
    input.noFinalAnswerRequired &&
    (decision.status === 'possible_final_answer_leak' ||
      decision.status === 'possible_answer_key_leak' ||
      decision.status === 'needs_socratic_redirect');

  if (!requiresTransform) {
    return {
      answer: input.answer,
      transformed: false,
      decision,
      warnings: [],
    };
  }

  const move = input.recommendedTutorMove || 'What would you try as the first step, and why?';
  return {
    answer: `I cannot give the final answer, but I can guide your thinking. ${move} What do you notice first?`,
    transformed: true,
    decision,
    warnings: [`Socratic final-answer enforcement transformed response with status=${decision.status}.`],
  };
}
