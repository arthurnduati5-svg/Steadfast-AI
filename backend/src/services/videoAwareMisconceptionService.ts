// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Misconception Service v1
// Tracks learner misconceptions identified during video-aware
// practice evaluation. Merges repeated misconceptions, tracks
// suspected/confirmed/resolved status, and links to skills.
// Uses neutral, non-judgmental labels only.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwareMisconception,
  VideoAwareMisconceptionStatus,
  VideoAwarePracticeSession,
} from './videoAwarePracticeContracts';

import { MAX_EVIDENCE_STRINGS, MAX_EVIDENCE_CHARS, MAX_MISCONCEPTION_EVIDENCE } from './videoAwarePracticeContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `mc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Merge a new misconception with existing misconceptions.
 * If a similar misconception already exists, merge evidence and update status.
 * If not, add as new.
 */
export function mergeMisconception(
  existing: VideoAwareMisconception[],
  newMc: VideoAwareMisconception,
): VideoAwareMisconception[] {
  const now = nowISO();
  const existingIndex = existing.findIndex(
    (e) => normalizeLabel(e.label) === normalizeLabel(newMc.label),
  );

  if (existingIndex >= 0) {
    // Merge: combine evidence, update status
    const current = existing[existingIndex];
    const mergedEvidence = [
      ...current.evidence,
      ...newMc.evidence,
    ]
      .slice(0, MAX_MISCONCEPTION_EVIDENCE)
      .map((e) => e.slice(0, MAX_EVIDENCE_CHARS));

    // Merge skill IDs
    const mergedSkills = [...new Set([
      ...current.linkedSkillIds,
      ...newMc.linkedSkillIds,
    ])];

    // Update status: if new is confirmed, upgrade; if current resolved but new evidence, mark needs_review
    let mergedStatus: VideoAwareMisconceptionStatus;
    if (newMc.status === 'confirmed' || current.status === 'confirmed') {
      mergedStatus = 'confirmed';
    } else if (current.status === 'resolved') {
      mergedStatus = 'needs_review';
    } else {
      mergedStatus = current.status;
    }

    const updated: VideoAwareMisconception = {
      ...current,
      evidence: mergedEvidence,
      linkedSkillIds: mergedSkills,
      status: mergedStatus,
      lastSeenAt: now,
    };

    const result = [...existing];
    result[existingIndex] = updated;
    return result;
  }

  // No existing match — add as new
  return [...existing, {
    ...newMc,
    misconceptionId: newMc.misconceptionId || generateId(),
    firstSeenAt: now,
    lastSeenAt: now,
  }].slice(0, MAX_EVIDENCE_STRINGS);
}

function normalizeLabel(label: string): string {
  return String(label || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Update misconceptions from an answer evaluation.
 * Takes existing misconceptions + evaluation results and returns updated list.
 */
export function updateVideoAwareMisconceptions(
  existingMisconceptions: VideoAwareMisconception[],
  suspectedMisconceptions: VideoAwareMisconception[],
  allAnswersCorrect: boolean,
): VideoAwareMisconception[] {
  const now = nowISO();
  let updated = [...existingMisconceptions];

  // 1. Merge new suspected misconceptions
  for (const mc of suspectedMisconceptions) {
    updated = mergeMisconception(updated, mc);
  }

  // 2. If all answers correct, mark resolved any that were suspected/confirmed
  if (allAnswersCorrect) {
    updated = updated.map((mc) => {
      if (mc.status === 'suspected' || mc.status === 'confirmed' || mc.status === 'needs_review') {
        return {
          ...mc,
          status: 'resolved' as VideoAwareMisconceptionStatus,
          lastSeenAt: now,
        };
      }
      return mc;
    });
  }

  return updated.slice(0, 10); // Keep bounded
}

/**
 * Convert rubric misses into bounded misconception records.
 * Uses neutral, non-judgmental labels. No insulting labels.
 */
export function rubricMissesToMisconceptions(
  rubricMisses: string[],
  skillIds: string[],
): VideoAwareMisconception[] {
  const now = nowISO();
  const misconceptions: VideoAwareMisconception[] = [];

  const missLabels: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /terminology|vocabulary|definition/i, label: 'Definition confusion' },
    { pattern: /formula|equation|calculation/i, label: 'Formula selection uncertainty' },
    { pattern: /sign|negative|positive|direction/i, label: 'Sign error pattern detected' },
    { pattern: /graph|plot|chart|diagram/i, label: 'Graphical interpretation uncertainty' },
    { pattern: /concept|idea|principle|fundamental/i, label: 'Core concept uncertainty' },
    { pattern: /example|application|apply|real.world/i, label: 'Application transfer difficulty' },
    { pattern: /connects|link|relationship|relation/i, label: 'Relationship/causation confusion' },
    { pattern: /step|process|procedure|sequence/i, label: 'Procedural sequencing uncertainty' },
    { pattern: /unit|dimension|measurement/i, label: 'Unit/dimension handling uncertainty' },
    { pattern: /reason|explain|justify|why/i, label: 'Reasoning justification gap' },
  ];

  for (const miss of rubricMisses) {
    for (const entry of missLabels) {
      if (entry.pattern.test(miss)) {
        misconceptions.push({
          misconceptionId: generateId(),
          label: entry.label,
          evidence: [miss.slice(0, MAX_EVIDENCE_CHARS)],
          linkedSkillIds: skillIds.slice(0, 5),
          status: 'suspected',
          firstSeenAt: now,
          lastSeenAt: now,
        });
        break;
      }
    }
  }

  return misconceptions.slice(0, 3);
}
