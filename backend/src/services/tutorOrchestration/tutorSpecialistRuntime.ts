// ─────────────────────────────────────────────────────────────
// Steadfast AI — Specialist Runtime (AI-INTELLIGENCE-03)
//
// ONE specialist ROUTER/ADAPTER for the canonical tutor runtime.
// It is NOT a second tutor prompt system and NOT an agent chain.
//
// Responsibilities (frozen):
//   1. decide whether a specialist is required (deterministic precedence);
//   2. invoke/reuse the existing specialist at most once;
//   3. return bounded specialist context;
//   4. degrade safely;
//   5. never persist protected learner state.
//
// Precedence (R3) — deterministic, one primary specialist per turn:
//   0. safety / blocked / clarification → none
//   1. artifact context request         → artifact
//   2. video context request            → video
//   3. web-current / source-verification → research
//   4. math-focused request             → math
//   5. otherwise                        → none
// ─────────────────────────────────────────────────────────────

import type { TutorIntentResolution } from '../intentResolverContracts';
import type { SourceFreshnessDecision } from '../sourceFreshnessContracts';
import type {
  TutorSpecialistDecision,
  TutorSpecialistKind,
  TutorSpecialistResult,
} from './tutorSpecialistContracts';
import { boundTutorSpecialistResult } from './tutorSpecialistContracts';

// Pure, deterministic math intelligence — reuse only, never the legacy copilot.
import {
  isMathFocusedInput,
  extractMathExpression,
  detectMathTopicType,
} from '../../../../AI/ai/flows/emotional-ai-copilot.math';

// Research specialist — existing production bridge, invoked at most once.
import { runResearchMode } from '../researchModeService';
// Canonical source-seal pipeline — the ONLY authority that may promote a web
// source into learner-visible verified state. Trust tiers are advisory only.
import { sealResearchSources } from '../researchSourceSealService';
import type {
  ResearchSourceCandidate,
  ResearchTrustedSource,
} from '../researchSourceTrustContracts';
import type { VerifiedSource } from '../sourceVerificationContracts';
import { logger } from '../../utils/logger';

// ── Specialist routing input ──

export interface TutorSpecialistRoutingInput {
  requestId: string;
  /** Raw learner message (used only by the deterministic math detector fallback). */
  messageText: string;
  /** Rich resolved intent from the canonical chat context pipeline (authoritative when present). */
  resolvedIntent?: TutorIntentResolution | null;
  /** Already-resolved source freshness decision (authoritative when present). */
  sourceFreshnessDecision?: SourceFreshnessDecision | null;
  /** Prepared artifact evidence from ChatPromptPacket.allowedContext.artifactReasoningEvidence (R7). */
  preparedArtifactEvidence?: {
    groundingStatus?: string;
    summary?: string;
    evidenceRefs?: string[];
    citations?: string[];
    warnings?: string[];
    actionHint?: string;
  } | null;
  /** Prepared bounded video context already executed by Live Chat (R8 + AI-STREAM-2 R15). */
  preparedVideoContext?: import('./tutorSpecialistContracts').PreparedVideoTutorContext | null;
  /** Deen-sensitive turn: generic web research must not bypass approved-source rules (R10). */
  deenSourceSensitive?: boolean;
  /**
   * Verified identity values already supplied to the canonical tutor runtime
   * (AI-INTELLIGENCE-03R R3). Used ONLY as authenticated context for the
   * canonical source seal. Never re-resolved; never taken from user/body IDs.
   */
  sealIdentity?: {
    schoolId: string;
    studentId?: string | null;
    sessionId?: string | null;
  } | null;
}

// ── Step 1: deterministic specialist decision (R3) ──

