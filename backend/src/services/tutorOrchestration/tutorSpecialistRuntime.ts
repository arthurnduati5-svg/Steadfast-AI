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
  /** Prepared bounded video context already executed by Live Chat (R8). */
  preparedVideoContext?: {
    status?: string;
    recommendationCount?: number;
    summary?: string;
  } | null;
  /** Deen-sensitive turn: generic web research must not bypass approved-source rules (R10). */
  deenSourceSensitive?: boolean;
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

  if (!prepared || prepared.recommendationCount === 0) {
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
      recommendationCount: prepared.recommendationCount,
      videoStatus: prepared.status || 'recommended',
    },
  });
}

// ── R5/R6: Research specialist — policy-gated, max ONE call, truth-first ──

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

  // R6 source truth: only existing canonical trust conversion may populate
  // verifiedSources. Sources come from the existing sourceTrustService
  // evaluation inside runResearchMode; only evaluated/trusted entries pass.
  const orchestratorSources = (researchOutcome.result as { sources?: unknown[] })?.sources || [];
  const verifiedSources = orchestratorSources
    .filter((s): s is { sourceName?: unknown; title?: unknown; url?: unknown; trustTier?: unknown } =>
      typeof s === 'object' && s !== null)
    .filter((s) => {
      const tier = String(s.trustTier || '').toLowerCase();
      // Only explicitly trusted/tier-1 sources may be promoted; otherwise no
      // clean canonical conversion → verifiedSources stays empty (fail closed).
      return tier === 'trusted' || tier === 'tier_1' || tier === 'tier1';
    })
    .slice(0, 3)
    .map((s) => ({
      id: `research_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      sourceType: 'web' as const,
      title: String(s.title || s.sourceName || '').slice(0, 120),
      url: typeof s.url === 'string' && s.url.startsWith('http') ? s.url.slice(0, 300) : undefined,
      freshnessStatus: 'fresh' as const,
      verificationStatus: 'verified' as const,
      supportsClaimIds: [],
      safeSummary: String(s.title || s.sourceName || '').slice(0, 200),
      rawContentIncluded: false as const,
    }));

  const noVerifiedSources = verifiedSources.length === 0;

  const directives: string[] = [];
  if (noVerifiedSources) {
    directives.push(
      'Current external evidence is insufficient. Do not invent or state fresh claims as verified facts.',
    );
  } else {
    directives.push(
      'Research specialist retrieved bounded current evidence. Cite only the verified sources provided; never invent citations.',
    );
  }

  const evidenceSections: string[] = orchestratorSources
    .filter((s): s is { title?: unknown; sourceName?: unknown } => typeof s === 'object' && s !== null)
    .slice(0, 3)
    .map((s) => `Research source: ${String(s.title || s.sourceName || 'untitled').slice(0, 200)}`);

  return boundTutorSpecialistResult({
    kind: 'research',
    status: noVerifiedSources ? 'degraded' : 'ready',
    promptDirectives: directives,
    evidenceSections,
    verifiedSources,
    warnings: noVerifiedSources
      ? ['No trustworthy verified sources found for a freshness-required claim.']
      : [],
    metadata: {
      researchMode: researchOutcome.mode,
      sourceCount: orchestratorSources.length,
      verifiedSourceCount: verifiedSources.length,
    },
  });
}
