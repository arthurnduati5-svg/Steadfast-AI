import type {
  RevisionContentType,
  RevisionMediaRef,
  RevisionMediaType,
  RevisionSaveMode,
  RevisionSaveType,
  RevisionSourceType,
  RevisionSubject,
  SourceCitation,
  TutorArtifact,
  TutorState,
} from '../lib/types';

export type RawRevisionSourceMessage = {
  id?: string;
  content?: string;
  metadata?: Record<string, any> | null;
  videoData?: {
    id?: string;
    title?: string;
    thumbnailUrl?: string;
  } | null;
};

function safeString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: unknown): string {
  return safeString(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function limitRevisionText(value: string, maxChars = 220): string {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return clean.length <= maxChars ? clean : `${clean.slice(0, maxChars - 3).trimEnd()}...`;
}

const SUBJECT_ALIASES: Record<string, RevisionSubject> = {
  math: 'math',
  maths: 'math',
  mathematics: 'math',
  algebra: 'math',
  english: 'english',
  grammar: 'english',
  kiswahili: 'kiswahili',
  swahili: 'kiswahili',
  arabic: 'arabic',
  biology: 'biology',
  bio: 'biology',
  chemistry: 'chemistry',
  chem: 'chemistry',
  physics: 'physics',
  geography: 'geography',
  history: 'history',
  literature: 'literature',
  business: 'business',
  commerce: 'business',
  ict: 'ict_coding',
  coding: 'ict_coding',
  code: 'ict_coding',
  programming: 'ict_coding',
  'ict and coding': 'ict_coding',
  ire: 'ire',
  'islamic religious education': 'ire',
  'islamic studies': 'ire',
  islamic: 'ire',
  kindergarten: 'kindergarten',
  'kindergarten modules': 'kindergarten',
};

export function normalizeRevisionSubject(value?: string | null): RevisionSubject | null {
  const normalized = normalizeKey(value);
  if (!normalized) return null;
  return SUBJECT_ALIASES[normalized] || null;
}

export function inferRevisionSubjectFromTopic(topic: string): RevisionSubject | null {
  const lower = safeString(topic).toLowerCase();
  if (!lower) return null;
  if (/\b(quran|surah|ayah|hadith|fiqh|seerah|sirah|tajweed|dua|salah|wudu|wudhu|akhlaq|aqeedah|islam|ire)\b/.test(lower)) return 'ire';
  if (/\b(algebra|equation|fraction|ratio|geometry|trigonometry|simultaneous|calculus|math|mathematics|percentage|probability)\b/.test(lower)) return 'math';
  if (/\b(chemistry|atom|molecule|acid|base|reaction|periodic)\b/.test(lower)) return 'chemistry';
  if (/\b(physics|force|motion|electric|velocity|acceleration|energy)\b/.test(lower)) return 'physics';
  if (/\b(biology|cell|photosynthesis|genetics|ecosystem|respiration|osmosis|diffusion)\b/.test(lower)) return 'biology';
  if (/\b(english|grammar|comprehension|essay)\b/.test(lower)) return 'english';
  if (/\b(kiswahili|swahili)\b/.test(lower)) return 'kiswahili';
  if (/\barabic\b/.test(lower)) return 'arabic';
  if (/\b(history|government)\b/.test(lower)) return 'history';
  if (/\b(geography|map|climate|population)\b/.test(lower)) return 'geography';
  if (/\b(literature|poem|novel|play|character)\b/.test(lower)) return 'literature';
  if (/\b(business|accounting|trade|commerce)\b/.test(lower)) return 'business';
  if (/\b(ict|coding|programming|javascript|python|html|css)\b/.test(lower)) return 'ict_coding';
  if (/\b(kindergarten|phonics|counting|nursery)\b/.test(lower)) return 'kindergarten';
  return null;
}

export function inferRevisionSubject(args: {
  requestedSubject?: string | null;
  topic?: string | null;
  tutorArtifacts: TutorArtifact[];
  tutorState?: TutorState;
  sourceMessage?: RawRevisionSourceMessage | null;
}): RevisionSubject | null {
  const directCandidates = [
    args.requestedSubject,
    args.tutorArtifacts[0]?.subject,
    args.tutorState?.activeSubject,
    args.tutorState?.visibleFocusLabel,
    args.sourceMessage?.metadata?.presentation?.topicMastery?.subject,
    args.sourceMessage?.metadata?.presentation?.weakTopicRecovery?.subject,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeRevisionSubject(candidate || null);
    if (normalized) return normalized;
  }

  return inferRevisionSubjectFromTopic(safeString(args.topic));
}

export function inferRevisionSaveTypeFromContentType(contentType?: RevisionContentType | null): RevisionSaveType {
  switch (contentType) {
    case 'worked_step':
      return 'worked_step';
    case 'formula':
      return 'formula';
    case 'definition':
      return 'definition';
    case 'correction':
    case 'misconception':
    case 'exam_trap':
      return 'mistake_to_fix';
    case 'practice_tip':
      return 'practice_item';
    case 'summary':
      return 'short_note';
    default:
      return 'explanation';
  }
}

export function mapRevisionSaveTypeToContentType(saveType: RevisionSaveType): RevisionContentType {
  switch (saveType) {
    case 'worked_step':
      return 'worked_step';
    case 'short_note':
      return 'summary';
    case 'mistake_to_fix':
      return 'correction';
    case 'formula':
      return 'formula';
    case 'definition':
      return 'definition';
    case 'research_note':
      return 'summary';
    case 'practice_item':
      return 'practice_tip';
    default:
      return 'explanation';
  }
}

export function inferRevisionSaveType(args: {
  requestedSaveType?: string | null;
  requestedContentType?: RevisionContentType | null;
  tutorActionId?: string | null;
  targetContent: string;
  selectedText?: string | null;
  sources: SourceCitation[];
  sourceMessage?: RawRevisionSourceMessage | null;
  videoData?: { id?: string } | null;
}): RevisionSaveType {
  const requested = safeString(args.requestedSaveType).trim() as RevisionSaveType | '';
  if (
    requested === 'explanation' ||
    requested === 'worked_step' ||
    requested === 'short_note' ||
    requested === 'mistake_to_fix' ||
    requested === 'formula' ||
    requested === 'definition' ||
    requested === 'research_note' ||
    requested === 'practice_item'
  ) {
    return requested;
  }

  if (args.requestedContentType) return inferRevisionSaveTypeFromContentType(args.requestedContentType);

  const text = `${safeString(args.selectedText)} ${safeString(args.targetContent)}`.toLowerCase();
  if (args.sources.length > 0) return 'research_note';
  if (args.videoData?.id && /\b(source|research|reported|verified|according to)\b/.test(text)) return 'research_note';
  if (args.tutorActionId === 'practice' || /\bpractice|try this|similar question\b/.test(text)) return 'practice_item';
  if (/\b(common mistake|watch out|avoid this mistake|be careful|wrong idea|do not mix up)\b/.test(text)) return 'mistake_to_fix';
  if (/\bformula\b/.test(text) || /[A-Za-z]\s*=\s*[^=]/.test(safeString(args.selectedText) || safeString(args.targetContent))) return 'formula';
  if (/\bdefinition\b/.test(text) || /^[A-Z][A-Za-z\s-]{1,40}\s+(is|means)\b/.test(safeString(args.targetContent))) return 'definition';
  if (args.tutorActionId === 'breakdown' || /\bstep\b/.test(text) || /\b1[\).:-]\s/.test(safeString(args.targetContent))) return 'worked_step';
  if (args.tutorActionId === 'summarize' || /\bsummary|in short|key points\b/.test(text)) return 'short_note';
  return 'explanation';
}

export function deriveRevisionSaveMode(saveType: RevisionSaveType, current?: RevisionSaveMode | null): RevisionSaveMode | null {
  if (current) return current;
  switch (saveType) {
    case 'practice_item':
    case 'mistake_to_fix':
      return 'practice_later';
    case 'formula':
    case 'definition':
    case 'worked_step':
      return 'key_idea';
    case 'short_note':
      return 'quick_note';
    default:
      return 'key_idea';
  }
}

export function sanitizeRevisionTitle(value: string): string {
  const clean = safeString(value)
    .replace(/\s+/g, ' ')
    .replace(/^[^A-Za-z0-9\u0600-\u06FF]+/, '')
    .trim();
  return clean.slice(0, 90) || 'Saved revision note';
}

function extractFormula(text: string) {
  return safeString(text).match(/[A-Za-z][A-Za-z0-9\s]{0,20}=\s*[^\n.]{2,80}/)?.[0] || '';
}

export function deriveRevisionTitle(args: {
  saveType: RevisionSaveType;
  topic?: string | null;
  selectedText?: string | null;
  subject?: RevisionSubject | null;
  tutorArtifacts: TutorArtifact[];
  sourceMessage?: RawRevisionSourceMessage | null;
  videoData?: { title?: string } | null;
  targetContent: string;
}): string {
  const topic = safeString(args.topic).trim();
  const selected = limitRevisionText(safeString(args.selectedText), 68);
  const artifactLabel = safeString(args.tutorArtifacts[0]?.label).trim();
  const videoTitle = safeString(args.videoData?.title || args.sourceMessage?.videoData?.title).trim();
  const sourceSnippet = limitRevisionText(safeString(args.sourceMessage?.content), 68);
  const formulaSnippet = extractFormula(safeString(args.selectedText) || args.targetContent);

  if (args.saveType === 'formula' && formulaSnippet) return sanitizeRevisionTitle(formulaSnippet);
  if (args.saveType === 'definition' && selected) return sanitizeRevisionTitle(selected);
  if (args.saveType === 'mistake_to_fix' && topic) return sanitizeRevisionTitle(`${topic}: mistake to fix`);
  if (args.saveType === 'research_note' && topic) return sanitizeRevisionTitle(`${topic}: research note`);
  if (args.saveType === 'practice_item' && topic) return sanitizeRevisionTitle(`${topic}: practice item`);
  if (topic) return sanitizeRevisionTitle(topic);
  if (selected) return sanitizeRevisionTitle(selected);
  if (artifactLabel) return sanitizeRevisionTitle(artifactLabel);
  if (videoTitle) return sanitizeRevisionTitle(videoTitle);
  if (sourceSnippet) return sanitizeRevisionTitle(sourceSnippet);

  switch (args.saveType) {
    case 'formula':
      return 'Saved formula';
    case 'definition':
      return 'Saved definition';
    case 'worked_step':
      return 'Worked step';
    case 'mistake_to_fix':
      return 'Mistake to fix';
    case 'research_note':
      return 'Research note';
    case 'practice_item':
      return 'Practice item';
    case 'short_note':
      return 'Short note';
    default:
      return 'Saved explanation';
  }
}

export function deriveRevisionSummary(args: {
  saveType: RevisionSaveType;
  targetContent: string;
  selectedText?: string | null;
  topic?: string | null;
}): string {
  const selected = limitRevisionText(safeString(args.selectedText), 180);
  if (selected) return selected;
  const clean = safeString(args.targetContent).replace(/\s+/g, ' ').trim();
  if (!clean) {
    if (args.saveType === 'practice_item') return 'Saved a practice question to revisit later.';
    if (args.saveType === 'research_note') return 'Saved a source-backed study note.';
    return 'Saved from your study session.';
  }
  const sentence = clean.match(/[^.!?]+[.!?]?/u)?.[0] || clean;
  const preview = limitRevisionText(sentence, 180);

  if (args.saveType === 'mistake_to_fix' && !/\bmistake\b/i.test(preview)) {
    return limitRevisionText(`Mistake to fix: ${preview}`, 180);
  }
  if (args.saveType === 'research_note' && args.topic) {
    return limitRevisionText(`Source-backed note for ${args.topic}: ${preview}`, 180);
  }
  return preview;
}

export function deriveRevisionBody(args: {
  saveType: RevisionSaveType;
  targetContent: string;
  selectedText?: string | null;
}): string {
  const base = safeString(args.selectedText).trim() || safeString(args.targetContent).trim();
  const normalized = base.replace(/\s+/g, ' ').trim();
  if (!normalized) return '';

  switch (args.saveType) {
    case 'short_note':
      return limitRevisionText(normalized, 420);
    case 'formula':
      return limitRevisionText(normalized, 500);
    case 'definition':
      return limitRevisionText(normalized, 520);
    case 'mistake_to_fix':
      return limitRevisionText(normalized, 900);
    case 'practice_item':
      return limitRevisionText(normalized, 1200);
    default:
      return limitRevisionText(normalized, 1800);
  }
}

export function buildRevisionTags(args: {
  topic?: string | null;
  subject?: RevisionSubject | null;
  tutorArtifacts: TutorArtifact[];
  tutorState?: TutorState;
  saveType: RevisionSaveType;
}): string[] {
  const candidates = [
    safeString(args.topic).trim(),
    safeString(args.subject).trim(),
    args.saveType.replace(/_/g, ' '),
    ...(args.tutorArtifacts[0]?.topics || []),
    ...(args.tutorState?.activeArtifactLabels || []),
    ...(args.tutorState?.recentGoals || []),
  ];

  const seen = new Set<string>();
  return candidates
    .map((item) => safeString(item).trim())
    .filter(Boolean)
    .filter((item) => {
      const key = normalizeKey(item);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 8);
}

export function buildArtifactRefs(artifacts: TutorArtifact[]): RevisionMediaRef[] {
  return artifacts.slice(0, 4).map((artifact) => ({
    kind:
      artifact.kind === 'pdf'
        ? 'document'
        : artifact.kind === 'image'
          ? 'image'
          : 'artifact',
    id: artifact.id,
    artifactId: artifact.id,
    label: artifact.label,
    title: artifact.label,
    summary: artifact.summary,
  }));
}

function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }
  return value as T;
}

