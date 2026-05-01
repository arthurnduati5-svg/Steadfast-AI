import type { RevisionFlashcard, RevisionItem } from '@/lib/types';

export type StudyToolId =
  | 'flashcards'
  | 'concept_map'
  | 'flow_diagram'
  | 'compare_table'
  | 'recall_sheet'
  | 'teach_back'
  | 'quick_check'
  | 'transfer_question';

export type StudyToolPurpose = 'recall' | 'visual' | 'understanding' | 'practice';

export type StudyNoteShape =
  | 'definition'
  | 'process'
  | 'comparison'
  | 'formula'
  | 'concept_web'
  | 'timeline'
  | 'diagram_based'
  | 'worked_step'
  | 'mistake_fix'
  | 'mixed';

export interface StudyToolDescriptor {
  id: StudyToolId;
  name: string;
  purpose: StudyToolPurpose;
  purposeLine: string;
  workspaceLine: string;
  actionLabel: string;
  cue: string;
  accent: 'teal' | 'blue' | 'amber' | 'rose' | 'indigo' | 'emerald' | 'slate' | 'cyan';
}

export interface StudyToolRecommendationEntry extends StudyToolDescriptor {
  score: number;
  reason: string;
}

export interface StudyToolSignals {
  hasDefinitionSignal: boolean;
  hasProcessSignal: boolean;
  hasComparisonSignal: boolean;
  hasFormulaSignal: boolean;
  hasTimelineSignal: boolean;
  hasDiagramSignal: boolean;
  hasMisconceptionRisk: boolean;
  hasConceptWebSignal: boolean;
  hasWorkedStepSignal: boolean;
}

export interface StudyFlashcard {
  id: string;
  question: string;
  answer: string;
  hint?: string | null;
}

export interface StudyConceptMapBranch {
  id: string;
  label: string;
  summary: string;
  subBranches: string[];
  misconception?: string | null;
}

export interface StudyConceptMapArtifact {
  centralIdea: string;
  branches: StudyConceptMapBranch[];
  linkedIdeas: Array<{ from: string; to: string; why: string }>;
  misconceptionMarkers: string[];
}

export interface StudyFlowStep {
  id: string;
  title: string;
  detail: string;
  dependsOn?: string | null;
  mistakePoint?: string | null;
}

export interface StudyFlowDiagramArtifact {
  steps: StudyFlowStep[];
}

export interface StudyCompareTableArtifact {
  conceptA: string;
  conceptB: string;
  similarities: string[];
  differences: Array<{ aspect: string; a: string; b: string }>;
  trapPoints: string[];
  memoryDistinction: string;
}

export interface StudyRecallSheetArtifact {
  whatToRemember: string[];
  commonConfusions: string[];
  quickSelfTest: string;
  applyPrompt: string;
  memoryHook: string;
}

export interface StudyTeachBackArtifact {
  prompt: string;
  anchorKeywords: string[];
  misconceptionWatch: string;
}

export interface StudyQuickCheckQuestion {
  id: string;
  prompt: string;
  expectedAnswer: string;
  expectedKeywords: string[];
}

export interface StudyQuickCheckArtifact {
  questions: StudyQuickCheckQuestion[];
}

export interface StudyTransferQuestionArtifact {
  scenario: string;
  prompt: string;
  expectedMoves: string[];
  watchOut: string;
}

export interface StudyToolArtifactSet {
  flashcards: { cards: StudyFlashcard[] };
  conceptMap: StudyConceptMapArtifact;
  flowDiagram: StudyFlowDiagramArtifact;
  compareTable: StudyCompareTableArtifact;
  recallSheet: StudyRecallSheetArtifact;
  teachBack: StudyTeachBackArtifact;
  quickCheck: StudyQuickCheckArtifact;
  transferQuestion: StudyTransferQuestionArtifact;
}

export interface StudyToolRecommendationResult {
  noteShape: StudyNoteShape;
  signals: StudyToolSignals;
  recommendedTools: StudyToolRecommendationEntry[];
  optionalTools: StudyToolRecommendationEntry[];
  reasons: Record<StudyToolId, string>;
  generatedArtifacts: StudyToolArtifactSet;
}

export interface StudyTeachBackEvaluation {
  clarity: 'clear' | 'developing' | 'unclear';
  correctness: 'strong' | 'partial' | 'struggled';
  missingIdea: string | null;
  misconception: string | null;
  feedback: string;
  score: number;
}

export interface StudyResponseEvaluation {
  correctness: 'correct' | 'partial' | 'struggled';
  score: number;
  feedback: string;
}

