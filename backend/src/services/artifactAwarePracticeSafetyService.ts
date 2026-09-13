// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Practice Safety Service v1
// Safety wrapper that strips answer keys, raw artifact text,
// raw OCR text, hidden prompts, and blocks prompt injection
// from artifact content. Ensures artifact content is treated
// as data, not instructions.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwarePracticeResponse,
  ArtifactAwarePracticeSession,
  ArtifactAwarePracticeItem,
} from './artifactAwarePracticeContracts';

// ── Prompt injection patterns ──

const PROMPT_INJECTION_PATTERNS: RegExp[] = [
  /ignore\s+(all\s+)?(previous|above|below)\s+instructions/i,
  /forget\s+(all\s+)?(previous|above|below)\s+/i,
  /you\s+are\s+(now\s+)?(free|not\s+bound|released)/i,
  /new\s+instruction/i,
  /override\s+system/i,
  /disregard\s+(all\s+)?(previous|above)/i,
  /act\s+as\s+if/i,
  /your\s+new\s+(role|task|purpose)/i,
  /you\s+must\s+now\s+ignore/i,
  /system\s+(prompt|instruction)/i,
];

/**
 * Check if text contains prompt injection patterns.
 */
export function detectPromptInjection(text: string): boolean {
  if (!text) return false;
  return PROMPT_INJECTION_PATTERNS.some((p) => p.test(text));
}

/**
 * Strip expectedAnswerSummary and rubric internals from a practice item.
 */
function stripAnswerKeyFromItem(item: ArtifactAwarePracticeItem): ArtifactAwarePracticeItem {
  const safe = { ...item };
  delete safe.expectedAnswerSummary;
  return safe;
}

/**
 * Strip answer-key fields from a practice session before returning to learner.
 */
function stripAnswerKeyFromSession(session: ArtifactAwarePracticeSession): ArtifactAwarePracticeSession {
  if (!session) return session;
  return {
    ...session,
    items: (session.items || []).map(stripAnswerKeyFromItem),
  };
}

/**
 * Sanitize the full practice response for learner-facing delivery.
 */
export function sanitizeArtifactPracticeForLearner(
  response: ArtifactAwarePracticeResponse,
): ArtifactAwarePracticeResponse {
  if (!response) return response;

  return {
    ...response,
    activePracticeSession: response.activePracticeSession
      ? stripAnswerKeyFromSession(response.activePracticeSession)
      : response.activePracticeSession,
    recentPracticeSessions: (response.recentPracticeSessions || []).map(stripAnswerKeyFromSession),
  };
}

/**
 * Sanitize a practice session for learner-facing delivery.
 */
export function sanitizeArtifactPracticeSessionForLearner(
  session: ArtifactAwarePracticeSession,
): ArtifactAwarePracticeSession {
  return stripAnswerKeyFromSession(session);
}

/**
 * Safe prompt context — no answer keys, no raw artifact text, no hidden prompts.
 */
export interface SafeArtifactPracticePromptContext {
  topic?: string | null;
  skillIds: string[];
  sourceKinds: string[];
  sectionSummaries: string[];
  diagramSummaries: string[];
  theoremSummaries: string[];
  extractedQuestionSummaries: string[];
  currentDecision?: string | null;
  misconceptionSummary: string[];
  nextActionPrompt?: string | null;
  warnings: string[];
}

/**
 * Build a safe prompt context from a practice session.
 * No answer keys, no raw learner answers, no raw artifact text.
 */
export function buildSafeArtifactPracticePromptContext(
  session: ArtifactAwarePracticeSession,
): SafeArtifactPracticePromptContext {
  return {
    topic: session.topic?.slice(0, 160) || null,
    skillIds: (session.skillIds || []).slice(0, 20),
    sourceKinds: [session.source.sourceKind],
    sectionSummaries: [],
    diagramSummaries: [],
    theoremSummaries: [],
    extractedQuestionSummaries: [],
    currentDecision: session.decision.currentDecision || null,
    misconceptionSummary: session.misconceptionSummary
      .filter((m) => m.status === 'suspected' || m.status === 'confirmed')
      .slice(0, 5)
      .map((m) => m.label),
    nextActionPrompt: session.decision.nextActionPrompt?.slice(0, 200) || null,
    warnings: session.safety.warnings.slice(0, 5),
  };
}

/**
 * Validate that an artifact practice session is safe to use in prompt context.
 * Returns warnings but does not mutate — the response is already safe by design.
 */
export function validateArtifactPracticeSafety(
  session: ArtifactAwarePracticeSession,
): string[] {
  const warnings: string[] = [];

  if (session.safety.rawArtifactTextUsed) {
    warnings.push('Safety violation: raw artifact text was used. This must be false.');
  }
  if (session.safety.rawArtifactTextStored) {
    warnings.push('Safety violation: raw artifact text was stored. This must be false.');
  }
  if (session.safety.answerKeyVisibleToLearner) {
    warnings.push('Safety violation: answer key is visible to learner. This must be false.');
  }
  if (!session.safety.promptInjectionBlocked) {
    warnings.push('Safety warning: prompt injection blocking not confirmed.');
  }

  return warnings;
}
