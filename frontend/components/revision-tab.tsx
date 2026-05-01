'use client';

import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  AlertCircle,
  Bookmark,
  BookOpenText,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  FolderOpen,
  GripVertical,
  Layers3,
  Loader2,
  Maximize2,
  MoreHorizontal,
  NotebookPen,
  Pin,
  Search,
  Sigma,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import api, { ApiError } from '@/lib/api';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type {
  MediaAsset,
  RevisionChapterSummary,
  RevisionCollection,
  RevisionCollectionKind,
  RevisionContentType,
  RevisionFlashcard,
  RevisionGroupingSuggestion,
  RevisionItem,
  RevisionMastery,
  RevisionOverview,
  RevisionSaveType,
  RevisionNotebookVisualMode,
  DeleteRevisionCollectionMode,
  UpdateRevisionCollectionRequest,
  UpdateRevisionItemRequest,
  GuidedRevisionSessionStartResult,
  GuidedRevisionSessionProgressResult,
  GuidedRevisionSupportAction,
} from '@/lib/types';
import { getSteadfastUiCopy } from '@/lib/steadfast-product';
import { TopicMasteryChip } from '@/components/copilot/TopicMasteryChip';
import {
  getRevisionMediaTypeLabel,
  getRevisionSaveTypeLabel,
  getRevisionSubjectLabel,
  inferRevisionSaveTypeFromContentType,
  normalizeRevisionSubject,
} from '@/lib/revision-save-taxonomy';
import { StudyToolsSection } from '@/components/revision/study-tools-section';

type RevisionRenderState =
  | 'loading'
  | 'error'
  | 'empty'
  | 'overview'
  | 'list_selected'
  | 'item_selected';

type RevisionLayoutMode = 'panel' | 'workspace';
type RevisionWorkspaceScrollState = {
  libraryScrollTop: number;
  detailScrollTop: number;
};
type RevisionBreadcrumb = {
  label: string;
  active?: boolean;
  onClick?: () => void;
};
type RevisionWorkspaceScopeFilter =
  | 'all'
  | 'pinned'
  | 'due_now'
  | 'needs_attention'
  | 'needs_practice'
  | 'mistake_fixes'
  | 'recently_improved';
type RevisionWorkspaceTypeFilter = 'all' | RevisionSaveType;
type RevisionWorkspaceSubjectFilter = 'all' | string;
type RevisionDocumentLens = 'default' | 'beginner' | 'exam' | 'trap';
type RevisionInteractiveLens = Exclude<RevisionDocumentLens, 'default'>;
type RevisionLensInputMap = Partial<Record<RevisionInteractiveLens, string>>;
type RevisionLensGuidanceMap = Partial<Record<RevisionInteractiveLens, boolean>>;
type SteadfastLaunchIntent = 'revise' | 'highlight' | 'quiz' | 'breakdown' | 'similar';
type SteadfastLaunchOptions = {
  starterResponse?: string;
  supportAction?: GuidedRevisionSupportAction;
  scrollToResponse?: boolean;
};
type RevisionQuickNote = {
  id: string;
  text: string;
  createdAt: string;
};
type GuidedConceptLink = {
  id: string;
  title: string;
  subject?: string | null;
  collectionTitle?: string | null;
  relationSignals: string[];
  score: number;
};
type RevisionConnectionCategory = 'theory' | 'procedure' | 'application' | 'recovery';
type RevisionConnectionInsight = {
  score: number;
  signals: string[];
  sharedTags: string[];
  category: RevisionConnectionCategory;
  bridgeLabel: string;
  reasonLine: string;
  quickApplyLine: string;
};
type ConnectedGraphEntry = {
  item: RevisionItem;
  insight: RevisionConnectionInsight;
};
type RevisionGraphLink = NonNullable<NonNullable<RevisionItem['connectedGraph']>['links']>[number];
type NotebookSlideshowSource = 'notebook_header' | 'notebook_menu' | 'note_menu';
type NotebookSlideshowExitTarget = {
  collectionId: string | null;
  itemId: string | null;
};
type PendingNotebookSlideshowLaunch = {
  collectionId: string;
  startNoteId: string | null;
  source: NotebookSlideshowSource;
  exitTarget: NotebookSlideshowExitTarget;
};

interface RevisionTabProps {
  overview: RevisionOverview | null;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isLoading: boolean;
  errorMessage: string;
  selectedCollection: RevisionCollection | null;
  collectionItems: RevisionItem[];
  isCollectionLoading: boolean;
  groupingSuggestions: RevisionGroupingSuggestion[];
  isGroupingSuggestionsLoading: boolean;
  onSelectCollection: (collection: RevisionCollection | null) => void;
  onContinueChat?: (sessionId: string) => void;
  onTogglePin?: (item: RevisionItem) => Promise<void> | void;
  onUpdateMastery?: (item: RevisionItem, mastery: RevisionMastery | null) => Promise<void> | void;
  onSaveStudentNote?: (item: RevisionItem, studentNote: string) => Promise<void> | void;
  onUpdateCollection?: (collection: RevisionCollection, patch: UpdateRevisionCollectionRequest) => Promise<void> | void;
  onDeleteCollection?: (collection: RevisionCollection, mode: DeleteRevisionCollectionMode) => Promise<void> | void;
  onUpdateItem?: (item: RevisionItem, patch: UpdateRevisionItemRequest) => Promise<void> | void;
  onUpdateItemsBatch?: (updates: Array<{ itemId: string; patch: UpdateRevisionItemRequest }>) => Promise<void> | void;
  onDeleteItem?: (item: RevisionItem) => Promise<void> | void;
  onQuizItem?: (item: RevisionItem) => Promise<void> | void;
  onBreakdownItem?: (item: RevisionItem) => Promise<void> | void;
  onSimilarQuestionItem?: (item: RevisionItem) => Promise<void> | void;
  onApplyGroupingSuggestion?: (suggestionId: string) => Promise<void> | void;
  onExpandWorkspace?: () => void;
  onRetryLoad?: () => void;
  onReviseWithSteadfast?: (context: { collectionId?: string; itemId?: string }) => Promise<GuidedRevisionSessionStartResult | null> | GuidedRevisionSessionStartResult | null;
  selectedItemId?: string | null;
  onSelectItemId?: (itemId: string | null) => void;
  workspaceScrollState?: RevisionWorkspaceScrollState | null;
  onWorkspaceScrollStateChange?: (state: RevisionWorkspaceScrollState) => void;
  layoutMode?: RevisionLayoutMode;
  showExpandAction?: boolean;
}

const MASTERY_OPTIONS: Array<{ value: RevisionMastery | 'unset'; label: string }> = [
  { value: 'unset', label: 'Not set' },
  { value: 'still_learning', label: 'Still learning' },
  { value: 'getting_better', label: 'Getting better' },
  { value: 'almost_there', label: 'Almost there' },
  { value: 'confident', label: 'Confident' },
];

function getMasteryDotClassName(mastery: RevisionMastery | null | undefined): string {
  if (mastery === 'still_learning') return 'bg-amber-500';
  if (mastery === 'getting_better') return 'bg-[var(--copilot-accent-border)]';
  if (mastery === 'almost_there') return 'bg-violet-500';
  if (mastery === 'confident') return 'bg-emerald-500';
  return 'bg-slate-400';
}

const WORKSPACE_SCOPE_OPTIONS: Array<{
  value: RevisionWorkspaceScopeFilter;
  label: string;
}> = [
  { value: 'all', label: 'All items' },
  { value: 'pinned', label: 'Pinned' },
  { value: 'due_now', label: 'Due now' },
  { value: 'needs_attention', label: 'Needs attention' },
  { value: 'needs_practice', label: 'Needs practice' },
  { value: 'mistake_fixes', label: 'Mistake fixes' },
  { value: 'recently_improved', label: 'Recently improved' },
];
const WORKSPACE_TYPE_OPTIONS: Array<{
  value: RevisionWorkspaceTypeFilter;
  label: string;
}> = [
  { value: 'all', label: 'All types' },
  { value: 'explanation', label: 'Explanations' },
  { value: 'worked_step', label: 'Worked steps' },
  { value: 'short_note', label: 'Short notes' },
  { value: 'mistake_to_fix', label: 'Mistakes to fix' },
  { value: 'formula', label: 'Formulas' },
  { value: 'definition', label: 'Definitions' },
  { value: 'research_note', label: 'Research notes' },
  { value: 'practice_item', label: 'Practice items' },
];
const DOCUMENT_LENSES: Array<{ value: RevisionDocumentLens; label: string; helper: string }> = [
  { value: 'default', label: 'Original', helper: 'Read the note as saved.' },
  { value: 'beginner', label: 'Beginner lens', helper: 'Simple framing and first principles.' },
  { value: 'exam', label: 'Exam lens', helper: 'Focus on marks, method, and precision.' },
  { value: 'trap', label: 'Trap lens', helper: 'Spot likely confusion and mistakes early.' },
];
const INTERACTIVE_DOCUMENT_LENSES: RevisionInteractiveLens[] = ['beginner', 'exam', 'trap'];
const DOCUMENT_LENS_INPUT_COPY: Record<
  RevisionInteractiveLens,
  { prompt: string; placeholder: string; launchLabel: string }
> = {
  beginner: {
    prompt: 'Explain this idea in your own simple words.',
    placeholder: 'Start with one short explanation that a new learner could follow.',
    launchLabel: 'See through Beginner lens',
  },
  exam: {
    prompt: 'Write the mark-winning method you would show.',
    placeholder: 'Write the method and key marking points you would include.',
    launchLabel: 'See through Exam lens',
  },
  trap: {
    prompt: 'Name one mistake you might make and how you will avoid it.',
    placeholder: 'Write one likely trap and the rule you will use to catch it.',
    launchLabel: 'See through Trap lens',
  },
};

function getDocumentLensMeta(lens: RevisionDocumentLens) {
  return DOCUMENT_LENSES.find((option) => option.value === lens) || DOCUMENT_LENSES[0];
}

function toRecordValue(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function getRevisionReflectionRecord(item: RevisionItem): Record<string, unknown> {
  const metadataRecord = toRecordValue(item.metadata);
  const metadataReflection = toRecordValue(metadataRecord?.reflection);
  const snapshotReflection = toRecordValue(item.reflection as unknown);
  return metadataReflection || snapshotReflection || {};
}

function getLensInputMapFromItem(item: RevisionItem): RevisionLensInputMap {
  const reflectionRecord = getRevisionReflectionRecord(item);
  const rawLensInputs = toRecordValue(reflectionRecord.lensInputs);
  const next: RevisionLensInputMap = {};
  for (const lens of INTERACTIVE_DOCUMENT_LENSES) {
    const value = typeof rawLensInputs?.[lens] === 'string' ? rawLensInputs[lens].trim() : '';
    if (!value) continue;
    next[lens] = value;
  }
  return next;
}

function getLensGuidanceMapFromItem(item: RevisionItem): RevisionLensGuidanceMap {
  const reflectionRecord = getRevisionReflectionRecord(item);
  const rawGuidanceMap = toRecordValue(reflectionRecord.lensGuidance);
  const next: RevisionLensGuidanceMap = {};
  for (const lens of INTERACTIVE_DOCUMENT_LENSES) {
    next[lens] = Boolean(rawGuidanceMap?.[lens]);
  }
  return next;
}

function getSavedLensSelectionFromItem(item: RevisionItem): RevisionDocumentLens | null {
  const reflectionRecord = getRevisionReflectionRecord(item);
  const selectedLens = String(reflectionRecord.selectedLens || '').trim();
  if (!selectedLens) return null;
  return DOCUMENT_LENSES.some((option) => option.value === selectedLens)
    ? (selectedLens as RevisionDocumentLens)
    : null;
}

function buildLensReflectionPatch(args: {
  item: RevisionItem;
  lens: RevisionInteractiveLens;
  response: string;
  lensInputMap: RevisionLensInputMap;
  lensGuidanceMap?: RevisionLensGuidanceMap;
  markGuided?: boolean;
}) {
  const existingReflection = getRevisionReflectionRecord(args.item);
  const nextLensInputs: Record<string, string> = {};
  const existingGuidanceMap = toRecordValue(existingReflection.lensGuidance);
  const nextGuidanceMap: Record<string, boolean> = {};
  for (const lens of INTERACTIVE_DOCUMENT_LENSES) {
    const incomingGuidance = Boolean(args.lensGuidanceMap?.[lens]);
    const existingGuidance = Boolean(existingGuidanceMap?.[lens]);
    if (incomingGuidance || existingGuidance || (args.markGuided && lens === args.lens)) {
      nextGuidanceMap[lens] = true;
    }
  }
  for (const lens of INTERACTIVE_DOCUMENT_LENSES) {
    const value = String(args.lensInputMap[lens] || '').trim();
    if (value) nextLensInputs[lens] = value;
  }
  const normalizedResponse = String(args.response || '').trim();
  if (normalizedResponse) {
    nextLensInputs[args.lens] = normalizedResponse;
  } else {
    delete nextLensInputs[args.lens];
  }
  const nextReflection: Record<string, unknown> = {
    ...existingReflection,
    selectedLens: args.lens,
  };
  if (Object.keys(nextLensInputs).length) {
    nextReflection.lensInputs = nextLensInputs;
  } else {
    delete nextReflection.lensInputs;
  }
  if (Object.keys(nextGuidanceMap).length) {
    nextReflection.lensGuidance = nextGuidanceMap;
  } else {
    delete nextReflection.lensGuidance;
  }
  return nextReflection;
}

function getLensSupportAction(lens: RevisionInteractiveLens): GuidedRevisionSupportAction {
  if (lens === 'exam') return 'compare';
  if (lens === 'trap') return 'hint';
  return 'break_down';
}

function buildGuideFirstStarterResponse(args: {
  item: RevisionItem;
  lens: RevisionInteractiveLens;
  noteExcerpt: string;
  draft: string;
}) {
  const subject = args.item.subject ? getRevisionSubjectLabel(args.item.subject) : 'this subject';
  const topic = args.item.topic?.trim() || args.item.title.trim();
  const lensInstruction =
    args.lens === 'beginner'
      ? 'Teach from first principles in simple language and avoid jumps.'
      : args.lens === 'exam'
        ? 'Teach the mark-winning method and call out precision checks.'
        : 'Teach by exposing traps first, then show the safe rule.';
  const lines = [
    `Guide me first on "${topic}" before any advanced lens response.`,
    lensInstruction,
    args.noteExcerpt ? `Anchor your guidance to this note line: "${args.noteExcerpt}".` : '',
    args.draft ? `Student attempt so far: "${args.draft}". Diagnose it and coach the next best move.` : 'Ask me for one short attempt after your first explanation.',
    `Context: ${subject}. Keep it Socratic, calm, and student-first.`,
  ];
  return lines.filter(Boolean).join(' ');
}

function buildSeeThroughLensStarterResponse(args: {
  item: RevisionItem;
  lens: RevisionInteractiveLens;
  noteExcerpt: string;
  draft: string;
}) {
  const topic = args.item.topic?.trim() || args.item.title.trim();
  const lensInstruction =
    args.lens === 'beginner'
      ? 'Now respond through the beginner lens: simple language, clear sequence, no skipped reasoning.'
      : args.lens === 'exam'
        ? 'Now respond through the exam lens: concise method, mark-winning checks, and one exam-grade example.'
        : 'Now respond through the trap lens: likely mistakes first, then the correction rule and a safe-check routine.';
  const lines = [
    `The student has already completed a guide-first step for "${topic}".`,
    lensInstruction,
    args.noteExcerpt ? `Primary note anchor: "${args.noteExcerpt}".` : '',
    args.draft ? `Use this student reflection as input: "${args.draft}".` : 'Prompt the student to add one short reflection line before ending.',
    'End with one short self-check question.',
  ];
  return lines.filter(Boolean).join(' ');
}

const COMPARABLE_STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'from',
  'with',
  'that',
  'this',
  'into',
  'your',
  'what',
  'when',
  'where',
  'have',
  'will',
  'then',
  'than',
  'them',
  'they',
  'their',
  'because',
  'while',
  'which',
  'about',
  'been',
  'were',
]);

function extractComparableTokens(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !COMPARABLE_STOP_WORDS.has(token));
}

function getRevisionComparableTokenSet(item: RevisionItem) {
  const source = [
    item.title || '',
    item.summary || '',
    item.topic || '',
    item.subtopic || '',
    item.collectionTitle || '',
    ...(item.tags || []),
    ...(item.artifactLabels || []),
  ].join(' ');
  return new Set(extractComparableTokens(source));
}

function getTokenOverlapScore(left: Set<string>, right: Set<string>) {
  if (!left.size || !right.size) return 0;
  let overlapCount = 0;
  for (const token of left) {
    if (right.has(token)) overlapCount += 1;
  }
  if (!overlapCount) return 0;
  if (overlapCount >= 6) return 8;
  if (overlapCount >= 4) return 6;
  if (overlapCount >= 2) return 4;
  return 2;
}

function getRevisionTagTokenSet(item: RevisionItem) {
  const source = [
    ...(item.tags || []),
    ...(item.artifactLabels || []),
    item.topic || '',
    item.subtopic || '',
    item.subject || '',
  ].join(' ');
  return new Set(extractComparableTokens(source));
}

function getSharedRevisionTags(source: RevisionItem, candidate: RevisionItem) {
  const sourceTags = getRevisionTagTokenSet(source);
  const candidateTags = getRevisionTagTokenSet(candidate);
  const shared: string[] = [];
  for (const token of sourceTags) {
    if (candidateTags.has(token)) shared.push(token);
  }
  return shared
    .sort((left, right) => left.localeCompare(right))
    .slice(0, 4)
    .map((token) => `${token.charAt(0).toUpperCase()}${token.slice(1)}`);
}

function getTagOverlapScore(sharedTagCount: number) {
  if (sharedTagCount >= 4) return 10;
  if (sharedTagCount >= 2) return 7;
  if (sharedTagCount >= 1) return 4;
  return 0;
}

function getRevisionConnectionCategory(
  source: RevisionItem,
  candidate: RevisionItem,
  sharedTags: string[]
): RevisionConnectionCategory {
  const signalText = [
    source.title || '',
    source.summary || '',
    source.content || '',
    candidate.title || '',
    candidate.summary || '',
    candidate.content || '',
    ...sharedTags,
  ]
    .join(' ')
    .toLowerCase();

  const hasProcedureSignal =
    source.saveType === 'worked_step' ||
    candidate.saveType === 'worked_step' ||
    /\b(step|method|procedure|algorithm|sequence|workflow|how to|worked)\b/.test(signalText);
  const hasApplicationSignal =
    source.saveType === 'practice_item' ||
    candidate.saveType === 'practice_item' ||
    /\b(apply|application|real world|physical world|case|example|scenario|use it)\b/.test(signalText);

  if (source.isMistakeBased || candidate.isMistakeBased) return 'recovery';
  if (hasApplicationSignal) return 'application';
  if (hasProcedureSignal) return 'procedure';
  return 'theory';
}

function getRevisionConnectionBridgeLabel(category: RevisionConnectionCategory) {
  if (category === 'procedure') return 'Procedure bridge';
  if (category === 'application') return 'Application bridge';
  if (category === 'recovery') return 'Recovery bridge';
  return 'Theory bridge';
}

function getRevisionConnectionSignals(source: RevisionItem, candidate: RevisionItem) {
  const signals: string[] = [];
  const sharedTags = getSharedRevisionTags(source, candidate);
  if (source.subject && candidate.subject && source.subject.trim().toLowerCase() === candidate.subject.trim().toLowerCase()) {
    signals.push('Same subject');
  }
  if (source.topic && candidate.topic && source.topic.trim().toLowerCase() === candidate.topic.trim().toLowerCase()) {
    signals.push('Same topic');
  }
  if (source.subtopic && candidate.subtopic && source.subtopic.trim().toLowerCase() === candidate.subtopic.trim().toLowerCase()) {
    signals.push('Same subtopic');
  }
  if (source.isMistakeBased && candidate.isMistakeBased) {
    signals.push('Mistake recovery');
  }
  if (source.saveType && candidate.saveType && source.saveType === candidate.saveType) {
    signals.push(getRevisionSaveTypeLabel(source.saveType));
  }
  if (sharedTags.length) {
    signals.push(`Tag overlap: ${sharedTags.slice(0, 2).join(' + ')}`);
  }
  const tokenOverlapScore = getTokenOverlapScore(
    getRevisionComparableTokenSet(source),
    getRevisionComparableTokenSet(candidate)
  );
  if (tokenOverlapScore >= 4) signals.push('Shared concepts');
  return signals.slice(0, 4);
}

function getRevisionConnectionStrength(score: number) {
  if (score >= 22) return 'Strong link';
  if (score >= 13) return 'Useful link';
  return 'Related';
}

function normalizeLabelKey(value?: string | null) {
  return (value || '').trim().toLowerCase();
}

function resolveDistinctNotebookLabel(args: {
  notebookLabel?: string | null;
  itemTitle?: string | null;
  fallbackTopic?: string | null;
}) {
  const notebookLabel = (args.notebookLabel || '').trim();
  if (!notebookLabel) return '';
  const normalizedNotebook = normalizeLabelKey(notebookLabel);
  const normalizedTitle = normalizeLabelKey(args.itemTitle);
  if (!normalizedTitle || normalizedNotebook !== normalizedTitle) return notebookLabel;
  const fallbackTopic = (args.fallbackTopic || '').trim();
  if (fallbackTopic && normalizeLabelKey(fallbackTopic) !== normalizedTitle) return fallbackTopic;
  return 'Saved notes';
}

function formatUpdatedAt(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function inferNotebookVisualMode(args: {
  subject?: string | null;
  topic?: string | null;
  summary?: string | null;
  chapterLabels?: string[];
}): RevisionNotebookVisualMode {
  const text = [
    args.subject || '',
    args.topic || '',
    args.summary || '',
    ...(args.chapterLabels || []),
  ]
    .join(' ')
    .toLowerCase();

  const biologySignals =
    /\bbiology|cell|cells|enzyme|organ|transport|photosynthesis|respiration|osmosis|diffusion|circulation|digestion|mitosis|meiosis|transcription|translation|homeostasis\b/.test(
      text
    );
  const processSignals =
    /\bprocess|cycle|pathway|flow|sequence|stages?|steps?|movement|exchange|how it works|mechanism\b/.test(text);
  const memoryMapSignals =
    /\bclassification|categories|themes?|causes?|effects?|compare|contrast|overview|connections?|branches?\b/.test(
      text
    );

  if (biologySignals || processSignals) {
    return 'process_flow';
  }
  if (memoryMapSignals) {
    return 'memory_map';
  }
  return 'diagram';
}

function getRevisionTypeLabel(contentType: RevisionContentType) {
  if (contentType === 'summary') return 'Summary';
  if (contentType === 'formula') return 'Formula';
  if (contentType === 'definition') return 'Definition';
  if (contentType === 'worked_step') return 'Worked step';
  if (contentType === 'practice_tip') return 'Practice tip';
  if (contentType === 'misconception') return 'Misconception';
  if (contentType === 'correction') return 'Correction';
  if (contentType === 'exam_trap') return 'Exam trap';
  return 'Explanation';
}

type RevisionTypeVisual = {
  saveType: RevisionSaveType;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  toneClassName: string;
};

function resolveRevisionSaveType(
  item: Pick<RevisionItem, 'saveType' | 'contentType'>
): RevisionSaveType {
  return item.saveType || inferRevisionSaveTypeFromContentType(item.contentType);
}

function getRevisionSaveTypeVisual(
  saveType: RevisionSaveType
): Pick<RevisionTypeVisual, 'Icon' | 'toneClassName'> {
  if (saveType === 'worked_step') {
    return { Icon: NotebookPen, toneClassName: 'copilot-revision-type-worked' };
  }
  if (saveType === 'short_note') {
    return { Icon: FileText, toneClassName: 'copilot-revision-type-short-note' };
  }
  if (saveType === 'mistake_to_fix') {
    return { Icon: AlertCircle, toneClassName: 'copilot-revision-type-mistake' };
  }
  if (saveType === 'formula') {
    return { Icon: Sigma, toneClassName: 'copilot-revision-type-formula' };
  }
  if (saveType === 'definition') {
    return { Icon: Bookmark, toneClassName: 'copilot-revision-type-definition' };
  }
  if (saveType === 'research_note') {
    return { Icon: Search, toneClassName: 'copilot-revision-type-research' };
  }
  if (saveType === 'practice_item') {
    return { Icon: Target, toneClassName: 'copilot-revision-type-practice' };
  }
  return { Icon: BookOpenText, toneClassName: 'copilot-revision-type-explanation' };
}

function getRevisionTypeVisual(
  item: Pick<RevisionItem, 'saveType' | 'contentType'>
): RevisionTypeVisual {
  const saveType = resolveRevisionSaveType(item);
  const visual = getRevisionSaveTypeVisual(saveType);
  return {
    saveType,
    label: getRevisionSaveTypeLabel(saveType, item.contentType),
    ...visual,
  };
}

function getRevisionItemTypeLabel(item: RevisionItem) {
  return getRevisionTypeVisual(item).label;
}

function getWorkspaceTypeFilterToneClassName(
  filterValue: RevisionWorkspaceTypeFilter
): string {
  if (filterValue === 'all') return 'copilot-revision-filter-pill-tone-all';
  if (filterValue === 'worked_step') return 'copilot-revision-filter-pill-tone-worked';
  if (filterValue === 'short_note') return 'copilot-revision-filter-pill-tone-short-note';
  if (filterValue === 'mistake_to_fix') return 'copilot-revision-filter-pill-tone-mistake';
  if (filterValue === 'formula') return 'copilot-revision-filter-pill-tone-formula';
  if (filterValue === 'definition') return 'copilot-revision-filter-pill-tone-definition';
  if (filterValue === 'research_note') return 'copilot-revision-filter-pill-tone-research';
  if (filterValue === 'practice_item') return 'copilot-revision-filter-pill-tone-practice';
  return 'copilot-revision-filter-pill-tone-explanation';
}

function normalizeWorkspaceGroupingValue(value?: string | null): string | null {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : null;
}

function getNormalizedFilterToken(value?: string | null): string | null {
  const normalizedSubject = normalizeRevisionSubject(value);
  if (normalizedSubject) return normalizedSubject;
  const normalized = normalizeWorkspaceGroupingValue(value);
  return normalized ? 'general' : null;
}

function getRevisionWorkspaceSubjectDisplayLabel(
  subject?: string | null,
  emptyLabel = 'All subjects'
) {
  const token = getNormalizedFilterToken(subject);
  if (!token) return emptyLabel;
  if (token === 'general') return 'General';
  return getRevisionSubjectLabel(token);
}

function compareAlphabetical(left: string, right: string) {
  return left.localeCompare(right, undefined, { sensitivity: 'base' });
}

const REVISION_QUICK_NOTES_KEY = 'quickNotes';
const REVISION_QUICK_NOTE_MAX = 24;
const REVISION_QUICK_NOTE_TEXT_MAX = 320;

function normalizeRevisionQuickNoteText(value: string) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, REVISION_QUICK_NOTE_TEXT_MAX);
}

function parseRevisionQuickNotes(value: unknown): RevisionQuickNote[] {
  if (!Array.isArray(value)) return [];
  const notes = value
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') return null;
      const raw = entry as Record<string, unknown>;
      const text = normalizeRevisionQuickNoteText(String(raw.text || ''));
      if (!text) return null;
      const idRaw = String(raw.id || '').trim();
      const createdAtRaw = String(raw.createdAt || '').trim();
      return {
        id: idRaw || `quick-note-${index + 1}`,
        text,
        createdAt: createdAtRaw || new Date().toISOString(),
      } satisfies RevisionQuickNote;
    })
    .filter((entry): entry is RevisionQuickNote => Boolean(entry));
  return notes.slice(0, REVISION_QUICK_NOTE_MAX);
}

function getRevisionQuickNotesFromItem(item: RevisionItem): RevisionQuickNote[] {
  const metadata = item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)
    ? (item.metadata as Record<string, unknown>)
    : null;
  return parseRevisionQuickNotes(metadata?.[REVISION_QUICK_NOTES_KEY]);
}

function buildRevisionQuickNote(text: string): RevisionQuickNote {
  const createdAt = new Date().toISOString();
  const randomToken = Math.random().toString(36).slice(2, 8);
  return {
    id: `quick-note-${createdAt}-${randomToken}`,
    text: normalizeRevisionQuickNoteText(text),
    createdAt,
  };
}

function normalizeRevisionEditorContent(value: string) {
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  if (!normalized) return '';
  return normalized
    .split(/\n{2,}/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0)
        .join('\n')
        .trim()
    )
    .filter(Boolean)
    .join('\n\n');
}

function deriveRevisionSummary(title: string, summary: string, content: string) {
  const explicitSummary = summary.trim();
  if (explicitSummary) return explicitSummary;
  const firstBlock = normalizeRevisionEditorContent(content).split(/\n{2,}/)[0] || '';
  const firstSentence = firstBlock.replace(/\s+/g, ' ').trim();
  if (!firstSentence) return title.trim();
  return firstSentence.slice(0, 220);
}

type RevisionSummaryTutorMode = 'regenerate' | 'improve' | 'tighten';
type RevisionContentTutorMode = 'normalize' | 'split_blocks' | 'stepify' | 'tighten';

function clipRevisionSentenceAtWordBoundary(value: string, maxChars: number) {
  if (value.length <= maxChars) return value;
  const candidate = value.slice(0, maxChars + 1);
  const minBoundary = Math.max(24, maxChars - 26);
  const breakIndex = candidate.lastIndexOf(' ');
  if (breakIndex >= minBoundary) return candidate.slice(0, breakIndex).trim();
  return candidate.slice(0, maxChars).trim();
}

function finalizeRevisionSummaryLine(value: string, maxChars: number) {
  const normalized = value
    .replace(/\r\n?/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
  if (!normalized) return '';
  const sentenceMatch = normalized.match(/[^.!?]+[.!?]?/);
  const firstSentence = (sentenceMatch?.[0] || normalized).trim();
  const clipped = clipRevisionSentenceAtWordBoundary(firstSentence, maxChars)
    .replace(/[;:,\-]+$/g, '')
    .trim();
  if (!clipped) return '';
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
}

function buildRevisionSummaryTutorDraft(args: {
  mode: RevisionSummaryTutorMode;
  title: string;
  summary: string;
  content: string;
}) {
  const normalizedTitle = args.title.replace(/\s+/g, ' ').trim();
  const normalizedSummary = args.summary.replace(/\s+/g, ' ').trim();
  const normalizedContent = normalizeRevisionEditorContent(args.content);
  const regenerated = deriveRevisionSummary(normalizedTitle, '', normalizedContent);
  if (args.mode === 'regenerate') {
    return finalizeRevisionSummaryLine(regenerated || normalizedSummary || normalizedTitle, 220);
  }
  if (args.mode === 'improve') {
    const improveSeed =
      normalizedSummary && regenerated && normalizedSummary.toLowerCase() !== regenerated.toLowerCase()
        ? `${normalizedSummary} ${regenerated}`
        : normalizedSummary || regenerated || normalizedTitle;
    return finalizeRevisionSummaryLine(improveSeed, 220);
  }
  return finalizeRevisionSummaryLine(normalizedSummary || regenerated || normalizedTitle, 132);
}

function splitRevisionContentIntoIdeas(value: string): string[] {
  const normalized = normalizeRevisionEditorContent(value);
  if (!normalized) return [];
  const blocks = normalized.split(/\n{2,}/);
  const ideas = blocks.flatMap((block) => {
    const sentencePieces = block
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((piece) => piece.trim())
      .filter(Boolean);
    if (sentencePieces.length > 1) return sentencePieces;
    return block
      .replace(/\s+/g, ' ')
      .trim()
      .split(/,\s+(?=(?:then|next|after that|finally|first|second|third|lastly)\b)/i)
      .map((piece) => piece.trim())
      .filter(Boolean);
  });
  return ideas.filter(Boolean);
}

function tightenRevisionIdeaLine(value: string): string {
  const normalized = value
    .replace(/\r\n?/g, ' ')
    .replace(/\b(?:really|very|just|basically|simply|kind of|sort of|actually)\b/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;:!?])/g, '$1')
    .trim();
  if (!normalized) return '';
  const clipped = clipRevisionSentenceAtWordBoundary(normalized, 136)
    .replace(/[;:,\-]+$/g, '')
    .trim();
  if (!clipped) return '';
  return /[.!?]$/.test(clipped) ? clipped : `${clipped}.`;
}

function buildRevisionContentTutorDraft(args: {
  mode: RevisionContentTutorMode;
  title: string;
  summary: string;
  content: string;
}) {
  const normalizedTitle = args.title.replace(/\s+/g, ' ').trim();
  const normalizedSummary = args.summary.replace(/\s+/g, ' ').trim();
  const normalizedContent = normalizeRevisionEditorContent(args.content);
  const base = normalizedContent || normalizedSummary || normalizedTitle;
  if (!base) return '';
  if (args.mode === 'normalize') return normalizeRevisionEditorContent(base);
  const ideas = splitRevisionContentIntoIdeas(base);
  const seededIdeas = ideas.length ? ideas : [base];
  if (args.mode === 'split_blocks') {
    return normalizeRevisionEditorContent(seededIdeas.join('\n\n'));
  }
  if (args.mode === 'stepify') {
    const stepIdeas = seededIdeas.map((idea, index) => {
      const cleaned = idea
        .replace(/^(?:step\\s*\\d+\\s*[:\\-]\\s*|\\d+[.)]\\s*|[-*]\\s*|\\u2022\\s*)/i, '')
        .trim();
      return `Step ${index + 1}: ${cleaned}`;
    });
    return normalizeRevisionEditorContent(stepIdeas.join('\n\n'));
  }
  const tightened = seededIdeas
    .map((idea) => tightenRevisionIdeaLine(idea))
    .filter(Boolean);
  return normalizeRevisionEditorContent((tightened.length ? tightened : seededIdeas).join('\n\n'));
}

type RevisionEditorDraftState = {
  title: string;
  summary: string;
  content: string;
  collectionId: string;
  chapter: string;
  order: string;
};

function getRevisionEditorDraftState(item: RevisionItem): RevisionEditorDraftState {
  return {
    title: item.title || '',
    summary: item.summary || '',
    content: item.content || item.summary || '',
    collectionId: item.collectionId || '__none__',
    chapter: item.bundleRole || '',
    order: item.featuredRank ? String(item.featuredRank) : '',
  };
}

function normalizeRevisionEditorRank(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return String(Math.max(1, Number(trimmed) || 1));
}

function toRevisionSortTime(value?: string | null) {
  const time = value ? new Date(value).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function getRevisionAffinityScore(source: RevisionItem, candidate: RevisionItem) {
  let score = 0;
  if (source.collectionId && candidate.collectionId && source.collectionId === candidate.collectionId) score += 10;
  if (source.topic && candidate.topic && source.topic.trim().toLowerCase() === candidate.topic.trim().toLowerCase()) score += 9;
  if (source.subtopic && candidate.subtopic && source.subtopic.trim().toLowerCase() === candidate.subtopic.trim().toLowerCase()) score += 6;
  if (source.subject && candidate.subject && source.subject.trim().toLowerCase() === candidate.subject.trim().toLowerCase()) score += 4;
  if (source.saveType && candidate.saveType && source.saveType === candidate.saveType) score += 2;
  if (source.collectionTitle && candidate.collectionTitle && source.collectionTitle === candidate.collectionTitle) score += 1;
  if (source.isMistakeBased && candidate.isMistakeBased) score += 2;
  const sharedTags = getSharedRevisionTags(source, candidate);
  score += getTagOverlapScore(sharedTags.length);
  const connectionCategory = getRevisionConnectionCategory(source, candidate, sharedTags);
  if (connectionCategory === 'recovery') score += 3;
  if (connectionCategory === 'procedure' || connectionCategory === 'application') score += 2;
  score += getTokenOverlapScore(getRevisionComparableTokenSet(source), getRevisionComparableTokenSet(candidate));
  return score;
}

function getRevisionItemPreviewText(item: RevisionItem) {
  const summary = item.summary?.trim();
  if (summary) return summary;
  const content = item.content?.replace(/\s+/g, ' ').trim();
  if (content) return content.slice(0, 170);
  return 'Open this note to review the full content.';
}

function buildNotebookContextDescription(args: {
  collection: RevisionCollection;
  currentItem: RevisionItem;
  notebookItems: RevisionItem[];
}): { text: string; source: 'ai' | 'edited' } {
  const editedDescription =
    args.collection.bundleSummary?.replace(/\s+/g, ' ').trim() ||
    args.collection.description?.replace(/\s+/g, ' ').trim() ||
    '';
  if (editedDescription) {
    return { text: editedDescription, source: 'edited' };
  }

  const focusTopic =
    args.collection.topic?.trim() || args.currentItem.topic?.trim() || args.currentItem.title.trim() || 'this topic';
  const noteTitles = args.notebookItems
    .map((entry) => entry.title?.replace(/\s+/g, ' ').trim() || '')
    .filter(Boolean)
    .slice(0, 2);
  const conceptCounts = new Map<string, number>();
  for (const entry of args.notebookItems) {
    const source = [entry.summary || '', entry.topic || '', entry.subtopic || '', ...(entry.tags || [])].join(' ');
    for (const token of extractComparableTokens(source)) {
      conceptCounts.set(token, (conceptCounts.get(token) || 0) + 1);
    }
  }
  const topConcepts = [...conceptCounts.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .map(([token]) => `${token.charAt(0).toUpperCase()}${token.slice(1)}`)
    .slice(0, 3);
  const mistakeRecoveryCount = args.notebookItems.filter((entry) => entry.isMistakeBased).length;

  const openingLine =
    noteTitles.length >= 2
      ? `${noteTitles[0]} to ${noteTitles[1]} is your current mission path through ${focusTopic}.`
      : noteTitles.length === 1
      ? `${focusTopic} starts from ${noteTitles[0]} and builds step by step.`
      : `This notebook keeps ${focusTopic} in one clean learning path.`;
  const conceptLine = topConcepts.length ? `Focus signals: ${topConcepts.join(', ')}.` : '';
  const mistakeLine = mistakeRecoveryCount
    ? `${mistakeRecoveryCount} checkpoint${mistakeRecoveryCount === 1 ? '' : 's'} are set to catch common slips before they spread.`
    : '';
  const momentumLine = 'Run this path in order, then test yourself without looking to lock it in.';

  return {
    text: [openingLine, conceptLine, mistakeLine, momentumLine].filter(Boolean).join(' '),
    source: 'ai',
  };
}

function buildRevisionConnectionInsight(source: RevisionItem, candidate: RevisionItem): RevisionConnectionInsight {
  const score = getRevisionAffinityScore(source, candidate);
  const sharedTags = getSharedRevisionTags(source, candidate);
  const signals = getRevisionConnectionSignals(source, candidate).slice(0, 3);
  const category = getRevisionConnectionCategory(source, candidate, sharedTags);
  const bridgeLabel = getRevisionConnectionBridgeLabel(category);
  const reasonParts: string[] = [];

  if (sharedTags.length) {
    reasonParts.push(`shared tags: ${sharedTags.slice(0, 2).join(', ')}`);
  }
  if (source.topic && candidate.topic && source.topic.trim().toLowerCase() === candidate.topic.trim().toLowerCase()) {
    reasonParts.push('same topic focus');
  }
  if (source.subtopic && candidate.subtopic && source.subtopic.trim().toLowerCase() === candidate.subtopic.trim().toLowerCase()) {
    reasonParts.push('same subtopic detail');
  }
  if (source.subject && candidate.subject && source.subject.trim().toLowerCase() === candidate.subject.trim().toLowerCase()) {
    reasonParts.push('same subject context');
  }
  if (source.isMistakeBased || candidate.isMistakeBased) {
    reasonParts.push('mistake recovery support');
  }

  const reasonLine =
    reasonParts.length > 0
      ? `Why connected: ${reasonParts.join('; ')}.`
      : 'Why connected: both notes use related concepts and vocabulary from your saved data.';

  const targetTitle = candidate.title?.trim() || 'this related note';
  const quickApplyLine =
    category === 'procedure'
      ? `How to apply: follow the method in "${targetTitle}" step by step, then solve one similar question without looking.`
      : category === 'application'
        ? `How to apply: explain "${targetTitle}" with one physical-world example, then write the matching technical rule in your own words.`
        : category === 'recovery'
          ? `How to apply: compare your previous mistake with "${targetTitle}", then write one correction rule you will reuse next time.`
          : `How to apply: teach "${targetTitle}" out loud in simple theory first, then restate it using technical vocabulary.`;

  return {
    score,
    signals,
    sharedTags,
    category,
    bridgeLabel,
    reasonLine,
    quickApplyLine,
  };
}

function buildRevisionConnectionInsightFromGraphLink(link: RevisionGraphLink): RevisionConnectionInsight {
  const reasonLine = link.whyConnected.trim()
    ? `Why connected: ${link.whyConnected.replace(/^why connected:\s*/i, '').trim()}`
    : 'Why connected: both notes use related concepts and vocabulary from your saved data.';
  const quickApplyLine = link.actionStep.trim()
    ? `How to apply: ${link.actionStep.replace(/^how to apply:\s*/i, '').trim()}`
    : 'How to apply: explain the target note in simple words, then restate it with technical vocabulary.';

  return {
    score: Number(link.score || 0),
    signals: (link.whySignals || []).slice(0, 4),
    sharedTags: link.sharedTags || [],
    category: (link.category || 'theory') as RevisionConnectionCategory,
    bridgeLabel: getRevisionConnectionBridgeLabel((link.category || 'theory') as RevisionConnectionCategory),
    reasonLine,
    quickApplyLine,
  };
}

function sanitizeConnectedGraphText(value?: string | null, maxChars = 180) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}

function ensureSentenceEnding(value: string) {
  if (!value) return '';
  return /[.!?]$/.test(value) ? value : `${value}.`;
}

function buildConnectedGraphGuidanceLine(rawReason?: string | null) {
  const cleaned = sanitizeConnectedGraphText(String(rawReason || '').replace(/^why connected:\s*/i, ''), 156);
  if (!cleaned) return 'Linked because both notes reinforce the same concept pathway.';
  const withoutPrefix = cleaned.replace(/^(linked because|because)\s+/i, '').trim();
  if (!withoutPrefix) return 'Linked because both notes reinforce the same concept pathway.';
  const sentence = ensureSentenceEnding(withoutPrefix);
  return `Linked because ${sentence.charAt(0).toLowerCase()}${sentence.slice(1)}`;
}

function sanitizeConnectedGraphPills(values: string[], maxItems: number) {
  const unique = [...new Set(values.map((value) => sanitizeConnectedGraphText(value, 34)).filter(Boolean))];
  return unique.slice(0, maxItems);
}

function buildConnectedGraphRevisionSummary(args: {
  item: RevisionItem;
  entries: ConnectedGraphEntry[];
}) {
  if (!args.entries.length) return [] as string[];
  const topEntries = args.entries.slice(0, 3);
  const topLink = topEntries[0];
  const focusTokens = new Map<string, number>();
  for (const entry of topEntries) {
    for (const tag of entry.insight.sharedTags) {
      focusTokens.set(tag, (focusTokens.get(tag) || 0) + 1);
    }
  }
  const focusTags = [...focusTokens.entries()]
    .sort((left, right) => {
      if (right[1] !== left[1]) return right[1] - left[1];
      return left[0].localeCompare(right[0]);
    })
    .map(([tag]) => tag)
    .slice(0, 3);
  const routeTitles = [args.item.title, ...topEntries.map((entry) => entry.item.title)].slice(0, 4);
  const routeLine = routeTitles.join(' -> ');
  const focusLine = focusTags.length
    ? `Focus tags for this graph: ${focusTags.join(', ')}.`
    : 'Focus tags for this graph: keep refining topic and subtopic tags to improve link quality.';
  const bridgeLine = `${topLink.insight.bridgeLabel}: move from "${args.item.title}" to "${topLink.item.title}" first.`;
  const applyLine = topLink.insight.quickApplyLine;

  return [
    `Revision route: ${routeLine}.`,
    bridgeLine,
    focusLine,
    applyLine,
  ];
}

function getRevisionStudyBlocks(value?: string | null) {
  const content = String(value || '').trim();
  if (!content) return [] as string[];
  const paragraphBlocks = content
    .split(/\n{2,}/)
    .map((entry) => entry.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
  if (paragraphBlocks.length) return paragraphBlocks;
  return content
    .split(/(?<=[.!?])\s+/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeFlashcardText(value: string, maxChars = 240) {
  const clean = String(value || '').replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  if (clean.length <= maxChars) return clean;
  return `${clean.slice(0, Math.max(0, maxChars - 1)).trimEnd()}...`;
}

function getFirstSentence(value: string, maxChars = 220) {
  const clean = normalizeFlashcardText(value, 420);
  if (!clean) return '';
  const first = clean.split(/(?<=[.!?])\s+/)[0] || clean;
  return normalizeFlashcardText(first, maxChars);
}

function buildRevisionItemFlashcards(args: {
  item: RevisionItem;
  noteBlocks: string[];
}): RevisionFlashcard[] {
  const topicLabel = normalizeFlashcardText(args.item.topic || args.item.title || 'this note', 120);
  const summary = normalizeFlashcardText(args.item.summary || '', 220);
  const selectedExcerpt = normalizeFlashcardText(args.item.selectedText || '', 220);
  const blockPool = args.noteBlocks
    .map((block) => normalizeFlashcardText(block, 300))
    .filter(Boolean);
  const seenBacks = new Set<string>();
  const cards: RevisionFlashcard[] = [];
  const pushCard = (idSuffix: string, front: string, back: string, hint?: string | null) => {
    const compactFront = normalizeFlashcardText(front, 170);
    const compactBack = normalizeFlashcardText(back, 260);
    if (!compactFront || !compactBack) return;
    const fingerprint = compactBack.toLowerCase();
    if (seenBacks.has(fingerprint)) return;
    seenBacks.add(fingerprint);
    cards.push({
      id: `${args.item.id}-item-flashcard-${idSuffix}`,
      front: compactFront,
      back: compactBack,
      hint: hint ? normalizeFlashcardText(hint, 120) : null,
      sourceItemIds: [args.item.id],
    });
  };

  if (summary) {
    pushCard(
      'core',
      `Without looking, explain "${topicLabel}" in one concise line.`,
      summary,
      'Say it in your own words before revealing.'
    );
  }

  if (blockPool.length) {
    pushCard(
      'key-move',
      `What is the first key move in "${topicLabel}"?`,
      getFirstSentence(blockPool[0], 220),
      'Name the step before checking the note.'
    );
    blockPool.slice(1, 4).forEach((block, index) => {
      pushCard(
        `step-${index + 2}`,
        `Step ${index + 2}: what should you remember here?`,
        getFirstSentence(block, 220),
        'Focus on the method cue, not the full paragraph.'
      );
    });
  }

  if (args.item.isMistakeBased) {
    const correctionLine = summary || getFirstSentence(blockPool[0] || selectedExcerpt, 220);
    if (correctionLine) {
      pushCard(
        'mistake-fix',
        `What mistake should you avoid in "${topicLabel}"?`,
        correctionLine,
        'Say the trap, then the corrected move.'
      );
    }
  }

  if (selectedExcerpt) {
    pushCard(
      'anchor',
      'Which exact line should you reconstruct from memory?',
      selectedExcerpt,
      'Use this as your memory anchor.'
    );
  }

  if (cards.length < 2) {
    const fallback = normalizeFlashcardText(args.item.content || args.item.summary || '', 260);
    if (fallback) {
      pushCard(
        'fallback',
        `What is the key idea in "${topicLabel}"?`,
        getFirstSentence(fallback, 220),
        'Answer first, then reveal.'
      );
    }
  }

  return cards.slice(0, 6);
}

function buildLensSupportLine(args: {
  block: string;
  lens: RevisionDocumentLens;
  item: RevisionItem;
  index: number;
}) {
  const cleanBlock = args.block.replace(/\s+/g, ' ').trim();
  const firstSentence = cleanBlock.split(/(?<=[.!?])\s+/)[0] || cleanBlock;
  if (args.lens === 'beginner') {
    return `Simple start: explain section ${args.index + 1} in your own words before checking details.`;
  }
  if (args.lens === 'exam') {
    return `Exam focus: state the key method, then show one accurate line of working from this section.`;
  }
  if (args.lens === 'trap') {
    const overlapTokens = extractComparableTokens(cleanBlock).slice(0, 2).join(' and ');
    const trapTarget = overlapTokens || firstSentence.slice(0, 36);
    return `Trap watch: do not rush ${trapTarget}. Name the rule before applying it.`;
  }
  return '';
}

function buildSteadfastLaunchPlan(args: {
  item: RevisionItem;
  lens: RevisionDocumentLens;
  intent: SteadfastLaunchIntent;
  selectedSnippet?: string;
}): { starterResponse: string; supportAction?: GuidedRevisionSupportAction } {
  const subject = args.item.subject ? getRevisionSubjectLabel(args.item.subject) : 'this subject';
  const topic = args.item.topic?.trim() || args.item.title.trim();
  const weakSignal = args.item.reviewStatus === 'needs_attention' || args.item.mastery === 'still_learning';
  const strongSignal = args.item.mastery === 'almost_there' || args.item.mastery === 'confident';

  const lines: string[] = [];
  let supportAction: GuidedRevisionSupportAction | undefined;

  if (args.intent === 'highlight' && args.selectedSnippet) {
    lines.push(
      `Anchor this guided revision to the exact line: "${args.selectedSnippet}".`,
      'Ask one Socratic question, then offer one hint, then ask me to apply it to a nearby example.'
    );
    supportAction = 'break_down';
  } else if (args.intent === 'quiz') {
    lines.push('Start with a recall check and then one short transfer check. Keep it concise.');
    supportAction = 'compare';
  } else if (args.intent === 'breakdown') {
    lines.push('Break this note into step-by-step reasoning and ask me to fill missing links.');
    supportAction = 'break_down';
  } else if (args.intent === 'similar') {
    lines.push('Give me one similar question and require short working before feedback.');
    supportAction = 'compare';
  } else {
    lines.push('Start a guided revision sprint tailored to this note.');
  }

  if (args.lens === 'beginner') {
    lines.push('Use beginner lens: plain language, one core idea at a time, no skipped steps.');
    supportAction = supportAction || 'break_down';
  } else if (args.lens === 'exam') {
    lines.push('Use exam lens: method marks, precision, and common examiner checks.');
    supportAction = supportAction || 'compare';
  } else if (args.lens === 'trap') {
    lines.push('Use trap lens: expose likely misconceptions before giving final guidance.');
    supportAction = supportAction || 'hint';
  }

  if (weakSignal) {
    lines.push('Treat me as rebuilding this from foundations and confirm understanding in small checkpoints.');
    supportAction = supportAction || 'break_down';
  } else if (strongSignal) {
    lines.push('Increase challenge with one transfer or comparison move before ending.');
    supportAction = supportAction || 'compare';
  }

  lines.push(`Context: ${subject}, topic "${topic}". Keep it Socratic, calm, and progression-focused.`);
  return { starterResponse: lines.join(' '), supportAction };
}

function getRevisionNotebookOrderValue(item: RevisionItem) {
  return typeof item.featuredRank === 'number' && Number.isFinite(item.featuredRank)
    ? item.featuredRank
    : Number.MAX_SAFE_INTEGER;
}

function sortRevisionItemsForNotebook(items: RevisionItem[]) {
  return [...items].sort((left, right) => {
    const rankOrder = getRevisionNotebookOrderValue(left) - getRevisionNotebookOrderValue(right);
    if (rankOrder !== 0) return rankOrder;
    return toRevisionSortTime(right.updatedAt) - toRevisionSortTime(left.updatedAt);
  });
}

const REVISION_NOTEBOOK_FLOW_PRIORITY: Record<RevisionSaveType, number> = {
  definition: 1,
  formula: 2,
  explanation: 3,
  worked_step: 4,
  short_note: 5,
  research_note: 6,
  practice_item: 7,
  mistake_to_fix: 8,
};

function buildBestNotebookOrder(itemIds: string[], itemMap: Map<string, RevisionItem>) {
  return [...itemIds].sort((leftId, rightId) => {
    const left = itemMap.get(leftId);
    const right = itemMap.get(rightId);
    if (!left && !right) return 0;
    if (!left) return 1;
    if (!right) return -1;

    const chapterOrder = compareAlphabetical(
      getRevisionChapterLabel(left).toLocaleLowerCase(),
      getRevisionChapterLabel(right).toLocaleLowerCase()
    );
    if (chapterOrder !== 0) return chapterOrder;

    const leftPriority = REVISION_NOTEBOOK_FLOW_PRIORITY[resolveRevisionSaveType(left)] || 99;
    const rightPriority = REVISION_NOTEBOOK_FLOW_PRIORITY[resolveRevisionSaveType(right)] || 99;
    if (leftPriority !== rightPriority) return leftPriority - rightPriority;

    const topicOrder = compareAlphabetical(
      String(left.topic || left.subtopic || left.title).toLocaleLowerCase(),
      String(right.topic || right.subtopic || right.title).toLocaleLowerCase()
    );
    if (topicOrder !== 0) return topicOrder;

    return toRevisionSortTime(left.updatedAt) - toRevisionSortTime(right.updatedAt);
  });
}

function getRevisionChapterLabel(item: RevisionItem) {
  const explicit = item.bundleRole?.trim();
  if (explicit) return explicit;
  const subtopic = item.subtopic?.trim();
  if (subtopic) return subtopic;
  const topic = item.topic?.trim();
  if (topic) return topic;
  if (item.isMistakeBased) return 'Fixes and traps';
  if (item.saveType === 'formula') return 'Formulas';
  if (item.saveType === 'definition') return 'Definitions';
  return 'Core ideas';
}

function reorderRevisionIds(itemIds: string[], activeId: string, targetId: string) {
  if (!activeId || !targetId || activeId === targetId) return itemIds;
  const next = [...itemIds];
  const fromIndex = next.indexOf(activeId);
  const toIndex = next.indexOf(targetId);
  if (fromIndex < 0 || toIndex < 0) return itemIds;
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

type RevisionNotebookChapterGroup = {
  id: string;
  label: string;
  items: RevisionItem[];
};

type RevisionCollectionCoverTheme = 'indigo' | 'emerald' | 'amber' | 'sky' | 'slate';

type RevisionCollectionCoverData = {
  theme: RevisionCollectionCoverTheme | null;
  emoji: string;
  motto: string;
  imageDataUrl: string;
  imagePrompt: string;
  imageSource: 'uploaded' | 'ai_generated' | '';
  imageUpdatedAt: string;
};

const REVISION_COLLECTION_COVER_THEMES: RevisionCollectionCoverTheme[] = [
  'indigo',
  'emerald',
  'amber',
  'sky',
  'slate',
];

function getRevisionCollectionCoverData(
  collection?: Pick<RevisionCollection, 'coverRef'> | null
): RevisionCollectionCoverData {
  const cover = collection?.coverRef && typeof collection.coverRef === 'object'
    ? (collection.coverRef as Record<string, unknown>)
    : null;
  const themeRaw = typeof cover?.theme === 'string' ? cover.theme.trim().toLowerCase() : '';
  const theme = REVISION_COLLECTION_COVER_THEMES.includes(themeRaw as RevisionCollectionCoverTheme)
    ? (themeRaw as RevisionCollectionCoverTheme)
    : null;
  return {
    theme,
    emoji: typeof cover?.emoji === 'string' ? cover.emoji.trim().slice(0, 2) : '',
    motto: typeof cover?.motto === 'string' ? cover.motto.trim().slice(0, 120) : '',
    imageDataUrl:
      typeof cover?.imageDataUrl === 'string' && cover.imageDataUrl.startsWith('data:image/')
        ? cover.imageDataUrl
        : '',
    imagePrompt: typeof cover?.imagePrompt === 'string' ? cover.imagePrompt.trim().slice(0, 320) : '',
    imageSource:
      cover?.imageSource === 'uploaded' || cover?.imageSource === 'ai_generated'
        ? cover.imageSource
        : '',
    imageUpdatedAt: typeof cover?.imageUpdatedAt === 'string' ? cover.imageUpdatedAt.trim() : '',
  };
}

function getDefaultCollapsedNotebookChapterIds(chapters: RevisionNotebookChapterGroup[]) {
  if (chapters.length <= 2) return [] as string[];
  return chapters.slice(1).map((chapter) => chapter.id);
}

function buildRevisionNotebookChapters(items: RevisionItem[]): RevisionNotebookChapterGroup[] {
  const chapters = new Map<string, RevisionNotebookChapterGroup>();
  sortRevisionItemsForNotebook(items).forEach((item, index) => {
    const label = getRevisionChapterLabel(item);
    const token = `${label.toLocaleLowerCase()}-${index}`;
    const existing =
      Array.from(chapters.values()).find((chapter) => chapter.label.toLocaleLowerCase() === label.toLocaleLowerCase()) || null;
    if (existing) {
      existing.items.push(item);
      return;
    }
    chapters.set(token, {
      id: token,
      label,
      items: [item],
    });
  });
  return Array.from(chapters.values());
}

function getRevisionChapterSummary(chapter: RevisionNotebookChapterGroup) {
  const summary = chapter.items
    .map((item) => item.summary?.trim() || item.topic?.trim() || item.title)
    .filter(Boolean)
    .slice(0, 2)
    .join(' | ');
  return summary || 'A focused reading pass for this chapter.';
}

function getRevisionCollectionAiChapterSummaries(
  collection?: Pick<RevisionCollection, 'metadata'> | null
): RevisionChapterSummary[] {
  const metadata =
    collection?.metadata && typeof collection.metadata === 'object'
      ? (collection.metadata as Record<string, unknown>)
      : null;
  const cache =
    metadata?.aiChapterSummaryCache && typeof metadata.aiChapterSummaryCache === 'object'
      ? (metadata.aiChapterSummaryCache as Record<string, unknown>)
      : null;
  const chapters = Array.isArray(cache?.chapters) ? cache.chapters : [];
  const parsedChapters = chapters
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const id = typeof record.id === 'string' ? record.id.trim() : '';
      const label = typeof record.label === 'string' ? record.label.trim() : '';
      const summary = typeof record.summary === 'string' ? record.summary.trim() : '';
      if (!id || !label || !summary) return null;
      return {
        id,
        label,
        summary,
        itemCount: typeof record.itemCount === 'number' ? record.itemCount : Number(record.itemCount) || 0,
        itemIds: Array.isArray(record.itemIds)
          ? record.itemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
          : [],
        generatedAt: typeof cache?.generatedAt === 'string' ? cache.generatedAt : null,
      } satisfies RevisionChapterSummary;
    })
    .filter(Boolean);
  return parsedChapters as RevisionChapterSummary[];
}

function getRevisionCollectionAiNotebookNarrative(
  collection?: Pick<RevisionCollection, 'metadata'> | null
): {
  preface: string;
  endRecap: string;
  generatedAt?: string | null;
} {
  const metadata =
    collection?.metadata && typeof collection.metadata === 'object'
      ? (collection.metadata as Record<string, unknown>)
      : null;
  const cache =
    metadata?.aiChapterSummaryCache && typeof metadata.aiChapterSummaryCache === 'object'
      ? (metadata.aiChapterSummaryCache as Record<string, unknown>)
      : null;
  return {
    preface: typeof cache?.preface === 'string' ? cache.preface.trim().slice(0, 320) : '',
    endRecap: typeof cache?.endRecap === 'string' ? cache.endRecap.trim().slice(0, 320) : '',
    generatedAt: typeof cache?.generatedAt === 'string' ? cache.generatedAt : null,
  };
}

function getRevisionCollectionAiFlashcards(
  collection?: Pick<RevisionCollection, 'metadata'> | null
): {
  deckTitle: string;
  generatedAt?: string | null;
  scope: 'collection' | 'chapter';
  chapterId?: string | null;
  chapterLabel?: string | null;
  flashcards: RevisionFlashcard[];
} {
  const metadata =
    collection?.metadata && typeof collection.metadata === 'object'
      ? (collection.metadata as Record<string, unknown>)
      : null;
  const cache =
    metadata?.aiFlashcardCache && typeof metadata.aiFlashcardCache === 'object'
      ? (metadata.aiFlashcardCache as Record<string, unknown>)
      : null;
  const flashcardsRaw = Array.isArray(cache?.flashcards) ? cache.flashcards : [];
  const flashcards = flashcardsRaw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      const front = typeof record.front === 'string' ? record.front.trim() : '';
      const back = typeof record.back === 'string' ? record.back.trim() : '';
      if (!front || !back) return null;
      return {
        id:
          (typeof record.id === 'string' ? record.id.trim() : '') ||
          `flashcard-${front.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24)}`,
        front,
        back,
        hint: typeof record.hint === 'string' ? record.hint.trim().slice(0, 140) : null,
        chapterLabel: typeof record.chapterLabel === 'string' ? record.chapterLabel.trim().slice(0, 120) : null,
        chapterId: typeof record.chapterId === 'string' ? record.chapterId.trim().slice(0, 120) : null,
        sourceItemIds: Array.isArray(record.sourceItemIds)
          ? record.sourceItemIds.map((itemId) => String(itemId || '').trim()).filter(Boolean)
          : [],
      } satisfies RevisionFlashcard;
    })
    .filter(Boolean) as RevisionFlashcard[];
  return {
    deckTitle: typeof cache?.deckTitle === 'string' ? cache.deckTitle.trim().slice(0, 160) : '',
    generatedAt: typeof cache?.generatedAt === 'string' ? cache.generatedAt : null,
    scope: cache?.scope === 'chapter' ? 'chapter' : 'collection',
    chapterId: typeof cache?.chapterId === 'string' ? cache.chapterId.trim().slice(0, 120) : null,
    chapterLabel: typeof cache?.chapterLabel === 'string' ? cache.chapterLabel.trim().slice(0, 160) : null,
    flashcards,
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.readAsDataURL(file);
  });
}

function loadImageFromDataUrl(dataUrl: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not load that notebook cover image.'));
    image.src = dataUrl;
  });
}

async function optimizeNotebookCoverDataUrl(dataUrl: string) {
  const image = await loadImageFromDataUrl(dataUrl);
  const canvas = document.createElement('canvas');
  const maxWidth = 720;
  const maxHeight = 960;
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1);
  canvas.width = Math.max(240, Math.round(image.width * scale));
  canvas.height = Math.max(320, Math.round(image.height * scale));
  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Could not prepare the notebook cover image.');
  }
  context.fillStyle = '#f8fafc';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let quality = 0.9;
  let optimized = canvas.toDataURL('image/jpeg', quality);
  while (optimized.length > 360_000 && quality > 0.45) {
    quality -= 0.1;
    optimized = canvas.toDataURL('image/jpeg', quality);
  }
  return optimized;
}

type RevisionCollectionIdentityDraft = {
  title: string;
  subject: string;
  topic: string;
  kind: RevisionCollectionKind;
  bundleSummary: string;
  coverTheme: RevisionCollectionCoverTheme;
  coverEmoji: string;
  coverMotto: string;
  coverImageDataUrl: string;
  coverImagePrompt: string;
  coverImageSource: 'uploaded' | 'ai_generated' | '';
};

function createRevisionCollectionIdentityDraft(
  collection?: RevisionCollection | null
): RevisionCollectionIdentityDraft {
  const cover = getRevisionCollectionCoverData(collection);
  return {
    title: collection?.title || '',
    subject: typeof collection?.subject === 'string' ? collection.subject : '',
    topic: collection?.topic || '',
    kind: collection?.kind === 'bundle' ? 'bundle' : 'standard',
    bundleSummary: collection?.bundleSummary?.trim() || collection?.description?.trim() || '',
    coverTheme: cover.theme || 'indigo',
    coverEmoji: cover.emoji || '',
    coverMotto: cover.motto || '',
    coverImageDataUrl: cover.imageDataUrl || '',
    coverImagePrompt: cover.imagePrompt || '',
    coverImageSource: cover.imageSource || '',
  };
}

type RevisionCollectionTone = {
  frameClassName: string;
  accentClassName: string;
  glowClassName: string;
};

function getRevisionCollectionTone(collection?: Pick<RevisionCollection, 'subject' | 'topic' | 'title' | 'coverRef'> | null): RevisionCollectionTone {
  const coverTheme = getRevisionCollectionCoverData(collection).theme;
  if (coverTheme === 'amber') {
    return {
      frameClassName: 'from-amber-100 via-white to-rose-50',
      accentClassName: 'bg-amber-500/10 text-amber-800 border-amber-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(217,119,6,0.12)]',
    };
  }
  if (coverTheme === 'emerald') {
    return {
      frameClassName: 'from-emerald-100 via-white to-teal-50',
      accentClassName: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(5,150,105,0.12)]',
    };
  }
  if (coverTheme === 'sky') {
    return {
      frameClassName: 'from-sky-100 via-white to-cyan-50',
      accentClassName: 'bg-sky-500/10 text-sky-800 border-sky-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(14,165,233,0.12)]',
    };
  }
  if (coverTheme === 'slate') {
    return {
      frameClassName: 'from-slate-100 via-white to-zinc-50',
      accentClassName: 'bg-slate-500/10 text-slate-800 border-slate-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(71,85,105,0.12)]',
    };
  }
  if (coverTheme === 'indigo') {
    return {
      frameClassName: 'from-indigo-100 via-white to-blue-50',
      accentClassName: 'bg-indigo-500/10 text-indigo-800 border-indigo-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(79,70,229,0.12)]',
    };
  }

  const origin = resolveRevisionSubjectOrigin(collection?.subject || collection?.topic || collection?.title || '');
  if (origin === 'language') {
    return {
      frameClassName: 'from-amber-100 via-white to-rose-50',
      accentClassName: 'bg-amber-500/10 text-amber-800 border-amber-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(217,119,6,0.12)]',
    };
  }
  if (origin === 'humanities') {
    return {
      frameClassName: 'from-emerald-100 via-white to-teal-50',
      accentClassName: 'bg-emerald-500/10 text-emerald-800 border-emerald-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(5,150,105,0.12)]',
    };
  }
  if (origin === 'applied') {
    return {
      frameClassName: 'from-sky-100 via-white to-cyan-50',
      accentClassName: 'bg-sky-500/10 text-sky-800 border-sky-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(14,165,233,0.12)]',
    };
  }
  if (origin === 'general') {
    return {
      frameClassName: 'from-slate-100 via-white to-zinc-50',
      accentClassName: 'bg-slate-500/10 text-slate-800 border-slate-300/60',
      glowClassName: 'shadow-[0_24px_48px_rgba(71,85,105,0.12)]',
    };
  }
  return {
    frameClassName: 'from-indigo-100 via-white to-blue-50',
    accentClassName: 'bg-indigo-500/10 text-indigo-800 border-indigo-300/60',
    glowClassName: 'shadow-[0_24px_48px_rgba(79,70,229,0.12)]',
  };
}

type RevisionSubjectOrigin = 'stem' | 'language' | 'humanities' | 'applied' | 'general';

const STEM_SUBJECT_TOKENS = new Set([
  'math',
  'mathematics',
  'maths',
  'additional mathematics',
  'ad math',
  'advanced mathematics',
  'biology',
  'chemistry',
  'physics',
  'integrated science',
  'combined science',
  'general science',
  'physical science',
  'life science',
]);

const LANGUAGE_SUBJECT_TOKENS = new Set([
  'english',
  'english language',
  'kiswahili',
  'swahili',
  'arabic',
  'french',
  'german',
  'spanish',
  'chinese',
  'literature',
  'literature in english',
  'grammar',
  'communication skills',
]);

const HUMANITIES_SUBJECT_TOKENS = new Set([
  'history',
  'history and government',
  'government',
  'geography',
  'social studies',
  'civics',
  'civic education',
  'citizenship education',
  'cre',
  'christian religious education',
  'ire',
  'islamic religious education',
  'religious studies',
  'religious education',
]);

const APPLIED_SUBJECT_TOKENS = new Set([
  'business',
  'business studies',
  'commerce',
  'accounting',
  'economics',
  'entrepreneurship',
  'agriculture',
  'agricultural science',
  'home science',
  'ict',
  'ict and coding',
  'coding',
  'computer studies',
  'computer science',
  'information technology',
]);

function normalizeSubjectOriginToken(subject?: string | null) {
  return String(subject || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[\/_,.-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function resolveRevisionSubjectOrigin(subject?: string | null): RevisionSubjectOrigin {
  const normalizedSubject = normalizeRevisionSubject(subject);
  if (
    normalizedSubject === 'math' ||
    normalizedSubject === 'biology' ||
    normalizedSubject === 'chemistry' ||
    normalizedSubject === 'physics'
  ) {
    return 'stem';
  }
  if (
    normalizedSubject === 'english' ||
    normalizedSubject === 'kiswahili' ||
    normalizedSubject === 'arabic' ||
    normalizedSubject === 'literature'
  ) {
    return 'language';
  }
  if (
    normalizedSubject === 'history' ||
    normalizedSubject === 'geography' ||
    normalizedSubject === 'ire'
  ) {
    return 'humanities';
  }
  if (normalizedSubject === 'business' || normalizedSubject === 'ict_coding') {
    return 'applied';
  }
  if (normalizedSubject === 'kindergarten') {
    return 'general';
  }

  const token = normalizeSubjectOriginToken(subject);
  if (!token) return 'general';

  if (
    token.includes('kindergarten') ||
    token.includes('nursery') ||
    token.includes('pre primary') ||
    token.includes('early years')
  ) {
    return 'general';
  }

  if (
    APPLIED_SUBJECT_TOKENS.has(token) ||
    /\b(ict|coding|computer studies|computer science|information technology|business|commerce|accounting|economics|entrepreneurship|agriculture|home science)\b/.test(
      token
    )
  ) {
    return 'applied';
  }

  if (
    LANGUAGE_SUBJECT_TOKENS.has(token) ||
    /\b(english|kiswahili|swahili|arabic|french|german|spanish|chinese|literature|grammar|language)\b/.test(
      token
    )
  ) {
    return 'language';
  }

  if (
    HUMANITIES_SUBJECT_TOKENS.has(token) ||
    /\b(history|government|geography|social studies|civics|religious|cre|ire|islamic studies|christian religious education)\b/.test(
      token
    )
  ) {
    return 'humanities';
  }

  if (
    STEM_SUBJECT_TOKENS.has(token) ||
    /\b(math|mathematics|maths|algebra|geometry|trigonometry|calculus|biology|chemistry|physics|integrated science|combined science|physical science|life science)\b/.test(
      token
    )
  ) {
    return 'stem';
  }

  return 'general';
}

function getRevisionSubjectOriginLabel(origin: RevisionSubjectOrigin) {
  if (origin === 'stem') return 'STEM & Sciences';
  if (origin === 'language') return 'Languages';
  if (origin === 'humanities') return 'Humanities';
  if (origin === 'applied') return 'Business & ICT';
  return 'General';
}

function getGuidedRevisionStepLabel(stage: GuidedRevisionSessionProgressResult['stage'] | GuidedRevisionSessionStartResult['currentStep']['stage']) {
  if (stage === 'recall') return 'Recall';
  if (stage === 'quick_check') return 'Quick check';
  if (stage === 'similar') return 'Similar step';
  if (stage === 'wrap') return 'Wrap';
  return 'Completed';
}

const GUIDED_STAGE_ORDER: GuidedRevisionSessionStartResult['currentStep']['stage'][] = [
  'recall',
  'quick_check',
  'similar',
  'wrap',
  'completed',
];

function StatusCard({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex min-h-[42vh] items-center justify-center px-4 text-center">
      <div className="copilot-state-card max-w-md px-6 py-8">
        <p className="text-base font-semibold text-[var(--copilot-text-primary)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{description}</p>
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="outline"
            className="copilot-control-commit mt-4 h-9 rounded-full px-4 text-sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={`revision-loading-${index}`}
          className="copilot-sidebar-card animate-pulse space-y-3"
        >
          <div className="h-3 w-28 rounded-full bg-slate-200/70" />
          <div className="h-4 w-2/3 rounded-full bg-slate-200/70" />
          <div className="h-3 w-full rounded-full bg-slate-200/60" />
        </div>
      ))}
    </div>
  );
}

function WorkspacePanelState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex h-full min-h-[320px] items-center justify-center">
      <div className="copilot-state-card w-full max-w-xl px-6 py-8 text-center">
        <p className="text-lg font-semibold text-[var(--copilot-text-primary)]">{title}</p>
        <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{description}</p>
        {actionLabel && onAction ? (
          <Button
            type="button"
            variant="outline"
            className="copilot-control-commit mt-5 h-10 rounded-full px-4 text-sm"
            onClick={onAction}
          >
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function WorkspaceRailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="h-3 w-20 rounded-full bg-slate-200/70" />
        <div className="h-10 rounded-2xl bg-slate-200/60" />
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <div
              key={`workspace-rail-stat-${index}`}
              className="h-[68px] rounded-[1rem] border border-slate-200/70 bg-white/85"
            />
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`workspace-rail-row-${index}`}
            className="h-[74px] rounded-[1rem] border border-slate-200/70 bg-white/85"
          />
        ))}
      </div>
    </div>
  );
}

function WorkspaceDetailSkeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-5 py-5">
        <div className="h-3 w-24 rounded-full bg-slate-200/70" />
        <div className="mt-3 h-7 w-1/2 rounded-full bg-slate-200/70" />
        <div className="mt-3 h-4 w-2/3 rounded-full bg-slate-200/60" />
      </div>
      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/90 px-5 py-5">
        <div className="flex gap-2">
          <div className="h-9 w-24 rounded-full bg-slate-200/70" />
          <div className="h-9 w-24 rounded-full bg-slate-200/60" />
          <div className="h-9 w-28 rounded-full bg-slate-200/60" />
        </div>
        <div className="mt-5 space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`workspace-detail-line-${index}`}
              className={`h-4 rounded-full bg-slate-200/${index % 2 === 0 ? '70' : '60'}`}
              style={{ width: `${index === 4 ? 56 : 92 - index * 8}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RevisionPreviewCard({
  item,
  onSelect,
  isActive = false,
  compact = false,
  draggable = false,
  onDragStart,
  onDragEnd,
  collectionItemCount = 0,
  quickNoteCount = 0,
  onOpenQuickNotes,
  onOpenMoveDialog,
  onStartSlideshow,
  onUpdateMastery,
}: {
  item: RevisionItem;
  onSelect: (item: RevisionItem) => void;
  isActive?: boolean;
  compact?: boolean;
  draggable?: boolean;
  onDragStart?: (item: RevisionItem) => void;
  onDragEnd?: () => void;
  collectionItemCount?: number;
  quickNoteCount?: number;
  onOpenQuickNotes?: (item: RevisionItem) => void;
  onOpenMoveDialog?: (item: RevisionItem) => void;
  onStartSlideshow?: (item: RevisionItem) => void;
  onUpdateMastery?: (item: RevisionItem, mastery: RevisionMastery | null) => Promise<void> | void;
}) {
  const typeVisual = getRevisionTypeVisual(item);
  const TypeIcon = typeVisual.Icon;
  const dragIntentRef = React.useRef(false);
  const [isUpdatingMastery, setIsUpdatingMastery] = React.useState(false);
  const previewText = getRevisionItemPreviewText(item);
  const savedLens = getSavedLensSelectionFromItem(item) || 'default';
  const savedLensMeta = getDocumentLensMeta(savedLens);
  const savedLensInputs = getLensInputMapFromItem(item);
  const lensSignalCount = INTERACTIVE_DOCUMENT_LENSES.reduce((total, lens) => total + (savedLensInputs[lens] ? 1 : 0), 0);
  const activeMasteryOption = MASTERY_OPTIONS.find((option) => option.value === (item.mastery || 'unset')) || MASTERY_OPTIONS[0];
  const applyMasteryQuickTag = React.useCallback(
    async (value: RevisionMastery | null) => {
      if (!onUpdateMastery) return;
      setIsUpdatingMastery(true);
      try {
        await onUpdateMastery(item, value);
      } finally {
        setIsUpdatingMastery(false);
      }
    },
    [item, onUpdateMastery]
  );
  const showLensSignalPill = savedLens !== 'default' || lensSignalCount > 0;
  const collectionFileCountLabel =
    item.collectionId && collectionItemCount > 0
      ? `${collectionItemCount} file${collectionItemCount === 1 ? '' : 's'}`
      : null;
  const normalizedTitle = normalizeLabelKey(item.title);
  const normalizedCollectionTitle = normalizeLabelKey(item.collectionTitle);
  const previewSignal =
    [
      item.topic,
      item.subtopic,
      item.subject ? getRevisionSubjectLabel(item.subject) : '',
      ...(item.tags || []),
    ]
      .map((value) => (value || '').replace(/\s+/g, ' ').trim())
      .find((value) => {
        const normalized = normalizeLabelKey(value);
        return normalized && normalized !== normalizedTitle && normalized !== normalizedCollectionTitle;
      }) || '';
  const hasNoteActions = Boolean(onOpenQuickNotes || onOpenMoveDialog || (onStartSlideshow && item.collectionId));
  const hasMasteryAction = Boolean(onUpdateMastery);
  const hasQuickActions = hasNoteActions || hasMasteryAction;

  return (
    <article className="relative">
      <button
        type="button"
        draggable={draggable}
        data-active={isActive ? 'true' : 'false'}
        data-save-type={typeVisual.saveType}
        data-lens={savedLens}
        className={
          `${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
            compact
              ? 'copilot-revision-preview-card copilot-revision-preview-card-compact copilot-revision-library-row w-full text-left'
              : 'copilot-revision-preview-card copilot-sidebar-card w-full text-left'
          }`
        }
        onClick={() => {
          if (dragIntentRef.current) return;
          onSelect(item);
        }}
        onDragStart={(event) => {
          if (!draggable) return;
          dragIntentRef.current = true;
          event.dataTransfer.effectAllowed = 'move';
          onDragStart?.(item);
        }}
        onDragEnd={() => {
          window.setTimeout(() => {
            dragIntentRef.current = false;
          }, 0);
          onDragEnd?.();
        }}
      >
        <div className="copilot-revision-preview-card-shell flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="copilot-revision-preview-card-head flex flex-wrap items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className={`copilot-revision-type-pill ${typeVisual.toneClassName}`}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  {typeVisual.label}
                </span>
                {item.collectionTitle ? (
                  <span className="copilot-revision-pill">{item.collectionTitle}</span>
                ) : null}
                {collectionFileCountLabel ? (
                  <span className="copilot-revision-pill">{collectionFileCountLabel}</span>
                ) : null}
                {item.mediaType && item.mediaType !== 'text' ? (
                  <span className="copilot-revision-pill">{getRevisionMediaTypeLabel(item.mediaType)}</span>
                ) : null}
                {showLensSignalPill ? (
                  <span className="copilot-revision-preview-lens-pill" data-lens={savedLens}>
                    <span className="copilot-revision-preview-lens-orb" aria-hidden="true" />
                    <span>{savedLensMeta.label}</span>
                  </span>
                ) : null}
              </div>
              <span className="copilot-revision-preview-system-tag" data-lens={savedLens} aria-live="polite">
                <span className="copilot-revision-preview-system-orb" aria-hidden="true" />
                <span>{lensSignalCount ? `Synced ${lensSignalCount}` : 'Sync pending'}</span>
              </span>
            </div>
            {previewSignal ? (
              <p className={`${compact ? 'mt-2' : 'mt-3'} copilot-revision-preview-card-signal`}>
                {previewSignal}
              </p>
            ) : null}
            <h4
              className={`copilot-revision-preview-card-title ${
                previewSignal ? 'mt-1.5' : compact ? 'mt-2' : 'mt-3'
              } text-sm font-semibold text-[var(--copilot-text-primary)]`}
            >
              {item.title}
            </h4>
            {item.mastery ? (
              <div className={`${compact ? 'mt-1.5' : 'mt-2'}`}>
                <TopicMasteryChip label={item.mastery} compact />
              </div>
            ) : null}
            <p
              className={`copilot-revision-preview-card-summary mt-1.5 ${
                compact ? 'line-clamp-2' : 'line-clamp-3'
              } text-xs text-[var(--copilot-text-secondary)]`}
            >
              {previewText}
            </p>
          </div>
          <div className="copilot-revision-preview-card-rail flex items-center justify-between gap-3 sm:flex-col sm:items-end sm:text-right">
            <div
              className="copilot-revision-preview-card-date"
              data-has-quick-actions={hasQuickActions ? 'true' : 'false'}
            >
              {formatUpdatedAt(item.updatedAt)}
            </div>
            <div
              className={`copilot-revision-preview-card-action ${compact ? 'mt-0 sm:mt-1.5' : 'mt-0 sm:mt-2'}`}
              data-mode={draggable ? 'drag' : 'open'}
            >
              {draggable ? (
                <>
                  Drag <GripVertical className="h-3 w-3" />
                </>
              ) : (
                <>
                  Open <ChevronRight className="h-3 w-3" />
                </>
              )}
            </div>
          </div>
        </div>
      </button>
      {hasQuickActions ? (
        <div className="absolute right-3 top-3 z-20">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="copilot-control-nav inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                aria-label={`Note options for ${item.title}`}
                aria-busy={isUpdatingMastery}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => event.stopPropagation()}
              >
                {isUpdatingMastery ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-1.5"
            >
              {hasNoteActions ? (
                <>
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
                    Note options
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" />
                  {onOpenQuickNotes ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      onSelect={() => onOpenQuickNotes(item)}
                    >
                      Quick notes ({quickNoteCount})
                    </DropdownMenuItem>
                  ) : null}
                  {onOpenMoveDialog ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      onSelect={() => onOpenMoveDialog(item)}
                    >
                      Move note
                    </DropdownMenuItem>
                  ) : null}
                  {item.collectionId && onStartSlideshow ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      onSelect={() => onStartSlideshow(item)}
                    >
                      Start slideshow here
                    </DropdownMenuItem>
                  ) : null}
                </>
              ) : null}
              {hasMasteryAction ? (
                <>
                  {hasNoteActions ? <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" /> : null}
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
                    Mastery level
                  </DropdownMenuLabel>
                  {MASTERY_OPTIONS.map((option) => {
                    const optionValue: RevisionMastery | null = option.value === 'unset' ? null : option.value;
                    const isActive = activeMasteryOption.value === option.value;
                    return (
                      <DropdownMenuItem
                        key={option.value}
                        disabled={isUpdatingMastery}
                        className={`cursor-pointer rounded-xl text-xs ${isActive ? 'bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]' : ''}`}
                        onSelect={() => void applyMasteryQuickTag(optionValue)}
                      >
                        <span className={`h-2 w-2 rounded-full ${getMasteryDotClassName(optionValue)}`} />
                        <span>{option.label}</span>
                        {isActive ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                      </DropdownMenuItem>
                    );
                  })}
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </article>
  );
}

function RevisionCollectionCard({
  collection,
  onSelect,
  compact = false,
  isActive = false,
  isDropTarget = false,
  onDragOverCollection,
  onDragLeaveCollection,
  onDropCollection,
}: {
  collection: RevisionCollection;
  onSelect: (collection: RevisionCollection) => void;
  compact?: boolean;
  isActive?: boolean;
  isDropTarget?: boolean;
  onDragOverCollection?: (collection: RevisionCollection) => void;
  onDragLeaveCollection?: (collection: RevisionCollection) => void;
  onDropCollection?: (collection: RevisionCollection) => void;
}) {
  const tone = getRevisionCollectionTone(collection);
  const cover = getRevisionCollectionCoverData(collection);
  const previewItems = sortRevisionItemsForNotebook(collection.previewItems || []).slice(0, compact ? 2 : 3);
  const chapterCount = buildRevisionNotebookChapters(collection.previewItems || []).length || 1;
  const previewLine =
    collection.bundleSummary?.trim() ||
    collection.description?.trim() ||
    (previewItems.length
      ? previewItems.map((item) => item.title).join(' | ')
      : 'A calm study book for this topic.');
  const coverMotto =
    cover.motto ||
    (collection.kind === 'bundle'
      ? 'Built to read like a deliberate study book.'
      : 'Organized to keep revision calm and clear.');

  return (
    <button
      type="button"
      className={`copilot-revision-collection-card copilot-future-hover w-full overflow-hidden rounded-[1.35rem] border border-[var(--copilot-soft-line)] bg-gradient-to-br ${tone.frameClassName} px-4 py-4 text-left transition-transform hover:-translate-y-0.5 ${tone.glowClassName} ${
        isActive ? 'copilot-revision-collection-card-active' : ''
      } ${isDropTarget ? 'copilot-revision-collection-card-drop' : ''}`}
      onClick={() => onSelect(collection)}
      onDragOver={(event) => {
        if (!onDragOverCollection) return;
        event.preventDefault();
        onDragOverCollection(collection);
      }}
      onDragLeave={() => onDragLeaveCollection?.(collection)}
      onDrop={(event) => {
        if (!onDropCollection) return;
        event.preventDefault();
        onDropCollection(collection);
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`copilot-revision-cover-mark ${compact ? 'h-11 w-11 rounded-[1rem] text-base' : 'h-12 w-12 rounded-[1.1rem] text-lg'}`}>
            {cover.imageDataUrl ? (
              <img
                src={cover.imageDataUrl}
                alt={`${collection.title} cover`}
                className="copilot-revision-cover-art"
              />
            ) : cover.emoji ? (
              <span className="copilot-revision-cover-mark-emoji" aria-hidden="true">{cover.emoji}</span>
            ) : (
              <NotebookPen className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0">
            <span className="copilot-revision-cover-motto block truncate">
              {coverMotto}
            </span>
            <span className={`mt-2 inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${tone.accentClassName}`}>
              {collection.kind === 'bundle' ? 'Study book' : 'Notebook'}
            </span>
            <h3 className={`${compact ? 'mt-3 text-base' : 'mt-3 text-lg'} font-semibold tracking-tight text-[var(--copilot-text-primary)]`}>
              {collection.title}
            </h3>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <span className="copilot-revision-pill">
            {collection.itemCount || 0} notes
          </span>
          {isDropTarget ? (
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-accent-text)]">
              Drop notes here
            </p>
          ) : null}
        </div>
      </div>

      <p className={`${compact ? 'mt-2 line-clamp-2 text-xs' : 'mt-3 line-clamp-3 text-sm leading-6'} text-[var(--copilot-text-secondary)]`}>
        {previewLine}
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {collection.subject ? (
          <span className="copilot-revision-pill">
            {getRevisionWorkspaceSubjectDisplayLabel(collection.subject, 'General')}
          </span>
        ) : null}
        {collection.topic ? <span className="copilot-revision-pill">{collection.topic}</span> : null}
        <span className="copilot-revision-pill">{chapterCount} chapter{chapterCount === 1 ? '' : 's'}</span>
      </div>

      {previewItems.length ? (
        <div className="mt-4 grid gap-2">
          {previewItems.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center justify-between gap-3 rounded-[1rem] border border-white/70 bg-white/70 px-3 py-2.5 backdrop-blur"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{item.title}</p>
                <p className="mt-1 truncate text-[11px] uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                  {getRevisionChapterLabel(item)}
                </p>
              </div>
              <span className="copilot-revision-pill shrink-0">{index + 1}</span>
            </div>
          ))}
        </div>
      ) : null}
    </button>
  );
}

function RevisionNotebookChapterItemCard({
  item,
  orderLabel,
  chapterLabel,
  isSelected,
  selectionMode,
  isDragTarget,
  quickNoteCount = 0,
  onOpen,
  onToggleSelected,
  onMoveUp,
  onMoveDown,
  onOpenQuickNotes,
  onOpenMoveDialog,
  onStartSlideshow,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  item: RevisionItem;
  orderLabel: number;
  chapterLabel: string;
  isSelected: boolean;
  selectionMode: boolean;
  isDragTarget: boolean;
  quickNoteCount?: number;
  onOpen: (item: RevisionItem) => void;
  onToggleSelected: (item: RevisionItem) => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onOpenQuickNotes?: (item: RevisionItem) => void;
  onOpenMoveDialog?: (item: RevisionItem) => void;
  onStartSlideshow?: (item: RevisionItem) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: () => void;
  onDrop?: () => void;
}) {
  const typeVisual = getRevisionTypeVisual(item);
  const TypeIcon = typeVisual.Icon;
  const hasQuickActions = Boolean(onOpenQuickNotes || onOpenMoveDialog || (onStartSlideshow && item.collectionId));

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={(event) => {
        event.preventDefault();
        onDragOver?.();
      }}
      onDrop={(event) => {
        event.preventDefault();
        onDrop?.();
      }}
      className={`copilot-revision-book-item rounded-[1.2rem] border px-4 py-4 transition ${
        isDragTarget
          ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)]/60'
          : 'border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]'
      }`}
    >
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] text-[var(--copilot-text-primary)]">
              {orderLabel}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`copilot-revision-type-pill ${typeVisual.toneClassName}`}>
                  <TypeIcon className="h-3.5 w-3.5" />
                  {typeVisual.label}
                </span>
                <span className="copilot-revision-pill">{chapterLabel}</span>
                {item.mastery ? <TopicMasteryChip label={item.mastery} compact /> : null}
              </div>
              <h4 className="mt-3 text-base font-semibold text-[var(--copilot-text-primary)]">{item.title}</h4>
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {getRevisionItemPreviewText(item)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {selectionMode ? (
              <Button
                type="button"
                variant="outline"
                className={`copilot-control-nav h-8 rounded-full px-3 text-xs ${isSelected ? 'border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]' : ''}`}
                onClick={() => onToggleSelected(item)}
              >
                <Check className={`mr-1.5 h-3.5 w-3.5 ${isSelected ? 'opacity-100' : 'opacity-25'}`} />
                {isSelected ? 'Selected' : 'Select'}
              </Button>
            ) : null}
            <span className="inline-flex h-8 items-center justify-center rounded-full border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-2.5 text-[11px] text-[var(--copilot-text-tertiary)]">
              <GripVertical className="mr-1.5 h-3.5 w-3.5" />
              Drag
            </span>
            <Button
              type="button"
              variant="outline"
              className="copilot-control-nav h-8 rounded-full px-2.5 text-xs"
              onClick={onMoveUp}
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="copilot-control-nav h-8 rounded-full px-2.5 text-xs"
              onClick={onMoveDown}
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              className="copilot-control-commit h-8 rounded-full px-3 text-xs"
              onClick={() => onOpen(item)}
            >
              Open note
            </Button>
            {hasQuickActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="copilot-control-nav inline-flex h-8 w-8 items-center justify-center rounded-full p-0"
                    aria-label={`Actions for ${item.title}`}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => event.stopPropagation()}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-1.5"
                >
                  <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
                    Note actions
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" />
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl text-xs"
                    onSelect={() => onOpenQuickNotes?.(item)}
                  >
                    Quick notes ({quickNoteCount})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-xl text-xs"
                    onSelect={() => onOpenMoveDialog?.(item)}
                  >
                    Move note
                  </DropdownMenuItem>
                  {item.collectionId && onStartSlideshow ? (
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      onSelect={() => onStartSlideshow(item)}
                    >
                      Start slideshow here
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--copilot-text-tertiary)]">
          {item.topic ? <span className="copilot-revision-pill">{item.topic}</span> : null}
          {item.subtopic ? <span className="copilot-revision-pill">{item.subtopic}</span> : null}
          <span>{formatUpdatedAt(item.updatedAt)}</span>
        </div>
      </div>
    </article>
  );
}

function RevisionQueueCard({
  title,
  description,
  items,
  count,
  icon,
  accentClassName,
  onSelectItem,
}: {
  title: string;
  description: string;
  items: RevisionItem[];
  count?: number;
  icon: React.ComponentType<{ className?: string }>;
  accentClassName: string;
  onSelectItem: (itemId: string) => void;
}) {
  if (!items.length) return null;

  const Icon = icon;

  return (
    <div className="copilot-sidebar-card space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span
            className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${accentClassName}`}
          >
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">{title}</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
              {description}
            </p>
          </div>
        </div>
        <span className="copilot-revision-pill shrink-0">{count ?? items.length}</span>
      </div>

      <div className="space-y-2">
        {items.slice(0, 2).map((item) => (
          <button
            key={item.id}
            type="button"
            className="copilot-control-nav w-full rounded-2xl px-3 py-2.5 text-left"
            onClick={() => onSelectItem(item.id)}
          >
            <p className="text-sm font-medium text-[var(--copilot-text-primary)]">{item.title}</p>
              <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                {item.topic || item.collectionTitle || getRevisionItemTypeLabel(item)}
              </p>
            </button>
        ))}
      </div>
    </div>
  );
}

function RevisionSummaryCard({
  label,
  value,
  icon,
  accentClassName,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accentClassName: string;
}) {
  const Icon = icon;

  return (
    <div className="copilot-revision-workspace-stat rounded-[1.35rem] border border-slate-200/80 bg-white/90 px-3.5 py-2.5 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${accentClassName}`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
            {label}
          </p>
          <p className="mt-0.5 text-base font-semibold text-[var(--copilot-text-primary)]">{value}</p>
        </div>
      </div>
    </div>
  );
}

function RevisionBreadcrumbTrail({
  items,
  className = '',
}: {
  items: RevisionBreadcrumb[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={`copilot-revision-breadcrumb-trail ${className}`.trim()}>
      {items.map((crumb, index) => (
        <React.Fragment key={`${crumb.label}-${index}`}>
          {index > 0 ? (
            <ChevronRight className="copilot-revision-breadcrumb-separator h-3.5 w-3.5" />
          ) : null}
          <button
            type="button"
            disabled={!crumb.onClick || crumb.active}
            className={[
              'copilot-revision-breadcrumb-chip',
              crumb.active
                ? 'copilot-revision-breadcrumb-chip-active'
                : crumb.onClick
                ? 'copilot-revision-breadcrumb-chip-clickable'
                : 'copilot-revision-breadcrumb-chip-muted',
            ].join(' ')}
            onClick={crumb.onClick}
            title={crumb.label}
          >
            {crumb.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}

function RevisionDetailCard({
  item,
  breadcrumbs,
  breadcrumbSubjectLabel,
  notebookNavigation,
  onLaunchSteadfast,
  isLaunchingSteadfast,
  onBackToCollection,
  backToCollectionLabel,
  onContinueChat,
  navigation,
  onTogglePin,
  onUpdateMastery,
  onSaveStudentNote,
  onUpdateItem,
  onDeleteItem,
  onQuizItem,
  onBreakdownItem,
  onSimilarQuestionItem,
  onStartSlideshow,
  collections,
  activeCollection,
  sameCollectionItems,
  crossCollectionRelatedItems,
  onOpenItem,
}: {
  item: RevisionItem;
  breadcrumbs?: RevisionBreadcrumb[];
  breadcrumbSubjectLabel?: string | null;
  notebookNavigation?: {
    currentIndex: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
  } | null;
  onLaunchSteadfast?: (args: {
    item: RevisionItem;
    intent: SteadfastLaunchIntent;
    lens: RevisionDocumentLens;
    selectedSnippet?: string;
    starterResponse?: string;
    supportAction?: GuidedRevisionSupportAction;
  }) => Promise<void> | void;
  isLaunchingSteadfast?: boolean;
  onBackToCollection?: () => void;
  backToCollectionLabel?: string;
  onContinueChat?: (sessionId: string) => void;
  navigation?: {
    currentIndex: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
  } | null;
  onTogglePin?: (item: RevisionItem) => Promise<void> | void;
  onUpdateMastery?: (item: RevisionItem, mastery: RevisionMastery | null) => Promise<void> | void;
  onSaveStudentNote?: (item: RevisionItem, studentNote: string) => Promise<void> | void;
  onUpdateItem?: (item: RevisionItem, patch: UpdateRevisionItemRequest) => Promise<void> | void;
  onDeleteItem?: (item: RevisionItem) => Promise<void> | void;
  onQuizItem?: (item: RevisionItem) => Promise<void> | void;
  onBreakdownItem?: (item: RevisionItem) => Promise<void> | void;
  onSimilarQuestionItem?: (item: RevisionItem) => Promise<void> | void;
  onStartSlideshow?: (item: RevisionItem) => void;
  collections?: RevisionCollection[];
  activeCollection?: RevisionCollection | null;
  sameCollectionItems?: RevisionItem[];
  crossCollectionRelatedItems?: RevisionItem[];
  onOpenItem?: (itemId: string) => void;
}) {
  const itemEditorDraftState = React.useMemo(
    () => getRevisionEditorDraftState(item),
    [item.bundleRole, item.collectionId, item.content, item.featuredRank, item.summary, item.title]
  );
  const [noteDraft, setNoteDraft] = React.useState(item.studentNote || '');
  const [isSavingNote, setIsSavingNote] = React.useState(false);
  const [isPinning, setIsPinning] = React.useState(false);
  const [isUpdatingMastery, setIsUpdatingMastery] = React.useState(false);
  const [isEditingNote, setIsEditingNote] = React.useState(false);
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [isDeletingNote, setIsDeletingNote] = React.useState(false);
  const [activeLens, setActiveLens] = React.useState<RevisionDocumentLens>(
    () => getSavedLensSelectionFromItem(item) || 'default'
  );
  const [lensInputDrafts, setLensInputDrafts] = React.useState<RevisionLensInputMap>(() => getLensInputMapFromItem(item));
  const [lensGuidanceMap, setLensGuidanceMap] = React.useState<RevisionLensGuidanceMap>(() =>
    getLensGuidanceMapFromItem(item)
  );
  const [isSavingLensInput, setIsSavingLensInput] = React.useState(false);
  const [selectedSnippet, setSelectedSnippet] = React.useState('');
  const [titleDraft, setTitleDraft] = React.useState(itemEditorDraftState.title);
  const [summaryDraft, setSummaryDraft] = React.useState(itemEditorDraftState.summary);
  const [contentDraft, setContentDraft] = React.useState(itemEditorDraftState.content);
  const [collectionDraft, setCollectionDraft] = React.useState(itemEditorDraftState.collectionId);
  const [chapterDraft, setChapterDraft] = React.useState(itemEditorDraftState.chapter);
  const [orderDraft, setOrderDraft] = React.useState(itemEditorDraftState.order);
  const [activeItemFlashcardIndex, setActiveItemFlashcardIndex] = React.useState(0);
  const [isItemFlashcardBackVisible, setIsItemFlashcardBackVisible] = React.useState(false);
  const [isItemFlashcardQuizActive, setIsItemFlashcardQuizActive] = React.useState(false);
  const [itemFlashcardQuizIndex, setItemFlashcardQuizIndex] = React.useState(0);
  const [isItemFlashcardQuizAnswerVisible, setIsItemFlashcardQuizAnswerVisible] = React.useState(false);
  const [itemFlashcardQuizResults, setItemFlashcardQuizResults] = React.useState<Record<string, 'again' | 'got_it'>>({});
  const [itemFlashcardQuizOrder, setItemFlashcardQuizOrder] = React.useState<string[]>([]);
  const [itemFlashcardQuizRepeatCountById, setItemFlashcardQuizRepeatCountById] = React.useState<Record<string, number>>({});
  const [activeGraphItemId, setActiveGraphItemId] = React.useState<string | null>(null);
  const [visitedGraphItemIds, setVisitedGraphItemIds] = React.useState<string[]>([]);
  const [isGraphSummaryVisible, setIsGraphSummaryVisible] = React.useState(false);
  const [isStudyToolViewportActive, setIsStudyToolViewportActive] = React.useState(false);
  const [isReaderHeaderCollapsed, setIsReaderHeaderCollapsed] = React.useState(false);
  const [hasReaderHeaderScrolled, setHasReaderHeaderScrolled] = React.useState(false);
  const editorTitleInputRef = React.useRef<HTMLInputElement | null>(null);
  const readerCardRef = React.useRef<HTMLDivElement | null>(null);
  const noteContentRef = React.useRef<HTMLDivElement | null>(null);
  const focusViewportRef = React.useRef<HTMLDivElement | null>(null);
  const focusViewportTargetId = React.useMemo(() => `revision-note-focus-viewport-${item.id}`, [item.id]);
  const typeVisual = getRevisionTypeVisual(item);
  const TypeIcon = typeVisual.Icon;
  const noteBlocks = React.useMemo(
    () => getRevisionStudyBlocks(item.content || item.summary || ''),
    [item.content, item.summary]
  );
  const itemFlashcards = React.useMemo(
    () => buildRevisionItemFlashcards({ item, noteBlocks }),
    [item, noteBlocks]
  );
  const itemFlashcardMap = React.useMemo(
    () => new Map(itemFlashcards.map((card) => [card.id, card] as const)),
    [itemFlashcards]
  );
  const hasMultipleNoteBlocks = noteBlocks.length > 1;
  const hasSourceLink = Boolean(item.sessionId && onContinueChat);
  const editorInsight = React.useMemo(() => {
    const blocks = getRevisionStudyBlocks(contentDraft || summaryDraft || '').length || 1;
    const words = (contentDraft || summaryDraft || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean).length;
    const readingMinutes = Math.max(1, Math.round(words / 170));
    return { blocks, words, readingMinutes };
  }, [contentDraft, summaryDraft]);
  const normalizedContentDraft = React.useMemo(
    () => normalizeRevisionEditorContent(contentDraft),
    [contentDraft]
  );
  const normalizedTitleDraft = titleDraft.trim();
  const normalizedSummaryDraft = summaryDraft.trim();
  const normalizedChapterDraft = chapterDraft.trim();
  const normalizedOrderDraft = React.useMemo(() => normalizeRevisionEditorRank(orderDraft), [orderDraft]);
  const normalizedSavedContent = React.useMemo(
    () => normalizeRevisionEditorContent(itemEditorDraftState.content),
    [itemEditorDraftState.content]
  );
  const leadSummary = React.useMemo(() => {
    const summary = item.summary?.replace(/\s+/g, ' ').trim() || '';
    const firstBlock = noteBlocks[0]?.replace(/\s+/g, ' ').trim() || '';
    if (!summary || summary === firstBlock) return '';
    return summary;
  }, [item.summary, noteBlocks]);
  const canSaveEditedNote = Boolean(
    normalizedTitleDraft &&
      (normalizedContentDraft ||
        normalizedSummaryDraft ||
        normalizeRevisionEditorContent(item.content || item.summary || ''))
  );
  const hasEditedNoteChanges = Boolean(
    normalizedTitleDraft !== itemEditorDraftState.title.trim() ||
      normalizedSummaryDraft !== itemEditorDraftState.summary.trim() ||
      normalizedContentDraft !== normalizedSavedContent ||
      collectionDraft !== itemEditorDraftState.collectionId ||
      normalizedChapterDraft !== itemEditorDraftState.chapter.trim() ||
      normalizedOrderDraft !== normalizeRevisionEditorRank(itemEditorDraftState.order)
  );
  const canSubmitEditedNote = canSaveEditedNote && hasEditedNoteChanges;
  const editorStatusState = isSavingEdit ? 'saving' : !canSaveEditedNote ? 'invalid' : hasEditedNoteChanges ? 'dirty' : 'clean';
  const editorStatusCopy = isSavingEdit
    ? 'Saving changes'
    : !canSaveEditedNote
      ? 'Needs a clear title and note body'
      : hasEditedNoteChanges
        ? 'Unsaved changes'
        : 'Saved note is up to date';
  const bookContextItems = sameCollectionItems || [];
  const notebookContextItems = React.useMemo(() => {
    const seen = new Set<string>();
    return [item, ...bookContextItems].filter((entry) => {
      if (!entry.id || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
  }, [bookContextItems, item]);
  const notebookItemCount = notebookContextItems.length || 1;
  const notebookDescriptionMeta = React.useMemo(
    () =>
      activeCollection
        ? buildNotebookContextDescription({
            collection: activeCollection,
            currentItem: item,
            notebookItems: notebookContextItems,
          })
        : null,
    [activeCollection, item, notebookContextItems]
  );
  const externalContextItems = crossCollectionRelatedItems || [];
  const serverConnectedGraphLinks = React.useMemo(
    () => (Array.isArray(item.connectedGraph?.links) ? item.connectedGraph?.links || [] : []),
    [item.connectedGraph]
  );
  const serverConnectedGraphLinkByItemId = React.useMemo(
    () => new Map(serverConnectedGraphLinks.map((link) => [link.targetItemId, link] as const)),
    [serverConnectedGraphLinks]
  );
  const connectedGraphEntries = React.useMemo<ConnectedGraphEntry[]>(
    () =>
      externalContextItems
        .map((relatedItem) => ({
          item: relatedItem,
          insight: serverConnectedGraphLinkByItemId.has(relatedItem.id)
            ? buildRevisionConnectionInsightFromGraphLink(serverConnectedGraphLinkByItemId.get(relatedItem.id)!)
            : buildRevisionConnectionInsight(item, relatedItem),
        }))
        .sort((left, right) => {
          if (right.insight.score !== left.insight.score) return right.insight.score - left.insight.score;
          return toRevisionSortTime(right.item.updatedAt) - toRevisionSortTime(left.item.updatedAt);
        }),
    [externalContextItems, item, serverConnectedGraphLinkByItemId]
  );
  React.useEffect(() => {
    if (!connectedGraphEntries.length) {
      if (activeGraphItemId !== null) setActiveGraphItemId(null);
      return;
    }
    if (!activeGraphItemId || !connectedGraphEntries.some((entry) => entry.item.id === activeGraphItemId)) {
      setActiveGraphItemId(connectedGraphEntries[0].item.id);
    }
  }, [activeGraphItemId, connectedGraphEntries]);
  React.useEffect(() => {
    const availableIds = new Set(connectedGraphEntries.map((entry) => entry.item.id));
    setVisitedGraphItemIds((previous) => {
      const next = previous.filter((itemId) => availableIds.has(itemId));
      const fallbackActiveId = connectedGraphEntries[0]?.item.id || null;
      const preferredActiveId = activeGraphItemId && availableIds.has(activeGraphItemId) ? activeGraphItemId : fallbackActiveId;
      if (preferredActiveId && !next.includes(preferredActiveId)) {
        next.push(preferredActiveId);
      }
      if (next.length === previous.length && next.every((value, index) => value === previous[index])) {
        return previous;
      }
      return next;
    });
  }, [activeGraphItemId, connectedGraphEntries]);
  React.useEffect(() => {
    setIsGraphSummaryVisible(false);
  }, [item.id, connectedGraphEntries.length]);
  const activeConnectedGraphIndex = React.useMemo(
    () => connectedGraphEntries.findIndex((entry) => entry.item.id === activeGraphItemId),
    [activeGraphItemId, connectedGraphEntries]
  );
  const activeConnectedGraphEntry =
    activeConnectedGraphIndex >= 0
      ? connectedGraphEntries[activeConnectedGraphIndex]
      : connectedGraphEntries[0] || null;
  const activeConnectedGraphPreview = React.useMemo(() => {
    if (!activeConnectedGraphEntry) return null;
    const relatedItem = activeConnectedGraphEntry.item;
    const graphLink = serverConnectedGraphLinkByItemId.get(relatedItem.id);
    const previewText =
      sanitizeConnectedGraphText(getRevisionItemPreviewText(relatedItem), 190) ||
      'Open this linked note for a focused summary and quick retrieval.';
    const metaPillsRaw: string[] = [];
    if (relatedItem.subject) metaPillsRaw.push(getRevisionSubjectLabel(relatedItem.subject));
    if (relatedItem.topic) metaPillsRaw.push(relatedItem.topic);
    if (relatedItem.saveType) metaPillsRaw.push(getRevisionSaveTypeLabel(relatedItem.saveType));
    const sharedTags = sanitizeConnectedGraphPills(
      graphLink?.sharedTags || activeConnectedGraphEntry.insight.sharedTags || [],
      2
    );
    const signalPills = sanitizeConnectedGraphPills(
      graphLink?.whySignals || activeConnectedGraphEntry.insight.signals || [],
      2
    );
    const metaPills = sanitizeConnectedGraphPills(metaPillsRaw, 2);
    const guidanceLine = buildConnectedGraphGuidanceLine(
      graphLink?.whyConnected || activeConnectedGraphEntry.insight.reasonLine
    );
    const bridgeLabel = graphLink?.category
      ? getRevisionConnectionBridgeLabel(graphLink.category)
      : activeConnectedGraphEntry.insight.bridgeLabel;
    const combinedPills = [...new Set([...sharedTags, ...signalPills, ...metaPills])].slice(0, 4);
    return {
      title: relatedItem.title?.trim() || 'Related note',
      previewText,
      bridgeLabel,
      pills: combinedPills,
      reasonLine: guidanceLine,
    };
  }, [activeConnectedGraphEntry, serverConnectedGraphLinkByItemId]);
  const connectedGraphSummaryLines = React.useMemo(
    () =>
      item.connectedGraph?.summaryLines?.length
        ? item.connectedGraph.summaryLines
            .map((line) => line.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
        : buildConnectedGraphRevisionSummary({ item, entries: connectedGraphEntries }),
    [connectedGraphEntries, item]
  );
  const connectedGraphReasonLines = React.useMemo(
    () => {
      if (serverConnectedGraphLinks.length) {
        return serverConnectedGraphLinks
          .slice(0, 3)
          .map((link) => `${link.targetTitle}: ${link.whyConnected.replace(/^Why connected:\s*/i, '').trim()}`);
      }
      return connectedGraphEntries
        .slice(0, 3)
        .map((entry) => `${entry.item.title}: ${entry.insight.reasonLine.replace(/^Why connected:\s*/i, '')}`);
    },
    [connectedGraphEntries, serverConnectedGraphLinks]
  );
  const connectedGraphVisitedCount = visitedGraphItemIds.length;
  const isConnectedGraphComplete = React.useMemo(
    () =>
      connectedGraphEntries.length > 0 &&
      connectedGraphEntries.every((entry) => visitedGraphItemIds.includes(entry.item.id)),
    [connectedGraphEntries, visitedGraphItemIds]
  );
  React.useEffect(() => {
    if (!isConnectedGraphComplete && isGraphSummaryVisible) {
      setIsGraphSummaryVisible(false);
    }
  }, [isConnectedGraphComplete, isGraphSummaryVisible]);
  const connectedGraphProgressLine =
    connectedGraphEntries.length > 0
      ? `${Math.min(connectedGraphVisitedCount, connectedGraphEntries.length)} / ${connectedGraphEntries.length} links explored`
      : 'No links yet';
  const connectedGraphProgressRatio =
    connectedGraphEntries.length > 0 ? Math.min(1, connectedGraphVisitedCount / connectedGraphEntries.length) : 0;
  const connectedGraphRemainingCount = Math.max(0, connectedGraphEntries.length - connectedGraphVisitedCount);
  const connectedGraphOverviewSummaryLines = React.useMemo(
    () =>
      connectedGraphSummaryLines.length
        ? connectedGraphSummaryLines
        : ['Specialized summary will appear once connected notes are ready.'],
    [connectedGraphSummaryLines]
  );
  const connectedGraphOverviewReasonLines = React.useMemo(
    () =>
      connectedGraphReasonLines.length
        ? connectedGraphReasonLines
        : ['Link explanations will appear after connected notes are explored.'],
    [connectedGraphReasonLines]
  );
  const connectedGraphSlideCount = Math.max(1, connectedGraphEntries.length + 1);
  const shouldCastNotegraphOverview = isConnectedGraphComplete && isGraphSummaryVisible;
  const isNotegraphOverviewVisibleInViewport = shouldCastNotegraphOverview && !isStudyToolViewportActive;
  const isNotegraphOverviewQueued = shouldCastNotegraphOverview && isStudyToolViewportActive;
  const connectedGraphRecapActionState = !isConnectedGraphComplete
    ? 'locked'
    : isNotegraphOverviewVisibleInViewport
      ? 'active'
      : isNotegraphOverviewQueued
        ? 'queued'
        : 'ready';
  const connectedGraphRecapActionLabel = !isConnectedGraphComplete
    ? 'Explore all links to unlock overview'
    : isNotegraphOverviewVisibleInViewport
      ? 'Return to focus notes'
      : isNotegraphOverviewQueued
        ? 'Hide queued overview'
        : 'Cast Notegraph overview';
  const connectedGraphRecapStatusLine = !connectedGraphEntries.length
    ? 'Connected notes will appear here once related saves are available.'
    : !isConnectedGraphComplete
      ? `${connectedGraphRemainingCount} more linked note${connectedGraphRemainingCount === 1 ? '' : 's'} to unlock the overview in the focus viewport.`
      : isNotegraphOverviewVisibleInViewport
        ? 'Overview is live in the focus viewport so the student can scan the story behind these linked notes.'
        : isNotegraphOverviewQueued
          ? 'A study tool is using the focus viewport right now. Close it and this overview will appear there automatically.'
          : 'Overview ready. Cast it into the focus viewport to give the student a guided network recap.';
  const activeFocusViewportMode = isStudyToolViewportActive
    ? 'study_tool'
    : isNotegraphOverviewVisibleInViewport
      ? 'notegraph'
      : 'note';
  React.useEffect(() => {
    if (!isNotegraphOverviewVisibleInViewport) return;
    focusViewportRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }, [isNotegraphOverviewVisibleInViewport]);
  const collectionOptions = collections || [];
  const highlightActionReady = Boolean(selectedSnippet.trim().length >= 6);
  const savedLensInputs = React.useMemo(() => getLensInputMapFromItem(item), [item.metadata, item.reflection]);
  const lensInputCounts = React.useMemo(() => {
    const counts: Record<RevisionDocumentLens, number> = {
      default: 0,
      beginner: 0,
      exam: 0,
      trap: 0,
    };
    for (const lens of INTERACTIVE_DOCUMENT_LENSES) {
      if ((savedLensInputs[lens] || '').trim()) counts[lens] = 1;
    }
    counts.default = INTERACTIVE_DOCUMENT_LENSES.reduce((total, lens) => total + counts[lens], 0);
    return counts;
  }, [savedLensInputs]);
  const activeInteractiveLens = activeLens === 'default' ? null : activeLens;
  const activeLensInputCopy = activeInteractiveLens ? DOCUMENT_LENS_INPUT_COPY[activeInteractiveLens] : null;
  const activeLensTextareaPlaceholder = activeLensInputCopy?.placeholder || '';
  const activeLensDraft = activeInteractiveLens ? lensInputDrafts[activeInteractiveLens] || '' : '';
  const savedActiveLensInput = activeInteractiveLens ? savedLensInputs[activeInteractiveLens] || '' : '';
  const hasActiveLensGuidance = activeInteractiveLens ? Boolean(lensGuidanceMap[activeInteractiveLens]) : false;
  const hasActiveLensDraftChanges = activeInteractiveLens
    ? activeLensDraft.trim() !== savedActiveLensInput.trim()
    : false;
  const canGuideActiveLensFirst = Boolean(
    activeInteractiveLens &&
      !isLaunchingSteadfast &&
      !isSavingLensInput &&
      (onLaunchSteadfast || onBreakdownItem)
  );
  const canSeeThroughActiveLens = Boolean(
    activeInteractiveLens &&
      !isLaunchingSteadfast &&
      !isSavingLensInput &&
      (onLaunchSteadfast || onBreakdownItem)
  );
  const activeLensGuideFirstHint = activeInteractiveLens
    ? hasActiveLensGuidance
      ? 'Get another guided walkthrough for this lens.'
      : 'Get a guided walkthrough for this lens before you answer.'
    : '';
  const moveActiveGraphLink = React.useCallback(
    (direction: 'previous' | 'next') => {
      if (!connectedGraphEntries.length) return;
      const fallbackIndex = activeConnectedGraphIndex >= 0 ? activeConnectedGraphIndex : 0;
      const delta = direction === 'next' ? 1 : -1;
      const nextIndex = (fallbackIndex + delta + connectedGraphEntries.length) % connectedGraphEntries.length;
      setActiveGraphItemId(connectedGraphEntries[nextIndex].item.id);
    },
    [activeConnectedGraphIndex, connectedGraphEntries]
  );
  const toggleConnectedGraphSummary = React.useCallback(() => {
    setIsGraphSummaryVisible((previous) => {
      const next = !previous;
      if (next && isConnectedGraphComplete) {
        void api.revision
          .recordReviewEvent(item.id, {
            eventType: 'review_completed',
            metadata: {
              surface: 'connected_note_graph',
              action: 'summary_generated',
              linksExplored: connectedGraphVisitedCount,
              totalLinks: connectedGraphEntries.length,
            },
          })
          .catch(() => undefined);
      }
      return next;
    });
  }, [connectedGraphEntries.length, connectedGraphVisitedCount, isConnectedGraphComplete, item.id]);
  const connectedGraphOverviewCard = isConnectedGraphComplete ? (
    <article
      className="copilot-revision-notegraph-overview-card copilot-revision-notegraph-overview-card-viewport rounded-[1.1rem] px-4 py-4"
      aria-label="Generated Notegraph overview card"
    >
      <div className="copilot-revision-notegraph-overview-head">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
            Notegraph overview
          </p>
          <p className="mt-1 text-sm font-semibold leading-6 text-[var(--copilot-text-primary)]">
            Specialized summary and link explanations.
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className="copilot-revision-pill">
            {connectedGraphSlideCount} slide{connectedGraphSlideCount === 1 ? '' : 's'} ready
          </span>
          <Button
            type="button"
            variant="outline"
            className="copilot-control-nav h-8 rounded-full px-3 text-xs"
            onClick={toggleConnectedGraphSummary}
          >
            Return to focus notes
          </Button>
        </div>
      </div>

      <div className="copilot-revision-notegraph-overview-grid mt-3">
        <section className="copilot-revision-notegraph-overview-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
            Specialized summary
          </p>
          <div className="copilot-revision-notegraph-overview-scroll mt-2">
            {connectedGraphOverviewSummaryLines.map((line, index) => (
              <p key={`graph-summary-card-${index}`} className="copilot-revision-notegraph-overview-line">
                <span className="mr-1.5 font-semibold text-[var(--copilot-text-primary)]">{index + 1}.</span>
                {line}
              </p>
            ))}
          </div>
        </section>

        <section className="copilot-revision-notegraph-overview-panel">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
            Link explanations
          </p>
          <div className="copilot-revision-notegraph-overview-scroll mt-2">
            {connectedGraphOverviewReasonLines.map((line, index) => (
              <p key={`graph-reason-card-${index}`} className="copilot-revision-notegraph-overview-line">
                <span className="mr-1.5 font-semibold text-[var(--copilot-text-primary)]">{index + 1}.</span>
                {line}
              </p>
            ))}
          </div>
        </section>
      </div>
    </article>
  ) : null;
  const openActiveGraphLink = React.useCallback(() => {
    if (!activeConnectedGraphEntry) return;
    const serverLink = serverConnectedGraphLinkByItemId.get(activeConnectedGraphEntry.item.id);
    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'source_opened',
        metadata: {
          surface: 'connected_note_graph',
          targetItemId: activeConnectedGraphEntry.item.id,
          category: serverLink?.category || activeConnectedGraphEntry.insight.category,
          score: serverLink?.score || activeConnectedGraphEntry.insight.score,
        },
      })
      .catch(() => undefined);
    onOpenItem?.(activeConnectedGraphEntry.item.id);
  }, [activeConnectedGraphEntry, item.id, onOpenItem, serverConnectedGraphLinkByItemId]);
  const activeMasteryOption = MASTERY_OPTIONS.find((option) => option.value === (item.mastery || 'unset')) || MASTERY_OPTIONS[0];
  const launchSteadfast = React.useCallback(
    async (
      intent: SteadfastLaunchIntent,
      overrides?: {
        selectedSnippet?: string;
        lens?: RevisionDocumentLens;
        starterResponse?: string;
        supportAction?: GuidedRevisionSupportAction;
      }
    ) => {
      if (!onLaunchSteadfast) return;
      const snippet = overrides?.selectedSnippet || selectedSnippet;
      const launchLens = overrides?.lens || activeLens;
      await onLaunchSteadfast({
        item,
        intent,
        lens: launchLens,
        selectedSnippet: snippet,
        starterResponse: overrides?.starterResponse,
        supportAction: overrides?.supportAction,
      });
    },
    [activeLens, item, onLaunchSteadfast, selectedSnippet]
  );
  const applyMasteryQuickTag = React.useCallback(
    async (value: RevisionMastery | null) => {
      if (!onUpdateMastery) return;
      setIsUpdatingMastery(true);
      try {
        await onUpdateMastery(item, value);
      } finally {
        setIsUpdatingMastery(false);
      }
    },
    [item, onUpdateMastery]
  );
  const applyEditedNoteDraftState = React.useCallback((nextDraftState: RevisionEditorDraftState) => {
    setTitleDraft(nextDraftState.title);
    setSummaryDraft(nextDraftState.summary);
    setContentDraft(nextDraftState.content);
    setCollectionDraft(nextDraftState.collectionId);
    setChapterDraft(nextDraftState.chapter);
    setOrderDraft(nextDraftState.order);
  }, []);
  const resetEditedNoteDrafts = React.useCallback(() => {
    applyEditedNoteDraftState(itemEditorDraftState);
  }, [applyEditedNoteDraftState, itemEditorDraftState]);
  const openEditedNoteEditor = React.useCallback(() => {
    resetEditedNoteDrafts();
    setIsEditingNote(true);
  }, [resetEditedNoteDrafts]);
  const closeEditedNoteEditor = React.useCallback(() => {
    resetEditedNoteDrafts();
    setIsEditingNote(false);
  }, [resetEditedNoteDrafts]);
  const handleSummaryTutorAction = React.useCallback(
    (mode: RevisionSummaryTutorMode) => {
      setSummaryDraft((previous) =>
        buildRevisionSummaryTutorDraft({
          mode,
          title: titleDraft.trim() || item.title,
          summary: previous,
          content: normalizeRevisionEditorContent(contentDraft || previous),
        })
      );
    },
    [contentDraft, item.title, titleDraft]
  );
  const handleRestorePlacementDrafts = React.useCallback(() => {
    setCollectionDraft(item.collectionId || '__none__');
    setChapterDraft(item.bundleRole || '');
    setOrderDraft(item.featuredRank ? String(item.featuredRank) : '');
  }, [item.bundleRole, item.collectionId, item.featuredRank]);
  const handleContentTutorAction = React.useCallback(
    (mode: RevisionContentTutorMode) => {
      setContentDraft((previous) =>
        buildRevisionContentTutorDraft({
          mode,
          title: titleDraft.trim() || item.title,
          summary: summaryDraft.trim(),
          content: previous,
        })
      );
    },
    [item.title, summaryDraft, titleDraft]
  );
  const persistLensReflection = React.useCallback(async (args: { lens: RevisionInteractiveLens; markGuided?: boolean }) => {
    if (!onUpdateItem || isSavingLensInput) return;
    setIsSavingLensInput(true);
    try {
      const nextReflection = buildLensReflectionPatch({
        item,
        lens: args.lens,
        response: args.lens === activeInteractiveLens ? activeLensDraft : lensInputDrafts[args.lens] || '',
        lensInputMap: lensInputDrafts,
        lensGuidanceMap,
        markGuided: args.markGuided,
      });
      await onUpdateItem(item, {
        reflection: nextReflection as UpdateRevisionItemRequest['reflection'],
      });
    } finally {
      setIsSavingLensInput(false);
    }
  }, [activeInteractiveLens, activeLensDraft, isSavingLensInput, item, lensGuidanceMap, lensInputDrafts, onUpdateItem]);
  const handleGuideActiveLensFirst = React.useCallback(async () => {
    if (!activeInteractiveLens || !canGuideActiveLensFirst) return;
    if (onLaunchSteadfast) {
      const starterResponse = buildGuideFirstStarterResponse({
        item,
        lens: activeInteractiveLens,
        noteExcerpt: noteBlocks[0] || item.summary || '',
        draft: activeLensDraft.trim(),
      });
      await launchSteadfast('breakdown', {
        lens: activeInteractiveLens,
        starterResponse,
        supportAction: getLensSupportAction(activeInteractiveLens),
      });
    } else {
      await onBreakdownItem?.(item);
    }
    setLensGuidanceMap((previous) => ({ ...previous, [activeInteractiveLens]: true }));
    if (onUpdateItem) {
      try {
        await persistLensReflection({ lens: activeInteractiveLens, markGuided: true });
      } catch (error) {
        console.warn('[Revision] Could not persist guide-first state:', error);
      }
    }
  }, [
    activeInteractiveLens,
    activeLensDraft,
    canGuideActiveLensFirst,
    item,
    launchSteadfast,
    noteBlocks,
    onBreakdownItem,
    onLaunchSteadfast,
    onUpdateItem,
    persistLensReflection,
  ]);
  const handleSeeThroughActiveLens = React.useCallback(async () => {
    if (!activeInteractiveLens || !canSeeThroughActiveLens) return;
    if (onUpdateItem) {
      try {
        await persistLensReflection({ lens: activeInteractiveLens });
      } catch (error) {
        console.warn('[Revision] Could not persist lens reflection before launch:', error);
      }
    }
    if (onLaunchSteadfast) {
      const starterResponse = buildSeeThroughLensStarterResponse({
        item,
        lens: activeInteractiveLens,
        noteExcerpt: noteBlocks[0] || item.summary || '',
        draft: activeLensDraft.trim(),
      });
      await launchSteadfast('revise', {
        lens: activeInteractiveLens,
        starterResponse,
        supportAction: getLensSupportAction(activeInteractiveLens),
      });
      return;
    }
    await onBreakdownItem?.(item);
  }, [
    activeInteractiveLens,
    activeLensDraft,
    canSeeThroughActiveLens,
    item,
    launchSteadfast,
    noteBlocks,
    onBreakdownItem,
    onLaunchSteadfast,
    onUpdateItem,
    persistLensReflection,
  ]);
  const captureSelectedSnippet = React.useCallback(() => {
    if (!noteContentRef.current || typeof window === 'undefined') return;
    const selection = window.getSelection();
    const selectedText = selection?.toString().replace(/\s+/g, ' ').trim() || '';
    if (!selectedText) {
      setSelectedSnippet('');
      return;
    }
    const anchorNode = selection?.anchorNode;
    if (!anchorNode) {
      setSelectedSnippet('');
      return;
    }
    const anchorElement =
      anchorNode.nodeType === Node.TEXT_NODE ? anchorNode.parentElement : (anchorNode as HTMLElement);
    if (!anchorElement || !noteContentRef.current.contains(anchorElement)) {
      setSelectedSnippet('');
      return;
    }
    const snippetSource = anchorElement.closest('[data-socratic-highlight-source="true"]');
    if (!snippetSource || !noteContentRef.current.contains(snippetSource)) {
      setSelectedSnippet('');
      return;
    }
    setSelectedSnippet(selectedText.slice(0, 240));
  }, []);

  React.useEffect(() => {
    setNoteDraft(item.studentNote || '');
    applyEditedNoteDraftState(itemEditorDraftState);
    setActiveLens(getSavedLensSelectionFromItem(item) || 'default');
    setLensInputDrafts(getLensInputMapFromItem(item));
    setLensGuidanceMap(getLensGuidanceMapFromItem(item));
    setSelectedSnippet('');
    setIsSavingLensInput(false);
    setIsEditingNote(false);
    setIsSavingEdit(false);
    setIsDeletingNote(false);
    setActiveItemFlashcardIndex(0);
    setIsItemFlashcardBackVisible(false);
    setIsItemFlashcardQuizActive(false);
    setItemFlashcardQuizIndex(0);
    setIsItemFlashcardQuizAnswerVisible(false);
    setItemFlashcardQuizResults({});
    setItemFlashcardQuizOrder([]);
    setItemFlashcardQuizRepeatCountById({});
    setIsStudyToolViewportActive(false);
  }, [
    item.id,
    item.metadata,
    item.reflection,
    item.studentNote,
    applyEditedNoteDraftState,
    itemEditorDraftState,
  ]);

  React.useEffect(() => {
    if (!isEditingNote || typeof window === 'undefined') return;
    const frameId = window.requestAnimationFrame(() => {
      editorTitleInputRef.current?.focus();
      editorTitleInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [isEditingNote]);

  React.useEffect(() => {
    const cardNode = readerCardRef.current;
    if (!cardNode || typeof window === 'undefined') return;

    const resolveScrollHost = (): HTMLElement | Window => {
      let parent = cardNode.parentElement;
      while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        if (
          (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
          parent.scrollHeight > parent.clientHeight + 1
        ) {
          return parent;
        }
        parent = parent.parentElement;
      }
      return window;
    };

    const scrollHost = resolveScrollHost();
    const isWindowHost = scrollHost === window;
    const readScrollTop = () =>
      isWindowHost
        ? window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0
        : (scrollHost as HTMLElement).scrollTop;

    let frameId = 0;
    let lastScrollTop = readScrollTop();
    let collapsed = lastScrollTop > 72;
    let scrolled = lastScrollTop > 8;

    setIsReaderHeaderCollapsed(collapsed);
    setHasReaderHeaderScrolled(scrolled);

    const syncHeaderState = () => {
      frameId = 0;
      const nextScrollTop = readScrollTop();
      const delta = nextScrollTop - lastScrollTop;
      let nextCollapsed = collapsed;

      if (nextScrollTop <= 16) {
        nextCollapsed = false;
      } else if (delta > 1.5 && nextScrollTop > 64) {
        nextCollapsed = true;
      } else if (delta < -1.5) {
        nextCollapsed = false;
      }

      const nextScrolled = nextScrollTop > 8;

      if (nextCollapsed !== collapsed) {
        collapsed = nextCollapsed;
        setIsReaderHeaderCollapsed(nextCollapsed);
      }

      if (nextScrolled !== scrolled) {
        scrolled = nextScrolled;
        setHasReaderHeaderScrolled(nextScrolled);
      }

      lastScrollTop = nextScrollTop;
    };

    const handleScroll = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(syncHeaderState);
    };

    const scrollTarget: Window | HTMLElement = isWindowHost ? window : (scrollHost as HTMLElement);
    scrollTarget.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);

    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      scrollTarget.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [item.id]);

  const handleSaveEditedNote = React.useCallback(async () => {
    if (!onUpdateItem || !canSubmitEditedNote) return;
    const normalizedTitle = normalizedTitleDraft || item.title.trim();
    const normalizedContent =
      normalizedContentDraft ||
      normalizeRevisionEditorContent(summaryDraft) ||
      normalizeRevisionEditorContent(item.content || item.summary || '');
    const normalizedSummary = deriveRevisionSummary(
      normalizedTitle,
      summaryDraft,
      normalizedContent
    );
    setIsSavingEdit(true);
    try {
      await onUpdateItem(item, {
        title: normalizedTitle,
        summary: normalizedSummary,
        content: normalizedContent,
        collectionId: collectionDraft === '__none__' ? null : collectionDraft,
        bundleRole: normalizedChapterDraft || null,
        featuredRank: normalizedOrderDraft ? Number(normalizedOrderDraft) : null,
      });
      setIsEditingNote(false);
    } finally {
      setIsSavingEdit(false);
    }
  }, [
    canSubmitEditedNote,
    collectionDraft,
    item,
    normalizedContentDraft,
    normalizedTitleDraft,
    normalizedChapterDraft,
    normalizedOrderDraft,
    onUpdateItem,
    summaryDraft,
  ]);

  const handleEditedNoteKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || (!event.metaKey && !event.ctrlKey)) return;
      event.preventDefault();
      if (!canSubmitEditedNote || isSavingEdit) return;
      void handleSaveEditedNote();
    },
    [canSubmitEditedNote, handleSaveEditedNote, isSavingEdit]
  );

  const activeItemFlashcard =
    itemFlashcards[
      Math.min(activeItemFlashcardIndex, Math.max(itemFlashcards.length - 1, 0))
    ] || null;
  const itemFlashcardQuizCardId =
    itemFlashcardQuizOrder[itemFlashcardQuizIndex] ||
    itemFlashcards[
      Math.min(itemFlashcardQuizIndex, Math.max(itemFlashcards.length - 1, 0))
    ]?.id ||
    null;
  const itemFlashcardQuizCard = itemFlashcardQuizCardId
    ? itemFlashcardMap.get(itemFlashcardQuizCardId) || null
    : null;
  const itemFlashcardQuizTotalCards = Math.max(
    itemFlashcardQuizOrder.length,
    itemFlashcards.length
  );
  const itemFlashcardQuizCompletedCount = Object.keys(itemFlashcardQuizResults).length;
  const itemFlashcardQuizCorrectCount = Object.values(itemFlashcardQuizResults).filter((value) => value === 'got_it').length;
  const itemFlashcardQuizNeedsWorkCount = Object.values(itemFlashcardQuizResults).filter((value) => value === 'again').length;

  const startItemFlashcardQuiz = React.useCallback(() => {
    if (!itemFlashcards.length) return;
    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'quiz_started',
        outcome: null,
        metadata: {
          source: 'item_flashcard_quiz',
          flashcardCount: itemFlashcards.length,
        },
      })
      .catch(() => undefined);
    setIsItemFlashcardQuizActive(true);
    setItemFlashcardQuizOrder(itemFlashcards.map((card) => card.id));
    setItemFlashcardQuizRepeatCountById({});
    setItemFlashcardQuizIndex(0);
    setIsItemFlashcardQuizAnswerVisible(false);
    setItemFlashcardQuizResults({});
  }, [item.id, itemFlashcards]);

  const handleItemFlashcardQuizResult = React.useCallback((outcome: 'again' | 'got_it') => {
    const currentCardId =
      itemFlashcardQuizOrder[itemFlashcardQuizIndex] ||
      itemFlashcards[itemFlashcardQuizIndex]?.id;
    const currentCard = currentCardId ? itemFlashcardMap.get(currentCardId) || null : null;
    if (!currentCard) return;

    setItemFlashcardQuizResults((previous) => ({
      ...previous,
      [currentCard.id]: outcome,
    }));
    void api.revision
      .recordReviewEvent(item.id, {
        eventType: 'quiz_answered',
        outcome: outcome === 'got_it' ? 'correct' : 'struggled',
        metadata: {
          source: 'item_flashcard_quiz',
          flashcardId: currentCard.id,
        },
      })
      .catch(() => undefined);

    if (outcome === 'again' && onUpdateItem) {
      void Promise.resolve(onUpdateItem(item, { needsPractice: true })).catch(() => undefined);
    }

    let nextOrder = itemFlashcardQuizOrder.length
      ? [...itemFlashcardQuizOrder]
      : itemFlashcards.map((card) => card.id);
    if (outcome === 'again') {
      const repeatCount = (itemFlashcardQuizRepeatCountById[currentCard.id] || 0) + 1;
      setItemFlashcardQuizRepeatCountById((previous) => ({
        ...previous,
        [currentCard.id]: repeatCount,
      }));
      if (repeatCount <= 2) {
        const insertIndex = Math.min(itemFlashcardQuizIndex + 3, nextOrder.length);
        nextOrder.splice(insertIndex, 0, currentCard.id);
        setItemFlashcardQuizOrder(nextOrder);
      }
    }
    const nextIndex = itemFlashcardQuizIndex + 1;
    if (nextIndex >= nextOrder.length) {
      setIsItemFlashcardQuizActive(false);
      setIsItemFlashcardQuizAnswerVisible(false);
      return;
    }
    setItemFlashcardQuizIndex(nextIndex);
    setIsItemFlashcardQuizAnswerVisible(false);
  }, [
    item,
    itemFlashcardMap,
    itemFlashcardQuizIndex,
    itemFlashcardQuizOrder,
    itemFlashcardQuizRepeatCountById,
    itemFlashcards,
    onUpdateItem,
  ]);

  return (
    <div
      ref={readerCardRef}
      className="copilot-revision-card copilot-revision-note-stage copilot-revision-reader-shell rounded-[1.55rem] p-0"
    >
      <div
        className="copilot-revision-reader-header"
        data-collapsed={isReaderHeaderCollapsed ? 'true' : 'false'}
        data-scrolled={hasReaderHeaderScrolled ? 'true' : 'false'}
      >
        {breadcrumbs?.length || item.collectionId || (notebookNavigation && notebookNavigation.total > 1) ? (
          <div className="copilot-revision-breadcrumb-row mb-2">
            <div className="copilot-revision-breadcrumb-main">
              {item.collectionId ? (
                <span className="copilot-revision-breadcrumb-badge">Notebook</span>
              ) : null}
              {breadcrumbSubjectLabel ? (
                <span className="copilot-revision-breadcrumb-subject-tag">{breadcrumbSubjectLabel}</span>
              ) : null}
              {breadcrumbs?.length ? <RevisionBreadcrumbTrail items={breadcrumbs} /> : null}
              {notebookNavigation && notebookNavigation.total > 1 ? (
                <div className="copilot-revision-header-notebook-nav" role="group" aria-label="Navigate notebooks">
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav copilot-revision-header-notebook-nav-btn h-7 w-7 rounded-full p-0"
                    aria-label={`Previous notebook (${notebookNavigation.currentIndex + 1} of ${notebookNavigation.total})`}
                    disabled={!notebookNavigation.onPrevious || notebookNavigation.currentIndex <= 0}
                    onClick={notebookNavigation.onPrevious}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav copilot-revision-header-notebook-nav-btn h-7 w-7 rounded-full p-0"
                    aria-label={`Next notebook (${notebookNavigation.currentIndex + 1} of ${notebookNavigation.total})`}
                    disabled={!notebookNavigation.onNext || notebookNavigation.currentIndex >= notebookNavigation.total - 1}
                    onClick={notebookNavigation.onNext}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        <div className="copilot-revision-reader-header-title-row">
          <div className="copilot-revision-reader-header-copy">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`copilot-revision-type-pill ${typeVisual.toneClassName}`}>
                <TypeIcon className="h-3.5 w-3.5" />
                {typeVisual.label}
              </span>
            </div>
            <h3 className="copilot-revision-reader-title mt-2 max-w-4xl text-[1.25rem] font-semibold leading-tight tracking-[-0.025em] text-[var(--copilot-text-primary)] md:text-[1.7rem]">
              {item.title}
            </h3>
          </div>
          <div className="copilot-revision-reader-header-actions">
            {onBackToCollection ? (
              <Button
                type="button"
                variant="ghost"
                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                onClick={onBackToCollection}
              >
                <ArrowLeft className="mr-1 h-3.5 w-3.5" />
                {backToCollectionLabel || 'Back to notes'}
              </Button>
            ) : null}
            {item.collectionId && onStartSlideshow ? (
              <Button
                type="button"
                variant="outline"
                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                onClick={() => onStartSlideshow(item)}
              >
                Slideshow
              </Button>
            ) : null}
            {onUpdateItem ? (
              <Button
                type="button"
                variant="outline"
                className={`copilot-control-nav h-8 rounded-full px-3 text-xs ${
                  isEditingNote ? 'copilot-revision-editor-toggle-active' : ''
                }`}
                disabled={isDeletingNote || isSavingEdit}
                aria-controls={`revision-note-editor-${item.id}`}
                aria-pressed={isEditingNote}
                title={isEditingNote ? 'Close editor and discard unsaved edits' : 'Open note editor'}
                onClick={() => {
                  if (isEditingNote) {
                    closeEditedNoteEditor();
                    return;
                  }
                  openEditedNoteEditor();
                }}
              >
                {isEditingNote ? <X className="mr-1.5 h-3.5 w-3.5" /> : <NotebookPen className="mr-1.5 h-3.5 w-3.5" />}
                {isEditingNote ? 'Close editor' : 'Edit note'}
              </Button>
            ) : null}
            {onDeleteItem ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav h-8 rounded-full px-3 text-xs text-rose-700 hover:text-rose-800"
                    disabled={isDeletingNote}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete this note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the note from your revision workspace. Linked study context will be cleared where needed.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async (event) => {
                        event.preventDefault();
                        if (!onDeleteItem) return;
                        setIsDeletingNote(true);
                        try {
                          await onDeleteItem(item);
                        } finally {
                          setIsDeletingNote(false);
                        }
                      }}
                    >
                      {isDeletingNote ? 'Deleting...' : 'Delete note'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : null}
            {onLaunchSteadfast ? (
              <Button
                type="button"
                className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                disabled={isLaunchingSteadfast}
                onClick={() => void launchSteadfast('revise')}
              >
                {isLaunchingSteadfast ? (
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                )}
                Revise with Steadfast
              </Button>
            ) : null}
          </div>
        </div>

        <div className="copilot-revision-reader-header-meta-row">
          <span className="copilot-revision-reader-date">{formatUpdatedAt(item.updatedAt)}</span>
          {onUpdateMastery ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  disabled={isUpdatingMastery}
                  className={`copilot-revision-mastery-chip cursor-pointer gap-1.5 px-2.5 py-1 text-[11px] disabled:cursor-not-allowed ${
                    item.mastery ? 'copilot-revision-mastery-chip-active' : ''
                  }`}
                  title="Change mastery level"
                  aria-label="Change mastery level"
                  aria-busy={isUpdatingMastery}
                >
                  <span className={`h-2 w-2 rounded-full ${getMasteryDotClassName(item.mastery)}`} />
                  <span>{activeMasteryOption.label}</span>
                  {isUpdatingMastery ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-44 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-1.5"
              >
                <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
                  Mastery level
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" />
                {MASTERY_OPTIONS.map((option) => {
                  const optionValue: RevisionMastery | null = option.value === 'unset' ? null : option.value;
                  const isActive = (item.mastery || 'unset') === option.value;
                  return (
                    <DropdownMenuItem
                      key={option.value}
                      disabled={isUpdatingMastery}
                      className={`cursor-pointer rounded-xl text-xs ${isActive ? 'bg-[var(--copilot-accent-soft)] text-[var(--copilot-accent-text)]' : ''}`}
                      onSelect={() => void applyMasteryQuickTag(optionValue)}
                    >
                      <span className={`h-2 w-2 rounded-full ${getMasteryDotClassName(optionValue)}`} />
                      <span>{option.label}</span>
                      {isActive ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : item.mastery ? (
            <TopicMasteryChip label={item.mastery} compact topic={item.topic || item.title} />
          ) : null}
        </div>
      </div>

      <div className="copilot-revision-reader-body space-y-4 px-4 pb-4 pt-4 md:px-5 md:pb-5 md:pt-4">
      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.72fr)_minmax(280px,0.92fr)] xl:items-start">
        <div className="space-y-3">
          {isEditingNote ? (
            <section
              id={`revision-note-editor-${item.id}`}
              className="copilot-revision-editor-shell space-y-3 rounded-[1.4rem] px-4 py-3 md:px-4 md:py-4"
              data-dirty={hasEditedNoteChanges ? 'true' : 'false'}
            >
              <div className="copilot-revision-editor-topbar">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="copilot-revision-note-kicker">Editor cockpit</p>
                    <span className="copilot-revision-editor-status" data-state={editorStatusState} aria-live="polite">
                      {editorStatusCopy}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-semibold text-[var(--copilot-text-primary)] md:text-lg">
                      Tune this note for faster revision
                    </h4>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      Keep it tight: clear title, one-line summary, short study blocks.
                    </p>
                    <p className="text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                      Edits stay local until save. Close editor restores the last saved version.
                    </p>
                  </div>
                </div>
                <div className="copilot-revision-editor-stats" aria-label="Editor stats">
                  <span>
                    <Layers3 className="h-3.5 w-3.5" />
                    {editorInsight.blocks} block{editorInsight.blocks === 1 ? '' : 's'}
                  </span>
                  <span>
                    <FileText className="h-3.5 w-3.5" />
                    {editorInsight.words} words
                  </span>
                  <span>
                    <Clock3 className="h-3.5 w-3.5" />
                    {editorInsight.readingMinutes} min read
                  </span>
                </div>
              </div>

              <div className="copilot-revision-editor-grid">
                <div className="space-y-3.5">
                  <div className="copilot-revision-editor-panel space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Chapter title
                        </p>
                        <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">Make it instantly recognizable.</p>
                      </div>
                      <span className="copilot-revision-editor-micro-pill">Primary label</span>
                    </div>
                    <Input
                      ref={editorTitleInputRef}
                      value={titleDraft}
                      onChange={(event) => setTitleDraft(event.target.value)}
                      onKeyDown={handleEditedNoteKeyDown}
                      placeholder="Give this note a precise title"
                      className="copilot-revision-editor-input h-10 rounded-[1rem] px-3.5 text-sm"
                    />
                  </div>

                  <div className="grid gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.82fr)] xl:items-start">
                    <div className="copilot-revision-editor-panel space-y-2.5 self-start">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                            Short summary
                          </p>
                          <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">One sentence is enough.</p>
                        </div>
                        <span className="copilot-revision-editor-micro-pill">
                          {summaryDraft.trim() ? 'Custom summary' : 'Auto-fill available'}
                        </span>
                      </div>
                      <Textarea
                        value={summaryDraft}
                        onChange={(event) => setSummaryDraft(event.target.value)}
                        onKeyDown={handleEditedNoteKeyDown}
                        placeholder="Leave blank to auto-generate from the note body."
                        className="copilot-revision-editor-input copilot-revision-editor-textarea min-h-[72px] rounded-[1rem] px-3.5 py-2.5 text-sm leading-5"
                      />
                      <div className="copilot-revision-summary-tutor">
                        <p className="copilot-revision-summary-tutor-label">Tutor actions</p>
                        <div className="copilot-revision-summary-tutor-grid">
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                            onClick={() => handleSummaryTutorAction('regenerate')}
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Rebuild summary
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                            onClick={() => handleSummaryTutorAction('improve')}
                          >
                            <Target className="h-3.5 w-3.5" />
                            Improve wording
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                            onClick={() => handleSummaryTutorAction('tighten')}
                          >
                            <ChevronDown className="h-3.5 w-3.5" />
                            Make concise
                          </Button>
                        </div>
                      </div>
                    </div>

                    <aside className="copilot-revision-editor-side-stack">
                      <div className="copilot-revision-editor-panel space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                              Placement
                            </p>
                            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">Keep metadata compact.</p>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-revision-editor-inline-action h-8 rounded-full px-3 text-xs"
                            onClick={handleRestorePlacementDrafts}
                          >
                            Reset
                          </Button>
                        </div>
                        <div className="space-y-2.5">
                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                              Notebook
                            </p>
                            <Select value={collectionDraft} onValueChange={setCollectionDraft}>
                              <SelectTrigger className="copilot-revision-editor-input h-10 rounded-[1rem] px-3 text-sm">
                                <SelectValue placeholder="Choose a notebook" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="__none__">Standalone note</SelectItem>
                                {collectionOptions.map((collection) => (
                                  <SelectItem key={collection.id} value={collection.id}>
                                    {collection.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                              Chapter label
                            </p>
                            <Input
                              value={chapterDraft}
                              onChange={(event) => setChapterDraft(event.target.value)}
                              onKeyDown={handleEditedNoteKeyDown}
                              placeholder="Foundations"
                              className="copilot-revision-editor-input h-10 rounded-[1rem] px-3 text-sm"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                              Chapter order
                            </p>
                            <Input
                              type="number"
                              min={1}
                              inputMode="numeric"
                              value={orderDraft}
                              onChange={(event) => setOrderDraft(event.target.value)}
                              onKeyDown={handleEditedNoteKeyDown}
                              placeholder="Auto"
                              className="copilot-revision-editor-input h-10 rounded-[1rem] px-3 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </aside>
                  </div>

                  <div className="copilot-revision-editor-panel space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Note body
                        </p>
                        <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">Use short, scannable blocks.</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--copilot-text-tertiary)]">
                        <span className="copilot-revision-editor-micro-pill">Blank line between ideas</span>
                      </div>
                    </div>
                    <Textarea
                      value={contentDraft}
                      onChange={(event) => setContentDraft(event.target.value)}
                      onKeyDown={handleEditedNoteKeyDown}
                      placeholder="Write in short sections so review stays fast."
                      className="copilot-revision-editor-input copilot-revision-editor-textarea min-h-[160px] rounded-[1.1rem] px-3.5 py-2.5 text-sm leading-5"
                    />
                    <div className="copilot-revision-summary-tutor">
                      <p className="copilot-revision-summary-tutor-label">Tutor actions</p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                          onClick={() => handleContentTutorAction('normalize')}
                        >
                          <Sparkles className="h-3.5 w-3.5" />
                          Clean structure
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                          onClick={() => handleContentTutorAction('split_blocks')}
                        >
                          <Layers3 className="h-3.5 w-3.5" />
                          Split into blocks
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                          onClick={() => handleContentTutorAction('stepify')}
                        >
                          <Target className="h-3.5 w-3.5" />
                          Add step labels
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-revision-summary-action h-8 rounded-full px-3 text-xs"
                          onClick={() => handleContentTutorAction('tighten')}
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                          Tighten wording
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[color:var(--copilot-soft-line)] pt-2">
                      <span className="copilot-revision-editor-micro-pill">Ctrl/Cmd + Enter</span>
                      <Button
                        type="button"
                        className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                        disabled={!canSubmitEditedNote || isSavingEdit}
                        onClick={() => void handleSaveEditedNote()}
                      >
                        {isSavingEdit ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <NotebookPen className="mr-2 h-4 w-4" />
                        )}
                        Save organized note
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : (
            <section
              ref={noteContentRef}
              className="copilot-revision-note-focus copilot-revision-note-focus-stack space-y-3 px-5 py-5 md:px-6 md:py-6"
              data-active-lens={activeLens}
              onMouseUp={captureSelectedSnippet}
              onKeyUp={captureSelectedSnippet}
            >
              <div className="copilot-revision-note-meta flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="copilot-revision-note-meta-main">
                  <p className="copilot-revision-note-kicker">
                    {hasMultipleNoteBlocks ? 'Reader mode' : 'Focus note'}
                  </p>
                  {navigation && navigation.total > 1 ? (
                    <span className="copilot-revision-pill copilot-revision-note-progress-pill">
                      {navigation.currentIndex + 1} / {navigation.total}
                    </span>
                  ) : null}
                </div>
                {navigation && navigation.total > 1 ? (
                  <div className="copilot-revision-note-nav" role="group" aria-label="Navigate notes in this notebook">
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav copilot-revision-note-nav-btn copilot-revision-note-nav-icon-btn h-8 w-8 rounded-full p-0"
                      aria-label={`Previous note (${navigation.currentIndex + 1} of ${navigation.total})`}
                      disabled={!navigation.onPrevious || navigation.currentIndex <= 0}
                      onClick={navigation.onPrevious}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav copilot-revision-note-nav-btn copilot-revision-note-nav-icon-btn h-8 w-8 rounded-full p-0"
                      aria-label={`Next note (${navigation.currentIndex + 1} of ${navigation.total})`}
                      disabled={!navigation.onNext || navigation.currentIndex >= navigation.total - 1}
                      onClick={navigation.onNext}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ) : null}
              </div>
              {activeFocusViewportMode !== 'note' ? (
                <div
                  id={focusViewportTargetId}
                  ref={focusViewportRef}
                  className="copilot-revision-memory-card copilot-revision-unified-card"
                  data-viewport-mode={activeFocusViewportMode}
                  aria-live="polite"
                >
                  {activeFocusViewportMode === 'notegraph' ? connectedGraphOverviewCard : null}
                </div>
              ) : (
                <div className="copilot-revision-memory-card copilot-revision-unified-card" data-viewport-mode="note">
                <article className="copilot-revision-flow-step copilot-revision-flow-step-core">
                  <span className="copilot-revision-flow-marker" aria-hidden="true">
                    01
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="copilot-revision-note-label">Core note</p>
                    {noteBlocks.length ? (
                      <>
                        <p
                          className="copilot-revision-note-body copilot-revision-note-body-core"
                          data-socratic-highlight-source="true"
                        >
                          {noteBlocks[0]}
                        </p>
                        {activeLens !== 'default' ? (
                          <p
                            className="copilot-revision-note-support-text mt-3 text-xs leading-5"
                            data-lens={activeLens}
                            data-socratic-highlight-source="true"
                          >
                            {buildLensSupportLine({ block: noteBlocks[0], lens: activeLens, item, index: 0 })}
                          </p>
                        ) : null}
                      </>
                    ) : (
                      <p className="copilot-revision-note-empty mt-3">
                        No note content yet. Save one short revision note to start this flow.
                      </p>
                    )}
                  </div>
                </article>

                <div className="copilot-revision-flow-divider" aria-hidden="true" />

                <div className="copilot-revision-flow-step copilot-revision-flow-step-summary">
                  <span className="copilot-revision-flow-marker" aria-hidden="true">
                    02
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="copilot-revision-note-label">Quick summary</p>
                    <p
                      className="copilot-revision-note-summary-text mt-2 text-sm leading-7 text-[var(--copilot-text-secondary)]"
                      data-socratic-highlight-source="true"
                    >
                      {leadSummary || 'Add one short summary line so this concept is easier to recall later.'}
                    </p>
                  </div>
                </div>

                <div className="copilot-revision-flow-divider copilot-revision-flow-divider-terminal" aria-hidden="true" />
                <div className={`copilot-revision-tutor-inline ${isLaunchingSteadfast ? 'copilot-revision-tutor-inline-busy' : ''}`}>
                  <div className="copilot-revision-note-lens-row copilot-revision-tutor-actions flex flex-wrap gap-2">
                    <TooltipProvider delayDuration={80}>
                      {DOCUMENT_LENSES.map((lens) => (
                        <Tooltip key={lens.value}>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={`copilot-revision-filter-pill ${
                                activeLens === lens.value ? 'copilot-revision-filter-pill-active' : ''
                              }`}
                              data-lens={lens.value}
                              aria-pressed={activeLens === lens.value}
                              onClick={() => {
                                setActiveLens(lens.value);
                              }}
                              title={lens.helper}
                            >
                              <span className="copilot-revision-lens-pill-label">{lens.label}</span>
                              <span className="copilot-revision-filter-pill-count">{lensInputCounts[lens.value]}</span>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <p>{lens.helper}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                  {activeInteractiveLens && activeLensInputCopy ? (
                    <div className="copilot-revision-highlight-shell mt-2 space-y-2.5 rounded-[1rem] px-3 py-3">
                      <div className="copilot-revision-lens-header flex flex-wrap items-start justify-between gap-2">
                        <p className="copilot-revision-lens-prompt text-xs leading-5 text-[var(--copilot-text-secondary)]">
                          {activeLensInputCopy.prompt}
                        </p>
                        <div className="copilot-revision-lens-actions flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-revision-guide-first-button h-8 rounded-full px-3 text-xs"
                            title={activeLensGuideFirstHint}
                            data-guided={hasActiveLensGuidance ? 'true' : 'false'}
                            disabled={!canGuideActiveLensFirst}
                            onClick={() => void handleGuideActiveLensFirst()}
                          >
                            {isLaunchingSteadfast ? (
                              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <BookOpenText className="mr-1.5 h-3.5 w-3.5" />
                            )}
                            {hasActiveLensGuidance ? 'Guide me again' : 'Guide me first'}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={activeLensDraft}
                        onChange={(event) => {
                          const value = event.target.value;
                          setLensInputDrafts((previous) => ({
                            ...previous,
                            [activeInteractiveLens]: value,
                          }));
                        }}
                        placeholder={activeLensTextareaPlaceholder}
                        className="min-h-[104px] rounded-xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm leading-6 placeholder:text-[var(--copilot-text-secondary)]"
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          className="copilot-control-commit h-8 rounded-full px-3 text-xs"
                          disabled={!canSeeThroughActiveLens}
                          onClick={() => void handleSeeThroughActiveLens()}
                        >
                          {isSavingLensInput ? (
                            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                          )}
                          {activeLensInputCopy.launchLabel}
                        </Button>
                        {hasActiveLensDraftChanges ? (
                          <span className="text-[11px] text-[var(--copilot-text-tertiary)]">Unsaved changes</span>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                  {selectedSnippet ? (
                    <div className="mt-2 space-y-2">
                      <p className="text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                        Selected line for Socratic chat: "{selectedSnippet}"
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-control-tutor h-8 rounded-full px-3 text-xs"
                          disabled={!highlightActionReady || isLaunchingSteadfast}
                          onClick={() => void launchSteadfast('highlight')}
                        >
                          Highlight to Socratic chat
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                          onClick={() => setSelectedSnippet('')}
                        >
                          Clear
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
              )}

              {noteBlocks.length > 1 ? (
                <div className="space-y-3">
                  {noteBlocks.slice(1).map((block, index) => {
                    const actualIndex = index + 1;
                    return (
                      <article key={`block-${actualIndex}`} className="copilot-revision-note-block">
                        <div className="flex items-start gap-3 md:gap-4">
                          <span className="copilot-revision-note-index" aria-hidden="true">
                            {actualIndex + 1}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="copilot-revision-note-label">Section {actualIndex + 1}</p>
                            <p className="copilot-revision-note-body" data-socratic-highlight-source="true">
                              {block}
                            </p>
                            {activeLens !== 'default' ? (
                              <p
                                className="copilot-revision-note-support-text mt-3 text-xs leading-5"
                                data-lens={activeLens}
                                data-socratic-highlight-source="true"
                              >
                                {buildLensSupportLine({ block, lens: activeLens, item, index: actualIndex })}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : null}
              {connectedGraphEntries.length ? (
                <div className="copilot-revision-note-secondary copilot-revision-notegraph-recap-card rounded-[1.1rem] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="copilot-revision-notegraph-recap-kicker text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        NoteGraph recap
                      </p>
                      <p className="copilot-revision-notegraph-recap-progress mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {connectedGraphProgressLine}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav copilot-revision-notegraph-recap-action h-10 rounded-full px-4 text-xs"
                      data-state={connectedGraphRecapActionState}
                      disabled={!isConnectedGraphComplete}
                      onClick={toggleConnectedGraphSummary}
                      aria-controls={focusViewportTargetId}
                      aria-pressed={shouldCastNotegraphOverview}
                      title={
                        isConnectedGraphComplete
                          ? isNotegraphOverviewQueued
                            ? 'Hide the queued overview or close the study tool to let it appear in the focus viewport.'
                            : 'Cast the Notegraph overview into the focus viewport or return to the focus notes.'
                          : 'Explore every connected note once to unlock the Specialized summary and link explanations.'
                      }
                    >
                      {connectedGraphRecapActionLabel}
                    </Button>
                  </div>
                  <div className="mt-3 space-y-2">
                    <div className="copilot-revision-notegraph-recap-meter" aria-hidden="true">
                      <span
                        className="copilot-revision-notegraph-recap-meter-fill"
                        style={{ width: `${Math.round(connectedGraphProgressRatio * 100)}%` }}
                      />
                    </div>
                    <p className="copilot-revision-notegraph-recap-status">
                      {connectedGraphRecapStatusLine}
                    </p>
                  </div>
                </div>
              ) : null}
              {item.selectedText ? (
                <div className="copilot-revision-note-secondary rounded-[1.1rem] px-4 py-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Source excerpt
                      </p>
                      <p
                        className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--copilot-text-secondary)]"
                        data-socratic-highlight-source="true"
                      >
                        {item.selectedText}
                      </p>
                    </div>
                    {hasSourceLink && item.sessionId ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                        onClick={() => onContinueChat?.(item.sessionId!)}
                      >
                        Open source chat
                      </Button>
                    ) : null}
                  </div>
                </div>
              ) : null}

            </section>
          )}
        </div>

        <aside className="space-y-4">
          <section className="copilot-revision-context-card space-y-3 rounded-[1.35rem] px-4 py-4">
            <div>
              <p className="copilot-revision-note-kicker">
                {activeCollection ? 'This notebook' : 'Storage'}
              </p>
              {!activeCollection ? (
                <>
                  <h4 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">
                    Standalone note
                  </h4>
                  <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                    This note is not inside a notebook yet. Move it into one while editing if you want a more book-like revision flow.
                  </p>
                </>
              ) : null}
              {activeCollection && notebookDescriptionMeta ? (
                <>
                  <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{notebookDescriptionMeta.text}</p>
                </>
              ) : null}
            </div>
            {bookContextItems.length ? (
              <div className="space-y-2">
                {bookContextItems.slice(0, 5).map((contextItem) => (
                  <button
                    key={contextItem.id}
                    type="button"
                    className="copilot-revision-context-link w-full text-left"
                    onClick={() => onOpenItem?.(contextItem.id)}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">
                        {contextItem.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {contextItem.topic || contextItem.summary || 'Open this note'}
                      </p>
                    </div>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-[var(--copilot-text-tertiary)]" />
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {activeCollection
                  ? 'No other notes from this notebook are loaded yet.'
                  : 'Standalone notes are useful for quick capture, but notebooks make revision feel more like reading a chapter sequence.'}
              </p>
            )}
          </section>

          <section className="copilot-revision-context-card copilot-revision-connected-graph-card space-y-3 rounded-[1.35rem] px-4 py-4">
            <div>
              <p className="copilot-revision-note-kicker">Connection NoteGraph</p>
              <h4 className="copilot-revision-notegraph-heading mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">
                Smart links across your related notes
              </h4>
              <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                Open each connected note once to unlock the Specialized summary and link explanations.
              </p>
            </div>
            {connectedGraphEntries.length ? (
              <div>
                <div className="copilot-revision-note-graph-shell rounded-[1rem] px-3 py-3">
                  <div className="copilot-revision-graph-toolbar">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="copilot-revision-pill">
                        {connectedGraphEntries.length} related note{connectedGraphEntries.length === 1 ? '' : 's'}
                      </span>
                      <span className="copilot-revision-pill">
                        {Math.max(1, activeConnectedGraphIndex + 1)} / {connectedGraphEntries.length}
                      </span>
                    </div>
                    <Button
                      type="button"
                      className="copilot-control-commit copilot-revision-graph-open-note h-8 rounded-full px-3 text-xs"
                      onClick={openActiveGraphLink}
                    >
                      Open note
                    </Button>
                  </div>
                  {activeConnectedGraphEntry ? (
                    <div className="copilot-revision-graph-swipe-shell mt-2" role="group" aria-label="Connected note swiper">
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav copilot-revision-graph-side-nav h-8 w-8 rounded-full p-0 text-xs"
                        disabled={connectedGraphEntries.length <= 1}
                        onClick={() => moveActiveGraphLink('previous')}
                        aria-label="Previous related note"
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <div className="copilot-revision-graph-progress-track" aria-hidden="true">
                        <span
                          className="copilot-revision-graph-progress-fill"
                          style={{
                            width: `${((Math.max(0, activeConnectedGraphIndex) + 1) / Math.max(1, connectedGraphEntries.length)) * 100}%`,
                          }}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav copilot-revision-graph-side-nav h-8 w-8 rounded-full p-0 text-xs"
                        disabled={connectedGraphEntries.length <= 1}
                        onClick={() => moveActiveGraphLink('next')}
                        aria-label="Next related note"
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ) : null}
                  {activeConnectedGraphPreview ? (
                    <article className="copilot-revision-graph-preview-card mt-2">
                      <div className="copilot-revision-graph-preview-head">
                        <div className="min-w-0">
                          <p className="copilot-revision-graph-preview-kicker">Related note</p>
                          <p className="copilot-revision-graph-preview-title">{activeConnectedGraphPreview.title}</p>
                        </div>
                        <span className="copilot-revision-graph-preview-bridge">{activeConnectedGraphPreview.bridgeLabel}</span>
                      </div>
                      <p className="copilot-revision-graph-preview-body">{activeConnectedGraphPreview.previewText}</p>
                      {activeConnectedGraphPreview.pills.length ? (
                        <div className="copilot-revision-graph-preview-pills">
                          {activeConnectedGraphPreview.pills.map((pill, pillIndex) => (
                            <span key={`graph-preview-pill-${pill}-${pillIndex}`} className="copilot-revision-graph-preview-pill">
                              {pill}
                            </span>
                          ))}
                        </div>
                      ) : null}
                      <p className="copilot-revision-graph-preview-action">{activeConnectedGraphPreview.reasonLine}</p>
                    </article>
                  ) : null}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                No related notes yet. Save more notes with clear topic tags and this graph will light up.
              </p>
            )}
          </section>

          <StudyToolsSection
            item={item}
            existingFlashcards={itemFlashcards}
            onUpdateItem={onUpdateItem}
            onSaveStudentNote={onSaveStudentNote}
            onTogglePin={onTogglePin}
            viewportTargetId={focusViewportTargetId}
            onViewportActiveChange={setIsStudyToolViewportActive}
          />

        </aside>
      </div>
      </div>
    </div>
  );
}
function GuidedRevisionSessionPanel({
  session,
  selectedCollectionTitle,
  responseDraft,
  onResponseDraftChange,
  onSubmitStep,
  onSupportAction,
  onCloseSession,
  isSubmitting,
  feedbackText,
  errorMessage,
  saveDraft,
  onSaveDraftChange,
  onSaveNote,
  canSaveNote,
  isSavingNote,
  relatedConcepts,
  onStartRelatedConcept,
  onSeedPrompt,
}: {
  session: GuidedRevisionSessionStartResult;
  selectedCollectionTitle?: string | null;
  responseDraft: string;
  onResponseDraftChange: (value: string) => void;
  onSubmitStep: () => void;
  onSupportAction: (action: GuidedRevisionSupportAction) => void;
  onCloseSession: () => void;
  isSubmitting: boolean;
  feedbackText?: string | null;
  errorMessage?: string | null;
  saveDraft: string;
  onSaveDraftChange: (value: string) => void;
  onSaveNote: () => void;
  canSaveNote: boolean;
  isSavingNote: boolean;
  relatedConcepts: GuidedConceptLink[];
  onStartRelatedConcept?: (itemId: string) => void;
  onSeedPrompt?: (prompt: string) => void;
}) {
  const currentStep = session.currentStep;
  const stageLabel = getGuidedRevisionStepLabel(currentStep.stage);
  const currentStageIndex = GUIDED_STAGE_ORDER.indexOf(currentStep.stage);
  const supportActionLabel: Record<GuidedRevisionSupportAction, string> = {
    hint: 'Hint',
    explain_again: 'Explain again',
    break_down: 'Break it down',
    compare: 'Compare',
    mark_for_later: 'Mark for later',
  };
  const [showReferenceNote, setShowReferenceNote] = React.useState(false);
  const supportActions = session.supportActions.filter((action) => action !== 'mark_for_later');
  const hasMarkForLater = session.supportActions.includes('mark_for_later');
  const feedbackRef = React.useRef<HTMLDivElement | null>(null);
  const stageTitle =
    currentStep.stage === 'recall'
      ? 'Try it from memory'
      : currentStep.stage === 'quick_check'
      ? 'Quick check'
      : currentStep.stage === 'similar'
      ? 'Try a similar step'
      : currentStep.stage === 'wrap'
      ? 'Wrap and lock it in'
      : 'Revision complete';
  const stageActionLine =
    currentStep.stage === 'recall'
      ? 'Recall first before opening the saved note.'
      : currentStep.stage === 'quick_check'
      ? 'Do one fast check and lock the key move.'
      : currentStep.stage === 'similar'
      ? 'Solve one similar step to confirm transfer.'
      : currentStep.stage === 'wrap'
      ? 'Save one short signal for the next round.'
      : 'Session complete. Move to the next note.';
  const relationAnchor = relatedConcepts[0]?.title || 'a related concept';
  const socraticPrompts = [
    `What stays the same between "${session.item.title}" and "${relationAnchor}"?`,
    `What is one key difference between this note and "${relationAnchor}"?`,
    `If you confuse them in an exam, what mistake happens and how will you catch it?`,
  ];

  React.useEffect(() => {
    setShowReferenceNote(false);
  }, [session.sessionId, session.item.id]);

  React.useEffect(() => {
    if (currentStep.stage !== 'recall' || Boolean(feedbackText?.trim())) {
      setShowReferenceNote(true);
    }
  }, [currentStep.stage, feedbackText]);

  React.useEffect(() => {
    if (!feedbackText?.trim()) return;
    feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [feedbackText]);

  return (
    <section className="copilot-revision-card space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--copilot-soft-line)] pb-4">
        <div className="min-w-0 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
            Guided revision session
          </p>
          <h2 className="text-lg font-semibold text-[var(--copilot-text-primary)]">{session.item.title}</h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--copilot-text-secondary)]">
            <span className="copilot-revision-type-pill">{session.itemTypeLabel}</span>
            {session.item.subject ? (
              <span className="copilot-revision-pill">{getRevisionSubjectLabel(session.item.subject)}</span>
            ) : null}
            {session.item.topic ? <span className="copilot-revision-pill">{session.item.topic}</span> : null}
            {session.masteryLabel ? (
              <TopicMasteryChip compact label={session.masteryLabel} topic={session.item.topic || session.item.title} />
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="copilot-control-nav h-9 rounded-full px-3 text-sm"
          onClick={onCloseSession}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          {selectedCollectionTitle ? 'Back to notebook' : 'Back to item'}
        </Button>
      </div>

      <div className="space-y-4">
        <div className="copilot-guided-stage-track flex flex-wrap items-center gap-2 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-3 py-2">
          {GUIDED_STAGE_ORDER.map((stage, index) => {
            const label = getGuidedRevisionStepLabel(stage);
            const isCompleted =
              currentStep.stage === 'completed'
                ? stage !== 'completed'
                : index < currentStageIndex;
            const isActive = stage === currentStep.stage;
            return (
              <span
                key={stage}
                className={`copilot-guided-stage-chip ${isActive ? 'copilot-guided-stage-chip-active' : ''} ${
                  isCompleted ? 'copilot-guided-stage-chip-done' : ''
                }`}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="copilot-followup-card rounded-2xl px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="copilot-revision-pill">{stageLabel}</span>
            <span className="text-xs text-[var(--copilot-text-tertiary)]">
              {currentStep.stage === 'completed' ? 'Session complete' : 'One step at a time'}
            </span>
          </div>
          <h3 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">{stageTitle}</h3>
          <p className="mt-3 text-sm leading-6 text-[var(--copilot-text-primary)]">{stageActionLine}</p>
        </div>
        <div className="copilot-guided-engine-grid grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <div className="copilot-guided-engine-pane space-y-3 rounded-2xl px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="copilot-guidance-kicker">Concept links</p>
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                Transfer map
              </span>
            </div>
            {relatedConcepts.length ? (
              <div className="space-y-2.5">
                {relatedConcepts.map((concept) => (
                  <div key={concept.id} className="copilot-guided-link-card">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">{concept.title}</p>
                      <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-[var(--copilot-text-secondary)]">
                        {concept.subject ? <span className="copilot-revision-pill">{getRevisionSubjectLabel(concept.subject)}</span> : null}
                        {concept.collectionTitle ? <span className="copilot-revision-pill">{concept.collectionTitle}</span> : null}
                        {concept.relationSignals.map((signal) => (
                          <span key={`${concept.id}-${signal}`} className="copilot-revision-pill">
                            {signal}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-8 rounded-full px-2.5 text-xs"
                        onClick={() =>
                          onSeedPrompt?.(
                            `Compare "${session.item.title}" with "${concept.title}". Name one similarity, one difference, and one exam trap.`
                          )
                        }
                      >
                        Seed compare
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav h-8 rounded-full px-2.5 text-xs"
                        disabled={isSubmitting}
                        onClick={() => onStartRelatedConcept?.(concept.id)}
                      >
                        Revise link
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                Related concepts will appear here as your revision library grows.
              </p>
            )}
          </div>
          <div className="copilot-guided-engine-pane space-y-3 rounded-2xl px-4 py-3">
            <div className="flex items-center justify-between gap-2">
              <p className="copilot-guidance-kicker">Socratic prompts</p>
              <span className="text-[11px] uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">Ask & test</span>
            </div>
            <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
              Use a prompt, respond in your own words, then verify against the note.
            </p>
            <div className="flex flex-wrap gap-2">
              {socraticPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  className="copilot-guided-prompt-chip"
                  onClick={() => onSeedPrompt?.(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {feedbackText ? (
          <div
            ref={feedbackRef}
            className="rounded-2xl border border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] px-4 py-3 text-sm text-[var(--copilot-accent-text)]"
          >
            {feedbackText}
          </div>
        ) : null}

        {session.weakTopicRecovery?.active ? (
          <div className="copilot-recovery-card rounded-2xl px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Recovery support
            </p>
            <p className="mt-1 text-sm text-[var(--copilot-text-primary)]">
              {session.weakTopicRecovery.title || "Let's rebuild this step by step."}
            </p>
            <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
              {session.weakTopicRecovery.summary || 'We will revisit the foundation and then retry a similar step.'}
            </p>
          </div>
        ) : null}

        {currentStep.requiresInput ? (
          <div className="space-y-2 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-4 py-3">
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                disabled={isSubmitting}
                onClick={() => onSupportAction('hint')}
              >
                I&apos;m not sure yet
              </Button>
              {!showReferenceNote ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                  onClick={() => setShowReferenceNote(true)}
                >
                  Show saved note
                </Button>
              ) : null}
            </div>
            <Textarea
              value={responseDraft}
              onChange={(event) => onResponseDraftChange(event.target.value)}
              placeholder={currentStep.inputPlaceholder || 'Write your answer here.'}
              className="min-h-[96px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] transition-all duration-200"
            />
            {errorMessage ? (
              <p className="text-xs text-rose-600">{errorMessage}</p>
            ) : null}
          </div>
        ) : null}

        <div className="copilot-guidance-panel space-y-3 rounded-2xl px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="copilot-guidance-kicker">Note vault</p>
            <Button
              type="button"
              variant="ghost"
              className="copilot-control-nav h-8 rounded-full px-3 text-xs"
              onClick={() => setShowReferenceNote((previous) => !previous)}
            >
              {showReferenceNote ? 'Hide note' : 'Show saved note'}
            </Button>
          </div>
          {showReferenceNote ? (
            <>
              <div className="whitespace-pre-wrap text-sm leading-6 text-[var(--copilot-text-primary)]">
                {session.item.content}
              </div>
              {session.item.selectedText ? (
                <div className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-3.5 py-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                    Saved excerpt
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[var(--copilot-text-secondary)]">
                    {session.item.selectedText}
                  </p>
                </div>
              ) : null}
            </>
          ) : (
            <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
              Note hidden. Reveal when you need verification.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="copilot-control-commit h-9 rounded-full px-4 text-sm"
            disabled={isSubmitting}
            onClick={currentStep.stage === 'completed' ? onCloseSession : onSubmitStep}
          >
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {currentStep.stage === 'completed'
              ? 'Back to item'
              : currentStep.ctaLabel || (currentStep.requiresInput ? 'Continue' : 'Finish')}
          </Button>
          {currentStep.stage !== 'completed'
            ? supportActions.map((action) => (
                <Button
                  key={action}
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                  disabled={isSubmitting}
                  onClick={() => onSupportAction(action)}
                >
                  {supportActionLabel[action]}
                </Button>
              ))
            : null}
          {currentStep.stage !== 'completed' && hasMarkForLater ? (
            <Button
              type="button"
              variant="ghost"
              className="copilot-control-nav h-9 rounded-full px-3 text-sm"
              disabled={isSubmitting}
              onClick={() => onSupportAction('mark_for_later')}
            >
              {supportActionLabel.mark_for_later}
            </Button>
          ) : null}
        </div>

        {canSaveNote && (currentStep.stage === 'wrap' || currentStep.stage === 'completed') ? (
          <div className="space-y-2 rounded-2xl border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
              Save what to remember
            </p>
            <Textarea
              value={saveDraft}
              onChange={(event) => onSaveDraftChange(event.target.value)}
              placeholder="Write one short reminder you want to keep."
              className="min-h-[84px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]"
            />
            <div className="flex justify-end">
              <Button
                type="button"
                className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                disabled={isSavingNote}
                onClick={onSaveNote}
              >
                {isSavingNote ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save update
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function RevisionTab({
  overview,
  searchQuery,
  setSearchQuery,
  isLoading,
  errorMessage,
  selectedCollection,
  collectionItems,
  isCollectionLoading,
  groupingSuggestions,
  isGroupingSuggestionsLoading,
  onSelectCollection,
  onContinueChat,
  onTogglePin,
  onUpdateMastery,
  onSaveStudentNote,
  onUpdateCollection,
  onDeleteCollection,
  onUpdateItem,
  onUpdateItemsBatch,
  onDeleteItem,
  onQuizItem,
  onBreakdownItem,
  onSimilarQuestionItem,
  onApplyGroupingSuggestion,
  onExpandWorkspace,
  onRetryLoad,
  onReviseWithSteadfast,
  selectedItemId,
  onSelectItemId,
  workspaceScrollState,
  onWorkspaceScrollStateChange,
  layoutMode = 'panel',
  showExpandAction = true,
}: RevisionTabProps) {
  const [localSelectedItemId, setLocalSelectedItemId] = React.useState<string | null>(null);
  const [isStartingRevisionMode, setIsStartingRevisionMode] = React.useState(false);
  const [guidedRevisionSession, setGuidedRevisionSession] = React.useState<GuidedRevisionSessionStartResult | null>(null);
  const [isGuidedEngineModalOpen, setIsGuidedEngineModalOpen] = React.useState(false);
  const [guidedLaunchContext, setGuidedLaunchContext] = React.useState<{ collectionId?: string; itemId?: string } | null>(null);
  const [guidedResponseDraft, setGuidedResponseDraft] = React.useState('');
  const [guidedFeedbackText, setGuidedFeedbackText] = React.useState('');
  const [guidedSessionError, setGuidedSessionError] = React.useState('');
  const [isGuidedStepLoading, setIsGuidedStepLoading] = React.useState(false);
  const [guidedSaveDraft, setGuidedSaveDraft] = React.useState('');
  const [isGuidedSaveLoading, setIsGuidedSaveLoading] = React.useState(false);
  const [workspaceScopeFilter, setWorkspaceScopeFilter] =
    React.useState<RevisionWorkspaceScopeFilter>('all');
  const [workspaceTypeFilter, setWorkspaceTypeFilter] =
    React.useState<RevisionWorkspaceTypeFilter>('all');
  const [workspaceSubjectFilter, setWorkspaceSubjectFilter] =
    React.useState<RevisionWorkspaceSubjectFilter>('all');
  const [expandedSubjectOriginGroups, setExpandedSubjectOriginGroups] = React.useState<RevisionSubjectOrigin[]>([]);
  const [notebookSelectionMode, setNotebookSelectionMode] = React.useState(false);
  const [selectedNotebookItemIds, setSelectedNotebookItemIds] = React.useState<string[]>([]);
  const [bulkMoveTargetCollectionId, setBulkMoveTargetCollectionId] = React.useState('__standalone__');
  const [bulkMoveNewNotebookTitle, setBulkMoveNewNotebookTitle] = React.useState('');
  const [isBulkMovingItems, setIsBulkMovingItems] = React.useState(false);
  const [isNotebookReordering, setIsNotebookReordering] = React.useState(false);
  const [draggedNotebookItemId, setDraggedNotebookItemId] = React.useState<string | null>(null);
  const [dragOverNotebookItemId, setDragOverNotebookItemId] = React.useState<string | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = React.useState<string | null>(null);
  const [quickNotesEditorItemId, setQuickNotesEditorItemId] = React.useState<string | null>(null);
  const [quickNoteDraft, setQuickNoteDraft] = React.useState('');
  const [isQuickNoteSaving, setIsQuickNoteSaving] = React.useState(false);
  const [quickNotesError, setQuickNotesError] = React.useState('');
  const [singleMoveItemId, setSingleMoveItemId] = React.useState<string | null>(null);
  const [singleMoveTargetCollectionId, setSingleMoveTargetCollectionId] = React.useState('__standalone__');
  const [singleMoveNewNotebookTitle, setSingleMoveNewNotebookTitle] = React.useState('');
  const [isSingleMoveSubmitting, setIsSingleMoveSubmitting] = React.useState(false);
  const [singleMoveError, setSingleMoveError] = React.useState('');
  const [isNotebookSlideshowOpen, setIsNotebookSlideshowOpen] = React.useState(false);
  const [notebookSlideshowDocumentId, setNotebookSlideshowDocumentId] = React.useState<string | null>(null);
  const [notebookSlideshowNoteIds, setNotebookSlideshowNoteIds] = React.useState<string[]>([]);
  const [notebookSlideshowIndex, setNotebookSlideshowIndex] = React.useState(0);
  const [notebookSlideshowActiveNoteId, setNotebookSlideshowActiveNoteId] = React.useState<string | null>(null);
  const [notebookSlideshowStartNoteId, setNotebookSlideshowStartNoteId] = React.useState<string | null>(null);
  const [notebookSlideshowSource, setNotebookSlideshowSource] = React.useState<NotebookSlideshowSource | null>(null);
  const [notebookSlideshowExitTarget, setNotebookSlideshowExitTarget] = React.useState<NotebookSlideshowExitTarget | null>(null);
  const [pendingNotebookSlideshowLaunch, setPendingNotebookSlideshowLaunch] =
    React.useState<PendingNotebookSlideshowLaunch | null>(null);
  const [isAutoOrderingNotebook, setIsAutoOrderingNotebook] = React.useState(false);
  const [notebookOrderError, setNotebookOrderError] = React.useState('');
  const [notebookMoveError, setNotebookMoveError] = React.useState('');
  const [pendingNotebookDeleteMode, setPendingNotebookDeleteMode] =
    React.useState<DeleteRevisionCollectionMode | null>(null);
  const [isNotebookDeleteActionLoading, setIsNotebookDeleteActionLoading] = React.useState(false);
  const [notebookDeleteError, setNotebookDeleteError] = React.useState('');
  const [collapsedNotebookChapterIds, setCollapsedNotebookChapterIds] = React.useState<string[]>([]);
  const [isNotebookIdentityEditing, setIsNotebookIdentityEditing] = React.useState(false);
  const [isNotebookIdentitySaving, setIsNotebookIdentitySaving] = React.useState(false);
  const [notebookCoverAction, setNotebookCoverAction] = React.useState<'idle' | 'generating' | 'uploading'>('idle');
  const [notebookCoverError, setNotebookCoverError] = React.useState('');
  const [notebookNarrativeByCollectionId, setNotebookNarrativeByCollectionId] = React.useState<
    Record<string, { preface: string; endRecap: string; generatedAt?: string | null }>
  >({});
  const [chapterSummariesByCollectionId, setChapterSummariesByCollectionId] = React.useState<Record<string, RevisionChapterSummary[]>>({});
  const [isGeneratingChapterSummaries, setIsGeneratingChapterSummaries] = React.useState(false);
  const [chapterSummaryError, setChapterSummaryError] = React.useState('');
  const [flashcardsByCollectionId, setFlashcardsByCollectionId] = React.useState<Record<string, RevisionFlashcard[]>>({});
  const [flashcardDeckTitleByCollectionId, setFlashcardDeckTitleByCollectionId] = React.useState<Record<string, string>>({});
  const [flashcardScopeByCollectionId, setFlashcardScopeByCollectionId] = React.useState<
    Record<string, { scope: 'collection' | 'chapter'; chapterId?: string | null; chapterLabel?: string | null; generatedAt?: string | null }>
  >({});
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = React.useState(false);
  const [flashcardError, setFlashcardError] = React.useState('');
  const [selectedFlashcardChapterId, setSelectedFlashcardChapterId] = React.useState('__all__');
  const [activeFlashcardIndex, setActiveFlashcardIndex] = React.useState(0);
  const [isFlashcardBackVisible, setIsFlashcardBackVisible] = React.useState(false);
  const [isFlashcardQuizActive, setIsFlashcardQuizActive] = React.useState(false);
  const [flashcardQuizIndex, setFlashcardQuizIndex] = React.useState(0);
  const [isFlashcardQuizAnswerVisible, setIsFlashcardQuizAnswerVisible] = React.useState(false);
  const [flashcardQuizResults, setFlashcardQuizResults] = React.useState<Record<string, 'again' | 'got_it'>>({});
  const [flashcardQuizOrder, setFlashcardQuizOrder] = React.useState<string[]>([]);
  const [flashcardQuizRepeatCountById, setFlashcardQuizRepeatCountById] = React.useState<Record<string, number>>({});
  const [isExportingFlashcardMisses, setIsExportingFlashcardMisses] = React.useState(false);
  const [flashcardQueueExportNotice, setFlashcardQueueExportNotice] = React.useState('');
  const [visualAssetsByCollectionId, setVisualAssetsByCollectionId] = React.useState<Record<string, MediaAsset[]>>({});
  const [isLoadingNotebookVisuals, setIsLoadingNotebookVisuals] = React.useState(false);
  const [isGeneratingNotebookVisual, setIsGeneratingNotebookVisual] = React.useState(false);
  const [notebookVisualError, setNotebookVisualError] = React.useState('');
  const [selectedNotebookVisualMode, setSelectedNotebookVisualMode] = React.useState<RevisionNotebookVisualMode>('diagram');
  const [hasManualNotebookVisualModeSelection, setHasManualNotebookVisualModeSelection] = React.useState(false);
  const [notebookIdentityDraft, setNotebookIdentityDraft] = React.useState<RevisionCollectionIdentityDraft>(
    () => createRevisionCollectionIdentityDraft(selectedCollection)
  );
  const workspaceLibraryRef = React.useRef<HTMLDivElement | null>(null);
  const workspaceDetailRef = React.useRef<HTMLDivElement | null>(null);
  const selectedCollectionRef = React.useRef<string | null>(null);
  const notebookEntryItemIdByCollectionRef = React.useRef<Record<string, string>>({});
  const notebookBrowseOriginRef = React.useRef<{
    collectionId: string | null;
    itemId: string | null;
  } | null>(null);
  const notebookBrowseTransitionRef = React.useRef<{
    mode: 'browse' | 'return';
    targetCollectionId: string | null;
  } | null>(null);
  const previousSelectedNotebookItemRef = React.useRef<{
    itemId: string | null;
    collectionId: string | null;
  }>({
    itemId: null,
    collectionId: null,
  });
  const notebookCoverUploadInputRef = React.useRef<HTMLInputElement | null>(null);

  const revisionTitle = getSteadfastUiCopy('revision.title');
  const revisionIntro = getSteadfastUiCopy('revision.intro');
  const revisionSearchPlaceholder = getSteadfastUiCopy('revision.searchPlaceholder');
  const recentSectionTitle = getSteadfastUiCopy('revision.recentSectionTitle');
  const recentSectionBody = getSteadfastUiCopy('revision.recentSectionBody');

  const itemMap = React.useMemo(() => {
    const map = new Map<string, RevisionItem>();
    const add = (items?: RevisionItem[]) =>
      items?.forEach((item) => {
        if (item?.id) map.set(item.id, item);
      });
    add(collectionItems);
    overview?.collections?.forEach((collection) => add(collection.previewItems));
    add(overview?.recentItems);
    add(overview?.pinnedItems);
    add(overview?.needsPracticeItems);
    add(overview?.mistakeItems);
    add(overview?.ungroupedItems);
    return map;
  }, [
    collectionItems,
    overview?.collections,
    overview?.mistakeItems,
    overview?.needsPracticeItems,
    overview?.pinnedItems,
    overview?.recentItems,
    overview?.ungroupedItems,
  ]);

  const effectiveSelectedItemId =
    selectedItemId !== undefined ? selectedItemId : localSelectedItemId;
  const setEffectiveSelectedItemId = React.useCallback(
    (itemId: string | null) => {
      if (onSelectItemId) {
        onSelectItemId(itemId);
        return;
      }
      setLocalSelectedItemId(itemId);
    },
    [onSelectItemId]
  );

  React.useEffect(() => {
    if (!effectiveSelectedItemId) return;
    if (itemMap.has(effectiveSelectedItemId)) return;
    if (guidedRevisionSession?.item.id === effectiveSelectedItemId) return;
    setEffectiveSelectedItemId(null);
  }, [effectiveSelectedItemId, guidedRevisionSession?.item.id, itemMap, setEffectiveSelectedItemId]);

  const selectedItem = effectiveSelectedItemId
    ? itemMap.get(effectiveSelectedItemId) ||
      (guidedRevisionSession?.item.id === effectiveSelectedItemId ? guidedRevisionSession.item : null)
    : null;
  const allCollections = overview?.collections || [];
  const orderedCollectionItems = React.useMemo(
    () => sortRevisionItemsForNotebook(collectionItems),
    [collectionItems]
  );
  const orderedCollectionItemIds = React.useMemo(
    () => orderedCollectionItems.map((item) => item.id),
    [orderedCollectionItems]
  );
  const selectedCollectionChapterGroups = React.useMemo(
    () => buildRevisionNotebookChapters(orderedCollectionItems),
    [orderedCollectionItems]
  );
  const selectedCollectionCover = React.useMemo(
    () => getRevisionCollectionCoverData(selectedCollection),
    [selectedCollection]
  );
  const cachedSelectedCollectionNotebookNarrative = React.useMemo(
    () => getRevisionCollectionAiNotebookNarrative(selectedCollection),
    [selectedCollection]
  );
  const cachedSelectedCollectionChapterSummaries = React.useMemo(
    () => getRevisionCollectionAiChapterSummaries(selectedCollection),
    [selectedCollection]
  );
  const cachedSelectedCollectionFlashcards = React.useMemo(
    () => getRevisionCollectionAiFlashcards(selectedCollection),
    [selectedCollection]
  );
  const liveSelectedCollectionNotebookNarrative = selectedCollection?.id
    ? notebookNarrativeByCollectionId[selectedCollection.id] || null
    : null;
  const liveSelectedCollectionChapterSummaries = selectedCollection?.id
    ? chapterSummariesByCollectionId[selectedCollection.id] || []
    : [];
  const liveSelectedCollectionFlashcards = selectedCollection?.id
    ? flashcardsByCollectionId[selectedCollection.id] || []
    : [];
  const effectiveSelectedCollectionChapterSummaries =
    liveSelectedCollectionChapterSummaries.length
      ? liveSelectedCollectionChapterSummaries
      : cachedSelectedCollectionChapterSummaries;
  const effectiveSelectedCollectionNarrative = liveSelectedCollectionNotebookNarrative || cachedSelectedCollectionNotebookNarrative;
  const effectiveSelectedCollectionFlashcards =
    liveSelectedCollectionFlashcards.length
      ? liveSelectedCollectionFlashcards
      : cachedSelectedCollectionFlashcards.flashcards;
  const effectiveSelectedCollectionFlashcardDeckTitle =
    (selectedCollection?.id ? flashcardDeckTitleByCollectionId[selectedCollection.id] : '') ||
    cachedSelectedCollectionFlashcards.deckTitle ||
    'Notebook recall deck';
  const effectiveSelectedCollectionFlashcardScope = selectedCollection?.id
    ? flashcardScopeByCollectionId[selectedCollection.id] || {
        scope: cachedSelectedCollectionFlashcards.scope,
        chapterId: cachedSelectedCollectionFlashcards.chapterId || null,
        chapterLabel: cachedSelectedCollectionFlashcards.chapterLabel || null,
        generatedAt: cachedSelectedCollectionFlashcards.generatedAt || null,
      }
    : {
        scope: cachedSelectedCollectionFlashcards.scope,
        chapterId: cachedSelectedCollectionFlashcards.chapterId || null,
        chapterLabel: cachedSelectedCollectionFlashcards.chapterLabel || null,
        generatedAt: cachedSelectedCollectionFlashcards.generatedAt || null,
      };
  const selectedCollectionChapterSummaryMap = React.useMemo(() => {
    const map = new Map<string, string>();
    effectiveSelectedCollectionChapterSummaries.forEach((chapter) => {
      map.set(chapter.id, chapter.summary);
      map.set(chapter.label.toLocaleLowerCase(), chapter.summary);
    });
    return map;
  }, [effectiveSelectedCollectionChapterSummaries]);
  const selectedCollectionVisualAssets = selectedCollection?.id
    ? visualAssetsByCollectionId[selectedCollection.id] || []
    : [];
  const hasLoadedSelectedCollectionVisualAssets = selectedCollection?.id
    ? Object.prototype.hasOwnProperty.call(visualAssetsByCollectionId, selectedCollection.id)
    : false;
  const effectiveSelectedCollectionFlashcardMap = React.useMemo(
    () => new Map(effectiveSelectedCollectionFlashcards.map((card) => [card.id, card] as const)),
    [effectiveSelectedCollectionFlashcards]
  );
  const activeItemCollection = React.useMemo(
    () =>
      selectedItem?.collectionId
        ? (selectedCollection?.id === selectedItem.collectionId
            ? selectedCollection
            : allCollections.find((collection) => collection.id === selectedItem.collectionId) || null)
        : null,
    [allCollections, selectedCollection, selectedItem?.collectionId]
  );

  React.useEffect(() => {
    setNotebookSelectionMode(false);
    setSelectedNotebookItemIds([]);
    setBulkMoveTargetCollectionId('__standalone__');
    setBulkMoveNewNotebookTitle('');
    setQuickNotesEditorItemId(null);
    setQuickNoteDraft('');
    setQuickNotesError('');
    setSingleMoveItemId(null);
    setSingleMoveTargetCollectionId('__standalone__');
    setSingleMoveNewNotebookTitle('');
    setSingleMoveError('');
    setIsNotebookSlideshowOpen(false);
    setNotebookSlideshowDocumentId(null);
    setNotebookSlideshowNoteIds([]);
    setNotebookSlideshowIndex(0);
    setNotebookSlideshowActiveNoteId(null);
    setNotebookSlideshowStartNoteId(null);
    setNotebookSlideshowSource(null);
    setNotebookSlideshowExitTarget(null);
    setNotebookOrderError('');
    setNotebookMoveError('');
    setPendingNotebookDeleteMode(null);
    setNotebookDeleteError('');
    setDraggedNotebookItemId(null);
    setDragOverNotebookItemId(null);
    setDragOverCollectionId(null);
  }, [selectedCollection?.id]);

  React.useEffect(() => {
    setNotebookIdentityDraft(createRevisionCollectionIdentityDraft(selectedCollection));
    setIsNotebookIdentityEditing(false);
    setIsNotebookIdentitySaving(false);
    setNotebookCoverAction('idle');
    setNotebookCoverError('');
    setChapterSummaryError('');
    setFlashcardError('');
    setFlashcardQueueExportNotice('');
    setNotebookVisualError('');
    setSelectedFlashcardChapterId('__all__');
    setActiveFlashcardIndex(0);
    setIsFlashcardBackVisible(false);
    setIsFlashcardQuizActive(false);
    setFlashcardQuizIndex(0);
    setIsFlashcardQuizAnswerVisible(false);
    setFlashcardQuizResults({});
    setFlashcardQuizOrder([]);
    setFlashcardQuizRepeatCountById({});
    setHasManualNotebookVisualModeSelection(false);
  }, [selectedCollection?.id, selectedCollection?.updatedAt]);

  React.useEffect(() => {
    if (!selectedCollection?.id || !cachedSelectedCollectionChapterSummaries.length) return;
    setChapterSummariesByCollectionId((previous) => ({
      ...previous,
      [selectedCollection.id]: cachedSelectedCollectionChapterSummaries,
    }));
  }, [cachedSelectedCollectionChapterSummaries, selectedCollection?.id]);

  React.useEffect(() => {
    if (!selectedCollection?.id) return;
    if (cachedSelectedCollectionNotebookNarrative.preface || cachedSelectedCollectionNotebookNarrative.endRecap) {
      setNotebookNarrativeByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: cachedSelectedCollectionNotebookNarrative,
      }));
    }
  }, [cachedSelectedCollectionNotebookNarrative, selectedCollection?.id]);

  React.useEffect(() => {
    if (!selectedCollection?.id || !cachedSelectedCollectionFlashcards.flashcards.length) return;
    setFlashcardsByCollectionId((previous) => ({
      ...previous,
      [selectedCollection.id]: cachedSelectedCollectionFlashcards.flashcards,
    }));
    setFlashcardDeckTitleByCollectionId((previous) => ({
      ...previous,
      [selectedCollection.id]: cachedSelectedCollectionFlashcards.deckTitle || 'Notebook recall deck',
    }));
    setFlashcardScopeByCollectionId((previous) => ({
      ...previous,
      [selectedCollection.id]: {
        scope: cachedSelectedCollectionFlashcards.scope,
        chapterId: cachedSelectedCollectionFlashcards.chapterId || null,
        chapterLabel: cachedSelectedCollectionFlashcards.chapterLabel || null,
        generatedAt: cachedSelectedCollectionFlashcards.generatedAt || null,
      },
    }));
  }, [cachedSelectedCollectionFlashcards, selectedCollection?.id]);

  React.useEffect(() => {
    const nextCollectionId = selectedCollection?.id || null;
    if (selectedCollectionRef.current !== nextCollectionId) {
      selectedCollectionRef.current = nextCollectionId;
      setCollapsedNotebookChapterIds(getDefaultCollapsedNotebookChapterIds(selectedCollectionChapterGroups));
      return;
    }
    const availableChapterIds = new Set(selectedCollectionChapterGroups.map((chapter) => chapter.id));
      setCollapsedNotebookChapterIds((previous) => previous.filter((chapterId) => availableChapterIds.has(chapterId)));
  }, [selectedCollection?.id, selectedCollectionChapterGroups]);

  React.useEffect(() => {
    if (!selectedNotebookItemIds.length) return;
    const availableIds = new Set(orderedCollectionItems.map((item) => item.id));
    setSelectedNotebookItemIds((previous) => previous.filter((itemId) => availableIds.has(itemId)));
  }, [orderedCollectionItems, selectedNotebookItemIds.length]);
  React.useEffect(() => {
    if (!isNotebookSlideshowOpen) return;
    if (!notebookSlideshowDocumentId || selectedCollection?.id !== notebookSlideshowDocumentId) return;
    setNotebookSlideshowNoteIds((previous) => {
      if (
        previous.length === orderedCollectionItemIds.length &&
        previous.every((entry, index) => entry === orderedCollectionItemIds[index])
      ) {
        return previous;
      }
      return orderedCollectionItemIds;
    });
  }, [
    isNotebookSlideshowOpen,
    notebookSlideshowDocumentId,
    orderedCollectionItemIds,
    selectedCollection?.id,
  ]);
  React.useEffect(() => {
    if (!isNotebookSlideshowOpen) return;
    if (!notebookSlideshowNoteIds.length) {
      if (notebookSlideshowIndex !== 0) setNotebookSlideshowIndex(0);
      if (notebookSlideshowActiveNoteId !== null) setNotebookSlideshowActiveNoteId(null);
      return;
    }
    const activeIndex = notebookSlideshowActiveNoteId
      ? notebookSlideshowNoteIds.indexOf(notebookSlideshowActiveNoteId)
      : -1;
    if (activeIndex >= 0) {
      if (notebookSlideshowIndex !== activeIndex) setNotebookSlideshowIndex(activeIndex);
      return;
    }
    const clampedIndex = Math.min(notebookSlideshowIndex, notebookSlideshowNoteIds.length - 1);
    const fallbackId = notebookSlideshowNoteIds[clampedIndex] || null;
    if (notebookSlideshowIndex !== clampedIndex) setNotebookSlideshowIndex(clampedIndex);
    if (fallbackId !== notebookSlideshowActiveNoteId) setNotebookSlideshowActiveNoteId(fallbackId);
  }, [
    isNotebookSlideshowOpen,
    notebookSlideshowActiveNoteId,
    notebookSlideshowIndex,
    notebookSlideshowNoteIds,
  ]);

  React.useEffect(() => {
    if (!guidedRevisionSession) return;
    if (!selectedItem) return;
    if (selectedItem.id !== guidedRevisionSession.item.id) {
      setIsGuidedEngineModalOpen(false);
      setGuidedLaunchContext(null);
      setGuidedRevisionSession(null);
      setGuidedResponseDraft('');
      setGuidedFeedbackText('');
      setGuidedSessionError('');
      setGuidedSaveDraft('');
    }
  }, [guidedRevisionSession, selectedItem]);
  React.useEffect(() => {
    if (!guidedFeedbackText.trim()) return;
    workspaceDetailRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [guidedFeedbackText]);
  const hasOverviewContent = Boolean(
    overview &&
      ((overview.totalItems || 0) > 0 ||
        (overview.totalCollections || 0) > 0 ||
        overview.collections.length ||
        overview.recentItems.length ||
        overview.ungroupedItems.length ||
        (overview.pinnedItems?.length || 0) > 0 ||
        (overview.mistakeItems?.length || 0) > 0 ||
        (overview.needsPracticeItems?.length || 0) > 0)
  );
  const itemCountLabel = `${itemMap.size} saved`;
  const listCountLabel = `${overview?.collections.length || 0} notebooks`;
  const pinnedCount = overview?.pinnedItems?.length || 0;
  const queuePreview = overview?.queuePreview || null;
  const allWorkspaceItems = React.useMemo(
    () =>
      Array.from(itemMap.values()).sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      ),
    [itemMap]
  );
  const quickNoteCountByItemId = React.useMemo(() => {
    const map = new Map<string, number>();
    allWorkspaceItems.forEach((item) => {
      map.set(item.id, getRevisionQuickNotesFromItem(item).length);
    });
    return map;
  }, [allWorkspaceItems]);
  const collectionItemCountByCollectionId = React.useMemo(() => {
    const map = new Map<string, number>();
    allWorkspaceItems.forEach((item) => {
      if (!item.collectionId) return;
      map.set(item.collectionId, (map.get(item.collectionId) || 0) + 1);
    });
    return map;
  }, [allWorkspaceItems]);
  const quickNotesEditorItem = quickNotesEditorItemId ? itemMap.get(quickNotesEditorItemId) || null : null;
  const quickNotesForEditorItem = React.useMemo(
    () => (quickNotesEditorItem ? getRevisionQuickNotesFromItem(quickNotesEditorItem) : []),
    [quickNotesEditorItem]
  );
  const singleMoveItem = singleMoveItemId ? itemMap.get(singleMoveItemId) || null : null;
  const guidedConceptLinks = React.useMemo<GuidedConceptLink[]>(() => {
    if (!guidedRevisionSession) return [];
    const source = guidedRevisionSession.item;
    return allWorkspaceItems
      .filter((candidate) => candidate.id !== source.id)
      .map((candidate) => {
        const score = getRevisionAffinityScore(source, candidate);
        if (score <= 0) return null;
        const relationSignals = getRevisionConnectionSignals(source, candidate).slice(0, 2);
        return {
          id: candidate.id,
          title: candidate.title,
          subject: candidate.subject || null,
          collectionTitle: candidate.collectionTitle || null,
          relationSignals,
          score,
        } satisfies GuidedConceptLink;
      })
      .filter(Boolean)
      .sort((left, right) => {
        if (!left || !right) return 0;
        if (right.score !== left.score) return right.score - left.score;
        return compareAlphabetical(left.title, right.title);
      })
      .slice(0, 4) as GuidedConceptLink[];
  }, [allWorkspaceItems, guidedRevisionSession]);
  const sameCollectionItems = React.useMemo(() => {
    if (!selectedItem?.collectionId) return [] as RevisionItem[];
    const baseItems =
      selectedCollection?.id === selectedItem.collectionId && orderedCollectionItems.length
        ? orderedCollectionItems
        : allWorkspaceItems.filter((item) => item.collectionId === selectedItem.collectionId);
    return baseItems
      .filter((item) => item.id !== selectedItem.id)
      .sort((left, right) => {
        const orderDelta = getRevisionNotebookOrderValue(left) - getRevisionNotebookOrderValue(right);
        if (orderDelta !== 0) return orderDelta;
        const topicOrder = compareAlphabetical(left.topic || '', right.topic || '');
        if (topicOrder !== 0) return topicOrder;
        return toRevisionSortTime(right.updatedAt) - toRevisionSortTime(left.updatedAt);
      });
  }, [allWorkspaceItems, orderedCollectionItems, selectedCollection?.id, selectedItem]);
  const crossCollectionRelatedItems = React.useMemo(() => {
    if (!selectedItem) return [] as RevisionItem[];
    const graphLinks = Array.isArray(selectedItem.connectedGraph?.links) ? selectedItem.connectedGraph.links : [];
    if (graphLinks.length) {
      const candidateById = new Map(
        allWorkspaceItems
          .filter((candidate) => candidate.id !== selectedItem.id)
          .map((candidate) => [candidate.id, candidate] as const)
      );
      const orderedServerItems = graphLinks
        .map((link) => candidateById.get(link.targetItemId))
        .filter(Boolean) as RevisionItem[];
      if (orderedServerItems.length) {
        return orderedServerItems.slice(0, 8);
      }
    }
    return allWorkspaceItems
      .filter((candidate) => candidate.id !== selectedItem.id)
      .map((candidate) => ({
        candidate,
        score: getRevisionAffinityScore(selectedItem, candidate),
      }))
      .filter((entry) => entry.score >= 8)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return toRevisionSortTime(right.candidate.updatedAt) - toRevisionSortTime(left.candidate.updatedAt);
      })
      .map((entry) => entry.candidate)
      .slice(0, 8);
  }, [allWorkspaceItems, selectedItem]);
  const standaloneWorkspaceItems = React.useMemo(
    () => allWorkspaceItems.filter((item) => !item.collectionId),
    [allWorkspaceItems]
  );
  const dueNowIds = React.useMemo(
    () => new Set(queuePreview?.dueNow.map((item) => item.id) || []),
    [queuePreview?.dueNow]
  );
  const needsAttentionIds = React.useMemo(
    () => new Set(queuePreview?.needsAttention.map((item) => item.id) || []),
    [queuePreview?.needsAttention]
  );
  const recentlyImprovedIds = React.useMemo(
    () => new Set(queuePreview?.recentlyImproved.map((item) => item.id) || []),
    [queuePreview?.recentlyImproved]
  );
  // Keep the sidebar filters global so opening one notebook or note never hides the rest of the workspace options.
  const workspaceFilterBaseItems = allWorkspaceItems;
  const matchesWorkspaceScopeFilter = React.useCallback(
    (item: RevisionItem, scope: RevisionWorkspaceScopeFilter) => {
      if (scope === 'all') return true;
      if (scope === 'pinned') return Boolean(item.isPinned);
      if (scope === 'due_now') return dueNowIds.has(item.id) || item.reviewStatus === 'review_due';
      if (scope === 'needs_attention') {
        return needsAttentionIds.has(item.id) || item.reviewStatus === 'needs_attention';
      }
      if (scope === 'needs_practice') return Boolean(item.needsPractice);
      if (scope === 'mistake_fixes') return Boolean(item.isMistakeBased);
      return recentlyImprovedIds.has(item.id) || item.confidenceTrend === 'up';
    },
    [dueNowIds, needsAttentionIds, recentlyImprovedIds]
  );
  const workspaceScopeItems = React.useMemo(
    () =>
      workspaceFilterBaseItems.filter((item) =>
        matchesWorkspaceScopeFilter(item, workspaceScopeFilter)
      ),
    [matchesWorkspaceScopeFilter, workspaceFilterBaseItems, workspaceScopeFilter]
  );
  const workspaceTypeOptionCounts = React.useMemo(() => {
    const typeCountMap = new Map<RevisionSaveType, number>();
    workspaceScopeItems.forEach((item) => {
      const saveType = resolveRevisionSaveType(item);
      typeCountMap.set(saveType, (typeCountMap.get(saveType) || 0) + 1);
    });

    return WORKSPACE_TYPE_OPTIONS
      .map((option) => ({
        value: option.value,
        label: option.label,
        count:
          option.value === 'all'
            ? workspaceScopeItems.length
            : (typeCountMap.get(option.value as RevisionSaveType) || 0),
      }))
      .filter((option) => option.value === 'all' || option.count > 0);
  }, [workspaceScopeItems]);
  const workspaceTypeAndScopeItems = React.useMemo(
    () =>
      workspaceTypeFilter === 'all'
        ? workspaceScopeItems
        : workspaceScopeItems.filter((item) => resolveRevisionSaveType(item) === workspaceTypeFilter),
    [workspaceScopeItems, workspaceTypeFilter]
  );
  const workspaceSubjectOptionCounts = React.useMemo(() => {
    const options = new Map<
      string,
      {
        value: string;
        label: string;
        count: number;
      }
    >();
    workspaceTypeAndScopeItems.forEach((item) => {
      const token = getNormalizedFilterToken(item.subject);
      if (!token) return;
      const existing = options.get(token);
      if (existing) {
        existing.count += 1;
        return;
      }
      options.set(token, {
        value: token,
        label: getRevisionWorkspaceSubjectDisplayLabel(token, 'General'),
        count: 1,
      });
    });
    return Array.from(options.values()).sort((left, right) =>
      compareAlphabetical(left.label, right.label)
    );
  }, [workspaceTypeAndScopeItems]);
  const workspaceSubjectOriginGroups = React.useMemo(
    () => {
      const grouped = new Map<
        RevisionSubjectOrigin,
        { key: RevisionSubjectOrigin; label: string; totalCount: number; options: Array<{ value: string; label: string; count: number }> }
      >();
      workspaceSubjectOptionCounts.forEach((option) => {
        const originKey = resolveRevisionSubjectOrigin(option.value);
        const existing = grouped.get(originKey);
        if (existing) {
          existing.totalCount += option.count;
          existing.options.push(option);
          return;
        }
        grouped.set(originKey, {
          key: originKey,
          label: getRevisionSubjectOriginLabel(originKey),
          totalCount: option.count,
          options: [option],
        });
      });
      const order: RevisionSubjectOrigin[] = ['stem', 'language', 'humanities', 'applied', 'general'];
      return order
        .map((key) => grouped.get(key))
        .filter(Boolean)
        .map((entry) => ({
          ...entry!,
          options: [...entry!.options].sort((left, right) => compareAlphabetical(left.label, right.label)),
        }));
    },
    [workspaceSubjectOptionCounts]
  );
  const workspaceSubjectOptions = React.useMemo(
    () => workspaceSubjectOptionCounts.map((option) => option.value),
    [workspaceSubjectOptionCounts]
  );
  React.useEffect(() => {
    if (
      workspaceSubjectFilter !== 'all' &&
      !workspaceSubjectOptions.includes(workspaceSubjectFilter)
    ) {
      setWorkspaceSubjectFilter('all');
    }
  }, [workspaceSubjectFilter, workspaceSubjectOptions]);
  const workspaceHasActiveFilters =
    workspaceScopeFilter !== 'all' ||
    workspaceTypeFilter !== 'all' ||
    workspaceSubjectFilter !== 'all';
  const filteredWorkspaceItems = React.useMemo(() => {
    const subjectFilterToken =
      workspaceSubjectFilter === 'all' ? null : getNormalizedFilterToken(workspaceSubjectFilter);

    return workspaceTypeAndScopeItems.filter((item) => {
      const matchesSubject = subjectFilterToken
        ? getNormalizedFilterToken(item.subject) === subjectFilterToken
        : true;
      return matchesSubject;
    });
  }, [
    workspaceSubjectFilter,
    workspaceTypeAndScopeItems,
  ]);
  const workspaceSmartScopePresets = React.useMemo(
    () =>
      [
        {
          id: 'due_now',
          label: 'Due now',
          scope: 'due_now' as RevisionWorkspaceScopeFilter,
          icon: Clock3,
          tone: 'due' as const,
          count: workspaceFilterBaseItems.filter((item) =>
            matchesWorkspaceScopeFilter(item, 'due_now')
          ).length,
        },
        {
          id: 'mistake_fixes',
          label: 'Fix mistakes',
          scope: 'mistake_fixes' as RevisionWorkspaceScopeFilter,
          icon: AlertCircle,
          tone: 'fix' as const,
          count: workspaceFilterBaseItems.filter((item) =>
            matchesWorkspaceScopeFilter(item, 'mistake_fixes')
          ).length,
        },
        {
          id: 'needs_practice',
          label: 'Practice',
          scope: 'needs_practice' as RevisionWorkspaceScopeFilter,
          icon: NotebookPen,
          tone: 'practice' as const,
          count: workspaceFilterBaseItems.filter((item) =>
            matchesWorkspaceScopeFilter(item, 'needs_practice')
          ).length,
        },
        {
          id: 'pinned',
          label: 'Pinned',
          scope: 'pinned' as RevisionWorkspaceScopeFilter,
          icon: Pin,
          tone: 'pinned' as const,
          count: workspaceFilterBaseItems.filter((item) =>
            matchesWorkspaceScopeFilter(item, 'pinned')
          ).length,
        },
        {
          id: 'recently_improved',
          label: 'Momentum',
          scope: 'recently_improved' as RevisionWorkspaceScopeFilter,
          icon: TrendingUp,
          tone: 'momentum' as const,
          count: workspaceFilterBaseItems.filter((item) =>
            matchesWorkspaceScopeFilter(item, 'recently_improved')
          ).length,
        },
      ].filter((preset) => preset.count > 0),
    [matchesWorkspaceScopeFilter, workspaceFilterBaseItems]
  );
  React.useEffect(() => {
    const availableOrigins = new Set(workspaceSubjectOriginGroups.map((group) => group.key));
    setExpandedSubjectOriginGroups((previous) => {
      const next = previous.filter((key) => availableOrigins.has(key));
      if (next.length || workspaceSubjectOriginGroups.length === 0) return next;
      return workspaceSubjectOriginGroups
        .slice(0, Math.min(1, workspaceSubjectOriginGroups.length))
        .map((group) => group.key);
    });
  }, [workspaceSubjectOriginGroups]);
  const toggleExpandedSubjectOrigin = React.useCallback((originKey: RevisionSubjectOrigin) => {
    setExpandedSubjectOriginGroups((previous) =>
      previous.includes(originKey)
        ? previous.filter((key) => key !== originKey)
        : [...previous, originKey]
    );
  }, []);
  const hasCollectionError = Boolean(
    errorMessage &&
      selectedCollection &&
      !isCollectionLoading &&
      collectionItems.length === 0 &&
      !selectedItem
  );

  const renderState: RevisionRenderState = React.useMemo(() => {
    if (
      (selectedCollection &&
        isCollectionLoading &&
        collectionItems.length === 0) ||
      (isLoading && !overview)
    ) {
      return 'loading';
    }
    if ((errorMessage && !hasOverviewContent && !selectedCollection) || hasCollectionError) {
      return 'error';
    }
    if (selectedItem) return 'item_selected';
    if (selectedCollection) return 'list_selected';
    if (!hasOverviewContent) return 'empty';
    return 'overview';
  }, [
    collectionItems.length,
    errorMessage,
    hasCollectionError,
    hasOverviewContent,
    isCollectionLoading,
    isLoading,
    overview,
    selectedCollection,
    selectedItem,
  ]);
  const showQueuePreview =
    !searchQuery.trim() &&
    Boolean(
      queuePreview &&
        (queuePreview.dueNow.length ||
          queuePreview.needsAttention.length ||
          queuePreview.recentlyImproved.length)
    );
  const isPanelMode = layoutMode === 'panel';
  const panelCollections = (overview?.collections || []).slice(0, 2);
  const panelRecentItems = (overview?.recentItems || []).slice(0, 3);
  const overviewCollections = isPanelMode ? panelCollections : overview?.collections || [];
  const overviewRecentItems = isPanelMode ? panelRecentItems : overview?.recentItems || [];
  const pinnedPreviewItems = (overview?.pinnedItems || []).slice(0, 3);
  const workspacePriorityItem =
    queuePreview?.dueNow[0] ||
    queuePreview?.needsAttention[0] ||
    overview?.pinnedItems?.[0] ||
    overview?.recentItems?.[0] ||
    null;
  const workspacePriorityLabel = workspacePriorityItem
    ? queuePreview?.dueNow[0]?.id === workspacePriorityItem.id
      ? 'Due now'
      : queuePreview?.needsAttention[0]?.id === workspacePriorityItem.id
      ? 'Needs attention'
      : overview?.pinnedItems?.some((item) => item.id === workspacePriorityItem.id)
      ? 'Pinned'
      : 'Start here'
    : null;
  const workspacePriorityDescription = workspacePriorityItem
    ? workspacePriorityLabel === 'Due now'
      ? 'Open and run one recall pass.'
      : workspacePriorityLabel === 'Needs attention'
      ? 'Open and repair the weak step now.'
      : workspacePriorityLabel === 'Pinned'
      ? 'Resume this anchor note.'
      : 'Open and take one action.'
    : null;
  const workspaceSubjectLabel = React.useMemo(() => {
    if (selectedItem?.subject) return getRevisionWorkspaceSubjectDisplayLabel(selectedItem.subject);
    if (selectedCollection?.subject) return getRevisionWorkspaceSubjectDisplayLabel(selectedCollection.subject);
    const fallbackPool = selectedCollection ? orderedCollectionItems : allWorkspaceItems;
    const subjectCandidate =
      fallbackPool.find((item) => item.subject)?.subject ||
      allWorkspaceItems.find((item) => item.subject)?.subject;
    return getRevisionWorkspaceSubjectDisplayLabel(subjectCandidate);
  }, [allWorkspaceItems, orderedCollectionItems, selectedCollection, selectedCollection?.subject, selectedItem?.subject]);
  const breadcrumbCollectionLabel = selectedItem
    ? null
    : resolveDistinctNotebookLabel({
        notebookLabel: selectedCollection?.title || null,
        itemTitle: null,
        fallbackTopic: selectedCollection?.topic || null,
      });
  const workspaceBreadcrumbs = [
    {
      label: workspaceSubjectLabel,
      active: !selectedCollection && !selectedItem,
      onClick:
        selectedCollection || selectedItem
          ? () => {
              onSelectCollection(null);
              setEffectiveSelectedItemId(null);
            }
          : undefined,
    },
    ...(breadcrumbCollectionLabel
      ? [
           {
              label: breadcrumbCollectionLabel,
              active: Boolean(breadcrumbCollectionLabel) && !selectedItem,
              onClick:
                selectedItem && selectedCollection
                ? () => {
                    const rememberedEntryItemId =
                      notebookEntryItemIdByCollectionRef.current[selectedCollection.id] || null;
                    const fallbackItemId =
                      orderedCollectionItems.find((entry) => entry.id !== selectedItem.id)?.id ||
                      orderedCollectionItems[0]?.id ||
                      selectedItem.id;
                    setEffectiveSelectedItemId(
                      rememberedEntryItemId && itemMap.has(rememberedEntryItemId)
                        ? rememberedEntryItemId
                        : fallbackItemId
                    );
                  }
                : undefined,
            },
        ]
      : []),
    ...(selectedItem
      ? [
          {
            label: selectedItem.title,
            active: true,
            onClick: undefined,
          },
        ]
      : []),
  ];
  const workspaceNoteNotebookLabel = React.useMemo(
    () =>
      resolveDistinctNotebookLabel({
        notebookLabel:
          activeItemCollection?.title ||
          selectedItem?.collectionTitle ||
          selectedCollection?.title ||
          null,
        itemTitle: selectedItem?.title || null,
        fallbackTopic:
          activeItemCollection?.topic ||
          selectedCollection?.topic ||
          selectedItem?.topic ||
          null,
      }),
    [
      activeItemCollection?.title,
      activeItemCollection?.topic,
      selectedCollection?.title,
      selectedCollection?.topic,
      selectedItem?.collectionTitle,
      selectedItem?.title,
      selectedItem?.topic,
    ]
  );
  const openSelectedItemNotebook = React.useCallback(() => {
    if (!selectedItem?.collectionId) return;
    if (activeItemCollection && selectedCollection?.id !== activeItemCollection.id) {
      onSelectCollection(activeItemCollection);
    }
    setEffectiveSelectedItemId(null);
  }, [
    activeItemCollection,
    onSelectCollection,
    selectedCollection?.id,
    selectedItem?.collectionId,
    setEffectiveSelectedItemId,
  ]);
  const workspaceNoteBreadcrumbs = React.useMemo(
    () =>
      selectedItem && workspaceNoteNotebookLabel
        ? [
            {
              label: workspaceNoteNotebookLabel,
              active: !selectedItem.collectionId,
              onClick: selectedItem.collectionId ? openSelectedItemNotebook : undefined,
            },
          ]
        : [],
    [openSelectedItemNotebook, selectedItem, workspaceNoteNotebookLabel]
  );
  const workspaceNoteSubjectLabel = React.useMemo(() => {
    const subjectValue = activeItemCollection?.subject || selectedItem?.subject || null;
    return getNormalizedFilterToken(subjectValue)
      ? getRevisionWorkspaceSubjectDisplayLabel(subjectValue, 'General')
      : null;
  }, [activeItemCollection?.subject, selectedItem?.subject]);
  React.useEffect(() => {
    const currentCollectionId = selectedItem?.collectionId || null;
    const previousCollectionId = previousSelectedNotebookItemRef.current.collectionId;

    if (selectedItem?.collectionId && currentCollectionId !== previousCollectionId) {
      notebookEntryItemIdByCollectionRef.current[selectedItem.collectionId] = selectedItem.id;
    }

    previousSelectedNotebookItemRef.current = {
      itemId: selectedItem?.id || null,
      collectionId: currentCollectionId,
    };
  }, [selectedItem]);
  React.useEffect(() => {
    const currentCollectionId = selectedCollection?.id || selectedItem?.collectionId || null;
    const pendingTransition = notebookBrowseTransitionRef.current;

    if (pendingTransition?.targetCollectionId && pendingTransition.targetCollectionId === currentCollectionId) {
      if (pendingTransition.mode === 'return') {
        notebookBrowseOriginRef.current = null;
      }
      notebookBrowseTransitionRef.current = null;
      return;
    }

    if (pendingTransition && !pendingTransition.targetCollectionId && !currentCollectionId) {
      notebookBrowseTransitionRef.current = null;
      notebookBrowseOriginRef.current = null;
      return;
    }

    if (!pendingTransition && currentCollectionId === null) {
      notebookBrowseOriginRef.current = null;
      return;
    }

  }, [selectedCollection?.id, selectedItem?.collectionId]);
  const selectedItemNavigationItems = React.useMemo(() => {
    if (!selectedItem) return [] as RevisionItem[];
    if (!selectedItem.collectionId) return [selectedItem];

    if (selectedCollection?.id === selectedItem.collectionId && orderedCollectionItems.length) {
      return orderedCollectionItems;
    }

    return sortRevisionItemsForNotebook(
      allWorkspaceItems.filter((entry) => entry.collectionId === selectedItem.collectionId)
    );
  }, [allWorkspaceItems, orderedCollectionItems, selectedCollection?.id, selectedItem]);
  const selectedItemNavigation = React.useMemo(() => {
    if (!selectedItem) return null;
    const list = selectedItemNavigationItems;
    if (!list.length) return null;
    const currentIndex = list.findIndex((entry) => entry.id === selectedItem.id);
    if (currentIndex < 0) return null;
    return {
      currentIndex,
      total: list.length,
      previousId: currentIndex > 0 ? list[currentIndex - 1].id : null,
      nextId: currentIndex < list.length - 1 ? list[currentIndex + 1].id : null,
    };
  }, [selectedItem, selectedItemNavigationItems]);
  const activeNotebookHeaderCollection = selectedCollection || activeItemCollection;
  const notebookNavigationCollections = React.useMemo(() => {
    if (!activeNotebookHeaderCollection) return [] as RevisionCollection[];
    return allCollections;
  }, [activeNotebookHeaderCollection, allCollections]);
  const notebookHeaderNavigation = React.useMemo(() => {
    if (!activeNotebookHeaderCollection || !notebookNavigationCollections.length) return null;
    const currentIndex = notebookNavigationCollections.findIndex((collection) => collection.id === activeNotebookHeaderCollection.id);
    if (currentIndex < 0) return null;
    return {
      currentIndex,
      total: notebookNavigationCollections.length,
      previousId: currentIndex > 0 ? notebookNavigationCollections[currentIndex - 1].id : null,
      nextId: currentIndex < notebookNavigationCollections.length - 1 ? notebookNavigationCollections[currentIndex + 1].id : null,
    };
  }, [activeNotebookHeaderCollection, notebookNavigationCollections]);
  const resolveNotebookHeaderFocusItemId = React.useCallback(
    (collectionId: string) => {
      const previewItems =
        allCollections.find((collection) => collection.id === collectionId)?.previewItems || [];
      const candidateItems =
        selectedCollection?.id === collectionId && orderedCollectionItems.length
          ? orderedCollectionItems
          : sortRevisionItemsForNotebook(
              Array.from(
                new Map(
                  [...previewItems, ...allWorkspaceItems.filter((entry) => entry.collectionId === collectionId)].map((entry) => [
                    entry.id,
                    entry,
                  ])
                ).values()
              )
            );
      if (!candidateItems.length) return null;
      const preferredIndex = selectedItemNavigation?.currentIndex ?? 0;
      return candidateItems[Math.min(preferredIndex, candidateItems.length - 1)]?.id || candidateItems[0]?.id || null;
    },
    [
      allCollections,
      allWorkspaceItems,
      orderedCollectionItems,
      selectedCollection?.id,
      selectedItemNavigation?.currentIndex,
    ]
  );
  const navigateToNotebookCollectionAndItem = React.useCallback(
    (
      collectionId: string | null,
      itemId: string | null,
      mode?: 'browse' | 'return'
    ) => {
      if (!collectionId) return;
      const targetCollection = allCollections.find((collection) => collection.id === collectionId);
      if (!targetCollection) return;
      if (mode) {
        notebookBrowseTransitionRef.current = {
          mode,
          targetCollectionId: collectionId,
        };
      }
      onSelectCollection(targetCollection);
      setEffectiveSelectedItemId(itemId);
    },
    [allCollections, onSelectCollection, setEffectiveSelectedItemId]
  );
  const navigateToNotebookHeaderCollection = React.useCallback(
    (collectionId: string | null) => {
      if (!collectionId) return;
      const activeCollectionId = selectedItem?.collectionId || activeNotebookHeaderCollection?.id || null;
      if (
        !notebookBrowseOriginRef.current &&
        activeCollectionId &&
        activeCollectionId !== collectionId
      ) {
        notebookBrowseOriginRef.current = {
          collectionId: activeCollectionId,
          itemId:
            notebookEntryItemIdByCollectionRef.current[activeCollectionId] ||
            (selectedItem?.collectionId === activeCollectionId ? selectedItem.id : null),
        };
      }
      const nextFocusItemId = selectedItem ? resolveNotebookHeaderFocusItemId(collectionId) : null;
      navigateToNotebookCollectionAndItem(collectionId, nextFocusItemId, 'browse');
    },
    [
      activeNotebookHeaderCollection?.id,
      navigateToNotebookCollectionAndItem,
      resolveNotebookHeaderFocusItemId,
      selectedItem,
      selectedItem?.collectionId,
    ]
  );
  const goToPreviousWorkspaceItem = React.useCallback(() => {
    if (!selectedItemNavigation?.previousId) return;
    setEffectiveSelectedItemId(selectedItemNavigation.previousId);
  }, [selectedItemNavigation, setEffectiveSelectedItemId]);
  const goToNextWorkspaceItem = React.useCallback(() => {
    if (!selectedItemNavigation?.nextId) return;
    setEffectiveSelectedItemId(selectedItemNavigation.nextId);
  }, [selectedItemNavigation, setEffectiveSelectedItemId]);
  const goToPreviousNotebookHeader = React.useCallback(() => {
    if (!notebookHeaderNavigation?.previousId) return;
    navigateToNotebookHeaderCollection(notebookHeaderNavigation.previousId);
  }, [navigateToNotebookHeaderCollection, notebookHeaderNavigation]);
  const goToNextNotebookHeader = React.useCallback(() => {
    if (!notebookHeaderNavigation?.nextId) return;
    navigateToNotebookHeaderCollection(notebookHeaderNavigation.nextId);
  }, [navigateToNotebookHeaderCollection, notebookHeaderNavigation]);
  const handleReturnToNotebookEntry = React.useCallback(() => {
    if (!selectedCollection) {
      notebookBrowseTransitionRef.current = {
        mode: 'return',
        targetCollectionId: null,
      };
      notebookBrowseOriginRef.current = null;
      setEffectiveSelectedItemId(null);
      return;
    }

    const targetCollectionId = notebookBrowseOriginRef.current?.collectionId || selectedCollection.id;
    const rememberedEntryItemId =
      (targetCollectionId ? notebookEntryItemIdByCollectionRef.current[targetCollectionId] : null) ||
      notebookBrowseOriginRef.current?.itemId ||
      null;
    const targetCollectionItems =
      targetCollectionId === selectedCollection.id
        ? orderedCollectionItems
        : sortRevisionItemsForNotebook(allWorkspaceItems.filter((entry) => entry.collectionId === targetCollectionId));
    const fallbackItemId =
      targetCollectionItems.find((entry) => entry.id !== selectedItem?.id)?.id ||
      targetCollectionItems[0]?.id ||
      (selectedItem?.collectionId === targetCollectionId ? selectedItem.id : null);
    const targetItemId =
      rememberedEntryItemId && itemMap.has(rememberedEntryItemId) ? rememberedEntryItemId : fallbackItemId;

    if (targetCollectionId && targetCollectionId !== selectedCollection.id) {
      navigateToNotebookCollectionAndItem(targetCollectionId, targetItemId, 'return');
      return;
    }

    if (targetItemId) {
      setEffectiveSelectedItemId(targetItemId);
      notebookBrowseOriginRef.current = null;
      return;
    }

    notebookBrowseOriginRef.current = null;
    setEffectiveSelectedItemId(null);
  }, [
    allWorkspaceItems,
    itemMap,
    navigateToNotebookCollectionAndItem,
    orderedCollectionItems,
    selectedCollection,
    selectedItem?.collectionId,
    selectedItem?.id,
    setEffectiveSelectedItemId,
  ]);
  const showBackToNotebookOrigin = Boolean(
    selectedCollection &&
      notebookBrowseOriginRef.current?.collectionId &&
      notebookBrowseOriginRef.current.collectionId !== selectedCollection.id
  );
  React.useEffect(() => {
    if (isNotebookSlideshowOpen) return;
    if (!selectedItemNavigation) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (event.key === 'ArrowLeft' && selectedItemNavigation.previousId) {
        event.preventDefault();
        setEffectiveSelectedItemId(selectedItemNavigation.previousId);
      }
      if (event.key === 'ArrowRight' && selectedItemNavigation.nextId) {
        event.preventDefault();
        setEffectiveSelectedItemId(selectedItemNavigation.nextId);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isNotebookSlideshowOpen, selectedItemNavigation, setEffectiveSelectedItemId]);

  React.useEffect(() => {
    if (!isNotebookSlideshowOpen) return;
    const goToSlideIndex = (nextIndex: number) => {
      if (!notebookSlideshowNoteIds.length) {
        setNotebookSlideshowIndex(0);
        setNotebookSlideshowActiveNoteId(null);
        return;
      }
      const clampedIndex = Math.max(0, Math.min(nextIndex, notebookSlideshowNoteIds.length - 1));
      setNotebookSlideshowIndex(clampedIndex);
      setNotebookSlideshowActiveNoteId(notebookSlideshowNoteIds[clampedIndex] || null);
    };
    const goToSlideDelta = (delta: -1 | 1) => {
      if (notebookSlideshowNoteIds.length <= 1) return;
      const total = notebookSlideshowNoteIds.length;
      const nextIndex =
        delta > 0
          ? notebookSlideshowIndex >= total - 1
            ? 0
            : notebookSlideshowIndex + 1
          : notebookSlideshowIndex <= 0
            ? total - 1
            : notebookSlideshowIndex - 1;
      goToSlideIndex(nextIndex);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = (target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setIsNotebookSlideshowOpen(false);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToSlideDelta(1);
        return;
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToSlideDelta(-1);
        return;
      }
      if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        goToSlideDelta(1);
        return;
      }
      if (event.key === 'Home') {
        event.preventDefault();
        goToSlideIndex(0);
        return;
      }
      if (event.key === 'End') {
        event.preventDefault();
        goToSlideIndex(Math.max(notebookSlideshowNoteIds.length - 1, 0));
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    isNotebookSlideshowOpen,
    notebookSlideshowIndex,
    notebookSlideshowNoteIds,
  ]);

  const scrollWorkspaceDetail = React.useCallback((position: 'top' | 'bottom', behavior: ScrollBehavior = 'smooth') => {
    if (!workspaceDetailRef.current) return;
    const target = position === 'top' ? 0 : workspaceDetailRef.current.scrollHeight;
    workspaceDetailRef.current.scrollTo({ top: target, behavior });
  }, []);

  const runRevisionMode = React.useCallback(
    async (context: { collectionId?: string; itemId?: string }, options?: SteadfastLaunchOptions) => {
      if (!onReviseWithSteadfast || isStartingRevisionMode) return;
      setGuidedLaunchContext(context);
      setIsGuidedEngineModalOpen(true);
      setIsStartingRevisionMode(true);
      try {
        setGuidedSessionError('');
        const session = await onReviseWithSteadfast(context);
        if (!session) {
          setIsGuidedEngineModalOpen(false);
          return;
        }
        setEffectiveSelectedItemId(session.item.id);
        setGuidedRevisionSession(session);
        setGuidedResponseDraft('');
        setGuidedFeedbackText('');
        setGuidedSaveDraft(session.item.studentNote || '');
        if (options?.scrollToResponse) {
          requestAnimationFrame(() => {
            scrollWorkspaceDetail('top');
          });
        }
        if (options?.starterResponse || options?.supportAction) {
          setIsGuidedStepLoading(true);
          try {
            const progress = await api.revision.respondGuidedSession(session.sessionId, {
              itemId: session.item.id,
              stage: session.currentStep.stage,
              responseText: options.starterResponse?.trim() || undefined,
              supportAction: options.supportAction,
            });
            setGuidedRevisionSession((previous) => {
              if (!previous) return previous;
              const fallbackCompletedStep = {
                stage: 'completed' as const,
                prompt: 'Session complete. Choose your next revision move.',
                helperText: 'You can save one short reminder or open another item.',
                inputPlaceholder: null,
                requiresInput: false,
                ctaLabel: 'Done',
              };
              return {
                ...previous,
                currentStep: progress.currentStep || fallbackCompletedStep,
                masteryLabel: progress.masteryLabel ?? previous.masteryLabel ?? null,
                weakTopicRecovery: progress.weakTopicRecovery ?? null,
              };
            });
            setGuidedFeedbackText(progress.feedbackText || '');
            setGuidedResponseDraft('');
            setGuidedSessionError('');
            if (options?.scrollToResponse) {
              requestAnimationFrame(() => {
                scrollWorkspaceDetail('top');
              });
            }
          } catch (error) {
            const message =
              error instanceof ApiError
                ? error.message
                : error instanceof Error
                  ? error.message
                  : 'Could not start the guided action.';
            setGuidedSessionError(message);
          } finally {
            setIsGuidedStepLoading(false);
          }
        }
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not start guided revision right now.';
        setGuidedSessionError(message);
      } finally {
        setIsStartingRevisionMode(false);
      }
    },
    [isStartingRevisionMode, onReviseWithSteadfast, scrollWorkspaceDetail, setEffectiveSelectedItemId]
  );

  const handleSteadfastLaunch = React.useCallback(
    async (args: {
      item: RevisionItem;
      intent: SteadfastLaunchIntent;
      lens: RevisionDocumentLens;
      selectedSnippet?: string;
      starterResponse?: string;
      supportAction?: GuidedRevisionSupportAction;
    }) => {
      const plan = buildSteadfastLaunchPlan({
        item: args.item,
        lens: args.lens,
        intent: args.intent,
        selectedSnippet: args.selectedSnippet,
      });
      const collectionId = args.item.collectionId || selectedCollection?.id || undefined;
      await runRevisionMode(
        { itemId: args.item.id, collectionId },
        {
          starterResponse: args.starterResponse || plan.starterResponse,
          supportAction: args.supportAction || plan.supportAction,
          scrollToResponse: true,
        }
      );
    },
    [runRevisionMode, selectedCollection?.id]
  );

  const applyGuidedRevisionProgress = React.useCallback(
    (progress: GuidedRevisionSessionProgressResult) => {
      setGuidedRevisionSession((previous) => {
        if (!previous) return previous;
        const fallbackCompletedStep = {
          stage: 'completed' as const,
          prompt: 'Session complete. Choose your next revision move.',
          helperText: 'You can save one short reminder or open another item.',
          inputPlaceholder: null,
          requiresInput: false,
          ctaLabel: 'Done',
        };
        return {
          ...previous,
          currentStep: progress.currentStep || fallbackCompletedStep,
          masteryLabel: progress.masteryLabel ?? previous.masteryLabel ?? null,
          weakTopicRecovery: progress.weakTopicRecovery ?? null,
        };
      });
      setGuidedFeedbackText(progress.feedbackText || '');
      setGuidedSessionError('');
      setGuidedResponseDraft('');
    },
    []
  );

  const handleGuidedSubmitStep = React.useCallback(async () => {
    if (!guidedRevisionSession || isGuidedStepLoading) return;
    const currentStep = guidedRevisionSession.currentStep;
    if (currentStep.requiresInput && !guidedResponseDraft.trim()) {
      setGuidedSessionError('Write a short answer first.');
      return;
    }
    setIsGuidedStepLoading(true);
    setGuidedSessionError('');
    try {
      const progress = await api.revision.respondGuidedSession(guidedRevisionSession.sessionId, {
        itemId: guidedRevisionSession.item.id,
        stage: currentStep.stage,
        responseText: guidedResponseDraft.trim() || undefined,
      });
      applyGuidedRevisionProgress(progress);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not continue guided revision right now.';
      setGuidedSessionError(message);
    } finally {
      setIsGuidedStepLoading(false);
    }
  }, [
    applyGuidedRevisionProgress,
    guidedResponseDraft,
    guidedRevisionSession,
    isGuidedStepLoading,
  ]);

  const handleGuidedSupportAction = React.useCallback(
    async (supportAction: GuidedRevisionSupportAction) => {
      if (!guidedRevisionSession || isGuidedStepLoading) return;
      setIsGuidedStepLoading(true);
      setGuidedSessionError('');
      try {
        const progress = await api.revision.respondGuidedSession(guidedRevisionSession.sessionId, {
          itemId: guidedRevisionSession.item.id,
          stage: guidedRevisionSession.currentStep.stage,
          responseText: guidedResponseDraft.trim() || undefined,
          supportAction,
        });
        applyGuidedRevisionProgress(progress);
      } catch (error) {
        const message =
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Could not apply that support action.';
        setGuidedSessionError(message);
      } finally {
        setIsGuidedStepLoading(false);
      }
    },
    [
      applyGuidedRevisionProgress,
      guidedResponseDraft,
      guidedRevisionSession,
      isGuidedStepLoading,
    ]
  );

  const handleCloseGuidedRevision = React.useCallback(() => {
    setIsGuidedEngineModalOpen(false);
    setGuidedLaunchContext(null);
    setGuidedRevisionSession(null);
    setGuidedResponseDraft('');
    setGuidedFeedbackText('');
    setGuidedSessionError('');
    setGuidedSaveDraft('');
  }, []);
  const handleRetryGuidedLaunch = React.useCallback(() => {
    if (!guidedLaunchContext || isStartingRevisionMode) return;
    void runRevisionMode(guidedLaunchContext);
  }, [guidedLaunchContext, isStartingRevisionMode, runRevisionMode]);
  const handleSeedGuidedPrompt = React.useCallback((prompt: string) => {
    setGuidedResponseDraft(prompt);
    setGuidedSessionError('');
  }, []);
  const handleStartLinkedGuidedConcept = React.useCallback(
    (itemId: string) => {
      if (!itemId) return;
      setEffectiveSelectedItemId(itemId);
      void runRevisionMode({ itemId });
    },
    [runRevisionMode, setEffectiveSelectedItemId]
  );

  const handleSaveGuidedRevisionUpdate = React.useCallback(async () => {
    if (!guidedRevisionSession || isGuidedSaveLoading || !onSaveStudentNote) return;
    setIsGuidedSaveLoading(true);
    setGuidedSessionError('');
    try {
      await onSaveStudentNote(guidedRevisionSession.item, guidedSaveDraft);
      setGuidedFeedbackText('Saved your update to this revision item.');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not save your note update right now.';
      setGuidedSessionError(message);
    } finally {
      setIsGuidedSaveLoading(false);
    }
  }, [guidedRevisionSession, guidedSaveDraft, isGuidedSaveLoading, onSaveStudentNote]);

  const commitRevisionBatchUpdates = React.useCallback(async (
    updates: Array<{ itemId: string; patch: UpdateRevisionItemRequest }>
  ) => {
    if (!updates.length) return;
    if (onUpdateItemsBatch) {
      await onUpdateItemsBatch(updates);
      return;
    }
    if (!onUpdateItem) return;
    for (const update of updates) {
      const item = itemMap.get(update.itemId);
      if (!item) continue;
      // Fallback path when the parent does not expose the batch updater.
      await onUpdateItem(item, update.patch);
    }
  }, [itemMap, onUpdateItem, onUpdateItemsBatch]);

  const persistNotebookOrder = React.useCallback(async (orderedIds: string[]) => {
    if (!selectedCollection || orderedIds.length === 0 || isNotebookReordering) return;
    setIsNotebookReordering(true);
    setNotebookOrderError('');
    try {
      await commitRevisionBatchUpdates(
        orderedIds.map((itemId, index) => ({
          itemId,
          patch: {
            collectionId: selectedCollection.id,
            featuredRank: index + 1,
          },
        }))
      );
      setDraggedNotebookItemId(null);
      setDragOverNotebookItemId(null);
      setDragOverCollectionId(null);
    } catch (error) {
      setNotebookOrderError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not save the new note order.'
      );
    } finally {
      setIsNotebookReordering(false);
    }
  }, [commitRevisionBatchUpdates, isNotebookReordering, selectedCollection]);

  const moveNotebookItemByOffset = React.useCallback(async (itemId: string, direction: -1 | 1) => {
    const currentIndex = orderedCollectionItems.findIndex((item) => item.id === itemId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= orderedCollectionItems.length) return;
    const nextIds = orderedCollectionItems.map((item) => item.id);
    const [movedId] = nextIds.splice(currentIndex, 1);
    nextIds.splice(targetIndex, 0, movedId);
    await persistNotebookOrder(nextIds);
  }, [orderedCollectionItems, persistNotebookOrder]);

  const toggleNotebookSelection = React.useCallback((item: RevisionItem) => {
    setSelectedNotebookItemIds((previous) =>
      previous.includes(item.id)
        ? previous.filter((entry) => entry !== item.id)
        : [...previous, item.id]
    );
  }, []);

  const handleBulkMoveSelectedNotebookItems = React.useCallback(async () => {
    if (!selectedNotebookItemIds.length || isBulkMovingItems) return;
    const selectedItems = orderedCollectionItems.filter((item) => selectedNotebookItemIds.includes(item.id));
    if (!selectedItems.length) return;

    setIsBulkMovingItems(true);
    setNotebookMoveError('');
    try {
      let targetCollectionId = bulkMoveTargetCollectionId;
      let createdCollection: RevisionCollection | null = null;

      if (targetCollectionId === '__create__') {
        const notebookTitle = bulkMoveNewNotebookTitle.trim();
        if (!notebookTitle) return;
        createdCollection = await api.revision.createCollection({
          title: notebookTitle,
          subject: selectedCollection?.subject || selectedItems[0]?.subject || null,
          topic: selectedCollection?.topic || selectedItems[0]?.topic || null,
          description:
            selectedCollection?.description ||
            `Organized from ${selectedCollection?.title || `${workspaceSubjectLabel} notes`}.`,
        });
        targetCollectionId = createdCollection.id;
      }

      if (targetCollectionId === selectedCollection?.id) {
        setNotebookSelectionMode(false);
        setSelectedNotebookItemIds([]);
        return;
      }

      const normalizedTargetCollectionId =
        targetCollectionId === '__standalone__' ? null : targetCollectionId || null;
      const targetExistingItems = normalizedTargetCollectionId
        ? sortRevisionItemsForNotebook(
            normalizedTargetCollectionId === selectedCollection?.id
              ? orderedCollectionItems.filter((item) => !selectedNotebookItemIds.includes(item.id))
              : allWorkspaceItems.filter((item) => item.collectionId === normalizedTargetCollectionId)
          )
        : [];
      const startRank = normalizedTargetCollectionId ? targetExistingItems.length : 0;

      await commitRevisionBatchUpdates(
        selectedItems.map((item, index) => ({
          itemId: item.id,
          patch: {
            collectionId: normalizedTargetCollectionId,
            featuredRank: normalizedTargetCollectionId ? startRank + index + 1 : null,
          },
        }))
      );

      setNotebookSelectionMode(false);
      setSelectedNotebookItemIds([]);
      setBulkMoveNewNotebookTitle('');
      setBulkMoveTargetCollectionId('__standalone__');

      if (normalizedTargetCollectionId) {
        const targetCollection =
          createdCollection ||
          allCollections.find((collection) => collection.id === normalizedTargetCollectionId) ||
          null;
        if (targetCollection) onSelectCollection(targetCollection);
      }
    } catch (error) {
      setNotebookMoveError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not move these notes right now.'
      );
    } finally {
      setIsBulkMovingItems(false);
    }
  }, [
    allCollections,
    allWorkspaceItems,
    bulkMoveNewNotebookTitle,
    bulkMoveTargetCollectionId,
    commitRevisionBatchUpdates,
    isBulkMovingItems,
    onSelectCollection,
    orderedCollectionItems,
    selectedCollection,
    selectedNotebookItemIds,
  ]);

  const openQuickNotesEditor = React.useCallback((item: RevisionItem) => {
    setQuickNotesEditorItemId(item.id);
    setQuickNoteDraft('');
    setQuickNotesError('');
  }, []);

  const handleAddQuickNote = React.useCallback(async () => {
    if (!quickNotesEditorItem || !onUpdateItem || isQuickNoteSaving) return;
    const normalized = normalizeRevisionQuickNoteText(quickNoteDraft);
    if (!normalized) return;
    setIsQuickNoteSaving(true);
    setQuickNotesError('');
    try {
      const existingNotes = getRevisionQuickNotesFromItem(quickNotesEditorItem);
      const nextQuickNotes = [buildRevisionQuickNote(normalized), ...existingNotes].slice(0, REVISION_QUICK_NOTE_MAX);
      await onUpdateItem(quickNotesEditorItem, {
        metadataPatch: {
          [REVISION_QUICK_NOTES_KEY]: nextQuickNotes,
        },
      });
      setQuickNoteDraft('');
    } catch (error) {
      setQuickNotesError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not add that quick note right now.'
      );
    } finally {
      setIsQuickNoteSaving(false);
    }
  }, [isQuickNoteSaving, onUpdateItem, quickNoteDraft, quickNotesEditorItem]);

  const handleRemoveQuickNote = React.useCallback(async (
    quickNoteId: string
  ) => {
    if (!quickNotesEditorItem || !onUpdateItem || isQuickNoteSaving) return;
    const nextQuickNotes = getRevisionQuickNotesFromItem(quickNotesEditorItem).filter((entry) => entry.id !== quickNoteId);
    setIsQuickNoteSaving(true);
    setQuickNotesError('');
    try {
      await onUpdateItem(quickNotesEditorItem, {
        metadataPatch: {
          [REVISION_QUICK_NOTES_KEY]: nextQuickNotes,
        },
      });
    } catch (error) {
      setQuickNotesError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not remove that quick note right now.'
      );
    } finally {
      setIsQuickNoteSaving(false);
    }
  }, [isQuickNoteSaving, onUpdateItem, quickNotesEditorItem]);

  const handleReorderQuickNote = React.useCallback(async (
    quickNoteId: string,
    direction: -1 | 1
  ) => {
    if (!quickNotesEditorItem || !onUpdateItem || isQuickNoteSaving) return;
    const currentNotes = getRevisionQuickNotesFromItem(quickNotesEditorItem);
    const currentIndex = currentNotes.findIndex((entry) => entry.id === quickNoteId);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= currentNotes.length) return;

    const nextQuickNotes = [...currentNotes];
    const [movedQuickNote] = nextQuickNotes.splice(currentIndex, 1);
    nextQuickNotes.splice(targetIndex, 0, movedQuickNote);

    setIsQuickNoteSaving(true);
    setQuickNotesError('');
    try {
      await onUpdateItem(quickNotesEditorItem, {
        metadataPatch: {
          [REVISION_QUICK_NOTES_KEY]: nextQuickNotes,
        },
      });
    } catch (error) {
      setQuickNotesError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not reorder quick notes right now.'
      );
    } finally {
      setIsQuickNoteSaving(false);
    }
  }, [isQuickNoteSaving, onUpdateItem, quickNotesEditorItem]);

  const openSingleMoveDialog = React.useCallback((item: RevisionItem) => {
    setSingleMoveItemId(item.id);
    setSingleMoveTargetCollectionId(item.collectionId || '__standalone__');
    setSingleMoveNewNotebookTitle('');
    setSingleMoveError('');
  }, []);

  const handleMoveSingleNote = React.useCallback(async () => {
    if (!singleMoveItem || !onUpdateItem || isSingleMoveSubmitting) return;
    setIsSingleMoveSubmitting(true);
    setSingleMoveError('');
    try {
      let targetCollectionId = singleMoveTargetCollectionId;
      let createdCollection: RevisionCollection | null = null;
      if (targetCollectionId === '__create__') {
        const notebookTitle = singleMoveNewNotebookTitle.trim();
        if (!notebookTitle) return;
        createdCollection = await api.revision.createCollection({
          title: notebookTitle,
          subject: singleMoveItem.subject || null,
          topic: singleMoveItem.topic || null,
          description: `Organized from ${singleMoveItem.title}.`,
        });
        targetCollectionId = createdCollection.id;
      }

      const normalizedTargetCollectionId =
        targetCollectionId === '__standalone__' ? null : targetCollectionId || null;

      if (normalizedTargetCollectionId === singleMoveItem.collectionId) {
        setSingleMoveItemId(null);
        return;
      }

      const targetExistingItems = normalizedTargetCollectionId
        ? sortRevisionItemsForNotebook(
            allWorkspaceItems.filter(
              (item) => item.collectionId === normalizedTargetCollectionId && item.id !== singleMoveItem.id
            )
          )
        : [];

      await onUpdateItem(singleMoveItem, {
        collectionId: normalizedTargetCollectionId,
        featuredRank: normalizedTargetCollectionId ? targetExistingItems.length + 1 : null,
        bundleRole: normalizedTargetCollectionId ? singleMoveItem.bundleRole || null : null,
      });

      if (normalizedTargetCollectionId) {
        const targetCollection =
          createdCollection ||
          allCollections.find((collection) => collection.id === normalizedTargetCollectionId) ||
          null;
        if (targetCollection) onSelectCollection(targetCollection);
      }
      setSingleMoveItemId(null);
      setSingleMoveNewNotebookTitle('');
      setSingleMoveTargetCollectionId('__standalone__');
    } catch (error) {
      setSingleMoveError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not move this note right now.'
      );
    } finally {
      setIsSingleMoveSubmitting(false);
    }
  }, [
    allCollections,
    allWorkspaceItems,
    isSingleMoveSubmitting,
    onSelectCollection,
    onUpdateItem,
    singleMoveItem,
    singleMoveNewNotebookTitle,
    singleMoveTargetCollectionId,
  ]);

  const closeNotebookSlideshow = React.useCallback(() => {
    setIsNotebookSlideshowOpen(false);
  }, []);

  const launchNotebookSlideshowForCurrentCollection = React.useCallback((args: {
    source: NotebookSlideshowSource;
    startNoteId?: string | null;
    exitTarget?: NotebookSlideshowExitTarget;
  }) => {
    if (!selectedCollection?.id) return;
    const noteIds = orderedCollectionItemIds;
    const requestedStartNoteId = args.startNoteId || null;
    const startNoteId =
      requestedStartNoteId && noteIds.includes(requestedStartNoteId)
        ? requestedStartNoteId
        : noteIds[0] || null;
    const startIndex = startNoteId ? noteIds.indexOf(startNoteId) : 0;
    setNotebookSlideshowDocumentId(selectedCollection.id);
    setNotebookSlideshowNoteIds(noteIds);
    setNotebookSlideshowStartNoteId(startNoteId);
    setNotebookSlideshowSource(args.source);
    setNotebookSlideshowExitTarget(
      args.exitTarget || {
        collectionId: selectedCollection.id,
        itemId: effectiveSelectedItemId || null,
      }
    );
    setNotebookSlideshowActiveNoteId(startNoteId);
    setNotebookSlideshowIndex(startIndex >= 0 ? startIndex : 0);
    setIsNotebookSlideshowOpen(true);
  }, [effectiveSelectedItemId, orderedCollectionItemIds, selectedCollection?.id]);

  const requestNotebookSlideshow = React.useCallback((args: {
    source: NotebookSlideshowSource;
    collectionId?: string | null;
    startNoteId?: string | null;
  }) => {
    const targetCollectionId = args.collectionId || selectedCollection?.id || null;
    if (!targetCollectionId) return;
    const exitTarget: NotebookSlideshowExitTarget = {
      collectionId: selectedCollection?.id || null,
      itemId: effectiveSelectedItemId || null,
    };
    if (selectedCollection?.id === targetCollectionId) {
      setPendingNotebookSlideshowLaunch(null);
      launchNotebookSlideshowForCurrentCollection({
        source: args.source,
        startNoteId: args.startNoteId || null,
        exitTarget,
      });
      return;
    }
    const targetCollection =
      allCollections.find((collection) => collection.id === targetCollectionId) || null;
    if (!targetCollection) return;
    setPendingNotebookSlideshowLaunch({
      collectionId: targetCollectionId,
      startNoteId: args.startNoteId || null,
      source: args.source,
      exitTarget,
    });
    onSelectCollection(targetCollection);
  }, [
    allCollections,
    effectiveSelectedItemId,
    launchNotebookSlideshowForCurrentCollection,
    onSelectCollection,
    selectedCollection?.id,
  ]);

  React.useEffect(() => {
    if (!pendingNotebookSlideshowLaunch) return;
    if (isCollectionLoading) return;
    if (!selectedCollection || selectedCollection.id !== pendingNotebookSlideshowLaunch.collectionId) return;
    launchNotebookSlideshowForCurrentCollection({
      source: pendingNotebookSlideshowLaunch.source,
      startNoteId: pendingNotebookSlideshowLaunch.startNoteId,
      exitTarget: pendingNotebookSlideshowLaunch.exitTarget,
    });
    setPendingNotebookSlideshowLaunch(null);
  }, [
    isCollectionLoading,
    launchNotebookSlideshowForCurrentCollection,
    pendingNotebookSlideshowLaunch,
    selectedCollection,
  ]);

  const handleStartNotebookSlideshow = React.useCallback(
    (source: NotebookSlideshowSource = 'notebook_header') => {
      requestNotebookSlideshow({
        source,
        collectionId: selectedCollection?.id || null,
      });
    },
    [requestNotebookSlideshow, selectedCollection?.id]
  );
  const handleStartNotebookSlideshowFromItem = React.useCallback(
    (item: RevisionItem) => {
      if (!item.collectionId) return;
      requestNotebookSlideshow({
        source: 'note_menu',
        collectionId: item.collectionId,
        startNoteId: item.id,
      });
    },
    [requestNotebookSlideshow]
  );

  const setNotebookSlideshowIndexAndActiveNote = React.useCallback((nextIndex: number) => {
    if (!notebookSlideshowNoteIds.length) {
      setNotebookSlideshowIndex(0);
      setNotebookSlideshowActiveNoteId(null);
      return;
    }
    const clampedIndex = Math.max(0, Math.min(nextIndex, notebookSlideshowNoteIds.length - 1));
    setNotebookSlideshowIndex(clampedIndex);
    setNotebookSlideshowActiveNoteId(notebookSlideshowNoteIds[clampedIndex] || null);
  }, [notebookSlideshowNoteIds]);

  const goToPreviousNotebookSlideshowSlide = React.useCallback(() => {
    if (notebookSlideshowNoteIds.length <= 1) return;
    const nextIndex = notebookSlideshowIndex <= 0
      ? notebookSlideshowNoteIds.length - 1
      : notebookSlideshowIndex - 1;
    setNotebookSlideshowIndexAndActiveNote(nextIndex);
  }, [notebookSlideshowIndex, notebookSlideshowNoteIds.length, setNotebookSlideshowIndexAndActiveNote]);

  const goToNextNotebookSlideshowSlide = React.useCallback(() => {
    if (notebookSlideshowNoteIds.length <= 1) return;
    const nextIndex = notebookSlideshowIndex >= notebookSlideshowNoteIds.length - 1
      ? 0
      : notebookSlideshowIndex + 1;
    setNotebookSlideshowIndexAndActiveNote(nextIndex);
  }, [notebookSlideshowIndex, notebookSlideshowNoteIds.length, setNotebookSlideshowIndexAndActiveNote]);

  const handleAutoArrangeNotebook = React.useCallback(async () => {
    if (!selectedCollection || !orderedCollectionItems.length || isAutoOrderingNotebook) return;
    setIsAutoOrderingNotebook(true);
    try {
      await persistNotebookOrder(
        buildBestNotebookOrder(
          orderedCollectionItems.map((item) => item.id),
          itemMap
        )
      );
    } finally {
      setIsAutoOrderingNotebook(false);
    }
  }, [isAutoOrderingNotebook, itemMap, orderedCollectionItems, persistNotebookOrder, selectedCollection]);

  const handleConfirmNotebookDelete = React.useCallback(async () => {
    if (!selectedCollection || !pendingNotebookDeleteMode || isNotebookDeleteActionLoading) return;
    setIsNotebookDeleteActionLoading(true);
    setNotebookDeleteError('');
    try {
      if (onDeleteCollection) {
        await onDeleteCollection(selectedCollection, pendingNotebookDeleteMode);
      } else {
        await api.revision.deleteCollection(selectedCollection.id, pendingNotebookDeleteMode);
      }
      setPendingNotebookDeleteMode(null);
      closeNotebookSlideshow();
      setEffectiveSelectedItemId(null);
      onSelectCollection(null);
    } catch (error) {
      setNotebookDeleteError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not complete this notebook action right now.'
      );
    } finally {
      setIsNotebookDeleteActionLoading(false);
    }
  }, [
    isNotebookDeleteActionLoading,
    onDeleteCollection,
    onSelectCollection,
    pendingNotebookDeleteMode,
    selectedCollection,
    setEffectiveSelectedItemId,
    closeNotebookSlideshow,
  ]);

  const toggleNotebookChapterCollapsed = React.useCallback((chapterId: string) => {
    setCollapsedNotebookChapterIds((previous) =>
      previous.includes(chapterId)
        ? previous.filter((entry) => entry !== chapterId)
        : [...previous, chapterId]
    );
  }, []);

  const handleNotebookIdentityDraftChange = React.useCallback(
    <K extends keyof RevisionCollectionIdentityDraft>(field: K, value: RevisionCollectionIdentityDraft[K]) => {
      setNotebookIdentityDraft((previous) => ({
        ...previous,
        [field]: value,
      }));
    },
    []
  );

  const resetNotebookIdentityDraft = React.useCallback(() => {
    setNotebookIdentityDraft(createRevisionCollectionIdentityDraft(selectedCollection));
    setIsNotebookIdentityEditing(false);
    setNotebookCoverAction('idle');
    setNotebookCoverError('');
  }, [selectedCollection]);

  const saveNotebookIdentity = React.useCallback(async () => {
    if (!selectedCollection || !onUpdateCollection || isNotebookIdentitySaving) return;
    const title = notebookIdentityDraft.title.trim();
    if (!title) return;

    const nextCoverRef: Record<string, unknown> = {
      theme: notebookIdentityDraft.coverTheme,
    };
    if (notebookIdentityDraft.coverEmoji.trim()) {
      nextCoverRef.emoji = notebookIdentityDraft.coverEmoji.trim();
    }
    if (notebookIdentityDraft.coverMotto.trim()) {
      nextCoverRef.motto = notebookIdentityDraft.coverMotto.trim();
    }
    if (notebookIdentityDraft.coverImageDataUrl.trim()) {
      nextCoverRef.imageDataUrl = notebookIdentityDraft.coverImageDataUrl.trim();
      nextCoverRef.imageSource = notebookIdentityDraft.coverImageSource || 'uploaded';
      nextCoverRef.imageUpdatedAt = new Date().toISOString();
      if (notebookIdentityDraft.coverImagePrompt.trim()) {
        nextCoverRef.imagePrompt = notebookIdentityDraft.coverImagePrompt.trim();
      }
    }

    setIsNotebookIdentitySaving(true);
    try {
      await onUpdateCollection(selectedCollection, {
        title,
        subject: notebookIdentityDraft.subject.trim() || null,
        topic: notebookIdentityDraft.topic.trim() || null,
        kind: notebookIdentityDraft.kind,
        bundleSummary: notebookIdentityDraft.bundleSummary.trim() || null,
        featuredItemIds: orderedCollectionItems.slice(0, 4).map((item) => item.id),
        coverRef: nextCoverRef,
      });
      setIsNotebookIdentityEditing(false);
    } finally {
      setIsNotebookIdentitySaving(false);
    }
  }, [
    isNotebookIdentitySaving,
    notebookIdentityDraft,
    onUpdateCollection,
    orderedCollectionItems,
    selectedCollection,
  ]);

  const handleRemoveNotebookCoverImage = React.useCallback(() => {
    setNotebookIdentityDraft((previous) => ({
      ...previous,
      coverImageDataUrl: '',
      coverImagePrompt: '',
      coverImageSource: '',
    }));
    setNotebookCoverError('');
  }, []);

  const handleNotebookCoverUpload = React.useCallback(async (file: File | null) => {
    if (!file) return;
    setNotebookCoverAction('uploading');
    setNotebookCoverError('');
    try {
      const rawDataUrl = await readFileAsDataUrl(file);
      const optimized = await optimizeNotebookCoverDataUrl(rawDataUrl);
      setNotebookIdentityDraft((previous) => ({
        ...previous,
        coverImageDataUrl: optimized,
        coverImagePrompt: '',
        coverImageSource: 'uploaded',
      }));
    } catch (error) {
      setNotebookCoverError(error instanceof Error ? error.message : 'Could not use that notebook cover image.');
    } finally {
      setNotebookCoverAction('idle');
    }
  }, []);

  const handleGenerateNotebookCover = React.useCallback(async () => {
    if (!selectedCollection) return;
    setNotebookCoverAction('generating');
    setNotebookCoverError('');
    try {
      const generated = await api.revision.generateNotebookCover(selectedCollection.id, {
        title: notebookIdentityDraft.title.trim() || selectedCollection.title,
        subject: notebookIdentityDraft.subject.trim() || (typeof selectedCollection.subject === 'string' ? selectedCollection.subject : null),
        topic: notebookIdentityDraft.topic.trim() || selectedCollection.topic || null,
        summary:
          notebookIdentityDraft.bundleSummary.trim() ||
          selectedCollection.bundleSummary ||
          selectedCollection.description ||
          null,
        theme: notebookIdentityDraft.coverTheme,
        motto: notebookIdentityDraft.coverMotto.trim() || selectedCollectionCover.motto || null,
      });
      const optimized = await optimizeNotebookCoverDataUrl(generated.dataUrl);
      setNotebookIdentityDraft((previous) => ({
        ...previous,
        coverImageDataUrl: optimized,
        coverImagePrompt: generated.prompt,
        coverImageSource: 'ai_generated',
      }));
    } catch (error) {
      setNotebookCoverError(error instanceof Error ? error.message : 'Could not generate a notebook cover right now.');
    } finally {
      setNotebookCoverAction('idle');
    }
  }, [notebookIdentityDraft, selectedCollection, selectedCollectionCover.motto]);

  const loadNotebookChapterSummaries = React.useCallback(async (force = false) => {
    if (!selectedCollection || isGeneratingChapterSummaries) return;
    setIsGeneratingChapterSummaries(true);
    setChapterSummaryError('');
    try {
      const response = await api.revision.generateChapterSummaries(selectedCollection.id, { force });
      setChapterSummariesByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: response.chapterSummaries,
      }));
      setNotebookNarrativeByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: {
          preface: response.preface || '',
          endRecap: response.endRecap || '',
          generatedAt: response.generatedAt || null,
        },
      }));
    } catch (error) {
      setChapterSummaryError(error instanceof Error ? error.message : 'Could not build AI chapter summaries right now.');
    } finally {
      setIsGeneratingChapterSummaries(false);
    }
  }, [isGeneratingChapterSummaries, selectedCollection]);

  const loadNotebookFlashcards = React.useCallback(async (force = false, chapterId?: string | null) => {
    if (!selectedCollection || isGeneratingFlashcards) return;
    setIsGeneratingFlashcards(true);
    setFlashcardError('');
    try {
      const response = await api.revision.generateFlashcards(selectedCollection.id, {
        force,
        chapterId: chapterId || null,
      });
      setFlashcardsByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: response.flashcards,
      }));
      setFlashcardDeckTitleByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: response.deckTitle || 'Notebook recall deck',
      }));
      setFlashcardScopeByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: {
          scope: response.scope || 'collection',
          chapterId: response.chapterId || null,
          chapterLabel: response.chapterLabel || null,
          generatedAt: response.generatedAt || null,
        },
      }));
      setActiveFlashcardIndex(0);
      setIsFlashcardBackVisible(false);
      setIsFlashcardQuizActive(false);
      setFlashcardQuizIndex(0);
      setIsFlashcardQuizAnswerVisible(false);
      setFlashcardQuizResults({});
    } catch (error) {
      setFlashcardError(error instanceof Error ? error.message : 'Could not build flashcards right now.');
    } finally {
      setIsGeneratingFlashcards(false);
    }
  }, [isGeneratingFlashcards, selectedCollection]);

  const loadNotebookVisualAssets = React.useCallback(async () => {
    if (!selectedCollection || isLoadingNotebookVisuals) return;
    setIsLoadingNotebookVisuals(true);
    setNotebookVisualError('');
    try {
      const response = await api.media.listAssets({
        collectionId: selectedCollection.id,
        assetKind: 'visual_explainer',
        sortBy: 'recent',
        limit: 6,
      });
      setVisualAssetsByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: response.assets,
      }));
    } catch (error) {
      setNotebookVisualError(error instanceof Error ? error.message : 'Could not load notebook visuals right now.');
    } finally {
      setIsLoadingNotebookVisuals(false);
    }
  }, [isLoadingNotebookVisuals, selectedCollection]);

  const handleGenerateNotebookVisual = React.useCallback(async () => {
    if (!selectedCollection || isGeneratingNotebookVisual) return;
    setIsGeneratingNotebookVisual(true);
    setNotebookVisualError('');
    try {
      const response = await api.revision.generateNotebookVisual(selectedCollection.id, {
        title: `${selectedCollection.title} ${
          selectedNotebookVisualMode === 'memory_map'
            ? 'memory map'
            : selectedNotebookVisualMode === 'process_flow'
              ? 'process flow'
              : 'diagram'
        }`,
        subject: typeof selectedCollection.subject === 'string' ? selectedCollection.subject : null,
        topic: selectedCollection.topic || null,
        summary: selectedCollection.bundleSummary || selectedCollection.description || null,
        styleHint:
          selectedNotebookVisualMode === 'memory_map'
            ? 'calm memory map for revision'
            : selectedNotebookVisualMode === 'process_flow'
              ? 'calm process flow for revision'
              : 'calm diagram for revision',
        visualMode: selectedNotebookVisualMode,
      });
      setVisualAssetsByCollectionId((previous) => ({
        ...previous,
        [selectedCollection.id]: [response.asset, ...(previous[selectedCollection.id] || [])],
      }));
    } catch (error) {
      setNotebookVisualError(error instanceof Error ? error.message : 'Could not generate a notebook visual right now.');
    } finally {
      setIsGeneratingNotebookVisual(false);
    }
  }, [isGeneratingNotebookVisual, selectedCollection, selectedNotebookVisualMode]);

  React.useEffect(() => {
    if (!selectedCollection?.id) return;
    const isLargeNotebook =
      selectedCollectionChapterGroups.length >= 3 || orderedCollectionItems.length >= 8;
    if (!isLargeNotebook) return;
    if (chapterSummariesByCollectionId[selectedCollection.id]?.length) return;
    if (cachedSelectedCollectionChapterSummaries.length) return;
    void loadNotebookChapterSummaries(false);
  }, [
    cachedSelectedCollectionChapterSummaries.length,
    chapterSummariesByCollectionId,
    loadNotebookChapterSummaries,
    orderedCollectionItems.length,
    selectedCollection?.id,
    selectedCollectionChapterGroups.length,
  ]);

  React.useEffect(() => {
    if (!selectedCollection?.id) return;
    if (hasLoadedSelectedCollectionVisualAssets) return;
    void loadNotebookVisualAssets();
  }, [hasLoadedSelectedCollectionVisualAssets, loadNotebookVisualAssets, selectedCollection?.id]);

  React.useEffect(() => {
    setActiveFlashcardIndex(0);
    setIsFlashcardBackVisible(false);
  }, [selectedCollection?.id, effectiveSelectedCollectionFlashcards.length]);

  React.useEffect(() => {
    if (selectedCollection?.id && effectiveSelectedCollectionFlashcardScope.scope === 'chapter' && effectiveSelectedCollectionFlashcardScope.chapterId) {
      setSelectedFlashcardChapterId(effectiveSelectedCollectionFlashcardScope.chapterId);
      return;
    }
    if (selectedCollection?.id) {
      setSelectedFlashcardChapterId('__all__');
    }
  }, [
    effectiveSelectedCollectionFlashcardScope.chapterId,
    effectiveSelectedCollectionFlashcardScope.scope,
    selectedCollection?.id,
  ]);

  React.useEffect(() => {
    setActiveFlashcardIndex(0);
    setIsFlashcardBackVisible(false);
    setIsFlashcardQuizActive(false);
    setFlashcardQuizIndex(0);
    setIsFlashcardQuizAnswerVisible(false);
    setFlashcardQuizResults({});
    setFlashcardQuizOrder([]);
    setFlashcardQuizRepeatCountById({});
    setFlashcardQueueExportNotice('');
  }, [selectedFlashcardChapterId]);

  React.useEffect(() => {
    if (!selectedCollection?.id || hasManualNotebookVisualModeSelection) return;
    setSelectedNotebookVisualMode(
      inferNotebookVisualMode({
        subject: typeof selectedCollection.subject === 'string' ? selectedCollection.subject : null,
        topic: selectedCollection.topic || null,
        summary: selectedCollection.bundleSummary || selectedCollection.description || null,
        chapterLabels: selectedCollectionChapterGroups.map((chapter) => chapter.label),
      })
    );
  }, [
    hasManualNotebookVisualModeSelection,
    selectedCollection?.bundleSummary,
    selectedCollection?.description,
    selectedCollection?.id,
    selectedCollection?.subject,
    selectedCollection?.topic,
    selectedCollectionChapterGroups,
  ]);

  const startFlashcardQuiz = React.useCallback(() => {
    if (!effectiveSelectedCollectionFlashcards.length) return;
    const firstSourceItemId = effectiveSelectedCollectionFlashcards[0]?.sourceItemIds?.[0];
    if (firstSourceItemId) {
      void api.revision
        .recordReviewEvent(firstSourceItemId, {
          eventType: 'quiz_started',
          outcome: null,
          metadata: {
            source: 'flashcard_quiz',
            collectionId: selectedCollection?.id || null,
            chapterId: effectiveSelectedCollectionFlashcardScope.chapterId || null,
            chapterLabel: effectiveSelectedCollectionFlashcardScope.chapterLabel || null,
          },
        })
        .catch(() => undefined);
    }
    setIsFlashcardQuizActive(true);
    setFlashcardQuizOrder(effectiveSelectedCollectionFlashcards.map((card) => card.id));
    setFlashcardQuizRepeatCountById({});
    setFlashcardQuizIndex(0);
    setIsFlashcardQuizAnswerVisible(false);
    setFlashcardQuizResults({});
    setFlashcardQueueExportNotice('');
  }, [
    effectiveSelectedCollectionFlashcardScope.chapterId,
    effectiveSelectedCollectionFlashcardScope.chapterLabel,
    effectiveSelectedCollectionFlashcards,
    selectedCollection?.id,
  ]);

  const handleFlashcardQuizResult = React.useCallback((outcome: 'again' | 'got_it') => {
    const currentCardId = flashcardQuizOrder[flashcardQuizIndex] || effectiveSelectedCollectionFlashcards[flashcardQuizIndex]?.id;
    const currentCard = currentCardId ? effectiveSelectedCollectionFlashcardMap.get(currentCardId) || null : null;
    if (!currentCard) return;
    setFlashcardQuizResults((previous) => ({
      ...previous,
      [currentCard.id]: outcome,
    }));
    const sourceItemId = currentCard.sourceItemIds?.[0];
    if (sourceItemId) {
      void api.revision
        .recordReviewEvent(sourceItemId, {
          eventType: 'quiz_answered',
          outcome: outcome === 'got_it' ? 'correct' : 'struggled',
          metadata: {
            source: 'flashcard_quiz',
            collectionId: selectedCollection?.id || null,
            chapterId: effectiveSelectedCollectionFlashcardScope.chapterId || null,
            chapterLabel: effectiveSelectedCollectionFlashcardScope.chapterLabel || currentCard.chapterLabel || null,
            flashcardId: currentCard.id,
          },
        })
        .catch(() => undefined);
    }
    let nextOrder = flashcardQuizOrder.length
      ? [...flashcardQuizOrder]
      : effectiveSelectedCollectionFlashcards.map((card) => card.id);
    if (outcome === 'again') {
      const repeatCount = (flashcardQuizRepeatCountById[currentCard.id] || 0) + 1;
      setFlashcardQuizRepeatCountById((previous) => ({
        ...previous,
        [currentCard.id]: repeatCount,
      }));
      if (repeatCount <= 2) {
        const insertIndex = Math.min(flashcardQuizIndex + 3, nextOrder.length);
        nextOrder.splice(insertIndex, 0, currentCard.id);
        setFlashcardQuizOrder(nextOrder);
      }
    }
    const nextIndex = flashcardQuizIndex + 1;
    if (nextIndex >= nextOrder.length) {
      setIsFlashcardQuizActive(false);
      setIsFlashcardQuizAnswerVisible(false);
      return;
    }
    setFlashcardQuizIndex(nextIndex);
    setIsFlashcardQuizAnswerVisible(false);
  }, [
    effectiveSelectedCollectionFlashcardScope.chapterId,
    effectiveSelectedCollectionFlashcardScope.chapterLabel,
    effectiveSelectedCollectionFlashcardMap,
    effectiveSelectedCollectionFlashcards,
    flashcardQuizOrder,
    flashcardQuizIndex,
    flashcardQuizRepeatCountById,
    selectedCollection?.id,
  ]);

  const exportMissedFlashcardsToQueue = React.useCallback(async () => {
    if (isExportingFlashcardMisses) return;
    const missedItemIds = Array.from(
      new Set(
        Object.entries(flashcardQuizResults)
          .filter(([, outcome]) => outcome === 'again')
          .flatMap(([cardId]) => effectiveSelectedCollectionFlashcardMap.get(cardId)?.sourceItemIds || [])
          .filter(Boolean)
      )
    );
    if (!missedItemIds.length) {
      setFlashcardQueueExportNotice('No missed flashcards need exporting right now.');
      return;
    }
    setIsExportingFlashcardMisses(true);
    setFlashcardQueueExportNotice('');
    try {
      await commitRevisionBatchUpdates(
        missedItemIds.map((itemId) => ({
          itemId,
          patch: {
            needsPractice: true,
          },
        }))
      );
      setFlashcardQueueExportNotice(
        `${missedItemIds.length} missed revision note${missedItemIds.length === 1 ? '' : 's'} added to your next study pass.`
      );
    } catch (error) {
      setFlashcardQueueExportNotice(error instanceof Error ? error.message : 'Could not export missed flashcards right now.');
    } finally {
      setIsExportingFlashcardMisses(false);
    }
  }, [commitRevisionBatchUpdates, effectiveSelectedCollectionFlashcardMap, flashcardQuizResults, isExportingFlashcardMisses]);

  const getDraggedNotebookItemIds = React.useCallback(() => {
    if (!draggedNotebookItemId) return [] as string[];
    if (notebookSelectionMode && selectedNotebookItemIds.includes(draggedNotebookItemId)) {
      return selectedNotebookItemIds;
    }
    return [draggedNotebookItemId];
  }, [draggedNotebookItemId, notebookSelectionMode, selectedNotebookItemIds]);

  const getDraggedRevisionItems = React.useCallback(() => {
    const movingItemIds = getDraggedNotebookItemIds();
    if (!movingItemIds.length) return [] as RevisionItem[];
    return allWorkspaceItems.filter((item) => movingItemIds.includes(item.id));
  }, [allWorkspaceItems, getDraggedNotebookItemIds]);

  const canDropDraggedItemsIntoCollection = React.useCallback((targetCollection: RevisionCollection) => {
    const movingItems = getDraggedRevisionItems();
    if (!movingItems.length) return false;
    return movingItems.some((item) => item.collectionId !== targetCollection.id);
  }, [getDraggedRevisionItems]);

  const handleDropNotebookItemsIntoCollection = React.useCallback(async (
    targetCollection: RevisionCollection
  ) => {
    if (isBulkMovingItems || !canDropDraggedItemsIntoCollection(targetCollection)) {
      setDragOverCollectionId(null);
      return;
    }

    const movingItemIds = getDraggedNotebookItemIds();
    if (!movingItemIds.length) {
      setDragOverCollectionId(null);
      return;
    }

    const movingItems = allWorkspaceItems.filter((item) => movingItemIds.includes(item.id));
    if (!movingItems.length) {
      setDragOverCollectionId(null);
      return;
    }

    const targetExistingItems = sortRevisionItemsForNotebook(
      allWorkspaceItems.filter(
        (item) => item.collectionId === targetCollection.id && !movingItemIds.includes(item.id)
      )
    );

    setIsBulkMovingItems(true);
    setNotebookMoveError('');
    try {
      await commitRevisionBatchUpdates(
        movingItems.map((item, index) => ({
          itemId: item.id,
          patch: {
            collectionId: targetCollection.id,
            featuredRank: targetExistingItems.length + index + 1,
          },
        }))
      );
      setSelectedNotebookItemIds((previous) => previous.filter((itemId) => !movingItemIds.includes(itemId)));
      if (notebookSelectionMode && movingItemIds.length >= selectedNotebookItemIds.length) {
        setNotebookSelectionMode(false);
      }
    } catch (error) {
      setNotebookMoveError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Could not move dragged notes into that notebook.'
      );
    } finally {
      setIsBulkMovingItems(false);
      setDraggedNotebookItemId(null);
      setDragOverNotebookItemId(null);
      setDragOverCollectionId(null);
    }
  }, [
    allWorkspaceItems,
    canDropDraggedItemsIntoCollection,
    commitRevisionBatchUpdates,
    getDraggedNotebookItemIds,
    isBulkMovingItems,
    notebookSelectionMode,
    selectedNotebookItemIds.length,
  ]);

  const emitWorkspaceScrollState = React.useCallback(() => {
    if (!onWorkspaceScrollStateChange) return;
    onWorkspaceScrollStateChange({
      libraryScrollTop: workspaceLibraryRef.current?.scrollTop || 0,
      detailScrollTop: workspaceDetailRef.current?.scrollTop || 0,
    });
  }, [onWorkspaceScrollStateChange]);

  React.useEffect(() => {
    if (layoutMode !== 'workspace' || !workspaceScrollState) return;
    if (workspaceLibraryRef.current) {
      const target = workspaceScrollState.libraryScrollTop || 0;
      if (Math.abs(workspaceLibraryRef.current.scrollTop - target) > 1) {
        workspaceLibraryRef.current.scrollTop = target;
      }
    }
    if (workspaceDetailRef.current) {
      const target = workspaceScrollState.detailScrollTop || 0;
      if (Math.abs(workspaceDetailRef.current.scrollTop - target) > 1) {
        workspaceDetailRef.current.scrollTop = target;
      }
    }
  }, [
    layoutMode,
    workspaceScrollState?.libraryScrollTop,
    workspaceScrollState?.detailScrollTop,
  ]);

  const renderGuidedRevisionPanel = () => {
    if (!guidedRevisionSession) return null;
    return (
      <GuidedRevisionSessionPanel
        session={guidedRevisionSession}
        selectedCollectionTitle={
          selectedCollection?.title || selectedItem?.collectionTitle || guidedRevisionSession.item.collectionTitle || null
        }
        responseDraft={guidedResponseDraft}
        onResponseDraftChange={setGuidedResponseDraft}
        onSubmitStep={handleGuidedSubmitStep}
        onSupportAction={handleGuidedSupportAction}
        onCloseSession={handleCloseGuidedRevision}
        isSubmitting={isGuidedStepLoading}
        feedbackText={guidedFeedbackText}
        errorMessage={guidedSessionError}
        saveDraft={guidedSaveDraft}
        onSaveDraftChange={setGuidedSaveDraft}
        onSaveNote={handleSaveGuidedRevisionUpdate}
        canSaveNote={Boolean(onSaveStudentNote)}
        isSavingNote={isGuidedSaveLoading}
        relatedConcepts={guidedConceptLinks}
        onStartRelatedConcept={handleStartLinkedGuidedConcept}
        onSeedPrompt={handleSeedGuidedPrompt}
      />
    );
  };
  const renderGuidedEngineBootState = () => (
    <section className="copilot-revision-card space-y-4">
      <div className="copilot-followup-card rounded-[1.25rem] px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
          Steadfast Revision Engine
        </p>
        <h3 className="mt-2 text-lg font-semibold text-[var(--copilot-text-primary)]">
          {isStartingRevisionMode ? 'Preparing your guided session...' : 'Guided session not ready yet'}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
          {isStartingRevisionMode
            ? 'Mapping your note into recall, quick-check, similar-transfer, and wrap checkpoints.'
            : guidedSessionError || 'Try launching guided revision again from this note.'}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {isStartingRevisionMode ? (
          <Button type="button" className="copilot-control-commit h-9 rounded-full px-4 text-sm" disabled>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Launching
          </Button>
        ) : (
          <Button
            type="button"
            className="copilot-control-commit h-9 rounded-full px-4 text-sm"
            onClick={handleRetryGuidedLaunch}
            disabled={!guidedLaunchContext}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Retry guided launch
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          className="copilot-control-nav h-9 rounded-full px-4 text-sm"
          onClick={handleCloseGuidedRevision}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Close
        </Button>
      </div>
    </section>
  );

  const selectedNotebookOrderIndex = React.useMemo(
    () => new Map(orderedCollectionItems.map((item, index) => [item.id, index + 1])),
    [orderedCollectionItems]
  );
  const activeNotebookSlideshowIndex = React.useMemo(() => {
    if (!notebookSlideshowNoteIds.length) return 0;
    if (notebookSlideshowActiveNoteId) {
      const byId = notebookSlideshowNoteIds.indexOf(notebookSlideshowActiveNoteId);
      if (byId >= 0) return byId;
    }
    return Math.min(notebookSlideshowIndex, notebookSlideshowNoteIds.length - 1);
  }, [notebookSlideshowActiveNoteId, notebookSlideshowIndex, notebookSlideshowNoteIds]);
  const activeNotebookSlideshowNoteId =
    notebookSlideshowNoteIds[
      Math.min(activeNotebookSlideshowIndex, Math.max(notebookSlideshowNoteIds.length - 1, 0))
    ] || null;
  const activeNotebookSlideshowItem = activeNotebookSlideshowNoteId
    ? itemMap.get(activeNotebookSlideshowNoteId) ||
      orderedCollectionItems.find((item) => item.id === activeNotebookSlideshowNoteId) ||
      null
    : null;
  const activeNotebookSlideshowBlocks = React.useMemo(
    () =>
      activeNotebookSlideshowItem
        ? getRevisionStudyBlocks(activeNotebookSlideshowItem.content || activeNotebookSlideshowItem.summary || '')
        : [],
    [activeNotebookSlideshowItem]
  );
  const activeNotebookSlideshowQuickNotes = React.useMemo(
    () => (activeNotebookSlideshowItem ? getRevisionQuickNotesFromItem(activeNotebookSlideshowItem) : []),
    [activeNotebookSlideshowItem]
  );
  const activeNotebookSlideshowCollection =
    notebookSlideshowDocumentId && selectedCollection?.id === notebookSlideshowDocumentId
      ? selectedCollection
      : notebookSlideshowDocumentId
        ? allCollections.find((collection) => collection.id === notebookSlideshowDocumentId) || null
        : selectedCollection;

  const renderSelectedNotebookView = (variant: 'panel' | 'workspace') => {
    if (!selectedCollection) return null;
    const tone = getRevisionCollectionTone(selectedCollection);
    const noteCount = orderedCollectionItems.length || selectedCollection.itemCount || 0;
    const summaryLine =
      selectedCollection.bundleSummary?.trim() ||
      selectedCollection.description?.trim() ||
      (selectedCollectionChapterGroups.length > 1
        ? `Built as ${selectedCollectionChapterGroups.length} chapters so the notebook reads like a deliberate study book.`
        : 'Built as one focused chapter so the notebook stays calm and easy to revise.');
    const moveTargetOptions = allCollections.filter((collection) => collection.id !== selectedCollection.id);
    const hasLongNotebook = selectedCollectionChapterGroups.length > 2 || noteCount > 6;
    const shouldUseAiChapterSummaries = selectedCollectionChapterGroups.length >= 3 || noteCount >= 8;
    const allChaptersCollapsed =
      selectedCollectionChapterGroups.length > 0 &&
      selectedCollectionChapterGroups.every((chapter) => collapsedNotebookChapterIds.includes(chapter.id));
    const coverPreviewMotto =
      notebookIdentityDraft.coverMotto.trim() ||
      selectedCollectionCover.motto ||
      (selectedCollection.kind === 'bundle'
        ? 'Built to read like a deliberate study book.'
        : 'Organized to keep revision calm and clear.');
    const coverPreviewImage =
      (isNotebookIdentityEditing
        ? notebookIdentityDraft.coverImageDataUrl.trim()
        : selectedCollectionCover.imageDataUrl) || '';
    const shouldShowNotebookNarrative =
      hasLongNotebook ||
      Boolean(effectiveSelectedCollectionNarrative.preface || effectiveSelectedCollectionNarrative.endRecap);
    const shouldOfferFlashcards = noteCount >= 3;
    const selectedFlashcardChapter =
      selectedFlashcardChapterId !== '__all__'
        ? selectedCollectionChapterGroups.find((chapter) => chapter.id === selectedFlashcardChapterId) || null
        : null;
    const activeFlashcard =
      effectiveSelectedCollectionFlashcards[
        Math.min(activeFlashcardIndex, Math.max(effectiveSelectedCollectionFlashcards.length - 1, 0))
      ] || null;
    const flashcardQuizCardId =
      flashcardQuizOrder[flashcardQuizIndex] ||
      effectiveSelectedCollectionFlashcards[
        Math.min(flashcardQuizIndex, Math.max(effectiveSelectedCollectionFlashcards.length - 1, 0))
      ]?.id ||
      null;
    const flashcardQuizCard = flashcardQuizCardId
      ? effectiveSelectedCollectionFlashcardMap.get(flashcardQuizCardId) || null
      : null;
    const flashcardQuizTotalCards = Math.max(
      flashcardQuizOrder.length,
      effectiveSelectedCollectionFlashcards.length
    );
    const flashcardQuizCompletedCount = Object.keys(flashcardQuizResults).length;
    const flashcardQuizCorrectCount = Object.values(flashcardQuizResults).filter((value) => value === 'got_it').length;
    const flashcardQuizNeedsWorkCount = Object.values(flashcardQuizResults).filter((value) => value === 'again').length;
    const flashcardDeckScopeLabel = selectedFlashcardChapter
      ? `Chapter: ${selectedFlashcardChapter.label}`
      : effectiveSelectedCollectionFlashcardScope.scope === 'chapter'
        ? effectiveSelectedCollectionFlashcardScope.chapterLabel || 'Chapter deck'
        : 'Whole notebook deck';

    return (
      <div className={variant === 'workspace' ? 'space-y-5' : 'space-y-4'}>
        <section className={`copilot-revision-book-cover overflow-hidden rounded-[1.75rem] border border-[var(--copilot-soft-line)] bg-gradient-to-br ${tone.frameClassName} px-5 py-5 md:px-6 md:py-6 ${tone.glowClassName}`}>
          {workspaceBreadcrumbs.length > 0 || (notebookHeaderNavigation && notebookHeaderNavigation.total > 1) ? (
            <div className="copilot-revision-breadcrumb-row mb-3">
              <div className="copilot-revision-breadcrumb-main">
                <span className="copilot-revision-breadcrumb-badge">Notebook</span>
                {workspaceBreadcrumbs.length > 0 ? <RevisionBreadcrumbTrail items={workspaceBreadcrumbs} /> : null}
                {notebookHeaderNavigation && notebookHeaderNavigation.total > 1 ? (
                  <div className="copilot-revision-header-notebook-nav" role="group" aria-label="Navigate notebooks">
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav copilot-revision-header-notebook-nav-btn h-7 w-7 rounded-full p-0"
                      aria-label={`Previous notebook (${notebookHeaderNavigation.currentIndex + 1} of ${notebookHeaderNavigation.total})`}
                      disabled={!notebookHeaderNavigation.previousId}
                      onClick={goToPreviousNotebookHeader}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav copilot-revision-header-notebook-nav-btn h-7 w-7 rounded-full p-0"
                      aria-label={`Next notebook (${notebookHeaderNavigation.currentIndex + 1} of ${notebookHeaderNavigation.total})`}
                      disabled={!notebookHeaderNavigation.nextId}
                      onClick={goToNextNotebookHeader}
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(250px,0.82fr)]">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${tone.accentClassName}`}>
                  {selectedCollection.kind === 'bundle' ? 'Study book' : 'Notebook'}
                </span>
                {selectedCollection.subject ? (
                  <span className="copilot-revision-pill">
                    {getRevisionWorkspaceSubjectDisplayLabel(selectedCollection.subject, 'General')}
                  </span>
                ) : null}
                {selectedCollection.topic ? (
                  <span className="copilot-revision-pill">{selectedCollection.topic}</span>
                ) : null}
                <span className="copilot-revision-pill">{noteCount} notes</span>
                <span className="copilot-revision-pill">
                  {selectedCollectionChapterGroups.length} chapter{selectedCollectionChapterGroups.length === 1 ? '' : 's'}
                </span>
              </div>

              <h2 className="mt-4 text-[1.8rem] font-semibold tracking-[-0.03em] text-[var(--copilot-text-primary)] md:text-[2.25rem]">
                {selectedCollection.title}
              </h2>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--copilot-text-secondary)] md:text-[0.98rem]">
                {summaryLine}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                  onClick={() => onSelectCollection(null)}
                >
                  <ArrowLeft className="mr-1.5 h-4 w-4" />
                  Back to subject notes
                </Button>
                {onReviseWithSteadfast ? (
                  <Button
                    type="button"
                    className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                    disabled={isStartingRevisionMode}
                    onClick={() => runRevisionMode({ collectionId: selectedCollection.id })}
                  >
                    {isStartingRevisionMode ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Revise this notebook
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-4 text-sm"
                  onClick={() => handleStartNotebookSlideshow('notebook_header')}
                >
                  Slideshow
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-4 text-sm"
                  onClick={() => {
                    setNotebookSelectionMode((previous) => !previous);
                    setSelectedNotebookItemIds([]);
                  }}
                >
                  {notebookSelectionMode ? 'Close selection' : 'Select notes'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                      aria-label="Notebook options"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-1.5"
                  >
                    <DropdownMenuLabel className="px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--copilot-text-tertiary)]">
                      Notebook options
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      onSelect={() => handleStartNotebookSlideshow('notebook_menu')}
                    >
                      Start slideshow
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs"
                      disabled={isAutoOrderingNotebook || !orderedCollectionItems.length}
                      onSelect={() => void handleAutoArrangeNotebook()}
                    >
                      {isAutoOrderingNotebook ? 'Arranging notebook...' : 'Auto-arrange best flow'}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[var(--copilot-soft-line)]/70" />
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs text-amber-700 focus:text-amber-800"
                      onSelect={() => {
                        setNotebookDeleteError('');
                        setPendingNotebookDeleteMode('dissolve');
                      }}
                    >
                      Dissolve notebook (keep notes)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="cursor-pointer rounded-xl text-xs text-rose-700 focus:text-rose-800"
                      onSelect={() => {
                        setNotebookDeleteError('');
                        setPendingNotebookDeleteMode('delete_with_items');
                      }}
                    >
                      Delete notebook and notes
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <div className="space-y-4">
              <div className="copilot-revision-book-identity rounded-[1.35rem] px-4 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="copilot-revision-cover-mark h-14 w-14 rounded-[1.2rem] text-xl">
                      {coverPreviewImage ? (
                        <img
                          src={coverPreviewImage}
                          alt={`${selectedCollection.title} cover`}
                          className="copilot-revision-cover-art"
                        />
                      ) : selectedCollectionCover.emoji || notebookIdentityDraft.coverEmoji.trim() ? (
                        <span className="copilot-revision-cover-mark-emoji" aria-hidden="true">
                          {notebookIdentityDraft.coverEmoji.trim() || selectedCollectionCover.emoji}
                        </span>
                      ) : (
                        <NotebookPen className="h-6 w-6" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Book identity
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--copilot-text-primary)]">
                        {notebookIdentityDraft.title.trim() || selectedCollection.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                        {coverPreviewMotto}
                      </p>
                    </div>
                  </div>
                  {onUpdateCollection ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      onClick={() => setIsNotebookIdentityEditing((previous) => !previous)}
                    >
                      {isNotebookIdentityEditing ? 'Close editor' : 'Edit cover'}
                    </Button>
                  ) : null}
                </div>

                {isNotebookIdentityEditing ? (
                  <div className="mt-4 space-y-3">
                    <input
                      ref={notebookCoverUploadInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0] || null;
                        void handleNotebookCoverUpload(file);
                        event.currentTarget.value = '';
                      }}
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Title
                        </p>
                        <Input
                          value={notebookIdentityDraft.title}
                          onChange={(event) => handleNotebookIdentityDraftChange('title', event.target.value)}
                          placeholder="Notebook title"
                          className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Format
                        </p>
                        <Select
                          value={notebookIdentityDraft.kind}
                          onValueChange={(value) => handleNotebookIdentityDraftChange('kind', value as RevisionCollectionKind)}
                        >
                          <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                            <SelectValue placeholder="Choose format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">Notebook</SelectItem>
                            <SelectItem value="bundle">Study book</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Subject
                        </p>
                        <Input
                          value={notebookIdentityDraft.subject}
                          onChange={(event) => handleNotebookIdentityDraftChange('subject', event.target.value)}
                          placeholder="Biology"
                          className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Topic
                        </p>
                        <Input
                          value={notebookIdentityDraft.topic}
                          onChange={(event) => handleNotebookIdentityDraftChange('topic', event.target.value)}
                          placeholder="Cell transport"
                          className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                        />
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-[140px_minmax(0,1fr)]">
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Theme
                        </p>
                        <Select
                          value={notebookIdentityDraft.coverTheme}
                          onValueChange={(value) => handleNotebookIdentityDraftChange('coverTheme', value as RevisionCollectionCoverTheme)}
                        >
                          <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                            <SelectValue placeholder="Theme" />
                          </SelectTrigger>
                          <SelectContent>
                            {REVISION_COLLECTION_COVER_THEMES.map((theme) => (
                              <SelectItem key={theme} value={theme}>
                                {theme.charAt(0).toUpperCase() + theme.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                          Cover mark
                        </p>
                        <Input
                          value={notebookIdentityDraft.coverEmoji}
                          onChange={(event) => handleNotebookIdentityDraftChange('coverEmoji', event.target.value)}
                          placeholder="Optional emoji or short mark"
                          className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                        />
                      </div>
                    </div>

                    <div className="copilot-revision-book-cover-editor rounded-[1.15rem] border border-[var(--copilot-soft-line)] bg-white/70 p-3">
                      <div className="flex flex-col gap-4 md:flex-row">
                        <div className="copilot-revision-book-cover-preview shrink-0">
                          {notebookIdentityDraft.coverImageDataUrl.trim() ? (
                            <img
                              src={notebookIdentityDraft.coverImageDataUrl}
                              alt={`${notebookIdentityDraft.title || selectedCollection.title} cover preview`}
                              className="copilot-revision-book-cover-preview-image"
                            />
                          ) : (
                            <div className="copilot-revision-book-cover-placeholder">
                              <div className="copilot-revision-cover-mark h-16 w-16 rounded-[1.15rem] text-xl">
                                {notebookIdentityDraft.coverEmoji.trim() ? (
                                  <span className="copilot-revision-cover-mark-emoji" aria-hidden="true">
                                    {notebookIdentityDraft.coverEmoji.trim()}
                                  </span>
                                ) : (
                                  <NotebookPen className="h-6 w-6" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1 space-y-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                              Cover art
                            </p>
                            <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              This stays inside Steadfast as AI-native notebook identity. Uploading art here does not import external notes.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                              disabled={notebookCoverAction !== 'idle'}
                              onClick={() => void handleGenerateNotebookCover()}
                            >
                              {notebookCoverAction === 'generating' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                              Generate AI cover
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                              disabled={notebookCoverAction !== 'idle'}
                              onClick={() => notebookCoverUploadInputRef.current?.click()}
                            >
                              {notebookCoverAction === 'uploading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
                              Upload cover
                            </Button>
                            {notebookIdentityDraft.coverImageDataUrl.trim() ? (
                              <Button
                                type="button"
                                variant="ghost"
                                className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                                disabled={notebookCoverAction !== 'idle'}
                                onClick={handleRemoveNotebookCoverImage}
                              >
                                <X className="mr-2 h-4 w-4" />
                                Remove image
                              </Button>
                            ) : null}
                          </div>
                          {notebookIdentityDraft.coverImageSource ? (
                            <p className="text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                              {notebookIdentityDraft.coverImageSource === 'ai_generated'
                                ? "AI generated from this notebook's internal study context."
                                : 'Uploaded as cover art for this AI-native notebook.'}
                            </p>
                          ) : null}
                          {notebookCoverError ? (
                            <p className="text-xs leading-5 text-rose-600">
                              {notebookCoverError}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Cover motto
                      </p>
                      <Input
                        value={notebookIdentityDraft.coverMotto}
                        onChange={(event) => handleNotebookIdentityDraftChange('coverMotto', event.target.value)}
                        placeholder="One short line that tells you what this book is for"
                        className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                      />
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Back cover summary
                      </p>
                      <Textarea
                        value={notebookIdentityDraft.bundleSummary}
                        onChange={(event) => handleNotebookIdentityDraftChange('bundleSummary', event.target.value)}
                        placeholder="Describe what belongs in this notebook and how you want it to read."
                        className="min-h-[96px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)]"
                      />
                    </div>

                    <div className="flex flex-wrap justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                        onClick={resetNotebookIdentityDraft}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                        disabled={!notebookIdentityDraft.title.trim() || isNotebookIdentitySaving || notebookCoverAction !== 'idle'}
                        onClick={() => void saveNotebookIdentity()}
                      >
                        {isNotebookIdentitySaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save identity
                      </Button>
                    </div>
                  </div>
                ) : null}
              </div>

              {shouldShowNotebookNarrative && effectiveSelectedCollectionNarrative.preface ? (
                <div className="copilot-revision-narrative-card rounded-[1.35rem] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        AI preface
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-primary)] md:text-[0.98rem]">
                        {effectiveSelectedCollectionNarrative.preface}
                      </p>
                    </div>
                    {effectiveSelectedCollectionNarrative.generatedAt ? (
                      <span className="copilot-revision-pill whitespace-nowrap">
                        {formatUpdatedAt(effectiveSelectedCollectionNarrative.generatedAt)}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : null}

              <div className="rounded-[1.35rem] border border-white/70 bg-white/75 px-4 py-4 backdrop-blur">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                      Chapter map
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                      Collapse long sections, skim the summary, then open the exact chapter you want to revise.
                    </p>
                    {shouldUseAiChapterSummaries ? (
                      <p className="mt-1 text-[11px] leading-5 text-[var(--copilot-text-tertiary)]">
                        AI summaries keep large notebooks scannable without treating them like imported material.
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    {shouldUseAiChapterSummaries ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                        disabled={isGeneratingChapterSummaries}
                        onClick={() => void loadNotebookChapterSummaries(true)}
                      >
                        {isGeneratingChapterSummaries ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                        {effectiveSelectedCollectionChapterSummaries.length ? 'Refresh AI summaries' : 'Build AI summaries'}
                      </Button>
                    ) : null}
                    {hasLongNotebook ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                        onClick={() => {
                          setCollapsedNotebookChapterIds(
                            allChaptersCollapsed ? [] : selectedCollectionChapterGroups.map((chapter) => chapter.id)
                          );
                        }}
                      >
                        {allChaptersCollapsed ? 'Expand all' : 'Collapse all'}
                      </Button>
                    ) : null}
                  </div>
                </div>
                {chapterSummaryError ? (
                  <p className="mt-3 text-xs leading-5 text-rose-600">
                    {chapterSummaryError}
                  </p>
                ) : null}
                <div className="mt-3 space-y-2.5">
                  {selectedCollectionChapterGroups.map((chapter, index) => {
                    const isCollapsed = collapsedNotebookChapterIds.includes(chapter.id);
                    const chapterSummary =
                      selectedCollectionChapterSummaryMap.get(chapter.id) ||
                      selectedCollectionChapterSummaryMap.get(chapter.label.toLocaleLowerCase()) ||
                      getRevisionChapterSummary(chapter);
                    return (
                      <button
                        key={chapter.id}
                        type="button"
                        className="copilot-revision-chapter-toggle w-full text-left"
                        onClick={() => toggleNotebookChapterCollapsed(chapter.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                              Chapter {index + 1}
                            </p>
                            <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">
                              {chapter.label}
                            </p>
                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              {chapterSummary}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="copilot-revision-pill">
                              {chapter.items.length}
                            </span>
                            {isCollapsed ? (
                              <ChevronRight className="h-4 w-4 text-[var(--copilot-text-tertiary)]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[var(--copilot-text-tertiary)]" />
                            )}
                          </div>
                        </div>
                      </button>
                      );
                    })}
                </div>
                <p className="mt-3 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                  Drag notes to reorder the reading flow, or drag standalone notes into this notebook from the rail to grow the book without leaving Revision.
                </p>
              </div>

              <div className="grid gap-4 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
                <section className="copilot-revision-context-card rounded-[1.35rem] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="copilot-revision-note-kicker">Recall deck</p>
                      <h3 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">
                        {effectiveSelectedCollectionFlashcardDeckTitle || 'Notebook flashcards'}
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        Build quick retrieval prompts from this notebook so revision becomes active instead of staying passive.
                      </p>
                    </div>
                    {shouldOfferFlashcards ? (
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                        disabled={isGeneratingFlashcards}
                        onClick={() =>
                          void loadNotebookFlashcards(
                            effectiveSelectedCollectionFlashcards.length > 0,
                            selectedFlashcardChapter?.id || null
                          )
                        }
                      >
                        {isGeneratingFlashcards ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                        {effectiveSelectedCollectionFlashcards.length
                          ? 'Refresh deck'
                          : selectedFlashcardChapter
                            ? 'Build chapter deck'
                            : 'Build deck'}
                      </Button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Deck scope
                      </p>
                      <Select value={selectedFlashcardChapterId} onValueChange={setSelectedFlashcardChapterId}>
                        <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                          <SelectValue placeholder="Choose notebook scope" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Whole notebook</SelectItem>
                          {selectedCollectionChapterGroups.map((chapter, index) => (
                            <SelectItem key={chapter.id} value={chapter.id}>
                              {`Chapter ${index + 1}: ${chapter.label}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="copilot-revision-pill">{flashcardDeckScopeLabel}</span>
                      {effectiveSelectedCollectionFlashcardScope.generatedAt ? (
                        <span className="copilot-revision-pill">
                          {formatUpdatedAt(effectiveSelectedCollectionFlashcardScope.generatedAt)}
                        </span>
                      ) : null}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-10 rounded-full px-4 text-sm"
                      disabled={!effectiveSelectedCollectionFlashcards.length}
                      onClick={startFlashcardQuiz}
                    >
                      <Target className="mr-2 h-4 w-4" />
                      Quiz this deck
                    </Button>
                  </div>

                  {flashcardError ? (
                    <p className="mt-3 text-xs leading-5 text-rose-600">
                      {flashcardError}
                    </p>
                  ) : null}

                  {!shouldOfferFlashcards ? (
                    <div className="copilot-revision-flashcard-shell mt-4 rounded-[1.2rem] px-4 py-4">
                      <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        Add a few more notebook notes and we can turn the strongest ideas into a clean flashcard deck.
                      </p>
                    </div>
                  ) : isFlashcardQuizActive && flashcardQuizCard ? (
                    <div className="mt-4 space-y-3">
                      <div className="copilot-revision-flashcard-shell rounded-[1.2rem] px-4 py-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="copilot-revision-pill">
                              Quiz card {flashcardQuizIndex + 1} of {flashcardQuizTotalCards}
                            </span>
                            {flashcardQuizCard.chapterLabel ? (
                              <span className="copilot-revision-pill">{flashcardQuizCard.chapterLabel}</span>
                            ) : null}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                            onClick={() => {
                              setIsFlashcardQuizActive(false);
                              setIsFlashcardQuizAnswerVisible(false);
                            }}
                          >
                            End quiz
                          </Button>
                        </div>
                        <div className="copilot-revision-flashcard-face mt-3 rounded-[1.15rem] px-4 py-4">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                            {isFlashcardQuizAnswerVisible ? 'Answer' : 'Prompt'}
                          </p>
                          <p className="mt-3 text-base font-semibold leading-7 text-[var(--copilot-text-primary)]">
                            {isFlashcardQuizAnswerVisible ? flashcardQuizCard.back : flashcardQuizCard.front}
                          </p>
                          {flashcardQuizCard.hint && !isFlashcardQuizAnswerVisible ? (
                            <p className="mt-3 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              Hint: {flashcardQuizCard.hint}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          {!isFlashcardQuizAnswerVisible ? (
                            <Button
                              type="button"
                              className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                              onClick={() => setIsFlashcardQuizAnswerVisible(true)}
                            >
                              Reveal answer
                            </Button>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="outline"
                                className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                                onClick={() => handleFlashcardQuizResult('again')}
                              >
                                Review again
                              </Button>
                              <Button
                                type="button"
                                className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                                onClick={() => handleFlashcardQuizResult('got_it')}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Got it
                              </Button>
                            </>
                          )}
                        </div>
                        <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                          Answer in your head first, then reveal and grade yourself honestly.
                        </p>
                      </div>
                    </div>
                  ) : flashcardQuizCompletedCount > 0 && flashcardQuizCompletedCount >= effectiveSelectedCollectionFlashcards.length ? (
                    <div className="copilot-revision-flashcard-shell mt-4 rounded-[1.2rem] px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                            Flashcard quiz complete
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                            {flashcardQuizCorrectCount} strong recall, {flashcardQuizNeedsWorkCount} to revisit.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                          onClick={startFlashcardQuiz}
                        >
                          Quiz again
                        </Button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <Button
                          type="button"
                          className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                          disabled={isExportingFlashcardMisses || flashcardQuizNeedsWorkCount <= 0}
                          onClick={() => void exportMissedFlashcardsToQueue()}
                        >
                          {isExportingFlashcardMisses ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowUp className="mr-2 h-4 w-4" />}
                          Add missed cards to next study pass
                        </Button>
                        <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                          Missed cards can be resurfaced in your revision queue so they stay in focus.
                        </p>
                      </div>
                      {flashcardQueueExportNotice ? (
                        <p className="mt-2 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                          {flashcardQueueExportNotice}
                        </p>
                      ) : null}
                    </div>
                  ) : activeFlashcard ? (
                    <div className="mt-4 space-y-3">
                      <button
                        type="button"
                        className="copilot-revision-flashcard-shell w-full text-left"
                        onClick={() => setIsFlashcardBackVisible((previous) => !previous)}
                        aria-pressed={isFlashcardBackVisible}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="copilot-revision-pill">
                              Card {activeFlashcardIndex + 1} of {effectiveSelectedCollectionFlashcards.length}
                            </span>
                            {activeFlashcard.chapterLabel ? (
                              <span className="copilot-revision-pill">{activeFlashcard.chapterLabel}</span>
                            ) : null}
                          </div>
                          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                            {isFlashcardBackVisible ? 'Answer' : 'Prompt'}
                          </span>
                        </div>
                        <div className="copilot-revision-flashcard-face mt-3 rounded-[1.15rem] px-4 py-4">
                          <p className="text-base font-semibold leading-7 text-[var(--copilot-text-primary)]">
                            {isFlashcardBackVisible ? activeFlashcard.back : activeFlashcard.front}
                          </p>
                          {activeFlashcard.hint ? (
                            <p className="mt-3 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                              Hint: {activeFlashcard.hint}
                            </p>
                          ) : null}
                        </div>
                      </button>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                            disabled={effectiveSelectedCollectionFlashcards.length <= 1}
                            onClick={() => {
                              setActiveFlashcardIndex((previous) =>
                                previous === 0 ? effectiveSelectedCollectionFlashcards.length - 1 : previous - 1
                              );
                              setIsFlashcardBackVisible(false);
                            }}
                          >
                            <ChevronLeft className="mr-1.5 h-4 w-4" />
                            Previous
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                            onClick={() => setIsFlashcardBackVisible((previous) => !previous)}
                          >
                            {isFlashcardBackVisible ? 'Show prompt' : 'Flip card'}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                            disabled={effectiveSelectedCollectionFlashcards.length <= 1}
                            onClick={() => {
                              setActiveFlashcardIndex((previous) =>
                                previous >= effectiveSelectedCollectionFlashcards.length - 1 ? 0 : previous + 1
                              );
                              setIsFlashcardBackVisible(false);
                            }}
                          >
                            Next
                            <ChevronRight className="ml-1.5 h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                          Tap the card to flip it and test recall before reading the answer.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="copilot-revision-flashcard-shell mt-4 rounded-[1.2rem] px-4 py-4">
                      <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        No flashcards yet. Build a deck when you want this notebook to become a quick recall set.
                      </p>
                    </div>
                  )}
                </section>

                <section className="copilot-revision-context-card rounded-[1.35rem] px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="copilot-revision-note-kicker">Visual revision</p>
                      <h3 className="mt-2 text-base font-semibold text-[var(--copilot-text-primary)]">
                        AI visual learning materials
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        Generate calm internal diagrams and concept visuals from this notebook so the ideas are easier to hold in memory.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                      disabled={isGeneratingNotebookVisual}
                      onClick={() => void handleGenerateNotebookVisual()}
                    >
                      {isGeneratingNotebookVisual ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Sparkles className="mr-2 h-3.5 w-3.5" />}
                      {selectedCollectionVisualAssets.length ? 'Generate another visual' : 'Generate visual'}
                    </Button>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
                    <div className="space-y-2">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                        Visual mode
                      </p>
                      <Select
                        value={selectedNotebookVisualMode}
                        onValueChange={(value) => {
                          setHasManualNotebookVisualModeSelection(true);
                          setSelectedNotebookVisualMode(value as RevisionNotebookVisualMode);
                        }}
                      >
                        <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                          <SelectValue placeholder="Choose visual mode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="diagram">Diagram</SelectItem>
                          <SelectItem value="memory_map">Memory map</SelectItem>
                          <SelectItem value="process_flow">Process flow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="copilot-revision-pill">
                        {selectedNotebookVisualMode === 'memory_map'
                          ? 'Memory map'
                          : selectedNotebookVisualMode === 'process_flow'
                            ? 'Process flow'
                            : 'Diagram'}
                      </span>
                    </div>
                  </div>

                  {notebookVisualError ? (
                    <p className="mt-3 text-xs leading-5 text-rose-600">
                      {notebookVisualError}
                    </p>
                  ) : null}

                  {isLoadingNotebookVisuals && !selectedCollectionVisualAssets.length ? (
                    <div className="copilot-revision-flashcard-shell mt-4 rounded-[1.2rem] px-4 py-4">
                      <p className="inline-flex items-center gap-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading saved visuals for this notebook.
                      </p>
                    </div>
                  ) : selectedCollectionVisualAssets.length ? (
                    <div className="copilot-revision-visual-grid mt-4">
                      {selectedCollectionVisualAssets.map((asset) => {
                        const previewUrl = asset.thumbnailUrl || asset.imageUrl || asset.assetUrl || asset.dataUrl || '';
                        return (
                          <article key={asset.id} className="copilot-revision-visual-card rounded-[1.2rem]">
                            {previewUrl ? (
                              <div className="copilot-revision-visual-thumb">
                                <img src={previewUrl} alt={asset.title} className="h-full w-full object-cover" />
                              </div>
                            ) : null}
                            <div className="space-y-2 px-3 pb-3 pt-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="copilot-revision-pill">AI visual</span>
                                {asset.topic ? <span className="copilot-revision-pill">{asset.topic}</span> : null}
                              </div>
                              <h4 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                                {asset.title}
                              </h4>
                              {asset.summary ? (
                                <p className="text-xs leading-5 text-[var(--copilot-text-secondary)]">
                                  {asset.summary}
                                </p>
                              ) : null}
                              {(asset.keyIdea || asset.nextMove) ? (
                                <div className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-white/70 px-3 py-2">
                                  {asset.keyIdea ? (
                                    <p className="text-xs leading-5 text-[var(--copilot-text-primary)]">
                                      <span className="font-semibold">Key idea:</span> {asset.keyIdea}
                                    </p>
                                  ) : null}
                                  {asset.nextMove ? (
                                    <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                                      <span className="font-semibold text-[var(--copilot-text-primary)]">Use it:</span> {asset.nextMove}
                                    </p>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="copilot-revision-flashcard-shell mt-4 rounded-[1.2rem] px-4 py-4">
                      <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                        No visuals yet. Generate one when a chapter would make more sense as a picture, flow, or memory map.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          </div>
        </section>

        {notebookSelectionMode ? (
          <section className="copilot-revision-context-card rounded-[1.35rem] px-4 py-4">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
              <div className="space-y-1">
                <p className="copilot-revision-note-kicker">Bulk move</p>
                <h3 className="text-base font-semibold text-[var(--copilot-text-primary)]">
                  {selectedNotebookItemIds.length
                    ? `${selectedNotebookItemIds.length} note${selectedNotebookItemIds.length === 1 ? '' : 's'} selected`
                    : 'Select notes to move them'}
                </h3>
                <p className="text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  Move a set of notes into another notebook, out into standalone space, or into a brand-new study book.
                </p>
                {notebookMoveError ? (
                  <p className="text-xs leading-5 text-rose-600">{notebookMoveError}</p>
                ) : null}
              </div>
              <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)_auto_auto] md:items-end">
                <div className="space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                    Move to
                  </p>
                  <Select value={bulkMoveTargetCollectionId} onValueChange={setBulkMoveTargetCollectionId}>
                    <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                      <SelectValue placeholder="Choose destination" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__standalone__">Standalone notes</SelectItem>
                      {moveTargetOptions.map((collection) => (
                        <SelectItem key={collection.id} value={collection.id}>
                          {collection.title}
                        </SelectItem>
                      ))}
                      <SelectItem value="__create__">Create new notebook</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {bulkMoveTargetCollectionId === '__create__' ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                      New notebook title
                    </p>
                    <Input
                      value={bulkMoveNewNotebookTitle}
                      onChange={(event) => setBulkMoveNewNotebookTitle(event.target.value)}
                      placeholder="For example: Cell Transport Book"
                      className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                    />
                  </div>
                ) : (
                  <div className="hidden md:block" />
                )}

                <Button
                  type="button"
                  className="copilot-control-commit h-10 rounded-full px-4 text-sm"
                  disabled={
                    !selectedNotebookItemIds.length ||
                    isBulkMovingItems ||
                    (bulkMoveTargetCollectionId === '__create__' && !bulkMoveNewNotebookTitle.trim())
                  }
                  onClick={() => void handleBulkMoveSelectedNotebookItems()}
                >
                  {isBulkMovingItems ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Move selected
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-10 rounded-full px-4 text-sm"
                  onClick={() => setSelectedNotebookItemIds([])}
                >
                  Clear
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {orderedCollectionItems.length === 0 ? (
          <WorkspacePanelState
            title="This notebook is empty"
            description="Save notes, worked steps, or snippets to build this notebook."
          />
        ) : (
          <div className="space-y-5">
            {selectedCollectionChapterGroups.map((chapter, chapterIndex) => {
              const isCollapsed = collapsedNotebookChapterIds.includes(chapter.id);
              const chapterSummary =
                selectedCollectionChapterSummaryMap.get(chapter.id) ||
                selectedCollectionChapterSummaryMap.get(chapter.label.toLocaleLowerCase()) ||
                getRevisionChapterSummary(chapter);
              return (
                <section
                  key={chapter.id}
                  className={`copilot-revision-context-card rounded-[1.4rem] px-4 py-4 md:px-5 ${
                    isCollapsed ? 'space-y-3' : 'space-y-4'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div className="min-w-0">
                      <p className="copilot-revision-note-kicker">Chapter {chapterIndex + 1}</p>
                      <div className="mt-2 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="text-lg font-semibold text-[var(--copilot-text-primary)]">
                            {chapter.label}
                          </h3>
                          <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                            {chapterSummary}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                            {chapter.items.length} note{chapter.items.length === 1 ? '' : 's'} arranged for a smoother revision pass.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                          onClick={() => toggleNotebookChapterCollapsed(chapter.id)}
                        >
                          {isCollapsed ? 'Expand chapter' : 'Collapse chapter'}
                        </Button>
                      </div>
                    </div>
                    {isNotebookReordering ? (
                      <span className="inline-flex items-center gap-2 text-sm text-[var(--copilot-text-secondary)]">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving order
                      </span>
                    ) : null}
                    {notebookOrderError ? (
                      <p className="text-xs leading-5 text-rose-600">{notebookOrderError}</p>
                    ) : null}
                  </div>

                  {!isCollapsed ? (
                    <div className="space-y-3">
                      {chapter.items.map((item) => (
                        <RevisionNotebookChapterItemCard
                          key={item.id}
                          item={item}
                          orderLabel={selectedNotebookOrderIndex.get(item.id) || 0}
                          chapterLabel={chapter.label}
                          isSelected={selectedNotebookItemIds.includes(item.id)}
                          selectionMode={notebookSelectionMode}
                          isDragTarget={dragOverNotebookItemId === item.id}
                          quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                          onOpen={(next) => setEffectiveSelectedItemId(next.id)}
                          onToggleSelected={toggleNotebookSelection}
                          onMoveUp={() => void moveNotebookItemByOffset(item.id, -1)}
                          onMoveDown={() => void moveNotebookItemByOffset(item.id, 1)}
                          onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                          onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                          onStartSlideshow={handleStartNotebookSlideshowFromItem}
                          onDragStart={() => {
                            setDraggedNotebookItemId(item.id);
                            setDragOverNotebookItemId(item.id);
                          }}
                          onDragEnd={() => {
                            setDraggedNotebookItemId(null);
                            setDragOverNotebookItemId(null);
                            setDragOverCollectionId(null);
                          }}
                          onDragOver={() => setDragOverNotebookItemId(item.id)}
                          onDrop={() => {
                            if (!draggedNotebookItemId || draggedNotebookItemId === item.id) {
                              setDraggedNotebookItemId(null);
                              setDragOverNotebookItemId(null);
                              setDragOverCollectionId(null);
                              return;
                            }
                            void persistNotebookOrder(
                              reorderRevisionIds(
                                orderedCollectionItems.map((entry) => entry.id),
                                draggedNotebookItemId,
                                item.id
                              )
                            );
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-3 text-sm text-[var(--copilot-text-secondary)]">
                      {chapter.items[0]?.title
                        ? `Next note: ${chapter.items[0].title}`
                        : 'Chapter collapsed. Expand when you are ready to read it closely.'}
                    </div>
                  )}
                </section>
              );
            })}
            {shouldShowNotebookNarrative && effectiveSelectedCollectionNarrative.endRecap ? (
              <section className="copilot-revision-narrative-card rounded-[1.35rem] px-4 py-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                  End-of-book recap
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-primary)] md:text-[0.98rem]">
                  {effectiveSelectedCollectionNarrative.endRecap}
                </p>
              </section>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderFilteredWorkspaceMatches = (headline: string, description: string) => (
      <section className="copilot-revision-card space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
              Matching notes
            </p>
            <h2 className="mt-1 text-lg font-semibold text-[var(--copilot-text-primary)]">
              {filteredWorkspaceItems.length
                ? `${filteredWorkspaceItems.length} item${filteredWorkspaceItems.length === 1 ? '' : 's'} match your filters`
                : 'No saved items match these filters'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="copilot-revision-pill">{headline}</span>
            <span className="copilot-revision-pill">
              {WORKSPACE_SCOPE_OPTIONS.find((option) => option.value === workspaceScopeFilter)?.label}
            </span>
            <span className="copilot-revision-pill">
              {WORKSPACE_TYPE_OPTIONS.find((option) => option.value === workspaceTypeFilter)?.label}
            </span>
            {workspaceSubjectFilter !== 'all' ? (
              <span className="copilot-revision-pill">
                {getRevisionWorkspaceSubjectDisplayLabel(workspaceSubjectFilter, 'General')}
              </span>
            ) : null}
          </div>
        </div>
        {filteredWorkspaceItems.length ? (
          <div className="grid gap-3 xl:grid-cols-2">
            {filteredWorkspaceItems.slice(0, 12).map((item) => (
              <RevisionPreviewCard
                key={item.id}
                item={item}
                isActive={selectedItem?.id === item.id}
                onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                onStartSlideshow={handleStartNotebookSlideshowFromItem}
                onUpdateMastery={onUpdateMastery}
              />
            ))}
          </div>
        ) : (
          <StatusCard
            title="No saved items match these filters"
            description="Try another type, widen the status filter, or reset your filters to see more of your revision space."
          />
        )}
      </section>
  );

  const renderMain = () => {
    if (renderState === 'loading') return <LoadingState />;
    if (renderState === 'error') {
      const errorTitle = selectedCollection
        ? "We couldn't load this notebook"
        : "We couldn't load your revision space";
      return (
        <StatusCard
          title={errorTitle}
          description="Please try again."
          actionLabel="Retry"
          onAction={onRetryLoad}
        />
      );
    }
    if (renderState === 'empty') {
      return (
        <StatusCard
          title="Your revision space is empty"
          description="Save helpful notes, explanations, worked steps, and study materials from the tutor so you can review them later."
        />
      );
    }
    if (renderState === 'item_selected') {
      if (!selectedItem) return null;
      return (
        <div className="space-y-4">
          <RevisionDetailCard
            key={selectedItem.id}
            item={selectedItem}
            breadcrumbs={workspaceNoteBreadcrumbs}
            breadcrumbSubjectLabel={workspaceNoteSubjectLabel}
            onLaunchSteadfast={handleSteadfastLaunch}
            isLaunchingSteadfast={isStartingRevisionMode}
            onBackToCollection={
              showBackToNotebookOrigin
                ? handleReturnToNotebookEntry
                : undefined
            }
            backToCollectionLabel={showBackToNotebookOrigin ? 'Back to notebook' : undefined}
            onContinueChat={onContinueChat}
            navigation={
              selectedItemNavigation
                ? {
                    currentIndex: selectedItemNavigation.currentIndex,
                    total: selectedItemNavigation.total,
                    onPrevious: goToPreviousWorkspaceItem,
                    onNext: goToNextWorkspaceItem,
                  }
                : null
            }
            onTogglePin={onTogglePin}
            onUpdateMastery={onUpdateMastery}
            onSaveStudentNote={onSaveStudentNote}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onQuizItem={onQuizItem}
            onBreakdownItem={onBreakdownItem}
            onSimilarQuestionItem={onSimilarQuestionItem}
            onStartSlideshow={handleStartNotebookSlideshowFromItem}
            collections={allCollections}
            activeCollection={activeItemCollection}
            sameCollectionItems={sameCollectionItems}
            crossCollectionRelatedItems={crossCollectionRelatedItems}
            notebookNavigation={
              notebookHeaderNavigation
                ? {
                    currentIndex: notebookHeaderNavigation.currentIndex,
                    total: notebookHeaderNavigation.total,
                    onPrevious: goToPreviousNotebookHeader,
                    onNext: goToNextNotebookHeader,
                  }
                : null
            }
            onOpenItem={setEffectiveSelectedItemId}
          />
          {workspaceHasActiveFilters
            ? renderFilteredWorkspaceMatches(
                'Keep browsing',
                'Keep this note open while you filter for the next one you want to review.'
              )
            : null}
        </div>
      );
    }
    if (renderState === 'list_selected' && selectedCollection) {
      return (
        <div className="space-y-4">
          {renderSelectedNotebookView('panel')}
          {workspaceHasActiveFilters
            ? renderFilteredWorkspaceMatches(
                'Across your notes',
                'Your notebook stays open here, and the matching notes stay ready underneath.'
              )
            : null}
        </div>
      );
    }
    if (layoutMode === 'workspace' && workspaceHasActiveFilters) {
      return (
        <div className="space-y-4">
          <section className="copilot-revision-card space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                  Filtered notes
                </p>
                <h2 className="mt-1 text-lg font-semibold text-[var(--copilot-text-primary)]">
                  {filteredWorkspaceItems.length
                    ? `${filteredWorkspaceItems.length} item${filteredWorkspaceItems.length === 1 ? '' : 's'} match your filters`
                    : 'No saved items match these filters'}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  Narrow by status or type, then open one note and act.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="copilot-revision-pill">
                  {WORKSPACE_SCOPE_OPTIONS.find((option) => option.value === workspaceScopeFilter)?.label}
                </span>
                <span className="copilot-revision-pill">
                  {WORKSPACE_TYPE_OPTIONS.find((option) => option.value === workspaceTypeFilter)?.label}
                </span>
              </div>
            </div>
            {filteredWorkspaceItems.length ? (
              <div className="grid gap-3 xl:grid-cols-2">
                {filteredWorkspaceItems.slice(0, 12).map((item) => (
                  <RevisionPreviewCard
                    key={item.id}
                    item={item}
                    isActive={selectedItem?.id === item.id}
                    onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                    collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                    quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                    onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                    onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                    onStartSlideshow={handleStartNotebookSlideshowFromItem}
                    onUpdateMastery={onUpdateMastery}
                  />
                ))}
              </div>
            ) : (
              <StatusCard
                title="No saved items match these filters"
                description="Try another type, widen the status filter, or reset your filters to see more of your revision space."
              />
            )}
          </section>
        </div>
      );
    }
    if (layoutMode === 'workspace') {
      return (
        <div className="space-y-6">
          <section className="copilot-revision-card space-y-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                  Revision flow
                </p>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">
                    Choose one thing and work it properly.
                  </h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--copilot-text-secondary)]">
                    Use the matrix panel on the left to pick one notebook or note. The right side stays focused on the
                    item you are actively reviewing, so the workspace stays calm and focused.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="copilot-revision-pill">{itemCountLabel}</span>
                <span className="copilot-revision-pill">{listCountLabel}</span>
                {pinnedCount > 0 ? (
                  <span className="copilot-revision-pill">{pinnedCount} pinned</span>
                ) : null}
              </div>
            </div>

            {workspacePriorityItem ? (
              <div className="copilot-followup-card rounded-3xl p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="copilot-revision-type-pill">
                        <Sparkles className="h-3.5 w-3.5" />
                        Best next step
                      </span>
                      {workspacePriorityLabel ? (
                        <span className="copilot-revision-pill">{workspacePriorityLabel}</span>
                      ) : null}
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--copilot-text-primary)]">
                      {workspacePriorityItem.title}
                    </h3>
                    <p className="max-w-2xl text-sm leading-6 text-[var(--copilot-text-secondary)]">
                      {workspacePriorityDescription}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="copilot-control-commit h-10 rounded-full px-4 text-sm"
                      onClick={() => setEffectiveSelectedItemId(workspacePriorityItem.id)}
                    >
                      Open item
                    </Button>
                    {onReviseWithSteadfast ? (
                      <Button
                        type="button"
                        variant="outline"
                        className="copilot-control-nav h-10 rounded-full px-4 text-sm"
                        disabled={isStartingRevisionMode}
                        onClick={() => runRevisionMode({ itemId: workspacePriorityItem.id })}
                      >
                        {isStartingRevisionMode ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Revise with Steadfast
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </section>

          {showQueuePreview && queuePreview ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  Priority review
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                  Start with what needs attention now, then keep the stronger items lightly active.
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-3">
                <RevisionQueueCard
                  title="Due now"
                  description="Bring these back before they fade."
                  items={queuePreview.dueNow}
                  count={overview?.totalDueCount}
                  icon={Clock3}
                  accentClassName="bg-amber-50 text-amber-700"
                  onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
                />
                <RevisionQueueCard
                  title="Needs attention"
                  description="Slow down here and fix what is still shaky."
                  items={queuePreview.needsAttention}
                  count={overview?.totalNeedsAttentionCount}
                  icon={AlertCircle}
                  accentClassName="bg-rose-50 text-rose-700"
                  onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
                />
                <RevisionQueueCard
                  title="Recently improved"
                  description="Keep these warm with a lighter review."
                  items={queuePreview.recentlyImproved}
                  count={queuePreview.recentlyImproved.length}
                  icon={TrendingUp}
                  accentClassName="bg-emerald-50 text-emerald-700"
                  onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
                />
              </div>
            </section>
          ) : null}

          {pinnedPreviewItems.length ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                    Pinned for quick return
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                    Keep your most useful saved notes within easy reach.
                  </p>
                </div>
                <span className="copilot-revision-pill shrink-0">{pinnedPreviewItems.length}</span>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {pinnedPreviewItems.map((item) => (
                  <RevisionPreviewCard
                    key={item.id}
                    item={item}
                    isActive={selectedItem?.id === item.id}
                    onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                    collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                    quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                    onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                    onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                    onStartSlideshow={handleStartNotebookSlideshowFromItem}
                    onUpdateMastery={onUpdateMastery}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {!searchQuery.trim() && groupingSuggestions.length > 0 ? (
            <section className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  Suggested grouping
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                  Turn related saves into a focused notebook when you are ready.
                </p>
              </div>
              <div className="grid gap-3 xl:grid-cols-2">
                {groupingSuggestions.map((suggestion) => (
                  <div key={suggestion.suggestionId} className="copilot-sidebar-card">
                    <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                      {suggestion.title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
                      {suggestion.reason}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav mt-3 h-9 rounded-full px-3 text-sm"
                      onClick={() => onApplyGroupingSuggestion?.(suggestion.suggestionId)}
                    >
                      {isGroupingSuggestionsLoading ? (
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Layers3 className="mr-2 h-3.5 w-3.5" />
                      )}
                      Add to notebook
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          ) : null}
        </div>
      );
    }

        return (
      <div className={isPanelMode ? 'space-y-5' : 'space-y-6'}>
        {overviewCollections.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  Notebooks
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                  Open a focused set of saved explanations, corrections, and worked steps.
                </p>
              </div>
              <span className="copilot-revision-pill shrink-0">
                {overview?.totalCollections || 0}
              </span>
            </div>
            {overviewCollections.map((collection) => (
              <RevisionCollectionCard
                key={collection.id}
                collection={collection}
                compact={isPanelMode}
                isActive={selectedCollection?.id === collection.id}
                onSelect={onSelectCollection}
              />
            ))}
          </section>
        ) : null}

        {!isPanelMode && !searchQuery.trim() && groupingSuggestions.length > 0 ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
              Suggested grouping
            </h2>
            {groupingSuggestions.map((suggestion) => (
              <div key={suggestion.suggestionId} className="copilot-sidebar-card">
                <p className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  {suggestion.title}
                </p>
                <p className="mt-1 text-xs text-[var(--copilot-text-secondary)]">
                  {suggestion.reason}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav mt-3 h-8 rounded-full px-3 text-xs"
                  onClick={() => onApplyGroupingSuggestion?.(suggestion.suggestionId)}
                >
                  {isGroupingSuggestionsLoading ? (
                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Layers3 className="mr-2 h-3.5 w-3.5" />
                  )}
                  Add to notebook
                </Button>
              </div>
            ))}
          </section>
        ) : null}

        {!isPanelMode && showQueuePreview && queuePreview ? (
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                Revision queue
              </h2>
              <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                See what needs attention now, what to revisit carefully, and what is getting stronger.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <RevisionQueueCard
                title="Due now"
                description="Start with the items that should come back into memory today."
                items={queuePreview.dueNow}
                count={overview?.totalDueCount}
                icon={Clock3}
                accentClassName="bg-amber-50 text-amber-700"
                onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
              />
              <RevisionQueueCard
                title="Needs attention"
                description="These are still shaky and may need a slower second pass."
                items={queuePreview.needsAttention}
                count={overview?.totalNeedsAttentionCount}
                icon={AlertCircle}
                accentClassName="bg-rose-50 text-rose-700"
                onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
              />
              <RevisionQueueCard
                title="Recently improved"
                description="These are starting to stick. Review them lightly to keep the gain."
                items={queuePreview.recentlyImproved}
                icon={TrendingUp}
                accentClassName="bg-emerald-50 text-emerald-700"
                onSelectItem={(itemId) => setEffectiveSelectedItemId(itemId)}
              />
            </div>
          </section>
        ) : null}

        {!isPanelMode || overviewRecentItems.length > 0 ? (
          <section className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  {recentSectionTitle}
                </h2>
                <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                  {recentSectionBody}
                </p>
              </div>
              <span className="copilot-revision-pill shrink-0">
                {(overview?.recentItems || []).length}
              </span>
            </div>
            {overviewRecentItems.map((item) => (
              <RevisionPreviewCard
                key={item.id}
                item={item}
                onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                onStartSlideshow={handleStartNotebookSlideshowFromItem}
                onUpdateMastery={onUpdateMastery}
              />
            ))}
          </section>
        ) : null}
      </div>
    );
  };

  const renderWorkspaceLibrary = () => {
    if (renderState === 'loading') {
      return <WorkspaceRailSkeleton />;
    }

    return (
      <div className="space-y-6">
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-semibold text-[var(--copilot-text-primary)]">
              Filter your revision notes
            </h2>
            <p className="mt-1 text-xs leading-5 text-[var(--copilot-text-secondary)]">
              Keep the sidebar focused on search and filters only.
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              type="text"
              placeholder="Search your revision map"
              className="copilot-sidebar-search h-10 rounded-2xl pl-9 pr-3"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
              Filters
            </p>
            {workspaceHasActiveFilters ? (
              <Button
                type="button"
                variant="ghost"
                className="copilot-control-utility h-8 rounded-full px-3 text-xs"
                onClick={() => {
                  setWorkspaceScopeFilter('all');
                  setWorkspaceTypeFilter('all');
                  setWorkspaceSubjectFilter('all');
                }}
              >
                Reset
              </Button>
            ) : null}
          </div>

          <div className="space-y-2">
            <div className="copilot-revision-filter-lane copilot-revision-filter-lane-subject">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                Subject
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className={`copilot-revision-filter-pill ${workspaceSubjectFilter === 'all' ? 'copilot-revision-filter-pill-active' : ''}`}
                  onClick={() => {
                    setWorkspaceSubjectFilter('all');
                  }}
                >
                  <FolderOpen className="h-3.5 w-3.5" />
                  <span>All subjects</span>
                  <span className="copilot-revision-filter-pill-count">
                    {workspaceTypeAndScopeItems.length}
                  </span>
                </button>
              </div>
              <div className="mt-2 space-y-1.5">
                {workspaceSubjectOriginGroups.map((originGroup) => {
                  const originOpen = expandedSubjectOriginGroups.includes(originGroup.key);
                  return (
                    <div
                      key={`origin-${originGroup.key}`}
                      className={`copilot-revision-origin-filter-group copilot-revision-origin-filter-${originGroup.key}`}
                    >
                      <button
                        type="button"
                        className="copilot-revision-origin-filter-toggle w-full"
                        onClick={() => toggleExpandedSubjectOrigin(originGroup.key)}
                      >
                        <span className="text-[11px] font-semibold text-[var(--copilot-text-primary)]">
                          {originGroup.label}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <span className="copilot-revision-filter-pill-count">{originGroup.totalCount}</span>
                          <ChevronDown
                            className={`h-3.5 w-3.5 text-[var(--copilot-text-tertiary)] transition-transform ${
                              originOpen ? 'rotate-180' : ''
                            }`}
                          />
                        </span>
                      </button>
                      {originOpen ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {originGroup.options.map((option) => (
                            <button
                              key={`subject-${option.value}`}
                              type="button"
                              className={`copilot-revision-filter-pill ${
                                workspaceSubjectFilter === option.value
                                  ? 'copilot-revision-filter-pill-active'
                                  : ''
                              }`}
                              onClick={() => {
                                setWorkspaceSubjectFilter(option.value as RevisionWorkspaceSubjectFilter);
                              }}
                            >
                              <FolderOpen className="h-3.5 w-3.5" />
                              <span>{option.label}</span>
                              <span className="copilot-revision-filter-pill-count">{option.count}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="copilot-revision-filter-lane copilot-revision-filter-lane-type">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                Type
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {workspaceTypeOptionCounts.map((option) => {
                  const isActive = workspaceTypeFilter === option.value;
                  const toneClassName = getWorkspaceTypeFilterToneClassName(
                    option.value as RevisionWorkspaceTypeFilter
                  );
                  const TypeIcon =
                    option.value === 'all'
                      ? Layers3
                      : getRevisionSaveTypeVisual(option.value as RevisionSaveType).Icon;
                  return (
                    <button
                      key={`type-${option.value}`}
                      type="button"
                      className={`copilot-revision-filter-pill ${toneClassName} ${
                        isActive ? 'copilot-revision-filter-pill-active' : ''
                      }`}
                      onClick={() => setWorkspaceTypeFilter(option.value as RevisionWorkspaceTypeFilter)}
                    >
                      <TypeIcon className="h-3.5 w-3.5" />
                      <span>{option.label}</span>
                      <span className="copilot-revision-filter-pill-count">{option.count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="copilot-revision-filter-lane copilot-revision-filter-lane-smart">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                Smart filters
              </p>
              {workspaceSmartScopePresets.length ? (
                <div className="copilot-revision-smart-filter-grid mt-1.5">
                  {workspaceSmartScopePresets.map((preset) => {
                    const Icon = preset.icon;
                    const isActive = workspaceScopeFilter === preset.scope;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        className={`copilot-revision-smart-filter copilot-revision-smart-filter-tone-${preset.tone} ${
                          isActive ? 'copilot-revision-smart-filter-active' : ''
                        }`}
                        onClick={() => {
                          setWorkspaceScopeFilter(isActive ? 'all' : preset.scope);
                          if (!isActive) {
                            setWorkspaceTypeFilter('all');
                            setWorkspaceSubjectFilter('all');
                          }
                        }}
                      >
                        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-[var(--copilot-soft-line)] bg-white/94">
                          <Icon className="h-3.5 w-3.5" />
                        </span>
                        <span className="min-w-0 text-left">
                          <span className="block truncate text-xs font-semibold">{preset.label}</span>
                          <span className="block text-[10px] text-[var(--copilot-text-tertiary)]">
                            {preset.count} note{preset.count === 1 ? '' : 's'}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {workspaceHasActiveFilters ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {workspaceScopeFilter !== 'all' ? (
                <button
                  type="button"
                  className="copilot-revision-active-filter-chip"
                  onClick={() => setWorkspaceScopeFilter('all')}
                >
                  {WORKSPACE_SCOPE_OPTIONS.find((option) => option.value === workspaceScopeFilter)?.label}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
              {workspaceTypeFilter !== 'all' ? (
                <button
                  type="button"
                  className="copilot-revision-active-filter-chip"
                  onClick={() => setWorkspaceTypeFilter('all')}
                >
                  {WORKSPACE_TYPE_OPTIONS.find((option) => option.value === workspaceTypeFilter)?.label}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
              {workspaceSubjectFilter !== 'all' ? (
                <button
                  type="button"
                  className="copilot-revision-active-filter-chip"
                  onClick={() => {
                    setWorkspaceSubjectFilter('all');
                  }}
                >
                  {getRevisionWorkspaceSubjectDisplayLabel(workspaceSubjectFilter, 'General')}
                  <X className="h-3 w-3" />
                </button>
              ) : null}
            </div>
          ) : null}
        </section>

      </div>
    );
  };

  const renderWorkspaceDetail = () => {
    if (renderState === 'loading') return <WorkspaceDetailSkeleton />;
    if (renderState === 'error') {
      return (
          <WorkspacePanelState
            title="We couldn't load your revision workspace."
            description="Please try again."
            actionLabel="Retry"
            onAction={onRetryLoad}
        />
      );
    }
    if (renderState === 'empty') {
      return (
        <WorkspacePanelState
          title="Your revision space is empty"
          description="Save a note to activate this workspace."
        />
      );
    }
    if (renderState === 'item_selected') {
      if (!selectedItem) return null;
      return (
        <div className="space-y-4">
          <RevisionDetailCard
            key={selectedItem.id}
            item={selectedItem}
            breadcrumbs={workspaceNoteBreadcrumbs}
            breadcrumbSubjectLabel={workspaceNoteSubjectLabel}
            onLaunchSteadfast={handleSteadfastLaunch}
            isLaunchingSteadfast={isStartingRevisionMode}
            onBackToCollection={
              showBackToNotebookOrigin
                ? handleReturnToNotebookEntry
                : undefined
            }
            backToCollectionLabel={showBackToNotebookOrigin ? 'Back to notebook' : undefined}
            onContinueChat={onContinueChat}
            navigation={
              selectedItemNavigation
                ? {
                    currentIndex: selectedItemNavigation.currentIndex,
                    total: selectedItemNavigation.total,
                    onPrevious: goToPreviousWorkspaceItem,
                    onNext: goToNextWorkspaceItem,
                  }
                : null
            }
            onTogglePin={onTogglePin}
            onUpdateMastery={onUpdateMastery}
            onSaveStudentNote={onSaveStudentNote}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onQuizItem={onQuizItem}
            onBreakdownItem={onBreakdownItem}
            onSimilarQuestionItem={onSimilarQuestionItem}
            collections={allCollections}
            activeCollection={activeItemCollection}
            sameCollectionItems={sameCollectionItems}
            crossCollectionRelatedItems={crossCollectionRelatedItems}
            notebookNavigation={
              notebookHeaderNavigation
                ? {
                    currentIndex: notebookHeaderNavigation.currentIndex,
                    total: notebookHeaderNavigation.total,
                    onPrevious: goToPreviousNotebookHeader,
                    onNext: goToNextNotebookHeader,
                  }
                : null
            }
            onOpenItem={setEffectiveSelectedItemId}
          />
          {workspaceHasActiveFilters
            ? renderFilteredWorkspaceMatches(
                'Keep browsing',
                'Keep this note open while you filter for the next one you want to review.'
              )
            : null}
        </div>
      );
    }
    if (renderState === 'list_selected' && selectedCollection) {
      return (
        <div className="space-y-5">
          {renderSelectedNotebookView('workspace')}
          {workspaceHasActiveFilters
            ? renderFilteredWorkspaceMatches(
                'Across your notes',
                'Your notebook stays open here, and the matching notes stay ready underneath.'
              )
            : null}
        </div>
      );
    }
    if (workspaceHasActiveFilters) {
      return (
        <div className="space-y-5">
          <div className="copilot-hover-reveal-group border-b border-[var(--copilot-soft-line)] pb-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
              Filtered notes
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">
              {filteredWorkspaceItems.length
                ? `${filteredWorkspaceItems.length} item${filteredWorkspaceItems.length === 1 ? '' : 's'} match your filters`
                : 'No saved items match these filters'}
            </h2>
          </div>
          {filteredWorkspaceItems.length ? (
            <div className="grid gap-3 xl:grid-cols-2">
              {filteredWorkspaceItems.slice(0, 12).map((item) => (
                <RevisionPreviewCard
                  key={item.id}
                  item={item}
                  isActive={selectedItem?.id === item.id}
                  onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                  collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                  quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                  onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                  onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                  onStartSlideshow={handleStartNotebookSlideshowFromItem}
                  onUpdateMastery={onUpdateMastery}
                />
              ))}
            </div>
          ) : (
            <WorkspacePanelState
              title="No saved items match these filters"
              description="Reset or switch filters to reopen your note stream."
            />
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 md:space-y-5">
        {workspacePriorityItem ? (
          <div className="copilot-followup-card copilot-revision-workspace-spotlight rounded-[1.4rem] px-5 py-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="copilot-revision-type-pill">
                    <Sparkles className="h-3.5 w-3.5" />
                    Start here
                  </span>
                  {workspacePriorityLabel ? (
                    <span className="copilot-revision-pill">{workspacePriorityLabel}</span>
                  ) : null}
                </div>
                <h3 className="mt-3 text-lg font-semibold text-[var(--copilot-text-primary)]">
                  {workspacePriorityItem.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                  {workspacePriorityDescription}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="copilot-control-commit h-10 rounded-full px-4 text-sm"
                  onClick={() => setEffectiveSelectedItemId(workspacePriorityItem.id)}
                >
                  Open item
                </Button>
                {onReviseWithSteadfast ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="copilot-control-nav h-10 rounded-full px-4 text-sm"
                    disabled={isStartingRevisionMode}
                    onClick={() => runRevisionMode({ itemId: workspacePriorityItem.id })}
                  >
                    {isStartingRevisionMode ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="mr-2 h-4 w-4" />
                    )}
                    Revise with Steadfast
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        {overviewRecentItems.length ? (
          <section className="copilot-revision-workspace-section space-y-3">
            <div className="copilot-revision-workspace-section-head flex items-center justify-between gap-3">
              <div className="copilot-hover-reveal-group">
                <h3 className="text-sm font-semibold text-[var(--copilot-text-primary)]">
                  Recent saves
                </h3>
                <p className="copilot-hover-reveal-copy text-xs leading-5 text-[var(--copilot-text-tertiary)]">
                  Pick one saved note to open it in the workspace.
                </p>
              </div>
              <span className="copilot-revision-pill shrink-0">{overviewRecentItems.length}</span>
            </div>
            <div className="grid gap-3 xl:grid-cols-2">
              {overviewRecentItems.map((item) => (
                <RevisionPreviewCard
                  key={item.id}
                  item={item}
                  isActive={selectedItem?.id === item.id}
                  onSelect={(next) => setEffectiveSelectedItemId(next.id)}
                  collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}
                  quickNoteCount={quickNoteCountByItemId.get(item.id) || 0}
                  onOpenQuickNotes={onUpdateItem ? openQuickNotesEditor : undefined}
                  onOpenMoveDialog={onUpdateItem ? openSingleMoveDialog : undefined}
                  onStartSlideshow={handleStartNotebookSlideshowFromItem}
                  onUpdateMastery={onUpdateMastery}
                />
              ))}
            </div>
          </section>
        ) : null}
        {!workspacePriorityItem && !overviewRecentItems.length ? (
          <WorkspacePanelState
            title="Open a saved note from the library"
            description="Use the filters on the left to find a note and load it here."
          />
        ) : null}
      </div>
    );
  };

  return (
    <div className="copilot-main-stage flex h-full min-h-0 flex-col">
      <div
        className={
          layoutMode === 'workspace'
            ? 'hidden'
            : 'sticky top-0 z-20 border-b border-[var(--copilot-soft-line)] bg-[var(--copilot-backdrop)] px-4 py-3'
        }
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="copilot-hover-reveal-group min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                {revisionTitle}
              </p>
              <p className="copilot-hover-reveal-copy max-w-2xl text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {revisionIntro}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {showExpandAction && onExpandWorkspace ? (
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 shrink-0 rounded-full px-3 text-sm"
                  onClick={onExpandWorkspace}
                >
                  <Maximize2 className="mr-2 h-4 w-4" /> Open workspace
                </Button>
              ) : null}
            </div>
          </div>

          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              type="text"
              placeholder={revisionSearchPlaceholder}
              className="copilot-sidebar-search h-10 rounded-2xl pl-9 pr-3"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--copilot-text-tertiary)]">
            <span className="copilot-revision-pill">{itemCountLabel}</span>
            <span className="copilot-revision-pill">{listCountLabel}</span>
            {pinnedCount > 0 ? (
              <span className="copilot-revision-pill">{pinnedCount} pinned</span>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={
          layoutMode === 'workspace'
            ? 'h-full min-h-0 overflow-hidden px-4 py-4 md:px-5'
            : 'h-full overflow-y-auto px-4 py-4'
        }
      >
        {layoutMode === 'workspace' ? (
          <div className="mx-auto flex h-full w-full max-w-[1720px] min-h-0">
            <div className="copilot-revision-workspace-track grid h-full min-h-0 w-full gap-4 lg:grid-cols-[minmax(280px,320px)_minmax(0,1fr)] xl:grid-cols-[minmax(300px,330px)_minmax(0,1fr)]">
            <aside
              ref={workspaceLibraryRef}
              className="copilot-revision-workspace-sidebar min-h-0 overflow-y-auto rounded-[1.35rem] border p-4"
              onScroll={emitWorkspaceScrollState}
              data-testid="revision-workspace-library-scroll"
            >
              {renderWorkspaceLibrary()}
            </aside>
            <section
              ref={workspaceDetailRef}
              className="copilot-revision-workspace-detail min-h-0 overflow-y-auto rounded-[1.35rem] border p-5"
              onScroll={emitWorkspaceScrollState}
              data-testid="revision-workspace-detail-scroll"
            >
              <div className="w-full">
                {renderWorkspaceDetail()}
              </div>
            </section>
          </div>
          </div>
        ) : (
          <div>{renderMain()}</div>
        )}
      </div>

      <Dialog
        open={Boolean(quickNotesEditorItem)}
        onOpenChange={(open) => {
          if (!open) {
            setQuickNotesEditorItemId(null);
            setQuickNoteDraft('');
            setQuickNotesError('');
          }
        }}
      >
        <DialogContent className="w-[min(680px,94vw)] rounded-[1.5rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-0">
          <DialogTitle className="sr-only">Quick notes editor</DialogTitle>
          <DialogDescription className="sr-only">
            Add or remove concise quick notes attached to this saved revision item.
          </DialogDescription>
          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                Quick notes
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--copilot-text-primary)]">
                {quickNotesEditorItem?.title || 'Saved note'}
              </h3>
              <p className="mt-1 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                Add compact reminders to this note and remove any that no longer help.
              </p>
              {quickNotesError ? (
                <p className="mt-2 text-xs leading-5 text-rose-600">{quickNotesError}</p>
              ) : null}
            </div>
            <div className="max-h-[240px] space-y-2 overflow-y-auto pr-1">
              {quickNotesForEditorItem.length ? (
                quickNotesForEditorItem.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm leading-6 text-[var(--copilot-text-primary)]">
                        {entry.text}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-7 rounded-full px-2 text-[11px]"
                        disabled={isQuickNoteSaving || index <= 0}
                        onClick={() => void handleReorderQuickNote(entry.id, -1)}
                      >
                        Up
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-7 rounded-full px-2 text-[11px]"
                        disabled={isQuickNoteSaving || index >= quickNotesForEditorItem.length - 1}
                        onClick={() => void handleReorderQuickNote(entry.id, 1)}
                      >
                        Down
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="copilot-control-nav h-7 rounded-full px-2 text-[11px] text-rose-700 hover:text-rose-800"
                        disabled={isQuickNoteSaving}
                        onClick={() => void handleRemoveQuickNote(entry.id)}
                      >
                        Remove
                      </Button>
                    </div>
                    <p className="mt-1 text-[11px] text-[var(--copilot-text-tertiary)]">
                      #{index + 1} | {formatUpdatedAt(entry.createdAt)}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1rem] border border-dashed border-[var(--copilot-soft-line)] px-3 py-3 text-sm text-[var(--copilot-text-secondary)]">
                  No quick notes yet. Add your first one below.
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Textarea
                value={quickNoteDraft}
                onChange={(event) => setQuickNoteDraft(event.target.value)}
                placeholder='Example: "When solving linear equations, keep operations symmetric on both sides."'
                className="min-h-[96px] rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
              />
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                  onClick={() => setQuickNoteDraft('')}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                  disabled={isQuickNoteSaving || !normalizeRevisionQuickNoteText(quickNoteDraft)}
                  onClick={() => void handleAddQuickNote()}
                >
                  {isQuickNoteSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Add note
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(singleMoveItem)}
        onOpenChange={(open) => {
          if (!open) {
            setSingleMoveItemId(null);
            setSingleMoveTargetCollectionId('__standalone__');
            setSingleMoveNewNotebookTitle('');
            setSingleMoveError('');
          }
        }}
      >
        <DialogContent className="w-[min(680px,94vw)] rounded-[1.5rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-0">
          <DialogTitle className="sr-only">Move note</DialogTitle>
          <DialogDescription className="sr-only">
            Move this note to another notebook, create a new one, or keep it standalone.
          </DialogDescription>
          <div className="space-y-4 px-5 py-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                Move note
              </p>
              <h3 className="mt-1 text-lg font-semibold text-[var(--copilot-text-primary)]">
                {singleMoveItem?.title || 'Saved note'}
              </h3>
              {singleMoveError ? (
                <p className="mt-2 text-xs leading-5 text-rose-600">{singleMoveError}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                Destination
              </p>
              <Select value={singleMoveTargetCollectionId} onValueChange={setSingleMoveTargetCollectionId}>
                <SelectTrigger className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm">
                  <SelectValue placeholder="Choose destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__standalone__">Standalone notes</SelectItem>
                  {allCollections
                    .filter((collection) => collection.id !== singleMoveItem?.collectionId)
                    .map((collection) => (
                      <SelectItem key={collection.id} value={collection.id}>
                        {collection.title}
                      </SelectItem>
                    ))}
                  <SelectItem value="__create__">Create new notebook</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {singleMoveTargetCollectionId === '__create__' ? (
              <div className="space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                  New notebook title
                </p>
                <Input
                  value={singleMoveNewNotebookTitle}
                  onChange={(event) => setSingleMoveNewNotebookTitle(event.target.value)}
                  placeholder="For example: Linear Equations Master Book"
                  className="h-10 rounded-2xl border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] text-sm"
                />
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="copilot-control-nav h-9 rounded-full px-3 text-sm"
                onClick={() => setSingleMoveItemId(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="copilot-control-commit h-9 rounded-full px-4 text-sm"
                disabled={
                  isSingleMoveSubmitting ||
                  (singleMoveTargetCollectionId === '__create__' && !singleMoveNewNotebookTitle.trim())
                }
                onClick={() => void handleMoveSingleNote()}
              >
                {isSingleMoveSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Move note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isNotebookSlideshowOpen}
        onOpenChange={(open) => {
          if (!open) closeNotebookSlideshow();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="h-[min(92vh,920px)] w-[min(1200px,96vw)] max-w-none rounded-[1.6rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] p-0"
        >
          <DialogTitle className="sr-only">Notebook slideshow</DialogTitle>
          <DialogDescription className="sr-only">
            Focused slideshow view for reading notebook notes with minimal controls.
            {notebookSlideshowSource ? ` Started from ${notebookSlideshowSource.replace('_', ' ')}.` : ''}
          </DialogDescription>
          <div className="flex h-full min-h-0 flex-col">
            <header className="flex items-center justify-between border-b border-[var(--copilot-soft-line)] px-4 py-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
                  Slideshow mode
                </p>
                <p className="truncate text-sm font-semibold text-[var(--copilot-text-primary)]">
                  {activeNotebookSlideshowCollection?.title || selectedCollection?.title || 'Notebook'}
                </p>
                {notebookSlideshowSource ? (
                  <p className="mt-1 text-[11px] text-[var(--copilot-text-tertiary)]">
                    {notebookSlideshowSource === 'note_menu'
                      ? 'Started from a note action.'
                      : notebookSlideshowSource === 'notebook_menu'
                        ? 'Started from notebook options.'
                        : 'Started from notebook header.'}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                className="copilot-control-nav h-8 rounded-full px-3 text-xs"
                onClick={closeNotebookSlideshow}
                title={
                  notebookSlideshowExitTarget?.itemId
                    ? 'Exit slideshow and return to your revision workspace'
                    : undefined
                }
              >
                Exit
              </Button>
            </header>
            <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
              {activeNotebookSlideshowItem ? (
                <article className="flex min-h-0 flex-1 flex-col rounded-[1.3rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-muted)] px-5 py-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="copilot-revision-pill">
                      Slide {Math.min(activeNotebookSlideshowIndex + 1, notebookSlideshowNoteIds.length)} / {notebookSlideshowNoteIds.length}
                    </span>
                    <span className="copilot-revision-pill">{getRevisionItemTypeLabel(activeNotebookSlideshowItem)}</span>
                    {notebookSlideshowStartNoteId && notebookSlideshowStartNoteId === activeNotebookSlideshowItem.id ? (
                      <span className="copilot-revision-pill">Starting note</span>
                    ) : null}
                    {activeNotebookSlideshowItem.topic ? (
                      <span className="copilot-revision-pill">{activeNotebookSlideshowItem.topic}</span>
                    ) : null}
                    {activeNotebookSlideshowItem.collectionTitle ? (
                      <span className="copilot-revision-pill">{activeNotebookSlideshowItem.collectionTitle}</span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-[var(--copilot-text-primary)]">
                    {activeNotebookSlideshowItem.title}
                  </h3>
                  <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                    {(activeNotebookSlideshowBlocks.length ? activeNotebookSlideshowBlocks : [activeNotebookSlideshowItem.summary]).map((block, index) => (
                      <p key={`${activeNotebookSlideshowItem.id}-slide-block-${index}`} className="text-base leading-8 text-[var(--copilot-text-primary)]">
                        {block}
                      </p>
                    ))}
                    {activeNotebookSlideshowQuickNotes.length ? (
                      <div className="rounded-[1rem] border border-[var(--copilot-soft-line)] bg-[var(--copilot-surface-1)] px-3 py-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                          Quick notes
                        </p>
                        <div className="mt-2 space-y-2">
                          {activeNotebookSlideshowQuickNotes.map((entry, index) => (
                            <p
                              key={entry.id}
                              className="text-sm leading-6 text-[var(--copilot-text-secondary)]"
                            >
                              {index + 1}. {entry.text}
                            </p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : (
                <div className="flex min-h-0 flex-1 items-center justify-center rounded-[1.3rem] border border-dashed border-[var(--copilot-soft-line)] text-sm text-[var(--copilot-text-secondary)]">
                  No notes to present in slideshow mode.
                </div>
              )}
              <div className="mt-3 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-4 text-sm"
                  disabled={notebookSlideshowNoteIds.length <= 1}
                  onClick={goToPreviousNotebookSlideshowSlide}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2">
                  {activeNotebookSlideshowItem ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="copilot-control-nav h-9 rounded-full px-4 text-sm"
                      onClick={() => {
                        setEffectiveSelectedItemId(activeNotebookSlideshowItem.id);
                        closeNotebookSlideshow();
                      }}
                    >
                      Open full note
                    </Button>
                  ) : null}
                  <p className="text-xs text-[var(--copilot-text-tertiary)]">
                    Use Left/Right arrows to navigate, Esc to exit.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  className="copilot-control-nav h-9 rounded-full px-4 text-sm"
                  disabled={notebookSlideshowNoteIds.length <= 1}
                  onClick={goToNextNotebookSlideshowSlide}
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(pendingNotebookDeleteMode)}
        onOpenChange={(open) => {
          if (!open) {
            setPendingNotebookDeleteMode(null);
            setNotebookDeleteError('');
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingNotebookDeleteMode === 'delete_with_items'
                ? 'Delete this notebook and all notes?'
                : 'Dissolve this notebook?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingNotebookDeleteMode === 'delete_with_items'
                ? 'This permanently deletes the notebook and every note inside it.'
                : 'This removes the notebook but keeps its notes as standalone saves.'}
            </AlertDialogDescription>
            {notebookDeleteError ? (
              <p className="text-xs leading-5 text-rose-600">{notebookDeleteError}</p>
            ) : null}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isNotebookDeleteActionLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleConfirmNotebookDelete()} disabled={isNotebookDeleteActionLoading}>
              {isNotebookDeleteActionLoading
                ? 'Working...'
                : pendingNotebookDeleteMode === 'delete_with_items'
                  ? 'Delete permanently'
                  : 'Dissolve notebook'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={isGuidedEngineModalOpen}
        onOpenChange={(open) => {
          if (!open) handleCloseGuidedRevision();
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="copilot-guided-engine-modal h-[min(90vh,860px)] w-[min(1120px,96vw)] max-w-none border-0 bg-transparent p-0 shadow-none"
        >
          <DialogTitle className="sr-only">Steadfast guided revision engine</DialogTitle>
          <DialogDescription className="sr-only">
            A Socratic guided revision flow designed to help students understand faster and connect related concepts.
          </DialogDescription>
          <div className="copilot-guided-engine-shell">
            <header className="copilot-guided-engine-header">
              <div className="min-w-0">
                <p className="copilot-guided-engine-status-pill">
                  <Sparkles className="h-3.5 w-3.5" />
                  Steadfast Revision Engine
                </p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em] text-[var(--copilot-text-primary)]">
                  {guidedRevisionSession?.item.title || 'Launching guided revision'}
                </h2>
                <p className="mt-1 text-sm text-[var(--copilot-text-secondary)]">
                  Recall-first tutoring, Socratic checks, and concept-link transfer in one focused revision workspace.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                className="copilot-control-nav h-9 rounded-full px-3 text-xs"
                onClick={handleCloseGuidedRevision}
              >
                <X className="mr-1.5 h-4 w-4" />
                Close engine
              </Button>
            </header>
            <div className="copilot-guided-engine-body">
              {guidedRevisionSession ? renderGuidedRevisionPanel() : renderGuidedEngineBootState()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}