const STUDY_TOOL_DEFINITIONS: Record<StudyToolId, StudyToolDescriptor> = {
  flashcards: {
    id: 'flashcards',
    name: 'Flashcards',
    purpose: 'recall',
    purposeLine: 'Lock in terms, definitions, and formulas with quick recall cards.',
    workspaceLine: 'Flip through prompts, reveal answers, and shuffle for retrieval practice.',
    actionLabel: 'Open flashcards',
    cue: 'Recall cue',
    accent: 'teal',
  },
  concept_map: {
    id: 'concept_map',
    name: 'Concept Map',
    purpose: 'visual',
    purposeLine: 'See how ideas connect instead of revising them in isolation.',
    workspaceLine: 'Start from the core idea, then trace branches, links, and misconception points.',
    actionLabel: 'Open concept map',
    cue: 'Network cue',
    accent: 'blue',
  },
  flow_diagram: {
    id: 'flow_diagram',
    name: 'Flow Diagram',
    purpose: 'visual',
    purposeLine: 'Convert the note into an ordered process you can follow under pressure.',
    workspaceLine: 'Follow each step in sequence and track common mistake checkpoints.',
    actionLabel: 'Open flow diagram',
    cue: 'Sequence cue',
    accent: 'cyan',
  },
  compare_table: {
    id: 'compare_table',
    name: 'Compare Table',
    purpose: 'understanding',
    purposeLine: 'Separate look-alike ideas with clear differences and trap points.',
    workspaceLine: 'Use side-by-side differences, similarities, and memory distinctions.',
    actionLabel: 'Open compare table',
    cue: 'Contrast cue',
    accent: 'amber',
  },
  recall_sheet: {
    id: 'recall_sheet',
    name: 'Recall Sheet',
    purpose: 'recall',
    purposeLine: 'Turn this into a one-page active revision surface.',
    workspaceLine: 'See key memory targets, confusion points, a self-test, and one apply prompt.',
    actionLabel: 'Open recall sheet',
    cue: 'Revision sheet cue',
    accent: 'indigo',
  },
  teach_back: {
    id: 'teach_back',
    name: 'Teach Back',
    purpose: 'understanding',
    purposeLine: 'Explain the idea in your own words and check understanding quality.',
    workspaceLine: 'Write a short explanation and get concise clarity and correctness feedback.',
    actionLabel: 'Open teach back',
    cue: 'Explain cue',
    accent: 'emerald',
  },
  quick_check: {
    id: 'quick_check',
    name: 'Quick Check',
    purpose: 'practice',
    purposeLine: 'Run a fast retrieval check before moving on.',
    workspaceLine: 'Answer 1 to 3 rapid questions, review, and retry weak points.',
    actionLabel: 'Open quick check',
    cue: 'Prompt cue',
    accent: 'rose',
  },
  transfer_question: {
    id: 'transfer_question',
    name: 'Transfer Question',
    purpose: 'practice',
    purposeLine: 'Apply this concept in a new scenario to test flexible understanding.',
    workspaceLine: 'Work through a fresh case and compare your response with expected moves.',
    actionLabel: 'Open transfer question',
    cue: 'Application cue',
    accent: 'slate',
  },
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'and',
  'are',
  'as',
  'at',
  'be',
  'by',
  'for',
  'from',
  'how',
  'if',
  'in',
  'into',
  'is',
  'it',
  'of',
  'on',
  'or',
  'that',
  'the',
  'their',
  'then',
  'there',
  'these',
  'this',
  'to',
  'when',
  'with',
  'you',
  'your',
]);

const SHAPE_TOOL_SCORES: Record<StudyNoteShape, Partial<Record<StudyToolId, number>>> = {
  definition: {
    flashcards: 9,
    recall_sheet: 8,
    quick_check: 7,
    teach_back: 6,
    compare_table: 4,
    transfer_question: 4,
    concept_map: 3,
    flow_diagram: 2,
  },
  process: {
    flow_diagram: 9,
    quick_check: 8,
    recall_sheet: 7,
    transfer_question: 6,
    teach_back: 5,
    flashcards: 4,
    concept_map: 4,
    compare_table: 3,
  },
  comparison: {
    compare_table: 10,
    teach_back: 8,
    quick_check: 7,
    recall_sheet: 6,
    transfer_question: 6,
    concept_map: 5,
    flashcards: 4,
    flow_diagram: 2,
  },
  formula: {
    flashcards: 10,
    quick_check: 8,
    flow_diagram: 7,
    recall_sheet: 6,
    transfer_question: 6,
    teach_back: 4,
    compare_table: 4,
    concept_map: 3,
  },
  concept_web: {
    concept_map: 10,
    transfer_question: 8,
    teach_back: 7,
    recall_sheet: 6,
    quick_check: 6,
    compare_table: 5,
    flashcards: 4,
    flow_diagram: 3,
  },
  timeline: {
    flow_diagram: 8,
    quick_check: 7,
    recall_sheet: 7,
    compare_table: 6,
    flashcards: 5,
    transfer_question: 5,
    concept_map: 4,
    teach_back: 4,
  },
  diagram_based: {
    concept_map: 9,
    compare_table: 7,
    recall_sheet: 6,
    quick_check: 6,
    transfer_question: 5,
    teach_back: 5,
    flashcards: 4,
    flow_diagram: 4,
  },
  worked_step: {
    flow_diagram: 10,
    quick_check: 8,
    transfer_question: 7,
    recall_sheet: 6,
    teach_back: 5,
    flashcards: 4,
    concept_map: 4,
    compare_table: 3,
  },
  mistake_fix: {
    compare_table: 8,
    quick_check: 8,
    teach_back: 7,
    flow_diagram: 6,
    recall_sheet: 6,
    transfer_question: 6,
    flashcards: 5,
    concept_map: 4,
  },
  mixed: {
    recall_sheet: 8,
    quick_check: 7,
    teach_back: 6,
    flashcards: 6,
    concept_map: 6,
    transfer_question: 5,
    compare_table: 5,
    flow_diagram: 5,
  },
};

function normalizeText(value: string | null | undefined): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toLowerText(value: string | null | undefined): string {
  return normalizeText(value).toLowerCase();
}

