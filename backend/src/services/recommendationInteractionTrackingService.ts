import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  RecommendationInteractionRequest,
  RecommendationInteractionRecord,
  RecommendationInteractionType,
} from './learnerPreferenceFeedbackContracts';
import { RECOMMENDATION_INTERACTION_TYPES } from './learnerPreferenceFeedbackContracts';
import type { IRecommendationInteractionRepository } from './recommendationInteractionRepository';
import { recommendationInteractionRepository as defaultRepository } from './recommendationInteractionRepository';

function generateId(): string {
  return `interact-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class RecommendationInteractionTrackingService {
  private repository: IRecommendationInteractionRepository;

  constructor(repository?: IRecommendationInteractionRepository) {
    this.repository = repository || defaultRepository;
  }

  async recordInteraction(
    identity: ResolvedTutorIdentity,
    recommendationId: string | undefined,
    request: RecommendationInteractionRequest,
  ): Promise<RecommendationInteractionRecord> {
    if (!identity || !identity.studentId) {
      throw new Error('Learner identity is required');
    }

    if (!request.interactionType) {
      throw new Error('Interaction type is required');
    }

    if (!RECOMMENDATION_INTERACTION_TYPES.includes(request.interactionType)) {
      throw new Error(`Unsupported interaction type: ${request.interactionType}`);
    }

    const id = generateId();
    const now = new Date();

    const row = await this.repository.create({
      id,
      schoolId: identity.schoolId,
      tutorLearnerId: identity.studentId,
      studentId: identity.studentId,
      sessionId: request.sessionId,
      recommendationId,
      interactionType: request.interactionType,
      subject: request.subject,
      topic: request.topic,
      skillTag: request.skillTag,
    });

    const record: RecommendationInteractionRecord = {
      interactionId: row.id,
      schoolId: row.schoolId,
      tutorLearnerId: row.tutorLearnerId,
      studentId: row.studentId || identity.studentId,
      sessionId: row.sessionId || undefined,
      recommendationId: row.recommendationId || undefined,
      interactionType: row.interactionType as RecommendationInteractionType,
      subject: row.subject || undefined,
      topic: row.topic || undefined,
      skillTag: row.skillTag || undefined,
      safeReasonCode: undefined,
      createdAt: row.createdAt.toISOString(),
    };

    return record;
  }

  async getInteractionsForLearner(
    identity: ResolvedTutorIdentity,
    limit?: number,
  ): Promise<RecommendationInteractionRecord[]> {
    const rows = await this.repository.findByLearner(identity.schoolId, identity.studentId, limit);
    return rows.map((r) => ({
      interactionId: r.id,
      schoolId: r.schoolId,
      tutorLearnerId: r.tutorLearnerId,
      studentId: r.studentId || identity.studentId,
      sessionId: r.sessionId || undefined,
      recommendationId: r.recommendationId || undefined,
      interactionType: r.interactionType as RecommendationInteractionType,
      subject: r.subject || undefined,
      topic: r.topic || undefined,
      skillTag: r.skillTag || undefined,
      safeReasonCode: undefined,
      createdAt: r.createdAt.toISOString(),
    }));
  }

  async getInteractionCountByType(
    identity: ResolvedTutorIdentity,
  ): Promise<Record<string, number>> {
    return this.repository.countByType(identity.schoolId, identity.studentId);
  }

  async getRecentCountByType(
    identity: ResolvedTutorIdentity,
    type: RecommendationInteractionType,
    sinceMs: number = 7 * 24 * 60 * 60 * 1000,
  ): Promise<number> {
    return this.repository.countRecentByType(identity.schoolId, identity.studentId, type, sinceMs);
  }

  hasCrossStudentAccess(
    identity: ResolvedTutorIdentity,
    targetStudentId: string,
  ): boolean {
    return identity.studentId === targetStudentId;
  }
}

export const recommendationInteractionTrackingService = new RecommendationInteractionTrackingService();
