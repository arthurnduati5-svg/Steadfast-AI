export type StudyOrbitFeedbackTone = 'strong' | 'close' | 'retry' | 'empty';

export type StudyOrbitStage = 'orienting' | 'attempting' | 'reflecting' | 'solidifying' | 'ready_to_unlock';

export type StudyOrbitReflectionConfidence = 'low' | 'medium' | 'high';

export interface StudyOrbitReflectionEvidence {
  detected: boolean;
  score: number;
  wordCount: number;
  confidence: StudyOrbitReflectionConfidence;
  triggers: string[];
}

export interface StudyOrbitProgressState {
  opens: number;
  quickChecks: number;
  teachBackChecks: number;
  similarQuestionAttempts: number;
  reflections: number;
  strongChecks: number;
  closeChecks: number;
  retryChecks: number;
  keepCount: number;
  saveToRevisionCount: number;
  replayCount: number;
  replayFollowUpSuccesses: number;
  revisitCount: number;
  recoverySuccessCount: number;
  stage: StudyOrbitStage;
  progressPercent: number;
  evidenceScore: number;
  confidenceScore: number;
  lastFeedbackTone: StudyOrbitFeedbackTone | null;
  lastReflectionEvidence: StudyOrbitReflectionEvidence | null;
  lastReplayAtMs: number | null;
  pendingStage: StudyOrbitStage | null;
  pendingStageSinceMs: number | null;
  stageCooldownUntilMs: number;
  stageUpdatedAtMs: number;
  lastEventType: StudyOrbitTrackingEvent['type'] | null;
  updatedAtMs: number;
}

export type StudyOrbitTrackingEvent =
  | {
      type:
        | 'open_quick_challenge'
        | 'open_teach_back'
        | 'open_similar_question'
        | 'open_linked_note'
        | 'keep_anchor'
        | 'keep_explanation'
        | 'save_to_revision'
        | 'replay_card'
        | 'revisit_card';
      atMs?: number;
    }
  | {
      type: 'check_quick_challenge' | 'check_teach_back';
      tone: StudyOrbitFeedbackTone;
      draft: string;
      atMs?: number;
    };

const STAGE_SEQUENCE: StudyOrbitStage[] = [
  'orienting',
  'attempting',
  'reflecting',
  'solidifying',
  'ready_to_unlock',
];

const STAGE_CONFIDENCE_FLOOR: Record<StudyOrbitStage, number> = {
  orienting: 0,
  attempting: 8,
  reflecting: 32,
  solidifying: 46,
  ready_to_unlock: 62,
};

const STAGE_DEBOUNCE_MS = 900;
const STAGE_COOLDOWN_MS = 1800;
const REPLAY_FOLLOW_UP_WINDOW_MS = 10 * 60 * 1000;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clampCount(value: unknown): number {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0) return 0;
  return Math.floor(numeric);
}

