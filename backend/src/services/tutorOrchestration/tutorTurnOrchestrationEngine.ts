import type { TutorTurnOrchestrationInput, TutorTurnOrchestrationResult } from './tutorOrchestrationContracts';
import type { SafeGenerationResponse } from '../aiGateway/safeGenerationContracts';
import type { LearningResponsePlan } from './learningResponsePlannerContracts';
import type { SocraticHint } from './hintLadderContracts';
import type { StepCheckResult } from './stepCheckingContracts';
import type { PracticeQuestionPlan } from './practiceQuestionContracts';
import type { MistakeAnalysis } from './mistakeTaxonomyContracts';
import type { AttemptFeedback } from './attemptFeedbackRuntime';
import type { SubjectValidationResult } from './subjectValidationRuntime';
import type { LearningEvidenceWriteResult } from './evidenceAndRevisionContracts';
import type { RevisionQueueUpdateResult } from './evidenceAndRevisionContracts';
import type { StateTransitionResult } from './tutorResponseStateMachine';
import type { AssemblerInput } from './tutorTurnResultAssembler';
import type { CurriculumContextPacket } from '../curriculumRuntimeContracts';

import { buildSafeLearningContext, enrichLearningContextWithCurriculum, enrichLearningContextWithDeenPolicy, enrichLearningContextWithMemory, type SafeLearningContext } from './tutorTurnLearningContextBuilder';
import { classifyLearnerIntent } from './tutorTurnIntentClassifier';
import { planLearningResponse } from './learningResponsePlanner';
import { transitionState } from './tutorResponseStateMachine';
import { generateSocraticHint } from './socraticHintLadderRuntime';
import { checkLearnerStep } from './stepCheckingRuntime';
import { generatePracticeQuestion } from './practiceQuestionRuntime';
import { analyzeMistake } from './mistakeTaxonomyRuntime';
import { generateAttemptFeedback } from './attemptFeedbackRuntime';
import { validateSubjectResponse } from './subjectValidationRuntime';
import { writeLearningEvidence } from './learningEvidenceWriteRuntime';
import { updateRevisionQueue } from './revisionQueueUpdateRuntime';
import { composePedagogyPrompt } from './tutorPedagogyPromptComposer';
import { validateOrchestrationOutput } from './tutorOrchestrationOutputValidator';
import { assembleTutorTurnResult } from './tutorTurnResultAssembler';
import { runSpecialist } from './tutorSpecialistRuntime';
import { mapTutorIntentResolutionToTurnIntent } from './tutorIntentCompatibilityMapper';

import { generateTutorMessage } from '../aiGateway/tutorMessageGenerationService';
import { CurriculumEngine } from '../curriculumEngine';
import { logger } from '../../utils/logger';
import { task011TutorTurnIntegrationService } from '../mastery/task011TutorTurnIntegrationService';
import type { ResolvedTutorIdentity } from '../tutorStateContracts';

const curriculumEngine = new CurriculumEngine();

function makeFallbackResult(
  input: TutorTurnOrchestrationInput,
  message: string,
  errorCode: string,
): TutorTurnOrchestrationResult {
  return {
    requestId: input.requestId,
    tutorSessionId: input.tutorSessionId,
    intent: 'unknown',
    responseMove: 'safe_refusal',
    state: {
      initialState: 'awaiting_question',
      finalState: 'blocked_safe_response',
      transitionReason: `Orchestration error: ${errorCode}`,
    },
    responseText: message,
    policyTags: ['orchestration_error', errorCode],
    archiveMetadata: {
      shouldArchive: false,
      archivedUserMessage: false,
      archivedAssistantMessage: false,
    },
    safeMemoryMetadata: {
      shouldUpdateSafeMemory: false,
      safeSignals: [],
    },
    clientSafeMetadata: {},
  };
}

