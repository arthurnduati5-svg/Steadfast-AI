import type { ModeSessionStatus, ModeStage } from '../contracts/learningModeContracts';

export interface TransitionDecision {
  allowed: boolean;
  reason?: string;
  fromStatus?: string;
  toStatus?: string;
  fromStage?: string;
  toStage?: string;
}

// ── Status Transition Rules ──

const STATUS_TRANSITIONS: Record<string, string[]> = {
  requested: ['started', 'cancelled'],
  started: ['active', 'paused', 'cancelled', 'failed'],
  active: ['paused', 'completed', 'cancelled', 'failed', 'resumed'],
  paused: ['resumed', 'completed', 'cancelled', 'expired'],
  resumed: ['active', 'paused', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
  expired: [],
  failed: [],
};

export function canTransitionStatus(
  from: string,
  to: string,
): TransitionDecision {
  const allowed = STATUS_TRANSITIONS[from];
  if (!allowed) {
    return { allowed: false, reason: `Unknown from status: ${from}`, fromStatus: from, toStatus: to };
  }
  if (allowed.includes(to)) {
    return { allowed: true, fromStatus: from, toStatus: to };
  }
  return {
    allowed: false,
    reason: `Cannot transition from ${from} to ${to}`,
    fromStatus: from,
    toStatus: to,
  };
}

// ── Stage Transition Rules ──

const STAGE_ORDER: ModeStage[] = [
  'entry',
  'context_check',
  'goal_set',
  'attempting',
  'hinting',
  'repairing',
  'reflecting',
  'summarizing',
  'completed',
  'cancelled',
];

export function canTransitionStage(
  from: string,
  to: string,
): TransitionDecision {
  const fromIdx = STAGE_ORDER.indexOf(from as ModeStage);
  const toIdx = STAGE_ORDER.indexOf(to as ModeStage);

  if (fromIdx === -1) {
    return { allowed: false, reason: `Unknown from stage: ${from}`, fromStage: from, toStage: to };
  }
  if (toIdx === -1) {
    return { allowed: false, reason: `Unknown to stage: ${to}`, fromStage: from, toStage: to };
  }

  // Allow forward steps (including same stage)
  if (toIdx >= fromIdx) {
    return { allowed: true, fromStage: from, toStage: to };
  }

  // Allow backward to repairing or goal_set from attempting/hinting
  if (from === 'hinting' && (to === 'attempting' || to === 'goal_set' || to === 'context_check')) {
    return { allowed: true, fromStage: from, toStage: to };
  }
  if (from === 'attempting' && (to === 'goal_set' || to === 'context_check')) {
    return { allowed: true, fromStage: from, toStage: to };
  }
  if (from === 'reflecting' && (to === 'attempting' || to === 'goal_set')) {
    return { allowed: true, fromStage: from, toStage: to };
  }
  if (to === 'cancelled' || to === 'completed') {
    return { allowed: true, fromStage: from, toStage: to };
  }

  return {
    allowed: false,
    reason: `Cannot transition stage from ${from} to ${to}`,
    fromStage: from,
    toStage: to,
  };
}

// ── Combined Transition ──

export function canTransition(
  currentStatus: string,
  currentStage: string,
  targetStatus?: string,
  targetStage?: string,
): TransitionDecision {
  if (targetStatus) {
    const statusDecision = canTransitionStatus(currentStatus, targetStatus);
    if (!statusDecision.allowed) return statusDecision;
  }
  if (targetStage) {
    const stageDecision = canTransitionStage(currentStage, targetStage);
    if (!stageDecision.allowed) return stageDecision;
  }
  return { allowed: true };
}
