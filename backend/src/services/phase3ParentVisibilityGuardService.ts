import {
  type Phase3ParentLearnerLink,
  type Phase3ParentVisibilityLevel,
  type Phase3ParentVisibilityDecision,
  type Phase3ParentSupportSourceType,
  type Phase3ParentSupportSignalType,
  PHASE3_PARENT_VISIBILITY_LEVELS,
  PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

function nowISO(): string {
  return new Date().toISOString();
}

function generateDecisionId(): string {
  return `pd_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function resolveParentVisibility(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  const links = repo.listLearnerLinksForParent(schoolId, parentId);
  const link = links.find((l) => l.studentId === studentId);

  if (!link) {
    return buildMissingParentLinkDecision(schoolId, parentId, studentId);
  }

  if (link.linkStatus === 'revoked' || link.linkStatus === 'expired' || link.linkStatus === 'blocked') {
    const decision: Phase3ParentVisibilityDecision = {
      decisionId: generateDecisionId(),
      schoolId,
      parentId,
      studentId,
      visibilityLevel: 'blocked',
      linkStatus: link.linkStatus,
      safeSummary: 'Parent access is not available for this learner.',
      safeReasonCodes: [`link_${link.linkStatus}`],
      createdAt: nowISO(),
    };
    repo.recordParentVisibilityDecision(decision);
    return decision;
  }

  if (link.linkStatus === 'pending_verification') {
    const decision: Phase3ParentVisibilityDecision = {
      decisionId: generateDecisionId(),
      schoolId,
      parentId,
      studentId,
      visibilityLevel: 'none',
      linkStatus: 'pending_verification',
      safeSummary: 'Parent link is pending verification.',
      safeReasonCodes: ['link_pending_verification'],
      createdAt: nowISO(),
    };
    repo.recordParentVisibilityDecision(decision);
    return decision;
  }

  if (link.linkStatus !== 'active') {
    const decision: Phase3ParentVisibilityDecision = {
      decisionId: generateDecisionId(),
      schoolId,
      parentId,
      studentId,
      visibilityLevel: 'none',
      linkStatus: link.linkStatus,
      safeSummary: 'Parent access is not available for this learner.',
      safeReasonCodes: ['link_not_active'],
      createdAt: nowISO(),
    };
    repo.recordParentVisibilityDecision(decision);
    return decision;
  }

  const decision: Phase3ParentVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: link.visibilityLevel,
    linkStatus: 'active',
    safeSummary: 'Parent visibility is active for this learner.',
    safeReasonCodes: ['link_active'],
    createdAt: nowISO(),
  };
  repo.recordParentVisibilityDecision(decision);
  return decision;
}

export function assertParentCanViewLearner(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  const decision = resolveParentVisibility(schoolId, parentId, studentId);
  if (
    decision.visibilityLevel === 'none' ||
    decision.visibilityLevel === 'blocked'
  ) {
    throw new Error(`Parent visibility denied: ${decision.safeReasonCodes.join(', ')}`);
  }
  return decision;
}

export function filterSignalsForParentVisibility(
  signals: { isDeenSensitive?: boolean; isSafeguardingSeparated?: boolean; sourceTruthStatus?: string }[],
  visibilityLevel: Phase3ParentVisibilityLevel,
): { allowed: typeof signals; blocked: typeof signals } {
  const allowed: typeof signals = [];
  const blocked: typeof signals = [];

  for (const signal of signals) {
    if (signal.isSafeguardingSeparated) {
      blocked.push(signal);
      continue;
    }
    if (
      visibilityLevel === 'summary_only' &&
      signal.sourceTruthStatus !== 'approved' &&
      signal.sourceTruthStatus !== 'teacher_created'
    ) {
      blocked.push(signal);
      continue;
    }
    if (signal.isDeenSensitive && visibilityLevel === 'teacher_mediated_only') {
      blocked.push(signal);
      continue;
    }
    allowed.push(signal);
  }

  return { allowed, blocked };
}

export function filterSummaryForParentVisibility(
  summary: Record<string, unknown>,
  visibilityLevel: Phase3ParentVisibilityLevel,
): Record<string, unknown> {
  if (visibilityLevel === 'none' || visibilityLevel === 'blocked') {
    return { safeSummary: 'Parent visibility is not available.', safeReasonCodes: ['visibility_denied'] };
  }
  return redactParentForbiddenFields(summary);
}

export function filterNotificationForParentVisibility(
  notification: Record<string, unknown>,
  visibilityLevel: Phase3ParentVisibilityLevel,
): Record<string, unknown> {
  if (visibilityLevel === 'none' || visibilityLevel === 'blocked') {
    return { safeSummary: 'Parent visibility is not available.', safeReasonCodes: ['visibility_denied'] };
  }
  return redactParentForbiddenFields(notification);
}

export function buildParentVisibilityDecision(
  schoolId: string,
  parentId: string,
  studentId: string,
  link: Phase3ParentLearnerLink,
): Phase3ParentVisibilityDecision {
  const decision: Phase3ParentVisibilityDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: link.visibilityLevel,
    linkStatus: link.linkStatus,
    safeSummary: 'Parent visibility resolved.',
    safeReasonCodes: ['visibility_resolved'],
    createdAt: nowISO(),
  };
  repo.recordParentVisibilityDecision(decision);
  return decision;
}

export function buildMissingParentLinkDecision(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: 'none',
    linkStatus: 'not_linked',
    safeSummary: 'Parent access is not available for this learner.',
    safeReasonCodes: ['parent_not_linked'],
    createdAt: nowISO(),
  };
}

export function buildSourceRequiredVisibilityDecision(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: 'teacher_mediated_only',
    linkStatus: 'active',
    sourceTruthStatus: 'source_required',
    safeSummary: 'This item needs approved source context before parent sharing.',
    safeReasonCodes: ['source_required'],
    createdAt: nowISO(),
  };
}

export function buildSafeguardingBlockedVisibilityDecision(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: 'blocked',
    linkStatus: 'active',
    isSafeguardingSeparated: true,
    safeSummary: 'Some information is only visible to authorized safeguarding staff.',
    safeReasonCodes: ['safeguarding_blocked'],
    createdAt: nowISO(),
  };
}

export function buildDeenBoundaryVisibilityDecision(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentVisibilityDecision {
  return {
    decisionId: generateDecisionId(),
    schoolId,
    parentId,
    studentId,
    visibilityLevel: 'teacher_mediated_only',
    linkStatus: 'active',
    isDeenSensitive: true,
    safeSummary: 'This item requires approved Islamic Studies source or teacher confirmation before parent sharing.',
    safeReasonCodes: ['deen_boundary'],
    createdAt: nowISO(),
  };
}

export function redactParentForbiddenFields<T extends Record<string, unknown>>(obj: T): T {
  const redacted = { ...obj };
  for (const field of PHASE3_PARENT_SUPPORT_FORBIDDEN_FIELDS) {
    if (field in redacted) {
      delete redacted[field];
    }
  }
  return redacted;
}
