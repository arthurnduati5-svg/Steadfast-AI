// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Routes v1
// POST /api/copilot/videos/recommend — full recommendation flow
// POST /api/copilot/videos/rank      — rank-only (no orchestrator)
// POST /api/copilot/videos/safety-check — single candidate safety
// GET  /api/copilot/videos/policy    — get school policy profile
// ─────────────────────────────────────────────────────────────

import { Router, Request, Response } from 'express';
import { videoRecommendationRequestSchema } from '../services/videoRecommendationValidation';
import { videoRecommendationService } from '../services/videoRecommendationService';
import { videoRecommendationEventService } from '../services/videoRecommendationEventService';
import { videoPolicyService } from '../services/videoPolicyService';
import { videoRankingService } from '../services/videoRankingService';

const router = Router();

/**
 * POST /api/copilot/videos/recommend
 * Full video recommendation flow.
 */
router.post('/videos/recommend', async (req: Request, res: Response) => {
  try {
    // Auth identity (set by schoolAuthMiddleware)
    const identity = {
      schoolId: String((req as any).schoolId || ''),
      studentId: String((req as any).userId || ''),
    };

    if (!identity.schoolId || !identity.studentId) {
      res.status(401).json({ ok: false, message: 'Authentication required' });
      return;
    }

    // Validate request body
    const parsed = videoRecommendationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        message: 'Invalid request',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Run recommendation
    const response = await videoRecommendationService.recommend(identity, parsed.data);

    // Write bounded event (non-blocking)
    videoRecommendationEventService.recordRecommendationEvent(identity, response).catch(() => {
      // Never fail the response for event failure
    });

    res.status(200).json(response);
  } catch (err) {
    console.error('[VideoRecommendation] Error:', err);
    res.status(500).json({
      ok: false,
      message: 'Recommendation service error',
      status: 'error',
    });
  }
});

/**
 * POST /api/copilot/videos/rank
 * Rank-only endpoint — accepts pre-scored candidates and returns ranking.
 * Useful for frontend-prefetched or teacher-submitted candidate sets.
 */
router.post('/videos/rank', async (req: Request, res: Response) => {
  try {
    const identity = {
      schoolId: String((req as any).schoolId || ''),
      studentId: String((req as any).userId || ''),
    };

    if (!identity.schoolId || !identity.studentId) {
      res.status(401).json({ ok: false, message: 'Authentication required' });
      return;
    }

    const parsed = videoRecommendationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        message: 'Invalid request',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    // Use recommendation service for unified scoring
    const response = await videoRecommendationService.recommend(identity, {
      ...parsed.data,
      includeProviderSearch: false,
    });

    res.status(200).json({
      ok: true,
      status: response.status,
      recommendations: response.recommendations,
      rejected: response.rejected,
      reviewQueue: response.reviewQueue,
      meta: response.meta,
    });
  } catch (err) {
    console.error('[VideoRank] Error:', err);
    res.status(500).json({ ok: false, message: 'Ranking service error' });
  }
});

/**
 * POST /api/copilot/videos/safety-check
 * Run safety/suitability checks on a single candidate.
 */
router.post('/videos/safety-check', async (req: Request, res: Response) => {
  try {
    const identity = {
      schoolId: String((req as any).schoolId || ''),
      studentId: String((req as any).userId || ''),
    };

    if (!identity.schoolId || !identity.studentId) {
      res.status(401).json({ ok: false, message: 'Authentication required' });
      return;
    }

    const parsed = videoRecommendationRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        ok: false,
        message: 'Invalid request',
        errors: parsed.error.flatten().fieldErrors,
      });
      return;
    }

    const candidates = parsed.data.candidates || [];
    if (candidates.length === 0) {
      res.status(400).json({ ok: false, message: 'At least one candidate required' });
      return;
    }

    const response = await videoRecommendationService.recommend(identity, {
      ...parsed.data,
      maxResults: 10,
    });

    // Return only safety-related fields
    const safetyResults = response.recommendations.concat(response.reviewQueue, response.rejected).map(r => ({
      candidate: r.candidate,
      status: r.status,
      decision: r.decision,
      safety: r.safety,
      suitability: r.suitability,
      score: r.score,
      warnings: r.warnings,
    }));

    res.status(200).json({
      ok: true,
      results: safetyResults,
      meta: {
        requestId: response.meta.requestId,
        warnings: response.meta.warnings,
      },
    });
  } catch (err) {
    console.error('[VideoSafetyCheck] Error:', err);
    res.status(500).json({ ok: false, message: 'Safety check service error' });
  }
});

/**
 * GET /api/copilot/videos/policy
 * Get the effective policy profile for the requesting school.
 */
router.get('/videos/policy', async (req: Request, res: Response) => {
  try {
    const schoolId = String((req as any).schoolId || '');

    if (!schoolId) {
      res.status(401).json({ ok: false, message: 'Authentication required' });
      return;
    }

    const profile = videoPolicyService.getEffectiveProfile(schoolId);
    res.status(200).json({
      ok: true,
      profile: {
        profileId: profile.profileId,
        name: profile.name,
        allowedLanguages: profile.allowedLanguages,
        preferredLanguages: profile.preferredLanguages,
        islamicAppropriatenessMode: profile.islamicAppropriatenessMode,
        requireEmbeddable: profile.requireEmbeddable,
        preferCaptions: profile.preferCaptions,
        minAge: profile.minAge,
        maxAge: profile.maxAge,
      },
    });
  } catch (err) {
    console.error('[VideoPolicy] Error:', err);
    res.status(500).json({ ok: false, message: 'Policy service error' });
  }
});

export default router;
