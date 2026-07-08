import prisma from '../lib/prisma';

interface InMemoryStore {
  pilotPrograms: Map<string, any>;
  pilotCohorts: Map<string, any>;
  pilotParticipants: Map<string, any>;
  pilotReadinessChecks: Map<string, any>;
  pilotDryRuns: Map<string, any>;
  pilotAuditRecords: Map<string, any>;
}

const mem: InMemoryStore = {
  pilotPrograms: new Map(),
  pilotCohorts: new Map(),
  pilotParticipants: new Map(),
  pilotReadinessChecks: new Map(),
  pilotDryRuns: new Map(),
  pilotAuditRecords: new Map(),
};

function isDBReady(): boolean {
  try {
    if (process.env.NODE_ENV === 'production') return true;
    if (process.env.TASK025_REQUIRE_REAL_PRISMA === '1') return true;
    return !!(process.env.DATABASE_URL || '').trim() && process.env.NODE_ENV !== 'test';
  } catch {
    return false;
  }
}

export interface Task025PersistenceMode {
  mode: 'prisma' | 'degraded_memory_fallback';
  durable: boolean;
  fallbackUsed: boolean;
  safeToStartTask026Eligible: boolean;
}

export function getTask025PersistenceMode(): Task025PersistenceMode {
  const dbReady = isDBReady();
  const fallbackUsed = !dbReady;
  return {
    mode: dbReady ? 'prisma' : 'degraded_memory_fallback',
    durable: dbReady,
    fallbackUsed,
    safeToStartTask026Eligible: dbReady && !fallbackUsed,
  };
}

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeJson(val: any): any {
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') {
    try { return JSON.parse(val); } catch { return val; }
  }
  return val;
}

