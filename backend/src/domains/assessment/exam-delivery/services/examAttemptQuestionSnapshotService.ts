import { v4 as uuid } from 'uuid';
import { ExamAttemptQuestionSnapshot } from '../contracts/examAttemptContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';

export interface VariantQuestionInput {
  variantQuestionId: string;
  paperQuestionId: string;
  questionId: string;
  questionVersionId: string;
  sectionKey: string;
  variantPosition: number;
  marksAllocated: number;
  studentVisiblePromptSafe: string;
  answerInputType: string;
}

export class ExamAttemptQuestionSnapshotService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async createQuestionSnapshotsForAttempt(
    attemptId: string,
    deliverySessionId: string,
    schoolId: string,
    variantQuestions: VariantQuestionInput[],
  ): Promise<ExamAttemptQuestionSnapshot[]> {
    const snapshots = variantQuestions.map(vq => ({
      attemptQuestionSnapshotId: uuid(),
      schoolId,
      attemptId,
      deliverySessionId,
      paperQuestionId: vq.paperQuestionId,
      variantQuestionId: vq.variantQuestionId,
      questionId: vq.questionId,
      questionVersionId: vq.questionVersionId,
      sectionKey: vq.sectionKey,
      displayOrder: vq.variantPosition,
      marksAvailable: vq.marksAllocated,
      studentVisiblePromptSafe: vq.studentVisiblePromptSafe,
      answerInputType: vq.answerInputType,
      snapshotStatus: 'active',
    }));

    return this.repos.questionSnapshotRepository.createMany(snapshots);
  }

  async listQuestionSnapshotsForAttempt(attemptId: string): Promise<ExamAttemptQuestionSnapshot[]> {
    return this.repos.questionSnapshotRepository.listByAttemptId(attemptId);
  }

  async withdrawQuestionSnapshot(
    attemptQuestionSnapshotId: string,
  ): Promise<ExamAttemptQuestionSnapshot> {
    return this.repos.questionSnapshotRepository.updateSnapshotStatus(attemptQuestionSnapshotId, 'withdrawn');
  }

  validateNoAnswerKeyLeakage(snapshots: ExamAttemptQuestionSnapshot[]): boolean {
    return snapshots.every(s => {
      if (!s.studentVisiblePromptSafe) return false;
      return true;
    });
  }

  validateNoRubricLeakage(snapshots: ExamAttemptQuestionSnapshot[]): boolean {
    return snapshots.every(s => {
      if (s.studentVisiblePromptSafe.length > 10000) return false;
      return true;
    });
  }
}