export function buildMediaRefs(args: {
  sourceMessage?: RawRevisionSourceMessage | null;
  tutorArtifacts: TutorArtifact[];
  videoData?: { id?: string; title?: string; thumbnailUrl?: string } | null;
  sources: SourceCitation[];
}): RevisionMediaRef[] {
  const refs: RevisionMediaRef[] = [];
  refs.push(...buildArtifactRefs(args.tutorArtifacts));

  const videoId = safeString(args.videoData?.id || args.sourceMessage?.videoData?.id).trim();
  const videoTitle = safeString(args.videoData?.title || args.sourceMessage?.videoData?.title).trim();
  if (videoId || videoTitle) {
    refs.push({
      kind: 'video',
      id: videoId || undefined,
      videoId: videoId || undefined,
      title: videoTitle || 'Saved video',
      thumbnailUrl: safeString(args.videoData?.thumbnailUrl || args.sourceMessage?.videoData?.thumbnailUrl).trim() || undefined,
    });
  }

  const audioMeta = parseJsonValue<Record<string, unknown> | null>(args.sourceMessage?.metadata?.audio, null);
  if (audioMeta) {
    refs.push({
      kind: 'audio',
      id: safeString(audioMeta.id).trim() || undefined,
      audioId: safeString(audioMeta.id).trim() || undefined,
      title: safeString(audioMeta.label || audioMeta.title).trim() || 'Saved audio',
      url: safeString(audioMeta.url || audioMeta.audioUrl).trim() || undefined,
      durationSec: Number.isFinite(Number(audioMeta.durationSec)) ? Number(audioMeta.durationSec) : undefined,
    });
  }

  const imageMeta = parseJsonValue<Record<string, unknown> | null>(args.sourceMessage?.metadata?.image, null);
  if (imageMeta && safeString(imageMeta.src).trim()) {
    refs.push({
      kind: 'image',
      id: safeString(imageMeta.id).trim() || undefined,
      title: safeString(imageMeta.alt || imageMeta.title || imageMeta.label).trim() || 'Saved image',
      url: safeString(imageMeta.src).trim(),
      thumbnailUrl: safeString(imageMeta.thumbnailUrl).trim() || undefined,
    });
  }

  const sourceRef = args.sources[0];
  if (sourceRef?.url || sourceRef?.sourceName) {
    refs.push({
      kind: 'source',
      title: safeString(sourceRef.sourceName).trim() || 'Study source',
      url: safeString(sourceRef.url).trim() || undefined,
    });
  }

  return refs.slice(0, 6);
}

