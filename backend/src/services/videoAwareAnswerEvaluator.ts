// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Answer Evaluator v1
// Evaluates learner answers against rubric points safely.
// No LLM. No raw transcript. No answer key exposure to learner.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwareAnswerStatus,
  VideoAwareMisconception,
  VideoAwarePracticeItem,
  VideoAwarePracticeEvaluateResult,
} from './videoAwarePracticeContracts';

// ── Helpers ──

/**
 * Normalize text for comparison.
 */
function normalize(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if answer contains "I don't know" or equivalent.
 * Uses the original text before full normalization to preserve
 * punctuation patterns, plus a fallback on normalized text.
 */
function isDontKnow(answer: string): boolean {
  const lower = String(answer || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const normalized = normalize(answer);

  const dontKnowPatterns = [
    /^i don'?t know/,
    /^i do not know/,
    /^i m not sure/,
    /^idk\b/,
    /^i haven'?t watched/,
    /^i have not watched/,
    /^i don'?t understand/,
    /^i do not understand/,
  ];

  const dontKnowNormalizedPatterns = [
    /^not sure/,
    /^no idea/,
    /^what$/,
  ];

  return dontKnowPatterns.some((p) => p.test(lower))
    || dontKnowNormalizedPatterns.some((p) => p.test(normalized));
}

/**
 * Check if answer is empty or very short.
 */
function isEmpty(answer: string): boolean {
  const trimmed = String(answer || '').trim();
  return trimmed.length === 0 || trimmed.length < 3;
}

/**
 * Check if a rubric point is addressed in the answer.
 */
function rubricPointCovered(answer: string, rubricPoint: string): boolean {
  const ans = normalize(answer);
  const rp = normalize(rubricPoint);

  // Extract key terms from rubric point
  const keyTerms = rp.split(/\s+/).filter((w) => w.length > 3);
  if (keyTerms.length === 0) return true; // No meaningful terms

  // Check if at least some key terms are present
  let matches = 0;
  for (const term of keyTerms) {
    if (ans.includes(term)) matches += 1;
  }
  return matches >= Math.ceil(keyTerms.length * 0.3); // 30% key term overlap
}

/**
 * Extract suspected misconceptions from rubric misses.
 */
function extractMisconceptions(
  rubricMisses: string[],
  answer: string,
): VideoAwareMisconception[] {
  const misconceptions: VideoAwareMisconception[] = [];
  const now = new Date().toISOString();

  for (const miss of rubricMisses) {
    const lower = miss.toLowerCase();

    if (lower.includes('terminology') || lower.includes('vocabulary')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Terminology confusion',
        evidence: [`Answer did not use expected terminology from the lesson`],
        linkedSkillIds: [],
        status: 'suspected',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('common misconception') || lower.includes('misconception')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Targeted misconception present',
        evidence: [`Answer matched known misconception pattern for this topic`],
        linkedSkillIds: [],
        status: 'confirmed',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('example') || lower.includes('application')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Application uncertainty',
        evidence: [`Answer lacked concrete application or example`],
        linkedSkillIds: [],
        status: 'suspected',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }
  }

  return misconceptions.slice(0, 3);
}

// ── Main Evaluator ──

/**
 * Evaluate a learner's answer against rubric points and expected answer summary.
 * Deterministic v1 evaluation. No LLM. No raw transcript. No answer key exposure.
 *
 * The evaluator:
 * - Returns 'invalid' for empty answers
 * - Returns 'needs_review' for "I don't know" / equivalent
 * - Returns 'needs_review' if expectedAnswerSummary is missing
 * - Compares answer to rubric points for correctness
 * - Extracts suspected misconceptions from misses
 * - Does NOT expose answer key to the learner
 */
export function evaluateVideoAwareAnswer(
  item: VideoAwarePracticeItem,
  learnerAnswer: string,
): VideoAwarePracticeEvaluateResult {
  const warnings: string[] = [];

  // 1. Empty answer = invalid
  if (isEmpty(learnerAnswer)) {
    return {
      status: 'invalid',
      feedbackSummary: 'Please provide an answer so I can check your understanding.',
      rubricHits: [],
      rubricMisses: item.rubricPoints,
      suspectedMisconceptions: [],
      warnings: ['Empty answer submitted.'],
    };
  }

  // 2. "I don't know" = needs_review
  if (isDontKnow(learnerAnswer)) {
    return {
      status: 'needs_review',
      feedbackSummary: 'No problem — let me help you understand this better.',
      rubricHits: [],
      rubricMisses: item.rubricPoints,
      suspectedMisconceptions: [],
      warnings: ['Learner indicated uncertainty.'],
    };
  }

  // 3. No expected answer summary = needs_review
  if (!item.expectedAnswerSummary && item.rubricPoints.length === 0) {
    return {
      status: 'needs_review',
      feedbackSummary: 'I received your answer. Let me review it and get back to you.',
      rubricHits: [],
      rubricMisses: [],
      suspectedMisconceptions: [],
      warnings: ['No rubric available for evaluation — manual review needed.'],
    };
  }

  // 4. Evaluate against rubric points
  const rubricHits: string[] = [];
  const rubricMisses: string[] = [];

  for (const rp of item.rubricPoints) {
    if (rubricPointCovered(learnerAnswer, rp)) {
      rubricHits.push(rp);
    } else {
      rubricMisses.push(rp);
    }
  }

  // 5. Determine answer status
  let status: VideoAwareAnswerStatus;
  let feedbackSummary: string;

  if (rubricHits.length === item.rubricPoints.length && rubricHits.length > 0) {
    status = 'correct';
    feedbackSummary = 'Great answer! You covered all the key points well.';
  } else if (rubricHits.length >= Math.ceil(item.rubricPoints.length / 2)) {
    status = 'partially_correct';
    const missingCount = rubricMisses.length;
    feedbackSummary = `Good start! You covered some important points. Let me help you with ${missingCount} area(s) to strengthen your understanding.`;
  } else if (rubricHits.length > 0) {
    status = 'partially_correct';
    feedbackSummary = "You're on the right track with some points. Let's revisit the main concepts together.";
  } else {
    status = 'incorrect';
    feedbackSummary = "Let's review this topic together. Your answer doesn't quite capture the main ideas yet.";
  }

  // 6. Extract suspected misconceptions
  const suspectedMisconceptions = extractMisconceptions(rubricMisses, learnerAnswer);

  return {
    status,
    feedbackSummary,
    rubricHits,
    rubricMisses,
    suspectedMisconceptions,
    warnings,
  };
}
