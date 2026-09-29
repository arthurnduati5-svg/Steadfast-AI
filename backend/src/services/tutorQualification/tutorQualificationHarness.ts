// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor Qualification Harness (AI-INTELLIGENCE-04)
//
// Reuses the Practice Pad PP-11 qualification ENGINEERING PATTERN:
//   stable corpus → deterministic runner → explicit observed vs
//   expected → critical failure tags → metrics → qualification
//   report → critical override → honest calibration limitations.
//
// The harness calls EXISTING canonical services only. It evaluates
// them; it never duplicates their logic. No live model, no network,
// no production DB. Provider semantic quality stays structurally
// UNVERIFIED_PROVIDER_PENDING (§6/§23).
// ─────────────────────────────────────────────────────────────

import { performance } from 'node:perf_hooks';

import type {
  TutorQualificationCase,
  TutorQualificationCaseResult,
  TutorQualificationCriticalTag,
  TutorQualificationDimension,
  TutorQualificationMetrics,
  TutorQualificationReport,
} from './tutorQualificationContracts';
import {
  TUTOR_QUALIFICATION_CORPUS_VERSION,
  TUTOR_QUALIFICATION_THRESHOLDS,
} from './tutorQualificationContracts';
import {
  TUTOR_QUALIFICATION_CORPUS_V1,
  AI04_SYNTHETIC_IDS,
} from './tutorQualificationCorpusV1';

// Canonical runtime under qualification — reuse only, never duplicate.
import { classifyLearnerIntent } from '../tutorOrchestration/tutorTurnIntentClassifier';
import { planLearningResponse } from '../tutorOrchestration/learningResponsePlanner';
import { composePedagogyPrompt } from '../tutorOrchestration/tutorPedagogyPromptComposer';
import { validateOrchestrationOutput } from '../tutorOrchestration/tutorOrchestrationOutputValidator';
import { writeLearningEvidence } from '../tutorOrchestration/learningEvidenceWriteRuntime';
import { decideSpecialist, runSpecialist } from '../tutorOrchestration/tutorSpecialistRuntime';
import { classifyAcademicIntegritySignal } from '../academicIntegrityGuardService';
import { SourceFreshnessRoutingService } from '../sourceFreshnessRoutingService';
import { sealResearchSources } from '../researchSourceSealService';
import { ArtifactSafetyGuardService } from '../artifactSafetyGuardService';
import { ArtifactGroundingValidator } from '../artifactGroundingValidator';
import type { ArtifactStructuredBlock } from '../artifactUnderstandingContracts';
import type { ArtifactReasoningEvidence } from '../artifactReasoningContracts';
import type { LearningResponsePlan } from '../tutorOrchestration/learningResponsePlannerContracts';
import type { TutorTurnIntent } from '../tutorOrchestration/tutorOrchestrationContracts';
import type { TutorSpecialistResult } from '../tutorOrchestration/tutorSpecialistContracts';
import type { SourceFreshnessDecision } from '../sourceFreshnessContracts';
import type { TutorIntentResolution } from '../intentResolverContracts';
import type { ResearchSourceCandidate } from '../researchSourceTrustContracts';

const freshnessService = new SourceFreshnessRoutingService();
const artifactSafety = new ArtifactSafetyGuardService();
const artifactGrounding = new ArtifactGroundingValidator();

// ── Local helpers (harness-owned fixture builders, not runtime logic) ──

function planForFixture(fixture: { intent?: string; deenSourceSensitive?: boolean }): LearningResponsePlan {
  return planLearningResponse({
    requestId: 'req_ai04_fixture',
    messageText: 'ai04 fixture message',
    intent: (fixture.intent as TutorTurnIntent) ?? 'ask_concept',
    policyPacket: undefined,
    curriculumValidationModes: [],
    deenSourceSensitive: fixture.deenSourceSensitive === true,
  });
}

