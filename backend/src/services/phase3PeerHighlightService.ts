import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import * as moderationPolicy from './phase3PeerContentModerationPolicyService';
import type {
  Phase3PeerHighlight,
  Phase3PeerHighlightType,
  Phase3PeerModerationStatus,
} from '../contracts/phase3PeerLearningContracts';

export function submitPeerHighlightForReview(input: {
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  highlightType: Phase3PeerHighlightType;
  safeTitle: string;
  safeSummary: string;
  safeContent: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
}): { highlight: Phase3PeerHighlight; moderationDecision: any } {
  const decision = moderationPolicy.moderatePeerHighlight(
    input.schoolId,
    'pending',
    input.safeTitle,
    input.safeSummary,
    input.safeContent,
  );
  const initialStatus: Phase3PeerModerationStatus =
    decision.moderationStatus === 'approved' ? 'pending_review' : decision.moderationStatus;
  const highlight = repo.upsertPeerHighlight({
    ...input,
    contentStatus: 'submitted_for_review',
    moderationStatus: initialStatus,
    visibilityLevel: 'teacher_only',
  });
  return { highlight, moderationDecision: decision };
}

export function approvePeerHighlight(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlight | null {
  const highlight = repo.getPeerHighlight(highlightId);
  if (!highlight || highlight.schoolId !== schoolId) return null;
  repo.updatePeerHighlightReviewStatus(highlightId, 'approved');
  return repo.getPeerHighlight(highlightId);
}

export function rejectPeerHighlight(
  schoolId: string,
  teacherId: string,
  highlightId: string,
): Phase3PeerHighlight | null {
  const highlight = repo.getPeerHighlight(highlightId);
  if (!highlight || highlight.schoolId !== schoolId) return null;
  repo.updatePeerHighlightReviewStatus(highlightId, 'rejected');
  return repo.getPeerHighlight(highlightId);
}

export function archivePeerHighlight(
  schoolId: string,
  highlightId: string,
): Phase3PeerHighlight | null {
  const highlight = repo.getPeerHighlight(highlightId);
  if (!highlight || highlight.schoolId !== schoolId) return null;
  return repo.upsertPeerHighlight({
    ...highlight,
    contentStatus: 'archived',
  });
}

export function getPeerHighlight(highlightId: string): Phase3PeerHighlight | null {
  return repo.getPeerHighlight(highlightId);
}

export function listApprovedPeerHighlightsForLearner(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerHighlight[] {
  const groupHighlights = repo.listPeerHighlightsForGroup(groupId);
  const ownHighlights = repo.listPeerHighlightsForLearner(schoolId, studentId);
  const all = [...groupHighlights, ...ownHighlights];
  const seen = new Set<string>();
  return all.filter(h => {
    if (seen.has(h.highlightId)) return false;
    seen.add(h.highlightId);
    return h.moderationStatus === 'approved' && (h.visibilityLevel === 'group_visible' || h.visibilityLevel === 'class_visible');
  });
}

export function listOwnPeerHighlightsForLearner(
  schoolId: string,
  studentId: string,
): Phase3PeerHighlight[] {
  return repo.listPeerHighlightsForLearner(schoolId, studentId);
}

export function buildPeerHighlightSafeView(highlight: Phase3PeerHighlight): any {
  return {
    highlightId: highlight.highlightId,
    schoolId: highlight.schoolId,
    groupId: highlight.groupId,
    studentId: highlight.studentId,
    teacherId: highlight.teacherId,
    highlightType: highlight.highlightType,
    contentStatus: highlight.contentStatus,
    moderationStatus: highlight.moderationStatus,
    visibilityLevel: highlight.visibilityLevel,
    safeTitle: highlight.safeTitle,
    safeSummary: highlight.safeSummary,
    safeContent: highlight.safeContent,
    safeReasonCodes: highlight.safeReasonCodes,
    safeEvidenceRefs: highlight.safeEvidenceRefs,
    sourceTruthStatus: highlight.sourceTruthStatus,
    createdAt: highlight.createdAt,
    updatedAt: highlight.updatedAt,
  };
}

export function dedupePeerHighlights(highlights: Phase3PeerHighlight[]): Phase3PeerHighlight[] {
  const seen = new Map<string, Phase3PeerHighlight>();
  for (const h of highlights) {
    if (!seen.has(h.highlightId)) {
      seen.set(h.highlightId, h);
    }
  }
  return Array.from(seen.values());
}

export function rankPeerHighlights(highlights: Phase3PeerHighlight[]): Phase3PeerHighlight[] {
  return highlights.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
