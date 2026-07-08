import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository, getTask028PersistenceMode } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Controlled Expansion Execution Repository', () => {
  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  describe('getTask028PersistenceMode', () => {
    it('should return degraded_memory_fallback in test mode', () => {
      const mode = getTask028PersistenceMode();
      expect(mode.mode).toBe('degraded_memory_fallback');
      expect(mode.durable).toBe(false);
      expect(mode.fallbackUsed).toBe(true);
    });
  });

  describe('ExecutionRun CRUD', () => {
    it('should create an execution run with default status', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'prop-1',
        pilotProgramId: 'pp-1',
        schoolId: 'school-1',
        safeSummary: 'Test run',
      });
      expect((run as any).id).toBeTruthy();
      expect((run as any).status).toBe('not_started');
      expect((run as any).schoolId).toBe('school-1');
    });

    it('should create with custom status', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'prop-1',
        pilotProgramId: 'pp-1',
        schoolId: 'school-1',
        status: 'ready',
        safeSummary: 'Ready run',
      });
      expect((run as any).status).toBe('ready');
    });

    it('should get an execution run by id', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const found = await task028ExpansionExecutionRepository.getExecutionRun((run as any).id);
      expect(found).toBeTruthy();
      expect((found as any).id).toBe((run as any).id);
    });

    it('should return null for non-existent run', async () => {
      const found = await task028ExpansionExecutionRepository.getExecutionRun('nonexistent');
      expect(found).toBeNull();
    });

    it('should update an execution run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const updated = await task028ExpansionExecutionRepository.updateExecutionRun((run as any).id, { status: 'stage_1_active' });
      expect((updated as any).status).toBe('stage_1_active');
    });

    it('should list execution runs', async () => {
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run 1',
      });
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p2', pilotProgramId: 'pp-2', schoolId: 's2', safeSummary: 'Run 2',
      });
      const runs = await task028ExpansionExecutionRepository.listExecutionRuns();
      expect(runs.length).toBe(2);
    });

    it('should filter runs by schoolId', async () => {
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run 1',
      });
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p2', pilotProgramId: 'pp-2', schoolId: 's2', safeSummary: 'Run 2',
      });
      const filtered = await task028ExpansionExecutionRepository.listExecutionRuns('s1');
      expect(filtered.length).toBe(1);
      expect((filtered[0] as any).schoolId).toBe('s1');
    });
  });

  describe('ExecutionStage CRUD', () => {
    it('should create and get a stage with defaults', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const stage = await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 1, safeSummary: 'Stage 1',
      });
      expect((stage as any).status).toBe('pending');
      expect((stage as any).stageNumber).toBe(1);
    });

    it('should list stages ordered by stageNumber', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 2, safeSummary: 'Stage 2',
      });
      await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 1, safeSummary: 'Stage 1',
      });
      const stages = await task028ExpansionExecutionRepository.listStagesByRun((run as any).id);
      expect(stages.length).toBe(2);
      expect(stages[0].stageNumber).toBe(1);
      expect(stages[1].stageNumber).toBe(2);
    });
  });

  describe('ExpandedParticipant CRUD', () => {
    it('should create participant with pending status', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const p = await task028ExpansionExecutionRepository.createExpandedParticipant({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorIdHash: 'hash-1', role: 'student',
      });
      expect((p as any).activationStatus).toBe('pending');
    });

    it('should find participant by hash', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createExpandedParticipant({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorIdHash: 'hash-1', role: 'student',
      });
      const found = await task028ExpansionExecutionRepository.getExpandedParticipantByHash((run as any).id, 'hash-1');
      expect(found).toBeTruthy();
    });

    it('should update participants by run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createExpandedParticipant({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorIdHash: 'hash-1', role: 'student',
      });
      await task028ExpansionExecutionRepository.updateParticipantsByRun((run as any).id, { activationStatus: 'rolled_back' });
      const list = await task028ExpansionExecutionRepository.listExpandedParticipants((run as any).id);
      expect(list.every((p: any) => p.activationStatus === 'rolled_back')).toBe(true);
    });
  });

  describe('AuditRecord CRUD', () => {
    it('should create and list audit records', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const audit = await task028ExpansionExecutionRepository.createAuditRecord({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorRole: 'admin',
        action: 'expansion_run_created', safeSummary: 'Run created',
      });
      expect((audit as any).id).toBeTruthy();
      expect((audit as any).action).toBe('expansion_run_created');
      const list = await task028ExpansionExecutionRepository.listAuditRecords((run as any).id);
      expect(list.length).toBe(1);
    });

    it('should list audits without runId filter', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createAuditRecord({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorRole: 'admin',
        action: 'test_action', safeSummary: 'Test',
      });
      const all = await task028ExpansionExecutionRepository.listAuditRecords();
      expect(all.length).toBe(1);
    });
  });
});