function makeResolution(input: {
  status?: string;
  primaryIntent?: string;
}): TutorIntentResolution {
  return {
    resolutionId: 'res_ai04',
    status: (input.status as TutorIntentResolution['status']) ?? 'resolved',
    primaryIntent: (input.primaryIntent as TutorIntentResolution['primaryIntent']) ?? 'general_chat',
    secondaryIntents: [],
    task: { taskKind: 'general_response' } as TutorIntentResolution['task'],
    confidence: 'high',
    confidenceScore: 0.9,
    evidence: [],
    clarification: null,
    contextUse: {} as TutorIntentResolution['contextUse'],
    safety: {} as TutorIntentResolution['safety'],
    downstream: {
      suggestedService: 'tutor_chat',
      shouldCallAi: true,
      shouldQueryArtifact: false,
      shouldUsePracticeMastery: false,
      shouldUseLearnerMemory: false,
      shouldUseSourceTrust: false,
      shouldAskClarification: false,
    },
    warnings: [],
    errors: [],
    resolverVersion: 'intent-resolver-v1',
    resolvedAt: '2026-09-28T00:00:00.000Z',
  };
}

function sealCandidates(candidates: ResearchSourceCandidate[]) {
  return sealResearchSources({
    candidates,
    authenticatedSchoolId: AI04_SYNTHETIC_IDS.schoolId,
    authenticatedStudentId: AI04_SYNTHETIC_IDS.learnerId,
    authenticatedSessionId: AI04_SYNTHETIC_IDS.sessionId,
  });
}

const makeArtifactBlocks = (raw: unknown): ArtifactStructuredBlock[] => raw as ArtifactStructuredBlock[];
const makeEvidence = (raw: unknown): ArtifactReasoningEvidence[] => raw as ArtifactReasoningEvidence[];

type PartialResult = Omit<TutorQualificationCaseResult, 'id' | 'dimension' | 'kind' | 'latencyMs'>;

function hit(result: Omit<PartialResult, 'criticalHit'>, c: TutorQualificationCase): PartialResult {
  return {
    ...result,
    criticalHit: result.pass ? [] : ([...c.criticalFailureTags] as TutorQualificationCriticalTag[]),
  };
}

// ── Per-kind deterministic evaluators ──

function runIntentPlan(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    messageText: string;
    deenRelated?: boolean;
    intentOverride?: string;
    priorTurnIntent?: string;
  };
  const expected = c.expected as Record<string, unknown>;
  const mismatches: string[] = [];

  const intent: TutorTurnIntent = input.intentOverride
    ? (input.intentOverride as TutorTurnIntent)
    : classifyLearnerIntent(input.messageText, input.deenRelated);

  if (expected.intent !== undefined && intent !== expected.intent) {
    mismatches.push(`intent ${intent} !== ${expected.intent}`);
  }
  if (expected.intentIn !== undefined) {
    const allowed = expected.intentIn as string[];
    if (!allowed.includes(intent)) {
      mismatches.push(`intent ${intent} not in [${allowed.join(', ')}]`);
    }
  }

  const plan = planLearningResponse({
    requestId: `req_${c.id}`,
    messageText: input.messageText,
    intent,
    policyPacket: undefined,
    curriculumValidationModes: [],
    deenSourceSensitive: input.deenRelated === true,
  });

  for (const key of ['responseMove', 'allowedAnswerDepth'] as const) {
    if (expected[key] !== undefined && plan[key] !== expected[key]) {
      mismatches.push(`${key} ${plan[key]} !== ${expected[key]}`);
    }
  }
  if (expected.responseMoveIn !== undefined) {
    const allowed = expected.responseMoveIn as string[];
    if (!allowed.includes(plan.responseMove)) {
      mismatches.push(`responseMove ${plan.responseMove} not in [${allowed.join(', ')}]`);
    }
  }
  for (const key of [
    'requiresAiGeneration', 'requiresHint', 'requiresPracticeQuestion',
    'requiresStepCheck', 'requiresEvidenceWrite',
  ] as const) {
    if (expected[key] !== undefined && plan[key] !== expected[key]) {
      mismatches.push(`${key} ${plan[key]} !== ${expected[key]}`);
    }
  }

  // MT-01: confusion must plan a smaller step than the plain concept turn,
  // and the confusion turn itself must not write learner evidence.
  if (expected.smallerStepThanConcept === true) {
    const conceptPlan = planLearningResponse({
      requestId: `req_${c.id}_concept`, messageText: 'Explain photosynthesis.',
      intent: 'ask_concept', policyPacket: undefined, curriculumValidationModes: [], deenSourceSensitive: false,
    });
    const confusionSmaller = plan.requiresHint === true && conceptPlan.requiresHint === false;
    if (!confusionSmaller) mismatches.push('confusion plan is not a smaller step than concept plan');
  }

  // Injection precedence: a hostile message must never open a specialist path.
  if (expected.specialistMustNotBe !== undefined) {
    const forbidden = expected.specialistMustNotBe as string[];
    const decision = decideSpecialist({
      requestId: `req_${c.id}_spec`,
      messageText: input.messageText,
      resolvedIntent: undefined,
      preparedArtifactEvidence: null,
      preparedVideoContext: null,
    });
    if (forbidden.includes(decision.kind)) {
      mismatches.push(`injection opened forbidden specialist path '${decision.kind}'`);
    }
  }

  const observed = {
    intent,
    responseMove: plan.responseMove,
    allowedAnswerDepth: plan.allowedAnswerDepth,
    requiresAiGeneration: plan.requiresAiGeneration,
    requiresHint: plan.requiresHint,
    requiresStepCheck: plan.requiresStepCheck,
    requiresPracticeQuestion: plan.requiresPracticeQuestion,
    requiresEvidenceWrite: plan.requiresEvidenceWrite,
  };
  return hit({
    pass: mismatches.length === 0,
    observed: observed as Record<string, unknown>,
    expected,
    mismatches,
  }, c);
}

