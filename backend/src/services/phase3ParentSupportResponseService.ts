import {
  type Phase3ParentSafeProgressSummary,
  type Phase3ParentNotificationCard,
  type Phase3ParentSupportSuggestion,
  type Phase3ParentVisibilityDecision,
  type Phase3ParentLearnerLink,
  type Phase3ParentSupportAction,
} from '../contracts/phase3ParentSupportContracts';
import * as repo from './phase3ParentSupportRepository';
import * as visibilityGuard from './phase3ParentVisibilityGuardService';
import * as progressSummaryService from './phase3ParentProgressSummaryService';

export interface ParentSupportHomeView {
  schoolId: string;
  parentId: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  children: ParentSupportChildView[];
  notificationCards: Phase3ParentNotificationCard[];
  supportSuggestions: Phase3ParentSupportSuggestion[];
  safeEvidenceRefs: string[];
  safeReasonCodes: string[];
  visibilityDecisions: Phase3ParentVisibilityDecision[];
}

export interface ParentSupportChildView {
  studentId: string;
  linkStatus: string;
  visibilityLevel: string;
  progressSummaries: Phase3ParentSafeProgressSummary[];
  notificationCards: Phase3ParentNotificationCard[];
  supportSuggestions: Phase3ParentSupportSuggestion[];
  safeEvidenceRefs: string[];
}

export interface ParentSupportSuggestionView {
  schoolId: string;
  parentId: string;
  studentId: string;
  generatedAt: string;
  safeHeadline: string;
  safeSummary: string;
  supportSuggestions: Phase3ParentSupportSuggestion[];
  visibilityDecision: Phase3ParentVisibilityDecision;
  safeEvidenceRefs: string[];
}

function nowISO(): string {
  return new Date().toISOString();
}

export function buildParentSupportHomeView(
  schoolId: string,
  parentId: string,
): ParentSupportHomeView {
  const links = repo.listLearnerLinksForParent(schoolId, parentId);
  const activeLinks = links.filter((l) => l.linkStatus === 'active');

  const children: ParentSupportChildView[] = [];
  for (const link of activeLinks) {
    const decision = visibilityGuard.resolveParentVisibility(schoolId, parentId, link.studentId);
    const summaries = repo.listParentSafeProgressSummariesForLearner(schoolId, link.studentId);
    const cards = repo.listParentNotificationCardsForLearner(schoolId, link.studentId);

    const suggestions: Phase3ParentSupportSuggestion[] = [];
    for (const s of summaries) {
      suggestions.push(...s.supportSuggestions);
    }

    children.push({
      studentId: link.studentId,
      linkStatus: link.linkStatus,
      visibilityLevel: decision.visibilityLevel,
      progressSummaries: summaries,
      notificationCards: cards,
      supportSuggestions: suggestions,
      safeEvidenceRefs: [],
    });
  }

  const allCards: Phase3ParentNotificationCard[] = [];
  for (const link of links) {
    allCards.push(...repo.listParentNotificationCardsForLearner(schoolId, link.studentId));
  }

  const view: ParentSupportHomeView = {
    schoolId,
    parentId,
    generatedAt: nowISO(),
    safeHeadline: 'Parent support overview',
    safeSummary: 'Here is an overview of your children\'s learning progress.',
    children,
    notificationCards: allCards.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    supportSuggestions: [],
    safeEvidenceRefs: [],
    safeReasonCodes: ['home_view'],
    visibilityDecisions: [],
  };

  return view;
}

export function buildParentChildSummaryView(
  schoolId: string,
  parentId: string,
  studentId: string,
): { view: ParentSupportChildView | null; decision: Phase3ParentVisibilityDecision } {
  const decision = visibilityGuard.assertParentCanViewLearner(schoolId, parentId, studentId);

  const summaries = repo.listParentSafeProgressSummariesForLearner(schoolId, studentId);
  const cards = repo.listParentNotificationCardsForLearner(schoolId, studentId);

  const suggestions: Phase3ParentSupportSuggestion[] = [];
  for (const s of summaries) {
    suggestions.push(...s.supportSuggestions);
  }

  const view: ParentSupportChildView = {
    studentId,
    linkStatus: 'active',
    visibilityLevel: decision.visibilityLevel,
    progressSummaries: summaries,
    notificationCards: cards,
    supportSuggestions: suggestions,
    safeEvidenceRefs: [],
  };

  return { view, decision };
}

