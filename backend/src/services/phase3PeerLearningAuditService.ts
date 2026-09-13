import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3PeerLearningAuditEvent,
  Phase3PeerLearningAuditEventType,
} from '../contracts/phase3PeerLearningContracts';

let eventIdCounter = 0;

function generateEventId(): string {
  const c = ++eventIdCounter;
  return `evt_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function recordPeerLearningAuditEvent(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  eventType: Phase3PeerLearningAuditEventType;
  studentId?: string;
  teacherId?: string;
  classId?: string;
  groupId?: string;
  resourceId?: string;
  highlightId?: string;
  challengeId?: string;
  participationId?: string;
  reviewItemId?: string;
  visibilityDecisionId?: string;
  moderationDecisionId?: string;
  safeReasonCodes?: string[];
  safeEvidenceRefs?: string[];
}): Phase3PeerLearningAuditEvent {
  const event: Phase3PeerLearningAuditEvent = {
    eventId: generateEventId(),
    schoolId: params.schoolId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    studentId: params.studentId,
    teacherId: params.teacherId,
    classId: params.classId,
    groupId: params.groupId,
    resourceId: params.resourceId,
    highlightId: params.highlightId,
    challengeId: params.challengeId,
    participationId: params.participationId,
    reviewItemId: params.reviewItemId,
    visibilityDecisionId: params.visibilityDecisionId,
    moderationDecisionId: params.moderationDecisionId,
    eventType: params.eventType,
    safeReasonCodes: params.safeReasonCodes ?? [],
    safeEvidenceRefs: params.safeEvidenceRefs ?? [],
    createdAt: nowISO(),
  };
  repo.recordPeerLearningAuditEvent(event);
  return event;
}

export function listPeerLearningAuditEvents(
  schoolId: string,
  limit?: number,
): Phase3PeerLearningAuditEvent[] {
  return repo.listPeerLearningAuditEvents(schoolId, limit);
}

export function recordPeerGroupCreated(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  groupId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_group_created',
    safeReasonCodes: ['peer_group_created'],
  });
}

export function recordPeerGroupMembershipAdded(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  groupId: string;
  studentId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_group_membership_added',
    safeReasonCodes: ['peer_group_membership_added'],
  });
}

export function recordPeerVisibilityChecked(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  visibilityDecisionId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_visibility_checked',
    safeReasonCodes: ['peer_visibility_checked'],
  });
}

export function recordPeerResourceSubmitted(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  resourceId: string;
  groupId?: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_resource_submitted',
    safeReasonCodes: ['peer_resource_submitted'],
  });
}

export function recordPeerResourceReviewed(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  resourceId: string;
  reviewItemId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_resource_reviewed',
    safeReasonCodes: ['peer_resource_reviewed'],
  });
}

export function recordPeerResourceApproved(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  resourceId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_resource_approved',
    safeReasonCodes: ['peer_resource_approved'],
  });
}

export function recordPeerResourceRejected(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  resourceId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_resource_rejected',
    safeReasonCodes: ['peer_resource_rejected'],
  });
}

export function recordPeerHighlightSubmitted(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  highlightId: string;
  groupId?: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_highlight_submitted',
    safeReasonCodes: ['peer_highlight_submitted'],
  });
}

export function recordPeerHighlightReviewed(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  highlightId: string;
  reviewItemId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_highlight_reviewed',
    safeReasonCodes: ['peer_highlight_reviewed'],
  });
}

export function recordPeerHighlightApproved(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  highlightId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_highlight_approved',
    safeReasonCodes: ['peer_highlight_approved'],
  });
}

export function recordPeerHighlightRejected(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  highlightId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_highlight_rejected',
    safeReasonCodes: ['peer_highlight_rejected'],
  });
}

export function recordHealthyChallengeCreated(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  challengeId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'healthy_challenge_created',
    safeReasonCodes: ['healthy_challenge_created'],
  });
}

export function recordHealthyChallengeJoined(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  challengeId: string;
  participationId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'healthy_challenge_joined',
    safeReasonCodes: ['healthy_challenge_joined'],
  });
}

export function recordHealthyChallengeStepCompleted(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
  challengeId: string;
  participationId: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'healthy_challenge_step_completed',
    safeReasonCodes: ['healthy_challenge_step_completed'],
  });
}

export function recordTeacherPeerOverviewViewed(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'teacher_peer_overview_viewed',
    safeReasonCodes: ['teacher_peer_overview_viewed'],
  });
}

export function recordSourceRequiredReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_learning_source_required_returned',
    safeReasonCodes: ['source_required_returned'],
  });
}

export function recordSafeguardingBlockReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_learning_safeguarding_block_returned',
    safeReasonCodes: ['safeguarding_block_returned'],
  });
}

export function recordDeenBoundaryReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_learning_deen_boundary_returned',
    safeReasonCodes: ['deen_boundary_returned'],
  });
}

export function recordAnswerArtifactBlockReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_learning_answer_artifact_block_returned',
    safeReasonCodes: ['answer_artifact_block_returned'],
  });
}

export function recordEmptyStateReturned(params: {
  schoolId: string;
  actorId: string;
  actorRole: string;
}): Phase3PeerLearningAuditEvent {
  return recordPeerLearningAuditEvent({
    ...params,
    eventType: 'peer_learning_empty_state_returned',
    safeReasonCodes: ['empty_state_returned'],
  });
}
