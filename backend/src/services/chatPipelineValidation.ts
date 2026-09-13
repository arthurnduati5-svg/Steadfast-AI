// ─────────────────────────────────────────────────────────────
// Steadfast AI — Chat Pipeline Validation v1
// Validates integrated chat requests and protects identity.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';

function uniqueStringArray(max: number) {
  return z
    .array(z.string().trim().max(256))
    .max(max)
    .transform((arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))]);
}

function nullableBounded(max: number) {
  return z.string().trim().max(max).nullable().optional();
}

export const integratedChatRequestSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(4000, 'Message must be 4000 characters or less.'),

  sessionId: nullableBounded(256),
  mode: z.enum(['standard', 'streaming', 'voice', 'debug', 'unknown']).optional().default('standard'),

  activeSubject: nullableBounded(256),
  activeTopic: nullableBounded(256),
  activeSkillIds: uniqueStringArray(50).optional().default([]),

  activeArtifactIds: uniqueStringArray(50).optional().default([]),
  activeVideoId: nullableBounded(128),

  learnerAnswerSummary: nullableBounded(1200),
  sourceCandidateIds: uniqueStringArray(50).optional().default([]),

  clientMessageId: nullableBounded(64),
  includeDebug: z.boolean().optional().default(false),
});

export type IntegratedChatRequestValidated = z.infer<typeof integratedChatRequestSchema>;
