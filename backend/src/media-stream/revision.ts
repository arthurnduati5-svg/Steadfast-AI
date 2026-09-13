// ─── Revision, Notebook & Assessment Helper Functions ─────────────
// Extracted from backend/src/routes/ai.ts inline helpers.

import { safeString, asRecord } from './validation.js';
import { parseIsoDate } from './scoring.js';
import { limitText, extractTopicHints } from './metadata.js';

export function deriveTitleFromText(text: string): string | null {
  const clean = safeString(text)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean || clean.length < 4) return null;
  const lines = clean.split(/[.\n!?]+/).map((line) => line.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length >= 8 && line.length <= 100) return line.slice(0, 90).trim();
  }
  return clean.slice(0, 90).trim();
}

export function cleanTitleText(title: string): string {
  return safeString(title)
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/[`*_~>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export const TITLE_FORBIDDEN = [
  'new chat', 'new session', 'chat session', 'conversation', 'untitled',
  'socratic tutor', 'steadfast', 'ai tutor', 'hello', 'hi', 'hey',
];

export const TITLE_STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'shall', 'can', 'need', 'dare', 'ought', 'used',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
  'through', 'during', 'before', 'after', 'above', 'below', 'between',
  'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'their',
  'what', 'which', 'who', 'whom', 'when', 'where', 'why', 'how',
  'and', 'but', 'or', 'nor', 'not', 'so', 'yet', 'if', 'because',
  'about', 'just', 'also', 'very', 'too', 'really', 'quite',
  'please', 'thank', 'thanks', 'yes', 'no', 'ok', 'okay',
]);

export function isPlaceholderTitle(title: string): boolean {
  const clean = safeString(title).trim().toLowerCase();
  if (!clean) return true;
  return TITLE_FORBIDDEN.some((word) => clean === word || clean.startsWith(word));
}

export function extractKeywordTitle(text: string): string | null {
  const clean = safeString(text).replace(/\s+/g, ' ').trim();
  if (!clean || clean.length < 6) return null;
  const topicHints = extractTopicHints(clean);
  if (topicHints.length >= 2) {
    const candidate = topicHints.slice(0, 3).join(', ');
    return candidate.length <= 80 ? candidate : `${candidate.slice(0, 77).trimEnd()}...`;
  }
  const firstSentence = clean.split(/[.\n!?]/)[0]?.trim();
  if (firstSentence && firstSentence.length >= 8 && firstSentence.length <= 90) return cleanTitleText(firstSentence);
  return null;
}

export function normalizeTitleCandidate(candidate: string): string | null {
  const clean = cleanTitleText(candidate);
  if (!clean || clean.length < 4) return null;
  if (isPlaceholderTitle(clean)) return null;
  const words = clean.split(/\s+/);
  const meaningfulWords = words.filter((word) => !TITLE_STOPWORDS.has(word.toLowerCase()));
  if (meaningfulWords.length === 0) return null;
  return meaningfulWords.length >= 3 ? meaningfulWords.slice(0, 8).join(' ') : clean;
}

export function deriveTitleFromSessionMessages(messages: Array<{ role: string; content: string }>): string | null {
  const userMessages = messages
    .filter((msg) => msg.role === 'user')
    .map((msg) => safeString(msg.content).trim())
    .filter(Boolean);
  if (userMessages.length === 0) return null;
  const title = deriveTitleFromText(userMessages[0]);
  if (title && !isPlaceholderTitle(title)) return normalizeTitleCandidate(title);
  if (userMessages.length >= 2) {
    const secondTitle = deriveTitleFromText(userMessages[1]);
    if (secondTitle) return normalizeTitleCandidate(secondTitle);
  }
  return null;
}

export function deriveVideoDataFromMessage(message: any): Record<string, unknown> | null {
  const metadata = asRecord(message?.metadata);
  const videoData = asRecord(metadata?.videoData);
  if (videoData?.id) {
    return { id: safeString(videoData.id), title: safeString(videoData.title), channel: safeString(videoData.channel) };
  }
  const content = safeString(message?.content);
  const youtubeMatch = content.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  if (youtubeMatch) {
    return { id: youtubeMatch[1], title: safeString(videoData?.title) || 'YouTube Video' };
  }
  return null;
}

export function extractYoutubeVideoIdFromText(text: string): string | null {
  const match = safeString(text).match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  );
  return match?.[1] || null;
}

export function parseCachedRevisionFlashcards(value: unknown): any[] {
  const raw = safeString(value).trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function buildRevisionNotebookChaptersForRoute(args: {
  overview: any;
  maxChapters?: number;
}): any[] {
  const maxChapters = args.maxChapters || 12;
  const overview = args.overview || {};
  const chapters: any[] = [];
  const collections = Array.isArray(overview.collections) ? overview.collections.slice(0, maxChapters) : [];
  for (const collection of collections) {
    chapters.push({
      id: safeString(collection.id),
      title: safeString(collection.title) || 'Untitled Chapter',
      subject: safeString(collection.subject) || null,
      itemCount: Number(collection.itemCount) || 0,
      lastModified: parseIsoDate(collection.updatedAt)?.toISOString() || null,
    });
  }
  return chapters;
}

export function getRevisionChapterSummaryFallbackForRoute(collection: any): string {
  const itemCount = Number(collection?.itemCount || 0);
  if (itemCount === 0) return 'No items in this chapter yet.';
  const completedCount = Number(collection?.completedCount || 0);
  return `${completedCount}/${itemCount} items reviewed`;
}

export function resolveAssessmentHttpStatus(error: any): number {
  if (!error) return 200;
  if (error.message?.includes('not found') || error.code === 'NOT_FOUND') return 404;
  if (error.message?.includes('already') || error.code === 'CONFLICT') return 409;
  if (error.message?.includes('forbidden') || error.code === 'FORBIDDEN') return 403;
  if (error.message?.includes('not allowed') || error.message?.includes('expired')) return 400;
  return 500;
}

export function scoreHistoryMessageImportance(msg: any): number {
  let score = 1;
  const metadata = msg?.metadata || {};
  if (msg.role === 'user') score += 1;
  if (msg.image) score += 3;
  if (msg.videoData) score += 3;
  if (Array.isArray(msg.sources) && msg.sources.length > 0) score += Math.min(3, msg.sources.length);
  if (Array.isArray(metadata?.tutorArtifacts) && metadata.tutorArtifacts.length > 0) score += 4;
  if (Array.isArray(metadata?.attachments) && metadata.attachments.length > 0) score += 3;
  if (metadata?.savedRevisionNote) score += 2;
  if (Array.isArray(metadata?.tutorRevisionNotes) && metadata.tutorRevisionNotes.length > 0) score += 2;
  return score;
}

export function trimHistoryForModel(messages: { role: string; content: string }[], maxMessages: number): { role: string; content: string }[] {
  const scored = messages.map((msg) => ({ msg, score: scoreHistoryMessageImportance(msg) }));
  scored.sort((a, b) => b.score - a.score);
  const selected = scored.slice(0, maxMessages);
  const selectedSet = new Set(selected.map((s) => s.msg));
  const preserved = messages.filter((msg) => selectedSet.has(msg));
  return preserved.length > 0 ? preserved : messages.slice(-1);
}
