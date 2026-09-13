/**
 * AI Route Module — Preferences & Memory
 *
 * Route handlers extracted from backend/src/routes/ai.ts lines 9683-9860.
 * Domain: preferences-memory
 */

import { Router } from 'express';
import prisma from '../../lib/prisma';
import { getRedisClient } from '../../lib/redis';
import { logger } from '../../utils/logger';
import { Prisma } from '@prisma/client';
import { getOrCreateCopilotPreferences } from '../../services/copilotPreferenceService';
import {
  AuthedRequest,
  schoolAuthMiddleware,
} from './ai-middleware';
import { normalizeVoiceLanguageMode } from '../../media-stream/voice';
const router = Router();

// ── Inline helpers (extracted from ai.ts preamble) ──

const MAX_INTERESTS = 30;

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

async function getCopilotPreferencesMetadata(studentId: string): Promise<Record<string, unknown>> {
  const redis = await getRedisClient();
  const cacheKey = `copilot:metadata:${studentId}`;
  if (redis) {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try { return JSON.parse(cached); } catch { /* ignore */ }
    }
  }
  const record = await prisma.copilotPreferences.findUnique({ where: { userId: studentId } });
  const result = (record?.interests as Record<string, unknown>) || {};
  if (redis) {
    await redis.set(cacheKey, JSON.stringify(result), { EX: 300 });
  }
  return result;
}

async function updateCopilotPreferencesMetadata(studentId: string, data: Record<string, unknown>): Promise<void> {
  await prisma.copilotPreferences.upsert({
    where: { userId: studentId },
    update: { interests: data as any },
    create: { userId: studentId, preferredLanguage: 'en', interests: data as any },
  });
  const redis = await getRedisClient();
  if (redis) await redis.del(`copilot:metadata:${studentId}`);
}

async function getStudentMemoryPayload(studentId: string) {
  const [progress, mistakes] = await Promise.all([
    prisma.progress.findMany({ where: { studentId }, orderBy: { updatedAt: 'desc' } }),
    prisma.mistake.findMany({ where: { studentId }, orderBy: { lastSeen: 'desc' } }),
  ]);
  return { progress, mistakes };
}

function readAppearanceMetadata(metadata: Record<string, unknown>) {
  const raw = (metadata.appearance || {}) as Record<string, unknown>;
  return {
    copilotThemePreference: safeString(raw.copilotThemePreference) || 'calm-forest',
    studyAtmosphere: safeString(raw.studyAtmosphere) || 'calm',
  };
}

function readLearningStudioMetadata(metadata: Record<string, unknown>) {
  const raw = (metadata.learningStudio || {}) as Record<string, unknown>;
  return {
    mediaPreferences: raw.mediaPreferences || { preferredRecapType: 'mixed' },
    learningStyleSignals: raw.learningStyleSignals || null,
  };
}

function normalizeSessionLanguageState(state: unknown, preferredLanguage: string, lastDetected?: string | null) {
  if (state && typeof state === 'object') return state as any;
  return { preferredLanguage, lastDetectedInputLanguage: lastDetected || null, mode: 'auto' };
}

function normalizeCopilotThemePreferenceValue(value: unknown): string {
  const str = safeString(value);
  const allowed = ['steadfast-default', 'calm-forest', 'ocean-glass', 'midnight-scholar', 'rose-studio', 'ember-focus', 'violet-library', 'soft-paper'];
  return allowed.includes(str) ? str : 'calm-forest';
}

function normalizeStudyAtmospherePreferenceValue(value: unknown, fallback: string): string {
  const str = safeString(value);
  return str || fallback;
}

function normalizeMediaPreferencesValue(value: unknown, fallback: unknown) {
  if (value && typeof value === 'object') return value;
  return fallback || { preferredRecapType: 'mixed' };
}

function normalizeLearningStyleSignals(value: unknown) {
  if (value && typeof value === 'object') return value;
  return null;
}

// ── GET /preferences ──
router.get('/preferences', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  logger.debug({ userId: req.user?.id }, '[API] /preferences hit');
  try {
    const [prefs, metadata] = await Promise.all([
      getOrCreateCopilotPreferences(req.user!.id),
      getCopilotPreferencesMetadata(req.user!.id),
    ]);
    const preferredLanguage = normalizeVoiceLanguageMode(prefs?.preferredLanguage);
    const interests = Array.isArray(prefs?.interests)
      ? prefs.interests.filter((item: any) => typeof item === 'string').map((item: string) => item.trim()).filter(Boolean)
      : [];
    const sessionLanguageState = normalizeSessionLanguageState(metadata.sessionLanguageState, preferredLanguage);
    const appearance = readAppearanceMetadata(metadata);
    const learningStudio = readLearningStudioMetadata(metadata);
    res.status(200).json({
      ...prefs,
      preferredLanguage,
      interests,
      sessionLanguageState,
      copilotThemePreference: appearance.copilotThemePreference,
      studyAtmosphere: appearance.studyAtmosphere,
      mediaPreferences: learningStudio.mediaPreferences,
      learningStyleSignals: learningStudio.learningStyleSignals,
    });
  } catch (error) {
    logger.error({ error: String(error), userId: req.user?.id }, '[Backend] Error fetching preferences');
    res.status(500).send({ message: 'Could not load preferences right now.' });
  }
});

