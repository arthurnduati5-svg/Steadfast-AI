import {
  TeacherSafeSupportPriority,
  TeacherSafeConfidenceBucket,
  TEACHER_SAFE_SUPPORT_PRIORITIES,
} from '../contracts/teacherSafeInsightContracts';

export interface NoiseFilterItem {
  studentId?: string;
  topicId?: string;
  skillId?: string;
  priority: TeacherSafeSupportPriority;
  confidenceBucket: TeacherSafeConfidenceBucket;
  evidenceCount: number;
  isDemo: boolean;
  isFallback: boolean;
  isSynthetic: boolean;
  isStale: boolean;
  createdAt: string;
  kind: string;
}

const priorityRank: Record<TeacherSafeSupportPriority, number> = {
  none: 5,
  low: 4,
  medium: 3,
  high: 2,
  urgent_safe_escalation: 1,
};

export function filterTeacherSafeSignals(items: NoiseFilterItem[]): NoiseFilterItem[] {
  return items.filter(item => {
    if (item.confidenceBucket === 'not_enough_evidence') return false;
    if (item.isDemo || item.isFallback || item.isSynthetic) return false;
    if (item.isStale && item.priority === 'none') return false;
    if (item.evidenceCount === 0) return false;
    if (item.priority === 'none' && item.confidenceBucket === 'low') return false;
    return true;
  });
}

export function rankTeacherSafeSupportNeeds(items: NoiseFilterItem[]): NoiseFilterItem[] {
  return [...items].sort((a, b) => {
    const prioA = priorityRank[a.priority] ?? 99;
    const prioB = priorityRank[b.priority] ?? 99;
    if (prioA !== prioB) return prioA - prioB;
    return b.evidenceCount - a.evidenceCount;
  });
}

export function limitTeacherWorkloadItems<T>(items: T[], max: number): T[] {
  return items.slice(0, max);
}

export function collapseDuplicateInsightItems(items: NoiseFilterItem[]): NoiseFilterItem[] {
  const seen = new Set<string>();
  const result: NoiseFilterItem[] = [];
  for (const item of items) {
    const key = `${item.studentId ?? ''}:${item.topicId ?? ''}:${item.skillId ?? ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

export function dedupeByStudentTopicSkill(items: NoiseFilterItem[]): NoiseFilterItem[] {
  return collapseDuplicateInsightItems(items);
}

export const DEFAULT_MAX_CONCERNS_PER_LEARNER = 5;
export const DEFAULT_MAX_PATTERNS_PER_CLASS = 7;
export const DEFAULT_MAX_QUEUE_ITEMS = 10;
export const DEFAULT_MAX_NEXT_ACTIONS = 3;
export const DEFAULT_MAX_REASON_CODES = 8;
export const DEFAULT_MAX_EVIDENCE_REFS = 10;