function runPromptComposition(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    intent?: string;
    planFixtures: { intent: string; deenSourceSensitive?: boolean };
    deenSourceSensitive?: boolean;
    preferredLanguage?: string;
    learnerGrade?: string;
    pacing?: string;
    specialist?: TutorSpecialistResult;
  };
  const expected = c.expected as Record<string, unknown>;
  const mismatches: string[] = [];

  const plan = planForFixture(input.planFixtures);
  const prompt = composePedagogyPrompt({
    requestId: `req_${c.id}`,
    messageText: 'ai04 fixture message',
    plan,
    intent: input.intent ?? input.planFixtures.intent,
    learnerGrade: input.learnerGrade,
    deenSourceSensitive: input.deenSourceSensitive ?? input.planFixtures.deenSourceSensitive,
    preferredLanguage: input.preferredLanguage,
    pacingDirective: input.pacing,
    specialist: input.specialist,
  });

  const combined = prompt.combinedPrompt;
  const markerKeys = [
    'boundaryMarker', 'specialistSubordinationMarker', 'deenBoundaryMarker',
    'noInventionMarker', 'referralMarker', 'languageMarker', 'ageBucketMarker',
    'pacingMarker', 'noMasteryAssumptionMarker', 'retrievalFirstMarker', 'noSummaryDumpMarker',
  ] as const;
  for (const key of markerKeys) {
    if (expected[key] !== undefined && !combined.includes(String(expected[key]))) {
      mismatches.push(`prompt missing expected marker for ${key}: "${String(expected[key])}"`);
    }
  }
  if (expected.oneExampleMax === true && !combined.includes('at most one example')) {
    mismatches.push('early-learner one-example calibration missing');
  }

  const observed = {
    containsNoFinalAnswerBoundary: combined.includes('You must NOT provide the final answer')
      || combined.includes('do not complete specific homework problems'),
    markersFound: markerKeys
      .filter((key) => expected[key] !== undefined)
      .map((key) => ({ key, found: combined.includes(String(expected[key])) })),
  };
  return hit({
    pass: mismatches.length === 0,
    observed,
    expected,
    mismatches,
  }, c);
}

function runOutputValidation(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    responseText: string;
    planFixtures: { intent: string };
    deenSourceSensitive?: boolean;
  };
  const expected = c.expected as Record<string, unknown>;
  const plan = planForFixture(input.planFixtures);

  const validation = validateOrchestrationOutput({
    requestId: `req_${c.id}`,
    responseText: input.responseText,
    responseMove: plan.responseMove,
    plan,
    deenSourceSensitive: input.deenSourceSensitive,
    includesGuidingQuestion: input.responseText.includes('?') || input.responseText.includes('؟'),
    revealsFinalAnswer: false,
  });

  const mismatches: string[] = [];
  if (validation.valid !== expected.valid) {
    mismatches.push(`valid ${validation.valid} !== ${expected.valid}`);
  }
  if (expected.violationsContain !== undefined) {
    const wanted = String(expected.violationsContain);
    if (!validation.violations.includes(wanted)) {
      mismatches.push(`violations [${validation.violations.join(', ')}] missing '${wanted}'`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: { valid: validation.valid, violations: validation.violations.slice(0, 5), repaired: validation.repaired },
    expected,
    mismatches,
  }, c);
}

