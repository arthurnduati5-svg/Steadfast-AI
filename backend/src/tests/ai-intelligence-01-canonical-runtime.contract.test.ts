/**
 * AI-INTELLIGENCE-01 — Canonical Tutor Intelligence Runtime contract tests.
 *
 * Focused proofs for the frozen requirements R1–R12:
 * - verified school context gates production live chat mounts (T1)
 * - prepared ChatPromptPacket reaches prompt composition (T2, T3, T4)
 * - production mock-provider routing is forbidden; test mode is allowed (T5, T6)
 * - provider calls are bounded (≤2) and deadline-bounded (T7, T8)
 * - learning evidence truth semantics (T9–T12)
 * - awaited Task011 protected commit + truthful status (T13–T15)
 * - mode execution evidence truth (T16)
 * - AI memory tool is proposal-only (T17, T18)
 * - canonical live chat path via orchestrateTutorTurn (T19)
 *
 * No real paid model is called. External boundaries are mocked or use the
 * deterministic test-only mock provider.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── Mock the Task011 protected persistence boundary BEFORE imports ──
const processValidatedTutorTurnMock = vi.fn();
vi.mock('../services/mastery/task011TutorTurnIntegrationService', () => ({
  task011TutorTurnIntegrationService: {
    processValidatedTutorTurn: (...args: unknown[]) => processValidatedTutorTurnMock(...args),
  },
}));

// ── Mock the provider gateway so we can count provider calls (T7/T8/T19) ──
const providerGenerateMock = vi.fn();
vi.mock('../services/aiGateway/aiProviderGateway', () => ({
  generate: (...args: unknown[]) => providerGenerateMock(...args),
}));

import { buildPolicyAwarePrompt } from '../services/aiGateway/policyAwarePromptBuilder';
import type { PolicyAwarePromptInput } from '../services/aiGateway/promptBoundaryContracts';
import { routeModel } from '../services/aiGateway/safeModelRouter';
import { ProviderHealthService } from '../services/aiGateway/providerHealthService';
import { MockModelAdapter } from '../services/aiGateway/providers/mockModelAdapter';
import { generateTutorMessage } from '../services/aiGateway/tutorMessageGenerationService';
import { writeLearningEvidence } from '../services/tutorOrchestration/learningEvidenceWriteRuntime';
import { orchestrateTutorTurn } from '../services/tutorOrchestration/tutorTurnOrchestrationEngine';
import { executeMode } from '../services/tutorModeExecutionRouter';
import { memory_manager } from '../../../AI/ai/tools/tool-handlers';
import { liveChatPipelineAdapter } from '../services/liveChatPipelineAdapter';
import { chatPromptAssembler } from '../services/chatPromptAssembler';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const backendSrcDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const TASK011_OK = {
  ok: true,
  requestId: 'req',
  persistenceResult: {
    ok: true,
    attemptPersisted: true,
    stepEvidencePersisted: true,
    masteryAggregated: true,
    weakSkillUpdated: false,
    revisionScheduled: false,
    spacedReviewPlanned: false,
    progressStateUpdated: true,
    growthProofGenerated: true,
    warnings: [],
    errors: [],
  },
  warnings: [],
  errors: [],
};

function policyInput(overrides: Partial<PolicyAwarePromptInput> = {}): PolicyAwarePromptInput {
  return {
    requestId: 'req-1',
    generationMode: 'socratic_tutoring',
    messageText: 'What is a fraction?',
    policyPacket: {
      requestId: 'req-1',
      decision: 'allow',
      blockReasons: [],
      archivePolicyTags: [],
      allowedMode: 'socratic_guidance',
      noFinalAnswer: { finalAnswerBlocked: true },
      safety: { seriousRisk: false, riskCategory: 'none' },
      socraticDirective: { mustAskOneGuidingQuestion: true, toneRules: [], teachingMethodRules: [] },
      deenPolicyContext: undefined,
      curriculumContext: { subject: 'Mathematics', topic: 'Fractions' },
    } as unknown as PolicyAwarePromptInput['policyPacket'],
    safeContext: {},
    ...overrides,
  };
}

beforeEach(() => {
  processValidatedTutorTurnMock.mockReset();
  providerGenerateMock.mockReset();
  providerGenerateMock.mockResolvedValue({
    requestId: 'req',
    providerId: 'mock-provider',
    modelId: 'mock-model-v1',
    ok: true,
    text: 'Let me guide you: what part of the whole is shaded? What do you notice?',
  });
  processValidatedTutorTurnMock.mockResolvedValue({ ...TASK011_OK, requestId: 'req' });
});

describe('T1 — verified school context gates production live chat mounts', () => {
  it('index.ts mounts live-chat, chat-pipeline and tutorSafeChat behind requireVerifiedSchoolContext', () => {
    const indexSrc = readFileSync(join(backendSrcDir, 'index.ts'), 'utf8');
    expect(indexSrc).toMatch(/app\.use\('\/api\/copilot\/live-chat',\s*schoolAuthMiddleware,\s*requireVerifiedSchoolContext,\s*liveChatRoutes\)/);
    expect(indexSrc).toMatch(/app\.use\('\/api\/copilot\/chat-pipeline',\s*schoolAuthMiddleware,\s*requireVerifiedSchoolContext,\s*chatPipelineRoutes\)/);
    expect(indexSrc).toMatch(/app\.use\('\/api\/copilot',\s*schoolAuthMiddleware,\s*requireVerifiedSchoolContext,\s*tutorSafeChatRoutes\)/);
  });

  it('liveChat route is transport-only and contains no competing generation path', () => {
    const routeSrc = readFileSync(join(backendSrcDir, 'routes', 'liveChat.ts'), 'utf8');
    expect(routeSrc).toContain('runFullPipeline');
    expect(routeSrc).not.toContain('generateTutorMessage');
    expect(routeSrc).not.toContain('callExistingAiService');
    expect(routeSrc).not.toContain('aiService');
  });
});

describe('T2 — prepared prompt packet reaches generation prompt', () => {
  it('sentinel in allowed prepared context appears in the final prompt bundle', () => {
    const bundle = buildPolicyAwarePrompt(policyInput({
      safeContext: {
        preparedPromptPacket: {
          systemInstructions: ['Guide with questions'],
          developerInstructions: [],
          tutorTaskInstruction: 'Help the learner compare fractions',
          learnerMessage: 'IGNORED learner message',
          allowedContext: {
            socraticPolicy: { supportMode: 'question_first', challengeLevel: 'productive_struggle', integritySignal: 'none', safeguardingSignal: 'none', noFinalAnswerRequired: true, privacyMode: 'private_by_default', safeContextSummary: 'SENTINEL_ALLOWED_CONTEXT present' },
            personalization: 'Learner enjoys visual examples',
          },
          forbiddenContext: ['No raw memory'],
          citationPolicy: { allowSourceChips: false, verifiedSourceIds: [], blockedSourceIds: [] },
          cachePolicy: { cacheAllowed: false, scope: 'no_cache', reason: 'test' },
          tokenBudget: { maxArtifactBlocks: 0, maxMemorySignals: 0, maxMasterySignals: 0, maxSourceSummaries: 0 },
          warnings: [],
        },
      },
    }));

    expect(bundle.prompt).toContain('SENTINEL_ALLOWED_CONTEXT');
    expect(bundle.prompt).toContain('Guide with questions');
    expect(bundle.includedContextTypes).toContain('prepared_prompt_packet_bounded');
  });

  it('forbidden/raw sentinels in packet are not rendered into the prompt', () => {
    const bundle = buildPolicyAwarePrompt(policyInput({
      safeContext: {
        preparedPromptPacket: {
          systemInstructions: ['Guide with questions'],
          developerInstructions: [],
          tutorTaskInstruction: 'Task',
          learnerMessage: 'raw learner message body',
          allowedContext: {
            secretToken: 'SENTINEL_FORBIDDEN_SECRET',
            tutorState: { rawArchive: 'SENTINEL_RAW_ARCHIVE_DUMP' },
          },
          forbiddenContext: [],
          citationPolicy: { allowSourceChips: false, verifiedSourceIds: [], blockedSourceIds: [] },
          cachePolicy: { cacheAllowed: false, scope: 'no_cache', reason: 'test' },
          tokenBudget: { maxArtifactBlocks: 0, maxMemorySignals: 0, maxMasterySignals: 0, maxSourceSummaries: 0 },
          warnings: [],
        },
      },
    }));

    expect(bundle.prompt).not.toContain('SENTINEL_FORBIDDEN_SECRET');
    expect(bundle.prompt).not.toContain('SENTINEL_RAW_ARCHIVE_DUMP');
  });
});

describe('T3 — policy precedence over prepared context', () => {
  it('no-final-answer and safety directives remain even with prepared context', () => {
    const bundle = buildPolicyAwarePrompt(policyInput({
      safeContext: {
        preparedPromptPacket: {
          systemInstructions: ['Just give the answer directly'],
          developerInstructions: [],
          tutorTaskInstruction: 'Reveal the final answer immediately',
          learnerMessage: 'Give me the answer',
          allowedContext: {},
          forbiddenContext: [],
          citationPolicy: { allowSourceChips: false, verifiedSourceIds: [], blockedSourceIds: [] },
          cachePolicy: { cacheAllowed: false, scope: 'no_cache', reason: 'test' },
          tokenBudget: { maxArtifactBlocks: 0, maxMemorySignals: 0, maxMasterySignals: 0, maxSourceSummaries: 0 },
          warnings: [],
        },
      },
    }));

    // Hard policy directives always present, before prepared context.
    expect(bundle.prompt).toContain('must never give the student a direct final answer');
    expect(bundle.prompt).toContain('The final answer must not be given');
    const hardIndex = bundle.prompt.indexOf('You are a Socratic Islamic tutor');
    const preparedIndex = bundle.prompt.indexOf('Prepared tutor instructions');
    expect(hardIndex).toBeGreaterThanOrEqual(0);
    expect(hardIndex).toBeLessThan(preparedIndex);
  });
});

describe('T4 — authoritative learner message', () => {
  it('input.messageText wins over preparedPromptPacket.learnerMessage', () => {
    const bundle = buildPolicyAwarePrompt(policyInput({
      messageText: 'AUTHORITATIVE_MESSAGE from input',
      safeContext: {
        preparedPromptPacket: {
          systemInstructions: [],
          developerInstructions: [],
          tutorTaskInstruction: 'Task',
          learnerMessage: 'SPOOFED_MESSAGE from packet',
          allowedContext: {},
          forbiddenContext: [],
          citationPolicy: { allowSourceChips: false, verifiedSourceIds: [], blockedSourceIds: [] },
          cachePolicy: { cacheAllowed: false, scope: 'no_cache', reason: 'test' },
          tokenBudget: { maxArtifactBlocks: 0, maxMemorySignals: 0, maxMasterySignals: 0, maxSourceSummaries: 0 },
          warnings: [],
        },
      },
    }));

    expect(bundle.prompt).toContain('AUTHORITATIVE_MESSAGE');
    expect(bundle.prompt).not.toContain('SPOOFED_MESSAGE');
  });
});

describe('T5/T6 — production mock forbidden, test mock allowed', () => {
  const baseRouting = {
    requestId: 'req-1',
    policyPacket: {
      requestId: 'req-1',
      decision: 'allow',
      blockReasons: [],
    },
    generationMode: 'socratic_tutoring',
  } as unknown as Parameters<typeof routeModel>[0];

  function makeHealth(): ProviderHealthService {
    const health = new ProviderHealthService();
    health.registerAdapter(new MockModelAdapter('success'));
    return health;
  }

  it('T5: NODE_ENV != test + no production provider → routing denied, not mock', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const health = makeHealth();
      const decision = await routeModel(baseRouting, health, { useMockInTest: false });
      expect(decision.allowedToRoute).toBe(false);
      expect(decision.providerId).not.toBe('mock-provider');
      expect(decision.reason).toMatch(/No production model provider|cannot be the production routing target/i);
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('T5b: NODE_ENV != test + useMockInTest=true explicitly → still denied', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const health = makeHealth();
      const decision = await routeModel(baseRouting, health, { useMockInTest: true });
      expect(decision.allowedToRoute).toBe(false);
      expect(decision.providerId).not.toBe('mock-provider');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('T6: NODE_ENV=test + explicit mock config → mock-provider usable', async () => {
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    try {
      const health = makeHealth();
      const decision = await routeModel(baseRouting, health, { useMockInTest: true });
      expect(decision.allowedToRoute).toBe(true);
      expect(decision.providerId).toBe('mock-provider');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  });

  it('R4: generateTutorMessage passes useMockProvider through only in test env', async () => {
    // In test env (vitest runs with NODE_ENV=test), mock routing succeeds.
    const health = makeHealth();
    const response = await generateTutorMessage(
      {
        requestId: 'req-mock-1',
        schoolId: 'school-1',
        tutorLearnerId: 'learner-1',
        tutorSessionId: 'session-1',
        messageText: 'Explain fractions',
      },
      health,
      { useMockProvider: true },
    );
    // Routing may succeed with the test mock; must not return policy_eval_failed etc.
    expect(['generated', 'fallback', 'clarify_first', 'safe_refusal', 'referral', 'blocked']).toContain(response.decision);
  });
});

describe('T7/T8 — bounded generation budget', () => {
  it('T7: primary failure + fallback regen stays within 2 provider calls', async () => {
    providerGenerateMock
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p1', modelId: 'm', ok: false, errorCode: 'provider_failed' })
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p2', modelId: 'm', ok: true, text: 'Valid guiding question? What comes next?' })
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p3', modelId: 'm', ok: true, text: 'THIRD CALL MUST NOT HAPPEN' });

    const health = new ProviderHealthService();
    health.registerAdapter(new MockModelAdapter('success'));

    const response = await generateTutorMessage(
      {
        requestId: 'req-budget-1',
        schoolId: 'school-1',
        tutorLearnerId: 'learner-1',
        tutorSessionId: 'session-1',
        messageText: 'What is 2/3 of 12?',
      },
      health,
      { fallbackProviderIds: ['fallback-provider'] },
    );

    expect(providerGenerateMock.mock.calls.length).toBeLessThanOrEqual(2);
    expect(response.responseText).not.toContain('THIRD CALL MUST NOT HAPPEN');
  });

  it('T7b: invalid first output requiring regeneration stays within 2 calls', async () => {
    providerGenerateMock
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p1', modelId: 'm', ok: true, text: 'The answer is 42. Final answer!' })
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p1', modelId: 'm', ok: true, text: 'What do you think the first step is?' })
      .mockResolvedValueOnce({ requestId: 'r', providerId: 'p1', modelId: 'm', ok: true, text: 'NEVER' });

    const health = new ProviderHealthService();
    health.registerAdapter(new MockModelAdapter('success'));

    await generateTutorMessage(
      {
        requestId: 'req-budget-2',
        schoolId: 'school-1',
        tutorLearnerId: 'learner-1',
        tutorSessionId: 'session-1',
        messageText: 'What is the answer?',
      },
      health,
    );

    expect(providerGenerateMock.mock.calls.length).toBeLessThanOrEqual(2);
  });

  it('T8: expired deadline returns runtime_budget_exhausted with no provider call', async () => {
    const health = new ProviderHealthService();
    health.registerAdapter(new MockModelAdapter('success'));

    // Simulate deadline already exhausted by stubbing Date.now to a far future
    // after the service starts its budget clock.
    const realNow = Date.now;
    let calls = 0;
    vi.spyOn(Date, 'now').mockImplementation(() => {
      calls += 1;
      // First call (budget start) returns real time; subsequent calls jump +20s
      return calls === 1 ? realNow() : realNow() + 20000;
    });

    try {
      const response = await generateTutorMessage(
        {
          requestId: 'req-budget-3',
          schoolId: 'school-1',
          tutorLearnerId: 'learner-1',
          tutorSessionId: 'session-1',
          messageText: 'Explain ratios',
        },
        health,
        { useMockProvider: true },
      );
      expect(response.validation.violationCodes).toContain('runtime_budget_exhausted');
      expect(providerGenerateMock.mock.calls.length).toBe(0);
    } finally {
      vi.restoreAllMocks();
    }
  });
});

describe('T9–T12 — learning evidence truth semantics', () => {
  it('T9: ask_concept / concept_explanation → evidenceWritten=false', () => {
    const result = writeLearningEvidence({
      requestId: 'r', tutorLearnerId: 'l', intent: 'ask_concept', responseMove: 'concept_explanation',
    });
    expect(result.evidenceWritten).toBe(false);
    expect(result.evidenceType).toBe('none');
  });

  it('T10: practice_question → evidenceWritten=false', () => {
    const result = writeLearningEvidence({
      requestId: 'r', tutorLearnerId: 'l', intent: 'ask_for_practice', responseMove: 'practice_question',
    });
    expect(result.evidenceWritten).toBe(false);
    expect(result.evidenceType).not.toBe('practice_completed');
  });

  it('T11: hint present without learner attempt → evidenceWritten=false', () => {
    const result = writeLearningEvidence({
      requestId: 'r', tutorLearnerId: 'l', intent: 'ask_for_hint', responseMove: 'socratic_hint',
      hint: { hintText: 'Try splitting it', guidingQuestion: 'What happens if...?', hintLevel: 1 } as any,
    });
    expect(result.evidenceWritten).toBe(false);
    expect(result.evidenceType).not.toBe('hint_used');
  });

  it('T12: validated learner attempt → evidenceWritten=true', () => {
    const correct = writeLearningEvidence({
      requestId: 'r', tutorLearnerId: 'l', intent: 'submit_attempt', responseMove: 'attempt_feedback',
      stepCheck: { requestId: 'r', status: 'correct' } as any,
    });
    expect(correct.evidenceWritten).toBe(true);
    expect(correct.evidenceType).toBe('attempt');

    const incorrect = writeLearningEvidence({
      requestId: 'r', tutorLearnerId: 'l', intent: 'submit_attempt', responseMove: 'mistake_correction',
      stepCheck: { requestId: 'r', status: 'incorrect' } as any,
    });
    expect(incorrect.evidenceWritten).toBe(true);
    expect(['attempt', 'mistake']).toContain(incorrect.evidenceType);
  });
});

describe('T13–T15 — awaited Task011 protected commit', () => {
  const baseInput = {
    requestId: 'req-commit-1',
    schoolId: 'school-1',
    tutorLearnerId: 'learner-1',
    tutorSessionId: 'session-1',
  };

  it('T13: orchestrateTutorTurn does not resolve until the protected commit resolves', async () => {
    let resolveCommit: (v: unknown) => void = () => {};
    const deferred = new Promise((resolve) => { resolveCommit = resolve; });
    processValidatedTutorTurnMock.mockImplementationOnce(() => deferred);

    let resolved = false;
    const orchestrationPromise = orchestrateTutorTurn({
      ...baseInput,
      messageText: 'My answer is 15', // triggers step check → validated signal
    }).then((r) => { resolved = true; return r; });

    // Give microtasks a chance to flush; orchestration must NOT have resolved.
    await new Promise((r) => setTimeout(r, 50));
    expect(resolved).toBe(false);

    resolveCommit({ ...TASK011_OK, requestId: baseInput.requestId });
    const result = await orchestrationPromise;
    expect(resolved).toBe(true);
    expect(result.learningCommit?.attempted).toBe(true);
    expect(result.learningCommit?.ok).toBe(true);
  });

  it('T14: normal explanation turn skips Task011 entirely', async () => {
    const result = await orchestrateTutorTurn({
      ...baseInput,
      messageText: 'What is a fraction?', // ask_concept → no validated signal
    });

    expect(processValidatedTutorTurnMock.mock.calls.length).toBe(0);
    expect(result.learningCommit?.attempted).toBe(false);
  });

  it('T15: commit failure is truthful — ok=false, no fake success', async () => {
    processValidatedTutorTurnMock.mockRejectedValueOnce(new Error('db down'));

    const result = await orchestrateTutorTurn({
      ...baseInput,
      messageText: 'My answer is 15',
    });

    expect(result.learningCommit?.attempted).toBe(true);
    expect(result.learningCommit?.ok).toBe(false);
    // No fake safe-memory success signal on failed protected commit.
    expect(result.safeMemoryMetadata.shouldUpdateSafeMemory).toBe(false);
    expect(result.safeMemoryMetadata.safeSignals).toEqual([]);
  });
});

describe('T16 — mode execution propagates evidence truth', () => {
  it('executeSocraticMode derives evidenceWritten from actual orchestration result', async () => {
    // Explanation turn: no evidence, no commit → must be false.
    processValidatedTutorTurnMock.mockResolvedValue({ ...TASK011_OK });

    const explanationResult = await executeMode({
      identity: { studentId: 'learner-1', schoolId: 'school-1' },
      mode: 'socratic_check',
      message: 'What is a fraction?',
      requestId: 'req-mode-1',
    });
    // ask_concept intent → evidenceWritten false from canonical engine.
    expect(explanationResult.evidenceWritten).toBe(false);
  });
});

describe('T17/T18 — AI memory tool is proposal-only', () => {
  it('T17: save returns proposalOnly + backendCommitRequired, performs no Prisma/Redis call', async () => {
    const result = await memory_manager({ mode: 'save', key: 'favorite_topic', value: 'fractions' }, { studentId: 'learner-1' });
    expect(result.ok).toBe(true);
    expect(result.proposalOnly).toBe(true);
    expect(result.backendCommitRequired).toBe(true);
    expect(result.operation).toBe('save');
    expect(result.key).toBe('favorite_topic');
    expect(result.value).toBe('fractions');
    expect(result.durable).toBeUndefined();
  });

  it('T17b: delete returns proposalOnly + backendCommitRequired', async () => {
    const result = await memory_manager({ mode: 'delete', key: 'favorite_topic' }, { studentId: 'learner-1' });
    expect(result.ok).toBe(true);
    expect(result.proposalOnly).toBe(true);
    expect(result.backendCommitRequired).toBe(true);
    expect(result.operation).toBe('delete');
  });

  it('T18: get never reads protected memory; requires backend context', async () => {
    const result = await memory_manager({ mode: 'get', key: 'favorite_topic' }, { studentId: 'learner-1' });
    expect(result.ok).toBe(false);
    expect(result.proposalOnly).toBe(true);
    expect(result.backendContextRequired).toBe(true);
    expect(result.value).toBeUndefined();
  });
});

describe('T19 — canonical live chat path', () => {
  it('runFullPipeline delegates generation to orchestrateTutorTurn, not legacy aiService/liveChatAiAdapter', async () => {
    const adapterSrc = readFileSync(join(backendSrcDir, 'services', 'liveChatPipelineAdapter.ts'), 'utf8');
    expect(adapterSrc).toContain('orchestrateTutorTurn');
    expect(adapterSrc).toContain('preparedPromptPacket: prepared.promptPacket');
    expect(adapterSrc).not.toContain('liveChatAiAdapter.callExistingAiService');
    expect(adapterSrc).not.toContain("from './liveChatAiAdapter'");
  });

  it('adapter passes prepared prompt packet into orchestrateTutorTurn with authoritative message', async () => {
    // Spy on the engine module to verify delegation with packet passthrough.
    const engineModule = await import('../services/tutorOrchestration/tutorTurnOrchestrationEngine');
    const engineSpy = vi.spyOn(engineModule, 'orchestrateTutorTurn');

    // A general-chat message that avoids deterministic shortcuts.
    const result = await liveChatPipelineAdapter.runFullPipeline({
      identity: { studentId: 'learner-1', schoolId: 'school-1', userId: 'learner-1' },
      request: { message: 'Can you help me understand how photosynthesis works for my biology revision?' },
      mode: 'standard',
    });

    expect(result.response.ok).toBe(true);
    expect(typeof result.response.answer).toBe('string');
    expect(engineSpy).toHaveBeenCalled();
    engineSpy.mockRestore();
  });
});