export function inferRevisionMediaType(mediaRefs: RevisionMediaRef[]): RevisionMediaType {
  const hasImage = mediaRefs.some((ref) => ref.kind === 'image');
  const hasVideo = mediaRefs.some((ref) => ref.kind === 'video');
  const hasAudio = mediaRefs.some((ref) => ref.kind === 'audio');
  const activeKinds = [hasImage, hasVideo, hasAudio].filter(Boolean).length;

  if (activeKinds > 1) return 'mixed';
  if (hasVideo) return 'video';
  if (hasAudio) return 'audio';
  if (hasImage) return 'image';
  return 'text';
}

export function inferRevisionSourceType(args: {
  sources: SourceCitation[];
  mediaRefs: RevisionMediaRef[];
  sourceMessage?: RawRevisionSourceMessage | null;
}): RevisionSourceType {
  if (args.sources.length > 0) return 'tutor_research';
  if (args.mediaRefs.some((ref) => ref.kind === 'video')) return 'tutor_video';
  if (args.mediaRefs.some((ref) => ref.kind === 'audio')) return 'tutor_audio';
  if (args.mediaRefs.some((ref) => ref.kind === 'image' || ref.kind === 'document')) return 'tutor_image';
  if (args.sourceMessage?.id) return 'tutor_message';
  return 'generated_summary';
}

export function deriveRevisionSubtopic(topic?: string | null): string | null {
  const safeTopic = safeString(topic).trim();
  if (!safeTopic) return null;
  const separators = [' - ', ': ', ' / '];
  for (const separator of separators) {
    const parts = safeTopic.split(separator).map((part) => part.trim()).filter(Boolean);
    if (parts.length > 1) return parts[1].slice(0, 80);
  }
  return null;
}

export function extractTranscriptSnippet(sourceMessage?: RawRevisionSourceMessage | null): string | null {
  const researchMeta = sourceMessage?.metadata?.research as Record<string, unknown> | undefined;
  const transcriptExcerpt = safeString(researchMeta?.transcriptExcerpt).trim();
  if (transcriptExcerpt) return limitRevisionText(transcriptExcerpt, 280);
  const videoSummary = safeString(sourceMessage?.metadata?.videoSnapshot?.summary).trim();
  return videoSummary ? limitRevisionText(videoSummary, 280) : null;
}
