// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video-Aware Practice Generator v1
// Generates bounded practice items from video session context.
// Deterministic v1 — no LLM dependency. Uses safe context
// summaries, checkpoint results, learner weakness, and
// artifact context. Never uses raw transcripts.
// ─────────────────────────────────────────────────────────────

import type {
  VideoAwarePracticeSession,
  VideoAwarePracticeItem,
  VideoAwarePracticeState,
  VideoAwarePracticeStatus,
  VideoAwarePracticeItemType,
  VideoAwarePracticeDecision,
  VideoAwarePracticeDecisionResult,
  VideoAwarePracticeBasis,
  VideoAwarePracticeSourceVideo,
  VideoAwarePracticeSafety,
  GenerateVideoAwarePracticeRequest,
  VideoAwarePracticeResponse,
} from './videoAwarePracticeContracts';

import {
  getVideoLearningSessionState,
} from './videoLearningSessionStateService';
import type { VideoLearningSession, VideoLearningCheckpoint } from './videoLearningSessionContracts';
import type { ResolvedTutorIdentity } from './tutorStateContracts';
import { getTutorStateForLearner } from './tutorStateService';
import { learnerMemoryResolver } from './learnerMemoryResolver';
import { masteryResolver } from './masteryResolver';

import {
  MIN_WATCHED_PERCENT_FOR_MEANINGFUL_PRACTICE,
  MAX_PRACTICE_SESSION_ITEMS,
  MIN_PRACTICE_SESSION_ITEMS,
  DEFAULT_PRACTICE_SESSION_ITEMS,
  MAX_RECENT_PRACTICE_SESSIONS,
  MAX_RUBRIC_POINTS,
} from './videoAwarePracticeContracts';

// ── Helpers ──

function nowISO(): string {
  return new Date().toISOString();
}

