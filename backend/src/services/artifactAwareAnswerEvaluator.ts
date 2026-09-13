// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Answer Evaluator v1
// Evaluates learner answers against rubric points safely.
// No LLM. No raw artifact text. No answer key exposure.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwareAnswerStatus,
  ArtifactAwareMisconception,
  ArtifactAwarePracticeItem,
  ArtifactAwarePracticeEvaluateResult,
  ArtifactPracticeSourceKind,
} from './artifactAwarePracticeContracts';

// ── Helpers ──

function normalize(text: string): string {
  return String(text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isDontKnow(answer: string): boolean {
  const lower = String(answer || '').toLowerCase().replace(/\s+/g, ' ').trim();
  const normalized = normalize(answer);

  const dontKnowPatterns = [
    /^i don'?t know/,
    /^i do not know/,
    /^i m not sure/,
    /^idk\b/,
    /^i haven'?t read/,
    /^i have not read/,
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

function isEmpty(answer: string): boolean {
  const trimmed = String(answer || '').trim();
  return trimmed.length === 0 || trimmed.length < 3;
}

function rubricPointCovered(answer: string, rubricPoint: string): boolean {
  const ans = normalize(answer);
  const rp = normalize(rubricPoint);

  const keyTerms = rp.split(/\s+/).filter((w) => w.length > 3);
  if (keyTerms.length === 0) return true;

  let matches = 0;
  for (const term of keyTerms) {
    if (ans.includes(term)) matches += 1;
  }
  return matches >= Math.ceil(keyTerms.length * 0.3);
}

function extractMisconceptions(
  rubricMisses: string[],
  _answer: string,
  sourceKind?: ArtifactPracticeSourceKind | null,
): ArtifactAwareMisconception[] {
  const misconceptions: ArtifactAwareMisconception[] = [];
  const now = new Date().toISOString();
  const id = `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Diagram-specific misconceptions
  if (sourceKind === 'diagram') {
    for (const miss of rubricMisses) {
      const lower = miss.toLowerCase();
      if (lower.includes('component') || lower.includes('part')) {
        misconceptions.push({
          misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: 'Diagram interpretation gap',
          evidence: ['Answer did not identify key components of the diagram'],
          linkedArtifactIds: [],
          linkedSkillIds: [],
          status: 'suspected',
          firstSeenAt: now,
          lastSeenAt: now,
        });
        break;
      }
    }
  }

  // Formula/theorem specific misconceptions
  if (sourceKind === 'formula_block' || sourceKind === 'theorem_block') {
    for (const miss of rubricMisses) {
      const lower = miss.toLowerCase();
      if (lower.includes('condition') || lower.includes('when')) {
        misconceptions.push({
          misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          label: 'Formula selection uncertainty',
          evidence: ['Answer did not identify correct conditions for formula/theorem use'],
          linkedArtifactIds: [],
          linkedSkillIds: [],
          status: 'suspected',
          firstSeenAt: now,
          lastSeenAt: now,
        });
        break;
      }
    }
  }

  // Generic misconceptions from rubric misses
  for (const miss of rubricMisses) {
    const lower = miss.toLowerCase();

    if (lower.includes('terminology') || lower.includes('vocabulary')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Definition confusion',
        evidence: ['Answer did not use expected terminology from the material'],
        linkedArtifactIds: [],
        linkedSkillIds: [],
        status: 'suspected',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('common misconception') || lower.includes('misconception')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Core concept uncertainty',
        evidence: ['Answer matched a known misconception pattern'],
        linkedArtifactIds: [],
        linkedSkillIds: [],
        status: 'confirmed',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('example') || lower.includes('application')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Application transfer difficulty',
        evidence: ['Answer lacked concrete application or example'],
        linkedArtifactIds: [],
        linkedSkillIds: [],
        status: 'suspected',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('step') || lower.includes('process') || lower.includes('approach')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Procedural sequencing uncertainty',
        evidence: ['Answer did not follow correct procedure or steps'],
        linkedArtifactIds: [],
        linkedSkillIds: [],
        status: 'suspected',
        firstSeenAt: now,
        lastSeenAt: now,
      });
    }

    if (lower.includes('copy') || lower.includes('transfer') || lower.includes('generalize')) {
      misconceptions.push({
        misconceptionId: `mc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        label: 'Example-copying without transfer',
        evidence: ['Answer copied steps without showing deeper understanding'],
        linkedArtifactIds: [],
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
 * Evaluate a learner's answer against rubric points.
 * Deterministic v1 evaluation. No LLM. No raw artifact text. No answer key exposure.
 */
export function evaluateArtifactAwareAnswer(
  item: ArtifactAwarePracticeItem,
  learnerAnswer: string,
): ArtifactAwarePracticeEvaluateResult {
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

  // 3. No rubric = needs_review
  if (item.rubricPoints.length === 0) {
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
  let status: ArtifactAwareAnswerStatus;
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
  const suspectedMisconceptions = extractMisconceptions(
    rubricMisses,
    learnerAnswer,
    item.linkedSourceKind,
  );

  return {
    status,
    feedbackSummary,
    rubricHits,
    rubricMisses,
    suspectedMisconceptions,
    warnings,
  };
}
