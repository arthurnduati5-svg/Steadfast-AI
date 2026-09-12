import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import { createDailyCheckRevisionNode } from '../services/phase3RevisionNodeService';
import { deriveDueFromDailyCheck } from '../services/phase3RevisionDueResolverService';

describe('Phase3LivingRevisionDailyLearningFeedIntegration', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('creates revision nodes from daily feed signals', () => {
    const node = createDailyCheckRevisionNode(
      'school-1',
      'student-1',
      'obj-1',
      'Feed item: Algebra practice',
      'Completed practice from daily feed',
      { status: 'approved' },
    );

    expect(node).toBeDefined();
    expect(node.schoolId).toBe('school-1');
    expect(node.studentId).toBe('student-1');
    expect(node.objectiveId).toBe('obj-1');
  });

  it('derives due items from feed-based revision nodes', () => {
    const node = createDailyCheckRevisionNode(
      'school-1',
      'student-1',
      'obj-1',
      'Feed item: Geometry',
      'Practice completed',
      { status: 'approved' },
    );

    const dueItem = deriveDueFromDailyCheck(
      'school-1',
      'student-1',
      node.nodeId,
      'Feed item: Geometry',
      'Needs review',
      true,
      false,
      'obj-1',
    );

    expect(dueItem).toBeDefined();
    expect(dueItem.safeReasonCodes).toContain('created_from_daily_check');
    expect(dueItem.nodeId).toBe(node.nodeId);
  });

  it('links daily feed revision nodes to learner graph', () => {
    const node1 = createDailyCheckRevisionNode(
      'school-1', 'student-1', 'obj-1', 'Feed A', 'Practice A', { status: 'approved' },
    );
    const node2 = createDailyCheckRevisionNode(
      'school-1', 'student-1', 'obj-2', 'Feed B', 'Practice B', { status: 'approved' },
    );

    const nodes = phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1');
    expect(nodes.length).toBe(2);
  });

  it('does not expose raw feed content in revision nodes', () => {
    const node = createDailyCheckRevisionNode(
      'school-1', 'student-1', 'obj-1', 'Feed title', 'Safe summary', { status: 'approved' },
    );

    expect(node.safeTitle).toBeTruthy();
    expect(node.safeSummary).toBeTruthy();
    expect((node as any).rawChat).toBeUndefined();
    expect((node as any).rawAnswer).toBeUndefined();
    expect((node as any).rawExplanation).toBeUndefined();
  });
});
