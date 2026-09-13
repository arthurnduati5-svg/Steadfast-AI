// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Evidence Service v1
// Classifies evidence strength from various sources.
// Passive watching is weak evidence.
// Reflection is weak evidence.
// Practice attempt is stronger evidence.
// Mastery evidence is strongest.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionOutcomeStatus } from './teacherInterventionContracts';

export type EvidenceStrength = 'none' | 'weak' | 'moderate' | 'strong';

export interface EvidenceClassification {
  strength: EvidenceStrength;
  summary: string;
  warnings: string[];
}

export interface EvidenceInput {
  analyticsEvidenceRefs?: string[];
  practiceAttemptId?: string | null;
  masteryEvidenceId?: string | null;
  artifactId?: string | null;
  questionId?: string | null;
  videoId?: string | null;
  watchSessionId?: string | null;
  reflectionId?: string | null;
  teacherNote?: string | null;
  learnerSubmission?: string | null;
}

/**
 * Classify evidence strength from available sources.
 */
export function classifyEvidenceStrength(input: EvidenceInput): EvidenceClassification {
  const warnings: string[] = [];
  const sources: string[] = [];

  // Passive watching
  if (input.watchSessionId) {
    sources.push('watch_session');
  }
  if (input.videoId) {
    sources.push('video');
  }

  // Reflection
  if (input.reflectionId) {
    sources.push('reflection');
  }

  // Practice attempt (stronger)
  if (input.practiceAttemptId) {
    sources.push('practice_attempt');
  }

  // Artifact/question
  if (input.artifactId || input.questionId) {
    sources.push('artifact_question');
  }

  // Mastery evidence (strongest)
  if (input.masteryEvidenceId) {
    sources.push('mastery_evidence');
  }

  // Teacher note
  if (input.teacherNote) {
    sources.push('teacher_note');
  }

  // Learner submission
  if (input.learnerSubmission) {
    sources.push('learner_submission');
  }

  // Analytics refs
  if (input.analyticsEvidenceRefs && input.analyticsEvidenceRefs.length > 0) {
    sources.push('analytics');
  }

  // Determine strength
  let strength: EvidenceStrength = 'none';
  if (sources.length === 0) {
    warnings.push('No evidence sources provided.');
  } else {
    if (input.masteryEvidenceId) {
      strength = 'strong';
    } else if (input.practiceAttemptId) {
      strength = 'moderate';
    } else if (input.reflectionId || input.learnerSubmission) {
      strength = 'weak';
      if (input.reflectionId) warnings.push('Reflection provides weak evidence only.');
    } else if (input.watchSessionId || input.videoId) {
      strength = 'weak';
      warnings.push('Passive watching provides weak evidence — not mastery.');
    } else if (input.teacherNote) {
      strength = 'weak';
      warnings.push('Teacher note is contextual evidence, not automatic mastery.');
    } else {
      strength = 'weak';
    }
  }

  return {
    strength,
    summary: `Evidence sources: ${sources.join(', ') || 'none'}. Strength: ${strength}.`,
    warnings,
  };
}

/**
 * Determine if evidence supports an outcome classification.
 */
export function evidenceSupportsOutcome(
  evidence: EvidenceClassification,
  outcome: TeacherInterventionOutcomeStatus,
): boolean {
  if (outcome === 'improved' && evidence.strength === 'none') {
    return false;
  }
  if (outcome === 'improved' && evidence.strength === 'weak') {
    return false;
  }
  if (outcome === 'improved' && (evidence.strength === 'moderate' || evidence.strength === 'strong')) {
    return true;
  }
  if (outcome === 'unchanged' && evidence.strength === 'none') {
    return false;
  }
  return true;
}
