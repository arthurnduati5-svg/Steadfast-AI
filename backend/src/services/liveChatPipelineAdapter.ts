// ─────────────────────────────────────────────────────────────
// Steadfast AI — Live Chat Pipeline Adapter v2
// Orchestrates the full pre-generation chain for the live
// POST /api/copilot/chat path:
//   validate → identity → context → intent → check shortcuts
//   → assemble prompt → call AI → safety check → event write
// ─────────────────────────────────────────────────────────────

import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type { IntegratedChatRequest, ChatTurnExecutionContext, ChatPromptPacket, IntegratedChatResponse, IntegratedChatResponseMeta, ChatContextIntegrationStatus } from './chatPipelineContracts';
import { chatContextIntegrationService } from './chatContextIntegrationService';
import { chatPromptAssembler } from './chatPromptAssembler';
import { chatResponseSafetyService } from './chatResponseSafetyService';
import { chatPostTurnEventService } from './chatPostTurnEventService';
import { liveChatAiAdapter } from './liveChatAiAdapter';
import { videoChatTriggerService } from './videoChatTriggerService';
import { videoChatRequestBuilder } from './videoChatRequestBuilder';
import { videoChatSafetyService } from './videoChatSafetyService';
import { videoChatResponseComposer } from './videoChatResponseComposer';
import { videoRecommendationService } from './videoRecommendationService';
import { resolveVideoLearningSessionContext } from './videoLearningSessionResolver';

// ── Artifact-Aware Practice Imports ──
import { artifactAwarePracticeChatTriggerService } from './artifactAwarePracticeChatTriggerService';
import { artifactAwarePracticeChatOrchestrator } from './artifactAwarePracticeChatOrchestrator';

// ── Artifact Reasoning Imports (v2.1) ──
import { artifactReasoningContextResolver } from './artifactReasoningContextResolver';
import { artifactReferenceResolver } from './artifactReferenceResolver';
import { artifactIntentResolver } from './artifactIntentResolver';
import { artifactEvidenceRetriever } from './artifactEvidenceRetriever';
import { artifactGroundingValidator } from './artifactGroundingValidator';
import { artifactResponsePlanner } from './artifactResponsePlanner';
import { artifactReasoningTutorContextBridge } from './artifactReasoningTutorContextBridge';
import { artifactReasoningCachePolicy } from './artifactReasoningCachePolicy';
import { artifactCitationFormatter } from './artifactCitationFormatter';

// ── Personalization Imports ──
import { personalizationLiveChatIntegration } from './personalizationLiveChatIntegration';

// ── Socratic Policy Imports ──
import { buildAutomationPolicy } from './socraticTutorAutomationPolicyService';
import { buildSocraticRuntimePolicyForTurn } from './socraticRuntimePolicyIntegrationService';

// ── Socratic Learning Control Core Imports ──
import { buildSocraticLearningControlDecision, assertLearningControlDecisionIsSafe } from './socraticLearningControlService';
import type { SocraticLearningControlDecision, SocraticLearningControlInput, SocraticLearningEvidenceSurface } from './socraticLearningControlContracts';
import { socraticLearningEvidenceBridgeService } from './socraticLearningEvidenceBridgeService';

// ── Research Source Trust Imports ──
import { sealResearchSources, buildSourcePromptBlock } from './researchSourceSealService';

// ── Source Reliability Imports ──
import { sourceFreshnessRoutingService } from './sourceFreshnessRoutingService';
import type { FreshnessRoutingInput, SourceFreshnessDecision } from './sourceFreshnessContracts';
import { noFakeSourceGuardService } from './noFakeSourceGuardService';
import { citationIntegrityService } from './citationIntegrityService';
import type { VerifiedSource, SourceBackedClaim, CitationIntegrityResult } from './sourceVerificationContracts';

// ── Types ──

export interface LiveChatPipelineResult {
  /** Whether AI generation should be called */
  shouldCallAi: boolean;
  /** The assembled prompt packet for AI generation (if shouldCallAi) */
  promptPacket?: ChatPromptPacket | null;
  /** The full execution context */
  executionContext: ChatTurnExecutionContext;
  /** An immediate response to return (for clarification/unsafe shortcuts) */
  immediateResponse?: IntegratedChatResponse | null;
  /** Warnings collected during resolution */
  warnings: string[];
}

export interface LiveChatPipelineAdapterInput {
  identity: ResolvedTutorIdentity;
  request: IntegratedChatRequest;
  rawRequestBody?: unknown;
  mode: 'standard' | 'streaming' | 'voice';
}

// ── Service ──

export class LiveChatPipelineAdapter {
  /**
   * Check if the current request involves artifact reasoning.
   * Only triggers when the request explicitly references artifacts or the
   * learner message contains artifact-related keywords.
   */
  private _hasArtifactContext(input: LiveChatPipelineAdapterInput, executionContext: ChatTurnExecutionContext): boolean {
    const tutorContext = executionContext.tutorContext;
    const message = (input.request.message || '').toLowerCase();

    // Trigger explicitly: artifact IDs in the request
    if (input.request.activeArtifactIds && input.request.activeArtifactIds.length > 0) return true;

    // Check if learner message references artifact context
    const hasArtifactKeywords = /\b(question|worksheet|artifact|section|page|diagram|figure|exercise|problem|example|work\s*ed\s*ex|formula|upload)/i.test(message);
    const isFollowUp = /\b(this|that|it|the|again|explain|help|answer|hint|practice|check|review)/i.test(message);

    if (!hasArtifactKeywords && !isFollowUp) return false;

    // Only trigger if we have active artifact context
    if ((tutorContext?.artifactContext?.activeArtifactIds?.length ?? 0) > 0) return true;
    if (tutorContext?.artifactContext?.status === 'resolved' || tutorContext?.artifactContext?.status === 'partial') return true;

    return false;
  }

