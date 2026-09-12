import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionNodeService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('creates learner node safely', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'My note', 'A safe learner note');
    expect(node.nodeId).toBeTruthy();
    expect(node.nodeType).toBe('learner_note');
    expect(node.safeTitle).toBe('My note');
    expect(node.studentId).toBe('student-1');
    expect(node.sourceTruth.status).toBe('learner_created_visible');
  });

  it('creates source-required placeholder', () => {
    const node = revisionNodeService.createSourceRequiredPlaceholderNode('school-1', 'student-1', 'Missing source', 'Need approved source');
    expect(node.nodeType).toBe('source_required_placeholder');
    expect(node.sourceTruth.status).toBe('source_required');
  });

  it('creates teacher-support placeholder', () => {
    const node = revisionNodeService.createTeacherSupportPlaceholderNode('school-1', 'student-1', 'Need help', 'Teacher confirmation needed');
    expect(node.nodeType).toBe('teacher_support_placeholder');
    expect(node.sourceTruth.status).toBe('blocked');
  });

  it('creates objective anchor node', () => {
    const node = revisionNodeService.createObjectiveRevisionNode('school-1', 'student-1', 'obj-1', 'Algebra basics', 'Objective anchor', { status: 'approved' });
    expect(node.nodeType).toBe('objective_anchor');
    expect(node.objectiveId).toBe('obj-1');
  });

  it('creates study plan anchor node', () => {
    const node = revisionNodeService.createStudyPlanRevisionNode('school-1', 'student-1', 'Study plan step', 'Plan anchor', { status: 'learner_created_visible' });
    expect(node.nodeType).toBe('study_plan_anchor');
  });

  it('creates growth page anchor node', () => {
    const node = revisionNodeService.createGrowthPageRevisionNode('school-1', 'student-1', 'Growth card', 'Anchor', { status: 'learner_created_visible' });
    expect(node.nodeType).toBe('growth_page_anchor');
  });

  it('creates mistake pattern anchor node', () => {
    const node = revisionNodeService.createMistakePatternRevisionNode('school-1', 'student-1', 'Common error', 'Repair anchor', { status: 'learner_created_visible' });
    expect(node.nodeType).toBe('mistake_pattern_anchor');
  });

  it('creates weak topic anchor node', () => {
    const node = revisionNodeService.createWeakTopicRevisionNode('school-1', 'student-1', 'Weak area', 'Topic anchor', { status: 'learner_created_visible' });
    expect(node.nodeType).toBe('weak_topic_anchor');
  });

  it('lists learner nodes', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note 1', 'First');
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note 2', 'Second');

    const nodes = revisionNodeService.listLearnerRevisionNodes('school-1', 'student-1');
    expect(nodes.length).toBe(2);
  });

  it('pins and archives nodes', () => {
    const node = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Test', 'Test');

    const pinned = revisionNodeService.pinRevisionNode(node.nodeId);
    expect(pinned!.isPinned).toBe(true);

    const archived = revisionNodeService.archiveRevisionNode(node.nodeId);
    expect(archived!.isArchived).toBe(true);
  });

  it('builds learner-safe node title', () => {
    expect(revisionNodeService.buildLearnerSafeNodeTitle('learner_note', 'test')).toBe('Note: test');
    expect(revisionNodeService.buildLearnerSafeNodeTitle('source_required_placeholder', 'test')).toBe('Source Needed: test');
  });

  it('builds learner-safe summary for source-required', () => {
    const summary = revisionNodeService.buildLearnerSafeNodeSummary('source_required_placeholder', 'base');
    expect(summary).toBe('This revision item needs an approved source before you continue.');
  });

  it('builds learner-safe summary for teacher-support', () => {
    const summary = revisionNodeService.buildLearnerSafeNodeSummary('teacher_support_placeholder', 'base');
    expect(summary).toBe('Your teacher can help confirm this part.');
  });
});
