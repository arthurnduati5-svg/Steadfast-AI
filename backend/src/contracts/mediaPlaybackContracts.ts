// STREAM-4 — provider-neutral playback contracts.
// Stable request + resolution surface. No provider specifics, no learner PII,
// no mastery/misconception/answer state. Study/Creative/AI/frontends consume
// MediaPlaybackResolution only.

import type { MediaEligibilityReasonCode } from '../services/mediaResourceEligibilityService';

export const MEDIA_PLAYBACK_MODES = ['EMBED', 'STREAM'] as const;

export type MediaPlaybackMode = (typeof MEDIA_PLAYBACK_MODES)[number];

export interface ResolveMediaPlaybackRequest {
  resourceId: string;
  mode: MediaPlaybackMode;
  territory?: string | null;
  schoolId?: string | null;
  externalPolicy: {
    safetyAllowed: boolean;
    ageAllowed: boolean;
    deenAllowed: boolean;
    answerLeakageAllowed: boolean;
  };
}

export const MEDIA_PLAYBACK_BLOCK_REASONS = [
  'RIGHTS_NOT_FOUND',
  'PERMISSION_NOT_GRANTED',
  'RIGHTS_NOT_YET_VALID',
  'RIGHTS_EXPIRED',
  'RIGHTS_REVOKED',
  'TERRITORY_NOT_ALLOWED',
  'SCHOOL_NOT_ALLOWED',
  'AVAILABILITY_UNKNOWN',
  'RESOURCE_TEMPORARILY_UNAVAILABLE',
  'RESOURCE_UNAVAILABLE',
  'SAFETY_BLOCKED',
  'AGE_BLOCKED',
  'DEEN_BLOCKED',
  'ANSWER_LEAKAGE_BLOCKED',
  'RESOURCE_NOT_FOUND',
  'PROVIDER_IDENTITY_MISSING',
  'PROVIDER_NOT_REGISTERED',
  'PLAYBACK_MODE_UNSUPPORTED',
] as const;

export type MediaPlaybackBlockReason = (typeof MEDIA_PLAYBACK_BLOCK_REASONS)[number];

export const MEDIA_PLAYBACK_FAILURE_CODES = [
  'PROVIDER_TIMEOUT',
  'PROVIDER_UNAVAILABLE',
  'PROVIDER_RESPONSE_INVALID',
  'PROVIDER_INTERNAL_FAILURE',
] as const;

export type MediaPlaybackFailureCode = (typeof MEDIA_PLAYBACK_FAILURE_CODES)[number];

export type MediaPlaybackResolution =
  | {
      status: 'READY';
      resourceId: string;
      provider: string;
      mode: MediaPlaybackMode;
      playback: {
        url: string;
        expiresAt: string | null;
        attribution: string | null;
      };
    }
  | {
      status: 'BLOCKED';
      resourceId: string | null;
      reasonCodes: MediaPlaybackBlockReason[];
    }
  | {
      status: 'FAILED';
      resourceId: string | null;
      failureCode: MediaPlaybackFailureCode;
    };

// STREAM-3 reason codes are reused directly: every eligibility code is a
// valid playback block reason.
export function toPlaybackBlockReasons(
  codes: readonly MediaEligibilityReasonCode[],
): MediaPlaybackBlockReason[] {
  return [...codes] as MediaPlaybackBlockReason[];
}
