import type { Task026ControlledPilotRun, Task026PilotEvidenceEvent, Task026ExecutionAuditEvent, Task026DailyPilotSummary } from '../contracts/task026ControlledPilotExecutionContracts';
import type { Task026ExecutionStatus } from '../contracts/task026ControlledPilotExecutionContracts';

interface InMemoryStore {
  pilotRuns: Map<string, Task026ControlledPilotRun>;
  executionEvents: Map<string, any>;
  evidenceEvents: Map<string, Task026PilotEvidenceEvent>;
  auditEvents: Map<string, Task026ExecutionAuditEvent>;
  incidentSignals: Map<string, any>;
  safeguardingSignals: Map<string, any>;
  dailySummaries: Map<string, Task026DailyPilotSummary>;
  teacherSnapshots: Map<string, any>;
}

const mem: InMemoryStore = {
  pilotRuns: new Map(),
  executionEvents: new Map(),
  evidenceEvents: new Map(),
  auditEvents: new Map(),
  incidentSignals: new Map(),
  safeguardingSignals: new Map(),
  dailySummaries: new Map(),
  teacherSnapshots: new Map(),
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const baseRepo = {
  createPilotRun(data: Omit<Task026ControlledPilotRun, 'id' | 'createdAt' | 'updatedAt'>): Task026ControlledPilotRun {
    const id = genId('t026r');
    const now = new Date().toISOString();
    const entry: Task026ControlledPilotRun = { id, ...data, createdAt: now, updatedAt: now };
    mem.pilotRuns.set(id, entry);
    return entry;
  },

  getPilotRun(id: string): Task026ControlledPilotRun | null {
    return mem.pilotRuns.get(id) ?? null;
  },

  updatePilotRunStatus(id: string, status: Task026ExecutionStatus, extra?: Record<string, string | null>): Task026ControlledPilotRun | null {
    const entry = mem.pilotRuns.get(id);
    if (!entry) return null;
    entry.status = status;
    entry.updatedAt = new Date().toISOString();
    if (extra) {
      for (const [key, value] of Object.entries(extra)) {
        (entry as any)[key] = value;
      }
    }
    return entry;
  },

  listPilotRunsForSchool(schoolId: string): Task026ControlledPilotRun[] {
    return Array.from(mem.pilotRuns.values())
      .filter((r) => r.schoolId === schoolId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordExecutionEvent(data: any): any {
    const id = genId('t026ee');
    const now = new Date().toISOString();
    const entry = { id, ...data, createdAt: now };
    mem.executionEvents.set(id, entry);
    return entry;
  },

  listExecutionEvents(runId?: string): any[] {
    let events = Array.from(mem.executionEvents.values());
    if (runId) events = events.filter((e) => e.runId === runId || e.pilotRunId === runId);
    return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordEvidenceEvent(data: Omit<Task026PilotEvidenceEvent, 'id' | 'createdAt'>): Task026PilotEvidenceEvent {
    const id = genId('t026ev');
    const now = new Date().toISOString();
    const entry: Task026PilotEvidenceEvent = { id, ...data, createdAt: now };
    mem.evidenceEvents.set(id, entry);
    return entry;
  },

  listEvidenceEvents(runId: string): Task026PilotEvidenceEvent[] {
    return Array.from(mem.evidenceEvents.values())
      .filter((e) => e.pilotRunId === runId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordAuditEvent(data: Omit<Task026ExecutionAuditEvent, 'id' | 'createdAt'>): Task026ExecutionAuditEvent {
    const id = genId('t026ae');
    const now = new Date().toISOString();
    const entry: Task026ExecutionAuditEvent = { id, ...data, createdAt: now };
    mem.auditEvents.set(id, entry);
    return entry;
  },

  listAuditEvents(runId?: string): Task026ExecutionAuditEvent[] {
    let events = Array.from(mem.auditEvents.values());
    if (runId) events = events.filter((e) => e.runId === runId);
    return events.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordIncidentSignal(data: any): any {
    const id = genId('t026is');
    const now = new Date().toISOString();
    const entry = { id, ...data, createdAt: now };
    mem.incidentSignals.set(id, entry);
    return entry;
  },

  listIncidentSignals(runId: string): any[] {
    return Array.from(mem.incidentSignals.values())
      .filter((s) => s.pilotRunId === runId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordSafeguardingSignal(data: any): any {
    const id = genId('t026ss');
    const now = new Date().toISOString();
    const entry = { id, ...data, createdAt: now };
    mem.safeguardingSignals.set(id, entry);
    return entry;
  },

  listSafeguardingSignals(runId: string): any[] {
    return Array.from(mem.safeguardingSignals.values())
      .filter((s) => s.pilotRunId === runId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  recordDailySummary(data: Task026DailyPilotSummary): Task026DailyPilotSummary {
    const id = genId('t026ds');
    const entry = { ...data, id };
    mem.dailySummaries.set(id, entry);
    return entry;
  },

  getLatestDailySummary(pilotRunId: string): Task026DailyPilotSummary | null {
    const summaries = Array.from(mem.dailySummaries.values())
      .filter((s) => s.pilotRunId === pilotRunId)
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
    return summaries[0] ?? null;
  },

  recordTeacherSnapshot(data: any): any {
    const id = genId('t026ts');
    const now = new Date().toISOString();
    const entry = { id, ...data, createdAt: now };
    mem.teacherSnapshots.set(id, entry);
    return entry;
  },

  clearTask026StoresForTests(): void {
    mem.pilotRuns.clear();
    mem.executionEvents.clear();
    mem.evidenceEvents.clear();
    mem.auditEvents.clear();
    mem.incidentSignals.clear();
    mem.safeguardingSignals.clear();
    mem.dailySummaries.clear();
    mem.teacherSnapshots.clear();
  },
};

type BaseRepo = typeof baseRepo;

interface LegacyRepo {
  createExecutionRun(data: any): any;
  createExecutionEvent(data: any): any;
  getExecutionRun(id: string): any;
  updateExecutionRun(id: string, data: Record<string, unknown>): any;
  listExecutionRuns(pilotProgramId: string): any[];
  createAuditRecord(data: any): any;
  listAuditRecords(executionRunId?: string): any[];
  createFeedbackRecord(data: any): any;
  listFeedbackRecords(executionRunId: string): any[];
  createSafetySignal(data: any): any;
  listSafetySignals(executionRunId: string): any[];
  createMetricSnapshot(data: any): any;
  listMetricSnapshots(executionRunId: string): any[];
  createPostPilotReview(data: any): any;
  listPostPilotReviews(executionRunId: string): any[];
  writeAuditRecord(data: any): any;
  _clearMemory(): void;
}

function buildLegacyMethods(r: BaseRepo): LegacyRepo {
  return {
    createExecutionRun: (data: any) => r.createPilotRun(data),
    createExecutionEvent: (data: any) => {
      const id = genId('t026cee'); const now = new Date().toISOString();
      const entry = { id, ...data, createdAt: now };
      mem.executionEvents.set(id, entry); return entry;
    },
    getExecutionRun: (id: string) => r.getPilotRun(id),
    updateExecutionRun: (id: string, data: Record<string, unknown>) => {
      const status = data.status as any;
      return r.updatePilotRunStatus(id, status, data as Record<string, string | null>);
    },
    listExecutionRuns: (pilotProgramId: string) =>
      Array.from(mem.pilotRuns.values())
        .filter((r) => r.pilotProgramId === pilotProgramId)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    createAuditRecord: (data: any) => r.recordAuditEvent({
      runId: data.executionRunId, schoolId: data.schoolId,
      actorRole: data.actorRole, action: data.action,
      safeSummary: data.safeSummary, metadataSafeJson: data.metadataSafeJson || {},
    }),
    listAuditRecords: (executionRunId?: string) => r.listAuditEvents(executionRunId),
    createFeedbackRecord: (data: any) => {
      const id = genId('t026fr'); const now = new Date().toISOString();
      const entry = { id, ...data, createdAt: now };
      mem.executionEvents.set(id, entry); return entry;
    },
    listFeedbackRecords: (executionRunId: string) =>
      Array.from(mem.executionEvents.values())
        .filter((e: any) => e.executionRunId === executionRunId)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)),
    createSafetySignal: (data: any) => r.recordSafeguardingSignal(data),
    listSafetySignals: (executionRunId: string) => r.listSafeguardingSignals(executionRunId),
    createMetricSnapshot: (data: any) => {
      const id = genId('t026ms'); const now = new Date().toISOString();
      const entry = { id, ...data, createdAt: now };
      mem.executionEvents.set(id, entry); return entry;
    },
    listMetricSnapshots: (executionRunId: string) =>
      Array.from(mem.executionEvents.values())
        .filter((e: any) => e.executionRunId === executionRunId)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)),
    createPostPilotReview: (data: any) => {
      const id = genId('t026ppr'); const now = new Date().toISOString();
      const entry = { id, ...data, createdAt: now };
      mem.executionEvents.set(id, entry); return entry;
    },
    listPostPilotReviews: (executionRunId: string) =>
      Array.from(mem.executionEvents.values())
        .filter((e: any) => (e as any).executionRunId === executionRunId)
        .sort((a: any, b: any) => b.createdAt.localeCompare(a.createdAt)),
    writeAuditRecord: (data: any) => r.recordAuditEvent({
      runId: data.executionRunId, schoolId: data.schoolId,
      actorRole: data.actorRole, action: data.action,
      safeSummary: data.safeSummary, metadataSafeJson: data.metadataSafeJson || {},
    }),
    _clearMemory: () => r.clearTask026StoresForTests(),
  };
}

export const task026PilotExecutionRepository = Object.assign(baseRepo, buildLegacyMethods(baseRepo));

export type Task026PilotExecutionRepository = typeof task026PilotExecutionRepository;
