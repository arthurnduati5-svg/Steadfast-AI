import { v4 as uuid } from 'uuid';
import { RecoveryCaseTriageCommandContext, RecoveryCaseTriageSafeEnvelope, RecoveryCasePriorityAssessmentStatus, RecoveryCasePriorityBand, SCORING_POLICY_VERSION } from '../contracts/recoveryCaseTriageContracts';
import { RecoveryCasePriorityAssessment, RecoveryCasePriorityFactor, CreatePriorityAssessmentRequest, RecoveryCasePriorityInput } from '../contracts/recoveryCasePriorityContracts';
import { RecoveryCasePriorityAssessmentRepository, RecoveryCasePriorityFactorRepository } from '../contracts/recoveryCaseTriageRepositoryContracts';
import { checkPolicy } from '../policies/recoveryCaseTriagePolicyDefinitions';
import { RecoveryCasePriorityEngineService } from './recoveryCasePriorityEngineService';
import { RecoveryCaseFairnessService } from './recoveryCaseFairnessService';
import { RecoveryCaseTriageAuditBridge } from './recoveryCaseTriageAuditBridge';
import { RecoveryCaseTriageIdempotencyService } from './recoveryCaseTriageIdempotencyService';

export class RecoveryCasePriorityAssessmentService {
  constructor(
    private assessmentRepo: RecoveryCasePriorityAssessmentRepository,
    private factorRepo: RecoveryCasePriorityFactorRepository,
    private engine: RecoveryCasePriorityEngineService,
    private fairness: RecoveryCaseFairnessService,
    private audit: RecoveryCaseTriageAuditBridge,
    private idempotency: RecoveryCaseTriageIdempotencyService,
  ) {}

  async createPriorityAssessment(ctx: RecoveryCaseTriageCommandContext, schoolId: string, body: CreatePriorityAssessmentRequest): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const now = new Date().toISOString();
      const record = {
        priorityAssessmentId: uuid(),
        schoolId: ctx.schoolId,
        studentRef: body.studentRef,
        resultRecoveryPlanId: body.resultRecoveryPlanId,
        boardSnapshotId: body.boardSnapshotId,
        boardCardId: body.boardCardId,
        triageReadinessId: body.triageReadinessId,
        priorityStatus: 'draft',
        totalScore: 0,
        priorityBand: 'deferred',
        riskRank: 'none',
        scoringPolicyVersion: body.scoringPolicyVersion ?? SCORING_POLICY_VERSION,
        priorityFactorsJson: {},
        safeAssessmentSummary: body.safeAssessmentSummary ?? '',
        decision: 'pending',
        blockedReasonCodesJson: [],
        sourceRefsJson: body.sourceRefsJson ?? {},
        createdByActorId: ctx.actorId,
        createdByRole: ctx.actorRole,
        createdAt: now,
        updatedAt: now,
      };
      const created = await this.assessmentRepo.create(record);
      return { success: true, data: created, status: 'created', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async scorePriorityAssessment(
    ctx: RecoveryCaseTriageCommandContext,
    schoolId: string,
    assessmentId: string,
    input: RecoveryCasePriorityInput,
  ): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };

      const existing = await this.assessmentRepo.getById(assessmentId);
      if (!existing) return { success: false, status: 'NOT_FOUND', message: 'Priority assessment not found', correlationId: ctx.correlationId };
      if (existing.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch on assessment', correlationId: ctx.correlationId };

      const blockedRefs = this.engine.validateRequiredReferences(schoolId, existing.boardSnapshotId, existing.boardCardId, existing.resultRecoveryPlanId);
      if (blockedRefs.length > 0) {
        return { success: false, status: 'DENIED', message: `Missing references: ${blockedRefs.join(', ')}`, correlationId: ctx.correlationId };
      }

      const fairnessResult = await this.fairness.evaluateFairnessCheck(ctx, schoolId, { priorityAssessmentId: assessmentId, fairnessChecksJson: { inputRiskLevel: input.riskLevel, inputFactors: this.engine.buildPriorityFactors(input).map(f => f.code) } } as any);
      if (!fairnessResult.success) {
        return { success: false, status: 'DENIED', message: `Fairness check blocked: ${fairnessResult.message}`, correlationId: ctx.correlationId };
      }

      const factors = this.engine.buildPriorityFactors(input);
      const totalScore = this.engine.calculatePriorityScore(input);
      const band = this.engine.determinePriorityBand(totalScore);
      const riskRank = this.engine.calculateRiskRank(input.riskLevel);

      const now = new Date().toISOString();
      const persistedFactors: RecoveryCasePriorityFactor[] = [];
      for (const f of factors) {
        const factorRecord = {
          priorityFactorId: uuid(),
          priorityAssessmentId: assessmentId,
          schoolId: schoolId,
          factorCode: f.code,
          appliedPoints: f.appliedPoints,
          factorWeight: f.appliedPoints,
          factorExplanation: f.explanation,
          factorSourceJson: {},
          createdByActorId: ctx.actorId,
          createdByRole: ctx.actorRole,
          createdAt: now,
        };
        const persisted = await this.factorRepo.create(factorRecord);
        persistedFactors.push(persisted);
      }

      const safeSummary = this.engine.buildSafePriorityExplanation(
        { ...existing, totalScore, priorityBand: band, riskRank, scoringPolicyVersion: existing.scoringPolicyVersion || SCORING_POLICY_VERSION } as RecoveryCasePriorityAssessment,
        persistedFactors,
      );

      const updated = await this.assessmentRepo.update(assessmentId, {
        totalScore,
        priorityBand: band,
        riskRank,
        priorityStatus: 'scored',
        safeAssessmentSummary: safeSummary,
        priorityFactorsJson: { factorCount: persistedFactors.length, factorCodes: factors.map(f => f.code) },
        scoredAt: now,
        updatedAt: now,
      } as any);

      await this.audit.createAuditEvent(ctx, schoolId, {
        entityType: 'priority_assessment',
        entityId: assessmentId,
        action: 'scored',
        actorId: ctx.actorId,
        actorRole: ctx.actorRole,
        safeSummary: `Priority assessment scored ${totalScore} (${band})`,
        reasonCodesJson: null,
        metadataJson: { totalScore, band, riskRank, factorCount: persistedFactors.length },
        correlationId: ctx.correlationId,
      } as any);

      await this.idempotency.completeIdempotencyEntry(ctx.schoolId, ctx.idempotencyKey, `scored:${assessmentId}`);

      return { success: true, data: updated, status: 'scored', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async getPriorityAssessment(schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      const record = await this.assessmentRepo.getById(id);
      if (!record) return { success: false, status: 'NOT_FOUND', message: 'Priority assessment not found' };
      return { success: true, data: record, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPriorityAssessmentsForSchool(schoolId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment[]>> {
    try {
      const records = await this.assessmentRepo.listBySchool(schoolId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPriorityAssessmentsForStudent(schoolId: string, studentRef: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment[]>> {
    try {
      const records = await this.assessmentRepo.listByStudentRef(schoolId, studentRef);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPriorityAssessmentsForPlan(schoolId: string, planId: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment[]>> {
    try {
      const records = await this.assessmentRepo.listByPlanId(schoolId, planId);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPriorityAssessmentsByBand(schoolId: string, band: RecoveryCasePriorityBand | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment[]>> {
    try {
      const records = await this.assessmentRepo.listByBand(schoolId, band);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async listPriorityAssessmentsByStatus(schoolId: string, status: RecoveryCasePriorityAssessmentStatus | string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment[]>> {
    try {
      const records = await this.assessmentRepo.listByStatus(schoolId, status);
      return { success: true, data: records, status: 'found' };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message };
    }
  }

  async markPriorityAssessmentReviewReady(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.assessmentRepo.markReviewReady(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async markPriorityAssessmentStale(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.assessmentRepo.markStale(id);
      return { success: true, data: updated, status: 'updated', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async blockPriorityAssessment(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.assessmentRepo.block(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'blocked', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }

  async voidPriorityAssessment(ctx: RecoveryCaseTriageCommandContext, schoolId: string, id: string, reasonCode: string, safeMessage: string): Promise<RecoveryCaseTriageSafeEnvelope<RecoveryCasePriorityAssessment>> {
    try {
      if (ctx.schoolId !== schoolId) return { success: false, status: 'DENIED', message: 'School ID mismatch', correlationId: ctx.correlationId };
      const decision = checkPolicy('RECOVERY_CASE_PRIORITY_ASSESSMENT_CREATION', ctx.actorRole);
      if (decision.denied) return { success: false, status: 'DENIED', message: `Access denied: ${decision.reasonCodes.join(', ')}`, correlationId: ctx.correlationId };
      const updated = await this.assessmentRepo.void(id, reasonCode, safeMessage);
      return { success: true, data: updated, status: 'voided', correlationId: ctx.correlationId };
    } catch (err: any) {
      return { success: false, status: 'error', message: err.message, correlationId: ctx.correlationId };
    }
  }
}
