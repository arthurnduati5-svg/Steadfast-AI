// ─────────────────────────────────────────────────────────────
// Steadfast AI — Intelligent Intent Resolver Validation v1
// Validates intent resolve requests and protects identity.
// ─────────────────────────────────────────────────────────────

import { z } from 'zod';
import { containsPromptInjection } from './intentResolverContracts';

// ── Helper: unique bounded string array ──
function uniqueStringArray(max: number) {
  return z
    .array(z.string().trim().max(256))
    .max(max)
    .transform((arr) => [...new Set(arr.map((s) => s.trim()).filter(Boolean))]);
}

// ── Helper: nullable bounded optional string ──
function nullableBounded(max: number) {
  return z.string().trim().max(max).nullable().optional();
}

// ── ResolveTutorIntentRequest ──
export const resolveTutorIntentRequestSchema = z.object({
  sessionId: nullableBounded(256),
  message: z
    .string()
    .trim()
    .min(1, 'Message is required.')
    .max(4000, 'Message must be 4000 characters or less.'),

  activeSubject: nullableBounded(256),
  activeTopic: nullableBounded(256),
  activeSkillIds: uniqueStringArray(50).optional().default([]),

  activeArtifactIds: uniqueStringArray(50).optional().default([]),
  activeVideoId: nullableBounded(128),

  learnerAnswerSummary: nullableBounded(1200),
  sourceCandidateIds: uniqueStringArray(50).optional().default([]),
  requestedMode: nullableBounded(64),

  includeDebug: z.boolean().optional().default(false),
});

export type ResolveTutorIntentRequestValidated = z.infer<typeof resolveTutorIntentRequestSchema>;

// ── Intent History Query ──
export const intentHistoryQuerySchema = z.object({
  sessionId: z.string().trim().max(256).optional(),
  primaryIntent: z.string().trim().max(64).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

// ── Prompt Injection Score ──
// Returns 0-1 score based on how many patterns match and the severity
export function scorePromptInjectionRisk(message: string): number {
  const text = String(message || '');
  let matches = 0;
  for (const pattern of [
    /\bignore\s+(previous|above|all)\s+(instructions|prompts|commands)\b/i,
    /\breveal\s+(system|hidden|internal)\s+prompt\b/i,
    /\byou\s+are\s+now\s+(admin|assistant|system|developer)\b/i,
    /\bbypass\s+(safety|guardrails|filter|restrictions?)\b/i,
    /\bshow\s+(private|other\s+student|confidential)\s+(data|information)\b/i,
  ]) {
    if (pattern.test(text)) matches++;
  }
  return Math.min(1, matches * 0.35);
}
