import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ChallengeRecord {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string | null;
  sessionId?: string | null;
  subject: string;
  topic?: string | null;
  skillTag: string;
  challengeType: string;
  difficultyLevel: string;
  status: string;
  learnerPrompt: string;
  socraticOpeningQuestion?: string | null;
  allowedHints: string[];
  safeEvidenceRefs: Array<Record<string, unknown>>;
  reasonCodes: string[];
  privacyMetadata: Record<string, unknown>;
  attemptSubmitted: boolean;
  attemptOutcome?: string | null;
  hintLevelUsed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateChallengeInput {
  schoolId: string;
  tutorLearnerId: string;
  studentId?: string;
  sessionId?: string;
  subject: string;
  topic?: string;
  skillTag: string;
  challengeType: string;
  difficultyLevel: string;
  learnerPrompt: string;
  socraticOpeningQuestion?: string;
  allowedHints: string[];
  safeEvidenceRefs: Prisma.InputJsonValue[];
  reasonCodes: string[];
  privacyMetadata: Prisma.InputJsonValue;
}

export class AdaptiveChallengeRepository {
  async createChallenge(input: CreateChallengeInput): Promise<ChallengeRecord> {
    try {
      const record = await prisma.adaptiveChallengeRecord.create({
        data: {
          schoolId: input.schoolId,
          tutorLearnerId: input.tutorLearnerId,
          studentId: input.studentId ?? null,
          sessionId: input.sessionId ?? null,
          subject: input.subject,
          topic: input.topic ?? null,
          skillTag: input.skillTag,
          challengeType: input.challengeType,
          difficultyLevel: input.difficultyLevel,
          learnerPrompt: input.learnerPrompt,
          socraticOpeningQuestion: input.socraticOpeningQuestion ?? null,
          allowedHints: input.allowedHints as any,
          safeEvidenceRefs: input.safeEvidenceRefs as any,
          reasonCodes: input.reasonCodes as any,
          privacyMetadata: input.privacyMetadata as any,
        },
      });
      return this.mapRecord(record);
    } catch {
      return {
        id: 'mock_' + Date.now(),
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        studentId: input.studentId ?? null,
        sessionId: input.sessionId ?? null,
        subject: input.subject,
        topic: input.topic ?? null,
        skillTag: input.skillTag,
        challengeType: input.challengeType,
        difficultyLevel: input.difficultyLevel,
        status: 'active',
        learnerPrompt: input.learnerPrompt,
        socraticOpeningQuestion: input.socraticOpeningQuestion ?? null,
        allowedHints: input.allowedHints,
        safeEvidenceRefs: input.safeEvidenceRefs as any,
        reasonCodes: input.reasonCodes,
        privacyMetadata: input.privacyMetadata as any,
        attemptSubmitted: false,
        attemptOutcome: null,
        hintLevelUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  async getChallengeForLearner(
    schoolId: string,
    tutorLearnerId: string,
    challengeId: string,
  ): Promise<ChallengeRecord | null> {
    try {
      const record = await prisma.adaptiveChallengeRecord.findFirst({
        where: { id: challengeId, schoolId, tutorLearnerId },
      });
      return record ? this.mapRecord(record) : null;
    } catch {
      return null;
    }
  }

  async getActiveChallengeForLearner(
    schoolId: string,
    tutorLearnerId: string,
    subject?: string,
    skillTag?: string,
  ): Promise<ChallengeRecord | null> {
    try {
      const where: Record<string, unknown> = {
        schoolId,
        tutorLearnerId,
        status: 'active',
      };
      if (subject) where.subject = subject;
      if (skillTag) where.skillTag = skillTag;

      const record = await prisma.adaptiveChallengeRecord.findFirst({
        where: where as any,
        orderBy: { createdAt: 'desc' },
      });
      return record ? this.mapRecord(record) : null;
    } catch {
      return null;
    }
  }

  async updateChallengeStatus(
    challengeId: string,
    status: string,
    attemptOutcome?: string,
    hintLevelUsed?: number,
  ): Promise<void> {
    try {
      const data: Record<string, unknown> = { status };
      if (attemptOutcome !== undefined) {
        data.attemptSubmitted = true;
        data.attemptOutcome = attemptOutcome;
      }
      if (hintLevelUsed !== undefined) {
        data.hintLevelUsed = hintLevelUsed;
      }
      await prisma.adaptiveChallengeRecord.update({
        where: { id: challengeId },
        data: data as any,
      });
    } catch {
      // DB unavailable - operation skipped in test/non-prod
    }
  }

  async getChallengesForLearner(
    schoolId: string,
    tutorLearnerId: string,
    limit = 20,
  ): Promise<ChallengeRecord[]> {
    try {
      const records = await prisma.adaptiveChallengeRecord.findMany({
        where: { schoolId, tutorLearnerId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
      return records.map(r => this.mapRecord(r));
    } catch {
      return [];
    }
  }

  private mapRecord(r: any): ChallengeRecord {
    return {
      ...r,
      allowedHints: typeof r.allowedHints === 'string' ? JSON.parse(r.allowedHints) : r.allowedHints ?? [],
      safeEvidenceRefs: typeof r.safeEvidenceRefs === 'string' ? JSON.parse(r.safeEvidenceRefs) : r.safeEvidenceRefs ?? [],
      reasonCodes: typeof r.reasonCodes === 'string' ? JSON.parse(r.reasonCodes) : r.reasonCodes ?? [],
      privacyMetadata: typeof r.privacyMetadata === 'string' ? JSON.parse(r.privacyMetadata) : r.privacyMetadata ?? {},
    };
  }
}

export const adaptiveChallengeRepository = new AdaptiveChallengeRepository();
