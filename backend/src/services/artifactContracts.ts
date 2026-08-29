// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Contracts v1
// Domain: structured artifact pipeline
// Every artifact type must originate from this file.
// ─────────────────────────────────────────────────────────────

// ── Artifact Enums ──

export type ArtifactKind =
  | 'pdf'
  | 'image'
  | 'worksheet'
  | 'transcript'
  | 'notes'
  | 'document'
  | 'text'
  | 'unknown';

export type ArtifactAccessScope =
  | 'student_private'
  | 'teacher_to_student'
  | 'class_shared'
  | 'school_shared'
  | 'system_public';

export type ArtifactParseStatus =
  | 'not_parsed'
  | 'parsing'
  | 'parsed'
  | 'partial'
  | 'failed'
  | 'unsupported'
  | 'not_integrated_yet';

export type ArtifactBlockKind =
  | 'title'
  | 'section'
  | 'paragraph'
  | 'question'
  | 'answer_key'
  | 'marking_scheme'
  | 'rubric'
  | 'teacher_note'
  | 'worked_example'
  | 'definition'
  | 'theorem'
  | 'formula'
  | 'diagram'
  | 'table'
  | 'transcript'
  | 'transcript_segment'
  | 'image_region'
  | 'unknown';

// Explicit access classification for every structured block.
// Restricted kinds MUST always resolve to 'teacher_only'.
export type ArtifactBlockVisibility = 'student' | 'teacher_only';

// Kinds that are never safe for the student-facing projection.
export const RESTRICTED_ARTIFACT_BLOCK_KINDS: ReadonlySet<ArtifactBlockKind> = new Set<ArtifactBlockKind>([
  'answer_key',
  'marking_scheme',
  'rubric',
  'teacher_note',
]);

export function visibilityForBlockKind(kind: ArtifactBlockKind): ArtifactBlockVisibility {
  return RESTRICTED_ARTIFACT_BLOCK_KINDS.has(kind) ? 'teacher_only' : 'student';
}

export type ArtifactStructureQuality =
  | 'high'
  | 'medium'
  | 'low'
  | 'partial'
  | 'unavailable';

export type ArtifactSource =
  | 'student_upload'
  | 'teacher_upload'
  | 'school_resource'
  | 'system_resource'
  | 'text_registration'
  | 'unknown';

export type ExtractionMethod =
  | 'text_input'
  | 'pdf_text_layer'
  | 'ocr'
  | 'manual'
  | 'transcript'
  | 'fallback_chunking'
  | 'not_integrated_yet';

export type DiagramUnderstandingStatus =
  | 'not_integrated_yet'
  | 'caption_only'
  | 'ocr_text_only'
  | 'structured'
  | 'failed';

export type BlockDifficulty = 'easy' | 'medium' | 'hard' | 'unknown';

export type ParserMode = 'safe_text_v1' | 'metadata_only' | 'existing_content';

// ── Provenance ──

export interface ArtifactProvenance {
  artifactId: string;
  blockId?: string | null;
  sourceKind: ArtifactKind;
  sourceName?: string | null;
  pageNumber?: number | null;
  sectionTitle?: string | null;
  startOffset?: number | null;
  endOffset?: number | null;
  extractionMethod: ExtractionMethod;
  extractedAt: string;
  confidence: number;
}

// ── LearningArtifact ──

export interface LearningArtifact {
  artifactId: string;
  schoolId: string;
  ownerStudentId?: string | null;
  ownerTeacherId?: string | null;
  classId?: string | null;
  mediaAssetId?: string | null;

  kind: ArtifactKind;
  accessScope: ArtifactAccessScope;

  title: string;
  description?: string | null;
  originalFileName?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;

  source: ArtifactSource;

  parseStatus: ArtifactParseStatus;
  structureQuality: ArtifactStructureQuality;

  blockCount: number;
  questionCount: number;
  diagramCount: number;
  answerKeyCount: number;
  tableCount: number;
  transcriptCount: number;
  restrictedCount: number;

  contentFingerprint: string;
  curriculumRefs: ArtifactCurriculumRefs;
  createdAt: string;
  updatedAt: string;
  parsedAt?: string | null;

  warnings: string[];
}

// Candidate, reference-only links to the accepted Knowledge Graph.
// These are NEVER duplicated academic truth and are never auto-promoted
// to governed truth without Knowledge Graph validation.
export interface ArtifactCurriculumRefs {
  curriculumId?: string | null;
  curriculumVersionId?: string | null;
  subjectId?: string | null;
  topicId?: string | null;
  conceptId?: string | null;
  skillIds?: string[];
  objectiveIds?: string[];
  objectiveVersionIds?: string[];
  verified?: boolean;
  candidate?: boolean;
}

