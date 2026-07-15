import {
  RecoveryOutcomeDecisionReadiness,
  RecoveryOutcomeDecisionReadinessCreateRequest,
} from '../contracts/recoveryOutcomeDecisionReadinessContracts';
import {
  RecoveryExitCriteria,
  RecoveryExitCriteriaCreateRequest,
} from '../contracts/recoveryExitCriteriaContracts';
import {
  RecoveryContinuationDecisionDraft,
  RecoveryIntensificationDecisionDraft,
  RecoveryPauseDecisionDraft,
  RecoveryClosureDecisionDraft,
  DecisionDraftCreateRequest,
} from '../contracts/recoveryDecisionDraftContracts';
import {
  RecoveryOutcomeTeacherReviewPacket,
  RecoveryOutcomeTeacherReviewPacketCreateRequest,
} from '../contracts/recoveryOutcomeTeacherReviewPacketContracts';
import {
  RecoveryOutcomeStudentNextStepDraft,
  RecoveryOutcomeStudentNextStepDraftCreateRequest,
} from '../contracts/recoveryOutcomeStudentNextStepDraftContracts';
import {
  RecoveryOutcomeParentUpdateDraft,
  RecoveryOutcomeParentUpdateDraftCreateRequest,
} from '../contracts/recoveryOutcomeParentUpdateDraftContracts';
import {
  RecoveryOutcomeDecisionSummary,
  RecoveryOutcomeDecisionSummaryCreateRequest,
} from '../contracts/recoveryOutcomeSummaryContracts';
import {
  RecoveryOutcomeDecisionStatus,
  RecoveryClosureType,
  RecoveryOutcomeAuditEvent,
  RecoveryOutcomeIdempotencyEntry,
} from '../contracts/recoveryOutcomeContracts';
import {
  RecoveryOutcomeDecisionReadinessRepository,
  RecoveryExitCriteriaRepository,
  RecoveryContinuationDecisionDraftRepository,
  RecoveryIntensificationDecisionDraftRepository,
  RecoveryPauseDecisionDraftRepository,
  RecoveryClosureDecisionDraftRepository,
  RecoveryOutcomeTeacherReviewPacketRepository,
  RecoveryOutcomeStudentNextStepDraftRepository,
  RecoveryOutcomeParentUpdateDraftRepository,
  RecoveryOutcomeDecisionSummaryRepository,
  RecoveryOutcomeAuditRepository,
  RecoveryOutcomeIdempotencyRepository,
} from '../contracts/recoveryOutcomeRepositoryContracts';

export interface RecoveryExitCriteriaEvaluation {
  recoveryExitCriteriaEvaluationId: string;
  schoolId: string;
  studentRef: string;
  resultRecoveryPlanId: string;
  recoveryExitCriteriaId: string;
  evaluationStatus: string;
  evaluationResult: string;
  safeEvaluationSummary: string;
  evidenceRefsJson: Record<string, unknown>;
  blockedReasonCodesJson: string[];
  sourceRefsJson: Record<string, unknown>;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt?: string;
  approvedForFutureUseAt?: string;
  suppressedAt?: string;
  blockedAt?: string;
  voidedAt?: string;
}