export function decideSpecialist(
  input: TutorSpecialistRoutingInput,
): TutorSpecialistDecision {
  const primaryIntent = input.resolvedIntent?.primaryIntent;
  const status = input.resolvedIntent?.status;

  // 0. Safety / blocked / clarification → NO specialist external work.
  if (
    status === 'unsafe' ||
    status === 'unsupported' ||
    primaryIntent === 'unsafe' ||
    primaryIntent === 'clarification_needed'
  ) {
    return noSpecialist('safety_or_clarification_path');
  }

  // 1. Artifact context request → artifact (explicit active artifact context is
  //    more authoritative than numbers/keywords in the message).
  if (
    primaryIntent === 'artifact_help' ||
    primaryIntent === 'artifact_question_help' ||
    !!input.preparedArtifactEvidence
  ) {
    return {
      kind: 'artifact',
      reasonCode: 'artifact_context_request',
      confidence: 'high',
      requiresExternalRetrieval: false,
      usesPreparedContext: true,
    };
  }

  // 2. Video context/recommendation request → video.
  if (primaryIntent === 'video_help' || !!input.preparedVideoContext) {
    return {
      kind: 'video',
      reasonCode: 'video_context_request',
      confidence: 'high',
      requiresExternalRetrieval: false,
      usesPreparedContext: true,
    };
  }

  // 3. Approved web-current / source-verification requirement → research.
  const freshness = input.sourceFreshnessDecision;
  const researchRequiredByIntent =
    primaryIntent === 'source_verification' ||
    input.resolvedIntent?.task?.taskKind === 'verify_sources';
  const researchRequiredByFreshness =
    !!freshness &&
    freshness.shouldRetrieveExternalSource === true &&
    freshness.sourceNeed === 'web_current' &&
    freshness.allowedSourceTypes.includes('web');
  if (researchRequiredByIntent || researchRequiredByFreshness) {
    return {
      kind: 'research',
      reasonCode: researchRequiredByIntent
        ? 'source_verification_intent'
        : 'web_current_freshness',
      confidence: 'high',
      requiresExternalRetrieval: true,
      usesPreparedContext: false,
    };
  }

  // 4. Math-focused tutoring request → math (pure local intelligence).
  if (
    primaryIntent === 'explain' ||
    primaryIntent === 'reteach' ||
    primaryIntent === 'simplify' ||
    primaryIntent === 'check_answer' ||
    primaryIntent === undefined
  ) {
    if (isMathFocusedInput(input.messageText)) {
      return {
        kind: 'math',
        reasonCode: 'math_focused_request',
        confidence: 'medium',
        requiresExternalRetrieval: false,
        usesPreparedContext: false,
      };
    }
  }

  // 5. Otherwise → none / canonical general tutor.
  return noSpecialist('canonical_general_tutor');
}

function noSpecialist(reasonCode: string): TutorSpecialistDecision {
  return {
    kind: 'none',
    reasonCode,
    confidence: 'high',
    requiresExternalRetrieval: false,
    usesPreparedContext: false,
  };
}

// ── Step 2: bounded specialist execution (at most once per turn) ──

export async function runSpecialist(
  input: TutorSpecialistRoutingInput,
): Promise<{ decision: TutorSpecialistDecision; result: TutorSpecialistResult | null }> {
  const decision = decideSpecialist(input);

  if (decision.kind === 'none') {
    return {
      decision,
      result: {
        kind: 'none',
        status: 'not_needed',
        promptDirectives: [],
        evidenceSections: [],
        verifiedSources: [],
        warnings: [],
        metadata: {},
      },
    };
  }

  try {
    switch (decision.kind) {
      case 'math':
        return { decision, result: runMathSpecialist(input) };
      case 'artifact':
        return { decision, result: runArtifactSpecialist(input) };
      case 'video':
        return { decision, result: runVideoSpecialist(input) };
      case 'research':
        return { decision, result: await runResearchSpecialist(input) };
      default:
        return { decision, result: null };
    }
  } catch (err: unknown) {
    // Failure-first: structured warning + safe degradation, never false success.
    const message = err instanceof Error ? err.message : 'unknown specialist error';
    logger.warn({ requestId: input.requestId, error: message }, 'Specialist execution failed');
    return {
      decision,
      result: {
        kind: decision.kind,
        status: 'degraded',
        promptDirectives: [],
        evidenceSections: [],
        verifiedSources: [],
        warnings: [`Specialist '${decision.kind}' failed and was degraded safely.`],
        metadata: { degradedReasonCode: 'specialist_error' },
      },
    };
  }
}

// ── R4: Math specialist — pure helpers only, no model, no final answer dump ──

