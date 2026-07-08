import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { classifyHealth } from '../services/task028ExpansionHealthSnapshotService';
import { generateCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import type { ExpansionHealthSnapshotInput } from '../contracts/task028ExpansionExecutionContracts';

describe('Task 028 No Deen Gate Bypass', () => {
  const SCHOOL_ID = 'deen_gate_school';
  const PILOT_ID = 'pilot_deen_gate';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_deen_gate',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'completed',
      safeSummary: 'Deen gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'] },
    });
    RUN_ID = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_deen_gate',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'completed',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: ['scope_a'],
      safeSummary: 'Deen gate test stage',
    });
  });

  it('should classify health as critical when deenGateBlocks > 0', () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      activeExpandedSessions: 1,
      allowedExpandedSessionStarts: 1,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 1,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Deen gate health test',
    };
    const status = classifyHealth(input);
    expect(status).toBe('critical');
  });

  it('should generate blocking issues in completion review when deen oversight items exist', async () => {
    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      itemType: 'deen_review_needed',
      severity: 'high',
      source: 'test',
      safeSummary: 'Deen review needed test item',
      requiresTeacherReview: false,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: true,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });

    const result = await generateCompletionReview(RUN_ID);
    expect(result.ok).toBe(true);
    expect(result.blockingIssues.some((i: string) => i.toLowerCase().includes('deen'))).toBe(true);
    expect(result.safeToStartTask029).toBe(false);
  });

  it('should pass completion review when no deen issues exist', async () => {
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'rollback_executed',
      safeSummary: 'Rollback for review test',
    });
    const result = await generateCompletionReview(RUN_ID);
    expect(result.ok).toBe(true);
    expect(result.blockingIssues.some((i: string) => i.toLowerCase().includes('deen'))).toBe(false);
  });

  it('should not bypass deen governance through health snapshot classification', () => {
    const input: ExpansionHealthSnapshotInput = {
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      activeExpandedSessions: 5,
      allowedExpandedSessionStarts: 5,
      blockedExpandedSessionStarts: 0,
      schoolAuthBlocks: 0,
      cohortScopeBlocks: 0,
      curriculumGateBlocks: 0,
      socraticGateBlocks: 0,
      deenGateBlocks: 3,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Multiple deen blocks test',
    };
    expect(classifyHealth(input)).toBe('critical');
  });
});
