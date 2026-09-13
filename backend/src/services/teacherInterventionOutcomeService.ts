// ─────────────────────────────────────────────────────────────
// Steadfast AI — Teacher Intervention Outcome Service v1
// Classifies intervention outcomes from available evidence.
// Does not create improved outcome without learner evidence.
// Does not classify unchanged without enough evidence.
// Returns awaiting_evidence when evidence is missing.
// ─────────────────────────────────────────────────────────────

import type { TeacherInterventionOutcomeStatus } from './teacherInterventionContracts';
import { classifyEvidenceStrength } from './teacherInterventionEvidenceService';
import type { EvidenceInput } from './teacherInterventionEvidenceService';

export interface OutcomeClassification {
  outcomeStatus: TeacherInterventionOutcomeStatus;
  confidence: 'low' | 'medium' | 'high';
  summary: string;
  warnings: string[];
}

/**
 * Classify intervention outcome from available evidence.
 */
export function classifyOutcome(input: EvidenceInput): OutcomeClassification {
  const evidence = classifyEvidenceStrength(input);
  const warnings: string[] = [...evidence.warnings];

  // No evidence → awaiting_evidence
  if (evidence.strength === 'none') {
    return {
      outcomeStatus: 'awaiting_evidence',
      confidence: 'low',
      summary: 'No evidence available yet. Awaiting learner response or teacher observation.',
      warnings: ['No evidence to classify outcome.'],
    };
  }

  // Weak evidence only → unchanged or awaiting_evidence
  if (evidence.strength === 'weak') {
    const hasLearnerAction = !!input.learnerSubmission || !!input.practiceAttemptId;
    if (hasLearnerAction) {
      return {
        outcomeStatus: 'unchanged',
        confidence: 'low',
        summary: 'Learner engaged but weak evidence of improvement. Consider stronger practice evidence.',
        warnings: ['Weak evidence — confidence in outcome classification is low.'],
      };
    }
    return {
      outcomeStatus: 'awaiting_evidence',
      confidence: 'low',
      summary: 'Only weak evidence available. Stronger evidence (practice, mastery) recommended.',
      warnings,
    };
  }

  // Moderate evidence
  if (evidence.strength === 'moderate') {
    const hasImprovementSignal = input.masteryEvidenceId || input.practiceAttemptId;
    if (hasImprovementSignal) {
      return {
        outcomeStatus: 'improved',
        confidence: 'medium',
        summary: 'Practice evidence suggests improvement. Continue monitoring.',
        warnings: [],
      };
    }
    return {
      outcomeStatus: 'unchanged',
      confidence: 'medium',
      summary: 'Moderate evidence but no improvement signal detected.',
      warnings: ['No improvement signal in available evidence.'],
    };
  }

  // Strong evidence
  if (evidence.strength === 'strong') {
    return {
      outcomeStatus: 'improved',
      confidence: 'high',
      summary: 'Strong evidence of improvement from mastery-level data.',
      warnings: [],
    };
  }

  // Fallback
  return {
    outcomeStatus: 'awaiting_evidence',
    confidence: 'low',
    summary: 'Unable to classify outcome from available evidence.',
    warnings: ['Evidence classification failed.'],
  };
}
