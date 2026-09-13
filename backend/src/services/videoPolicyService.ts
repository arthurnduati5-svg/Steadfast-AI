// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Policy Service v1
// Conservative Islamic school video policy profile.
// No religious rulings. Configurable by school.
// ─────────────────────────────────────────────────────────────

import type { VideoPolicyProfile, IslamicAppropriatenessMode } from './videoRecommendationContracts';

const CONSERVATIVE_DEFAULT_PROFILE: VideoPolicyProfile = {
  profileId: 'conservative_islamic_school_v1',
  schoolId: '*',
  name: 'Conservative Islamic School Default v1',

  minAge: 5,
  maxAge: 18,

  allowedLanguages: ['en', 'sw', 'ar'],
  preferredLanguages: ['en', 'ar'],

  blockExplicitContent: true,
  blockViolence: true,
  blockRacyContent: true,
  blockProfanity: true,
  blockSectarianAttackContent: true,
  requireEducationalPurpose: true,
  requireEmbeddable: true,
  preferCaptions: true,

  islamicAppropriatenessMode: 'balanced',

  createdAt: new Date().toISOString(),
};

export class VideoPolicyService {
  private profiles: Map<string, VideoPolicyProfile> = new Map();

  constructor() {
    // Register default profile
    this.profiles.set(CONSERVATIVE_DEFAULT_PROFILE.profileId, CONSERVATIVE_DEFAULT_PROFILE);
  }

  /**
   * Get the effective policy profile for a school.
   * Falls back to conservative default if no school-specific profile exists.
   */
  getEffectiveProfile(schoolId: string, requestedProfileId?: string | null): VideoPolicyProfile {
    // Try requested profile first
    if (requestedProfileId && this.profiles.has(requestedProfileId)) {
      return this.profiles.get(requestedProfileId)!;
    }

    // Try school-specific profile
    const schoolKey = `school:${schoolId}`;
    if (this.profiles.has(schoolKey)) {
      return this.profiles.get(schoolKey)!;
    }

    // Fall back to conservative default
    return CONSERVATIVE_DEFAULT_PROFILE;
  }

  /**
   * Register or update a policy profile for a school.
   */
  setProfile(profile: VideoPolicyProfile): void {
    this.profiles.set(profile.profileId, profile);
  }

  /**
   * Get the conservative default profile (safe fallback).
   */
  getConservativeDefault(): VideoPolicyProfile {
    return { ...CONSERVATIVE_DEFAULT_PROFILE };
  }

  /**
   * Check if content needs review based on policy strictness.
   */
  needsReview(profile: VideoPolicyProfile, missingFields: string[]): boolean {
    if (profile.islamicAppropriatenessMode === 'strict' && missingFields.length > 0) {
      return true;
    }
    // If mode is balanced, only require review for critical missing fields
    if (profile.islamicAppropriatenessMode === 'balanced') {
      return missingFields.some(f => ['language', 'duration', 'title'].includes(f));
    }
    return false;
  }
}

export const videoPolicyService = new VideoPolicyService();
