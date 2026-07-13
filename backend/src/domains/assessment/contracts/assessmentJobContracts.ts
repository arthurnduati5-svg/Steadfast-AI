export type AssessmentJobStatus =
  | 'queued'
  | 'leased'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'dead_lettered'
  | 'cancelled';

export interface AssessmentJobRecord {
  jobId: string;
  jobType: string;
  schoolId: string;
  aggregateType: string;
  aggregateId: string;
  stage: string;
  status: AssessmentJobStatus;
  attemptCount: number;
  maxAttempts: number;
  leaseOwner: string | undefined;
  leaseExpiresAt: string | undefined;
  heartbeatAt: string | undefined;
  checkpoint: Record<string, unknown> | undefined;
  lastErrorCode: string | undefined;
  createdAt: string;
  updatedAt: string;
}

export interface AssessmentJobHandler {
  jobType: string;
  handle(job: AssessmentJobRecord): Promise<{ ok: boolean; errorCode?: string }>;
}

export interface AssessmentJobRepository {
  create(job: AssessmentJobRecord): Promise<void>;
  findById(jobId: string): Promise<AssessmentJobRecord | undefined>;
  updateStatus(
    jobId: string,
    status: AssessmentJobStatus,
    lastErrorCode?: string,
    checkpoint?: Record<string, unknown>,
  ): Promise<void>;
  leaseNext(
    jobType: string,
    leaseOwner: string,
    leaseDurationMs: number,
  ): Promise<AssessmentJobRecord | undefined>;
}