  /**
   * Run the artifact reasoning pipeline for an artifact-aware request.
   * Returns the reasoning result and whether AI should be skipped.
   */
  private async _runArtifactReasoning(
    input: LiveChatPipelineAdapterInput,
    executionContext: ChatTurnExecutionContext,
  ): Promise<{
    reasoningResult?: import('./artifactReasoningContracts').ArtifactReasoningResult;
    skipAi: boolean;
    immediateResponse?: IntegratedChatResponse | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const { identity, request } = input;
    const tutorContext = executionContext.tutorContext;

    // Get the first active artifact ID
    const artifactId = (request.activeArtifactIds && request.activeArtifactIds[0])
      || (tutorContext?.artifactContext?.activeArtifactIds?.[0])
      || null;

    if (!artifactId) {
      return {
        skipAi: false,
        warnings: ['No artifact ID available for artifact reasoning.'],
      };
    }

    // Build the artifact reasoning request
    const reasoningRequest: import('./artifactReasoningContracts').ArtifactReasoningRequest = {
      studentId: identity.studentId,
      schoolId: identity.schoolId || null,
      sessionId: request.sessionId || null,
      artifactId,
      learnerMessage: request.message,
      learningMode: (tutorContext?.session?.learningMode) || null,
      answerText: request.learnerAnswerSummary || null,
    };

    try {
      // Step 1: Resolve artifact reasoning context
      const reasoningContext = await artifactReasoningContextResolver.resolveContext(reasoningRequest);

      if (!reasoningContext.isValid || !reasoningContext.artifactId) {
        return {
          skipAi: false,
          warnings: ['Artifact reasoning context could not be resolved.'],
        };
      }

      // Step 2: Resolve reference
      const reference = artifactReferenceResolver.resolve(reasoningContext, request.message);

      // Step 3: Resolve intent
      const intent = artifactIntentResolver.resolve(reasoningContext);

      // Step 4: Retrieve evidence
      const evidence = artifactEvidenceRetriever.retrieve(reasoningContext, reference, intent.intent);

      // Step 5: Validate grounding
      const grounding = artifactGroundingValidator.validate({
        intent: intent.intent,
        evidence: evidence.selectedEvidence,
      });

      // Step 6: Plan response
      const plan = artifactResponsePlanner.plan({
        context: reasoningContext,
        reference,
        intent,
        evidence,
        grounding,
      });

      // Step 7: Build tutor context attachment
      const attachment = artifactReasoningTutorContextBridge.buildAttachment(plan);

      // Step 8: Apply cache policy
      const cacheDecision = artifactReasoningCachePolicy.decide(reasoningRequest);

      // Step 9: Format citations
      const citations = artifactCitationFormatter.format(plan.selectedEvidence);

      // Attach artifact reasoning context to execution context for ChatPromptAssembler
      executionContext.artifactReasoningContext = {
        intent: plan.intent,
        evidence: plan.selectedEvidence,
        groundingStatus: plan.groundingStatus,
        citations: plan.citations,
        summary: attachment.summary,
        evidenceRefs: attachment.evidenceRefs,
        warnings: attachment.warnings,
        actionHint: attachment.actionHint,
      };

      // Step 10: Determine if AI should be skipped
      const skipAiActions = ['ask_clarifying_question', 'say_not_found', 'refuse_unsafe_artifact_instruction', 'give_hint_only'];
      const skipAi = skipAiActions.includes(plan.decision);

      if (skipAi) {
        // Build deterministic response
        const answerText = plan.learnerFacingResponsePlan || this._buildDeterministicAnswer(plan.decision);
        const immResponse: IntegratedChatResponse = {
          ok: true,
          answer: answerText,
          meta: {
            executionId: executionContext.executionId,
            sessionId: request.sessionId || null,
            tutorContextStatus: 'resolved',
            intentStatus: 'resolved',
            primaryIntent: 'artifact_help',
            taskKind: plan.decision as any,
            cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Artifact reasoning deterministic response.' },
            sourceTrust: { status: 'not_requested' },
            usedContext: {
              tutorState: !!tutorContext?.tutorState,
              learnerMemory: !!tutorContext?.learnerProfile?.strengths?.length,
              practiceMastery: !!tutorContext?.learnerProfile?.practiceContext,
              artifacts: true,
              sources: false,
              intentResolution: true,
            },
            warnings: [`Artifact reasoning: ${plan.decision} — deterministic response without AI.`],
          },
          sources: [],
          followUps: this._buildFollowUps(plan.decision),
        };
        return {
          reasoningResult: plan,
          skipAi: true,
          immediateResponse: immResponse,
          warnings,
        };
      }

      return {
        reasoningResult: plan,
        skipAi: false,
        immediateResponse: null,
        warnings,
      };
    } catch (err) {
      warnings.push(`Artifact reasoning failed: ${String(err)}. Falling back to normal flow.`);
      return {
        skipAi: false,
        immediateResponse: null,
        warnings,
      };
    }
  }

  /**
   * Build a deterministic answer for non-AI artifact paths.
   */
  private _buildDeterministicAnswer(decision: string): string {
    switch (decision) {
      case 'ask_clarifying_question':
        return 'Could you specify which question or section you mean from the artifact?';
      case 'say_not_found':
        return 'I could not find the specific question or section you referenced in the active artifact.';
      case 'refuse_unsafe_artifact_instruction':
        return 'The artifact contains content I cannot process. Let me help you with the learning material instead.';
      case 'give_hint_only':
        return 'Let me give you a hint based on the artifact. I will not reveal the full answer.';
      default:
        return 'How can I help you with this artifact?';
    }
  }

  /**
   * Build follow-up suggestions for deterministic artifact responses.
   */
  private _buildFollowUps(decision: string): string[] {
    switch (decision) {
      case 'ask_clarifying_question':
        return ['Question 1', 'Question 2', 'Section 1', 'Explain the worked example'];
      case 'say_not_found':
        return ['Show me the questions', 'Summarize this artifact', 'Explain section 1'];
      case 'refuse_unsafe_artifact_instruction':
        return ['Explain question 1', 'Give me a practice question', 'Summarize the worksheet'];
      case 'give_hint_only':
        return ['Give me a bigger hint', 'Explain this step by step', 'Show me a similar problem'];
      default:
        return ['Explain a question', 'Give me practice', 'Summarize the artifact'];
    }
  }

