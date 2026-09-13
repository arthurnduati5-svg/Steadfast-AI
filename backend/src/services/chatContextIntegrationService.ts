// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Context Integration Service v1
// Owns the pre-generation resolution chain for a chat turn.
// Resolves TutorTurnContext and IntentResolution before AI call.
// No AI generation. No prompt string assembly.
// ─────────────────────────────────────────────────────────────

import type { ResolvedTutorIdentity, TutorTurnContext } from './tutorStateContracts';
import type { TutorIntentResolution, ResolveTutorIntentRequest } from './intentResolverContracts';
import type {
  ChatTurnExecutionContext,
  ChatResponseSafetyDecision,
  IntegratedChatRequest,
} from './chatPipelineContracts';
import { resolveTutorContext } from './tutorContextResolver';
import { intentResolverService } from './intentResolverService';
import { cacheScopePolicyService } from './cacheScopePolicyService';
import { kernelSourceTrustService } from './sourceTrustService';
import type { CacheKeyParts } from './cacheScopeContracts';
import type { SourceTrustInput } from './sourceTrustContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function generateExecutionId(): string {
  return `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

const NOOP_SAFETY: ChatResponseSafetyDecision = {
  safeToReturn: true,
  blockedReasons: [],
  fakeSourcesDetected: [],
  unverifiedSources: [],
  promptLeakageDetected: false,
  answerKeyExposureRisk: false,
  warnings: [],
};

export class ChatContextIntegrationService {
  /**
   * Resolve the full chat turn execution context before AI generation.
   * This owns the pre-generation chain:
   *   identity → TutorContext → IntentResolution → cache/source safety
   */
  async resolveChatTurnContext(input: {
    identity: ResolvedTutorIdentity;
    request: IntegratedChatRequest;
  }): Promise<ChatTurnExecutionContext> {
    const executionId = generateExecutionId();
    const warnings: string[] = [];
    const errors: string[] = [];

    // ── 1. Resolve TutorTurnContext ──
    let tutorContext: TutorTurnContext | null = null;
    let tutorContextStatus: 'resolved' | 'partial' | 'no_data_yet' | 'error' = 'no_data_yet';

    try {
      tutorContext = await resolveTutorContext(input.identity, {
        sessionId: input.request.sessionId || undefined,
        message: input.request.message,
        activeSubject: input.request.activeSubject || undefined,
        activeTopic: input.request.activeTopic || undefined,
        activeSkillIds: input.request.activeSkillIds || undefined,
        activeArtifactIds: input.request.activeArtifactIds || undefined,
        activeVideoId: input.request.activeVideoId || null,
      });

      if (tutorContext?.resolverMeta?.errors?.length > 0) {
        errors.push(...tutorContext.resolverMeta.errors);
      }
      if (tutorContext?.resolverMeta?.warnings?.length > 0) {
        warnings.push(...tutorContext.resolverMeta.warnings);
      }

      tutorContextStatus = tutorContext?.resolverMeta?.contextQuality === 'error'
        ? 'error'
        : tutorContext?.resolverMeta?.contextQuality === 'partial'
          ? 'partial'
          : 'resolved';
    } catch (err) {
      tutorContextStatus = 'error';
      errors.push(`TutorContext resolution failed: ${String(err)}`);
      warnings.push('Proceeding with partial context.');
    }

    // ── 2. Resolve IntentResolution ──
    let intentResolution: TutorIntentResolution | null = null;

    if (input.request.message) {
      try {
        // Build practice/mastery context from tutor context if available
        const pmContext = tutorContext?.learnerProfile?.practiceContext
          ? {
              status: tutorContext.learnerProfile.practiceContext.status,
              masterySignals: tutorContext.learnerProfile.masterySignals,
              misconceptionSignals: tutorContext.learnerProfile.misconceptionSignals,
              reviewDueSignals: tutorContext.learnerProfile.practiceContext.reviewDueSignals,
              nextPracticeRecommendations: tutorContext.learnerProfile.practiceContext.nextPracticeRecommendations,
            }
          : null;

        const resolveRequest: ResolveTutorIntentRequest = {
          message: input.request.message,
          sessionId: input.request.sessionId || null,
          activeSubject: input.request.activeSubject || tutorContext?.session?.activeSubject || null,
          activeTopic: input.request.activeTopic || tutorContext?.session?.activeTopic || null,
          activeSkillIds: input.request.activeSkillIds || tutorContext?.session?.activeSkillIds || [],
          activeArtifactIds: input.request.activeArtifactIds || tutorContext?.artifactContext?.activeArtifactIds || [],
          activeVideoId: input.request.activeVideoId || tutorContext?.videoContext?.activeVideoId || null,
          learnerAnswerSummary: input.request.learnerAnswerSummary || null,
          sourceCandidateIds: input.request.sourceCandidateIds || [],
        };

        intentResolution = await intentResolverService.resolveTutorIntent({
          identity: input.identity,
          request: resolveRequest,
          tutorContext: tutorContext ? {
            session: tutorContext.session,
            tutorState: tutorContext.tutorState,
            learnerProfile: tutorContext.learnerProfile,
            artifactContext: tutorContext.artifactContext,
            sourceTrust: tutorContext.sourceTrust,
            videoContext: tutorContext.videoContext,
          } : null,
          practiceMasteryContext: pmContext,
        });

        if (intentResolution.warnings?.length > 0) {
          warnings.push(...intentResolution.warnings);
        }
        if (intentResolution.errors?.length > 0) {
          errors.push(...intentResolution.errors);
        }
      } catch (err) {
        errors.push(`Intent resolution failed: ${String(err)}`);
        warnings.push('Proceeding without intent resolution.');
      }
    }

    // ── 3. Apply CacheScopePolicyService ──
    const cacheKeyParts: CacheKeyParts = {
      schoolId: input.identity.schoolId,
      studentId: input.identity.studentId,
      sessionId: input.request.sessionId || null,
      learningMode: tutorContext?.session?.learningMode || 'learn',
      activeSubject: tutorContext?.session?.activeSubject || null,
      activeTopic: tutorContext?.session?.activeTopic || null,
      primaryLanguage: tutorContext?.session?.primaryLanguage || 'en',
      supportLanguage: tutorContext?.session?.supportLanguage || null,
      artifactIds: tutorContext?.artifactContext?.activeArtifactIds || [],
      artifactFingerprint: null,
      videoId: input.request.activeVideoId || null,
      videoFingerprint: null,
      sourceFingerprint: null,
    };

    const cacheDecision = cacheScopePolicyService.noCacheForTurnContext(cacheKeyParts);
    if (cacheDecision.warnings?.length > 0) {
      warnings.push(...cacheDecision.warnings);
    }

    // ── 4. Prepare sourceTrust context ──
    const sourceTrust = tutorContext?.sourceTrust || null;

    // ── 5. Build execution context ──
    const context: ChatTurnExecutionContext = {
      executionId,
      identity: {
        schoolId: input.identity.schoolId,
        studentId: input.identity.studentId,
        userId: input.identity.userId || null,
        role: input.identity.role || null,
      },
      request: input.request,
      tutorContext,
      intentResolution,
      cachePolicy: {
        cacheAllowed: cacheDecision.cacheAllowed,
        scope: cacheDecision.scope,
        reason: cacheDecision.reason,
      },
      sourceTrust,
      promptPacket: null, // Assembled in next stage
      safety: NOOP_SAFETY,
      warnings,
      errors,
      createdAt: nowISO(),
    };

    return context;
  }
}

export const chatContextIntegrationService = new ChatContextIntegrationService();
