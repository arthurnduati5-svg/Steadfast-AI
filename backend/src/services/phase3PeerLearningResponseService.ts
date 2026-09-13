import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import * as groupScopeGuard from './phase3PeerGroupScopeGuardService';
import * as visibilityGuard from './phase3PeerVisibilityGuardService';
import type {
  Phase3PeerLearningLearnerView,
  Phase3PeerResourceShare,
  Phase3PeerHighlight,
  Phase3HealthyChallenge,
} from '../contracts/phase3PeerLearningContracts';

export function buildPeerLearningHomeView(
  schoolId: string,
  studentId: string,
): Phase3PeerLearningLearnerView {
  const groups = repo.listPeerGroupsForLearner(schoolId, studentId);
  const allResources: Phase3PeerResourceShare[] = [];
  const allHighlights: Phase3PeerHighlight[] = [];
  const allChallenges: Phase3HealthyChallenge[] = [];
  const ownResources = repo.listPeerResourceSharesForLearner(schoolId, studentId);
  const ownHighlights = repo.listPeerHighlightsForLearner(schoolId, studentId);
  const ownParticipations = repo.listHealthyChallengeParticipationForLearner(schoolId, studentId);

  for (const group of groups) {
    if (group.groupStatus === 'active' || group.groupStatus === 'teacher_review_required') {
      const scope = groupScopeGuard.resolvePeerGroupScope(schoolId, studentId, group.groupId);
      if (scope.visibilityLevel === 'group_visible') {
        const groupResources = repo.listPeerResourceSharesForGroup(group.groupId)
          .filter(r => r.moderationStatus === 'approved' && (r.visibilityLevel === 'group_visible' || r.visibilityLevel === 'class_visible'));
        allResources.push(...groupResources);
        const groupHighlights = repo.listPeerHighlightsForGroup(group.groupId)
          .filter(h => h.moderationStatus === 'approved' && (h.visibilityLevel === 'group_visible' || h.visibilityLevel === 'class_visible'));
        allHighlights.push(...groupHighlights);
        const groupChallenges = repo.listHealthyChallengesForGroup(group.groupId)
          .filter(c => c.challengeStatus === 'active');
        allChallenges.push(...groupChallenges);
      }
    }
  }

  const visibilityDecision = visibilityGuard.buildPeerVisibilityDecision(
    schoolId,
    studentId,
    'group_visible',
    'Peer learning content filtered to your scope.',
    ['home_view_built'],
  );

  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    safeHeadline: 'Your Peer Learning Space',
    safeSummary: 'Here are approved resources, highlights, and challenges available to your groups.',
    approvedResources: allResources,
    approvedHighlights: allHighlights,
    healthyChallenges: allChallenges,
    ownSubmissions: ownResources,
    ownHighlights: ownHighlights,
    ownParticipations: ownParticipations,
    safeEvidenceRefs: [],
    safeReasonCodes: ['home_view_built'],
    visibilityDecision,
  };
}

