// ─────────────────────────────────────────────────────────────
// Steadfast AI — Revision Queue Contracts v1
// Evidence-backed revision queue items. Each item requires at
// least one evidence event reference. No random recommendations.
// No mastery claims from revision completion alone.
// ─────────────────────────────────────────────────────────────

// ═══════════════════════════════════════════════════════════════
// Revision Priority
// ═══════════════════════════════════════════════════════════════

export type RevisionPriority =
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent_learning_gap';

// ═══════════════════════════════════════════════════════════════
// Revision Reason Code
// ═══════════════════════════════════════════════════════════════

export type RevisionReasonCode =
  | 'repeated_mistake'
  | 'weak_evidence'
  | 'stale_evidence'
  | 'hint_dependency'
  | 'failed_transfer'
  | 'correction_needed'
  | 'practice_gap'
  | 'artifact_gap'
  | 'video_gap'
  | 'integrity_redirect_followup'
  | 'unknown';

// ═══════════════════════════════════════════════════════════════
// Recommended Action
// ═══════════════════════════════════════════════════════════════

export type RevisionRecommendedAction =
  | 'retry_similar_problem'
  | 'explain_concept'
  | 'correct_previous_step'
  | 'practice_foundation'
  | 'watch_targeted_video'
  | 'review_artifact_feedback'
  | 'answer_reflection_question'
  | 'ask_socratic_tutor';

// ═══════════════════════════════════════════════════════════════
// Due Window
// ═══════════════════════════════════════════════════════════════

export type RevisionDueWindow =
  | 'now'
  | 'today'
  | 'this_week'
  | 'later'
  | 'unknown';

// ═══════════════════════════════════════════════════════════════
// Revision Queue Item Status
// ═══════════════════════════════════════════════════════════════

export type RevisionQueueItemStatus = 'open' | 'in_progress' | 'completed' | 'dismissed';

// ═══════════════════════════════════════════════════════════════
// Revision Queue Item
// ═══════════════════════════════════════════════════════════════

export interface RevisionQueueItem {
  /** Unique item ID */
  itemId: string;

  /** Hashed learner identifier — never the raw student ID */
  learnerIdHash?: string;

  /** Subject identifier */
  subjectId?: string;

  /** Skill identifier */
  skillId?: string;

  /** Topic identifier */
  topicId?: string;

  /** Priority of this revision item */
  priority: RevisionPriority;

  /** Reason code for why this revision is needed */
  reasonCode: RevisionReasonCode;

  /** Safe, human-readable reason for revision — no raw private data */
  safeReason: string;

  /** Evidence event IDs supporting this revision item */
  evidenceEventIds: string[];

  /** Recommended action for the learner */
  recommendedAction: RevisionRecommendedAction;

  /** When this revision should be done */
  dueWindow: RevisionDueWindow;

  /** Current status of this item */
  status: RevisionQueueItemStatus;

  /** When the item was created */
  createdAt: string;

  /** When the item was last updated */
  updatedAt?: string;

  /** When the item was completed (if applicable) */
  completedAt?: string;

  /** Compile-time guarantee: no raw private data */
  rawPrivateDataIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Revision Queue Input/Output
// ═══════════════════════════════════════════════════════════════

export interface GenerateRevisionQueueInput {
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  evidenceEvents: Array<{
    eventId: string;
    eventType: string;
    evidenceStrength: string;
    freshness: string;
    sourceQuality: string;
    mistakeType?: string;
    correctionObserved?: boolean;
    reflectionObserved?: boolean;
    transferObserved?: boolean;
    attemptCount?: number;
    hintLevel?: string;
    safeSummary: string;
    createdAt: string;
  }>;
  maxItems?: number;
}

export interface RevisionQueueOutput {
  items: RevisionQueueItem[];
  warnings: string[];
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════
// Revision Queue Metadata
// ═══════════════════════════════════════════════════════════════

export const REVISION_REASON_LABELS: Record<RevisionReasonCode, string> = {
  repeated_mistake: 'Repeated mistake pattern detected',
  weak_evidence: 'Weak evidence of understanding',
  stale_evidence: 'Evidence has become stale',
  hint_dependency: 'Heavy reliance on hints',
  failed_transfer: 'Difficulty applying knowledge to new contexts',
  correction_needed: 'Previous answer needs correction',
  practice_gap: 'Insufficient practice evidence',
  artifact_gap: 'Artifact work incomplete',
  video_gap: 'Video learning gap identified',
  integrity_redirect_followup: 'Follow-up needed after integrity redirect',
  unknown: 'Revision recommended based on general evidence',
};

export const PRIORITY_ORDER: RevisionPriority[] = [
  'urgent_learning_gap',
  'high',
  'medium',
  'low',
];

export const PRIORITY_SCORES: Record<RevisionPriority, number> = {
  urgent_learning_gap: 100,
  high: 75,
  medium: 50,
  low: 25,
};

export const REASON_PRIORITY_MAP: Record<RevisionReasonCode, RevisionPriority> = {
  repeated_mistake: 'high',
  weak_evidence: 'medium',
  stale_evidence: 'medium',
  hint_dependency: 'high',
  failed_transfer: 'high',
  correction_needed: 'medium',
  practice_gap: 'low',
  artifact_gap: 'low',
  video_gap: 'low',
  integrity_redirect_followup: 'urgent_learning_gap',
  unknown: 'low',
};

export const REASON_ACTION_MAP: Record<RevisionReasonCode, RevisionRecommendedAction> = {
  repeated_mistake: 'retry_similar_problem',
  weak_evidence: 'practice_foundation',
  stale_evidence: 'retry_similar_problem',
  hint_dependency: 'practice_foundation',
  failed_transfer: 'explain_concept',
  correction_needed: 'correct_previous_step',
  practice_gap: 'practice_foundation',
  artifact_gap: 'review_artifact_feedback',
  video_gap: 'watch_targeted_video',
  integrity_redirect_followup: 'ask_socratic_tutor',
  unknown: 'ask_socratic_tutor',
};

export const REASON_DUE_WINDOW_MAP: Record<RevisionReasonCode, RevisionDueWindow> = {
  repeated_mistake: 'now',
  weak_evidence: 'today',
  stale_evidence: 'this_week',
  hint_dependency: 'now',
  failed_transfer: 'today',
  correction_needed: 'today',
  practice_gap: 'this_week',
  artifact_gap: 'this_week',
  video_gap: 'today',
  integrity_redirect_followup: 'now',
  unknown: 'later',
};
