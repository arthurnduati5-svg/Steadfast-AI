import {
  RecoveryProgressObservation, RecoveryCheckpointEvaluation, RecoveryOutcomeEvidence,
  RecoveryPlanAdjustmentDraft, RecoveryTeacherReviewDecision,
  RecoveryStudentProgressReflectionDraft, RecoveryParentProgressNoteDraft,
  RecoveryEvidenceRollup, RecoveryProgressSummary, RecoveryProgressAuditEvent,
  RecoveryProgressIdempotencyEntry,
} from '../contracts/recoveryProgressContracts';
import {
  RecoveryProgressObservationRepository, RecoveryCheckpointEvaluationRepository,
  RecoveryOutcomeEvidenceRepository, RecoveryPlanAdjustmentDraftRepository,
  RecoveryTeacherReviewDecisionRepository, RecoveryStudentProgressReflectionDraftRepository,
  RecoveryParentProgressNoteDraftRepository, RecoveryEvidenceRollupRepository,
  RecoveryProgressSummaryRepository, RecoveryProgressAuditRepository,
  RecoveryProgressIdempotencyRepository,
} from '../contracts/recoveryProgressRepositoryContracts';

export class InMemoryRecoveryProgressObservationRepository implements RecoveryProgressObservationRepository {
  private store = new Map<string, RecoveryProgressObservation>();

