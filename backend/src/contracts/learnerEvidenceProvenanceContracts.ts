import type { LearnerDataSourceKind } from './learnerDataReliabilityContracts';
import type { DataFreshnessState } from './dataFreshnessContracts';

export type LearnerEvidenceProvenance = {
  sourceKind: LearnerDataSourceKind;
  sourceIdHash?: string;
  studentIdHash?: string;
  schoolIdHash?: string;
  observedAt?: string;
  storedAt?: string;
  freshness: DataFreshnessState;
  confidence: 'high' | 'medium' | 'low' | 'unknown';
  safeSummary: string;
  rawPrivateDataIncluded: false;
};

export const MAX_SAFE_SUMMARY_LENGTH = 200;
