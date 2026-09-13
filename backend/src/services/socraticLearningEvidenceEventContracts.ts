// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Learning Evidence Event Contracts v1
// Canonical safe learning evidence event contract.
// Bridges surface-specific evidence systems into one safe shape.
// Never includes raw chat, raw prompts, raw AI responses, or
// raw learner memory.
// ─────────────────────────────────────────────────────────────

import type {
  SocraticLearningEvidenceEventType,
  SocraticLearningEvidenceSurface,
  SocraticEvidenceStrength,
  SocraticSupportLevel,
} from './socraticLearningControlContracts';

// ═══════════════════════════════════════════════════════════════
// Canonical Learning Evidence Event
// ═══════════════════════════════════════════════════════════════

export interface SocraticLearningEvidenceEvent {
  /** Unique event ID */
  eventId: string;

  /** When the event occurred */
  occurredAt: string;

  /** Event type describing what learning activity occurred */
  eventType: SocraticLearningEvidenceEventType;

  /** Surface where the event originated */
  surface: SocraticLearningEvidenceSurface;

  /** Hashed learner identifier — not the raw student ID */
  learnerIdHash?: string;

  /** School context */
  schoolId?: string;

  /** Session context */
  sessionId?: string;

  /** Subject identifier */
  subjectId?: string;

  /** Skill identifier */
  skillId?: string;

  /** Topic identifier */
  topicId?: string;

  /** Safe summary of what happened — no raw private data */
  safeSummary: string;

  /** Strength of evidence this event represents */
  evidenceStrength: SocraticEvidenceStrength;

  /** Optional mistake type for taxonomy tracking */
  mistakeType?: string;

  /** Optional hint level associated with this event */
  hintLevel?: string;

  /** Optional support level associated with this event */
  supportLevel?: SocraticSupportLevel;

  /** Optional decision ID linking back to the control decision */
  decisionId?: string;

  /** Whether this event was transformed by response safety */
  wasSafetyTransform?: boolean;

  /** Compile-time guarantee: no raw private data */
  rawPrivateDataIncluded: false;

  // ── Safety and Privacy Markers ──
  privacyLevel: 'low' | 'medium' | 'high';
}

// ═══════════════════════════════════════════════════════════════
// Event Bridge Input
// ═══════════════════════════════════════════════════════════════

export interface SocraticLearningEvidenceBridgeInput {
  /** The control decision that generated this event */
  decisionId: string;

  /** Event type */
  eventType: SocraticLearningEvidenceEventType;

  /** Surface */
  surface: SocraticLearningEvidenceSurface;

  /** Safe summary (no raw private data) */
  safeSummary: string;

  /** Evidence strength */
  evidenceStrength: SocraticEvidenceStrength;

  /** Optional hint level */
  hintLevel?: string;

  /** Optional support level */
  supportLevel?: SocraticSupportLevel;

  /** Optional mistake type */
  mistakeType?: string;

  /** Whether this event came from a safety transform */
  wasSafetyTransform?: boolean;

  /** Safe context identifiers (never raw student IDs) */
  learnerIdHash?: string;
  subjectId?: string;
  skillId?: string;
  topicId?: string;
  sessionId?: string;
  schoolId?: string;
}

// ═══════════════════════════════════════════════════════════════
// Event Bridge Output
// ═══════════════════════════════════════════════════════════════

export interface SocraticLearningEvidenceBridgeOutput {
  event: SocraticLearningEvidenceEvent | null;
  written: boolean;
  warnings: string[];
  rawPrivateDataIncluded: false;
}

// ═══════════════════════════════════════════════════════════════
// Surface-specific event adapter interface
// ═══════════════════════════════════════════════════════════════

export interface SurfaceEventAdapter {
  /** The surface this adapter handles */
  surface: SocraticLearningEvidenceSurface;

  /** Map surface-specific event data to a canonical evidence event */
  adaptToCanonical(input: SocraticLearningEvidenceBridgeInput): SocraticLearningEvidenceEvent | null;

  /** Store a canonical evidence event (if surface-specific storage is needed) */
  storeCanonicalEvent?(event: SocraticLearningEvidenceEvent): Promise<boolean>;
}

// ═══════════════════════════════════════════════════════════════
// Helper: generate a safe evidence strength from hint level
// ═══════════════════════════════════════════════════════════════

export function evidenceStrengthFromHintLevel(hintLevel: string): SocraticEvidenceStrength {
  const level = parseInt(hintLevel, 10);
  if (isNaN(level) || level <= 0) return 'none';
  if (level >= 7) return 'weak';
  if (level >= 4) return 'weak';
  return 'none';
}

/**
 * Compute a safe privacy level for an evidence event.
 */
export function computeEvidencePrivacyLevel(
  eventType: SocraticLearningEvidenceEventType,
  surface: SocraticLearningEvidenceSurface,
): 'low' | 'medium' | 'high' {
  if (eventType === 'safeguarding_safe_response') return 'high';
  if (eventType === 'integrity_redirect') return 'medium';
  if (eventType === 'mistake_signal_observed') return 'medium';
  if (surface === 'practice') return 'medium';
  return 'low';
}
