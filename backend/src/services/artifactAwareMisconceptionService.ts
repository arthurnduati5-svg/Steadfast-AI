// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact-Aware Misconception Service v1
// Tracks learner misconceptions identified during artifact-aware
// practice evaluation. Merges repeated misconceptions, tracks
// suspected/confirmed/resolved status, links to artifacts/skills.
// Uses neutral, non-judgmental labels only.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactAwareMisconception,
  ArtifactAwareMisconceptionStatus,
} from './artifactAwarePracticeContracts';

import { MAX_EVIDENCE_STRINGS, MAX_EVIDENCE_CHARS, MAX_MISCONCEPTION_EVIDENCE } from './artifactAwarePracticeContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `amc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeLabel(label: string): string {
  return String(label || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Merge a new misconception with existing misconceptions.
 * If a similar misconception already exists, merge evidence and update status.
 * If not, add as new.
 */
export function mergeArtifactMisconception(
  existing: ArtifactAwareMisconception[],
  newMc: ArtifactAwareMisconception,
): ArtifactAwareMisconception[] {
  const now = nowISO();
  const existingIndex = existing.findIndex(
    (e) => normalizeLabel(e.label) === normalizeLabel(newMc.label),
  );

  if (existingIndex >= 0) {
    const current = existing[existingIndex];
    const mergedEvidence = [
      ...current.evidence,
      ...newMc.evidence,
    ]
      .slice(0, MAX_MISCONCEPTION_EVIDENCE)
      .map((e) => e.slice(0, MAX_EVIDENCE_CHARS));

    const mergedSkills = [...new Set([
      ...current.linkedSkillIds,
      ...newMc.linkedSkillIds,
    ])];

    const mergedArtifactIds = [...new Set([
      ...current.linkedArtifactIds,
      ...newMc.linkedArtifactIds,
    ])];

    let mergedStatus: ArtifactAwareMisconceptionStatus;
    if (newMc.status === 'confirmed' || current.status === 'confirmed') {
      mergedStatus = 'confirmed';
    } else if (current.status === 'resolved') {
      mergedStatus = 'needs_review';
    } else {
      mergedStatus = current.status;
    }

    const updated: ArtifactAwareMisconception = {
      ...current,
      evidence: mergedEvidence,
      linkedSkillIds: mergedSkills,
      linkedArtifactIds: mergedArtifactIds,
      status: mergedStatus,
      lastSeenAt: now,
    };

    const result = [...existing];
    result[existingIndex] = updated;
    return result;
  }

  return [...existing, {
    ...newMc,
    misconceptionId: newMc.misconceptionId || generateId(),
    firstSeenAt: now,
    lastSeenAt: now,
  }].slice(0, MAX_EVIDENCE_STRINGS);
}

/**
 * Update misconceptions from an answer evaluation.
 */
export function updateArtifactAwareMisconceptions(
  existingMisconceptions: ArtifactAwareMisconception[],
  suspectedMisconceptions: ArtifactAwareMisconception[],
  allAnswersCorrect: boolean,
): ArtifactAwareMisconception[] {
  const now = nowISO();
  let updated = [...existingMisconceptions];

  for (const mc of suspectedMisconceptions) {
    updated = mergeArtifactMisconception(updated, mc);
  }

  if (allAnswersCorrect) {
    updated = updated.map((mc) => {
      if (mc.status === 'suspected' || mc.status === 'confirmed' || mc.status === 'needs_review') {
        return {
          ...mc,
          status: 'resolved' as ArtifactAwareMisconceptionStatus,
          lastSeenAt: now,
        };
      }
      return mc;
    });
  }

  return updated.slice(0, 10);
}

/**
 * Convert rubric misses into bounded misconception records.
 * Uses neutral, non-judgmental labels.
 */
export function rubricMissesToArtifactMisconceptions(
  rubricMisses: string[],
  skillIds: string[],
  artifactIds: string[],
): ArtifactAwareMisconception[] {
  const now = nowISO();
  const misconceptions: ArtifactAwareMisconception[] = [];

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
    { pattern: /copy|transfer|generalize|similar/i, label: 'Example-copying without transfer' },
    { pattern: /condition|when|assumption|requirement/i, label: 'Theorem condition mismatch' },
  ];

  for (const miss of rubricMisses) {
    for (const entry of missLabels) {
      if (entry.pattern.test(miss)) {
        misconceptions.push({
          misconceptionId: generateId(),
          label: entry.label,
          evidence: [miss.slice(0, MAX_EVIDENCE_CHARS)],
          linkedArtifactIds: artifactIds.slice(0, 3),
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
