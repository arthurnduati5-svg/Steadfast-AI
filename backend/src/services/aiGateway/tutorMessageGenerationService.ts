import type { TutorTurnPolicyInput, TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';
import type { SafeGenerationRequest, SafeGenerationResponse } from './safeGenerationContracts';
import type { PolicyAwarePromptBundle, TutorMessageGenerationExecutionContext } from './promptBoundaryContracts';
import type { ModelRoutingDecision } from './modelRoutingContracts';
import type { ProviderGenerationResult } from './modelProviderContracts';
import type { GenerationOutputValidationResult } from './generationOutputValidationContracts';
import type { GenerationPolicyResult } from './generationPolicyGate';

import { evaluateTutorTurnPolicy } from '../tutorTurnPolicy/tutorTurnPolicyOrchestrator';
import { evaluateGenerationPolicy } from './generationPolicyGate';
import { buildPolicyAwarePrompt } from './policyAwarePromptBuilder';
import { routeModel } from './safeModelRouter';
import { generate as callProvider } from './aiProviderGateway';
import { validateGenerationOutput } from './generationOutputValidationService';
import { assembleSafeResponse } from './tutorSafeResponseAssembler';

import { ProviderHealthService, defaultProviderHealthService } from './providerHealthService';
import { logger } from '../../utils/logger';

export interface TutorMessageGenerationServiceConfig {
  defaultProviderId?: string;
  fallbackProviderIds?: string[];
  useMockProvider?: boolean;
}

// ── R9: bounded generation budget (one turn) ──
const TOTAL_GENERATION_DEADLINE_MS = 10000;
const MAX_PROVIDER_CALLS_PER_TURN = 2;
const MAX_OUTPUT_TOKENS = 640;
const BUDGET_VIOLATION_CODE = 'runtime_budget_exhausted';

interface TurnBudgetState {
  startedAt: number;
  providerCalls: number;
}

function remainingBudgetMs(budget: TurnBudgetState): number {
  return TOTAL_GENERATION_DEADLINE_MS - (Date.now() - budget.startedAt);
}

function budgetExceeded(budget: TurnBudgetState): boolean {
  return budget.providerCalls >= MAX_PROVIDER_CALLS_PER_TURN || remainingBudgetMs(budget) <= 0;
}

function budgetFallback(requestId: string, violationCode: string): SafeGenerationResponse {
  return {
    requestId,
    decision: 'fallback',
    responseText: 'I am not able to generate a response right now. Please try again.',
    validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: [violationCode] },
    policyTags: ['runtime_budget_exhausted'],
    archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
    safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
  };
}