function runMathSpecialist(input: TutorSpecialistRoutingInput): TutorSpecialistResult {
  const expression = extractMathExpression(input.messageText);
  const topicType = detectMathTopicType(input.messageText, undefined, expression ?? undefined);

  // Uncertain math detection → degrade to canonical general tutoring. No fake confidence.
  if (topicType === 'generic' && !expression) {
    return {
      kind: 'math',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Math detection uncertain — canonical general tutoring retained.'],
      metadata: { degradedReasonCode: 'math_detection_uncertain' },
    };
  }

  const directives: string[] = [
    `MATH SPECIALIST FOCUS: detected topic type '${topicType}'.`,
    'Require one-step reasoning: guide the learner through the next single step, not the whole solution.',
  ];
  if (expression) {
    directives.push(`Bounded expression under discussion: "${expression.slice(0, 80)}".`);
  }
  directives.push(
    'Do NOT state or dump the final numeric result. The learner must produce it.',
    'End with a mathematically targeted next-step requirement for the learner.',
  );

  return boundTutorSpecialistResult({
    kind: 'math',
    status: 'ready',
    promptDirectives: directives,
    evidenceSections: [],
    verifiedSources: [],
    warnings: [],
    metadata: {
      topicType,
      hasExpression: !!expression,
    },
  });
}

// ── R7: Artifact specialist — reuse prepared context, zero duplicate retrieval ──

function runArtifactSpecialist(input: TutorSpecialistRoutingInput): TutorSpecialistResult {
  const prepared = input.preparedArtifactEvidence;

  if (!prepared) {
    return {
      kind: 'artifact',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['No prepared artifact evidence available — do not invent artifact content.'],
      metadata: { degradedReasonCode: 'artifact_context_missing' },
    };
  }

  const groundingStatus = prepared.groundingStatus || 'unknown';
  const insufficientGrounding = groundingStatus !== 'grounded' && groundingStatus !== 'sufficient';

  const directives: string[] = [
    'ARTIFACT SPECIALIST: use ONLY the prepared artifact evidence below; do not invent document content.',
  ];
  if (prepared.actionHint) directives.push(`Action hint: ${prepared.actionHint.slice(0, 120)}.`);
  if (insufficientGrounding) {
    directives.push('Artifact grounding is insufficient: state that artifact evidence is limited; never fabricate artifact content.');
  }

  const evidenceSections: string[] = [];
  if (prepared.summary) evidenceSections.push(prepared.summary);
  for (const ref of (prepared.evidenceRefs || []).slice(0, 4)) {
    evidenceSections.push(`Artifact evidence: ${ref}`);
  }

  return boundTutorSpecialistResult({
    kind: 'artifact',
    status: insufficientGrounding ? 'degraded' : 'ready',
    promptDirectives: directives,
    evidenceSections,
    verifiedSources: [],
    warnings: insufficientGrounding
      ? [`Artifact grounding status '${groundingStatus}' — canonical tutor must not invent content from the artifact.`]
      : (prepared.warnings || []).slice(0, 2),
    metadata: {
      groundingStatus,
      evidenceRefCount: (prepared.evidenceRefs || []).length,
    },
  });
}

// ── R8: Video specialist — reuse Live Chat execution, zero duplicate search ──

