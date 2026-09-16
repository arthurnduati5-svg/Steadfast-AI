import { randomUUID } from 'crypto';
import prisma from '../lib/prisma';
import type { LearnerSupportLevel, LearnerStepSizePreference, LearnerPracticeModePreference } from './learnerPreferenceFeedbackContracts';

export interface ProfileRow {
  id: string;
  schoolId: string;
  tutorLearnerId: string;
  preferredSupportLevel: string;
  preferredStepSize: string;
  practiceModePreference: string;
  challengeReadinessSignal: string;
  foundationReviewPreference: string;
  hintFrequencySignal: string;
  difficultyCalibration: number;
  recentTooHardCount: number;
  recentTooEasyCount: number;
  recentConfusionCount: number;
  recentChallengeRequestCount: number;
  recentTeacherHelpRequestCount: number;
  profileSnapshot: unknown | null;
  privacyMetadata: unknown | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileUpsertInput {
  schoolId: string;
  tutorLearnerId: string;
  preferredSupportLevel?: string;
  preferredStepSize?: string;
  practiceModePreference?: string;
  challengeReadinessSignal?: string;
  foundationReviewPreference?: string;
  hintFrequencySignal?: string;
  difficultyCalibration?: number;
  recentTooHardCount?: number;
  recentTooEasyCount?: number;
  recentConfusionCount?: number;
  recentChallengeRequestCount?: number;
  recentTeacherHelpRequestCount?: number;
  profileSnapshot?: unknown;
  privacyMetadata?: unknown;
}

export interface IAdaptiveRecommendationProfileRepository {
  upsert(input: ProfileUpsertInput): Promise<ProfileRow>;
  findByLearner(schoolId: string, tutorLearnerId: string): Promise<ProfileRow | null>;
  deleteByLearner(schoolId: string, tutorLearnerId: string): Promise<void>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
}

export class PrismaAdaptiveRecommendationProfileRepository implements IAdaptiveRecommendationProfileRepository {
  async upsert(input: ProfileUpsertInput): Promise<ProfileRow> {
    return prisma.adaptiveRecommendationProfileRecord.upsert({
      where: {
        tutorLearnerId: input.tutorLearnerId,
      },
      create: {
        id: randomUUID(),
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        preferredSupportLevel: input.preferredSupportLevel || 'guided_support',
        preferredStepSize: input.preferredStepSize || 'standard',
        practiceModePreference: input.practiceModePreference || 'balanced',
        challengeReadinessSignal: input.challengeReadinessSignal || 'medium',
        foundationReviewPreference: input.foundationReviewPreference || 'medium',
        hintFrequencySignal: input.hintFrequencySignal || 'medium',
        difficultyCalibration: input.difficultyCalibration ?? 0.5,
        recentTooHardCount: input.recentTooHardCount ?? 0,
        recentTooEasyCount: input.recentTooEasyCount ?? 0,
        recentConfusionCount: input.recentConfusionCount ?? 0,
        recentChallengeRequestCount: input.recentChallengeRequestCount ?? 0,
        recentTeacherHelpRequestCount: input.recentTeacherHelpRequestCount ?? 0,
        profileSnapshot: (input.profileSnapshot || null) as any,
        privacyMetadata: (input.privacyMetadata || null) as any,
        updatedAt: new Date(),
      },
      update: {
        ...(input.preferredSupportLevel !== undefined && { preferredSupportLevel: input.preferredSupportLevel }),
        ...(input.preferredStepSize !== undefined && { preferredStepSize: input.preferredStepSize }),
        ...(input.practiceModePreference !== undefined && { practiceModePreference: input.practiceModePreference }),
        ...(input.challengeReadinessSignal !== undefined && { challengeReadinessSignal: input.challengeReadinessSignal }),
        ...(input.foundationReviewPreference !== undefined && { foundationReviewPreference: input.foundationReviewPreference }),
        ...(input.hintFrequencySignal !== undefined && { hintFrequencySignal: input.hintFrequencySignal }),
        ...(input.difficultyCalibration !== undefined && { difficultyCalibration: input.difficultyCalibration }),
        ...(input.recentTooHardCount !== undefined && { recentTooHardCount: input.recentTooHardCount }),
        ...(input.recentTooEasyCount !== undefined && { recentTooEasyCount: input.recentTooEasyCount }),
        ...(input.recentConfusionCount !== undefined && { recentConfusionCount: input.recentConfusionCount }),
        ...(input.recentChallengeRequestCount !== undefined && { recentChallengeRequestCount: input.recentChallengeRequestCount }),
        ...(input.recentTeacherHelpRequestCount !== undefined && { recentTeacherHelpRequestCount: input.recentTeacherHelpRequestCount }),
        ...(input.profileSnapshot !== undefined && { profileSnapshot: input.profileSnapshot as any }),
        ...(input.privacyMetadata !== undefined && { privacyMetadata: input.privacyMetadata as any }),
      },
    });
  }