function runEvidenceTruth(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    intent: string;
    responseMove: string;
    stepCheck?: { requestId: string; status: string };
  };
  const expected = c.expected as Record<string, unknown>;

  const result = writeLearningEvidence({
    requestId: `req_${c.id}`,
    tutorLearnerId: AI04_SYNTHETIC_IDS.learnerId,
    intent: input.intent as TutorTurnIntent,
    responseMove: input.responseMove as LearningResponsePlan['responseMove'],
    hint: undefined,
    stepCheck: input.stepCheck as never,
  });

  const mismatches: string[] = [];
  if (result.evidenceWritten !== expected.evidenceWritten) {
    mismatches.push(`evidenceWritten ${result.evidenceWritten} !== ${expected.evidenceWritten}`);
  }
  if (expected.evidenceType !== undefined && result.evidenceType !== expected.evidenceType) {
    mismatches.push(`evidenceType ${result.evidenceType} !== ${expected.evidenceType}`);
  }
  if (expected.evidenceTypeNot !== undefined && result.evidenceType === expected.evidenceTypeNot) {
    mismatches.push(`evidenceType must not be ${expected.evidenceTypeNot}`);
  }
  return hit({
    pass: mismatches.length === 0,
    observed: { evidenceWritten: result.evidenceWritten, evidenceType: result.evidenceType },
    expected,
    mismatches,
  }, c);
}

function runIntegrityClassification(c: TutorQualificationCase): PartialResult {
  const input = c.input as { message: string; activityType?: string };
  const expected = c.expected as Record<string, unknown>;
  const result = classifyAcademicIntegritySignal({ message: input.message, activityType: input.activityType ?? null });
  const mismatches: string[] = [];
  for (const key of ['signal', 'riskLevel', 'allowedResponseMode', 'memorySignalAllowed'] as const) {
    if (expected[key] !== undefined && result[key] !== expected[key]) {
      mismatches.push(`${key} ${String(result[key])} !== ${String(expected[key])}`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      signal: result.signal,
      riskLevel: result.riskLevel,
      allowedResponseMode: result.allowedResponseMode,
      memorySignalAllowed: result.memorySignalAllowed,
    },
    expected,
    mismatches,
  }, c);
}

function runSpecialistRouting(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    messageText: string;
    resolvedIntentStatus?: string;
    resolvedPrimaryIntent?: string;
    preparedVideoContext?: { status?: string; recommendationCount?: number } | null;
  };
  const expected = c.expected as Record<string, unknown>;

  const decision = decideSpecialist({
    requestId: `req_${c.id}`,
    messageText: input.messageText,
    resolvedIntent: (input.resolvedIntentStatus || input.resolvedPrimaryIntent)
      ? makeResolution({ status: input.resolvedIntentStatus, primaryIntent: input.resolvedPrimaryIntent })
      : undefined,
    preparedArtifactEvidence: null,
    preparedVideoContext: input.preparedVideoContext ?? null,
  });

  const mismatches: string[] = [];
  for (const key of ['kind', 'reasonCode', 'requiresExternalRetrieval', 'usesPreparedContext'] as const) {
    if (expected[key] !== undefined && decision[key] !== expected[key]) {
      mismatches.push(`${key} ${String(decision[key])} !== ${String(expected[key])}`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      kind: decision.kind,
      reasonCode: decision.reasonCode,
      requiresExternalRetrieval: decision.requiresExternalRetrieval,
      usesPreparedContext: decision.usesPreparedContext,
    },
    expected,
    mismatches,
  }, c);
}

