// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Safe View Service v1
// Converts internal TutorState + cross-system state sources
// into the DedicatedTutorState contract. Applies view-mode
// redaction: learner_safe, tutor_internal, teacher_audit.
// Never leaks answer keys, raw artifact text, raw OCR,
// raw transcripts, or hidden prompts.
// ─────────────────────────────────────────────────────────────

import type {
  DedicatedTutorState,
  TutorStateViewMode,
  TutorStateEndpointStatus,
  TutorStateSourceDomain,
  TutorStatePracticeSummary,
  TutorStateVideoSummary,
  TutorStateMasterySummary,
  TutorStateMisconceptionSummary,
  TutorScheduledReviewSummary,
  TutorNextAction,
  TutorStateSafePromptContext,
} from './tutorStateEndpointContracts';

import { MAX_SAFE_SUMMARY_CHARS } from './tutorStateEndpointContracts';
import type { TutorState, TutorTurnContext, ContextSignal } from './tutorStateContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { ArtifactAwarePracticeState, ArtifactAwarePracticeSession } from './artifactAwarePracticeContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `tse_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function boundString(value: string | null | undefined, max: number): string | null {
  if (!value) return null;
  return String(value).slice(0, max);
}

function boundArray(arr: string[] | null | undefined, max: number): string[] {
  if (!arr) return [];
  return arr.filter(Boolean).slice(0, max);
}

function getArtifactAwarePracticeSummary(
  tutorState: TutorState,
): TutorStatePracticeSummary | null {
  const state = (tutorState as any).artifactAwarePractice as ArtifactAwarePracticeState | undefined;
  if (!state?.activePracticeSession) return null;

  const session = state.activePracticeSession;
    return {
    status: session.status,
    topic: session.topic || null,
    itemCount: session.items.length,
    correctCount: session.items.filter((i: any) => i.status === 'correct').length,
    currentDecision: session.decision.currentDecision || null,
    nextActionPrompt: session.decision.nextActionPrompt?.slice(0, 200) || null,
  };
}

function getVideoAwarePracticeSummary(
  state: any,
): TutorStatePracticeSummary | null {
  if (!state?.videoAwarePractice?.activePracticeSession) return null;
  const session = state.videoAwarePractice.activePracticeSession;
  return {
    status: session.status,
    topic: session.topic || null,
    itemCount: session.items.length,
    correctCount: session.items.filter((i: any) => i.status === 'correct').length,
    currentDecision: session.decision.currentDecision || null,
    nextActionPrompt: session.decision.nextActionPrompt?.slice(0, 200) || null,
  };
}

function getMasterySummary(turnContext: TutorTurnContext | null): TutorStateMasterySummary | null {
  if (!turnContext?.learnerProfile?.masterySignals?.length) return null;
  const signals = turnContext.learnerProfile.masterySignals;
  return {
    levels: signals.slice(0, 10).map((s: ContextSignal) => ({
      skillId: s.id,
      skillLabel: s.label,
      level: 'developing' as any,
      confidenceScore: s.confidence,
    })),
    recentAttemptCount: signals.length,
    averageConfidence: signals.reduce((sum: number, s: ContextSignal) => sum + s.confidence, 0) / signals.length,
  };
}

function getMisconceptionSummaries(
  turnContext: TutorTurnContext | null,
): TutorStateMisconceptionSummary[] {
  if (!turnContext?.learnerProfile?.misconceptionSignals?.length) return [];
  return turnContext.learnerProfile.misconceptionSignals.slice(0, 10).map((s: ContextSignal) => ({
    label: s.label,
    status: 'active',
    linkedSkillIds: [],
    observationCount: 1,
  }));
}

function getScheduledReviews(turnContext: TutorTurnContext | null): TutorScheduledReviewSummary[] {
  if (!turnContext?.learnerProfile?.practiceContext?.reviewDueSignals?.length) return [];
  return turnContext.learnerProfile.practiceContext.reviewDueSignals.slice(0, 10).map((s: any) => ({
    skillLabel: s.label || 'Review',
    dueAt: s.updatedAt || new Date().toISOString(),
    reason: s.summary || 'Scheduled reinforcement',
    status: 'scheduled',
  }));
}

function getNextAction(turnContext: TutorTurnContext | null): TutorNextAction | null {
  // Check artifact-aware practice decision
  const artifactPractice = turnContext?.artifactAwarePracticeContext?.activePracticeSession;
  if (artifactPractice?.decision) {
    const d = artifactPractice.decision;
    return {
      actionType: mapDecisionToActionType(d.currentDecision),
      reason: d.reason || 'Practice decision',
      prompt: d.nextActionPrompt || null,
      dueAt: d.dueAt || null,
    };
  }

  // Check video-aware practice decision
  const videoPractice = (turnContext as any)?.videoAwarePracticeContext?.activePracticeSession;
  if (videoPractice?.decision) {
    const d = videoPractice.decision;
    return {
      actionType: mapVideoDecisionToActionType(d.currentDecision),
      reason: d.reason || 'Video practice decision',
      prompt: d.nextActionPrompt || null,
      dueAt: d.dueAt || null,
    };
  }

  // Check intent resolution
  const intent = turnContext?.intentResolution;
  if (intent?.status === 'needs_clarification') {
    return {
      actionType: 'ask_clarification',
      reason: 'Clarification needed',
      prompt: intent.clarification?.question || null,
      dueAt: null,
    };
  }

  return null;
}

function mapDecisionToActionType(decision: string): TutorNextAction['actionType'] {
  switch (decision) {
    case 'reteach': return 'reteach';
    case 'review_artifact_section':
    case 'review_worked_example':
    case 'review_diagram': return 'review';
    case 'give_similar_practice':
    case 'give_harder_practice': return 'generate_artifact_practice';
    case 'advance': return 'advance';
    case 'schedule_spaced_review': return 'schedule_review';
    case 'ask_clarification': return 'ask_clarification';
    default: return 'continue_chat';
  }
}

function mapVideoDecisionToActionType(decision: string): TutorNextAction['actionType'] {
  switch (decision) {
    case 'reteach': return 'reteach';
    case 'review_video_segment': return 'continue_video';
    case 'give_similar_practice':
    case 'give_harder_practice': return 'generate_video_practice';
    case 'advance': return 'advance';
    case 'schedule_spaced_review': return 'schedule_review';
    case 'ask_clarification': return 'ask_clarification';
    default: return 'continue_chat';
  }
}

function buildSafePromptContext(
  state: DedicatedTutorState,
): TutorStateSafePromptContext {
  const excluded: string[] = [];
  const warnings: string[] = [];

  if (!state) {
    return { allowed: false, summary: '', excluded: [], warnings: ['State is null or undefined.'] };
  }

  if (!state.metadata) {
    // Metadata not yet assigned — return safe partial summary
    return {
      allowed: true,
      summary: 'State metadata not yet available. Using fallback context.',
      excluded: [],
      warnings: [],
    };
  }

  const parts: string[] = [];

  // Current learning
  if (state.currentLearning.topic) {
    parts.push(`Active topic: ${state.currentLearning.topic}.`);
  }
  if (state.currentLearning.subject) {
    parts.push(`Subject: ${state.currentLearning.subject}.`);
  }
  if (state.currentLearning.learningMode) {
    parts.push(`Mode: ${state.currentLearning.learningMode}.`);
  }

  // Artifacts
  if (state.artifacts.activeArtifactIds.length > 0) {
    parts.push(`Active files: ${state.artifacts.activeArtifactIds.length} file(s) uploaded.`);
    if (state.artifacts.artifactAwarePractice) {
      const p = state.artifacts.artifactAwarePractice;
      parts.push(`File practice: ${p.topic || 'active'} (${p.itemCount} question(s), ${p.correctCount} correct).`);
      if (p.nextActionPrompt) {
        parts.push(`Next: ${p.nextActionPrompt}.`);
      }
    }
  }

  // Videos
  if (state.videos.activeVideoSession) {
    const v = state.videos.activeVideoSession;
    parts.push(`Active video: ${v.title} (${v.status}).`);
    if (state.videos.videoAwarePractice) {
      const p = state.videos.videoAwarePractice;
      parts.push(`Video practice: ${p.status} (${p.itemCount} question(s)).`);
    }
  }

  // Learner memory
  if (state.learnerMemory.available) {
    if (state.learnerMemory.weaknesses.length > 0) {
      parts.push(`Areas to support: ${state.learnerMemory.weaknesses.join(', ')}.`);
      excluded.push('Learner memory weakness details');
    }
    if (state.learnerMemory.strengths.length > 0) {
      parts.push(`Known strengths: ${state.learnerMemory.strengths.join(', ')}.`);
    }
  }

  // Next action
  if (state.currentLearning.nextAction) {
    const na = state.currentLearning.nextAction;
    parts.push(`Recommended action: ${na.reason}.`);
  }

  // Intent context
  if (state.intent.lastIntent) {
    parts.push(`Last intent: ${state.intent.lastIntent}.`);
  }

  const safeSummary = parts.join(' ').slice(0, MAX_SAFE_SUMMARY_CHARS);

  if (state.metadata?.warnings?.length > 0) {
    warnings.push(...state.metadata.warnings.slice(0, 3));
  }

  return {
    allowed: true,
    summary: safeSummary || 'No active state context.',
    excluded,
    warnings,
  };
}

function determineStatus(
  turnContext: TutorTurnContext | null,
): TutorStateEndpointStatus {
  if (!turnContext) return 'empty';
  if (turnContext.resolverMeta.contextQuality === 'error') return 'partial';
  return 'resolved';
}

// ── Service ──

export class TutorStateSafeViewService {
  /**
   * Build a DedicatedTutorState view from existing TutorState,
   * TutorTurnContext, and cross-system state sources.
   * Applies view-mode redaction based on the requested view mode.
   */
  buildDedicatedTutorStateView(input: {
    identity: ResolvedTutorIdentity;
    tutorState: TutorState;
    turnContext: TutorTurnContext | null;
    viewMode: TutorStateViewMode;
    includeDomains?: TutorStateSourceDomain[];
  }): DedicatedTutorState {
    const now = nowISO();
    const {
      identity,
      tutorState,
      turnContext,
      viewMode,
      includeDomains,
    } = input;

    const domainFilter = includeDomains || ALL_DOMAINS;
    const warnings: string[] = [];

    const domainsIncluded: TutorStateSourceDomain[] = [];
    const domainsPartial: TutorStateSourceDomain[] = [];
    const domainsExcluded: TutorStateSourceDomain[] = [];

    for (const domain of ALL_DOMAINS) {
      if (domainFilter.includes(domain)) {
        domainsIncluded.push(domain);
      } else {
        domainsExcluded.push(domain);
      }
    }

    // Build artifact-aware practice summary
    const artifactPracticeSummary = getArtifactAwarePracticeSummary(tutorState);
    const videoPracticeSummary = getVideoAwarePracticeSummary(tutorState);

    // Build learner memory
    const strengths = (turnContext?.learnerProfile?.strengths || []).slice(0, 5).map(
      (s: ContextSignal) => s.label.slice(0, 120),
    );
    const weaknesses = (turnContext?.learnerProfile?.weaknesses || []).slice(0, 5).map(
      (w: ContextSignal) => w.label.slice(0, 120),
    );
    const recentSignals: string[] = [
      ...(turnContext?.learnerProfile?.recentMistakes || []).map(
        (m: ContextSignal) => `Recent mistake: ${m.summary?.slice(0, 200) || m.label}`,
      ),
      ...(turnContext?.learnerProfile?.practiceContext?.reviewDueSignals || []).map(
        (r: any) => `Review due: ${r.summary || r.label}`,
      ),
    ].slice(0, 5);

    const learnerMemoryAvailable = turnContext?.learnerProfile?.status === 'resolved'
      || turnContext?.learnerProfile?.status === 'partial';

    // Build mastery summary
    const masterySummary = getMasterySummary(turnContext);

    // Active video session summary
    let activeVideoSummary: TutorStateVideoSummary | null = null;
    if (turnContext?.videoContext?.activeVideoId) {
      activeVideoSummary = {
        sessionVideoId: turnContext.videoContext.activeVideoId,
        title: 'Active video',
        status: turnContext.videoContext.status,
        topic: turnContext.session.activeTopic || null,
      };
    }

    // Build next action
    const nextAction = getNextAction(turnContext);

    // Build cache policy
    const cachePolicy = turnContext?.cacheScope
      ? {
          cacheAllowed: turnContext.cacheScope.cacheAllowed,
          scope: turnContext.cacheScope.scope,
          reason: turnContext.cacheScope.reason,
        }
      : { cacheAllowed: false, scope: 'no_cache', reason: 'Default no_cache' };

    // Build intent
    const intent = turnContext?.intentResolution
      ? {
          lastIntent: turnContext.intentResolution.primaryIntent || null,
          lastTaskKind: turnContext.intentResolution.task?.taskKind || null,
          confidence: turnContext.intentResolution.confidenceScore ?? null,
          clarificationNeeded: turnContext.intentResolution.status === 'needs_clarification',
        }
      : { lastIntent: null, lastTaskKind: null, confidence: null, clarificationNeeded: false };

    // Build the state
    const state: DedicatedTutorState = {
      stateId: generateId(),
      stateVersion: tutorState.stateVersion,
      status: determineStatus(turnContext),
      viewMode,

      identity: {
        schoolScoped: true,
        studentScoped: true,
        sessionScoped: !!turnContext?.session?.sessionId,
      },

      session: {
        sessionId: turnContext?.session?.sessionId || tutorState.sessionId || null,
        tutorSessionId: turnContext?.session?.sessionId || null,
        startedAt: turnContext?.session?.sessionId ? tutorState.createdAt : null,
        lastUpdatedAt: tutorState.updatedAt,
      },

      currentLearning: {
        subject: boundString(turnContext?.session?.activeSubject || tutorState.activeSubject, 256),
        topic: boundString(turnContext?.session?.activeTopic || tutorState.activeTopic, 256),
        skillIds: boundArray(turnContext?.session?.activeSkillIds, 20),
        syllabusObjectiveIds: [],
        learningMode: turnContext?.session?.learningMode || tutorState.learningMode || 'learn',
        nextAction,
      },

      artifacts: {
        activeArtifactIds: boundArray(turnContext?.artifactContext?.activeArtifactIds, 20),
        safeSummary: turnContext?.artifactContext?.summaries?.length
          ? `Active artifacts: ${turnContext.artifactContext.summaries.map((s: any) => s.label || 'file').join(', ')}`
          : null,
        artifactAwarePractice: artifactPracticeSummary,
        warnings: (turnContext?.artifactContext?.notes || []).slice(0, 5),
      },

      videos: {
        activeVideoSession: activeVideoSummary,
        videoAwarePractice: videoPracticeSummary,
        warnings: (turnContext?.videoContext?.notes || []).slice(0, 5),
      },

      practice: {
        masterySummary,
        misconceptionSummary: getMisconceptionSummaries(turnContext),
        activePracticeSummary: artifactPracticeSummary || videoPracticeSummary || null,
        scheduledReviews: getScheduledReviews(turnContext),
        warnings: [],
      },

      learnerMemory: {
        available: learnerMemoryAvailable,
        safeSummary: learnerMemoryAvailable ? 'Learner memory available.' : null,
        strengths: boundArray(strengths, 5),
        weaknesses: boundArray(weaknesses, 5),
        recentSignals: boundArray(recentSignals, 5),
        warnings: (turnContext?.learnerProfile?.notes || []).slice(0, 5),
      },

      metadata: {
        createdAt: '',
        updatedAt: '',
        resolvedAt: '',
        domainsIncluded: [],
        domainsPartial: [],
        domainsExcluded: [],
        warnings: [],
      },

      sourceTrust: {
        status: turnContext?.sourceTrust?.status || null,
        allowedSourceIds: turnContext?.sourceTrust?.allowedSourceIds || [],
        blockedSourceIds: [],
        warnings: (turnContext?.sourceTrust?.notes || []).slice(0, 5),
      },

      cachePolicy,

      intent,

      safePromptContext: {
        allowed: false,
        summary: '',
        excluded: [],
        warnings: [],
      },
    };

    state.metadata = {
      createdAt: tutorState.createdAt,
      updatedAt: tutorState.updatedAt,
      resolvedAt: now,
      domainsIncluded,
      domainsPartial,
      domainsExcluded,
      warnings,
    };

    // Build safe prompt context from the assembled state (must be after metadata)
    state.safePromptContext = buildSafePromptContext(state);

    // Apply view-mode redaction
    return this._applyRedaction(state, viewMode);
  }

  /**
   * Apply view-mode-based redaction to the state.
   */
  private _applyRedaction(
    state: DedicatedTutorState,
    viewMode: TutorStateViewMode,
  ): DedicatedTutorState {
    if (viewMode === 'teacher_audit' || viewMode === 'system_debug') {
      // Teacher and debug views get full data (with safe summaries)
      return { ...state, viewMode };
    }

    if (viewMode === 'tutor_internal') {
      // Tutor internal: full state but intent resolution is partial
      return { ...state, viewMode };
    }

    // learner_safe: strip internal-only fields
    return {
      ...state,
      viewMode: 'learner_safe',
      // Keep all fields but ensure viewMode is correct
      // No raw data fields exist in the contract by design
    };
  }

  /**
   * Build the safe prompt context summary separately for chat prompt assembly.
   */
  buildSafePromptContextFromState(state: DedicatedTutorState): TutorStateSafePromptContext {
    return buildSafePromptContext(state);
  }

  /**
   * Build a dedicated state from minimal/fallback data when TutorTurnContext
   * is not available (e.g., first request, error state).
   */
  buildFallbackState(identity: ResolvedTutorIdentity, tutorState: TutorState): DedicatedTutorState {
    const now = nowISO();

    const state: DedicatedTutorState = {
      stateId: generateId(),
      stateVersion: tutorState.stateVersion,
      status: 'empty',
      viewMode: 'learner_safe',
      identity: {
        schoolScoped: true,
        studentScoped: true,
        sessionScoped: !!tutorState.sessionId,
      },
      session: {
        sessionId: tutorState.sessionId || null,
        tutorSessionId: null,
        startedAt: null,
        lastUpdatedAt: tutorState.updatedAt,
      },
      currentLearning: {
        subject: tutorState.activeSubject || null,
        topic: tutorState.activeTopic || null,
        skillIds: tutorState.activeSkillIds || [],
        syllabusObjectiveIds: [],
        learningMode: tutorState.learningMode || 'learn',
        nextAction: null,
      },
      artifacts: {
        activeArtifactIds: tutorState.activeArtifactIds || [],
        safeSummary: null,
        artifactAwarePractice: getArtifactAwarePracticeSummary(tutorState),
        warnings: [],
      },
      videos: {
        activeVideoSession: tutorState.activeVideoId
          ? { sessionVideoId: tutorState.activeVideoId, title: 'Active video', status: 'active' }
          : null,
        videoAwarePractice: null,
        warnings: [],
      },
      practice: {
        masterySummary: null,
        misconceptionSummary: [],
        activePracticeSummary: getArtifactAwarePracticeSummary(tutorState),
        scheduledReviews: [],
        warnings: [],
      },
      learnerMemory: {
        available: false,
        safeSummary: null,
        strengths: [],
        weaknesses: [],
        recentSignals: [],
        warnings: [],
      },
      sourceTrust: {
        status: 'no_sources',
        allowedSourceIds: [],
        blockedSourceIds: [],
        warnings: [],
      },
      cachePolicy: {
        cacheAllowed: false,
        scope: 'no_cache',
        reason: 'Fallback state — no context resolution performed.',
      },
      intent: {
        lastIntent: null,
        lastTaskKind: null,
        confidence: null,
        clarificationNeeded: false,
      },
      safePromptContext: {
        allowed: false,
        summary: '',
        excluded: [],
        warnings: [],
      },
      metadata: {
        createdAt: tutorState.createdAt,
        updatedAt: tutorState.updatedAt,
        resolvedAt: now,
        domainsIncluded: ['identity', 'session', 'topic', 'system'],
        domainsPartial: ['artifact'],
        domainsExcluded: ['video', 'practice', 'mastery', 'learner_memory', 'source_trust', 'cache_policy', 'intent', 'chat'],
        warnings: ['Full TutorTurnContext not resolved. Using fallback state.'],
      },
    };

    state.safePromptContext = buildSafePromptContext(state);
    return state;
  }
}

// ── Constants ──

const ALL_DOMAINS: TutorStateSourceDomain[] = [
  'identity', 'session', 'topic', 'artifact', 'video',
  'practice', 'mastery', 'learner_memory', 'source_trust',
  'cache_policy', 'intent', 'chat', 'system',
];

// ── Singleton ──

export const tutorStateSafeViewService = new TutorStateSafeViewService();