export function buildPeerGroupView(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerLearningLearnerView {
  const scope = groupScopeGuard.resolvePeerGroupScope(schoolId, studentId, groupId);
  if (scope.visibilityLevel !== 'group_visible') {
    return {
      schoolId,
      studentId,
      groupId,
      generatedAt: new Date().toISOString(),
      safeHeadline: 'Group Not Available',
      safeSummary: scope.safeSummary,
      approvedResources: [],
      approvedHighlights: [],
      healthyChallenges: [],
      ownSubmissions: [],
      ownHighlights: [],
      ownParticipations: [],
      safeEvidenceRefs: [],
      safeReasonCodes: scope.safeReasonCodes,
      visibilityDecision: scope,
    };
  }
  const group = repo.getPeerGroup(groupId);
  const resources = repo.listPeerResourceSharesForGroup(groupId)
    .filter(r => r.moderationStatus === 'approved' && (r.visibilityLevel === 'group_visible' || r.visibilityLevel === 'class_visible'));
  const highlights = repo.listPeerHighlightsForGroup(groupId)
    .filter(h => h.moderationStatus === 'approved' && (h.visibilityLevel === 'group_visible' || h.visibilityLevel === 'class_visible'));
  const challenges = repo.listHealthyChallengesForGroup(groupId)
    .filter(c => c.challengeStatus === 'active');
  const ownResources = repo.listPeerResourceSharesForLearner(schoolId, studentId);
  const ownHighlights = repo.listPeerHighlightsForLearner(schoolId, studentId);
  const ownParticipations = repo.listHealthyChallengeParticipationForLearner(schoolId, studentId);

  return {
    schoolId,
    studentId,
    groupId,
    generatedAt: new Date().toISOString(),
    safeHeadline: group ? group.safeTitle : 'Peer Group',
    safeSummary: group ? group.safeSummary : 'Peer group view.',
    approvedResources: resources,
    approvedHighlights: highlights,
    healthyChallenges: challenges,
    ownSubmissions: ownResources,
    ownHighlights: ownHighlights,
    ownParticipations: ownParticipations,
    safeEvidenceRefs: [],
    safeReasonCodes: ['group_view_built'],
    visibilityDecision: scope,
  };
}

export function buildApprovedPeerResourcesView(
  schoolId: string,
  studentId: string,
  groupId: string,
): { resources: Phase3PeerResourceShare[] } {
  const resources = repo.listPeerResourceSharesForGroup(groupId)
    .filter(r => r.moderationStatus === 'approved' && (r.visibilityLevel === 'group_visible' || r.visibilityLevel === 'class_visible'));
  return { resources };
}

export function buildPeerHighlightsView(
  schoolId: string,
  studentId: string,
  groupId: string,
): { highlights: Phase3PeerHighlight[] } {
  const highlights = repo.listPeerHighlightsForGroup(groupId)
    .filter(h => h.moderationStatus === 'approved' && (h.visibilityLevel === 'group_visible' || h.visibilityLevel === 'class_visible'));
  return { highlights };
}

export function buildHealthyChallengesView(
  schoolId: string,
  studentId: string,
  groupId: string,
): { challenges: Phase3HealthyChallenge[] } {
  const challenges = repo.listHealthyChallengesForGroup(groupId)
    .filter(c => c.challengeStatus === 'active');
  return { challenges };
}

export function buildOwnPeerSubmissionsView(
  schoolId: string,
  studentId: string,
): { resources: Phase3PeerResourceShare[]; highlights: Phase3PeerHighlight[] } {
  return {
    resources: repo.listPeerResourceSharesForLearner(schoolId, studentId),
    highlights: repo.listPeerHighlightsForLearner(schoolId, studentId),
  };
}

export function buildPeerLearningEmptyStateView(
  schoolId: string,
  studentId: string,
): any {
  return {
    schoolId,
    studentId,
    generatedAt: new Date().toISOString(),
    safeHeadline: 'No peer learning content available yet.',
    safeSummary: 'Resources and highlights will appear here once a teacher sets up your peer groups.',
    approvedResources: [],
    approvedHighlights: [],
    healthyChallenges: [],
    safeReasonCodes: ['empty_state'],
  };
}

export function buildPeerSourceRequiredNotice(schoolId: string): any {
  return {
    schoolId,
    visibilityLevel: 'teacher_only',
    safeSummary: 'This item needs an approved source or teacher confirmation before it can be shared with peers.',
    safeReasonCodes: ['source_required'],
  };
}

export function buildPeerTeacherReviewNotice(schoolId: string): any {
  return {
    schoolId,
    visibilityLevel: 'teacher_only',
    safeSummary: 'This item is waiting for teacher review before it can be shared.',
    safeReasonCodes: ['pending_teacher_review'],
  };
}

export function buildPeerSafeguardingBlockedNotice(schoolId: string): any {
  return {
    schoolId,
    visibilityLevel: 'blocked',
    safeSummary: 'Some information is only visible to authorized safeguarding staff.',
    safeReasonCodes: ['safeguarding_blocked'],
  };
}
