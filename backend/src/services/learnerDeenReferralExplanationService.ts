import type {
  LearnerTransparencyReasonCode,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyConfidenceBucket,
} from '../contracts/learnerTransparencyContracts';

export interface BuildLearnerDeenReferralNoticeParams {
  schoolId: string;
  studentId: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
}

export interface DeenReferralNotice {
  learnerSafeMessage: string;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
}

export function buildLearnerDeenReferralNotice(
  params: BuildLearnerDeenReferralNoticeParams,
): DeenReferralNotice {
  return {
    learnerSafeMessage:
      'This needs an approved Islamic Studies source, teacher, or scholar before the system can explain it safely.',
    safeReasonCodes: ['deen_referral_required'],
    sourceTruthStatus: 'source_required',
    confidenceBucket: 'blocked',
  };
}

export interface BuildLearnerSourceRequiredNoticeParams {
  schoolId: string;
  studentId: string;
  subjectId?: string;
}

export interface SourceRequiredNotice {
  learnerSafeMessage: string;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
}

export function buildLearnerSourceRequiredNotice(
  params: BuildLearnerSourceRequiredNoticeParams,
): SourceRequiredNotice {
  return {
    learnerSafeMessage:
      'This needs an approved source before the system can explain it safely.',
    safeReasonCodes: ['content_gap_no_curriculum_context'],
    sourceTruthStatus: 'content_gap',
    confidenceBucket: 'blocked',
  };
}

const DEEN_REFERRAL_FORBIDDEN_PATTERNS = [
  /fatwa/i,
  /religious ruling/i,
  /sectarian/i,
  /correct answer/i,
  /answer key/i,
  /model answer/i,
  /teacher\.only/i,
  /private question/i,
  /student belief/i,
];

export function assertDeenReferralNoticeIsSafe(notice: { learnerSafeMessage: string }): void {
  for (const pattern of DEEN_REFERRAL_FORBIDDEN_PATTERNS) {
    if (pattern.test(notice.learnerSafeMessage)) {
      throw new Error(
        `Deen referral notice contains forbidden pattern: ${pattern}. Message must not expose sensitive or answer-related content.`,
      );
    }
  }
}
