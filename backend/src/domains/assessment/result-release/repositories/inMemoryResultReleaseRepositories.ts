import type {
  ResultReleasePacket, CreateReleasePacketInput,
  ResultReleaseApproval, CreateReleaseApprovalInput,
  ResultAudienceProjection, CreateAudienceProjectionInput,
  StudentResultReportSnapshot, CreateReportSnapshotInput,
  ParentSafeResultSummary, CreateParentSafeSummaryInput,
  StudentSafeResultSummary, CreateStudentSafeSummaryInput,
  ResultReleaseDeliveryIntent, CreateDeliveryIntentInput,
  ResultReleaseAuditEvent, ResultReleaseIdempotencyEntry,
} from '../contracts';
import type {
  ResultReleasePacketRepository, ResultReleaseApprovalRepository,
  ResultAudienceProjectionRepository, StudentResultReportSnapshotRepository,
  ParentSafeResultSummaryRepository, StudentSafeResultSummaryRepository,
  ResultReleaseDeliveryIntentRepository, ResultReleaseAuditRepository,
  ResultReleaseIdempotencyRepository,
} from '../contracts/resultReleaseRepositoryContracts';

function uuid(): string { return Math.random().toString(36).substring(2, 15) + Date.now().toString(36); }
function now(): string { return new Date().toISOString(); }

export class InMemoryResultReleasePacketRepository implements ResultReleasePacketRepository {
  private store = new Map<string, ResultReleasePacket>();

  async create(input: CreateReleasePacketInput): Promise<ResultReleasePacket> {
    const record: ResultReleasePacket = {
      ...input,
      resultReleasePacketId: uuid(),
      packetStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.resultReleasePacketId, record);
    return record;
  }