export function buildParentNotificationView(
  schoolId: string,
  parentId: string,
  studentId: string,
): Phase3ParentNotificationCard[] {
  const links = repo.listLearnerLinksForParent(schoolId, parentId);
  const link = links.find((l) => l.studentId === studentId);
  if (!link || link.linkStatus !== 'active') return [];

  return repo.listParentNotificationCardsForLearner(schoolId, studentId);
}

export function buildParentSupportSuggestionView(
  schoolId: string,
  parentId: string,
  studentId: string,
): ParentSupportSuggestionView {
  const decision = visibilityGuard.assertParentCanViewLearner(schoolId, parentId, studentId);

  const summaries = repo.listParentSafeProgressSummariesForLearner(schoolId, studentId);
  const suggestions: Phase3ParentSupportSuggestion[] = [];
  for (const s of summaries) {
    suggestions.push(...s.supportSuggestions);
  }

  return {
    schoolId,
    parentId,
    studentId,
    generatedAt: nowISO(),
    safeHeadline: 'Support suggestions',
    safeSummary: 'Here are ways you can support your child\'s learning.',
    supportSuggestions: suggestions,
    visibilityDecision: decision,
    safeEvidenceRefs: [],
  };
}

export function buildParentEmptyStateView(
  schoolId: string,
  parentId: string,
  studentId: string,
): ParentSupportSuggestionView {
  const decision = visibilityGuard.resolveParentVisibility(schoolId, parentId, studentId);

  return {
    schoolId,
    parentId,
    studentId,
    generatedAt: nowISO(),
    safeHeadline: progressSummaryService.buildParentSafeHeadline('empty_state'),
    safeSummary: progressSummaryService.buildParentSafeSummary('empty_state'),
    supportSuggestions: [],
    visibilityDecision: decision,
    safeEvidenceRefs: [],
  };
}

export function buildParentSourceRequiredNotice(
  schoolId: string,
  parentId: string,
  studentId: string,
): ParentSupportSuggestionView {
  const decision = visibilityGuard.buildSourceRequiredVisibilityDecision(schoolId, parentId, studentId);

  return {
    schoolId,
    parentId,
    studentId,
    generatedAt: nowISO(),
    safeHeadline: 'Source context needed',
    safeSummary: 'This item needs approved source context before parent sharing.',
    supportSuggestions: [{
      suggestionId: `sg_${Date.now().toString(36)}`,
      supportAction: 'ask_teacher_for_source',
      safeTitle: 'Ask teacher for source',
      safeSummary: 'This item needs approved source context before parent guidance can be shared.',
      priority: 'medium',
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: ['source_required'],
      safeEvidenceRefs: [],
    }],
    visibilityDecision: decision,
    safeEvidenceRefs: [],
  };
}

export function buildParentTeacherSupportNotice(
  schoolId: string,
  parentId: string,
  studentId: string,
): ParentSupportSuggestionView {
  const decision = visibilityGuard.resolveParentVisibility(schoolId, parentId, studentId);

  return {
    schoolId,
    parentId,
    studentId,
    generatedAt: nowISO(),
    safeHeadline: 'Teacher support may be needed',
    safeSummary: 'The teacher may need to provide additional support for this area.',
    supportSuggestions: [{
      suggestionId: `sg_${Date.now().toString(36)}`,
      supportAction: 'ask_teacher_for_support',
      safeTitle: 'Teacher support recommended',
      safeSummary: 'Consider discussing this area with the teacher for guidance.',
      priority: 'high',
      sourceType: 'parent_visibility_guard',
      safeReasonCodes: ['teacher_support_needed'],
      safeEvidenceRefs: [],
    }],
    visibilityDecision: decision,
    safeEvidenceRefs: [],
  };
}

export function buildParentSafeguardingBlockedNotice(
  schoolId: string,
  parentId: string,
  studentId: string,
): ParentSupportSuggestionView {
  const decision = visibilityGuard.buildSafeguardingBlockedVisibilityDecision(schoolId, parentId, studentId);

  return {
    schoolId,
    parentId,
    studentId,
    generatedAt: nowISO(),
    safeHeadline: 'Information limited',
    safeSummary: 'Some information is only visible to authorized safeguarding staff.',
    supportSuggestions: [],
    visibilityDecision: decision,
    safeEvidenceRefs: [],
  };
}