async function runSpecialistExecution(c: TutorQualificationCase): Promise<PartialResult> {
  const input = c.input as {
    messageText: string;
    resolvedPrimaryIntent?: string;
    preparedVideoContext?: { status?: string; recommendationCount?: number; summary?: string } | null;
    preparedArtifactEvidence?: { groundingStatus?: string; summary?: string } | null;
  };
  const expected = c.expected as Record<string, unknown>;
  const mismatches: string[] = [];

  const outcome = await runSpecialist({
    requestId: `req_${c.id}`,
    messageText: input.messageText,
    resolvedIntent: input.resolvedPrimaryIntent
      ? makeResolution({ primaryIntent: input.resolvedPrimaryIntent })
      : undefined,
    preparedArtifactEvidence: input.preparedArtifactEvidence ?? null,
    preparedVideoContext: input.preparedVideoContext ?? null,
    deenSourceSensitive: false,
    sealIdentity: {
      schoolId: AI04_SYNTHETIC_IDS.schoolId,
      studentId: AI04_SYNTHETIC_IDS.learnerId,
      sessionId: AI04_SYNTHETIC_IDS.sessionId,
    },
  });
  const result: TutorSpecialistResult = outcome.result ?? {
    kind: 'none', status: 'not_needed', promptDirectives: [], evidenceSections: [],
    verifiedSources: [], warnings: [], metadata: {},
  };

  if (expected.status !== undefined && result.status !== expected.status) {
    mismatches.push(`status ${result.status} !== ${expected.status}`);
  }
  if (expected.degradedReasonCode !== undefined && result.metadata.degradedReasonCode !== expected.degradedReasonCode) {
    mismatches.push(`degradedReasonCode ${String(result.metadata.degradedReasonCode)} !== ${expected.degradedReasonCode}`);
  }
  if (expected.verifiedSources !== undefined && result.verifiedSources.length !== expected.verifiedSources) {
    mismatches.push(`verifiedSources ${result.verifiedSources.length} !== ${expected.verifiedSources}`);
  }
  for (const markerKey of ['forbidsFinalResultMarker', 'noFabricationMarker', 'neverFabricateMarker'] as const) {
    if (expected[markerKey] !== undefined) {
      const found = result.promptDirectives.some((d) => d.includes(String(expected[markerKey])));
      if (!found) mismatches.push(`specialist directives missing marker for ${markerKey}`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      kind: result.kind,
      status: result.status,
      degradedReasonCode: result.metadata.degradedReasonCode,
      verifiedSourceCount: result.verifiedSources.length,
      warningCount: result.warnings.length,
    },
    expected,
    mismatches,
  }, c);
}

function runSourceSeal(c: TutorQualificationCase): PartialResult {
  const input = c.input as { candidates: ResearchSourceCandidate[] };
  const expected = c.expected as Record<string, unknown>;
  const mismatches: string[] = [];

  const seal = sealCandidates(input.candidates);
  // §9.K: learner-visible verification is NOT packet.verifiedWebSources.length.
  // A source counts as learner-visible verified ONLY when kind === 'verified_web'
  // AND trustStatus === 'verified' AND displayPolicy === 'show_as_verified_citation'
  // AND real evidence exists AND no blocking reasons.
  const verified = seal.packet.verifiedWebSources.filter((s) =>
    s.kind === 'verified_web'
    && s.trustStatus === 'verified'
    && s.displayPolicy === 'show_as_verified_citation'
    && Array.isArray(s.evidence) && s.evidence.length > 0
    && s.blockReasons.length === 0,
  );

  if (expected.verifiedWebCount !== undefined && verified.length !== expected.verifiedWebCount) {
    mismatches.push(`verifiedWebCount ${verified.length} !== ${expected.verifiedWebCount}`);
  }
  if (expected.trustStatus !== undefined && verified[0]?.trustStatus !== expected.trustStatus) {
    mismatches.push(`trustStatus ${String(verified[0]?.trustStatus)} !== ${expected.trustStatus}`);
  }
  if (expected.sourceTrustStatus !== undefined) {
    const first = seal.packet.sources[0];
    if (!first || first.trustStatus !== expected.sourceTrustStatus) {
      mismatches.push(`sourceTrustStatus ${String(first?.trustStatus)} !== ${expected.sourceTrustStatus}`);
    }
  }
  if (expected.retrievedAtPreserved !== undefined
    && verified[0]?.evidence.find((e) => e.retrievedAt === expected.retrievedAtPreserved) === undefined) {
    mismatches.push(`retrievedAt ${String(expected.retrievedAtPreserved)} not preserved`);
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      verifiedWebCount: verified.length,
      sourceCount: seal.packet.sources.length,
      blockedCount: seal.packet.blockedSources.length,
      ok: seal.ok,
    },
    expected,
    mismatches,
  }, c);
}

