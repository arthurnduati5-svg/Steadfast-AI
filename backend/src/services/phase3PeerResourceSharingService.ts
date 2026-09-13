import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import * as moderationPolicy from './phase3PeerContentModerationPolicyService';
import type {
  Phase3PeerResourceShare,
  Phase3PeerResourceType,
  Phase3PeerModerationStatus,
} from '../contracts/phase3PeerLearningContracts';

export function submitPeerResourceForReview(input: {
  schoolId: string;
  groupId?: string;
  studentId?: string;
  teacherId?: string;
  subjectId?: string;
  topicId?: string;
  objectiveId?: string;
  resourceType: Phase3PeerResourceType;
  safeTitle: string;
  safeSummary: string;
  safeContent: string;
  safeReasonCodes: string[];
  safeEvidenceRefs: string[];
  sourceTruthStatus: string;
}): { resource: Phase3PeerResourceShare; moderationDecision: any } {
  const decision = moderationPolicy.moderatePeerResourceShare(
    input.schoolId,
    'pending',
    input.safeTitle,
    input.safeSummary,
    input.safeContent,
  );
  const initialStatus: Phase3PeerModerationStatus =
    decision.moderationStatus === 'approved' ? 'pending_review' : decision.moderationStatus;
  const resource = repo.upsertPeerResourceShare({
    ...input,
    contentStatus: 'submitted_for_review',
    moderationStatus: initialStatus,
    visibilityLevel: 'teacher_only',
  });
  return { resource, moderationDecision: decision };
}

export function approvePeerResource(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceShare | null {
  const resource = repo.getPeerResourceShare(resourceId);
  if (!resource || resource.schoolId !== schoolId) return null;
  repo.updatePeerResourceReviewStatus(resourceId, 'approved');
  const updated = repo.getPeerResourceShare(resourceId);
  return updated;
}

export function rejectPeerResource(
  schoolId: string,
  teacherId: string,
  resourceId: string,
): Phase3PeerResourceShare | null {
  const resource = repo.getPeerResourceShare(resourceId);
  if (!resource || resource.schoolId !== schoolId) return null;
  repo.updatePeerResourceReviewStatus(resourceId, 'rejected');
  const updated = repo.getPeerResourceShare(resourceId);
  return updated;
}

export function archivePeerResource(
  schoolId: string,
  resourceId: string,
): Phase3PeerResourceShare | null {
  const resource = repo.getPeerResourceShare(resourceId);
  if (!resource || resource.schoolId !== schoolId) return null;
  const updated = repo.upsertPeerResourceShare({
    ...resource,
    contentStatus: 'archived',
  });
  return updated;
}

export function getPeerResource(resourceId: string): Phase3PeerResourceShare | null {
  return repo.getPeerResourceShare(resourceId);
}

export function listApprovedPeerResourcesForLearner(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerResourceShare[] {
  const groupResources = repo.listPeerResourceSharesForGroup(groupId);
  const ownResources = repo.listPeerResourceSharesForLearner(schoolId, studentId);
  const all = [...groupResources, ...ownResources];
  const seen = new Set<string>();
  return all.filter(r => {
    if (seen.has(r.resourceId)) return false;
    seen.add(r.resourceId);
    return r.moderationStatus === 'approved' && (r.visibilityLevel === 'group_visible' || r.visibilityLevel === 'class_visible');
  });
}

export function listOwnPeerResourcesForLearner(
  schoolId: string,
  studentId: string,
): Phase3PeerResourceShare[] {
  return repo.listPeerResourceSharesForLearner(schoolId, studentId);
}

export function buildPeerResourceSafeView(resource: Phase3PeerResourceShare): any {
  return {
    resourceId: resource.resourceId,
    schoolId: resource.schoolId,
    groupId: resource.groupId,
    studentId: resource.studentId,
    teacherId: resource.teacherId,
    subjectId: resource.subjectId,
    topicId: resource.topicId,
    objectiveId: resource.objectiveId,
    resourceType: resource.resourceType,
    contentStatus: resource.contentStatus,
    moderationStatus: resource.moderationStatus,
    visibilityLevel: resource.visibilityLevel,
    safeTitle: resource.safeTitle,
    safeSummary: resource.safeSummary,
    safeContent: resource.safeContent,
    safeReasonCodes: resource.safeReasonCodes,
    safeEvidenceRefs: resource.safeEvidenceRefs,
    sourceTruthStatus: resource.sourceTruthStatus,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  };
}

export function dedupePeerResources(resources: Phase3PeerResourceShare[]): Phase3PeerResourceShare[] {
  const seen = new Map<string, Phase3PeerResourceShare>();
  for (const r of resources) {
    if (!seen.has(r.resourceId)) {
      seen.set(r.resourceId, r);
    }
  }
  return Array.from(seen.values());
}

export function rankPeerResources(resources: Phase3PeerResourceShare[]): Phase3PeerResourceShare[] {
  return resources.sort((a, b) => {
    if (a.visibilityLevel === 'class_visible' && b.visibilityLevel !== 'class_visible') return -1;
    if (b.visibilityLevel === 'class_visible' && a.visibilityLevel !== 'class_visible') return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}
