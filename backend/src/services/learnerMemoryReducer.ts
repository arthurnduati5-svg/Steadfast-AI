// ─────────────────────────────────────────────────────────────
// Steadfast AI — Learner Memory Reducer
// Converts learning events into durable memory candidates.
// The reducer does NOT call the AI.
// The reducer does NOT create unsupported guesses.
// Uses structured LearningSignal[] from events.
// ─────────────────────────────────────────────────────────────

import type {
  LearningEvent,
  LearnerMemoryCandidate,
  LearnerMemoryEvidence,
  LearnerMemoryKind,
  LearnerMemoryConfidence,
} from './learnerMemoryContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateEvidenceId(): string {
  return `red_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

// ── Reducer ──

export class LearnerMemoryReducer {
  /**
   * Reduce a learning event into memory candidates.
   * Only generates candidates from explicit event signals.
   * Does not over-infer from low-confidence or single events.
   */
  reduceLearningEventToMemoryCandidates(event: LearningEvent): LearnerMemoryCandidate[] {
    const candidates: LearnerMemoryCandidate[] = [];

    // Process each signal in the event
    for (const signal of event.signals) {
      const candidate = this._signalToCandidate(event, signal);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    // If no explicit signals but the event kind implies certain memory types
    if (event.signals.length === 0) {
      const implicitCandidate = this._eventKindToCandidate(event);
      if (implicitCandidate) {
        candidates.push(implicitCandidate);
      }
    }

    return candidates;
  }

  /**
   * Convert a single learning signal to a memory candidate.
   */
  private _signalToCandidate(
    event: LearningEvent,
    signal: LearningEvent['signals'][0],
  ): LearnerMemoryCandidate | null {
    // Build evidence from the signal
    const evidence: LearnerMemoryEvidence = {
      evidenceId: generateEvidenceId(),
      eventId: event.eventId,
      source: this._mapSourceToMemorySource(event.source),
      summary: signal.evidenceSummary || signal.summary,
      observedAt: event.createdAt,
      subject: signal.subject || event.subject || null,
      topic: signal.topic || event.topic || null,
      skillIds: signal.skillIds.length > 0 ? signal.skillIds : event.skillIds,
      artifactId: signal.artifactId || event.artifactId || null,
      artifactBlockId: signal.artifactBlockId || event.artifactBlockId || null,
      confidence: signal.confidence,
      safeQuote: null, // Not available in signal by default
    };

    // Determine confidence based on signal and event
    const confidence = this._resolveConfidence(signal.kind, signal.confidence, event);

    // Determine tutorUse based on kind
    const tutorUse = this._buildTutorUse(signal.kind, signal.label, signal.summary);

    return {
      kind: signal.kind,
      label: signal.label.slice(0, 160),
      summary: signal.summary.slice(0, 1200),
      tutorUse: tutorUse.slice(0, 800),
      subject: signal.subject || event.subject || null,
      topic: signal.topic || event.topic || null,
      skillIds: signal.skillIds.length > 0 ? signal.skillIds : event.skillIds,
      evidence: [evidence],
      confidence,
      artifactIds: signal.artifactId ? [signal.artifactId] : event.artifactId ? [event.artifactId] : [],
      artifactBlockIds: signal.artifactBlockId ? [signal.artifactBlockId] : event.artifactBlockId ? [event.artifactBlockId] : [],
    };
  }

  /**
   * Generate a memory candidate from event kind when no explicit signals exist.
   */
  private _eventKindToCandidate(event: LearningEvent): LearnerMemoryCandidate | null {
    const kind = this._mapEventKindToMemoryKind(event.kind);
    if (!kind) return null;

    // Don't create weakness/misconception from a single event without signals
    if (kind === 'weakness' || kind === 'misconception') {
      if (event.kind !== 'made_mistake') return null;
      // A single mistake event without signals is too low-confidence for a weakness
      return null;
    }

    // Don't create strength from a single event without signals
    if (kind === 'strength') {
      if (event.kind !== 'corrected_mistake' && event.kind !== 'answered_question') return null;
      return null; // Require explicit signals for strength
    }

    const label = this._buildDefaultLabel(kind, event);
    const summary = this._buildDefaultSummary(kind, event);
    const tutorUse = this._buildDefaultTutorUse(kind, event);

    const evidence: LearnerMemoryEvidence = {
      evidenceId: generateEvidenceId(),
      eventId: event.eventId,
      source: this._mapSourceToMemorySource(event.source),
      summary: event.outcomeSummary || event.kind,
      observedAt: event.createdAt,
      subject: event.subject || null,
      topic: event.topic || null,
      skillIds: event.skillIds,
      artifactId: event.artifactId || null,
      artifactBlockId: event.artifactBlockId || null,
      confidence: 0.3,
      safeQuote: null,
    };

    return {
      kind,
      label,
      summary,
      tutorUse,
      subject: event.subject || null,
      topic: event.topic || null,
      skillIds: event.skillIds,
      evidence: [evidence],
      confidence: 'low',
      artifactIds: event.artifactId ? [event.artifactId] : [],
      artifactBlockIds: event.artifactBlockId ? [event.artifactBlockId] : [],
    };
  }

  /**
   * Map event kind to memory kind.
   */
  private _mapEventKindToMemoryKind(kind: LearningEvent['kind']): LearnerMemoryKind | null {
    switch (kind) {
      case 'made_mistake': return 'recent_mistake';
      case 'corrected_mistake': return 'strength';
      case 'requested_hint': return 'revision_need';
      case 'used_artifact':
      case 'queried_artifact': return 'artifact_usage';
      case 'completed_practice': return 'practice_pattern';
      case 'reviewed_topic': return 'revision_need';
      case 'explained_back': return 'strength';
      case 'answered_question': return 'early_mastery_signal';
      default: return null;
    }
  }

  /**
   * Map event source to memory source.
   */
  private _mapSourceToMemorySource(source: LearningEvent['source']): LearnerMemoryEvidence['source'] {
    switch (source) {
      case 'chat': return 'tutor_turn';
      case 'artifact_query': return 'artifact_query';
      case 'practice': return 'practice_attempt';
      case 'teacher': return 'teacher_note';
      case 'system': return 'system_import';
      case 'revision': return 'revision_session';
      default: return 'tutor_turn';
    }
  }

  /**
   * Resolve confidence level from signal kind, confidence score, and event.
   */
  private _resolveConfidence(
    kind: LearnerMemoryKind,
    signalConfidence: number,
    event: LearningEvent,
  ): LearnerMemoryConfidence {
    // High confidence for explicit signals
    if (signalConfidence >= 0.7) return 'high';
    if (signalConfidence >= 0.4) return 'medium';

    // Context-based adjustments
    if (kind === 'recent_mistake' && event.kind === 'made_mistake') return 'medium';
    if (kind === 'artifact_usage' && (event.kind === 'used_artifact' || event.kind === 'queried_artifact')) return 'medium';

    // Default
    return 'low';
  }

  /**
   * Build a safe tutorUse field for the memory.
   */
  private _buildTutorUse(kind: LearnerMemoryKind, label: string, summary: string): string {
    const base = `${label}: ${summary}`;

    switch (kind) {
      case 'strength':
        return `The student has demonstrated strength in this area. Tutor can build on this confidence and introduce related topics. Evidence: ${base}`;
      case 'weakness':
        return `The student has shown difficulty here. Tutor should proceed carefully, check understanding frequently, and provide scaffolded support. Evidence: ${base}`;
      case 'misconception':
        return `The student may hold a misconception here. Tutor should gently probe understanding, provide clear correction, and verify through practice. Evidence: ${base}`;
      case 'recent_mistake':
        return `The student recently made a mistake here. Tutor should monitor for recurrence and provide targeted correction. Evidence: ${base}`;
      case 'revision_need':
        return `The student may benefit from revision on this topic. Tutor can suggest review and check recall. Evidence: ${base}`;
      case 'practice_pattern':
        return `The student has a practice pattern worth noting. Tutor can adjust pacing and practice load accordingly. Evidence: ${base}`;
      case 'artifact_usage':
        return `The student used a study artifact here. Tutor can reference the artifact in follow-up explanations. Evidence: ${base}`;
      case 'language_support':
        return `The student benefits from additional language support. Tutor should maintain clear, simple language. Evidence: ${base}`;
      case 'metacognitive_support':
        return `The student benefits from metacognitive prompts. Tutor can continue using reflection and self-check strategies. Evidence: ${base}`;
      case 'tutor_preference':
        return `The student prefers a specific tutoring approach. Tutor should respect this preference when appropriate. Evidence: ${base}`;
      case 'early_mastery_signal':
        return `The student shows early understanding. Tutor can proceed but verify through practice. Not a final mastery score. Evidence: ${base}`;
      default:
        return `Tutor note: ${base}`;
    }
  }

  /**
   * Build default label for implicit candidates.
   */
  private _buildDefaultLabel(kind: LearnerMemoryKind, event: LearningEvent): string {
    const topic = event.topic || event.subject || 'general';
    switch (kind) {
      case 'recent_mistake': return `Recent mistake on ${topic}`;
      case 'artifact_usage': return `Used study material on ${topic}`;
      case 'revision_need': return `Revision need on ${topic}`;
      case 'practice_pattern': return `Practice activity on ${topic}`;
      case 'early_mastery_signal': return `Early understanding of ${topic}`;
      default: return `${kind.replace(/_/g, ' ')} on ${topic}`;
    }
  }

  /**
   * Build default summary for implicit candidates.
   */
  private _buildDefaultSummary(kind: LearnerMemoryKind, event: LearningEvent): string {
    const topic = event.topic || event.subject || 'the topic';
    switch (kind) {
      case 'recent_mistake': return `Student made a mistake related to ${topic}. Monitor for recurrence.`;
      case 'artifact_usage': return `Student interacted with a study material on ${topic}.`;
      case 'revision_need': return `Student may need revision on ${topic}.`;
      case 'practice_pattern': return `Student completed practice on ${topic}.`;
      case 'early_mastery_signal': return `Student showed early understanding of ${topic}.`;
      default: return `Event recorded for ${topic}.`;
    }
  }

  /**
   * Build default tutorUse for implicit candidates.
   */
  private _buildDefaultTutorUse(kind: LearnerMemoryKind, event: LearningEvent): string {
    const topic = event.topic || event.subject || 'this topic';
    switch (kind) {
      case 'recent_mistake': return `Student recently made a mistake on ${topic}. Check understanding and provide support.`;
      case 'artifact_usage': return `Student used study material on ${topic}. Reference it in follow-up if helpful.`;
      case 'revision_need': return `Student may benefit from revisiting ${topic}. Suggest a quick review.`;
      case 'practice_pattern': return `Student engaged in practice on ${topic}. Adjust pacing based on performance.`;
      case 'early_mastery_signal': return `Student showed early mastery of ${topic}. Verify through practice.`;
      default: return `Note for tutor on ${topic}.`;
    }
  }
}

// Singleton
export const learnerMemoryReducer = new LearnerMemoryReducer();
