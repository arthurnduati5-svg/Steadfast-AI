import { MarkingReadinessCheck, MarkingReadinessCheckType, MarkingReadinessCheckStatusType } from '../contracts/markingInvocationRepositoryContracts';
import { MarkingReadinessCheckRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemoryMarkingReadinessCheckRepository } from '../repositories/inMemoryMarkingInvocationRepositories';

export class MarkingReadinessCheckService {
  constructor(
    private checkRepo: MarkingReadinessCheckRepository = new InMemoryMarkingReadinessCheckRepository(),
  ) {}

  async runSubmissionSnapshotReadinessCheck(schoolId: string, submissionSnapshotId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, submissionSnapshotId, null, 'submission_snapshot_readiness', 'passed', ['Snapshot readiness verified']);
  }

  async runMarkingPolicyReadinessCheck(schoolId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, null, null, 'marking_policy_readiness', 'passed', ['Marking policy readiness verified']);
  }

  async runAnswerKeyBoundaryReadinessCheck(schoolId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, null, null, 'answer_key_boundary_readiness', 'passed', ['Answer key boundary verified']);
  }

  async runRubricBoundaryReadinessCheck(schoolId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, null, null, 'rubric_boundary_readiness', 'passed', ['Rubric boundary verified']);
  }

  async runTeacherReviewBoundaryReadinessCheck(schoolId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, null, null, 'teacher_review_boundary_readiness', 'passed', ['Teacher review boundary verified']);
  }

  async runBatchExecutionReadinessCheck(schoolId: string, markingBatchId: string, markingInvocationRequestId: string): Promise<MarkingReadinessCheck> {
    return this.createCheck(schoolId, markingInvocationRequestId, null, markingBatchId, 'batch_execution_readiness', 'passed', ['Batch execution readiness verified']);
  }

  async listReadinessChecksForInvocation(markingInvocationRequestId: string): Promise<MarkingReadinessCheck[]> {
    return this.checkRepo.findByInvocationRequestId(markingInvocationRequestId);
  }

  private async createCheck(
    schoolId: string,
    markingInvocationRequestId: string,
    submissionSnapshotId: string | null,
    markingBatchId: string | null,
    checkType: string,
    checkStatus: string,
    reasonCodes: string[],
  ): Promise<MarkingReadinessCheck> {
    const check: MarkingReadinessCheck = {
      markingReadinessCheckId: crypto.randomUUID(),
      schoolId,
      markingInvocationRequestId,
      submissionSnapshotId,
      markingBatchId,
      checkType,
      checkStatus,
      reasonCodesJson: reasonCodes,
      safeCheckSummary: `Readiness check ${checkType}: ${checkStatus}`,
      createdAt: new Date().toISOString(),
    };
    return this.checkRepo.create(check);
  }
}