function runVideoSpecialist(input: TutorSpecialistRoutingInput): TutorSpecialistResult {
  const prepared = input.preparedVideoContext;
  const resource = prepared?.resourceContext ?? null;

  // AI-STREAM-2 R19/R20: resource-aware video specialist. Semantic context is
  // subordinate supporting evidence only — never curriculum, rights, safety,
  // mastery, or source authority. Existing recommendation behavior preserved.
  if (resource && resource.status === 'semantic_ready' && resource.semantic) {
    const semantic = resource.semantic;
    const directives: string[] = [
      'RESOURCE-AWARE VIDEO SPECIALIST: Use only the bounded governed semantic evidence supplied for the active resource.',
      'Treat semantic classifications as ADVISORY teaching context, not curriculum, rights, safety, mastery, or source authority.',
      "Use the resource to make ONE useful Socratic instructional move relevant to the learner's question.",
      'Do not dump the whole video summary.',
      'Do not fabricate video contents, timestamps, titles, channels, URLs or claims outside supplied context.',
      'Never bypass final-answer / integrity / Deen / safeguarding boundaries.',
    ];
    const evidenceSections: string[] = [];
    if (semantic.summary) evidenceSections.push(`Resource summary: ${semantic.summary}`);
    for (const point of (semantic.keyPoints || []).slice(0, 5)) {
      evidenceSections.push(`Key point: ${point}`);
    }
    if ((semantic.concepts || []).length > 0) {
      evidenceSections.push(`Concepts: ${semantic.concepts.slice(0, 4).join('; ')}`);
    }
    if ((semantic.skills || []).length > 0) {
      evidenceSections.push(`Skills: ${semantic.skills.slice(0, 4).join('; ')}`);
    }
    if ((semantic.prerequisites || []).length > 0) {
      evidenceSections.push(`Prerequisite signals: ${semantic.prerequisites.slice(0, 4).join('; ')}`);
    }
    if ((semantic.misconceptionTargets || []).length > 0) {
      evidenceSections.push(`Misconception targets: ${semantic.misconceptionTargets.slice(0, 4).join('; ')}`);
    }
    return boundTutorSpecialistResult({
      kind: 'video',
      status: 'ready',
      promptDirectives: directives,
      evidenceSections,
      verifiedSources: [],
      warnings: (semantic.warnings || []).slice(0, 4),
      metadata: {
        recommendationCount: prepared?.recommendationCount ?? 0,
        videoStatus: prepared?.status || 'resource_grounded',
        semanticContextStatus: 'semantic_ready',
        transcriptUsed: semantic.transcriptUsed,
      },
    });
  }

  // Safe fallback: existing session summary usable, semantic grounding absent.
  if (resource && resource.status === 'safe_session_fallback' && resource.fallbackSummary) {
    const evidence = [resource.fallbackSummary];
    if (prepared?.summary) evidence.push(prepared.summary);
    return boundTutorSpecialistResult({
      kind: 'video',
      status: 'degraded',
      promptDirectives: [
        'VIDEO SPECIALIST: semantic resource grounding unavailable — use only the safe session summary below; do not invent resource-specific content.',
        'Do not fabricate video titles, channels, transcripts, or URLs.',
      ],
      evidenceSections: evidence,
      verifiedSources: [],
      warnings: ['Semantic resource grounding unavailable; ordinary Socratic tutoring continues.'],
      metadata: {
        recommendationCount: prepared?.recommendationCount ?? 0,
        videoStatus: prepared?.status || 'recommended',
        semanticContextStatus: 'safe_session_fallback',
        degradedReasonCode: resource.reasonCode || 'semantic_unavailable',
      },
    });
  }

  if (!prepared || (prepared.recommendationCount === 0 && !resource)) {
    return {
      kind: 'video',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['No safe video context available — degrading to ordinary tutoring; never fabricate videos.'],
      metadata: { degradedReasonCode: 'video_context_missing' },
    };
  }

  return boundTutorSpecialistResult({
    kind: 'video',
    status: 'ready',
    promptDirectives: [
      'VIDEO SPECIALIST: reference only the already-validated video recommendations prepared for this turn.',
      'Do not fabricate video titles, channels, transcripts, or URLs.',
    ],
    evidenceSections: prepared.summary ? [prepared.summary] : [],
    verifiedSources: [],
    warnings: [],
      metadata: {
        recommendationCount: prepared.recommendationCount ?? 0,
        videoStatus: prepared.status || 'recommended',
      },
  });
}

// ── R5/R6: Research specialist — policy-gated, max ONE call, truth-first ──

/**
 * Resolve the ORIGINAL ResearchSourceCandidate corresponding to a sealed
 * source. Deterministic and fail closed:
 *   P1 — exact non-empty candidate.sourceId match (ambiguous → unresolved);
 *   P2 — exact trimmed URL match (case-sensitive; URL paths may be cased);
 *   P3 — when several candidates share the URL, exactly one must ALSO match
 *        the sealed source's trimmed title; otherwise unresolved.
 * Never guesses. The seal may generate sourceId when the candidate had none,
 * hence the URL fallback.
 */
