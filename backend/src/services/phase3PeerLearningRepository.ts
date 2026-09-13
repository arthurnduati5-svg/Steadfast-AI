import type {
  Phase3PeerGroup,
  Phase3PeerGroupType,
  Phase3PeerGroupStatus,
  Phase3PeerGroupMembership,
  Phase3PeerVisibilityDecision,
  Phase3PeerModerationDecision,
  Phase3PeerResourceShare,
  Phase3PeerResourceReviewItem,
  Phase3PeerHighlight,
  Phase3PeerHighlightReviewItem,
  Phase3HealthyChallenge,
  Phase3HealthyChallengeParticipation,
  Phase3PeerLearningAuditEvent,
  Phase3PeerLearningAuditEventType,
  Phase3PeerContentStatus,
  Phase3PeerModerationStatus,
  Phase3PeerVisibilityLevel,
  Phase3PeerResourceType,
  Phase3PeerHighlightType,
  Phase3HealthyChallengeType,
  Phase3HealthyChallengeStatus,
} from '../contracts/phase3PeerLearningContracts';

let groupIdCounter = 0;
let membershipIdCounter = 0;
let visibilityDecisionIdCounter = 0;
let moderationDecisionIdCounter = 0;
let resourceIdCounter = 0;
let reviewItemIdCounter = 0;
let highlightIdCounter = 0;
let highlightReviewItemIdCounter = 0;
let challengeIdCounter = 0;
let participationIdCounter = 0;
let eventIdCounter = 0;