function toWordCount(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function getStageRank(stage: StudyOrbitStage): number {
  return STAGE_SEQUENCE.indexOf(stage);
}

function stageByRank(rank: number): StudyOrbitStage {
  return STAGE_SEQUENCE[clamp(rank, 0, STAGE_SEQUENCE.length - 1)];
}

export function detectStudyOrbitReflectionEvidence(draft: string): StudyOrbitReflectionEvidence {
  const normalized = String(draft || '').trim();
  const lowered = normalized.toLowerCase();
  const wordCount = toWordCount(normalized);
  const triggers: string[] = [];

  if (wordCount >= 8) triggers.push('enough_detail');
  if (/\b(because|therefore|means|so that|hence|which means|so)\b/.test(lowered)) triggers.push('reasoning_link');
  if (/\b(i think|i noticed|i realised|i realized|i was wrong|my mistake|i used|i changed|i learned|i learnt)\b/.test(lowered)) {
    triggers.push('self_monitoring');
  }
  if (/\b(instead|correct|fix|mistake|next time|not .* but|improve|improved)\b/.test(lowered)) {
    triggers.push('correction_signal');
  }
  if (/\b(similar|another question|apply|transfer|again in|same pattern|different case)\b/.test(lowered)) {
    triggers.push('transfer_signal');
  }

  const score = triggers.length;
  const detected = wordCount >= 6 && score >= 2;
  const confidence: StudyOrbitReflectionConfidence = !detected ? 'low' : score >= 4 ? 'high' : score >= 3 ? 'medium' : 'low';

  return {
    detected,
    score,
    wordCount,
    confidence,
    triggers,
  };
}

function countEvidenceDimensions(state: Omit<StudyOrbitProgressState, 'stage' | 'progressPercent' | 'evidenceScore' | 'confidenceScore'>): number {
  const dimensions = [
    state.opens + state.quickChecks + state.teachBackChecks > 0,
    state.reflections > 0,
    state.strongChecks + state.closeChecks > 0,
    state.keepCount + state.saveToRevisionCount > 0,
    state.similarQuestionAttempts + state.replayFollowUpSuccesses > 0,
    state.revisitCount > 0,
    state.recoverySuccessCount > 0,
  ];
  return dimensions.filter(Boolean).length;
}

function resolveStudyOrbitEvidenceScore(
  state: Omit<StudyOrbitProgressState, 'stage' | 'progressPercent' | 'evidenceScore' | 'confidenceScore'>
): number {
  const checks = state.quickChecks + state.teachBackChecks;
  const engagement = Math.min(28, state.opens * 5 + checks * 7 + state.similarQuestionAttempts * 6 + state.revisitCount * 4);
  const quality = Math.min(24, state.strongChecks * 10 + state.closeChecks * 6 + state.recoverySuccessCount * 8);
  const reflection = Math.min(
    20,
    state.reflections * 10 + (state.lastReflectionEvidence?.detected ? 4 : 0) + (state.lastReflectionEvidence?.confidence === 'high' ? 3 : 0)
  );
  const consolidation = Math.min(20, state.keepCount * 9 + state.saveToRevisionCount * 8 + state.replayFollowUpSuccesses * 6);
  const antiNoisePenalty = Math.min(10, state.retryChecks * 2);
  return clamp(Math.round(engagement + quality + reflection + consolidation - antiNoisePenalty), 0, 100);
}

function resolveStudyOrbitConfidenceScore(
  state: Omit<StudyOrbitProgressState, 'stage' | 'progressPercent' | 'evidenceScore' | 'confidenceScore'>,
  evidenceScore: number
): number {
  const checks = state.quickChecks + state.teachBackChecks;
  const totalChecks = Math.max(1, checks);
  const qualityRate = (state.strongChecks + state.closeChecks * 0.65) / totalChecks;
  const diversity = countEvidenceDimensions(state);
  const reflectionBoost = state.lastReflectionEvidence?.detected
    ? state.lastReflectionEvidence.confidence === 'high'
      ? 12
      : state.lastReflectionEvidence.confidence === 'medium'
        ? 9
        : 6
    : 0;
  const retryPenalty = Math.min(14, state.retryChecks * 2);
  return clamp(
    Math.round(18 + qualityRate * 28 + diversity * 6 + Math.min(18, checks * 4) + reflectionBoost + evidenceScore * 0.24 - retryPenalty),
    0,
    100
  );
}

function resolveTargetStage(state: {
  opens: number;
  quickChecks: number;
  teachBackChecks: number;
  similarQuestionAttempts: number;
  reflections: number;
  strongChecks: number;
  closeChecks: number;
  keepCount: number;
  saveToRevisionCount: number;
  recoverySuccessCount: number;
  evidenceScore: number;
  confidenceScore: number;
}): StudyOrbitStage {
  const checks = state.quickChecks + state.teachBackChecks;
  const meaningfulEngagement = state.opens + checks + state.similarQuestionAttempts;
  if (meaningfulEngagement <= 0) return 'orienting';

  const reflectionReady = state.reflections > 0 || (checks >= 2 && state.confidenceScore >= 38);
  const solidifyingReady =
    state.keepCount > 0 ||
    state.saveToRevisionCount > 0 ||
    state.strongChecks > 0 ||
    state.recoverySuccessCount > 0 ||
    (state.closeChecks >= 2 && reflectionReady);

  const unlockReady =
    checks >= 1 &&
    (state.keepCount > 0 || state.saveToRevisionCount > 0) &&
    (state.strongChecks > 0 || state.recoverySuccessCount > 0 || state.reflections > 0) &&
    state.confidenceScore >= 62 &&
    state.evidenceScore >= 58;

  if (unlockReady) return 'ready_to_unlock';
  if (solidifyingReady && state.confidenceScore >= 46) return 'solidifying';
  if (reflectionReady) return 'reflecting';
  return 'attempting';
}

function resolveStageWithGuard(
  current: StudyOrbitProgressState | undefined,
  targetStage: StudyOrbitStage,
  confidenceScore: number,
  nowMs: number
): {
  stage: StudyOrbitStage;
  pendingStage: StudyOrbitStage | null;
  pendingStageSinceMs: number | null;
  stageCooldownUntilMs: number;
  stageUpdatedAtMs: number;
} {
  const currentStage = current?.stage || 'orienting';
  const baselinePendingStage = current?.pendingStage || null;
  const baselinePendingStageSince = current?.pendingStageSinceMs || null;
  const baselineCooldownUntilMs = current?.stageCooldownUntilMs || nowMs;
  const baselineStageUpdatedAtMs = current?.stageUpdatedAtMs || nowMs;
  const currentRank = getStageRank(currentStage);
  const targetRank = getStageRank(targetStage);

  if (targetRank <= currentRank) {
    return {
      stage: currentStage,
      pendingStage: null,
      pendingStageSinceMs: null,
      stageCooldownUntilMs: baselineCooldownUntilMs,
      stageUpdatedAtMs: baselineStageUpdatedAtMs,
    };
  }

  const nextStep = stageByRank(Math.min(currentRank + 1, targetRank));
  if (currentStage === 'orienting' && nextStep === 'attempting') {
    return {
      stage: 'attempting',
      pendingStage: null,
      pendingStageSinceMs: null,
      stageCooldownUntilMs: nowMs + Math.floor(STAGE_COOLDOWN_MS * 0.75),
      stageUpdatedAtMs: nowMs,
    };
  }
  const threshold = STAGE_CONFIDENCE_FLOOR[nextStep];
  if (confidenceScore < threshold) {
    return {
      stage: currentStage,
      pendingStage: baselinePendingStage,
      pendingStageSinceMs: baselinePendingStageSince,
      stageCooldownUntilMs: baselineCooldownUntilMs,
      stageUpdatedAtMs: baselineStageUpdatedAtMs,
    };
  }

  if (nowMs < baselineCooldownUntilMs) {
    return {
      stage: currentStage,
      pendingStage: nextStep,
      pendingStageSinceMs: baselinePendingStage === nextStep ? baselinePendingStageSince || nowMs : nowMs,
      stageCooldownUntilMs: baselineCooldownUntilMs,
      stageUpdatedAtMs: baselineStageUpdatedAtMs,
    };
  }

  if (baselinePendingStage === nextStep) {
    const pendingSince = baselinePendingStageSince || nowMs;
    if (nowMs - pendingSince >= STAGE_DEBOUNCE_MS) {
      return {
        stage: nextStep,
        pendingStage: null,
        pendingStageSinceMs: null,
        stageCooldownUntilMs: nowMs + STAGE_COOLDOWN_MS,
        stageUpdatedAtMs: nowMs,
      };
    }
    return {
      stage: currentStage,
      pendingStage: nextStep,
      pendingStageSinceMs: pendingSince,
      stageCooldownUntilMs: baselineCooldownUntilMs,
      stageUpdatedAtMs: baselineStageUpdatedAtMs,
    };
  }

  return {
    stage: currentStage,
    pendingStage: nextStep,
    pendingStageSinceMs: nowMs,
    stageCooldownUntilMs: baselineCooldownUntilMs,
    stageUpdatedAtMs: baselineStageUpdatedAtMs,
  };
}

function withDerivedFields(
  current: StudyOrbitProgressState | undefined,
  input: Omit<StudyOrbitProgressState, 'stage' | 'progressPercent' | 'evidenceScore' | 'confidenceScore'>
): StudyOrbitProgressState {
  const evidenceScore = resolveStudyOrbitEvidenceScore(input);
  const confidenceScore = resolveStudyOrbitConfidenceScore(input, evidenceScore);
  const targetStage = resolveTargetStage({
    opens: input.opens,
    quickChecks: input.quickChecks,
    teachBackChecks: input.teachBackChecks,
    similarQuestionAttempts: input.similarQuestionAttempts,
    reflections: input.reflections,
    strongChecks: input.strongChecks,
    closeChecks: input.closeChecks,
    keepCount: input.keepCount,
    saveToRevisionCount: input.saveToRevisionCount,
    recoverySuccessCount: input.recoverySuccessCount,
    evidenceScore,
    confidenceScore,
  });

  const guarded = resolveStageWithGuard(current, targetStage, confidenceScore, input.updatedAtMs);
  const stageProgressBase = getStageRank(guarded.stage) * 20;
  const stageProgressDelta = clamp(Math.round(confidenceScore * 0.28 + evidenceScore * 0.32), 0, 20);
  const progressPercent = clamp(stageProgressBase + stageProgressDelta, 0, guarded.stage === 'ready_to_unlock' ? 100 : 96);

  return {
    ...input,
    stage: guarded.stage,
    progressPercent,
    evidenceScore,
    confidenceScore,
    pendingStage: guarded.pendingStage,
    pendingStageSinceMs: guarded.pendingStageSinceMs,
    stageCooldownUntilMs: guarded.stageCooldownUntilMs,
    stageUpdatedAtMs: guarded.stageUpdatedAtMs,
  };
}

export function createEmptyStudyOrbitProgressState(nowMs = Date.now()): StudyOrbitProgressState {
  return withDerivedFields(undefined, {
    opens: 0,
    quickChecks: 0,
    teachBackChecks: 0,
    similarQuestionAttempts: 0,
    reflections: 0,
    strongChecks: 0,
    closeChecks: 0,
    retryChecks: 0,
    keepCount: 0,
    saveToRevisionCount: 0,
    replayCount: 0,
    replayFollowUpSuccesses: 0,
    revisitCount: 0,
    recoverySuccessCount: 0,
    lastFeedbackTone: null,
    lastReflectionEvidence: null,
    lastReplayAtMs: null,
    pendingStage: null,
    pendingStageSinceMs: null,
    stageCooldownUntilMs: nowMs,
    stageUpdatedAtMs: nowMs,
    lastEventType: null,
    updatedAtMs: nowMs,
  });
}

export function applyStudyOrbitTrackingEvent(
  current: StudyOrbitProgressState | undefined,
  event: StudyOrbitTrackingEvent
): StudyOrbitProgressState {
  const nowMs = event.atMs || Date.now();
  const baseline = current || createEmptyStudyOrbitProgressState(nowMs);
  const next: Omit<StudyOrbitProgressState, 'stage' | 'progressPercent' | 'evidenceScore' | 'confidenceScore'> = {
    opens: baseline.opens,
    quickChecks: baseline.quickChecks,
    teachBackChecks: baseline.teachBackChecks,
    similarQuestionAttempts: baseline.similarQuestionAttempts,
    reflections: baseline.reflections,
    strongChecks: baseline.strongChecks,
    closeChecks: baseline.closeChecks,
    retryChecks: baseline.retryChecks,
    keepCount: baseline.keepCount,
    saveToRevisionCount: baseline.saveToRevisionCount,
    replayCount: baseline.replayCount,
    replayFollowUpSuccesses: baseline.replayFollowUpSuccesses,
    revisitCount: baseline.revisitCount,
    recoverySuccessCount: baseline.recoverySuccessCount,
    lastFeedbackTone: baseline.lastFeedbackTone,
    lastReflectionEvidence: baseline.lastReflectionEvidence,
    lastReplayAtMs: baseline.lastReplayAtMs,
    pendingStage: baseline.pendingStage,
    pendingStageSinceMs: baseline.pendingStageSinceMs,
    stageCooldownUntilMs: baseline.stageCooldownUntilMs,
    stageUpdatedAtMs: baseline.stageUpdatedAtMs,
    lastEventType: event.type,
    updatedAtMs: nowMs,
  };

  if (event.type === 'open_quick_challenge' || event.type === 'open_teach_back') {
    next.opens += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'open_similar_question') {
    next.similarQuestionAttempts += 1;
    next.opens += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'open_linked_note') {
    next.opens += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'save_to_revision') {
    next.saveToRevisionCount += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'keep_anchor' || event.type === 'keep_explanation') {
    next.keepCount += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'replay_card') {
    next.replayCount += 1;
    next.lastReplayAtMs = nowMs;
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'revisit_card') {
    next.revisitCount += 1;
    return withDerivedFields(baseline, next);
  }

  if (event.type !== 'check_quick_challenge' && event.type !== 'check_teach_back') {
    return withDerivedFields(baseline, next);
  }

  if (event.type === 'check_quick_challenge') next.quickChecks += 1;
  if (event.type === 'check_teach_back') next.teachBackChecks += 1;

  if (event.tone === 'strong') {
    next.strongChecks += 1;
    if (baseline.lastFeedbackTone === 'retry' || baseline.lastFeedbackTone === 'empty') {
      next.recoverySuccessCount += 1;
    }
  }
  if (event.tone === 'close') next.closeChecks += 1;
  if (event.tone === 'retry' || event.tone === 'empty') next.retryChecks += 1;
  next.lastFeedbackTone = event.tone;

  const reflectionEvidence = detectStudyOrbitReflectionEvidence(event.draft);
  if (reflectionEvidence.detected) {
    next.reflections += 1;
    next.lastReflectionEvidence = reflectionEvidence;
  }

  if (
    next.lastReplayAtMs &&
    nowMs - next.lastReplayAtMs <= REPLAY_FOLLOW_UP_WINDOW_MS &&
    (event.tone === 'strong' || event.tone === 'close')
  ) {
    next.replayFollowUpSuccesses += 1;
  }

  return withDerivedFields(baseline, next);
}

export function coerceStudyOrbitProgressState(value: unknown): StudyOrbitProgressState | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Partial<StudyOrbitProgressState>;
  const lastReflectionEvidence = candidate.lastReflectionEvidence;
  const parsedReflectionEvidence: StudyOrbitReflectionEvidence | null =
    lastReflectionEvidence && typeof lastReflectionEvidence === 'object'
      ? {
          detected: Boolean((lastReflectionEvidence as StudyOrbitReflectionEvidence).detected),
          score: clampCount((lastReflectionEvidence as StudyOrbitReflectionEvidence).score),
          wordCount: clampCount((lastReflectionEvidence as StudyOrbitReflectionEvidence).wordCount),
          confidence:
            (lastReflectionEvidence as StudyOrbitReflectionEvidence).confidence === 'high' ||
            (lastReflectionEvidence as StudyOrbitReflectionEvidence).confidence === 'medium'
              ? (lastReflectionEvidence as StudyOrbitReflectionEvidence).confidence
              : 'low',
          triggers: Array.isArray((lastReflectionEvidence as StudyOrbitReflectionEvidence).triggers)
            ? (lastReflectionEvidence as StudyOrbitReflectionEvidence).triggers
                .map((trigger) => String(trigger || '').trim())
                .filter(Boolean)
                .slice(0, 8)
            : [],
        }
      : null;

  const updatedAtMs = clampCount(candidate.updatedAtMs) || Date.now();

  return withDerivedFields(undefined, {
    opens: clampCount(candidate.opens),
    quickChecks: clampCount(candidate.quickChecks),
    teachBackChecks: clampCount(candidate.teachBackChecks),
    similarQuestionAttempts: clampCount(candidate.similarQuestionAttempts),
    reflections: clampCount(candidate.reflections),
    strongChecks: clampCount(candidate.strongChecks),
    closeChecks: clampCount(candidate.closeChecks),
    retryChecks: clampCount(candidate.retryChecks),
    keepCount: clampCount(candidate.keepCount),
    saveToRevisionCount: clampCount(candidate.saveToRevisionCount),
    replayCount: clampCount(candidate.replayCount),
    replayFollowUpSuccesses: clampCount(candidate.replayFollowUpSuccesses),
    revisitCount: clampCount(candidate.revisitCount),
    recoverySuccessCount: clampCount(candidate.recoverySuccessCount),
    lastFeedbackTone:
      candidate.lastFeedbackTone === 'strong' ||
      candidate.lastFeedbackTone === 'close' ||
      candidate.lastFeedbackTone === 'retry' ||
      candidate.lastFeedbackTone === 'empty'
        ? candidate.lastFeedbackTone
        : null,
    lastReflectionEvidence: parsedReflectionEvidence,
    lastReplayAtMs: clampCount(candidate.lastReplayAtMs),
    pendingStage:
      candidate.pendingStage === 'attempting' ||
      candidate.pendingStage === 'reflecting' ||
      candidate.pendingStage === 'solidifying' ||
      candidate.pendingStage === 'ready_to_unlock' ||
      candidate.pendingStage === 'orienting'
        ? candidate.pendingStage
        : null,
    pendingStageSinceMs: clampCount(candidate.pendingStageSinceMs),
    stageCooldownUntilMs: clampCount(candidate.stageCooldownUntilMs),
    stageUpdatedAtMs: clampCount(candidate.stageUpdatedAtMs) || updatedAtMs,
    lastEventType: candidate.lastEventType || null,
    updatedAtMs,
  });
}

