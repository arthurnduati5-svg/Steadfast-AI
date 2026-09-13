import { phase3PeerLearningRepository as repo } from './phase3PeerLearningRepository';
import type {
  Phase3PeerVisibilityDecision,
  Phase3PeerVisibilityLevel,
  Phase3PeerContentStatus,
  Phase3PeerModerationStatus,
  Phase3PeerResourceShare,
  Phase3PeerHighlight,
  Phase3HealthyChallenge,
} from '../contracts/phase3PeerLearningContracts';
import { PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS } from '../contracts/phase3PeerLearningContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateDecisionId(): string {
  return `pd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolvePeerVisibility(
  schoolId: string,
  contentId: string,
  moderationStatus: Phase3PeerModerationStatus,
  visibilityLevel: Phase3PeerVisibilityLevel,
  sourceTruthStatus: string,
  forLearner: boolean,
): Phase3PeerVisibilityDecision {
  if (forLearner) {
    if (moderationStatus === 'blocked_by_safeguarding') {
      return buildSafeguardingBlockedPeerVisibilityDecision(schoolId);
    }
    if (moderationStatus === 'blocked_by_deen_boundary') {
      return buildDeenBoundaryPeerVisibilityDecision(schoolId);
    }
    if (moderationStatus === 'blocked_by_peer_privacy') {
      return buildPeerPrivacyBlockedDecision(schoolId);
    }
    if (moderationStatus === 'source_required' || sourceTruthStatus === 'source_required') {
      return buildSourceRequiredPeerVisibilityDecision(schoolId);
    }
    if (moderationStatus === 'pending_review' || moderationStatus === 'not_required') {
      if (visibilityLevel === 'teacher_only' || visibilityLevel === 'private_to_author') {
        return buildSourceRequiredPeerVisibilityDecision(schoolId);
      }
    }
    if (moderationStatus !== 'approved') {
      if (visibilityLevel === 'group_visible' || visibilityLevel === 'class_visible') {
        return {
          decisionId: generateDecisionId(),
          schoolId,
          contentId,
          visibilityLevel: 'teacher_only',
          safeSummary: 'This peer item is waiting for teacher review.',
          safeReasonCodes: ['pending_teacher_review'],
          createdAt: nowISO(),
        };
      }
    }
  }
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId,
    visibilityLevel: forLearner ? visibilityLevel : 'teacher_only',
    safeSummary: forLearner ? 'Content is visible within your peer scope.' : 'Teacher-safe view.',
    safeReasonCodes: ['visibility_approved'],
    createdAt: nowISO(),
  };
}

export function assertPeerContentVisibleToLearner(
  schoolId: string,
  contentId: string,
  moderationStatus: Phase3PeerModerationStatus,
  visibilityLevel: Phase3PeerVisibilityLevel,
  sourceTruthStatus: string,
): Phase3PeerVisibilityDecision {
  return resolvePeerVisibility(schoolId, contentId, moderationStatus, visibilityLevel, sourceTruthStatus, true);
}

export function assertPeerContentVisibleToTeacher(
  schoolId: string,
  contentId: string,
  moderationStatus: Phase3PeerModerationStatus,
  visibilityLevel: Phase3PeerVisibilityLevel,
  sourceTruthStatus: string,
): Phase3PeerVisibilityDecision {
  return resolvePeerVisibility(schoolId, contentId, moderationStatus, visibilityLevel, sourceTruthStatus, false);
}

export function filterPeerContentForLearnerVisibility(
  resources: Phase3PeerResourceShare[],
): Phase3PeerResourceShare[] {
  return resources.filter(r =>
    r.moderationStatus === 'approved' &&
    (r.visibilityLevel === 'group_visible' || r.visibilityLevel === 'class_visible')
  );
}

export function filterPeerContentForTeacherVisibility(
  resources: Phase3PeerResourceShare[],
): Phase3PeerResourceShare[] {
  return resources.filter(r =>
    r.moderationStatus !== 'blocked_by_safeguarding' &&
    r.moderationStatus !== 'blocked'
  );
}

export function buildPeerVisibilityDecision(
  schoolId: string,
  contentId: string,
  visibilityLevel: Phase3PeerVisibilityLevel,
  safeSummary: string,
  safeReasonCodes: string[],
): Phase3PeerVisibilityDecision {
  const decision: Phase3PeerVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    contentId,
    visibilityLevel,
    safeSummary,
    safeReasonCodes,
    createdAt: nowISO(),
  };
  repo.recordPeerVisibilityDecision(decision);
  return decision;
}

export function buildSourceRequiredPeerVisibilityDecision(
  schoolId: string,
): Phase3PeerVisibilityDecision {
  const decision: Phase3PeerVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'teacher_only',
    moderationStatus: 'source_required',
    safeSummary: 'This item needs approved source context before peer sharing.',
    safeReasonCodes: ['source_required'],
    createdAt: nowISO(),
  };
  repo.recordPeerVisibilityDecision(decision);
  return decision;
}

export function buildSafeguardingBlockedPeerVisibilityDecision(
  schoolId: string,
): Phase3PeerVisibilityDecision {
  const decision: Phase3PeerVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'blocked',
    moderationStatus: 'blocked_by_safeguarding',
    safeSummary: 'Some information is only visible to authorized safeguarding staff.',
    safeReasonCodes: ['safeguarding_blocked'],
    createdAt: nowISO(),
  };
  repo.recordPeerVisibilityDecision(decision);
  return decision;
}

export function buildDeenBoundaryPeerVisibilityDecision(
  schoolId: string,
): Phase3PeerVisibilityDecision {
  const decision: Phase3PeerVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'teacher_only',
    moderationStatus: 'blocked_by_deen_boundary',
    safeSummary: 'This item requires approved Islamic Studies source or teacher confirmation before peer sharing.',
    safeReasonCodes: ['deen_boundary'],
    createdAt: nowISO(),
  };
  repo.recordPeerVisibilityDecision(decision);
  return decision;
}

export function buildPeerPrivacyBlockedDecision(
  schoolId: string,
): Phase3PeerVisibilityDecision {
  const decision: Phase3PeerVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    visibilityLevel: 'blocked',
    moderationStatus: 'blocked_by_peer_privacy',
    safeSummary: 'This item cannot be shared because it includes private learner content.',
    safeReasonCodes: ['peer_privacy_blocked'],
    createdAt: nowISO(),
  };
  repo.recordPeerVisibilityDecision(decision);
  return decision;
}

export function redactPeerForbiddenFields<T extends Record<string, unknown>>(obj: T): T {
  const redacted = { ...obj };
  for (const field of PHASE3_PEER_LEARNING_FORBIDDEN_FIELDS) {
    if (field in redacted) {
      delete redacted[field];
    }
  }
  return redacted;
}
