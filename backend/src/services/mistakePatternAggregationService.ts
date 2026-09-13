import prisma from '../lib/prisma';

export interface MistakePatternResult {
  patternKey: string;
  subjectId?: string;
  topicId?: string;
  skillId?: string;
  mistakeCategory: string;
  safeTitle: string;
  safeSummary: string;
  recurrenceCount: number;
  firstObservedAt: string;
  lastObservedAt: string;
  recoverySignals: string[];
  recommendedRepairAction: string;
  safeEvidenceRefs: string[];
}

export async function aggregateMistakePatterns(
  schoolId: string,
  studentId: string,
  subjectId?: string,
): Promise<MistakePatternResult[]> {
  const where: any = { schoolId, studentId };
  if (subjectId) where.subjectId = subjectId;

  const signals = await prisma.learningModeSignal.findMany({
    where: { ...where, mistakeCategory: { not: null } },
    orderBy: { createdAt: 'asc' },
  });
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { ...where, mistakeCategory: { not: null } },
    orderBy: { createdAt: 'asc' },
  });

  const recoverySignals = await prisma.learningModeSignal.findMany({
    where: { ...where, signalType: 'recovery_detected' },
    orderBy: { createdAt: 'asc' },
  });

  // Group by mistake category + topic
  const patternMap = new Map<string, {
    mistakeCategory: string;
    topicId: string | null;
    subjectId: string | null;
    skillId: string | null;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    recoveryCount: number;
  }>();

  for (const s of signals) {
    if (!s.mistakeCategory) continue;
    const key = buildMistakePatternKey(s.mistakeCategory, s.topicId || undefined, s.skillId || undefined);
    const existing = patternMap.get(key) || {
      mistakeCategory: s.mistakeCategory,
      topicId: s.topicId || null,
      subjectId: s.subjectId || null,
      skillId: s.skillId || null,
      count: 0,
      firstSeen: s.createdAt,
      lastSeen: s.createdAt,
      recoveryCount: 0,
    };
    existing.count++;
    if (s.createdAt < existing.firstSeen) existing.firstSeen = s.createdAt;
    if (s.createdAt > existing.lastSeen) existing.lastSeen = s.createdAt;
    patternMap.set(key, existing);
  }

  for (const a of attempts) {
    if (!a.mistakeCategory) continue;
    const key = buildMistakePatternKey(a.mistakeCategory, a.topicId || undefined, a.skillId || undefined);
    const existing = patternMap.get(key);
    if (existing) {
      existing.count++;
      if (a.createdAt < existing.firstSeen) existing.firstSeen = a.createdAt;
      if (a.createdAt > existing.lastSeen) existing.lastSeen = a.createdAt;
    }
  }

  // Count recoveries per pattern
  for (const rs of recoverySignals) {
    for (const [, pattern] of patternMap) {
      if (pattern.topicId && rs.topicId === pattern.topicId) {
        pattern.recoveryCount++;
      }
    }
  }

  const results: MistakePatternResult[] = [];
  for (const [, pattern] of patternMap) {
    if (pattern.count === 0) continue;
    results.push({
      patternKey: buildMistakePatternKey(pattern.mistakeCategory, pattern.topicId || undefined, pattern.skillId || undefined),
      subjectId: pattern.subjectId || undefined,
      topicId: pattern.topicId || undefined,
      skillId: pattern.skillId || undefined,
      mistakeCategory: pattern.mistakeCategory,
      safeTitle: buildSafeMistakeTitle(pattern.mistakeCategory),
      safeSummary: buildSafeMistakeSummary(pattern.mistakeCategory, pattern.count, pattern.recoveryCount),
      recurrenceCount: pattern.count,
      firstObservedAt: pattern.firstSeen.toISOString(),
      lastObservedAt: pattern.lastSeen.toISOString(),
      recoverySignals: pattern.recoveryCount > 0 ? ['recovery_detected'] : [],
      recommendedRepairAction: mapMistakeToRepair(pattern.mistakeCategory),
      safeEvidenceRefs: [],
    });
  }

  return rankRecurringMistakes(results);
}

export function buildMistakePatternKey(
  mistakeCategory: string,
  topicId?: string,
  skillId?: string,
): string {
  return [mistakeCategory, topicId || '_', skillId || '_'].join(':');
}

export function rankRecurringMistakes(patterns: MistakePatternResult[]): MistakePatternResult[] {
  return [...patterns].sort((a, b) => b.recurrenceCount - a.recurrenceCount);
}

function buildSafeMistakeTitle(category: string): string {
  const titles: Record<string, string> = {
    conceptual: 'Conceptual misunderstanding',
    procedural: 'Procedural error',
    careless: 'Careless mistake',
    misreading: 'Misread the question',
    prerequisite_gap: 'Missing prerequisite knowledge',
    language_barrier: 'Language comprehension difficulty',
    unknown: 'Uncategorized error',
  };
  return titles[category] || 'Learning difficulty';
}

function buildSafeMistakeSummary(category: string, count: number, recoveryCount: number): string {
  const base = buildSafeMistakeTitle(category);
  const recoveryNote = recoveryCount > 0 ? ` (${recoveryCount} recoveries)` : '';
  return `${base} observed ${count} time(s)${recoveryNote}`;
}

function mapMistakeToRepair(category: string): string {
  const repairs: Record<string, string> = {
    conceptual: 'review_topic',
    procedural: 'practice_more',
    careless: 'try_smaller_step',
    misreading: 'rephrase_question',
    prerequisite_gap: 'revisit_prerequisite',
    language_barrier: 'use_simpler_language',
    unknown: 'teacher_consult',
  };
  return repairs[category] || 'review_topic';
}
