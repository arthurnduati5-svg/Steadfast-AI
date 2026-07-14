import {
  MarkingInvocationRequestRepository,
  SubmittedSnapshotIntakeRepository,
  MarkingBatchRepository,
  MarkingBatchItemRepository,
  MarkingResultLinkRepository,
  MarkingDispatchAuditRepository,
  MarkingInvocationIdempotencyRepository,
  MarkingReadinessCheckRepository,
  MarkingDispatchAuditEvent,
  MarkingInvocationIdempotencyEntry,
  MarkingReadinessCheck,
} from '../contracts/markingInvocationRepositoryContracts';
import { MarkingInvocationRequest } from '../contracts/markingInvocationContracts';
import { SubmittedSnapshotIntake } from '../contracts/submittedSnapshotIntakeContracts';
import { MarkingBatch, MarkingBatchItem } from '../contracts/markingBatchContracts';
import { MarkingResultLink } from '../contracts/markingResultBridgeContracts';

export class InMemoryMarkingInvocationRequestRepository implements MarkingInvocationRequestRepository {
  private store = new Map<string, MarkingInvocationRequest>();

  async create(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest> {
    this.store.set(request.markingInvocationRequestId, { ...request });
    return { ...request };
  }

  async findById(markingInvocationRequestId: string): Promise<MarkingInvocationRequest | null> {
    const r = this.store.get(markingInvocationRequestId);
    return r ? { ...r } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingInvocationRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId).map(r => ({ ...r }));
  }

  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingInvocationRequest[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.invocationStatus === status).map(r => ({ ...r }));
  }

  async findByDeliverySessionId(deliverySessionId: string): Promise<MarkingInvocationRequest[]> {
    return Array.from(this.store.values()).filter(r => r.deliverySessionId === deliverySessionId).map(r => ({ ...r }));
  }

  async update(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest> {
    this.store.set(request.markingInvocationRequestId, { ...request });
    return { ...request };
  }

  async delete(markingInvocationRequestId: string): Promise<void> {
    this.store.delete(markingInvocationRequestId);
  }
}

export class InMemorySubmittedSnapshotIntakeRepository implements SubmittedSnapshotIntakeRepository {
  private store = new Map<string, SubmittedSnapshotIntake>();

  async create(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake> {
    this.store.set(intake.snapshotIntakeId, { ...intake });
    return { ...intake };
  }

  async findById(snapshotIntakeId: string): Promise<SubmittedSnapshotIntake | null> {
    const i = this.store.get(snapshotIntakeId);
    return i ? { ...i } : null;
  }

  async findBySchoolId(schoolId: string): Promise<SubmittedSnapshotIntake[]> {
    return Array.from(this.store.values()).filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<SubmittedSnapshotIntake[]> {
    return Array.from(this.store.values()).filter(i => i.markingInvocationRequestId === markingInvocationRequestId).map(i => ({ ...i }));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<SubmittedSnapshotIntake[]> {
    return Array.from(this.store.values()).filter(i => i.submissionSnapshotId === submissionSnapshotId).map(i => ({ ...i }));
  }

  async findBySchoolIdAndSubmissionSnapshotId(schoolId: string, submissionSnapshotId: string): Promise<SubmittedSnapshotIntake | null> {
    const found = Array.from(this.store.values()).find(i => i.schoolId === schoolId && i.submissionSnapshotId === submissionSnapshotId);
    return found ? { ...found } : null;
  }

  async update(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake> {
    this.store.set(intake.snapshotIntakeId, { ...intake });
    return { ...intake };
  }

  async delete(snapshotIntakeId: string): Promise<void> {
    this.store.delete(snapshotIntakeId);
  }
}

export class InMemoryMarkingBatchRepository implements MarkingBatchRepository {
  private store = new Map<string, MarkingBatch>();

  async create(batch: MarkingBatch): Promise<MarkingBatch> {
    this.store.set(batch.markingBatchId, { ...batch });
    return { ...batch };
  }

  async findById(markingBatchId: string): Promise<MarkingBatch | null> {
    const b = this.store.get(markingBatchId);
    return b ? { ...b } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingBatch[]> {
    return Array.from(this.store.values()).filter(b => b.schoolId === schoolId).map(b => ({ ...b }));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingBatch[]> {
    return Array.from(this.store.values()).filter(b => b.markingInvocationRequestId === markingInvocationRequestId).map(b => ({ ...b }));
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingBatch[]> {
    return Array.from(this.store.values()).filter(b => b.markingRunId === markingRunId).map(b => ({ ...b }));
  }

  async update(batch: MarkingBatch): Promise<MarkingBatch> {
    this.store.set(batch.markingBatchId, { ...batch });
    return { ...batch };
  }

  async delete(markingBatchId: string): Promise<void> {
    this.store.delete(markingBatchId);
  }
}

export class InMemoryMarkingBatchItemRepository implements MarkingBatchItemRepository {
  private store = new Map<string, MarkingBatchItem>();

  async create(item: MarkingBatchItem): Promise<MarkingBatchItem> {
    this.store.set(item.markingBatchItemId, { ...item });
    return { ...item };
  }

  async findById(markingBatchItemId: string): Promise<MarkingBatchItem | null> {
    const item = this.store.get(markingBatchItemId);
    return item ? { ...item } : null;
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.markingBatchId === markingBatchId).map(i => ({ ...i }));
  }

  async findBySchoolId(schoolId: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.schoolId === schoolId).map(i => ({ ...i }));
  }

  async findBySnapshotIntakeId(snapshotIntakeId: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.snapshotIntakeId === snapshotIntakeId).map(i => ({ ...i }));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.submissionSnapshotId === submissionSnapshotId).map(i => ({ ...i }));
  }

  async findByAnswerSubmissionId(answerSubmissionId: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.answerSubmissionId === answerSubmissionId).map(i => ({ ...i }));
  }

  async findByItemStatus(itemStatus: string): Promise<MarkingBatchItem[]> {
    return Array.from(this.store.values()).filter(i => i.itemStatus === itemStatus).map(i => ({ ...i }));
  }

  async update(item: MarkingBatchItem): Promise<MarkingBatchItem> {
    this.store.set(item.markingBatchItemId, { ...item });
    return { ...item };
  }

  async delete(markingBatchItemId: string): Promise<void> {
    this.store.delete(markingBatchItemId);
  }
}

export class InMemoryMarkingResultLinkRepository implements MarkingResultLinkRepository {
  private store = new Map<string, MarkingResultLink>();

  async create(link: MarkingResultLink): Promise<MarkingResultLink> {
    this.store.set(link.markingResultLinkId, { ...link });
    return { ...link };
  }

  async findById(markingResultLinkId: string): Promise<MarkingResultLink | null> {
    const l = this.store.get(markingResultLinkId);
    return l ? { ...l } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.schoolId === schoolId).map(l => ({ ...l }));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.markingInvocationRequestId === markingInvocationRequestId).map(l => ({ ...l }));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.markingBatchId === markingBatchId).map(l => ({ ...l }));
  }

  async findByBatchItemId(markingBatchItemId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.markingBatchItemId === markingBatchItemId).map(l => ({ ...l }));
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.markingRunId === markingRunId).map(l => ({ ...l }));
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingResultLink[]> {
    return Array.from(this.store.values()).filter(l => l.markingResultVersionId === markingResultVersionId).map(l => ({ ...l }));
  }

  async update(link: MarkingResultLink): Promise<MarkingResultLink> {
    this.store.set(link.markingResultLinkId, { ...link });
    return { ...link };
  }

  async delete(markingResultLinkId: string): Promise<void> {
    this.store.delete(markingResultLinkId);
  }
}

