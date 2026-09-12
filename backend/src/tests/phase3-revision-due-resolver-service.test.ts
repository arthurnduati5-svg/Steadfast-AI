import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionDueResolverService from '../services/phase3RevisionDueResolverService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionDueResolverService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('derives due from Growth Page', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Test', 'Test');
    const due = revisionDueResolverService.deriveDueFromGrowthPage('school-1', 'student-1', node.nodeId, 'Growth item', 'Due from growth');
    expect(due.priority).toBe('medium');
    expect(due.recommendedAction).toBe('start_recall_check');
  });

  it('derives due from weak topic lane with high priority', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Weak', 'Test');
    const due = revisionDueResolverService.deriveDueFromWeakTopicLane('school-1', 'student-1', node.nodeId, 'Weak topic', 'Needs attention', 'needs_recheck');
    expect(due.priority).toBe('high');
    expect(due.recommendedAction).toBe('review_weak_topic');
  });

  it('derives due from mistake pattern with urgent priority', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Mistake', 'Test');
    const due = revisionDueResolverService.deriveDueFromMistakePattern('school-1', 'student-1', node.nodeId, 'Mistake pattern', 'Repeated error', true, true);
    expect(due.priority).toBe('urgent');
  });

  it('derives due from objective mastery', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Obj', 'Test');
    const due = revisionDueResolverService.deriveDueFromObjectiveMastery('school-1', 'student-1', node.nodeId, 'Objective', 'Mastery due', 'still_learning');
    expect(due.priority).toBe('high');
  });

  it('derives due from study plan', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Plan', 'Test');
    const due = revisionDueResolverService.deriveDueFromStudyPlan('school-1', 'student-1', node.nodeId, 'Study plan', 'Due step', true);
    expect(due.priority).toBe('high');
  });

  it('derives due from daily check with teach-back', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Check', 'Test');
    const due = revisionDueResolverService.deriveDueFromDailyCheck('school-1', 'student-1', node.nodeId, 'Daily check', 'Needs teach-back', false, true);
    expect(due.recommendedAction).toBe('start_teach_back');
  });

  it('dedupes repeated due items', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Test', 'Test node');
    const items = [
      revisionDueResolverService.deriveDueFromGrowthPage('school-1', 'student-1', node.nodeId, 'A', 'Summary A'),
      revisionDueResolverService.deriveDueFromGrowthPage('school-1', 'student-1', node.nodeId, 'B', 'Summary B'),
    ];
    const deduped = revisionDueResolverService.dedupeRevisionDueItems(items);
    expect(deduped.length).toBe(1);
  });

  it('marks due item completed', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Test', 'Test node');
    const due = revisionDueResolverService.deriveDueFromGrowthPage('school-1', 'student-1', node.nodeId, 'Test item', 'Test summary');
    const completed = revisionDueResolverService.markRevisionDueItemCompleted(due.dueItemId);
    expect(completed!.isCompleted).toBe(true);
  });

  it('limits due items', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Test', 'Test node');
    for (let i = 0; i < 5; i++) {
      revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', `N${i}`, `Node ${i}`);
    }
    const items = new Array(5).fill(null).map((_, i) =>
      revisionDueResolverService.deriveDueFromGrowthPage('school-1', 'student-1', node.nodeId, `Item ${i}`, `Summary ${i}`)
    );
    const limited = revisionDueResolverService.limitRevisionDueItems(items, 2);
    expect(limited.length).toBe(2);
  });
});