function resolveOriginalCandidate(
  source: ResearchTrustedSource,
  originalCandidates: ResearchSourceCandidate[],
): ResearchSourceCandidate | null {
  if (source.sourceId) {
    const bySourceId = originalCandidates.filter(
      (c) => typeof c.sourceId === 'string' && c.sourceId === source.sourceId,
    );
    if (bySourceId.length === 1) return bySourceId[0];
    if (bySourceId.length > 1) return null;
  }

  const sourceUrl = typeof source.url === 'string' ? source.url.trim() : '';
  if (!sourceUrl) return null;
  const byUrl = originalCandidates.filter(
    (c) => typeof c.url === 'string' && c.url.trim() === sourceUrl,
  );
  if (byUrl.length === 1) return byUrl[0];
  if (byUrl.length > 1) {
    const sourceTitle = typeof source.title === 'string' ? source.title.trim() : '';
    if (sourceTitle) {
      const byUrlAndTitle = byUrl.filter(
        (c) => typeof c.title === 'string' && c.title.trim() === sourceTitle,
      );
      if (byUrlAndTitle.length === 1) return byUrlAndTitle[0];
    }
    return null;
  }
  return null;
}

/**
 * R4/R5: map a sealed source to VerifiedSource ONLY when the canonical seal
 * classified it as a verified, displayable web source with real evidence.
 * No heuristic alternative exists. Every mapped field is a truthful known
 * value from the sealed packet — unknowns stay omitted or 'unknown'.
 *
 * AI-INTELLIGENCE-03R.1 timestamp truth: `retrievedAt` is surfaced ONLY from
 * the ORIGINAL candidate's own retrievedAt. The seal may build evidence with
 * its own current timestamp when the candidate had none — that seal/evidence
 * time is NEVER learner-visible retrieval truth. Timestamp absence never
 * affects verification.
 */
function mapSealedVerifiedSource(
  source: ResearchTrustedSource,
  originalCandidates: ResearchSourceCandidate[],
): VerifiedSource | null {
  if (source.kind !== 'verified_web') return null;
  if (source.trustStatus !== 'verified') return null;
  if (source.displayPolicy !== 'show_as_verified_citation') return null;
  if (!Array.isArray(source.evidence) || source.evidence.length === 0) return null;
  if (typeof source.url !== 'string' || !source.url) return null;
  if (source.blockReasons.length > 0) return null;

  // Timestamp truth: resolve the ORIGINAL candidate; preserve its retrievedAt
  // exactly, or omit the property entirely when it was absent/empty/ambiguous.
  const candidate = resolveOriginalCandidate(source, originalCandidates);
  const candidateRetrievedAt =
    typeof candidate?.retrievedAt === 'string' ? candidate.retrievedAt.trim() : '';

  return {
    id: source.sourceId,
    sourceType: 'web',
    title: source.title || 'Verified source',
    url: source.url,
    domain: source.domain || undefined,
    ...(candidateRetrievedAt ? { retrievedAt: candidateRetrievedAt } : {}),
    freshnessStatus: 'unknown',
    verificationStatus: 'verified',
    supportsClaimIds: [],
    safeSummary: source.safeSummary || source.title || 'Verified source',
    rawContentIncluded: false,
  };
}

