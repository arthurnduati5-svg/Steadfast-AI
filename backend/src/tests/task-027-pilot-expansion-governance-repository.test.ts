import { describe, it, expect, beforeEach } from 'vitest';
import { task027PilotExpansionGovernanceRepository as repo } from '../repositories/task027PilotExpansionGovernanceRepository';

beforeEach(() => {
  repo.clearTask027StoresForTests();
});

const sampleProposalInput = {
  schoolId: 'school-1',
  pilotRunId: 'run-1',
  proposedCohortSize: 25,
  proposedScopeLabels: ['class'],
  proposedClassOrGradeIds: ['c1'],
  teacherOwnerSafeRefs: ['t1'],
  supportOwnerSafeRefs: ['s1'],
  curriculumSourceScopeIds: ['cur1'],
  startReadinessWindow: '2026-07-15',
  rollbackReadinessPath: '/rollback/plan',
};

describe('task027PilotExpansionGovernanceRepository', () => {
  describe('createExpansionProposal / getExpansionProposal', () => {
    it('creates and returns proposal with id', async () => {
      const proposal = await repo.createExpansionProposal(sampleProposalInput);
      expect(proposal).toBeDefined();
      expect(proposal.id).toBeDefined();
      expect(typeof proposal.id).toBe('string');
      expect(proposal.id).toContain('gprop_');
      expect(proposal.schoolId).toBe('school-1');
      expect(proposal.status).toBe('draft');
      expect(proposal.createdAt).toBeInstanceOf(Date);
      expect(proposal.updatedAt).toBeInstanceOf(Date);
    });

    it('returns the created proposal via getExpansionProposal', async () => {
      const created = await repo.createExpansionProposal(sampleProposalInput);
      const fetched = await repo.getExpansionProposal(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
    });

    it('getExpansionProposal returns null for unknown id', async () => {
      const result = await repo.getExpansionProposal('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listExpansionProposalsForSchool', () => {
    it('filters proposals by school', async () => {
      await repo.createExpansionProposal({ ...sampleProposalInput, schoolId: 'school-1' });
      await repo.createExpansionProposal({ ...sampleProposalInput, schoolId: 'school-2' });
      const school1Proposals = await repo.listExpansionProposalsForSchool('school-1');
      expect(school1Proposals.length).toBe(1);
      expect(school1Proposals[0].schoolId).toBe('school-1');
    });

    it('returns empty array for school with no proposals', async () => {
      const result = await repo.listExpansionProposalsForSchool('unknown');
      expect(result).toEqual([]);
    });
  });

  describe('updateExpansionProposalStatus', () => {
    it('changes status and returns updated proposal', async () => {
      const created = await repo.createExpansionProposal(sampleProposalInput);
      const updated = await repo.updateExpansionProposalStatus(created.id, 'approved');
      expect(updated).not.toBeNull();
      expect(updated!.status).toBe('approved');
      expect(updated!.updatedAt).toBeInstanceOf(Date);
    });

    it('returns null for unknown id', async () => {
      const result = await repo.updateExpansionProposalStatus('nonexistent', 'approved');
      expect(result).toBeNull();
    });
  });

  describe('recordEvidenceSummary / getEvidenceSummary', () => {
    it('stores and retrieves evidence summary', async () => {
      const summary = {
        pilotRunId: 'run-1', schoolId: 'school-1',
        cohortSafeCount: 10, sessionsStartedCount: 5, sessionsBlockedCount: 0,
        supportNeededCount: 1, incidentCount: 0, safeguardingSignalCount: 0,
        pauseCount: 0, rollbackCount: 0,
        safeLearningQualitySignals: {}, safeSocraticIntegritySignals: {},
        safeContentGovernanceSignals: {}, safeOperationsSignals: {},
      };
      const recorded = await repo.recordEvidenceSummary('school-1', 'run-1', summary);
      expect(recorded).toBeDefined();
      expect(recorded.schoolId).toBe('school-1');

      const fetched = await repo.getEvidenceSummary('school-1', 'run-1');
      expect(fetched).not.toBeNull();
      expect(fetched!.pilotRunId).toBe('run-1');
    });

    it('getEvidenceSummary returns null for unknown', async () => {
      const result = await repo.getEvidenceSummary('unknown', 'unknown');
      expect(result).toBeNull();
    });
  });

  describe('recordRiskAssessment / getRiskAssessment', () => {
    it('stores and retrieves risk assessment', async () => {
      const assessment = { overallRiskLevel: 'low', riskReasons: [], mitigations: [] };
      const recorded = await repo.recordRiskAssessment('school-1', 'prop-1', assessment);
      expect(recorded).toBeDefined();
      expect(recorded.id).toContain('gra_');
      expect(recorded.schoolId).toBe('school-1');

      const fetched = await repo.getRiskAssessment('prop-1');
      expect(fetched).not.toBeNull();
      expect(fetched!.proposalId).toBe('prop-1');
    });

    it('getRiskAssessment returns null for unknown proposal', async () => {
      const result = await repo.getRiskAssessment('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('recordGovernanceDecision / getGovernanceDecision', () => {
    it('stores and retrieves governance decision', async () => {
      const decision = { decision: 'approved_for_task028', safeToStartTask028: true };
      const recorded = await repo.recordGovernanceDecision('school-1', 'prop-1', decision);
      expect(recorded).toBeDefined();
      expect(recorded.id).toContain('gdec_');
      expect(recorded.schoolId).toBe('school-1');

      const fetched = await repo.getGovernanceDecision('prop-1');
      expect(fetched).not.toBeNull();
      expect(fetched!.proposalId).toBe('prop-1');
    });

    it('getGovernanceDecision returns null for unknown proposal', async () => {
      const result = await repo.getGovernanceDecision('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('listGovernanceDecisionsForSchool', () => {
    it('filters decisions by school', async () => {
      await repo.recordGovernanceDecision('school-1', 'prop-1', { decision: 'approved' });
      await repo.recordGovernanceDecision('school-2', 'prop-2', { decision: 'blocked' });
      const decisions = await repo.listGovernanceDecisionsForSchool('school-1');
      expect(decisions.length).toBe(1);
      expect(decisions[0].schoolId).toBe('school-1');
    });
  });

  describe('recordEvidencePack / getEvidencePack', () => {
    it('stores and retrieves evidence pack', async () => {
      const pack = { safeBlockers: [], safeNextActions: [] };
      const recorded = await repo.recordEvidencePack('school-1', 'prop-1', pack);
      expect(recorded).toBeDefined();
      expect(recorded.id).toContain('gpk_');

      const fetched = await repo.getEvidencePack('prop-1');
      expect(fetched).not.toBeNull();
      expect(fetched!.proposalId).toBe('prop-1');
    });

    it('getEvidencePack returns null for unknown proposal', async () => {
      const result = await repo.getEvidencePack('nonexistent');
      expect(result).toBeNull();
    });
  });

  describe('recordAuditEvent / listAuditEvents', () => {
    it('stores audit event', async () => {
      const event = {
        schoolId: 'school-1', actorRole: 'school_admin' as const,
        action: 'governance_started' as const, safeSummary: 'Started',
        metadataSafe: {},
        id: '', createdAt: new Date(),
      };
      const recorded = await repo.recordAuditEvent(event);
      expect(recorded).toBeDefined();
      expect(recorded.id).toContain('gaud_');
      expect(recorded.action).toBe('governance_started');
    });

    it('lists audit events and filters by school', async () => {
      await repo.recordAuditEvent({ schoolId: 'school-1', actorRole: 'school_admin', action: 'governance_started', safeSummary: 's1', metadataSafe: {}, id: '', createdAt: new Date() });
      await repo.recordAuditEvent({ schoolId: 'school-2', actorRole: 'school_admin', action: 'evidence_loaded', safeSummary: 's2', metadataSafe: {}, id: '', createdAt: new Date() });

      const all = await repo.listAuditEvents();
      expect(all.length).toBe(2);

      const filtered = await repo.listAuditEvents('school-1');
      expect(filtered.length).toBe(1);
      expect(filtered[0].schoolId).toBe('school-1');
    });

    it('listAuditEvents respects limit', async () => {
      await repo.recordAuditEvent({ schoolId: 'school-1', actorRole: 'school_admin', action: 'governance_started', safeSummary: 'a', metadataSafe: {}, id: '', createdAt: new Date() });
      await repo.recordAuditEvent({ schoolId: 'school-1', actorRole: 'school_admin', action: 'evidence_loaded', safeSummary: 'b', metadataSafe: {}, id: '', createdAt: new Date() });

      const limited = await repo.listAuditEvents(undefined, 1);
      expect(limited.length).toBe(1);
    });
  });

  describe('clearTask027StoresForTests', () => {
    it('empties all stores', async () => {
      await repo.createExpansionProposal(sampleProposalInput);
      await repo.recordEvidenceSummary('s1', 'r1', { pilotRunId: 'r1', schoolId: 's1', cohortSafeCount: 0, sessionsStartedCount: 0, sessionsBlockedCount: 0, supportNeededCount: 0, incidentCount: 0, safeguardingSignalCount: 0, pauseCount: 0, rollbackCount: 0, safeLearningQualitySignals: {}, safeSocraticIntegritySignals: {}, safeContentGovernanceSignals: {}, safeOperationsSignals: {} });
      await repo.recordRiskAssessment('s1', 'p1', {});
      await repo.recordGovernanceDecision('s1', 'p1', { decision: 'x' });
      await repo.recordEvidencePack('s1', 'p1', {});
      await repo.recordAuditEvent({ schoolId: 's1', actorRole: 'school_admin', action: 'governance_started', safeSummary: 'x', metadataSafe: {}, id: '', createdAt: new Date() });

      repo.clearTask027StoresForTests();

      expect((await repo.listExpansionProposalsForSchool('s1')).length).toBe(0);
      expect(await repo.getEvidenceSummary('s1', 'r1')).toBeNull();
      expect(await repo.getRiskAssessment('p1')).toBeNull();
      expect(await repo.getGovernanceDecision('p1')).toBeNull();
      expect(await repo.getEvidencePack('p1')).toBeNull();
      expect((await repo.listAuditEvents('s1')).length).toBe(0);
    });
  });
});
