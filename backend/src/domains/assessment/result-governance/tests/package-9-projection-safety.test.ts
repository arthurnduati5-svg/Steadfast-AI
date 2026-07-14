import { describe, it, expect, beforeEach } from 'vitest';
import { ResultGovernanceProjectionSafetyService } from '../services/resultGovernanceProjectionSafetyService';
import type { ResultFinalizationReview, ResultFinalizationDecision, ResultReleaseReadiness, ResultReleaseBoundary } from '../contracts/index';

describe('Package 9 - Projection Safety', () => {
  let projectionService: ResultGovernanceProjectionSafetyService;

  beforeEach(() => {
    projectionService = new ResultGovernanceProjectionSafetyService();
  });

  const mockReview: ResultFinalizationReview = {
    resultFinalizationReviewId: 'review-1',
    schoolId: 'school-1',
    markingInvocationRequestId: 'mir-1',
    markingRunId: 'mr-1',
    reviewStatus: 'ready_for_decision',
    reviewMode: 'teacher_reviewed',
    safeReviewSummary: 'Review summary',
    createdByActorId: 'teacher-1',
    createdByRole: 'teacher',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDecision: ResultFinalizationDecision = {
    resultFinalizationDecisionId: 'decision-1',
    schoolId: 'school-1',
    resultFinalizationReviewId: 'review-1',
    decisionStatus: 'approved_for_finalization',
    decisionType: 'teacher_finalization',
    decidedByActorId: 'admin-1',
    decidedByRole: 'admin',
    safeDecisionSummary: 'Approved',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  it('should create teacher projection with safe governance status', () => {
    const projection = projectionService.toTeacherProjection(mockReview, mockDecision);
    expect(projection.resultFinalizationReviewId).toBe('review-1');
    expect(projection.reviewStatus).toBe('ready_for_decision');
    expect(projection.finalizationDecisionStatus).toBe('approved_for_finalization');
    expect(projection.nextAllowedActions).toBeDefined();
    expect(projection.nextAllowedActions.length).toBeGreaterThanOrEqual(1);
  });

  it('should create admin projection with operational counts', () => {
    const projection = projectionService.toAdminProjection([mockReview], [mockDecision]);
    expect(projection.schoolId).toBe('school-1');
    expect(projection.totalReviewCount).toBe(1);
    expect(projection.blockedCount).toBe(0);
    expect(projection.completedCount).toBe(0);
    expect(projection.finalizationDecisionStatus).toBe('approved_for_finalization');
  });

  it('should create student-safe projection excluding answer keys', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect(projection.studentRef).toBe('student-1');
    expect((projection as any).answerKeySafeRef).toBeUndefined();
    expect((projection as any).answerKeyText).toBeUndefined();
    expect((projection as any).correctAnswerSummary).toBeUndefined();
  });

  it('should create student-safe projection excluding raw rubrics', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect((projection as any).rubricInternal).toBeUndefined();
    expect((projection as any).rubricText).toBeUndefined();
  });

  it('should create student-safe projection excluding hidden reasoning', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect((projection as any).hiddenReasoning).toBeUndefined();
    expect((projection as any).chainOfThought).toBeUndefined();
  });

  it('should create student-safe projection excluding teacher-only notes', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect((projection as any).markingNotesTeacherOnly).toBeUndefined();
    expect((projection as any).teacherOnlyNotes).toBeUndefined();
  });

  it('should create student-safe projection excluding unreleased scores', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect((projection as any).scoreBeforeFinalization).toBeUndefined();
    expect((projection as any).unreleasedScore).toBeUndefined();
    expect((projection as any).finalGradeBeforeRelease).toBeUndefined();
  });

  it('should create student-safe projection excluding parent delivery payload', () => {
    const projection = projectionService.toStudentSafeProjection('student-1', mockReview, mockDecision);
    expect((projection as any).parentDeliveryPayload).toBeUndefined();
  });

  it('should create parent-boundary projection as boundary only', () => {
    const mockBoundary: ResultReleaseBoundary = {
      resultReleaseBoundaryId: 'boundary-1',
      schoolId: 'school-1',
      resultReleaseReadinessId: 'readiness-1',
      audienceType: 'parent_boundary_only',
      boundaryStatus: 'draft',
      allowedFieldsJson: { fields: ['studentRef', 'safeBoundarySummary'] },
      blockedFieldsJson: { fields: ['answerKeyText', 'rubricInternal', 'hiddenReasoning', 'teacherOnlyNotes', 'unreleasedScore', 'parentDeliveryPayload'] },
      safeBoundarySummary: 'Parent boundary contract',
      createdByActorId: 'admin-1',
      createdByRole: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const projection = projectionService.toParentBoundaryProjection('student-1', mockBoundary);
    expect(projection.studentRef).toBe('student-1');
    expect(projection.releaseBoundaryId).toBe('boundary-1');
    expect(projection.allowedFieldNames).toContain('studentRef');
    expect(projection.blockedFieldNames).toContain('answerKeyText');
    expect(projection.blockedFieldNames).toContain('rubricInternal');
  });

  it('should assert no answer key leakage', () => {
    expect(() => projectionService.assertNoAnswerKeyLeakage({ answerKeyText: 'secret' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoAnswerKeyLeakage({ answerKeySafeRef: 'ref' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoAnswerKeyLeakage({ studentRef: 's1' })).not.toThrow();
  });

  it('should assert no rubric leakage', () => {
    expect(() => projectionService.assertNoRubricLeakage({ rubricInternal: 'secret' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoRubricLeakage({ rubricText: 'text' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoRubricLeakage({ studentRef: 's1' })).not.toThrow();
  });

  it('should assert no teacher-only leakage', () => {
    expect(() => projectionService.assertNoTeacherOnlyLeakage({ markingNotesTeacherOnly: 'notes' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoTeacherOnlyLeakage({ teacherOnlyNotes: 'notes' })).toThrow('FORBIDDEN_FIELD');
  });

  it('should assert no hidden reasoning leakage', () => {
    expect(() => projectionService.assertNoHiddenReasoningLeakage({ hiddenReasoning: 'hidden' })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoHiddenReasoningLeakage({ chainOfThought: 'cot' })).toThrow('FORBIDDEN_FIELD');
  });

  it('should assert no unreleased grade leakage', () => {
    expect(() => projectionService.assertNoUnreleasedGradeLeakage({ scoreBeforeFinalization: 85 })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoUnreleasedGradeLeakage({ unreleasedScore: 90 })).toThrow('FORBIDDEN_FIELD');
    expect(() => projectionService.assertNoUnreleasedGradeLeakage({ finalGradeBeforeRelease: 88 })).toThrow('FORBIDDEN_FIELD');
  });

  it('should assert no parent delivery payload leakage', () => {
    expect(() => projectionService.assertNoParentDeliveryPayloadLeakage({ parentDeliveryPayload: { data: 'test' } })).toThrow('FORBIDDEN_FIELD');
  });

  it('should assert no mastery mutation leakage', () => {
    expect(() => projectionService.assertNoMasteryMutationLeakage({ masteryMutation: { skill: 'math' } })).toThrow('FORBIDDEN_FIELD');
  });

  it('should exclude mastery mutation from projection', () => {
    const projection = projectionService.toStudentSafeProjection('student-1');
    expect((projection as any).masteryMutation).toBeUndefined();
  });

  it('should create finalization preview', () => {
    const preview = projectionService.toFinalizationPreview(mockReview, mockDecision);
    expect(preview.resultFinalizationReviewId).toBe('review-1');
    expect(preview.reviewStatus).toBe('ready_for_decision');
    expect(preview.finalizationDecisionStatus).toBe('approved_for_finalization');
  });

  it('should create release readiness preview', () => {
    const readiness: ResultReleaseReadiness = {
      resultReleaseReadinessId: 'readiness-1',
      schoolId: 'school-1',
      resultFinalizationDecisionId: 'decision-1',
      releaseReadinessStatus: 'ready_for_internal_release',
      releaseAudienceType: 'internal_school',
      safeReadinessSummary: 'Ready',
      createdByActorId: 'admin-1',
      createdByRole: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const preview = projectionService.toReleaseReadinessPreview(readiness);
    expect(preview.releaseReadinessStatus).toBe('ready_for_internal_release');
  });

  it('should create regrade request preview', () => {
    const regrade = {
      resultRegradeRequestId: 'rr-1',
      requestStatus: 'submitted' as const,
      requestType: 'student_challenge_escalation' as const,
      safeRequestSummary: 'Summary',
      createdAt: new Date().toISOString(),
    } as any;
    const preview = projectionService.toRegradeRequestPreview(regrade);
    expect(preview.requestStatus).toBe('submitted');
  });

  it('should build safe status summary correctly', () => {
    const completedReview: ResultFinalizationReview = {
      ...mockReview,
      reviewStatus: 'completed',
    };
    const readyDecision: ResultFinalizationDecision = { ...mockDecision, decisionStatus: 'approved_for_finalization' };
    const readyReadiness: ResultReleaseReadiness = {
      resultReleaseReadinessId: 'r-1', schoolId: 's-1',
      resultFinalizationDecisionId: 'd-1',
      releaseReadinessStatus: 'ready_for_student_release',
      releaseAudienceType: 'student',
      safeReadinessSummary: 'Ready',
      createdByActorId: 'a1', createdByRole: 'admin',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };

    const projection = projectionService.toStudentSafeProjection('student-1', completedReview, readyDecision, readyReadiness);
    expect(projection.safeStatusSummary).toContain('ready for student viewing');
  });
});
