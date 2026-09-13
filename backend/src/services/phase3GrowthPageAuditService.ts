import type {
  Phase3GrowthPageAuditEvent,
  Phase3GrowthPageAuditEventType,
} from '../contracts/phase3GrowthPageContracts';
import { phase3GrowthPageRepository } from './phase3GrowthPageRepository';

let counter = 0;
function generateId(): string {
  return `gpe_${Date.now().toString(36)}_${(++counter).toString(36)}`;
}
function nowISO(): string {
  return new Date().toISOString();
}

export class Phase3GrowthPageAuditService {
  recordEvent(event: {
    schoolId: string;
    actorId: string;
    actorRole: string;
    eventType: Phase3GrowthPageAuditEventType;
    studentId?: string;
    teacherId?: string;
    classId?: string;
    cardId?: string;
    objectiveId?: string;
    topicId?: string;
    skillId?: string;
    safeReasonCodes?: string[];
    safeEvidenceRefs?: string[];
  }): Phase3GrowthPageAuditEvent {
    const auditEvent: Phase3GrowthPageAuditEvent = {
      eventId: generateId(),
      schoolId: event.schoolId,
      actorId: event.actorId,
      actorRole: event.actorRole,
      studentId: event.studentId,
      teacherId: event.teacherId,
      classId: event.classId,
      cardId: event.cardId,
      objectiveId: event.objectiveId,
      topicId: event.topicId,
      skillId: event.skillId,
      eventType: event.eventType,
      safeReasonCodes: event.safeReasonCodes ?? [],
      safeEvidenceRefs: event.safeEvidenceRefs ?? [],
      createdAt: nowISO(),
    };
    return phase3GrowthPageRepository.recordGrowthPageAuditEvent(auditEvent);
  }

  recordGrowthPageViewed(schoolId: string, actorId: string, actorRole: string, studentId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'growth_page_viewed', studentId });
  }

  recordDueNowItemCreated(schoolId: string, actorId: string, actorRole: string, studentId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'due_now_item_created', studentId });
  }

  recordDueNowItemCompleted(schoolId: string, actorId: string, actorRole: string, studentId: string, dueNowItemId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'due_now_item_completed', studentId, cardId: dueNowItemId });
  }

  recordWeakTopicLaneCreated(schoolId: string, actorId: string, actorRole: string, studentId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'weak_topic_lane_created', studentId });
  }

  recordMistakeJournalEntryCreated(schoolId: string, actorId: string, actorRole: string, studentId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'mistake_journal_entry_created', studentId });
  }

  recordTeacherOverviewViewed(schoolId: string, actorId: string, actorRole: string, teacherId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'growth_page_teacher_overview_viewed', teacherId });
  }

  recordEmptyStateReturned(schoolId: string, actorId: string, actorRole: string, studentId: string): Phase3GrowthPageAuditEvent {
    return this.recordEvent({ schoolId, actorId, actorRole, eventType: 'growth_page_empty_state_returned', studentId });
  }
}

export const phase3GrowthPageAuditService = new Phase3GrowthPageAuditService();
