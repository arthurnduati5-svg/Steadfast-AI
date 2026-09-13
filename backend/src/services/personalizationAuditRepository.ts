import prisma from '../lib/prisma';

export interface AuditRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId: string | null;
  sessionId: string | null;
  recommendationId: string;
  feedbackType: string | null;
  interactionType: string | null;
  tuningReasonCodes: unknown | null;
  safetyFlags: unknown | null;
  privacyDecision: string;
  deenSensitivityHandled: boolean;
  safeguardingBoundaryApplied: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditCreateInput {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  recommendationId: string;
  feedbackType?: string;
  interactionType?: string;
  tuningReasonCodes?: unknown;
  safetyFlags?: unknown;
  privacyDecision?: string;
  deenSensitivityHandled?: boolean;
  safeguardingBoundaryApplied?: boolean;
}

export interface IPersonalizationAuditRepository {
  create(input: AuditCreateInput): Promise<AuditRow>;
  findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<AuditRow[]>;
  count(): Promise<number>;
}

export class PrismaPersonalizationAuditRepository implements IPersonalizationAuditRepository {
  async create(input: AuditCreateInput): Promise<AuditRow> {
    return prisma.personalizationAuditRecord.create({
      data: {
        id: input.id,
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId || null,
        sessionId: input.sessionId || null,
        recommendationId: input.recommendationId,
        feedbackType: input.feedbackType || null,
        interactionType: input.interactionType || null,
        tuningReasonCodes: (input.tuningReasonCodes || null) as any,
        safetyFlags: (input.safetyFlags || null) as any,
        privacyDecision: input.privacyDecision || 'teacher_safe_learner_preference',
        deenSensitivityHandled: input.deenSensitivityHandled ?? false,
        safeguardingBoundaryApplied: input.safeguardingBoundaryApplied ?? false,
      },
    });
  }

  async findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<AuditRow[]> {
    return prisma.personalizationAuditRecord.findMany({
      where: { schoolId, tutorLearnerId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async count(): Promise<number> {
    return prisma.personalizationAuditRecord.count();
  }
}

export class FakePersonalizationAuditRepository implements IPersonalizationAuditRepository {
  private store: AuditRow[] = [];

  async create(input: AuditCreateInput): Promise<AuditRow> {
    const now = new Date();
    const row: AuditRow = {
      id: input.id,
      schoolId: input.schoolId,
      tutorLearnerId: input.tutorLearnerId,
      studentId: input.studentId || null,
      sessionId: input.sessionId || null,
      recommendationId: input.recommendationId,
      feedbackType: input.feedbackType || null,
      interactionType: input.interactionType || null,
      tuningReasonCodes: input.tuningReasonCodes || null,
      safetyFlags: input.safetyFlags || null,
      privacyDecision: input.privacyDecision || 'teacher_safe_learner_preference',
      deenSensitivityHandled: input.deenSensitivityHandled ?? false,
      safeguardingBoundaryApplied: input.safeguardingBoundaryApplied ?? false,
      createdAt: now,
      updatedAt: now,
    };
    this.store.push(row);
    return { ...row };
  }

  async findByLearner(schoolId: string, tutorLearnerId: string, limit?: number): Promise<AuditRow[]> {
    let results = this.store.filter(
      (r) => r.schoolId === schoolId && r.tutorLearnerId === tutorLearnerId,
    );
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return limit ? results.slice(0, limit) : results;
  }

  async count(): Promise<number> {
    return this.store.length;
  }

  clear(): void {
    this.store.length = 0;
  }
}

export const personalizationAuditRepository: IPersonalizationAuditRepository = new PrismaPersonalizationAuditRepository();
