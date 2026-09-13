// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization Signal Resolver v1
// Reads all available learner evidence from TutorTurnContext,
// DedicatedTutorState, and related services. Converts into
// bounded PersonalizationSignal objects for the packet.
// Never fabricates data. Never creates fake strengths.
// ─────────────────────────────────────────────────────────────

import type {
  PersonalizationPacket,
  PersonalizationSignal,
  PersonalizationDomain,
  PersonalizationDecision,
  PersonalizationSignalStatus,
} from './personalizationContracts';

import {
  ALL_PERSONALIZATION_DOMAINS,
  MAX_PERSONALIZATION_SIGNAL_EVIDENCE,
  MAX_PERSONALIZATION_SIGNAL_SUMMARY_CHARS,
  MAX_PERSONALIZATION_EVIDENCE_CHARS,
  MAX_SAFE_PROMPT_SUMMARY_CHARS,
  MAX_PERSONALIZATION_DECISIONS,
} from './personalizationContracts';

import type { TutorTurnContext, ContextSignal } from './tutorStateContracts';
import type { DedicatedTutorState, TutorNextAction } from './tutorStateEndpointContracts';

// ── Helpers ──

let signalCounter = 0;
function generateSignalId(): string {
  signalCounter += 1;
  return `persig_${Date.now()}_${signalCounter}`;
}