function getStudyBlocks(value: string | null | undefined): string[] {
  const content = String(value || '').trim();
  if (!content) return [];
  const paragraphs = content
    .split(/\n{2,}/)
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
  if (paragraphs.length) return paragraphs;
  return content
    .split(/(?<=[.!?])\s+/)
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
}

function splitSentences(value: string): string[] {
  return normalizeText(value)
    .split(/(?<=[.!?])\s+/)
    .map((entry) => normalizeText(entry))
    .filter(Boolean);
}

function clip(value: string, max = 220): string {
  const clean = normalizeText(value);
  if (!clean) return '';
  return clean.length <= max ? clean : `${clean.slice(0, Math.max(0, max - 1)).trimEnd()}...`;
}

function firstSentence(value: string, max = 180): string {
  const sentence = splitSentences(value)[0] || normalizeText(value);
  return clip(sentence, max);
}

function dedupe<T>(values: T[]): T[] {
  return [...new Set(values)];
}

function titleCase(value: string): string {
  if (!value) return '';
  return value
    .split(/\s+/)
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1))
    .join(' ');
}

function extractTopTerms(source: string, max = 10): string[] {
  const counts = new Map<string, number>();
  const tokens = normalizeText(source)
    .toLowerCase()
    .split(/[^a-z0-9_]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 4 && !STOP_WORDS.has(token));

  tokens.forEach((token) => {
    counts.set(token, (counts.get(token) || 0) + 1);
  });

  return [...counts.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return a[0].localeCompare(b[0]);
    })
    .map(([token]) => token)
    .slice(0, max);
}

function findSentencesWithToken(sentences: string[], token: string, max = 2): string[] {
  const normalizedToken = token.toLowerCase();
  return sentences.filter((sentence) => sentence.toLowerCase().includes(normalizedToken)).slice(0, max);
}

function getComparisonPair(text: string, terms: string[]): { a: string; b: string } {
  const vsMatch = text.match(/([A-Za-z][A-Za-z0-9\s\-]{2,32})\s+(?:vs\.?|versus)\s+([A-Za-z][A-Za-z0-9\s\-]{2,32})/i);
  if (vsMatch) {
    return {
      a: clip(vsMatch[1], 32),
      b: clip(vsMatch[2], 32),
    };
  }

  const betweenMatch = text.match(/difference\s+between\s+([A-Za-z][A-Za-z0-9\s\-]{2,30})\s+and\s+([A-Za-z][A-Za-z0-9\s\-]{2,30})/i);
  if (betweenMatch) {
    return {
      a: clip(betweenMatch[1], 32),
      b: clip(betweenMatch[2], 32),
    };
  }

  const fallbackA = terms[0] ? titleCase(terms[0]) : 'Concept A';
  const fallbackB = terms[1] ? titleCase(terms[1]) : 'Concept B';
  return { a: fallbackA, b: fallbackB };
}

function getScenarioBySubject(subject: string | null | undefined, topic: string): string {
  const normalized = toLowerText(subject);
  if (normalized.includes('math')) {
    return `A student is solving a new ${topic} question in an exam and gets stuck after the first line.`;
  }
  if (normalized.includes('chemistry') || normalized.includes('physics') || normalized.includes('biology')) {
    return `In a practical question, a learner must apply ${topic} to explain what happens in a new experiment setup.`;
  }
  if (normalized.includes('geography') || normalized.includes('history')) {
    return `During a case-study question, the examiner gives a new situation and asks the learner to apply ${topic}.`;
  }
  if (normalized.includes('english') || normalized.includes('literature')) {
    return `In a comprehension context, a learner must use ${topic} to justify an interpretation with evidence.`;
  }
  if (normalized.includes('business') || normalized.includes('ict')) {
    return `A real-world scenario asks the learner to use ${topic} to make a practical decision.`;
  }
  return `A new revision scenario asks the learner to apply ${topic} in a context not used in the original note.`;
}

function buildSignals(args: { item: RevisionItem; text: string; blocks: string[] }): StudyToolSignals {
  const normalized = args.text;
  const contentType = toLowerText(args.item.contentType);
  const saveType = toLowerText(args.item.saveType || '');
  const mediaType = toLowerText(args.item.mediaType || '');

  const hasDefinitionSignal =
    contentType === 'definition' ||
    saveType === 'definition' ||
    /\bdefined as\b|\brefers to\b|\bis a\b|\bmeans\b/.test(normalized);

  const hasProcessSignal =
    /\bfirst\b|\bsecond\b|\bthen\b|\bnext\b|\bafter\b|\bfinally\b|\bstep\b|\bprocedure\b|\bworkflow\b/.test(normalized) ||
    args.blocks.some((block) => /^\d+[).:-]/.test(block));

  const hasComparisonSignal =
    saveType === 'mistake_to_fix' ||
    /\bvs\b|\bversus\b|\bcompare\b|\bdifference\b|\bsimilarit(?:y|ies)\b|\bwhereas\b|\bunlike\b/.test(normalized);

  const hasFormulaSignal =
    contentType === 'formula' ||
    saveType === 'formula' ||
    /[A-Za-z]\s*=\s*[^=]/.test(normalized) ||
    /\bformula\b|\bequation\b/.test(normalized);

  const hasTimelineSignal = /\btimeline\b|\bera\b|\bcentury\b|\bbefore\b|\bafter\b|\byear\b|\bsequence of events\b/.test(normalized);

  const hasDiagramSignal =
    contentType === 'image' ||
    mediaType === 'image' ||
    /\bdiagram\b|\bfigure\b|\bmap\b|\bchart\b|\blabel\b/.test(normalized);

  const hasMisconceptionRisk =
    Boolean(args.item.isMistakeBased) ||
    saveType === 'mistake_to_fix' ||
    /\btrap\b|\bmisconception\b|\bconfuse\b|\bmistake\b|\bwrong\b/.test(normalized);

  const hasConceptWebSignal =
    /\brelationship\b|\bconnected\b|\blink\b|\binteract\b|\bsystem\b|\bcause and effect\b/.test(normalized) ||
    (Array.isArray(args.item.connectedGraph?.links) && (args.item.connectedGraph?.links?.length || 0) > 1);

  const hasWorkedStepSignal = contentType === 'worked_step' || saveType === 'worked_step' || /\bworked example\b|\bshow your working\b/.test(normalized);

  return {
    hasDefinitionSignal,
    hasProcessSignal,
    hasComparisonSignal,
    hasFormulaSignal,
    hasTimelineSignal,
    hasDiagramSignal,
    hasMisconceptionRisk,
    hasConceptWebSignal,
    hasWorkedStepSignal,
  };
}

