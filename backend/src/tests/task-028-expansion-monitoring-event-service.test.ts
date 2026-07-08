import { describe, it, expect, beforeEach } from 'vitest';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Expansion Monitoring Event Service', () => {
  let executionRunId: string;

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should record a valid expansion monitoring event', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    executionRunId = (run as any).id;
    const result = await recordExpansionMonitoringEvent({
      executionRunId, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'expansion_preflight_passed',
      eventStatus: 'completed', safeSummary: 'Preflight checks passed',
      requestId: 'req-001', correlationId: 'corr-001',
    });
    expect(result.ok).toBe(true);
    expect(result.eventId).toBeTruthy();
    expect(result.reasonCodes).toEqual([]);
    expect(result.safeMessage).toContain('recorded');
  });

  it('should reject event with missing required fields', async () => {
    const result = await recordExpansionMonitoringEvent({
      executionRunId: '', pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'expansion_preflight_passed',
      eventStatus: 'completed', safeSummary: 'Test',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_required_fields');
  });

  it('should reject event with invalid event type', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const result = await recordExpansionMonitoringEvent({
      executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'invalid_event_type',
      eventStatus: 'completed', safeSummary: 'Test',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('invalid_event_type');
  });

  it('should reject event with forbidden content in safeSummary', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const result = await recordExpansionMonitoringEvent({
      executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'expansion_preflight_passed',
      eventStatus: 'completed', safeSummary: 'This contains raw student chat content',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('unsafe_content_detected');
  });

  it('should reject event with forbidden content in metadata', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const result = await recordExpansionMonitoringEvent({
      executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'expansion_preflight_passed',
      eventStatus: 'completed', safeSummary: 'Clean summary',
      metadataSafeJson: { secret: 'Bearer sk-proj-abc123' },
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('unsafe_metadata_detected');
  });

  it('should reject event with missing actor role', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const result = await recordExpansionMonitoringEvent({
      executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: '', eventType: 'expansion_preflight_passed',
      eventStatus: 'completed', safeSummary: 'Test',
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_actor_role');
  });

  it('should handle empty metadata gracefully', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const result = await recordExpansionMonitoringEvent({
      executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
      actorRole: 'admin', eventType: 'expansion_stage_activated',
      eventStatus: 'completed', safeSummary: 'Stage activated',
    });
    expect(result.ok).toBe(true);
  });

  it('should accept known expansion event types', async () => {
    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    const types = ['expansion_preflight_requested', 'expansion_stage_activated', 'rollback_completed', 'completion_review_generated'];
    for (const eventType of types) {
      const result = await recordExpansionMonitoringEvent({
        executionRunId: (run as any).id, pilotProgramId: 'pp-1', schoolId: 'school-1',
        actorRole: 'admin', eventType, eventStatus: 'completed', safeSummary: `Event ${eventType}`,
      });
      expect(result.ok).toBe(true);
    }
  });
});