function runFreshnessRouting(c: TutorQualificationCase): PartialResult {
  const input = c.input as {
    studentMessage: string;
    privateDataPresent?: boolean;
    hasSafeguardingContent?: boolean;
    containsFreshnessSignal?: boolean;
    topicCategory?: 'conceptual' | 'current_event' | 'factual' | 'procedural' | 'personal' | 'crisis';
  };
  const expected = c.expected as Record<string, unknown>;

  const decision = freshnessService.decide({
    studentMessage: input.studentMessage,
    hasSafeguardingContent: input.hasSafeguardingContent === true,
    isAssignmentAnswerRequest: false,
    isVideoContextFollowUp: false,
    isArtifactContextFollowUp: false,
    containsFreshnessSignal: input.containsFreshnessSignal === true,
    topicCategory: input.topicCategory,
    privateDataPresent: input.privateDataPresent === true,
  });

  const mismatches: string[] = [];
  for (const key of ['shouldRetrieveExternalSource', 'sourceNeed', 'queryPrivacyRisk'] as const) {
    if (expected[key] !== undefined && decision[key] !== expected[key]) {
      mismatches.push(`${key} ${String(decision[key])} !== ${String(expected[key])}`);
    }
  }
  if (expected.sourceNeedIn !== undefined) {
    const allowed = expected.sourceNeedIn as string[];
    if (!allowed.includes(decision.sourceNeed)) {
      mismatches.push(`sourceNeed ${decision.sourceNeed} not in [${allowed.join(', ')}]`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      sourceNeed: decision.sourceNeed,
      shouldRetrieveExternalSource: decision.shouldRetrieveExternalSource,
      queryPrivacyRisk: decision.queryPrivacyRisk,
      reason: decision.reason,
    },
    expected,
    mismatches,
  }, c);
}

function runArtifactSafety(c: TutorQualificationCase): PartialResult {
  const input = c.input as { blocks: unknown };
  const expected = c.expected as Record<string, unknown>;
  const scan = artifactSafety.scanArtifactContentSafety(makeArtifactBlocks(input.blocks));
  const mismatches: string[] = [];

  for (const key of ['safe', 'hasPromptInjection', 'hasAnswerKeyLeakage', 'hasTeacherNotes', 'hasPrivateData'] as const) {
    if (expected[key] !== undefined && scan[key] !== expected[key]) {
      mismatches.push(`${key} ${String(scan[key])} !== ${String(expected[key])}`);
    }
  }
  if (expected.blockedBlocksContain !== undefined) {
    const wanted = String(expected.blockedBlocksContain);
    if (!scan.blockedBlocks.includes(wanted)) {
      mismatches.push(`blockedBlocks [${scan.blockedBlocks.join(', ')}] missing '${wanted}'`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      safe: scan.safe,
      hasPromptInjection: scan.hasPromptInjection,
      hasAnswerKeyLeakage: scan.hasAnswerKeyLeakage,
      blockedBlocks: scan.blockedBlocks.slice(0, 5),
    },
    expected,
    mismatches,
  }, c);
}

function runArtifactGrounding(c: TutorQualificationCase): PartialResult {
  const input = c.input as { intent: string; evidence: unknown };
  const expected = c.expected as Record<string, unknown>;
  const validation = artifactGrounding.validate({
    intent: input.intent as Parameters<ArtifactGroundingValidator['validate']>[0]['intent'],
    evidence: makeEvidence(input.evidence),
  });
  const mismatches: string[] = [];

  for (const key of ['status', 'supportedByEvidence', 'fabricatedCitationRisk', 'answerKeyRequired', 'unsafeBlocked'] as const) {
    if (expected[key] !== undefined && (validation as Record<string, unknown>)[key] !== expected[key]) {
      mismatches.push(`${key} ${String((validation as Record<string, unknown>)[key])} !== ${String(expected[key])}`);
    }
  }
  return hit({
    pass: mismatches.length === 0,
    observed: {
      status: validation.status,
      supportedByEvidence: validation.supportedByEvidence,
      fabricatedCitationRisk: validation.fabricatedCitationRisk,
      answerKeyRequired: validation.answerKeyRequired,
      unsafeBlocked: validation.unsafeBlocked,
    },
    expected,
    mismatches,
  }, c);
}

// ── Metrics (only what the deterministic corpus actually proves) ──

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.max(0, Math.round(sorted[Math.max(0, idx)] * 100) / 100);
}

