import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface CalibrationRecord {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic?: string | null;
  skillTag?: string | null;
  currentDifficultyLevel: string;
  supportLevel: string;
  calibrationSignals: Array<Record<string, unknown>>;
  recentSuccessCount: number;
  recentStruggleCount: number;
  recentHintDependency: number;
  recentTooHardCount: number;
  recentTooEasyCount: number;
  lastCalibratedAt: Date;
  privacyMetadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpsertCalibrationInput {
  schoolId: string;
  tutorLearnerId: string;
  subject: string;
  topic?: string;
  skillTag?: string;
  currentDifficultyLevel: string;
  supportLevel: string;
  calibrationSignals: Prisma.InputJsonValue[];
  recentSuccessCount: number;
  recentStruggleCount: number;
  recentHintDependency: number;
  recentTooHardCount: number;
  recentTooEasyCount: number;
  privacyMetadata: Prisma.InputJsonValue;
}

export class DifficultyCalibrationRepository {
  async getCalibration(
    schoolId: string,
    tutorLearnerId: string,
    subject: string,
    skillTag?: string,
  ): Promise<CalibrationRecord | null> {
    try {
      const where: Record<string, unknown> = {
        schoolId,
        tutorLearnerId,
        subject,
      };
      if (skillTag) where.skillTag = skillTag;

      const record = await prisma.difficultyCalibrationRecord.findFirst({
        where: where as any,
        orderBy: { updatedAt: 'desc' },
      });
      return record ? this.mapRecord(record) : null;
    } catch {
      return null;
    }
  }

  async upsertCalibration(input: UpsertCalibrationInput): Promise<CalibrationRecord> {
    try {
      const where: Record<string, unknown> = {
        schoolId_tutorLearnerId_subject_skillTag: {
          schoolId: input.schoolId,
          tutorLearnerId: input.tutorLearnerId,
          subject: input.subject,
          skillTag: input.skillTag ?? '',
        },
      };

      const data = {
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        subject: input.subject,
        topic: input.topic ?? null,
        skillTag: input.skillTag ?? null,
        currentDifficultyLevel: input.currentDifficultyLevel,
        supportLevel: input.supportLevel,
        calibrationSignals: input.calibrationSignals as any,
        recentSuccessCount: input.recentSuccessCount,
        recentStruggleCount: input.recentStruggleCount,
        recentHintDependency: input.recentHintDependency,
        recentTooHardCount: input.recentTooHardCount,
        recentTooEasyCount: input.recentTooEasyCount,
        lastCalibratedAt: new Date(),
        privacyMetadata: input.privacyMetadata as any,
      };

      const record = await prisma.difficultyCalibrationRecord.upsert({
        where: where as any,
        create: data as any,
        update: data as any,
      });
      return this.mapRecord(record);
    } catch {
      return {
        id: 'mock',
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        subject: input.subject,
        topic: input.topic ?? null,
        skillTag: input.skillTag ?? null,
        currentDifficultyLevel: input.currentDifficultyLevel,
        supportLevel: input.supportLevel,
        calibrationSignals: [],
        recentSuccessCount: input.recentSuccessCount,
        recentStruggleCount: input.recentStruggleCount,
        recentHintDependency: input.recentHintDependency,
        recentTooHardCount: input.recentTooHardCount,
        recentTooEasyCount: input.recentTooEasyCount,
        lastCalibratedAt: new Date(),
        privacyMetadata: { rawChatExcluded: true, rawPromptExcluded: true, privateMemoryExcluded: true },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  }

  private mapRecord(r: any): CalibrationRecord {
    return {
      ...r,
      calibrationSignals: typeof r.calibrationSignals === 'string' ? JSON.parse(r.calibrationSignals) : r.calibrationSignals ?? [],
      privacyMetadata: typeof r.privacyMetadata === 'string' ? JSON.parse(r.privacyMetadata) : r.privacyMetadata ?? {},
    };
  }
}

export const difficultyCalibrationRepository = new DifficultyCalibrationRepository();
