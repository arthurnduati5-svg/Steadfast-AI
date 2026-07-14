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

function mapDate(d: Date | string | undefined | null): string | null {
  if (!d) return null;
  if (typeof d === 'string') return d;
  return d.toISOString();
}

function mapJson(j: unknown): Record<string, unknown> | null {
  if (!j) return null;
  if (typeof j === 'string') return JSON.parse(j);
  return j as Record<string, unknown>;
}

function mapStringArray(j: unknown): string[] | null {
  if (!j) return null;
  if (Array.isArray(j)) return j;
  if (typeof j === 'string') return JSON.parse(j);
  return null;
}

export class PrismaMarkingInvocationRequestRepository implements MarkingInvocationRequestRepository {
  constructor(private prisma: any) {}

  async create(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest> {
    const record = await this.prisma.markingInvocationRequestRecord.create({
      data: {
        markingInvocationRequestId: request.markingInvocationRequestId,
        schoolId: request.schoolId,
        deliverySessionId: request.deliverySessionId,
        paperId: request.paperId,
        paperVersionId: request.paperVersionId,
        requestedByActorId: request.requestedByActorId,
        requestedByRole: request.requestedByRole,
        invocationStatus: request.invocationStatus,
        invocationMode: request.invocationMode,
        sourceType: request.sourceType,
        submittedSnapshotRefsJson: request.submittedSnapshotRefsJson,
        safeRequestSummary: request.safeRequestSummary,
        createdAt: new Date(request.createdAt),
        updatedAt: new Date(request.updatedAt),
        cancelledAt: request.cancelledAt ? new Date(request.cancelledAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findById(markingInvocationRequestId: string): Promise<MarkingInvocationRequest | null> {
    const record = await this.prisma.markingInvocationRequestRecord.findUnique({ where: { markingInvocationRequestId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingInvocationRequest[]> {
    const records = await this.prisma.markingInvocationRequestRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySchoolIdAndStatus(schoolId: string, status: string): Promise<MarkingInvocationRequest[]> {
    const records = await this.prisma.markingInvocationRequestRecord.findMany({ where: { schoolId, invocationStatus: status } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByDeliverySessionId(deliverySessionId: string): Promise<MarkingInvocationRequest[]> {
    const records = await this.prisma.markingInvocationRequestRecord.findMany({ where: { deliverySessionId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async update(request: MarkingInvocationRequest): Promise<MarkingInvocationRequest> {
    const record = await this.prisma.markingInvocationRequestRecord.update({
      where: { markingInvocationRequestId: request.markingInvocationRequestId },
      data: {
        invocationStatus: request.invocationStatus,
        invocationMode: request.invocationMode,
        sourceType: request.sourceType,
        submittedSnapshotRefsJson: request.submittedSnapshotRefsJson,
        safeRequestSummary: request.safeRequestSummary,
        updatedAt: new Date(request.updatedAt),
        cancelledAt: request.cancelledAt ? new Date(request.cancelledAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(markingInvocationRequestId: string): Promise<void> {
    await this.prisma.markingInvocationRequestRecord.delete({ where: { markingInvocationRequestId } });
  }

  private toDomain(r: any): MarkingInvocationRequest {
    return {
      markingInvocationRequestId: r.markingInvocationRequestId,
      schoolId: r.schoolId,
      deliverySessionId: r.deliverySessionId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      requestedByActorId: r.requestedByActorId,
      requestedByRole: r.requestedByRole,
      invocationStatus: r.invocationStatus,
      invocationMode: r.invocationMode,
      sourceType: r.sourceType,
      submittedSnapshotRefsJson: r.submittedSnapshotRefsJson as Record<string, unknown> | null,
      safeRequestSummary: r.safeRequestSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      cancelledAt: r.cancelledAt instanceof Date ? r.cancelledAt.toISOString() : r.cancelledAt,
    };
  }
}

export class PrismaSubmittedSnapshotIntakeRepository implements SubmittedSnapshotIntakeRepository {
  constructor(private prisma: any) {}

  async create(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake> {
    const record = await this.prisma.submittedSnapshotIntakeRecord.create({
      data: {
        snapshotIntakeId: intake.snapshotIntakeId,
        schoolId: intake.schoolId,
        markingInvocationRequestId: intake.markingInvocationRequestId,
        submissionSnapshotId: intake.submissionSnapshotId,
        attemptId: intake.attemptId,
        deliverySessionId: intake.deliverySessionId,
        paperId: intake.paperId,
        paperVersionId: intake.paperVersionId,
        variantId: intake.variantId,
        studentRef: intake.studentRef,
        intakeStatus: intake.intakeStatus,
        readinessStatus: intake.readinessStatus,
        readinessReasonCodesJson: intake.readinessReasonCodesJson,
        safeIntakeSummary: intake.safeIntakeSummary,
        createdAt: new Date(intake.createdAt),
        updatedAt: new Date(intake.updatedAt),
        blockedAt: intake.blockedAt ? new Date(intake.blockedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findById(snapshotIntakeId: string): Promise<SubmittedSnapshotIntake | null> {
    const record = await this.prisma.submittedSnapshotIntakeRecord.findUnique({ where: { snapshotIntakeId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<SubmittedSnapshotIntake[]> {
    const records = await this.prisma.submittedSnapshotIntakeRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<SubmittedSnapshotIntake[]> {
    const records = await this.prisma.submittedSnapshotIntakeRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<SubmittedSnapshotIntake[]> {
    const records = await this.prisma.submittedSnapshotIntakeRecord.findMany({ where: { submissionSnapshotId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySchoolIdAndSubmissionSnapshotId(schoolId: string, submissionSnapshotId: string): Promise<SubmittedSnapshotIntake | null> {
    const records = await this.prisma.submittedSnapshotIntakeRecord.findMany({
      where: { schoolId, submissionSnapshotId },
    });
    return records.length > 0 ? this.toDomain(records[0]) : null;
  }

  async update(intake: SubmittedSnapshotIntake): Promise<SubmittedSnapshotIntake> {
    const record = await this.prisma.submittedSnapshotIntakeRecord.update({
      where: { snapshotIntakeId: intake.snapshotIntakeId },
      data: {
        intakeStatus: intake.intakeStatus,
        readinessStatus: intake.readinessStatus,
        readinessReasonCodesJson: intake.readinessReasonCodesJson,
        safeIntakeSummary: intake.safeIntakeSummary,
        updatedAt: new Date(intake.updatedAt),
        blockedAt: intake.blockedAt ? new Date(intake.blockedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(snapshotIntakeId: string): Promise<void> {
    await this.prisma.submittedSnapshotIntakeRecord.delete({ where: { snapshotIntakeId } });
  }

  private toDomain(r: any): SubmittedSnapshotIntake {
    return {
      snapshotIntakeId: r.snapshotIntakeId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId,
      submissionSnapshotId: r.submissionSnapshotId,
      attemptId: r.attemptId,
      deliverySessionId: r.deliverySessionId,
      paperId: r.paperId,
      paperVersionId: r.paperVersionId,
      variantId: r.variantId,
      studentRef: r.studentRef,
      intakeStatus: r.intakeStatus,
      readinessStatus: r.readinessStatus,
      readinessReasonCodesJson: mapStringArray(r.readinessReasonCodesJson),
      safeIntakeSummary: r.safeIntakeSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      blockedAt: r.blockedAt instanceof Date ? r.blockedAt.toISOString() : r.blockedAt,
    };
  }
}

export class PrismaMarkingBatchRepository implements MarkingBatchRepository {
  constructor(private prisma: any) {}

  async create(batch: MarkingBatch): Promise<MarkingBatch> {
    const record = await this.prisma.markingBatchRecord.create({
      data: {
        markingBatchId: batch.markingBatchId,
        schoolId: batch.schoolId,
        markingInvocationRequestId: batch.markingInvocationRequestId,
        markingRunId: batch.markingRunId,
        batchStatus: batch.batchStatus,
        batchMode: batch.batchMode,
        batchSequence: batch.batchSequence,
        totalItems: batch.totalItems,
        deterministicItemCount: batch.deterministicItemCount,
        teacherReviewItemCount: batch.teacherReviewItemCount,
        blockedItemCount: batch.blockedItemCount,
        safeBatchSummary: batch.safeBatchSummary,
        createdAt: new Date(batch.createdAt),
        updatedAt: new Date(batch.updatedAt),
        startedAt: batch.startedAt ? new Date(batch.startedAt) : null,
        completedAt: batch.completedAt ? new Date(batch.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findById(markingBatchId: string): Promise<MarkingBatch | null> {
    const record = await this.prisma.markingBatchRecord.findUnique({ where: { markingBatchId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingBatch[]> {
    const records = await this.prisma.markingBatchRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingBatch[]> {
    const records = await this.prisma.markingBatchRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingBatch[]> {
    const records = await this.prisma.markingBatchRecord.findMany({ where: { markingRunId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async update(batch: MarkingBatch): Promise<MarkingBatch> {
    const record = await this.prisma.markingBatchRecord.update({
      where: { markingBatchId: batch.markingBatchId },
      data: {
        batchStatus: batch.batchStatus,
        batchMode: batch.batchMode,
        totalItems: batch.totalItems,
        deterministicItemCount: batch.deterministicItemCount,
        teacherReviewItemCount: batch.teacherReviewItemCount,
        blockedItemCount: batch.blockedItemCount,
        safeBatchSummary: batch.safeBatchSummary,
        updatedAt: new Date(batch.updatedAt),
        startedAt: batch.startedAt ? new Date(batch.startedAt) : null,
        completedAt: batch.completedAt ? new Date(batch.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(markingBatchId: string): Promise<void> {
    await this.prisma.markingBatchRecord.delete({ where: { markingBatchId } });
  }

  private toDomain(r: any): MarkingBatch {
    return {
      markingBatchId: r.markingBatchId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId,
      markingRunId: r.markingRunId,
      batchStatus: r.batchStatus,
      batchMode: r.batchMode,
      batchSequence: r.batchSequence,
      totalItems: r.totalItems,
      deterministicItemCount: r.deterministicItemCount,
      teacherReviewItemCount: r.teacherReviewItemCount,
      blockedItemCount: r.blockedItemCount,
      safeBatchSummary: r.safeBatchSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      startedAt: r.startedAt instanceof Date ? r.startedAt.toISOString() : r.startedAt,
      completedAt: r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
    };
  }
}

export class PrismaMarkingBatchItemRepository implements MarkingBatchItemRepository {
  constructor(private prisma: any) {}

  async create(item: MarkingBatchItem): Promise<MarkingBatchItem> {
    const record = await this.prisma.markingBatchItemRecord.create({
      data: {
        markingBatchItemId: item.markingBatchItemId,
        schoolId: item.schoolId,
        markingBatchId: item.markingBatchId,
        snapshotIntakeId: item.snapshotIntakeId,
        submissionSnapshotId: item.submissionSnapshotId,
        attemptId: item.attemptId,
        attemptQuestionSnapshotId: item.attemptQuestionSnapshotId,
        answerSubmissionId: item.answerSubmissionId,
        questionId: item.questionId,
        questionVersionId: item.questionVersionId,
        paperQuestionId: item.paperQuestionId,
        variantQuestionId: item.variantQuestionId,
        studentRef: item.studentRef,
        itemStatus: item.itemStatus,
        itemMode: item.itemMode,
        marksAvailable: item.marksAvailable,
        safeItemSummary: item.safeItemSummary,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findById(markingBatchItemId: string): Promise<MarkingBatchItem | null> {
    const record = await this.prisma.markingBatchItemRecord.findUnique({ where: { markingBatchItemId } });
    return record ? this.toDomain(record) : null;
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { markingBatchId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySchoolId(schoolId: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySnapshotIntakeId(snapshotIntakeId: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { snapshotIntakeId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { submissionSnapshotId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByAnswerSubmissionId(answerSubmissionId: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { answerSubmissionId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByItemStatus(itemStatus: string): Promise<MarkingBatchItem[]> {
    const records = await this.prisma.markingBatchItemRecord.findMany({ where: { itemStatus } });
    return records.map((r: any) => this.toDomain(r));
  }

  async update(item: MarkingBatchItem): Promise<MarkingBatchItem> {
    const record = await this.prisma.markingBatchItemRecord.update({
      where: { markingBatchItemId: item.markingBatchItemId },
      data: {
        itemStatus: item.itemStatus,
        itemMode: item.itemMode,
        marksAvailable: item.marksAvailable,
        safeItemSummary: item.safeItemSummary,
        updatedAt: new Date(item.updatedAt),
        completedAt: item.completedAt ? new Date(item.completedAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(markingBatchItemId: string): Promise<void> {
    await this.prisma.markingBatchItemRecord.delete({ where: { markingBatchItemId } });
  }

  private toDomain(r: any): MarkingBatchItem {
    return {
      markingBatchItemId: r.markingBatchItemId,
      schoolId: r.schoolId,
      markingBatchId: r.markingBatchId,
      snapshotIntakeId: r.snapshotIntakeId,
      submissionSnapshotId: r.submissionSnapshotId,
      attemptId: r.attemptId,
      attemptQuestionSnapshotId: r.attemptQuestionSnapshotId,
      answerSubmissionId: r.answerSubmissionId,
      questionId: r.questionId,
      questionVersionId: r.questionVersionId,
      paperQuestionId: r.paperQuestionId,
      variantQuestionId: r.variantQuestionId,
      studentRef: r.studentRef,
      itemStatus: r.itemStatus,
      itemMode: r.itemMode,
      marksAvailable: r.marksAvailable,
      safeItemSummary: r.safeItemSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      completedAt: r.completedAt instanceof Date ? r.completedAt.toISOString() : r.completedAt,
    };
  }
}

export class PrismaMarkingResultLinkRepository implements MarkingResultLinkRepository {
  constructor(private prisma: any) {}

  async create(link: MarkingResultLink): Promise<MarkingResultLink> {
    const record = await this.prisma.markingResultLinkRecord.create({
      data: {
        markingResultLinkId: link.markingResultLinkId,
        schoolId: link.schoolId,
        markingInvocationRequestId: link.markingInvocationRequestId,
        markingBatchId: link.markingBatchId,
        markingBatchItemId: link.markingBatchItemId,
        markingRunId: link.markingRunId,
        markingResultVersionId: link.markingResultVersionId,
        submissionSnapshotId: link.submissionSnapshotId,
        attemptId: link.attemptId,
        answerSubmissionId: link.answerSubmissionId,
        linkStatus: link.linkStatus,
        safeLinkSummary: link.safeLinkSummary,
        createdAt: new Date(link.createdAt),
        updatedAt: new Date(link.updatedAt),
      },
    });
    return this.toDomain(record);
  }

  async findById(markingResultLinkId: string): Promise<MarkingResultLink | null> {
    const record = await this.prisma.markingResultLinkRecord.findUnique({ where: { markingResultLinkId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { markingBatchId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByBatchItemId(markingBatchItemId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { markingBatchItemId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByMarkingRunId(markingRunId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { markingRunId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByMarkingResultVersionId(markingResultVersionId: string): Promise<MarkingResultLink[]> {
    const records = await this.prisma.markingResultLinkRecord.findMany({ where: { markingResultVersionId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async update(link: MarkingResultLink): Promise<MarkingResultLink> {
    const record = await this.prisma.markingResultLinkRecord.update({
      where: { markingResultLinkId: link.markingResultLinkId },
      data: {
        linkStatus: link.linkStatus,
        safeLinkSummary: link.safeLinkSummary,
        updatedAt: new Date(link.updatedAt),
      },
    });
    return this.toDomain(record);
  }

  async delete(markingResultLinkId: string): Promise<void> {
    await this.prisma.markingResultLinkRecord.delete({ where: { markingResultLinkId } });
  }

  private toDomain(r: any): MarkingResultLink {
    return {
      markingResultLinkId: r.markingResultLinkId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId,
      markingBatchId: r.markingBatchId,
      markingBatchItemId: r.markingBatchItemId,
      markingRunId: r.markingRunId,
      markingResultVersionId: r.markingResultVersionId,
      submissionSnapshotId: r.submissionSnapshotId,
      attemptId: r.attemptId,
      answerSubmissionId: r.answerSubmissionId,
      linkStatus: r.linkStatus,
      safeLinkSummary: r.safeLinkSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
    };
  }
}

export class PrismaMarkingDispatchAuditRepository implements MarkingDispatchAuditRepository {
  constructor(private prisma: any) {}

  async create(event: MarkingDispatchAuditEvent): Promise<MarkingDispatchAuditEvent> {
    const record = await this.prisma.markingDispatchAuditRecord.create({
      data: {
        markingDispatchAuditId: event.markingDispatchAuditId,
        schoolId: event.schoolId,
        markingInvocationRequestId: event.markingInvocationRequestId,
        markingBatchId: event.markingBatchId,
        markingBatchItemId: event.markingBatchItemId,
        markingRunId: event.markingRunId,
        actorId: event.actorId,
        actorRole: event.actorRole,
        eventType: event.eventType,
        decision: event.decision,
        safeSummary: event.safeSummary,
        reasonCodesJson: event.reasonCodesJson,
        metadataJson: event.metadataJson,
        requestId: event.requestId,
        correlationId: event.correlationId,
        createdAt: new Date(event.createdAt),
      },
    });
    return this.toDomain(record);
  }

  async findById(markingDispatchAuditId: string): Promise<MarkingDispatchAuditEvent | null> {
    const record = await this.prisma.markingDispatchAuditRecord.findUnique({ where: { markingDispatchAuditId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingDispatchAuditEvent[]> {
    const records = await this.prisma.markingDispatchAuditRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingDispatchAuditEvent[]> {
    const records = await this.prisma.markingDispatchAuditRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingDispatchAuditEvent[]> {
    const records = await this.prisma.markingDispatchAuditRecord.findMany({ where: { markingBatchId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByEventType(eventType: string): Promise<MarkingDispatchAuditEvent[]> {
    const records = await this.prisma.markingDispatchAuditRecord.findMany({ where: { eventType } });
    return records.map((r: any) => this.toDomain(r));
  }

  private toDomain(r: any): MarkingDispatchAuditEvent {
    return {
      markingDispatchAuditId: r.markingDispatchAuditId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId,
      markingBatchId: r.markingBatchId,
      markingBatchItemId: r.markingBatchItemId,
      markingRunId: r.markingRunId,
      actorId: r.actorId,
      actorRole: r.actorRole,
      eventType: r.eventType,
      decision: r.decision,
      safeSummary: r.safeSummary,
      reasonCodesJson: mapStringArray(r.reasonCodesJson),
      metadataJson: mapJson(r.metadataJson) as Record<string, unknown> | null,
      requestId: r.requestId,
      correlationId: r.correlationId,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    };
  }
}

export class PrismaMarkingInvocationIdempotencyRepository implements MarkingInvocationIdempotencyRepository {
  constructor(private prisma: any) {}

  async create(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry> {
    const record = await this.prisma.markingInvocationIdempotencyRecord.create({
      data: {
        markingInvocationIdempotencyId: entry.markingInvocationIdempotencyId,
        schoolId: entry.schoolId,
        operation: entry.operation,
        idempotencyKey: entry.idempotencyKey,
        requestHash: entry.requestHash,
        status: entry.status,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        safeResultSummary: entry.safeResultSummary,
        createdAt: new Date(entry.createdAt),
        updatedAt: new Date(entry.updatedAt),
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async findById(markingInvocationIdempotencyId: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    const record = await this.prisma.markingInvocationIdempotencyRecord.findUnique({ where: { markingInvocationIdempotencyId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolIdOperationAndKey(schoolId: string, operation: string, idempotencyKey: string): Promise<MarkingInvocationIdempotencyEntry | null> {
    const records = await this.prisma.markingInvocationIdempotencyRecord.findMany({
      where: { schoolId, operation, idempotencyKey },
    });
    return records.length > 0 ? this.toDomain(records[0]) : null;
  }

  async findByStatus(status: string): Promise<MarkingInvocationIdempotencyEntry[]> {
    const records = await this.prisma.markingInvocationIdempotencyRecord.findMany({ where: { status } });
    return records.map((r: any) => this.toDomain(r));
  }

  async update(entry: MarkingInvocationIdempotencyEntry): Promise<MarkingInvocationIdempotencyEntry> {
    const record = await this.prisma.markingInvocationIdempotencyRecord.update({
      where: { markingInvocationIdempotencyId: entry.markingInvocationIdempotencyId },
      data: {
        status: entry.status,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        safeResultSummary: entry.safeResultSummary,
        updatedAt: new Date(entry.updatedAt),
        expiresAt: entry.expiresAt ? new Date(entry.expiresAt) : null,
      },
    });
    return this.toDomain(record);
  }

  async delete(markingInvocationIdempotencyId: string): Promise<void> {
    await this.prisma.markingInvocationIdempotencyRecord.delete({ where: { markingInvocationIdempotencyId } });
  }

  private toDomain(r: any): MarkingInvocationIdempotencyEntry {
    return {
      markingInvocationIdempotencyId: r.markingInvocationIdempotencyId,
      schoolId: r.schoolId,
      operation: r.operation,
      idempotencyKey: r.idempotencyKey,
      requestHash: r.requestHash,
      status: r.status,
      resourceType: r.resourceType,
      resourceId: r.resourceId,
      safeResultSummary: r.safeResultSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : r.updatedAt,
      expiresAt: r.expiresAt instanceof Date ? r.expiresAt.toISOString() : r.expiresAt,
    };
  }
}

export class PrismaMarkingReadinessCheckRepository implements MarkingReadinessCheckRepository {
  constructor(private prisma: any) {}

  async create(check: MarkingReadinessCheck): Promise<MarkingReadinessCheck> {
    const record = await this.prisma.markingReadinessCheckRecord.create({
      data: {
        markingReadinessCheckId: check.markingReadinessCheckId,
        schoolId: check.schoolId,
        markingInvocationRequestId: check.markingInvocationRequestId,
        submissionSnapshotId: check.submissionSnapshotId,
        markingBatchId: check.markingBatchId,
        checkType: check.checkType,
        checkStatus: check.checkStatus,
        reasonCodesJson: check.reasonCodesJson,
        safeCheckSummary: check.safeCheckSummary,
        createdAt: new Date(check.createdAt),
      },
    });
    return this.toDomain(record);
  }

  async findById(markingReadinessCheckId: string): Promise<MarkingReadinessCheck | null> {
    const record = await this.prisma.markingReadinessCheckRecord.findUnique({ where: { markingReadinessCheckId } });
    return record ? this.toDomain(record) : null;
  }

  async findBySchoolId(schoolId: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { schoolId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByInvocationRequestId(markingInvocationRequestId: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { markingInvocationRequestId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findBySubmissionSnapshotId(submissionSnapshotId: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { submissionSnapshotId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByBatchId(markingBatchId: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { markingBatchId } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByCheckType(checkType: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { checkType } });
    return records.map((r: any) => this.toDomain(r));
  }

  async findByCheckStatus(checkStatus: string): Promise<MarkingReadinessCheck[]> {
    const records = await this.prisma.markingReadinessCheckRecord.findMany({ where: { checkStatus } });
    return records.map((r: any) => this.toDomain(r));
  }

  private toDomain(r: any): MarkingReadinessCheck {
    return {
      markingReadinessCheckId: r.markingReadinessCheckId,
      schoolId: r.schoolId,
      markingInvocationRequestId: r.markingInvocationRequestId,
      submissionSnapshotId: r.submissionSnapshotId,
      markingBatchId: r.markingBatchId,
      checkType: r.checkType,
      checkStatus: r.checkStatus,
      reasonCodesJson: mapStringArray(r.reasonCodesJson),
      safeCheckSummary: r.safeCheckSummary,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    };
  }
}