export function classifyRevisionNoteShape(item: RevisionItem): {
  noteShape: StudyNoteShape;
  signals: StudyToolSignals;
  blocks: string[];
  text: string;
  sentences: string[];
} {
  const blocks = getStudyBlocks(item.content || item.summary || '');
  const text = toLowerText([item.title, item.summary, item.content, item.topic, item.subtopic, ...(item.tags || [])].join(' '));
  const sentences = splitSentences([item.summary || '', item.content || ''].join(' '));
  const signals = buildSignals({ item, text, blocks });
  const contentType = toLowerText(item.contentType);
  const saveType = toLowerText(item.saveType || '');

  if (contentType === 'worked_step' || saveType === 'worked_step') {
    return { noteShape: 'worked_step', signals, blocks, text, sentences };
  }
  if (contentType === 'formula' || saveType === 'formula') {
    return { noteShape: 'formula', signals, blocks, text, sentences };
  }
  if (contentType === 'definition' || saveType === 'definition') {
    return { noteShape: 'definition', signals, blocks, text, sentences };
  }

  const weightedSignals: Array<[StudyNoteShape, number]> = [
    ['formula', signals.hasFormulaSignal ? 3 : 0],
    ['comparison', signals.hasComparisonSignal ? 3 : 0],
    ['worked_step', signals.hasWorkedStepSignal ? 3 : 0],
    ['process', signals.hasProcessSignal ? 2 : 0],
    ['timeline', signals.hasTimelineSignal ? 2 : 0],
    ['diagram_based', signals.hasDiagramSignal ? 2 : 0],
    ['concept_web', signals.hasConceptWebSignal ? 2 : 0],
    ['definition', signals.hasDefinitionSignal ? 2 : 0],
    ['mistake_fix', signals.hasMisconceptionRisk ? 2 : 0],
  ];

  weightedSignals.sort((a, b) => b[1] - a[1]);
  const [topShape, topScore] = weightedSignals[0];
  const secondScore = weightedSignals[1]?.[1] || 0;

  let noteShape: StudyNoteShape;
  if (topScore <= 0) {
    noteShape = 'mixed';
  } else if (topScore <= 2 && secondScore >= 2) {
    noteShape = 'mixed';
  } else {
    noteShape = topShape;
  }

  return { noteShape, signals, blocks, text, sentences };
}

function scoreTools(args: {
  noteShape: StudyNoteShape;
  signals: StudyToolSignals;
  blockCount: number;
}): Record<StudyToolId, number> {
  const base = SHAPE_TOOL_SCORES[args.noteShape];
  const scores: Record<StudyToolId, number> = {
    flashcards: base.flashcards || 0,
    concept_map: base.concept_map || 0,
    flow_diagram: base.flow_diagram || 0,
    compare_table: base.compare_table || 0,
    recall_sheet: base.recall_sheet || 0,
    teach_back: base.teach_back || 0,
    quick_check: base.quick_check || 0,
    transfer_question: base.transfer_question || 0,
  };

  if (args.signals.hasMisconceptionRisk) {
    scores.compare_table += 2;
    scores.teach_back += 1;
    scores.quick_check += 1;
  }
  if (args.signals.hasFormulaSignal) {
    scores.flashcards += 2;
    scores.quick_check += 1;
  }
  if (args.signals.hasProcessSignal || args.signals.hasWorkedStepSignal) {
    scores.flow_diagram += 2;
  }
  if (args.signals.hasConceptWebSignal || args.blockCount >= 3) {
    scores.concept_map += 1;
    scores.transfer_question += 1;
  }
  if (args.signals.hasDefinitionSignal) {
    scores.recall_sheet += 1;
  }
  if (args.signals.hasComparisonSignal) {
    scores.compare_table += 2;
  }

  return scores;
}