// ── POST /preferences/update ──
router.post('/preferences/update', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const preferredLanguage = normalizeVoiceLanguageMode(req.body?.preferredLanguage);
    const interestsRaw = Array.isArray(req.body?.interests) ? req.body.interests : [];
    const interests = interestsRaw
      .filter((item: any) => typeof item === 'string')
      .map((item: string) => item.trim())
      .filter(Boolean)
      .slice(0, MAX_INTERESTS);
    const existingMetadata = await getCopilotPreferencesMetadata(studentId);
    const existingAppearance = readAppearanceMetadata(existingMetadata);
    const existingLearningStudio = readLearningStudioMetadata(existingMetadata);
    const sessionLanguageState = normalizeSessionLanguageState(
      req.body?.sessionLanguageState,
      preferredLanguage,
      (existingMetadata.sessionLanguageState as any)?.lastDetectedInputLanguage || null
    );
    const copilotThemePreference = normalizeCopilotThemePreferenceValue(
      req.body?.copilotThemePreference || existingAppearance.copilotThemePreference
    );
    const studyAtmosphere = normalizeStudyAtmospherePreferenceValue(
      req.body?.studyAtmosphere,
      existingAppearance.studyAtmosphere
    );
    const mediaPreferences = normalizeMediaPreferencesValue(
      req.body?.mediaPreferences,
      existingLearningStudio.mediaPreferences
    );
    const learningStyleSignals = normalizeLearningStyleSignals(
      req.body?.learningStyleSignals ?? existingLearningStudio.learningStyleSignals
    );

    const saved = await prisma.copilotPreferences.upsert({
      where: { userId: studentId },
      update: { preferredLanguage, interests: interests as Prisma.JsonArray },
      create: { userId: studentId, preferredLanguage, interests: interests as Prisma.JsonArray },
    });
    await updateCopilotPreferencesMetadata(studentId, {
      ...existingMetadata,
      sessionLanguageState,
      appearance: {
        ...existingAppearance,
        copilotThemePreference,
        studyAtmosphere,
      },
      learningStudio: {
        ...existingLearningStudio,
        mediaPreferences,
        learningStyleSignals,
      },
    });

    const redis = await getRedisClient();
    if (redis) await redis.del(`copilot:preferences:${studentId}`);

    res.status(200).json({
      message: 'Preferences updated',
      preferredLanguage: normalizeVoiceLanguageMode(saved.preferredLanguage),
      interests: Array.isArray(saved.interests) ? saved.interests : [],
      lastUpdatedAt: saved.lastUpdatedAt,
      sessionLanguageState,
      copilotThemePreference,
      studyAtmosphere,
      mediaPreferences,
      learningStyleSignals,
    });
  } catch (error) {
    res.status(500).send({ message: 'Internal server error' });
  }
});

// ── GET /memory/student ──
router.get('/memory/student', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const memory = await getStudentMemoryPayload(studentId);
    res.status(200).send(memory);
  } catch (error) {
    logger.error({ err: error, userId: req.user?.id }, '[API] /memory/student failed');
    res.status(500).send({ message: 'Error' });
  }
});

// ── POST /memory/update ──
router.post('/memory/update', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const type = safeString(req.body?.type);
    const data = req.body?.data;
    const studentId = req.user!.id;
    if (!data || (type !== 'progress' && type !== 'mistake')) {
      return res.status(400).send({ message: 'Invalid memory update payload' });
    }
    if (type === 'progress') {
      await prisma.progress.upsert({ where: { id: data.id || 'new' }, create: { ...data, studentId }, update: data });
    } else if (type === 'mistake') {
      await prisma.mistake.create({ data: { ...data, studentId } });
    }
    const redis = await getRedisClient();
    if (redis) await redis.del(`memory:${studentId}`);
    res.status(200).send({ message: 'Updated' });
  } catch {
    res.status(500).send({ message: 'Error' });
  }
});

// ── POST /memory/mastery/upsert ──
router.post('/memory/mastery/upsert', schoolAuthMiddleware, async (req: AuthedRequest, res) => {
  try {
    const studentId = req.user!.id;
    const subject = safeString(req.body?.subject).trim();
    const topic = safeString(req.body?.topic).trim();
    const misconception = safeString(req.body?.misconception).trim();
    const mastery = Math.max(0, Math.min(100, Number(req.body?.mastery || 0)));

    if (!subject || !topic) {
      return res.status(400).send({ message: 'subject and topic are required.' });
    }

    const existingProgress = await prisma.progress.findFirst({
      where: { studentId, subject, topic },
      orderBy: { updatedAt: 'desc' },
    });

    const progress = existingProgress
      ? await prisma.progress.update({
          where: { id: existingProgress.id },
          data: { mastery },
        })
      : await prisma.progress.create({
          data: { studentId, subject, topic, mastery },
        });

    let mistake = null;
    if (misconception) {
      const existingMistake = await prisma.mistake.findFirst({
        where: { studentId, topic, error: misconception },
        orderBy: { lastSeen: 'desc' },
      });
      mistake = existingMistake
        ? await prisma.mistake.update({
            where: { id: existingMistake.id },
            data: { attempts: { increment: 1 }, lastSeen: new Date() },
          })
        : await prisma.mistake.create({
            data: { studentId, topic, error: misconception, attempts: 1 },
          });
    }

    const redis = await getRedisClient();
    if (redis) {
      await redis.del(`memory:${studentId}`);
    }

    return res.status(200).send({ progress, mistake });
  } catch {
    return res.status(500).send({ message: 'Error' });
  }
});

export default router;
