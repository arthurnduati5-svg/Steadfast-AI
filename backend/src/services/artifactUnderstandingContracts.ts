// ─────────────────────────────────────────────────────────────
// Steadfast AI — Deep Artifact Understanding Contracts v1
// Canonical types for structured artifact parsing, blocks,
// questions, answer keys, diagrams, topic mappings, learning
// objectives, safe views, provenance, and source trust.
// Extends existing artifactContracts.ts types.
// ─────────────────────────────────────────────────────────────

// ── Artifact Type ──
export type ArtifactType =
  | 'pdf'
  | 'image'
  | 'worksheet'
  | 'transcript'
  | 'notes'
  | 'slide_deck'
  | 'text_document'
  | 'spreadsheet'
  | 'unknown';

// ── Artifact Parse Status ──
export type ArtifactParseStatus =
  | 'queued'
  | 'parsing'
  | 'parsed'
  | 'parsed_with_warnings'
  | 'failed'
  | 'blocked';

// ── Block Type ──
export type ArtifactBlockType =
  | 'title'
  | 'heading'
  | 'section'
  | 'paragraph'
  | 'question'
  | 'subquestion'
  | 'answer_key'
  | 'diagram'
  | 'figure'
  | 'table'
  | 'formula'
  | 'theorem'
  | 'definition'
  | 'worked_example'
  | 'learning_objective'
  | 'instruction'
  | 'teacher_note'
  | 'student_note'
  | 'transcript_segment'
  | 'unknown';

// ── Visibility Level ──
export type ArtifactVisibility =
  | 'learner_visible'
  | 'teacher_visible'
  | 'admin_visible'
  | 'tutor_internal'
  | 'blocked';

// ── Source Trust Status ──
export type ArtifactSourceTrustStatus =
  | 'trusted_uploaded'
  | 'teacher_uploaded'
  | 'student_uploaded'
  | 'external_unverified'
  | 'suspicious'
  | 'blocked'
  | 'unknown';

// ── Extraction Confidence ──
export type ArtifactExtractionConfidence = 'low' | 'medium' | 'high';

// ── Question Type ──
export type ArtifactQuestionType =
  | 'short_answer'
  | 'multiple_choice'
  | 'calculation'
  | 'essay'
  | 'true_false'
  | 'matching'
  | 'fill_blank'
  | 'diagram_based'
  | 'proof'
  | 'unknown';

// ── Difficulty Level ──
export type ArtifactDifficulty = 'very_easy' | 'easy' | 'medium' | 'hard' | 'challenge' | 'unknown';

// ── Artifact Scope ──
export interface ArtifactScope {
  artifactId: string;
  studentId?: string | null;
  schoolId?: string | null;
  classId?: string | null;
  uploadedByUserId?: string | null;
}

// ── Topic/Skill Mapping ──
export interface ArtifactTopicSkillMapping {
  sourceBlockId?: string | null;
  sourceQuestionId?: string | null;
  subject: string;
  topic: string;
  skillId?: string | null;
  skillLabel?: string | null;
  difficulty: ArtifactDifficulty;
  confidence: ArtifactExtractionConfidence;
  method: 'explicit' | 'inferred' | 'keyword' | 'unmapped';
}

// ── Block Provenance ──
export interface ArtifactBlockProvenance {
  artifactId: string;
  blockId?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  pageNumber?: number | null;
  locationLabel?: string | null;
  parserSource: string;
  extractionMethod: string;
  extractedAt: string;
  confidence: ArtifactExtractionConfidence;
  warnings: string[];
}

// ── Structured Artifact Record ──
export interface StructuredArtifactRecord {
  artifactId: string;
  scope: ArtifactScope;
  artifactType: ArtifactType;
  fileName?: string | null;
  mimeType?: string | null;
  storageRef?: string | null;
  parseStatus: ArtifactParseStatus;
  sourceTrustStatus: ArtifactSourceTrustStatus;
  rawTextAvailable: boolean;
  structuredBlockCount: number;
  questionCount: number;
  answerKeyCount: number;
  diagramCount: number;
  workedExampleCount: number;
  theoremBlockCount: number;
  learningObjectiveCount: number;
  topicMappings: ArtifactTopicSkillMapping[];
  parserWarnings: string[];
  safetyFlags: string[];
  createdAt: string;
  updatedAt: string;
}

// ── Artifact Structured Block ──
export interface ArtifactStructuredBlock {
  id: string;
  artifactId: string;
  blockType: ArtifactBlockType;
  visibility: ArtifactVisibility;
  pageNumber?: number | null;
  locationLabel?: string | null;
  sectionPath: string[];
  text: string;
  safeText: string;
  rawTextRef?: string | null;
  orderIndex: number;
  confidence: ArtifactExtractionConfidence;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  difficulty?: string | null;
  safetyFlags: string[];
  provenance: ArtifactBlockProvenance;
  metadata: Record<string, unknown>;
}

// ── Artifact Question Block ──
export interface ArtifactQuestionBlock {
  questionId: string;
  artifactId: string;
  parentBlockId?: string | null;
  questionNumber?: string | null;
  questionText: string;
  safeQuestionText: string;
  questionType: ArtifactQuestionType;
  choices: string[];
  requiresDiagram: boolean;
  requiresTable: boolean;
  topic?: string | null;
  skillId?: string | null;
  skillLabel?: string | null;
  difficulty?: string | null;
  answerKeyRef?: string | null;
  learnerCanSeeAnswer: boolean;
  confidence: ArtifactExtractionConfidence;
  location?: string | null;
  metadata: Record<string, unknown>;
}

