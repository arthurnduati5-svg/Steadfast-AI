import type {
  LearnerTransparencyReasonCode,
  LearnerTransparencySourceTruthStatus,
  LearnerTransparencyConfidenceBucket,
} from '../contracts/learnerTransparencyContracts';

export interface BuildLearnerSafeguardingBoundaryNoticeParams {
  schoolId: string;
  studentId: string;
}

export interface SafeguardingBoundaryNotice {
  learnerSafeMessage: string;
  safeReasonCodes: LearnerTransparencyReasonCode[];
  sourceTruthStatus: LearnerTransparencySourceTruthStatus;
  confidenceBucket: LearnerTransparencyConfidenceBucket;
}

export function buildLearnerSafeguardingBoundaryNotice(
  params: BuildLearnerSafeguardingBoundaryNoticeParams,
): SafeguardingBoundaryNotice {
  return {
    learnerSafeMessage:
      'Some details are not shown here because they require safe adult support.',
    safeReasonCodes: ['safeguarding_boundary_applied'],
    sourceTruthStatus: 'blocked',
    confidenceBucket: 'blocked',
  };
}

const SAFEGUARDING_FORBIDDEN_PATTERNS = [
  /self.harm/i,
  /abuse/i,
  /risk score/i,
  /risk classifier/i,
  /safeguarding category/i,
  /case note/i,
  /private disclosure/i,
  /threat/i,
  /suicide/i,
];

export function assertSafeguardingBoundaryNoticeIsSafe(notice: { learnerSafeMessage: string }): void {
  for (const pattern of SAFEGUARDING_FORBIDDEN_PATTERNS) {
    if (pattern.test(notice.learnerSafeMessage)) {
      throw new Error(
        `Safeguarding boundary notice contains forbidden pattern: ${pattern}. Message must not expose raw safeguarding details.`,
      );
    }
  }
}