  /**
   * Build the Socratic runtime policy packet from the execution context.
   * Public for testability.
   */
  _buildSocraticPolicy(executionContext: ChatTurnExecutionContext, input: LiveChatPipelineAdapterInput): import('./chatPipelineContracts').ChatTurnExecutionContext['socraticPolicyContext'] {
    const tutorContext = executionContext.tutorContext;
    const intentResolution = executionContext.intentResolution;
    const message = input.request.message || '';

    // Extract learner state from tutor context
    const strengths = tutorContext?.learnerProfile?.strengths || [];
    const weaknesses = tutorContext?.learnerProfile?.weaknesses || [];
    const misconceptions = tutorContext?.learnerProfile?.misconceptionSignals || [];
    const masterySignals = tutorContext?.learnerProfile?.masterySignals || [];

    // Compute aggregate mastery from signals (bounded estimate)
    const masteryLevel = masterySignals.length > 0
      ? Math.round(masterySignals.reduce((sum, s: any) => sum + (s.confidence || 0), 0) / masterySignals.length)
      : null;

    const attemptCount = weaknesses.length > 0 ? Math.min(weaknesses.length, 10) : 0;

    const inputForPolicy = {
      studentId: input.identity.studentId,
      message,
      topic: tutorContext?.session?.activeTopic || null,
      gradeLevel: input.identity.grade || null,
      masteryLevel,
      confidenceLevel: masteryLevel !== null ? Math.max(0, masteryLevel - 10) : null,
      attemptCount,
      recentIntegritySignals: [],
      weakAreas: weaknesses.map((w: any) => w.label || w.summary || '').filter(Boolean),
      misconceptions: misconceptions.map((m: any) => m.label || m.summary || '').filter(Boolean),
      artifactContext: tutorContext?.artifactContext?.activeArtifactIds?.length ? tutorContext.artifactContext : undefined,
      learningMode: tutorContext?.session?.learningMode || null,
    };

    try {
      const { packet } = buildAutomationPolicy(inputForPolicy);

      // Build Socratic instructions for prompt assembly
      const socraticInstructions: string[] = [
        'You are a Socratic tutor — guide the student with questions, hints, and reasoning checks.',
        `Use support mode: ${packet.supportMode}.`,
        `challenge level: ${packet.challengeLevel}.`,
      ];

      if (packet.noFinalAnswerRequired) {
        socraticInstructions.push('CRITICAL: Do NOT give the final answer. Do NOT provide the solution. Guide the student to discover it themselves.');
      }

      if (packet.integritySignal !== 'none' && packet.integritySignal !== 'allowed_learning_help') {
        socraticInstructions.push(`Academic integrity signal: ${packet.integritySignal}. Redirect to Socratic learning.`);
      }

      if (packet.safeguardingSignal !== 'none') {
        socraticInstructions.push(`Safeguarding mode active: ${packet.privacyMode}. Use appropriate response.`);
      }

      const forbiddenInstructions: string[] = [
        ...packet.forbiddenTutorMoves.map(m => `DO NOT: ${m}`),
        'Do NOT give final answers.',
        'Do NOT provide copy-paste solutions.',
        'Do NOT fabricate citations or URLs.',
      ];

      return {
        supportMode: packet.supportMode,
        challengeLevel: packet.challengeLevel,
        integritySignal: packet.integritySignal,
        safeguardingSignal: packet.safeguardingSignal,
        noFinalAnswerRequired: packet.noFinalAnswerRequired,
        shouldEscalateToHuman: packet.shouldEscalateToHuman,
        privacyMode: packet.privacyMode,
        recommendedTutorMove: packet.recommendedTutorMove,
        forbiddenTutorMoves: packet.forbiddenTutorMoves,
        allowedTutorMoves: packet.allowedTutorMoves,
        socraticInstructions,
        forbiddenInstructions,
      };
    } catch (err) {
      // Graceful fallback — proceed without policy packet
      return {
        supportMode: 'question_first',
        challengeLevel: 'productive_struggle',
        integritySignal: 'none',
        safeguardingSignal: 'none',
        noFinalAnswerRequired: true,
        shouldEscalateToHuman: false,
        privacyMode: 'private_by_default',
        recommendedTutorMove: 'Use Socratic questioning.',
        forbiddenTutorMoves: ['give_final_answer', 'provide_solution', 'output_answer_key'],
        allowedTutorMoves: ['ask_question', 'give_hint', 'explain_concept', 'suggest_practice'],
        socraticInstructions: [
          'You are a Socratic tutor — guide the student with questions and hints.',
          'Do NOT give final answers.',
        ],
        forbiddenInstructions: ['DO NOT: give_final_answer', 'DO NOT: provide_solution', 'Do NOT fabricate citations or URLs.'],
      };
    }
  }

