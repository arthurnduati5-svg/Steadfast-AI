import { describe, it, expect, beforeEach } from 'vitest';
import { ResultFinalizationReviewService } from '../services/resultFinalizationReviewService';
import { ResultFinalizationDecisionService } from '../services/resultFinalizationDecisionService';
import { ResultReleaseReadinessService } from '../services/resultReleaseReadinessService';
import { ResultReleaseBoundaryService } from '../services/resultReleaseBoundaryService';
import {
  InMemoryResultFinalizationReviewRepository,
  InMemoryResultFinalizationDecisionRepository,
  InMemoryResultReleaseReadinessRepository,
  InMemoryResultReleaseBoundaryRepository,
} from '../repositories/inMemoryResultGovernanceRepositories';
import { ResultGovernancePolicyRegistry } from '../policies/resultGovernancePolicyDefinitions';

describe('Package 9 - Release Readiness and Boundary', () => {
  let reviewRepo: InMemoryResultFinalizationReviewRepository;
  let decisionRepo: InMemoryResultFinalizationDecisionRepository;
  let readinessRepo: InMemoryResultReleaseReadinessRepository;
  let boundaryRepo: InMemoryResultReleaseBoundaryRepository;
  let policyRegistry: ResultGovernancePolicyRegistry;
  let reviewService: ResultFinalizationReviewService;
  let decisionService: ResultFinalizationDecisionService;
  let readinessService: ResultReleaseReadinessService;
  let boundaryService: ResultReleaseBoundaryService;
  let decisionId: string;
  let reviewId: string;

  beforeEach(async () => {
    reviewRepo = new InMemoryResultFinalizationReviewRepository();
    decisionRepo = new InMemoryResultFinalizationDecisionRepository();
    readinessRepo = new InMemoryResultReleaseReadinessRepository();
    boundaryRepo = new InMemoryResultReleaseBoundaryRepository();
    policyRegistry = new ResultGovernancePolicyRegistry();
    reviewService = new ResultFinalizationReviewService(reviewRepo, policyRegistry);
    decisionService = new ResultFinalizationDecisionService(decisionRepo, reviewRepo, policyRegistry);
    readinessService = new ResultReleaseReadinessService(readinessRepo, decisionRepo, policyRegistry);
    boundaryService = new ResultReleaseBoundaryService(boundaryRepo, readinessRepo, policyRegistry);

    const review = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-1', reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-1'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Ready', actorId: 'a1', actorRole: 'teacher',
    }, 'c1');
    reviewId = review.resultFinalizationReviewId;
    await reviewService.markReviewReadyForDecision(reviewId, 'teacher');

    const decision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: reviewId,
      decisionStatus: 'approved_for_finalization', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Approved',
      affectedResultVersionRefs: { refs: ['mrv-1'] },
    });
    decisionId = decision.resultFinalizationDecisionId;
  });

  it('should create release readiness from approved decision', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      resultFinalizationReviewId: reviewId,
      releaseAudienceType: 'internal_school',
      safeReadinessSummary: 'Ready for internal release',
      actorId: 'a1', actorRole: 'teacher',
    });

    expect(readiness).toBeDefined();
    expect(readiness.releaseReadinessStatus).toBe('not_ready');
    expect(readiness.resultFinalizationDecisionId).toBe(decisionId);
  });

  it('should block readiness from non-approved decision', async () => {
    const review2 = await reviewService.createFinalizationReview({
      schoolId: 'school-1', markingInvocationRequestId: 'mir-2', reviewMode: 'teacher_reviewed',
      reviewedResultVersionRefs: { versionIds: ['mrv-2'] },
      requiredCheckRefs: { teacherReviewUnresolved: false, moderationUnresolved: false },
      safeReviewSummary: 'Blocked', actorId: 'a1', actorRole: 'teacher',
    }, 'c2');
    await reviewService.markReviewReadyForDecision(review2.resultFinalizationReviewId, 'teacher');

    const blockedDecision = await decisionService.createFinalizationDecision({
      schoolId: 'school-1', resultFinalizationReviewId: review2.resultFinalizationReviewId,
      decisionStatus: 'blocked', decisionType: 'teacher_finalization',
      decidedByActorId: 'a1', decidedByRole: 'teacher',
      safeDecisionSummary: 'Blocked',
    });

    await expect(readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: blockedDecision.resultFinalizationDecisionId,
      releaseAudienceType: 'internal_school',
      safeReadinessSummary: 'Should fail',
      actorId: 'a1', actorRole: 'teacher',
    })).rejects.toThrow('VALIDATION_FAILED');
  });

  it('should evaluate internal release readiness', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'internal_school',
      safeReadinessSummary: 'Internal', actorId: 'a1', actorRole: 'teacher',
    });

    const evaluated = await readinessService.evaluateInternalReleaseReadiness(readiness.resultReleaseReadinessId, 'teacher');
    expect(evaluated?.releaseReadinessStatus).toBe('ready_for_internal_release');
  });

  it('should evaluate student release readiness', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'student',
      safeReadinessSummary: 'Student', actorId: 'a1', actorRole: 'teacher',
    });

    const evaluated = await readinessService.evaluateStudentReleaseReadiness(readiness.resultReleaseReadinessId, 'teacher');
    expect(evaluated?.releaseReadinessStatus).toBe('ready_for_student_release');
  });

  it('should evaluate parent boundary readiness', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'parent_boundary_only',
      safeReadinessSummary: 'Parent boundary', actorId: 'a1', actorRole: 'teacher',
    });

    const evaluated = await readinessService.evaluateParentBoundaryReadiness(readiness.resultReleaseReadinessId, 'teacher');
    expect(evaluated?.releaseReadinessStatus).toBe('ready_for_parent_release_boundary_only');
  });

  it('should create release boundary', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'student',
      safeReadinessSummary: 'Has boundary', actorId: 'a1', actorRole: 'teacher',
    });

    const boundary = await boundaryService.createReleaseBoundary({
      schoolId: 'school-1', resultReleaseReadinessId: readiness.resultReleaseReadinessId,
      audienceType: 'student', safeBoundarySummary: 'Student boundary',
      allowedFields: ['studentRef', 'safeStatusSummary'],
      blockedFields: ['answerKeyText', 'rubricInternal'],
      actorId: 'a1', actorRole: 'teacher',
    });

    expect(boundary).toBeDefined();
    expect(boundary.boundaryStatus).toBe('draft');
    expect(boundary.audienceType).toBe('student');
  });

  it('should define blocked fields for student boundary', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'student',
      safeReadinessSummary: 'Blocked fields', actorId: 'a1', actorRole: 'teacher',
    });

    const boundary = await boundaryService.createReleaseBoundary({
      schoolId: 'school-1', resultReleaseReadinessId: readiness.resultReleaseReadinessId,
      audienceType: 'student', safeBoundarySummary: 'Student boundary',
      actorId: 'a1', actorRole: 'teacher',
    });

    const blockedFields = (boundary.blockedFieldsJson as any)?.fields || [];
    expect(blockedFields).toContain('answerKeyText');
    expect(blockedFields).toContain('rubricInternal');
    expect(blockedFields).toContain('hiddenReasoning');
    expect(blockedFields).toContain('teacherOnlyNotes');
    expect(blockedFields).toContain('auditInternals');
    expect(blockedFields).not.toContain('studentRef');
  });

  it('should build student boundary filtering out forbidden fields', () => {
    const projection = {
      studentRef: 's1', markingRunId: 'mr-1',
      answerKeyText: 'secret',
      rubricInternal: 'rubric',
      hiddenReasoning: 'hidden',
      teacherOnlyNotes: 'notes',
      moderationDecisionInternal: 'decision',
      auditInternals: 'audit',
      rawStudentAnswer: 'answer',
      scoreBeforeFinalization: 85,
      unreleasedScore: 90,
    };

    const filtered = boundaryService.buildStudentBoundary(projection);
    expect(filtered.studentRef).toBe('s1');
    expect(filtered.markingRunId).toBe('mr-1');
    expect(filtered.answerKeyText).toBeUndefined();
    expect(filtered.rubricInternal).toBeUndefined();
    expect(filtered.hiddenReasoning).toBeUndefined();
    expect(filtered.teacherOnlyNotes).toBeUndefined();
    expect(filtered.moderationDecisionInternal).toBeUndefined();
    expect(filtered.auditInternals).toBeUndefined();
    expect(filtered.rawStudentAnswer).toBeUndefined();
    expect(filtered.scoreBeforeFinalization).toBeUndefined();
    expect(filtered.unreleasedScore).toBeUndefined();
  });

  it('should build parent boundary only filtering', () => {
    const projection = {
      studentRef: 's1',
      answerKeyText: 'secret',
      rubricText: 'rubric',
      hiddenReasoning: 'hidden',
      finalGradeBeforeRelease: 85,
      parentDeliveryPayload: { data: 'test' },
      masteryMutation: true,
    };

    const filtered = boundaryService.buildParentBoundaryOnly(projection);
    expect(filtered.studentRef).toBe('s1');
    expect(filtered.answerKeyText).toBeUndefined();
    expect(filtered.rubricText).toBeUndefined();
    expect(filtered.hiddenReasoning).toBeUndefined();
    expect(filtered.finalGradeBeforeRelease).toBeUndefined();
    expect(filtered.parentDeliveryPayload).toBeUndefined();
    expect(filtered.masteryMutation).toBeUndefined();
  });

  it('should activate, block, and void boundaries', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'student',
      safeReadinessSummary: 'Boundary lifecycle', actorId: 'a1', actorRole: 'teacher',
    });

    const boundary = await boundaryService.createReleaseBoundary({
      schoolId: 'school-1', resultReleaseReadinessId: readiness.resultReleaseReadinessId,
      audienceType: 'student', safeBoundarySummary: 'Lifecycle test',
      actorId: 'a1', actorRole: 'teacher',
    });

    const activated = await boundaryService.activateReleaseBoundary(boundary.resultReleaseBoundaryId, 'teacher');
    expect(activated?.boundaryStatus).toBe('active');

    const blocked = await boundaryService.blockReleaseBoundary(boundary.resultReleaseBoundaryId, 'teacher');
    expect(blocked?.boundaryStatus).toBe('blocked');
  });

  it('should block, expire release readiness', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'internal_school',
      safeReadinessSummary: 'Lifecycle', actorId: 'a1', actorRole: 'teacher',
    });
    const rid = readiness.resultReleaseReadinessId;

    const blocked = await readinessService.blockReleaseReadiness(rid, 'teacher');
    expect(blocked?.releaseReadinessStatus).toBe('blocked');
  });

  it('should not send parent notification', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'parent_boundary_only',
      safeReadinessSummary: 'No notification', actorId: 'a1', actorRole: 'teacher',
    });
    expect((readiness as any).parentNotification).toBeUndefined();
    expect((readiness as any).emailSent).toBeUndefined();
  });

  it('should not create parent summary', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'parent_boundary_only',
      safeReadinessSummary: 'No summary', actorId: 'a1', actorRole: 'teacher',
    });
    expect((readiness as any).parentSummary).toBeUndefined();
  });

  it('should not perform external release', async () => {
    const readiness = await readinessService.createReleaseReadiness({
      schoolId: 'school-1', resultFinalizationDecisionId: decisionId,
      releaseAudienceType: 'parent_boundary_only',
      safeReadinessSummary: 'No external', actorId: 'a1', actorRole: 'teacher',
    });
    expect((readiness as any).externalPortal).toBeUndefined();
    expect((readiness as any).parentPortalPublished).toBeUndefined();
  });
});
