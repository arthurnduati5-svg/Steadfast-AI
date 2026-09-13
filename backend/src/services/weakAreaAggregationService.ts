import type { WeakAreaTruthSignal } from '../contracts/growthAggregateContracts';
import type { LearnerDataSourceKind } from '../contracts/learnerDataReliabilityContracts';
import type { LearnerEvidenceProvenance } from '../contracts/learnerEvidenceProvenanceContracts';
import { evaluateDataFreshness } from './dataFreshnessService';
import { buildLearnerEvidenceProvenance, mergeEvidenceProvenance } from './learnerEvidenceProvenanceService';

export interface WeakAreaEvidenceInput {
  skillId: string;
  skillLabel?: string;
  subject?: string;
  topic?: string;
  strength: 'weak' | 'emerging' | 'stable' | 'unknown';
  sourceKind: LearnerDataSourceKind;
  observedAt?: string;
  storedAt?: string;
  studentId?: string;
  schoolId?: string;
  sourceId?: string;
}

function aggregateStrength(existing: 'weak' | 'emerging' | 'stable' | 'unknown', incoming: 'weak' | 'emerging' | 'stable' | 'unknown'): 'weak' | 'emerging' | 'stable' | 'unknown' {
  const rank: Record<string, number> = { weak: 0, emerging: 1, unknown: 2, stable: 3 };
  const existingRank = rank[existing] ?? 2;
  const incomingRank = rank[incoming] ?? 2;

  if (incomingRank < existingRank) return incoming;
  if (existingRank < incomingRank) return existing;
  return existing;
}

function determineConfidence(evidenceCount: number, staleRatio: number): 'high' | 'medium' | 'low' | 'unknown' {
  if (evidenceCount === 0) return 'unknown';
  if (staleRatio > 0.5) return 'low';
  if (evidenceCount >= 5 && staleRatio <= 0.2) return 'high';
  if (evidenceCount >= 2) return 'medium';
  return 'low';
}

export async function buildWeakAreaTruthSignals(input: {
  studentId: string;
  schoolId?: string | null;
  evidenceInputs?: WeakAreaEvidenceInput[];
}): Promise<WeakAreaTruthSignal[]> {
  if (!input.evidenceInputs || input.evidenceInputs.length === 0) {
    return [];
  }

  const grouped = new Map<string, WeakAreaEvidenceInput[]>();

  for (const evidence of input.evidenceInputs) {
    const existing = grouped.get(evidence.skillId) || [];
    existing.push(evidence);
    grouped.set(evidence.skillId, existing);
  }

  const signals: WeakAreaTruthSignal[] = [];

  for (const [skillId, evidences] of grouped.entries()) {
    const evidenceKinds = new Set<LearnerDataSourceKind>();
    const provenances: LearnerEvidenceProvenance[] = [];
    let aggregatedStrength: 'weak' | 'emerging' | 'stable' | 'unknown' = 'unknown';
    let latestObservedAt: string | undefined;

    for (const ev of evidences) {
      evidenceKinds.add(ev.sourceKind);
      aggregatedStrength = aggregateStrength(aggregatedStrength, ev.strength);

      if (ev.observedAt && (!latestObservedAt || ev.observedAt > latestObservedAt)) {
        latestObservedAt = ev.observedAt;
      }

      provenances.push(buildLearnerEvidenceProvenance({
        sourceKind: ev.sourceKind,
        sourceId: ev.sourceId,
        studentId: input.studentId,
        schoolId: input.schoolId,
        observedAt: ev.observedAt,
        storedAt: ev.storedAt,
        safeSummary: `Evidence from ${ev.sourceKind} for skill ${ev.skillLabel || skillId}`,
      }));
    }

    const freshness = evaluateDataFreshness({
      observedAt: latestObservedAt,
      sourceKind: Array.from(evidenceKinds)[0],
    });

    const mergedProvenances = mergeEvidenceProvenance(provenances);
    const staleCount = mergedProvenances.filter(p => p.freshness.status === 'stale').length;
    const confidence = determineConfidence(evidences.length, staleCount / Math.max(mergedProvenances.length, 1));

    signals.push({
      skillId,
      skillLabel: evidences[0].skillLabel,
      subject: evidences[0].subject,
      topic: evidences[0].topic,
      strength: aggregatedStrength,
      evidenceCount: evidences.length,
      evidenceKinds: Array.from(evidenceKinds),
      freshness,
      provenance: mergedProvenances,
      safeSummary: `Weak area signal for skill ${evidences[0].skillLabel || skillId}: ${evidences.length} evidence item(s) from ${evidenceKinds.size} source(s). Confidence: ${confidence}.`,
    });
  }

  return signals.sort((a, b) => {
    const rankA = a.strength === 'weak' ? 0 : a.strength === 'emerging' ? 1 : a.strength === 'unknown' ? 2 : 3;
    const rankB = b.strength === 'weak' ? 0 : b.strength === 'emerging' ? 1 : b.strength === 'unknown' ? 2 : 3;
    return rankA - rankB;
  });
}
