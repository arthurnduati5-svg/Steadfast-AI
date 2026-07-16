import type { RecoveryCaseAdjudicationCommandContext, RecoveryCaseAdjudicationSafeEnvelope } from '../contracts/recoveryCaseAdjudicationContracts';
import type { RecoveryCaseReviewerConsensus, CreateConsensusInput, RecoveryCaseConsensusEvaluation } from '../contracts/recoveryCaseConsensusContracts';
import type { RecoveryCaseReviewerDecisionDraft } from '../contracts/recoveryCaseReviewerDecisionContracts';
import type { RecoveryCaseReviewerConsensusRepository, RecoveryCaseReviewerDecisionDraftRepository, RecoveryCaseAdjudicationAuditRepository } from '../contracts/recoveryCaseAdjudicationRepositoryContracts';
import { isRoleAllowedForMutation } from '../policies/recoveryCaseAdjudicationPolicyDefinitions';

const BLOCKED_OR_VOID_STATUSES: readonly string[] = ['blocked', 'void'];

export class RecoveryCaseConsensusService {
  constructor(
    private consensusRepo: RecoveryCaseReviewerConsensusRepository,
    private decisionRepo: RecoveryCaseReviewerDecisionDraftRepository,
    private auditRepo: RecoveryCaseAdjudicationAuditRepository,
  ) {}

  async evaluateReviewerConsensus(
    schoolId: string,
    queueItemId: string,
    primaryDecisionId: string,
    secondaryDecisionId: string,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseConsensusEvaluation>> {
    const primary = await this.decisionRepo.getById(primaryDecisionId);
    if (!primary) {
      return { success: false, status: 'not_found', message: 'Primary decision not found', errorCode: 'NOT_FOUND' };
    }

    const secondary = await this.decisionRepo.getById(secondaryDecisionId);
    if (!secondary) {
      return { success: false, status: 'not_found', message: 'Secondary decision not found', errorCode: 'NOT_FOUND' };
    }

    if (primary.schoolId !== schoolId || secondary.schoolId !== schoolId) {
      return { success: false, status: 'error', message: 'Both decisions must belong to the same school', errorCode: 'SCHOOL_MISMATCH' };
    }

    if (primary.queueItemId !== queueItemId || secondary.queueItemId !== queueItemId) {
      return { success: false, status: 'error', message: 'Both decisions must belong to the same queue item', errorCode: 'QUEUE_ITEM_MISMATCH' };
    }

    if (primary.reviewerActorId === secondary.reviewerActorId) {
      return { success: false, status: 'error', message: 'Reviewers must be distinct actors', errorCode: 'DUPLICATE_REVIEWER' };
    }

    if (BLOCKED_OR_VOID_STATUSES.includes(primary.decisionStatus)) {
      return { success: false, status: 'error', message: 'Primary decision is blocked or void', errorCode: 'PRIMARY_DECISION_INVALID' };
    }

    if (BLOCKED_OR_VOID_STATUSES.includes(secondary.decisionStatus)) {
      return { success: false, status: 'error', message: 'Secondary decision is blocked or void', errorCode: 'SECONDARY_DECISION_INVALID' };
    }

    const matchingFields: string[] = [];
    const differingFields: string[] = [];

    const decisionCodeMatch = primary.decisionCode === secondary.decisionCode;
    const priorityBandMatch = primary.recommendedPriorityBand === secondary.recommendedPriorityBand;

    if (decisionCodeMatch) {
      matchingFields.push('decisionCode');
    } else {
      differingFields.push('decisionCode');
    }

    if (priorityBandMatch) {
      matchingFields.push('recommendedPriorityBand');
    } else {
      differingFields.push('recommendedPriorityBand');
    }

    let consensusStatus: string;
    let safeEvaluationSummary: string;
    const reasonCodes: string[] = [];

    if (decisionCodeMatch && priorityBandMatch) {
      consensusStatus = 'consensus_reached';
      safeEvaluationSummary = 'Both reviewers agree on decision code and priority band';
    } else if (decisionCodeMatch && !priorityBandMatch) {
      consensusStatus = 'partial_consensus';
      safeEvaluationSummary = 'Reviewers agree on decision code but differ on priority band';
      reasonCodes.push('priority_band_mismatch');
    } else {
      consensusStatus = 'disagreement';
      safeEvaluationSummary = 'Reviewers have different decision codes';
      reasonCodes.push('decision_code_mismatch');
    }

    return {
      success: true,
      status: 'ok',
      data: {
        canReachConsensus: consensusStatus === 'consensus_reached',
        consensusStatus,
        safeEvaluationSummary,
        matchingFields,
        differingFields,
        reasonCodes,
      },
    };
  }

  async createConsensusRecord(
    ctx: RecoveryCaseAdjudicationCommandContext,
    input: CreateConsensusInput,
  ): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    if (!isRoleAllowedForMutation(ctx.actorRole)) {
      return { success: false, status: 'error', message: 'Role not allowed for mutation', errorCode: 'FORBIDDEN_ROLE', correlationId: ctx.correlationId };
    }

    const consensus = await this.consensusRepo.create({
      ...input,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
    });

    await this.auditRepo.create({
      schoolId: ctx.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensus.consensusId,
      action: 'create_consensus_record',
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      correlationId: ctx.correlationId,
      safeMetadata: { sourceRefs: ctx.sourceRefsJson, primaryDecisionId: input.primaryDecisionId, secondaryDecisionId: input.secondaryDecisionId },
    });

    return { success: true, status: 'ok', data: consensus, correlationId: ctx.correlationId };
  }