function computeMetrics(
  results: TutorQualificationCaseResult[],
  corpus: TutorQualificationCase[],
): TutorQualificationMetrics {
  const byDimension = (d: TutorQualificationDimension) => results.filter((r) => r.dimension === d);
  const tagHitCount = (tag: string) =>
    results.filter((r) => !r.pass && r.criticalHit.includes(tag as TutorQualificationCriticalTag)).length;

  // Routing accuracy: cases whose expected.kind is set (specialist routing truth).
  const routingCases = results.filter((r) => {
    const c = corpus.find((x) => x.id === r.id);
    return c !== undefined && (c.expected as Record<string, unknown>).kind !== undefined
      && ['specialist_routing', 'specialist_execution'].includes(c.kind);
  });

  // One-question violation detection: question_overload controls must be caught.
  const questionOverloadCases = results.filter(
    (r) => (r.expected as Record<string, unknown>).violationsContain === 'question_overload',
  );
  const oneQuestionDetection = questionOverloadCases.length > 0
    && questionOverloadCases.every((r) => r.pass) ? 1 : 0;

  // Degraded truthfulness: degradation/known-bad rejection cases must be honest.
  const degradedCases = results.filter((r) => {
    const c = corpus.find((x) => x.id === r.id);
    if (!c) return false;
    const e = c.expected as Record<string, unknown>;
    return e.status === 'degraded' || e.status === 'blocked' || e.status === 'not_grounded'
      || e.safe === false || e.valid === false || e.verifiedWebCount === 0
      || e.supportedByEvidence === false || e.evidenceWritten === false;
  });
  const degradedTruthfulness = degradedCases.length > 0
    && degradedCases.every((r) => r.pass) ? 1 : 0;

  const mtCases = byDimension('multi_turn_coherence');
  const mtRate = mtCases.length > 0 && mtCases.every((r) => r.pass) ? 1 : 0;

  const langCases = byDimension('multilingual_age_pacing');
  const langAccuracy = langCases.length > 0 && langCases.every((r) => r.pass) ? 1 : 0;

  const allPass = results.every((r) => r.pass);

  return {
    deterministicCaseAccuracy: allPass ? 1 : results.filter((r) => !r.pass).length / results.length,
    specialistRoutingAccuracy: routingCases.length === 0 ? 1 : (routingCases.every((r) => r.pass) ? 1 : 0),
    finalAnswerLeakageRate: tagHitCount('answer_leakage') > 0 ? 1 : 0,
    answerKeyLeakageRate: tagHitCount('answer_key_leakage') > 0 ? 1 : 0,
    promptInjectionBypassRate: tagHitCount('prompt_injection_bypass') > 0 ? 1 : 0,
    privacyLeakRate: tagHitCount('privacy_exfiltration') > 0 ? 1 : 0,
    deenBoundaryBypassRate: tagHitCount('deen_policy_bypass') > 0 ? 1 : 0,
    safeguardingBypassRate: tagHitCount('safeguarding_bypass') > 0 ? 1 : 0,
    sourceFabricationRate: tagHitCount('source_fabrication') > 0 ? 1 : 0,
    artifactHallucinationRate: tagHitCount('artifact_hallucination') > 0 ? 1 : 0,
    videoFabricationRate: tagHitCount('video_fabrication') > 0 ? 1 : 0,
    falseEvidenceWriteRate: tagHitCount('false_learning_evidence') > 0 ? 1 : 0,
    falseMasteryRate: tagHitCount('false_mastery') > 0 ? 1 : 0,
    oneQuestionViolationDetectionRate: oneQuestionDetection,
    degradedTruthfulnessRate: degradedTruthfulness,
    multilingualDirectiveAccuracy: langAccuracy,
    multiTurnCoherenceRate: mtRate,
    criticalFailureCount: results.filter((r) => r.criticalHit.length > 0).length,
  };
}

// ── Critical override (pattern parity with PP-11; cannot be bypassed) ──

export function applyTutorQualificationCriticalOverride(
  failed: number,
  criticalCount: number,
): 'PASS' | 'FAIL' {
  if (criticalCount > 0) return 'FAIL';
  if (failed > 0) return 'FAIL';
  return 'PASS';
}

// ── Runner ──

