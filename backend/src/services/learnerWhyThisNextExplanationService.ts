import type { ResolvedRecommendation } from './learnerNextStepRecommendationResolver';
import type {
  LearnerRecommendationExplanation,
  LearnerSafeEvidenceCard,
  LearnerAgencyOption,
  LearnerPrivacyVisibilitySummary,
  LearnerRecommendationResponseMetadata,
} from './learnerTransparencyContracts';
import {
  getRecommendationReasonPolicy,
} from './learnerTransparencyContracts';
import { buildLearnerSafeEvidenceCard } from './learnerSafeEvidenceCardService';
import { buildLearnerAgencyOptions } from './learnerAgencyOptionsService';
import { buildLearnerPrivacyVisibility } from './learnerPrivacyVisibilityService';
import { buildRecommendationAuditRecord } from './learnerRecommendationAuditService';
import { validateExplanationSafety } from './learnerExplanationSafetyGuardService';
import type { ResolvedTutorIdentity } from './tutorStateContracts';

let idCounter = 0;
function generateId(): string {
  idCounter++;
  return `lrn-rec-${Date.now()}-${idCounter}`;
}

export function buildLearnerRecommendationExplanation(
  identity: ResolvedTutorIdentity,
  recommendation: ResolvedRecommendation,
  requestId: string,
): LearnerRecommendationExplanation {
  const policy = getRecommendationReasonPolicy(recommendation.recommendationType);

  const studentFriendlyExplanation = policy.studentFriendlyTemplate.replace(
    '{skillLabel}',
    recommendation.skillLabel,
  );

  const skillConnection = policy.skillConnectionTemplate.replace(
    '{skillLabel}',
    recommendation.skillLabel,
  );

  const growthConnection = policy.growthConnectionTemplate.replace(
    '{skillLabel}',
    recommendation.skillLabel,
  );

  const whatToDoFirst = policy.whatToDoFirstTemplate;
  const whatHappensNext = policy.whatHappensNextTemplate;

  const evidenceCards: LearnerSafeEvidenceCard[] = [buildLearnerSafeEvidenceCard(recommendation)];
  const agencyOptions: LearnerAgencyOption[] = buildLearnerAgencyOptions(recommendation);
  const privacyVisibility: LearnerPrivacyVisibilitySummary = buildLearnerPrivacyVisibility();
  const auditRecord = buildRecommendationAuditRecord(identity, recommendation, requestId);

  const metadata: LearnerRecommendationResponseMetadata = {
    teacherSafe: true,
    rawChatExcluded: true,
    privateMemoryExcluded: true,
    safeguardingBoundaryApplied: true,
    deenSensitiveHandled: recommendation.recommendationType === 'deen_teacher_referral',
    redactionApplied: false,
    redactionReasons: [],
  };

  const explanation: LearnerRecommendationExplanation = {
    recommendationId: generateId(),
    recommendationType: recommendation.recommendationType,
    subject: recommendation.subject,
    topic: recommendation.topic,
    skillLabel: recommendation.skillLabel,
    shortReason: policy.shortReason,
    studentFriendlyExplanation,
    skillConnection,
    growthConnection,
    whatToDoFirst,
    whatHappensNext,
    safeEvidenceCards: evidenceCards,
    agencyOptions,
    privacyVisibility,
    confidence: policy.confidenceLabel,
    generatedAt: new Date().toISOString(),
    metadata,
  };

  const safetyResult = validateExplanationSafety(explanation);
  if (!safetyResult.safe) {
    if (safetyResult.blockedReason) {
      throw new Error(`Explanation blocked by safety guard: ${safetyResult.blockedReason}`);
    }
    if (safetyResult.redactionApplied) {
      metadata.redactionApplied = true;
      metadata.redactionReasons.push(...safetyResult.redactionReasons);
    }
  }

  return explanation;
}

export function buildShortLearnerReason(
  recommendationType: string,
  skillLabel: string,
): string {
  const policy = getRecommendationReasonPolicy(recommendationType as any);
  return policy.studentFriendlyTemplate.replace('{skillLabel}', skillLabel);
}

export function buildLearnerExplanationFromParams(
  recommendationType: string,
  skillLabel: string,
  subject: string,
  topic: string,
): string {
  const policy = getRecommendationReasonPolicy(recommendationType as any);
  let explanation = policy.studentFriendlyTemplate.replace('{skillLabel}', skillLabel);
  return explanation;
}
