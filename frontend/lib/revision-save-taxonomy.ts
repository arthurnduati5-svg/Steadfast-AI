import type {
  Message,
  RevisionContentType,
  RevisionMediaType,
  RevisionSaveType,
  RevisionSubject,
  TutorArtifact,
  TutorState,
} from './types';
import { resolveAssistantEnvelopeMetadata } from './assistant-envelope';

export const REVISION_SUBJECT_OPTIONS: Array<{ value: RevisionSubject; label: string }> = [
  { value: 'math', label: 'Math' },
  { value: 'english', label: 'English' },
  { value: 'kiswahili', label: 'Kiswahili' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'physics', label: 'Physics' },
  { value: 'geography', label: 'Geography' },
  { value: 'history', label: 'History' },
  { value: 'literature', label: 'Literature' },
  { value: 'business', label: 'Business' },
  { value: 'ict_coding', label: 'ICT & Coding' },
  { value: 'ire', label: 'Islamic Religious Education (IRE)' },
  { value: 'kindergarten', label: 'Kindergarten modules' },
];

export const REVISION_SAVE_TYPE_OPTIONS: Array<{
  value: RevisionSaveType;
  label: string;
  helper: string;
}> = [
  { value: 'explanation', label: 'Explanation', helper: 'Save the main idea clearly.' },
  { value: 'worked_step', label: 'Worked step', helper: 'Keep one method step you can reuse.' },
  { value: 'short_note', label: 'Short note', helper: 'Store a short reminder only.' },
  { value: 'mistake_to_fix', label: 'Mistake to fix', helper: 'Save what to watch out for next time.' },
  { value: 'formula', label: 'Formula', helper: 'Save a formula and when to use it.' },
  { value: 'definition', label: 'Definition', helper: 'Keep a term and its meaning.' },
  { value: 'research_note', label: 'Research note', helper: 'Save a source-backed note.' },
  { value: 'practice_item', label: 'Practice item', helper: 'Keep a question to try again later.' },
];

export type RevisionAutoFillConfidence = 'high' | 'medium' | 'low';

export interface RevisionAutoFillSuggestion {
  subject: RevisionSubject | null;
  saveType: RevisionSaveType;
  title: string;
  summary: string;
  helper: string;
  confidenceScore: number;
  confidence: RevisionAutoFillConfidence;
  confidenceReasons: string[];
  needsReview: boolean;
}

const SUBJECT_LABEL_MAP = new Map(REVISION_SUBJECT_OPTIONS.map((option) => [option.value, option.label]));

