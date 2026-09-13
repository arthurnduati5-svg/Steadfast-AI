export interface VerifiedSource {
  id: string;
  sourceType: 'web' | 'video' | 'artifact' | 'internal';
  title: string;
  url?: string;
  domain?: string;
  publishedAt?: string;
  retrievedAt?: string;
  freshnessStatus: 'fresh' | 'possibly_stale' | 'stale' | 'unknown';
  verificationStatus: 'verified' | 'unverified' | 'rejected';
  supportsClaimIds: string[];
  safeSummary: string;
  rawContentIncluded: false;
}

export interface SourceBackedClaim {
  id: string;
  claim: string;
  requiresCitation: boolean;
  supportedBySourceIds: string[];
  supportStatus: 'supported' | 'unsupported' | 'partially_supported' | 'not_checked';
}

export interface CitationIntegrityResult {
  verified: boolean;
  claims: SourceBackedClaim[];
  warnings: string[];
  unsupportedClaimsDowngraded: number;
  supportedClaimsKept: number;
  missingSourceFallbackApplied: boolean;
  staleSourcesWarned: boolean;
  noFabricatedUrls: boolean;
}

export const FAKE_URL_PATTERNS = [
  /^https?:\/\/example\.(com|org|net)/i,
  /^https?:\/\/source\.com/i,
  /^https?:\/\/research\.example/i,
  /^https?:\/\/placeholder\./i,
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\.0\.0\.\d+/i,
  /^https?:\/\/192\.168\.\d+\.\d+/i,
  /^https?:\/\/10\.\d+\.\d+\.\d+/i,
  /^https?:\/\/[a-z]+\.local/i,
  /^https?:\/\/[a-z]+\.invalid/i,
  /^https?:\/\/[a-z]+\.test/i,
  /^https?:\/\/.*example.*/i,
  /^https?:\/\/fake/i,
];

export const PLACEHOLDER_SOURCE_TITLES = [
  'unknown source',
  'unknown',
  'source 1',
  'source 2',
  'source 3',
  'verified source',
  'unverified source',
  'research source',
  'web source',
  'https://example.com',
  'https://source.com',
  'https://research.example',
];