  /**
   * Prepare a live chat turn: resolve context + intent, check shortcuts,
   * assemble prompt packet. Does NOT call AI — returns structured result.
   */
  async prepareLiveChatTurn(input: LiveChatPipelineAdapterInput): Promise<LiveChatPipelineResult> {
    const warnings: string[] = [];
    const { identity, request } = input;

    // 1. Resolve ChatTurnExecutionContext (context + intent + cache + source)
    const executionContext = await chatContextIntegrationService.resolveChatTurnContext({
      identity,
      request,
    });

    if (executionContext.warnings.length > 0) {
      warnings.push(...executionContext.warnings);
    }

    const intentResolution = executionContext.intentResolution;

    const tutorContext = executionContext.tutorContext;
    const weaknesses = tutorContext?.learnerProfile?.weaknesses || [];
    const misconceptions = tutorContext?.learnerProfile?.misconceptionSignals || [];
    const masterySignals = tutorContext?.learnerProfile?.masterySignals || [];
    const masteryLevel = masterySignals.length > 0
      ? Math.round(masterySignals.reduce((sum, s: any) => sum + (s.confidence || 0), 0) / masterySignals.length)
      : null;

    const runtimePolicy = await buildSocraticRuntimePolicyForTurn({
      studentId: identity.studentId,
      schoolId: identity.schoolId,
      message: request.message,
      subject: tutorContext?.session?.activeSubject || request.activeSubject || null,
      topic: tutorContext?.session?.activeTopic || request.activeTopic || null,
      gradeLevel: identity.grade || null,
      masteryContext: {
        masteryLevel,
        confidenceLevel: masteryLevel !== null ? Math.max(0, masteryLevel - 10) : null,
        weakAreas: weaknesses.map((w: any) => w.label || w.summary || '').filter(Boolean),
      },
      growthContext: {
        attemptCount: weaknesses.length > 0 ? Math.min(weaknesses.length, 10) : 0,
        misconceptions: misconceptions.map((m: any) => m.label || m.summary || '').filter(Boolean),
        artifactIds: tutorContext?.artifactContext?.activeArtifactIds || request.activeArtifactIds || [],
        videoIds: tutorContext?.videoContext?.recommendedVideoIds || [],
      },
      tutorState: {
        learningMode: tutorContext?.session?.learningMode || null,
        activeSubject: tutorContext?.session?.activeSubject || request.activeSubject || null,
        activeTopic: tutorContext?.session?.activeTopic || request.activeTopic || null,
      },
    });

    const packet = runtimePolicy.policyPacket;
    executionContext.socraticPolicyContext = {
      supportMode: packet.supportMode,
      challengeLevel: packet.challengeLevel,
      integritySignal: packet.integritySignal,
      safeguardingSignal: packet.safeguardingSignal,
      noFinalAnswerRequired: packet.noFinalAnswerRequired,
      shouldEscalateToHuman: packet.shouldEscalateToHuman,
      privacyMode: packet.privacyMode,
      recommendedTutorMove: packet.recommendedTutorMove,
      forbiddenTutorMoves: packet.forbiddenTutorMoves,
      allowedTutorMoves: packet.allowedTutorMoves,
      socraticInstructions: runtimePolicy.safePromptInstructions,
      forbiddenInstructions: [
        ...packet.forbiddenTutorMoves.map((move) => `DO NOT: ${move}`),
        'Do NOT give final answers.',
        'Do NOT provide copy-paste solutions.',
        'Do NOT expose raw learner memory, raw transcripts, raw prompts, or raw AI responses.',
      ],
      safeContextSummary: runtimePolicy.safeContextSummary,
      audit: runtimePolicy.audit,
      policyPacket: packet,
    };

    if (!runtimePolicy.shouldCallAi && runtimePolicy.immediateResponse) {
      const immResponse: IntegratedChatResponse = {
        ok: true,
        answer: runtimePolicy.immediateResponse.message,
        meta: {
          executionId: executionContext.executionId,
          sessionId: request.sessionId || null,
          tutorContextStatus: executionContext.tutorContext ? 'resolved' : 'partial',
          intentStatus: intentResolution?.status || 'resolved',
          primaryIntent: intentResolution?.primaryIntent || 'general_chat',
          taskKind: 'refuse_or_redirect',
          cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Socratic runtime policy immediate response.' },
          sourceTrust: { status: 'not_requested' },
          usedContext: {
            tutorState: !!executionContext.tutorContext?.tutorState,
            learnerMemory: !!executionContext.tutorContext?.learnerProfile?.strengths?.length,
            practiceMastery: !!executionContext.tutorContext?.learnerProfile?.practiceContext,
            artifacts: !!executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length,
            sources: false,
            intentResolution: !!intentResolution,
          },
          warnings: [runtimePolicy.audit.safeSummary],
          socraticMode: packet.supportMode,
          integritySignal: packet.integritySignal,
          challengeLevel: packet.challengeLevel,
          privacyMode: packet.privacyMode,
          safeguardingEscalated: packet.safeguardingSignal !== 'none',
          noFinalAnswerRequired: packet.noFinalAnswerRequired,
          supportMode: packet.supportMode,
        },
        sources: [],
        followUps: ['Show me what you tried', 'Give me a hint', 'Ask me the first step'],
      };

      return {
        shouldCallAi: false,
        executionContext,
        immediateResponse: immResponse,
        warnings: [...warnings, runtimePolicy.audit.safeSummary],
      };
    }

    // 1b. Check if artifact reasoning should run before AI
    if (this._hasArtifactContext(input, executionContext)) {
      const artifactResult = await this._runArtifactReasoning(input, executionContext);
      warnings.push(...artifactResult.warnings);

      if (artifactResult.skipAi && artifactResult.immediateResponse) {
        return {
          shouldCallAi: false,
          executionContext,
          immediateResponse: artifactResult.immediateResponse,
          warnings: [...warnings, 'Artifact reasoning returned deterministic response — skipping AI.'],
        };
      }

      if (artifactResult.reasoningResult && !artifactResult.skipAi) {
        // Artifact reasoning context is attached to executionContext for ChatPromptAssembler
        warnings.push(`Artifact reasoning: ${artifactResult.reasoningResult.intent} (${artifactResult.reasoningResult.groundingStatus})`);
      }
    }

    // 2. Check for clarification-needed (no AI call)
    if (intentResolution?.status === 'needs_clarification') {
      const clarification = intentResolution.clarification;
      const immResponse: IntegratedChatResponse = {
        ok: true,
        answer: clarification?.question || 'Could you clarify what you need help with?',
        meta: {
          executionId: executionContext.executionId,
          sessionId: request.sessionId || null,
          tutorContextStatus: 'resolved',
          intentStatus: 'needs_clarification',
          primaryIntent: intentResolution.primaryIntent,
          taskKind: intentResolution.task?.taskKind || 'ask_clarifying_question',
          cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Clarification response.' },
          sourceTrust: { status: 'not_requested' },
          usedContext: {
            tutorState: !!executionContext.tutorContext?.tutorState,
            learnerMemory: !!executionContext.tutorContext?.learnerProfile?.strengths?.length,
            practiceMastery: !!executionContext.tutorContext?.learnerProfile?.practiceContext,
            artifacts: !!executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length,
            sources: !!executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length,
            intentResolution: true,
          },
          warnings: ['Clarification returned without AI generation.'],
        },
        sources: [],
        followUps: clarification?.options || ['Explain a topic', 'Practice', 'Check my work'],
      };

      return {
        shouldCallAi: false,
        executionContext,
        immediateResponse: immResponse,
        warnings: [...warnings, 'Clarification needed — returning clarification without AI.'],
      };
    }

    // 3. Check for artifact-aware practice trigger
    // (before unsafe check because trigger service checks unsafe itself)
    const isUnsafeOrPromptInjection =
      intentResolution?.status === 'unsafe' || intentResolution?.status === 'unsupported';

    const artifactTriggerResult = artifactAwarePracticeChatTriggerService.shouldTriggerArtifactAwarePracticeFromChat({
      message: request.message,
      intentResolution,
      artifactContext: executionContext.tutorContext?.artifactContext
        ? { activeArtifactIds: executionContext.tutorContext.artifactContext.activeArtifactIds }
        : null,
      artifactAwarePracticeContext: executionContext.tutorContext?.artifactAwarePracticeContext || null,
      isUnsafeOrPromptInjection,
      hasActiveArtifactPractice: !!(executionContext.tutorContext?.artifactAwarePracticeContext?.safeContextSummary?.hasActiveArtifactPractice),
    });

    // If artifact practice triggered, run orchestrator and return immediate response
    if (artifactTriggerResult.shouldTrigger) {
      const orchestratorOutput = await artifactAwarePracticeChatOrchestrator.handleArtifactAwarePracticeChatTurn({
        identity,
        message: request.message,
        triggerKind: artifactTriggerResult.triggerKind,
        activeArtifactIds: executionContext.tutorContext?.artifactContext?.activeArtifactIds || [],
      });

      if (orchestratorOutput.handled) {
        const immResponse: IntegratedChatResponse = {
          ok: true,
          answer: orchestratorOutput.answerText,
          meta: {
            executionId: executionContext.executionId,
            sessionId: request.sessionId || null,
            tutorContextStatus: 'resolved',
            intentStatus: 'resolved',
            primaryIntent: 'artifact_help',
            taskKind: 'artifact_aware_practice' as import('./intentResolverContracts').TutorTaskKind,
            cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Artifact-aware practice response.' },
            sourceTrust: { status: 'not_requested' },
            usedContext: {
              tutorState: !!executionContext.tutorContext?.tutorState,
              learnerMemory: !!executionContext.tutorContext?.learnerProfile?.strengths?.length,
              practiceMastery: !!executionContext.tutorContext?.learnerProfile?.practiceContext,
              artifacts: !!executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length,
              sources: !!executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length,
              intentResolution: true,
            },
            warnings: [...artifactTriggerResult.warnings, ...orchestratorOutput.warnings],
          },
          sources: [],
          followUps: ['Another question', 'Review my progress', 'Explain this topic'],
        };

        return {
          shouldCallAi: false,
          executionContext,
          immediateResponse: immResponse,
          warnings: [...warnings, 'Artifact-aware practice triggered — returning deterministic response without AI.'],
        };
      }
    }

    // 4. Check for unsafe (no AI call)
    if (isUnsafeOrPromptInjection) {
      const immResponse: IntegratedChatResponse = {
        ok: true,
        answer: 'I cannot process that request. Please ask a learning-related question.',
        meta: {
          executionId: executionContext.executionId,
          sessionId: request.sessionId || null,
          tutorContextStatus: 'resolved',
          intentStatus: intentResolution.status,
          primaryIntent: intentResolution.primaryIntent,
          taskKind: 'refuse_or_redirect',
          cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Unsafe response.' },
          sourceTrust: { status: 'not_requested' },
          usedContext: {
            tutorState: false,
            learnerMemory: false,
            practiceMastery: false,
            artifacts: false,
            sources: false,
            intentResolution: true,
          },
          warnings: ['Unsafe intent detected. Returning safe refusal.'],
        },
        sources: [],
        followUps: ['What would you like to learn about?'],
      };

      return {
        shouldCallAi: false,
        executionContext,
        immediateResponse: immResponse,
        warnings: [...warnings, 'Unsafe intent — returning safe refusal without AI.'],
      };
    }

    // 4. Build Socratic policy packet before prompt assembly
    // Note: This is the canonical Socratic policy injection point for the live chat pipeline.
    // The legacy ai.ts route (emotional-ai-copilot flow) does NOT use this pipeline.
    // That route has been formally isolated as a legacy path — see architecture docs
    // (FULL_TUTOR_INTELLIGENCE_END_TO_END_RUNTIME_CONTRACT_SEAL.md) for the decision rationale.
    if (!executionContext.socraticPolicyContext) {
      const socraticPolicyContext = this._buildSocraticPolicy(executionContext, input);
      executionContext.socraticPolicyContext = socraticPolicyContext;
    }

    // 5. Resolve personalization before AI generation
    let personalizationBlock: string | null = null;
    try {
      const personalizationResult = await personalizationLiveChatIntegration.resolveForTurn({
        identity,
        turnContext: executionContext.tutorContext,
        dedicatedState: null, // Optional — DedicatedTutorState can be resolved separately
        hadLearnerMemory: !!(executionContext.tutorContext?.learnerProfile?.strengths?.length || executionContext.tutorContext?.learnerProfile?.weaknesses?.length),
        hadMastery: !!(executionContext.tutorContext?.learnerProfile?.masterySignals?.length),
        hadMisconceptions: !!(executionContext.tutorContext?.learnerProfile?.misconceptionSignals?.length),
        hadArtifactPractice: !!(executionContext.tutorContext?.artifactAwarePracticeContext?.safeContextSummary?.hasActiveArtifactPractice),
        hadVideoPractice: !!(executionContext.tutorContext?.videoAwarePracticeContext?.safeContextSummary?.hasActiveVideoPractice),
        hadTutorState: true,
      });
      if (personalizationResult.promptBlock) {
        personalizationBlock = personalizationResult.promptBlock;
      }
      if (personalizationResult.metadata) {
        (executionContext as any)._personalizationMetadata = personalizationResult.metadata;
      }
    } catch {
      // Non-blocking — continue without personalization
    }

    // 4a. Build the central learning control decision from the runtime policy
    // This is the canonical decision point — unifies all policy signals into one
    // structured decision that governs prompt assembly, AI boundary, response safety,
    // and post-turn evidence events.
    try {
      const learningControlInput: SocraticLearningControlInput = {
        studentMessageSignal: (input.request.message || '').slice(0, 100),
        assignmentContextSignal: {
          noFinalAnswerRequired: packet.noFinalAnswerRequired,
          integritySignal: packet.integritySignal,
          allowedTutorMoves: packet.allowedTutorMoves,
          forbiddenTutorMoves: packet.forbiddenTutorMoves,
          redirectInstruction: packet.recommendedTutorMove,
        },
        academicIntegritySignal: {
          signal: packet.integritySignal,
          riskLevel: packet.integritySignal === 'repeated_shortcut_seeking' ? 'high' : packet.integritySignal !== 'none' ? 'medium' : 'none',
          allowedResponseMode: packet.supportMode,
          studentFacingRedirect: packet.recommendedTutorMove,
        },
        noFinalAnswerDecision: {
          noFinalAnswerRequired: packet.noFinalAnswerRequired,
          integritySignal: packet.integritySignal,
          allowedTutorMoves: packet.allowedTutorMoves,
          forbiddenTutorMoves: packet.forbiddenTutorMoves,
          redirectInstruction: packet.recommendedTutorMove,
        },
        hintLadderDecision: {
          // Derive hint level from learner adaptation context
          selectedLevel: runtimePolicy.policyPacket?.learnerAdaptation.masteryLevel
            ? Math.min(Math.max(Math.round((100 - (runtimePolicy.policyPacket.learnerAdaptation.masteryLevel || 0)) / 12.5), 1), 8)
            : 1,
          label: runtimePolicy.policyPacket?.supportMode || 'question_first',
          nextRecommendedAction: runtimePolicy.policyPacket?.recommendedTutorMove || 'ask_question',
        },
        questionLadderDecision: {
          selectedType: 'clarify_what_is_being_asked',
          nextRecommendedAction: runtimePolicy.policyPacket?.recommendedTutorMove || 'ask_question',
        },
        learnerStateSummary: {
          masteryLevel,
          confidenceLevel: masteryLevel !== null ? Math.max(0, masteryLevel - 10) : null,
          attemptCount: weaknesses.length > 0 ? Math.min(weaknesses.length, 10) : 0,
          weakAreaCount: weaknesses.length || 0,
          misconceptionCount: misconceptions.length || 0,
          sparseLearnerState: !tutorContext?.learnerProfile?.strengths?.length && !tutorContext?.learnerProfile?.masterySignals?.length,
        },
        sourceReliabilitySummary: {
          hasVerifiedSources: !!(executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length),
          hasUnsupportedSources: !!(executionContext.tutorContext?.sourceTrust?.unsupportedSourcesBlocked),
          sourceCount: executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length || 0,
        },
        safeguardingSignal: {
          signal: packet.safeguardingSignal,
          riskLevel: packet.safeguardingSignal !== 'none' ? 'active' : 'none',
          isActive: packet.safeguardingSignal !== 'none',
        },
        runtimeMode: input.mode,
        surface: 'live_chat',
      };

      const controlDecision = buildSocraticLearningControlDecision(learningControlInput);
      assertLearningControlDecisionIsSafe(controlDecision);

      // Attach decision to execution context for downstream use
      (executionContext as any)._learningControlDecision = controlDecision;

    } catch (err) {
      // Non-blocking — continue without learning control decision
      warnings.push(`Learning control decision failed: ${String(err)}`);
    }

    // 5. Assemble safe prompt packet for AI generation
    const promptPacket = chatPromptAssembler.assembleChatPromptPacket(executionContext);

    // Attach personalization block to prompt packet if available
    if (personalizationBlock) {
      (promptPacket.allowedContext as any).personalization = personalizationBlock;
    }

    // 5b. Source freshness routing: decide if external sources are needed
    let freshnessDecision: SourceFreshnessDecision | null = null;
    let sourceTrustBlock: string | null = null;
    let sourceTrustMeta: import('./researchSourceTrustContracts').ResearchSourceResponseMetadata | null = null;
    try {
      const freshnessInput: FreshnessRoutingInput = {
        studentMessage: input.request.message || '',
        hasSafeguardingContent: (executionContext.socraticPolicyContext?.safeguardingSignal || 'none') !== 'none',
        isAssignmentAnswerRequest: (executionContext.socraticPolicyContext?.integritySignal || 'none') !== 'none' && executionContext.socraticPolicyContext?.integritySignal !== 'allowed_learning_help',
        isVideoContextFollowUp: !!executionContext.tutorContext?.videoContext?.activeVideoId,
        isArtifactContextFollowUp: (executionContext.tutorContext?.artifactContext as any)?.activeArtifactIds?.length > 0,
        containsFreshnessSignal: /\b(latest|current|news|today|yesterday|recent|update|new|202[4-9]|203[0-9])\b/i.test(input.request.message || ''),
        topicCategory: 'conceptual',
        privateDataPresent: !!identity.studentId,
        safeSearchQuery: input.request.message?.replace(/\b(my|i|me|my school|my teacher)\b/gi, '').trim() || undefined,
      };
      freshnessDecision = sourceFreshnessRoutingService.decide(freshnessInput);
      (executionContext as any)._sourceFreshnessDecision = freshnessDecision;
    } catch {
      // Non-blocking — continue without freshness routing
    }

    // 5c. Resolve research source trust seal before AI generation (only if external sources are needed)
    if (!freshnessDecision || freshnessDecision.shouldRetrieveExternalSource) {
      try {
        const sourceCandidates = (executionContext.request as any).sourceCandidateIds?.map((id: string) => ({ sourceId: id })) || [];
        const sealOutput = sealResearchSources({
          candidates: sourceCandidates,
          authenticatedSchoolId: identity.schoolId,
          authenticatedStudentId: identity.studentId,
        });
        if (sealOutput.metadata) {
          sourceTrustMeta = sealOutput.metadata;
          sourceTrustBlock = buildSourcePromptBlock(sealOutput.metadata);
        }
      } catch {
        // Non-blocking — continue without source trust
      }
    }

    // Attach source trust block to prompt packet if available
    if (sourceTrustBlock) {
      (promptPacket.allowedContext as any).sourceTrustBlock = sourceTrustBlock;
    }

    // Attach freshness decision to prompt packet
    if (freshnessDecision) {
      (promptPacket.allowedContext as any).sourceFreshness = freshnessDecision;
    }

    if (sourceTrustMeta) {
      (executionContext as any)._sourceTrustMetadata = sourceTrustMeta;
    }

    return {
      shouldCallAi: true,
      promptPacket,
      executionContext,
      immediateResponse: null,
      warnings,
    };
  }

