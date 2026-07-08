import { describe, it, expect, beforeEach } from 'vitest';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';
import { task027PilotExpansionRepository } from '../repositories/task027PilotExpansionRepository';
import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { classifyHealth } from '../services/task028ExpansionHealthSnapshotService';
import { generateCompletionReview } from '../services/task028ExpansionCompletionReviewService';
import type { ExpansionHealthSnapshotInput } from '../contracts/task028ExpansionExecutionContracts';

describe('Task 028 No Socratic Gate Bypass', () => {
  const SCHOOL_ID = 'socratic_gate_school';
  const PILOT_ID = 'pilot_socratic_gate';

  let RUN_ID: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    task027PilotExpansionRepository._clearMemory();
    task026PilotExecutionRepository._clearMemory();
    task025PilotRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'prop_socratic_gate',
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      status: 'completed',
      safeSummary: 'Socratic gate test run',
      stagePlan: { stages: [{ stageNumber: 1 }] },
      approvedScopeSnapshot: { classIds: ['class_a'], subjectIds: ['math'] },
    });
    RUN_ID = (run as any).id;

    await task028ExpansionExecutionRepository.createExecutionStage({
      executionRunId: RUN_ID,
      expansionProposalId: 'prop_socratic_gate',
      schoolId: SCHOOL_ID,
      stageNumber: 1,
      status: 'completed',
      plannedStudentCount: 5,
      plannedTeacherCount: 1,
      allowedClassIds: ['class_a'],
      allowedSubjectIds: ['math'],
      allowedCurriculumScopes: ['scope_a'],
      safeSummary: 'Socratic gate test stage',
    });

    await task028ExpansionExecutionRepository.createExpandedParticipant({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student_hash_socratic',
      role: 'student',
      classId: 'class_a',
      subjectIds: ['math'],
      curriculumScopes: ['scope_a'],
      activationStatus: 'active',
    });

    await task028ExpansionExecutionRepository.createOversightItem({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      itemType: 'socratic_quality_review',
      severity: 'medium',
      source: 'test',
      safeSummary: 'Socratic quality review needed',
      requiresTeacherReview: false,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: true,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
  });

  it('should classify health as degraded when socraticGateBlocks > 0 and <= 5', () => {
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
      socraticGateBlocks: 3,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Socratic gate health test',
    };
    expect(classifyHealth(input)).toBe('degraded');
  });

  it('should classify health as critical when socraticGateBlocks > 5', () => {
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
      socraticGateBlocks: 6,
      deenGateBlocks: 0,
      privacyGateBlocks: 0,
      aiCallBlocks: 0,
      memoryAccessBlocks: 0,
      evidenceWriteBlocks: 0,
      feedbackCount: 0,
      oversightItemCount: 0,
      interventionCount: 0,
      incidentBridgeCount: 0,
      errorCount: 0,
      safeSummary: 'Critical socratic blocks test',
    };
    expect(classifyHealth(input)).toBe('critical');
  });

  it('should generate blocking issues in completion review when socratic review items exist', async () => {
    const result = await generateCompletionReview(RUN_ID);
    expect(result.ok).toBe(true);
    expect(result.blockingIssues.some((i: string) => i.toLowerCase().includes('socratic'))).toBe(true);
    expect(result.safeToStartTask029).toBe(false);
  });

  it('should allow completion review when all socratic items are resolved', async () => {
    await task028ExpansionExecutionRepository.createAuditRecord({
      executionRunId: RUN_ID,
      pilotProgramId: PILOT_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'rollback_executed',
      safeSummary: 'Rollback for socratic test',
    });

    const items = await task028ExpansionExecutionRepository.listOversightItems(RUN_ID);
    for (const item of items as any[]) {
      await task028ExpansionExecutionRepository.updateOversightItem(item.id, { status: 'resolved' });
    }
    const result = await generateCompletionReview(RUN_ID);
    const socraticBlocking = result.blockingIssues.filter((i: string) => i.toLowerCase().includes('socratic'));
    expect(socraticBlocking).toHaveLength(0);
  });
});
