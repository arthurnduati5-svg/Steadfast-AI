// ─────────────────────────────────────────────────────────────
// Steadfast AI — Socratic Learning Evidence Bridge Service v1
// Maps runtime learning-control outcomes into safe canonical
// evidence events. Bridges surface-specific evidence systems
// into the central evidence event contract.
//
// Never stores raw chat, raw prompts, raw AI responses, or
// raw learner memory.
// ─────────────────────────────────────────────────────────────

import type {
  SocraticLearningControlDecision,
  SocraticLearningEvidenceEventDraft,
  SocraticLearningEvidenceSurface,
  SocraticEvidenceStrength,
  SocraticSupportLevel,
} from './socraticLearningControlContracts';

import type {
  SocraticLearningEvidenceEvent,
  SocraticLearningEvidenceBridgeInput,
  SocraticLearningEvidenceBridgeOutput,
  SurfaceEventAdapter,
} from './socraticLearningEvidenceEventContracts';

import {
  computeEvidencePrivacyLevel,
} from './socraticLearningEvidenceEventContracts';

import { chatPostTurnEventService } from './chatPostTurnEventService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { ChatTurnExecutionContext } from './chatPipelineContracts';

// ═══════════════════════════════════════════════════════════════
// Event ID Generator
// ═══════════════════════════════════════════════════════════════

let _eventCounter = 0;

function generateEventId(): string {
  _eventCounter += 1;
  const timestamp = Date.now().toString(36);
  const counter = _eventCounter.toString(36);
  const random = Math.random().toString(36).slice(2, 8);
  return `evd_${timestamp}_${counter}_${random}`;
}

// ═══════════════════════════════════════════════════════════════
// Evidence Bridge Service
// ═══════════════════════════════════════════════════════════════

export class SocraticLearningEvidenceBridgeService {
  private _adapters: Map<SocraticLearningEvidenceSurface, SurfaceEventAdapter> = new Map();

  /**
   * Register a surface-specific event adapter.
   */
  registerAdapter(adapter: SurfaceEventAdapter): void {
    this._adapters.set(adapter.surface, adapter);
  }

  /**
   * Get a registered surface adapter.
   */
  getAdapter(surface: SocraticLearningEvidenceSurface): SurfaceEventAdapter | undefined {
    return this._adapters.get(surface);
  }

  /**
   * Convert a decision's evidence event draft into a full canonical event.
   */
  draftToEvent(
    decision: SocraticLearningControlDecision,
    bridgeInput?: Partial<SocraticLearningEvidenceBridgeInput>,
  ): SocraticLearningEvidenceEvent {
    const draft = decision.evidenceEventDraft;
    const now = new Date().toISOString();
    const eventId = generateEventId();

    return {
      eventId,
      occurredAt: now,
      eventType: draft?.eventType || 'student_attempt_requested',
      surface: draft?.surface || 'unknown',
      learnerIdHash: bridgeInput?.learnerIdHash,
      schoolId: bridgeInput?.schoolId,
      sessionId: bridgeInput?.sessionId,
      subjectId: bridgeInput?.subjectId,
      skillId: bridgeInput?.skillId,
      topicId: bridgeInput?.topicId,
      safeSummary: draft?.safeSummary || 'Learning control decision produced.',
      evidenceStrength: draft?.evidenceStrength || 'none',
      mistakeType: bridgeInput?.mistakeType,
      hintLevel: draft?.hintLevel,
      supportLevel: draft?.supportLevel,
      decisionId: decision.decisionId,
      wasSafetyTransform: bridgeInput?.wasSafetyTransform || false,
      rawPrivateDataIncluded: false,
      privacyLevel: computeEvidencePrivacyLevel(
        draft?.eventType || 'student_attempt_requested',
        draft?.surface || 'unknown',
      ),
    };
  }

