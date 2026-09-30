// STREAM-3 FINAL AUTHORITY REPAIR — focused authorization tests.
// TASK: STEADFAST-MEDIA-STREAM-3-AI-PROCESS-AUTHORITY-UNIFICATION
//
// Proves MediaResourceRightsGrant is the SINGLE media-rights authority for
// AI_PROCESS / TRANSCRIPT_READ. No provider/model call. No DB.

import { describe, it, expect } from 'vitest';
import type { MediaAsset } from './mediaAssetService';
import {
  resolveMediaAiProcessingAuthorization,
  type CanonicalMediaRightsContext,
} from './mediaAiProcessingAuthorizationService';
import {
  createRightsGrant,
  type MediaExternalPolicy,
} from './mediaResourceEligibilityService';

const NOW = Date.parse('2026-09-28T00:00:00.000Z');
const HOUR = 3_600_000;

const ALLOW_ALL: MediaExternalPolicy = {
  safetyAllowed: true,
  ageAllowed: true,
  deenAllowed: true,
  answerLeakageAllowed: true,
};

function makeAsset(overrides: Partial<MediaAsset> = {}): MediaAsset {
  return {
    id: 'asset-1',
    userId: 'student-1',
    assetKind: 'video_recap',
    title: 'Fractions Explainer',
    summary: 'A short explainer of basic fractions.',
    subject: 'Mathematics',
    topic: 'Fractions',
    tags: [],
    language: 'en',
    sourceUrl: null,
    videoId: 'vid-1',
    videoProvider: 'youtube',
    durationSec: 300,
    transcript: 'TRANSCRIPT_SENTINEL must not leak without authorization',
    metadata: {},
    safetyStatus: 'safe',
    sourceTrust: 'school_approved',
    dedupeKey: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    ...overrides,
  } as MediaAsset;
}

function rightsWith(
  permissions: string[],
  overrides: Partial<CanonicalMediaRightsContext> = {},
): CanonicalMediaRightsContext {
  const grant = createRightsGrant({
    resourceId: 'res-1',
    grantSource: 'DIRECT_LICENSE',
    permissions,
    territories: ['GLOBAL'],
    schoolScope: 'GLOBAL',
    validFrom: NOW - HOUR,
    validUntil: NOW + HOUR,
    now: NOW,
  });
  return {
    resourceId: 'res-1',
    resourceExists: true,
    grants: [grant],
    availability: 'AVAILABLE',
    externalPolicy: ALLOW_ALL,
    territory: 'KE',
    schoolId: null,
    now: NOW,
    ...overrides,
  };
}

describe('STREAM-3 authority unification — T1 canonical AI_PROCESS allows', () => {
  it('canonical AI_PROCESS grant + metadata flag absent => metadata AI processing ALLOWED', () => {
    const asset = makeAsset({ metadata: {} });
    const auth = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['metadata'],
      rights: rightsWith(['AI_PROCESS']),
    });
    expect(auth.metadata.decision).toBe('ALLOWED');
    expect(auth.metadata.authority).toBe('rights_owner_record');
    expect(auth.allScopesAllowed).toBe(true);
  });
});

describe('STREAM-3 authority unification — T2 legacy metadata is not authority', () => {
  it('legacy metadata allow + NO canonical AI_PROCESS => BLOCK', () => {
    const asset = makeAsset({
      metadata: { mediaAiProcessing: { metadata: 'allow', transcript: 'allow' } },
    });
    const auth = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['metadata', 'transcript'],
      rights: rightsWith(['TRANSCRIPT_READ']),
    });
    // TRANSCRIPT_READ alone grants neither metadata AI processing (needs
    // AI_PROCESS) nor transcript AI use (needs AI_PROCESS as well).
    expect(auth.metadata.decision).not.toBe('ALLOWED');
    expect(auth.transcript.decision).not.toBe('ALLOWED');
    expect(auth.allScopesAllowed).toBe(false);
  });
});

describe('STREAM-3 authority unification — T3 AI_PROCESS does not imply TRANSCRIPT_READ', () => {
  it('transcript request with AI_PROCESS only => BLOCK (TRANSCRIPT_READ missing)', () => {
    const asset = makeAsset({ metadata: {} });
    const auth = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['transcript'],
      rights: rightsWith(['AI_PROCESS']),
    });
    expect(auth.transcript.decision).not.toBe('ALLOWED');
    expect(auth.allScopesAllowed).toBe(false);
  });
});

describe('STREAM-3 authority unification — T4 both rights allow transcript use', () => {
  it('transcript request with AI_PROCESS + TRANSCRIPT_READ => ALLOW', () => {
    const asset = makeAsset({ metadata: {} });
    const auth = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['metadata', 'transcript'],
      rights: rightsWith(['AI_PROCESS', 'TRANSCRIPT_READ']),
    });
    expect(auth.metadata.decision).toBe('ALLOWED');
    expect(auth.transcript.decision).toBe('ALLOWED');
    expect(auth.transcript.authority).toBe('rights_owner_record');
    expect(auth.allScopesAllowed).toBe(true);
  });
});

describe('STREAM-3 authority unification — fail-closed without canonical rights', () => {
  it('legacy metadata allow + unresolvable canonical rights => BLOCK (no metadata fallback)', () => {
    const asset = makeAsset({
      metadata: { mediaAiProcessing: { metadata: 'allow', transcript: 'allow' } },
    });
    const auth = resolveMediaAiProcessingAuthorization({
      asset,
      requestedScopes: ['metadata', 'transcript'],
    });
    expect(auth.metadata.decision).not.toBe('ALLOWED');
    expect(auth.transcript.decision).not.toBe('ALLOWED');
    expect(auth.allScopesAllowed).toBe(false);
  });
});
