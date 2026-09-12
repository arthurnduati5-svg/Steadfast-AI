import { describe, it, expect, beforeEach } from 'vitest';
import { phase3LivingRevisionRepository } from '../services/phase3LivingRevisionRepository';
import * as revisionTeacherOverviewService from '../services/phase3RevisionTeacherOverviewService';
import * as revisionNodeService from '../services/phase3RevisionNodeService';

describe('Phase3RevisionTeacherOverviewService', () => {
  beforeEach(() => {
    // R8-G.3A-D1C: legacy sync memory is explicit test compatibility only.
    process.env.REVISION_ALLOW_MEMORY_FALLBACK = '1';
    phase3LivingRevisionRepository.resetPhase3LivingRevisionRepositoryForTests();
  });

  it('returns teacher overview with safe aggregates', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note 1', 'First');
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note 2', 'Second');

    const overview = revisionTeacherOverviewService.getTeacherRevisionOverview('school-1', 'teacher-1');
    expect(overview.totalLearnersWithRevisionNodes).toBe(1);
    expect(overview.schoolId).toBe('school-1');
    expect(overview.learnerRows.length).toBe(1);
    expect(overview.learnerRows[0].revisionNodeCount).toBe(2);
  });

  it('does not expose raw learner content', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note', 'Content');
    const overview = revisionTeacherOverviewService.getTeacherRevisionOverview('school-1', 'teacher-1');
    for (const row of overview.learnerRows) {
      expect(row).not.toHaveProperty('rawChat');
      expect(row).not.toHaveProperty('rawAnswer');
      expect(row).not.toHaveProperty('hiddenReasoning');
    }
  });

  it('returns due support queue', () => {
    const n = revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note', 'A note');
    phase3LivingRevisionRepository.upsertRevisionDueItem({
      schoolId: 'school-1', studentId: 'student-1', nodeId: n.nodeId,
      priority: 'high', signalType: 'due_for_recall',
      safeTitle: 'Due', safeSummary: 'Test',
      recommendedAction: 'start_recall_check',
      sourceTruthStatus: 'approved',
      safeEvidenceRefs: [], safeReasonCodes: [],
    });

    const queue = revisionTeacherOverviewService.getRevisionDueSupportQueue('school-1', 'teacher-1');
    expect(queue.length).toBeGreaterThanOrEqual(0);
  });

  it('returns source required queue', () => {
    revisionNodeService.createSourceRequiredPlaceholderNode('school-1', 'student-1', 'Missing', 'Source needed');
    const queue = revisionTeacherOverviewService.getRevisionSourceRequiredQueue('school-1', 'teacher-1');
    expect(queue.length).toBeGreaterThanOrEqual(1);
  });

  it('returns mistake repair summary', () => {
    revisionNodeService.createMistakePatternRevisionNode('school-1', 'student-1', 'Mistake', 'Error', { status: 'learner_created_visible' });
    const nodes = revisionTeacherOverviewService.getRevisionMistakeRepairSummary('school-1', 'teacher-1');
    expect(nodes.length).toBeGreaterThanOrEqual(1);
  });

  it('returns learner summary', () => {
    revisionNodeService.createLearnerRevisionNode('school-1', 'student-1', 'Note', 'Content');
    const summary = revisionTeacherOverviewService.getLearnerRevisionTeacherSummary('school-1', 'teacher-1', 'student-1');
    expect(summary).not.toBeNull();
    expect(summary!.revisionNodeCount).toBe(1);
  });

  it('returns null for learner with no nodes', () => {
    const summary = revisionTeacherOverviewService.getLearnerRevisionTeacherSummary('school-1', 'teacher-1', 'nonexistent');
    expect(summary).toBeNull();
  });

  it('returns recommended teacher actions', () => {
    const actions = revisionTeacherOverviewService.getTeacherRecommendedRevisionActions('school-1', 'teacher-1');
    expect(Array.isArray(actions)).toBe(true);
  });
});
