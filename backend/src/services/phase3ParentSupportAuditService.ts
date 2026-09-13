import {
  type Phase3ParentSupportAuditEvent,
  type Phase3ParentSupportAuditEventType,
  type Phase3ParentRole,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

let eventIdCounter = 0;

function generateEventId(): string {
  const c = ++eventIdCounter;
  return `evt_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function recordParentSupportAuditEvent(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  eventType: Phase3ParentSupportAuditEventType;
  studentId?: string;
  parentId?: string;
  teacherId?: string;
  classId?: string;
  summaryId?: string;
  notificationDecisionId?: string;
  notificationCardId?: string;
  visibilityDecisionId?: string;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}): Phase3ParentSupportAuditEvent {
  const event: Phase3ParentSupportAuditEvent = {
    eventId: generateEventId(),
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    studentId: params.studentId,
    parentId: params.parentId,
    teacherId: params.teacherId,
    classId: params.classId,
    summaryId: params.summaryId,
    notificationDecisionId: params.notificationDecisionId,
    notificationCardId: params.notificationCardId,
    visibilityDecisionId: params.visibilityDecisionId,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes ?? [],
    safeEvidenceRefs: params.safeEvidenceRefs ?? [],
    createdAt: nowISO(),
  };

  repo.recordParentSupportAuditEvent(event);
  return event;
}

export function listParentSupportAuditEvents(
  schoolId: string,
  limit?: number,
): Phase3ParentSupportAuditEvent[] {
  return repo.listParentSupportAuditEvents(schoolId, limit);
}

export function recordParentLinkVerified(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_link_verified',
    safeReasonCodes: ['parent_link_verified'],
  });
}

export function recordParentLinkBlocked(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_link_blocked',
    safeReasonCodes: ['parent_link_blocked'],
  });
}

export function recordParentVisibilityChecked(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
  visibilityDecisionId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_visibility_checked',
    safeReasonCodes: ['parent_visibility_checked'],
  });
}

export function recordParentSafeSummaryCreated(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
  summaryId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_safe_summary_created',
    safeReasonCodes: ['parent_safe_summary_created'],
  });
}

export function recordParentSafeSummaryViewed(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
  summaryId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_safe_summary_viewed',
    safeReasonCodes: ['parent_safe_summary_viewed'],
  });
}

export function recordParentNotificationDecisionCreated(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
  notificationDecisionId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_notification_decision_created',
    safeReasonCodes: ['parent_notification_decision_created'],
  });
}

export function recordParentNotificationCardCreated(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
  notificationCardId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_notification_card_created',
    safeReasonCodes: ['parent_notification_card_created'],
  });
}

export function recordParentNotificationPreferenceUpdated(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_notification_preference_updated',
    safeReasonCodes: ['parent_notification_preference_updated'],
  });
}

export function recordTeacherParentSupportOverviewViewed(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  teacherId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'teacher_parent_support_overview_viewed',
    safeReasonCodes: ['teacher_parent_support_overview_viewed'],
  });
}

export function recordSourceRequiredReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_support_source_required_returned',
    safeReasonCodes: ['parent_support_source_required_returned'],
  });
}

export function recordTeacherSupportReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_support_teacher_support_returned',
    safeReasonCodes: ['parent_support_teacher_support_returned'],
  });
}

export function recordSafeguardingBlockReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_support_safeguarding_block_returned',
    safeReasonCodes: ['parent_support_safeguarding_block_returned'],
  });
}

export function recordEmptyStateReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: Phase3ParentRole;
  parentId: string;
  studentId: string;
}): Phase3ParentSupportAuditEvent {
  return recordParentSupportAuditEvent({
    ...params,
    eventType: 'parent_support_empty_state_returned',
    safeReasonCodes: ['parent_support_empty_state_returned'],
  });
}
