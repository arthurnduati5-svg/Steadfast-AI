import {
  LearnerFacingRevisionExplanation,
  LearnerNextActionKind,
  WhyThisNextValidationResult,
  RevisionExplanationInput,
} from './whyThisNextContracts';
import { buildSourceTruthSummary } from './explanationSourceTruthService';

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `rev-ex-${Date.now()}-${idCounter}`;
}

export function buildRevisionExplanation(input: RevisionExplanationInput): LearnerFacingRevisionExplanation {
  const item = input.revisionQueueItem;

  const evidenceEventIds = [...item.evidenceEventIds];
  for (const event of input.evidenceEvents ?? []) {
    if (!evidenceEventIds.includes(event.eventId)) {
      evidenceEventIds.push(event.eventId);
    }
  }

  const realCount = (input.evidenceEvents ?? []).filter((e) => e.sourceQuality === 'real').length;
  const nonRealCount = (input.evidenceEvents ?? []).filter(
    (e) => e.sourceQuality === 'demo' || e.sourceQuality === 'fallback' || e.sourceQuality === 'synthetic_test',
  ).length;
  const unknownCount = (input.evidenceEvents ?? []).filter(
    (e) => e.sourceQuality === 'unknown' || e.sourceQuality === undefined,
  ).length;
  const staleCount = (input.evidenceEvents ?? []).filter((e) => e.freshness === 'stale' || e.freshness === 'expired').length;

  const sourceTruth = buildSourceTruthSummary({
    realEvidenceCount: realCount,
    nonRealEvidenceCount: nonRealCount,
    unknownEvidenceCount: unknownCount,
    staleEvidenceCount: staleCount,
    hasRealDataSources: realCount > 0,
  });

  const canSupportRealRevision = realCount > 0 && nonRealCount === 0;
  const learnerFriendlyReason = buildLearnerFriendlyRevisionReason(item.reasonCode, item.safeReason, canSupportRealRevision);
  const recommendedAction = mapRevisionActionToLearnerAction(item.recommendedAction);
  const expectedBenefit = buildExpectedBenefit(item.reasonCode);

  const explanation: LearnerFacingRevisionExplanation = {
    revisionExplanationId: generateId(),
    revisionQueueItemId: item.itemId,
    learnerIdHash: input.learnerIdHash,
    subjectId: input.subjectId,
    skillId: input.skillId,
    topicId: input.topicId,
    safeReason: item.safeReason,
    learnerFriendlyReason,
    recommendedAction,
    expectedBenefit,
    evidenceEventIds,
    mistakeType: input.mistakeType,
    supportLevel: input.supportLevel,
    sourceTruthSummary: {
      canSupportRealRevision,
      explanationConfidence: sourceTruth.explanationConfidence,
    },
    finalAnswerIncluded: false,
    answerKeyIncluded: false,
    hiddenReasoningIncluded: false,
    rawLearnerDataIncluded: false,
    rawPromptIncluded: false,
    rawAiResponseIncluded: false,
    rawTranscriptIncluded: false,
  };

  return explanation;
}

export function explainRevisionReason(input: RevisionExplanationInput): string {
  return buildLearnerFriendlyRevisionReason(
    input.revisionQueueItem.reasonCode,
    input.revisionQueueItem.safeReason,
    input.dataSourceTruth?.canSupportRealMastery ?? false,
  );
}

export function selectRevisionNextAction(input: RevisionExplanationInput): LearnerNextActionKind {
  return mapRevisionActionToLearnerAction(input.revisionQueueItem.recommendedAction);
}