function generateId(): string {
  return `vap_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function uniqueStrings(arr: string[]): string[] {
  return [...new Set(arr.map((s) => s.trim()).filter(Boolean))];
}

/**
 * Generate a topic-focused recall prompt.
 */
function generateRecallItem(
  itemId: string,
  topic: string,
  checkpointId?: string,
  timestampSeconds?: number | null,
): VideoAwarePracticeItem {
  const timestamp = timestampSeconds ?? undefined;
  return {
    practiceItemId: itemId,
    type: 'recall',
    prompt: `What are the key points about "${topic}" from the video? Try to recall at least three main ideas.`,
    expectedAnswerSummary: `Key concepts related to ${topic}`,
    rubricPoints: [
      `Identifies at least 2-3 main ideas about ${topic}`,
      'Uses specific terminology from the lesson',
      'Connects ideas in a logical way',
    ],
    linkedVideoTimestampSeconds: timestamp ?? null,
    linkedCheckpointId: checkpointId || null,
    linkedSkillIds: [],
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a concept-check prompt from a checkpoint.
 */
function generateConceptCheckItem(
  itemId: string,
  checkpoint: VideoLearningCheckpoint,
): VideoAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'concept_check',
    prompt: checkpoint.prompt.length > 300
      ? checkpoint.prompt.slice(0, 297) + '...'
      : checkpoint.prompt,
    expectedAnswerSummary: checkpoint.expectedAnswerSummary || 'Expected explanation of the concept',
    rubricPoints: [
      'Demonstrates understanding of the core concept',
      'Uses relevant examples or reasoning',
      'Avoids common misconceptions about this topic',
    ].slice(0, MAX_RUBRIC_POINTS),
    linkedVideoTimestampSeconds: checkpoint.videoTimestampSeconds ?? null,
    linkedCheckpointId: checkpoint.checkpointId,
    linkedSkillIds: [],
    difficulty: 'medium',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate an application prompt.
 */
function generateApplicationItem(
  itemId: string,
  topic: string,
): VideoAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'application',
    prompt: `How would you apply what you learned about "${topic}" to solve a real problem or explain it to someone else? Provide a concrete example.`,
    expectedAnswerSummary: `Applied understanding of ${topic} with example`,
    rubricPoints: [
      'Provides a concrete, relevant example',
      'Correctly applies concepts from the lesson',
      'Shows depth of understanding beyond recall',
    ],
    linkedVideoTimestampSeconds: null,
    linkedCheckpointId: null,
    linkedSkillIds: [],
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a teach-back prompt for retrieval practice.
 */
function generateTeachBackItem(
  itemId: string,
  topic: string,
): VideoAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'teach_back',
    prompt: `Explain "${topic}" as if you were teaching it to a classmate who hasn't watched the video. Break it down step by step.`,
    expectedAnswerSummary: `Teach-back explanation of ${topic}`,
    rubricPoints: [
      'Explains concepts in own words',
      'Uses a logical step-by-step structure',
      'Covers the essential points from the lesson',
      'Shows understanding of why the concept matters',
    ],
    linkedVideoTimestampSeconds: null,
    linkedCheckpointId: null,
    linkedSkillIds: [],
    difficulty: 'hard',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

/**
 * Generate a reflection item.
 */
function generateReflectionItem(
  itemId: string,
  topic: string,
): VideoAwarePracticeItem {
  return {
    practiceItemId: itemId,
    type: 'reflection',
    prompt: `What part of "${topic}" did you find most challenging and why? What strategy helped you understand it better?`,
    expectedAnswerSummary: `Reflection on learning process for ${topic}`,
    rubricPoints: [
      'Identifies specific challenging aspect',
      'Reflects on learning strategy used',
      'Shows metacognitive awareness',
    ],
    linkedVideoTimestampSeconds: null,
    linkedCheckpointId: null,
    linkedSkillIds: [],
    difficulty: 'easy',
    status: 'not_answered',
    createdAt: nowISO(),
  };
}

// ── Main Generator ──

/**
 * Generate video-aware practice items from video session context.
 * Deterministic v1 generation using safe context summaries.
 * No LLM. No raw transcripts. No answer keys exposed to learner.
 */
export async function generateVideoAwarePractice(
  identity: ResolvedTutorIdentity,
  request: GenerateVideoAwarePracticeRequest,
): Promise<VideoAwarePracticeResponse> {
  const warnings: string[] = [];
  const now = nowISO();

  // 1. Load video learning session state
  const videoState = await getVideoLearningSessionState(identity);
  const activeVideo = videoState.activeVideoSession;

  // 2. If no active or recent video exists, return safe no_active_video
  // Resolve target video — prefer active, fall back to most recent
  let targetVideo = activeVideo;
  if (!targetVideo) {
    const recentVideos = videoState.recentVideoSessions || [];
    targetVideo = recentVideos.length > 0 ? recentVideos[0] : null;

    if (!targetVideo) {
      warnings.push('No active or recent video session found. Please select a video first.');
      return {
        ok: true,
        status: 'not_started',
        activePracticeSession: null,
        recentPracticeSessions: [],
        warnings,
      };
    }
  }

  // 3. Check if video progress is below meaningful threshold
  const watchedPercent = targetVideo.progress?.watchedPercent ?? 0;
  if (watchedPercent < MIN_WATCHED_PERCENT_FOR_MEANINGFUL_PRACTICE && !request.sessionVideoId) {
    warnings.push(
      `Video progress is ${Math.round(watchedPercent)}%. Consider watching more of the video first, or I can generate practice from what you have seen so far.`,
    );
  }

  // 4. Determine topic and skills
  const topic = targetVideo.topic || targetVideo.subject || 'the video content';
  const skillIds = targetVideo.skillIds?.slice(0, 20) || [];

  // 5. Gather checkpoint context
  const checkpoints = targetVideo.checkpoints || [];
  const failedCheckpoints = checkpoints.filter(
    (c) => c.status === 'needs_review' || c.status === 'answered',
  );
  const passedCheckpoints = checkpoints.filter((c) => c.status === 'passed');

  // 6. Gather learner weakness context
  let weaknessIds: string[] = [];
  try {
    const memoryContext = await learnerMemoryResolver.resolveLearnerMemoryContext(identity, {
      sessionId: request.sessionId || null,
      subject: targetVideo.subject || undefined,
      topic: targetVideo.topic || undefined,
      skillIds: targetVideo.skillIds || [],
      maxSignals: 5,
      includeDeleted: false,
    });
    weaknessIds = memoryContext.weaknesses.map((w: any) => w.id).filter(Boolean);
  } catch {
    // Weakness context is optional — proceed without it
  }

  // 7. Determine item types to generate
  const preferredTypes = request.preferredTypes && request.preferredTypes.length > 0
    ? request.preferredTypes
    : undefined;

  const itemCount = Math.min(
    Math.max(request.requestedItemCount ?? DEFAULT_PRACTICE_SESSION_ITEMS, MIN_PRACTICE_SESSION_ITEMS),
    MAX_PRACTICE_SESSION_ITEMS,
  );

  // 8. Generate items
  const items: VideoAwarePracticeItem[] = [];

  // Prioritize failed checkpoints
  for (const cp of failedCheckpoints.slice(0, 2)) {
    if (items.length >= itemCount) break;
    items.push(generateConceptCheckItem(generateId(), cp));
  }

  // Generate recall/teach-back items
  const itemGenerators: Array<{
    type: VideoAwarePracticeItemType;
    fn: () => VideoAwarePracticeItem;
  }> = [];

  if (preferredTypes?.includes('recall') || !preferredTypes) {
    itemGenerators.push({
      type: 'recall',
      fn: () => generateRecallItem(generateId(), topic),
    });
  }
  if (preferredTypes?.includes('teach_back') || !preferredTypes) {
    itemGenerators.push({
      type: 'teach_back',
      fn: () => generateTeachBackItem(generateId(), topic),
    });
  }
  if (preferredTypes?.includes('concept_check') || !preferredTypes) {
    itemGenerators.push({
      type: 'concept_check',
      fn: () => {
        const cpToUse = passedCheckpoints.length > 0
          ? passedCheckpoints[0]
          : null;
        if (cpToUse) return generateConceptCheckItem(generateId(), cpToUse);
        return generateRecallItem(generateId(), topic, undefined, targetVideo.progress?.lastKnownPositionSeconds);
      },
    });
  }
  if (preferredTypes?.includes('application') || !preferredTypes) {
    itemGenerators.push({
      type: 'application',
      fn: () => generateApplicationItem(generateId(), topic),
    });
  }
  if (preferredTypes?.includes('reflection') || !preferredTypes) {
    itemGenerators.push({
      type: 'reflection',
      fn: () => generateReflectionItem(generateId(), topic),
    });
  }

  for (const gen of itemGenerators) {
    if (items.length >= itemCount) break;
    items.push(gen.fn());
  }

  // 9. Build practice session
  const sessionId = generateId();
  const practicedSession: VideoAwarePracticeSession = {
    videoPracticeSessionId: sessionId,
    sessionVideoId: targetVideo.sessionVideoId,
    tutorSessionId: targetVideo.tutorSessionId || null,

    status: 'generated',

    subject: targetVideo.subject || null,
    topic: targetVideo.topic || null,
    skillIds: uniqueStrings(skillIds),
    syllabusObjectiveIds: targetVideo.syllabusObjectiveIds?.slice(0, 10) || [],
    activeArtifactIds: targetVideo.activeArtifactIds?.slice(0, 10) || [],

    sourceVideo: {
      title: targetVideo.title,
      provider: targetVideo.provider || null,
      providerVideoId: targetVideo.providerVideoId || null,
      canonicalUrl: targetVideo.canonicalUrl || null,
      watchedPercent: targetVideo.progress?.watchedPercent ?? null,
      lastKnownPositionSeconds: targetVideo.progress?.lastKnownPositionSeconds ?? null,
    },

    basis: {
      triggerMessage: null,
      triggerIntent: null,
      checkpointIds: checkpoints.map((c) => c.checkpointId),
      learnerWeaknessIds: weaknessIds,
      masterySignalsUsed: [],
      memorySignalsUsed: [],
      videoProgressUsed: true,
      artifactContextUsed: targetVideo.activeArtifactIds.length > 0,
    },

    items,

    misconceptionSummary: [],

    decision: {
      currentDecision: 'give_similar_practice',
      reason: 'Practice session generated. Awaiting learner answers.',
      nextActionPrompt: `Answer the practice questions about "${topic}" from the video.`,
      recommendedReviewAt: null,
      dueAt: null,
    },

    safety: {
      rawTranscriptUsed: false,
      rawTranscriptStored: false,
      answerKeyVisibleToLearner: false,
      warnings: [],
    },

    createdAt: now,
    updatedAt: now,
  };

  return {
    ok: true,
    status: 'generated',
    activePracticeSession: practicedSession,
    recentPracticeSessions: [],
    warnings,
  };
}
