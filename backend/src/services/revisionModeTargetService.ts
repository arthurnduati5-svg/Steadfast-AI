import { FORBIDDEN_REVISION_MODE_FIELDS } from '../contracts/revisionModeContracts';

export interface SafeRevisionTarget {
  targetType: string;
  targetRef?: string;
  approvedContentRef?: string;
  sourceMode?: string;
  sourceSessionRef?: string;
  sourceSummaryRef?: string;
  contentFingerprint?: string;
  topicId?: string;
  skillId?: string;
  difficultyBucket?: string;
  priorityBucket?: string;
}

function containsForbiddenField(value: Record<string, unknown>): boolean {
  return Object.keys(value).some((key) =>
    FORBIDDEN_REVISION_MODE_FIELDS.includes(key as any),
  );
}

export function normalizeSafeTargetRefs(input: Record<string, unknown>): SafeRevisionTarget {
  if (containsForbiddenField(input)) {
    throw new Error('Input contains forbidden revision mode fields');
  }
  return {
    targetType: String(input.targetType || 'concept'),
    targetRef: input.targetRef ? String(input.targetRef) : undefined,
    approvedContentRef: input.approvedContentRef ? String(input.approvedContentRef) : undefined,
    sourceMode: input.sourceMode ? String(input.sourceMode) : undefined,
    sourceSessionRef: input.sourceSessionRef ? String(input.sourceSessionRef) : undefined,
    sourceSummaryRef: input.sourceSummaryRef ? String(input.sourceSummaryRef) : undefined,
    contentFingerprint: input.contentFingerprint ? String(input.contentFingerprint) : undefined,
    topicId: input.topicId ? String(input.topicId) : undefined,
    skillId: input.skillId ? String(input.skillId) : undefined,
    difficultyBucket: input.difficultyBucket ? String(input.difficultyBucket) : undefined,
    priorityBucket: input.priorityBucket ? String(input.priorityBucket) : undefined,
  };
}

export function buildTargetFromWeakTopic(params: {
  topicId: string;
  skillId?: string;
  priorityBucket?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'weak_topic',
    topicId: params.topicId,
    skillId: params.skillId,
    priorityBucket: params.priorityBucket || 'high',
  };
}

export function buildTargetFromMistakePattern(params: {
  topicId?: string;
  skillId?: string;
  sourceSummaryRef?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'mistake_pattern',
    topicId: params.topicId,
    skillId: params.skillId,
    sourceSummaryRef: params.sourceSummaryRef,
  };
}

export function buildTargetFromQuizSummary(params: {
  sourceSessionRef: string;
  sourceSummaryRef: string;
  topicId?: string;
  skillId?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'quiz_item',
    sourceMode: 'quiz',
    sourceSessionRef: params.sourceSessionRef,
    sourceSummaryRef: params.sourceSummaryRef,
    topicId: params.topicId,
    skillId: params.skillId,
  };
}

export function buildTargetFromExamSummary(params: {
  sourceSessionRef: string;
  sourceSummaryRef: string;
  topicId?: string;
  skillId?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'exam_item',
    sourceMode: 'exam',
    sourceSessionRef: params.sourceSessionRef,
    sourceSummaryRef: params.sourceSummaryRef,
    topicId: params.topicId,
    skillId: params.skillId,
  };
}

export function buildTargetFromTeachBackSummary(params: {
  sourceSessionRef: string;
  sourceSummaryRef: string;
  topicId?: string;
  skillId?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'teach_back_item',
    sourceMode: 'teach_back',
    sourceSessionRef: params.sourceSessionRef,
    sourceSummaryRef: params.sourceSummaryRef,
    topicId: params.topicId,
    skillId: params.skillId,
  };
}

export function buildTargetFromFocusSummary(params: {
  sourceSessionRef: string;
  sourceSummaryRef: string;
  topicId?: string;
  skillId?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'focus_item',
    sourceMode: 'focus',
    sourceSessionRef: params.sourceSessionRef,
    sourceSummaryRef: params.sourceSummaryRef,
    topicId: params.topicId,
    skillId: params.skillId,
  };
}

export function buildTargetFromApprovedContentRef(params: {
  approvedContentRef: string;
  topicId?: string;
  skillId?: string;
}): SafeRevisionTarget {
  return {
    targetType: 'approved_content_item',
    approvedContentRef: params.approvedContentRef,
    topicId: params.topicId,
    skillId: params.skillId,
  };
}

export function detectContentGap(input: SafeRevisionTarget): boolean {
  if (input.targetType === 'approved_content_item' && !input.approvedContentRef) {
    return true;
  }
  return false;
}

export function detectDeenUncertainty(input: SafeRevisionTarget): boolean {
  if (
    input.topicId &&
    (input.topicId.toLowerCase().includes('deen') ||
      input.topicId.toLowerCase().includes('islam'))
  ) {
    return !input.approvedContentRef;
  }
  return false;
}
