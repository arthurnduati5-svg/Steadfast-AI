import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type { Phase3PeerVisibilityDecision } from '../contracts/phase3PeerLearningContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateDecisionId(): string {
  return `pd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolvePeerGroupScope(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerVisibilityDecision {
  const group = repo.getPeerGroup(groupId);
  if (!group) {
    return buildMissingGroupScopeDecision(schoolId, studentId, groupId);
  }
  if (group.schoolId !== schoolId) {
    return buildCrossSchoolGroupDenial(schoolId, studentId);
  }
  if (group.groupStatus === 'archived' || group.groupStatus === 'blocked') {
    return buildMissingGroupScopeDecision(schoolId, studentId, groupId);
  }
  const memberships = repo.listPeerGroupMemberships(groupId);
  const isMember = memberships.some(m => m.studentId === studentId);
  if (!isMember) {
    return buildCrossLearnerGroupDenial(schoolId, studentId);
  }
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId: groupId,
    visibilityLevel: 'group_visible',
    safeSummary: 'Peer group is accessible within your learning scope.',
    safeReasonCodes: ['group_scope_verified'],
    createdAt: nowISO(),
  };
}

export function assertLearnerCanAccessPeerGroup(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerVisibilityDecision {
  return resolvePeerGroupScope(schoolId, studentId, groupId);
}

export function assertTeacherCanModeratePeerGroup(
  schoolId: string,
  teacherId: string,
  groupId: string,
): Phase3PeerVisibilityDecision {
  const group = repo.getPeerGroup(groupId);
  if (!group) {
    return buildMissingGroupScopeDecision(schoolId, teacherId, groupId);
  }
  if (group.schoolId !== schoolId) {
    return buildCrossSchoolGroupDenial(schoolId, teacherId);
  }
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId: groupId,
    visibilityLevel: 'group_visible',
    safeSummary: 'Teacher can moderate this peer group.',
    safeReasonCodes: ['teacher_can_moderate_group'],
    createdAt: nowISO(),
  };
}

export function filterGroupsForLearnerScope(
  schoolId: string,
  studentId: string,
  groups: { groupId: string; groupStatus: string; schoolId: string }[],
): { groupId: string; groupStatus: string; schoolId: string }[] {
  return groups.filter(g => {
    if (g.schoolId !== schoolId) return false;
    if (g.groupStatus === 'archived' || g.groupStatus === 'blocked') return false;
    const memberships = repo.listPeerGroupMemberships(g.groupId);
    return memberships.some(m => m.studentId === studentId);
  });
}

export function filterGroupsForTeacherScope(
  schoolId: string,
  teacherId: string,
  groups: { groupId: string; schoolId: string }[],
): { groupId: string; schoolId: string }[] {
  return groups.filter(g => g.schoolId === schoolId);
}

export function buildPeerGroupScopeDecision(
  schoolId: string,
  contentId: string,
  visibilityLevel: 'group_visible' | 'teacher_only' | 'blocked',
  safeSummary: string,
): Phase3PeerVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId,
    visibilityLevel,
    safeSummary,
    safeReasonCodes: ['group_scope_decision'],
    createdAt: nowISO(),
  };
}

export function buildMissingGroupScopeDecision(
  schoolId: string,
  studentId: string,
  groupId: string,
): Phase3PeerVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId: groupId,
    visibilityLevel: 'blocked',
    safeSummary: 'This peer group is not available in your learning scope.',
    safeReasonCodes: ['group_scope_missing'],
    createdAt: nowISO(),
  };
}

export function buildCrossSchoolGroupDenial(
  schoolId: string,
  actorId: string,
): Phase3PeerVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'blocked',
    safeSummary: 'Cross-school peer group access is not permitted.',
    safeReasonCodes: ['cross_school_group_denied'],
    createdAt: nowISO(),
  };
}

export function buildCrossLearnerGroupDenial(
  schoolId: string,
  studentId: string,
): Phase3PeerVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'blocked',
    safeSummary: 'You are not a member of this peer group.',
    safeReasonCodes: ['cross_learner_group_denied'],
    createdAt: nowISO(),
  };
}