  async getConsensusRecord(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.getById(consensusId);
    if (!consensus) {
      return { success: false, status: 'not_found', message: 'Consensus record not found', errorCode: 'NOT_FOUND' };
    }
    return { success: true, status: 'ok', data: consensus };
  }

  async listConsensusRecordsForSchool(schoolId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus[]>> {
    const items = await this.consensusRepo.listBySchool(schoolId);
    return { success: true, status: 'ok', data: items };
  }

  async listConsensusRecordsForQueueItem(schoolId: string, queueItemId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus[]>> {
    const items = await this.consensusRepo.listByQueueItemId(schoolId, queueItemId);
    return { success: true, status: 'ok', data: items };
  }

  async listConsensusRecordsByStatus(schoolId: string, status: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus[]>> {
    const items = await this.consensusRepo.listByStatus(schoolId, status);
    return { success: true, status: 'ok', data: items };
  }

  async markConsensusReached(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.updateStatus(consensusId, 'consensus_reached');
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'mark_consensus_reached',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }

  async markPartialConsensus(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.updateStatus(consensusId, 'partial_consensus');
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'mark_partial_consensus',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }

  async markDisagreement(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.updateStatus(consensusId, 'disagreement');
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'mark_disagreement',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }

  async markConsensusNeedsMoreEvidence(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.updateStatus(consensusId, 'needs_more_evidence');
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'mark_consensus_needs_more_evidence',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }

  async blockConsensus(consensusId: string, reasonCodes: string[]): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.updateStatus(consensusId, 'blocked', reasonCodes);
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'block_consensus',
      actorId: '',
      actorRole: '',
      safeMetadata: { reasonCodes, previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }

  async voidConsensus(consensusId: string): Promise<RecoveryCaseAdjudicationSafeEnvelope<RecoveryCaseReviewerConsensus>> {
    const consensus = await this.consensusRepo.void(consensusId);
    await this.auditRepo.create({
      schoolId: consensus.schoolId,
      entityType: 'reviewer_consensus',
      entityId: consensusId,
      action: 'void_consensus',
      actorId: '',
      actorRole: '',
      safeMetadata: { previousStatus: consensus.consensusStatus },
    });
    return { success: true, status: 'ok', data: consensus };
  }
}
