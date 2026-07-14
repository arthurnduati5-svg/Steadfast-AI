import { PrismaClient } from '@prisma/client';
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

function mapDate(d: Date | null | undefined): string | null {
  return d ? d.toISOString() : null;
}

// ── Prisma: ExamDeliverySessionRepository ──

export class PrismaExamDeliverySessionRepository implements ExamDeliverySessionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamDeliverySession, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySession> {
    const record = await this.prisma.examDeliverySessionRecord.create({ data: data as any });
    return this.toDomain(record);
  }

  async getById(deliverySessionId: string): Promise<ExamDeliverySession | null> {
    const record = await this.prisma.examDeliverySessionRecord.findUnique({ where: { deliverySessionId } });
    return record ? this.toDomain(record) : null;
  }

  async listBySchool(schoolId: string): Promise<ExamDeliverySession[]> {
    const records = await this.prisma.examDeliverySessionRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toDomain(r));
  }

  async listBySchoolAndStatus(schoolId: string, status: ExamDeliverySessionStatus): Promise<ExamDeliverySession[]> {
    const records = await this.prisma.examDeliverySessionRecord.findMany({ where: { schoolId, status } });
    return records.map(r => this.toDomain(r));
  }

  async updateStatus(deliverySessionId: string, status: ExamDeliverySessionStatus, openedAt?: string | null, closedAt?: string | null): Promise<ExamDeliverySession> {
    const data: Record<string, unknown> = { status, updatedAt: new Date() };
    if (openedAt !== undefined) data.openedAt = openedAt ? new Date(openedAt) : null;
    if (closedAt !== undefined) data.closedAt = closedAt ? new Date(closedAt) : null;
    const record = await this.prisma.examDeliverySessionRecord.update({ where: { deliverySessionId }, data });
    return this.toDomain(record);
  }

  async archive(deliverySessionId: string): Promise<ExamDeliverySession> {
    const record = await this.prisma.examDeliverySessionRecord.update({
      where: { deliverySessionId },
      data: { status: 'archived', archivedAt: new Date(), updatedAt: new Date() },
    });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamDeliverySession {
    return {
      deliverySessionId: r.deliverySessionId,
      schoolId: r.schoolId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      deliveryBridgeId: r.deliveryBridgeId,
      accessPolicyId: r.accessPolicyId,
      status: r.status as ExamDeliverySessionStatus,
      sessionMode: r.sessionMode as any,
      title: r.title,
      safeInstructions: r.safeInstructions,
      intendedAudienceType: r.intendedAudienceType,
      classScopeRefsJson: r.classScopeRefsJson,
      roleScopeRefsJson: r.roleScopeRefsJson,
      activationMode: r.activationMode as any,
      createdByActorId: r.createdByActorId,
      createdByRole: r.createdByRole,
      openedAt: mapDate(r.openedAt),
      closedAt: mapDate(r.closedAt),
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      archivedAt: mapDate(r.archivedAt),
    };
  }
}

// ── Prisma: ExamDeliverySessionStateRepository ──

