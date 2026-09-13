// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intent Evidence Service v1
// Extracts structured evidence from the learner's message and
// available tutor context without making final routing decisions.
// Evidence feeds the Intent Resolver — it is NOT the final decision.
// ─────────────────────────────────────────────────────────────

import type {
  TutorIntentEvidence,
  IntentEvidenceSource,
  ResolveTutorIntentRequest,
} from './intentResolverContracts';

function generateId(): string {
  return `evd_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export interface IntentEvidenceInput {
  request: ResolveTutorIntentRequest;
  tutorContext?: {
    session?: { activeSubject?: string | null; activeTopic?: string | null; activeSkillIds?: string[] };
    learnerProfile?: {
      strengths?: any[];
      weaknesses?: any[];
      recentMistakes?: any[];
      misconceptionSignals?: any[];
      masterySignals?: any[];
    };
    artifactContext?: { status?: string; activeArtifactIds?: string[] };
    sourceTrust?: { status?: string; allowedSourceIds?: string[] };
    videoContext?: { status?: string; activeVideoId?: string | null };
    tutorState?: { activeSubject?: string | null; activeTopic?: string | null; activeArtifactIds?: string[]; activeSkillIds?: string[] };
  } | null;
  practiceMasteryContext?: {
    status?: string;
    masterySignals?: any[];
    misconceptionSignals?: any[];
    reviewDueSignals?: any[];
    nextPracticeRecommendations?: any[];
  } | null;
  safetyFlags?: {
    promptInjectionDetected?: boolean;
    promptInjectionScore?: number;
  } | null;
}

// ── IntentEvidenceService ──

export class IntentEvidenceService {
  /**
   * Build structured evidence from the message and all available context.
   * Each evidence item has a source, signal, summary, and confidence.
   * Evidence is NOT the final routing decision.
   */
  buildIntentEvidence(input: IntentEvidenceInput): TutorIntentEvidence[] {
    const evidence: TutorIntentEvidence[] = [];
    const message = String(input.request.message || '').trim();

    // ── 1. Message evidence ──
    if (message) {
      evidence.push({
        evidenceId: generateId(),
        source: 'message',
        signal: 'raw_message_text',
        summary: message.slice(0, 200),
        confidence: 0.9,
      });

      // Message length signal
      if (message.length < 20) {
        evidence.push({
          evidenceId: generateId(),
          source: 'message',
          signal: 'short_message',
          summary: 'Learner sent a short message — likely incomplete or vague.',
          confidence: 0.6,
        });
      } else if (message.length > 200) {
        evidence.push({
          evidenceId: generateId(),
          source: 'message',
          signal: 'long_message',
          summary: 'Learner sent a detailed message with substantial context.',
          confidence: 0.5,
        });
      }
    }

    // ── 2. Tutor State / Session evidence ──
    if (input.tutorContext?.session) {
      const session = input.tutorContext.session;
      if (session.activeSubject) {
        evidence.push({
          evidenceId: generateId(),
          source: 'tutor_context',
          signal: 'active_subject',
          summary: `Active subject: ${session.activeSubject}`,
          confidence: 0.8,
        });
      }
      if (session.activeTopic) {
        evidence.push({
          evidenceId: generateId(),
          source: 'tutor_context',
          signal: 'active_topic',
          summary: `Active topic: ${session.activeTopic}`,
          confidence: 0.8,
        });
      }
      if (session.activeSkillIds && session.activeSkillIds.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'tutor_context',
          signal: 'active_skills',
          summary: `${session.activeSkillIds.length} active skill(s) in session.`,
          confidence: 0.7,
        });
      }
    }

    if (input.tutorContext?.tutorState) {
      const ts = input.tutorContext.tutorState;
      if (ts.activeSubject) {
        evidence.push({
          evidenceId: generateId(),
          source: 'tutor_state',
          signal: 'state_subject',
          summary: `Tutor state subject: ${ts.activeSubject}`,
          confidence: 0.7,
        });
      }
      if (ts.activeArtifactIds && ts.activeArtifactIds.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'tutor_state',
          signal: 'state_artifacts',
          summary: `${ts.activeArtifactIds.length} artifact(s) active in tutor state.`,
          confidence: 0.8,
        });
      }
    }

    // ── 3. Artifact evidence ──
    const activeArtifactIds: string[] =
      (input.request.activeArtifactIds?.length ?? 0) > 0
        ? (input.request.activeArtifactIds ?? [])
        : (input.tutorContext?.artifactContext?.activeArtifactIds ?? []);

    if (activeArtifactIds.length > 0) {
      evidence.push({
        evidenceId: generateId(),
        source: 'artifact_context',
        signal: 'active_artifact_exists',
        summary: `${activeArtifactIds.length} active artifact(s) available.`,
        confidence: 0.85,
      });
    } else {
      evidence.push({
        evidenceId: generateId(),
        source: 'artifact_context',
        signal: 'no_active_artifact',
        summary: 'No active artifact available in session or request.',
        confidence: 0.7,
      });
    }

    if (input.tutorContext?.artifactContext?.status === 'resolved') {
      evidence.push({
        evidenceId: generateId(),
        source: 'artifact_context',
        signal: 'artifact_context_resolved',
        summary: 'Artifact context is resolved with available blocks.',
        confidence: 0.8,
      });
    }

    // ── 4. Learner memory evidence ──
    const lp = input.tutorContext?.learnerProfile;
    if (lp) {
      if (lp.recentMistakes && lp.recentMistakes.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'learner_memory',
          signal: 'recent_mistakes',
          summary: `${lp.recentMistakes.length} recent mistake(s) remembered.`,
          confidence: 0.7,
        });
      }
      if (lp.misconceptionSignals && lp.misconceptionSignals.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'learner_memory',
          signal: 'misconception_signals',
          summary: `${lp.misconceptionSignals.length} misconception signal(s) active.`,
          confidence: 0.7,
        });
      }
      if (lp.strengths && lp.strengths.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'learner_memory',
          signal: 'strengths',
          summary: `${lp.strengths.length} strength signal(s) active.`,
          confidence: 0.6,
        });
      }
      if (lp.weaknesses && lp.weaknesses.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'learner_memory',
          signal: 'weaknesses',
          summary: `${lp.weaknesses.length} weakness signal(s) active.`,
          confidence: 0.6,
        });
      }
    }

    // ── 5. Practice/Mastery evidence ──
    const pm = input.practiceMasteryContext;
    if (pm) {
      if (pm.status === 'resolved' || pm.status === 'partial') {
        evidence.push({
          evidenceId: generateId(),
          source: 'practice_mastery',
          signal: 'practice_mastery_available',
          summary: `Practice/mastery context: ${pm.status}`,
          confidence: 0.8,
        });
      }
      if (pm.masterySignals && pm.masterySignals.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'practice_mastery',
          signal: 'mastery_signals',
          summary: `${pm.masterySignals.length} mastery signal(s) available.`,
          confidence: 0.7,
        });
      }
      if (pm.nextPracticeRecommendations && pm.nextPracticeRecommendations.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'practice_mastery',
          signal: 'next_practice_recommendations',
          summary: `${pm.nextPracticeRecommendations.length} next-practice recommendation(s) available.`,
          confidence: 0.75,
        });
      }
      if (pm.reviewDueSignals && pm.reviewDueSignals.length > 0) {
        evidence.push({
          evidenceId: generateId(),
          source: 'practice_mastery',
          signal: 'review_due',
          summary: `${pm.reviewDueSignals.length} review(s) due.`,
          confidence: 0.7,
        });
      }
    }

    // ── 6. Source trust evidence ──
    const sourceCandidateIds = input.request.sourceCandidateIds || [];
    const allowedSourceIds = input.tutorContext?.sourceTrust?.allowedSourceIds || [];

    if (sourceCandidateIds.length > 0) {
      evidence.push({
        evidenceId: generateId(),
        source: 'source_trust',
        signal: 'source_candidates_provided',
        summary: `${sourceCandidateIds.length} source candidate(s) provided in request.`,
        confidence: 0.8,
      });
    } else if (allowedSourceIds.length > 0) {
      evidence.push({
        evidenceId: generateId(),
        source: 'source_trust',
        signal: 'verified_sources_exist',
        summary: `${allowedSourceIds.length} verified source(s) available in context.`,
        confidence: 0.7,
      });
    } else {
      evidence.push({
        evidenceId: generateId(),
        source: 'source_trust',
        signal: 'no_sources_available',
        summary: 'No source candidates or verified sources available.',
        confidence: 0.6,
      });
    }

    // ── 7. Video evidence ──
    const activeVideoId = input.request.activeVideoId || input.tutorContext?.videoContext?.activeVideoId;
    if (activeVideoId) {
      evidence.push({
        evidenceId: generateId(),
        source: 'video_context',
        signal: 'active_video',
        summary: `Active video: ${activeVideoId}`,
        confidence: 0.8,
      });
    }

    // ── 8. Learner answer evidence ──
    if (input.request.learnerAnswerSummary) {
      evidence.push({
        evidenceId: generateId(),
        source: 'message',
        signal: 'learner_answer_provided',
        summary: 'Learner provided an answer summary for checking.',
        confidence: 0.85,
      });
    } else {
      evidence.push({
        evidenceId: generateId(),
        source: 'message',
        signal: 'no_learner_answer',
        summary: 'No learner answer provided for checking.',
        confidence: 0.5,
      });
    }

    // ── 9. Safety evidence ──
    if (input.safetyFlags?.promptInjectionDetected) {
      evidence.push({
        evidenceId: generateId(),
        source: 'safety_policy',
        signal: 'prompt_injection_detected',
        summary: `Prompt injection suspected (score: ${input.safetyFlags.promptInjectionScore?.toFixed(2) || '?'}).`,
        confidence: clampScore(input.safetyFlags.promptInjectionScore || 0.8),
      });
    }

    return evidence;
  }
}

// Singleton
export const intentEvidenceService = new IntentEvidenceService();
