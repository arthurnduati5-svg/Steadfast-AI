// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Reasoning Cache Policy v2
// Artifact-aware responses are no_cache by default or strongly
// scoped. Cache key includes studentId, schoolId, artifactId,
// blockId/questionId, sessionId, and learner mode.
// ─────────────────────────────────────────────────────────────

import type {
  ArtifactReasoningCacheDecision,
  ArtifactReasoningRequest,
} from './artifactReasoningContracts';

export class ArtifactReasoningCachePolicy {
  /**
   * Decide cache policy for artifact reasoning.
   * Artifact reasoning is never cached due to student/artifact scoping.
   */
  decide(request: ArtifactReasoningRequest): ArtifactReasoningCacheDecision {
    const reason = this._buildReason(request);
    const key = this._buildCacheKey(request);

    return {
      cacheAllowed: false,
      scope: 'no_cache',
      key: null,
      reason,
    };
  }

  /**
   * Assert that a cache decision is safe for artifact reasoning.
   */
  assertSafe(decision: ArtifactReasoningCacheDecision): boolean {
    if (decision.cacheAllowed) {
      // If caching is somehow allowed, verify the key includes proper scoping
      if (!decision.key) return false;
      if (!decision.key.includes('artifact:')) return false;
      return true;
    }
    // no_cache is always safe
    return true;
  }

  private _buildReason(request: ArtifactReasoningRequest): string {
    return [
      'Artifact reasoning is never cached. Reasons:',
      request.studentId ? 'student-scoped' : null,
      request.artifactId ? 'artifact-scoped' : null,
      request.sessionId ? 'session-scoped' : null,
      'answer-key restrictions',
      'prompt-injection defense',
    ]
      .filter(Boolean)
      .join(', ');
  }

  private _buildCacheKey(request: ArtifactReasoningRequest): string | null {
    // Cache is disabled for artifact reasoning — return null
    return null;
  }
}

export const artifactReasoningCachePolicy = new ArtifactReasoningCachePolicy();