export async function runResearchSpecialist(
  input: TutorSpecialistRoutingInput,
): Promise<TutorSpecialistResult> {
  const freshness = input.sourceFreshnessDecision;

  // PRIVACY GATE — fail closed on high/blocked privacy risk.
  if (freshness && (freshness.queryPrivacyRisk === 'high' || freshness.queryPrivacyRisk === 'blocked')) {
    return {
      kind: 'research',
      status: 'blocked',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Research blocked: query privacy risk is too high for external retrieval.'],
      metadata: { degradedReasonCode: 'privacy_gate_blocked' },
    };
  }

  // DEEN GATE — Deen-sensitive generic web freshness must not bypass approved-source rules.
  if (input.deenSourceSensitive) {
    return {
      kind: 'research',
      status: 'blocked',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Research blocked: Deen/source-sensitive turn requires approved sources; generic web research not permitted.'],
      metadata: { degradedReasonCode: 'deen_gate_blocked' },
    };
  }

  // Use only a safeSearchQuery approved by the freshness decision when available.
  const rawQuery = freshness?.safeSearchQuery || input.messageText;
  const query = rawQuery.slice(0, 200);

  let researchOutcome: Awaited<ReturnType<typeof runResearchMode>> | null = null;
  try {
    // At most ONE runResearchMode invocation per learner turn. No retry loop.
    researchOutcome = await runResearchMode({
      query,
      forceWebSearch: true,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown research error';
    return {
      kind: 'research',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Research execution failed — current claims must not be presented as verified.'],
      metadata: { degradedReasonCode: 'research_error', errorSummary: message.slice(0, 120) },
    };
  }

  if (!researchOutcome) {
    return {
      kind: 'research',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Research returned no result — current claims must not be presented as verified.'],
      metadata: { degradedReasonCode: 'research_empty' },
    };
  }

  // R1: provenance-preserving candidates from ACTUAL orchestrator output.
  // Ordinary ResearchSource records (title/url/domain/trustTier only) MAY
  // become candidates, but carry no fabricated retrieval evidence — the
  // canonical seal is therefore EXPECTED to classify them as unverified.
  // That fail-closed outcome is correct and is never worked around.
  const candidates = researchOutcome.sourceCandidates || [];

  // R8: at most ONE canonical seal invocation for this research result.
  let sealOutput: ReturnType<typeof sealResearchSources> | null = null;
  try {
    sealOutput = sealResearchSources({
      candidates,
      authenticatedSchoolId: input.sealIdentity?.schoolId || 'unknown',
      authenticatedStudentId: input.sealIdentity?.studentId ?? null,
      authenticatedSessionId: input.sealIdentity?.sessionId ?? null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'unknown seal error';
    logger.warn({ requestId: input.requestId, error: message }, 'Canonical source seal failed');
    return {
      kind: 'research',
      status: 'degraded',
      promptDirectives: [],
      evidenceSections: [],
      verifiedSources: [],
      warnings: ['Canonical source verification failed — research content must not be presented as verified.'],
      metadata: { degradedReasonCode: 'source_seal_error', errorSummary: message.slice(0, 120) },
    };
  }

  // R4: ONLY canonically sealed verified web sources may become VerifiedSource.
  // trustTier is advisory quality assessment and NEVER a verification authority.
  const verifiedSources = (sealOutput.packet.verifiedWebSources || [])
    .map((source) => mapSealedVerifiedSource(source, candidates))
    .filter((s): s is VerifiedSource => s !== null)
    .slice(0, 3);

  const noVerifiedSources = verifiedSources.length === 0;
  const hasCandidates = candidates.length > 0;

  // R6: truthful status. Never 'ready' merely because a research summary exists.
  const status = noVerifiedSources ? 'degraded' : 'ready';
  const degradedReasonCode = noVerifiedSources
    ? hasCandidates
      ? 'research_sources_unverified'
      : 'research_sources_missing'
    : undefined;

  const directives: string[] = [];
  if (noVerifiedSources) {
    directives.push(
      'Current external evidence is NOT verified. Do not present current or fresh claims as verified facts.',
      'Do not invent citations, sources, URLs, or references.',
      'State evidence limitations honestly; stable background explanation may continue only when safe.',
    );
  } else {
    directives.push(
      'Research specialist retrieved bounded current evidence. Cite only the verified sources provided; never invent citations.',
    );
  }

  // R7: safe research summary is retained as BOUNDED UNVERIFIED context —
  // never as verified evidence.
  const evidenceSections: string[] = [];
  if (researchOutcome.result.summary) {
    evidenceSections.push(`Unverified research context (do not cite as verified): ${researchOutcome.result.summary.slice(0, 600)}`);
  }

  return boundTutorSpecialistResult({
    kind: 'research',
    status,
    promptDirectives: directives,
    evidenceSections,
    verifiedSources,
    warnings: noVerifiedSources
      ? [
          hasCandidates
            ? 'Research returned sources but the canonical seal verified none — no genuine retrieval evidence.'
            : 'No research sources returned for a freshness-required claim.',
        ]
      : [],
    metadata: {
      researchMode: researchOutcome.mode,
      sourceCount: candidates.length,
      verifiedSourceCount: verifiedSources.length,
      sealOk: sealOutput.ok,
      ...(degradedReasonCode ? { degradedReasonCode } : {}),
    },
  });
}
