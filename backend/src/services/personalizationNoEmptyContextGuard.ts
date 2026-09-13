// ─────────────────────────────────────────────────────────────
// Steadfast AI — Personalization No-Empty-Context Guard v1
// Fails when personalization signals are empty but real
// learner data exists. Prevents fake/missing personalization.
// ─────────────────────────────────────────────────────────────

import type {
  PersonalizationPacket,
  PersonalizationEnforcementResult,
  PersonalizationViolation,
} from './personalizationContracts';

export class PersonalizationNoEmptyContextGuard {
  /**
   * Assert that personalization is not empty when real data exists.
   * Fails when domain signals are 'missing' or 'empty' but
   * the actual data source had available information.
   */
  assertNoEmptyPersonalizationWhenDataExists(input: {
    packet: PersonalizationPacket;
    hadLearnerMemory: boolean;
    hadMastery: boolean;
    hadMisconceptions: boolean;
    hadArtifactPractice: boolean;
    hadVideoPractice: boolean;
    hadArtifactHistory: boolean;
    hadVideoHistory: boolean;
    hadTutorState: boolean;
  }): PersonalizationEnforcementResult {
    const violations: PersonalizationViolation[] = [];

    // Helper: check if a domain has only missing/empty signals
    const isEmpty = (domain: keyof PersonalizationPacket['domains']): boolean => {
      const signals = input.packet.domains[domain];
      return signals.length === 0 || signals.every(
        (s) => s.status === 'missing' || s.status === 'empty',
      );
    };

    // Learner memory
    if (input.hadLearnerMemory && isEmpty('learnerMemory')) {
      violations.push({
        code: 'EMPTY_LEARNER_MEMORY',
        domain: 'learner_memory',
        message: 'Learner memory exists but personalization packet has no learner memory signals.',
        severity: 'error',
      });
    }

    // Mastery
    if (input.hadMastery && isEmpty('mastery')) {
      violations.push({
        code: 'EMPTY_MASTERY',
        domain: 'mastery',
        message: 'Mastery data exists but personalization packet has no mastery signals.',
        severity: 'error',
      });
    }

    // Misconceptions
    if (input.hadMisconceptions && isEmpty('misconceptions')) {
      violations.push({
        code: 'EMPTY_MISCONCEPTIONS',
        domain: 'misconceptions',
        message: 'Misconception signals exist but personalization packet has no misconception signals.',
        severity: 'error',
      });
    }

    // Artifact practice
    if (input.hadArtifactPractice && isEmpty('artifactPractice')) {
      violations.push({
        code: 'EMPTY_ARTIFACT_PRACTICE',
        domain: 'artifact_practice',
        message: 'Artifact practice exists but personalization packet has no artifact practice signals.',
        severity: 'error',
      });
    }

    // Video practice
    if (input.hadVideoPractice && isEmpty('videoPractice')) {
      violations.push({
        code: 'EMPTY_VIDEO_PRACTICE',
        domain: 'video_practice',
        message: 'Video practice exists but personalization packet has no video practice signals.',
        severity: 'error',
      });
    }

    // Artifact history
    if (input.hadArtifactHistory && isEmpty('artifactHistory')) {
      violations.push({
        code: 'EMPTY_ARTIFACT_HISTORY',
        domain: 'artifact_history',
        message: 'Artifact history exists but personalization packet has no artifact history signals.',
        severity: 'error',
      });
    }

    // Video history
    if (input.hadVideoHistory && isEmpty('videoHistory')) {
      violations.push({
        code: 'EMPTY_VIDEO_HISTORY',
        domain: 'video_history',
        message: 'Video history exists but personalization packet has no video history signals.',
        severity: 'error',
      });
    }

    // Tutor state
    if (input.hadTutorState && isEmpty('tutorState')) {
      violations.push({
        code: 'EMPTY_TUTOR_STATE',
        domain: 'tutor_state',
        message: 'TutorState exists but personalization packet has no tutor state signals.',
        severity: 'error',
      });
    }

    const ok = violations.filter((v) => v.severity === 'error').length === 0;

    return {
      ok,
      packet: input.packet,
      metadata: {
        personalizationAvailable: input.packet.usage.availableDomains.length > 0,
        personalizationUsed: input.packet.usage.usedDomains.length > 0,
        usedDomains: input.packet.usage.usedDomains,
        missingDomains: input.packet.usage.missingDomains,
        redactedDomains: input.packet.usage.redactedDomains,
        blockedDomains: input.packet.usage.blockedDomains,
        emptyButExpectedDomains: input.packet.usage.emptyButExpectedDomains,
        warnings: violations.map((v) => v.message),
      },
      violations,
    };
  }
}

// ── Singleton ──

export const personalizationNoEmptyContextGuard = new PersonalizationNoEmptyContextGuard();
