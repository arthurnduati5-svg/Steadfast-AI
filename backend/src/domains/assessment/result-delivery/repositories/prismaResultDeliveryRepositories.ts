import type {
  ResultDeliveryJob, CreateDeliveryJobInput,
  ResultDeliveryRecipient, CreateRecipientInput,
  ResultDeliveryChannelEnvelope, CreateChannelEnvelopeInput,
  ResultDeliverySuppression, CreateSuppressionInput,
  ResultDeliveryAttempt, CreateMockAttemptInput,
  ResultDeliveryReceipt, CreateReceiptInput,
  ResultDeliveryRetryPlan, CreateRetryPlanInput,
  ResultDeliveryMockProvider, CreateMockProviderInput,
  ResultDeliveryAuditEvent,
  ResultDeliveryIdempotencyEntry,
} from '../contracts';
import type {
  ResultDeliveryJobRepository,
  ResultDeliveryRecipientRepository,
  ResultDeliveryChannelEnvelopeRepository,
  ResultDeliverySuppressionRepository,
  ResultDeliveryAttemptRepository,
  ResultDeliveryReceiptRepository,
  ResultDeliveryRetryPlanRepository,
  ResultDeliveryMockProviderRepository,
  ResultDeliveryAuditRepository,
  ResultDeliveryIdempotencyRepository,
} from '../contracts/resultDeliveryRepositoryContracts';
import { prisma } from '../../../../lib/prisma';

