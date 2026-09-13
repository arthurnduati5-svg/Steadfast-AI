import type {
  AdaptiveTuningAuditEvent,
  AdaptiveTuningDecision,
  AdaptiveTuningPolicyDecision,
  AdaptiveTuningReasonCode,
} from '../contracts/adaptiveRecommendationTuningContracts';

export type AuditEventType =
  | 'adaptive_tuning_feedback_received'
  | 'adaptive_tuning_choice_recorded'
  | 'adaptive_tuning_snapshot_created'
  | 'adaptive_tuning_snapshot_returned'
  | 'adaptive_tuning_support_calibrated'
  | 'adaptive_tuning_avoidance_detected'
  | 'adaptive_tuning_mastery_inflation_blocked'
  | 'adaptive_tuning_raw_field_rejected'
  | 'adaptive_tuning_blocked'
  | 'adaptive_tuning_failed';

interface AuditInput {
  eventType: AuditEventType;
  schoolId: string;
  studentId: string;
  tutorLearnerId?: string;
  recommendationId?: string;
  feedbackType?: string;
  choiceType?: string;
  tuningDecision?: AdaptiveTuningDecision;
  policyDecision?: AdaptiveTuningPolicyDecision;
  safeReasonCodes: AdaptiveTuningReasonCode[];
}

export class AdaptiveRecommendationTuningAuditService {
  private events: AdaptiveTuningAuditEvent[] = [];
  private readonly MAX_EVENTS = 1000;

  async recordAuditEvent(input: AuditInput): Promise<AdaptiveTuningAuditEvent> {
    const event: AdaptiveTuningAuditEvent = {
      eventType: input.eventType,
      schoolId: input.schoolId,
      studentId: input.studentId,
      tutorLearnerId: input.tutorLearnerId,
      recommendationId: input.recommendationId,
      feedbackType: input.feedbackType,
      choiceType: input.choiceType,
      tuningDecision: input.tuningDecision,
      policyDecision: input.policyDecision,
      safeReasonCodes: input.safeReasonCodes,
      createdAt: new Date().toISOString(),
    };

    this.events.push(event);
    if (this.events.length > this.MAX_EVENTS) {
      this.events.splice(0, this.events.length - this.MAX_EVENTS);
    }

    return event;
  }

  async listEvents(
    schoolId: string,
    studentId?: string,
    limit = 50,
  ): Promise<AdaptiveTuningAuditEvent[]> {
    let filtered = this.events.filter((e) => e.schoolId === schoolId);
    if (studentId) {
      filtered = filtered.filter((e) => e.studentId === studentId);
    }
    return filtered.slice(-limit).reverse();
  }

  async count(): Promise<number> {
    return this.events.length;
  }

  clear(): void {
    this.events = [];
  }
}

export const adaptiveRecommendationTuningAuditService = new AdaptiveRecommendationTuningAuditService();
