import {
  Task027CohortExpansionProposalInput,
  Task027PilotExecutionEvidenceSummary,
  Task027GovernanceAuditEvent,
} from '../contracts/task027PilotExpansionGovernanceContracts';

interface GovernanceStore {
  proposals: Map<string, any>;
  evidenceSummaries: Map<string, any>;
  reviewResults: Map<string, any>;
  riskAssessments: Map<string, any>;
  decisions: Map<string, any>;
  evidencePacks: Map<string, any>;
  auditEvents: Map<string, any>;
}

const store: GovernanceStore = {
  proposals: new Map(),
  evidenceSummaries: new Map(),
  reviewResults: new Map(),
  riskAssessments: new Map(),
  decisions: new Map(),
  evidencePacks: new Map(),
  auditEvents: new Map(),
};

function genId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export const task027PilotExpansionGovernanceRepository = {

  async createExpansionProposal(data: Task027CohortExpansionProposalInput & { status?: string }) {
    const id = genId('gprop');
    const now = new Date();
    const entry = {
      id,
      ...data,
      status: data.status ?? 'draft',
      governanceBlockers: [],
      createdAt: now,
      updatedAt: now,
    };
    store.proposals.set(id, entry);
    return entry;
  },

  async getExpansionProposal(id: string) {
    return store.proposals.get(id) ?? null;
  },

  async listExpansionProposalsForSchool(schoolId: string) {
    return Array.from(store.proposals.values())
      .filter((p) => p.schoolId === schoolId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async updateExpansionProposalStatus(id: string, status: string) {
    const entry = store.proposals.get(id);
    if (!entry) return null;
    entry.status = status;
    entry.updatedAt = new Date();
    return entry;
  },

  async recordEvidenceSummary(schoolId: string, pilotRunId: string, summary: Task027PilotExecutionEvidenceSummary) {
    const key = `${schoolId}_${pilotRunId}`;
    const now = new Date();
    const entry = { schoolId, pilotRunId, summary, createdAt: now };
    store.evidenceSummaries.set(key, entry);
    return entry;
  },

  async getEvidenceSummary(schoolId: string, pilotRunId: string) {
    const key = `${schoolId}_${pilotRunId}`;
    return store.evidenceSummaries.get(key) ?? null;
  },

  async recordReviewResult(schoolId: string, proposalId: string, reviewType: string, result: any) {
    const id = genId('grv');
    const now = new Date();
    const entry = { id, schoolId, proposalId, reviewType, result, createdAt: now };
    store.reviewResults.set(id, entry);
    return entry;
  },

  async listReviewResults(proposalId: string) {
    return Array.from(store.reviewResults.values())
      .filter((r) => r.proposalId === proposalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async recordRiskAssessment(schoolId: string, proposalId: string, assessment: any) {
    const id = genId('gra');
    const now = new Date();
    const entry = { id, schoolId, proposalId, assessment, createdAt: now, updatedAt: now };
    store.riskAssessments.set(id, entry);
    return entry;
  },

  async getRiskAssessment(proposalId: string) {
    return Array.from(store.riskAssessments.values())
      .filter((r) => r.proposalId === proposalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async recordGovernanceDecision(schoolId: string, proposalId: string, decision: any) {
    const id = genId('gdec');
    const now = new Date();
    const entry = { id, schoolId, proposalId, decision, madeAt: now };
    store.decisions.set(id, entry);
    return entry;
  },

  async getGovernanceDecision(proposalId: string) {
    return Array.from(store.decisions.values())
      .filter((d) => d.proposalId === proposalId)
      .sort((a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime())[0] ?? null;
  },

  async listGovernanceDecisionsForSchool(schoolId: string) {
    return Array.from(store.decisions.values())
      .filter((d) => d.schoolId === schoolId)
      .sort((a, b) => new Date(b.madeAt).getTime() - new Date(a.madeAt).getTime());
  },

  async recordEvidencePack(schoolId: string, proposalId: string, pack: any) {
    const id = genId('gpk');
    const now = new Date();
    const entry = { id, schoolId, proposalId, pack, createdAt: now };
    store.evidencePacks.set(id, entry);
    return entry;
  },

  async getEvidencePack(proposalId: string) {
    return Array.from(store.evidencePacks.values())
      .filter((p) => p.proposalId === proposalId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] ?? null;
  },

  async recordAuditEvent(event: Task027GovernanceAuditEvent) {
    const id = genId('gaud');
    const now = new Date();
    const entry = { ...event, id, createdAt: now };
    store.auditEvents.set(id, entry);
    return entry;
  },

  async listAuditEvents(schoolId?: string, limit?: number) {
    let events = Array.from(store.auditEvents.values());
    if (schoolId) events = events.filter((e) => e.schoolId === schoolId);
    events.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    if (limit && limit > 0) events = events.slice(0, limit);
    return events;
  },

  clearTask027StoresForTests(): void {
    store.proposals.clear();
    store.evidenceSummaries.clear();
    store.reviewResults.clear();
    store.riskAssessments.clear();
    store.decisions.clear();
    store.evidencePacks.clear();
    store.auditEvents.clear();
  },
};
