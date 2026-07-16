import type { RecoveryCaseCapacityStatus } from './recoveryCaseTriageContracts';

export interface RecoveryCaseCapacitySnapshot {
  capacitySnapshotId: string;
  schoolId: string;
  audienceRole: string;
  reviewerRef: string | null;
  reviewWindowId: string | null;
  capacityStatus: RecoveryCaseCapacityStatus | string;
  totalCapacity: number;
  usedCapacity: number;
  availableCapacity: number;
  capacityThreshold: number;
  safeCapacitySummary: string;
  capacityDetailsJson: Record<string, unknown>;
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  capacityExceededAt?: string;
  voidedAt?: string;
}

export interface CreateCapacitySnapshotRequest {
  audienceRole: string;
  reviewerRef?: string;
  reviewWindowId?: string;
  totalCapacity: number;
  usedCapacity: number;
  capacityThreshold: number;
  safeCapacitySummary?: string;
  capacityDetailsJson?: Record<string, unknown>;
  sourceRefsJson?: Record<string, unknown>;
}
