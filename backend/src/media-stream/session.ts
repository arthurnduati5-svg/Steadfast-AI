// ─── Session, Conversation State & Learner Stage Helpers ─────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import type { TutorState, TutorArtifact, SemanticSessionSnapshot, VideoTutorSnapshot } from './types.js';
import { safeString, getTutorStateFromMetadata } from './validation.js';
import { parseIsoDate } from './scoring.js';
import { limitText, extractTopicHints } from './metadata.js';
import { inferSubjectFromTopic } from './metadata.js';

export function deriveLearnerStage(args: {
  memory?: { progress?: any[]; mistakes?: any[] };
  activeTopic?: string;
}): 'support' | 'developing' | 'secure' | undefined {
  const activeTopic = safeString(args.activeTopic).toLowerCase();
  const progress = Array.isArray(args.memory?.progress) ? args.memory!.progress : [];
  const mistakes = Array.isArray(args.memory?.mistakes) ? args.memory!.mistakes : [];

  const topicProgress = progress.find((entry: any) => safeString(entry?.topic).toLowerCase() === activeTopic);
  const topicMistake = mistakes.find((entry: any) => safeString(entry?.topic).toLowerCase() === activeTopic);

  const mastery = Number(topicProgress?.mastery || 0);
  const attempts = Number(topicMistake?.attempts || 0);
  if (attempts >= 3 || mastery < 35) return 'support';
  if (mastery >= 75 && attempts <= 1) return 'secure';
  if (activeTopic && !topicProgress && topicMistake) return 'support';
  if (activeTopic && topicProgress) return 'developing';
  return undefined;
}

export function deriveRecommendedMode(stage?: 'support' | 'developing' | 'secure'): 'guided' | 'practice' | 'challenge' | undefined {
  if (stage === 'support') return 'guided';
  if (stage === 'secure') return 'challenge';
  if (stage === 'developing') return 'practice';
  return undefined;
}

