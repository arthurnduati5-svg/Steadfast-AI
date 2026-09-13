// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor Context Resolver
// Assembles the v1 TutorTurnContext from current state and
// available learner/session data.  Honest about missing systems.
// v1.1: Integrated CacheScopePolicyService and SourceTrustService.
// ─────────────────────────────────────────────────────────────

import type {
  TutorTurnContext,
  TutorState,
  ResolvedTutorIdentity,
  ResolveTutorStateRequest,
  ContextStatus,
  ContextQuality,
  ContextSignal,
} from './tutorStateContracts';
import {
  getTutorStateForLearner,
  patchTutorStateForLearner,
  touchLastResolvedAt,
} from './tutorStateService';
import { cacheScopePolicyService } from './cacheScopePolicyService';
import { kernelSourceTrustService } from './sourceTrustService';
import type { CacheKeyParts } from './cacheScopeContracts';
import type { SourceTrustInput, SourceCandidate } from './sourceTrustContracts';
import { learnerMemoryResolver } from './learnerMemoryResolver';
import { masteryResolver } from './masteryResolver';
import { intentResolverService } from './intentResolverService';
import { artifactService } from './artifactService';
import type { ArtifactContextSummary, ArtifactContextBlock } from './artifactContracts';
import { resolveVideoLearningSessionContext } from './videoLearningSessionResolver';
import { resolveVideoAwarePracticeContext } from './videoAwarePracticeResolver';
import { resolveArtifactAwarePracticeContext } from './artifactAwarePracticeResolver';

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Resolve the full TutorTurnContext for a given learner and request.
 *
 * Stages:
 * 1. Load or create tutor state
 * 2. Apply request-provided hints safely
 * 3. Build learner profile slot (no_data_yet — learner memory not integrated in v1)
 * 4. Build artifact slot (not_integrated_yet)
 * 5. Build video slot (not_integrated_yet)
 * 6. Build sourceTrust slot (v1: integrated with SourceTrustService)
 * 7. Build cacheScope (v1: integrated with CacheScopePolicyService)
 * 8. Build resolverMeta
 * 9. Persist lastResolvedAt
 * 10. Return TutorTurnContext
 */
