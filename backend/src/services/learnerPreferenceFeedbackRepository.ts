import prisma from '../lib/prisma';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { LearnerPreferenceFeedbackType } from './learnerPreferenceFeedbackContracts';

export interface FeedbackRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId: string | null;
  sessionId: string | null;
  recommendationId: string;
  recommendationType: string | null;
  feedbackType: string | null;
  subject: string | null;
  topic: string | null;
  skillTag: string | null;
  safeReasonCodes: unknown | null;
  safetyFlags: unknown | null;
  privacyMetadata: unknown | null;
  supportLevelAdjustment: string | null;
  difficultyAdjustment: string | null;
  stepSizeAdjustment: string | null;
  recommendationBiases: unknown | null;
  profileSnapshot: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeedbackCreateInput {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  recommendationId: string;
  recommendationType?: string;
  feedbackType?: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeReasonCodes?: unknown;
  safetyFlags?: unknown;
  privacyMetadata?: unknown;
  supportLevelAdjustment?: string;
  difficultyAdjustment?: string;
  stepSizeAdjustment?: string;
  recommendationBiases?: unknown;
  profileSnapshot?: unknown;
}

export interface ILearnerPreferenceFeedbackRepository {
  create(input: FeedbackCreateInput): Promise<FeedbackRow>;
  findByLearner(schoolId: string, tutorLearnerId: string): Promise<FeedbackRow[]>;
  countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>>;
  count(): Promise<number>;
}

export class PrismaLearnerPreferenceFeedbackRepository implements ILearnerPreferenceFeedbackRepository {
  async create(input: FeedbackCreateInput): Promise<FeedbackRow> {
    return prisma.learnerPreferenceFeedbackRecord.create({
      data: {
        id: input.id,
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId || null,
        sessionId: input.sessionId || null,
        recommendationId: input.recommendationId,
        recommendationType: input.recommendationType || null,
        feedbackType: input.feedbackType || null,
        subject: input.subject || null,
        topic: input.topic || null,
        skillTag: input.skillTag || null,
        safeReasonCodes: (input.safeReasonCodes || null) as any,
        safetyFlags: (input.safetyFlags || null) as any,
        privacyMetadata: (input.privacyMetadata || null) as any,
        supportLevelAdjustment: input.supportLevelAdjustment || null,
        difficultyAdjustment: input.difficultyAdjustment || null,
        stepSizeAdjustment: input.stepSizeAdjustment || null,
        recommendationBiases: (input.recommendationBiases || null) as any,
        profileSnapshot: (input.profileSnapshot || null) as any,
      },
    });
  }

  async findByLearner(schoolId: string, tutorLearnerId: string): Promise<FeedbackRow[]> {
    return prisma.learnerPreferenceFeedbackRecord.findMany({
      where: { schoolId, tutorLearnerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>> {
    const rows = await prisma.learnerPreferenceFeedbackRecord.findMany({
      where: { schoolId, tutorLearnerId },
      select: { feedbackType: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      if (row.feedbackType) {
        counts[row.feedbackType] = (counts[row.feedbackType] || 0) + 1;
      }
    }
    return counts;
  }

  async count(): Promise<number> {
    return prisma.learnerPreferenceFeedbackRecord.count();
  }
}

export class FakeLearnerPreferenceFeedbackRepository implements ILearnerPreferenceFeedbackRepository {
  private store: Map<string, FeedbackCreateInput & { createdAt: Date; updatedAt: Date }> = new Map();

  async create(input: FeedbackCreateInput): Promise<FeedbackRow> {
    const now = new Date();
    const row = { ...input, createdAt: now, updatedAt: now };
    this.store.set(input.id, row);
    return {
      id: row.id,
      schoolId: row.schoolId,
      tutorLearnerId: row.tutorLearnerId,
      studentId: row.studentId || null,
      sessionId: row.sessionId || null,
      recommendationId: row.recommendationId,
      recommendationType: row.recommendationType || null,
      feedbackType: row.feedbackType || null,
      subject: row.subject || null,
      topic: row.topic || null,
      skillTag: row.skillTag || null,
      safeReasonCodes: row.safeReasonCodes || null,
      safetyFlags: row.safetyFlags || null,
      privacyMetadata: row.privacyMetadata || null,
      supportLevelAdjustment: row.supportLevelAdjustment || null,
      difficultyAdjustment: row.difficultyAdjustment || null,
      stepSizeAdjustment: row.stepSizeAdjustment || null,
      recommendationBiases: row.recommendationBiases || null,
      profileSnapshot: row.profileSnapshot || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByLearner(schoolId: string, tutorLearnerId: string): Promise<FeedbackRow[]> {
    const results: FeedbackRow[] = [];
    for (const entry of this.store.values()) {
      if (entry.schoolId === schoolId && entry.tutorLearnerId === tutorLearnerId) {
        results.push(entry as any);
      }
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return results;
  }

  async countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const entry of this.store.values()) {
      if (entry.schoolId === schoolId && entry.tutorLearnerId === tutorLearnerId && entry.feedbackType) {
        counts[entry.feedbackType] = (counts[entry.feedbackType] || 0) + 1;
      }
    }
    return counts;
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

export const learnerPreferenceFeedbackRepository: ILearnerPreferenceFeedbackRepository = new PrismaLearnerPreferenceFeedbackRepository();
