import { describe, it, expect, beforeEach } from 'vitest';
import { Task029ExpansionOperationsRepository } from '../repositories/task029ExpansionOperationsRepository';

describe('Task029ExpansionOperationsRepository', () => {
  let repo: Task029ExpansionOperationsRepository;

  beforeEach(() => {
    repo = new Task029ExpansionOperationsRepository();
  });

  describe('dashboard snapshots', () => {
    it('should record and get the latest dashboard snapshot', async () => {
      const snapshot = {
        schoolId: 'school-1', expansionRunId: 'run-1',
        task028ProofStatus: { ok: true, safeToStartTask029: true, blockingIssues: [] },
        runStatus: 'active', cohortSafeCounts: { approved: 1, active: 1, blocked: 0, rolledBack: 0 },
        stageSafeCounts: { total: 3, active: 2, paused: 0, completed: 1 },
        healthRiskLevel: 'low', operationsRiskLevel: 'low', privacyRiskLevel: 'low',
        safeguardingRiskLevel: 'low', contentGovernanceRiskLevel: 'low',
        deenContentRiskLevel: 'low', socraticRiskLevel: 'low',
        interventionQueueCounts: { total: 0, open: 0, critical: 0 },
        incidentCounts: { total: 0, open: 0, critical: 0 },
        rollbackReadinessStatus: 'ready',
        teacherOversightCounts: { assigned: 2, reviewNeeded: 0 },
        safeNextActionLabels: ['pause', 'resume'],
        allowedControlActions: ['pause_expansion'],
        blockedControlActions: [],
        lastAuditEventAt: '2024-01-01T00:00:00Z',
        generatedAt: '2024-01-01T00:00:00Z',
      } as any;
      await repo.recordOperationsDashboardSnapshot(snapshot);
      const result = await repo.getLatestOperationsDashboardSnapshot('school-1');
      expect(result).not.toBeNull();
      expect(result!.schoolId).toBe('school-1');
      expect(result!.runStatus).toBe('active');
    });

    it('should return null for non-existent school', async () => {
      const result = await repo.getLatestOperationsDashboardSnapshot('nonexistent');
      expect(result).toBeNull();
    });

    it('should overwrite previous snapshot for same school', async () => {
      const first = { schoolId: 's1', runStatus: 'paused' } as any;
      const second = { schoolId: 's1', runStatus: 'active' } as any;
      await repo.recordOperationsDashboardSnapshot(first);
      await repo.recordOperationsDashboardSnapshot(second);
      const result = await repo.getLatestOperationsDashboardSnapshot('s1');
      expect(result!.runStatus).toBe('active');
    });
  });

  describe('permission decisions', () => {
    it('should record and list permission decisions', async () => {
      await repo.recordPermissionDecision({ ok: true, role: 'school_admin', permissions: ['view_dashboard'], blockingIssues: [] });
      const list = await repo.listPermissionDecisions('school-1');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].role).toBe('school_admin');
    });
  });

  describe('control action preflights', () => {
    it('should record and list control action preflights', async () => {
      await repo.recordControlActionPreflight({ ok: true, action: 'pause_expansion', checksPassed: true, schoolContextVerified: true, task028ProofAccepted: true, sameSchool: true, actorPermissionGranted: true, expansionRunExists: true, runStateAllowsAction: true, actionAllowed: true, actionIsStagingRehearsal: false, actionIsCanary: false, actionIsRollout: false, actionIsSchoolWide: false, privacyBoundaryClear: true, safeguardingBoundaryClear: true, contentGovernanceBoundaryClear: true, rollbackReadiness: true, auditWritePathAvailable: true, blockingIssues: [] } as any);
      const list = await repo.listControlActionPreflights('school-1', 'run-1');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].action).toBe('pause_expansion');
    });
  });

  describe('control action results', () => {
    it('should record and list control action results', async () => {
      await repo.recordControlActionResult({ ok: true, action: 'pause_expansion', status: 'executed', safeMessage: 'OK', reasonCodes: [] });
      const list = await repo.listControlActionResults('school-1', 'run-1');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].status).toBe('executed');
    });
  });

  describe('learner own status views', () => {
    it('should record and list learner own status views by ref', async () => {
      const view = { learnerSafeRef: 'learner-1', schoolId: 's1', expansionRunId: 'run-1', isInApprovedExpandedCohort: true, accessStatus: 'granted', pauseStatus: 'none', rollbackStatus: 'none', safeMessage: 'OK', nextSafeActionLabel: 'continue', supportAvailable: true } as any;
      await repo.recordLearnerOwnStatusView(view);
      const list = await repo.listLearnerOwnStatusViews('learner-1');
      expect(list).toHaveLength(1);
      expect(list[0].accessStatus).toBe('granted');
    });

    it('should return empty array for unknown learner ref', async () => {
      const list = await repo.listLearnerOwnStatusViews('unknown');
      expect(list).toEqual([]);
    });
  });

  describe('rollback command results', () => {
    it('should record and list rollback command results', async () => {
      await repo.recordRollbackCommandResult({ ok: true, rollbackId: 'rb-1', status: 'completed', expandedAccessBlocked: true, auditPreserved: true, dataDestructivelyDeleted: true, safeMessage: 'OK', reasonCodes: [] });
      const list = await repo.listRollbackCommandResults('run-1');
      expect(list.length).toBeGreaterThanOrEqual(1);
      expect(list[0].rollbackId).toBe('rb-1');
    });
  });

  describe('operations reports', () => {
    it('should record and list operations reports', async () => {
      await repo.recordOperationsReport({ taskId: '029', scope: 'test' } as any);
      const list = await repo.listOperationsReports();
      expect(list).toHaveLength(1);
      expect(list[0].taskId).toBe('029');
    });
  });

  describe('audit events', () => {
    it('should record and list operations audit events by school', async () => {
      await repo.recordOperationsAuditEvent({ schoolId: 's1', actorId: 'a1', actorRole: 'admin', eventType: 'operation_viewed', safeSummary: 'viewed dashboard' });
      const list = await repo.listOperationsAuditEvents('s1');
      expect(list).toHaveLength(1);
      expect(list[0].eventType).toBe('operation_viewed');
    });

    it('should filter audit events by schoolId', async () => {
      await repo.recordOperationsAuditEvent({ schoolId: 's1', actorId: 'a1', actorRole: 'admin', eventType: 'viewed', safeSummary: 'x' });
      await repo.recordOperationsAuditEvent({ schoolId: 's2', actorId: 'a2', actorRole: 'admin', eventType: 'viewed', safeSummary: 'y' });
      const list = await repo.listOperationsAuditEvents('s1');
      expect(list).toHaveLength(1);
    });
  });

  describe('clearTask029StoresForTests', () => {
    it('should clear all stores', async () => {
      await repo.recordOperationsDashboardSnapshot({ schoolId: 's1', runStatus: 'active' } as any);
      await repo.recordPermissionDecision({ ok: true, role: 'admin', permissions: [], blockingIssues: [] });
      await repo.recordOperationsReport({ taskId: '029' } as any);
      await repo.clearTask029StoresForTests();
      const dash = await repo.getLatestOperationsDashboardSnapshot('s1');
      const perms = await repo.listPermissionDecisions('s1');
      const reports = await repo.listOperationsReports();
      expect(dash).toBeNull();
      expect(perms).toHaveLength(0);
      expect(reports).toHaveLength(0);
    });
  });
});