export interface RecoveryExitCriteriaEvaluationRepository {
  create(data: RecoveryExitCriteriaEvaluation): Promise<RecoveryExitCriteriaEvaluation>;
  getById(id: string): Promise<RecoveryExitCriteriaEvaluation | null>;
  listBySchool(schoolId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByCriteriaId(criteriaId: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  listByResult(schoolId: string, result: string): Promise<RecoveryExitCriteriaEvaluation[]>;
  update(id: string, data: Partial<RecoveryExitCriteriaEvaluation>): Promise<RecoveryExitCriteriaEvaluation>;
  updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteriaEvaluation>;
}

export class InMemoryRecoveryOutcomeDecisionReadinessRepository implements RecoveryOutcomeDecisionReadinessRepository {
  private store = new Map<string, RecoveryOutcomeDecisionReadiness>();

  async create(data: RecoveryOutcomeDecisionReadinessCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionReadiness> {
    const id = `rodr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryOutcomeDecisionReadiness = {
      ...data,
      recoveryOutcomeDecisionReadinessId: id,
      readinessStatus: 'draft',
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryOutcomeDecisionReadiness | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionReadiness[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.readinessStatus === status);
  }
  async update(id: string, data: Partial<RecoveryOutcomeDecisionReadiness>): Promise<RecoveryOutcomeDecisionReadiness> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Decision readiness ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionReadiness> {
    return this.update(id, { readinessStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryExitCriteriaRepository implements RecoveryExitCriteriaRepository {
  private store = new Map<string, RecoveryExitCriteria>();

  async create(data: RecoveryExitCriteriaCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryExitCriteria> {
    const id = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryExitCriteria = {
      ...data,
      recoveryExitCriteriaId: id,
      criteriaStatus: 'draft',
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryExitCriteria | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryExitCriteria[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteria[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteria[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.criteriaStatus === status);
  }
  async listByDecisionType(schoolId: string, type: string): Promise<RecoveryExitCriteria[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.criteriaType === type);
  }
  async update(id: string, data: Partial<RecoveryExitCriteria>): Promise<RecoveryExitCriteria> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Exit criteria ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteria> {
    return this.update(id, { criteriaStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryExitCriteriaEvaluationRepository implements RecoveryExitCriteriaEvaluationRepository {
  private store = new Map<string, RecoveryExitCriteriaEvaluation>();

  async create(data: RecoveryExitCriteriaEvaluation): Promise<RecoveryExitCriteriaEvaluation> {
    this.store.set(data.recoveryExitCriteriaEvaluationId, { ...data });
    return data;
  }
  async getById(id: string): Promise<RecoveryExitCriteriaEvaluation | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByCriteriaId(criteriaId: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryExitCriteriaId === criteriaId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.evaluationStatus === status);
  }
  async listByResult(schoolId: string, result: string): Promise<RecoveryExitCriteriaEvaluation[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.evaluationResult === result);
  }
  async update(id: string, data: Partial<RecoveryExitCriteriaEvaluation>): Promise<RecoveryExitCriteriaEvaluation> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Exit criteria evaluation ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryExitCriteriaEvaluation> {
    return this.update(id, { evaluationStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryContinuationDecisionDraftRepository implements RecoveryContinuationDecisionDraftRepository {
  private store = new Map<string, RecoveryContinuationDecisionDraft>();

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryContinuationDecisionDraft> {
    const id = `rcdd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryContinuationDecisionDraft = {
      ...data,
      recoveryContinuationDecisionDraftId: id,
      draftStatus: (data.draftStatus || 'draft') as RecoveryOutcomeDecisionStatus,
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryContinuationDecisionDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryContinuationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async update(id: string, data: Partial<RecoveryContinuationDecisionDraft>): Promise<RecoveryContinuationDecisionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Continuation draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryContinuationDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryIntensificationDecisionDraftRepository implements RecoveryIntensificationDecisionDraftRepository {
  private store = new Map<string, RecoveryIntensificationDecisionDraft>();

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryIntensificationDecisionDraft> {
    const id = `ridd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryIntensificationDecisionDraft = {
      ...data,
      recoveryIntensificationDecisionDraftId: id,
      draftStatus: (data.draftStatus || 'draft') as RecoveryOutcomeDecisionStatus,
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryIntensificationDecisionDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryIntensificationDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async update(id: string, data: Partial<RecoveryIntensificationDecisionDraft>): Promise<RecoveryIntensificationDecisionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Intensification draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryIntensificationDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryPauseDecisionDraftRepository implements RecoveryPauseDecisionDraftRepository {
  private store = new Map<string, RecoveryPauseDecisionDraft>();

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryPauseDecisionDraft> {
    const id = `rpdd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryPauseDecisionDraft = {
      ...data,
      recoveryPauseDecisionDraftId: id,
      draftStatus: (data.draftStatus || 'draft') as RecoveryOutcomeDecisionStatus,
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryPauseDecisionDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryPauseDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async update(id: string, data: Partial<RecoveryPauseDecisionDraft>): Promise<RecoveryPauseDecisionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Pause draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryPauseDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryClosureDecisionDraftRepository implements RecoveryClosureDecisionDraftRepository {
  private store = new Map<string, RecoveryClosureDecisionDraft>();

  async create(data: DecisionDraftCreateRequest & { createdByActorId: string; createdByRole: string; draftStatus?: string }): Promise<RecoveryClosureDecisionDraft> {
    const id = `rcdd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryClosureDecisionDraft = {
      ...data,
      recoveryClosureDecisionDraftId: id,
      draftStatus: (data.draftStatus || 'draft') as RecoveryOutcomeDecisionStatus,
      closureType: (data.closureType || 'graduation') as RecoveryClosureType,
      futureReviewRefsJson: {},
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryClosureDecisionDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async listByClosureType(schoolId: string, closureType: string): Promise<RecoveryClosureDecisionDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.closureType === closureType);
  }
  async update(id: string, data: Partial<RecoveryClosureDecisionDraft>): Promise<RecoveryClosureDecisionDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Closure draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryClosureDecisionDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryOutcomeTeacherReviewPacketRepository implements RecoveryOutcomeTeacherReviewPacketRepository {
  private store = new Map<string, RecoveryOutcomeTeacherReviewPacket>();

  async create(data: RecoveryOutcomeTeacherReviewPacketCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeTeacherReviewPacket> {
    const id = `rotrp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryOutcomeTeacherReviewPacket = {
      ...data,
      recoveryOutcomeTeacherReviewPacketId: id,
      packetStatus: 'draft',
      reviewNotesJson: {},
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryOutcomeTeacherReviewPacket | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeTeacherReviewPacket[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.packetStatus === status);
  }
  async update(id: string, data: Partial<RecoveryOutcomeTeacherReviewPacket>): Promise<RecoveryOutcomeTeacherReviewPacket> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Teacher review packet ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeTeacherReviewPacket> {
    return this.update(id, { packetStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryOutcomeStudentNextStepDraftRepository implements RecoveryOutcomeStudentNextStepDraftRepository {
  private store = new Map<string, RecoveryOutcomeStudentNextStepDraft>();

  async create(data: RecoveryOutcomeStudentNextStepDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeStudentNextStepDraft> {
    const id = `rosnsd-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryOutcomeStudentNextStepDraft = {
      ...data,
      recoveryOutcomeStudentNextStepDraftId: id,
      draftStatus: 'draft',
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryOutcomeStudentNextStepDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeStudentNextStepDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async update(id: string, data: Partial<RecoveryOutcomeStudentNextStepDraft>): Promise<RecoveryOutcomeStudentNextStepDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Student next step draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeStudentNextStepDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryOutcomeParentUpdateDraftRepository implements RecoveryOutcomeParentUpdateDraftRepository {
  private store = new Map<string, RecoveryOutcomeParentUpdateDraft>();

  async create(data: RecoveryOutcomeParentUpdateDraftCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeParentUpdateDraft> {
    const id = `ropud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryOutcomeParentUpdateDraft = {
      ...data,
      recoveryOutcomeParentUpdateDraftId: id,
      draftStatus: 'draft',
      blockedFieldNamesJson: [],
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryOutcomeParentUpdateDraft | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByParentRef(schoolId: string, parentRef: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.parentRef === parentRef);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeParentUpdateDraft[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.draftStatus === status);
  }
  async update(id: string, data: Partial<RecoveryOutcomeParentUpdateDraft>): Promise<RecoveryOutcomeParentUpdateDraft> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Parent update draft ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeParentUpdateDraft> {
    return this.update(id, { draftStatus: status as any, updatedAt: timestamp } as any);
  }
}

export class InMemoryRecoveryOutcomeDecisionSummaryRepository implements RecoveryOutcomeDecisionSummaryRepository {
  private store = new Map<string, RecoveryOutcomeDecisionSummary>();

  async create(data: RecoveryOutcomeDecisionSummaryCreateRequest & { createdByActorId: string; createdByRole: string }): Promise<RecoveryOutcomeDecisionSummary> {
    const id = `rods-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    const record: RecoveryOutcomeDecisionSummary = {
      ...data,
      recoveryOutcomeDecisionSummaryId: id,
      summaryStatus: 'active',
      nextActionRefsJson: {},
      blockedReasonCodesJson: [],
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(id, record);
    return record;
  }
  async getById(id: string): Promise<RecoveryOutcomeDecisionSummary | null> {
    return this.store.get(id) || null;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
  async listByStudentRef(schoolId: string, studentRef: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.studentRef === studentRef);
  }
  async listByTeacherRef(schoolId: string, teacherRef: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.teacherRef === teacherRef);
  }
  async listByPlanId(schoolId: string, planId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.resultRecoveryPlanId === planId);
  }
  async listByProgressSummaryId(progressSummaryId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryProgressSummaryId === progressSummaryId);
  }
  async listByEvidenceRollupId(evidenceRollupId: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.recoveryEvidenceRollupId === evidenceRollupId);
  }
  async listByStatus(schoolId: string, status: string): Promise<RecoveryOutcomeDecisionSummary[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId && r.summaryStatus === status);
  }
  async update(id: string, data: Partial<RecoveryOutcomeDecisionSummary>): Promise<RecoveryOutcomeDecisionSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Decision summary ${id} not found`);
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async updateStatus(id: string, status: string, timestamp: string): Promise<RecoveryOutcomeDecisionSummary> {
    return this.update(id, { summaryStatus: status as any, updatedAt: timestamp } as any);
  }
  async refresh(id: string): Promise<RecoveryOutcomeDecisionSummary> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Decision summary ${id} not found`);
    const updated = { ...existing, refreshedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
}

export class InMemoryRecoveryOutcomeAuditRepository implements RecoveryOutcomeAuditRepository {
  private store = new Map<string, RecoveryOutcomeAuditEvent>();

  async create(data: RecoveryOutcomeAuditEvent): Promise<RecoveryOutcomeAuditEvent> {
    this.store.set(data.recoveryOutcomeAuditId, { ...data });
    return data;
  }
  async listBySchool(schoolId: string): Promise<RecoveryOutcomeAuditEvent[]> {
    return Array.from(this.store.values()).filter(r => r.schoolId === schoolId);
  }
}

export class InMemoryRecoveryOutcomeIdempotencyRepository implements RecoveryOutcomeIdempotencyRepository {
  private store = new Map<string, RecoveryOutcomeIdempotencyEntry>();

  async create(data: RecoveryOutcomeIdempotencyEntry): Promise<RecoveryOutcomeIdempotencyEntry> {
    this.store.set(data.recoveryOutcomeIdempotencyId, { ...data });
    return data;
  }
  async getByKey(schoolId: string, operation: string, idempotencyKey: string): Promise<RecoveryOutcomeIdempotencyEntry | null> {
    return Array.from(this.store.values()).find(r => r.schoolId === schoolId && r.operation === operation && r.idempotencyKey === idempotencyKey) || null;
  }
  async updateStatus(id: string, status: string, safeResultSummary?: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    const existing = this.store.get(id);
    if (!existing) throw new Error(`Idempotency record ${id} not found`);
    const updated = { ...existing, status, safeResultSummary: safeResultSummary !== undefined ? safeResultSummary : existing.safeResultSummary, updatedAt: new Date().toISOString() };
    this.store.set(id, updated);
    return updated;
  }
  async expire(recoveryOutcomeIdempotencyId: string): Promise<RecoveryOutcomeIdempotencyEntry> {
    const existing = this.store.get(recoveryOutcomeIdempotencyId);
    if (!existing) throw new Error(`Idempotency record ${recoveryOutcomeIdempotencyId} not found`);
    const updated = { ...existing, status: 'expired', updatedAt: new Date().toISOString(), expiresAt: new Date().toISOString() };
    this.store.set(recoveryOutcomeIdempotencyId, updated);
    return updated;
  }
}