function buildReasons(args: {
  noteShape: StudyNoteShape;
  signals: StudyToolSignals;
}): Record<StudyToolId, string> {
  const byShape: Record<StudyNoteShape, string> = {
    definition: 'This note is definition-heavy, so recall-first formats will help lock terms quickly.',
    process: 'This note has procedural flow, so sequence-based study tools are the strongest fit.',
    comparison: 'This note contains look-alike ideas, so contrast and explanation tools are prioritized.',
    formula: 'This note includes formulas/equations, so retrieval and quick checking are prioritized.',
    concept_web: 'This note has linked ideas, so visual mapping and transfer are high-value first moves.',
    timeline: 'This note has chronological structure, so ordered flow and retrieval are prioritized.',
    diagram_based: 'This note references visuals/diagrams, so spatial structure and contrast tools are prioritized.',
    worked_step: 'This note is method-focused, so step-by-step and quick-check tools are the strongest fit.',
    mistake_fix: 'This note has misconception risk, so confusion-resolving tools come first.',
    mixed: 'This note is mixed, so a balanced recall + check combination is recommended first.',
  };

  const base = byShape[args.noteShape];

  return {
    flashcards: args.signals.hasFormulaSignal
      ? 'Formula cues detected: flashcards will strengthen rapid equation recall.'
      : `${base} Flashcards convert this into fast retrieval cards.`,
    concept_map: args.signals.hasConceptWebSignal || args.signals.hasDiagramSignal
      ? 'Linked/visual ideas detected: concept mapping will clarify how pieces connect.'
      : `${base} Concept mapping reveals hidden connections between ideas.`,
    flow_diagram: args.signals.hasProcessSignal || args.signals.hasWorkedStepSignal
      ? 'Step language detected: flow view will stabilize the order under exam pressure.'
      : `${base} Flow view helps sequence thinking into usable steps.`,
    compare_table: args.signals.hasComparisonSignal || args.signals.hasMisconceptionRisk
      ? 'Comparison/misconception signals detected: side-by-side contrast reduces confusion.'
      : `${base} Compare table highlights distinctions and trap points.`,
    recall_sheet: `${base} Recall Sheet turns this into one active revision page.`,
    teach_back: args.signals.hasMisconceptionRisk
      ? 'Misconception risk detected: teach-back checks whether understanding is truly clear.'
      : `${base} Teach-back verifies clarity in your own words.`,
    quick_check: `${base} Quick Check creates immediate retrieval pressure with low friction.`,
    transfer_question: `${base} Transfer Question checks if you can use this idea in a new case.`,
  };
}

function buildFlashcards(args: {
  item: RevisionItem;
  blocks: string[];
  existingFlashcards?: RevisionFlashcard[];
}): { cards: StudyFlashcard[] } {
  if (args.existingFlashcards?.length) {
    return {
      cards: args.existingFlashcards.slice(0, 10).map((card) => ({
        id: card.id,
        question: clip(card.front, 170),
        answer: clip(card.back, 260),
        hint: card.hint ? clip(card.hint, 120) : null,
      })),
    };
  }

  const topic = clip(args.item.topic || args.item.title || 'this note', 70);
  const cards: StudyFlashcard[] = [];
  const seen = new Set<string>();

  const push = (question: string, answer: string, hint?: string | null) => {
    const normalizedAnswer = normalizeText(answer).toLowerCase();
    if (!normalizedAnswer || seen.has(normalizedAnswer)) return;
    seen.add(normalizedAnswer);
    cards.push({
      id: `${args.item.id}-study-card-${cards.length + 1}`,
      question: clip(question, 170),
      answer: clip(answer, 260),
      hint: hint ? clip(hint, 120) : null,
    });
  };

  if (normalizeText(args.item.summary)) {
    push(
      `In one line, what is the core idea of ${topic}?`,
      firstSentence(args.item.summary || '', 220),
      'Answer before revealing.'
    );
  }

  args.blocks.slice(0, 5).forEach((block, index) => {
    push(
      `What should you recall from section ${index + 1}?`,
      firstSentence(block, 220),
      'Name the key move, then check.'
    );
  });

  if (cards.length < 3) {
    push(
      `What is one exam trap in ${topic}?`,
      clip(
        normalizeText(args.item.summary) ||
          'Confusing similar ideas without stating the distinction clearly.',
        220
      ),
      'State the trap and correction.'
    );
  }

  return { cards: cards.slice(0, 8) };
}

function buildConceptMap(args: {
  item: RevisionItem;
  text: string;
  blocks: string[];
  sentences: string[];
  signals: StudyToolSignals;
}): StudyConceptMapArtifact {
  const centralIdea = clip(args.item.topic || args.item.title || 'This note', 72);
  const topTerms = extractTopTerms(args.text, 8);
  const misconceptionLines = args.sentences
    .filter((sentence) => /\bconfuse|mistake|trap|misconception|wrong\b/i.test(sentence))
    .slice(0, 3)
    .map((line) => clip(line, 130));

  const branches: StudyConceptMapBranch[] = (topTerms.length ? topTerms : ['core idea', 'method', 'application'])
    .slice(0, 4)
    .map((term, index) => {
      const branchSentences = findSentencesWithToken(args.sentences, term, 2);
      const summary = clip(branchSentences[0] || args.blocks[index] || `Key idea linked to ${term}.`, 120);
      const subBranches = dedupe(
        branchSentences
          .slice(1)
          .map((sentence) => clip(sentence, 88))
          .filter(Boolean)
      ).slice(0, 3);
      return {
        id: `branch-${index + 1}`,
        label: titleCase(term),
        summary,
        subBranches: subBranches.length ? subBranches : [`Revisit how ${titleCase(term)} connects to ${centralIdea}.`],
        misconception:
          args.signals.hasMisconceptionRisk && misconceptionLines[index]
            ? misconceptionLines[index]
            : null,
      };
    });

  const linkedIdeas = branches.slice(1).map((branch) => ({
    from: branches[0]?.label || centralIdea,
    to: branch.label,
    why: `Both contribute to understanding ${centralIdea}.`,
  }));

  return {
    centralIdea,
    branches,
    linkedIdeas,
    misconceptionMarkers: misconceptionLines,
  };
}

