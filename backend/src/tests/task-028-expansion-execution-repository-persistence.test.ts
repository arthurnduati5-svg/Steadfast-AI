import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Execution Repository Persistence', () => {
  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  describe('ExpansionExecutionRun', () => {
    it('should create and get an execution run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'proposal-1',
        pilotProgramId: 'pp-1',
        schoolId: 'school-1',
        safeSummary: 'Test execution run',
      });
      expect((run as any).id).toBeTruthy();
      expect((run as any).status).toBe('not_started');
      expect((run as any).schoolId).toBe('school-1');

      const fresh = await task028ExpansionExecutionRepository.freshReadRun((run as any).id);
      expect(fresh).toBeTruthy();
      expect((fresh as any).id).toBe((run as any).id);
    });

    it('should update an execution run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'proposal-1',
        pilotProgramId: 'pp-1',
        schoolId: 'school-1',
        safeSummary: 'Test run',
      });
      const updated = await task028ExpansionExecutionRepository.updateExecutionRun((run as any).id, { status: 'stage_1_active' });
      expect((updated as any).status).toBe('stage_1_active');
    });

    it('should list execution runs with filters', async () => {
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run 1',
      });
      await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p2', pilotProgramId: 'pp-2', schoolId: 's2', safeSummary: 'Run 2',
      });
      const list = await task028ExpansionExecutionRepository.listExecutionRuns();
      expect(list.length).toBe(2);
      const filtered = await task028ExpansionExecutionRepository.listExecutionRuns('s1');
      expect(filtered.length).toBe(1);
    });
  });

  describe('ExpansionExecutionStage', () => {
    it('should create and get an execution stage', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const stage = await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id,
        expansionProposalId: 'p1',
        schoolId: 's1',
        stageNumber: 1,
        plannedStudentCount: 50,
        plannedTeacherCount: 5,
        allowedClassIds: ['class-1'],
        safeSummary: 'Stage 1',
      });
      expect((stage as any).id).toBeTruthy();
      expect((stage as any).stageNumber).toBe(1);
      expect((stage as any).status).toBe('pending');

      const fresh = await task028ExpansionExecutionRepository.freshReadStage((stage as any).id);
      expect(fresh).toBeTruthy();
    });

    it('should update an execution stage', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const stage = await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 1, safeSummary: 'Stage 1',
      });
      const updated = await task028ExpansionExecutionRepository.updateExecutionStage((stage as any).id, { status: 'active' });
      expect((updated as any).status).toBe('active');
    });

    it('should list stages by run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 1, safeSummary: 'Stage 1',
      });
      await task028ExpansionExecutionRepository.createExecutionStage({
        executionRunId: (run as any).id, expansionProposalId: 'p1', schoolId: 's1', stageNumber: 2, safeSummary: 'Stage 2',
      });
      const stages = await task028ExpansionExecutionRepository.listStagesByRun((run as any).id);
      expect(stages.length).toBe(2);
      expect(stages[0].stageNumber).toBe(1);
      expect(stages[1].stageNumber).toBe(2);
    });
  });

  describe('ExpandedPilotParticipant', () => {
    it('should create and get an expanded participant', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const participant = await task028ExpansionExecutionRepository.createExpandedParticipant({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        actorIdHash: 'student-hash-1',
        role: 'student',
      });
      expect((participant as any).id).toBeTruthy();
      expect((participant as any).activationStatus).toBe('pending');

      const fresh = await task028ExpansionExecutionRepository.freshReadParticipant((participant as any).id);
      expect(fresh).toBeTruthy();
    });

    it('should get participant by hash', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      await task028ExpansionExecutionRepository.createExpandedParticipant({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 's1', actorIdHash: 'hash-1', role: 'student',
      });
      const found = await task028ExpansionExecutionRepository.getExpandedParticipantByHash((run as any).id, 'hash-1');
      expect(found).toBeTruthy();
      const notFound = await task028ExpansionExecutionRepository.getExpandedParticipantByHash((run as any).id, 'nonexistent');
      expect(notFound).toBeNull();
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

  describe('ExpansionRuntimeEvent', () => {
    it('should create a runtime event', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const event = await task028ExpansionExecutionRepository.createRuntimeEvent({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        actorRole: 'admin',
        eventType: 'expansion_preflight_requested',
        eventStatus: 'completed',
        safeSummary: 'Preflight completed',
      });
      expect((event as any).id).toBeTruthy();
      expect((event as any).eventType).toBe('expansion_preflight_requested');
      expect((event as any).actorRole).toBe('admin');
    });
  });

  describe('ExpansionHealthSnapshot', () => {
    it('should create and list health snapshots', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const snapshot = await task028ExpansionExecutionRepository.createHealthSnapshot({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        activeExpandedSessions: 10,
        allowedExpandedSessionStarts: 25,
        blockedExpandedSessionStarts: 2,
        schoolAuthBlocks: 0,
        cohortScopeBlocks: 0,
        curriculumGateBlocks: 0,
        socraticGateBlocks: 0,
        deenGateBlocks: 0,
        privacyGateBlocks: 0,
        aiCallBlocks: 0,
        memoryAccessBlocks: 0,
        evidenceWriteBlocks: 0,
        feedbackCount: 5,
        oversightItemCount: 1,
        interventionCount: 0,
        incidentBridgeCount: 0,
        errorCount: 3,
        safeSummary: 'Healthy snapshot',
      });
      expect((snapshot as any).id).toBeTruthy();
      expect((snapshot as any).activeExpandedSessions).toBe(10);

      const snapshots = await task028ExpansionExecutionRepository.listHealthSnapshots((run as any).id);
      expect(snapshots.length).toBe(1);
    });
  });

  describe('ExpansionOversightItem', () => {
    it('should create, get, and update oversight items', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const item = await task028ExpansionExecutionRepository.createOversightItem({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        itemType: 'technical_issue',
        severity: 'high',
        source: 'test',
        safeSummary: 'Test oversight',
        requiresTeacherReview: true,
        requiresAdminReview: false,
        requiresPrivacyReview: false,
        requiresDeenReview: false,
        requiresSocraticReview: false,
        requiresCurriculumReview: false,
        requiresPause: false,
        requiresRollback: false,
      });
      expect((item as any).id).toBeTruthy();
      expect((item as any).status).toBe('open');

      const got = await task028ExpansionExecutionRepository.getOversightItem((item as any).id);
      expect(got).toBeTruthy();

      const updated = await task028ExpansionExecutionRepository.updateOversightItem((item as any).id, { status: 'resolved' });
      expect((updated as any).status).toBe('resolved');

      const items = await task028ExpansionExecutionRepository.listOversightItems((run as any).id);
      expect(items.length).toBe(1);
    });
  });

  describe('ExpansionInterventionRecord', () => {
    it('should create and update intervention records', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const intervention = await task028ExpansionExecutionRepository.createInterventionRecord({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        interventionType: 'pause_execution',
        actorRole: 'admin',
        safeSummary: 'Paused for review',
      });
      expect((intervention as any).id).toBeTruthy();
      expect((intervention as any).status).toBe('requested');

      const updated = await task028ExpansionExecutionRepository.updateInterventionRecord((intervention as any).id, { status: 'completed' });
      expect((updated as any).status).toBe('completed');
    });
  });

  describe('ExpansionRollbackRecord', () => {
    it('should create and get rollback records', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const record = await task028ExpansionExecutionRepository.createRollbackRecord({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        rollbackReason: 'Critical issue found',
        safeSummary: 'Rolled back stage 1',
        previousScopeSnapshot: { stage: 'stage_1' },
      });
      expect((record as any).id).toBeTruthy();
      expect((record as any).rollbackStatus).toBe('pending');
      expect((record as any).auditPreserved).toBe(true);

      const got = await task028ExpansionExecutionRepository.getRollbackRecord((record as any).id);
      expect(got).toBeTruthy();
    });
  });

  describe('ExpansionCompletionReview', () => {
    it('should create, get, and find by run', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const review = await task028ExpansionExecutionRepository.createCompletionReview({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        safeSummary: 'Completion review',
        recommendedDecision: 'ready_for_larger_school_rollout',
        safeToStartNextTask: true,
      });
      expect((review as any).id).toBeTruthy();
      expect((review as any).status).toBe('draft');

      const fresh = await task028ExpansionExecutionRepository.freshReadCompletionReview((review as any).id);
      expect(fresh).toBeTruthy();

      const byRun = await task028ExpansionExecutionRepository.getCompletionReviewByRun((run as any).id);
      expect(byRun).toBeTruthy();
    });
  });

  describe('ExpansionExecutionReport', () => {
    it('should create, get, and list reports', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const report = await task028ExpansionExecutionRepository.createExecutionReport({
        executionRunId: (run as any).id,
        taskId: '028',
        taskName: 'Expansion Execution',
        safeSummary: 'Execution report',
      });
      expect((report as any).id).toBeTruthy();

      const fresh = await task028ExpansionExecutionRepository.freshReadReport((report as any).id);
      expect(fresh).toBeTruthy();

      const reports = await task028ExpansionExecutionRepository.listExecutionReports('028');
      expect(reports.length).toBe(1);
    });
  });

  describe('ExpansionExecutionAuditRecord', () => {
    it('should create and list audit records', async () => {
      const run = await task028ExpansionExecutionRepository.createExecutionRun({
        expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 's1', safeSummary: 'Run',
      });
      const audit = await task028ExpansionExecutionRepository.createAuditRecord({
        executionRunId: (run as any).id,
        pilotProgramId: 'pp-1',
        schoolId: 's1',
        actorRole: 'admin',
        action: 'state_transition_stage_1_active',
        safeSummary: 'Transition to stage 1 active',
      });
      expect((audit as any).id).toBeTruthy();
      expect((audit as any).action).toBe('state_transition_stage_1_active');

      const audits = await task028ExpansionExecutionRepository.listAuditRecords((run as any).id);
      expect(audits.length).toBe(1);
    });
  });
});
