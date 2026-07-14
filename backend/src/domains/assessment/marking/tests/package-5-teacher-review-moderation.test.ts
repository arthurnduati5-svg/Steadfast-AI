import { describe, it, expect } from 'vitest';
import { TeacherReviewQueueService } from '../services/teacherReviewQueueService';
import { TeacherOverrideService } from '../services/teacherOverrideService';
import { ModerationService } from '../services/moderationService';
import { MarkingRunService } from '../services/markingRunService';
import { InMemoryTeacherReviewGroupRepository, InMemoryTeacherReviewItemRepository, InMemoryMarkingResultVersionRepository, InMemoryTeacherOverrideRepository, InMemoryModerationDecisionRepository } from '../repositories/inMemoryMarkingRepositories';
import { SubmittedAnswerSnapshot } from '../contracts/markingContracts';
import { MarkingInputSnapshot } from '../contracts/markingResultContracts';

describe('Package 5 - Teacher Review and Moderation', () => {
  it('low-confidence result creates TeacherReviewItem', async () => {
    const itemRepo = new InMemoryTeacherReviewItemRepository();
    const queue = new TeacherReviewQueueService(new InMemoryTeacherReviewGroupRepository(), itemRepo);
    const item = await queue.createReviewItem({
      schoolId: 'school-1', markingRunId: 'run-1', markingResultVersionId: 'result-1',
      reasonCode: 'low_confidence', safeSummary: 'Low confidence marking',
    });
    expect(item.status).toBe('open');
    expect(item.reviewReasonCode).toBe('low_confidence');
    const found = await itemRepo.findById(item.teacherReviewItemId);
    expect(found).toBeTruthy();
  });

  it('similar review items group into TeacherReviewGroup', async () => {
    const groupRepo = new InMemoryTeacherReviewGroupRepository();
    const queue = new TeacherReviewQueueService(groupRepo, new InMemoryTeacherReviewItemRepository());
    const group = await queue.createOrUpdateReviewGroup({
      schoolId: 'school-1', markingRunId: 'run-1',
      groupType: 'same_question_same_pattern', reasonCode: 'low_confidence',
      questionId: 'q-1', questionVersionId: 'qv-1',
      safeSummary: 'Group test', recommendedAction: 'Review',
    });
    expect(group.groupType).toBe('same_question_same_pattern');
    expect(group.itemCount).toBe(1);
    const updated = await queue.createOrUpdateReviewGroup({
      schoolId: 'school-1', markingRunId: 'run-1',
      groupType: 'same_question_same_pattern', reasonCode: 'low_confidence',
      questionId: 'q-1', questionVersionId: 'qv-1',
      safeSummary: 'Group test 2', recommendedAction: 'Review',
    });
    expect(updated.itemCount).toBe(2);
  });

  it('teacher can assign review item', async () => {
    const itemRepo = new InMemoryTeacherReviewItemRepository();
    const queue = new TeacherReviewQueueService(new InMemoryTeacherReviewGroupRepository(), itemRepo);
    const item = await queue.createReviewItem({
      schoolId: 'school-1', markingRunId: 'run-1', markingResultVersionId: 'result-1',
      reasonCode: 'teacher_required', safeSummary: 'Review needed',
    });
    const assigned = await queue.assignReviewItem(item.teacherReviewItemId, 'teacher-1');
    expect(assigned.status).toBe('assigned');
    expect(assigned.assignedToActorId).toBe('teacher-1');
  });

  it('teacher can resolve review item', async () => {
    const itemRepo = new InMemoryTeacherReviewItemRepository();
    const queue = new TeacherReviewQueueService(new InMemoryTeacherReviewGroupRepository(), itemRepo);
    const item = await queue.createReviewItem({
      schoolId: 'school-1', markingRunId: 'run-1', markingResultVersionId: 'result-1',
      reasonCode: 'teacher_required', safeSummary: 'Review needed',
    });
    const resolved = await queue.resolveReviewItem(item.teacherReviewItemId, 'Marks confirmed');
    expect(resolved.status).toBe('resolved');
    expect(resolved.resolvedAt).toBeTruthy();
  });

  it('teacher override records previous and new marks', async () => {
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    const result = await resultRepo.create({
      markingResultVersionId: 'rv-1', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const overrideService = new TeacherOverrideService(
      new InMemoryTeacherOverrideRepository(),
      resultRepo,
    );
    const override = await overrideService.adjustMarks({
      markingResultVersionId: 'rv-1', previousMarks: 0, newMarks: 1,
      overrideReasonCode: 'partial_credit', safeReason: 'Student showed understanding.',
      actorId: 'teacher-1', role: 'teacher',
    });
    expect(override.previousMarks).toBe(0);
    expect(override.newMarks).toBe(1);
    expect(override.decision).toBe('adjust_marks');
    const updated = await resultRepo.findById('rv-1');
    expect(updated!.marksAwarded).toBe(1);
    expect(updated!.status).toBe('teacher_overridden');
  });

  it('teacher override requires safe reason code', async () => {
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-2', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 0, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const overrideService = new TeacherOverrideService();
    await expect(overrideService.adjustMarks({
      markingResultVersionId: 'rv-2', previousMarks: 0, newMarks: 1,
      overrideReasonCode: '', safeReason: '',
      actorId: 'teacher-1', role: 'teacher',
    })).rejects.toThrow();
  });

  it('moderation can uphold a result', async () => {
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-mod-uphold', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'multiple_choice',
      markingMethod: 'deterministic_choice', marksAwarded: 1, marksAvailable: 1,
      confidence: 1, requiresTeacherReview: false, reviewReasonCode: '',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const modService = new ModerationService(new InMemoryModerationDecisionRepository(), resultRepo);
    const mod = await modService.createModerationDecision({
      schoolId: 'school-1', markingResultVersionId: 'rv-mod-uphold',
      decision: 'uphold', safeReason: 'Marking is correct.',
      decidedByActorId: 'admin-1', decidedByRole: 'admin',
    });
    expect(mod.decision).toBe('uphold');
    expect(mod.status).toBe('pending');
  });

  it('moderation can adjust a result', async () => {
    const resultRepo = new InMemoryMarkingResultVersionRepository();
    await resultRepo.create({
      markingResultVersionId: 'rv-adjust', schoolId: 'school-1', markingRunId: 'run-1',
      questionId: 'q-1', questionVersionId: 'qv-1', answerSnapshotRef: 'snap-1',
      resultVersionNumber: 1, status: 'provisional', questionType: 'essay',
      markingMethod: 'teacher_required', marksAwarded: 2, marksAvailable: 5,
      confidence: 0, requiresTeacherReview: true, reviewReasonCode: 'essay_default_review',
      safeStudentFeedback: '', safeTeacherSummary: '', createdByActorId: 'sys',
      createdByRole: 'system_job', createdAt: new Date().toISOString(),
    });
    const modService = new ModerationService(new InMemoryModerationDecisionRepository(), resultRepo);
    const mod = await modService.createModerationDecision({
      schoolId: 'school-1', markingResultVersionId: 'rv-adjust',
      decision: 'adjust', safeReason: 'Moderation adjustment.',
      decidedByActorId: 'hod-1', decidedByRole: 'department_head',
    });
    const adjusted = await modService.adjustThroughModeration(mod.moderationDecisionId, 4, 'Partial credit awarded');
    expect(adjusted.status).toBe('adjusted');
    const result = await resultRepo.findById('rv-adjust');
    expect(result!.marksAwarded).toBe(4);
  });

  it('student/parent cannot perform teacher review', async () => {
    const queue = new TeacherReviewQueueService();
    await expect(queue.assignReviewItem('item-1', 'student-1')).rejects.toThrow();
  });

  it('student/parent cannot moderate', async () => {
    const modService = new ModerationService();
    await expect(modService.createModerationDecision({
      schoolId: 'school-1', markingResultVersionId: 'rv-1',
      decision: 'uphold', safeReason: 'test',
      decidedByActorId: 'student-1', decidedByRole: 'student',
    })).rejects.toThrow('FORBIDDEN');
  });

  it('moderation requires lead_teacher, department_head, or admin', async () => {
    const modService = new ModerationService();
    await expect(modService.createModerationDecision({
      schoolId: 'school-1', markingResultVersionId: 'rv-1',
      decision: 'uphold', safeReason: 'test',
      decidedByActorId: 'teacher-1', decidedByRole: 'teacher',
    })).rejects.toThrow('FORBIDDEN');
  });
});