const SUBJECT_ALIASES: Record<string, RevisionSubject> = {
  math: 'math',
  maths: 'math',
  mathematics: 'math',
  algebra: 'math',
  english: 'english',
  grammar: 'english',
  literature: 'literature',
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

const SAVE_TYPE_LABEL_MAP = new Map(REVISION_SAVE_TYPE_OPTIONS.map((option) => [option.value, option.label]));

function safeString(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function normalizeKey(value: unknown) {
  return safeString(value)
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sentencePreview(value: string, maxChars = 180) {
  const clean = safeString(value).replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  const firstSentence = clean.match(/[^.!?]+[.!?]?/u)?.[0] || clean;
  return firstSentence.length <= maxChars
    ? firstSentence
    : `${firstSentence.slice(0, maxChars - 3).trimEnd()}...`;
}

function titleCaseFallback(value: string) {
  return value
    .split(/[\s_]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function normalizeRevisionSubject(value?: string | null): RevisionSubject | null {
  const normalized = normalizeKey(value);
  if (!normalized) return null;
  return SUBJECT_ALIASES[normalized] || null;
}

export function getRevisionSubjectLabel(subject?: string | null) {
  const normalized = normalizeRevisionSubject(subject);
  if (normalized) return SUBJECT_LABEL_MAP.get(normalized) || titleCaseFallback(normalized);
  const raw = safeString(subject).trim();
  return raw || 'General';
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

export function inferRevisionSaveType(args: {
  message?: Message | null;
  selectedText?: string | null;
}): RevisionSaveType {
  const message = args.message || null;
  const presentation = resolveAssistantEnvelopeMetadata((message?.metadata as any) || null).presentation;
  const selectedText = safeString(args.selectedText).trim();
  const content = `${selectedText} ${safeString(message?.content)}`.toLowerCase();
  const cardKind = safeString(presentation?.cardKind).trim();

  if (Array.isArray(message?.sources) && message.sources.length > 0) return 'research_note';
  if (message?.videoData?.id && /\b(source|research|according to|reported|verified)\b/.test(content)) return 'research_note';
  if (cardKind === 'practice' || /\bpractice|try this|similar question|attempt this\b/.test(content)) return 'practice_item';
  if (cardKind === 'correction' || /\bmistake|careful|watch out|avoid this|wrong idea|do not mix up\b/.test(content)) return 'mistake_to_fix';
  if (/\bformula\b/.test(content) || /[A-Za-z]\s*=\s*[^=]/.test(selectedText || safeString(message?.content))) return 'formula';
  if (/\bdefinition\b/.test(content) || /^[A-Z][A-Za-z\s-]{1,40}\s+(is|means)\b/.test(selectedText || safeString(message?.content))) {
    return 'definition';
  }
  if (cardKind === 'breakdown' || /\bstep\b/.test(content) || /\b1[\).:-]\s/.test(selectedText || safeString(message?.content))) {
    return 'worked_step';
  }
  if (cardKind === 'summary' || /\bin short|key points|summary\b/.test(content)) return 'short_note';
  return 'explanation';
}

export function inferRevisionSubject(args: {
  tutorState?: TutorState | null;
  tutorArtifacts?: TutorArtifact[] | null;
  topic?: string | null;
  subject?: string | null;
  message?: Message | null;
  selectedText?: string | null;
}): RevisionSubject | null {
  const presentation = resolveAssistantEnvelopeMetadata((args.message?.metadata as any) || null).presentation;
  const directCandidates = [
    args.subject,
    args.tutorState?.activeSubject,
    args.tutorArtifacts?.[0]?.subject,
    presentation?.topicMastery?.subject,
    presentation?.weakTopicRecovery?.subject,
    presentation?.reflectCard?.subject,
  ];

  for (const candidate of directCandidates) {
    const normalized = normalizeRevisionSubject(candidate || null);
    if (normalized) return normalized;
  }

  const topicText = `${safeString(args.topic)} ${safeString(args.selectedText)} ${safeString(args.message?.content)}`.toLowerCase();
  if (/\b(algebra|equation|fraction|ratio|geometry|percentage|probability|math|mathematics)\b/.test(topicText)) return 'math';
  if (/\b(grammar|essay|comprehension|poem|novel|english)\b/.test(topicText)) return 'english';
  if (/\b(kiswahili|swahili)\b/.test(topicText)) return 'kiswahili';
  if (/\barabic\b/.test(topicText)) return 'arabic';
  if (/\b(biology|osmosis|photosynthesis|cells?|diffusion|respiration)\b/.test(topicText)) return 'biology';
  if (/\b(chemistry|acid|base|atom|molecule|reaction)\b/.test(topicText)) return 'chemistry';
  if (/\b(physics|force|motion|velocity|acceleration|energy)\b/.test(topicText)) return 'physics';
  if (/\b(geography|climate|population|map)\b/.test(topicText)) return 'geography';
  if (/\b(history|colonial|independence|government)\b/.test(topicText)) return 'history';
  if (/\b(literature|character|theme|plot)\b/.test(topicText)) return 'literature';
  if (/\b(business|commerce|accounting|trade)\b/.test(topicText)) return 'business';
  if (/\b(code|coding|programming|javascript|python|html|css|ict)\b/.test(topicText)) return 'ict_coding';
  if (/\b(quran|surah|ayah|hadith|fiqh|islam|dua|tajweed|ire)\b/.test(topicText)) return 'ire';
  if (/\b(kindergarten|phonics|counting|nursery)\b/.test(topicText)) return 'kindergarten';
  return null;
}

export function getRevisionSaveTypeLabel(saveType?: string | null, fallbackContentType?: RevisionContentType | null) {
  const normalized = safeString(saveType).trim() as RevisionSaveType | '';
  if (normalized && SAVE_TYPE_LABEL_MAP.has(normalized)) {
    return SAVE_TYPE_LABEL_MAP.get(normalized)!;
  }
  return SAVE_TYPE_LABEL_MAP.get(inferRevisionSaveTypeFromContentType(fallbackContentType)) || 'Explanation';
}

export function getRevisionSaveTypeHelper(saveType?: string | null) {
  const normalized = safeString(saveType).trim() as RevisionSaveType | '';
  return REVISION_SAVE_TYPE_OPTIONS.find((option) => option.value === normalized)?.helper || 'Save this as a clean revision note.';
}

export function getRevisionMediaTypeLabel(mediaType?: RevisionMediaType | null) {
  switch (mediaType) {
    case 'image':
      return 'Image note';
    case 'audio':
      return 'Audio note';
    case 'video':
      return 'Video note';
    case 'mixed':
      return 'Mixed media';
    default:
      return 'Text note';
  }
}

export function inferRevisionMediaType(message?: Message | null): RevisionMediaType {
  const hasVideo = Boolean(message?.videoData?.id || message?.videoData?.title);
  const hasImage = Boolean(message?.image?.src);
  if (hasVideo && hasImage) return 'mixed';
  if (hasVideo) return 'video';
  if (hasImage) return 'image';
  return 'text';
}

export function buildRevisionSavePreview(args: {
  saveType: RevisionSaveType;
  subject?: string | null;
  topic?: string | null;
  selectedText?: string | null;
  sourceText?: string | null;
}) {
  const topic = safeString(args.topic).trim();
  const subjectLabel = getRevisionSubjectLabel(args.subject);
  const baseText = safeString(args.selectedText).trim() || safeString(args.sourceText).trim();
  const shortPreview = sentencePreview(baseText || topic || subjectLabel, 180) || 'A short revision note will be saved here.';

  let title = topic;
  switch (args.saveType) {
    case 'worked_step':
      title = title || 'Worked step';
      break;
    case 'short_note':
      title = title || 'Short note';
      break;
    case 'mistake_to_fix':
      title = title || 'Mistake to fix';
      break;
    case 'formula':
      title = title || 'Saved formula';
      break;
    case 'definition':
      title = title || 'Saved definition';
      break;
    case 'research_note':
      title = title || 'Research note';
      break;
    case 'practice_item':
      title = title || 'Practice item';
      break;
    default:
      title = title || 'Explanation note';
      break;
  }

  const helper =
    args.saveType === 'practice_item'
      ? 'This will be saved as a question you can revisit later.'
      : args.saveType === 'mistake_to_fix'
        ? 'This will store the correction to remember next time.'
        : args.saveType === 'research_note'
          ? 'This will keep the source-backed idea in your revision library.'
          : 'This will be saved as a clean revision note.';

  return {
    title,
    summary: shortPreview,
    helper,
    subjectLabel,
    saveTypeLabel: getRevisionSaveTypeLabel(args.saveType),
  };
}

function getAutoFillConfidence(score: number): RevisionAutoFillConfidence {
  if (score >= 0.84) return 'high';
  if (score >= 0.64) return 'medium';
  return 'low';
}

function normalizeConfidenceReasons(reasons: string[]): string[] {
  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const reason of reasons) {
    const clean = safeString(reason).trim();
    if (!clean) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(clean);
  }
  return normalized.slice(0, 3);
}

export function buildRevisionAutoFillSuggestion(args: {
  message?: Message | null;
  selectedText?: string | null;
  tutorState?: TutorState | null;
  tutorArtifacts?: TutorArtifact[] | null;
  topic?: string | null;
  subject?: string | null;
}): RevisionAutoFillSuggestion {
  const message = args.message || null;
  const tutorArtifacts = Array.isArray(args.tutorArtifacts) ? args.tutorArtifacts : [];
  const selectedText = safeString(args.selectedText).trim();
  const topic = safeString(args.topic).trim() || null;
  const presentation = resolveAssistantEnvelopeMetadata((message?.metadata as any) || null).presentation;
  const explicitSubject = normalizeRevisionSubject(args.subject || null);
  const contextSubject = normalizeRevisionSubject(args.tutorState?.activeSubject || tutorArtifacts[0]?.subject || null);

  const inferredSubject = inferRevisionSubject({
    tutorState: args.tutorState || null,
    tutorArtifacts,
    topic,
    subject: args.subject || null,
    message,
    selectedText,
  });
  const inferredSaveType = inferRevisionSaveType({ message, selectedText });
  const preview = buildRevisionSavePreview({
    saveType: inferredSaveType,
    subject: inferredSubject,
    topic,
    selectedText,
    sourceText: message?.content || null,
  });

  const reasons: string[] = [];
  let score = 0.34;

  if (explicitSubject) {
    score += 0.26;
    reasons.push('Subject matched your selected study context.');
  }
  if (contextSubject) {
    score += 0.2;
    reasons.push('Subject matched tutor context and learning artifacts.');
  }
  if (inferredSubject && topic) {
    score += 0.16;
    reasons.push('Topic language supports this subject.');
  }
  if (Array.isArray(message?.sources) && message.sources.length > 0) {
    score += 0.24;
    reasons.push('Source citations support a research-note classification.');
  }
  if (safeString(presentation?.cardKind).trim()) {
    score += 0.14;
    reasons.push('Tutor card type supports this save type.');
  }
  if (selectedText.length >= 12) {
    score += 0.08;
  }
  if (safeString(message?.content).trim().length >= 24) {
    score += 0.07;
  }
  if (!inferredSubject) {
    score -= 0.22;
    reasons.push('Subject signal is weak, so review before saving.');
  }

  const confidenceScore = Math.max(0.05, Math.min(0.99, score));
  const confidence = getAutoFillConfidence(confidenceScore);
  const confidenceReasons = normalizeConfidenceReasons(reasons);
  const needsReview = confidence === 'low' || !inferredSubject;

  return {
    subject: inferredSubject,
    saveType: inferredSaveType,
    title: preview.title,
    summary: preview.summary,
    helper: preview.helper,
    confidenceScore,
    confidence,
    confidenceReasons:
      confidenceReasons.length > 0 ? confidenceReasons : ['Review subject and save type before confirming.'],
    needsReview,
  };
}