function buildFlowDiagram(args: {
  item: RevisionItem;
  blocks: string[];
  sentences: string[];
  signals: StudyToolSignals;
}): StudyFlowDiagramArtifact {
  const candidateSteps = args.blocks
    .flatMap((block) => {
      const numbered = block.match(/^\d+[).:-]\s*(.+)$/);
      if (numbered) return [numbered[1]];
      const splitByConnector = block.split(/\bthen\b|\bnext\b|\bafter that\b|\bfinally\b/gi);
      if (splitByConnector.length > 1) return splitByConnector;
      return [firstSentence(block, 170)];
    })
    .map((step) => clip(step, 140))
    .filter(Boolean);

  const cleanSteps = dedupe(candidateSteps).slice(0, 6);
  const stepsPool = cleanSteps.length >= 2
    ? cleanSteps
    : [
        `Read and restate the core idea of ${args.item.topic || args.item.title}.`,
        'Identify the method or rule to apply.',
        'Run one quick check and confirm the final reasoning.',
      ];

  const mistakeLines = args.sentences
    .filter((sentence) => /\bmistake|trap|avoid|wrong\b/i.test(sentence))
    .map((line) => clip(line, 120));

  const steps = stepsPool.map((step, index) => ({
    id: `step-${index + 1}`,
    title: `Step ${index + 1}`,
    detail: step,
    dependsOn: index === 0 ? null : `step-${index}`,
    mistakePoint: args.signals.hasMisconceptionRisk ? mistakeLines[index] || null : null,
  }));

  return { steps };
}

function buildCompareTable(args: {
  item: RevisionItem;
  text: string;
  sentences: string[];
}): StudyCompareTableArtifact {
  const terms = extractTopTerms(args.text, 6);
  const pair = getComparisonPair(args.text, terms);

  const similarityPool = args.sentences
    .filter((sentence) => sentence.toLowerCase().includes(pair.a.toLowerCase()) && sentence.toLowerCase().includes(pair.b.toLowerCase()))
    .map((line) => clip(line, 110));

  const contrastPool = args.sentences
    .filter((sentence) => /\bwhereas|however|unlike|different|but\b/i.test(sentence))
    .map((line) => clip(line, 118));

  const trapPool = args.sentences
    .filter((sentence) => /\bconfuse|trap|mistake|wrong\b/i.test(sentence))
    .map((line) => clip(line, 118));

  const similarities = similarityPool.length
    ? similarityPool.slice(0, 2)
    : [
        `Both relate to ${args.item.topic || args.item.title}.`,
        'Both can appear in short-answer and explanation questions.',
      ];

  const differences = contrastPool.length
    ? contrastPool.slice(0, 3).map((line, index) => ({
        aspect: `Difference ${index + 1}`,
        a: line,
        b: `Contrast this with ${pair.b} and state the exact distinction.`,
      }))
    : [
        {
          aspect: 'Core focus',
          a: `${pair.a} focuses on one side of the idea.`,
          b: `${pair.b} focuses on the contrasting side.`,
        },
        {
          aspect: 'Exam cue',
          a: `Use ${pair.a} when the question asks for this specific condition.`,
          b: `Use ${pair.b} when the question shifts to the alternate condition.`,
        },
      ];

  const trapPoints = trapPool.length
    ? trapPool.slice(0, 2)
    : [`Do not swap ${pair.a} and ${pair.b} without stating the trigger condition.`];

  return {
    conceptA: pair.a,
    conceptB: pair.b,
    similarities,
    differences,
    trapPoints,
    memoryDistinction: `Memory line: "${pair.a} does this, ${pair.b} does that."`,
  };
}

function buildRecallSheet(args: {
  item: RevisionItem;
  sentences: string[];
  terms: string[];
  signals: StudyToolSignals;
}): StudyRecallSheetArtifact {
  const remember = dedupe(args.sentences.map((line) => firstSentence(line, 115)).filter(Boolean)).slice(0, 4);
  const whatToRemember = remember.length
    ? remember
    : [
        `Define ${args.item.topic || args.item.title} in one line.`,
        'State the key rule clearly before applying it.',
        'Name one common trap and correction.',
      ];

  const confusionLines = args.sentences
    .filter((line) => /\bconfuse|trap|mistake|wrong|avoid\b/i.test(line))
    .map((line) => clip(line, 115));

  const commonConfusions = confusionLines.length
    ? confusionLines.slice(0, 3)
    : [
        args.signals.hasComparisonSignal
          ? 'Confusing look-alike concepts without stating the difference.'
          : 'Skipping the key method before answering.',
      ];

  const testAnchor = args.terms[0] ? titleCase(args.terms[0]) : args.item.topic || args.item.title;
  const quickSelfTest = `Self-test: Explain ${testAnchor} from memory in under 30 seconds.`;
  const applyPrompt = `Apply prompt: Use ${args.item.topic || args.item.title} in one new example not copied from this note.`;

  const hookTokens = args.terms.slice(0, 3).map((term) => term.charAt(0).toUpperCase());
  const memoryHook = hookTokens.length >= 2
    ? `Memory hook: ${hookTokens.join('-')} = ${args.terms.slice(0, hookTokens.length).map((term) => titleCase(term)).join(', ')}.`
    : `Memory hook: "Say it, test it, apply it" for ${args.item.topic || args.item.title}.`;

  return {
    whatToRemember,
    commonConfusions,
    quickSelfTest,
    applyPrompt,
    memoryHook,
  };
}

