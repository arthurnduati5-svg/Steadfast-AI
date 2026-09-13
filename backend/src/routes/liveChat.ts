// ─────────────────────────────────────────────────────────────
// Steadfast AI — Live Chat Integration Route v3
// REFACTORED: AI generation now routed through safe
// TutorMessageGenerationService instead of legacy aiService.
// Supports both SSE streaming (when ?stream=true) and JSON response.
// Mounted at /api/copilot/live-chat, called by frontend proxy.
// ─────────────────────────────────────────────────────────────

import { Router, Response } from 'express';
import type { AuthedRequest } from './ai/ai-middleware';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import { integratedChatRequestSchema } from '../services/chatPipelineValidation';
import { liveChatPipelineAdapter } from '../services/liveChatPipelineAdapter';
import { generateTutorMessage } from '../services/aiGateway/tutorMessageGenerationService';
import { chatPostTurnEventService } from '../services/chatPostTurnEventService';
import type { IntegratedChatResponse } from '../services/chatPipelineContracts';

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

function sendSseEvent(res: Response, eventType: string, data: unknown) {
  res.write(`data: ${JSON.stringify({ type: eventType, ...(typeof data === 'object' ? data : { content: data }) })}\n\n`);
}

// ── POST /api/copilot/live-chat ──
// Refactored to route AI generation through safe TutorMessageGenerationService.
// Context resolution pipeline still runs; generation goes through safe policy.
router.post('/', async (req: AuthedRequest, res: Response) => {
  const isStreaming = req.query.stream === 'true';

  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      sendError(res, 401, 'UNAUTHENTICATED', 'Authentication required.');
      return;
    }

    const body = integratedChatRequestSchema.parse(req.body || {});
    const isVoice = req.path?.includes('voice') ? 'voice' : 'standard';

    // ── Set streaming headers if applicable ──
    if (isStreaming) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders();

      // Send initial status event
      sendSseEvent(res, 'status', { phase: 'resolving_context', label: 'Understanding your request…' });
    } else {
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('X-Accel-Buffering', 'no');
    }

    // ── Prepare pipeline (context + intent + shortcuts) ──
    const prepared = await liveChatPipelineAdapter.prepareLiveChatTurn({
      identity,
      request: body,
      mode: (body.mode || isVoice) as 'standard' | 'streaming' | 'voice',
    });

    // ── Shortcut: clarification/unsafe — no AI call ──
    if (!prepared.shouldCallAi && prepared.immediateResponse) {
      if (isStreaming) {
        sendSseEvent(res, 'token', { content: prepared.immediateResponse.answer });
        sendSseEvent(res, 'done', {
          meta: prepared.immediateResponse.meta,
          sources: prepared.immediateResponse.sources,
          followUps: prepared.immediateResponse.followUps,
          videoRecommendations: (prepared.immediateResponse as any).videoRecommendations,
        });
        res.end();
      } else {
        res.json(prepared.immediateResponse);
      }
      return;
    }

    // ── Generation path: use safe TutorMessageGenerationService ──
    if (isStreaming) {
      sendSseEvent(res, 'status', { phase: 'generating', label: 'Generating response…' });
    }

    let aiAnswer = '';
    let aiSources: unknown[] = [];
    let aiFollowUps: string[] = [];
    let aiWarnings: string[] = [];

    if (prepared.promptPacket) {
      // Route through safe tutor message generation service
      const requestId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const safeResponse = await generateTutorMessage(
        {
          requestId,
          schoolId: identity.schoolId,
          tutorLearnerId: identity.studentId,
          tutorSessionId: body.sessionId || `live_${identity.studentId}_${Date.now()}`,
          messageText: body.message || '',
          learnerGrade: (identity as any).grade,
          learnerAge: (identity as any).ageBand,
          preferredLanguage: (identity as any).preferredLanguage,
          clientContext: {
            displayMode: 'widget',
          },
        },
        undefined,
        { useMockProvider: process.env.NODE_ENV === 'test' || !process.env.OPENAI_API_KEY },
      );

      aiAnswer = safeResponse.responseText;
      aiSources = safeResponse.provider ? [{ provider: safeResponse.provider.providerId }] : [];
      aiFollowUps = [];
      aiWarnings = safeResponse.validation.valid ? [] : [`Validation: ${safeResponse.validation.violationCodes.join(', ')}`];
    } else {
      aiAnswer = 'I can help you with that. What specific topic are you studying?';
    }

    // ── Build Socratic safe metadata markers ──
    const socraticCtx = prepared.executionContext.socraticPolicyContext;
    const socraticMetaFields = socraticCtx ? {
      socraticMode: socraticCtx.supportMode,
      integritySignal: socraticCtx.integritySignal,
      challengeLevel: socraticCtx.challengeLevel,
      privacyMode: socraticCtx.privacyMode,
      safeguardingEscalated: socraticCtx.safeguardingSignal !== 'none',
      noFinalAnswerRequired: socraticCtx.noFinalAnswerRequired,
      supportMode: socraticCtx.supportMode,
    } : {};

    // ── Build response ──
    const cacheScope = { cacheAllowed: false, scope: 'no_cache', reason: 'TutorTurnContext is never cached.' };
    const statusLabel = prepared.executionContext.tutorContext ? 'resolved' : 'partial';

    const meta = {
      ...socraticMetaFields,
      executionId: prepared.executionContext.executionId,
      sessionId: body.sessionId || null,
      tutorContextStatus: statusLabel,
      intentStatus: prepared.executionContext.intentResolution?.status || 'resolved',
      primaryIntent: prepared.executionContext.intentResolution?.primaryIntent || 'general_chat',
      taskKind: prepared.executionContext.intentResolution?.task?.taskKind || 'general_response',
      cacheScope,
      sourceTrust: prepared.executionContext.sourceTrust
        ? { status: (prepared.executionContext.sourceTrust as any).status, sourceCount: (prepared.executionContext.sourceTrust as any).allowedSourceIds?.length || 0 }
        : { status: 'no_sources', sourceCount: 0 },
      usedContext: {
        tutorState: !!prepared.executionContext.tutorContext?.tutorState,
        learnerMemory: !!prepared.executionContext.tutorContext?.learnerProfile?.strengths?.length,
        practiceMastery: !!prepared.executionContext.tutorContext?.learnerProfile?.practiceContext,
        artifacts: !!prepared.executionContext.tutorContext?.artifactContext?.activeArtifactIds?.length,
        sources: !!prepared.executionContext.tutorContext?.sourceTrust?.allowedSourceIds?.length,
        intentResolution: !!prepared.executionContext.intentResolution,
      },
      warnings: [...aiWarnings].slice(0, 10),
    };

    // ── Write post-turn event (non-critical) ──
    let eventWritten = false;
    try {
      const eventResult = await chatPostTurnEventService.writePostTurnLearningEvent(
        identity,
        prepared.executionContext,
        aiAnswer.slice(0, 300),
      );
      eventWritten = eventResult.eventWritten;
    } catch {
      // Non-critical — don't fail the response
    }

    // ── Send response ──
    if (isStreaming) {
      sendSseEvent(res, 'token', { content: aiAnswer });
      sendSseEvent(res, 'done', {
        meta,
        sources: [],
        followUps: [],
        eventWritten,
      });
      res.end();
    } else {
      const response: IntegratedChatResponse = {
        ok: true,
        answer: aiAnswer,
        meta: meta as any,
        sources: [],
        followUps: [],
      };
      res.json(response);
    }
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      if (isStreaming) {
        sendSseEvent(res, 'error', { message: err.errors?.[0]?.message || 'Invalid request.' });
        res.end();
      } else {
        sendError(res, 400, 'VALIDATION_ERROR', err.errors?.[0]?.message || 'Invalid request.');
      }
      return;
    }
    console.error('[LiveChat POST /]', err);
    if (isStreaming) {
      sendSseEvent(res, 'error', { message: 'Failed to process chat request.' });
      res.end();
    } else {
      sendError(res, 500, 'INTERNAL_ERROR', 'Failed to process chat request.');
    }
  }
});

export default router;
