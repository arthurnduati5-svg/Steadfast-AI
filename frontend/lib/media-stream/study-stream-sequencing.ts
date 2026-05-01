import type { MediaStreamItem } from '@/lib/types';

export type StudySequenceEntryLike = {
  entry: {
    id: string;
    title: string;
    topic?: string | null;
    subject?: string | null;
    revisionItemId?: string | null;
    mediaKind?: string | null;
  };
  rankScore: number;
  reason?: string | null;
  nextMove?: string | null;
  quickCheck?: string | null;
  studyGuide?: MediaStreamItem['studyGuide'];
};

function normalizeStudyKey(value: string | null | undefined) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

export function buildStudySequenceKey(item: StudySequenceEntryLike) {
  const revisionKey = normalizeStudyKey(item.entry.revisionItemId);
  if (revisionKey) return `revision:${revisionKey}`;
  const topicKey = normalizeStudyKey(item.entry.topic || item.entry.title);
  const mediaKind = normalizeStudyKey(item.entry.mediaKind || 'media');
  return `${topicKey || normalizeStudyKey(item.entry.subject || item.entry.title)}:${mediaKind}`;
}

export function dedupeStudySequenceItems<T extends StudySequenceEntryLike>(items: T[]) {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const item of items) {
    const key = buildStudySequenceKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

export function pickUpcomingStudyLineup<T extends StudySequenceEntryLike>(items: T[], activeIndex: number, maxItems = 3) {
  if (activeIndex < 0) return dedupeStudySequenceItems(items).slice(0, maxItems);
  return dedupeStudySequenceItems(items.slice(activeIndex + 1)).slice(0, maxItems);
}