function generatePacketId(): string {
  return `perpack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function boundSummary(text: string | null | undefined, max: number): string {
  if (!text) return '';
  return String(text).replace(/\s+/g, ' ').trim().slice(0, max);
}

function createSignal(
  domain: PersonalizationDomain,
  status: PersonalizationSignalStatus,
  title: string,
  summary: string,
  evidence: string[],
  skillIds: string[],
  topic?: string | null,
  confidence?: number | null,
  warnings?: string[],
): PersonalizationSignal {
  return {
    signalId: generateSignalId(),
    domain,
    status,
    useLevel: status === 'available' ? 'context_only' : 'none',
    title: title.slice(0, 120),
    summary: boundSummary(summary, MAX_PERSONALIZATION_SIGNAL_SUMMARY_CHARS),
    evidence: evidence.slice(0, MAX_PERSONALIZATION_SIGNAL_EVIDENCE).map(
      (e) => boundSummary(e, MAX_PERSONALIZATION_EVIDENCE_CHARS),
    ),
    skillIds: (skillIds || []).slice(0, 20),
    topic: topic || null,
    confidence: confidence ?? null,
    updatedAt: new Date().toISOString(),
    warnings: (warnings || []).slice(0, 5),
  };
}

function createMissingSignal(domain: PersonalizationDomain): PersonalizationSignal {
  return createSignal(domain, 'missing', `${domain} not available`, '', [], []);
}

function extractSignals(
  arr: ContextSignal[] | undefined,
  domain: PersonalizationDomain,
  maxItems: number,
): PersonalizationSignal[] {
  if (!arr || arr.length === 0) return [createMissingSignal(domain)];
  return arr.slice(0, maxItems).map((s) =>
    createSignal(
      domain,
      'available',
      s.label || domain,
      s.summary || '',
      [],
      [],
      undefined,
      s.confidence,
    ),
  );
}

// ── Resolver ──

export class PersonalizationSignalResolver {
  /**
   * Resolve a complete PersonalizationPacket from available sources.
   * Never fabricates — missing domains are marked honestly.
   */
  resolvePacket(input: {
    turnContext: TutorTurnContext | null;
    dedicatedState: DedicatedTutorState | null;
    learnerMemorySignals?: { strengths: ContextSignal[]; weaknesses: ContextSignal[]; recentMistakes: ContextSignal[] };
    masterySignals?: { masterySignals: ContextSignal[]; misconceptionSignals: ContextSignal[] };
    recentActivity?: string[];
  }): PersonalizationPacket {
    const { turnContext, dedicatedState, learnerMemorySignals, masterySignals, recentActivity } = input;

    const tc = turnContext;
    const ds = dedicatedState;

    // ── Resolve each domain ──

    // Learner Memory
    const learnerMemory: PersonalizationSignal[] = [];
    if (tc?.learnerProfile?.strengths?.length) {
      learnerMemory.push(...extractSignals(tc.learnerProfile.strengths, 'learner_memory', 5).map(
        (s) => ({ ...s, useLevel: 'prompt_used' as const }),
      ));
    }
    if (tc?.learnerProfile?.weaknesses?.length) {
      learnerMemory.push(...extractSignals(tc.learnerProfile.weaknesses, 'learner_memory', 5).map(
        (s) => ({ ...s, useLevel: 'prompt_used' as const }),
      ));
    }
    if (learnerMemory.length === 0) {
      if (learnerMemorySignals?.strengths?.length || learnerMemorySignals?.weaknesses?.length) {
        if (learnerMemorySignals.strengths?.length) {
          learnerMemory.push(...extractSignals(learnerMemorySignals.strengths, 'learner_memory', 3)
            .map((s) => ({ ...s, useLevel: 'context_only' as const })));
        }
        if (learnerMemorySignals.weaknesses?.length) {
          learnerMemory.push(...extractSignals(learnerMemorySignals.weaknesses, 'learner_memory', 3)
            .map((s) => ({ ...s, useLevel: 'context_only' as const })));
        }
      }
    }
    if (learnerMemory.length === 0) {
      learnerMemory.push(createMissingSignal('learner_memory'));
    }

    // Mastery
    let mastery: PersonalizationSignal[] = [];
    if (tc?.learnerProfile?.masterySignals?.length) {
      mastery = extractSignals(tc.learnerProfile.masterySignals, 'mastery', 8)
        .map((s) => ({ ...s, useLevel: 'prompt_used' as const }));
    } else if (masterySignals?.masterySignals?.length) {
      mastery = extractSignals(masterySignals.masterySignals, 'mastery', 5)
        .map((s) => ({ ...s, useLevel: 'context_only' as const }));
    }
    if (mastery.length === 0) {
      mastery.push(createMissingSignal('mastery'));
    }

    // Misconceptions
    let misconceptions: PersonalizationSignal[] = [];
    if (tc?.learnerProfile?.misconceptionSignals?.length) {
      misconceptions = extractSignals(tc.learnerProfile.misconceptionSignals, 'misconceptions', 8)
        .map((s) => ({ ...s, useLevel: 'prompt_used' as const }));
    } else if (masterySignals?.misconceptionSignals?.length) {
      misconceptions = extractSignals(masterySignals.misconceptionSignals, 'misconceptions', 5)
        .map((s) => ({ ...s, useLevel: 'context_only' as const }));
    }
    if (misconceptions.length === 0) {
      misconceptions.push(createMissingSignal('misconceptions'));
    }

    // Artifact History
    const artifactHistory: PersonalizationSignal[] = [];
    if (tc?.artifactContext?.summaries?.length) {
      artifactHistory.push(...tc.artifactContext.summaries.slice(0, 5).map((s) =>
        createSignal('artifact_history', 'available', s.label || 'Artifact', s.summary || '', [], []),
      ));
    }
    if (artifactHistory.length === 0 && ds?.artifacts?.activeArtifactIds?.length) {
      artifactHistory.push(
        createSignal('artifact_history', 'available', 'Active artifacts',
          `${ds.artifacts.activeArtifactIds.length} active file(s)`, [], []),
      );
    }
    if (artifactHistory.length === 0) {
      artifactHistory.push(createMissingSignal('artifact_history'));
    }

    // Video History
    const videoHistory: PersonalizationSignal[] = [];
    if (ds?.videos?.activeVideoSession) {
      videoHistory.push(
        createSignal('video_history', 'available', ds.videos.activeVideoSession.title || 'Active video',
          `Status: ${ds.videos.activeVideoSession.status}`, [], []),
      );
    }
    if (videoHistory.length === 0) {
      videoHistory.push(createMissingSignal('video_history'));
    }

    // Artifact Practice
    const artifactPractice: PersonalizationSignal[] = [];
    if (ds?.artifacts?.artifactAwarePractice) {
      const p = ds.artifacts.artifactAwarePractice;
      artifactPractice.push(
        createSignal('artifact_practice', 'available',
          `Artifact practice: ${p.topic || 'active'}`, `(${p.correctCount}/${p.itemCount} correct)`,
          [], [], undefined, undefined,
          p.currentDecision ? [`Decision: ${p.currentDecision}`] : undefined,
        ),
      );
    }
    if (artifactPractice.length === 0) {
      artifactPractice.push(createMissingSignal('artifact_practice'));
    }

    // Video Practice
    const videoPractice: PersonalizationSignal[] = [];
    if (ds?.videos?.videoAwarePractice) {
      const p = ds.videos.videoAwarePractice;
      videoPractice.push(
        createSignal('video_practice', 'available',
          `Video practice: ${p.topic || 'active'}`, `(${p.correctCount}/${p.itemCount} correct)`,
          [], [], undefined, undefined,
          p.currentDecision ? [`Decision: ${p.currentDecision}`] : undefined,
        ),
      );
    }
    if (videoPractice.length === 0) {
      videoPractice.push(createMissingSignal('video_practice'));
    }

    // Recent Activity
    const recentActivitySig: PersonalizationSignal[] = [];
    if (recentActivity?.length) {
      recentActivitySig.push(
        createSignal('recent_activity', 'available', 'Recent activity',
          recentActivity.slice(0, 5).join(', '), [], []),
      );
    }
    if (recentActivitySig.length === 0) {
      recentActivitySig.push(createMissingSignal('recent_activity'));
    }

    // TutorState
    const tutorStateSig: PersonalizationSignal[] = [];
    if (ds) {
      const parts: string[] = [];
      if (ds.currentLearning.topic) parts.push(`Topic: ${ds.currentLearning.topic}`);
      if (ds.currentLearning.subject) parts.push(`Subject: ${ds.currentLearning.subject}`);
      if (ds.currentLearning.learningMode) parts.push(`Mode: ${ds.currentLearning.learningMode}`);
      if (parts.length > 0) {
        tutorStateSig.push(createSignal('tutor_state', 'available', 'Current session', parts.join('. '), [], []));
      }
      if (ds.currentLearning.nextAction) {
        const na = ds.currentLearning.nextAction;
        tutorStateSig.push(createSignal('tutor_state', 'available', 'Next action', na.reason, [], []));
      }
    }
    if (tutorStateSig.length === 0) {
      tutorStateSig.push(createMissingSignal('tutor_state'));
    }

    // Intent
    const intentSig: PersonalizationSignal[] = [];
    if (ds?.intent?.lastIntent) {
      intentSig.push(
        createSignal('intent', 'available', `Intent: ${ds.intent.lastIntent}`,
          `Confidence: ${ds.intent.confidence ?? 'unknown'}`, [], []),
      );
    }
    if (intentSig.length === 0) {
      intentSig.push(createMissingSignal('intent'));
    }

    // Source Trust
    const sourceTrustSig: PersonalizationSignal[] = [];
    if (ds?.sourceTrust?.status) {
      sourceTrustSig.push(
        createSignal('source_trust', 'available', `Source trust: ${ds.sourceTrust.status}`,
          `${ds.sourceTrust.allowedSourceIds.length} allowed sources`, [], []),
      );
    }
    if (sourceTrustSig.length === 0) {
      sourceTrustSig.push(createMissingSignal('source_trust'));
    }

    // Cache Policy
    const cachePolicySig: PersonalizationSignal[] = [];
    if (ds?.cachePolicy) {
      cachePolicySig.push(
        createSignal('cache_policy', 'available', `Cache: ${ds.cachePolicy.scope}`,
          ds.cachePolicy.reason, [], []),
      );
    }
    if (cachePolicySig.length === 0) {
      cachePolicySig.push(createMissingSignal('cache_policy'));
    }

    // ── Map from camelCase iteration key to snake_case PersonalizationDomain ──

    const domainMap: Record<string, PersonalizationDomain> = {
      learnerMemory: 'learner_memory',
      mastery: 'mastery',
      misconceptions: 'misconceptions',
      artifactHistory: 'artifact_history',
      videoHistory: 'video_history',
      artifactPractice: 'artifact_practice',
      videoPractice: 'video_practice',
      recentActivity: 'recent_activity',
      tutorState: 'tutor_state',
      intent: 'intent',
      sourceTrust: 'source_trust',
      cachePolicy: 'cache_policy',
    };

    // The domains object must match PersonalizationPacket.domains shape
    const domainsObj: PersonalizationPacket['domains'] = {
      learnerMemory, mastery, misconceptions, artifactHistory, videoHistory,
      artifactPractice, videoPractice, recentActivity: recentActivitySig,
      tutorState: tutorStateSig, intent: intentSig, sourceTrust: sourceTrustSig,
      cachePolicy: cachePolicySig,
    };

    const availableDomains: PersonalizationDomain[] = [];
    const usedDomains: PersonalizationDomain[] = [];
    const missingDomains: PersonalizationDomain[] = [];
    const redactedDomains: PersonalizationDomain[] = [];
    const blockedDomains: PersonalizationDomain[] = [];
    const emptyButExpectedDomains: PersonalizationDomain[] = [];

    for (const [key, signals] of Object.entries(domainsObj)) {
      const domain = domainMap[key] || (key as PersonalizationDomain);
      const hasAvailable = signals.some((s) => s.status === 'available');
      const hasMissing = signals.some((s) => s.status === 'missing');
      const hasEmpty = signals.length === 0;
      const hasPromptUsed = signals.some((s) => s.useLevel === 'prompt_used');

      if (hasAvailable) {
        availableDomains.push(domain);
        if (hasPromptUsed) usedDomains.push(domain);
      }
      if (hasMissing && !hasAvailable) {
        missingDomains.push(domain);
      }
      if (hasEmpty) emptyButExpectedDomains.push(domain);
    }

    // ── Build safe prompt summary ──

    const summaryParts: string[] = [];
    for (const [key, signals] of Object.entries(domainsObj)) {
      const domain = domainMap[key] || (key as PersonalizationDomain);
      const available = signals.filter((s) => s.status === 'available');
      if (available.length > 0) {
        const titles = available.map((s) => s.title).join(', ');
        summaryParts.push(`${domain}: ${titles}`);
      }
    }

    const safePromptSummary = boundSummary(summaryParts.join('\n'), MAX_SAFE_PROMPT_SUMMARY_CHARS);

    // ── Build decisions ──

    const decisions: Array<{ decision: PersonalizationDecision; reason: string; linkedSignalIds: string[] }> = [];

    // Check if reteach needed
    const hasWeakness = learnerMemory.some((s) => s.title.toLowerCase().includes('weakness'));
    const hasMisconception = misconceptions.some((s) => s.status === 'available');

    if (hasMisconception) {
      decisions.push({
        decision: 'use_for_reteach',
        reason: 'Active misconception signals detected',
        linkedSignalIds: misconceptions.filter((s) => s.status === 'available').map((s) => s.signalId),
      });
    }

    if (hasWeakness && !hasMisconception) {
      decisions.push({
        decision: 'use_for_hint',
        reason: 'Known weaknesses detected — provide targeted hints',
        linkedSignalIds: learnerMemory.filter((s) => s.status === 'available').map((s) => s.signalId),
      });
    }

    // Practice decision
    if (artifactPractice.some((s) => s.status === 'available') || videoPractice.some((s) => s.status === 'available')) {
      decisions.push({
        decision: 'use_for_practice_selection',
        reason: 'Active practice session — continue practice',
        linkedSignalIds: [
          ...artifactPractice.filter((s) => s.status === 'available').map((s) => s.signalId),
          ...videoPractice.filter((s) => s.status === 'available').map((s) => s.signalId),
        ],
      });
    }

    // Next action
    if (ds?.currentLearning?.nextAction) {
      const na = ds.currentLearning.nextAction;
      decisions.push({
        decision: mapNextActionToDecision(na),
        reason: na.reason,
        linkedSignalIds: tutorStateSig.filter((s) => s.status === 'available').map((s) => s.signalId),
      });
    }

    // ── Build Packet ──

    const packet: PersonalizationPacket = {
      packetId: generatePacketId(),
      learnerScoped: true,
      sessionScoped: !!ds?.session?.sessionId,
      noCache: true,
      domains: domainsObj,
      decisions: decisions.slice(0, MAX_PERSONALIZATION_DECISIONS),
      safePromptSummary,
      usage: {
        availableDomains,
        usedDomains,
        missingDomains,
        redactedDomains,
        blockedDomains,
        emptyButExpectedDomains,
      },
      safety: {
        rawArtifactTextIncluded: false,
        rawOcrTextIncluded: false,
        rawTranscriptIncluded: false,
        answerKeyIncluded: false,
        hiddenPromptIncluded: false,
        promptInjectionBlocked: true,
        warnings: [],
      },
      createdAt: new Date().toISOString(),
    };

    return packet;
  }
}

function mapNextActionToDecision(
  na: TutorNextAction,
): PersonalizationDecision {
  switch (na.actionType) {
    case 'reteach': return 'use_for_reteach';
    case 'review': return 'use_for_review';
    case 'generate_artifact_practice':
    case 'generate_video_practice': return 'use_for_practice_selection';
    case 'advance': return 'use_for_advancement';
    case 'ask_clarification': return 'use_for_clarification';
    case 'schedule_review': return 'use_for_review';
    default: return 'do_not_use';
  }
}

// ── Singleton ──

export const personalizationSignalResolver = new PersonalizationSignalResolver();