export async function resolveTutorContext(
  identity: ResolvedTutorIdentity,
  request: ResolveTutorStateRequest,
): Promise<TutorTurnContext> {
  const warnings: string[] = [];
  const errors: string[] = [];

  // ── Stage 1: Load or create tutor state ──
  let state: TutorState;
  state = await getTutorStateForLearner(identity);

  // ── Stage 2: Apply request-provided hints safely ──
  // Only apply non-empty, explicitly provided fields from the request.
  // This does NOT override authenticated identity fields.
  const patchFields: Record<string, any> = {};
  if (request.sessionId) patchFields.sessionId = request.sessionId;
  if (request.learningMode) patchFields.learningMode = request.learningMode;
  if (request.activeSubject) patchFields.activeSubject = request.activeSubject;
  if (request.activeTopic) patchFields.activeTopic = request.activeTopic;
  if (request.activeSkillIds && request.activeSkillIds.length > 0) {
    patchFields.activeSkillIds = request.activeSkillIds;
  }
  if (request.activeArtifactIds && request.activeArtifactIds.length > 0) {
    patchFields.activeArtifactIds = request.activeArtifactIds;
  }
  if (request.activeVideoId !== undefined) patchFields.activeVideoId = request.activeVideoId;
  if (request.primaryLanguage) patchFields.primaryLanguage = request.primaryLanguage;
  if (request.supportLanguage !== undefined) patchFields.supportLanguage = request.supportLanguage;

  if (Object.keys(patchFields).length > 0) {
    try {
      state = await patchTutorStateForLearner(identity, patchFields as any);
    } catch (err) {
      warnings.push(`Failed to apply request hints to tutor state: ${String(err)}`);
    }
  }

  // ── Stage 3: Build learner profile slot ──
  // v1.2: Integrated with Durable Learner Memory v1
  // v1.3: Integrated with Practice and Mastery Scaffolding v1
  let learnerProfileStatus: ContextStatus = 'no_data_yet';
  let strengths: ContextSignal[] = [];
  let weaknesses: ContextSignal[] = [];
  let recentMistakes: ContextSignal[] = [];
  let misconceptionSignals: ContextSignal[] = [];
  let masterySignals: ContextSignal[] = [];
  const profileNotes: string[] = [];

  try {
    const memoryContext = await learnerMemoryResolver.resolveLearnerMemoryContext(identity, {
      sessionId: request.sessionId || null,
      subject: state.activeSubject || undefined,
      topic: state.activeTopic || undefined,
      skillIds: state.activeSkillIds,
      artifactIds: state.activeArtifactIds,
      maxSignals: 8,
      includeDeleted: false,
    });

    learnerProfileStatus = memoryContext.status as ContextStatus;
    strengths = memoryContext.strengths;
    weaknesses = memoryContext.weaknesses;
    recentMistakes = memoryContext.recentMistakes;
    misconceptionSignals = memoryContext.misconceptionSignals;
    masterySignals = memoryContext.masterySignals;

    if (memoryContext.status === 'no_data_yet') {
      profileNotes.push('No durable learner memory exists yet. Memory is built as the student studies with the tutor.');
    } else if (memoryContext.status === 'resolved') {
      profileNotes.push(`Durable learner memory resolved: ${memoryContext.memoryIdsUsed.length} memory signals active.`);
    } else if (memoryContext.status === 'partial') {
      profileNotes.push('Learner memory partially resolved. Some data may be unavailable.');
    } else if (memoryContext.status === 'error') {
      profileNotes.push('Learner memory resolver encountered an error. Proceeding without memory context.');
    }

    // Add resolver warnings
    if (memoryContext.warnings.length > 0) {
      warnings.push(...memoryContext.warnings);
    }
    if (memoryContext.errors.length > 0) {
      errors.push(...memoryContext.errors);
    }
  } catch (err) {
    learnerProfileStatus = 'error';
    console.error('[TutorContextResolver] Learner memory resolver failed:', err);
    profileNotes.push(`Failed to resolve learner memory: ${String(err)}. Proceeding without memory context.`);
  }

  // ── Stage 3b: Integrate mastery/practice context ──
  // v1.3: Practice and Mastery Scaffolding v1 — enriches learnerProfile
  // with practice-backed signals and next-practice recommendations.
  let practiceContextStatus: ContextStatus = 'no_data_yet';
  let practiceRecommendations: any[] = [];
  let practiceReviewDueSignals: ContextSignal[] = [];
  const practiceNotes: string[] = [];

  try {
    const mpContext = await masteryResolver.resolveMasteryPracticeContext(identity, {
      sessionId: request.sessionId || null,
      subject: state.activeSubject || undefined,
      topic: state.activeTopic || undefined,
      skillIds: state.activeSkillIds,
      artifactIds: state.activeArtifactIds,
      maxSignals: 8,
      includeReviewDue: true,
      includeNextPractice: true,
    });

    if (mpContext.status === 'resolved' || mpContext.status === 'partial') {
      // Merge mastery signals into learnerProfile
      if (mpContext.masterySignals.length > 0) {
        masterySignals = [...mpContext.masterySignals, ...masterySignals].slice(0, 12);
        practiceNotes.push(`${mpContext.masterySignals.length} mastery snapshot(s) resolved from practice.`);
      }

      // Merge misconception signals from practice into learnerProfile
      if (mpContext.misconceptionSignals.length > 0) {
        misconceptionSignals = [...mpContext.misconceptionSignals, ...misconceptionSignals].slice(0, 12);
        practiceNotes.push(`${mpContext.misconceptionSignals.length} misconception signal(s) resolved from practice.`);
      }

      // Merge recent practice signals into recentMistakes where appropriate
      if (mpContext.recentPracticeSignals.length > 0) {
        const incorrectPracticeSignals = mpContext.recentPracticeSignals.filter(
          (s: any) => s.source === 'practice:incorrect',
        );
        if (incorrectPracticeSignals.length > 0) {
          const asMistakes: ContextSignal[] = incorrectPracticeSignals.map((s: any) => ({
            id: s.id,
            label: s.label,
            summary: s.summary,
            source: `practice:incorrect`,
            confidence: s.confidence,
            updatedAt: s.updatedAt,
          }));
          recentMistakes = [...asMistakes, ...recentMistakes].slice(0, 12);
          practiceNotes.push(`${incorrectPracticeSignals.length} incorrect practice signal(s) merged into recent mistakes.`);
        }
      }

      // Merge review due signals
      if (mpContext.reviewDueSignals.length > 0) {
        practiceReviewDueSignals = mpContext.reviewDueSignals as any;
        practiceNotes.push(`${mpContext.reviewDueSignals.length} review(s) due.`);
      }

      // Store next-practice recommendations
      if (mpContext.nextPracticeRecommendations.length > 0) {
        practiceRecommendations = mpContext.nextPracticeRecommendations;
        practiceNotes.push(`${mpContext.nextPracticeRecommendations.length} next-practice recommendation(s) available.`);
      }

      practiceContextStatus = mpContext.status === 'resolved' ? 'resolved' : 'partial';

      if (mpContext.warnings.length > 0) {
        warnings.push(...mpContext.warnings);
      }
      if (mpContext.errors.length > 0) {
        errors.push(...mpContext.errors);
      }

      // Update learnerProfile status if we now have data
      if (learnerProfileStatus === 'no_data_yet' && practiceContextStatus === 'resolved') {
        learnerProfileStatus = 'resolved';
      } else if (learnerProfileStatus === 'error' && practiceContextStatus === 'resolved') {
        learnerProfileStatus = 'partial';
      }
    }

    if (mpContext.status === 'no_data_yet') {
      practiceNotes.push('No practice or mastery data yet. Practice data builds as the learner completes practice attempts.');
    }

    if (mpContext.errors.length > 0) {
      practiceNotes.push('Mastery/practice resolver encountered errors. Proceeding with available data.');
    }
  } catch (err) {
    practiceContextStatus = 'error';
    practiceNotes.push(`Failed to resolve practice/mastery context: ${String(err)}. Proceeding without it.`);
  }

  // ── Stage 4: Artifact context (v1 integrated with artifact pipeline) ──
  const artifactNotes: string[] = [];
  let artifactContextStatus: ContextStatus = 'no_data_yet';
  const artifactSummaries: ArtifactContextSummary[] = [];
  const relevantBlocks: ArtifactContextBlock[] = [];

  if (state.activeArtifactIds.length > 0) {
    let loadedCount = 0;
    for (const aid of state.activeArtifactIds) {
      try {
        const full = await artifactService.getFullArtifact(identity, aid);
        if (full) {
          artifactSummaries.push({
            artifactId: full.artifact.artifactId,
            title: full.artifact.title,
            kind: full.artifact.kind,
            parseStatus: full.artifact.parseStatus,
            structureQuality: full.artifact.structureQuality,
            blockCount: full.artifact.blockCount,
            questionCount: full.artifact.questionCount,
            diagramCount: full.artifact.diagramCount,
            answerKeyCount: full.artifact.answerKeyCount,
            contentFingerprint: full.artifact.contentFingerprint,
          });
          loadedCount++;

          // Include lightweight block summaries (bounded)
          for (const block of full.blocks.slice(0, 6)) {
            relevantBlocks.push({
              blockId: block.blockId,
              artifactId: block.artifactId,
              kind: block.kind,
              text: block.text ? (block.text.length > 200 ? block.text.slice(0, 200) + '...' : block.text) : null,
              summary: block.summary || null,
              pageNumber: block.pageNumber || null,
              sectionTitle: block.sectionTitle || null,
              confidence: block.confidence,
              provenance: block.provenance,
            });
          }
        } else {
          artifactNotes.push(`Artifact ${aid} not found or inaccessible.`);
        }
      } catch (err) {
        artifactNotes.push(`Failed to load artifact ${aid}: ${String(err)}`);
      }
    }

    if (loadedCount === state.activeArtifactIds.length) {
      artifactContextStatus = 'resolved';
    } else if (loadedCount > 0) {
      artifactContextStatus = 'partial';
    } else if (artifactNotes.some((n) => n.startsWith('Failed to load'))) {
      artifactContextStatus = 'error';
    } else {
      artifactContextStatus = 'not_integrated_yet';
    }

    artifactNotes.push(`Loaded ${loadedCount}/${state.activeArtifactIds.length} active artifacts.`);
  } else {
    artifactNotes.push('No active artifact IDs in tutor state.');
  }

  // Feed artifact fingerprints into cache key parts
  const artifactFingerprintFromService = artifactSummaries.length > 0
    ? simpleHash(artifactSummaries.map((s) => s.contentFingerprint).sort().join(','))
    : null;

  // ── Stage 5: Video context (v1: Video Learning Session integrated) ──
  const videoNotes: string[] = [];
  let videoLearningContext: import('./videoLearningSessionContracts').VideoLearningSessionResolverOutput | null = null;

  try {
    videoLearningContext = await resolveVideoLearningSessionContext(identity);
    if (videoLearningContext.safeContextSummary.hasActiveVideo) {
      videoNotes.push(`Active video session: ${videoLearningContext.safeContextSummary.title || 'Untitled'}`);
      if (videoLearningContext.safeContextSummary.topic) {
        videoNotes.push(`Video topic: ${videoLearningContext.safeContextSummary.topic}`);
      }
      if (videoLearningContext.safeContextSummary.progressSummary) {
        videoNotes.push(`Progress: ${videoLearningContext.safeContextSummary.progressSummary}`);
      }
      if (videoLearningContext.safeContextSummary.checkpointSummary) {
        videoNotes.push(`Checkpoints: ${videoLearningContext.safeContextSummary.checkpointSummary}`);
      }
      if (videoLearningContext.safeContextSummary.followUpSummary) {
        videoNotes.push(`Follow-up: ${videoLearningContext.safeContextSummary.followUpSummary}`);
      }
    } else if (state.activeVideoId) {
      videoNotes.push(`Active video ID tracked in tutor state: ${state.activeVideoId}.`);
    }

    if (videoLearningContext.safeContextSummary.warnings.length > 0) {
      warnings.push(...videoLearningContext.safeContextSummary.warnings);
    }
  } catch (err) {
    videoNotes.push(`Failed to resolve video learning context: ${String(err)}`);
    if (state.activeVideoId) {
      videoNotes.push(`Active video ID tracked in tutor state: ${state.activeVideoId}.`);
    }
  }

  // ── Stage 5b: Video-aware practice context (v1: Video-Aware Practice Loop) ──
  let videoAwarePracticeContext: import('./tutorStateContracts').TutorTurnContext['videoAwarePracticeContext'] = null;
  try {
    const practiceResolverOutput = await resolveVideoAwarePracticeContext(identity);
    if (practiceResolverOutput.safeContextSummary.hasActiveVideoPractice) {
      videoAwarePracticeContext = {
        activePracticeSession: practiceResolverOutput.activePracticeSession,
        safeContextSummary: practiceResolverOutput.safeContextSummary,
      };
      videoNotes.push(`Active video practice: ${practiceResolverOutput.safeContextSummary.topic || 'Untitled'} (${practiceResolverOutput.safeContextSummary.currentDecision || 'generated'})`);
      if (practiceResolverOutput.safeContextSummary.nextActionPrompt) {
        videoNotes.push(`Next action: ${practiceResolverOutput.safeContextSummary.nextActionPrompt.slice(0, 120)}`);
      }
    }
  } catch (err) {
    videoNotes.push(`Failed to resolve video-aware practice context: ${String(err)}`);
  }

  // ── Stage 5c: Artifact-aware practice context (v1: Artifact-Aware Practice Loop) ──
  let artifactAwarePracticeContext: import('./tutorStateContracts').TutorTurnContext['artifactAwarePracticeContext'] = null;
  try {
    const artifactPracticeResolverOutput = await resolveArtifactAwarePracticeContext(identity);
    if (artifactPracticeResolverOutput.safeContextSummary.hasActiveArtifactPractice) {
      artifactAwarePracticeContext = {
        activePracticeSession: artifactPracticeResolverOutput.activePracticeSession as import('./artifactAwarePracticeContracts').ArtifactAwarePracticeSession,
        safeContextSummary: artifactPracticeResolverOutput.safeContextSummary,
      };
      artifactNotes.push(`Active artifact practice: ${artifactPracticeResolverOutput.safeContextSummary.topic || 'Untitled'} (${artifactPracticeResolverOutput.safeContextSummary.currentDecision || 'generated'})`);
      if (artifactPracticeResolverOutput.safeContextSummary.nextActionPrompt) {
        artifactNotes.push(`Next action: ${artifactPracticeResolverOutput.safeContextSummary.nextActionPrompt.slice(0, 120)}`);
      }
    }
  } catch (err) {
    artifactNotes.push(`Failed to resolve artifact-aware practice context: ${String(err)}`);
  }

  // ── Stage 6: Source trust (v1 integrated) ──
  // Build source candidates from available context
  const sourceCandidates: SourceCandidate[] = [];
  // In v1, no source retrieval records are passed through the resolver yet.
  // The AI flow layer has its own source-trust module for research results.
  // Future builds will pass retrieval records and artifact sources here.

  const sourceTrustInput: SourceTrustInput = {
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    sessionId: state.sessionId || request.sessionId || null,
    requestedSources: sourceCandidates,
    retrievalRecords: undefined,
    // Pass artifact-derived sources into source trust
    artifactSources: artifactSummaries.length > 0
      ? artifactSummaries.map((s) => ({
          title: s.title,
          kind: 'artifact' as const,
          artifactId: s.artifactId,
          contentFingerprint: s.contentFingerprint,
          displayAllowed: true,
        }))
      : undefined,
    teacherSources: undefined,
    existingVerifiedSources: undefined,
  };

  const sourceTrustDecision = kernelSourceTrustService.resolve(sourceTrustInput);

  // Merge warnings from source trust
  if (sourceTrustDecision.warnings.length > 0) {
    warnings.push(...sourceTrustDecision.warnings);
  }
  if (sourceTrustDecision.errors.length > 0) {
    errors.push(...sourceTrustDecision.errors);
  }

  const sourceNotes: string[] = [
    'Source trust guard v1 is integrated into the tutor context kernel.',
    'SourceTrustService resolved with v1 SourceTrustDecision.',
  ];
  if (sourceTrustDecision.status === 'no_sources') {
    sourceNotes.push('No source candidates were provided — status is no_sources.');
  } else if (sourceTrustDecision.status === 'verified' || sourceTrustDecision.status === 'partial') {
    sourceNotes.push(`${sourceTrustDecision.sourceCount} verified source(s) resolved.`);
  }
  if (sourceTrustDecision.unsupportedSourcesBlocked) {
    sourceNotes.push(`${sourceTrustDecision.unsupportedCount} unsupported source(s) blocked.`);
  }

  // ── Stage 7: Cache scope (v1 integrated) ──
  const artifactFingerprint = artifactFingerprintFromService
    || (state.activeArtifactIds.length > 0
      ? simpleHash([...state.activeArtifactIds].sort().join(','))
      : null);
  const videoFingerprint = state.activeVideoId
    ? simpleHash(state.activeVideoId)
    : null;

  const cacheKeyParts: CacheKeyParts = {
    schoolId: identity.schoolId,
    studentId: identity.studentId,
    sessionId: state.sessionId || request.sessionId || null,
    learningMode: state.learningMode,
    activeSubject: state.activeSubject || null,
    activeTopic: state.activeTopic || null,
    primaryLanguage: state.primaryLanguage || 'en',
    supportLanguage: state.supportLanguage || null,
    artifactIds: state.activeArtifactIds,
    artifactFingerprint,
    videoId: state.activeVideoId || null,
    videoFingerprint,
    sourceFingerprint: sourceTrustDecision.sourceFingerprint || null,
  };

  // TutorTurnContext is NEVER cached
  const cacheDecision = cacheScopePolicyService.noCacheForTurnContext(cacheKeyParts);

  // Add cache warnings
  if (cacheDecision.warnings.length > 0) {
    warnings.push(...cacheDecision.warnings);
  }

  // ── Stage 8: Build resolverMeta ──
  const contextQuality: ContextQuality =
    errors.length > 0 ? 'error'
    : state.stateQuality === 'resolved' ? 'resolved'
    : state.stateQuality === 'partial' ? 'partial'
    : 'degraded';

  // ── Stage 9: Persist lastResolvedAt ──
  try {
    await touchLastResolvedAt(identity);
  } catch (err) {
    warnings.push(`Failed to persist lastResolvedAt: ${String(err)}`);
  }

  // ── Stage 9b: Optional Intent Resolution (v1) ──
  // If the request includes a message, resolve intent and attach it to the context.
  // IntentResolverService must NOT call TutorContextResolver to avoid recursion.
  let intentResolution: any = null;
  if (request.message && String(request.message).trim().length > 0) {
    try {
      const resolution = await intentResolverService.resolveTutorIntent({
        identity,
        request: {
          message: request.message,
          sessionId: request.sessionId || state.sessionId || null,
          activeSubject: state.activeSubject || undefined,
          activeTopic: state.activeTopic || undefined,
          activeSkillIds: state.activeSkillIds,
          activeArtifactIds: state.activeArtifactIds,
          activeVideoId: state.activeVideoId || null,
        },
        tutorContext: null, // Context is already being built above; pass null to avoid circular dependency
        practiceMasteryContext: {
          status: practiceContextStatus,
          masterySignals,
          misconceptionSignals,
          reviewDueSignals: practiceReviewDueSignals,
          nextPracticeRecommendations: practiceRecommendations,
        },
      });
      intentResolution = resolution;
    } catch (err) {
      warnings.push(`Intent resolution failed: ${String(err)}. Proceeding without intent context.`);
    }
  }

  // ── Stage 10: Assemble and return TutorTurnContext ──
  const resolvedAt = nowISO();

  return {
    intentResolution,
    identity: {
      studentId: identity.studentId,
      schoolId: identity.schoolId,
      userId: identity.userId || null,
      role: identity.role || null,
      grade: identity.grade || null,
      ageBand: identity.ageBand || null,
    },
    session: {
      sessionId: state.sessionId || request.sessionId || null,
      learningMode: state.learningMode,
      activeSubject: state.activeSubject || null,
      activeTopic: state.activeTopic || null,
      activeSkillIds: state.activeSkillIds,
      primaryLanguage: state.primaryLanguage || 'en',
      supportLanguage: state.supportLanguage || null,
    },
    tutorState: state,
    learnerProfile: {
      status: learnerProfileStatus,
      strengths,
      weaknesses,
      recentMistakes,
      misconceptionSignals,
      masterySignals,
      notes: profileNotes,
      practiceContext: practiceContextStatus !== 'no_data_yet' ? {
        status: practiceContextStatus,
        nextPracticeRecommendations: practiceRecommendations as any,
        reviewDueSignals: practiceReviewDueSignals as any,
        notes: practiceNotes,
      } : undefined,
    },
    artifactContext: {
      status: artifactContextStatus,
      activeArtifactIds: state.activeArtifactIds,
      relevantBlocks,
      summaries: artifactSummaries.map((s) => ({
        id: s.artifactId,
        label: s.title,
        summary: `${s.kind} artifact (${s.parseStatus}, ${s.blockCount} blocks, ${s.questionCount} questions)`,
        source: 'artifact',
        confidence: s.parseStatus === 'parsed' ? 0.9 : s.parseStatus === 'partial' ? 0.5 : 0.2,
        updatedAt: null,
      })),
      notes: artifactNotes,
    },
    videoContext: {
      status: videoLearningContext?.safeContextSummary.hasActiveVideo
        ? 'resolved'
        : state.activeVideoId && !videoLearningContext?.safeContextSummary.hasActiveVideo
          ? 'not_integrated_yet'
          : state.activeVideoId
            ? 'partial'
            : 'no_data_yet',
      activeVideoId: state.activeVideoId || videoLearningContext?.activeVideoSession?.sessionVideoId || null,
      transcriptBlocks: [],
      recommendedVideoIds: videoLearningContext?.recentVideoSessions.map((s) => s.sessionVideoId) || [],
      notes: videoNotes,
    },
    sourceTrust: {
      status: sourceTrustDecision.status as TutorTurnContext['sourceTrust']['status'],
      allowedSourceIds: sourceTrustDecision.verifiedSources.map((vs) => vs.sourceId),
      verifiedSources: sourceTrustDecision.verifiedSources,
      unsupportedSourcesBlocked: sourceTrustDecision.unsupportedSourcesBlocked,
      notes: sourceNotes,
    },
    videoAwarePracticeContext,
    artifactAwarePracticeContext,
    cacheScope: {
      cacheAllowed: cacheDecision.cacheAllowed,
      scope: cacheDecision.scope as TutorTurnContext['cacheScope']['scope'],
      keyParts: {
        schoolId: identity.schoolId,
        studentId: identity.studentId,
        sessionId: state.sessionId || request.sessionId || null,
        activeSubject: state.activeSubject || null,
        activeTopic: state.activeTopic || null,
        learningMode: state.learningMode,
        artifactHash: artifactFingerprint,
        videoHash: videoFingerprint,
      },
      reason: cacheDecision.reason,
    },
    resolverMeta: {
      contextQuality,
      resolvedAt,
      resolverVersion: 'tutor-context-kernel-v1',
      warnings,
      errors,
    },
  };
}

/**
 * Simple hash utility for cache key segments.
 */
function simpleHash(value: string): string {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    const char = value.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
