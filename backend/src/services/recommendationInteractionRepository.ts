import prisma from '../lib/prisma';

export interface InteractionRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId: string | null;
  sessionId: string | null;
  recommendationId: string | null;
  recommendationType: string | null;
  interactionType: string;
  subject: string | null;
  topic: string | null;
  skillTag: string | null;
  safeReasonCodes: unknown | null;
  safetyFlags: unknown | null;
  privacyMetadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InteractionCreateInput {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  recommendationId?: string;
  recommendationType?: string;
  interactionType: string;
  subject?: string;
  topic?: string;
  skillTag?: string;
  safeReasonCodes?: unknown;
  safetyFlags?: unknown;
  privacyMetadata?: unknown;
}

export interface IRecommendationInteractionRepository {
  create(input: InteractionCreateInput): Promise<InteractionRow>;
  findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<InteractionRow[]>;
  countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>>;
  countRecentByType(schoolId: string, tutorLearnerId: string, type: string, sinceMs: number): Promise<number>;
  count(): Promise<number>;
}

export class PrismaRecommendationInteractionRepository implements IRecommendationInteractionRepository {
  async create(input: InteractionCreateInput): Promise<InteractionRow> {
    return prisma.recommendationInteractionRecord.create({
      data: {
        id: input.id,
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId || null,
        sessionId: input.sessionId || null,
        recommendationId: input.recommendationId || null,
        recommendationType: input.recommendationType || null,
        interactionType: input.interactionType,
        subject: input.subject || null,
        topic: input.topic || null,
        skillTag: input.skillTag || null,
        safeReasonCodes: (input.safeReasonCodes || null) as any,
        safetyFlags: (input.safetyFlags || null) as any,
        privacyMetadata: (input.privacyMetadata || null) as any,
        updatedAt: new Date(),
      },
    });
  }

  async findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<InteractionRow[]> {
    return prisma.recommendationInteractionRecord.findMany({
      where: { schoolId, tutorLearnerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>> {
    const rows = await prisma.recommendationInteractionRecord.findMany({
      where: { schoolId, tutorLearnerId },
      select: { interactionType: true },
    });
    const counts: Record<string, number> = {};
    for (const row of rows) {
      counts[row.interactionType] = (counts[row.interactionType] || 0) + 1;
    }
    return counts;
  }

  async countRecentByType(schoolId: string, tutorLearnerId: string, type: string, sinceMs: number): Promise<number> {
    const since = new Date(Date.now() - sinceMs);
    return prisma.recommendationInteractionRecord.count({
      where: {
        schoolId,
        tutorLearnerId,
        interactionType: type,
        createdAt: { gte: since },
      },
    });
  }

  async count(): Promise<number> {
    return prisma.recommendationInteractionRecord.count();
  }
}

export class FakeRecommendationInteractionRepository implements IRecommendationInteractionRepository {
  private store: Map<string, InteractionCreateInput & { createdAt: Date; updatedAt: Date }> = new Map();

  async create(input: InteractionCreateInput): Promise<InteractionRow> {
    const now = new Date();
    const row = { ...input, createdAt: now, updatedAt: now };
    this.store.set(input.id, row);
    return {
      id: row.id,
      schoolId: row.schoolId,
      tutorLearnerId: row.tutorLearnerId,
      studentId: row.studentId || null,
      sessionId: row.sessionId || null,
      recommendationId: row.recommendationId || null,
      recommendationType: row.recommendationType || null,
      interactionType: row.interactionType,
      subject: row.subject || null,
      topic: row.topic || null,
      skillTag: row.skillTag || null,
      safeReasonCodes: row.safeReasonCodes || null,
      safetyFlags: row.safetyFlags || null,
      privacyMetadata: row.privacyMetadata || null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  async findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<InteractionRow[]> {
    const results: InteractionRow[] = [];
    for (const entry of this.store.values()) {
      if (entry.schoolId === schoolId && entry.tutorLearnerId === tutorLearnerId) {
        results.push(entry as any);
      }
    }
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? results.slice(0, limit) : results;
  }

  async countByType(schoolId: string, tutorLearnerId: string): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const entry of this.store.values()) {
      if (entry.schoolId === schoolId && entry.tutorLearnerId === tutorLearnerId) {
        counts[entry.interactionType] = (counts[entry.interactionType] || 0) + 1;
      }
    }
    return counts;
  }

  async countRecentByType(schoolId: string, tutorLearnerId: string, type: string, sinceMs: number): Promise<number> {
    const since = Date.now() - sinceMs;
    let count = 0;
    for (const entry of this.store.values()) {
      if (
        entry.schoolId === schoolId &&
        entry.tutorLearnerId === tutorLearnerId &&
        entry.interactionType === type &&
        entry.createdAt.getTime() >= since
      ) {
        count++;
      }
    }
    return count;
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

export const recommendationInteractionRepository: IRecommendationInteractionRepository = new PrismaRecommendationInteractionRepository();