export class PrismaExamDeliverySessionStateRepository implements ExamDeliverySessionStateRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamDeliverySessionState, 'createdAt' | 'updatedAt'>): Promise<ExamDeliverySessionState> {
    const record = await this.prisma.examDeliverySessionStateRecord.create({ data });
    return this.toDomain(record);
  }

  async getByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliverySessionState | null> {
    const record = await this.prisma.examDeliverySessionStateRecord.findFirst({ where: { deliverySessionId } });
    return record ? this.toDomain(record) : null;
  }

  async update(
    deliverySessionId: string,
    data: Partial<Pick<ExamDeliverySessionState, 'status' | 'activeAttemptCount' | 'submittedAttemptCount' | 'pausedAttemptCount' | 'blockedAttemptCount' | 'lastStateChangeReason' | 'safeStateSummary'>>,
    expectedVersion: number,
  ): Promise<ExamDeliverySessionState> {
    const existing = await this.prisma.examDeliverySessionStateRecord.findFirst({ where: { deliverySessionId } });
    if (!existing) throw new Error('Session state not found for ' + deliverySessionId);
    const record = await this.prisma.examDeliverySessionStateRecord.update({
      where: { sessionStateId: existing.sessionStateId },
      data: { ...data, version: { increment: 1 } },
    });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamDeliverySessionState {
    return {
      sessionStateId: r.sessionStateId,
      schoolId: r.schoolId,
      deliverySessionId: r.deliverySessionId,
      status: r.status as ExamDeliverySessionStatus,
      activeAttemptCount: r.activeAttemptCount,
      submittedAttemptCount: r.submittedAttemptCount,
      pausedAttemptCount: r.pausedAttemptCount,
      blockedAttemptCount: r.blockedAttemptCount,
      lastStateChangeReason: r.lastStateChangeReason,
      safeStateSummary: r.safeStateSummary,
      version: r.version,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

// ── Prisma: ExamVariantAssignmentRepository ──

export class PrismaExamVariantAssignmentRepository implements ExamVariantAssignmentRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>): Promise<ExamVariantAssignment> {
    const record = await this.prisma.examVariantAssignmentRecord.create({ data });
    return this.toDomain(record);
  }

  async createMany(data: Omit<ExamVariantAssignment, 'createdAt' | 'updatedAt'>[]): Promise<ExamVariantAssignment[]> {
    await this.prisma.examVariantAssignmentRecord.createMany({ data });
    return this.listByDeliverySessionId(data[0]?.deliverySessionId ?? '');
  }

  async getById(variantAssignmentId: string): Promise<ExamVariantAssignment | null> {
    const record = await this.prisma.examVariantAssignmentRecord.findUnique({ where: { variantAssignmentId } });
    return record ? this.toDomain(record) : null;
  }

  async getByDeliverySessionAndStudent(deliverySessionId: string, studentRef: string): Promise<ExamVariantAssignment | null> {
    const record = await this.prisma.examVariantAssignmentRecord.findFirst({
      where: { deliverySessionId, studentRef },
    });
    return record ? this.toDomain(record) : null;
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamVariantAssignment[]> {
    const records = await this.prisma.examVariantAssignmentRecord.findMany({ where: { deliverySessionId } });
    return records.map(r => this.toDomain(r));
  }

  async listBySchool(schoolId: string): Promise<ExamVariantAssignment[]> {
    const records = await this.prisma.examVariantAssignmentRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toDomain(r));
  }

  async updateStatus(variantAssignmentId: string, status: ExamVariantAssignmentStatus, revokedAt?: string | null): Promise<ExamVariantAssignment> {
    const data: Record<string, unknown> = { assignmentStatus: status, updatedAt: new Date() };
    if (revokedAt !== undefined) data.revokedAt = revokedAt ? new Date(revokedAt) : null;
    const record = await this.prisma.examVariantAssignmentRecord.update({ where: { variantAssignmentId }, data });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamVariantAssignment {
    return {
      variantAssignmentId: r.variantAssignmentId,
      schoolId: r.schoolId,
      deliverySessionId: r.deliverySessionId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      variantId: r.variantId,
      studentRef: r.studentRef,
      learnerRefType: r.learnerRefType as any,
      assignmentStatus: r.assignmentStatus as ExamVariantAssignmentStatus,
      assignmentStrategy: r.assignmentStrategy as any,
      assignedByActorId: r.assignedByActorId,
      assignedByRole: r.assignedByRole,
      safeAssignmentSummary: r.safeAssignmentSummary,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      revokedAt: mapDate(r.revokedAt),
    };
  }
}

// ── Prisma: ExamAttemptRepository ──

export class PrismaExamAttemptRepository implements ExamAttemptRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAttempt, 'createdAt' | 'updatedAt'>): Promise<ExamAttempt> {
    const record = await this.prisma.examAttemptRecord.create({ data });
    return this.toDomain(record);
  }

  async getById(attemptId: string): Promise<ExamAttempt | null> {
    const record = await this.prisma.examAttemptRecord.findUnique({ where: { attemptId } });
    return record ? this.toDomain(record) : null;
  }

  async getByAssignmentAndStudent(variantAssignmentId: string, studentRef: string): Promise<ExamAttempt | null> {
    const record = await this.prisma.examAttemptRecord.findFirst({
      where: { variantAssignmentId, studentRef },
    });
    return record ? this.toDomain(record) : null;
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttempt[]> {
    const records = await this.prisma.examAttemptRecord.findMany({ where: { deliverySessionId } });
    return records.map(r => this.toDomain(r));
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ExamAttempt[]> {
    const records = await this.prisma.examAttemptRecord.findMany({ where: { schoolId, studentRef } });
    return records.map(r => this.toDomain(r));
  }

  async listBySchool(schoolId: string): Promise<ExamAttempt[]> {
    const records = await this.prisma.examAttemptRecord.findMany({ where: { schoolId } });
    return records.map(r => this.toDomain(r));
  }

  async updateStatus(attemptId: string, status: ExamAttemptStatus): Promise<ExamAttempt> {
    const record = await this.prisma.examAttemptRecord.update({ where: { attemptId }, data: { status, updatedAt: new Date() } });
    return this.toDomain(record);
  }

  async updateTiming(attemptId: string, lastSeenAt: string, durationSecondsUsed: number): Promise<ExamAttempt> {
    const record = await this.prisma.examAttemptRecord.update({
      where: { attemptId },
      data: { lastSeenAt: new Date(lastSeenAt), durationSecondsUsed, updatedAt: new Date() },
    });
    return this.toDomain(record);
  }

  async updateSubmitted(attemptId: string, submittedAt: string): Promise<ExamAttempt> {
    const record = await this.prisma.examAttemptRecord.update({
      where: { attemptId },
      data: { status: 'submitted', submittedAt: new Date(submittedAt), updatedAt: new Date() },
    });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamAttempt {
    return {
      attemptId: r.attemptId,
      schoolId: r.schoolId,
      deliverySessionId: r.deliverySessionId,
      variantAssignmentId: r.variantAssignmentId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      variantId: r.variantId,
      studentRef: r.studentRef,
      status: r.status as ExamAttemptStatus,
      attemptNumber: r.attemptNumber,
      startedAt: mapDate(r.startedAt),
      lastSeenAt: mapDate(r.lastSeenAt),
      submittedAt: mapDate(r.submittedAt),
      autoSubmittedAt: mapDate(r.autoSubmittedAt),
      cancelledAt: mapDate(r.cancelledAt),
      blockedAt: mapDate(r.blockedAt),
      durationSecondsAllowed: r.durationSecondsAllowed,
      durationSecondsUsed: r.durationSecondsUsed,
      safeAttemptSummary: r.safeAttemptSummary,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

// ── Prisma: ExamAttemptQuestionSnapshotRepository ──

export class PrismaExamAttemptQuestionSnapshotRepository implements ExamAttemptQuestionSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>): Promise<ExamAttemptQuestionSnapshot> {
    const record = await this.prisma.examAttemptQuestionSnapshotRecord.create({ data });
    return this.toDomain(record);
  }

  async createMany(data: Omit<ExamAttemptQuestionSnapshot, 'createdAt'>[]): Promise<ExamAttemptQuestionSnapshot[]> {
    await this.prisma.examAttemptQuestionSnapshotRecord.createMany({ data });
    return this.listByAttemptId(data[0]?.attemptId ?? '');
  }

  async listByAttemptId(attemptId: string): Promise<ExamAttemptQuestionSnapshot[]> {
    const records = await this.prisma.examAttemptQuestionSnapshotRecord.findMany({ where: { attemptId }, orderBy: { displayOrder: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async updateSnapshotStatus(attemptQuestionSnapshotId: string, snapshotStatus: string): Promise<ExamAttemptQuestionSnapshot> {
    const record = await this.prisma.examAttemptQuestionSnapshotRecord.update({ where: { attemptQuestionSnapshotId }, data: { snapshotStatus } });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamAttemptQuestionSnapshot {
    return {
      attemptQuestionSnapshotId: r.attemptQuestionSnapshotId,
      schoolId: r.schoolId,
      attemptId: r.attemptId,
      deliverySessionId: r.deliverySessionId,
      paperQuestionId: r.paperQuestionId,
      variantQuestionId: r.variantQuestionId,
      questionId: r.questionId,
      questionVersionId: r.questionVersionId,
      sectionKey: r.sectionKey,
      displayOrder: r.displayOrder,
      marksAvailable: r.marksAvailable,
      studentVisiblePromptSafe: r.studentVisiblePromptSafe,
      answerInputType: r.answerInputType,
      snapshotStatus: r.snapshotStatus,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

// ── Prisma: ExamAnswerSubmissionRepository ──

export class PrismaExamAnswerSubmissionRepository implements ExamAnswerSubmissionRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAnswerSubmission, 'createdAt' | 'updatedAt'>): Promise<ExamAnswerSubmission> {
    const record = await this.prisma.examAnswerSubmissionRecord.create({ data: data as any });
    return this.toDomain(record);
  }

  async update(data: Partial<ExamAnswerSubmission> & { answerSubmissionId: string }): Promise<ExamAnswerSubmission> {
    const record = await this.prisma.examAnswerSubmissionRecord.update({
      where: { answerSubmissionId: data.answerSubmissionId },
      data: { ...data, updatedAt: new Date() } as any,
    });
    return this.toDomain(record);
  }

  async getById(answerSubmissionId: string): Promise<ExamAnswerSubmission | null> {
    const record = await this.prisma.examAnswerSubmissionRecord.findUnique({ where: { answerSubmissionId } });
    return record ? this.toDomain(record) : null;
  }

  async getByQuestionSnapshotId(attemptQuestionSnapshotId: string): Promise<ExamAnswerSubmission | null> {
    const record = await this.prisma.examAnswerSubmissionRecord.findFirst({
      where: { attemptQuestionSnapshotId },
      orderBy: { revisionNumber: 'desc' },
    });
    return record ? this.toDomain(record) : null;
  }

  async listByAttemptId(attemptId: string): Promise<ExamAnswerSubmission[]> {
    const records = await this.prisma.examAnswerSubmissionRecord.findMany({ where: { attemptId }, orderBy: { revisionNumber: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async updateStatus(answerSubmissionId: string, status: ExamAnswerSubmissionStatus): Promise<ExamAnswerSubmission> {
    const record = await this.prisma.examAnswerSubmissionRecord.update({
      where: { answerSubmissionId },
      data: { answerStatus: status, updatedAt: new Date() },
    });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamAnswerSubmission {
    return {
      answerSubmissionId: r.answerSubmissionId,
      schoolId: r.schoolId,
      attemptId: r.attemptId,
      attemptQuestionSnapshotId: r.attemptQuestionSnapshotId,
      deliverySessionId: r.deliverySessionId,
      studentRef: r.studentRef,
      answerStatus: r.answerStatus as ExamAnswerSubmissionStatus,
      answerTextSafe: r.answerTextSafe,
      answerPayloadJson: r.answerPayloadJson,
      attachmentRefsJson: r.attachmentRefsJson,
      clientSavedAt: mapDate(r.clientSavedAt),
      serverReceivedAt: r.serverReceivedAt.toISOString(),
      revisionNumber: r.revisionNumber,
      isFinal: r.isFinal,
      safeSubmissionSummary: r.safeSubmissionSummary,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    };
  }
}

// ── Prisma: ExamAttemptTimingEventRepository ──

export class PrismaExamAttemptTimingEventRepository implements ExamAttemptTimingEventRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAttemptTimingEvent, 'createdAt'>): Promise<ExamAttemptTimingEvent> {
    const record = await this.prisma.examAttemptTimingEventRecord.create({ data: data as any });
    return this.toDomain(record);
  }

  async listByAttemptId(attemptId: string): Promise<ExamAttemptTimingEvent[]> {
    const records = await this.prisma.examAttemptTimingEventRecord.findMany({ where: { attemptId }, orderBy: { eventAt: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamAttemptTimingEvent[]> {
    const records = await this.prisma.examAttemptTimingEventRecord.findMany({ where: { deliverySessionId }, orderBy: { eventAt: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  private toDomain(r: any): ExamAttemptTimingEvent {
    return {
      timingEventId: r.timingEventId,
      schoolId: r.schoolId,
      attemptId: r.attemptId,
      deliverySessionId: r.deliverySessionId,
      eventType: r.eventType as any,
      eventAt: r.eventAt.toISOString(),
      durationSecondsUsed: r.durationSecondsUsed,
      durationSecondsRemaining: r.durationSecondsRemaining,
      safeTimingSummary: r.safeTimingSummary,
      metadataJson: r.metadataJson,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

// ── Prisma: ExamAttemptSubmissionSnapshotRepository ──

export class PrismaExamAttemptSubmissionSnapshotRepository implements ExamAttemptSubmissionSnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamAttemptSubmissionSnapshot, 'createdAt'>): Promise<ExamAttemptSubmissionSnapshot> {
    const record = await this.prisma.examAttemptSubmissionSnapshotRecord.create({ data: data as any });
    return this.toDomain(record);
  }

  async getById(submissionSnapshotId: string): Promise<ExamAttemptSubmissionSnapshot | null> {
    const record = await this.prisma.examAttemptSubmissionSnapshotRecord.findUnique({ where: { submissionSnapshotId } });
    return record ? this.toDomain(record) : null;
  }

  async getByAttemptId(attemptId: string): Promise<ExamAttemptSubmissionSnapshot | null> {
    const record = await this.prisma.examAttemptSubmissionSnapshotRecord.findFirst({ where: { attemptId } });
    return record ? this.toDomain(record) : null;
  }

  async updateStatus(submissionSnapshotId: string, snapshotStatus: ExamAttemptSubmissionSnapshotStatus, sealedAt?: string | null): Promise<ExamAttemptSubmissionSnapshot> {
    const data: Record<string, unknown> = { snapshotStatus };
    if (sealedAt !== undefined) data.sealedAt = sealedAt ? new Date(sealedAt) : null;
    const record = await this.prisma.examAttemptSubmissionSnapshotRecord.update({ where: { submissionSnapshotId }, data });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamAttemptSubmissionSnapshot {
    return {
      submissionSnapshotId: r.submissionSnapshotId,
      schoolId: r.schoolId,
      attemptId: r.attemptId,
      deliverySessionId: r.deliverySessionId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      variantId: r.variantId,
      studentRef: r.studentRef,
      snapshotStatus: r.snapshotStatus as ExamAttemptSubmissionSnapshotStatus,
      submittedAnswerCount: r.submittedAnswerCount,
      questionSnapshotCount: r.questionSnapshotCount,
      totalMarksAvailable: r.totalMarksAvailable,
      submissionPayloadJson: r.submissionPayloadJson,
      safeSnapshotSummary: r.safeSnapshotSummary,
      createdAt: r.createdAt.toISOString(),
      sealedAt: mapDate(r.sealedAt),
    };
  }
}

// ── Prisma: ExamDeliveryAuditRepository ──

export class PrismaExamDeliveryAuditRepository implements ExamDeliveryAuditRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamDeliveryAuditEvent, 'createdAt'>): Promise<ExamDeliveryAuditEvent> {
    const record = await this.prisma.examDeliveryAuditRecord.create({ data: data as any });
    return this.toDomain(record);
  }

  async listByDeliverySessionId(deliverySessionId: string): Promise<ExamDeliveryAuditEvent[]> {
    const records = await this.prisma.examDeliveryAuditRecord.findMany({ where: { deliverySessionId }, orderBy: { createdAt: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async listByAttemptId(attemptId: string): Promise<ExamDeliveryAuditEvent[]> {
    const records = await this.prisma.examDeliveryAuditRecord.findMany({ where: { attemptId }, orderBy: { createdAt: 'asc' } });
    return records.map(r => this.toDomain(r));
  }

  async listBySchool(schoolId: string): Promise<ExamDeliveryAuditEvent[]> {
    const records = await this.prisma.examDeliveryAuditRecord.findMany({ where: { schoolId }, orderBy: { createdAt: 'desc' } });
    return records.map(r => this.toDomain(r));
  }

  private toDomain(r: any): ExamDeliveryAuditEvent {
    return {
      deliveryAuditId: r.deliveryAuditId,
      schoolId: r.schoolId,
      deliverySessionId: r.deliverySessionId,
      attemptId: r.attemptId,
      actorId: r.actorId,
      actorRole: r.actorRole,
      eventType: r.eventType,
      decision: r.decision,
      safeSummary: r.safeSummary,
      reasonCodesJson: r.reasonCodesJson,
      metadataJson: r.metadataJson,
      requestId: r.requestId,
      correlationId: r.correlationId,
      createdAt: r.createdAt.toISOString(),
    };
  }
}

// ── Prisma: ExamDeliveryIdempotencyRepository ──

export class PrismaExamDeliveryIdempotencyRepository implements ExamDeliveryIdempotencyRepository {
  constructor(private prisma: PrismaClient) {}

  async create(data: Omit<ExamDeliveryIdempotencyEntry, 'createdAt' | 'updatedAt'>): Promise<ExamDeliveryIdempotencyEntry> {
    const record = await this.prisma.examDeliveryIdempotencyRecord.create({ data });
    return this.toDomain(record);
  }

  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ExamDeliveryIdempotencyEntry | null> {
    const record = await this.prisma.examDeliveryIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    });
    return record ? this.toDomain(record) : null;
  }

  async updateStatus(deliveryIdempotencyId: string, status: string, resourceType?: string, resourceId?: string, safeResultSummary?: string): Promise<ExamDeliveryIdempotencyEntry> {
    const data: Record<string, unknown> = { status, updatedAt: new Date() };
    if (resourceType !== undefined) data.resourceType = resourceType;
    if (resourceId !== undefined) data.resourceId = resourceId;
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const record = await this.prisma.examDeliveryIdempotencyRecord.update({ where: { deliveryIdempotencyId }, data });
    return this.toDomain(record);
  }

  private toDomain(r: any): ExamDeliveryIdempotencyEntry {
    return {
      deliveryIdempotencyId: r.deliveryIdempotencyId,
      schoolId: r.schoolId,
      operation: r.operation,
      idempotencyKey: r.idempotencyKey,
      requestHash: r.requestHash,
      status: r.status,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      safeResultSummary: r.safeResultSummary,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
      expiresAt: mapDate(r.expiresAt),
    };
  }
}

// ── Factory ──

export function createPrismaExamDeliveryRepositories(prisma: PrismaClient): ExamDeliveryAllRepositories {
  return {
    sessionRepository: new PrismaExamDeliverySessionRepository(prisma),
    sessionStateRepository: new PrismaExamDeliverySessionStateRepository(prisma),
    variantAssignmentRepository: new PrismaExamVariantAssignmentRepository(prisma),
    attemptRepository: new PrismaExamAttemptRepository(prisma),
    questionSnapshotRepository: new PrismaExamAttemptQuestionSnapshotRepository(prisma),
    answerSubmissionRepository: new PrismaExamAnswerSubmissionRepository(prisma),
    timingEventRepository: new PrismaExamAttemptTimingEventRepository(prisma),
    submissionSnapshotRepository: new PrismaExamAttemptSubmissionSnapshotRepository(prisma),
    auditRepository: new PrismaExamDeliveryAuditRepository(prisma),
    idempotencyRepository: new PrismaExamDeliveryIdempotencyRepository(prisma),
  };
}
