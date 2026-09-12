import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import { createDailyCheckRevisionNode } from '../services/phase3RevisionNodeService';
import { deriveDueFromDailyCheck } from '../services/phase3RevisionDueResolverService';

describe('Phase3LivingRevisionDailyCheckIntegration', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('creates revision node from daily check with objective link', () => {
    const node = createDailyCheckRevisionNode(
      'school-1',
      'student-1',
      'obj-1',
      'Check: Algebra basics',
      'Daily check completed for linear equations',
      { status: 'approved' },
    );

    expect(node).toBeDefined();
    expect(node.nodeType).toBe('daily_check_anchor');
    expect(node.objectiveId).toBe('obj-1');
    expect(node.schoolId).toBe('school-1');
    expect(node.studentId).toBe('student-1');
    expect(node.sourceTruth.status).toBe('approved');
  });

  it('creates due item from daily check with teach-back recommendation', () => {
    const node = createDailyCheckRevisionNode(
      'school-1',
      'student-1',
      'obj-1',
      'Check: Algebra',
      'Daily check',
      { status: 'approved' },
    );

    const dueItem = deriveDueFromDailyCheck(
      'school-1',
      'student-1',
      node.nodeId,
      'Check: Algebra',
      'Needs delayed recall',
      true,
      true,
      'obj-1',
    );

    expect(dueItem).toBeDefined();
    expect(dueItem.nodeId).toBe(node.nodeId);
    expect(dueItem.recommendedAction).toBe('start_teach_back');
    expect(dueItem.sourceTruthStatus).toBe('approved');
    expect(dueItem.safeReasonCodes).toContain('created_from_daily_check');
  });

  it('creates due item with recall check from daily check', () => {
    const node = createDailyCheckRevisionNode(
      'school-1',
      'student-1',
      'obj-1',
      'Check: Algebra',
      'Daily check',
      { status: 'approved' },
    );

    const dueItem = deriveDueFromDailyCheck(
      'school-1',
      'student-1',
      node.nodeId,
      'Check: Algebra',
      'Needs recall',
      true,
      false,
      'obj-1',
    );

    expect(dueItem).toBeDefined();
    expect(dueItem.recommendedAction).toBe('start_recall_check');
  });

  it('preserves daily check integration without breaking objective foundation', () => {
    const node1 = createDailyCheckRevisionNode(
      'school-1', 'student-1', 'obj-1', 'Check 1', 'Summary 1', { status: 'approved' },
    );
    const node2 = createDailyCheckRevisionNode(
      'school-1', 'student-1', 'obj-1', 'Check 2', 'Summary 2', { status: 'approved' },
    );

    const nodes = phase3LivingRevisionRepository.listRevisionNodesForLearner('school-1', 'student-1');
    expect(nodes.length).toBe(2);
    expect(nodes.every((n) => n.objectiveId === 'obj-1')).toBe(true);
  });
});
