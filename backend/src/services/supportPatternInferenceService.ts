import prisma from '../lib/prisma';
import type { SupportPatternType } from '../contracts/studentLearningProfileContracts';

export interface SupportPatternResult {
  supportType: SupportPatternType;
  effectivenessSignal: string;
  timesUsed: number;
  recoveryAfterUseCount: number;
  hintLevelMostHelpful?: string;
  lastEffectiveAt?: string;
  confidenceScore: number;
  safeEvidenceRefs: string[];
}

export interface HintDependencyResult {
  hasDependency: boolean;
  dependencyScore: number;
  hintLevelMostUsed: string;
  hintCount: number;
  recoveryAfterHintCount: number;
}

const HINT_TO_SUPPORT_TYPE: Record<string, SupportPatternType> = {
  attention_hint: 'attention_hint',
  direction_hint: 'direction_hint',
  rephrased_question: 'rephrased_question',
  smaller_step: 'smaller_step',
  micro_example: 'micro_example',
  guided_completion: 'guided_completion',
};

export async function inferHelpfulSupportPatterns(
  schoolId: string,
  studentId: string,
): Promise<SupportPatternResult[]> {
  const hintEvents = await prisma.learningModeHintEvent.findMany({
    where: { schoolId, studentId },
    orderBy: { createdAt: 'asc' },
  });
  const attempts = await prisma.learningModeAttempt.findMany({
    where: { schoolId, studentId, usedHint: true },
    orderBy: { createdAt: 'asc' },
  });
  const recoverySignals = await prisma.learningModeSignal.findMany({
    where: { schoolId, studentId, signalType: 'recovery_detected' },
  });
  const signals = await prisma.learningModeSignal.findMany({
    where: { schoolId, studentId, supportActionType: { not: null } },
  });

  // Group by hint level
  const hintCountByLevel = new Map<string, number>();
  const recoveryAfterHintByLevel = new Map<string, number>();
  const hintEffectiveMap = new Map<string, { used: number; recovery: number }>();

  for (const h of hintEvents) {
    const key = h.hintLevel;
    hintCountByLevel.set(key, (hintCountByLevel.get(key) || 0) + 1);
  }

  // Count recoveries per hint level (within the same session, after a hint was given)
  for (const rs of recoverySignals) {
    const sessionHints = hintEvents.filter(h => h.modeSessionId === rs.modeSessionId);
    if (sessionHints.length > 0) {
      const lastHint = sessionHints[sessionHints.length - 1];
      const key = lastHint.hintLevel;
      recoveryAfterHintByLevel.set(key, (recoveryAfterHintByLevel.get(key) || 0) + 1);
    }
  }

  // Build hint usage map
  for (const [level, count] of hintCountByLevel) {
    const recovery = recoveryAfterHintByLevel.get(level) || 0;
    hintEffectiveMap.set(level, { used: count, recovery });
  }

  const results: SupportPatternResult[] = [];

  // For each hint type that was used, create a support pattern
  for (const [hintLevel, stats] of hintEffectiveMap) {
    const supportType = HINT_TO_SUPPORT_TYPE[hintLevel] || 'direction_hint';
    const effectiveness = stats.recovery > stats.used * 0.3 ? 'effective' : stats.recovery > 0 ? 'partially_effective' : 'unknown';
    const confidenceScore = Math.min(0.15 + (stats.used / 20) * 0.5 + (stats.recovery / Math.max(stats.used, 1)) * 0.35, 1);

    results.push({
      supportType,
      effectivenessSignal: effectiveness,
      timesUsed: stats.used,
      recoveryAfterUseCount: stats.recovery,
      hintLevelMostHelpful: hintLevel,
      lastEffectiveAt: undefined,
      confidenceScore: Math.round(confidenceScore * 100) / 100,
      safeEvidenceRefs: [],
    });
  }

  // Add support action types from signals
  const supportActionMap = new Map<string, { used: number; effective: number }>();
  for (const s of signals) {
    if (!s.supportActionType) continue;
    const key = s.supportActionType;
    const entry = supportActionMap.get(key) || { used: 0, effective: 0 };
    entry.used++;
    // If signal indicates recovery after this action, count as effective
    if (s.signalType === 'support_action_effective') {
      entry.effective++;
    }
    supportActionMap.set(key, entry);
  }

  const supportTypeMap: Record<string, SupportPatternType> = {
    simplify: 'attention_hint',
    use_example: 'micro_example',
    revisit_prerequisite: 'revision',
    ask_recall: 'revision',
    break_down: 'smaller_step',
    visual_aid: 'video_support',
    analogy: 'micro_example',
    rephrase: 'rephrased_question',
    mini_quiz: 'practice_more',
    teach_back_invite: 'teach_back',
    raise_confidence: 'attention_hint',
  };

  for (const [actionType, stats] of supportActionMap) {
    const supportType = supportTypeMap[actionType] || 'practice_more';
    const effectiveness = stats.effective > stats.used * 0.3 ? 'effective' : 'unknown';
    const confidenceScore = Math.min(0.15 + (stats.used / 15) * 0.5, 1);

    // Avoid duplicates
    if (!results.find(r => r.supportType === supportType)) {
      results.push({
        supportType,
        effectivenessSignal: effectiveness,
        timesUsed: stats.used,
        recoveryAfterUseCount: stats.effective,
        confidenceScore: Math.round(confidenceScore * 100) / 100,
        safeEvidenceRefs: [],
      });
    }
  }

  return rankSupportActions(results);
}

export function rankSupportActions(patterns: SupportPatternResult[]): SupportPatternResult[] {
  return [...patterns].sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export function detectHintDependency(
  hintEvents: { hintLevel: string }[],
  attempts: { usedHint: boolean }[],
): HintDependencyResult {
  const hintCount = hintEvents.length;
  const totalAttempts = attempts.length;
  const hintLevelCount = new Map<string, number>();

  for (const h of hintEvents) {
    hintLevelCount.set(h.hintLevel, (hintLevelCount.get(h.hintLevel) || 0) + 1);
  }

  let hintLevelMostUsed = 'attention_hint';
  let maxCount = 0;
  for (const [level, count] of hintLevelCount) {
    if (count > maxCount) {
      maxCount = count;
      hintLevelMostUsed = level;
    }
  }

  const dependencyScore = totalAttempts > 0 ? hintCount / totalAttempts : 0;
  const hasDependency = dependencyScore > 0.5;

  return {
    hasDependency,
    dependencyScore: Math.round(dependencyScore * 100) / 100,
    hintLevelMostUsed,
    hintCount,
    recoveryAfterHintCount: 0,
  };
}

export async function detectRecoveryAfterSupport(
  schoolId: string,
  studentId: string,
  supportType: string,
): Promise<number> {
  const signals = await prisma.learningModeSignal.findMany({
    where: {
      schoolId,
      studentId,
      signalType: { in: ['support_action_effective', 'recovery_detected'] },
    },
  });

  const supportSignals = signals.filter(s => s.signalType === 'support_action_effective');
  const recoverySignals = signals.filter(s => s.signalType === 'recovery_detected');

  // Count recoveries that happened after support actions
  let recoveryCount = 0;
  for (const rs of recoverySignals) {
    const before = supportSignals.filter(s =>
      s.modeSessionId === rs.modeSessionId && s.createdAt < rs.createdAt
    );
    if (before.length > 0) recoveryCount++;
  }

  return recoveryCount;
}
