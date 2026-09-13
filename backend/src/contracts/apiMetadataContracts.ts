export type ApiSocraticMeta = {
  socraticMode?: string;
  supportMode?: string;
  noFinalAnswerRequired?: boolean;
  integritySignal?: string;
  challengeLevel?: string;
};

export type ApiPrivacyMeta = {
  privacyMode: 'private_by_default' | 'minimum_necessary_safeguarding_disclosure';
  rawChatIncluded: false;
  rawLearnerMemoryIncluded: false;
  rawTranscriptIncluded: false;
};

export type ApiSafeguardingMeta = {
  escalated: boolean;
  riskLevel?: 'none' | 'low' | 'medium' | 'high' | 'urgent';
  disclosureMode?: 'none' | 'minimum_necessary';
};

export type ApiCacheMeta = {
  cacheMode: 'hit' | 'miss' | 'bypass' | 'disabled';
  cacheScope?: 'student' | 'session' | 'artifact' | 'none';
  reason?: string;
};

export type ApiSourceTrustMeta = {
  verifiedSourceCount: number;
  unverifiedSourceCount: number;
  fabricatedSourcesBlocked: boolean;
};

export type ApiDataSourceTruthMeta = {
  sourceKind: string;
  truthLabel: string;
  canSupportRealMastery: boolean;
  canSupportRealGrowth: boolean;
  canBeDisplayedAsReal: boolean;
  isDemo: boolean;
  isFallback: boolean;
  isPlaceholder: boolean;
  isSynthetic: boolean;
  isCached: boolean;
  isStale: boolean;
  isUnknown: boolean;
};