function generateRequestId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateTutorMessage(
  input: TutorTurnPolicyInput,
  healthService: ProviderHealthService = defaultProviderHealthService,
  config: TutorMessageGenerationServiceConfig = {},
  executionContext: TutorMessageGenerationExecutionContext = {},
): Promise<SafeGenerationResponse> {
  const requestId = input.requestId || generateRequestId();

  // R9: bounded orchestration state for this tutor turn.
  const budget: TurnBudgetState = { startedAt: Date.now(), providerCalls: 0 };

  logger.info({ requestId, tutorLearnerId: input.tutorLearnerId }, 'Starting tutor message generation');

  let policyPacket: TutorTurnPolicyPacket;
  try {
    policyPacket = await evaluateTutorTurnPolicy({ ...input, requestId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown policy error';
    logger.error({ requestId, error: errorMessage }, 'Policy evaluation failed');
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to process your request right now. Please try again.',
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['policy_evaluation_failed'] },
      policyTags: ['policy_error'],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: false, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
  }

  const deenCtx = policyPacket.deenPolicyContext;
  const safeContext = {
    curriculumContext: policyPacket.curriculumContext,
    deenPolicyContext: deenCtx,
    // R3-D: prepared packet is an already-backend-authorized generation context.
    preparedPromptPacket: executionContext.preparedPromptPacket,
  };

  const safeGenRequest: SafeGenerationRequest = {
    requestId,
    schoolId: input.schoolId,
    tutorLearnerId: input.tutorLearnerId,
    tutorSessionId: input.tutorSessionId,
    messageText: input.messageText,
    policyPacket,
    safeContext,
    clientContext: input.clientContext,
  };

  const generationPolicy: GenerationPolicyResult = evaluateGenerationPolicy(safeGenRequest);

  if (!generationPolicy.allowedToGenerate) {
    logger.info({
      requestId,
      mode: generationPolicy.generationMode,
      reason: generationPolicy.blockedReason,
    }, 'Generation not allowed by policy - returning safe response without provider call');

    return assembleSafeResponse({
      requestId,
      generationRequest: safeGenRequest,
      generationPolicy,
    });
  }

  let promptBundle: PolicyAwarePromptBundle;
  try {
    promptBundle = buildPolicyAwarePrompt({
      requestId,
      generationMode: generationPolicy.generationMode,
      messageText: input.messageText,
      policyPacket,
      safeContext,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown prompt builder error';
    logger.error({ requestId, error: errorMessage }, 'Prompt building failed');
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now.',
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['prompt_building_failed'] },
      policyTags: ['prompt_error'],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
  }

  let routingDecision: ModelRoutingDecision;
  try {
    routingDecision = await routeModel(
      {
        requestId,
        policyPacket,
        generationMode: generationPolicy.generationMode,
        preferredProviderId: config.defaultProviderId,
      },
      healthService,
      {
        defaultProviderId: config.defaultProviderId,
        fallbackProviderIds: config.fallbackProviderIds,
        // R4: mock may only activate in test mode.
        useMockInTest: config.useMockProvider === true && process.env.NODE_ENV === 'test',
      },
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown router error';
    logger.error({ requestId, error: errorMessage }, 'Model routing failed');
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now. The AI service is unavailable.',
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['routing_failed'] },
      policyTags: ['routing_error'],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
  }

  logger.info({
    requestId,
    allowedToRoute: routingDecision.allowedToRoute,
    providerId: routingDecision.providerId,
    reason: routingDecision.reason,
  }, 'Model routing decision');

  if (!routingDecision.allowedToRoute) {
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now. The AI service is unavailable.',
      provider: routingDecision.providerId ? {
        providerId: routingDecision.providerId,
        modelId: routingDecision.modelId || 'unknown',
        routedBy: 'safeModelRouter',
      } : undefined,
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['routing_blocked'] },
      policyTags: policyPacket.archivePolicyTags || [],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
  }

  // R9: bounded provider call — respects call budget, remaining deadline,
  // and max output tokens. Returns null when the budget forbids the call.
  const callProviderBounded = async (routing: ModelRoutingDecision): Promise<ProviderGenerationResult | null> => {
    if (budgetExceeded(budget)) {
      return null;
    }
    const remainingMs = remainingBudgetMs(budget);
    const timeoutMs = Math.min(7000, remainingMs);
    if (timeoutMs <= 0) {
      return null;
    }
    budget.providerCalls += 1;
    return callProvider(
      {
        generationRequest: safeGenRequest,
        promptBundle,
        routingDecision: routing,
      },
      healthService,
      {
        timeoutMs,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
      },
    );
  };

  let providerResult: ProviderGenerationResult | null = await callProviderBounded(routingDecision);

  if (providerResult === null) {
    logger.warn({ requestId }, 'Generation budget exhausted before first provider call');
    return budgetFallback(requestId, BUDGET_VIOLATION_CODE);
  }

  if (!providerResult.ok || !providerResult.text) {
    if (!routingDecision.fallbackProviderIds || routingDecision.fallbackProviderIds.length === 0) {
      logger.warn({ requestId, providerId: routingDecision.providerId }, 'Provider failed, no fallback available');
      return assembleSafeResponse({
        requestId,
        generationRequest: safeGenRequest,
        generationPolicy,
        providerResult,
      });
    }

    // R9: this fallback attempt is provider call #2 (of max 2).
    if (budgetExceeded(budget)) {
      logger.warn({ requestId }, 'Generation budget exhausted before fallback provider call');
      return budgetFallback(requestId, BUDGET_VIOLATION_CODE);
    }

    logger.info({ requestId, providerId: routingDecision.providerId, fallbacks: routingDecision.fallbackProviderIds }, 'Provider failed, trying fallback');
    const fallbackRouting: ModelRoutingDecision = {
      ...routingDecision,
      providerId: routingDecision.fallbackProviderIds[0],
      modelId: undefined,
      fallbackProviderIds: routingDecision.fallbackProviderIds.slice(1),
      reason: `Fallback from ${routingDecision.providerId} to ${routingDecision.fallbackProviderIds[0]}`,
    };

    try {
      providerResult = await callProviderBounded(fallbackRouting);
    } catch (fallbackError: unknown) {
      const fbMsg = fallbackError instanceof Error ? fallbackError.message : 'Unknown fallback error';
      logger.error({ requestId, error: fbMsg }, 'Fallback provider also failed');
      return assembleSafeResponse({
        requestId,
        generationRequest: safeGenRequest,
        generationPolicy,
        providerResult: {
          requestId,
          providerId: fallbackRouting.providerId || 'unknown',
          modelId: 'unknown',
          ok: false,
          errorCode: 'fallback_failed',
          errorMessage: fbMsg,
        },
      });
    }

    if (providerResult === null) {
      logger.warn({ requestId }, 'Generation budget exhausted after failed primary provider call');
      return budgetFallback(requestId, BUDGET_VIOLATION_CODE);
    }
  }

  let validationResult: GenerationOutputValidationResult;
  try {
    validationResult = await validateGenerationOutput({
      requestId,
      draftOutput: providerResult.text || '',
      generationRequest: safeGenRequest,
      providerResult,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown validation error';
    logger.error({ requestId, error: errorMessage }, 'Output validation failed');
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now.',
      provider: {
        providerId: providerResult.providerId,
        modelId: providerResult.modelId,
        routedBy: 'aiProviderGateway',
      },
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['validation_failed'] },
      policyTags: [],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
  }

  if (validationResult.decision === 'requires_regeneration') {
    // R9: single output-validation regeneration is allowed ONLY if both the
    // provider-call budget (max 2 total) and the deadline still have room.
    // Never primary + fallback + regeneration.
    if (budgetExceeded(budget)) {
      logger.warn({ requestId, providerCalls: budget.providerCalls }, 'Regeneration skipped: generation budget exhausted');
      return assembleSafeResponse({
        requestId,
        generationRequest: safeGenRequest,
        generationPolicy,
        providerResult,
        validationResult,
      });
    }

    logger.info({ requestId }, 'Output invalid, attempting single regeneration within budget');

    const retryRouting: ModelRoutingDecision = {
      ...routingDecision,
      reason: `Regeneration attempt after invalid output. Original violations: ${validationResult.violationCodes.join(', ')}`,
    };

    try {
      const retryResult = await callProviderBounded(retryRouting);

      if (retryResult && retryResult.ok && retryResult.text) {
        const retryValidation = await validateGenerationOutput({
          requestId,
          draftOutput: retryResult.text,
          generationRequest: safeGenRequest,
          providerResult: retryResult,
        });

        if (retryValidation.valid || retryValidation.repairedOutput) {
          validationResult = retryValidation;
          providerResult = retryResult;
        }
      }
    } catch {
      logger.warn({ requestId }, 'Regeneration attempt failed');
    }
  }

  const finalResponse = assembleSafeResponse({
    requestId,
    generationRequest: safeGenRequest,
    generationPolicy,
    providerResult,
    validationResult,
  });

  logger.info({
    requestId,
    decision: finalResponse.decision,
    valid: finalResponse.validation.valid,
    repaired: finalResponse.validation.repaired,
    fallbackUsed: finalResponse.validation.fallbackUsed,
    providerCalls: budget.providerCalls,
    durationMs: Date.now() - budget.startedAt,
    shouldArchive: finalResponse.archiveMetadata.shouldArchive,
    shouldUpdateMemory: finalResponse.safeMemoryMetadata.shouldUpdateSafeMemory,
  }, 'Tutor message generation complete');

  return finalResponse;
}
