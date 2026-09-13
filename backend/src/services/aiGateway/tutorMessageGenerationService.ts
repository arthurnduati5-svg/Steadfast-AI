import type { TutorTurnPolicyInput, TutorTurnPolicyPacket } from '../tutorTurnPolicy/tutorTurnPolicyContracts';
import type { SafeGenerationRequest, SafeGenerationResponse } from './safeGenerationContracts';
import type { PolicyAwarePromptBundle } from './promptBoundaryContracts';
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

function generateRequestId(): string {
  return `gen_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function generateTutorMessage(
  input: TutorTurnPolicyInput,
  healthService: ProviderHealthService = defaultProviderHealthService,
  config: TutorMessageGenerationServiceConfig = {},
): Promise<SafeGenerationResponse> {
  const requestId = input.requestId || generateRequestId();

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
        useMockInTest: config.useMockProvider ?? process.env.NODE_ENV === 'test',
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

  let providerResult: ProviderGenerationResult;
  try {
    providerResult = await callProvider(
      {
        generationRequest: safeGenRequest,
        promptBundle,
        routingDecision,
      },
      healthService,
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown provider error';
    logger.error({ requestId, error: errorMessage }, 'Provider call failed');
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now. Please try again.',
      provider: {
        providerId: routingDecision.providerId || 'unknown',
        modelId: routingDecision.modelId || 'unknown',
        routedBy: 'aiProviderGateway',
      },
      validation: { valid: false, repaired: false, fallbackUsed: true, violationCodes: ['provider_exception'] },
      policyTags: [],
      archiveMetadata: { shouldArchive: false, archiveUserMessage: true, archiveAssistantMessage: false },
      safeMemoryMetadata: { shouldUpdateSafeMemory: false, safeSignals: [] },
    };
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

    logger.info({ requestId, providerId: routingDecision.providerId, fallbacks: routingDecision.fallbackProviderIds }, 'Provider failed, trying fallback');
    const fallbackRouting: ModelRoutingDecision = {
      ...routingDecision,
      providerId: routingDecision.fallbackProviderIds[0],
      modelId: undefined,
      fallbackProviderIds: routingDecision.fallbackProviderIds.slice(1),
      reason: `Fallback from ${routingDecision.providerId} to ${routingDecision.fallbackProviderIds[0]}`,
    };

    try {
      providerResult = await callProvider(
        {
          generationRequest: safeGenRequest,
          promptBundle,
          routingDecision: fallbackRouting,
        },
        healthService,
      );
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
    logger.info({ requestId }, 'Output invalid, attempting single regeneration');

    const retryRouting: ModelRoutingDecision = {
      ...routingDecision,
      reason: `Regeneration attempt after invalid output. Original violations: ${validationResult.violationCodes.join(', ')}`,
    };

    try {
      const retryResult = await callProvider(
        {
          generationRequest: safeGenRequest,
          promptBundle,
          routingDecision: retryRouting,
        },
        healthService,
      );

      if (retryResult.ok && retryResult.text) {
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
    shouldArchive: finalResponse.archiveMetadata.shouldArchive,
    shouldUpdateMemory: finalResponse.safeMemoryMetadata.shouldUpdateSafeMemory,
  }, 'Tutor message generation complete');

  return finalResponse;
}
