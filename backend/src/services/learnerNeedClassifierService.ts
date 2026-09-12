import type { TutorActionContext } from './tutorActionContextBuilder';
import type { LearnerNeedCategory } from '../contracts/tutorActionContracts';

export function classifyLearnerNeed(ctx: TutorActionContext): LearnerNeedCategory {
  if (ctx.requestCategory === 'answer_key') return 'answer_key_seeking';
  if (ctx.requestCategory === 'unsafe') return 'unsafe_request';
  if (ctx.requestCategory === 'off_topic') return 'off_topic';

  if (!ctx.approvedContextAvailable) return 'content_context_missing';
  if (ctx.deenSensitive && !ctx.modeSessionId) return 'deen_sensitive_uncertain';

  if (!ctx.hasProfileData) return 'no_data_yet';

  if (ctx.masteryLevel === 'secure' || ctx.masteryLevel === 'strong') {
    if (ctx.requestCategory === 'teach_back') return 'ready_for_teach_back';
    return 'ready_for_challenge';
  }

  if (ctx.attemptCount === 0) return 'no_attempt_yet';

  if (ctx.answerQuality === 'partially_correct') return 'partially_correct';

  if (ctx.mistakeCategory === 'conceptual') return 'incorrect_conceptual';
  if (ctx.mistakeCategory === 'procedural') return 'incorrect_procedural';
  if (ctx.mistakeCategory === 'careless') return 'careless_error';
  if (ctx.mistakeCategory === 'prerequisite_gap') return 'prerequisite_gap';
  if (ctx.mistakeCategory === 'language_barrier') return 'language_confusion';

  if (ctx.repeatedMistakeDetected) return 'repeated_same_mistake';

  if (ctx.highHintDependency) return 'high_hint_dependency';

  if (ctx.stuckCount > 2 && ctx.recoveryCount === 0) return 'stuck_without_recovery';
  if (ctx.recoveryCount > 0) return 'recovering_after_hint';

  if (ctx.profileConfidence < 0.3) return 'low_confidence_profile';
  if (ctx.weakTopicDetected) return 'needs_revision';

  if (ctx.attemptCount > 0 && ctx.answerQuality === 'incorrect') {
    return 'incorrect_procedural';
  }

  return 'first_attempt_needed';
}