  async findByLearner(schoolId: string, tutorLearnerId: string): Promise<ProfileRow | null> {
    return prisma.adaptiveRecommendationProfileRecord.findUnique({
      where: { tutorLearnerId },
    });
  }

  async deleteByLearner(schoolId: string, tutorLearnerId: string): Promise<void> {
    await prisma.adaptiveRecommendationProfileRecord.deleteMany({
      where: { schoolId, tutorLearnerId },
    });
  }

  async deleteAll(): Promise<void> {
    await prisma.adaptiveRecommendationProfileRecord.deleteMany();
  }

  async count(): Promise<number> {
    return prisma.adaptiveRecommendationProfileRecord.count();
  }
}

export class FakeAdaptiveRecommendationProfileRepository implements IAdaptiveRecommendationProfileRepository {
  private store: Map<string, ProfileRow> = new Map();

  private key(schoolId: string, tutorLearnerId: string): string {
    return `${schoolId}:${tutorLearnerId}`;
  }

  async upsert(input: ProfileUpsertInput): Promise<ProfileRow> {
    const k = this.key(input.schoolId, input.tutorLearnerId);
    const existing = this.store.get(k);
    const now = new Date();
    const row: ProfileRow = {
      id: existing?.id || `fake-profile-${Date.now()}`,
      schoolId: input.schoolId,
      tutorLearnerId: input.tutorLearnerId,
      preferredSupportLevel: input.preferredSupportLevel ?? existing?.preferredSupportLevel ?? 'guided_support',
      preferredStepSize: input.preferredStepSize ?? existing?.preferredStepSize ?? 'standard',
      practiceModePreference: input.practiceModePreference ?? existing?.practiceModePreference ?? 'balanced',
      challengeReadinessSignal: input.challengeReadinessSignal ?? existing?.challengeReadinessSignal ?? 'medium',
      foundationReviewPreference: input.foundationReviewPreference ?? existing?.foundationReviewPreference ?? 'medium',
      hintFrequencySignal: input.hintFrequencySignal ?? existing?.hintFrequencySignal ?? 'medium',
      difficultyCalibration: input.difficultyCalibration ?? existing?.difficultyCalibration ?? 0.5,
      recentTooHardCount: input.recentTooHardCount ?? existing?.recentTooHardCount ?? 0,
      recentTooEasyCount: input.recentTooEasyCount ?? existing?.recentTooEasyCount ?? 0,
      recentConfusionCount: input.recentConfusionCount ?? existing?.recentConfusionCount ?? 0,
      recentChallengeRequestCount: input.recentChallengeRequestCount ?? existing?.recentChallengeRequestCount ?? 0,
      recentTeacherHelpRequestCount: input.recentTeacherHelpRequestCount ?? existing?.recentTeacherHelpRequestCount ?? 0,
      profileSnapshot: input.profileSnapshot ?? existing?.profileSnapshot ?? null,
      privacyMetadata: input.privacyMetadata ?? existing?.privacyMetadata ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.store.set(k, row);
    return { ...row };
  }

  async findByLearner(schoolId: string, tutorLearnerId: string): Promise<ProfileRow | null> {
    return this.store.get(this.key(schoolId, tutorLearnerId)) || null;
  }

  async deleteByLearner(schoolId: string, tutorLearnerId: string): Promise<void> {
    this.store.delete(this.key(schoolId, tutorLearnerId));
  }

  async deleteAll(): Promise<void> {
    this.store.clear();
  }

  async count(): Promise<number> {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

export const adaptiveRecommendationProfileRepository: IAdaptiveRecommendationProfileRepository = new PrismaAdaptiveRecommendationProfileRepository();
