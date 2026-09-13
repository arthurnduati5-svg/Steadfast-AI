// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Pipeline Integration Route v1
// Wires the pre-generation context resolution chain into the
// live chat path without rewriting the existing AI generation.
// Mounted at /api/copilot/chat-pipeline
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import { integratedChatRequestSchema } from '../services/chatPipelineValidation';
import { chatContextIntegrationService } from '../services/chatContextIntegrationService';
import { chatPromptAssembler } from '../services/chatPromptAssembler';
import { chatResponseSafetyService } from '../services/chatResponseSafetyService';
import { chatPostTurnEventService } from '../services/chatPostTurnEventService';
import type {
  IntegratedChatResponse,
  IntegratedChatResponseMeta,
  ChatContextIntegrationStatus,
} from '../services/chatPipelineContracts';

const router = Router();

function resolveIdentity(req: AuthedRequest): ResolvedTutorIdentity | null {
  if (!req.user) return null;
  return {
    studentId: req.user.id,
    schoolId: (req.user as any).schoolId || '',
    userId: req.user.id,
    role: (req.user as any).role || undefined,
    grade: undefined,
    ageBand: undefined,
  };
}

function sendError(res: Response, status: number, code: string, message: string) {
  res.status(status).json({ ok: false, error: { code, message } });
}

// ── POST /api/copilot/chat-pipeline/resolve ──
// Resolves context and intent for a chat turn without calling AI.
// Useful for the frontend to preview what the pipeline knows.
router.post('/resolve', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const body = integratedChatRequestSchema.parse(req.body || {});

    const executionContext = await chatContextIntegrationService.resolveChatTurnContext({
      identity,
      request: body,
    });

    const promptPacket = chatPromptAssembler.assembleChatPromptPacket(executionContext);

    // Build response meta
    const statusLabel: ChatContextIntegrationStatus = executionContext.tutorContext
      ? 'resolved'
      : 'partial';

    const meta: IntegratedChatResponseMeta = {
      executionId: executionContext.executionId,
      sessionId: body.sessionId || null,
      tutorContextStatus: statusLabel,
      intentStatus: executionContext.intentResolution?.status || 'error',
      primaryIntent: executionContext.intentResolution?.primaryIntent || 'general_chat',
      taskKind: executionContext.intentResolution?.task?.taskKind || 'general_response',
      cacheScope: {
        cacheAllowed: false,
        scope: 'no_cache',
        reason: 'TutorTurnContext is never cached.',
      },
      sourceTrust: executionContext.sourceTrust
        ? { status: (executionContext.sourceTrust as any).status, sourceCount: (executionContext.sourceTrust as any).allowedSourceIds?.length || 0 }
        : { status: 'no_sources', sourceCount: 0 },
      usedContext: {
        tutorState: !!executionContext.tutorContext?.tutorState,
        learnerMemory: !!(executionContext.tutorContext?.learnerProfile?.strengths?.length ||
          executionContext.tutorContext?.learnerProfile?.weaknesses?.length),
        practiceMastery: !!(executionContext.tutorContext?.learnerProfile?.practiceContext),
        artifacts: !!(executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length),
        sources: !!(executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length),
        intentResolution: !!executionContext.intentResolution,
      },
      warnings: executionContext.warnings.slice(0, 10),
    };

    res.json({
      ok: true,
      meta,
      promptPacket,
      intentResolution: executionContext.intentResolution,
    });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    console.error('[ChatPipeline POST /resolve]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to resolve chat context.');
  }
});

// ── POST /api/copilot/chat-pipeline/simulate ──
// Simulates a full pipeline run: resolve context, check intent,
// return structured response. Does NOT call real AI.
// Returns what the pipeline WOULD do (clarification, unsafe, or simulated answer).
router.post('/simulate', async (req: AuthedRequest, res: Response) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const body = integratedChatRequestSchema.parse(req.body || {});

    const executionContext = await chatContextIntegrationService.resolveChatTurnContext({
      identity,
      request: body,
    });

    const intent = executionContext.intentResolution;

    // ── Check for clarification-needed (no AI call) ──
    if (intent?.status === 'needs_clarification' && intent.clarification) {
      const response: IntegratedChatResponse = {
        ok: true,
        answer: intent.clarification.question,
        meta: {
          executionId: executionContext.executionId,
          sessionId: body.sessionId || null,
          tutorContextStatus: 'resolved',
          intentStatus: 'needs_clarification',
          primaryIntent: intent.primaryIntent,
          taskKind: intent.task?.taskKind || 'ask_clarifying_question',
          cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Clarification response.' },
          sourceTrust: { status: 'not_requested' },
          usedContext: { tutorState: false, learnerMemory: false, practiceMastery: false, artifacts: false, sources: false, intentResolution: true },
          warnings: ['Clarification returned without AI generation.'],
        },
        sources: [],
        followUps: intent.clarification.options,
      };
      res.json(response);
      return;
    }

    // ── Check for unsafe (no AI call) ──
    if (intent?.status === 'unsafe') {
      const response: IntegratedChatResponse = {
        ok: true,
        answer: 'I cannot process that request. Please ask a learning-related question.',
        meta: {
          executionId: executionContext.executionId,
          sessionId: body.sessionId || null,
          tutorContextStatus: 'resolved',
          intentStatus: 'unsafe',
          primaryIntent: 'unsafe',
          taskKind: 'refuse_or_redirect',
          cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'Unsafe response.' },
          sourceTrust: { status: 'not_requested' },
          usedContext: { tutorState: false, learnerMemory: false, practiceMastery: false, artifacts: false, sources: false, intentResolution: true },
          warnings: ['Unsafe intent detected. Returned safe refusal.'],
        },
        sources: [],
        followUps: ['What would you like to learn about?'],
      };
      res.json(response);
      return;
    }

    // ── Simulated safe answer ──
    const task = intent?.task;
    const simulatedAnswer = task?.instruction
      ? `[SIMULATED] ${task.instruction}`
      : `[SIMULATED] Tutor response for intent: ${intent?.primaryIntent || 'general_chat'}`;

    const response: IntegratedChatResponse = {
      ok: true,
      answer: simulatedAnswer,
      meta: {
        executionId: executionContext.executionId,
        sessionId: body.sessionId || null,
        tutorContextStatus: 'resolved',
        intentStatus: intent?.status || 'resolved',
        primaryIntent: intent?.primaryIntent || 'general_chat',
        taskKind: task?.taskKind || 'general_response',
        cacheScope: { cacheAllowed: false, scope: 'no_cache', reason: 'TutorTurnContext is never cached.' },
        sourceTrust: { status: 'not_requested' },
        usedContext: {
          tutorState: !!(executionContext.tutorContext?.tutorState),
          learnerMemory: !!(executionContext.tutorContext?.learnerProfile?.strengths?.length),
          practiceMastery: !!(executionContext.tutorContext?.learnerProfile?.practiceContext),
          artifacts: !!(executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length),
          sources: !!(executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length),
          intentResolution: true,
        },
        warnings: executionContext.warnings.slice(0, 10),
      },
      sources: [],
      followUps: [],
    };

    // Write post-turn event
    try {
      await chatPostTurnEventService.writePostTurnLearningEvent(
        identity,
        executionContext,
        simulatedAnswer.slice(0, 200),
      );
    } catch {
      // Non-critical — don't fail the response
    }

    res.json(response);
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      return;
    }
    console.error('[ChatPipeline POST /simulate]', err);
    sendError(res, 500, 'INTERNAL_ERROR', 'Failed to simulate chat pipeline.');
  }
});

export default router;
