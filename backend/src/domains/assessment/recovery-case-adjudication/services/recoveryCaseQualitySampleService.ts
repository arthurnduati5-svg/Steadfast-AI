import crypto from 'crypto';
import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseQualitySample, RecoveryCaseQualitySamplingInput, RecoveryCaseQualitySamplingResult } from '../contracts/recoveryCaseQualitySampleContracts';
import type { RecoveryCaseQualitySampleRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

export class RecoveryCaseQualitySampleService {
  constructor(
    private sampleRepo: RecoveryCaseQualitySampleRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  calculateQualitySample(input: RecoveryCaseQualitySamplingInput): RecoveryCaseQualitySamplingResult {
    if (!Number.isInteger(input.sampleBasisPoints) || input.sampleBasisPoints < 0 || input.sampleBasisPoints > 10000) {
      throw new Error('sampleBasisPoints must be an integer between 0 and 10000');
    }

    const seed = `${input.schoolId}:${input.queueItemId}:${input.policyVersion}`;
    const hash = crypto.createHash('sha256').update(seed).digest('hex');
    const first8 = hash.substring(0, 8);
    const bucket = (parseInt(first8, 16) % 10000);
    const selected = input.priorityBand === 'critical_review' ? true : bucket < input.sampleBasisPoints;

    return {
      seed,
      hash,
      bucket,
      sampleBasisPoints: input.sampleBasisPoints,
      selected,
      priorityBand: input.priorityBand,
      policyVersion: input.policyVersion,
    };
  }

  async createQualitySample(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: RecoveryCaseQualitySamplingInput,
    result: RecoveryCaseQualitySamplingResult,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const sample = await this.sampleRepo.create({
      ...input,
      selected: result.selected,
      bucket: result.bucket,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'quality_sample',
      entityId: sample.qualitySampleId,
      action: 'create_quality_sample',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { seed: result.seed, bucket: result.bucket, selected: result.selected, sampleBasisPoints: result.sampleBasisPoints, priorityBand: input.priorityBand },
    });

    return { success: true, status: 'ok', data: sample, correlationId: ctx.correlationId };
  }

  async getQualitySample(sampleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample>> {
    const sample = await this.sampleRepo.getById(sampleId);
    if (!sample) {
      return { success: false, status: 'not_found', message: 'Quality sample not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: sample };
  }

  async listQualitySamplesForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample[]>> {
    const items = await this.sampleRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listQualitySamplesForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample[]>> {
    const items = await this.sampleRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listSelectedQualitySamples(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample[]>> {
    const items = await this.sampleRepo.listSelected(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listQualitySamplesByPolicyVersion(schoolId: string, policyVersion: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample[]>> {
    const items = await this.sampleRepo.listByPolicyVersion(schoolId, policyVersion);
    return { success: true, status: 'ok', data: items };
  }

  async voidQualitySample(sampleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseQualitySample>> {
    const sample = await this.sampleRepo.void(sampleId);
    await this.auditRepo.create({
      schoolId: sample.schoolId,
      entityType: 'quality_sample',
      entityId: sampleId,
      action: 'void_quality_sample',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: sample.sampleStatus },
    });
    return { success: true, status: 'ok', data: sample };
  }
}
