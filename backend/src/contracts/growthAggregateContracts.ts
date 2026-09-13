import type { LearnerDataTruthState, LearnerDataSourceKind, EvidenceConfidence } from './learnerDataReliabilityContracts';
import type { DataFreshnessState } from './dataFreshnessContracts';
import type { LearnerEvidenceProvenance } from './learnerEvidenceProvenanceContracts';

export type WeakAreaTruthSignal = {
  skillId: string;
  skillLabel?: string;
  subject?: string;
  topic?: string;
  strength: 'weak' | 'emerging' | 'stable' | 'unknown';
  evidenceCount: number;
  evidenceKinds: LearnerDataSourceKind[];
  freshness: DataFreshnessState;
  provenance: LearnerEvidenceProvenance[];
  safeSummary: string;
};

export type MasterySummary = {
  knownSkillCount: number;
  weakSkillCount: number;
  stableSkillCount: number;
  unknownSkillCount: number;
  confidence: EvidenceConfidence;
};

export type RevisionReadiness = {
  dueCount: number;
  staleCount: number;
  unavailableReason?: string;
  truthState: LearnerDataTruthState;
};

export type PracticeReadiness = {
  recommendedCount: number;
  unavailableReason?: string;
  truthState: LearnerDataTruthState;
};

export type SafeMeta = {
  rawChatIncluded: false;
  rawLearnerMemoryIncluded: false;
  rawTranscriptIncluded: false;
  rawPromptIncluded: false;
  demoDataIncluded: false;
  frontendSynthesized: false;
};

export type GrowthAggregate = {
  studentIdHash: string;
  schoolIdHash?: string;
  generatedAt: string;
  truthState: LearnerDataTruthState;
  weakAreas: WeakAreaTruthSignal[];
  masterySummary: MasterySummary;
  revisionReadiness: RevisionReadiness;
  practiceReadiness: PracticeReadiness;
  safeMeta: SafeMeta;
};

export const GROWTH_AGGREGATE_CONTRACT_VERSION = '1.0.0';
