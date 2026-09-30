// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor Intent Resolution Compatibility Bridge
//
// TEMPORARY compatibility mapping (AI-RUNTIME-02B):
//   TutorIntentResolution (canonical) → legacy TutorTurnIntent
//   → existing LearningResponsePlanner.
//
// This is a deterministic TRANSLATION of already-resolved structured
// semantics only. It is NOT another classifier:
//   - no raw message text inspection
//   - no regexes over learner language
//   - no retrieval, no AI calls, no database, no state changes
//
// To be removed once the pedagogical planner directly consumes the
// canonical TutorIntentResolution.
// ─────────────────────────────────────────────────────────────

import type { TutorIntentResolution } from '../intentResolverContracts';
import type { TutorTurnIntent } from './tutorOrchestrationContracts';

export const TUTOR_INTENT_COMPATIBILITY_BRIDGE_VERSION = 'tutor-intent-compat-v1';

/**
 * Deterministically map a canonical TutorIntentResolution onto the older
 * pedagogical TutorTurnIntent contract consumed by LearningResponsePlanner.
 */
export function mapTutorIntentResolutionToTurnIntent(
  resolution: TutorIntentResolution,
): TutorTurnIntent {
  // Clarification / fallback: degrade to the existing safe clarification
  // pedagogical path — never fabricate a resolved intent.
  if (
    resolution.status === 'needs_clarification' ||
    resolution.status === 'error' ||
    resolution.primaryIntent === 'clarification_needed'
  ) {
    return 'unknown';
  }

  // Safety: the resolver-level safety decision maps to the legacy
  // safety pedagogical path. (Turn-level HARD policy ownership remains
  // with the AI-RUNTIME-02A canonical packet, evaluated before this.)
  if (
    resolution.status === 'unsafe' ||
    resolution.primaryIntent === 'unsafe'
  ) {
    return 'serious_safety_risk';
  }

  switch (resolution.primaryIntent) {
    case 'check_answer':
    case 'artifact_question_help':
      return 'submit_attempt';

    case 'practice':
    case 'quiz':
    case 'next_practice':
      return 'ask_for_practice';

    case 'review':
    case 'revise':
    case 'study_plan':
      return 'ask_for_revision';

    case 'hint':
      return 'ask_for_hint';

    case 'explain':
      return 'ask_concept';

    case 'simplify':
    case 'reteach':
      return 'express_confusion';

    case 'general_chat':
      return 'unknown';

    default:
      // unsupported / anything unresolved maps to the safe clarification path.
      return 'unknown';
  }
}