  async getById(id: string): Promise<ResultReleasePacket | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultReleasePacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultReleasePacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }

  async listByFinalizationDecisionId(decisionId: string): Promise<ResultReleasePacket[]> {
    return Array.from(this.store.values()).filter(r => r.resultFinalizationDecisionId === decisionId);
  }

  async updateStatus(id: string, status: string, _safeSummary?: string): Promise<ResultReleasePacket | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, packetStatus: status as ResultReleasePacket['packetStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async update(id: string, updates: Partial<ResultReleasePacket>): Promise<ResultReleasePacket | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, ...updates, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockPacket(id: string, blockedAt: string): Promise<ResultReleasePacket | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, packetStatus: 'blocked' as const, blockedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async cancelPacket(id: string, cancelledAt: string): Promise<ResultReleasePacket | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, packetStatus: 'cancelled' as const, cancelledAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidPacket(id: string, voidedAt: string): Promise<ResultReleasePacket | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, packetStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryResultReleaseApprovalRepository implements ResultReleaseApprovalRepository {
  private store = new Map<string, ResultReleaseApproval>();

  async create(input: CreateReleaseApprovalInput): Promise<ResultReleaseApproval> {
    const record: ResultReleaseApproval = {
      ...input,
      resultReleaseApprovalId: uuid(),
      approvalStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.resultReleaseApprovalId, record);
    return record;
  }

  async getById(id: string): Promise<ResultReleaseApproval | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultReleaseApproval[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultReleaseApproval[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<ResultReleaseApproval[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async updateStatus(id: string, status: string, _safeSummary?: string): Promise<ResultReleaseApproval | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, approvalStatus: status as ResultReleaseApproval['approvalStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockApproval(id: string): Promise<ResultReleaseApproval | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, approvalStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidApproval(id: string, voidedAt: string): Promise<ResultReleaseApproval | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, approvalStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryResultAudienceProjectionRepository implements ResultAudienceProjectionRepository {
  private store = new Map<string, ResultAudienceProjection>();
  private versionCounter = 0;

  async create(input: CreateAudienceProjectionInput, projectionVersion?: number): Promise<ResultAudienceProjection> {
    const record: ResultAudienceProjection = {
      ...input,
      resultAudienceProjectionId: uuid(),
      projectionStatus: 'draft',
      projectionVersion: projectionVersion ?? 1,
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.resultAudienceProjectionId, record);
    return record;
  }

  async getById(id: string): Promise<ResultAudienceProjection | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<ResultAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async listByAudienceType(audienceType: string): Promise<ResultAudienceProjection[]> {
    return Array.from(this.store.values()).filter(r => r.audienceType === audienceType);
  }

  async updateStatus(id: string, status: string): Promise<ResultAudienceProjection | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, projectionStatus: status as ResultAudienceProjection['projectionStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockProjection(id: string): Promise<ResultAudienceProjection | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, projectionStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidProjection(id: string, voidedAt: string): Promise<ResultAudienceProjection | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, projectionStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryStudentResultReportSnapshotRepository implements StudentResultReportSnapshotRepository {
  private store = new Map<string, StudentResultReportSnapshot>();

  async create(input: CreateReportSnapshotInput): Promise<StudentResultReportSnapshot> {
    const record: StudentResultReportSnapshot = {
      ...input,
      studentResultReportSnapshotId: uuid(),
      snapshotStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.studentResultReportSnapshotId, record);
    return record;
  }

  async getById(id: string): Promise<StudentResultReportSnapshot | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<StudentResultReportSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<StudentResultReportSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<StudentResultReportSnapshot[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async updateStatus(id: string, status: string): Promise<StudentResultReportSnapshot | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, snapshotStatus: status as StudentResultReportSnapshot['snapshotStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async approveSnapshot(id: string, approvedAt: string): Promise<StudentResultReportSnapshot | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, snapshotStatus: 'approved_for_internal_use' as const, approvedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockSnapshot(id: string): Promise<StudentResultReportSnapshot | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, snapshotStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidSnapshot(id: string, voidedAt: string): Promise<StudentResultReportSnapshot | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, snapshotStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryParentSafeResultSummaryRepository implements ParentSafeResultSummaryRepository {
  private store = new Map<string, ParentSafeResultSummary>();

  async create(input: CreateParentSafeSummaryInput): Promise<ParentSafeResultSummary> {
    const record: ParentSafeResultSummary = {
      ...input,
      parentSafeResultSummaryId: uuid(),
      summaryStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.parentSafeResultSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<ParentSafeResultSummary | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<ParentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<ParentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<ParentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async updateStatus(id: string, status: string): Promise<ParentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: status as ParentSafeResultSummary['summaryStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async approveForFutureDelivery(id: string, approvedAt: string): Promise<ParentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'approved_for_future_delivery' as const, approvedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockSummary(id: string): Promise<ParentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidSummary(id: string, voidedAt: string): Promise<ParentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryStudentSafeResultSummaryRepository implements StudentSafeResultSummaryRepository {
  private store = new Map<string, StudentSafeResultSummary>();

  async create(input: CreateStudentSafeSummaryInput): Promise<StudentSafeResultSummary> {
    const record: StudentSafeResultSummary = {
      ...input,
      studentSafeResultSummaryId: uuid(),
      summaryStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.studentSafeResultSummaryId, record);
    return record;
  }

  async getById(id: string): Promise<StudentSafeResultSummary | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<StudentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<StudentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<StudentSafeResultSummary[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async updateStatus(id: string, status: string): Promise<StudentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: status as StudentSafeResultSummary['summaryStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async approveForFutureDelivery(id: string, approvedAt: string): Promise<StudentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'approved_for_future_delivery' as const, approvedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockSummary(id: string): Promise<StudentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidSummary(id: string, voidedAt: string): Promise<StudentSafeResultSummary | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, summaryStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryResultReleaseDeliveryIntentRepository implements ResultReleaseDeliveryIntentRepository {
  private store = new Map<string, ResultReleaseDeliveryIntent>();

  async create(input: CreateDeliveryIntentInput): Promise<ResultReleaseDeliveryIntent> {
    const record: ResultReleaseDeliveryIntent = {
      ...input,
      resultReleaseDeliveryIntentId: uuid(),
      intentStatus: 'draft',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(record.resultReleaseDeliveryIntentId, record);
    return record;
  }

  async getById(id: string): Promise<ResultReleaseDeliveryIntent | null> { return this.store.get(id) ?? null; }

  async listBySchool(schoolId: string): Promise<ResultReleaseDeliveryIntent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByReleasePacketId(packetId: string): Promise<ResultReleaseDeliveryIntent[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }

  async listByStudentRef(studentRef: string): Promise<ResultReleaseDeliveryIntent[]> {
    return Array.from(this.store.values()).filter(r => r.studentRef === studentRef);
  }

  async updateStatus(id: string, status: string): Promise<ResultReleaseDeliveryIntent | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, intentStatus: status as ResultReleaseDeliveryIntent['intentStatus'], updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async blockIntent(id: string): Promise<ResultReleaseDeliveryIntent | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, intentStatus: 'blocked' as const, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async voidIntent(id: string, voidedAt: string): Promise<ResultReleaseDeliveryIntent | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, intentStatus: 'void' as const, voidedAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryResultReleaseAuditRepository implements ResultReleaseAuditRepository {
  private store = new Map<string, ResultReleaseAuditEvent>();

  async create(event: ResultReleaseAuditEvent): Promise<ResultReleaseAuditEvent> {
    const record: ResultReleaseAuditEvent = { ...event, resultReleaseAuditId: uuid(), createdAt: event.createdAt ?? now() };
    this.store.set(record.resultReleaseAuditId!, record);
    return record;
  }

  async listBySchool(schoolId: string): Promise<ResultReleaseAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }

  async listByPacketId(packetId: string): Promise<ResultReleaseAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.resultReleasePacketId === packetId);
  }
}

export class InMemoryResultReleaseIdempotencyRepository implements ResultReleaseIdempotencyRepository {
  private store = new Map<string, ResultReleaseIdempotencyEntry>();

  private key(schoolId: string, operation: string, idempotencyKey: string): string {
    return `${schoolId}:${operation}:${idempotencyKey}`;
  }

  async create(entry: ResultReleaseIdempotencyEntry): Promise<ResultReleaseIdempotencyEntry> {
    const record: ResultReleaseIdempotencyEntry = {
      ...entry,
      resultReleaseIdempotencyId: uuid(),
      status: 'in_progress',
      createdAt: now(),
      updatedAt: now(),
    };
    this.store.set(this.key(entry.schoolId, entry.operation, entry.idempotencyKey), record);
    this.store.set(record.resultReleaseIdempotencyId!, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultReleaseIdempotencyEntry | null> {
    return this.store.get(this.key(schoolId, operation, idempotencyKey)) ?? null;
  }

  async updateStatus(id: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultReleaseIdempotencyEntry | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, status, resourceId: resourceId ?? r.resourceId, safeResultSummary: safeResultSummary ?? r.safeResultSummary, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }

  async expireEntry(id: string, expiresAt: string): Promise<ResultReleaseIdempotencyEntry | null> {
    const r = this.store.get(id);
    if (!r) return null;
    const updated = { ...r, status: 'expired', expiresAt, updatedAt: now() };
    this.store.set(id, updated);
    return updated;
  }
}
