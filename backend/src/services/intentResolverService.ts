// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intent Resolver Service v1
// Resolves learner messages into structured TutorIntentResolution
// using message, context, evidence, clarification policy, and
// safety checks. Deterministic v1 — no AI classifier dependency.
// ─────────────────────────────────────────────────────────────

import type {
  TutorIntent,
  TutorIntentResolution,
  TutorIntentEvidence,
  IntentResolutionStatus,
  TutorTaskPlan,
  IntentSafetyDecision,
  IntentContextUse,
  IntentDownstreamRouting,
  ClarificationQuestion,
  ResolveTutorIntentRequest,
} from './intentResolverContracts';
import {
  intentConfidenceFromScore,
  clampScore,
  containsPromptInjection,
} from './intentResolverContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { intentEvidenceService, type IntentEvidenceInput } from './intentEvidenceService';
import { clarificationPolicyService, type ClarificationInput } from './clarificationPolicyService';
import { tutorTaskPlannerService, type TaskPlannerInput } from './tutorTaskPlannerService';
import { scorePromptInjectionRisk } from './intentResolverValidation';

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `int_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── Candidate intent scoring weights ──
interface IntentCandidateScore {
  intent: TutorIntent;
  score: number;
  reasons: string[];
}

// ── IntentResolverService ──

export class IntentResolverService {
  /**
   * Resolve a learner's message into a structured intent resolution.
   */
  async resolveTutorIntent(input: {
    identity: ResolvedTutorIdentity;
    request: ResolveTutorIntentRequest;
    tutorContext?: any | null;
    practiceMasteryContext?: any | null;
  }): Promise<TutorIntentResolution> {
    const resolvedAt = nowISO();
    const resolutionId = generateId();
    const warnings: string[] = [];
    const errors: string[] = [];

    const message = String(input.request.message || '').trim();
    const tutorContext = input.tutorContext || null;
    const pmContext = input.practiceMasteryContext || null;

    // ── Safety: prompt injection detection ──
    const injectionScore = scorePromptInjectionRisk(message);
    const injectionDetected = containsPromptInjection(message) || injectionScore > 0.35;
    const isUnsafe = injectionDetected && injectionScore > 0.6;

    const safetyFlags = {
      promptInjectionDetected: injectionDetected,
      promptInjectionScore: injectionScore,
    };

    // ── Build evidence from all available context ──
    const evidenceInput: IntentEvidenceInput = {
      request: input.request,
      tutorContext: tutorContext
        ? {
            session: {
              activeSubject: tutorContext.session?.activeSubject,
              activeTopic: tutorContext.session?.activeTopic,
              activeSkillIds: tutorContext.session?.activeSkillIds,
            },
            learnerProfile: tutorContext.learnerProfile
              ? {
                  strengths: tutorContext.learnerProfile.strengths,
                  weaknesses: tutorContext.learnerProfile.weaknesses,
                  recentMistakes: tutorContext.learnerProfile.recentMistakes,
                  misconceptionSignals: tutorContext.learnerProfile.misconceptionSignals,
                  masterySignals: tutorContext.learnerProfile.masterySignals,
                }
              : undefined,
            artifactContext: tutorContext.artifactContext
              ? {
                  status: tutorContext.artifactContext.status,
                  activeArtifactIds: tutorContext.artifactContext.activeArtifactIds,
                }
              : undefined,
            sourceTrust: tutorContext.sourceTrust
              ? { status: tutorContext.sourceTrust.status, allowedSourceIds: tutorContext.sourceTrust.allowedSourceIds }
              : undefined,
            videoContext: tutorContext.videoContext
              ? { status: tutorContext.videoContext.status, activeVideoId: tutorContext.videoContext.activeVideoId }
              : undefined,
            tutorState: tutorContext.tutorState
              ? {
                  activeSubject: tutorContext.tutorState.activeSubject,
                  activeTopic: tutorContext.tutorState.activeTopic,
                  activeArtifactIds: tutorContext.tutorState.activeArtifactIds,
                  activeSkillIds: tutorContext.tutorState.activeSkillIds,
                }
              : undefined,
          }
        : null,
      practiceMasteryContext: pmContext,
      safetyFlags,
    };

    const evidence = intentEvidenceService.buildIntentEvidence(evidenceInput);

    // ── Extract context flags from evidence ──
    const hasActiveTopic = evidence.some((e) => e.source === 'tutor_context' && e.signal === 'active_topic');
    const hasActiveArtifact = evidence.some((e) => e.source === 'artifact_context' && e.signal === 'active_artifact_exists');
    const hasLearnerMemory = evidence.some((e) => e.source === 'learner_memory');
    const hasPracticeMastery = evidence.some((e) => e.source === 'practice_mastery');
    const hasPracticeRecommendation = evidence.some((e) => e.source === 'practice_mastery' && e.signal === 'next_practice_recommendations');
    const hasReviewDue = evidence.some((e) => e.source === 'practice_mastery' && e.signal === 'review_due');
    const hasLearnerAnswer = evidence.some((e) => e.source === 'message' && e.signal === 'learner_answer_provided');
    const hasVerifiedSources = evidence.some((e) => e.source === 'source_trust' && e.signal === 'verified_sources_exist');
    const hasVideoActive = evidence.some((e) => e.source === 'video_context');
    const hasSourceCandidates = evidence.some((e) => e.source === 'source_trust' && e.signal === 'source_candidates_provided');

    const activeSubject = tutorContext?.session?.activeSubject || tutorContext?.tutorState?.activeSubject || null;
    const activeTopic = tutorContext?.session?.activeTopic || tutorContext?.tutorState?.activeTopic || null;
    const activeArtifactIds: string[] =
      (input.request.activeArtifactIds?.length ?? 0) > 0
        ? (input.request.activeArtifactIds ?? [])
        : (tutorContext?.artifactContext?.activeArtifactIds ?? []);
    const activeVideoId = input.request.activeVideoId || tutorContext?.videoContext?.activeVideoId || null;
    const sourceCandidateIds = input.request.sourceCandidateIds || [];
    const verifiedSourceCount = tutorContext?.sourceTrust?.allowedSourceIds?.length || 0;

    // ── Score candidate intents (deterministic v1) ──
    const candidates = this._scoreCandidates(message, {
      hasActiveTopic,
      hasActiveArtifact,
      hasLearnerMemory,
      hasPracticeMastery,
      hasPracticeRecommendation,
      hasReviewDue,
      hasLearnerAnswer,
      hasVerifiedSources,
      hasSourceCandidates,
      hasVideoActive,
      activeSubject,
      activeTopic,
    });

    // Sort by score descending
    candidates.sort((a, b) => b.score - a.score);

    const topScore = candidates.length > 0 ? candidates[0].score : 0;
    const topIntent = candidates.length > 0 ? candidates[0].intent : 'general_chat';
    const secondaryIntents: TutorIntent[] = candidates.slice(1, 3).map((c) => c.intent);

    // ── Clarification check ──
    const clarificationInput: ClarificationInput = {
      request: input.request,
      activeArtifactIds,
      activeSubject,
      activeTopic,
      hasTutorState: !!tutorContext?.tutorState,
      hasLearnerMemory,
      hasPracticeMastery,
      hasPracticeRecommendation,
      hasReviewDue,
      sourceCandidateIds,
      verifiedSourceCount,
      confidenceScore: topScore,
      topCandidateIntents: candidates.slice(0, 3).map((c) => ({ intent: c.intent, score: c.score })),
      isPromptInjectionDetected: injectionDetected,
    };

    let clarification: ClarificationQuestion | null = null;

    // If unsafe, skip clarification
    if (isUnsafe) {
      clarification = null;
    } else {
      clarification = clarificationPolicyService.decideClarification(clarificationInput);

      // If no explicit clarification needed but message is vague and topic exists
      if (!clarification && !injectionDetected && topScore < 0.35 && hasActiveTopic && activeTopic) {
        clarification = clarificationPolicyService.generateContextualClarification(activeTopic);
      }
    }

    // ── Determine status ──
    let status: IntentResolutionStatus;
    if (isUnsafe) {
      status = 'unsafe';
    } else if (clarification && !clarification.canProceedWithSafeDefault) {
      status = 'needs_clarification';
    } else if (clarification && clarification.canProceedWithSafeDefault) {
      status = 'partial';
    } else if (topScore < 0.25 && !hasActiveTopic) {
      status = 'needs_clarification';
    } else if (topScore < 0.15) {
      status = 'partial';
    } else {
      status = 'resolved';
    }

    // ── Determine effective intent ──
    let effectiveIntent = topIntent;
    if (injectionDetected && !isUnsafe) {
      warnings.push('Prompt injection patterns detected in message. Treating as clarification-needed.');
      effectiveIntent = 'clarification_needed';
      status = status === 'unsafe' ? 'unsafe' : 'needs_clarification';
    }
    if (isUnsafe) {
      effectiveIntent = 'unsafe';
      warnings.push('Message flagged as unsafe (prompt injection or bypass attempt).');
    }
    if (clarification && !clarification.canProceedWithSafeDefault) {
      effectiveIntent = 'clarification_needed';
    }
    if (clarification && clarification.canProceedWithSafeDefault && clarification.safeDefaultIntent) {
      effectiveIntent = clarification.safeDefaultIntent;
    }

    // ── Plan tutor task ──
    const taskInput: TaskPlannerInput = {
      primaryIntent: effectiveIntent,
      subject: activeSubject,
      topic: activeTopic,
      skillIds: tutorContext?.session?.activeSkillIds || [],
      artifactIds: activeArtifactIds,
      artifactBlockIds: [],
      videoId: activeVideoId,
      sourceIds: sourceCandidateIds,
      practiceRecommendationIds: pmContext?.nextPracticeRecommendations?.map((r: any) => r.recommendationId) || [],
      memoryIds: [],
      masteryIds: pmContext?.masteryIdsUsed || [],
      hasLearnerAnswer,
      hasActiveArtifact: activeArtifactIds.length > 0,
      hasActiveTopic: !!activeTopic,
      hasPracticeRecommendations: hasPracticeRecommendation,
      hasReviewDue,
      hasVerifiedSources,
    };

    const task = tutorTaskPlannerService.planTutorTask(taskInput);

    // ── Build safety decision ──
    const safetyDecision: IntentSafetyDecision = {
      safeToProceed: !isUnsafe,
      reason: isUnsafe
        ? 'Prompt injection or unsafe content detected. Refusing to process.'
        : 'No safety concerns detected.',
      blockedReasons: isUnsafe ? ['Prompt injection detected'] : [],
      promptInjectionSuspected: injectionDetected,
      answerKeyExposureRisk: false,
      sourceFabricationRisk: false,
      crossStudentRisk: false,
    };

    // ── Build context use ──
    const contextUse: IntentContextUse = {
      usedTutorState: !!tutorContext?.tutorState,
      usedLearnerMemory: hasLearnerMemory,
      usedPracticeMastery: hasPracticeMastery,
      usedArtifactContext: hasActiveArtifact,
      usedSourceTrust: hasVerifiedSources || hasSourceCandidates,
      usedVideoContext: hasVideoActive,
      activeSubject,
      activeTopic,
      activeArtifactIds,
      activeVideoId,
      notes: [],
    };

    if (hasActiveTopic) contextUse.notes.push('Active topic used for intent resolution.');
    if (hasPracticeRecommendation) contextUse.notes.push('Practice recommendations available and considered.');
    if (hasReviewDue) contextUse.notes.push('Due reviews available and considered.');
    if (hasLearnerAnswer) contextUse.notes.push('Learner answer provided — answer checking possible.');
    if (injectionDetected) contextUse.notes.push('Prompt injection patterns detected.');
    if (!hasActiveTopic && !hasActiveArtifact && !hasPracticeMastery && !injectionDetected) {
      contextUse.notes.push('Limited context available — resolution may be broad.');
    }

    // ── Build downstream routing ──
    const downstream: IntentDownstreamRouting = this._buildDownstreamRouting(effectiveIntent, status, {
      hasActiveArtifact: activeArtifactIds.length > 0,
      hasPracticeRecommendations: hasPracticeRecommendation,
      hasLearnerAnswer,
      hasVerifiedSources: hasVerifiedSources || hasSourceCandidates,
    });

    // ── Assemble resolution ──
    const confidenceScore = clampScore(topIntent === effectiveIntent ? topScore : Math.max(0.2, topScore - 0.1));

    if (status === 'partial') {
      warnings.push('Intent partially resolved. Some context is missing.');
    }
    if (status === 'needs_clarification') {
      warnings.push('Clarification needed before proceeding.');
    }
    if (hasActiveTopic && !activeTopic) {
      activeTopic; // Already handled
    }

    return {
      resolutionId,
      status,
      primaryIntent: effectiveIntent,
      secondaryIntents,
      task,
      confidence: intentConfidenceFromScore(confidenceScore),
      confidenceScore,
      evidence,
      clarification,
      contextUse,
      safety: safetyDecision,
      downstream,
      warnings,
      errors,
      resolverVersion: 'intent-resolver-v1',
      resolvedAt,
    };
  }

  /**
   * Score candidate intents using deterministic v1 rules.
   * Keywords are one signal among many — never the whole decision.
   */
  private _scoreCandidates(
    message: string,
    context: {
      hasActiveTopic: boolean;
      hasActiveArtifact: boolean;
      hasLearnerMemory: boolean;
      hasPracticeMastery: boolean;
      hasPracticeRecommendation: boolean;
      hasReviewDue: boolean;
      hasLearnerAnswer: boolean;
      hasVerifiedSources: boolean;
      hasSourceCandidates: boolean;
      hasVideoActive: boolean;
      activeSubject: string | null;
      activeTopic: string | null;
    },
  ): IntentCandidateScore[] {
    const scores = new Map<string, IntentCandidateScore>();
    const lowerMessage = message.toLowerCase();

    const addScore = (intent: TutorIntent, delta: number, reason: string) => {
      const existing = scores.get(intent) || { intent, score: 0, reasons: [] };
      existing.score += delta;
      existing.reasons.push(reason);
      scores.set(intent, existing);
    };

    // ── Semantic message cues ──
    // "I don't get it" / vague confusion
    if (
      /\b(don'?t\s+(get|understand|follow|know)|not\s+(getting|clear|sure)|confus|lost|stuck\s+on|no\s+idea)\b/i.test(
        lowerMessage,
      )
    ) {
      addScore('explain', 0.35, 'Message indicates confusion or lack of understanding.');
      if (context.hasActiveTopic) {
        addScore('reteach', 0.25, 'Active topic exists — reteach possible.');
      } else {
        addScore('clarification_needed', 0.1, 'No active topic — may need clarification.');
      }
    }

    // "Quiz me" / "Test me"
    if (
      /\b(quiz|test|exam|question)\s+(me|time|now)\b/i.test(lowerMessage) ||
      /\b(give\s+me\s+a\s+quiz|pop\s+quiz|quick\s+quiz)\b/i.test(lowerMessage)
    ) {
      addScore('quiz', 0.45, 'Message explicitly asks for a quiz.');
      addScore('practice', 0.25, 'Quiz request may also be practice.');
      if (!context.hasActiveTopic && !context.hasPracticeMastery) {
        addScore('clarification_needed', 0.3, 'No topic or practice context — clarification needed.');
      }
    }

    // "Explain this" / "Explain"
    if (
      /\b(explain|tell\s+me\s+about|what\s+is|what\s+are|how\s+(does|do|can))\b/i.test(lowerMessage) &&
      !/\b(source|true|real|verify)\b/i.test(lowerMessage)
    ) {
      addScore('explain', 0.3, 'Message requests explanation.');
      if (context.hasActiveTopic) {
        addScore('explain', 0.15, 'Active topic available for explanation.');
      } else {
        addScore('clarification_needed', 0.1, 'No active topic for explanation.');
      }
    }

    // "Make it easier" / "Simplify"
    if (/\b(simplif|easier|too\s+(hard|complex|difficult)|break\s+(it\s+)?down|simpler)\b/i.test(lowerMessage)) {
      addScore('simplify', 0.45, 'Message requests simplification.');
    }

    // "Check my answer" / "Is this correct"
    if (/\b(check|grade|mark|correct|right\?|am\s+i\s+right|did\s+i\s+get)\b/i.test(lowerMessage)) {
      addScore('check_answer', 0.55, 'Message requests answer checking.');
      if (!context.hasLearnerAnswer) {
        addScore('clarification_needed', 0.2, 'No learner answer provided.');
      }
    }

    // "Use the file" / artifact request
    if (
      /\b(file|document|pdf|worksheet|image|diagram|chart|graph|uploaded|attached)\b/i.test(lowerMessage) &&
      /\b(use|look|read|check|help|question|understand)\b/i.test(lowerMessage)
    ) {
      if (context.hasActiveArtifact) {
        addScore('artifact_help', 0.45, 'Message references file and active artifact exists.');
        addScore('artifact_question_help', 0.25, 'May be a specific question about the artifact.');
      } else {
        addScore('artifact_help', 0.2, 'Message references file but no active artifact.');
        addScore('clarification_needed', 0.35, 'No active artifact — clarification needed.');
      }
    }

    // "Practice" / "Another one"
    if (/\b(practi(e|s)|another\s+one|next\s+(question|problem)|similar|one\s+more)\b/i.test(lowerMessage)) {
      if (context.hasPracticeRecommendation) {
        addScore('practice', 0.5, 'Practice requested and recommendations available.');
      } else {
        addScore('practice', 0.3, 'Practice requested but no recommendations yet.');
      }
      addScore('quiz', 0.1, 'Practice may also lead to quiz.');
    }

    // "Review" / "Revise"
    if (/\b(review|revise|go\s+over|look\s+at\s+(again|this)|recap|refresh)\b/i.test(lowerMessage)) {
      if (context.hasReviewDue) {
        addScore('review', 0.5, 'Review requested and reviews are due.');
      } else {
        addScore('review', 0.3, 'Review requested but no reviews due.');
      }
      addScore('revise', 0.2, 'Review may also mean revision.');
    }

    // "Source" / "Is this true"
    if (/\b(source|true|real|verified?|reliable|trust|fact\s+check|citation)\b/i.test(lowerMessage)) {
      if (context.hasVerifiedSources || context.hasSourceCandidates) {
        addScore('source_verification', 0.65, 'Source verification requested and sources available.');
      } else {
        addScore('source_verification', 0.3, 'Source verification requested but no sources available.');
        addScore('clarification_needed', 0.3, 'No sources available — clarification needed.');
      }
    }

    // "What should I practice next?"
    if (
      /\b(what\s+should\s+(i|we)\s+(practice|study|do|review|learn)\s+next|next\s+(step|topic|lesson)|suggest\s+(something|what))\b/i.test(
        lowerMessage,
      )
    ) {
      if (context.hasPracticeRecommendation) {
        addScore('next_practice', 0.65, 'Next-practice requested and recommendations exist.');
      } else {
        addScore('next_practice', 0.2, 'Next-practice requested but no recommendations.');
      }
      addScore('progress_check', 0.15, 'May also be checking progress.');
    }

    // "Help me revise" / "Revision plan"
    if (/\b(revise|revision|study\s+plan|prepare\s+for\s+(exam|test)|exam\s+prep)\b/i.test(lowerMessage)) {
      addScore('revise', 0.4, 'Revision or study plan requested.');
      addScore('study_plan', 0.25, 'May want a structured study plan.');
      if (context.hasReviewDue) {
        addScore('review', 0.15, 'Due reviews available for revision.');
      }
    }

    // "Video" / "Watched the video"
    if (/\b(video|watch|youtube|screencast|lecture\s+recording)\b/i.test(lowerMessage)) {
      if (context.hasVideoActive) {
        addScore('video_help', 0.5, 'Video help requested and active video exists.');
      } else {
        addScore('video_help', 0.2, 'Video help requested but no active video.');
      }
    }

    // "Progress" / "How am I doing"
    if (
      /\b(progress|how\s+(am|is)\s+.*(doing|going)|what\s+have\s+(i\s+)?learned|my\s+score|my\s+mastery)\b/i.test(
        lowerMessage,
      )
    ) {
      addScore('progress_check', 0.5, 'Progress check requested.');
    }

    // Greeting / General chat
    if (
      /\b(hi|hello|hey|good\s+(morning|afternoon|evening)|how\s+are\s+you|thanks|thank\s+you|ok|okay|alright)\b/i.test(
        lowerMessage,
      ) && lowerMessage.length < 30
    ) {
      addScore('general_chat', 0.4, 'Greeting or casual message.');
    }

    // ── Default: add general_chat as baseline ──
    if (!scores.has('general_chat') || (scores.get('general_chat')?.score || 0) < 0.1) {
      addScore('general_chat', 0.1, 'Default fallback intent.');
    }

    // ── Context-based boosts ──
    if (context.hasActiveTopic) {
      const existingExplain = scores.get('explain');
      if (existingExplain) {
        existingExplain.score += 0.1;
      }
    }

    if (context.hasPracticeRecommendation) {
      const existingPractice = scores.get('practice');
      if (existingPractice) {
        existingPractice.score += 0.15;
      }
    }

    if (context.hasReviewDue) {
      const existingReview = scores.get('review');
      if (existingReview) {
        existingReview.score += 0.15;
      }
    }

    return Array.from(scores.values());
  }

  /**
   * Build downstream routing metadata based on intent and status.
   */
  private _buildDownstreamRouting(
    intent: TutorIntent,
    status: IntentResolutionStatus,
    context: {
      hasActiveArtifact: boolean;
      hasPracticeRecommendations: boolean;
      hasLearnerAnswer: boolean;
      hasVerifiedSources: boolean;
    },
  ): IntentDownstreamRouting {
    const base = {
      suggestedEndpoint: null as string | null,
      shouldCallAi: true,
      shouldQueryArtifact: false,
      shouldUsePracticeMastery: false,
      shouldUseLearnerMemory: false,
      shouldUseSourceTrust: false,
      shouldAskClarification: false,
    };

    if (status === 'unsafe' || intent === 'unsafe') {
      return {
        ...base,
        suggestedService: 'safety_refusal' as const,
        shouldCallAi: false,
      };
    }

    if (status === 'needs_clarification' || intent === 'clarification_needed') {
      return {
        ...base,
        suggestedService: 'clarification' as const,
        shouldCallAi: true,
        shouldAskClarification: true,
      };
    }

    switch (intent) {
      case 'explain':
      case 'reteach':
      case 'simplify':
      case 'general_chat':
        return {
          ...base,
          suggestedService: 'chat_generation',
          shouldCallAi: true,
        };

      case 'practice':
      case 'quiz':
        return {
          ...base,
          suggestedService: 'practice_mastery',
          shouldCallAi: true,
          shouldUsePracticeMastery: true,
        };

      case 'review':
      case 'revise':
        return {
          ...base,
          suggestedService: 'practice_mastery',
          shouldCallAi: true,
          shouldUsePracticeMastery: true,
          shouldUseLearnerMemory: true,
        };

      case 'check_answer':
        return {
          ...base,
          suggestedService: 'chat_generation',
          shouldCallAi: true,
        };

      case 'artifact_help':
      case 'artifact_question_help':
        return {
          ...base,
          suggestedService: 'artifact_query',
          shouldCallAi: true,
          shouldQueryArtifact: context.hasActiveArtifact,
        };

      case 'source_verification':
        return {
          ...base,
          suggestedService: 'source_trust',
          shouldCallAi: false,
          shouldUseSourceTrust: context.hasVerifiedSources,
        };

      case 'video_help':
        return {
          ...base,
          suggestedService: 'video_context',
          shouldCallAi: true,
        };

      case 'next_practice':
        return {
          ...base,
          suggestedService: 'practice_mastery',
          shouldCallAi: true,
          shouldUsePracticeMastery: true,
        };

      case 'progress_check':
      case 'study_plan':
        return {
          ...base,
          suggestedService: 'practice_mastery',
          shouldCallAi: true,
          shouldUsePracticeMastery: true,
          shouldUseLearnerMemory: true,
        };

      default:
        return {
          ...base,
          suggestedService: 'chat_generation',
          shouldCallAi: true,
        };
    }
  }
}

// Singleton
export const intentResolverService = new IntentResolverService();
