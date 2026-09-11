import type {
  TutorTurnContext,
  TutorTurnStatePatch,
  TutorTurnDispatchDecision,
} from '../contracts/tutorTurnRuntimeContracts';

export function produceTutorTurnStatePatch(
  context: TutorTurnContext,
  decision: TutorTurnDispatchDecision,
  turnId: string,
): TutorTurnStatePatch {
  const patch: TutorTurnStatePatch = {
    lastUpdatedAt: new Date().toISOString(),
    lastTurnId: turnId,
    lastDispatchTarget: decision.dispatchTarget,
    lastSafeReasonCodes: context.safeReasonCodes,
    lastSafeEvidenceRefs: context.safeEvidenceRefs,
  };

  if (decision.dispatchTarget === 'focus_mode') {
    patch.activeMode = 'focus';
  } else if (decision.dispatchTarget === 'exam_mode') {
    patch.activeMode = 'exam';
  } else if (decision.dispatchTarget === 'quiz_mode') {
    patch.activeMode = 'quiz';
  } else if (decision.dispatchTarget === 'teach_back_mode') {
    patch.activeMode = 'teach_back';
  } else if (decision.dispatchTarget === 'revision_mode') {
    patch.activeMode = 'revision';
  } else if (decision.dispatchTarget === 'learning_mode') {
    patch.activeMode = 'learning';
  } else if (decision.dispatchTarget === 'growth_action') {
    patch.lastWhyThisNextCode = 'insufficient_evidence';
  }

  return patch;
}

export function produceEmptyStatePatch(): TutorTurnStatePatch {
  return {
    lastUpdatedAt: new Date().toISOString(),
  };
}