function mapJobFromPrisma(row: any): ResultDeliveryJob {
  return {
    resultDeliveryJobId: row.resultDeliveryJobId,
    schoolId: row.schoolId,
    resultReleaseDeliveryIntentId: row.resultReleaseDeliveryIntentId,
    resultReleasePacketId: row.resultReleasePacketId,
    resultReleaseApprovalId: row.resultReleaseApprovalId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    deliveryChannel: row.deliveryChannel,
    jobStatus: row.jobStatus,
    jobMode: row.jobMode,
    safeJobSummary: row.safeJobSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    allowedFieldsJson: (row.allowedFieldsJson as Record<string, unknown>) || null,
    blockedFieldsJson: (row.blockedFieldsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    validatedAt: row.validatedAt?.toISOString() || null,
    queuedAt: row.queuedAt?.toISOString() || null,
    completedAt: row.completedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRecipientFromPrisma(row: any): ResultDeliveryRecipient {
  return {
    resultDeliveryRecipientId: row.resultDeliveryRecipientId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    studentRef: row.studentRef,
    audienceType: row.audienceType,
    recipientScope: row.recipientScope,
    recipientStatus: row.recipientStatus,
    recipientRefHash: row.recipientRefHash,
    recipientDisplayLabel: row.recipientDisplayLabel,
    relationshipToStudent: row.relationshipToStudent,
    resolutionSource: row.resolutionSource,
    safeRecipientSummary: row.safeRecipientSummary,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    verifiedAt: row.verifiedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapEnvelopeFromPrisma(row: any): ResultDeliveryChannelEnvelope {
  return {
    resultDeliveryChannelEnvelopeId: row.resultDeliveryChannelEnvelopeId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    resultDeliveryRecipientId: row.resultDeliveryRecipientId,
    resultAudienceProjectionId: row.resultAudienceProjectionId,
    envelopeStatus: row.envelopeStatus,
    audienceType: row.audienceType,
    deliveryChannel: row.deliveryChannel,
    safeSubject: row.safeSubject,
    safePreview: row.safePreview,
    safeBodyJson: (row.safeBodyJson as Record<string, unknown>) || null,
    allowedFieldNamesJson: (row.allowedFieldNamesJson as Record<string, unknown>) || null,
    blockedFieldNamesJson: (row.blockedFieldNamesJson as Record<string, unknown>) || null,
    redactionRulesJson: (row.redactionRulesJson as Record<string, unknown>) || null,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    sealedAt: row.sealedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapSuppressionFromPrisma(row: any): ResultDeliverySuppression {
  return {
    resultDeliverySuppressionId: row.resultDeliverySuppressionId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    resultDeliveryRecipientId: row.resultDeliveryRecipientId || null,
    resultDeliveryChannelEnvelopeId: row.resultDeliveryChannelEnvelopeId || null,
    suppressionStatus: row.suppressionStatus,
    suppressionType: row.suppressionType,
    suppressionReasonCode: row.suppressionReasonCode,
    safeSuppressionSummary: row.safeSuppressionSummary,
    sourceRefsJson: (row.sourceRefsJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    clearedAt: row.clearedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAttemptFromPrisma(row: any): ResultDeliveryAttempt {
  return {
    resultDeliveryAttemptId: row.resultDeliveryAttemptId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    resultDeliveryRecipientId: row.resultDeliveryRecipientId,
    resultDeliveryChannelEnvelopeId: row.resultDeliveryChannelEnvelopeId,
    deliveryChannel: row.deliveryChannel,
    attemptStatus: row.attemptStatus,
    attemptMode: row.attemptMode,
    mockProviderName: row.mockProviderName,
    safeAttemptSummary: row.safeAttemptSummary,
    attemptNumber: row.attemptNumber,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    startedAt: row.startedAt?.toISOString() || null,
    completedAt: row.completedAt?.toISOString() || null,
    failedAt: row.failedAt?.toISOString() || null,
    blockedAt: row.blockedAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapReceiptFromPrisma(row: any): ResultDeliveryReceipt {
  return {
    resultDeliveryReceiptId: row.resultDeliveryReceiptId,
    schoolId: row.schoolId,
    resultDeliveryAttemptId: row.resultDeliveryAttemptId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    resultDeliveryRecipientId: row.resultDeliveryRecipientId,
    resultDeliveryChannelEnvelopeId: row.resultDeliveryChannelEnvelopeId,
    receiptStatus: row.receiptStatus,
    receiptType: row.receiptType,
    safeReceiptSummary: row.safeReceiptSummary,
    providerSimulationJson: (row.providerSimulationJson as Record<string, unknown>) || null,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapRetryPlanFromPrisma(row: any): ResultDeliveryRetryPlan {
  return {
    resultDeliveryRetryPlanId: row.resultDeliveryRetryPlanId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId,
    resultDeliveryAttemptId: row.resultDeliveryAttemptId,
    retryStatus: row.retryStatus,
    retryPolicy: row.retryPolicy,
    nextMockRetryAt: row.nextMockRetryAt?.toISOString() || null,
    maxMockAttempts: row.maxMockAttempts,
    attemptsUsed: row.attemptsUsed,
    safeRetrySummary: row.safeRetrySummary,
    blockedReasonCodesJson: (row.blockedReasonCodesJson as Record<string, unknown>) || null,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    cancelledAt: row.cancelledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapMockProviderFromPrisma(row: any): ResultDeliveryMockProvider {
  return {
    resultDeliveryMockProviderId: row.resultDeliveryMockProviderId,
    schoolId: row.schoolId,
    providerName: row.providerName,
    providerStatus: row.providerStatus,
    supportedChannelsJson: (row.supportedChannelsJson as Record<string, unknown>) || null,
    simulationMode: row.simulationMode,
    safeProviderSummary: row.safeProviderSummary,
    createdByActorId: row.createdByActorId,
    createdByRole: row.createdByRole,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    disabledAt: row.disabledAt?.toISOString() || null,
    voidedAt: row.voidedAt?.toISOString() || null,
  };
}

function mapAuditFromPrisma(row: any): ResultDeliveryAuditEvent {
  return {
    resultDeliveryAuditId: row.resultDeliveryAuditId,
    schoolId: row.schoolId,
    resultDeliveryJobId: row.resultDeliveryJobId || null,
    resultDeliveryRecipientId: row.resultDeliveryRecipientId || null,
    resultDeliveryChannelEnvelopeId: row.resultDeliveryChannelEnvelopeId || null,
    resultDeliveryAttemptId: row.resultDeliveryAttemptId || null,
    resultDeliveryReceiptId: row.resultDeliveryReceiptId || null,
    resultDeliverySuppressionId: row.resultDeliverySuppressionId || null,
    resultDeliveryRetryPlanId: row.resultDeliveryRetryPlanId || null,
    actorId: row.actorId,
    actorRole: row.actorRole,
    eventType: row.eventType,
    decision: row.decision,
    safeSummary: row.safeSummary,
    reasonCodesJson: (row.reasonCodesJson as Record<string, unknown>) || null,
    metadataJson: (row.metadataJson as Record<string, unknown>) || null,
    requestId: row.requestId || null,
    correlationId: row.correlationId || null,
    createdAt: row.createdAt?.toISOString() || '',
  };
}

function mapIdempotencyFromPrisma(row: any): ResultDeliveryIdempotencyEntry {
  return {
    resultDeliveryIdempotencyId: row.resultDeliveryIdempotencyId,
    schoolId: row.schoolId,
    operation: row.operation,
    idempotencyKey: row.idempotencyKey,
    requestHash: row.requestHash,
    status: row.status,
    resourceType: row.resourceType || null,
    resourceId: row.resourceId || null,
    safeResultSummary: row.safeResultSummary || null,
    createdAt: row.createdAt?.toISOString() || '',
    updatedAt: row.updatedAt?.toISOString() || '',
    expiresAt: row.expiresAt?.toISOString() || null,
  };
}

export class PrismaResultDeliveryJobRepository implements ResultDeliveryJobRepository {
  async create(input: CreateDeliveryJobInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryJob> {
    const row = await prisma.resultDeliveryJobRecord.create({
      data: {
        schoolId: input.schoolId,
        resultReleaseDeliveryIntentId: input.resultReleaseDeliveryIntentId,
        resultReleasePacketId: input.resultReleasePacketId,
        resultReleaseApprovalId: input.resultReleaseApprovalId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        studentRef: input.studentRef,
        audienceType: input.audienceType,
        deliveryChannel: input.deliveryChannel,
        jobMode: input.jobMode,
        jobStatus: 'draft',
        safeJobSummary: input.safeJobSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        allowedFieldsJson: (input.allowedFieldsJson as any) || undefined,
        blockedFieldsJson: (input.blockedFieldsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapJobFromPrisma(row);
  }

  async getById(jobId: string): Promise<ResultDeliveryJob | null> {
    const row = await prisma.resultDeliveryJobRecord.findUnique({ where: { resultDeliveryJobId: jobId } });
    return row ? mapJobFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId } });
    return rows.map(mapJobFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapJobFromPrisma);
  }

  async listByReleaseIntentId(schoolId: string, intentId: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId, resultReleaseDeliveryIntentId: intentId } });
    return rows.map(mapJobFromPrisma);
  }

  async listByReleasePacketId(schoolId: string, packetId: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId, resultReleasePacketId: packetId } });
    return rows.map(mapJobFromPrisma);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId, audienceType } });
    return rows.map(mapJobFromPrisma);
  }

  async listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryJob[]> {
    const rows = await prisma.resultDeliveryJobRecord.findMany({ where: { schoolId, deliveryChannel: channel } });
    return rows.map(mapJobFromPrisma);
  }

  async updateStatus(jobId: string, status: string): Promise<ResultDeliveryJob | null> {
    const data: any = { jobStatus: status, updatedAt: new Date() };
    if (status === 'validated') data.validatedAt = new Date();
    if (status === 'queued_mock') data.queuedAt = new Date();
    if (status === 'completed_mock') data.completedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryJobRecord.update({ where: { resultDeliveryJobId: jobId }, data }).catch(() => null);
    return row ? mapJobFromPrisma(row) : null;
  }

  async update(jobId: string, updates: Partial<ResultDeliveryJob>): Promise<ResultDeliveryJob | null> {
    const row = await prisma.resultDeliveryJobRecord.update({ where: { resultDeliveryJobId: jobId }, data: updates as any }).catch(() => null);
    return row ? mapJobFromPrisma(row) : null;
  }

  async block(jobId: string): Promise<ResultDeliveryJob | null> {
    const row = await prisma.resultDeliveryJobRecord.update({
      where: { resultDeliveryJobId: jobId },
      data: { jobStatus: 'blocked', blockedAt: new Date() },
    }).catch(() => null);
    return row ? mapJobFromPrisma(row) : null;
  }

  async cancel(jobId: string): Promise<ResultDeliveryJob | null> {
    const row = await prisma.resultDeliveryJobRecord.update({
      where: { resultDeliveryJobId: jobId },
      data: { jobStatus: 'cancelled', cancelledAt: new Date() },
    }).catch(() => null);
    return row ? mapJobFromPrisma(row) : null;
  }

  async void(jobId: string): Promise<ResultDeliveryJob | null> {
    const row = await prisma.resultDeliveryJobRecord.update({
      where: { resultDeliveryJobId: jobId },
      data: { jobStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapJobFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryRecipientRepository implements ResultDeliveryRecipientRepository {
  async create(input: CreateRecipientInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRecipient> {
    const row = await prisma.resultDeliveryRecipientRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        studentRef: input.studentRef,
        audienceType: input.audienceType,
        recipientScope: input.recipientScope,
        recipientStatus: 'draft',
        recipientRefHash: input.recipientRefHash,
        recipientDisplayLabel: input.recipientDisplayLabel,
        relationshipToStudent: input.relationshipToStudent,
        resolutionSource: input.resolutionSource,
        safeRecipientSummary: input.safeRecipientSummary,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRecipientFromPrisma(row);
  }

  async getById(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const row = await prisma.resultDeliveryRecipientRecord.findUnique({ where: { resultDeliveryRecipientId: recipientId } });
    return row ? mapRecipientFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryRecipient[]> {
    const rows = await prisma.resultDeliveryRecipientRecord.findMany({ where: { schoolId } });
    return rows.map(mapRecipientFromPrisma);
  }

  async listByStudentRef(schoolId: string, studentRef: string): Promise<ResultDeliveryRecipient[]> {
    const rows = await prisma.resultDeliveryRecipientRecord.findMany({ where: { schoolId, studentRef } });
    return rows.map(mapRecipientFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRecipient[]> {
    const rows = await prisma.resultDeliveryRecipientRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapRecipientFromPrisma);
  }

  async listByAudienceType(schoolId: string, audienceType: string): Promise<ResultDeliveryRecipient[]> {
    const rows = await prisma.resultDeliveryRecipientRecord.findMany({ where: { schoolId, audienceType } });
    return rows.map(mapRecipientFromPrisma);
  }

  async updateStatus(recipientId: string, status: string): Promise<ResultDeliveryRecipient | null> {
    const data: any = { recipientStatus: status };
    if (status === 'verified') data.verifiedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryRecipientRecord.update({ where: { resultDeliveryRecipientId: recipientId }, data }).catch(() => null);
    return row ? mapRecipientFromPrisma(row) : null;
  }

  async update(recipientId: string, updates: Partial<ResultDeliveryRecipient>): Promise<ResultDeliveryRecipient | null> {
    const row = await prisma.resultDeliveryRecipientRecord.update({ where: { resultDeliveryRecipientId: recipientId }, data: updates as any }).catch(() => null);
    return row ? mapRecipientFromPrisma(row) : null;
  }

  async verify(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const row = await prisma.resultDeliveryRecipientRecord.update({
      where: { resultDeliveryRecipientId: recipientId },
      data: { recipientStatus: 'verified', verifiedAt: new Date() },
    }).catch(() => null);
    return row ? mapRecipientFromPrisma(row) : null;
  }

  async block(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const row = await prisma.resultDeliveryRecipientRecord.update({
      where: { resultDeliveryRecipientId: recipientId },
      data: { recipientStatus: 'blocked', blockedAt: new Date() },
    }).catch(() => null);
    return row ? mapRecipientFromPrisma(row) : null;
  }

  async void(recipientId: string): Promise<ResultDeliveryRecipient | null> {
    const row = await prisma.resultDeliveryRecipientRecord.update({
      where: { resultDeliveryRecipientId: recipientId },
      data: { recipientStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapRecipientFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryChannelEnvelopeRepository implements ResultDeliveryChannelEnvelopeRepository {
  async create(input: CreateChannelEnvelopeInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryChannelEnvelope> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        resultDeliveryRecipientId: input.resultDeliveryRecipientId,
        resultAudienceProjectionId: input.resultAudienceProjectionId,
        envelopeStatus: 'draft',
        audienceType: input.audienceType,
        deliveryChannel: input.deliveryChannel,
        safeSubject: input.safeSubject,
        safePreview: input.safePreview,
        safeBodyJson: (input.safeBodyJson as any) || undefined,
        allowedFieldNamesJson: (input.allowedFieldNamesJson as any) || undefined,
        blockedFieldNamesJson: (input.blockedFieldNamesJson as any) || undefined,
        redactionRulesJson: (input.redactionRulesJson as any) || undefined,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapEnvelopeFromPrisma(row);
  }

  async getById(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.findUnique({ where: { resultDeliveryChannelEnvelopeId: envelopeId } });
    return row ? mapEnvelopeFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryChannelEnvelope[]> {
    const rows = await prisma.resultDeliveryChannelEnvelopeRecord.findMany({ where: { schoolId } });
    return rows.map(mapEnvelopeFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryChannelEnvelope[]> {
    const rows = await prisma.resultDeliveryChannelEnvelopeRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapEnvelopeFromPrisma);
  }

  async updateStatus(envelopeId: string, status: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const data: any = { envelopeStatus: status };
    if (status === 'sealed') data.sealedAt = new Date();
    if (status === 'blocked') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.update({ where: { resultDeliveryChannelEnvelopeId: envelopeId }, data }).catch(() => null);
    return row ? mapEnvelopeFromPrisma(row) : null;
  }

  async update(envelopeId: string, updates: Partial<ResultDeliveryChannelEnvelope>): Promise<ResultDeliveryChannelEnvelope | null> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.update({ where: { resultDeliveryChannelEnvelopeId: envelopeId }, data: updates as any }).catch(() => null);
    return row ? mapEnvelopeFromPrisma(row) : null;
  }

  async seal(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.update({
      where: { resultDeliveryChannelEnvelopeId: envelopeId },
      data: { envelopeStatus: 'sealed', sealedAt: new Date() },
    }).catch(() => null);
    return row ? mapEnvelopeFromPrisma(row) : null;
  }

  async block(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.update({
      where: { resultDeliveryChannelEnvelopeId: envelopeId },
      data: { envelopeStatus: 'blocked', blockedAt: new Date() },
    }).catch(() => null);
    return row ? mapEnvelopeFromPrisma(row) : null;
  }

  async void(envelopeId: string): Promise<ResultDeliveryChannelEnvelope | null> {
    const row = await prisma.resultDeliveryChannelEnvelopeRecord.update({
      where: { resultDeliveryChannelEnvelopeId: envelopeId },
      data: { envelopeStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapEnvelopeFromPrisma(row) : null;
  }
}

export class PrismaResultDeliverySuppressionRepository implements ResultDeliverySuppressionRepository {
  async create(input: CreateSuppressionInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliverySuppression> {
    const row = await prisma.resultDeliverySuppressionRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        resultDeliveryRecipientId: input.resultDeliveryRecipientId || null,
        resultDeliveryChannelEnvelopeId: input.resultDeliveryChannelEnvelopeId || null,
        suppressionStatus: 'active',
        suppressionType: input.suppressionType,
        suppressionReasonCode: input.suppressionReasonCode,
        safeSuppressionSummary: input.safeSuppressionSummary,
        sourceRefsJson: (input.sourceRefsJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapSuppressionFromPrisma(row);
  }

  async getById(suppressionId: string): Promise<ResultDeliverySuppression | null> {
    const row = await prisma.resultDeliverySuppressionRecord.findUnique({ where: { resultDeliverySuppressionId: suppressionId } });
    return row ? mapSuppressionFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliverySuppression[]> {
    const rows = await prisma.resultDeliverySuppressionRecord.findMany({ where: { schoolId } });
    return rows.map(mapSuppressionFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliverySuppression[]> {
    const rows = await prisma.resultDeliverySuppressionRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapSuppressionFromPrisma);
  }

  async updateStatus(suppressionId: string, status: string): Promise<ResultDeliverySuppression | null> {
    const data: any = { suppressionStatus: status };
    if (status === 'cleared') data.clearedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliverySuppressionRecord.update({ where: { resultDeliverySuppressionId: suppressionId }, data }).catch(() => null);
    return row ? mapSuppressionFromPrisma(row) : null;
  }

  async clear(suppressionId: string): Promise<ResultDeliverySuppression | null> {
    const row = await prisma.resultDeliverySuppressionRecord.update({
      where: { resultDeliverySuppressionId: suppressionId },
      data: { suppressionStatus: 'cleared', clearedAt: new Date() },
    }).catch(() => null);
    return row ? mapSuppressionFromPrisma(row) : null;
  }

  async void(suppressionId: string): Promise<ResultDeliverySuppression | null> {
    const row = await prisma.resultDeliverySuppressionRecord.update({
      where: { resultDeliverySuppressionId: suppressionId },
      data: { suppressionStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapSuppressionFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryAttemptRepository implements ResultDeliveryAttemptRepository {
  async create(input: CreateMockAttemptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryAttempt> {
    const row = await prisma.resultDeliveryAttemptRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        resultDeliveryRecipientId: input.resultDeliveryRecipientId,
        resultDeliveryChannelEnvelopeId: input.resultDeliveryChannelEnvelopeId,
        deliveryChannel: input.deliveryChannel,
        attemptStatus: 'created',
        attemptMode: input.attemptMode,
        mockProviderName: input.mockProviderName,
        safeAttemptSummary: input.safeAttemptSummary,
        attemptNumber: input.attemptNumber,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapAttemptFromPrisma(row);
  }

  async getById(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.findUnique({ where: { resultDeliveryAttemptId: attemptId } });
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryAttempt[]> {
    const rows = await prisma.resultDeliveryAttemptRecord.findMany({ where: { schoolId } });
    return rows.map(mapAttemptFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAttempt[]> {
    const rows = await prisma.resultDeliveryAttemptRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapAttemptFromPrisma);
  }

  async updateStatus(attemptId: string, status: string): Promise<ResultDeliveryAttempt | null> {
    const data: any = { attemptStatus: status };
    if (status === 'mock_dispatched') data.startedAt = new Date();
    if (status === 'completed_mock') data.completedAt = new Date();
    if (status === 'mock_failed') data.failedAt = new Date();
    if (status === 'blocked_live_channel') data.blockedAt = new Date();
    if (status === 'cancelled') data.blockedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryAttemptRecord.update({ where: { resultDeliveryAttemptId: attemptId }, data }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async update(attemptId: string, updates: Partial<ResultDeliveryAttempt>): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({ where: { resultDeliveryAttemptId: attemptId }, data: updates as any }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async dispatch(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'mock_dispatched', startedAt: new Date() },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async complete(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'completed_mock', completedAt: new Date() },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async fail(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'mock_failed', failedAt: new Date() },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async blockLive(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'blocked_live_channel', blockedAt: new Date() },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async cancel(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'cancelled' },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }

  async void(attemptId: string): Promise<ResultDeliveryAttempt | null> {
    const row = await prisma.resultDeliveryAttemptRecord.update({
      where: { resultDeliveryAttemptId: attemptId },
      data: { attemptStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapAttemptFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryReceiptRepository implements ResultDeliveryReceiptRepository {
  async create(input: CreateReceiptInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryReceipt> {
    const row = await prisma.resultDeliveryReceiptRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryAttemptId: input.resultDeliveryAttemptId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        resultDeliveryRecipientId: input.resultDeliveryRecipientId,
        resultDeliveryChannelEnvelopeId: input.resultDeliveryChannelEnvelopeId,
        receiptStatus: 'created',
        receiptType: input.receiptType,
        safeReceiptSummary: input.safeReceiptSummary,
        providerSimulationJson: (input.providerSimulationJson as any) || undefined,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapReceiptFromPrisma(row);
  }

  async getById(receiptId: string): Promise<ResultDeliveryReceipt | null> {
    const row = await prisma.resultDeliveryReceiptRecord.findUnique({ where: { resultDeliveryReceiptId: receiptId } });
    return row ? mapReceiptFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryReceipt[]> {
    const rows = await prisma.resultDeliveryReceiptRecord.findMany({ where: { schoolId } });
    return rows.map(mapReceiptFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryReceipt[]> {
    const rows = await prisma.resultDeliveryReceiptRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapReceiptFromPrisma);
  }

  async listByAttemptId(schoolId: string, attemptId: string): Promise<ResultDeliveryReceipt[]> {
    const rows = await prisma.resultDeliveryReceiptRecord.findMany({ where: { schoolId, resultDeliveryAttemptId: attemptId } });
    return rows.map(mapReceiptFromPrisma);
  }

  async updateStatus(receiptId: string, status: string): Promise<ResultDeliveryReceipt | null> {
    const data: any = { receiptStatus: status };
    if (status === 'recorded') data.updatedAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryReceiptRecord.update({ where: { resultDeliveryReceiptId: receiptId }, data }).catch(() => null);
    return row ? mapReceiptFromPrisma(row) : null;
  }

  async void(receiptId: string): Promise<ResultDeliveryReceipt | null> {
    const row = await prisma.resultDeliveryReceiptRecord.update({
      where: { resultDeliveryReceiptId: receiptId },
      data: { receiptStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapReceiptFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryRetryPlanRepository implements ResultDeliveryRetryPlanRepository {
  async create(input: CreateRetryPlanInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryRetryPlan> {
    const row = await prisma.resultDeliveryRetryPlanRecord.create({
      data: {
        schoolId: input.schoolId,
        resultDeliveryJobId: input.resultDeliveryJobId,
        resultDeliveryAttemptId: input.resultDeliveryAttemptId,
        retryStatus: 'draft',
        retryPolicy: input.retryPolicy,
        nextMockRetryAt: input.nextMockRetryAt ? new Date(input.nextMockRetryAt) : null,
        maxMockAttempts: input.maxMockAttempts,
        attemptsUsed: input.attemptsUsed,
        safeRetrySummary: input.safeRetrySummary,
        blockedReasonCodesJson: (input.blockedReasonCodesJson as any) || undefined,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapRetryPlanFromPrisma(row);
  }

  async getById(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> {
    const row = await prisma.resultDeliveryRetryPlanRecord.findUnique({ where: { resultDeliveryRetryPlanId: retryPlanId } });
    return row ? mapRetryPlanFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryRetryPlan[]> {
    const rows = await prisma.resultDeliveryRetryPlanRecord.findMany({ where: { schoolId } });
    return rows.map(mapRetryPlanFromPrisma);
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryRetryPlan[]> {
    const rows = await prisma.resultDeliveryRetryPlanRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map(mapRetryPlanFromPrisma);
  }

  async updateStatus(retryPlanId: string, status: string): Promise<ResultDeliveryRetryPlan | null> {
    const data: any = { retryStatus: status };
    if (status === 'planned') data.updatedAt = new Date();
    if (status === 'cancelled') data.cancelledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryRetryPlanRecord.update({ where: { resultDeliveryRetryPlanId: retryPlanId }, data }).catch(() => null);
    return row ? mapRetryPlanFromPrisma(row) : null;
  }

  async cancel(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> {
    const row = await prisma.resultDeliveryRetryPlanRecord.update({
      where: { resultDeliveryRetryPlanId: retryPlanId },
      data: { retryStatus: 'cancelled', cancelledAt: new Date() },
    }).catch(() => null);
    return row ? mapRetryPlanFromPrisma(row) : null;
  }

  async void(retryPlanId: string): Promise<ResultDeliveryRetryPlan | null> {
    const row = await prisma.resultDeliveryRetryPlanRecord.update({
      where: { resultDeliveryRetryPlanId: retryPlanId },
      data: { retryStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapRetryPlanFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryMockProviderRepository implements ResultDeliveryMockProviderRepository {
  async create(input: CreateMockProviderInput & { schoolId: string; createdByActorId: string; createdByRole: string }): Promise<ResultDeliveryMockProvider> {
    const row = await prisma.resultDeliveryMockProviderRecord.create({
      data: {
        schoolId: input.schoolId,
        providerName: input.providerName,
        providerStatus: 'active',
        supportedChannelsJson: (input.supportedChannelsJson as any) || undefined,
        simulationMode: input.simulationMode,
        safeProviderSummary: input.safeProviderSummary,
        createdByActorId: input.createdByActorId,
        createdByRole: input.createdByRole,
      },
    });
    return mapMockProviderFromPrisma(row);
  }

  async getById(providerId: string): Promise<ResultDeliveryMockProvider | null> {
    const row = await prisma.resultDeliveryMockProviderRecord.findUnique({ where: { resultDeliveryMockProviderId: providerId } });
    return row ? mapMockProviderFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryMockProvider[]> {
    const rows = await prisma.resultDeliveryMockProviderRecord.findMany({ where: { schoolId } });
    return rows.map(mapMockProviderFromPrisma);
  }

  async listByChannel(schoolId: string, channel: string): Promise<ResultDeliveryMockProvider[]> {
    const rows = await prisma.resultDeliveryMockProviderRecord.findMany({ where: { schoolId } });
    return rows.filter(r => {
      const channels = r.supportedChannelsJson as Record<string, unknown> | null;
      return channels ? Object.keys(channels).includes(channel) : false;
    }).map(mapMockProviderFromPrisma);
  }

  async updateStatus(providerId: string, status: string): Promise<ResultDeliveryMockProvider | null> {
    const data: any = { providerStatus: status };
    if (status === 'disabled') data.disabledAt = new Date();
    if (status === 'void') data.voidedAt = new Date();
    const row = await prisma.resultDeliveryMockProviderRecord.update({ where: { resultDeliveryMockProviderId: providerId }, data }).catch(() => null);
    return row ? mapMockProviderFromPrisma(row) : null;
  }

  async disable(providerId: string): Promise<ResultDeliveryMockProvider | null> {
    const row = await prisma.resultDeliveryMockProviderRecord.update({
      where: { resultDeliveryMockProviderId: providerId },
      data: { providerStatus: 'disabled', disabledAt: new Date() },
    }).catch(() => null);
    return row ? mapMockProviderFromPrisma(row) : null;
  }

  async void(providerId: string): Promise<ResultDeliveryMockProvider | null> {
    const row = await prisma.resultDeliveryMockProviderRecord.update({
      where: { resultDeliveryMockProviderId: providerId },
      data: { providerStatus: 'void', voidedAt: new Date() },
    }).catch(() => null);
    return row ? mapMockProviderFromPrisma(row) : null;
  }
}

export class PrismaResultDeliveryAuditRepository implements ResultDeliveryAuditRepository {
  async create(event: ResultDeliveryAuditEvent): Promise<ResultDeliveryAuditEvent> {
    const row = await prisma.resultDeliveryAuditRecord.create({ data: event as any });
    return mapAuditFromPrisma(row);
  }

  async getById(auditId: string): Promise<ResultDeliveryAuditEvent | null> {
    const row = await prisma.resultDeliveryAuditRecord.findUnique({ where: { resultDeliveryAuditId: auditId } });
    return row ? mapAuditFromPrisma(row) : null;
  }

  async listBySchool(schoolId: string): Promise<ResultDeliveryAuditEvent[]> {
    const rows = await prisma.resultDeliveryAuditRecord.findMany({ where: { schoolId } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }

  async listByDeliveryJobId(schoolId: string, jobId: string): Promise<ResultDeliveryAuditEvent[]> {
    const rows = await prisma.resultDeliveryAuditRecord.findMany({ where: { schoolId, resultDeliveryJobId: jobId } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }

  async listByActorId(schoolId: string, actorId: string): Promise<ResultDeliveryAuditEvent[]> {
    const rows = await prisma.resultDeliveryAuditRecord.findMany({ where: { schoolId, actorId } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }

  async listByEventType(schoolId: string, eventType: string): Promise<ResultDeliveryAuditEvent[]> {
    const rows = await prisma.resultDeliveryAuditRecord.findMany({ where: { schoolId, eventType } });
    return rows.map((r: any) => mapAuditFromPrisma(r));
  }
}

export class PrismaResultDeliveryIdempotencyRepository implements ResultDeliveryIdempotencyRepository {
  async create(entry: ResultDeliveryIdempotencyEntry): Promise<ResultDeliveryIdempotencyEntry> {
    const row = await prisma.resultDeliveryIdempotencyRecord.create({ data: entry as any });
    return mapIdempotencyFromPrisma(row);
  }

  async getById(idempotencyId: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const row = await prisma.resultDeliveryIdempotencyRecord.findUnique({ where: { resultDeliveryIdempotencyId: idempotencyId } });
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async findByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const row = await prisma.resultDeliveryIdempotencyRecord.findUnique({
      where: { schoolId_operation_idempotencyKey: { schoolId, operation, idempotencyKey } },
    }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async updateStatus(idempotencyId: string, status: string, resourceId?: string, safeResultSummary?: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const data: any = { status };
    if (resourceId !== undefined) data.resourceId = resourceId;
    if (safeResultSummary !== undefined) data.safeResultSummary = safeResultSummary;
    const row = await prisma.resultDeliveryIdempotencyRecord.update({ where: { resultDeliveryIdempotencyId: idempotencyId }, data }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }

  async expire(idempotencyId: string, expiresAt: string): Promise<ResultDeliveryIdempotencyEntry | null> {
    const row = await prisma.resultDeliveryIdempotencyRecord.update({
      where: { resultDeliveryIdempotencyId: idempotencyId },
      data: { status: 'expired', expiresAt: new Date(expiresAt) },
    }).catch(() => null);
    return row ? mapIdempotencyFromPrisma(row) : null;
  }
}
