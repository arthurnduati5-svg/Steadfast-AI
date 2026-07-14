import {
  ExamDeliverySession,
  ExamDeliverySessionState,
  ExamDeliverySessionStatus,
} from '../contracts/examDeliverySessionContracts';
import {
  ExamVariantAssignment,
  ExamVariantAssignmentStatus,
} from '../contracts/examVariantAssignmentContracts';
import {
  ExamAttempt,
  ExamAttemptQuestionSnapshot,
  ExamAttemptStatus,
  ExamAttemptTimingEvent,
} from '../contracts/examAttemptContracts';
import {
  ExamAnswerSubmission,
  ExamAnswerSubmissionStatus,
} from '../contracts/examAnswerSubmissionContracts';
import {
  ExamAttemptSubmissionSnapshot,
  ExamAttemptSubmissionSnapshotStatus,
  ExamDeliveryAuditEvent,
  ExamDeliveryIdempotencyEntry,
} from '../contracts/examDeliverySnapshotContracts';
import {
  ExamDeliverySessionRepository,
  ExamDeliverySessionStateRepository,
  ExamVariantAssignmentRepository,
  ExamAttemptRepository,
  ExamAttemptQuestionSnapshotRepository,
  ExamAnswerSubmissionRepository,
  ExamAttemptTimingEventRepository,
  ExamAttemptSubmissionSnapshotRepository,
  ExamDeliveryAuditRepository,
  ExamDeliveryIdempotencyRepository,
  ExamDeliveryAllRepositories,
} from '../contracts/examDeliveryRepositoryContracts';

// ── In-Memory: ExamDeliverySessionRepository ──

export class InMemoryExamDeliverySessionRepository implements ExamDeliverySessionRepository {
  private store = new Map<string, ExamDeliverySession>();