// ── ArtifactBlock ──

export interface ArtifactBlock {
  blockId: string;
  artifactId: string;
  schoolId: string;

  kind: ArtifactBlockKind;
  visibility: ArtifactBlockVisibility;
  order: number;

  text?: string | null;
  normalizedText?: string | null;
  summary?: string | null;

  pageNumber?: number | null;
  sectionTitle?: string | null;
  headingPath: string[];

  confidence: number;

  provenance: ArtifactProvenance;

  educationalTags: {
    subject?: string | null;
    topic?: string | null;
    skillIds: string[];
    learningObjectives: string[];
    difficulty?: BlockDifficulty;
  };

  metadata: Record<string, unknown>;
}

// ── Specialized Blocks ──

export interface ExtractedQuestion {
  questionId: string;
  artifactId: string;
  blockId: string;
  questionText: string;
  choices: string[];
  expectedAnswer?: string | null;
  answerKeyBlockId?: string | null;
  workedExampleBlockId?: string | null;
  topic?: string | null;
  difficulty?: BlockDifficulty;
  confidence: number;
  provenance: ArtifactProvenance;
}

export interface WorkedExampleBlock {
  exampleId: string;
  artifactId: string;
  blockId: string;
  problemText?: string | null;
  steps: string[];
  finalAnswer?: string | null;
  confidence: number;
  provenance: ArtifactProvenance;
}

export interface AnswerKeyBlock {
  answerKeyId: string;
  artifactId: string;
  blockId: string;
  answers: {
    questionRef?: string | null;
    answer: string;
    confidence: number;
  }[];
  confidence: number;
  provenance: ArtifactProvenance;
}

export interface DiagramBlock {
  diagramId: string;
  artifactId: string;
  blockId: string;
  caption?: string | null;
  altText?: string | null;
  diagramType?: string | null;
  understandingStatus: DiagramUnderstandingStatus;
  confidence: number;
  provenance: ArtifactProvenance;
}

// ── Request/Response Contracts ──

export interface ArtifactIngestRequest {
  title?: string;
  description?: string;
  kind?: ArtifactKind;
  accessScope?: ArtifactAccessScope;
  classId?: string | null;
  mediaAssetId?: string;
  curriculumRefs?: ArtifactCurriculumRefs;
  textContent?: string;
  transcriptText?: string;
  originalFileName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export interface ArtifactIngestResponse {
  ok: true;
  artifact: LearningArtifact;
}

export interface ArtifactParseRequest {
  forceReparse?: boolean;
  parserMode?: ParserMode;
  mediaAssetId?: string;
  curriculumRefs?: ArtifactCurriculumRefs;
}

export interface ArtifactParseResponse {
  ok: true;
  artifact: LearningArtifact;
  blocks: ArtifactBlock[];
  extractedQuestions: ExtractedQuestion[];
  answerKeys: AnswerKeyBlock[];
  workedExamples: WorkedExampleBlock[];
  diagrams: DiagramBlock[];
  warnings: string[];
}

export interface ArtifactStructureResponse {
  ok: true;
  artifact: LearningArtifact;
  blocks: ArtifactBlock[];
  extractedQuestions: ExtractedQuestion[];
  answerKeys: AnswerKeyBlock[];
  workedExamples: WorkedExampleBlock[];
  diagrams: DiagramBlock[];
}

export interface ArtifactQueryRequest {
  query: string;
  mode?: 'help_with_question' | 'explain_section' | 'quiz_from_artifact' | 'summarize' | 'find_examples' | 'general';
  questionRef?: string | null;
  maxBlocks?: number;
  includeAnswerKeys?: boolean;
}

export interface ArtifactQueryResponse {
  ok: true;
  artifact: LearningArtifact;
  query: string;
  matchedBlocks: ArtifactBlock[];
  matchedQuestions: ExtractedQuestion[];
  matchedAnswerKeys: AnswerKeyBlock[];
  sourceTrust: unknown;
  cachePolicy: unknown;
  warnings: string[];
}

// ── Tutor Context Integration Types ──

export interface ArtifactContextSummary {
  artifactId: string;
  title: string;
  kind: ArtifactKind;
  parseStatus: ArtifactParseStatus;
  structureQuality: ArtifactStructureQuality;
  blockCount: number;
  questionCount: number;
  diagramCount: number;
  answerKeyCount: number;
  contentFingerprint: string;
}

export interface ArtifactContextBlock {
  blockId: string;
  artifactId: string;
  kind: ArtifactBlockKind;
  text?: string | null;
  summary?: string | null;
  pageNumber?: number | null;
  sectionTitle?: string | null;
  confidence: number;
  provenance: ArtifactProvenance;
}
