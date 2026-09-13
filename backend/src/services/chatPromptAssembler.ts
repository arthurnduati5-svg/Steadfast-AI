// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Prompt Assembler v1
// Transforms ChatTurnExecutionContext into a safe, bounded
// prompt packet for AI generation.
// Never includes forbidden context, raw artifacts, or raw memory.
// ─────────────────────────────────────────────────────────────

import type {
  ChatTurnExecutionContext,
  ChatPromptPacket,
} from './chatPipelineContracts';
import type { ArtifactReasoningIntent, ArtifactGroundingStatus } from './artifactReasoningContracts';
import { artifactPromptPacketBuilder } from './artifactPromptPacketBuilder';

const MAX_ARTIFACT_BLOCKS = 6;
const MAX_MEMORY_SIGNALS = 8;
const MAX_MASTERY_SIGNALS = 8;
const MAX_SOURCE_SUMMARIES = 5;
const MAX_WARNINGS = 10;

export class ChatPromptAssembler {
  /**
   * Assemble a safe, bounded prompt packet from the execution context.
   * Excludes forbidden context. Bounds all arrays. No raw dumps.
   */
  assembleChatPromptPacket(context: ChatTurnExecutionContext): ChatPromptPacket {
    const intentResolution = context.intentResolution;
    const tutorContext = context.tutorContext;
    const task = intentResolution?.task;
    const allowedContext = task?.allowedContext || 'message_only';
    const forbiddenContext = task?.forbiddenContext || [];

    // ── System instructions ──
    // ── Warnings (declared early — artifact reasoning block may push to it) ──
    const warnings = context.warnings.slice(0, MAX_WARNINGS);

    const systemInstructions: string[] = [
      'You are Steadfast Copilot, a Socratic tutor for students. You guide learners through understanding step by step.',
      'Do not give direct answers immediately. Use scaffolding: ask questions, provide hints, and check understanding.',
      'Adapt your explanation to the learner\'s level. Use simple language and concrete examples.',
      'If the learner is confused, break the concept down further. If they show mastery, move to harder material.',
    ];

    // ── Socratic policy packet instructions ──
    const socraticPolicy = context.socraticPolicyContext;

    if (socraticPolicy) {
      // Add Socratic instructions to system instructions
      if (socraticPolicy.socraticInstructions) {
        for (const instr of socraticPolicy.socraticInstructions) {
          if (!systemInstructions.includes(instr)) {
            systemInstructions.push(instr);
          }
        }
      }

      // Add recommended tutor move
      if (socraticPolicy.recommendedTutorMove) {
        systemInstructions.push(`Recommended tutor move: ${socraticPolicy.recommendedTutorMove}`);
      }

    }

    // ── Developer instructions ──
    const developerInstructions: string[] = [];
    if (intentResolution) {
      developerInstructions.push(
        `Resolved learner intent: ${intentResolution.primaryIntent} (confidence: ${intentResolution.confidence}, score: ${intentResolution.confidenceScore.toFixed(2)})`,
      );
      if (intentResolution.secondaryIntents && intentResolution.secondaryIntents.length > 0) {
        developerInstructions.push(
          `Secondary intent(s): ${intentResolution.secondaryIntents.join(', ')}`,
        );
      }
    }

    // ── Tutor task instruction ──
    const tutorTaskInstruction = task?.instruction || 'Respond helpfully to the learner.';

    // ── Learner message ──
    const learnerMessage = context.request.message;

    // ── Allowed context (bounded, safe) ──
    const allowedCtx: ChatPromptPacket['allowedContext'] = {};

    if (socraticPolicy) {
      allowedCtx.socraticPolicy = {
        supportMode: socraticPolicy.supportMode,
        challengeLevel: socraticPolicy.challengeLevel,
        integritySignal: socraticPolicy.integritySignal,
        safeguardingSignal: socraticPolicy.safeguardingSignal,
        noFinalAnswerRequired: socraticPolicy.noFinalAnswerRequired,
        privacyMode: socraticPolicy.privacyMode,
        safeContextSummary: socraticPolicy.safeContextSummary,
      };
    }

    // TutorState
    if (allowedContext === 'combined' || allowedContext === 'tutor_state' || allowedContext === 'learner_profile') {
      if (tutorContext?.tutorState && !forbiddenContext.includes('tutor_state')) {
        allowedCtx.tutorState = {
          activeSubject: tutorContext.session?.activeSubject,
          activeTopic: tutorContext.session?.activeTopic,
          learningMode: tutorContext.session?.learningMode,
        };
      }
    }

    // Learner profile / memory
    if (allowedContext === 'combined' || allowedContext === 'learner_profile' || allowedContext === 'practice_mastery') {
      if (tutorContext?.learnerProfile && !forbiddenContext.includes('learner_profile')) {
        const profile = tutorContext.learnerProfile;

        // Strengths (bounded)
        const strengths = (profile.strengths || []).slice(0, MAX_MEMORY_SIGNALS).map((s: any) => ({
          label: s.label, summary: s.summary, confidence: s.confidence,
        }));

        // Weaknesses (bounded)
        const weaknesses = (profile.weaknesses || []).slice(0, MAX_MEMORY_SIGNALS).map((w: any) => ({
          label: w.label, summary: w.summary, confidence: w.confidence,
        }));

        // Recent mistakes (bounded)
        const recentMistakes = (profile.recentMistakes || []).slice(0, MAX_MEMORY_SIGNALS).map((m: any) => ({
          label: m.label, summary: m.summary, source: m.source,
        }));

        // Misconceptions (bounded)
        const misconceptions = (profile.misconceptionSignals || []).slice(0, MAX_MEMORY_SIGNALS).map((m: any) => ({
          label: m.label, summary: m.summary,
        }));

        // Mastery (bounded)
        const mastery = (profile.masterySignals || []).slice(0, MAX_MASTERY_SIGNALS).map((m: any) => ({
          label: m.label, summary: m.summary, confidence: m.confidence,
        }));

        allowedCtx.learnerProfile = {
          strengths, weaknesses, recentMistakes, misconceptions, mastery,
        };
      }
    }

    // Practice/Mastery signals
    if (allowedContext === 'combined' || allowedContext === 'practice_mastery') {
      if (tutorContext?.learnerProfile?.practiceContext && !forbiddenContext.includes('practice_mastery')) {
        const pc = tutorContext.learnerProfile.practiceContext;
        allowedCtx.masterySignals = (pc.nextPracticeRecommendations || [])
          .slice(0, MAX_MASTERY_SIGNALS)
          .map((r: any) => ({
            action: r.action,
            reason: r.reason,
            priority: r.priority,
          }));
      }
    }

    // Artifact context (bounded blocks, no raw full content)
    if (allowedContext === 'combined' || allowedContext === 'artifact_context') {
      if (tutorContext?.artifactContext && !forbiddenContext.includes('artifact_context')) {
        const relevantBlocks = (tutorContext.artifactContext.relevantBlocks || [])
          .slice(0, MAX_ARTIFACT_BLOCKS)
          .map((block: any) => ({
            blockId: block.blockId,
            kind: block.kind,
            summary: block.summary || (block.text ? block.text.slice(0, 200) : null),
            pageNumber: block.pageNumber,
            sectionTitle: block.sectionTitle,
          }));

        const summaries = (tutorContext.artifactContext.summaries || [])
          .slice(0, MAX_ARTIFACT_BLOCKS)
          .map((s: any) => ({
            id: s.id,
            label: s.label,
            summary: s.summary,
            confidence: s.confidence,
          }));

        allowedCtx.artifactBlocks = relevantBlocks.length > 0 ? relevantBlocks : summaries;
      }
    }

    // Artifact reasoning prompt packet — always included when artifact reasoning context
    // was explicitly resolved, regardless of allowedContext, because the reasoning engine
    // already determined this turn requires artifact-aware handling.
    const artifactReasoningCtx = context.artifactReasoningContext;
    if (artifactReasoningCtx) {
      try {
        const packet = artifactPromptPacketBuilder.build({
          intent: (artifactReasoningCtx.intent || 'teach_from_artifact') as ArtifactReasoningIntent,
          evidence: artifactReasoningCtx.evidence || [],
          learnerMessage: context.request.message,
          groundingStatus: (artifactReasoningCtx.groundingStatus || 'not_grounded') as ArtifactGroundingStatus,
          citations: artifactReasoningCtx.citations || [],
        });

        // Append artifact reasoning instructions to system instructions
        for (const instr of packet.systemInstructions) {
          if (!systemInstructions.includes(instr)) {
            systemInstructions.push(instr);
          }
        }

        // Append developer instructions
        for (const instr of packet.developerInstructions) {
          if (!developerInstructions.includes(instr)) {
            developerInstructions.push(instr);
          }
        }

        // Include artifact evidence sections
        if (packet.artifactEvidenceSections.length > 0) {
          allowedCtx.artifactReasoningEvidence = packet.artifactEvidenceSections;
        }

        // Add safety warnings from artifact reasoning
        for (const warn of packet.safetyWarnings) {
          if (!warnings.includes(warn)) {
            warnings.push(warn);
          }
        }
      } catch {
        // Non-blocking — continue without artifact reasoning packet
      }
    }

    // Source trust context
    if (allowedContext === 'combined' || allowedContext === 'source_trust') {
      if (tutorContext?.sourceTrust && !forbiddenContext.includes('source_trust')) {
        allowedCtx.sourceTrust = {
          status: tutorContext.sourceTrust.status,
          verifiedSourceIds: tutorContext.sourceTrust.allowedSourceIds.slice(0, MAX_SOURCE_SUMMARIES),
          unsupportedBlocked: tutorContext.sourceTrust.unsupportedSourcesBlocked,
        };
      }
    }

    // Video learning session context
    if (allowedContext === 'combined' || allowedContext === 'tutor_state' || allowedContext === 'learner_profile') {
      if (tutorContext?.videoContext && !forbiddenContext.includes('video_learning_session')) {
        const vc = tutorContext.videoContext;
        // Include safe video learning context summary if available
        if (vc.status === 'resolved' || vc.status === 'partial') {
          allowedCtx.videoLearningContext = {
            status: vc.status,
            activeVideoId: vc.activeVideoId || null,
            recentVideoIds: (vc.recommendedVideoIds || []).slice(0, 5),
            notes: vc.notes?.slice(0, 5) || [],
          };
        }
      }

      // Video-aware practice context — safe summaries only, no answer keys
      if (tutorContext?.videoAwarePracticeContext && !forbiddenContext.includes('video_aware_practice')) {
        const vpc = tutorContext.videoAwarePracticeContext;
        allowedCtx.videoAwarePracticeContext = {
          hasActiveVideoPractice: vpc.safeContextSummary.hasActiveVideoPractice,
          topic: vpc.safeContextSummary.topic || null,
          skillIds: (vpc.safeContextSummary.skillIds || []).slice(0, 20),
          currentDecision: vpc.safeContextSummary.currentDecision || null,
          misconceptionSummary: (vpc.safeContextSummary.misconceptionSummary || []).slice(0, 5),
          nextActionPrompt: vpc.safeContextSummary.nextActionPrompt?.slice(0, 200) || null,
          dueReviewSummary: vpc.safeContextSummary.dueReviewSummary || null,
        };
      }

      // Artifact-aware practice context — safe summaries only, no answer keys, no raw artifact text
      if (tutorContext?.artifactAwarePracticeContext && !forbiddenContext.includes('artifact_aware_practice')) {
        const apc = tutorContext.artifactAwarePracticeContext;
        (allowedCtx as Record<string, unknown>).artifactAwarePracticeContext = {
          hasActiveArtifactPractice: apc.safeContextSummary.hasActiveArtifactPractice,
          artifactIds: (apc.safeContextSummary.artifactIds || []).slice(0, 5),
          topic: apc.safeContextSummary.topic || null,
          skillIds: (apc.safeContextSummary.skillIds || []).slice(0, 20),
          currentDecision: apc.safeContextSummary.currentDecision || null,
          misconceptionSummary: (apc.safeContextSummary.misconceptionSummary || []).slice(0, 5),
          nextActionPrompt: apc.safeContextSummary.nextActionPrompt?.slice(0, 200) || null,
          dueReviewSummary: apc.safeContextSummary.dueReviewSummary || null,
        };
      }
    }

    // Intent resolution
    if (allowedContext !== 'message_only') {
      if (intentResolution) {
        allowedCtx.intentResolution = {
          primaryIntent: intentResolution.primaryIntent,
          status: intentResolution.status,
          confidence: intentResolution.confidence,
          clarification: intentResolution.clarification,
        };
      }
    }

    // ── Forbidden context ──
    const forbiddenCtx: string[] = [
      ...forbiddenContext,
    ];

    // Add Socratic forbidden instructions
    if (socraticPolicy?.forbiddenInstructions) {
      for (const instr of socraticPolicy.forbiddenInstructions) {
        if (!forbiddenCtx.includes(instr)) {
          forbiddenCtx.push(instr);
        }
      }
    }

    // Always include answer key and raw content restrictions
    if (!forbiddenCtx.includes('answer_keys_by_default')) {
      forbiddenCtx.push('answer_keys_by_default');
    }
    if (!forbiddenCtx.includes('raw_artifact_content')) {
      forbiddenCtx.push('raw_artifact_content');
    }
    if (!forbiddenCtx.includes('other_students_data')) {
      forbiddenCtx.push('other_students_data');
    }
    if (!forbiddenCtx.includes('hidden_prompts')) {
      forbiddenCtx.push('hidden_prompts');
    }
    if (!forbiddenCtx.includes('raw_private_learner_memory')) {
      forbiddenCtx.push('raw_private_learner_memory');
    }
    if (!forbiddenCtx.includes('raw_transcript')) {
      forbiddenCtx.push('raw_transcript');
    }
    if (!forbiddenCtx.includes('raw_prompts')) {
      forbiddenCtx.push('raw_prompts');
    }
    if (!forbiddenCtx.includes('raw_ai_responses')) {
      forbiddenCtx.push('raw_ai_responses');
    }

    // ── Citation policy ──
    const citationPolicy = {
      allowSourceChips: (allowedContext === 'combined' || allowedContext === 'source_trust'),
      verifiedSourceIds: tutorContext?.sourceTrust?.allowedSourceIds?.slice(0, MAX_SOURCE_SUMMARIES) || [],
      blockedSourceIds: [],
    };

    // ── Cache policy ──
    const cachePolicy = {
      cacheAllowed: false,
      scope: 'no_cache',
      reason: 'TutorTurnContext and personalized AI responses are never cached.',
    };

    // ── Token budget ──
    const tokenBudget = {
      maxArtifactBlocks: MAX_ARTIFACT_BLOCKS,
      maxMemorySignals: MAX_MEMORY_SIGNALS,
      maxMasterySignals: MAX_MASTERY_SIGNALS,
      maxSourceSummaries: MAX_SOURCE_SUMMARIES,
    };

    return {
      systemInstructions,
      developerInstructions,
      tutorTaskInstruction,
      learnerMessage,
      allowedContext: allowedCtx,
      forbiddenContext: forbiddenCtx,
      citationPolicy,
      cachePolicy,
      tokenBudget,
      warnings,
    };
  }
}

export const chatPromptAssembler = new ChatPromptAssembler();