// ── Answer Key Detection Result ──
export interface ArtifactAnswerKeyDetectionResult {
  answerKeyBlocks: ArtifactStructuredBlock[];
  linkedQuestions: Array<{
    questionId: string;
    answerKeyBlockId: string;
    linkConfidence: ArtifactExtractionConfidence;
  }>;
  warnings: string[];
}

// ── Visual Block Extraction Result ──
export interface ArtifactVisualBlockExtractionResult {
  diagramBlocks: ArtifactStructuredBlock[];
  figureBlocks: ArtifactStructuredBlock[];
  tableBlocks: ArtifactStructuredBlock[];
  questionsRequiringVisuals: string[];
  warnings: string[];
}

// ── Concept Block Extraction Result ──
export interface ArtifactConceptBlockExtractionResult {
  theoremBlocks: ArtifactStructuredBlock[];
  formulaBlocks: ArtifactStructuredBlock[];
  definitionBlocks: ArtifactStructuredBlock[];
  workedExampleBlocks: ArtifactStructuredBlock[];
  instructionBlocks: ArtifactStructuredBlock[];
  warnings: string[];
}

// ── Learning Objective Result ──
export interface ArtifactLearningObjectiveResult {
  explicitObjectives: Array<{
    text: string;
    sourceBlockId: string;
    subject?: string | null;
    topic?: string | null;
    confidence: ArtifactExtractionConfidence;
  }>;
  inferredObjectives: Array<{
    text: string;
    sourceBlockIds: string[];
    subject?: string | null;
    topic?: string | null;
    confidence: ArtifactExtractionConfidence;
  }>;
  warnings: string[];
}

// ── Normalized Artifact Text ──
export interface NormalizedArtifactText {
  originalText: string;
  normalizedText: string;
  pages: ArtifactTextSegment[];
  sections: ArtifactTextSegment[];
  hasContent: boolean;
  warnings: string[];
  safetyFlags: string[];
}

// ── Text Segment ──
export interface ArtifactTextSegment {
  label?: string | null;
  text: string;
  orderIndex: number;
}

// ── Text Noise Report ──
export interface ArtifactTextNoiseReport {
  hasExcessiveWhitespace: boolean;
  hasControlCharacters: boolean;
  hasSuspiciousEmbeddedInstructions: boolean;
  likelyOcrNoise: boolean;
  warnings: string[];
}

// ── Safety Scan Result ──
export interface ArtifactSafetyScanResult {
  safe: boolean;
  hasPromptInjection: boolean;
  hasAnswerKeyLeakage: boolean;
  hasTeacherNotes: boolean;
  hasSuspiciousInstructions: boolean;
  hasUnsafeUrls: boolean;
  hasPrivateData: boolean;
  blockedBlocks: string[];
  suspiciousBlocks: Array<{
    blockId: string;
    reason: string;
    severity: 'low' | 'medium' | 'high';
  }>;
  warnings: string[];
}

// ── Provenance Validation Result ──
export interface ArtifactProvenanceValidationResult {
  valid: boolean;
  hasFabricatedPage: boolean;
  hasFabricatedUrl: boolean;
  hasUnsupportedSourceClaim: boolean;
  warnings: string[];
}

// ── Artifact Safe View ──
export interface ArtifactSafeView {
  artifactId: string;
  title?: string | null;
  artifactType: ArtifactType;
  parseStatus: ArtifactParseStatus;
  sourceTrustStatus: ArtifactSourceTrustStatus;
  questionCount: number;
  learnerVisibleBlockCount: number;
  topicMappings: ArtifactTopicSkillMapping[];
  safeSummary: string;
  warnings: string[];
}

// ── Deep Parse Input ──
export interface DeepArtifactParseInput {
  artifactId: string;
  scope: ArtifactScope;
  artifactType: ArtifactType;
  fileName?: string | null;
  mimeType?: string | null;
  storageRef?: string | null;
  rawText?: string | null;
  rawOcrText?: string | null;
  transcriptText?: string | null;
  pageMarkers?: string[];
  textSegments?: ArtifactTextSegment[];
  existingBlocks?: ArtifactStructuredBlock[];
  parseMode?: 'full' | 'metadata_only' | 'reparse';
}

// ── Deep Parse Result ──
export interface DeepArtifactParseResult {
  structuredArtifact: StructuredArtifactRecord;
  blocks: ArtifactStructuredBlock[];
  questions: ArtifactQuestionBlock[];
  answerKeyResult: ArtifactAnswerKeyDetectionResult;
  visualResult: ArtifactVisualBlockExtractionResult;
  conceptResult: ArtifactConceptBlockExtractionResult;
  topicMappings: ArtifactTopicSkillMapping[];
  learningObjectives: ArtifactLearningObjectiveResult;
  safeView: ArtifactSafeView;
  safety: ArtifactSafetyScanResult;
  provenanceValidation: ArtifactProvenanceValidationResult;
  warnings: string[];
}

// ── Repository List Options ──
export interface ArtifactRepositoryListOptions {
  blockTypes?: ArtifactBlockType[];
  visibilities?: ArtifactVisibility[];
  pageMin?: number | null;
  pageMax?: number | null;
  limit?: number;
  offset?: number;
}

// ── Cache Policy for Artifact-Bearing Responses ──
export interface ArtifactCachePolicyDecision {
  cacheAllowed: boolean;
  scope: string;
  ttlSeconds: number | null;
  key: string | null;
  reason: string;
  warnings: string[];
}
