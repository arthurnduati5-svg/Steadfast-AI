/**
 * AI Route Module — Research & Video
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 9011-9320.
 * Domain: research
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { logger } from '../../utils/logger';
import { runResearchMode } from '../../services/researchModeService';
import { videoRecommendationService } from '../../services/videoRecommendationService';
import { videoMetadataService } from '../../services/videoMetadataService';
import { recordLearningEffectEvent } from '../../services/learningEffectivenessService';
import { recordMasteryEvidenceSignal } from '../../services/masteryInferenceService';
import { getLearningEffectivenessSummary } from '../../services/learningEffectivenessService';
import { requireRole } from '../../lib/rbac';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';
import {
  safeString,
  clampMediaText,
} from './ai-shared';

const router = Router();

// ── POST /research ──
router.post('/research', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { query, sessionId, subject, topic, language, schoolLevel, forceWebSearch } = req.body || {};

    if (!query) {
      return res.status(400).send({ message: 'Research query is required.' });
    }

    let sessionTopic = '';
    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId, studentId },
        select: { metadata: true },
      });
      const metadata = (session?.metadata || {}) as Record<string, unknown>;
      sessionTopic = safeString(metadata.lastStudyTopic || metadata.lastTopic || '').trim();
    }

    const result = await runResearchMode({
      query: safeString(query),
      activeTopic: safeString(topic) || sessionTopic || undefined,
      forceWebSearch: !!forceWebSearch,
    });

    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { metadata: true },
      });
      const existingMetadata = (session?.metadata || {}) as Record<string, unknown>;
      const updatedMetadata = {
        ...existingMetadata,
        researchModeActive: result.mode === 'web_research',
        researchReady: result.mode !== 'web_research',
        lastSearchTopic: result.queryUsed || existingMetadata.lastSearchTopic,
        researchQuery: query,
        retrievedSourceSet: result.result.sources || existingMetadata.retrievedSourceSet,
        researchSourceContext: result.result.trustSummary || existingMetadata.researchSourceContext,
        ...(result.recommendedVideo ? {
          activeVideo: result.recommendedVideo,
          videoSuggested: true,
        } : {}),
        ...(result.notices.length ? { systemNotices: result.notices as any } : {}),
      };
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: { metadata: updatedMetadata } as any,
      });
    }

    res.status(200).send(result);
  } catch (error) {
    logger.error({ err: error }, '[POST /research] Failed');
    res.status(500).send({ message: 'Research failed' });
  }
});

// ── POST /video-recommend ──
router.post('/video-recommend', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { query, topic, subject, intent, limit, sessionId } = req.body || {};

    const schoolId = (req.user as any)?.schoolId || '';
    const response = await videoRecommendationService.recommend(
      { schoolId, studentId },
      {
        query: safeString(query) || undefined,
        topic: safeString(topic) || undefined,
        subject: safeString(subject) || undefined,
        maxResults: Math.min(10, Math.max(1, Number(limit) || 3)),
        sessionId: safeString(sessionId) || undefined,
      },
    );
    const videos = response.recommendations.map(v => ({
      id: v.recommendationId,
      title: v.candidate?.title || '',
      channel: v.candidate?.channelTitle || '',
      reason: v.reasons?.[0] || '',
    }));

    if (sessionId && videos.length > 0) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { metadata: true },
      });
      const existingMetadata = (session?.metadata || {}) as Record<string, unknown>;
      const video = videos[0];
      const existingVideos = Array.isArray(existingMetadata.suggestedVideos) ? existingMetadata.suggestedVideos : [];
      await prisma.chatSession.update({
        where: { id: sessionId },
        data: {
          metadata: {
            ...existingMetadata,
            activeVideo: { id: video.id, title: video.title, channel: video.channel },
            videoSuggested: true,
            suggestedVideos: [...existingVideos.slice(-4), { id: video.id, title: video.title, reason: video.reason }],
          },
        },
      });
    }

    res.status(200).send({ videos });
  } catch (error) {
    logger.error({ err: error }, '[POST /video-recommend] Failed');
    res.status(500).send({ message: 'Video recommendation failed' });
  }
});

// ── GET /video/:id/context ──
router.get('/video/:id/context', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const videoId = safeString(req.params?.id).trim();
    if (!videoId) return res.status(400).send({ message: 'Video ID required' });

    const [meta] = await videoMetadataService.enrichMetadata([{
      provider: 'youtube',
      providerVideoId: videoId,
      source: 'provider_search',
    }]);
    if (!meta || !meta.title) return res.status(404).send({ message: 'Video context not found' });
    const context = { title: meta.title, summary: meta.description || '', concepts: [] };

    const sessionId = safeString(req.query?.sessionId as string).trim();
    if (sessionId) {
      const session = await prisma.chatSession.findUnique({
        where: { id: sessionId },
        select: { metadata: true },
      });
      if (session) {
        const existingMetadata = (session?.metadata || {}) as Record<string, unknown>;
        await prisma.chatSession.update({
          where: { id: sessionId },
          data: {
            metadata: {
              ...existingMetadata,
              activeVideo: { id: videoId, title: context.title, summary: context.summary },
              videoSuggested: true,
              activeVideoSummary: context.summary,
              activeVideoConcepts: context.concepts || [],
            },
          },
        });
      }
    }

    res.status(200).send(context);
  } catch (error) {
    logger.error({ err: error }, '[GET /video/:id/context] Failed');
    res.status(500).send({ message: 'Failed to get video context' });
  }
});

// ── POST /learning-effect-event ──
router.post('/learning-effect-event', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const event = await recordLearningEffectEvent({ studentId, ...req.body });
    if (req.body?.signalMastery) {
      await recordMasteryEvidenceSignal({ studentId, ...req.body });
    }
    res.status(200).send(event);
  } catch (error) {
    logger.error({ err: error }, '[POST /learning-effect-event] Failed');
    res.status(500).send({ message: 'Failed to record event' });
  }
});

// ── GET /effectiveness-summary ──
router.get('/effectiveness-summary', schoolAuthMiddleware, requireRole('admin'), async (req: AuthedRequest, res) => {
  try {
    const studentId = safeString(req.query?.studentId as string).trim() || req.user!.id;
    const summary = await getLearningEffectivenessSummary(studentId);
    res.status(200).send(summary);
  } catch (error) {
    logger.error({ err: error }, '[GET /effectiveness-summary] Failed');
    res.status(500).send({ message: 'Failed to get effectiveness summary' });
  }
});

// ── POST /artifacts/parse ──
router.post('/artifacts/parse', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const { fileData, sessionId, messageId } = req.body || {};
    if (!fileData) {
      return res.status(400).send({ message: 'fileData is required.' });
    }

    const studentId = req.user!.id;

    const attachmentService = await import('../../../../AI/ai/flows/emotional-ai-copilot.attachments.js');
    const buildSummary = attachmentService.buildAttachmentPromptSummary;
    const extractText = attachmentService.extractTextFromPdfWithOcrFallback;

    const rawText = await extractText(fileData);
    const summary = buildSummary({
      kind: 'text',
      fileName: safeString(req.body?.fileName) || 'uploaded file',
      extractedText: rawText.text,
      truncated: rawText.truncated,
      confidence: rawText.confidence,
    });

    res.status(200).send({ summary, rawText: rawText.text.slice(0, 2000) });
  } catch (error) {
    logger.error({ err: error }, '[POST /artifacts/parse] Failed');
    res.status(500).send({ message: 'Failed to parse artifact' });
  }
});

// ── GET /search ──
router.get('/search', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const { q: query, mode = 'hybrid' } = req.query as any;
    if (!query) return res.status(400).send({ message: 'Query required' });

    const results = await prisma.chatSession.findMany({
      where: {
        studentId,
        OR: [
          { topic: { contains: query, mode: 'insensitive' } },
          { messages: { some: { content: { contains: query, mode: 'insensitive' } } } },
        ],
      },
      orderBy: { updatedAt: 'desc' },
      take: 20,
      select: { id: true, topic: true, updatedAt: true },
    });

    res.status(200).send({ results, mode });
  } catch {
    res.status(500).send({ message: 'Search failed' });
  }
});

export default router;
