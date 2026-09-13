import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3PeerLearningTeacherOverview,
  Phase3PeerLearningTeacherGroupRow,
  Phase3PeerLearningTeacherContentRow,
} from '../contracts/phase3PeerLearningContracts';

export function getTeacherPeerLearningOverview(
  schoolId: string,
  teacherId: string,
): Phase3PeerLearningTeacherOverview {
  const groups = repo.listPeerGroupsForSchool(schoolId);
  const groupRows: Phase3PeerLearningTeacherGroupRow[] = groups.map(g => {
    const memberships = repo.listPeerGroupMemberships(g.groupId);
    const resources = repo.listPeerResourceSharesForGroup(g.groupId);
    const highlights = repo.listPeerHighlightsForGroup(g.groupId);
    const challenges = repo.listHealthyChallengesForGroup(g.groupId);
    return {
      groupId: g.groupId,
      groupType: g.groupType,
      groupStatus: g.groupStatus,
      memberCount: memberships.length,
      approvedResourceCount: resources.filter(r => r.moderationStatus === 'approved').length,
      approvedHighlightCount: highlights.filter(h => h.moderationStatus === 'approved').length,
      healthyChallengeCount: challenges.length,
      pendingReviewCount: resources.filter(r => r.moderationStatus === 'pending_review').length + highlights.filter(h => h.moderationStatus === 'pending_review').length,
      sourceRequiredCount: resources.filter(r => r.moderationStatus === 'source_required').length + highlights.filter(h => h.moderationStatus === 'source_required').length,
      blockedCount: resources.filter(r => r.moderationStatus === 'blocked' || r.moderationStatus.startsWith('blocked')).length + highlights.filter(h => h.moderationStatus === 'blocked' || h.moderationStatus.startsWith('blocked')).length,
      safePatternSummary: `${memberships.length} members, ${resources.filter(r => r.moderationStatus === 'approved').length} approved resources`,
      recommendedTeacherAction: resources.filter(r => r.moderationStatus === 'pending_review').length > 0 ? 'Review pending resources' : 'No action needed',
      safeEvidenceRefs: [],
    };
  });

  const allResources = repo.listAllPeerResourcesForSchool(schoolId);
  const allHighlights = repo.listAllPeerHighlightsForSchool(schoolId);

  const contentRows: Phase3PeerLearningTeacherContentRow[] = [
    ...allResources.filter(r => r.moderationStatus !== 'approved').map(r => ({
      contentId: r.resourceId,
      contentType: 'resource_share',
      contentStatus: r.contentStatus,
      moderationStatus: r.moderationStatus,
      groupId: r.groupId,
      studentId: r.studentId,
      teacherId: r.teacherId,
      safeTitle: r.safeTitle,
      safeSummary: r.safeSummary,
      recommendedTeacherAction: r.moderationStatus === 'pending_review' ? 'Review this resource' : 'No action needed',
      safeEvidenceRefs: r.safeEvidenceRefs,
    })),
    ...allHighlights.filter(h => h.moderationStatus !== 'approved').map(h => ({
      contentId: h.highlightId,
      contentType: 'peer_highlight',
      contentStatus: h.contentStatus,
      moderationStatus: h.moderationStatus,
      groupId: h.groupId,
      studentId: h.studentId,
      teacherId: h.teacherId,
      safeTitle: h.safeTitle,
      safeSummary: h.safeSummary,
      recommendedTeacherAction: h.moderationStatus === 'pending_review' ? 'Review this highlight' : 'No action needed',
      safeEvidenceRefs: h.safeEvidenceRefs,
    })),
  ];

  const totalResourcesPendingReview = allResources.filter(r => r.moderationStatus === 'pending_review').length;
  const totalHighlightsPendingReview = allHighlights.filter(h => h.moderationStatus === 'pending_review').length;

  return {
    schoolId,
    teacherId,
    generatedAt: new Date().toISOString(),
    totalPeerGroups: groups.length,
    totalActivePeerGroups: groups.filter(g => g.groupStatus === 'active').length,
    totalResourcesPendingReview,
    totalHighlightsPendingReview,
    totalHealthyChallenges: repo.listHealthyChallengesForSchool(schoolId).length,
    totalSourceRequired: allResources.filter(r => r.moderationStatus === 'source_required').length + allHighlights.filter(h => h.moderationStatus === 'source_required').length,
    totalBlockedBySafeguarding: allResources.filter(r => r.moderationStatus === 'blocked_by_safeguarding').length + allHighlights.filter(h => h.moderationStatus === 'blocked_by_safeguarding').length,
    totalBlockedByAnswerArtifact: allResources.filter(r => r.moderationStatus === 'blocked_by_answer_artifact').length + allHighlights.filter(h => h.moderationStatus === 'blocked_by_answer_artifact').length,
    groupRows,
    contentRows,
    safeSummary: `Your peer learning overview: ${groups.length} groups, ${totalResourcesPendingReview} resources pending review, ${totalHighlightsPendingReview} highlights pending review.`,
    recommendedTeacherActions: totalResourcesPendingReview > 0 || totalHighlightsPendingReview > 0
      ? ['Review pending peer content', 'Create healthy challenges for active groups']
      : ['Create peer groups for your classes', 'Set up healthy challenges'],
  };
}

