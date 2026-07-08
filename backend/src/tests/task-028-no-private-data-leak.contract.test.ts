import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { FORBIDDEN_CONTENT_PATTERNS } from '../contracts/task028ExpansionExecutionContracts';
import { recordExpansionMonitoringEvent } from '../services/task028ExpansionMonitoringEventService';

describe('Task 028 No Private Data Leak', () => {
  const SCHOOL_ID = 'privacy_leak_school';
  const PILOT_ID = 'pilot_privacy_leak';

  beforeEach(() => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;
  });

  it('should reject safeSummary containing raw student chat pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'This contains raw student chat which is forbidden',
    });

    expect(event.ok).toBe(false);
    expect(event.reasonCodes).toContain('unsafe_content_detected');
  });

  it('should reject safeSummary containing private learner memory pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains private learner memory reference',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing teacher-only notes pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains teacher-only notes content',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing AI prompt pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains AI prompt data',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing provider response pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains provider response content',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing answer key pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains answer key material',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing Bearer token pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Contains Bearer token data',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing database URL pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'Uses postgres://localhost:5432/db',
    });

    expect(event.ok).toBe(false);
  });

  it('should reject safeSummary containing OpenAI API key pattern', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'sk-proj-fakekeyabcdef123',
    });

    expect(event.ok).toBe(false);
  });

  it('should accept safeSummary that avoids all forbidden patterns', async () => {
    const event = await recordExpansionMonitoringEvent({
      executionRunId: 'any_run',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'system',
      eventType: 'expansion_preflight_passed',
      eventStatus: 'completed',
      safeSummary: 'All metrics nominal. No private data exposed.',
    });

    expect(event.ok).toBe(true);
    expect(event.eventId).toBeTruthy();
  });

  it('should verify FORBIDDEN_CONTENT_PATTERNS includes all expected patterns', () => {
    const requiredPatterns = [
      'raw student chat',
      'private learner memory',
      'teacher-only notes',
      'safeguarding raw details',
      'Deen-sensitive private text',
      'AI prompt',
      'provider response',
      'answer key',
      'teacher-only content',
      'protected rubric',
      'Bearer ',
      'postgres://',
      'postgresql://',
      'mysql://',
      'sk-proj-',
      'sk-ant-',
    ];
    for (const pattern of requiredPatterns) {
      expect(FORBIDDEN_CONTENT_PATTERNS).toContain(pattern);
    }
  });
});
