import type { GrowthLearnerEvidenceSnapshot } from '../contracts/growthActionContracts';

export interface LearnerState {
  masteryState: MasteryStateSummary;
  weakTopicState: WeakTopicStateSummary;
  mistakePatternState: MistakePatternStateSummary;
  revisionDueState: RevisionDueStateSummary;
  lastModeState: LastModeStateSummary;
  supportNeedState: SupportNeedStateSummary;
  teacherAssignmentState: TeacherAssignmentStateSummary;
  contentGovernanceState: ContentGovernanceStateSummary;
  deenGovernanceState: DeenGovernanceStateSummary;
}

export interface MasteryStateSummary {
  status: 'no_data_yet' | 'low' | 'medium' | 'high';
  reasons: string[];
}

export interface WeakTopicStateSummary {
  hasWeakTopics: boolean;
  weakTopicCount: number;
  reasons: string[];
}

export interface MistakePatternStateSummary {
  hasPatterns: boolean;
  patternCount: number;
  reasons: string[];
}

export interface RevisionDueStateSummary {
  hasDueItems: boolean;
  dueItemCount: number;
  reasons: string[];
}

export interface LastModeStateSummary {
  lastMode?: string;
  exitReason?: string;
  reasons: string[];
}

export interface SupportNeedStateSummary {
  hasSupportNeed: boolean;
  supportUrgency?: string;
  reasons: string[];
}

export interface TeacherAssignmentStateSummary {
  hasAssignments: boolean;
  assignmentCount: number;
  reasons: string[];
}

export interface ContentGovernanceStateSummary {
  contentAvailable: boolean;
  contentGap: boolean;
  reasons: string[];
}

export interface DeenGovernanceStateSummary {
  deenDetected: boolean;
  deenUncertain: boolean;
  reasons: string[];
}

export function buildLearnerState(evidence: GrowthLearnerEvidenceSnapshot): LearnerState {
  const weakTopicState: WeakTopicStateSummary = {
    hasWeakTopics: evidence.weakTopicSignals.length > 0,
    weakTopicCount: evidence.weakTopicSignals.length,
    reasons: evidence.weakTopicSignals.length > 0 ? ['weak_topic_detected'] : ['insufficient_evidence'],
  };

  const mistakePatternState: MistakePatternStateSummary = {
    hasPatterns: evidence.mistakeSignals.length > 0,
    patternCount: evidence.mistakeSignals.length,
    reasons: evidence.mistakeSignals.length > 0 ? ['mistake_pattern_detected'] : ['insufficient_evidence'],
  };

  const revisionDueState: RevisionDueStateSummary = {
    hasDueItems: evidence.revisionSignals.length > 0,
    dueItemCount: evidence.revisionSignals.length,
    reasons: evidence.revisionSignals.length > 0 ? ['spaced_review_due', 'revision_due'] : ['insufficient_evidence'],
  };

  const lastMode: LastModeStateSummary = {
    lastMode: evidence.modeSummarySignals.length > 0 ? evidence.modeSummarySignals[0].mode : undefined,
    exitReason: evidence.modeSummarySignals.length > 0 ? evidence.modeSummarySignals[0].exitReason : undefined,
    reasons: evidence.modeSummarySignals.length > 0 ? ['mode_available'] : ['insufficient_evidence'],
  };

  const highestMastery = findHighestMastery(evidence.masterySignals);
  const masteryState: MasteryStateSummary = {
    status: highestMastery,
    reasons: highestMastery !== 'no_data_yet' ? ['mode_available'] : ['insufficient_evidence'],
  };

  const supportNeedState: SupportNeedStateSummary = {
    hasSupportNeed: evidence.supportSignals.length > 0,
    supportUrgency: evidence.supportSignals.length > 0 ? evidence.supportSignals[0].urgency : undefined,
    reasons: evidence.supportSignals.length > 0 ? ['insufficient_evidence'] : ['insufficient_evidence'],
  };

  const teacherAssignmentState: TeacherAssignmentStateSummary = {
    hasAssignments: false,
    assignmentCount: 0,
    reasons: ['insufficient_evidence'],
  };

  const contentGovernanceState: ContentGovernanceStateSummary = {
    contentAvailable: evidence.contentAvailability.available,
    contentGap: evidence.contentAvailability.gapDetected,
    reasons: evidence.contentAvailability.gapDetected ? ['content_gap'] : [],
  };

  const deenGovernanceState: DeenGovernanceStateSummary = {
    deenDetected: evidence.deenSensitivity.detected,
    deenUncertain: evidence.deenSensitivity.uncertain,
    reasons: evidence.deenSensitivity.uncertain ? ['deen_uncertainty'] : [],
  };

  return {
    masteryState,
    weakTopicState,
    mistakePatternState,
    revisionDueState,
    lastModeState: lastMode,
    supportNeedState,
    teacherAssignmentState,
    contentGovernanceState,
    deenGovernanceState,
  };
}

function findHighestMastery(signals: { level?: string }[]): 'no_data_yet' | 'low' | 'medium' | 'high' {
  if (signals.length === 0) return 'no_data_yet';
  for (const s of signals) {
    if (s.level === 'strong' || s.level === 'secure') return 'high';
  }
  for (const s of signals) {
    if (s.level === 'developing' || s.level === 'nearly_secure') return 'medium';
  }
  return 'low';
}