export async function runTutorQualification(): Promise<TutorQualificationReport> {
  const t0 = performance.now();
  const corpus = TUTOR_QUALIFICATION_CORPUS_V1;
  const results: TutorQualificationCaseResult[] = [];
  const latencies: number[] = [];

  for (const c of corpus) {
    const start = performance.now();
    let partial: PartialResult;
    try {
      switch (c.kind) {
        case 'intent_plan':
          partial = runIntentPlan(c);
          break;
        case 'prompt_composition':
          partial = runPromptComposition(c);
          break;
        case 'output_validation':
          partial = runOutputValidation(c);
          break;
        case 'evidence_truth':
          partial = runEvidenceTruth(c);
          break;
        case 'integrity_classification':
          partial = runIntegrityClassification(c);
          break;
        case 'specialist_routing':
          partial = runSpecialistRouting(c);
          break;
        case 'specialist_execution':
          partial = await runSpecialistExecution(c);
          break;
        case 'source_seal':
          partial = runSourceSeal(c);
          break;
        case 'freshness_routing':
          partial = runFreshnessRouting(c);
          break;
        case 'artifact_safety':
          partial = runArtifactSafety(c);
          break;
        case 'artifact_grounding':
          partial = runArtifactGrounding(c);
          break;
        default:
          partial = {
            pass: false, observed: {}, expected: c.expected,
            mismatches: [`unknown case kind ${(c as TutorQualificationCase).kind}`],
            criticalHit: [...c.criticalFailureTags] as TutorQualificationCriticalTag[],
          };
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'unknown harness error';
      partial = {
        pass: false,
        observed: { harnessError: message.slice(0, 200) },
        expected: c.expected,
        mismatches: [`harness error: ${message.slice(0, 160)}`],
        criticalHit: [...c.criticalFailureTags] as TutorQualificationCriticalTag[],
      };
    }
    const latencyMs = performance.now() - start;
    latencies.push(latencyMs);
    results.push({
      id: c.id,
      dimension: c.dimension,
      kind: c.kind,
      latencyMs,
      ...partial,
    });
  }

  const passed = results.filter((r) => r.pass).length;
  const failed = results.length - passed;
  const criticalFailures = results
    .filter((r) => r.criticalHit.length > 0)
    .map((r) => ({ caseId: r.id, tags: r.criticalHit, detail: r.mismatches.join('; ').slice(0, 300) }));

  const metrics = computeMetrics(results, corpus);
  const sortedLatencies = [...latencies].sort((a, b) => a - b);

  const dimensionResults = {} as TutorQualificationReport['dimensionResults'];
  for (const r of results) {
    dimensionResults[r.dimension] ??= { total: 0, passed: 0, failed: 0, unverified: 0 };
    const bucket = dimensionResults[r.dimension];
    bucket.total += 1;
    if (r.pass) bucket.passed += 1;
    else bucket.failed += 1;
  }

  const durationMs = performance.now() - t0;
  const deterministicRuntimeQualification = applyTutorQualificationCriticalOverride(failed, criticalFailures.length);

  return {
    corpusVersion: TUTOR_QUALIFICATION_CORPUS_VERSION,
    totalCases: results.length,
    passedCases: passed,
    failedCases: failed,
    criticalFailures,
    dimensionResults,
    metrics,
    // Provider-free deterministic harness: no live model, no provider cost.
    // DB/network call counts are not instrumented here — reported UNVERIFIED,
    // never inferred as zero (§20).
    resourceUsage: {
      liveModelCalls: 0,
      externalNetworkCalls: 'UNVERIFIED',
      databaseCalls: 'UNVERIFIED',
      providerCost: 0,
    },
    durationMs: Math.round(durationMs * 100) / 100,
    latency: {
      p50DeterministicMs: percentile(sortedLatencies, 50),
      p95DeterministicMs: percentile(sortedLatencies, 95),
    },
    // §6 — structurally constrained; never claims model qualification.
    providerSemanticQualification: 'UNVERIFIED_PROVIDER_PENDING',
    deterministicRuntimeQualification,
    releaseDecision: deterministicRuntimeQualification === 'PASS'
      ? 'RUNTIME_QUALIFIED_PROVIDER_PENDING'
      : 'BLOCKED_RUNTIME_QUALIFICATION',
    calibrationNotes: [
      'DETERMINISTIC_SCOPE_ONLY: this qualification covers deterministic runtime policy, routing, validators and guards against corpus v1.',
      'UNVERIFIED_PROVIDER_PENDING: no provider/model was executed — semantic quality, hallucination rate, latency SLOs and cost remain unqualified.',
      'No production latency SLO is established from harness-local timings.',
      'Specialist-external call bounds (research ≤1, seal ≤1) are proven in the focused orchestration test via mocked dependency counters.',
      'Exact DB/network call counts are not instrumented here and are reported UNVERIFIED rather than inferred as zero.',
    ],
  };
}

// Re-export for the focused test's threshold assertions.
export { TUTOR_QUALIFICATION_THRESHOLDS };
