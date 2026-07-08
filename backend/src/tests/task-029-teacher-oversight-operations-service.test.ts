import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTeacherOversightOperations } from '../services/task029TeacherOversightOperationsService';

vi.mock('../repositories/task028ExpansionExecutionRepository', () => ({
  task028ExpansionExecutionRepository: {
    getExecutionRun: vi.fn(),
    listExpandedParticipants: vi.fn(),
    listOversightItems: vi.fn(),
  },
}));

vi.mock('../repositories/task029ExpansionOperationsRepository', () => ({
  task029ExpansionOperationsRepository: {
    recordControlActionResult: vi.fn(),
  },
}));

import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

function makeRun(overrides: Record<string, any> = {}) {
  return {
    id: 'run_001',
    schoolId: 'school_alpha',
    status: 'stage_1_active',
    ...overrides,
  };
}

function makeParticipant(overrides: Record<string, any> = {}) {
  return {
    id: 'part_001',
    actorIdHash: 'teacher_hash_01',
    role: 'teacher',
    activationStatus: 'active',
    ...overrides,
  };
}

function makeOversightItem(overrides: Record<string, any> = {}) {
  return {
    id: 'ov_001',
    status: 'open',
    severity: 'medium',
    requiresTeacherReview: false,
    requiresAdminReview: false,
    requiresPause: false,
    requiresRollback: false,
    ...overrides,
  };
}

describe('getTeacherOversightOperations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns blockingIssues when run does not exist', async () => {
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(null);

    const result = await getTeacherOversightOperations('run_not_found', 'school_alpha', 'teacher_001');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('expansion_run_not_found');
  });

  it('blocks cross-school access', async () => {
    const run = makeRun({ schoolId: 'school_beta' });
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);

    const result = await getTeacherOversightOperations('run_001', 'school_alpha', 'teacher_001');

    expect(result.ok).toBe(false);
    expect(result.data).toBeNull();
    expect(result.blockingIssues).toContain('cross_school_access_denied');
  });

  it('returns teacher oversight data with no action items', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([]);

    const result = await getTeacherOversightOperations('run_001', 'school_alpha', 'teacher_001');

    expect(result.ok).toBe(true);
    expect(result.data).not.toBeNull();
    expect(result.blockingIssues).toHaveLength(0);
    expect(result.data!.teacherAssignedSafeCount).toBe(0);
    expect(result.data!.teacherOversightViewCount).toBe(1);
    expect(result.data!.teacherReviewNeededCount).toBe(0);
    expect(result.data!.supportNeededCount).toBe(0);
    expect(result.data!.interventionNeededCount).toBe(0);
    expect(result.data!.safeNextActionLabels).toEqual([]);
    expect(result.data!.pauseRecommendationMetadata).toBe('no_pause_needed');
    expect(result.data!.rollbackRecommendationMetadata).toBe('no_rollback_needed');
  });

  it('counts active teachers and open oversight items requiring review', async () => {
    const run = makeRun();
    vi.mocked(task028ExpansionExecutionRepository.getExecutionRun).mockResolvedValue(run);
    vi.mocked(task028ExpansionExecutionRepository.listExpandedParticipants).mockResolvedValue([
      makeParticipant({ role: 'teacher', activationStatus: 'active' }),
      makeParticipant({ role: 'teacher', activationStatus: 'active' }),
      makeParticipant({ role: 'teacher', activationStatus: 'inactive' }),
      makeParticipant({ role: 'student', activationStatus: 'active' }),
    ]);
    vi.mocked(task028ExpansionExecutionRepository.listOversightItems).mockResolvedValue([
      makeOversightItem({ requiresTeacherReview: true, status: 'open' }),
      makeOversightItem({ requiresTeacherReview: true, status: 'open' }),
      makeOversightItem({ requiresTeacherReview: true, status: 'closed' }),
      makeOversightItem({ requiresAdminReview: true, status: 'open' }),
      makeOversightItem({ requiresPause: true, status: 'open' }),
      makeOversightItem({ requiresRollback: true, status: 'open' }),
    ]);

    const result = await getTeacherOversightOperations('run_001', 'school_alpha', 'teacher_001');

    expect(result.data!.teacherAssignedSafeCount).toBe(2);
    expect(result.data!.teacherReviewNeededCount).toBe(2);
    expect(result.data!.supportNeededCount).toBe(4);
    expect(result.data!.interventionNeededCount).toBe(2);
    expect(result.data!.safeNextActionLabels).toContain('review_oversight_items');
    expect(result.data!.safeNextActionLabels).toContain('provide_support');
    expect(result.data!.safeNextActionLabels).toContain('escalate_intervention');
    expect(result.data!.pauseRecommendationMetadata).toBe('pause_recommended');
    expect(result.data!.rollbackRecommendationMetadata).toBe('rollback_recommended');
  });
});
