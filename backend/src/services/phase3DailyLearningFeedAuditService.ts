import type {
  Phase3DailyLearningFeedAuditEvent,
  Phase3DailyLearningFeedAuditEventType,
} from '../contracts/phase3DailyLearningFeedContracts';

let auditIdCounter = 0;

function generateId(): string {
  const c = ++auditIdCounter;
  return `feed_audit_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

const auditStore = new Map<string, Phase3DailyLearningFeedAuditEvent>();

export class Phase3DailyLearningFeedAuditService {
  recordEvent(event: Omit<Phase3DailyLearningFeedAuditEvent, 'eventId' | 'createdAt'>): Phase3DailyLearningFeedAuditEvent {
    const stored: Phase3DailyLearningFeedAuditEvent = {
      ...event,
      eventId: generateId(),
      createdAt: nowISO(),
    };
    auditStore.set(stored.eventId, stored);
    return stored;
  }

  recordDailyLearningFeedViewed(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      studentId,
      eventType: 'daily_learning_feed_viewed',
      safeReasonCodes: extras?.safeReasonCodes || [],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  recordDailyLearningFeedItemRanked(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId?: string,
    feedItemId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      objectiveId,
      feedItemId,
      eventType: 'daily_learning_feed_item_ranked',
      safeReasonCodes: extras?.safeReasonCodes || [],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  recordSourceRequiredItemCreated(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      objectiveId,
      eventType: 'daily_learning_feed_source_required_item_created',
      safeReasonCodes: extras?.safeReasonCodes || ['source_required_status'],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  recordTeacherOverviewViewed(
    schoolId: string,
    actorId: string,
    actorRole: string,
    classId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      classId,
      eventType: 'daily_learning_feed_teacher_overview_viewed',
      safeReasonCodes: extras?.safeReasonCodes || [],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  recordEmptyStateReturned(
    schoolId: string,
    actorId: string,
    actorRole: string,
    studentId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      studentId,
      eventType: 'daily_learning_feed_empty_state_returned',
      safeReasonCodes: extras?.safeReasonCodes || [],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  recordBlockedItemReturned(
    schoolId: string,
    actorId: string,
    actorRole: string,
    objectiveId?: string,
    extras?: Partial<Phase3DailyLearningFeedAuditEvent>,
  ): Phase3DailyLearningFeedAuditEvent {
    return this.recordEvent({
      schoolId,
      actorId,
      actorRole,
      objectiveId,
      eventType: 'daily_learning_feed_blocked_item_returned',
      safeReasonCodes: extras?.safeReasonCodes || [],
      safeEvidenceRefs: extras?.safeEvidenceRefs || [],
    });
  }

  resetForTests(): void {
    auditStore.clear();
    auditIdCounter = 0;
  }
}

export const phase3DailyLearningFeedAuditService = new Phase3DailyLearningFeedAuditService();
