import { describe, it, expect, beforeEach } from 'vitest';
import { generateCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Completion Review Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1',
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      status: 'completed',
      safeSummary: 'Expansion completed',
      stagePlan: { stages: 1 },
      approvedScopeSnapshot: { classes: ['class-1'] },
    });
    executionRunId = (run as any).id;
  });

  it('should generate completion review', async () => {
    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId,
      expansionProposalId: 'p1',
      schoolId: 'school-1',
      stageNumber: 1,
      status: 'completed',
      plannedStudentCount: 30,
      safeSummary: 'Stage 1 completed',
    });
    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorIdHash: 'student-1', role: 'student', activationStatus: 'active',
    });
    await task028ExpansionExecutionRepository.createHealthSnapshot({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      activeExpandedSessions: 10, allowedExpandedSessionStarts: 50, blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0, cohortScopeBlocks: 0, curriculumGateBlocks: 0, socraticGateBlocks: 0,
      deenGateBlocks: 0, privacyGateBlocks: 0, aiCallBlocks: 0, memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0, feedbackCount: 5, oversightItemCount: 0, interventionCount: 0,
      incidentBridgeCount: 0, errorCount: 0,
      safeSummary: 'Healthy',
      metadataSafeJson: { healthStatus: 'healthy' },
    });
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'operator', action: 'rollback_executed',
      safeSummary: 'Rollback tested during execution',
    });

    const result = await generateCompletionReview(executionRunId);
    expect(result.ok).toBe(true);
    expect(result.reviewId).toBeTruthy();
    expect(typeof result.safeToStartTask029).toBe('boolean');
    expect(Array.isArray(result.blockingIssues)).toBe(true);
    expect(result.safeMessage).toContain('generated');
  });

  it('should compute safeToStartTask029 as true when all conditions pass', async () => {
    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId, expansionProposalId: 'p1', schoolId: 'school-1',
      stageNumber: 1, status: 'completed', safeSummary: 'Stage 1 completed',
    });
    await task028ExpansionExecutionRepository.createHealthSnapshot({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      activeExpandedSessions: 10, allowedExpandedSessionStarts: 50, blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0, cohortScopeBlocks: 0, curriculumGateBlocks: 0, socraticGateBlocks: 0,
      deenGateBlocks: 0, privacyGateBlocks: 0, aiCallBlocks: 0, memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0, feedbackCount: 5, oversightItemCount: 0, interventionCount: 0,
      incidentBridgeCount: 0, errorCount: 0,
      safeSummary: 'Healthy',
      metadataSafeJson: { healthStatus: 'healthy' },
    });
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'operator', action: 'rollback_completed',
      safeSummary: 'Rollback exercised',
    });

    const result = await generateCompletionReview(executionRunId);
    expect(result.safeToStartTask029).toBe(true);
    expect(result.recommendedDecision).toBe('ready_for_larger_school_rollout');
    expect(result.blockingIssues).toHaveLength(0);
  });

  it('should set safeToStartTask029 false when blocking issues exist', async () => {
    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId, expansionProposalId: 'p1', schoolId: 'school-1',
      stageNumber: 1, status: 'completed', safeSummary: 'Stage 1 completed',
    });
    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      itemType: 'privacy_review_needed', severity: 'critical', status: 'open',
      source: 'test', safeSummary: 'Privacy issue',
      requiresTeacherReview: false, requiresAdminReview: false,
      requiresPrivacyReview: true, requiresDeenReview: false,
      requiresSocraticReview: false, requiresCurriculumReview: false,
      requiresPause: false, requiresRollback: false,
    });
    await task028ExpansionExecutionRepository.createHealthSnapshot({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      activeExpandedSessions: 5, allowedExpandedSessionStarts: 20, blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0, cohortScopeBlocks: 0, curriculumGateBlocks: 0, socraticGateBlocks: 0,
      deenGateBlocks: 0, privacyGateBlocks: 0, aiCallBlocks: 0, memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0, feedbackCount: 0, oversightItemCount: 1, interventionCount: 0,
      incidentBridgeCount: 0, errorCount: 0,
      safeSummary: 'Healthy',
      metadataSafeJson: { healthStatus: 'healthy' },
    });
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'operator', action: 'rollback_executed',
      safeSummary: 'Rollback tested',
    });

    const result = await generateCompletionReview(executionRunId);
    expect(result.safeToStartTask029).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should fail for non-existent execution run', async () => {
    const result = await generateCompletionReview('nonexistent-run-id');
    expect(result.ok).toBe(false);
    expect(result.safeToStartTask029).toBe(false);
    expect(result.blockingIssues).toContain('execution_run_not_found');
  });

  it('should handle empty state (no stages, no data)', async () => {
    const result = await generateCompletionReview(executionRunId);
    expect(result.ok).toBe(true);
    expect(result.safeToStartTask029).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });
});
