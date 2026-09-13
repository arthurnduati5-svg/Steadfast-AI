import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3PeerHighlightReviewItem,
  Phase3PeerModerationStatus,
} from '../contracts/phase3PeerLearningContracts';

export function createPeerHighlightReviewItem(input: {
  highlightId: string;
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  contentType: string;
  moderationStatus: Phase3PeerModerationStatus;
  safeTitle: string;
  safeSummary: string;
  safeReasonCodes: string[];
}): Phase3PeerHighlightReviewItem {
  return repo.upsertPeerHighlightReviewItem({
    ...input,
    reviewedBy: undefined,
    reviewedAt: undefined,
  });
}

export function getPeerHighlightReviewItem(reviewItemId: string): Phase3PeerHighlightReviewItem | null {
  return repo.getPeerHighlightReviewItem(reviewItemId);
}

export function listPeerHighlightReviewQueueForTeacher(schoolId: string): Phase3PeerHighlightReviewItem[] {
  return repo.listPeerHighlightReviewQueue(schoolId).filter(
    item => item.moderationStatus === 'pending_review' || item.moderationStatus === 'not_required'
  );
}

export function reviewPeerHighlight(
  schoolId: string,
  teacherId: string,
  highlightId: string,
  moderationStatus: 'approved' | 'rejected' | 'blocked',
): Phase3PeerHighlightReviewItem | null {
  const highlight = repo.getPeerHighlight(highlightId);
  if (!highlight || highlight.schoolId !== schoolId) return null;
  repo.updatePeerHighlightReviewStatus(highlightId, moderationStatus);
  const item = repo.upsertPeerHighlightReviewItem({
    highlightId,
    schoolId,
    groupId: highlight.groupId,
    studentId: highlight.studentId,
    teacherId,
    contentType: 'peer_highlight',
    moderationStatus,
    safeTitle: highlight.safeTitle,
    safeSummary: `Reviewed by teacher ${teacherId}`,
    safeReasonCodes: [`${moderationStatus}_by_teacher`],
    reviewedBy: teacherId,
    reviewedAt: new Date().toISOString(),
  });
  return item;
}

export function approvePeerHighlightReviewItem(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlightReviewItem | null {
  return reviewPeerHighlight(schoolId, teacherId, highlightId, 'approved');
}

export function rejectPeerHighlightReviewItem(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlightReviewItem | null {
  return reviewPeerHighlight(schoolId, teacherId, highlightId, 'rejected');
}

export function markPeerHighlightSourceRequired(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlightReviewItem | null {
  const highlight = repo.getPeerHighlight(highlightId);
  if (!highlight || highlight.schoolId !== schoolId) return null;
  repo.updatePeerHighlightReviewStatus(highlightId, 'source_required');
  return repo.upsertPeerHighlightReviewItem({
    highlightId,
    schoolId,
    groupId: highlight.groupId,
    studentId: highlight.studentId,
    teacherId,
    contentType: 'peer_highlight',
    moderationStatus: 'source_required',
    safeTitle: highlight.safeTitle,
    safeSummary: 'Source context required before this highlight can be shared.',
    safeReasonCodes: ['source_required'],
    reviewedBy: teacherId,
    reviewedAt: new Date().toISOString(),
  });
}

export function markPeerHighlightBlocked(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlightReviewItem | null {
  return reviewPeerHighlight(schoolId, teacherId, highlightId, 'blocked');
}

export function rankPeerHighlightReviewQueue(items: Phase3PeerHighlightReviewItem[]): Phase3PeerHighlightReviewItem[] {
  return items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export function dedupePeerHighlightReviewQueue(items: Phase3PeerHighlightReviewItem[]): Phase3PeerHighlightReviewItem[] {
  const seen = new Map<string, Phase3PeerHighlightReviewItem>();
  for (const item of items) {
    if (!seen.has(item.reviewItemId)) {
      seen.set(item.reviewItemId, item);
    }
  }
  return Array.from(seen.values());
}
