import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3PeerResourceReviewItem,
  Phase3PeerModerationStatus,
} from '../contracts/phase3PeerLearningContracts';

export function createPeerResourceReviewItem(input: {
  resourceId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  contentType: string;
  moderationStatus: Phase3PeerModerationStatus;
  safeTitle: string;
  safeSummary: string;
  safeReasonCodes: string[];
}): Phase3PeerResourceReviewItem {
  return repo.upsertPeerResourceReviewItem({
    ...input,
    reviewedBy: undefined,
    reviewedAt: undefined,
  });
}

export function getPeerResourceReviewItem(reviewItemId: string): Phase3PeerResourceReviewItem | null {
  return repo.getPeerResourceReviewItem(reviewItemId);
}

export function listPeerResourceReviewQueueForTeacher(schoolId: string): Phase3PeerResourceReviewItem[] {
  return repo.listPeerResourceReviewQueue(schoolId).filter(
    item => item.moderationStatus === 'pending_review' || item.moderationStatus === 'not_required'
  );
}

export function reviewPeerResource(
  schoolId: string,
  teacherId: string,
  resourceId: string,
  moderationStatus: 'approved' | 'rejected' | 'blocked',
): Phase3PeerResourceReviewItem | null {
  const resource = repo.getPeerResourceShare(resourceId);
  if (!resource || resource.schoolId !== schoolId) return null;
  repo.updatePeerResourceReviewStatus(resourceId, moderationStatus);
  const item = repo.upsertPeerResourceReviewItem({
    resourceId,
    schoolId,
    groupId: resource.groupId,
    studentId: resource.studentId,
    teacherId,
    contentType: 'resource_share',
    moderationStatus,
    safeTitle: resource.safeTitle,
    safeSummary: `Reviewed by teacher ${teacherId}`,
    safeReasonCodes: [`${moderationStatus}_by_teacher`],
    reviewedBy: teacherId,
    reviewedAt: new Date().toISOString(),
  });
  return item;
}

export function approvePeerResourceReviewItem(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceReviewItem | null {
  return reviewPeerResource(schoolId, teacherId, resourceId, 'approved');
}

export function rejectPeerResourceReviewItem(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceReviewItem | null {
  return reviewPeerResource(schoolId, teacherId, resourceId, 'rejected');
}

export function markPeerResourceSourceRequired(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceReviewItem | null {
  const resource = repo.getPeerResourceShare(resourceId);
  if (!resource || resource.schoolId !== schoolId) return null;
  repo.updatePeerResourceReviewStatus(resourceId, 'source_required');
  return repo.upsertPeerResourceReviewItem({
    resourceId,
    schoolId,
    groupId: resource.groupId,
    studentId: resource.studentId,
    teacherId,
    contentType: 'resource_share',
    moderationStatus: 'source_required',
    safeTitle: resource.safeTitle,
    safeSummary: 'Source context required before this resource can be shared.',
    safeReasonCodes: ['source_required'],
    reviewedBy: teacherId,
    reviewedAt: new Date().toISOString(),
  });
}

export function markPeerResourceBlocked(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceReviewItem | null {
  return reviewPeerResource(schoolId, teacherId, resourceId, 'blocked');
}

export function rankPeerResourceReviewQueue(items: Phase3PeerResourceReviewItem[]): Phase3PeerResourceReviewItem[] {
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function dedupePeerResourceReviewQueue(items: Phase3PeerResourceReviewItem[]): Phase3PeerResourceReviewItem[] {
  const seen = new Map<string, Phase3PeerResourceReviewItem>();
  for (const item of items) {
    if (!seen.has(item.reviewItemId)) {
      seen.set(item.reviewItemId, item);
    }
  }
  return Array.from(seen.values());
}