function generateId(prefix: string): string {
  const c =
    prefix === 'pg' ? ++groupIdCounter :
    prefix === 'pm' ? ++membershipIdCounter :
    prefix === 'pd' ? ++visibilityDecisionIdCounter :
    prefix === 'md' ? ++moderationDecisionIdCounter :
    prefix === 'pr' ? ++resourceIdCounter :
    prefix === 'ri' ? ++reviewItemIdCounter :
    prefix === 'ph' ? ++highlightIdCounter :
    prefix === 'hr' ? ++highlightReviewItemIdCounter :
    prefix === 'hc' ? ++challengeIdCounter :
    prefix === 'pc' ? ++participationIdCounter :
    ++eventIdCounter;
  return `${prefix}_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function key(schoolId: string, id: string): string {
  return `${schoolId}:${id}`;
}

const peerGroupStore = new Map<string, Phase3PeerGroup>();
const groupMembershipStore = new Map<string, Phase3PeerGroupMembership>();
const visibilityDecisionStore = new Map<string, Phase3PeerVisibilityDecision>();
const moderationDecisionStore = new Map<string, Phase3PeerModerationDecision>();
const resourceShareStore = new Map<string, Phase3PeerResourceShare>();
const resourceReviewItemStore = new Map<string, Phase3PeerResourceReviewItem>();
const highlightStore = new Map<string, Phase3PeerHighlight>();
const highlightReviewItemStore = new Map<string, Phase3PeerHighlightReviewItem>();
const healthyChallengeStore = new Map<string, Phase3HealthyChallenge>();
const healthyChallengeParticipationStore = new Map<string, Phase3HealthyChallengeParticipation>();
const auditEventStore: Phase3PeerLearningAuditEvent[] = [];

const groupsBySchool = new Map<string, Set<string>>();
const groupsByLearner = new Map<string, Set<string>>();
const groupsByTeacher = new Map<string, Set<string>>();
const membershipsByGroup = new Map<string, Set<string>>();
const membershipsByLearner = new Map<string, Set<string>>();
const visibilityDecisionsByContent = new Map<string, Set<string>>();
const resourcesByGroup = new Map<string, Set<string>>();
const resourcesByLearner = new Map<string, Set<string>>();
const resourcesBySchool = new Map<string, Set<string>>();
const reviewItemsByResource = new Map<string, string>();
const reviewItemsBySchool = new Map<string, Set<string>>();
const highlightsByGroup = new Map<string, Set<string>>();
const highlightsByLearner = new Map<string, Set<string>>();
const highlightsBySchool = new Map<string, Set<string>>();
const highlightReviewItemsByHighlight = new Map<string, string>();
const highlightReviewItemsBySchool = new Map<string, Set<string>>();
const challengesByGroup = new Map<string, Set<string>>();
const challengesBySchool = new Map<string, Set<string>>();
const participationsByLearner = new Map<string, Set<string>>();
const participationsByChallenge = new Map<string, Set<string>>();

function addToSet(map: Map<string, Set<string>>, k: string, value: string): void {
  let s = map.get(k);
  if (!s) {
    s = new Set();
    map.set(k, s);
  }
  s.add(value);
}

export class Phase3PeerLearningRepository {
  upsertPeerGroup(input: {
    groupId?: string;
    schoolId: string;
    teacherId?: string;
    classId?: string;
    subjectId?: string;
    groupType: Phase3PeerGroupType;
    groupStatus: Phase3PeerGroupStatus;
    safeTitle: string;
    safeSummary: string;
  }): Phase3PeerGroup {
    const now = nowISO();
    if (input.groupId && peerGroupStore.has(input.groupId)) {
      const existing = peerGroupStore.get(input.groupId)!;
      const updated: Phase3PeerGroup = {
        ...existing,
        groupType: input.groupType,
        groupStatus: input.groupStatus,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        teacherId: input.teacherId ?? existing.teacherId,
        classId: input.classId ?? existing.classId,
        subjectId: input.subjectId ?? existing.subjectId,
        updatedAt: now,
      };
      peerGroupStore.set(input.groupId, updated);
      return updated;
    }
    const groupId = generateId('pg');
    const group: Phase3PeerGroup = {
      groupId,
      schoolId: input.schoolId,
      teacherId: input.teacherId,
      classId: input.classId,
      subjectId: input.subjectId,
      groupType: input.groupType,
      groupStatus: input.groupStatus,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      memberCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    peerGroupStore.set(groupId, group);
    addToSet(groupsBySchool, input.schoolId, groupId);
    if (input.teacherId) addToSet(groupsByTeacher, key(input.schoolId, input.teacherId), groupId);
    return group;
  }

  getPeerGroup(groupId: string): Phase3PeerGroup | null {
    return peerGroupStore.get(groupId) || null;
  }

  listPeerGroupsForSchool(schoolId: string): Phase3PeerGroup[] {
    const ids = groupsBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => peerGroupStore.get(id)).filter(Boolean) as Phase3PeerGroup[];
  }

  listPeerGroupsForLearner(schoolId: string, studentId: string): Phase3PeerGroup[] {
    const mk = key(schoolId, studentId);
    const membershipIds = membershipsByLearner.get(mk);
    if (!membershipIds) return [];
    const groupIds = new Set<string>();
    for (const mid of membershipIds) {
      const m = groupMembershipStore.get(mid);
      if (m) groupIds.add(m.groupId);
    }
    return Array.from(groupIds).map(id => peerGroupStore.get(id)).filter(Boolean) as Phase3PeerGroup[];
  }

  addPeerGroupMembership(input: {
    groupId: string;
    schoolId: string;
    studentId: string;
    teacherId?: string;
    role: string;
  }): Phase3PeerGroupMembership {
    const membershipId = generateId('pm');
    const now = nowISO();
    const membership: Phase3PeerGroupMembership = {
      membershipId,
      groupId: input.groupId,
      schoolId: input.schoolId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      role: input.role,
      joinedAt: now,
      updatedAt: now,
    };
    groupMembershipStore.set(membershipId, membership);
    addToSet(membershipsByGroup, input.groupId, membershipId);
    addToSet(membershipsByLearner, key(input.schoolId, input.studentId), membershipId);
    const group = peerGroupStore.get(input.groupId);
    if (group) {
      group.memberCount = (group.memberCount || 0) + 1;
      peerGroupStore.set(input.groupId, group);
    }
    return membership;
  }

  getPeerGroupMembership(membershipId: string): Phase3PeerGroupMembership | null {
    return groupMembershipStore.get(membershipId) || null;
  }

  listPeerGroupMemberships(groupId: string): Phase3PeerGroupMembership[] {
    const ids = membershipsByGroup.get(groupId);
    if (!ids) return [];
    return Array.from(ids).map(id => groupMembershipStore.get(id)).filter(Boolean) as Phase3PeerGroupMembership[];
  }

  removePeerGroupMembership(membershipId: string): boolean {
    const m = groupMembershipStore.get(membershipId);
    if (!m) return false;
    groupMembershipStore.delete(membershipId);
    const group = peerGroupStore.get(m.groupId);
    if (group && group.memberCount > 0) {
      group.memberCount--;
      peerGroupStore.set(m.groupId, group);
    }
    return true;
  }

  recordPeerVisibilityDecision(decision: Phase3PeerVisibilityDecision): void {
    visibilityDecisionStore.set(decision.decisionId, decision);
    if (decision.contentId) {
      addToSet(visibilityDecisionsByContent, decision.contentId, decision.decisionId);
    }
  }

  getPeerVisibilityDecision(decisionId: string): Phase3PeerVisibilityDecision | null {
    return visibilityDecisionStore.get(decisionId) || null;
  }

  listPeerVisibilityDecisions(contentId: string): Phase3PeerVisibilityDecision[] {
    const ids = visibilityDecisionsByContent.get(contentId);
    if (!ids) return [];
    return Array.from(ids).map(id => visibilityDecisionStore.get(id)).filter(Boolean) as Phase3PeerVisibilityDecision[];
  }

  upsertPeerResourceShare(input: {
    resourceId?: string;
    schoolId: string;
    groupId?: string;
    studentId?: string;
    teacherId?: string;
    subjectId?: string;
    topicId?: string;
    objectiveId?: string;
    resourceType: Phase3PeerResourceType;
    contentStatus: Phase3PeerContentStatus;
    moderationStatus: Phase3PeerModerationStatus;
    visibilityLevel: Phase3PeerVisibilityLevel;
    safeTitle: string;
    safeSummary: string;
    safeContent: string;
    safeReasonCodes: string[];
    safeEvidenceRefs: string[];
    sourceTruthStatus: string;
  }): Phase3PeerResourceShare {
    const now = nowISO();
    if (input.resourceId && resourceShareStore.has(input.resourceId)) {
      const existing = resourceShareStore.get(input.resourceId)!;
      const updated: Phase3PeerResourceShare = {
        ...existing,
        resourceType: input.resourceType,
        contentStatus: input.contentStatus,
        moderationStatus: input.moderationStatus,
        visibilityLevel: input.visibilityLevel,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        safeContent: input.safeContent,
        safeReasonCodes: input.safeReasonCodes,
        safeEvidenceRefs: input.safeEvidenceRefs,
        sourceTruthStatus: input.sourceTruthStatus,
        subjectId: input.subjectId ?? existing.subjectId,
        topicId: input.topicId ?? existing.topicId,
        objectiveId: input.objectiveId ?? existing.objectiveId,
        updatedAt: now,
      };
      resourceShareStore.set(input.resourceId, updated);
      return updated;
    }
    const resourceId = generateId('pr');
    const resource: Phase3PeerResourceShare = {
      resourceId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      subjectId: input.subjectId,
      topicId: input.topicId,
      objectiveId: input.objectiveId,
      resourceType: input.resourceType,
      contentStatus: input.contentStatus,
      moderationStatus: input.moderationStatus,
      visibilityLevel: input.visibilityLevel,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      safeContent: input.safeContent,
      safeReasonCodes: input.safeReasonCodes,
      safeEvidenceRefs: input.safeEvidenceRefs,
      sourceTruthStatus: input.sourceTruthStatus,
      createdAt: now,
      updatedAt: now,
    };
    resourceShareStore.set(resourceId, resource);
    if (input.groupId) addToSet(resourcesByGroup, input.groupId, resourceId);
    if (input.studentId) addToSet(resourcesByLearner, key(input.schoolId, input.studentId), resourceId);
    addToSet(resourcesBySchool, input.schoolId, resourceId);
    return resource;
  }

  getPeerResourceShare(resourceId: string): Phase3PeerResourceShare | null {
    return resourceShareStore.get(resourceId) || null;
  }

  listPeerResourceSharesForGroup(groupId: string): Phase3PeerResourceShare[] {
    const ids = resourcesByGroup.get(groupId);
    if (!ids) return [];
    return Array.from(ids).map(id => resourceShareStore.get(id)).filter(Boolean) as Phase3PeerResourceShare[];
  }

  listPeerResourceSharesForLearner(schoolId: string, studentId: string): Phase3PeerResourceShare[] {
    const lk = key(schoolId, studentId);
    const ids = resourcesByLearner.get(lk);
    if (!ids) return [];
    return Array.from(ids).map(id => resourceShareStore.get(id)).filter(Boolean) as Phase3PeerResourceShare[];
  }

  upsertPeerResourceReviewItem(input: {
    reviewItemId?: string;
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
    reviewedBy?: string;
    reviewedAt?: string;
  }): Phase3PeerResourceReviewItem {
    const now = nowISO();
    if (input.reviewItemId && resourceReviewItemStore.has(input.reviewItemId)) {
      const existing = resourceReviewItemStore.get(input.reviewItemId)!;
      const updated: Phase3PeerResourceReviewItem = {
        ...existing,
        moderationStatus: input.moderationStatus,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        safeReasonCodes: input.safeReasonCodes,
        reviewedBy: input.reviewedBy ?? existing.reviewedBy,
        reviewedAt: input.reviewedAt ?? now,
      };
      resourceReviewItemStore.set(input.reviewItemId, updated);
      return updated;
    }
    const reviewItemId = generateId('ri');
    const item: Phase3PeerResourceReviewItem = {
      reviewItemId,
      resourceId: input.resourceId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      contentType: input.contentType,
      moderationStatus: input.moderationStatus,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      safeReasonCodes: input.safeReasonCodes,
      reviewedBy: input.reviewedBy,
      reviewedAt: input.reviewedAt,
      createdAt: now,
    };
    resourceReviewItemStore.set(reviewItemId, item);
    reviewItemsByResource.set(input.resourceId, reviewItemId);
    addToSet(reviewItemsBySchool, input.schoolId, reviewItemId);
    return item;
  }

  getPeerResourceReviewItem(reviewItemId: string): Phase3PeerResourceReviewItem | null {
    return resourceReviewItemStore.get(reviewItemId) || null;
  }

  listPeerResourceReviewQueue(schoolId: string): Phase3PeerResourceReviewItem[] {
    const ids = reviewItemsBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => resourceReviewItemStore.get(id)).filter(Boolean) as Phase3PeerResourceReviewItem[];
  }

  updatePeerResourceReviewStatus(resourceId: string, moderationStatus: Phase3PeerModerationStatus): void {
    const resource = resourceShareStore.get(resourceId);
    if (resource) {
      resource.moderationStatus = moderationStatus;
      if (moderationStatus === 'approved') {
        resource.contentStatus = 'approved';
        resource.visibilityLevel = 'group_visible';
      } else if (moderationStatus === 'rejected' || moderationStatus.startsWith('blocked')) {
        resource.contentStatus = 'blocked';
        resource.visibilityLevel = 'blocked';
      }
      resource.updatedAt = nowISO();
      resourceShareStore.set(resourceId, resource);
    }
  }

  upsertPeerHighlight(input: {
    highlightId?: string;
    schoolId: string;
    groupId?: string;
    studentId?: string;
    teacherId?: string;
    highlightType: Phase3PeerHighlightType;
    contentStatus: Phase3PeerContentStatus;
    moderationStatus: Phase3PeerModerationStatus;
    visibilityLevel: Phase3PeerVisibilityLevel;
    safeTitle: string;
    safeSummary: string;
    safeContent: string;
    safeReasonCodes: string[];
    safeEvidenceRefs: string[];
    sourceTruthStatus: string;
  }): Phase3PeerHighlight {
    const now = nowISO();
    if (input.highlightId && highlightStore.has(input.highlightId)) {
      const existing = highlightStore.get(input.highlightId)!;
      const updated: Phase3PeerHighlight = {
        ...existing,
        highlightType: input.highlightType,
        contentStatus: input.contentStatus,
        moderationStatus: input.moderationStatus,
        visibilityLevel: input.visibilityLevel,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        safeContent: input.safeContent,
        safeReasonCodes: input.safeReasonCodes,
        safeEvidenceRefs: input.safeEvidenceRefs,
        sourceTruthStatus: input.sourceTruthStatus,
        updatedAt: now,
      };
      highlightStore.set(input.highlightId, updated);
      return updated;
    }
    const highlightId = generateId('ph');
    const highlight: Phase3PeerHighlight = {
      highlightId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      highlightType: input.highlightType,
      contentStatus: input.contentStatus,
      moderationStatus: input.moderationStatus,
      visibilityLevel: input.visibilityLevel,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      safeContent: input.safeContent,
      safeReasonCodes: input.safeReasonCodes,
      safeEvidenceRefs: input.safeEvidenceRefs,
      sourceTruthStatus: input.sourceTruthStatus,
      createdAt: now,
      updatedAt: now,
    };
    highlightStore.set(highlightId, highlight);
    if (input.groupId) addToSet(highlightsByGroup, input.groupId, highlightId);
    if (input.studentId) addToSet(highlightsByLearner, key(input.schoolId, input.studentId), highlightId);
    addToSet(highlightsBySchool, input.schoolId, highlightId);
    return highlight;
  }

  getPeerHighlight(highlightId: string): Phase3PeerHighlight | null {
    return highlightStore.get(highlightId) || null;
  }

  listPeerHighlightsForGroup(groupId: string): Phase3PeerHighlight[] {
    const ids = highlightsByGroup.get(groupId);
    if (!ids) return [];
    return Array.from(ids).map(id => highlightStore.get(id)).filter(Boolean) as Phase3PeerHighlight[];
  }

  listPeerHighlightsForLearner(schoolId: string, studentId: string): Phase3PeerHighlight[] {
    const lk = key(schoolId, studentId);
    const ids = highlightsByLearner.get(lk);
    if (!ids) return [];
    return Array.from(ids).map(id => highlightStore.get(id)).filter(Boolean) as Phase3PeerHighlight[];
  }

  upsertPeerHighlightReviewItem(input: {
    reviewItemId?: string;
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
    reviewedBy?: string;
    reviewedAt?: string;
  }): Phase3PeerHighlightReviewItem {
    const now = nowISO();
    if (input.reviewItemId && highlightReviewItemStore.has(input.reviewItemId)) {
      const existing = highlightReviewItemStore.get(input.reviewItemId)!;
      const updated: Phase3PeerHighlightReviewItem = {
        ...existing,
        moderationStatus: input.moderationStatus,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        safeReasonCodes: input.safeReasonCodes,
        reviewedBy: input.reviewedBy ?? existing.reviewedBy,
        reviewedAt: input.reviewedAt ?? now,
      };
      highlightReviewItemStore.set(input.reviewItemId, updated);
      return updated;
    }
    const reviewItemId = generateId('hr');
    const item: Phase3PeerHighlightReviewItem = {
      reviewItemId,
      highlightId: input.highlightId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      studentId: input.studentId,
      teacherId: input.teacherId,
      contentType: input.contentType,
      moderationStatus: input.moderationStatus,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      safeReasonCodes: input.safeReasonCodes,
      reviewedBy: input.reviewedBy,
      reviewedAt: input.reviewedAt,
      createdAt: now,
    };
    highlightReviewItemStore.set(reviewItemId, item);
    highlightReviewItemsByHighlight.set(input.highlightId, reviewItemId);
    addToSet(highlightReviewItemsBySchool, input.schoolId, reviewItemId);
    return item;
  }

  getPeerHighlightReviewItem(reviewItemId: string): Phase3PeerHighlightReviewItem | null {
    return highlightReviewItemStore.get(reviewItemId) || null;
  }

  listPeerHighlightReviewQueue(schoolId: string): Phase3PeerHighlightReviewItem[] {
    const ids = highlightReviewItemsBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => highlightReviewItemStore.get(id)).filter(Boolean) as Phase3PeerHighlightReviewItem[];
  }

  updatePeerHighlightReviewStatus(highlightId: string, moderationStatus: Phase3PeerModerationStatus): void {
    const highlight = highlightStore.get(highlightId);
    if (highlight) {
      highlight.moderationStatus = moderationStatus;
      if (moderationStatus === 'approved') {
        highlight.contentStatus = 'approved';
        highlight.visibilityLevel = 'group_visible';
      } else if (moderationStatus === 'rejected' || moderationStatus.startsWith('blocked')) {
        highlight.contentStatus = 'blocked';
        highlight.visibilityLevel = 'blocked';
      }
      highlight.updatedAt = nowISO();
      highlightStore.set(highlightId, highlight);
    }
  }

  upsertHealthyChallenge(input: {
    challengeId?: string;
    schoolId: string;
    groupId?: string;
    teacherId?: string;
    classId?: string;
    challengeType: Phase3HealthyChallengeType;
    challengeStatus: Phase3HealthyChallengeStatus;
    safeTitle: string;
    safeSummary: string;
    safeInstructions: string;
    safeEvidenceRefs: string[];
    sourceTruthStatus: string;
    expiresAt?: string;
    completedAt?: string;
  }): Phase3HealthyChallenge {
    const now = nowISO();
    if (input.challengeId && healthyChallengeStore.has(input.challengeId)) {
      const existing = healthyChallengeStore.get(input.challengeId)!;
      const updated: Phase3HealthyChallenge = {
        ...existing,
        challengeType: input.challengeType,
        challengeStatus: input.challengeStatus,
        safeTitle: input.safeTitle,
        safeSummary: input.safeSummary,
        safeInstructions: input.safeInstructions,
        safeEvidenceRefs: input.safeEvidenceRefs,
        sourceTruthStatus: input.sourceTruthStatus,
        expiresAt: input.expiresAt ?? existing.expiresAt,
        completedAt: input.completedAt ?? existing.completedAt,
        updatedAt: now,
      };
      healthyChallengeStore.set(input.challengeId, updated);
      return updated;
    }
    const challengeId = generateId('hc');
    const challenge: Phase3HealthyChallenge = {
      challengeId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      teacherId: input.teacherId,
      classId: input.classId,
      challengeType: input.challengeType,
      challengeStatus: input.challengeStatus,
      safeTitle: input.safeTitle,
      safeSummary: input.safeSummary,
      safeInstructions: input.safeInstructions,
      safeEvidenceRefs: input.safeEvidenceRefs,
      sourceTruthStatus: input.sourceTruthStatus,
      createdAt: now,
      updatedAt: now,
      expiresAt: input.expiresAt,
      completedAt: input.completedAt,
    };
    healthyChallengeStore.set(challengeId, challenge);
    if (input.groupId) addToSet(challengesByGroup, input.groupId, challengeId);
    addToSet(challengesBySchool, input.schoolId, challengeId);
    return challenge;
  }

  getHealthyChallenge(challengeId: string): Phase3HealthyChallenge | null {
    return healthyChallengeStore.get(challengeId) || null;
  }

  listHealthyChallengesForGroup(groupId: string): Phase3HealthyChallenge[] {
    const ids = challengesByGroup.get(groupId);
    if (!ids) return [];
    return Array.from(ids).map(id => healthyChallengeStore.get(id)).filter(Boolean) as Phase3HealthyChallenge[];
  }

  listHealthyChallengesForSchool(schoolId: string): Phase3HealthyChallenge[] {
    const ids = challengesBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => healthyChallengeStore.get(id)).filter(Boolean) as Phase3HealthyChallenge[];
  }

  upsertHealthyChallengeParticipation(input: {
    participationId?: string;
    challengeId: string;
    schoolId: string;
    groupId?: string;
    studentId: string;
    stepsCompleted: number;
    totalSteps: number;
    safeEvidenceRefs: string[];
  }): Phase3HealthyChallengeParticipation {
    const now = nowISO();
    if (input.participationId && healthyChallengeParticipationStore.has(input.participationId)) {
      const existing = healthyChallengeParticipationStore.get(input.participationId)!;
      const updated: Phase3HealthyChallengeParticipation = {
        ...existing,
        stepsCompleted: input.stepsCompleted,
        totalSteps: input.totalSteps,
        safeEvidenceRefs: input.safeEvidenceRefs,
        updatedAt: now,
      };
      healthyChallengeParticipationStore.set(input.participationId, updated);
      return updated;
    }
    const participationId = generateId('pc');
    const participation: Phase3HealthyChallengeParticipation = {
      participationId,
      challengeId: input.challengeId,
      schoolId: input.schoolId,
      groupId: input.groupId,
      studentId: input.studentId,
      stepsCompleted: input.stepsCompleted,
      totalSteps: input.totalSteps,
      safeEvidenceRefs: input.safeEvidenceRefs,
      joinedAt: now,
      updatedAt: now,
    };
    healthyChallengeParticipationStore.set(participationId, participation);
    addToSet(participationsByLearner, key(input.schoolId, input.studentId), participationId);
    addToSet(participationsByChallenge, input.challengeId, participationId);
    return participation;
  }

  getHealthyChallengeParticipation(participationId: string): Phase3HealthyChallengeParticipation | null {
    return healthyChallengeParticipationStore.get(participationId) || null;
  }

  listHealthyChallengeParticipationForLearner(schoolId: string, studentId: string): Phase3HealthyChallengeParticipation[] {
    const lk = key(schoolId, studentId);
    const ids = participationsByLearner.get(lk);
    if (!ids) return [];
    return Array.from(ids).map(id => healthyChallengeParticipationStore.get(id)).filter(Boolean) as Phase3HealthyChallengeParticipation[];
  }

  listHealthyChallengeParticipationForChallenge(challengeId: string): Phase3HealthyChallengeParticipation[] {
    const ids = participationsByChallenge.get(challengeId);
    if (!ids) return [];
    return Array.from(ids).map(id => healthyChallengeParticipationStore.get(id)).filter(Boolean) as Phase3HealthyChallengeParticipation[];
  }

  updateHealthyChallengeParticipationStatus(participationId: string, stepsCompleted: number, totalSteps: number): void {
    const p = healthyChallengeParticipationStore.get(participationId);
    if (p) {
      p.stepsCompleted = stepsCompleted;
      p.totalSteps = totalSteps;
      if (stepsCompleted >= totalSteps) {
        p.completedAt = nowISO();
      }
      p.updatedAt = nowISO();
      healthyChallengeParticipationStore.set(participationId, p);
    }
  }

  recordPeerLearningAuditEvent(event: Phase3PeerLearningAuditEvent): void {
    auditEventStore.push(event);
  }

  listPeerLearningAuditEvents(schoolId: string, limit?: number): Phase3PeerLearningAuditEvent[] {
    const events = auditEventStore.filter(e => e.schoolId === schoolId);
    if (limit && limit > 0) return events.slice(-limit);
    return events;
  }

  listAllPeerResourcesForSchool(schoolId: string): Phase3PeerResourceShare[] {
    const ids = resourcesBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => resourceShareStore.get(id)).filter(Boolean) as Phase3PeerResourceShare[];
  }

  listAllPeerHighlightsForSchool(schoolId: string): Phase3PeerHighlight[] {
    const ids = highlightsBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => highlightStore.get(id)).filter(Boolean) as Phase3PeerHighlight[];
  }

  listAllHealthyChallengesForSchool(schoolId: string): Phase3HealthyChallenge[] {
    const ids = challengesBySchool.get(schoolId);
    if (!ids) return [];
    return Array.from(ids).map(id => healthyChallengeStore.get(id)).filter(Boolean) as Phase3HealthyChallenge[];
  }

  resetPhase3PeerLearningRepositoryForTests(): void {
    peerGroupStore.clear();
    groupMembershipStore.clear();
    visibilityDecisionStore.clear();
    moderationDecisionStore.clear();
    resourceShareStore.clear();
    resourceReviewItemStore.clear();
    highlightStore.clear();
    highlightReviewItemStore.clear();
    healthyChallengeStore.clear();
    healthyChallengeParticipationStore.clear();
    auditEventStore.length = 0;
    groupsBySchool.clear();
    groupsByLearner.clear();
    groupsByTeacher.clear();
    membershipsByGroup.clear();
    membershipsByLearner.clear();
    visibilityDecisionsByContent.clear();
    resourcesByGroup.clear();
    resourcesByLearner.clear();
    resourcesBySchool.clear();
    reviewItemsByResource.clear();
    reviewItemsBySchool.clear();
    highlightsByGroup.clear();
    highlightsByLearner.clear();
    highlightsBySchool.clear();
    highlightReviewItemsByHighlight.clear();
    highlightReviewItemsBySchool.clear();
    challengesByGroup.clear();
    challengesBySchool.clear();
    participationsByLearner.clear();
    participationsByChallenge.clear();
    groupIdCounter = 0;
    membershipIdCounter = 0;
    visibilityDecisionIdCounter = 0;
    moderationDecisionIdCounter = 0;
    resourceIdCounter = 0;
    reviewItemIdCounter = 0;
    highlightIdCounter = 0;
    highlightReviewItemIdCounter = 0;
    challengeIdCounter = 0;
    participationIdCounter = 0;
    eventIdCounter = 0;
  }
}

export const phase3PeerLearningRepository = new Phase3PeerLearningRepository();
