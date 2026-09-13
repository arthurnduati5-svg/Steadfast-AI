const store: {
  proposals: any[]
  reviews: any[]
  evidencePacks: any[]
  riskAssessments: any[]
  decisions: any[]
  cohortChanges: any[]
  audits: any[]
  reports: any[]
  approvals: any[]
} = {
  proposals: [],
  reviews: [],
  evidencePacks: [],
  riskAssessments: [],
  decisions: [],
  cohortChanges: [],
  audits: [],
  reports: [],
  approvals: [],
}

export const task027PilotExpansionRepository = {
  _clearMemory() {
    store.proposals = []
    store.reviews = []
    store.evidencePacks = []
    store.riskAssessments = []
    store.decisions = []
    store.cohortChanges = []
    store.audits = []
    store.reports = []
    store.approvals = []
  },

  async createProposal(input: any): Promise<any> {
    const proposal = { id: `prop_${store.proposals.length + 1}`, ...input, status: 'draft', createdAt: new Date().toISOString() }
    store.proposals.push(proposal)
    return proposal
  },

  async getProposal(id: string): Promise<any | null> {
    return store.proposals.find(p => p.id === id) || null
  },

  async updateProposal(id: string, updates: any): Promise<any | null> {
    const idx = store.proposals.findIndex(p => p.id === id)
    if (idx === -1) return null
    store.proposals[idx] = { ...store.proposals[idx], ...updates }
    return store.proposals[idx]
  },

  async listProposals(schoolId?: string): Promise<any[]> {
    if (schoolId) return store.proposals.filter(p => p.schoolId === schoolId)
    return [...store.proposals]
  },

  async createReview(input: any): Promise<any> {
    const review = { id: `rev_${store.reviews.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.reviews.push(review)
    return review
  },

  async getReviewsByProposal(proposalId: string): Promise<any[]> {
    return store.reviews.filter(r => r.proposalId === proposalId)
  },

  async createEvidencePack(input: any): Promise<any> {
    const pack = { id: `ep_${store.evidencePacks.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.evidencePacks.push(pack)
    return pack
  },

  async getEvidencePacksByProposal(proposalId: string): Promise<any[]> {
    return store.evidencePacks.filter(p => p.proposalId === proposalId)
  },

  async createRiskAssessment(input: any): Promise<any> {
    const assessment = { id: `ra_${store.riskAssessments.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.riskAssessments.push(assessment)
    return assessment
  },

  async getRiskAssessmentByProposal(proposalId: string): Promise<any | null> {
    return store.riskAssessments.find(a => a.proposalId === proposalId) || null
  },

  async createDecisionRecord(input: any): Promise<any> {
    const decision = { id: `dec_${store.decisions.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.decisions.push(decision)
    return decision
  },

  async getDecisionByProposal(proposalId: string): Promise<any | null> {
    return store.decisions.find(d => d.proposalId === proposalId) || null
  },

  async createCohortChange(input: any): Promise<any> {
    const change = { id: `cc_${store.cohortChanges.length + 1}`, changeStatus: 'pending', ...input, createdAt: new Date().toISOString() }
    store.cohortChanges.push(change)
    return change
  },

  async getCohortChangesByProposal(proposalId: string): Promise<any[]> {
    return store.cohortChanges.filter(c => c.proposalId === proposalId)
  },

  async getCohortChange(id: string): Promise<any | null> {
    return store.cohortChanges.find(c => c.id === id) || null
  },

  async getCohortChangeByProposalId(proposalId: string): Promise<any | null> {
    return store.cohortChanges.find(c => c.proposalId === proposalId || c.expansionProposalId === proposalId) || null
  },

  async createAuditRecord(input: any): Promise<any> {
    const record = { id: `aud_${store.audits.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.audits.push(record)
    return record
  },

  async getAuditRecordsByProposal(proposalId: string): Promise<any[]> {
    return store.audits.filter(a => a.proposalId === proposalId)
  },

  async createExpansionReport(input: any): Promise<any> {
    const report = { id: `rpt_${store.reports.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.reports.push(report)
    return report
  },

  async getReportsByTaskId(taskId: string): Promise<any[]> {
    return store.reports.filter(r => r.taskId === taskId)
  },

  async createApproval(input: any): Promise<any> {
    const approval = { id: `app_${store.approvals.length + 1}`, ...input, createdAt: new Date().toISOString() }
    store.approvals.push(approval)
    return approval
  },

  async getApprovalByProposalId(proposalId: string): Promise<any | null> {
    return store.approvals.find(a => a.proposalId === proposalId || a.expansionProposalId === proposalId) || null
  },

  async updateApproval(id: string, updates: any): Promise<any | null> {
    const idx = store.approvals.findIndex(a => a.id === id)
    if (idx === -1) return null
    store.approvals[idx] = { ...store.approvals[idx], ...updates, updatedAt: new Date().toISOString() }
    return store.approvals[idx]
  },

  async getEvidencePack(id: string): Promise<any | null> {
    return store.evidencePacks.find(p => p.id === id) || null
  },

  async getEvidencePackByProposalId(idOrProposalId: string): Promise<any | null> {
    return store.evidencePacks.find(p => p.id === idOrProposalId || p.proposalId === idOrProposalId || p.expansionProposalId === idOrProposalId) || null
  },

  async getRiskAssessmentByProposalId(proposalId: string): Promise<any | null> {
    return store.riskAssessments.find(a => a.id === proposalId || a.proposalId === proposalId || a.expansionProposalId === proposalId) || null
  },

  async listReviews(proposalId?: string): Promise<any[]> {
    if (proposalId) return store.reviews.filter(r => r.proposalId === proposalId || r.expansionProposalId === proposalId)
    return [...store.reviews]
  },

  async listAuditRecords(proposalId?: string): Promise<any[]> {
    if (proposalId) return store.audits.filter(a => a.proposalId === proposalId || a.expansionProposalId === proposalId)
    return [...store.audits]
  },

  async getExpansionReport(reportId: string): Promise<any | null> {
    return store.reports.find(r => r.id === reportId) || null
  },

  async listExpansionReports(taskId?: string): Promise<any[]> {
    if (taskId) return store.reports.filter(r => r.taskId === taskId)
    return [...store.reports]
  },

  async listEvidencePacks(proposalId?: string): Promise<any[]> {
    if (proposalId) return store.evidencePacks.filter(p => p.proposalId === proposalId || p.expansionProposalId === proposalId)
    return [...store.evidencePacks]
  },

  async getRiskAssessment(idOrProposalId?: string): Promise<any | null> {
    if (idOrProposalId) return store.riskAssessments.find(a => a.id === idOrProposalId || a.proposalId === idOrProposalId || a.expansionProposalId === idOrProposalId) || null
    return store.riskAssessments[0] || null
  },

  async getPersistenceModeInfo(): Promise<{ mode: string }> {
    return { mode: 'in-memory' }
  },

  getPersistenceMode(): { mode: string } {
    return { mode: 'in_memory' }
  },
}