export class InMemoryMarkingDispatchAuditRepository implements MarkingDispatchAuditRepository {
  private store = new Map<string, MarkingDispatchAuditEvent>();

  async create(event: MarkingDispatchAuditEvent): Promise<MarkingDispatchAuditEvent> {
    this.store.set(event.markingDispatchAuditId, { ...event });
    return { ...event };
  }

  async findById(markingDispatchAuditId: string): Promise<MarkingDispatchAuditEvent | null> {
    const e = this.store.get(markingDispatchAuditId);
    return e ? { ...e } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingDispatchAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId).map(e => ({ ...e }));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingDispatchAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.markingInvocationRequestId === markingInvocationRequestId).map(e => ({ ...e }));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingDispatchAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.markingBatchId === markingBatchId).map(e => ({ ...e }));
  }

  async findByEventType(eventType: string): Promise<MarkingDispatchAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.eventType === eventType).map(e => ({ ...e }));
  }
}

export class InMemoryMarkingInvocationIdempotencyRepository implements MarkingInvocationIdempotencyRepository {
  private store = new Map<string, MarkingInvocationIdempotencyEntry>();

  async create(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry> {
    this.store.set(entry.markingInvocationIdempotencyId, { ...entry });
    return { ...entry };
  }

  async findById(markingInvocationIdempotencyId: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    const e = this.store.get(markingInvocationIdempotencyId);
    return e ? { ...e } : null;
  }

  async findBySchoolIdOperationAndKey(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    const found = Array.from(this.store.values()).find(e => e.schoolId === schoolId && e.operation === operation && e.idempotencyKey === idempotencyKey);
    return found ? { ...found } : null;
  }

  async findByStatus(status: string): Promise<MarkingInvocationIdempotencyEntry[]> {
    return Array.from(this.store.values()).filter(e => e.status === status).map(e => ({ ...e }));
  }

  async update(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry> {
    this.store.set(entry.markingInvocationIdempotencyId, { ...entry });
    return { ...entry };
  }

  async delete(markingInvocationIdempotencyId: string): Promise<void> {
    this.store.delete(markingInvocationIdempotencyId);
  }
}

export class InMemoryMarkingReadinessCheckRepository implements MarkingReadinessCheckRepository {
  private store = new Map<string, MarkingReadinessCheck>();

  async create(check: MarkingReadinessCheck): Promise<MarkingReadinessCheck> {
    this.store.set(check.markingReadinessCheckId, { ...check });
    return { ...check };
  }

  async findById(markingReadinessCheckId: string): Promise<MarkingReadinessCheck | null> {
    const c = this.store.get(markingReadinessCheckId);
    return c ? { ...c } : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.schoolId === schoolId).map(c => ({ ...c }));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.markingInvocationRequestId === markingInvocationRequestId).map(c => ({ ...c }));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.submissionSnapshotId === submissionSnapshotId).map(c => ({ ...c }));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.markingBatchId === markingBatchId).map(c => ({ ...c }));
  }

  async findByCheckType(checkType: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.checkType === checkType).map(c => ({ ...c }));
  }

  async findByCheckStatus(checkStatus: string): Promise<MarkingReadinessCheck[]> {
    return Array.from(this.store.values()).filter(c => c.checkStatus === checkStatus).map(c => ({ ...c }));
  }
}