export async function orchestrateTutorTurn(
  input: TutorTurnOrchestrationInput,
): Promise<TutorTurnOrchestrationResult> {
  const { requestId } = input;

  try {
    // Step 1: Build safe learning context
    const safeContext = buildSafeLearningContext(input);

    // Step 1b: Resolve curriculum context (with safe fallback on error)
    let curriculumPacket: CurriculumContextPacket;
    let curriculumResolved = false;
    try {
      curriculumPacket = curriculumEngine.resolveForTutorTurn({
        requestId,
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        learnerGrade: input.learnerGrade,
        learnerAge: input.learnerAge,
        preferredLanguage: input.preferredLanguage,
        messageText: input.messageText,
        subjectHint: input.clientContext?.subjectHint,
        topicHint: input.clientContext?.topicHint,
      });
      curriculumResolved = true;
    } catch (curriculumError: unknown) {
      const curriculumErrorMessage = curriculumError instanceof Error ? curriculumError.message : 'Unknown curriculum error';
      logger.warn({ requestId, error: curriculumErrorMessage }, 'Curriculum resolution failed, using fallback');
      curriculumPacket = {
        requestId,
        curriculumTrack: 'unknown',
        primaryCategory: 'unknown',
        curriculumConfidence: 'unknown',
        sourceConfidence: 'unknown',
        deenSensitivityLevel: 'none',
        prerequisiteHints: [],
        commonMistakeHints: [],
        validationModes: ['no_strict_validation'],
        teachingMethodRules: [],
        moduleDirective: {
          moduleId: 'unknown',
          subjectName: 'Unknown',
          responseToneRules: ['clear', 'patient', 'helpful'],
          teachingMethodRules: ['teach step by step', 'validate understanding'],
          validationModes: ['no_strict_validation'],
          vocabularyRules: ['use clear language'],
          exampleRules: ['use simple examples'],
          endingRule: 'End with a question.',
          pacingDirective: 'balanced',
          maxIdeaCount: 3,
          maxQuestionCount: 3,
          shouldUseEmoji: false,
          shouldUseKenyanExamples: false,
          shouldUseArabicScript: false,
          shouldAvoidRomanization: false,
          shouldAvoidLatex: false,
          shouldAvoidSyntaxDumping: false,
          deenSourceHandling: 'not_deen',
          disallowedBehaviors: [],
        },
        recommendedTutorModeHint: 'clarify_first',
        safeClarifyingQuestion: 'Could you tell me more about what you are studying?',
        unresolvedReason: 'Curriculum resolution error',
      };
    }

    const enrichedContext = enrichLearningContextWithCurriculum(
      safeContext,
      curriculumPacket,
      curriculumPacket.moduleDirective,
    );

    const deenSensitive = curriculumPacket.curriculumTrack === 'madrasa_deen' || curriculumPacket.deenSensitivityLevel === 'source_required' || curriculumPacket.deenSensitivityLevel === 'sensitive';

    if (curriculumPacket.curriculumTrack === 'madrasa_deen' || curriculumPacket.deenSensitivityLevel !== 'none') {
      enrichLearningContextWithDeenPolicy(enrichedContext, { deenSensitivityLevel: curriculumPacket.deenSensitivityLevel });
    }

    // Step 2: Classify learner intent
    // R1/R2: the rich canonical resolved intent is authoritative when present;
    // the simple text classifier remains the deterministic fallback for callers
    // without a rich resolution. The compatibility bridge deterministically
    // translates the canonical resolution onto the pedagogical TutorTurnIntent
    // — never re-inferring from raw text and never degrading a resolved
    // specialist request back into generic clarification.
    let intent = classifyLearnerIntent(input.messageText);
    if (input.resolvedIntent) {
      intent = mapTutorIntentResolutionToTurnIntent(input.resolvedIntent);
    }

    // R3/R4: ONE deterministic specialist decision per turn (may be none).
    const specialistOutcome = await runSpecialist({
      requestId,
      messageText: input.messageText,
      resolvedIntent: input.resolvedIntent,
      sourceFreshnessDecision: input.sourceFreshnessDecision,
      preparedArtifactEvidence:
        (input.preparedPromptPacket?.allowedContext as {
          artifactReasoningEvidence?: {
            groundingStatus?: string;
            summary?: string;
            evidenceRefs?: string[];
            citations?: string[];
            warnings?: string[];
            actionHint?: string;
          };
        } | undefined)?.artifactReasoningEvidence ?? null,
      preparedVideoContext: null,
      deenSourceSensitive: deenSensitive,
      // AI-INTELLIGENCE-03R R3: verified identity already supplied to the
      // canonical tutor runtime — threaded as authenticated seal context only.
      // Never re-resolved; never taken from user/body IDs.
      sealIdentity: {
        schoolId: input.schoolId,
        studentId: input.tutorLearnerId,
        sessionId: input.tutorSessionId,
      },
    });
    const specialistResult = specialistOutcome.result;

    // Step 3: Plan learning response with curriculum validation modes
    const validationModes = curriculumPacket.validationModes || (curriculumPacket.moduleDirective?.validationModes) || [];
    const plan: LearningResponsePlan = planLearningResponse({
      requestId,
      messageText: input.messageText,
      intent,
      policyPacket: undefined,
      curriculumValidationModes: validationModes,
      deenSourceSensitive: deenSensitive,
    });

    // Step 4: Transition state
    const stateTransition: StateTransitionResult = transitionState({
      requestId,
      intent,
      plan,
    });

    // Step 5: Generate hint if required (with curriculum adaptive pacing)
    const pacingDirective = curriculumPacket.moduleDirective?.pacingDirective || 'balanced';
    let hint: SocraticHint | undefined;
    if (plan.requiresHint) {
      hint = generateSocraticHint({
        requestId,
        learnerAge: input.learnerAge,
        learnerGrade: input.learnerGrade,
        adaptivePacing: pacingDirective,
      });
    }

    // Step 6: Check learner step if attempt exists
    let stepCheck: StepCheckResult | undefined;
    if (plan.requiresStepCheck) {
      stepCheck = checkLearnerStep({
        requestId,
        learnerAttempt: input.messageText,
        validationModes: plan.validationRequirements,
      });
    }

    // Step 7: Analyze mistake where possible
    let mistakeAnalysis: MistakeAnalysis | undefined;
    if (stepCheck || plan.requiresStepCheck) {
      mistakeAnalysis = analyzeMistake({
        requestId,
        stepCheckResult: stepCheck,
        learnerAttempt: input.messageText,
      });
    }

    // Step 8: Apply subject validation with curriculum-aware deen sensitivity
    let subjectValidation: SubjectValidationResult | undefined;
    if (plan.validationRequirements.length > 0 && plan.requiresAiGeneration === false) {
      subjectValidation = validateSubjectResponse({
        requestId,
        learnerAttempt: input.messageText,
        validationModes: plan.validationRequirements as any,
        deenSourceSensitive: deenSensitive,
      });
    }

    // Step 9: Generate attempt feedback if required
    let attemptFeedback: AttemptFeedback | undefined;
    if (plan.responseMove === 'attempt_feedback' || plan.responseMove === 'mistake_correction') {
      attemptFeedback = generateAttemptFeedback({
        requestId,
        learnerAttempt: input.messageText,
        stepCheckResult: stepCheck,
        mistakeAnalysis,
        allowedAnswerDepth: plan.allowedAnswerDepth,
      });
    }

    // Step 10: Generate practice question if required
    let practiceQuestion: PracticeQuestionPlan | undefined;
    if (plan.requiresPracticeQuestion) {
      practiceQuestion = generatePracticeQuestion({
        requestId,
        subjectContext: input.clientContext?.subjectHint,
        topicContext: input.clientContext?.topicHint,
        learnerGrade: input.learnerGrade,
        learnerAge: input.learnerAge,
      });
    }

    // Step 11: Compose pedagogy prompt and call safe AI gateway if needed
    let responseText: string;
    let policyTags: string[] = [];

    if (plan.requiresAiGeneration) {
      const pedagogyPrompt = composePedagogyPrompt({
        requestId,
        messageText: input.messageText,
        plan,
        intent,
        hint,
        stepCheck,
        mistakeAnalysis,
        attemptFeedback,
        practiceQuestion,
        subjectValidation,
        learnerGrade: input.learnerGrade,
        learnerAge: input.learnerAge,
        deenSourceSensitive: deenSensitive,
        curriculumDirectives: curriculumPacket.teachingMethodRules,
        pacingDirective,
        preferredLanguage: input.preferredLanguage,
        specialist: specialistResult ?? undefined,
      });

      // Call safe generation through the existing Task 009 gateway.
      // R3: the authoritative learner message remains input.messageText; the
      // pedagogy prompt is the policy-owned instruction payload for generation.
      // R4: mock routing may only activate in test mode — production traffic
      // must receive a truthful safe degradation, never synthetic mock text.
      // R3: the prepared Live Chat packet is a GENERATION context (not policy).
      const safeResponse: SafeGenerationResponse = await generateTutorMessage({
        requestId,
        schoolId: input.schoolId,
        tutorLearnerId: input.tutorLearnerId,
        tutorSessionId: input.tutorSessionId,
        messageText: pedagogyPrompt.combinedPrompt,
        learnerGrade: input.learnerGrade,
        learnerAge: input.learnerAge,
        preferredLanguage: input.preferredLanguage,
        clientContext: input.clientContext,
      },
      undefined,
      {
        useMockProvider: process.env.NODE_ENV === 'test',
      },
      {
        preparedPromptPacket: input.preparedPromptPacket,
      });

      responseText = safeResponse.responseText;
      policyTags = safeResponse.policyTags || [];

      // If safe generation failed or policy blocked, use fallback
      if (!responseText || responseText.trim().length === 0) {
        responseText = buildFallbackResponseText(plan, hint, attemptFeedback, practiceQuestion);
      }

      // Validate output with curriculum-aware deen sensitivity
      const outputValidation = validateOrchestrationOutput({
        requestId,
        responseText,
        responseMove: plan.responseMove,
        plan,
        deenSourceSensitive: deenSensitive,
        includesGuidingQuestion: responseText.includes('?'),
        revealsFinalAnswer: false,
      });

      if (!outputValidation.valid && outputValidation.safeResponseText !== responseText) {
        responseText = outputValidation.safeResponseText;
      }
    } else {
      responseText = buildFallbackResponseText(plan, hint, attemptFeedback, practiceQuestion);
    }

    // Step 12: Write learning evidence with curriculum-derived skill tag
    const skillTag = curriculumPacket.subject?.name || curriculumPacket.subject?.normalizedName || input.clientContext?.subjectHint || curriculumPacket.curriculumTrack;
    const evidenceWrite: LearningEvidenceWriteResult = writeLearningEvidence({
      requestId,
      tutorLearnerId: input.tutorLearnerId,
      intent,
      responseMove: plan.responseMove,
      hint,
      stepCheck,
      mistakeAnalysis,
      skillTag,
    });

    // Step 13: Update revision queue
    const revisionUpdate: RevisionQueueUpdateResult = updateRevisionQueue({
      requestId,
      evidenceResult: evidenceWrite,
    });

    // Step 14: Assemble final result
    const assemblerInput: AssemblerInput = {
      input,
      intent,
      responseMove: plan.responseMove,
      responseText,
      stateTransition,
      hint,
      stepCheck,
      practiceQuestion,
      mistakeAnalysis,
      attemptFeedback,
      subjectValidation,
      evidenceWrite,
      revisionUpdate,
      policyTags,
      archiveMetadata: {
        shouldArchive: true,
        archivedUserMessage: true,
        archivedAssistantMessage: true,
      },
      safeMemoryMetadata: {
        shouldUpdateSafeMemory: evidenceWrite.evidenceWritten,
        safeSignals: evidenceWrite.evidenceWritten ? ['learning_turn_completed'] : [],
      },
      clientSafeMetadata: {
        displayMode: input.clientContext?.displayMode,
        curriculumTrack: curriculumPacket.curriculumTrack,
        subjectModuleId: curriculumPacket.subject?.subjectId || curriculumPacket.subjectModule?.moduleId,
        allowedMode: plan.allowedAnswerDepth,
      },
    };

    const result = assembleTutorTurnResult(assemblerInput);

    // Step 14b: R6 — awaited protected Task 011 commit when the turn carries a
    // validated persistence-worthy learning signal. Ordinary explanation turns,
    // tutor-generated questions, hints, greetings, and safety turns skip all
    // Task011 DB work (attempted=false, zero DB latency).
    const task011Identity: ResolvedTutorIdentity = {
      schoolId: input.schoolId,
      studentId: input.tutorLearnerId,
      userId: input.tutorLearnerId,
    };

    const isCorrect = stepCheck?.status === 'correct';
    const isPartial = stepCheck?.status === 'partially_correct';
    const isIncorrect = stepCheck?.status === 'incorrect';
    const hasValidatedOutcome = isCorrect || isPartial || isIncorrect;
    const hasObservedAttempt = stepCheck !== undefined || plan.responseMove === 'attempt_feedback';
    const isSafetyTurn = intent === 'serious_safety_risk';
    const isIntegrityBlocked = policyTags.includes('academic_integrity_blocked') || policyTags.includes('no_final_answer_blocked');

    // R6.1: only validated learning signals justify a protected commit.
    // R5 truth: unobserved attempts, hints, explanations, questions do not.
    const persistenceJustified = !isSafetyTurn && (hasValidatedOutcome || hasObservedAttempt || isIntegrityBlocked);

    let learningCommit: TutorTurnOrchestrationResult['learningCommit'] = {
      attempted: false,
      ok: true,
      attemptPersisted: false,
      stepEvidencePersisted: false,
      masteryAggregated: false,
      revisionScheduled: false,
      warnings: [],
    };

    if (persistenceJustified) {
      try {
        const task011Result = await task011TutorTurnIntegrationService.processValidatedTutorTurn(
          task011Identity,
          {
            requestId,
            subject: curriculumPacket.subject?.name || curriculumPacket.subject?.normalizedName || input.clientContext?.subjectHint || null,
            topic: input.clientContext?.topicHint || null,
            skillIds: skillTag ? [skillTag] : [],
            curriculumTrack: curriculumPacket.curriculumTrack,
            subjectModuleId: curriculumPacket.subject?.subjectId || curriculumPacket.subjectModule?.moduleId || null,
            outcome: hasValidatedOutcome
              ? (isCorrect ? 'correct' : isPartial ? 'partially_correct' : 'incorrect')
              : 'not_evaluated',
            hintLevelUsed: hint?.hintLevel ? parseInt(String(hint.hintLevel), 10) : 0,
            attemptNumber: 1,
            confidence: stepCheck ? (isCorrect ? 0.7 : 0.3) : 0.3,
            mistakeCategories: mistakeAnalysis?.category ? [mistakeAnalysis.category] : [],
            validationModes: plan.validationRequirements ?? [],
            safeSummary: result.responseText?.slice(0, 500) || 'Tutor turn completed',
            learnerResponseSummary: input.messageText?.slice(0, 500) || null,
            expectedAnswerSummary: null,
            isPracticeAttempt: hasObservedAttempt || hasValidatedOutcome,
            isSafetyTurn,
            isIntegrityBlocked,
            isDeenTurn: curriculumPacket.curriculumTrack === 'madrasa_deen' || deenSensitive,
            isSourceSensitive: deenSensitive,
          },
        );

        learningCommit = {
          attempted: true,
          ok: task011Result.ok === true,
          attemptPersisted: task011Result.persistenceResult?.attemptPersisted === true,
          stepEvidencePersisted: task011Result.persistenceResult?.stepEvidencePersisted === true,
          masteryAggregated: task011Result.persistenceResult?.masteryAggregated === true,
          revisionScheduled: task011Result.persistenceResult?.revisionScheduled === true,
          warnings: (task011Result.warnings || []).slice(0, 5).map((w: string) => String(w).slice(0, 120)),
        };

        if (!learningCommit.ok) {
          logger.warn({ requestId }, 'Task 011 protected commit did not fully succeed');
        }
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : 'Unknown persistence error';
        logger.warn({ requestId, error: errMsg }, 'Task 011 protected commit failed');
        learningCommit = {
          attempted: true,
          ok: false,
          attemptPersisted: false,
          stepEvidencePersisted: false,
          masteryAggregated: false,
          revisionScheduled: false,
          warnings: ['Protected learning commit failed.'].slice(0, 5),
        };
      }

      // R6.6: never claim safe-memory success when the protected commit failed.
      if (!learningCommit.ok) {
        result.safeMemoryMetadata.shouldUpdateSafeMemory = false;
        result.safeMemoryMetadata.safeSignals = [];
      }
    }

    logger.info({
      requestId,
      intent,
      responseMove: plan.responseMove,
      stateTransition: stateTransition.finalState,
      evidenceWritten: evidenceWrite.evidenceWritten,
      revisionUpdated: revisionUpdate.revisionUpdated,
      learningCommitAttempted: learningCommit.attempted,
      learningCommitOk: learningCommit.ok,
      // R12: bounded structured specialist observability — no raw learner message.
      specialistKind: specialistResult?.kind ?? 'none',
      specialistStatus: specialistResult?.status ?? 'not_needed',
      externalCallMade: specialistOutcome.decision.requiresExternalRetrieval && specialistResult?.status !== 'blocked',
      verifiedSourceCount: specialistResult?.verifiedSources.length ?? 0,
      degradedReasonCode: specialistResult?.status === 'degraded' || specialistResult?.status === 'blocked'
        ? String(specialistResult?.metadata.degradedReasonCode ?? 'degraded')
        : null,
    }, 'Tutor turn orchestration complete');

    return {
      ...result,
      learningCommit,
      // R12: SAFE specialist metadata only.
      specialist: {
        kind: specialistResult?.kind ?? 'none',
        status: specialistResult?.status ?? 'not_needed',
        reasonCode: specialistOutcome.decision.reasonCode,
        evidenceSectionCount: specialistResult?.evidenceSections.length ?? 0,
        verifiedSourceCount: specialistResult?.verifiedSources.length ?? 0,
        degraded: specialistResult?.status === 'degraded' || specialistResult?.status === 'blocked',
        warnings: specialistResult?.warnings ?? [],
      },
      specialistVerifiedSources: specialistResult?.verifiedSources ?? [],
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown orchestration error';
    logger.error({ requestId, error: errorMessage }, 'Tutor turn orchestration failed');
    return makeFallbackResult(input, 'I am not able to process your request right now. Please try again.', 'orchestration_error');
  }
}

function buildFallbackResponseText(
  plan: LearningResponsePlan,
  hint?: SocraticHint,
  attemptFeedback?: AttemptFeedback,
  practiceQuestion?: PracticeQuestionPlan,
): string {
  if (plan.responseMove === 'safety_support_message') {
    return 'I am here to support you. Please reach out to a trusted adult, teacher, or counsellor who can help you. You matter.';
  }

  if (plan.responseMove === 'deen_referral') {
    return 'Thank you for your question about Islamic matters. I can discuss basic concepts, but for detailed scholarly answers, please consult a qualified scholar or trusted Islamic teacher.';
  }

  if (plan.responseMove === 'safe_refusal') {
    return 'I am not able to answer that question. Please ask something related to your learning.';
  }

  if (plan.responseMove === 'clarify_question') {
    return 'I want to help you. Could you tell me more about what you are trying to learn? Are you looking for an explanation, a hint, practice, or feedback on your work?';
  }

  let text = '';

  if (attemptFeedback) {
    text = `${attemptFeedback.whatIsCorrect}\n\n${attemptFeedback.whatNeedsCorrection}\n\n${attemptFeedback.oneNextStep}\n\n${attemptFeedback.guidingQuestion}\n\n${attemptFeedback.encouragement}`;
    return text;
  }

  if (practiceQuestion) {
    text = `Here is a practice question for you:\n\n${practiceQuestion.questionText}\n\n${practiceQuestion.followUpPrompt}`;
    return text;
  }

  if (hint) {
    text = `${hint.hintText}\n\n${hint.guidingQuestion}`;
    return text;
  }

  if (plan.responseMove === 'concept_explanation' || plan.responseMove === 'summary_and_next_step') {
    text = 'Let me help you understand this better. Could you tell me what you already know about this topic?';
    return text;
  }

  if (plan.responseMove === 'revision_prompt') {
    text = 'Let us review what you have learned. What topic would you like to revise?';
    return text;
  }

  return 'How can I help you with your learning today?';
}