export function filterPersistableStudyOrbitTrackingState(
  stateById: Record<string, StudyOrbitProgressState>,
  excludedIds: string[] = []
): Record<string, StudyOrbitProgressState> {
  if (!stateById || typeof stateById !== 'object') return {};
  const excluded = new Set(excludedIds.map((id) => String(id || '').trim()).filter(Boolean));
  const next: Record<string, StudyOrbitProgressState> = {};
  Object.entries(stateById).forEach(([entryId, state]) => {
    const key = String(entryId || '').trim();
    if (!key || excluded.has(key)) return;
    next[key] = state;
  });
  return next;
}

export function formatStudyOrbitStageLabel(stage: StudyOrbitStage): string {
  if (stage === 'ready_to_unlock') return 'Ready to unlock';
  if (stage === 'solidifying') return 'Solidifying';
  if (stage === 'reflecting') return 'Reflecting';
  if (stage === 'attempting') return 'Attempting';
  return 'Orienting';
}

export function formatStudyOrbitStageShortLabel(stage: StudyOrbitStage): string {
  if (stage === 'ready_to_unlock') return 'Unlock';
  if (stage === 'solidifying') return 'Keep';
  if (stage === 'reflecting') return 'Explain';
  if (stage === 'attempting') return 'Try';
  return 'Orient';
}
