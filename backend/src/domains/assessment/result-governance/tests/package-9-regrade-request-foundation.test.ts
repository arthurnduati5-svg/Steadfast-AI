import { describe, it, expect, beforeEach } from 'vitest';
import { ResultRegradeRequestService, ResultRegradeIntakeService } from '../services/resultRegradeRequestService';
import {
  InMemoryResultRegradeRequestRepository,
  InMemoryResultRegradeIntakeRepository,
} from '../repositories/inMemoryResultGovernanceRepositories';
import { ResultGovernancePolicyRegistry } from '../policies/resultGovernancePolicyDefinitions';

describe('Package 9 - Regrade Request Foundation', () => {
  let regradeRequestRepo: InMemoryResultRegradeRequestRepository;
  let regradeIntakeRepo: InMemoryResultRegradeIntakeRepository;
  let policyRegistry: ResultGovernancePolicyRegistry;
  let regradeRequestService: ResultRegradeRequestService;
  let regradeIntakeService: ResultRegradeIntakeService;

  beforeEach(() => {
    regradeRequestRepo = new InMemoryResultRegradeRequestRepository();
    regradeIntakeRepo = new InMemoryResultRegradeIntakeRepository();
    policyRegistry = new ResultGovernancePolicyRegistry();
    regradeRequestService = new ResultRegradeRequestService(regradeRequestRepo, policyRegistry);
    regradeIntakeService = new ResultRegradeIntakeService(regradeIntakeRepo, regradeRequestRepo, policyRegistry);
  });

  it('should create regrade request for existing result version', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1',
      markingResultVersionId: 'mrv-1',
      markingRunId: 'mr-1',
      studentRef: 'student-1',
      requesterActorId: 'student-1',
      requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'I think my answer was correct',
      reasonCodes: { reason: 'answer_marked_wrong' },
    });

    expect(request).toBeDefined();
    expect(request.markingResultVersionId).toBe('mrv-1');
    expect(request.studentRef).toBe('student-1');
    expect(request.requestStatus).toBe('submitted');
    expect(request.resultRegradeRequestId).toBeTruthy();
  });

  it('should accept student challenge only for own studentRef', async () => {
    // Student-1 creates request for own studentRef -> should succeed
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Own challenge',
    });
    expect(request).toBeDefined();

    // Student-1 creates request for student-2 -> should fail
    await expect(regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-2', studentRef: 'student-2',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Not own challenge',
    })).rejects.toThrow('FORBIDDEN');
  });

  it('should accept teacher quality review by teacher role', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'teacher-1', requesterRole: 'teacher',
      requestType: 'teacher_quality_review',
      safeRequestSummary: 'Quality review needed',
    });
    expect(request.requestType).toBe('teacher_quality_review');
  });

  it('should cancel a request', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Cancel test',
    });
    const cancelled = await regradeRequestService.cancelRegradeRequest(request.resultRegradeRequestId, 'admin');
    expect(cancelled?.requestStatus).toBe('cancelled');
    expect(cancelled?.cancelledAt).toBeTruthy();
  });

  it('should reject a request', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Reject test',
    });
    const rejected = await regradeRequestService.rejectRegradeRequest(request.resultRegradeRequestId, 'admin');
    expect(rejected?.requestStatus).toBe('rejected');
  });

  it('should accept request for review', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Accept test',
    });
    const accepted = await regradeRequestService.acceptRegradeRequestForReview(request.resultRegradeRequestId, 'admin');
    expect(accepted?.requestStatus).toBe('accepted_for_review');
  });

  it('should resolve without change', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Resolve test',
    });
    const resolved = await regradeRequestService.resolveWithoutChange(request.resultRegradeRequestId, 'admin');
    expect(resolved?.requestStatus).toBe('resolved_without_change');
    expect(resolved?.resolvedAt).toBeTruthy();
  });

  it('should defer a request', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Defer test',
    });
    const deferred = await regradeRequestService.deferRegradeRequest(request.resultRegradeRequestId, 'admin');
    expect(deferred?.requestStatus).toBe('deferred');
  });

  it('should create regrade intake', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Intake test',
    });
    const intake = await regradeIntakeService.createRegradeIntake({
      schoolId: 'school-1',
      resultRegradeRequestId: request.resultRegradeRequestId,
      safeIntakeSummary: 'Intake received',
    });
    expect(intake).toBeDefined();
    expect(intake.intakeStatus).toBe('received');
  });

  it('should assign regrade reviewer', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Assign reviewer test',
    });
    const intake = await regradeIntakeService.createRegradeIntake({
      schoolId: 'school-1',
      resultRegradeRequestId: request.resultRegradeRequestId,
      safeIntakeSummary: 'Intake for assignment',
    });

    const assigned = await regradeIntakeService.assignRegradeReviewer(intake.resultRegradeIntakeId, 'teacher-2', 'teacher', 'admin');
    expect(assigned?.intakeStatus).toBe('assigned');
    expect(assigned?.assignedReviewerActorId).toBe('teacher-2');
  });

  it('should complete intake lifecycle', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Full lifecycle',
    });
    const intake = await regradeIntakeService.createRegradeIntake({
      schoolId: 'school-1',
      resultRegradeRequestId: request.resultRegradeRequestId,
      safeIntakeSummary: 'Intake lifecycle',
    });

    const accepted = await regradeIntakeService.acceptRegradeIntake(intake.resultRegradeIntakeId, 'admin');
    expect(accepted?.intakeStatus).toBe('accepted');

    const completed = await regradeIntakeService.completeRegradeIntake(intake.resultRegradeIntakeId, 'admin');
    expect(completed?.intakeStatus).toBe('completed');
    expect(completed?.completedAt).toBeTruthy();
  });

  it('should reject and block intake', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'Reject/block test',
    });
    const intake = await regradeIntakeService.createRegradeIntake({
      schoolId: 'school-1',
      resultRegradeRequestId: request.resultRegradeRequestId,
      safeIntakeSummary: 'Intake reject/block',
    });

    const rejected = await regradeIntakeService.rejectRegradeIntake(intake.resultRegradeIntakeId, 'admin');
    expect(rejected?.intakeStatus).toBe('rejected');
  });

  it('should not perform automatic regrading execution', async () => {
    // Verify no regrading execution methods exist on the service
    expect((regradeRequestService as any).executeRegrade).toBeUndefined();
    expect((regradeRequestService as any).performRegrade).toBeUndefined();
    expect((regradeRequestService as any).changeScore).toBeUndefined();

    // Verify no score changes happen
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'No score change',
    });
    expect((request as any).marksAwarded).toBeUndefined();
    expect((request as any).marksChanged).toBeUndefined();
  });

  it('should not mutate result versions', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'No mutation',
    });
    // The request references but does not change the marking result version
    expect(request.markingResultVersionId).toBe('mrv-1');
    expect((request as any).status).toBeUndefined(); // Not a marking result version
    expect(request.requestStatus).toBeDefined(); // This is the regrade request's own status
  });

  it('should not send parent notification', async () => {
    const request = await regradeRequestService.createRegradeRequest({
      schoolId: 'school-1', markingResultVersionId: 'mrv-1', studentRef: 'student-1',
      requesterActorId: 'student-1', requesterRole: 'student',
      requestType: 'student_challenge_escalation',
      safeRequestSummary: 'No parent notify',
    });
    expect((request as any).parentNotificationSent).toBeUndefined();
    expect((request as any).parentEmail).toBeUndefined();
  });
});
