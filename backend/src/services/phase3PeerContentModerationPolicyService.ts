import type {
  Phase3PeerModerationStatus,
  Phase3PeerModerationDecision,
  Phase3PeerResourceType,
  Phase3PeerHighlightType,
  Phase3HealthyChallengeType,
} from '../contracts/phase3PeerLearningContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateDecisionId(): string {
  return `md_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function evaluatePeerContentModeration(
  schoolId: string,
  contentId: string,
  safeTitle: string,
  safeSummary: string,
  safeContent: string,
  contentType: string,
): Phase3PeerModerationDecision {
  if (detectAnswerArtifactRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked_by_answer_artifact', 'Content contains answer artifacts and cannot be shared with peers.');
  }
  if (detectRawContentRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked_by_raw_content', 'Content contains raw learner content and cannot be shared.');
  }
  if (detectPeerPrivacyRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked_by_peer_privacy', 'Content contains private peer content.');
  }
  if (detectSafeguardingRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked_by_safeguarding', 'Content may involve safeguarding information.');
  }
  if (detectDeenBoundaryRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked_by_deen_boundary', 'This Islamic Studies item needs teacher-approved context.');
  }
  if (detectRankingOrComparisonRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked', 'Content contains rankings or comparisons and cannot be shared.');
  }
  if (detectSocialMediaDriftRisk(safeTitle, safeSummary, safeContent)) {
    return buildBlockedModerationDecision(schoolId, contentId, 'blocked', 'Content appears to be social-media style and is not suitable for peer learning.');
  }
  return buildApprovedModerationDecision(schoolId, contentId);
}

export function moderatePeerResourceShare(
  schoolId: string,
  resourceId: string,
  safeTitle: string,
  safeSummary: string,
  safeContent: string,
): Phase3PeerModerationDecision {
  return evaluatePeerContentModeration(schoolId, resourceId, safeTitle, safeSummary, safeContent, 'resource_share');
}

export function moderatePeerHighlight(
  schoolId: string,
  highlightId: string,
  safeTitle: string,
  safeSummary: string,
  safeContent: string,
): Phase3PeerModerationDecision {
  const decision = evaluatePeerContentModeration(schoolId, highlightId, safeTitle, safeSummary, safeContent, 'peer_highlight');
  if (decision.moderationStatus === 'approved') {
    if (detectShamingOrMockery(safeTitle, safeSummary, safeContent)) {
      return buildBlockedModerationDecision(schoolId, highlightId, 'blocked', 'Highlight content contains shaming or mocking language.');
    }
  }
  return decision;
}

export function moderateHealthyChallenge(
  schoolId: string,
  challengeId: string,
  safeTitle: string,
  safeSummary: string,
  safeInstructions: string,
): Phase3PeerModerationDecision {
  const decision = evaluatePeerContentModeration(schoolId, challengeId, safeTitle, safeSummary, safeInstructions, 'healthy_challenge');
  if (decision.moderationStatus === 'approved') {
    if (detectRankingOrComparisonRisk(safeTitle, safeSummary, safeInstructions)) {
      return buildBlockedModerationDecision(schoolId, challengeId, 'blocked', 'Challenge contains rankings or comparisons.');
    }
  }
  return decision;
}

const ANSWER_ARTIFACT_PATTERNS = [
  'the correct answer is',
  'the answer is',
  'answer key',
  'correct answer',
  'model answer',
  'marking scheme',
];

const RAW_CONTENT_PATTERNS = [
  'raw answer',
  'raw response',
  'raw explanation',
  'my exact answer was',
  'here is my work',
];

const PEER_PRIVACY_PATTERNS = [
  'private message',
  'private chat',
  'between us',
  'don\'t tell anyone',
  'secret',
];

const SAFEGUARDING_PATTERNS = [
  'abuse',
  'self-harm',
  'suicide',
  'threat',
  'harm',
];

const DEEN_PATTERNS = [
  'fatwa',
  'ruling',
];

const RANKING_PATTERNS = [
  'top of class',
  'beat everyone',
  'better than',
  'ranked',
  'leaderboard',
  'number one',
];

const SOCIAL_MEDIA_PATTERNS = [
  'like this',
  'follow me',
  'dm me',
  'comment below',
];

const SHAME_PATTERNS = [
  'failed',
  'hopeless',
  'stupid',
  'useless',
];

function containsAny(text: string, patterns: string[]): boolean {
  const lower = text.toLowerCase();
  return patterns.some(p => lower.includes(p));
}

export function detectAnswerArtifactRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, ANSWER_ARTIFACT_PATTERNS) ||
    containsAny(summary, ANSWER_ARTIFACT_PATTERNS) ||
    containsAny(content, ANSWER_ARTIFACT_PATTERNS);
}

export function detectRawContentRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, RAW_CONTENT_PATTERNS) ||
    containsAny(summary, RAW_CONTENT_PATTERNS) ||
    containsAny(content, RAW_CONTENT_PATTERNS);
}

export function detectPeerPrivacyRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, PEER_PRIVACY_PATTERNS) ||
    containsAny(summary, PEER_PRIVACY_PATTERNS) ||
    containsAny(content, PEER_PRIVACY_PATTERNS);
}

export function detectSafeguardingRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, SAFEGUARDING_PATTERNS) ||
    containsAny(summary, SAFEGUARDING_PATTERNS) ||
    containsAny(content, SAFEGUARDING_PATTERNS);
}

export function detectDeenBoundaryRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, DEEN_PATTERNS) ||
    containsAny(summary, DEEN_PATTERNS) ||
    containsAny(content, DEEN_PATTERNS);
}

export function detectRankingOrComparisonRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, RANKING_PATTERNS) ||
    containsAny(summary, RANKING_PATTERNS) ||
    containsAny(content, RANKING_PATTERNS);
}

export function detectSocialMediaDriftRisk(title: string, summary: string, content: string): boolean {
  return containsAny(title, SOCIAL_MEDIA_PATTERNS) ||
    containsAny(summary, SOCIAL_MEDIA_PATTERNS) ||
    containsAny(content, SOCIAL_MEDIA_PATTERNS);
}

function detectShamingOrMockery(title: string, summary: string, content: string): boolean {
  return containsAny(title, SHAME_PATTERNS) ||
    containsAny(summary, SHAME_PATTERNS) ||
    containsAny(content, SHAME_PATTERNS);
}

export function buildModerationDecision(
  schoolId: string,
  contentId: string,
  moderationStatus: Phase3PeerModerationStatus,
  safeSummary: string,
): Phase3PeerModerationDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    contentId,
    moderatorRole: 'system',
    moderationStatus,
    safeSummary,
    safeReasonCodes: [moderationStatus],
    createdAt: nowISO(),
  };
}

export function buildApprovedModerationDecision(
  schoolId: string,
  contentId: string,
): Phase3PeerModerationDecision {
  return buildModerationDecision(schoolId, contentId, 'approved', 'Content passed automated moderation checks.');
}

export function buildTeacherReviewModerationDecision(
  schoolId: string,
  contentId: string,
): Phase3PeerModerationDecision {
  return buildModerationDecision(schoolId, contentId, 'pending_review', 'Content flagged for teacher review.');
}

export function buildRejectedModerationDecision(
  schoolId: string,
  contentId: string,
  reason: string,
): Phase3PeerModerationDecision {
  return buildModerationDecision(schoolId, contentId, 'rejected', reason);
}

export function buildBlockedModerationDecision(
  schoolId: string,
  contentId: string,
  status: Phase3PeerModerationStatus,
  reason: string,
): Phase3PeerModerationDecision {
  return buildModerationDecision(schoolId, contentId, status, reason);
}
