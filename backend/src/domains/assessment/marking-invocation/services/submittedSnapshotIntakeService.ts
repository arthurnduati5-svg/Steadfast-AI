import { SubmittedSnapshotIntake } from '../contracts/submittedSnapshotIntakeContracts';
import { SubmittedSnapshotIntakeRepository } from '../contracts/markingInvocationRepositoryContracts';
import { InMemorySubmittedSnapshotIntakeRepository } from '../repositories/inMemoryMarkingInvocationRepositories';
import { MARKING_INVOCATION_POLICY_DEFAULTS } from '../policies/markingInvocationPolicyDefinitions';

export interface SnapshotIntakeInput {
  schoolId: string;
  markingInvocationRequestId: string;
  submissionSnapshotId: string;
  attemptId: string;
  deliverySessionId: string;
  paperId: string;
  paperVersionId: string;
  variantId: string;
  studentRef: string;
  submittedAnswerCount: number;
  questionSnapshotCount: number;
  totalMarksAvailable: number;
  snapshotStatus: string;
}

export class SubmittedSnapshotIntakeService {
  constructor(
    private intakeRepo: SubmittedSnapshotIntakeRepository = new InMemorySubmittedSnapshotIntakeRepository(),
  ) {}

  async intakeSubmissionSnapshot(input: SnapshotIntakeInput): Promise<SubmittedSnapshotIntake> {
    if (!input.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    const policyDefault = MARKING_INVOCATION_POLICY_DEFAULTS.SUBMITTED_SNAPSHOT_INTAKE;
    if (policyDefault) {
      const decision = policyDefault.missingDecision;
      if (!decision.allowed) {
        throw new Error(`POLICY_BLOCKED: ${decision.reasonCode} - ${decision.safeMessage}`);
      }
    }
    const existing = await this.intakeRepo.findBySchoolIdAndSubmissionSnapshotId(input.schoolId, input.submissionSnapshotId);
    if (existing) {
      throw new Error('SNAPSHOT_ALREADY_INTAKEN: This submission snapshot has already been intaken for this school');
    }
    const readinessChecks: string[] = [];
    let readinessStatus = 'ready';
    if (input.snapshotStatus !== 'sealed') {
      readinessChecks.push('unsealed_snapshot');
      readinessStatus = 'unsealed_snapshot';
    }
    if (input.submittedAnswerCount <= 0) {
      readinessChecks.push('missing_answers');
      if (readinessStatus === 'ready') readinessStatus = 'missing_answers';
    }
    if (input.questionSnapshotCount <= 0) {
      readinessChecks.push('missing_question_snapshots');
      if (readinessStatus === 'ready') readinessStatus = 'missing_question_snapshots';
    }
    const now = new Date().toISOString();
    const intake: SubmittedSnapshotIntake = {
      snapshotIntakeId: crypto.randomUUID(),
      schoolId: input.schoolId,
      markingInvocationRequestId: input.markingInvocationRequestId,
      submissionSnapshotId: input.submissionSnapshotId,
      attemptId: input.attemptId,
      deliverySessionId: input.deliverySessionId,
      paperId: input.paperId,
      paperVersionId: input.paperVersionId,
      variantId: input.variantId,
      studentRef: input.studentRef,
      intakeStatus: readinessStatus === 'ready' ? 'ready_for_marking' : 'blocked',
      readinessStatus: readinessStatus as any,
      readinessReasonCodesJson: readinessChecks.length > 0 ? readinessChecks : null,
      safeIntakeSummary: `Intake for snapshot ${input.submissionSnapshotId}: ${readinessStatus}`,
      createdAt: now,
      updatedAt: now,
      blockedAt: readinessStatus !== 'ready' ? now : null,
    };
    return this.intakeRepo.create(intake);
  }

  async bulkIntakeSubmissionSnapshots(inputs: SnapshotIntakeInput[]): Promise<SubmittedSnapshotIntake[]> {
    const results: SubmittedSnapshotIntake[] = [];
    for (const input of inputs) {
      try {
        const result = await this.intakeSubmissionSnapshot(input);
        results.push(result);
      } catch (err: any) {
        if (err.message?.startsWith('SNAPSHOT_ALREADY_INTAKEN')) continue;
        throw err;
      }
    }
    return results;
  }

  async validateSnapshotReadiness(snapshotIntakeId: string): Promise<SubmittedSnapshotIntake> {
    const intake = await this.intakeRepo.findById(snapshotIntakeId);
    if (!intake) throw new Error('NOT_FOUND: Snapshot intake not found');
    if (intake.readinessStatus === 'ready') {
      intake.intakeStatus = 'ready_for_marking';
      intake.updatedAt = new Date().toISOString();
      return this.intakeRepo.update(intake);
    }
    intake.intakeStatus = 'blocked';
    intake.updatedAt = new Date().toISOString();
    return this.intakeRepo.update(intake);
  }

  async getSnapshotIntake(snapshotIntakeId: string): Promise<SubmittedSnapshotIntake | null> {
    return this.intakeRepo.findById(snapshotIntakeId);
  }

  async listSnapshotIntakesForInvocation(markingInvocationRequestId: string): Promise<SubmittedSnapshotIntake[]> {
    return this.intakeRepo.findByInvocationRequestId(markingInvocationRequestId);
  }

  async markSnapshotIntakeBlocked(snapshotIntakeId: string, reason: string): Promise<SubmittedSnapshotIntake> {
    const intake = await this.intakeRepo.findById(snapshotIntakeId);
    if (!intake) throw new Error('NOT_FOUND: Snapshot intake not found');
    intake.intakeStatus = 'blocked';
    intake.readinessStatus = 'blocked_by_policy';
    intake.safeIntakeSummary = reason;
    intake.updatedAt = new Date().toISOString();
    intake.blockedAt = new Date().toISOString();
    return this.intakeRepo.update(intake);
  }
}
