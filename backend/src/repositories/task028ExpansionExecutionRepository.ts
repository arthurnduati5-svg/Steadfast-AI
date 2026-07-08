import prisma from '../lib/prisma';

interface InMemoryStore {
  runs: Map<string, any>;
  stages: Map<string, any>;
  participants: Map<string, any>;
  runtimeEvents: Map<string, any>;
  healthSnapshots: Map<string, any>;
  oversightItems: Map<string, any>;
  interventions: Map<string, any>;
  rollbackRecords: Map<string, any>;
  completionReviews: Map<string, any>;
  reports: Map<string, any>;
  auditRecords: Map<string, any>;
}

const mem: InMemoryStore = {
  runs: new Map(),
  stages: new Map(),
  participants: new Map(),
  runtimeEvents: new Map(),
  healthSnapshots: new Map(),
  oversightItems: new Map(),
  interventions: new Map(),
  rollbackRecords: new Map(),
  completionReviews: new Map(),
  reports: new Map(),
  auditRecords: new Map(),
};

function isDBReady(): boolean {
  try {
    if (process.env.NODE_ENV === 'production') return true;
    if (process.env.TASK028_REQUIRE_REAL_PRISMA === '1') return true;
    return !!(process.env.DATABASE_URL || '').trim() && process.env.NODE_ENV !== 'test';
  } catch {
    return false;
  }
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function getTask028PersistenceMode(): { mode: string; durable: boolean; fallbackUsed: boolean } {
  const dbReady = isDBReady();
  return {
    mode: dbReady ? 'prisma' : 'degraded_memory_fallback',
    durable: dbReady,
    fallbackUsed: !dbReady,
  };
}

export const task028ExpansionExecutionRepository = {

  // ── ExpansionExecutionRun ──

  async createExecutionRun(data: {
    expansionProposalId: string;
    pilotProgramId: string;
    schoolId: string;
    status?: string;
    approvedDecisionRef?: string;
    task027ReportRef?: string;
    safeSummary: string;
    stagePlan?: Record<string, unknown>;
    approvedScopeSnapshot?: Record<string, unknown>;
    startedByRole?: string;
    startedByActorIdHash?: string;
    blockingIssues?: string[];
    warnings?: string[];
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('eer');
    const now = new Date();
    const entry = {
      id,
      expansionProposalId: data.expansionProposalId,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      status: data.status ?? 'not_started',
      approvedDecisionRef: data.approvedDecisionRef ?? null,
      task027ReportRef: data.task027ReportRef ?? null,
      safeSummary: data.safeSummary,
      startedAt: null,
      pausedAt: null,
      rolledBackAt: null,
      completedAt: null,
      startedByRole: data.startedByRole ?? null,
      startedByActorIdHash: data.startedByActorIdHash ?? null,
      currentStage: 0,
      stagePlan: data.stagePlan ?? {},
      approvedScopeSnapshot: data.approvedScopeSnapshot ?? {},
      blockingIssues: data.blockingIssues ?? [],
      warnings: data.warnings ?? [],
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionRun.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.runs.set(id, entry);
    return entry;
  },

  async getExecutionRun(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionRun.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.runs.get(id) ?? null;
  },

  async updateExecutionRun(id: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionRun.update({ where: { id }, data: updateData as any }); }
      catch { /* fall through */ }
    }
    const entry = mem.runs.get(id);
    if (entry) Object.assign(entry, updateData);
    return entry ?? null;
  },

  async listExecutionRuns(schoolId?: string, pilotProgramId?: string, status?: string) {
    if (isDBReady()) {
      try {
        const where: any = {};
        if (schoolId) where.schoolId = schoolId;
        if (pilotProgramId) where.pilotProgramId = pilotProgramId;
        if (status) where.status = status;
        return await prisma.expansionExecutionRun.findMany({ where, orderBy: { createdAt: 'desc' } });
      } catch { /* fall through */ }
    }
    let items = Array.from(mem.runs.values());
    if (schoolId) items = items.filter(r => r.schoolId === schoolId);
    if (pilotProgramId) items = items.filter(r => r.pilotProgramId === pilotProgramId);
    if (status) items = items.filter(r => r.status === status);
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── ExpansionExecutionStage ──

  async createExecutionStage(data: {
    executionRunId: string;
    expansionProposalId: string;
    schoolId: string;
    stageNumber: number;
    status?: string;
    plannedStudentCount?: number;
    plannedTeacherCount?: number;
    allowedClassIds?: string[];
    allowedSubjectIds?: string[];
    allowedCurriculumScopes?: string[];
    safeSummary: string;
    blockingIssues?: string[];
    warnings?: string[];
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('ees');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      expansionProposalId: data.expansionProposalId,
      schoolId: data.schoolId,
      stageNumber: data.stageNumber,
      status: data.status ?? 'pending',
      plannedStudentCount: data.plannedStudentCount ?? 0,
      plannedTeacherCount: data.plannedTeacherCount ?? 0,
      activatedStudentCount: 0,
      activatedTeacherCount: 0,
      allowedClassIds: data.allowedClassIds ?? [],
      allowedSubjectIds: data.allowedSubjectIds ?? [],
      allowedCurriculumScopes: data.allowedCurriculumScopes ?? [],
      startedAt: null,
      completedAt: null,
      pausedAt: null,
      safeSummary: data.safeSummary,
      blockingIssues: data.blockingIssues ?? [],
      warnings: data.warnings ?? [],
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionStage.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.stages.set(id, entry);
    return entry;
  },

  async getExecutionStage(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionStage.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.stages.get(id) ?? null;
  },

  async updateExecutionStage(id: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionStage.update({ where: { id }, data: updateData as any }); }
      catch { /* fall through */ }
    }
    const entry = mem.stages.get(id);
    if (entry) Object.assign(entry, updateData);
    return entry ?? null;
  },

  async listStagesByRun(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionExecutionStage.findMany({
          where: { executionRunId },
          orderBy: { stageNumber: 'asc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.stages.values())
      .filter(s => s.executionRunId === executionRunId)
      .sort((a, b) => a.stageNumber - b.stageNumber);
  },

  // ── ExpandedPilotParticipant ──

  async createExpandedParticipant(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    actorIdHash: string;
    role: string;
    classId?: string;
    subjectIds?: string[];
    curriculumScopes?: string[];
    activationStatus?: string;
    activationReasonCodes?: string[];
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('epp');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      actorIdHash: data.actorIdHash,
      role: data.role,
      classId: data.classId ?? null,
      subjectIds: data.subjectIds ?? [],
      curriculumScopes: data.curriculumScopes ?? [],
      activationStatus: data.activationStatus ?? 'pending',
      activationReasonCodes: data.activationReasonCodes ?? [],
      joinedAt: null,
      removedAt: null,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expandedPilotParticipant.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.participants.set(id, entry);
    return entry;
  },

  async getExpandedParticipant(id: string) {
    if (isDBReady()) {
      try { return await prisma.expandedPilotParticipant.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.participants.get(id) ?? null;
  },

  async updateExpandedParticipant(id: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try { return await prisma.expandedPilotParticipant.update({ where: { id }, data: updateData as any }); }
      catch { /* fall through */ }
    }
    const entry = mem.participants.get(id);
    if (entry) Object.assign(entry, updateData);
    return entry ?? null;
  },

  async listExpandedParticipants(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expandedPilotParticipant.findMany({
          where: { executionRunId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.participants.values())
      .filter(p => p.executionRunId === executionRunId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getExpandedParticipantByHash(executionRunId: string, actorIdHash: string) {
    if (isDBReady()) {
      try {
        return await prisma.expandedPilotParticipant.findFirst({
          where: { executionRunId, actorIdHash },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.participants.values())
      .find(p => p.executionRunId === executionRunId && p.actorIdHash === actorIdHash) ?? null;
  },

  async updateParticipantsByRun(executionRunId: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try {
        return await prisma.expandedPilotParticipant.updateMany({
          where: { executionRunId },
          data: updateData as any,
        });
      } catch { /* fall through */ }
    }
    for (const [id, entry] of mem.participants) {
      if (entry.executionRunId === executionRunId) {
        Object.assign(entry, updateData);
      }
    }
    return null;
  },

  // ── ExpansionRuntimeEvent ──

  async createRuntimeEvent(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    actorRole: string;
    actorIdHash?: string;
    eventType: string;
    eventStatus: string;
    safeSummary: string;
    reasonCodes?: string[];
    metadataSafeJson?: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
  }) {
    const id = genId('ere');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      actorRole: data.actorRole,
      actorIdHash: data.actorIdHash ?? null,
      eventType: data.eventType,
      eventStatus: data.eventStatus,
      safeSummary: data.safeSummary,
      reasonCodes: data.reasonCodes ?? [],
      metadataSafeJson: data.metadataSafeJson ?? {},
      requestId: data.requestId ?? null,
      correlationId: data.correlationId ?? null,
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionRuntimeEvent.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.runtimeEvents.set(id, entry);
    return entry;
  },

  // ── ExpansionHealthSnapshot ──

  async createHealthSnapshot(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    activeExpandedSessions: number;
    allowedExpandedSessionStarts: number;
    blockedExpandedSessionStarts: number;
    schoolAuthBlocks: number;
    cohortScopeBlocks: number;
    curriculumGateBlocks: number;
    socraticGateBlocks: number;
    deenGateBlocks: number;
    privacyGateBlocks: number;
    aiCallBlocks: number;
    memoryAccessBlocks: number;
    evidenceWriteBlocks: number;
    feedbackCount: number;
    oversightItemCount: number;
    interventionCount: number;
    incidentBridgeCount: number;
    errorCount: number;
    p95LatencyMs?: number;
    safeSummary: string;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('ehs');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      activeExpandedSessions: data.activeExpandedSessions,
      allowedExpandedSessionStarts: data.allowedExpandedSessionStarts,
      blockedExpandedSessionStarts: data.blockedExpandedSessionStarts,
      schoolAuthBlocks: data.schoolAuthBlocks,
      cohortScopeBlocks: data.cohortScopeBlocks,
      curriculumGateBlocks: data.curriculumGateBlocks,
      socraticGateBlocks: data.socraticGateBlocks,
      deenGateBlocks: data.deenGateBlocks,
      privacyGateBlocks: data.privacyGateBlocks,
      aiCallBlocks: data.aiCallBlocks,
      memoryAccessBlocks: data.memoryAccessBlocks,
      evidenceWriteBlocks: data.evidenceWriteBlocks,
      feedbackCount: data.feedbackCount,
      oversightItemCount: data.oversightItemCount,
      interventionCount: data.interventionCount,
      incidentBridgeCount: data.incidentBridgeCount,
      errorCount: data.errorCount,
      p95LatencyMs: data.p95LatencyMs ?? null,
      safeSummary: data.safeSummary,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionHealthSnapshot.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.healthSnapshots.set(id, entry);
    return entry;
  },

  async listHealthSnapshots(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionHealthSnapshot.findMany({
          where: { executionRunId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.healthSnapshots.values())
      .filter(h => h.executionRunId === executionRunId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── ExpansionOversightItem ──

  async createOversightItem(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    itemType: string;
    severity: string;
    status?: string;
    source: string;
    safeSummary: string;
    reasonCodes?: string[];
    assignedRole?: string;
    requiresTeacherReview: boolean;
    requiresAdminReview: boolean;
    requiresPrivacyReview: boolean;
    requiresDeenReview: boolean;
    requiresSocraticReview: boolean;
    requiresCurriculumReview: boolean;
    requiresPause: boolean;
    requiresRollback: boolean;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('eoi');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      itemType: data.itemType,
      severity: data.severity,
      status: data.status ?? 'open',
      source: data.source,
      safeSummary: data.safeSummary,
      reasonCodes: data.reasonCodes ?? [],
      assignedRole: data.assignedRole ?? null,
      requiresTeacherReview: data.requiresTeacherReview,
      requiresAdminReview: data.requiresAdminReview,
      requiresPrivacyReview: data.requiresPrivacyReview,
      requiresDeenReview: data.requiresDeenReview,
      requiresSocraticReview: data.requiresSocraticReview,
      requiresCurriculumReview: data.requiresCurriculumReview,
      requiresPause: data.requiresPause,
      requiresRollback: data.requiresRollback,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionOversightItem.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.oversightItems.set(id, entry);
    return entry;
  },

  async getOversightItem(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionOversightItem.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.oversightItems.get(id) ?? null;
  },

  async updateOversightItem(id: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try { return await prisma.expansionOversightItem.update({ where: { id }, data: updateData as any }); }
      catch { /* fall through */ }
    }
    const entry = mem.oversightItems.get(id);
    if (entry) Object.assign(entry, updateData);
    return entry ?? null;
  },

  async listOversightItems(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionOversightItem.findMany({
          where: { executionRunId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.oversightItems.values())
      .filter(o => o.executionRunId === executionRunId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── ExpansionInterventionRecord ──

  async createInterventionRecord(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    interventionType: string;
    status?: string;
    actorRole: string;
    actorIdHash?: string;
    safeSummary: string;
    reasonCodes?: string[];
    beforeSnapshot?: Record<string, unknown>;
    afterSnapshot?: Record<string, unknown>;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('eir');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      interventionType: data.interventionType,
      status: data.status ?? 'requested',
      actorRole: data.actorRole,
      actorIdHash: data.actorIdHash ?? null,
      safeSummary: data.safeSummary,
      reasonCodes: data.reasonCodes ?? [],
      beforeSnapshot: data.beforeSnapshot ?? {},
      afterSnapshot: data.afterSnapshot ?? {},
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionInterventionRecord.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.interventions.set(id, entry);
    return entry;
  },

  async updateInterventionRecord(id: string, data: Record<string, unknown>) {
    const now = new Date();
    const updateData = { ...data, updatedAt: now };

    if (isDBReady()) {
      try { return await prisma.expansionInterventionRecord.update({ where: { id }, data: updateData as any }); }
      catch { /* fall through */ }
    }
    const entry = mem.interventions.get(id);
    if (entry) Object.assign(entry, updateData);
    return entry ?? null;
  },

  async listInterventionRecords(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionInterventionRecord.findMany({
          where: { executionRunId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.interventions.values())
      .filter((o: any) => o.executionRunId === executionRunId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── ExpansionRollbackRecord ──

  async createRollbackRecord(data: {
    executionRunId: string;
    stageId?: string;
    pilotProgramId: string;
    schoolId: string;
    rollbackStatus?: string;
    rollbackReason: string;
    safeSummary: string;
    previousScopeSnapshot: Record<string, unknown>;
    restoredScopeSnapshot?: Record<string, unknown>;
    affectedParticipantCount?: number;
    dataDeleted?: boolean;
    auditPreserved?: boolean;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('err');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      rollbackStatus: data.rollbackStatus ?? 'pending',
      rollbackReason: data.rollbackReason,
      safeSummary: data.safeSummary,
      previousScopeSnapshot: data.previousScopeSnapshot,
      restoredScopeSnapshot: data.restoredScopeSnapshot ?? {},
      affectedParticipantCount: data.affectedParticipantCount ?? 0,
      dataDeleted: data.dataDeleted ?? false,
      auditPreserved: data.auditPreserved ?? true,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionRollbackRecord.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.rollbackRecords.set(id, entry);
    return entry;
  },

  async getRollbackRecord(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionRollbackRecord.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.rollbackRecords.get(id) ?? null;
  },

  // ── ExpansionCompletionReview ──

  async createCompletionReview(data: {
    executionRunId: string;
    pilotProgramId: string;
    schoolId: string;
    status?: string;
    safeSummary: string;
    learningQualitySummary?: Record<string, unknown>;
    safetySummary?: Record<string, unknown>;
    privacySummary?: Record<string, unknown>;
    deenSummary?: Record<string, unknown>;
    socraticSummary?: Record<string, unknown>;
    curriculumSummary?: Record<string, unknown>;
    operationsSummary?: Record<string, unknown>;
    teacherAdminSummary?: Record<string, unknown>;
    rollbackSummary?: Record<string, unknown>;
    recommendedDecision?: string;
    safeToStartNextTask?: boolean;
    blockingIssues?: string[];
    knownLimitations?: string[];
    artifactPaths?: string[];
  }) {
    const id = genId('ecr');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      status: data.status ?? 'draft',
      safeSummary: data.safeSummary,
      learningQualitySummary: data.learningQualitySummary ?? {},
      safetySummary: data.safetySummary ?? {},
      privacySummary: data.privacySummary ?? {},
      deenSummary: data.deenSummary ?? {},
      socraticSummary: data.socraticSummary ?? {},
      curriculumSummary: data.curriculumSummary ?? {},
      operationsSummary: data.operationsSummary ?? {},
      teacherAdminSummary: data.teacherAdminSummary ?? {},
      rollbackSummary: data.rollbackSummary ?? {},
      recommendedDecision: data.recommendedDecision ?? 'continue_controlled_expansion',
      safeToStartNextTask: data.safeToStartNextTask ?? false,
      blockingIssues: data.blockingIssues ?? [],
      knownLimitations: data.knownLimitations ?? [],
      artifactPaths: data.artifactPaths ?? [],
      generatedAt: now,
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionCompletionReview.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.completionReviews.set(id, entry);
    return entry;
  },

  async getCompletionReview(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionCompletionReview.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.completionReviews.get(id) ?? null;
  },

  async getCompletionReviewByRun(executionRunId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionCompletionReview.findFirst({
          where: { executionRunId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.completionReviews.values())
      .filter(c => c.executionRunId === executionRunId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  // ── ExpansionExecutionReport ──

  async createExecutionReport(data: {
    executionRunId?: string;
    schoolId?: string;
    taskId: string;
    taskName: string;
    status?: string;
    safeToStartNextTask?: boolean;
    safeSummary: string;
    executionSummary?: Record<string, unknown>;
    stageSummary?: Record<string, unknown>;
    runtimeGateSummary?: Record<string, unknown>;
    monitoringSummary?: Record<string, unknown>;
    oversightSummary?: Record<string, unknown>;
    rollbackSummary?: Record<string, unknown>;
    completionReviewSummary?: Record<string, unknown>;
    blockingIssues?: string[];
    knownLimitations?: string[];
    verificationSummary?: Record<string, unknown>;
    artifactPaths?: string[];
  }) {
    const id = genId('eerpt');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId ?? null,
      schoolId: data.schoolId ?? null,
      taskId: data.taskId,
      taskName: data.taskName,
      status: data.status ?? 'draft',
      safeToStartNextTask: data.safeToStartNextTask ?? false,
      safeSummary: data.safeSummary,
      executionSummary: data.executionSummary ?? {},
      stageSummary: data.stageSummary ?? {},
      runtimeGateSummary: data.runtimeGateSummary ?? {},
      monitoringSummary: data.monitoringSummary ?? {},
      oversightSummary: data.oversightSummary ?? {},
      rollbackSummary: data.rollbackSummary ?? {},
      completionReviewSummary: data.completionReviewSummary ?? {},
      blockingIssues: data.blockingIssues ?? [],
      knownLimitations: data.knownLimitations ?? [],
      verificationSummary: data.verificationSummary ?? {},
      artifactPaths: data.artifactPaths ?? [],
      generatedAt: now,
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionReport.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.reports.set(id, entry);
    return entry;
  },

  async getExecutionReport(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionReport.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.reports.get(id) ?? null;
  },

  async listExecutionReports(taskId: string) {
    if (isDBReady()) {
      try {
        return await prisma.expansionExecutionReport.findMany({
          where: { taskId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.reports.values())
      .filter(r => r.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── ExpansionExecutionAuditRecord ──

  async createAuditRecord(data: {
    executionRunId?: string;
    stageId?: string;
    pilotProgramId?: string;
    schoolId?: string;
    actorRole: string;
    actorIdHash?: string;
    action: string;
    safeSummary: string;
    metadataSafeJson?: Record<string, unknown>;
    requestId?: string;
    correlationId?: string;
  }) {
    const id = genId('eard');
    const now = new Date();
    const entry = {
      id,
      executionRunId: data.executionRunId ?? null,
      stageId: data.stageId ?? null,
      pilotProgramId: data.pilotProgramId ?? null,
      schoolId: data.schoolId ?? null,
      actorRole: data.actorRole,
      actorIdHash: data.actorIdHash ?? null,
      action: data.action,
      safeSummary: data.safeSummary,
      metadataSafeJson: data.metadataSafeJson ?? {},
      requestId: data.requestId ?? null,
      correlationId: data.correlationId ?? null,
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.expansionExecutionAuditRecord.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.auditRecords.set(id, entry);
    return entry;
  },

  async listAuditRecords(executionRunId?: string, limit = 100) {
    if (isDBReady()) {
      try {
        const where = executionRunId ? { executionRunId } : {};
        return await prisma.expansionExecutionAuditRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      } catch { /* fall through */ }
    }
    let records = Array.from(mem.auditRecords.values());
    if (executionRunId) records = records.filter(r => r.executionRunId === executionRunId);
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  },

  // ── Fresh Read for Persistence Tests ──

  async freshReadRun(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionRun.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.runs.get(id) ?? null;
  },

  async freshReadStage(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionStage.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.stages.get(id) ?? null;
  },

  async freshReadParticipant(id: string) {
    if (isDBReady()) {
      try { return await prisma.expandedPilotParticipant.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.participants.get(id) ?? null;
  },

  async freshReadCompletionReview(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionCompletionReview.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.completionReviews.get(id) ?? null;
  },

  async freshReadReport(id: string) {
    if (isDBReady()) {
      try { return await prisma.expansionExecutionReport.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.reports.get(id) ?? null;
  },

  _clearMemory(): void {
    mem.runs.clear();
    mem.stages.clear();
    mem.participants.clear();
    mem.runtimeEvents.clear();
    mem.healthSnapshots.clear();
    mem.oversightItems.clear();
    mem.interventions.clear();
    mem.rollbackRecords.clear();
    mem.completionReviews.clear();
    mem.reports.clear();
    mem.auditRecords.clear();
  },
};
