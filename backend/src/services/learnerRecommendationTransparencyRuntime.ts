import type { ResolvedTutorIdentity } from './tutorStateContracts';
import type {
  LearnerRecommendationExplanation,
  LearnerProgressNarrative,
  LearnerPrivacyVisibilitySummary,
  LearnerRecommendationAuditRecord,
  LearnerExplanationSafetyDecision,
  LearnerNextRecommendationRequest,
  LearnerRecommendationPreference,
} from './learnerTransparencyContracts';
import { nextStepRecommendationResolver } from './learnerNextStepRecommendationResolver';
import { buildLearnerRecommendationExplanation, buildShortLearnerReason } from './learnerWhyThisNextExplanationService';
import { buildRecommendationNarrative, buildPrivacyVisibilityNarrative } from './learnerProgressNarrativeService';
import { buildPrivacyVisibilitySummary } from './learnerPrivacyVisibilityService';
import { validateExplanationSafety } from './learnerExplanationSafetyGuardService';
import { buildRecommendationAuditRecord, listRecommendationAuditRecords } from './learnerRecommendationAuditService';
import { buildLearnerAgencyOptions } from './learnerAgencyOptionsService';
import { learnerProgressStateService } from './mastery/learnerProgressStateService';
import { growthProofSummaryService } from './mastery/growthProofSummaryService';

let requestCounter = 0;
function generateRequestId(): string {
  requestCounter++;
  return `lrn-req-${Date.now()}-${requestCounter}`;
}

export class LearnerRecommendationTransparencyRuntime {
  async getNextRecommendation(
    identity: ResolvedTutorIdentity,
    request?: LearnerNextRecommendationRequest,
  ): Promise<{
    explanation: LearnerRecommendationExplanation | null;
    audit: LearnerRecommendationAuditRecord | null;
    safety: LearnerExplanationSafetyDecision | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const requestId = generateRequestId();

    const result = await nextStepRecommendationResolver.resolveNextStep(identity, {
      subject: request?.subject,
      topic: request?.topic,
      mode: request?.mode,
    });

    if (!result.recommendation) {
      return { explanation: null, audit: null, safety: null, warnings: ['No recommendation could be resolved from available evidence'] };
    }

    warnings.push(...result.warnings);

    const explanation = buildLearnerRecommendationExplanation(
      identity,
      result.recommendation,
      requestId,
    );

    const audit = buildRecommendationAuditRecord(
      identity,
      result.recommendation,
      requestId,
    );

    const safety = validateExplanationSafety(explanation);
    if (!safety.safe) {
      warnings.push(`Safety guard applied: ${safety.blockedReason || safety.redactionReasons.join(', ')}`);
    }

    return { explanation, audit, safety, warnings };
  }

  async getExplanationForRecommendation(
    identity: ResolvedTutorIdentity,
    recommendationId: string,
  ): Promise<{
    explanation: LearnerRecommendationExplanation | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const requestId = generateRequestId();

    const result = await nextStepRecommendationResolver.resolveNextStep(identity);
    if (!result.recommendation) {
      return { explanation: null, warnings: ['Could not resolve recommendation'] };
    }

    const explanation = buildLearnerRecommendationExplanation(
      identity,
      result.recommendation,
      requestId,
    );
    explanation.recommendationId = recommendationId;

    return { explanation, warnings };
  }

  async getRevisionExplanation(
    identity: ResolvedTutorIdentity,
    revisionItemId: string,
  ): Promise<{
    explanation: LearnerRecommendationExplanation | null;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    const requestId = generateRequestId();

    const result = await nextStepRecommendationResolver.resolveNextStep(identity);
    if (!result.recommendation) {
      return { explanation: null, warnings: ['Could not resolve revision explanation'] };
    }

    const explanation = buildLearnerRecommendationExplanation(
      identity,
      result.recommendation,
      requestId,
    );

    return { explanation, warnings };
  }

  async getProgressNarrative(
    identity: ResolvedTutorIdentity,
  ): Promise<{
    narratives: LearnerProgressNarrative[];
    warnings: string[];
  }> {
    const warnings: string[] = [];

    const progressState = await learnerProgressStateService.refreshProgressState(identity);
    const growthResult = await growthProofSummaryService.generateGrowthProofSummary(identity);

    const improvements = growthResult.summary?.whatImproved || [];
    const reviewItems = growthResult.summary?.whatNeedsReview || [];

    const result = await nextStepRecommendationResolver.resolveNextStep(identity);
    const recommendation = result.recommendation;

    const readySkills = progressState.state?.readyForChallenge.map((r) => r.skillLabel) || [];

    if (recommendation) {
      const narratives = buildRecommendationNarrative(recommendation, improvements, reviewItems);
      const readyNarrative = {
        narrativeType: 'ready_for_challenge' as const,
        title: 'Ready for a challenge',
        narrative: readySkills.length > 0
          ? `You are ready for a challenge in: ${readySkills.slice(0, 3).join(', ')}.`
          : 'Keep building your foundation.',
        safeEvidenceCards: [],
        generatedAt: new Date().toISOString(),
      };
      narratives.push(readyNarrative);
      return { narratives, warnings };
    }

    const defaultNarrative: LearnerProgressNarrative = {
      narrativeType: 'what_improved',
      title: 'Your learning progress',
      narrative: 'Start a learning activity to receive personalized progress insights.',
      safeEvidenceCards: [],
      generatedAt: new Date().toISOString(),
    };

    return { narratives: [defaultNarrative, buildPrivacyVisibilityNarrative()], warnings };
  }

  async getPrivacyVisibility(
    identity: ResolvedTutorIdentity,
    deenSensitive?: boolean,
  ): Promise<LearnerPrivacyVisibilitySummary> {
    return buildPrivacyVisibilitySummary(deenSensitive);
  }

  async submitRecommendationPreference(
    identity: ResolvedTutorIdentity,
    preference: LearnerRecommendationPreference,
  ): Promise<{ ok: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    if (!preference.optionId || !preference.feedback) {
      warnings.push('Invalid preference: optionId and feedback are required');
      return { ok: false, warnings };
    }
    return { ok: true, warnings };
  }

  async getAuditRecords(
    identity: ResolvedTutorIdentity,
  ): Promise<LearnerRecommendationAuditRecord[]> {
    return listRecommendationAuditRecords(identity);
  }
}

export const learnerRecommendationTransparencyRuntime = new LearnerRecommendationTransparencyRuntime();
