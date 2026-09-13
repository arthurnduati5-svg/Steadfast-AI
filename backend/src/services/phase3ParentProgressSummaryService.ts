import {
  type Phase3ParentSafeProgressSummary,
  type Phase3ParentSafeSummarySection,
  type Phase3ParentSupportSuggestion,
  type Phase3ParentSummaryType,
  type Phase3ParentVisibilityLevel,
  type Phase3ParentSupportSourceType,
  type Phase3ParentSupportSignalType,
  type Phase3ParentSupportPriority,
  type Phase3ParentSupportAction,
  type Phase3ParentVisibilityDecision,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';
import * as visibilityGuard from './phase3ParentVisibilityGuardService';

let summaryIdCounter = 0;

function generateSummaryId(): string {
  const c = ++summaryIdCounter;
  return `ps_${Date.now().toString(36)}_${c.toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function nowISO(): string {
  return new Date().toISOString();
}

function generateSectionId(): string {
  return `sec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function generateSuggestionId(): string {
  return `sg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function buildParentSafeProgressSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
  summaryType: Phase3ParentSummaryType,
  visibilityDecision: Phase3ParentVisibilityDecision,
): Phase3ParentSafeProgressSummary {
  const headline = buildParentSafeHeadline(summaryType);
  const summary = buildParentSafeSummary(summaryType);

  const progressSummary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType,
    safeHeadline: headline,
    safeSummary: summary,
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: visibilityDecision.safeReasonCodes,
    visibilityDecisionId: visibilityDecision.decisionId,
  };

  repo.upsertParentSafeProgressSummary(progressSummary);
  return progressSummary;
}

export function buildWeeklyParentProgressSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
  sections: Phase3ParentSafeSummarySection[],
  suggestions: Phase3ParentSupportSuggestion[],
): Phase3ParentSafeProgressSummary {
  const dedupedSections = dedupeParentSummarySections(sections);
  const rankedSections = rankParentSummarySections(dedupedSections);

  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'weekly_progress',
    safeHeadline: buildParentSafeHeadline('weekly_progress'),
    safeSummary: buildParentSafeSummary('weekly_progress'),
    sections: rankedSections,
    supportSuggestions: suggestions,
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['weekly_progress'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildDailyParentSupportSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'daily_support',
    safeHeadline: buildParentSafeHeadline('daily_support'),
    safeSummary: buildParentSafeSummary('daily_support'),
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['daily_support'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildObjectiveParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'objective_progress',
    safeHeadline: buildParentSafeHeadline('objective_progress'),
    safeSummary: buildParentSafeSummary('objective_progress'),
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['objective_progress'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildStudyPlanParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'study_plan_progress',
    safeHeadline: buildParentSafeHeadline('study_plan_progress'),
    safeSummary: buildParentSafeSummary('study_plan_progress'),
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['study_plan_progress'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildRevisionParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'revision_support',
    safeHeadline: buildParentSafeHeadline('revision_support'),
    safeSummary: buildParentSafeSummary('revision_support'),
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['revision_support'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildConfidenceRecoveryParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'confidence_recovery_support',
    safeHeadline: buildParentSafeHeadline('confidence_recovery_support'),
    safeSummary: buildParentSafeSummary('confidence_recovery_support'),
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['confidence_recovery_support'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildPositiveGrowthParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
  sections: Phase3ParentSafeSummarySection[],
): Phase3ParentSafeProgressSummary {
  const dedupedSections = dedupeParentSummarySections(sections);
  const rankedSections = rankParentSummarySections(dedupedSections);

  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'weekly_progress',
    safeHeadline: 'Your child has shown effort and improvement.',
    safeSummary: 'Keep encouraging their learning journey.',
    sections: rankedSections,
    supportSuggestions: [{
      suggestionId: generateSuggestionId(),
      supportAction: 'celebrate_effort',
      safeTitle: 'Celebrate progress',
      safeSummary: 'Your child has been working well. A little encouragement goes a long way.',
      priority: 'low',
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: ['positive_growth'],
      safeEvidenceRefs: [],
    }],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['positive_growth'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildSourceRequiredParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'source_required_notice',
    safeHeadline: 'This item needs an approved source before it can be shared as parent guidance.',
    safeSummary: 'A teacher-approved source is needed before this item can continue.',
    sections: [],
    supportSuggestions: [{
      suggestionId: generateSuggestionId(),
      supportAction: 'ask_teacher_for_source',
      safeTitle: 'Ask teacher for source',
      safeSummary: 'This item needs approved source context before parent sharing.',
      priority: 'medium',
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: ['source_required'],
      safeEvidenceRefs: [],
    }],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['source_required'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildTeacherSupportParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'teacher_requested_support',
    safeHeadline: 'The teacher may need to support this area.',
    safeSummary: 'A teacher may need to provide additional support for this area.',
    sections: [],
    supportSuggestions: [{
      suggestionId: generateSuggestionId(),
      supportAction: 'ask_teacher_for_support',
      safeTitle: 'Teacher support recommended',
      safeSummary: 'Consider discussing this area with the teacher for guidance.',
      priority: 'high',
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: ['teacher_support_needed'],
      safeEvidenceRefs: [],
    }],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['teacher_support_needed'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function buildEmptyParentSummary(
  schoolId: string,
  studentId: string,
  parentId: string,
): Phase3ParentSafeProgressSummary {
  const summary: Phase3ParentSafeProgressSummary = {
    summaryId: generateSummaryId(),
    schoolId,
    studentId,
    parentId,
    generatedAt: nowISO(),
    summaryType: 'empty_state',
    safeHeadline: 'Learning progress information is not yet available.',
    safeSummary: 'Check back after your child has completed some learning activities.',
    sections: [],
    supportSuggestions: [],
    notificationDecisions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['empty_state'],
  };

  repo.upsertParentSafeProgressSummary(summary);
  return summary;
}

export function dedupeParentSummarySections(
  sections: Phase3ParentSafeSummarySection[],
): Phase3ParentSafeSummarySection[] {
  const seen = new Set<string>();
  return sections.filter((s) => {
    const key = `${s.sectionType}:${s.safeTitle}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function rankParentSummarySections(
  sections: Phase3ParentSafeSummarySection[],
): Phase3ParentSafeSummarySection[] {
  const priorityOrder: Record<string, number> = {
    urgent: 0,
    high: 1,
    medium: 2,
    low: 3,
    blocked: 4,
  };
  return [...sections].sort((a, b) => {
    const pa = priorityOrder[a.priority] ?? 99;
    const pb = priorityOrder[b.priority] ?? 99;
    return pa - pb;
  });
}

export function buildParentSafeHeadline(summaryType: Phase3ParentSummaryType): string {
  switch (summaryType) {
    case 'weekly_progress':
      return 'Your child is making progress this week.';
    case 'daily_support':
      return 'Here is today\'s learning support overview.';
    case 'objective_progress':
      return 'Your child is working through learning objectives.';
    case 'study_plan_progress':
      return 'Your child\'s study plan is active.';
    case 'revision_support':
      return 'Your child has revision items to review.';
    case 'confidence_recovery_support':
      return 'Your child is building confidence in their learning.';
    case 'teacher_requested_support':
      return 'The teacher may need to support this area.';
    case 'source_required_notice':
      return 'This item needs approved source context before sharing.';
    case 'empty_state':
      return 'Learning progress information is not yet available.';
    case 'blocked':
      return 'Some information is limited.';
    default:
      return 'Learning progress summary.';
  }
}

export function buildParentSafeSummary(summaryType: Phase3ParentSummaryType): string {
  switch (summaryType) {
    case 'weekly_progress':
      return 'Your child has been working on their learning goals this week. Keep encouraging their effort.';
    case 'daily_support':
      return 'Support your child with today\'s learning activities. A short review session can help.';
    case 'objective_progress':
      return 'Your child is making progress and may need a short revisit on some objectives.';
    case 'study_plan_progress':
      return 'Your child\'s study plan is progressing. Encourage them to follow their schedule.';
    case 'revision_support':
      return 'Your child has items due for revision. A short review session would be helpful.';
    case 'confidence_recovery_support':
      return 'Your child may benefit from explaining some ideas again in their own words.';
    case 'teacher_requested_support':
      return 'The teacher has identified an area that may need additional support.';
    case 'source_required_notice':
      return 'This item needs teacher-approved source context before parent sharing.';
    case 'empty_state':
      return 'Check back after your child has completed some learning activities.';
    case 'blocked':
      return 'Some information is limited. Please contact the school for more details.';
    default:
      return 'Learning progress information.';
  }
}

export function buildParentSafeSupportSuggestions(
  signals: { signalType: Phase3ParentSupportSignalType; safeSummary: string }[],
): Phase3ParentSupportSuggestion[] {
  const suggestions: Phase3ParentSupportSuggestion[] = [];

  for (const signal of signals) {
    const action = mapSignalToSupportAction(signal.signalType);
    suggestions.push({
      suggestionId: generateSuggestionId(),
      supportAction: action,
      safeTitle: getSuggestionTitle(action),
      safeSummary: signal.safeSummary,
      priority: getSignalPriority(signal.signalType),
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: [signal.signalType],
      safeEvidenceRefs: [],
    });
  }

  return suggestions;
}

function mapSignalToSupportAction(signalType: Phase3ParentSupportSignalType): Phase3ParentSupportAction {
  switch (signalType) {
    case 'objective_needs_support':
    case 'study_plan_missed':
      return 'support_study_plan_time';
    case 'revision_due':
      return 'remind_revision_due';
    case 'weak_topic_repeated':
    case 'mistake_pattern_repeated':
    case 'confidence_recovery_needed':
      return 'ask_child_to_explain';
    case 'teacher_support_needed':
      return 'ask_teacher_for_support';
    case 'source_required':
      return 'ask_teacher_for_source';
    case 'positive_growth':
    case 'micro_mastery_growth':
      return 'celebrate_effort';
    case 'daily_check_completed':
    case 'objective_progress':
      return 'encourage_short_revision';
    default:
      return 'no_action_needed';
  }
}

function getSuggestionTitle(action: Phase3ParentSupportAction): string {
  switch (action) {
    case 'ask_child_to_explain':
      return 'Ask your child to explain';
    case 'encourage_short_revision':
      return 'Encourage short revision';
    case 'support_study_plan_time':
      return 'Support study plan time';
    case 'remind_revision_due':
      return 'Remind revision is due';
    case 'ask_teacher_for_source':
      return 'Ask teacher for source';
    case 'ask_teacher_for_support':
      return 'Ask teacher for support';
    case 'celebrate_effort':
      return 'Celebrate effort';
    case 'review_teacher_note':
      return 'Review teacher note';
    case 'no_action_needed':
      return 'No action needed';
  }
}

function getSignalPriority(signalType: Phase3ParentSupportSignalType): Phase3ParentSupportPriority {
  switch (signalType) {
    case 'teacher_support_needed':
      return 'high';
    case 'source_required':
    case 'study_plan_missed':
    case 'revision_due':
      return 'medium';
    case 'weak_topic_repeated':
    case 'mistake_pattern_repeated':
    case 'confidence_recovery_needed':
      return 'medium';
    case 'objective_needs_support':
      return 'medium';
    default:
      return 'low';
  }
}
