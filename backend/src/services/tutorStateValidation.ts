// ─────────────────────────────────────────────────────────────
// Steadfast AI — Tutor State Runtime Validation
// Uses Zod schemas to validate all tutor-state request bodies.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

/**
 * Allowed learning modes for the tutor state kernel.
 */
export const learningModeSchema = z.enum([
  'learn',
  'practice',
  'review',
  'revision',
  'research',
  'artifact_help',
  'video_help',
]);

/**
 * POST /resolve request body validation.
 */
export const resolveTutorStateRequestSchema = z.object({
  sessionId: z.string().trim().max(256).optional(),
  message: z.string().trim().max(10000).optional(),
  learningMode: learningModeSchema.optional(),
  activeSubject: z.string().trim().max(256).optional(),
  activeTopic: z.string().trim().max(256).optional(),
  activeSkillIds: z
    .array(z.string().trim().max(128))
    .max(50)
    .optional()
    .default([]),
  activeArtifactIds: z
    .array(z.string().trim().max(128))
    .max(50)
    .optional()
    .default([]),
  activeVideoId: z.string().trim().max(256).nullable().optional(),
  primaryLanguage: z.string().trim().max(64).optional(),
  supportLanguage: z.string().trim().max(64).nullable().optional(),
  includeDebug: z.boolean().optional(),
});

/**
 * PATCH tutor-state request body validation.
 */
export const patchTutorStateRequestSchema = z.object({
  sessionId: z.string().trim().max(256).nullable().optional(),
  activeSubject: z.string().trim().max(256).nullable().optional(),
  activeTopic: z.string().trim().max(256).nullable().optional(),
  activeSkillIds: z
    .array(z.string().trim().max(128))
    .max(50)
    .optional(),
  activeArtifactIds: z
    .array(z.string().trim().max(128))
    .max(50)
    .optional(),
  activeVideoId: z.string().trim().max(256).nullable().optional(),
  learningMode: learningModeSchema.optional(),
  primaryLanguage: z.string().trim().max(64).optional(),
  supportLanguage: z.string().trim().max(64).nullable().optional(),
});

/**
 * GET /tutor-state query params.
 */
export const getTutorStateQuerySchema = z.object({
  sessionId: z.string().trim().max(256).optional(),
});

// Inferred types for internal use
export type ResolveTutorStateRequestValidated = z.infer<typeof resolveTutorStateRequestSchema>;
export type PatchTutorStateRequestValidated = z.infer<typeof patchTutorStateRequestSchema>;