export const task025PilotRepository = {

  // ── PilotProgram ──

  async createPilotProgram(data: {
    schoolId: string;
    name: string;
    status?: string;
    pilotMode?: string;
    scopeSummarySafe: string;
    allowedSubjects?: string[];
    allowedYearGroups?: string[];
    allowedCurriculumTracks?: string[];
    allowedRoles?: string[];
    maxStudents?: number;
    maxTeachers?: number;
    createdByRole: string;
    createdByActorIdHash?: string;
    approvalStatus?: string;
    rollbackEnabled?: boolean;
    killSwitchEnabled?: boolean;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('pp');
    const now = new Date();
    const entry = {
      id,
      schoolId: data.schoolId,
      name: data.name,
      status: data.status ?? 'draft',
      pilotMode: data.pilotMode ?? 'controlled',
      scopeSummarySafe: data.scopeSummarySafe,
      allowedSubjects: data.allowedSubjects ?? [],
      allowedYearGroups: data.allowedYearGroups ?? [],
      allowedCurriculumTracks: data.allowedCurriculumTracks ?? [],
      allowedRoles: data.allowedRoles ?? [],
      maxStudents: data.maxStudents ?? 50,
      maxTeachers: data.maxTeachers ?? 10,
      startAt: null,
      endAt: null,
      createdByRole: data.createdByRole,
      createdByActorIdHash: data.createdByActorIdHash ?? null,
      approvalStatus: data.approvalStatus ?? 'pending',
      approvedByRole: null,
      approvedAt: null,
      rollbackEnabled: data.rollbackEnabled ?? true,
      killSwitchEnabled: data.killSwitchEnabled ?? true,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try {
        return await prisma.pilotProgram.create({ data: entry as any });
      } catch { /* fall through */ }
    }
    mem.pilotPrograms.set(id, entry);
    return entry;
  },

  async getPilotProgram(id: string) {
    if (isDBReady()) {
      try { return await prisma.pilotProgram.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.pilotPrograms.get(id) ?? null;
  },

  async listPilotPrograms(schoolId?: string) {
    if (isDBReady()) {
      try {
        const where = schoolId ? { schoolId } : {};
        return await prisma.pilotProgram.findMany({ where, orderBy: { createdAt: 'desc' } });
      } catch { /* fall through */ }
    }
    let list = Array.from(mem.pilotPrograms.values());
    if (schoolId) list = list.filter((p) => p.schoolId === schoolId);
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updatePilotProgramStatus(id: string, status: string, approvedByRole?: string) {
    const now = new Date();
    const updateData: Record<string, any> = { status, updatedAt: now };
    if (approvedByRole) {
      updateData.approvalStatus = status === 'active' || status === 'ready' ? 'approved' : undefined;
      updateData.approvedByRole = approvedByRole;
      updateData.approvedAt = now;
    }

    if (isDBReady()) {
      try {
        return await prisma.pilotProgram.update({ where: { id }, data: updateData });
      } catch { /* fall through */ }
    }
    const entry = mem.pilotPrograms.get(id);
    if (entry) {
      entry.status = status;
      entry.updatedAt = now;
      if (approvedByRole) {
        entry.approvalStatus = 'approved';
        entry.approvedByRole = approvedByRole;
        entry.approvedAt = now;
      }
    }
    return entry;
  },

  // ── PilotCohort ──

  async createCohort(data: {
    pilotProgramId: string;
    schoolId: string;
    name: string;
    status?: string;
    allowedClassIds?: string[];
    allowedSubjectIds?: string[];
    allowedCurriculumScopes?: string[];
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('pc');
    const now = new Date();
    const entry = {
      id,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      name: data.name,
      status: data.status ?? 'active',
      studentCount: 0,
      teacherCount: 0,
      allowedClassIds: data.allowedClassIds ?? [],
      allowedSubjectIds: data.allowedSubjectIds ?? [],
      allowedCurriculumScopes: data.allowedCurriculumScopes ?? [],
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.pilotCohort.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.pilotCohorts.set(id, entry);
    return entry;
  },

  async listCohorts(pilotProgramId: string) {
    if (isDBReady()) {
      try {
        return await prisma.pilotCohort.findMany({
          where: { pilotProgramId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.pilotCohorts.values())
      .filter((c) => c.pilotProgramId === pilotProgramId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getCohort(id: string) {
    if (isDBReady()) {
      try { return await prisma.pilotCohort.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.pilotCohorts.get(id) ?? null;
  },

  // ── PilotParticipant ──

  async addParticipant(data: {
    pilotProgramId: string;
    cohortId?: string;
    schoolId: string;
    actorIdHash: string;
    role: string;
    eligibilityStatus?: string;
    metadataSafeJson?: Record<string, unknown>;
  }) {
    const id = genId('pp2');
    const now = new Date();
    const entry = {
      id,
      pilotProgramId: data.pilotProgramId,
      cohortId: data.cohortId ?? null,
      schoolId: data.schoolId,
      actorIdHash: data.actorIdHash,
      role: data.role,
      eligibilityStatus: data.eligibilityStatus ?? 'pending_review',
      reasonCodes: [],
      joinedAt: now,
      removedAt: null,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
      updatedAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.pilotParticipant.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.pilotParticipants.set(id, entry);
    return entry;
  },

  async removeParticipant(id: string) {
    const now = new Date();
    if (isDBReady()) {
      try {
        return await prisma.pilotParticipant.update({
          where: { id },
          data: { eligibilityStatus: 'removed', removedAt: now },
        });
      } catch { /* fall through */ }
    }
    const entry = mem.pilotParticipants.get(id);
    if (entry) {
      entry.eligibilityStatus = 'removed';
      entry.removedAt = now;
    }
    return entry;
  },

  async listParticipants(pilotProgramId: string) {
    if (isDBReady()) {
      try {
        return await prisma.pilotParticipant.findMany({
          where: { pilotProgramId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.pilotParticipants.values())
      .filter((p) => p.pilotProgramId === pilotProgramId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getParticipantByActorIdHash(pilotProgramId: string, actorIdHash: string) {
    if (isDBReady()) {
      try {
        return await prisma.pilotParticipant.findUnique({
          where: { pilotProgramId_actorIdHash: { pilotProgramId, actorIdHash } },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.pilotParticipants.values())
      .find((p) => p.pilotProgramId === pilotProgramId && p.actorIdHash === actorIdHash) ?? null;
  },

  // ── PilotReadinessCheck ──

  async writeReadinessCheck(data: {
    pilotProgramId: string;
    schoolId: string;
    checkType: string;
    status: string;
    safeSummary: string;
    blockingIssues?: string[];
    warnings?: string[];
    evidenceRefs?: string[];
  }) {
    const id = genId('prc');
    const now = new Date();
    const entry = {
      id,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      checkType: data.checkType,
      status: data.status,
      safeSummary: data.safeSummary,
      blockingIssues: data.blockingIssues ?? [],
      warnings: data.warnings ?? [],
      evidenceRefs: data.evidenceRefs ?? [],
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.pilotReadinessCheck.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.pilotReadinessChecks.set(id, entry);
    return entry;
  },

  async listReadinessChecks(pilotProgramId: string) {
    if (isDBReady()) {
      try {
        return await prisma.pilotReadinessCheck.findMany({
          where: { pilotProgramId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.pilotReadinessChecks.values())
      .filter((c) => c.pilotProgramId === pilotProgramId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── PilotDryRun ──

  async writeDryRun(data: {
    pilotProgramId: string;
    schoolId: string;
    status: string;
    scenarioName: string;
    startedAt?: Date;
    completedAt?: Date;
    checksPassed?: string[];
    checksFailed?: string[];
    safeSummary: string;
    metadataSafeJson?: Record<string, unknown>;
    id?: string;
  }) {
    const recordId = data.id ?? genId('pdr');
    const now = new Date();
    const entry = {
      id: recordId,
      pilotProgramId: data.pilotProgramId,
      schoolId: data.schoolId,
      status: data.status,
      scenarioName: data.scenarioName,
      startedAt: data.startedAt ?? now,
      completedAt: data.completedAt ?? null,
      checksPassed: data.checksPassed ?? [],
      checksFailed: data.checksFailed ?? [],
      safeSummary: data.safeSummary,
      metadataSafeJson: data.metadataSafeJson ?? {},
      createdAt: now,
    };

    if (isDBReady()) {
      try { return await prisma.pilotDryRun.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.pilotDryRuns.set(recordId, entry);
    return entry;
  },

  async getDryRun(id: string) {
    if (isDBReady()) {
      try { return await prisma.pilotDryRun.findUnique({ where: { id } }); }
      catch { /* fall through */ }
    }
    return mem.pilotDryRuns.get(id) ?? null;
  },

  async listDryRuns(pilotProgramId: string) {
    if (isDBReady()) {
      try {
        return await prisma.pilotDryRun.findMany({
          where: { pilotProgramId },
          orderBy: { createdAt: 'desc' },
        });
      } catch { /* fall through */ }
    }
    return Array.from(mem.pilotDryRuns.values())
      .filter((d) => d.pilotProgramId === pilotProgramId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  // ── PilotAuditRecord ──

  async writeAuditRecord(data: {
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
    const id = genId('par');
    const now = new Date();
    const entry = {
      id,
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
      try { return await prisma.pilotAuditRecord.create({ data: entry as any }); }
      catch { /* fall through */ }
    }
    mem.pilotAuditRecords.set(id, entry);
    return entry;
  },

  async listAuditRecords(pilotProgramId?: string, limit = 100) {
    if (isDBReady()) {
      try {
        const where = pilotProgramId ? { pilotProgramId } : {};
        return await prisma.pilotAuditRecord.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
        });
      } catch { /* fall through */ }
    }
    let records = Array.from(mem.pilotAuditRecords.values());
    if (pilotProgramId) records = records.filter((r) => r.pilotProgramId === pilotProgramId);
    return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  },

  // ── Utility ──

  _clearMemory(): void {
    mem.pilotPrograms.clear();
    mem.pilotCohorts.clear();
    mem.pilotParticipants.clear();
    mem.pilotReadinessChecks.clear();
    mem.pilotDryRuns.clear();
    mem.pilotAuditRecords.clear();
  },
};
