import crypto from 'crypto';
import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseReviewEvidenceBundle, CreateEvidenceBundleInput, RecoveryCaseEvidenceDigestInput } from '../contracts/recoveryCaseEvidenceBundleContracts';
import type { RecoveryCaseReviewEvidenceBundleRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';
import { ADJUDICATION_GOVERNANCE_POLICY_VERSION } from '../contracts/recoveryCaseAdjudicationContracts';

export class RecoveryCaseEvidenceBundleService {
  constructor(
    private evidenceBundleRepo: RecoveryCaseReviewEvidenceBundleRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async createEvidenceBundle(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateEvidenceBundleInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const bundle = await this.evidenceBundleRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    const digest = this.calculateEvidenceDigest({
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      safeSourceReferences: input.sourceRefs as Record<string, string>,
      sourceTimestamps: input.sourceUpdatedAt,
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    });

    await this.evidenceBundleRepo.updateDigest(bundle.evidenceBundleId, digest);

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'evidence_bundle',
      entityId: bundle.evidenceBundleId,
      action: 'create_evidence_bundle',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, digestAlgorithm: 'sha256' },
    });

    const updated = await this.evidenceBundleRepo.getById(bundle.evidenceBundleId);
    return { success: true, status: 'ok', data: updated ?? bundle, correlationId: ctx.correlationId };
  }

  async getEvidenceBundle(bundleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    const bundle = await this.evidenceBundleRepo.getById(bundleId);
    if (!bundle) {
      return { success: false, status: 'not_found', message: 'Evidence bundle not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: bundle };
  }

  async listEvidenceBundlesForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle[]>> {
    const items = await this.evidenceBundleRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listEvidenceBundlesForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle[]>> {
    const items = await this.evidenceBundleRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listEvidenceBundlesForReviewSession(schoolId: string, _reviewSessionId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle[]>> {
    const items = await this.evidenceBundleRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async verifyEvidenceBundleDigest(bundleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<{ matches: boolean; storedDigest: string; computedDigest: string }>> {
    const bundle = await this.evidenceBundleRepo.getById(bundleId);
    if (!bundle) {
      return { success: false, status: 'not_found', message: 'Evidence bundle not found', errorCode: 'NOT_FOUND' };
    }

    const computed = this.calculateEvidenceDigest({
      schoolId: bundle.schoolId,
      queueItemId: bundle.queueItemId,
      safeSourceReferences: bundle.sourceRefs as Record<string, string>,
      sourceTimestamps: bundle.sourceUpdatedAt,
      policyVersion: ADJUDICATION_GOVERNANCE_POLICY_VERSION,
    });

    const matches = computed === bundle.evidenceDigest;
    return { success: true, status: matches ? 'ok' : 'digest_mismatch', data: { matches, storedDigest: bundle.evidenceDigest, computedDigest: computed } };
  }

  async markEvidenceBundleReviewReady(bundleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    const bundle = await this.evidenceBundleRepo.updateStatus(bundleId, 'review_ready');
    await this.auditRepo.create({
      schoolId: bundle.schoolId,
      entityType: 'evidence_bundle',
      entityId: bundleId,
      action: 'mark_evidence_bundle_review_ready',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: bundle.bundleStatus },
    });
    return { success: true, status: 'ok', data: bundle };
  }

  async markEvidenceBundleStale(bundleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    const bundle = await this.evidenceBundleRepo.updateStatus(bundleId, 'stale');
    await this.auditRepo.create({
      schoolId: bundle.schoolId,
      entityType: 'evidence_bundle',
      entityId: bundleId,
      action: 'mark_evidence_bundle_stale',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: bundle.bundleStatus },
    });
    return { success: true, status: 'ok', data: bundle };
  }

  async blockEvidenceBundle(bundleId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    const bundle = await this.evidenceBundleRepo.updateStatus(bundleId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: bundle.schoolId,
      entityType: 'evidence_bundle',
      entityId: bundleId,
      action: 'block_evidence_bundle',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: bundle.bundleStatus },
    });
    return { success: true, status: 'ok', data: bundle };
  }

  async voidEvidenceBundle(bundleId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewEvidenceBundle>> {
    const bundle = await this.evidenceBundleRepo.void(bundleId);
    await this.auditRepo.create({
      schoolId: bundle.schoolId,
      entityType: 'evidence_bundle',
      entityId: bundleId,
      action: 'void_evidence_bundle',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: bundle.bundleStatus },
    });
    return { success: true, status: 'ok', data: bundle };
  }

  calculateEvidenceDigest(input: RecoveryCaseEvidenceDigestInput): string {
    const canonical = this.canonicalizeEvidenceDigestInput(input);
    return crypto.createHash('sha256').update(canonical, 'utf8').digest('hex');
  }

  canonicalizeEvidenceDigestInput(input: RecoveryCaseEvidenceDigestInput): string {
    const sortedRefs: Record<string, string> = {};
    for (const key of Object.keys(input.safeSourceReferences).sort()) {
      sortedRefs[key] = input.safeSourceReferences[key];
    }

    const sortedTimestamps: Record<string, string> = {};
    for (const key of Object.keys(input.sourceTimestamps).sort()) {
      sortedTimestamps[key] = input.sourceTimestamps[key];
    }

    const canonical: Record<string, unknown> = {
      schoolId: input.schoolId,
      queueItemId: input.queueItemId,
      safeSourceReferences: sortedRefs,
      sourceTimestamps: sortedTimestamps,
      policyVersion: input.policyVersion,
    };

    return JSON.stringify(canonical);
  }
}