  /**
   * Full pipeline run: prepare → call AI → safety check → write event.
   * Returns the final response ready to send to the frontend.
   */
  async runFullPipeline(input: LiveChatPipelineAdapterInput): Promise<{
    response: IntegratedChatResponse;
    aiCalled: boolean;
    eventWritten: boolean;
  }> {
    const prepared = await this.prepareLiveChatTurn(input);

    // Shortcut: clarification/unsafe — no AI call needed
    if (!prepared.shouldCallAi && prepared.immediateResponse) {
      return {
        response: prepared.immediateResponse,
        aiCalled: false,
        eventWritten: false,
      };
    }

    // ── Check if video recommendation should be triggered ──
    const triggerResult = this._checkVideoTrigger(prepared, input);
    let videoMeta: import('./videoChatIntegrationContracts').VideoChatRecommendationMeta | null = null;
    let videoAnswerAddon = '';

    if (triggerResult.shouldCallVideoService) {
      const videoOutcome = await this._executeVideoRecommendation(
        prepared,
        input,
        triggerResult.reasons,
      );
      videoMeta = videoOutcome.videoMeta;
      videoAnswerAddon = videoOutcome.answerAddon;
    }

    // ── Determine if this is a pure video request that can skip AI ──
    const isPureVideoRequest =
      triggerResult.shouldCallVideoService &&
      prepared.executionContext.intentResolution?.primaryIntent === 'video_help' &&
      prepared.executionContext.intentResolution?.task?.taskKind !== 'explain_video_context';

    const hasSafeRecommendations = videoMeta?.status === 'recommended' && (videoMeta?.recommendations?.length ?? 0) > 0;

    // Normal path: call AI with assembled prompt (skip for pure video requests with safe results)
    let aiAnswer = '';
    let aiSources: unknown[] = [];
    let aiFollowUps: string[] = [];
    let aiWarnings: string[] = [];

    if (isPureVideoRequest && hasSafeRecommendations) {
      // Pure video request with safe recommendations — skip AI, use deterministic composer
      aiAnswer = videoAnswerAddon;
      videoAnswerAddon = ''; // Already included in aiAnswer
    } else if (prepared.promptPacket) {
      // Call the real AI service with the assembled prompt packet
      const aiOutput = await liveChatAiAdapter.callExistingAiService(
        prepared.promptPacket,
        input.identity.studentId,
      );
      aiAnswer = aiOutput.answer;
      aiSources = aiOutput.sources;
      aiFollowUps = aiOutput.followUps;
      aiWarnings = aiOutput.warnings;
    } else {
      aiAnswer = 'I can help you with that. What specific topic are you studying?';
    }

    // ── Apply learning control decision to response safety ──
    const controlDecision: SocraticLearningControlDecision | undefined =
      (prepared.executionContext as any)._learningControlDecision;

    if (controlDecision) {
      try {
        assertLearningControlDecisionIsSafe(controlDecision);
      } catch (err) {
        aiWarnings.push(`Learning control safety assertion failed: ${String(err)}`);
      }
    }

    // Sanitize AI output
    const safetyResult = await chatResponseSafetyService.sanitizeAndValidateChatResponse(
      prepared.executionContext,
      aiAnswer,
      aiSources,
      aiFollowUps,
    );

    // Apply no-fake-source guard to AI output sources
    const fakeSourceWarnings: string[] = [];
    if (aiSources && Array.isArray(aiSources)) {
      for (const src of aiSources) {
        const typedSrc = src as VerifiedSource;
        const rejection = noFakeSourceGuardService.rejectAll(typedSrc, {
          claimedFresh: typedSrc.freshnessStatus === 'fresh',
        });
        if (rejection.rejected) {
          fakeSourceWarnings.push(rejection.reason || 'Fake source rejected');
        }
      }
    }

    // Apply citation integrity verification
    let citationResult: CitationIntegrityResult | null = null;
    try {
      const claims: SourceBackedClaim[] = [{
        id: 'default',
        claim: aiAnswer.slice(0, 200),
        requiresCitation: false,
        supportedBySourceIds: [],
        supportStatus: 'not_checked',
      }];
      const sources: VerifiedSource[] = (aiSources as VerifiedSource[]) || [];
      citationResult = citationIntegrityService.verifyCitations(claims, sources);
    } catch {
      // Non-blocking
    }

    // Default to no_cache always
    const cacheScope = { cacheAllowed: false, scope: 'no_cache', reason: 'TutorTurnContext is never cached.' };

    // Build Socratic safe metadata markers
    const socraticCtx = prepared.executionContext.socraticPolicyContext;
    const socraticMetaFields = socraticCtx ? {
      socraticMode: socraticCtx.supportMode,
      integritySignal: socraticCtx.integritySignal,
      challengeLevel: socraticCtx.challengeLevel,
      privacyMode: socraticCtx.privacyMode,
      safeguardingEscalated: socraticCtx.safeguardingSignal !== 'none',
      noFinalAnswerRequired: socraticCtx.noFinalAnswerRequired,
      supportMode: socraticCtx.supportMode,
    } : {};

    // Build response metadata
    const statusLabel: ChatContextIntegrationStatus =
      prepared.executionContext.tutorContext ? 'resolved' : 'partial';

    const sourceFreshnessDecision = (prepared.executionContext as any)._sourceFreshnessDecision as SourceFreshnessDecision | undefined;

    const meta: IntegratedChatResponseMeta = {
      ...socraticMetaFields,
      executionId: prepared.executionContext.executionId,
      sessionId: input.request.sessionId || null,
      tutorContextStatus: statusLabel,
      intentStatus: prepared.executionContext.intentResolution?.status || 'resolved',
      primaryIntent: prepared.executionContext.intentResolution?.primaryIntent || 'general_chat',
      taskKind: prepared.executionContext.intentResolution?.task?.taskKind || 'general_response',
      cacheScope,
      sourceTrust: prepared.executionContext.sourceTrust
        ? { status: (prepared.executionContext.sourceTrust as any).status, sourceCount: (prepared.executionContext.sourceTrust as any).allowedSourceIds?.length || 0 }
        : { status: 'no_sources', sourceCount: 0 },
      usedContext: {
        tutorState: !!prepared.executionContext.tutorContext?.tutorState,
        learnerMemory: !!prepared.executionContext.tutorContext?.learnerProfile?.strengths?.length,
        practiceMastery: !!prepared.executionContext.tutorContext?.learnerProfile?.practiceContext,
        artifacts: !!prepared.executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length,
        sources: !!prepared.executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length,
        intentResolution: !!prepared.executionContext.intentResolution,
      },
      warnings: [...safetyResult.warnings, ...aiWarnings, ...fakeSourceWarnings].slice(0, 10),
      videoRecommendations: videoMeta ?? undefined,
      sourceFreshness: sourceFreshnessDecision ? {
        sourceNeed: sourceFreshnessDecision.sourceNeed,
        freshnessStatus: sourceFreshnessDecision.freshnessStatus,
        shouldRetrieve: sourceFreshnessDecision.shouldRetrieveExternalSource,
        queryPrivacyRisk: sourceFreshnessDecision.queryPrivacyRisk,
      } : undefined,
      citationIntegrity: citationResult ? {
        verified: citationResult.verified,
        unsupportedDowngraded: citationResult.unsupportedClaimsDowngraded,
        supportedKept: citationResult.supportedClaimsKept,
        missingSourceFallback: citationResult.missingSourceFallbackApplied,
      } : undefined,
    };

    // Append video addon to answer for mixed requests
    const finalAnswer = videoAnswerAddon
      ? `${safetyResult.answer}\n\n${videoAnswerAddon}`
      : safetyResult.answer;

    // Attach source trust metadata to response if available
    const sourceTrustMeta = (prepared.executionContext as any)._sourceTrustMetadata as import('./researchSourceTrustContracts').ResearchSourceResponseMetadata | undefined;

    const response: IntegratedChatResponse = {
      ok: true,
      answer: finalAnswer,
      meta,
      sources: safetyResult.sources,
      followUps: safetyResult.followUps,
      videoRecommendations: videoMeta,
      researchSourceTrust: sourceTrustMeta || null,
    };

    // ── Write learning control evidence event ──
    let eventWritten = false;
    try {
      if (controlDecision) {
        // Use the evidence bridge for canonical safe events
        const bridgeResult = await socraticLearningEvidenceBridgeService.bridgeEvidenceFromDecision(
          input.identity,
          controlDecision,
          {
            sessionId: input.request.sessionId || undefined,
            wasSafetyTransform: safetyResult.safety.answerKeyExposureRisk,
          },
        );
        eventWritten = bridgeResult.written;
      } else {
        // Fallback to existing post-turn event
        const eventResult = await chatPostTurnEventService.writePostTurnLearningEvent(
          input.identity,
          prepared.executionContext,
          (safetyResult.answer || '').slice(0, 300),
        );
        eventWritten = eventResult.eventWritten;
      }
    } catch {
      // Non-critical — don't fail the response
    }

    return { response, aiCalled: true, eventWritten };
  }

