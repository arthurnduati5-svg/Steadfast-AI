import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../../../lib/prisma';
import type { ContentSafetyReview, ContentSafetyReviewState } from '../contracts/questionGovernanceContracts';

function mapRowToSafetyReview(row: any): ContentSafetyReview {
  return {
    reviewId: row.id,
    questionVersionId: row.targetId,
    reviewState: row.reviewState as ContentSafetyReviewState,
    reviewedByActorId: row.reviewedByActorId ?? null,
    reviewedByRole: row.reviewedByRole ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    decision: row.decision,
    reasonCodes: (row.reasonCodes as string[]) ?? [],
    safeNotes: row.safeNotes ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

export class QuestionContentSafetyReviewBridge {
  constructor(private db: PrismaClient = prisma) {}

  async createQuestionContentSafetyReview(params: {
    questionVersionId: string;
    schoolId: string;
    reviewState: ContentSafetyReviewState;
    decision: string;
    reasonCodes?: string[];
    safeNotes?: string;
    reviewedByActorId?: string;
    reviewedByRole?: string;
  }): Promise<ContentSafetyReview> {
    const row = await this.db.contentReviewRecord.create({
      data: {
        schoolId: params.schoolId,
        targetType: 'question_version',
        targetId: params.questionVersionId,
        reviewState: params.reviewState,
        reviewedByActorId: params.reviewedByActorId ?? null,
        reviewedByRole: params.reviewedByRole ?? null,
        reviewedAt: params.reviewState !== 'not_reviewed' ? new Date() : undefined,
        decision: params.decision,
        reasonCodes: params.reasonCodes ?? [],
        safeNotes: params.safeNotes ?? null,
      },
    });
    return mapRowToSafetyReview(row);
  }

  async getQuestionContentSafetyReview(questionVersionId: string): Promise<ContentSafetyReview | null> {
    const row = await this.db.contentReviewRecord.findFirst({
      where: { targetType: 'question_version', targetId: questionVersionId },
      orderBy: { createdAt: 'desc' },
    });
    return row ? mapRowToSafetyReview(row) : null;
  }

  mapContentReviewRecordToQuestionSafetyReview(row: any): ContentSafetyReview {
    return mapRowToSafetyReview(row);
  }
}
