import { StudentMarkChallenge } from '../contracts/studentChallengeContracts';
import { StudentMarkChallengeRepository, MarkingResultVersionRepository } from '../contracts/markingRepositoryContracts';
import { InMemoryStudentMarkChallengeRepository, InMemoryMarkingResultVersionRepository } from '../repositories/inMemoryMarkingRepositories';

export interface SubmitChallengeParams {
  schoolId: string;
  studentId: string;
  markingResultVersionId: string;
  challengeReasonCode: string;
  safeStudentStatement: string;
}

export class StudentChallengeService {
  constructor(
    private challengeRepo: StudentMarkChallengeRepository = new InMemoryStudentMarkChallengeRepository(),
    private resultRepo: MarkingResultVersionRepository = new InMemoryMarkingResultVersionRepository(),
  ) {}

  async submitChallenge(params: SubmitChallengeParams): Promise<StudentMarkChallenge> {
    const result = await this.resultRepo.findById(params.markingResultVersionId);
    if (!result) throw new Error('NOT_FOUND: Marking result not found');

    const now = new Date().toISOString();
    const challenge: StudentMarkChallenge = {
      studentMarkChallengeId: crypto.randomUUID(),
      schoolId: params.schoolId,
      studentId: params.studentId,
      markingResultVersionId: params.markingResultVersionId,
      status: 'submitted',
      challengeReasonCode: params.challengeReasonCode,
      safeStudentStatement: params.safeStudentStatement,
      createdAt: now,
      safeResolutionSummary: '',
    };
    const saved = await this.challengeRepo.create(challenge);
    result.status = 'challenged';
    await this.resultRepo.update(result);
    return saved;
  }

  async listChallengesForResult(resultVersionId: string): Promise<StudentMarkChallenge[]> {
    return this.challengeRepo.findByMarkingResultVersionId(resultVersionId);
  }

  async reviewChallenge(challengeId: string, reviewerId: string, reviewerRole: string): Promise<StudentMarkChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) throw new Error('NOT_FOUND: Challenge not found');
    challenge.status = 'under_review';
    challenge.reviewedByActorId = reviewerId;
    challenge.reviewedByRole = reviewerRole;
    challenge.reviewedAt = new Date().toISOString();
    return this.challengeRepo.update(challenge);
  }

  async resolveChallenge(challengeId: string, resolution: string, summary: string): Promise<StudentMarkChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) throw new Error('NOT_FOUND: Challenge not found');
    challenge.status = 'resolved';
    challenge.resolution = resolution;
    challenge.safeResolutionSummary = summary;
    return this.challengeRepo.update(challenge);
  }

  async withdrawChallenge(challengeId: string, studentId: string): Promise<StudentMarkChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) throw new Error('NOT_FOUND: Challenge not found');
    if (challenge.studentId !== studentId) throw new Error('FORBIDDEN: Cannot withdraw another student\'s challenge');
    challenge.status = 'withdrawn';
    return this.challengeRepo.update(challenge);
  }

  async blockChallenge(challengeId: string, reason: string): Promise<StudentMarkChallenge> {
    const challenge = await this.challengeRepo.findById(challengeId);
    if (!challenge) throw new Error('NOT_FOUND: Challenge not found');
    challenge.status = 'blocked';
    challenge.safeResolutionSummary = reason;
    return this.challengeRepo.update(challenge);
  }
}