function buildTeachBack(args: {
  item: RevisionItem;
  terms: string[];
  signals: StudyToolSignals;
}): StudyTeachBackArtifact {
  const topic = args.item.topic || args.item.title;
  return {
    prompt: `Teach back in 2 lines: explain ${topic} simply, then add one correct technical point.`,
    anchorKeywords: dedupe(args.terms.slice(0, 6).map((term) => term.toLowerCase())),
    misconceptionWatch: args.signals.hasMisconceptionRisk
      ? 'Watch out for the same misconception seen in this note.'
      : `Avoid vague language. Name the exact rule behind ${topic}.`,
  };
}

function buildQuickCheck(args: {
  item: RevisionItem;
  flashcards: { cards: StudyFlashcard[] };
  sentences: string[];
}): StudyQuickCheckArtifact {
  const fromCards = args.flashcards.cards.slice(0, 3).map((card, index) => ({
    id: `qc-card-${index + 1}`,
    prompt: card.question,
    expectedAnswer: card.answer,
    expectedKeywords: extractTopTerms(card.answer, 4),
  }));

  if (fromCards.length >= 2) {
    return { questions: fromCards };
  }

  const topic = args.item.topic || args.item.title;
  const firstExpected = firstSentence(args.sentences[0] || args.item.summary || '', 160);
  const secondExpected = firstSentence(args.sentences[1] || args.item.content || '', 160);

  return {
    questions: [
      {
        id: 'qc-1',
        prompt: `What is the core idea behind ${topic}?`,
        expectedAnswer: firstExpected || `State the main rule for ${topic}.`,
        expectedKeywords: extractTopTerms(firstExpected || topic, 4),
      },
      {
        id: 'qc-2',
        prompt: `What is one common error when using ${topic}?`,
        expectedAnswer: secondExpected || 'Mixing conditions or skipping the method check.',
        expectedKeywords: extractTopTerms(secondExpected || 'common error method condition', 4),
      },
    ],
  };
}

function buildTransferQuestion(args: {
  item: RevisionItem;
  recallSheet: StudyRecallSheetArtifact;
  teachBack: StudyTeachBackArtifact;
}): StudyTransferQuestionArtifact {
  const topic = args.item.topic || args.item.title;
  return {
    scenario: getScenarioBySubject(args.item.subject || null, topic),
    prompt: `Transfer prompt: apply ${topic} to this new case and explain your reasoning in 3 to 5 lines.`,
    expectedMoves: [
      args.recallSheet.whatToRemember[0] || `State the relevant rule for ${topic}.`,
      args.recallSheet.whatToRemember[1] || 'Show one step of reasoning clearly.',
      args.teachBack.misconceptionWatch,
    ].slice(0, 3),
    watchOut: `Do not copy the original note wording. Show how ${topic} transfers to a fresh case.`,
  };
}

export function evaluateTeachBackResponse(
  response: string,
  artifact: StudyTeachBackArtifact
): StudyTeachBackEvaluation {
  const normalized = normalizeText(response).toLowerCase();
  if (!normalized) {
    return {
      clarity: 'unclear',
      correctness: 'struggled',
      missingIdea: 'No explanation provided yet.',
      misconception: null,
      feedback: 'Write a short 2-line explanation first, then check clarity and correctness.',
      score: 0,
    };
  }

  const matchedKeywords = artifact.anchorKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  const keywordCoverage = artifact.anchorKeywords.length
    ? matchedKeywords.length / artifact.anchorKeywords.length
    : 0;

  const hasBecause = /\bbecause\b|\btherefore\b|\bso that\b|\bthereby\b/.test(normalized);
  const sentenceCount = splitSentences(response).length || 1;
  const concise = sentenceCount <= 4;

  const score = Math.round(
    Math.min(1, keywordCoverage * 0.7 + (hasBecause ? 0.2 : 0) + (concise ? 0.1 : 0)) * 100
  );

  const correctness: StudyTeachBackEvaluation['correctness'] =
    score >= 72 ? 'strong' : score >= 46 ? 'partial' : 'struggled';
  const clarity: StudyTeachBackEvaluation['clarity'] =
    sentenceCount <= 3 && hasBecause ? 'clear' : sentenceCount <= 5 ? 'developing' : 'unclear';

  const missingKeyword = artifact.anchorKeywords.find((keyword) => !matchedKeywords.includes(keyword));
  const missingIdea = missingKeyword ? `Missing anchor idea: ${titleCase(missingKeyword)}.` : null;

  const misconception = !hasBecause
    ? 'Reasoning link is weak. Add a short because/therefore explanation.'
    : null;

  const feedback =
    correctness === 'strong'
      ? 'Clear and mostly correct. Keep this structure in exams.'
      : correctness === 'partial'
      ? 'Good start. Tighten the technical vocabulary and reasoning link.'
      : 'Needs a clearer explanation. State the core rule first, then give one precise line.';

  return {
    clarity,
    correctness,
    missingIdea,
    misconception,
    feedback,
    score,
  };
}

