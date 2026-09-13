import {
  type Phase3ParentNotificationDecision,
  type Phase3ParentNotificationType,
  type Phase3ParentNotificationStatus,
  type Phase3ParentSupportPriority,
  type Phase3ParentVisibilityLevel,
  type Phase3ParentSupportAction,
  type Phase3ParentVisibilityDecision,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';

let decisionIdCounter = 0;

function generateDecisionId(): string {
  const c = ++decisionIdCounter;
  return `nd_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

export function decideParentNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
  notificationType: Phase3ParentNotificationType,
  visibilityDecision: Phase3ParentVisibilityDecision,
): Phase3ParentNotificationDecision {
  const status = getStatusFromVisibility(visibilityDecision);

  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType,
    notificationStatus: status,
    priority: getPriorityForNotificationType(notificationType, visibilityDecision),
    safeTitle: getSafeTitle(notificationType),
    safeSummary: getSafeSummary(notificationType),
    supportAction: getSupportAction(notificationType),
    sourceTruthStatus: visibilityDecision.sourceTruthStatus,
    visibilityLevel: visibilityDecision.visibilityLevel,
    safeEvidenceRefs: [],
    safeReasonCodes: visibilityDecision.safeReasonCodes,
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideWeeklyProgressNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'weekly_progress_summary',
    notificationStatus: 'queued',
    priority: 'low',
    safeTitle: 'Weekly progress update available',
    safeSummary: 'Your child\'s weekly learning progress summary is available.',
    supportAction: 'celebrate_effort',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['weekly_notification'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideDailySupportNudge(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'daily_support_nudge',
    notificationStatus: 'queued',
    priority: 'low',
    safeTitle: 'Today\'s learning update',
    safeSummary: 'Your child has learning activities today. A short check-in can help.',
    supportAction: 'encourage_short_revision',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['daily_nudge'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideMissedStudyPlanNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'missed_study_plan_step',
    notificationStatus: 'queued',
    priority: 'medium',
    safeTitle: 'Study plan step needs attention',
    safeSummary: 'Your child has a study plan step that may need support to complete.',
    supportAction: 'support_study_plan_time',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['missed_study_plan'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideRevisionDueNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'revision_due_support',
    notificationStatus: 'queued',
    priority: 'medium',
    safeTitle: 'Revision items due',
    safeSummary: 'Your child has revision items to review. A short session can help.',
    supportAction: 'remind_revision_due',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['revision_due'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideWeakTopicSupportNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'repeated_weak_topic_support',
    notificationStatus: 'queued',
    priority: 'medium',
    safeTitle: 'Topic review may help',
    safeSummary: 'Your child may benefit from revisiting a topic to strengthen understanding.',
    supportAction: 'ask_child_to_explain',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['weak_topic'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideConfidenceRecoveryNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'confidence_recovery_support',
    notificationStatus: 'queued',
    priority: 'medium',
    safeTitle: 'Confidence building opportunity',
    safeSummary: 'Your child may benefit from explaining some ideas again in their own words.',
    supportAction: 'ask_child_to_explain',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['confidence_recovery'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decidePositiveGrowthNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'positive_growth_update',
    notificationStatus: 'queued',
    priority: 'low',
    safeTitle: 'Positive learning update',
    safeSummary: 'Your child has shown effort and improvement. Keep encouraging them.',
    supportAction: 'celebrate_effort',
    visibilityLevel: 'summary_and_support',
    safeEvidenceRefs: [],
    safeReasonCodes: ['positive_growth'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideTeacherRequestedSupportNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'teacher_requested_support',
    notificationStatus: 'ready_for_review',
    priority: 'high',
    safeTitle: 'Teacher support may be needed',
    safeSummary: 'The teacher has identified an area that may benefit from additional support.',
    supportAction: 'ask_teacher_for_support',
    visibilityLevel: 'teacher_mediated_only',
    safeEvidenceRefs: [],
    safeReasonCodes: ['teacher_requested'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideSourceRequiredNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'source_required_notice',
    notificationStatus: 'blocked_by_source_truth',
    priority: 'blocked',
    safeTitle: 'Source context needed',
    safeSummary: 'This item needs approved source context before parent sharing.',
    supportAction: 'ask_teacher_for_source',
    visibilityLevel: 'teacher_mediated_only',
    sourceTruthStatus: 'source_required',
    safeEvidenceRefs: [],
    safeReasonCodes: ['source_required'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function decideTeacherSupportNeededNotification(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType: 'teacher_support_needed',
    notificationStatus: 'teacher_mediated',
    priority: 'high',
    safeTitle: 'Teacher support recommended',
    safeSummary: 'The teacher may need to support this area directly.',
    supportAction: 'ask_teacher_for_support',
    visibilityLevel: 'teacher_mediated_only',
    safeEvidenceRefs: [],
    safeReasonCodes: ['teacher_support_needed'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function blockNotificationForVisibility(
  schoolId: string,
  studentId: string,
  parentId: string,
  notificationType: Phase3ParentNotificationType,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType,
    notificationStatus: 'blocked_by_visibility',
    priority: 'blocked',
    safeTitle: 'Notification blocked',
    safeSummary: 'Parent visibility restrictions prevent this notification.',
    supportAction: 'no_action_needed',
    visibilityLevel: 'blocked',
    safeEvidenceRefs: [],
    safeReasonCodes: ['blocked_by_visibility'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function blockNotificationForSafeguarding(
  schoolId: string,
  studentId: string,
  parentId: string,
  notificationType: Phase3ParentNotificationType,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType,
    notificationStatus: 'blocked_by_safeguarding',
    priority: 'blocked',
    safeTitle: 'Notification blocked',
    safeSummary: 'Some information is only visible to authorized safeguarding staff.',
    supportAction: 'no_action_needed',
    visibilityLevel: 'blocked',
    safeEvidenceRefs: [],
    safeReasonCodes: ['blocked_by_safeguarding'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function blockNotificationForDeenBoundary(
  schoolId: string,
  studentId: string,
  parentId: string,
  notificationType: Phase3ParentNotificationType,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType,
    notificationStatus: 'blocked_by_deen_boundary',
    priority: 'blocked',
    safeTitle: 'Notification blocked',
    safeSummary: 'This item requires approved Islamic Studies source or teacher confirmation before parent sharing.',
    supportAction: 'no_action_needed',
    visibilityLevel: 'teacher_mediated_only',
    safeEvidenceRefs: [],
    safeReasonCodes: ['blocked_by_deen_boundary'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function blockNotificationForSourceTruth(
  schoolId: string,
  studentId: string,
  parentId: string,
  notificationType: Phase3ParentNotificationType,
): Phase3ParentNotificationDecision {
  const decision: Phase3ParentNotificationDecision = {
    decisionId: generateDecisionId(),
    schoolId,
    studentId,
    parentId,
    notificationType,
    notificationStatus: 'blocked_by_source_truth',
    priority: 'blocked',
    safeTitle: 'Notification blocked',
    safeSummary: 'This item needs approved source context before parent sharing.',
    supportAction: 'no_action_needed',
    visibilityLevel: 'teacher_mediated_only',
    safeEvidenceRefs: [],
    safeReasonCodes: ['blocked_by_source_truth'],
    createdAt: nowISO(),
  };

  repo.upsertParentNotificationDecision(decision);
  return decision;
}

export function rankParentNotificationDecisions(
  decisions: Phase3ParentNotificationDecision[],
): Phase3ParentNotificationDecision[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    blocked: 4,
  };
  return [...decisions].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 99;
    const pb = priorityOrder[b.priority] ?? 99;
    return pa - pb;
  });
}

export function dedupeParentNotificationDecisions(
  decisions: Phase3ParentNotificationDecision[],
): Phase3ParentNotificationDecision[] {
  const seen = new Set<string>();
  return decisions.filter((d) => {
    const key = `${d.notificationType}:${d.studentId}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getStatusFromVisibility(decision: Phase3ParentVisibilityDecision): Phase3ParentNotificationStatus {
  if (decision.visibilityLevel === 'none' || decision.visibilityLevel === 'blocked') {
    return 'blocked_by_visibility';
  }
  if (decision.isSafeguardingSeparated) {
    return 'blocked_by_safeguarding';
  }
  if (decision.sourceTruthStatus === 'source_required') {
    return 'blocked_by_source_truth';
  }
  if (decision.isDeenSensitive) {
    return 'blocked_by_deen_boundary';
  }
  return 'queued';
}

function getPriorityForNotificationType(
  notificationType: Phase3ParentNotificationType,
  decision: Phase3ParentVisibilityDecision,
): Phase3ParentSupportPriority {
  if (decision.visibilityLevel === 'blocked' || decision.visibilityLevel === 'none') {
    return 'blocked';
  }
  switch (notificationType) {
    case 'teacher_requested_support':
    case 'teacher_support_needed':
      return 'high';
    case 'missed_study_plan_step':
    case 'revision_due_support':
    case 'repeated_weak_topic_support':
    case 'confidence_recovery_support':
    case 'source_required_notice':
      return 'medium';
    default:
      return 'low';
  }
}

function getSafeTitle(notificationType: Phase3ParentNotificationType): string {
  switch (notificationType) {
    case 'weekly_progress_summary':
      return 'Weekly progress update';
    case 'daily_support_nudge':
      return 'Daily learning update';
    case 'missed_study_plan_step':
      return 'Study plan step to review';
    case 'revision_due_support':
      return 'Revision items to review';
    case 'repeated_weak_topic_support':
      return 'Topic review suggestion';
    case 'confidence_recovery_support':
      return 'Confidence building opportunity';
    case 'positive_growth_update':
      return 'Positive learning update';
    case 'teacher_requested_support':
      return 'Teacher support suggestion';
    case 'source_required_notice':
      return 'Source context needed';
    case 'teacher_support_needed':
      return 'Teacher support needed';
    case 'empty_state':
      return 'No updates yet';
    case 'blocked':
      return 'Updates limited';
  }
}

function getSafeSummary(notificationType: Phase3ParentNotificationType): string {
  switch (notificationType) {
    case 'weekly_progress_summary':
      return 'Your child\'s weekly progress summary is available for review.';
    case 'daily_support_nudge':
      return 'Support your child with today\'s learning activities.';
    case 'missed_study_plan_step':
      return 'A study plan step may need attention.';
    case 'revision_due_support':
      return 'Your child has revision items to review.';
    case 'repeated_weak_topic_support':
      return 'Revisiting a topic may strengthen understanding.';
    case 'confidence_recovery_support':
      return 'Explaining ideas in their own words can build confidence.';
    case 'positive_growth_update':
      return 'Your child has shown effort and improvement.';
    case 'teacher_requested_support':
      return 'A teacher has identified an area for additional support.';
    case 'source_required_notice':
      return 'Teacher-approved source context is needed.';
    case 'teacher_support_needed':
      return 'Teacher support is recommended for this area.';
    case 'empty_state':
      return 'No new updates at this time.';
    case 'blocked':
      return 'Updates are currently limited.';
  }
}

function getSupportAction(notificationType: Phase3ParentNotificationType): Phase3ParentSupportAction {
  switch (notificationType) {
    case 'weekly_progress_summary':
    case 'positive_growth_update':
      return 'celebrate_effort';
    case 'daily_support_nudge':
      return 'encourage_short_revision';
    case 'missed_study_plan_step':
      return 'support_study_plan_time';
    case 'revision_due_support':
      return 'remind_revision_due';
    case 'repeated_weak_topic_support':
    case 'confidence_recovery_support':
      return 'ask_child_to_explain';
    case 'teacher_requested_support':
    case 'teacher_support_needed':
      return 'ask_teacher_for_support';
    case 'source_required_notice':
      return 'ask_teacher_for_source';
    default:
      return 'no_action_needed';
  }
}