  async create(data: RecoveryProgressObservation): Promise<RecoveryProgressObservation> {
    this.store.set(data.recoveryProgressObservationId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryProgressObservation | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryCheckpointId === checkpointId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.observationStatus === status);
  }
  async listByType(schoolId: string, type: string): Promise<RecoveryProgressObservation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.observationType === type);
  }
  async update(id: string, data: Partial<RecoveryProgressObservation>): Promise<RecoveryProgressObservation> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Observation ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressObservation> {
    return this.update(id, { observationStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryCheckpointEvaluationRepository implements RecoveryCheckpointEvaluationRepository {
  private store = new Map<string, RecoveryCheckpointEvaluation>();

  async create(data: RecoveryCheckpointEvaluation): Promise<RecoveryCheckpointEvaluation> {
    this.store.set(data.recoveryCheckpointEvaluationId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryCheckpointEvaluation | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByCheckpointId(schoolId: string, checkpointId: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryCheckpointId === checkpointId);
  }
  async listByObservationId(observationId: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressObservationId === observationId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.evaluationStatus === status);
  }
  async listByResult(schoolId: string, result: string): Promise<RecoveryCheckpointEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.evaluationResult === result);
  }
  async update(id: string, data: Partial<RecoveryCheckpointEvaluation>): Promise<RecoveryCheckpointEvaluation> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Evaluation ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryCheckpointEvaluation> {
    return this.update(id, { evaluationStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryOutcomeEvidenceRepository implements RecoveryOutcomeEvidenceRepository {
  private store = new Map<string, RecoveryOutcomeEvidence>();

  async create(data: RecoveryOutcomeEvidence): Promise<RecoveryOutcomeEvidence> {
    this.store.set(data.recoveryOutcomeEvidenceId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryOutcomeEvidence | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeEvidence[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByObjectiveId(schoolId: string, objectiveId: string): Promise<RecoveryOutcomeEvidence[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryObjectiveId === objectiveId);
  }
  async listByObservationId(observationId: string): Promise<RecoveryOutcomeEvidence[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressObservationId === observationId);
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryOutcomeEvidence[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryCheckpointEvaluationId === evaluationId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeEvidence[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async update(id: string, data: Partial<RecoveryOutcomeEvidence>): Promise<RecoveryOutcomeEvidence> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Evidence ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeEvidence> {
    return this.update(id, { evidenceStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryPlanAdjustmentDraftRepository implements RecoveryPlanAdjustmentDraftRepository {
  private store = new Map<string, RecoveryPlanAdjustmentDraft>();

  async create(data: RecoveryPlanAdjustmentDraft): Promise<RecoveryPlanAdjustmentDraft> {
    this.store.set(data.recoveryPlanAdjustmentDraftId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryPlanAdjustmentDraft | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByObservationId(observationId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressObservationId === observationId);
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryCheckpointEvaluationId === evaluationId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPlanAdjustmentDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async update(id: string, data: Partial<RecoveryPlanAdjustmentDraft>): Promise<RecoveryPlanAdjustmentDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Adjustment draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPlanAdjustmentDraft> {
    return this.update(id, { adjustmentStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryTeacherReviewDecisionRepository implements RecoveryTeacherReviewDecisionRepository {
  private store = new Map<string, RecoveryTeacherReviewDecision>();

  async create(data: RecoveryTeacherReviewDecision): Promise<RecoveryTeacherReviewDecision> {
    this.store.set(data.recoveryTeacherReviewDecisionId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryTeacherReviewDecision | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryTeacherReviewDecision[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryTeacherReviewDecision[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }
  async listByAdjustmentDraftId(adjustmentDraftId: string): Promise<RecoveryTeacherReviewDecision[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryPlanAdjustmentDraftId === adjustmentDraftId);
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryTeacherReviewDecision[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryCheckpointEvaluationId === evaluationId);
  }
  async update(id: string, data: Partial<RecoveryTeacherReviewDecision>): Promise<RecoveryTeacherReviewDecision> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Teacher decision ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryTeacherReviewDecision> {
    return this.update(id, { decisionStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryStudentProgressReflectionDraftRepository implements RecoveryStudentProgressReflectionDraftRepository {
  private store = new Map<string, RecoveryStudentProgressReflectionDraft>();

  async create(data: RecoveryStudentProgressReflectionDraft): Promise<RecoveryStudentProgressReflectionDraft> {
    this.store.set(data.recoveryStudentProgressReflectionDraftId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryStudentProgressReflectionDraft | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByObservationId(observationId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressObservationId === observationId);
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryStudentProgressReflectionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryCheckpointEvaluationId === evaluationId);
  }
  async update(id: string, data: Partial<RecoveryStudentProgressReflectionDraft>): Promise<RecoveryStudentProgressReflectionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Reflection draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryStudentProgressReflectionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryParentProgressNoteDraftRepository implements RecoveryParentProgressNoteDraftRepository {
  private store = new Map<string, RecoveryParentProgressNoteDraft>();

  async create(data: RecoveryParentProgressNoteDraft): Promise<RecoveryParentProgressNoteDraft> {
    this.store.set(data.recoveryParentProgressNoteDraftId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryParentProgressNoteDraft | null> {
    return this.store.get(id) || null;
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByObservationId(observationId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressObservationId === observationId);
  }
  async listByEvaluationId(evaluationId: string): Promise<RecoveryParentProgressNoteDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryCheckpointEvaluationId === evaluationId);
  }
  async update(id: string, data: Partial<RecoveryParentProgressNoteDraft>): Promise<RecoveryParentProgressNoteDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Parent note ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryParentProgressNoteDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryEvidenceRollupRepository implements RecoveryEvidenceRollupRepository {
  private store = new Map<string, RecoveryEvidenceRollup>();

  async create(data: RecoveryEvidenceRollup): Promise<RecoveryEvidenceRollup> {
    this.store.set(data.recoveryEvidenceRollupId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryEvidenceRollup | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryEvidenceRollup[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryEvidenceRollup[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryEvidenceRollup[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByScope(schoolId: string, scope: string): Promise<RecoveryEvidenceRollup[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.rollupScope === scope);
  }
  async update(id: string, data: Partial<RecoveryEvidenceRollup>): Promise<RecoveryEvidenceRollup> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Rollup ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryEvidenceRollup> {
    return this.update(id, { rollupStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryProgressSummaryRepository implements RecoveryProgressSummaryRepository {
  private store = new Map<string, RecoveryProgressSummary>();

  async create(data: RecoveryProgressSummary): Promise<RecoveryProgressSummary> {
    this.store.set(data.recoveryProgressSummaryId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryProgressSummary | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryProgressSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryProgressSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryProgressSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByScope(schoolId: string, scope: string): Promise<RecoveryProgressSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.summaryScope === scope);
  }
  async update(id: string, data: Partial<RecoveryProgressSummary>): Promise<RecoveryProgressSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Summary ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryProgressSummary> {
    return this.update(id, { summaryStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryProgressAuditRepository implements RecoveryProgressAuditRepository {
  private store = new Map<string, RecoveryProgressAuditEvent>();

  async create(data: RecoveryProgressAuditEvent): Promise<RecoveryProgressAuditEvent> {
    this.store.set(data.recoveryProgressAuditId, { ...data });
    return data;
  }
  async listBySchool(schoolId: string): Promise<RecoveryProgressAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
}

export class InMemoryRecoveryProgressIdempotencyRepository implements RecoveryProgressIdempotencyRepository {
  private store = new Map<string, RecoveryProgressIdempotencyEntry>();

  async create(data: RecoveryProgressIdempotencyEntry): Promise<RecoveryProgressIdempotencyEntry> {
    this.store.set(data.recoveryProgressIdempotencyId, { ...data });
    return data;
  }
  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryProgressIdempotencyEntry | null> {
    return Array.from(this.store.values()).find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) || null;
  }
  async updateStatus(id: string, status: string, resourceId?: string, resultSummary?: string): Promise<RecoveryProgressIdempotencyEntry> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Idempotency record ${id} not found`);
    const updated = { ...existing, status, resourceId: resourceId || existing.resourceId, safeResultSummary: resultSummary || existing.safeResultSummary, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async expire(recoveryProgressIdempotencyId: string): Promise<RecoveryProgressIdempotencyEntry> {
    const existing = this.store.get(recoveryProgressIdempotencyId);
    if (!existing) throw new Error(`Idempotency record ${recoveryProgressIdempotencyId} not found`);
    const updated = { ...existing, status: 'expired', updatedAt: new Date().toISOString(), expiresAt: new Date().toISOString() };
    this.store.set(recoveryProgressIdempotencyId, updated);
    return updated;
  }
}
