import type {
  AssessmentIdempotencyRecord,
  AssessmentIdempotencyRepository,
} from '../contracts/assessmentIdempotencyContracts';
import type {
  AssessmentAuditEvent,
  AssessmentAuditWriter,
} from '../contracts/assessmentAuditContracts';
import type {
  AssessmentOutboxEvent,
  AssessmentOutboxRepository,
  AssessmentInboxReceipt,
  AssessmentInboxRepository,
} from '../contracts/assessmentOutboxContracts';
import type {
  AssessmentJobRecord,
  AssessmentJobRepository,
  AssessmentJobStatus,
} from '../contracts/assessmentJobContracts';

export class InMemoryIdempotencyRepository implements AssessmentIdempotencyRepository {
  private records = new Map<string, AssessmentIdempotencyRecord>();

  async findByIdempotencyKey(key: string, schoolId: string, actorId: string): Promise<AssessmentIdempotencyRecord | undefined> {
    for (const r of this.records.values()) {
      if (r.idempotencyKey === key && r.schoolId === schoolId && r.actorId === actorId) {
        return r;
      }
    }
    return undefined;
  }

  async create(d: AssessmentIdempotencyRecord): Promise<void> {
    this.records.set(`${d.schoolId}:${d.actorId}:${d.idempotencyKey}`, d);
  }

  async updateStatus(key: string, status: AssessmentIdempotencyRecord['status'], safeResultSummary: string): Promise<void> {
    for (const r of this.records.values()) {
      if (r.idempotencyKey === key) {
        r.status = status;
        r.safeResultSummary = safeResultSummary;
      }
    }
  }

  reset(): void {
    this.records.clear();
  }
}

export class InMemoryAuditWriter implements AssessmentAuditWriter {
  events: AssessmentAuditEvent[] = [];
  failWrites = false;

  async write(event: AssessmentAuditEvent): Promise<{ ok: boolean; eventId: string; failureReason?: string }> {
    if (this.failWrites) {
      return { ok: false, eventId: event.eventId, failureReason: 'simulated_failure' };
    }
    this.events.push(event);
    return { ok: true, eventId: event.eventId };
  }

  reset(): void {
    this.events = [];
    this.failWrites = false;
  }
}

export class InMemoryOutboxRepository implements AssessmentOutboxRepository {
  events: AssessmentOutboxEvent[] = [];
  failWrites = false;

  async create(event: AssessmentOutboxEvent): Promise<void> {
    if (this.failWrites) {
      throw new Error('simulated_outbox_failure');
    }
    this.events.push(event);
  }

  async markPublished(eventId: string): Promise<void> {
    const e = this.events.find(x => x.eventId === eventId);
    if (e) e.status = 'published';
  }

  async markFailed(eventId: string, errorCode: string): Promise<void> {
    const e = this.events.find(x => x.eventId === eventId);
    if (e) { e.status = 'failed'; e.lastErrorCode = errorCode; }
  }

  reset(): void {
    this.events = [];
    this.failWrites = false;
  }
}

export class InMemoryInboxRepository implements AssessmentInboxRepository {
  receipts: AssessmentInboxReceipt[] = [];

  async findReceipt(eventId: string, consumerName: string): Promise<AssessmentInboxReceipt | undefined> {
    return this.receipts.find(r => r.eventId === eventId && r.consumerName === consumerName);
  }

  async upsert(receipt: AssessmentInboxReceipt): Promise<void> {
    const idx = this.receipts.findIndex(r => r.eventId === receipt.eventId && r.consumerName === receipt.consumerName);
    if (idx >= 0) {
      this.receipts[idx] = receipt;
    } else {
      this.receipts.push(receipt);
    }
  }

  reset(): void {
    this.receipts = [];
  }
}

export class InMemoryJobRepository implements AssessmentJobRepository {
  jobs: AssessmentJobRecord[] = [];

  async create(job: AssessmentJobRecord): Promise<void> {
    this.jobs.push(job);
  }

  async findById(jobId: string): Promise<AssessmentJobRecord | undefined> {
    return this.jobs.find(j => j.jobId === jobId);
  }

  async updateStatus(jobId: string, status: AssessmentJobStatus, lastErrorCode?: string, checkpoint?: Record<string, unknown>): Promise<void> {
    const j = this.jobs.find(x => x.jobId === jobId);
    if (j) {
      j.status = status;
      if (lastErrorCode !== undefined) j.lastErrorCode = lastErrorCode;
      if (checkpoint !== undefined) j.checkpoint = checkpoint;
    }
  }

  async leaseNext(jobType: string, leaseOwner: string, leaseDurationMs: number): Promise<AssessmentJobRecord | undefined> {
    const j = this.jobs.find(x => x.jobType === jobType && x.status === 'queued');
    if (j) {
      j.status = 'leased';
      j.leaseOwner = leaseOwner;
      j.leaseExpiresAt = new Date(Date.now() + leaseDurationMs).toISOString();
    }
    return j;
  }

  reset(): void {
    this.jobs = [];
  }
}