  async create(data: Omit<ExamDeliverySession, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySession> {
    const now = new Date().toISOString();
    const record: ExamDeliverySession = { ...data, createdAt: now, updatedAt: now };
    this.store.set(data.deliverySessionId, record);
    return record;
  }

  async getById(deliverySessionId: string): Promise<ExamDeliverySession | null> {
    return this.store.get(deliverySessionId) ?? null;
  }

  async listBySchool(schoolId: string): Promise<ExamDeliverySession[]> {
    return Array.from(this.store.values()).filter(s => s.schoolId === schoolId);
  }

  async listBySchoolAndStatus(schoolId: string, status: ExamDeliverySessionStatus): Promise<ExamDeliverySession[]> {
    return Array.from(this.store.values()).filter(s => s.schoolId === schoolId && s.status === status);
  }

  async updateStatus(deliverySessionId: string, status: ExamDeliverySessionStatus, openedAt?: string | null, closedAt?: string | null): Promise<ExamDeliverySession> {
    const existing = this.store.get(deliverySessionId);
    if (!existing) throw new Error(`ExamDeliverySession ${deliverySessionId} not found`);
    const updated = {
      ...existing,
      status,
      openedAt: openedAt !== undefined ? openedAt : existing.openedAt,
      closedAt: closedAt !== undefined ? closedAt : existing.closedAt,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(deliverySessionId, updated);
    return updated;
  }

  async archive(deliverySessionId: string): Promise<ExamDeliverySession> {
    const existing = this.store.get(deliverySessionId);
    if (!existing) throw new Error(`ExamDeliverySession ${deliverySessionId} not found`);
    const updated = {
      ...existing,
      status: 'archived' as ExamDeliverySessionStatus,
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(deliverySessionId, updated);
    return updated;
  }
}

// ── In-Memory: ExamDeliverySessionStateRepository ──

export class InMemoryExamDeliverySessionStateRepository implements ExamDeliverySessionStateRepository {
  private store = new Map<string, ExamDeliverySessionState>();

  async create(data: Omit<ExamDeliverySessionState, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySessionState> {
    const now = new Date().toISOString();
    const record: ExamDeliverySessionState = { ...data, createdAt: now, updatedAt: now };
    this.store.set(data.deliverySessionId, record);
    return record;
  }

  async getByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliverySessionState | null> {
    return this.store.get(deliverySessionId) ?? null;
  }

  async update(
    deliverySessionId: string,
    data: Partial<Pick<ExamDeliverySessionState, 'status' | 'activeAttemptCount' | 'submittedAttemptCount' | 'pausedAttemptCount' | 'blockedAttemptCount' | 'lastStateChangeReason' | 'safeStateSummary'>>,
    expectedVersion: number,
  ): Promise<ExamDeliverySessionState> {
    const existing = this.store.get(deliverySessionId);
    if (!existing) throw new Error(`ExamDeliverySessionState ${deliverySessionId} not found`);
    if (existing.version !== expectedVersion) throw new Error(`Version conflict for ExamDeliverySessionState ${deliverySessionId}`);
    const updated: ExamDeliverySessionState = {
      ...existing,
      ...data,
      version: existing.version + 1,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(deliverySessionId, updated);
    return updated;
  }
}

// ── In-Memory: ExamVariantAssignmentRepository ──

export class InMemoryExamVariantAssignmentRepository implements ExamVariantAssignmentRepository {
  private store = new Map<string, ExamVariantAssignment>();

  async create(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>): Promise<ExamVariantAssignment> {
    const now = new Date().toISOString();
    const record: ExamVariantAssignment = { ...data, createdAt: now, updatedAt: now };
    this.store.set(data.variantAssignmentId, record);
    return record;
  }

  async createMany(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>[]): Promise<ExamVariantAssignment[]> {
    const results: ExamVariantAssignment[] = [];
    for (const d of data) {
      results.push(await this.create(d));
    }
    return results;
  }

  async getById(variantAssignmentId: string): Promise<ExamVariantAssignment | null> {
    return this.store.get(variantAssignmentId) ?? null;
  }

  async getByDeliverySessionAndStudent(deliverySessionId: string, studentRef: string): Promise<ExamVariantAssignment | null> {
    return Array.from(this.store.values()).find(a => a.deliverySessionId === deliverySessionId && a.studentRef === studentRef) ?? null;
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamVariantAssignment[]> {
    return Array.from(this.store.values()).filter(a => a.deliverySessionId === deliverySessionId);
  }

  async listBySchool(schoolId: string): Promise<ExamVariantAssignment[]> {
    return Array.from(this.store.values()).filter(a => a.schoolId === schoolId);
  }

  async updateStatus(variantAssignmentId: string, status: ExamVariantAssignmentStatus, revokedAt?: string | null): Promise<ExamVariantAssignment> {
    const existing = this.store.get(variantAssignmentId);
    if (!existing) throw new Error(`ExamVariantAssignment ${variantAssignmentId} not found`);
    const updated = {
      ...existing,
      assignmentStatus: status,
      revokedAt: revokedAt !== undefined ? revokedAt : existing.revokedAt,
      updatedAt: new Date().toISOString(),
    };
    this.store.set(variantAssignmentId, updated);
    return updated;
  }
}

// ── In-Memory: ExamAttemptRepository ──

export class InMemoryExamAttemptRepository implements ExamAttemptRepository {
  private store = new Map<string, ExamAttempt>();

  async create(data: Omit<ExamAttempt, 'createdAt' | 'updatedAt'>): Promise<ExamAttempt> {
    const now = new Date().toISOString();
    const record: ExamAttempt = { ...data, createdAt: now, updatedAt: now };
    this.store.set(data.attemptId, record);
    return record;
  }

  async getById(attemptId: string): Promise<ExamAttempt | null> {
    return this.store.get(attemptId) ?? null;
  }

  async getByAssignmentAndStudent(variantAssignmentId: string, studentRef: string): Promise<ExamAttempt | null> {
    return Array.from(this.store.values()).find(a => a.variantAssignmentId === variantAssignmentId && a.studentRef === studentRef) ?? null;
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttempt[]> {
    return Array.from(this.store.values()).filter(a => a.deliverySessionId === deliverySessionId);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ExamAttempt[]> {
    return Array.from(this.store.values()).filter(a => a.schoolId === schoolId && a.studentRef === studentRef);
  }

  async listBySchool(schoolId: string): Promise<ExamAttempt[]> {
    return Array.from(this.store.values()).filter(a => a.schoolId === schoolId);
  }

  async updateStatus(attemptId: string, status: ExamAttemptStatus): Promise<ExamAttempt> {
    const existing = this.store.get(attemptId);
    if (!existing) throw new Error(`ExamAttempt ${attemptId} not found`);
    const updated = { ...existing, status, updatedAt: new Date().toISOString() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async updateTiming(attemptId: string, lastSeenAt: string, durationSecondsUsed: number): Promise<ExamAttempt> {
    const existing = this.store.get(attemptId);
    if (!existing) throw new Error(`ExamAttempt ${attemptId} not found`);
    const updated = { ...existing, lastSeenAt, durationSecondsUsed, updatedAt: new Date().toISOString() };
    this.store.set(attemptId, updated);
    return updated;
  }

  async updateSubmitted(attemptId: string, submittedAt: string): Promise<ExamAttempt> {
    const existing = this.store.get(attemptId);
    if (!existing) throw new Error(`ExamAttempt ${attemptId} not found`);
    const updated = { ...existing, status: 'submitted' as ExamAttemptStatus, submittedAt, updatedAt: new Date().toISOString() };
    this.store.set(attemptId, updated);
    return updated;
  }
}

// ── In-Memory: ExamAttemptQuestionSnapshotRepository ──

export class InMemoryExamAttemptQuestionSnapshotRepository implements ExamAttemptQuestionSnapshotRepository {
  private store = new Map<string, ExamAttemptQuestionSnapshot>();

  async create(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>): Promise<ExamAttemptQuestionSnapshot> {
    const record: ExamAttemptQuestionSnapshot = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.attemptQuestionSnapshotId, record);
    return record;
  }

  async createMany(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>[]): Promise<ExamAttemptQuestionSnapshot[]> {
    const results: ExamAttemptQuestionSnapshot[] = [];
    for (const d of data) {
      results.push(await this.create(d));
    }
    return results;
  }

  async listByAttemptId(attemptId: string): Promise<ExamAttemptQuestionSnapshot[]> {
    return Array.from(this.store.values()).filter(s => s.attemptId === attemptId);
  }

  async updateSnapshotStatus(attemptQuestionSnapshotId: string, snapshotStatus: string): Promise<ExamAttemptQuestionSnapshot> {
    const existing = this.store.get(attemptQuestionSnapshotId);
    if (!existing) throw new Error(`ExamAttemptQuestionSnapshot ${attemptQuestionSnapshotId} not found`);
    const updated = { ...existing, snapshotStatus };
    this.store.set(attemptQuestionSnapshotId, updated);
    return updated;
  }
}

// ── In-Memory: ExamAnswerSubmissionRepository ──

export class InMemoryExamAnswerSubmissionRepository implements ExamAnswerSubmissionRepository {
  private store = new Map<string, ExamAnswerSubmission>();

  async create(data: Omit<ExamAnswerSubmission, 'createdAt' | 'updatedAt'>): Promise<ExamAnswerSubmission> {
    const now = new Date().toISOString();
    const record: ExamAnswerSubmission = { ...data, createdAt: now, updatedAt: now };
    this.store.set(data.answerSubmissionId, record);
    return record;
  }

  async update(data: Partial<ExamAnswerSubmission> & { answerSubmissionId: string }): Promise<ExamAnswerSubmission> {
    const existing = this.store.get(data.answerSubmissionId);
    if (!existing) throw new Error(`ExamAnswerSubmission ${data.answerSubmissionId} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(data.answerSubmissionId, updated);
    return updated;
  }

  async getById(answerSubmissionId: string): Promise<ExamAnswerSubmission | null> {
    return this.store.get(answerSubmissionId) ?? null;
  }

  async getByQuestionSnapshotId(attemptQuestionSnapshotId: string): Promise<ExamAnswerSubmission | null> {
    return Array.from(this.store.values()).find(s => s.attemptQuestionSnapshotId === attemptQuestionSnapshotId) ?? null;
  }

  async listByAttemptId(attemptId: string): Promise<ExamAnswerSubmission[]> {
    return Array.from(this.store.values()).filter(s => s.attemptId === attemptId);
  }

  async updateStatus(answerSubmissionId: string, status: ExamAnswerSubmissionStatus): Promise<ExamAnswerSubmission> {
    const existing = this.store.get(answerSubmissionId);
    if (!existing) throw new Error(`ExamAnswerSubmission ${answerSubmissionId} not found`);
    const updated = { ...existing, answerStatus: status, updatedAt: new Date().toISOString() };
    this.store.set(answerSubmissionId, updated);
    return updated;
  }
}

// ── In-Memory: ExamAttemptTimingEventRepository ──

export class InMemoryExamAttemptTimingEventRepository implements ExamAttemptTimingEventRepository {
  private store = new Map<string, ExamAttemptTimingEvent>();

  async create(data: Omit<ExamAttemptTimingEvent, 'createdAt'>): Promise<ExamAttemptTimingEvent> {
    const record: ExamAttemptTimingEvent = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.timingEventId, record);
    return record;
  }

  async listByAttemptId(attemptId: string): Promise<ExamAttemptTimingEvent[]> {
    return Array.from(this.store.values()).filter(e => e.attemptId === attemptId);
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttemptTimingEvent[]> {
    return Array.from(this.store.values()).filter(e => e.deliverySessionId === deliverySessionId);
  }
}

// ── In-Memory: ExamAttemptSubmissionSnapshotRepository ──

export class InMemoryExamAttemptSubmissionSnapshotRepository implements ExamAttemptSubmissionSnapshotRepository {
  private store = new Map<string, ExamAttemptSubmissionSnapshot>();

  async create(data: Omit<ExamAttemptSubmissionSnapshot, 'createdAt'>): Promise<ExamAttemptSubmissionSnapshot> {
    const record: ExamAttemptSubmissionSnapshot = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.submissionSnapshotId, record);
    return record;
  }

  async getById(submissionSnapshotId: string): Promise<ExamAttemptSubmissionSnapshot | null> {
    return this.store.get(submissionSnapshotId) ?? null;
  }

  async getByAttemptId(attemptId: string): Promise<ExamAttemptSubmissionSnapshot | null> {
    return Array.from(this.store.values()).find(s => s.attemptId === attemptId) ?? null;
  }

  async updateStatus(submissionSnapshotId: string, snapshotStatus: ExamAttemptSubmissionSnapshotStatus, sealedAt?: string | null): Promise<ExamAttemptSubmissionSnapshot> {
    const existing = this.store.get(submissionSnapshotId);
    if (!existing) throw new Error(`ExamAttemptSubmissionSnapshot ${submissionSnapshotId} not found`);
    const updated = {
      ...existing,
      snapshotStatus,
      sealedAt: sealedAt !== undefined ? sealedAt : existing.sealedAt,
    };
    this.store.set(submissionSnapshotId, updated);
    return updated;
  }
}

// ── In-Memory: ExamDeliveryAuditRepository ──

export class InMemoryExamDeliveryAuditRepository implements ExamDeliveryAuditRepository {
  private store = new Map<string, ExamDeliveryAuditEvent>();

  async create(data: Omit<ExamDeliveryAuditEvent, 'createdAt'>): Promise<ExamDeliveryAuditEvent> {
    const record: ExamDeliveryAuditEvent = { ...data, createdAt: new Date().toISOString() };
    this.store.set(data.deliveryAuditId, record);
    return record;
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.deliverySessionId === deliverySessionId);
  }

  async listByAttemptId(attemptId: string): Promise<ExamDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.attemptId === attemptId);
  }

  async listBySchool(schoolId: string): Promise<ExamDeliveryAuditEvent[]> {
    return Array.from(this.store.values()).filter(e => e.schoolId === schoolId);
  }
}

// ── In-Memory: ExamDeliveryIdempotencyRepository ──

export class InMemoryExamDeliveryIdempotencyRepository implements ExamDeliveryIdempotencyRepository {
  private store = new Map<string, ExamDeliveryIdempotencyEntry>();

  async create(data: Omit<ExamDeliveryIdempotencyEntry, 'createdAt' | 'updatedAt'>): Promise<ExamDeliveryIdempotencyEntry> {
    const now = new Date().toISOString();
    const record: ExamDeliveryIdempotencyEntry = { ...data, createdAt: now, updatedAt: now };
    const key = `${data.schoolId}:${data.operation}:${data.idempotencyKey}`;
    this.store.set(key, record);
    return record;
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ExamDeliveryIdempotencyEntry | null> {
    const key = `${schoolId}:${operation}:${idempotencyKey}`;
    return this.store.get(key) ?? null;
  }

  async updateStatus(deliveryIdempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ExamDeliveryIdempotencyEntry> {
    for (const [key, entry] of this.store.entries()) {
      if (entry.deliveryIdempotencyId === deliveryIdempotencyId) {
        const updated = {
          ...entry,
          status,
          resourceType: resourceType ?? entry.resourceType,
          resourceId: resourceId ?? entry.resourceId,
          safeResultSummary: safeResultSummary ?? entry.safeResultSummary,
          updatedAt: new Date().toISOString(),
        };
        this.store.set(key, updated);
        return updated;
      }
    }
    throw new Error(`ExamDeliveryIdempotencyEntry ${deliveryIdempotencyId} not found`);
  }
}

// ── Factory ──

export function createInMemoryExamDeliveryRepositories(): ExamDeliveryAllRepositories {
  return {
    sessionRepository: new InMemoryExamDeliverySessionRepository(),
    sessionStateRepository: new InMemoryExamDeliverySessionStateRepository(),
    variantAssignmentRepository: new InMemoryExamVariantAssignmentRepository(),
    attemptRepository: new InMemoryExamAttemptRepository(),
    questionSnapshotRepository: new InMemoryExamAttemptQuestionSnapshotRepository(),
    answerSubmissionRepository: new InMemoryExamAnswerSubmissionRepository(),
    timingEventRepository: new InMemoryExamAttemptTimingEventRepository(),
    submissionSnapshotRepository: new InMemoryExamAttemptSubmissionSnapshotRepository(),
    auditRepository: new InMemoryExamDeliveryAuditRepository(),
    idempotencyRepository: new InMemoryExamDeliveryIdempotencyRepository(),
  };
}
