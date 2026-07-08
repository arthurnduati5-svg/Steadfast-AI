import { describe, it, expect, beforeEach } from 'vitest';
import { generatePostPilotReview } from '../services/task026PostPilotReviewService';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';

describe('Task 026 Post-Pilot Review Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';

    const run = await task026PilotExecutionRepository.createExecutionRun({
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      status: 'active',
      safeSummary: 'Review test run',
    });
    executionRunId = (run as any).id;
  });

  it('should generate post-pilot review', async () => {
    // Add some events, feedback, and signals to simulate pilot activity
    await task026PilotExecutionRepository.createExecutionEvent({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      eventType: 'pilot_session_start_allowed',
      eventStatus: 'completed',
      safeSummary: 'Session allowed',
    });

    await task026PilotExecutionRepository.createFeedbackRecord({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'student',
      feedbackType: 'learning_quality',
      safeSummary: 'Good session',
      redactionStatus: 'safe_summary_only',
    });

    const result = await generatePostPilotReview(executionRunId);
    expect(result.ok).toBe(true);
    expect(result.reviewId).toBeTruthy();
    expect(typeof result.safeToStartTask027).toBe('boolean');
  });

  it('should compute safeToStartTask027 as true when no blocking issues', async () => {
    const result = await generatePostPilotReview(executionRunId);
    expect(result.safeToStartTask027).toBe(true);
    expect(result.recommendedDecision).toBe('expand_cautiously');
  });

  it('should compute safeToStartTask027 as false when critical signals exist', async () => {
    await task026PilotExecutionRepository.createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'privacy_scan',
      severity: 'critical',
      source: 'test',
      safeSummary: 'Critical privacy signal',
      requiresPause: true,
      requiresRollback: true,
    });

    const result = await generatePostPilotReview(executionRunId);
    expect(result.safeToStartTask027).toBe(false);
    expect(result.blockingIssues.length).toBeGreaterThan(0);
  });

  it('should return blocking issues for Deen signals', async () => {
    await task026PilotExecutionRepository.createSafetySignal({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      signalType: 'deen_concern_flag',
      severity: 'high',
      source: 'test',
      safeSummary: 'Deen concern',
      requiresDeenReview: true,
    });

    const result = await generatePostPilotReview(executionRunId);
    expect(result.blockingIssues.some((b) => b.includes('Deen'))).toBe(true);
  });

  it('should return rollback_required when rollbacks happened', async () => {
    await task026PilotExecutionRepository.createAuditRecord({
      executionRunId,
      pilotProgramId: 'pp-test',
      schoolId: 'school-1',
      actorRole: 'admin',
      action: 'pilot_rolled_back',
      safeSummary: 'Rollback occurred',
    });

    const result = await generatePostPilotReview(executionRunId);
    expect(result.recommendedDecision).toBe('rollback_required');
    expect(result.safeToStartTask027).toBe(false);
  });

  it('should fail for nonexistent execution run', async () => {
    const result = await generatePostPilotReview('nonexistent-run');
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('execution_run_not_found');
  });
});
