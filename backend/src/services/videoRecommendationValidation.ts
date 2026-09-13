// ─────────────────────────────────────────────────────────────
// Steadfast AI — Video Recommendation Validation v1
// Zod schemas for request validation, body spoofing protection
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

export const videoProviderSchema = z.enum(['youtube', 'manual', 'school_library', 'unknown']);
export const videoCandidateSourceSchema = z.enum(['provider_search', 'teacher_submitted', 'artifact_linked', 'chat_context', 'manual_candidate', 'cached_candidate']);

export const videoCandidateInputSchema = z.object({
  provider: videoProviderSchema,
  providerVideoId: z.string().trim().max(256).nullable().optional(),
  url: z.string().url().max(2048).nullable().optional(),
  title: z.string().trim().max(512).nullable().optional(),
  description: z.string().trim().max(4000).nullable().optional(),
  channelTitle: z.string().trim().max(256).nullable().optional(),
  language: z.string().trim().max(50).nullable().optional(),
  transcriptSummary: z.string().trim().max(2000).nullable().optional(),
  durationSeconds: z.number().int().positive().max(86400).nullable().optional(),
  thumbnailUrl: z.string().url().max(2048).nullable().optional(),
  source: videoCandidateSourceSchema,
});

export const videoRecommendationRequestSchema = z.object({
  sessionId: z.string().trim().max(256).nullable().optional(),
  message: z.string().trim().max(4000).nullable().optional(),

  subject: z.string().trim().max(256).nullable().optional(),
  topic: z.string().trim().max(256).nullable().optional(),
  skillIds: z.array(z.string().trim().max(256)).max(50).optional().default([]),

  syllabusId: z.string().trim().max(256).nullable().optional(),
  syllabusObjectiveIds: z.array(z.string().trim().max(256)).max(50).optional().default([]),

  learnerAge: z.number().int().min(3).max(25).nullable().optional(),
  gradeLevel: z.string().trim().max(50).nullable().optional(),
  languagePreference: z.string().trim().max(50).nullable().optional(),

  schoolPolicyProfileId: z.string().trim().max(256).nullable().optional(),

  activeArtifactIds: z.array(z.string().trim().max(256)).max(50).optional().default([]),
  activeVideoIds: z.array(z.string().trim().max(256)).max(50).optional().default([]),

  candidates: z.array(videoCandidateInputSchema).max(30).optional().default([]),

  query: z.string().trim().max(500).nullable().optional(),
  maxResults: z.number().int().min(1).max(10).optional().default(5),
  includeProviderSearch: z.boolean().optional().default(false),
  includeTeacherReviewItems: z.boolean().optional().default(false),

  // v1.1: Duration preference for scoring
  preferredDurationMinutes: z.number().int().min(1).max(120).nullable().optional(),
});

export type VideoRecommendationRequestValidated = z.infer<typeof videoRecommendationRequestSchema>;
