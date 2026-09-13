// @ts-ignore - @types/uuid may not be installed
import { v4 as uuidv4 } from 'uuid';

import { API_CONTRACT_VERSION } from '../contracts/apiEnvelopeContracts';
import type { ApiResponseMeta } from '../contracts/apiEnvelopeContracts';
import type { ApiSocraticMeta, ApiPrivacyMeta, ApiSafeguardingMeta, ApiCacheMeta, ApiSourceTrustMeta, ApiDataSourceTruthMeta } from '../contracts/apiMetadataContracts';
import type { ApiPaginationMeta } from '../contracts/apiPaginationContracts';
import type { DataSourceTruthMetadata } from '../contracts/dataSourceTruthContracts';

export function buildApiResponseMeta(input: {
  route: string;
  method: string;
  requestId?: string;
  canonical?: boolean;
  legacy?: boolean;
  socratic?: ApiSocraticMeta;
  privacy?: ApiPrivacyMeta;
  safeguarding?: ApiSafeguardingMeta;
  cache?: ApiCacheMeta;
  sourceTrust?: ApiSourceTrustMeta;
  dataSourceTruth?: ApiDataSourceTruthMeta;
  pagination?: ApiPaginationMeta;
}): ApiResponseMeta {
  return {
    requestId: input.requestId || uuidv4(),
    timestamp: new Date().toISOString(),
    route: input.route,
    method: input.method,
    contractVersion: API_CONTRACT_VERSION,
    canonical: input.canonical,
    legacy: input.legacy,
    socratic: input.socratic,
    privacy: input.privacy || {
      privacyMode: 'private_by_default',
      rawChatIncluded: false,
      rawLearnerMemoryIncluded: false,
      rawTranscriptIncluded: false,
    },
    safeguarding: input.safeguarding || {
      escalated: false,
      riskLevel: 'none',
      disclosureMode: 'none',
    },
    cache: input.cache,
    sourceTrust: input.sourceTrust,
    dataSourceTruth: input.dataSourceTruth,
    pagination: input.pagination,
  };
}

export function buildSocraticMeta(input: {
  socraticMode?: string;
  supportMode?: string;
  noFinalAnswerRequired?: boolean;
  integritySignal?: string;
  challengeLevel?: string;
}): ApiSocraticMeta {
  return {
    socraticMode: input.socraticMode,
    supportMode: input.supportMode,
    noFinalAnswerRequired: input.noFinalAnswerRequired,
    integritySignal: input.integritySignal,
    challengeLevel: input.challengeLevel,
  };
}

export function buildPrivacyMeta(mode: ApiPrivacyMeta['privacyMode'] = 'private_by_default'): ApiPrivacyMeta {
  return {
    privacyMode: mode,
    rawChatIncluded: false,
    rawLearnerMemoryIncluded: false,
    rawTranscriptIncluded: false,
  };
}

export function buildSafeguardingMeta(input: {
  escalated: boolean;
  riskLevel?: ApiSafeguardingMeta['riskLevel'];
  disclosureMode?: ApiSafeguardingMeta['disclosureMode'];
}): ApiSafeguardingMeta {
  return {
    escalated: input.escalated,
    riskLevel: input.riskLevel || 'none',
    disclosureMode: input.disclosureMode || 'none',
  };
}

export function buildCacheMeta(input: {
  cacheMode: ApiCacheMeta['cacheMode'];
  cacheScope?: ApiCacheMeta['cacheScope'];
  reason?: string;
}): ApiCacheMeta {
  return {
    cacheMode: input.cacheMode,
    cacheScope: input.cacheScope,
    reason: input.reason,
  };
}

export function buildSourceTrustMeta(input: {
  verifiedSourceCount: number;
  unverifiedSourceCount: number;
  fabricatedSourcesBlocked: boolean;
}): ApiSourceTrustMeta {
  return {
    verifiedSourceCount: input.verifiedSourceCount,
    unverifiedSourceCount: input.unverifiedSourceCount,
    fabricatedSourcesBlocked: input.fabricatedSourcesBlocked,
  };
}

export function buildDataSourceTruthMeta(metadata?: {
  sourceKind: string;
  truthLabel: string;
  canSupportRealMastery: boolean;
  canSupportRealGrowth: boolean;
  canBeDisplayedAsReal: boolean;
  isDemo?: boolean;
  isFallback?: boolean;
  isPlaceholder?: boolean;
  isSynthetic?: boolean;
  isCached?: boolean;
  isStale?: boolean;
  isUnknown?: boolean;
}): ApiDataSourceTruthMeta {
  return {
    sourceKind: metadata?.sourceKind || 'real',
    truthLabel: metadata?.truthLabel || 'Real data',
    canSupportRealMastery: metadata?.canSupportRealMastery ?? true,
    canSupportRealGrowth: metadata?.canSupportRealGrowth ?? true,
    canBeDisplayedAsReal: metadata?.canBeDisplayedAsReal ?? true,
    isDemo: metadata?.isDemo ?? false,
    isFallback: metadata?.isFallback ?? false,
    isPlaceholder: metadata?.isPlaceholder ?? false,
    isSynthetic: metadata?.isSynthetic ?? false,
    isCached: metadata?.isCached ?? false,
    isStale: metadata?.isStale ?? false,
    isUnknown: metadata?.isUnknown ?? false,
  };
}

export function dataSourceTruthToApiMeta(
  truth: DataSourceTruthMetadata,
): ApiDataSourceTruthMeta {
  return {
    sourceKind: truth.sourceKind,
    truthLabel: truth.truthLabel,
    canSupportRealMastery: truth.canSupportRealMastery,
    canSupportRealGrowth: truth.canSupportRealGrowth,
    canBeDisplayedAsReal: truth.canBeDisplayedAsReal,
    isDemo: truth.sourceKind === 'demo',
    isFallback: truth.sourceKind === 'fallback',
    isPlaceholder: truth.sourceKind === 'placeholder',
    isSynthetic: truth.sourceKind === 'synthetic_test',
    isCached: truth.sourceKind === 'cached_real',
    isStale: truth.sourceKind === 'stale_real',
    isUnknown: truth.sourceKind === 'unknown',
  };
}