  /**
   * Bridge a decision's evidence event draft into the existing
   * post-turn event system. Returns the bridge output.
   *
   * This is the CANONICAL function for writing safe evidence events
   * from the learning control core.
   */
  async bridgeEvidenceFromDecision(
    identity: ResolvedTutorIdentity,
    decision: SocraticLearningControlDecision,
    bridgeInput?: Partial<SocraticLearningEvidenceBridgeInput>,
  ): Promise<SocraticLearningEvidenceBridgeOutput> {
    const warnings: string[] = [];

    if (!identity?.studentId || !identity?.schoolId) {
      return {
        event: null,
        written: false,
        warnings: ['Identity missing — cannot bridge evidence.'],
        rawPrivateDataIncluded: false,
      };
    }

    // Build canonical event
    const event = this.draftToEvent(decision, bridgeInput);

    // Try to write via post-turn event system
    try {
      // Use the existing post-turn event service for persistence
      const postTurnResult = await chatPostTurnEventService.writeEvidenceEvent({
        identity,
        eventType: event.eventType,
        surface: event.surface,
        safeSummary: event.safeSummary,
        evidenceStrength: event.evidenceStrength,
        hintLevel: event.hintLevel,
        supportLevel: event.supportLevel,
        decisionId: event.decisionId,
        wasSafetyTransform: event.wasSafetyTransform,
        learnerIdHash: event.learnerIdHash,
        subjectId: event.subjectId,
        skillId: event.skillId,
        sessionId: event.sessionId,
      });

      if (postTurnResult.eventWritten) {
        return {
          event,
          written: true,
          warnings,
          rawPrivateDataIncluded: false,
        };
      }

      warnings.push('Post-turn event system did not write the event.');
    } catch (err) {
      warnings.push(`Failed to write evidence event: ${String(err)}`);
    }

    // Try surface-specific adapter
    const adapter = this._adapters.get(event.surface);
    if (adapter?.storeCanonicalEvent) {
      try {
        const stored = await adapter.storeCanonicalEvent(event);
        if (stored) {
          return {
            event,
            written: true,
            warnings,
            rawPrivateDataIncluded: false,
          };
        }
      } catch {
        warnings.push('Surface adapter failed to store event.');
      }
    }

    return {
      event,
      written: false,
      warnings,
      rawPrivateDataIncluded: false,
    };
  }

  /**
   * Bridge multiple evidence event drafts at once (batch).
   */
  async bridgeEvidenceBatch(
    identity: ResolvedTutorIdentity,
    events: Array<{
      decision: SocraticLearningControlDecision;
      bridgeInput?: Partial<SocraticLearningEvidenceBridgeInput>;
    }>,
  ): Promise<SocraticLearningEvidenceBridgeOutput[]> {
    return Promise.all(
      events.map((e) => this.bridgeEvidenceFromDecision(identity, e.decision, e.bridgeInput)),
    );
  }

  /**
   * Create a safe evidence event directly from a bridge input
   * (without requiring a full decision object). Useful for
   * response safety transformations that happen post-generation.
   */
  async bridgeEvidenceDirect(
    identity: ResolvedTutorIdentity,
    input: SocraticLearningEvidenceBridgeInput,
  ): Promise<SocraticLearningEvidenceBridgeOutput> {
    const now = new Date().toISOString();
    const eventId = generateEventId();

    const event: SocraticLearningEvidenceEvent = {
      eventId,
      occurredAt: now,
      eventType: input.eventType,
      surface: input.surface,
      learnerIdHash: input.learnerIdHash,
      schoolId: input.schoolId,
      sessionId: input.sessionId,
      subjectId: input.subjectId,
      skillId: input.skillId,
      topicId: input.topicId,
      safeSummary: input.safeSummary,
      evidenceStrength: input.evidenceStrength,
      mistakeType: input.mistakeType,
      hintLevel: input.hintLevel,
      supportLevel: input.supportLevel,
      decisionId: input.decisionId,
      wasSafetyTransform: input.wasSafetyTransform || false,
      rawPrivateDataIncluded: false,
      privacyLevel: computeEvidencePrivacyLevel(input.eventType, input.surface),
    };

    try {
      const postTurnResult = await chatPostTurnEventService.writeEvidenceEvent({
        identity,
        eventType: event.eventType,
        surface: event.surface,
        safeSummary: event.safeSummary,
        evidenceStrength: event.evidenceStrength,
        hintLevel: event.hintLevel,
        supportLevel: event.supportLevel,
        decisionId: event.decisionId,
        wasSafetyTransform: event.wasSafetyTransform,
        learnerIdHash: event.learnerIdHash,
        subjectId: event.subjectId,
        skillId: event.skillId,
        sessionId: event.sessionId,
      });

      return {
        event,
        written: postTurnResult.eventWritten,
        warnings: postTurnResult.warnings,
        rawPrivateDataIncluded: false,
      };
    } catch (err) {
      return {
        event,
        written: false,
        warnings: [`Failed to bridge evidence event: ${String(err)}`],
        rawPrivateDataIncluded: false,
      };
    }
  }
}

// Singleton
export const socraticLearningEvidenceBridgeService = new SocraticLearningEvidenceBridgeService();
