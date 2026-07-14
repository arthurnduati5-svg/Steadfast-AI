export type ChallengeStatus = 'submitted' | 'under_review' | 'resolved' | 'rejected' | 'withdrawn' | 'blocked';
export type ChallengeResolution = 'upheld_original' | 'adjusted' | 'requires_moderation' | 'invalid' | 'blocked';

export interface StudentMarkChallenge {
  studentMarkChallengeId: string;
  schoolId: string;
  studentId: string;
  markingResultVersionId: string;
  status: string;
  challengeReasonCode: string;
  safeStudentStatement: string;
  createdAt: string;
  reviewedByActorId?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  resolution?: string;
  safeResolutionSummary: string;
}
