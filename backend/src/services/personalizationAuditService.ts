import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { PersonalizationAuditRecord } from './learnerPreferenceFeedbackContracts';
import type { IPersonalizationAuditRepository } from './personalizationAuditRepository';
import { personalizationAuditRepository as defaultRepository } from './personalizationAuditRepository';

function generateRequestId(): string {
  return `pers-audit-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class PersonalizationAuditService {
  private repository: IPersonalizationAuditRepository;

  constructor(repository?: IPersonalizationAuditRepository) {
    this.repository = repository || defaultRepository;
  }

  async recordAudit(input: {
    identity: ResolvedTutorIdentity;
    recommendationId: string;
    feedbackType: string;
    interactionType?: string;
    tuningReasonCodes: string[];
    deenSensitivityHandled: boolean;
    safeguardingBoundaryApplied: boolean;
    sessionId?: string;
  }): Promise<PersonalizationAuditRecord> {
    const now = new Date().toISOString();
    const requestId = generateRequestId();

    const row = await this.repository.create({
      id: requestId,
      schoolId: input.identity.schoolId,
      tutorLearnerId: input.identity.studentId,
      studentId: input.identity.studentId,
      sessionId: input.sessionId,
      recommendationId: input.recommendationId,
      feedbackType: input.feedbackType,
      interactionType: input.interactionType,
      tuningReasonCodes: input.tuningReasonCodes,
      safetyFlags: [],
      privacyDecision: 'teacher_safe_learner_preference',
      deenSensitivityHandled: input.deenSensitivityHandled,
      safeguardingBoundaryApplied: input.safeguardingBoundaryApplied,
    });

    const record: PersonalizationAuditRecord = {
      actorId: row.tutorLearnerId,
      actorRole: 'learner',
      schoolId: row.schoolId,
      tutorLearnerId: row.tutorLearnerId,
      sessionId: row.sessionId || undefined,
      recommendationId: row.recommendationId,
      feedbackType: row.feedbackType || '',
      interactionType: row.interactionType || undefined,
      tuningReasonCodes: (row.tuningReasonCodes as string[]) || [],
      privacyDecision: row.privacyDecision,
      deenSensitivityHandled: row.deenSensitivityHandled,
      safeguardingBoundaryApplied: row.safeguardingBoundaryApplied,
      createdAt: row.createdAt.toISOString(),
      requestId: row.id,
    };

    return record;
  }

  async listAuditRecords(
    identity: ResolvedTutorIdentity,
    limit?: number,
  ): Promise<PersonalizationAuditRecord[]> {
    const rows = await this.repository.findByLearner(identity.schoolId, identity.studentId, limit);
    return rows.map((r) => ({
      actorId: r.tutorLearnerId,
      actorRole: 'learner',
      schoolId: r.schoolId,
      tutorLearnerId: r.tutorLearnerId,
      sessionId: r.sessionId || undefined,
      recommendationId: r.recommendationId,
      feedbackType: r.feedbackType || '',
      interactionType: r.interactionType || undefined,
      tuningReasonCodes: (r.tuningReasonCodes as string[]) || [],
      privacyDecision: r.privacyDecision,
      deenSensitivityHandled: r.deenSensitivityHandled,
      safeguardingBoundaryApplied: r.safeguardingBoundaryApplied,
      createdAt: r.createdAt.toISOString(),
      requestId: r.id,
    }));
  }

  async getAuditCount(): Promise<number> {
    return this.repository.count();
  }
}

export const personalizationAuditService = new PersonalizationAuditService();