export function extractTeacherCorrections(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const corrections: string[] = [];
  for (const message of messages) {
    if (message.role !== 'model') continue;
    const content = safeString(message.content).replace(/\s+/g, ' ').trim();
    if (!content) continue;

    const ruleMatches = [
      ...content.matchAll(/\b(?:remember|key rule|important|definition|means|formula)\b[:\-]?\s*([^.?!\n]{8,180})/gi),
      ...content.matchAll(/\b(?:always|never|do not|don't)\b[^.?!\n]{8,180}/gi),
    ];
    for (const match of ruleMatches) {
      const candidate = limitText(match[1] || match[0] || '', 180);
      if (!candidate) continue;
      if (!corrections.includes(candidate)) corrections.push(candidate);
      if (corrections.length >= 6) return corrections;
    }
  }
  return corrections;
}

export function extractStudentPreferenceSignals(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const preferences: string[] = [];
  const pushPreference = (value: string) => {
    const cleaned = limitText(value, 160);
    if (!cleaned) return;
    if (!preferences.includes(cleaned)) preferences.push(cleaned);
  };

  for (const message of messages) {
    if (message.role !== 'user') continue;
    const content = safeString(message.content).replace(/\s+/g, ' ').trim();
    if (!content) continue;

    const directMatches = [
      content.match(/\bi prefer\s+([^.?!\n]+)/i)?.[1],
      content.match(/\bplease\s+(?:use|speak in|explain in)\s+([^.?!\n]+)/i)?.[1],
      content.match(/\bremember(?: this)?[\-:]\s*([^.?!\n]+)/i)?.[1],
      content.match(/\bmy weak topic is\s+([^.?!\n]+)/i)?.[1],
    ].filter(Boolean) as string[];

    for (const candidate of directMatches) {
      pushPreference(candidate);
      if (preferences.length >= 6) return preferences;
    }
  }

  return preferences;
}

export function extractEvidenceReferences(messages: Array<{ role: string; content: string; metadata?: any }>): string[] {
  const refs: string[] = [];
  const pushRef = (value: string) => {
    const cleaned = limitText(value, 140);
    if (!cleaned) return;
    if (!refs.includes(cleaned)) refs.push(cleaned);
  };

  for (const message of messages) {
    const sources = Array.isArray(message.metadata?.sources) ? message.metadata.sources : [];
    for (const source of sources) {
      const name = safeString(source?.sourceName).trim();
      const url = safeString(source?.url).trim();
      if (name || url) pushRef([name, url].filter(Boolean).join(' - '));
      if (refs.length >= 6) return refs;
    }

    const content = safeString(message.content);
    for (const match of content.matchAll(/\b(?:surah|sura|ayah|hadith|bukhari|muslim|tirmidhi|ab[uū]\s*dawud|ibn\s*majah|nasai|fiqh)\b[^.?!\n]{0,80}/gi)) {
      pushRef(match[0]);
      if (refs.length >= 6) return refs;
    }
  }

  return refs;
}

export function buildSemanticSessionSnapshot(messages: Array<{ role: string; content: string; metadata?: any }>): Pick<
  TutorState,
  'semanticMemory' | 'teacherCorrections' | 'studentPreferences' | 'evidenceReferences'
> {
  const studentPreferences = extractStudentPreferenceSignals(messages);
  const teacherCorrections = extractTeacherCorrections(messages);
  const evidenceReferences = extractEvidenceReferences(messages);

  const semanticParts: string[] = [];
  if (studentPreferences.length > 0) {
    semanticParts.push(`Student preferences and constraints: ${studentPreferences.join(' | ')}`);
  }
  if (teacherCorrections.length > 0) {
    semanticParts.push(`Teacher corrections and key rules: ${teacherCorrections.join(' | ')}`);
  }
  if (evidenceReferences.length > 0) {
    semanticParts.push(`Evidence anchors already in this session: ${evidenceReferences.join(' | ')}`);
  }

  return {
    semanticMemory: semanticParts.join('\n').trim() || undefined,
    teacherCorrections: teacherCorrections.length > 0 ? teacherCorrections : undefined,
    studentPreferences: studentPreferences.length > 0 ? studentPreferences : undefined,
    evidenceReferences: evidenceReferences.length > 0 ? evidenceReferences : undefined,
  };
}

export function mergeUniqueTextLists(...groups: Array<string[] | undefined>): string[] | undefined {
  const merged: string[] = [];
  for (const group of groups) {
    if (!Array.isArray(group)) continue;
    for (const value of group) {
      const cleaned = limitText(String(value || '').replace(/\s+/g, ' ').trim(), 180);
      if (!cleaned) continue;
      if (!merged.includes(cleaned)) merged.push(cleaned);
      if (merged.length >= 8) return merged;
    }
  }
  return merged.length > 0 ? merged : undefined;
}

export function buildVideoTranscriptFallbackSummary(args: {
  title?: string;
  channel?: string;
  topic?: string;
  whyRecommended?: string;
}): VideoTutorSnapshot {
  const title = safeString(args.title).trim();
  const topic = safeString(args.topic).trim();
  const whyRecommended = limitText(safeString(args.whyRecommended).trim(), 240);
  const concepts = extractTopicHints(`${title} ${topic} ${whyRecommended}`);
  const summary = [
    title ? `Current study video: ${title}.` : '',
    topic ? `Use it as support for ${topic}.` : '',
    whyRecommended ? whyRecommended : '',
  ].filter(Boolean).join(' ');

  return {
    activeVideoSummary: summary || undefined,
    activeVideoConcepts: concepts.length > 0 ? concepts : undefined,
    activeVideoWhyRecommended: whyRecommended || undefined,
    transcriptAvailable: false,
  };
}

export const EMPTY_METACOGNITIVE_PROFILE = {
  evidenceCount: 0,
  recurringErrorPatterns: [],
  preferredSupportPatterns: [],
  transferStrengths: [],
  reflectionSignals: [],
  recentSnapshot: null,
  lastReflectionSignal: null,
  lastUpdatedAt: null,
};

export function sanitizeSources(
  sources:
    | Array<{
        sourceName?: string;
        url?: string;
        domain?: string | null;
        sourceType?: string | null;
        trustTier?: string | null;
        relevanceReason?: string | null;
        recencyReason?: string | null;
        educationalFit?: string | null;
      }>
    | undefined
): Array<{
  sourceName: string;
  url: string;
  domain?: string | null;
  sourceType?: string | null;
  trustTier?: 'high' | 'medium' | 'limited' | null;
  relevanceReason?: string | null;
  recencyReason?: string | null;
  educationalFit?: string | null;
}> {
  if (!Array.isArray(sources)) return [];
  const seen = new Set<string>();
  const cleaned: Array<{
    sourceName: string;
    url: string;
    domain?: string | null;
    sourceType?: string | null;
    trustTier?: 'high' | 'medium' | 'limited' | null;
    relevanceReason?: string | null;
    recencyReason?: string | null;
    educationalFit?: string | null;
  }> = [];

  for (const source of sources) {
    const url = safeString(source?.url).trim();
    const sourceName = safeString(source?.sourceName).trim() || 'Source';
    if (!url || /example\.com/i.test(url)) continue;
    // Note: isTrustedSource check removed; caller should apply it separately
    if (seen.has(url)) continue;
    seen.add(url);
    const trustTier = safeString(source?.trustTier).trim();
    cleaned.push({
      sourceName,
      url,
      domain: safeString(source?.domain).trim() || null,
      sourceType: safeString(source?.sourceType).trim() || null,
      trustTier: ['high', 'medium', 'limited'].includes(trustTier) ? (trustTier as 'high' | 'medium' | 'limited') : null,
      relevanceReason: limitText(safeString(source?.relevanceReason).trim(), 180) || null,
      recencyReason: limitText(safeString(source?.recencyReason).trim(), 180) || null,
      educationalFit: limitText(safeString(source?.educationalFit).trim(), 180) || null,
    });
  }

  return cleaned;
}

export function looksLikeContextDependentFollowUp(text: string): boolean {
  const raw = safeString(text).trim().toLowerCase();
  if (!raw) return false;
  return (
    /\b(what about|how about|tell me more|explain further|continue|go on|and then|so then|and also|why is that|how is that|so what|what next|can you show me)\b/i.test(raw) ||
    /\b(this|that|it|the same|another|one more|the next)\b.{0,20}\b(step|example|question|problem|method|way|approach)\b/i.test(raw)
  );
}

export const buildEffectiveConversationState = (prior: any, next: any): any => {
  return {
    ...prior,
    ...next,
    lastSearchTopic: next.lastSearchTopic ?? prior.lastSearchTopic ?? [],
    retrievedSourceSet: next.retrievedSourceSet ?? prior.retrievedSourceSet ?? [],
  };
};

export function buildScopedChatCacheKey(args: {
  studentId: string;
  sessionId: string;
  message: string;
  preferredLanguage?: string;
  gradeLevel?: string;
  activeTopic?: string;
  forceWebSearch?: boolean;
  focusMode?: boolean;
  examMode?: boolean;
  workspaceDestination?: string;
  workspaceStudyMode?: string;
  includeVideos?: boolean;
  tutorActionId?: string;
  tutorActionSourceMessageId?: string;
  tutorActionSelectedText?: string;
  tutorActionLinkedArtifactId?: string;
}): string {
  const { createHash } = require('crypto');
  const { CACHE_VERSION } = require('./types.js');
  const { normalizeCacheText } = require('./validation.js');
  const payload = {
    v: CACHE_VERSION,
    studentId: safeString(args.studentId),
    sessionId: safeString(args.sessionId),
    message: normalizeCacheText(args.message),
    preferredLanguage: safeString(args.preferredLanguage).toLowerCase(),
    gradeLevel: safeString(args.gradeLevel).toLowerCase(),
    activeTopic: normalizeCacheText(args.activeTopic || ''),
    forceWebSearch: Boolean(args.forceWebSearch),
    focusMode: Boolean(args.focusMode),
    examMode: Boolean(args.examMode),
    workspaceDestination: safeString(args.workspaceDestination).toLowerCase(),
    workspaceStudyMode: safeString(args.workspaceStudyMode).toLowerCase(),
    includeVideos: Boolean(args.includeVideos),
    tutorActionId: safeString(args.tutorActionId),
    tutorActionSourceMessageId: safeString(args.tutorActionSourceMessageId),
    tutorActionSelectedText: normalizeCacheText(args.tutorActionSelectedText || ''),
    tutorActionLinkedArtifactId: safeString(args.tutorActionLinkedArtifactId),
  };
  const digest = createHash('sha256').update(JSON.stringify(payload)).digest('hex');
  return `ai_cache:${digest}`;
}

export function buildTutorActionUiMeta(args: {
  tutorAction?: { id?: string };
  activeTopic?: string;
  savedRevisionNote?: any;
}): Record<string, unknown> | undefined {
  if (!args.tutorAction?.id) return undefined;
  const topic = safeString(args.activeTopic).trim() || 'this topic';
  switch (args.tutorAction.id) {
    case 'ask':
      return { actionId: 'ask', statusLine: 'Focused follow-up', nextStep: `Explain the key idea in ${topic} in one sentence, then answer one quick check.` };
    case 'hint':
      return { actionId: 'hint', statusLine: 'Scaffolded hint', nextStep: `Read the hint, then try the same step one more time on ${topic}.` };
    case 'breakdown':
      return { actionId: 'breakdown', statusLine: 'Broken-down explanation', nextStep: `Work through ${topic} one small step at a time.` };
    case 'summarize':
      return { actionId: 'summarize', statusLine: 'Concise summary', nextStep: `Summarize the key point in ${topic} in one clear sentence.` };
    case 'practice':
      return { actionId: 'practice', statusLine: 'Practice invitation', nextStep: `Try one practice question on ${topic} right here.` };
    case 'save':
      return { actionId: 'save', statusLine: 'Saved to Revision', savedRevisionNote: args.savedRevisionNote };
    default:
      return undefined;
  }
}