export function evaluateQuickCheckAnswer(
  response: string,
  question: StudyQuickCheckQuestion
): StudyResponseEvaluation {
  const normalized = normalizeText(response).toLowerCase();
  if (!normalized) {
    return {
      correctness: 'struggled',
      score: 0,
      feedback: 'No answer entered. Try a short attempt before revealing.',
    };
  }

  const expectedKeywords = question.expectedKeywords.length
    ? question.expectedKeywords
    : extractTopTerms(question.expectedAnswer, 4);
  const matched = expectedKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  const score = expectedKeywords.length
    ? Math.round((matched.length / expectedKeywords.length) * 100)
    : normalized.includes(normalizeText(question.expectedAnswer).toLowerCase())
      ? 100
      : 30;

  const correctness: StudyResponseEvaluation['correctness'] =
    score >= 75 ? 'correct' : score >= 40 ? 'partial' : 'struggled';

  return {
    correctness,
    score,
    feedback:
      correctness === 'correct'
        ? 'Strong retrieval. Move to the next check.'
        : correctness === 'partial'
        ? 'Partly correct. Add one missing keyword to complete it.'
        : 'Not there yet. Revisit the recall sheet, then retry.',
  };
}

export function evaluateTransferResponse(
  response: string,
  artifact: StudyTransferQuestionArtifact
): StudyResponseEvaluation {
  const normalized = normalizeText(response).toLowerCase();
  if (!normalized) {
    return {
      correctness: 'struggled',
      score: 0,
      feedback: 'Write a short applied response first so transfer can be checked.',
    };
  }

  const moveKeywords = dedupe(
    artifact.expectedMoves.flatMap((move) => extractTopTerms(move, 3))
  ).slice(0, 8);

  const matched = moveKeywords.filter((keyword) => normalized.includes(keyword.toLowerCase()));
  const hasScenarioLanguage = /\bcase\b|\bscenario\b|\bcontext\b|\bexample\b|\bapply\b/.test(normalized);

  const score = Math.round(
    Math.min(1, (moveKeywords.length ? matched.length / moveKeywords.length : 0) * 0.75 + (hasScenarioLanguage ? 0.25 : 0)) * 100
  );

  const correctness: StudyResponseEvaluation['correctness'] =
    score >= 70 ? 'correct' : score >= 42 ? 'partial' : 'struggled';

  return {
    correctness,
    score,
    feedback:
      correctness === 'correct'
        ? 'Good transfer: you applied the concept to a fresh context.'
        : correctness === 'partial'
        ? 'Partial transfer. Name one clearer rule-to-scenario link.'
        : 'Transfer is weak. Start with the rule, then map it to this scenario.',
  };
}

export function getStudyToolDescriptor(toolId: StudyToolId): StudyToolDescriptor {
  return STUDY_TOOL_DEFINITIONS[toolId];
}

export function buildStudyToolRecommendation(args: {
  item: RevisionItem;
  existingFlashcards?: RevisionFlashcard[];
}): StudyToolRecommendationResult {
  const classified = classifyRevisionNoteShape(args.item);
  const reasons = buildReasons({ noteShape: classified.noteShape, signals: classified.signals });
  const scores = scoreTools({
    noteShape: classified.noteShape,
    signals: classified.signals,
    blockCount: classified.blocks.length,
  });

  const rankedTools = (Object.keys(STUDY_TOOL_DEFINITIONS) as StudyToolId[])
    .map((toolId) => ({
      ...STUDY_TOOL_DEFINITIONS[toolId],
      score: scores[toolId],
      reason: reasons[toolId],
    }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.name.localeCompare(b.name);
    });

  const recommendedTools = rankedTools.slice(0, 2);
  const optionalTools = rankedTools.slice(2).filter((entry) => entry.score >= 3).slice(0, 5);

  const terms = extractTopTerms(classified.text, 10);
  const flashcards = buildFlashcards({
    item: args.item,
    blocks: classified.blocks,
    existingFlashcards: args.existingFlashcards,
  });
  const conceptMap = buildConceptMap({
    item: args.item,
    text: classified.text,
    blocks: classified.blocks,
    sentences: classified.sentences,
    signals: classified.signals,
  });
  const flowDiagram = buildFlowDiagram({
    item: args.item,
    blocks: classified.blocks,
    sentences: classified.sentences,
    signals: classified.signals,
  });
  const compareTable = buildCompareTable({
    item: args.item,
    text: classified.text,
    sentences: classified.sentences,
  });
  const recallSheet = buildRecallSheet({
    item: args.item,
    sentences: classified.sentences,
    terms,
    signals: classified.signals,
  });
  const teachBack = buildTeachBack({
    item: args.item,
    terms,
    signals: classified.signals,
  });
  const quickCheck = buildQuickCheck({
    item: args.item,
    flashcards,
    sentences: classified.sentences,
  });
  const transferQuestion = buildTransferQuestion({
    item: args.item,
    recallSheet,
    teachBack,
  });

  return {
    noteShape: classified.noteShape,
    signals: classified.signals,
    recommendedTools,
    optionalTools,
    reasons,
    generatedArtifacts: {
      flashcards,
      conceptMap,
      flowDiagram,
      compareTable,
      recallSheet,
      teachBack,
      quickCheck,
      transferQuestion,
    },
  };
}
