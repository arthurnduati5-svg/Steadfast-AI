import type { SafeGenerationRequest, SafeGenerationResponse, SafeGenerationDecision } from './safeGenerationContracts';
import type { GenerationPolicyResult } from './generationPolicyGate';
import type { ProviderGenerationResult } from './modelProviderContracts';
import type { GenerationOutputValidationResult } from './generationOutputValidationContracts';

export interface SafeResponseAssemblyInput {
  requestId: string;
  generationRequest: SafeGenerationRequest;
  generationPolicy: GenerationPolicyResult;
  providerResult?: ProviderGenerationResult;
  validationResult?: GenerationOutputValidationResult;
}

export function assembleSafeResponse(input: SafeResponseAssemblyInput): SafeGenerationResponse {
  const { requestId, generationRequest, generationPolicy, providerResult, validationResult } = input;
  const policy = generationRequest.policyPacket;

  if (!generationPolicy.allowedToGenerate) {
    return buildNonGeneratedResponse(requestId, generationPolicy, policy.archivePolicyTags);
  }

  if (!providerResult || !providerResult.ok) {
    return buildProviderFailedResponse(requestId, generationPolicy, providerResult);
  }

  if (!validationResult) {
    return {
      requestId,
      decision: 'fallback',
      responseText: 'I am not able to generate a response right now. Please try again.',
      provider: providerResult ? {
        providerId: providerResult.providerId,
        modelId: providerResult.modelId,
        routedBy: 'aiProviderGateway',
      } : undefined,
      validation: {
        valid: false,
        repaired: false,
        fallbackUsed: true,
        violationCodes: ['no_validation'],
      },
      policyTags: policy.archivePolicyTags || [],
      archiveMetadata: {
        shouldArchive: false,
        archiveUserMessage: true,
        archiveAssistantMessage: false,
        safeSummary: undefined,
      },
      safeMemoryMetadata: {
        shouldUpdateSafeMemory: false,
        safeSignals: [],
      },
    };
  }

  if (validationResult.decision === 'blocked') {
    return {
      requestId,
      decision: 'blocked',
      responseText: validationResult.fallbackOutput || 'I encountered an issue. Please try again.',
      provider: {
        providerId: providerResult.providerId,
        modelId: providerResult.modelId,
        routedBy: 'aiProviderGateway',
      },
      validation: {
        valid: false,
        repaired: false,
        fallbackUsed: true,
        violationCodes: validationResult.violationCodes,
      },
      policyTags: policy.archivePolicyTags || [],
      archiveMetadata: {
        shouldArchive: false,
        archiveUserMessage: true,
        archiveAssistantMessage: false,
        safeSummary: undefined,
      },
      safeMemoryMetadata: {
        shouldUpdateSafeMemory: false,
        safeSignals: [],
      },
    };
  }

  if (!validationResult.valid && validationResult.repairedOutput) {
    return {
      requestId,
      decision: 'generated',
      responseText: validationResult.repairedOutput,
      provider: {
        providerId: providerResult.providerId,
        modelId: providerResult.modelId,
        routedBy: 'aiProviderGateway',
      },
      validation: {
        valid: false,
        repaired: true,
        fallbackUsed: validationResult.decision === 'safe_fallback',
        violationCodes: validationResult.violationCodes,
      },
      policyTags: policy.archivePolicyTags || [],
      archiveMetadata: {
        shouldArchive: true,
        archiveUserMessage: true,
        archiveAssistantMessage: true,
        safeSummary: validationResult.repairedOutput.slice(0, 200),
      },
      safeMemoryMetadata: {
        shouldUpdateSafeMemory: true,
        safeSignals: validationResult.violationCodes.length > 0 ? ['repaired_output'] : [],
      },
    };
  }

  if (validationResult.valid) {
    return {
      requestId,
      decision: 'generated',
      responseText: providerResult.text || '',
      provider: {
        providerId: providerResult.providerId,
        modelId: providerResult.modelId,
        routedBy: 'aiProviderGateway',
      },
      validation: {
        valid: true,
        repaired: false,
        fallbackUsed: false,
        violationCodes: [],
      },
      policyTags: policy.archivePolicyTags || [],
      archiveMetadata: {
        shouldArchive: true,
        archiveUserMessage: true,
        archiveAssistantMessage: true,
        safeSummary: (providerResult.text || '').slice(0, 200),
      },
      safeMemoryMetadata: {
        shouldUpdateSafeMemory: true,
        safeSignals: ['valid_generation'],
      },
    };
  }

  return {
    requestId,
    decision: 'fallback',
    responseText: validationResult.fallbackOutput || 'I am not able to answer that right now. Please rephrase your question.',
    provider: {
      providerId: providerResult.providerId,
      modelId: providerResult.modelId,
      routedBy: 'aiProviderGateway',
    },
    validation: {
      valid: false,
      repaired: false,
      fallbackUsed: true,
      violationCodes: validationResult.violationCodes,
    },
    policyTags: policy.archivePolicyTags || [],
    archiveMetadata: {
      shouldArchive: false,
      archiveUserMessage: true,
      archiveAssistantMessage: false,
      safeSummary: undefined,
    },
    safeMemoryMetadata: {
      shouldUpdateSafeMemory: false,
      safeSignals: [],
    },
  };
}

function buildNonGeneratedResponse(
  requestId: string,
  generationPolicy: GenerationPolicyResult,
  archivePolicyTags?: string[],
): SafeGenerationResponse {
  let decision: SafeGenerationDecision;
  let responseText: string;

  if (generationPolicy.generationMode === 'safe_clarification') {
    decision = 'clarify_first';
    responseText = generationPolicy.safeFallbackMessage || 'Could you please clarify your question?';
  } else if (generationPolicy.generationMode === 'safe_deen_referral') {
    decision = 'referral';
    responseText = generationPolicy.safeFallbackMessage || 'Please consult a qualified scholar for guidance.';
  } else {
    decision = 'safe_refusal';
    responseText = generationPolicy.safeFallbackMessage || 'I am not able to answer that right now.';
  }

  return {
    requestId,
    decision,
    responseText,
    validation: {
      valid: true,
      repaired: false,
      fallbackUsed: false,
      violationCodes: [],
    },
    policyTags: archivePolicyTags || [],
    archiveMetadata: {
      shouldArchive: true,
      archiveUserMessage: true,
      archiveAssistantMessage: true,
      safeSummary: responseText.slice(0, 200),
    },
    safeMemoryMetadata: {
      shouldUpdateSafeMemory: false,
      safeSignals: [],
    },
  };
}

function buildProviderFailedResponse(
  requestId: string,
  generationPolicy: GenerationPolicyResult,
  providerResult?: ProviderGenerationResult,
): SafeGenerationResponse {
  return {
    requestId,
    decision: 'fallback',
    responseText: 'I am not able to generate a response right now. Please try again in a moment.',
    provider: providerResult ? {
      providerId: providerResult.providerId,
      modelId: providerResult.modelId,
      routedBy: 'aiProviderGateway',
    } : undefined,
    validation: {
      valid: false,
      repaired: false,
      fallbackUsed: true,
      violationCodes: providerResult?.errorCode ? [providerResult.errorCode] : ['provider_unavailable'],
    },
    policyTags: [],
    archiveMetadata: {
      shouldArchive: false,
      archiveUserMessage: true,
      archiveAssistantMessage: false,
      safeSummary: undefined,
    },
    safeMemoryMetadata: {
      shouldUpdateSafeMemory: false,
      safeSignals: [],
    },
  };
}