export function validateRevisionExplanation(explanation: LearnerFacingRevisionExplanation): WhyThisNextValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!explanation.revisionExplanationId) errors.push('revisionExplanationId is required');
  if (!explanation.revisionQueueItemId) errors.push('revisionQueueItemId is required');
  if (!explanation.learnerFriendlyReason) errors.push('learnerFriendlyReason is required');
  if (!explanation.recommendedAction) errors.push('recommendedAction is required');
  if (!explanation.expectedBenefit) errors.push('expectedBenefit is required');
  if (!explanation.safeReason) errors.push('safeReason is required');

  if (explanation.learnerFriendlyReason.length > 500) errors.push('learnerFriendlyReason exceeds 500 characters');
  if (explanation.expectedBenefit.length > 300) errors.push('expectedBenefit exceeds 300 characters');

  if (explanation.finalAnswerIncluded !== false) errors.push('finalAnswerIncluded must be false');
  if (explanation.answerKeyIncluded !== false) errors.push('answerKeyIncluded must be false');
  if (explanation.hiddenReasoningIncluded !== false) errors.push('hiddenReasoningIncluded must be false');
  if (explanation.rawLearnerDataIncluded !== false) errors.push('rawLearnerDataIncluded must be false');
  if (explanation.rawPromptIncluded !== false) errors.push('rawPromptIncluded must be false');
  if (explanation.rawAiResponseIncluded !== false) errors.push('rawAiResponseIncluded must be false');
  if (explanation.rawTranscriptIncluded !== false) errors.push('rawTranscriptIncluded must be false');

  return { valid: errors.length === 0, errors, warnings };
}

function buildLearnerFriendlyRevisionReason(reasonCode: string, safeReason: string, canSupportReal: boolean): string {
  const reasonTexts: Record<string, string> = {
    repeated_mistake: 'Strengthening this skill will help you avoid a similar mistake in future problems.',
    weak_evidence: 'More practice on this skill will build stronger evidence of your understanding.',
    stale_evidence: 'Refreshing this skill will help keep your knowledge current.',
    hint_dependency: 'Building confidence in this skill will help you solve problems more independently.',
    failed_transfer: 'Mastering this skill first will help you apply it to different types of problems.',
    correction_needed: 'Correcting your approach to this skill will strengthen your overall understanding.',
    practice_gap: 'Focused practice on this area will fill a gap in your learning.',
    artifact_gap: 'Reviewing your work on this skill will help identify areas to improve.',
    video_gap: 'Watching the recommended video will help clarify this concept.',
    integrity_redirect_followup: 'Focusing on showing your own work will help you learn more effectively.',
    default: 'Working on this skill will help you build a stronger foundation.',
  };

  const baseReason = reasonTexts[reasonCode] ?? reasonTexts.default;

  if (!canSupportReal) {
    return `${baseReason} This recommendation is based on initial signals.`;
  }

  return baseReason;
}

function buildExpectedBenefit(reasonCode: string): string {
  const benefits: Record<string, string> = {
    repeated_mistake: 'Break the mistake pattern and build correct understanding.',
    weak_evidence: 'Strengthen your evidence of understanding.',
    stale_evidence: 'Reinforce knowledge that has not been used recently.',
    hint_dependency: 'Build ability to solve problems without hints.',
    failed_transfer: 'Develop ability to apply skills across problem types.',
    correction_needed: 'Fix specific gaps in your approach.',
    practice_gap: 'Fill specific learning gaps.',
    artifact_gap: 'Learn from your previous work.',
    video_gap: 'Gain clarity through visual explanation.',
    integrity_redirect_followup: 'Build genuine understanding through your own work.',
    default: 'Build a stronger foundation in this skill.',
  };

  return benefits[reasonCode] ?? benefits.default;
}

function mapRevisionActionToLearnerAction(action: string): LearnerNextActionKind {
  const map: Record<string, LearnerNextActionKind> = {
    retry_similar_problem: 'retry_similar_problem',
    explain_concept: 'explain_reasoning',
    correct_previous_step: 'correct_previous_step',
    practice_foundation: 'revise_skill',
    watch_targeted_video: 'watch_targeted_video',
    review_artifact_feedback: 'review_artifact_feedback',
    answer_reflection_question: 'reflect_on_mistake',
    ask_socratic_tutor: 'ask_socratic_tutor',
  };
  return map[action] ?? 'revise_skill';
}