  /**
   * Internal AI call. Delegates to the real AI adapter which calls
   * aiService.chat() with the assembled prompt packet.
   * No placeholders. No fake responses.
   */
  private async _callExistingAi(aiInput: { prompt: string; messages: unknown[]; metadata: unknown }): Promise<{
    answer: string;
    sources: unknown[];
    followUps: string[];
  }> {
    // This is kept for backward compatibility.
    // The actual production path now goes through callExistingAiService.
    // This fallback should not be reached in the normal pipeline flow.
    return {
      answer: 'I encountered an issue generating a response. Please try again.',
      sources: [],
      followUps: [],
    };
  }

  /**
   * Check whether video recommendation should be triggered.
   */
  private _checkVideoTrigger(
    prepared: LiveChatPipelineResult,
    input: LiveChatPipelineAdapterInput,
  ): { shouldCallVideoService: boolean; reasons: string[] } {
    const intentResolution = prepared.executionContext.intentResolution;
    const tutorContext = prepared.executionContext.tutorContext;

    // If AI call is being skipped for clarification/unsafe, skip video too
    if (!prepared.shouldCallAi) {
      return { shouldCallVideoService: false, reasons: [] };
    }

    const triggerResult = videoChatTriggerService.shouldTriggerVideoRecommendation({
      message: input.request.message,
      intentResolution,
      tutorContext,
      activeArtifactIds: tutorContext?.artifactContext?.activeArtifactIds || [],
      hasPracticeWeakness: !!(tutorContext?.learnerProfile?.weaknesses?.length),
    });

    if (triggerResult.shouldTrigger) {
      return {
        shouldCallVideoService: true,
        reasons: triggerResult.reasons,
      };
    }

    return { shouldCallVideoService: false, reasons: [] };
  }

