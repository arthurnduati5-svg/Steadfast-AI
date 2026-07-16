export interface RecoveryCaseQualitySample {
  qualitySampleId: string;
  schoolId: string;
  queueItemId: string;
  priorityBand: string;
  selected: boolean;
  bucket: number;
  sampleBasisPoints: number;
  policyVersion: string;
  sampleStatus: string;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  voidedAt?: string;
}

export interface RecoveryCaseQualitySamplingInput {
  schoolId: string;
  queueItemId: string;
  priorityBand: string;
  sampleBasisPoints: number;
  policyVersion: string;
}

export interface RecoveryCaseQualitySamplingResult {
  seed: string;
  hash: string;
  bucket: number;
  sampleBasisPoints: number;
  selected: boolean;
  priorityBand: string;
  policyVersion: string;
}
