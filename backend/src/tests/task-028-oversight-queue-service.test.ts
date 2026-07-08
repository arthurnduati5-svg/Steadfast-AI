import { describe, it, expect, beforeEach } from 'vitest';
import { createOversightItem, isStudentOversightAccess, listOversightItems } from '../services/task028ExpansionOversightQueueService';
import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

describe('Task 028 Oversight Queue Service', () => {
  let executionRunId: string;

  beforeEach(async () => {
    task028ExpansionExecutionRepository._clearMemory();
    process.env.NODE_ENV = 'test';
    delete process.env.TASK028_REQUIRE_REAL_PRISMA;

    const run = await task028ExpansionExecutionRepository.createExecutionRun({
      expansionProposalId: 'p1', pilotProgramId: 'pp-1', schoolId: 'school-1', safeSummary: 'Run',
    });
    executionRunId = (run as any).id;
  });

  it('should create a low severity oversight item', async () => {
    const result = await createOversightItem({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      itemType: 'content_gap',
      severity: 'low',
      source: 'test',
      safeSummary: 'Missing reference for topic X',
      requiresTeacherReview: false,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: true,
      requiresPause: false,
      requiresRollback: false,
    });
    expect(result.ok).toBe(true);
    expect(result.itemId).toBeTruthy();
    expect(result.reasonCodes).toEqual([]);
    expect(result.safeMessage).toContain('created');
  });

  it('should create a critical oversight item with pause recommendation', async () => {
    const result = await createOversightItem({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      itemType: 'critical_safety_signal',
      severity: 'critical',
      source: 'runtime_guard',
      safeSummary: 'Multiple curriculum gate blocks detected',
      requiresTeacherReview: true,
      requiresAdminReview: true,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
    expect(result.ok).toBe(true);
    expect(result.reasonCodes).toContain('critical_oversight_item');
    expect(result.safeMessage).toContain('Pause recommended');
  });

  it('should enforce critical severity for rollback_recommendation', async () => {
    const result = await createOversightItem({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      itemType: 'rollback_recommendation',
      severity: 'high',
      source: 'operator',
      safeSummary: 'Rollback recommended',
      requiresTeacherReview: false,
      requiresAdminReview: true,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('rollback_recommendation_must_be_critical');
  });

  it('should auto-set requiresRollback for rollback_recommendation type', async () => {
    const result = await createOversightItem({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      itemType: 'rollback_recommendation',
      severity: 'critical',
      source: 'operator',
      safeSummary: 'Rollback recommended',
      requiresTeacherReview: false,
      requiresAdminReview: true,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
    expect(result.ok).toBe(true);
    expect(result.safeMessage).toContain('Rollback recommended');
  });

  it('should reject created oversight item with missing required fields', async () => {
    const result = await createOversightItem({
      executionRunId: '',
      pilotProgramId: '',
      schoolId: '',
      itemType: 'technical_issue',
      severity: 'low',
      source: 'test',
      safeSummary: 'Test',
      requiresTeacherReview: false,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
    expect(result.ok).toBe(false);
    expect(result.reasonCodes).toContain('missing_required_fields');
  });

  it('should list oversight items', async () => {
    await createOversightItem({
      executionRunId,
      pilotProgramId: 'pp-1',
      schoolId: 'school-1',
      itemType: 'technical_issue',
      severity: 'medium',
      source: 'test',
      safeSummary: 'Item one',
      requiresTeacherReview: false,
      requiresAdminReview: false,
      requiresPrivacyReview: false,
      requiresDeenReview: false,
      requiresSocraticReview: false,
      requiresCurriculumReview: false,
      requiresPause: false,
      requiresRollback: false,
    });
    const items = await listOversightItems(executionRunId);
    expect(items.length).toBe(1);
    expect(items[0].itemType).toBe('technical_issue');
  });

  it('should return true for student oversight access check', () => {
    expect(isStudentOversightAccess('student')).toBe(true);
    expect(isStudentOversightAccess('teacher')).toBe(false);
    expect(isStudentOversightAccess('admin')).toBe(false);
  });
});