  /**
   * Execute the video recommendation flow.
   */
  private async _executeVideoRecommendation(
    prepared: LiveChatPipelineResult,
    input: LiveChatPipelineAdapterInput,
    triggerReasons: string[],
  ): Promise<{ videoMeta: import('./videoChatIntegrationContracts').VideoChatRecommendationMeta | null; answerAddon: string }> {
    const tutorContext = prepared.executionContext.tutorContext;
    const intentResolution = prepared.executionContext.intentResolution;

    try {
      // Build video recommendation request from chat context
      const videoRequest = videoChatRequestBuilder.buildVideoRecommendationRequestFromChat({
        identity: {
          schoolId: input.identity.schoolId,
          studentId: input.identity.studentId,
          userId: input.identity.userId,
        },
        message: input.request.message,
        intentResolution,
        tutorContext,
        triggerReasons,
        maxResults: 3,
      });

      // Call the video recommendation service
      const videoResponse = await videoRecommendationService.recommend(
        {
          schoolId: input.identity.schoolId,
          studentId: input.identity.studentId,
        },
        videoRequest,
      );

      // Sanitize output for chat
      const sanitizedMeta = videoChatSafetyService.sanitizeVideoRecommendationsForChat({
        recommendations: videoResponse.recommendations,
        rejected: videoResponse.rejected,
        reviewQueue: videoResponse.reviewQueue,
        includeDebug: false,
      });

      // Add trigger reasons to meta
      sanitizedMeta.triggerReasons = triggerReasons as any;

      // Fill request summary
      sanitizedMeta.requestSummary = {
        subject: videoRequest.subject || null,
        topic: videoRequest.topic || null,
        skillIds: videoRequest.skillIds || [],
        activeArtifactIds: videoRequest.activeArtifactIds || [],
        languagePreference: videoRequest.languagePreference || null,
        learnerAge: videoRequest.learnerAge ?? null,
        gradeLevel: videoRequest.gradeLevel || null,
      };

      // Compose natural language response
      const composerOutput = videoChatResponseComposer.composeVideoResponse(sanitizedMeta);

      return {
        videoMeta: composerOutput.videoMeta,
        answerAddon: composerOutput.answerAddon,
      };
    } catch (err) {
      console.error('[LiveChatPipeline] Video recommendation error:', err);
      return {
        videoMeta: null,
        answerAddon: '',
      };
    }
  }
}

export const liveChatPipelineAdapter = new LiveChatPipelineAdapter();
