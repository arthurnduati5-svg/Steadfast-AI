import type {
  MasteryState,
  VisibleMasteryLabel,
  MasteryNextAction,
  CognitiveDiagnosis,
} from './probabilisticMasteryContracts';
import type {
  MasteryLevel as LegacyMasteryLevel,
  MasteryConfidence as LegacyMasteryConfidence,
  MasteryDecision as LegacyMasteryDecision,
} from './masteryContracts';

export function mapVisibleLabelToLegacyLevel(label: VisibleMasteryLabel): LegacyMasteryLevel {
  switch (label) {
    case 'not_started': return 'unknown';
    case 'introduced': return 'introduced';
    case 'attempted': return 'emerging';
    case 'developing': return 'developing';
    case 'near_mastery': return 'proficient';
    case 'mastered': return 'mastered';
    case 'needs_revisit': return 'regressing';
    default: return 'unknown';
  }
}

export function mapCanonicalActionToLegacyDecision(action: MasteryNextAction): LegacyMasteryDecision {
  switch (action) {
    case 'diagnose': return 'diagnose';
    case 'practice': return 'practice_more';
    case 'remediate': return 'remediate';
    case 'review': return 'review';
    case 'advance': return 'advance';
    default: return 'diagnose';
  }
}

export function deriveLegacyConfidenceFromState(state: MasteryState): LegacyMasteryConfidence {
  if (state.confidence >= 0.7) return 'high';
  if (state.confidence >= 0.4) return 'medium';
  return 'low';
}

export function deriveLegacyMasteryFromCanonical(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis | null,
): {
  masteryLevel: LegacyMasteryLevel;
  confidence: LegacyMasteryConfidence;
  score: number;
  decision: LegacyMasteryDecision;
} {
  const masteryLevel = mapVisibleLabelToLegacyLevel(state.visibleLabel);
  const confidence = deriveLegacyConfidenceFromState(state);

  const scoreMap: Record<VisibleMasteryLabel, number> = {
    not_started: 0,
    introduced: 15,
    attempted: 30,
    developing: 50,
    near_mastery: 70,
    mastered: 90,
    needs_revisit: 25,
  };
  const baseScore = scoreMap[state.visibleLabel] ?? 0;
  const confMultiplier = confidence === 'high' ? 1.1 : confidence === 'medium' ? 1.0 : 0.8;
  const score = Math.round(Math.min(100, baseScore * confMultiplier));

  const action = diagnosis
    ? deriveNextActionFromDiagnosis(state, diagnosis)
    : 'diagnose';

  return { masteryLevel, confidence, score, decision: action };
}

function deriveNextActionFromDiagnosis(
  state: MasteryState,
  diagnosis: CognitiveDiagnosis,
): LegacyMasteryDecision {
  if (state.evidenceCount < 3) return 'diagnose';
  if (diagnosis.diagnosisStatus === 'weak_prerequisite') return 'remediate';
  if (diagnosis.diagnosisStatus === 'repeated_misconception') return 'remediate';
  if (state.decayRisk > 0.5) return 'review';
  if (state.visibleLabel === 'mastered' || state.visibleLabel === 'near_mastery') return 'advance';
  if (state.evidenceCount >= 3) return 'practice_more';
  return 'diagnose';
}