export function getClassPeerLearningOverview(
  schoolId: string,
  teacherId: string,
  classId: string,
): Phase3PeerLearningTeacherOverview {
  const overview = getTeacherPeerLearningOverview(schoolId, teacherId);
  return {
    ...overview,
    groupRows: overview.groupRows.filter(g => g.groupType === 'class_group'),
    safeSummary: `Class peer learning overview: ${overview.groupRows.filter(g => g.groupType === 'class_group').length} groups.`,
  };
}

export function getPeerGroupTeacherSummary(
  schoolId: string,
  teacherId: string,
  groupId: string,
): Phase3PeerLearningTeacherGroupRow | null {
  const groups = repo.listPeerGroupsForSchool(schoolId);
  const group = groups.find(g => g.groupId === groupId);
  if (!group) return null;
  const memberships = repo.listPeerGroupMemberships(groupId);
  const resources = repo.listPeerResourceSharesForGroup(groupId);
  const highlights = repo.listPeerHighlightsForGroup(groupId);
  const challenges = repo.listHealthyChallengesForGroup(groupId);
  return {
    groupId: group.groupId,
    groupType: group.groupType,
    groupStatus: group.groupStatus,
    memberCount: memberships.length,
    approvedResourceCount: resources.filter(r => r.moderationStatus === 'approved').length,
    approvedHighlightCount: highlights.filter(h => h.moderationStatus === 'approved').length,
    healthyChallengeCount: challenges.length,
    pendingReviewCount: resources.filter(r => r.moderationStatus === 'pending_review').length + highlights.filter(h => h.moderationStatus === 'pending_review').length,
    sourceRequiredCount: resources.filter(r => r.moderationStatus === 'source_required').length + highlights.filter(h => h.moderationStatus === 'source_required').length,
    blockedCount: resources.filter(r => r.moderationStatus === 'blocked' || r.moderationStatus.startsWith('blocked')).length + highlights.filter(h => h.moderationStatus === 'blocked' || h.moderationStatus.startsWith('blocked')).length,
    safePatternSummary: `${memberships.length} members`,
    recommendedTeacherAction: resources.filter(r => r.moderationStatus === 'pending_review').length > 0 ? 'Review pending resources' : 'Monitor group activity',
    safeEvidenceRefs: [],
  };
}

export function getPeerResourceReviewQueueOverview(
  schoolId: string,
  teacherId: string,
): Phase3PeerLearningTeacherContentRow[] {
  const allResources = repo.listAllPeerResourcesForSchool(schoolId);
  return allResources
    .filter(r => r.moderationStatus === 'pending_review')
    .map(r => ({
      contentId: r.resourceId,
      contentType: 'resource_share',
      contentStatus: r.contentStatus,
      moderationStatus: r.moderationStatus,
      groupId: r.groupId,
      studentId: r.studentId,
      teacherId: r.teacherId,
      safeTitle: r.safeTitle,
      safeSummary: r.safeSummary,
      recommendedTeacherAction: 'Review this resource',
      safeEvidenceRefs: r.safeEvidenceRefs,
    }));
}

export function getPeerHighlightReviewQueueOverview(
  schoolId: string,
  teacherId: string,
): Phase3PeerLearningTeacherContentRow[] {
  const allHighlights = repo.listAllPeerHighlightsForSchool(schoolId);
  return allHighlights
    .filter(h => h.moderationStatus === 'pending_review')
    .map(h => ({
      contentId: h.highlightId,
      contentType: 'peer_highlight',
      contentStatus: h.contentStatus,
      moderationStatus: h.moderationStatus,
      groupId: h.groupId,
      studentId: h.studentId,
      teacherId: h.teacherId,
      safeTitle: h.safeTitle,
      safeSummary: h.safeSummary,
      recommendedTeacherAction: 'Review this highlight',
      safeEvidenceRefs: h.safeEvidenceRefs,
    }));
}

export function getHealthyChallengeTeacherSummary(
  schoolId: string,
  teacherId: string,
): Phase3PeerLearningTeacherContentRow[] {
  const challenges = repo.listHealthyChallengesForSchool(schoolId);
  return challenges.map(c => ({
    contentId: c.challengeId,
    contentType: 'healthy_challenge',
    contentStatus: c.challengeStatus as any,
    moderationStatus: 'not_required' as any,
    groupId: c.groupId,
    teacherId: c.teacherId,
    safeTitle: c.safeTitle,
    safeSummary: c.safeSummary,
    recommendedTeacherAction: c.challengeStatus === 'active' ? 'Monitor participation' : 'Consider creating new challenges',
    safeEvidenceRefs: c.safeEvidenceRefs,
  }));
}

export function getTeacherRecommendedPeerLearningActions(
  schoolId: string,
  teacherId: string,
): string[] {
  const groups = repo.listPeerGroupsForSchool(schoolId);
  const allResources = repo.listAllPeerResourcesForSchool(schoolId);
  const allHighlights = repo.listAllPeerHighlightsForSchool(schoolId);
  const actions: string[] = [];
  if (allResources.some(r => r.moderationStatus === 'pending_review')) {
    actions.push('Review pending peer resource submissions.');
  }
  if (allHighlights.some(h => h.moderationStatus === 'pending_review')) {
    actions.push('Review pending peer highlight submissions.');
  }
  if (allResources.some(r => r.moderationStatus === 'source_required')) {
    actions.push('Provide source context for source-required resources.');
  }
  if (groups.filter(g => g.groupStatus === 'active').length === 0) {
    actions.push('Create active peer groups to enable peer learning.');
  }
  if (actions.length === 0) {
    actions.push('No action needed. Peer learning is running smoothly.');
  }
  return actions;
}
