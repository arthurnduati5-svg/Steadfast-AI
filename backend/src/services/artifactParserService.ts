// ─────────────────────────────────────────────────────────────
// Steadfast AI — Artifact Parser Service v1
// Converts artifact text into structured blocks with provenance.
// Conservative parsing — no fake OCR, no fake diagram understanding.
// ─────────────────────────────────────────────────────────────

import { createHash } from 'crypto';
import type {
  ArtifactBlock,
  ArtifactBlockKind,
  ArtifactKind,
  ArtifactParseStatus,
  ArtifactStructureQuality,
  ArtifactProvenance,
  ExtractionMethod,
  ExtractedQuestion,
  AnswerKeyBlock,
  WorkedExampleBlock,
  DiagramBlock,
  ArtifactParseRequest,
  ArtifactCurriculumRefs,
} from './artifactContracts';
import { visibilityForBlockKind } from './artifactContracts';

function nowISO(): string {
  return new Date().toISOString();
}

function computeFingerprint(content: string): string {
  return createHash('sha256').update(content || '').digest('hex').slice(0, 16);
}

function generateBlockId(artifactId: string, order: number): string {
  return `blk_${artifactId}_${order}_${Date.now().toString(36)}`;
}

function generateQuestionId(artifactId: string, blockId: string): string {
  return `q_${artifactId}_${blockId}`;
}

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 100) / 100));
}

// ── Detection Patterns ──

const QUESTION_PATTERNS = [
  /^(\d+)[\s.)]:?\s+/m,           // 1.  1)  1:
  /^Q(\d+)[\s.)]\s+/im,           // Q1.  Q1)
  /^Question\s+(\d+)\s*[:.)]\s+/im, // Question 1:
  /^\(([a-zA-Z])\)\s+/m,          // (a)  (b)
  /^\([ivxlcdm]+\)\s+/im,         // (i)  (ii)
];

const ANSWER_KEY_HEADERS = [
  /^answer(?:s)?\s*[:.]?\s*$/im,
  /^answer\s*keys?\s*[:.]?\s*$/im,
  /^answers?\s+key\s*[:.]?\s*$/im,
  /^solution(?:s)?\s*[:.]?\s*$/im,
  /^key\s*[:.]?\s*$/im,
  /^key\s+to\s+exercises\s*[:.]?\s*$/im,
];

const WORKED_EXAMPLE_HEADERS = [
  /^example\s*[:.]?\s*$/im,
  /^worked\s+example\s*[:.]?\s*$/im,
  /^solution\s*[:.]?\s*$/im,
  /^step\s+\d+\s*[:.]\s*/im,
];

// Restricted teacher-only section headers (never student-visible).
const RESTRICTED_SECTION_HEADERS: Array<{ kind: ArtifactBlockKind; patterns: RegExp[] }> = [
  { kind: 'marking_scheme', patterns: [/^mark(?:ing)?\s*scheme\s*[:.]?\s*$/im, /^marks\s*[:.]?\s*$/im] },
  { kind: 'rubric', patterns: [/^rubric\s*[:.]?\s*$/im] },
  { kind: 'teacher_note', patterns: [/^teacher['’]?s?\s*notes?\s*[:.]?\s*$/im, /^note\s*to\s*teacher\s*[:.]?\s*$/im] },
];

// Markdown-style table rows (>= 2 pipe-delimited cells, or a separator row).
const TABLE_ROW_PATTERN = /^\s*\|(.+\|)+/;
const TABLE_SEPARATOR_PATTERN = /^\s*\|?[\s:|-]+\|[\s:|-]+\|?\s*$/;

const DEFINITION_PATTERNS = [
  /^definition\s*[:.]?\s*/im,
  /^term\s*[:.]?\s*/im,
  /^(a\s+)?\w+\s+(?:means|refers\s+to|is\s+defined\s+as)\s+/i,
];

const THEOREM_PATTERNS = [
  /^theorem\s*[:.]?\s*/im,
  /^formula\s*[:.]?\s*/im,
  /^lemma\s*[:.]?\s*/im,
];

const DIAGRAM_PLACEHOLDER_PATTERNS = [
  /\[diagram\]/i,
  /\[figure\s+\d+\]/i,
  /\[image\]/i,
  /see\s+(?:the\s+)?diagram/i,
  /figure\s+\d+\s*[:.]/i,
];

// ── Parser Service ──

export class ArtifactParserService {
  /**
   * Parse artifact text content into structured blocks.
   * Returns parse result with all block types and provenance.
   */
  parse(
    artifactId: string,
    schoolId: string,
    kind: ArtifactKind,
    textContent: string | null | undefined,
    transcriptText: string | null | undefined,
    request?: ArtifactParseRequest,
  ): {
    parseStatus: ArtifactParseStatus;
    structureQuality: ArtifactStructureQuality;
    blocks: ArtifactBlock[];
    questions: ExtractedQuestion[];
    answerKeys: AnswerKeyBlock[];
    workedExamples: WorkedExampleBlock[];
    diagrams: DiagramBlock[];
    warnings: string[];
  } {
    const warnings: string[] = [];
    const blocks: Omit<ArtifactBlock, 'visibility'>[] = [];
    const questions: ExtractedQuestion[] = [];
    const answerKeys: AnswerKeyBlock[] = [];
    const workedExamples: WorkedExampleBlock[] = [];
    const diagrams: DiagramBlock[] = [];
    const curriculumRefs: ArtifactCurriculumRefs | null =
      (request?.curriculumRefs as ArtifactCurriculumRefs | undefined) || null;

    const content = (textContent || transcriptText || '').trim();
    if (!content) {
      // No content to parse — metadata only
      const noContentWarnings = ['No text content provided. Artifact is metadata-only.'];
      if (kind === 'image' || kind === 'pdf') {
        noContentWarnings.push('OCR is not integrated in v1. Image/PDF parsing requires available text/transcript content and degrades honestly to unavailable.');
      }
      return {
        parseStatus: 'partial',
        structureQuality: 'unavailable',
        blocks: [],
        questions: [],
        answerKeys: [],
        workedExamples: [],
        diagrams: [],
        warnings: noContentWarnings,
      };
    }

    const parserMode = request?.parserMode || 'safe_text_v1';
    if (parserMode === 'metadata_only') {
      return {
        parseStatus: 'partial',
        structureQuality: 'partial',
        blocks: [],
        questions: [],
        answerKeys: [],
        workedExamples: [],
        diagrams: [],
        warnings: ['Metadata-only parse requested. No block extraction performed.'],
      };
    }

    // Normalize line endings and collapse excessive whitespace
    const normalized = content
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \t]+/g, ' ')
      .trim();

    const lines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) {
      return {
        parseStatus: 'partial',
        structureQuality: 'partial',
        blocks: [],
        questions: [],
        answerKeys: [],
        workedExamples: [],
        diagrams: [],
        warnings: ['Text content is empty after normalization.'],
      };
    }

    let order = 0;
    let hasDetectedAnswerKey = false;
    let hasDetectedWorkedExample = false;
    let inAnswerKeySection = false;
    let inWorkedExampleSection = false;
    let inRestrictedSection = false;
    let restrictedSectionKind: ArtifactBlockKind | null = null;
    let restrictedSectionBlockId: string | null = null;
    let restrictedSectionText: string[] = [];
    let workedExampleSteps: string[] = [];
    let answerKeyEntries: AnswerKeyBlock['answers'] = [];
    let workedExampleProblem: string | null = null;

    // Determine extraction method
    const extractionMethod: ExtractionMethod = kind === 'transcript'
      ? 'transcript'
      : kind === 'text' || kind === 'notes'
        ? 'text_input'
        : 'fallback_chunking';

    // Detect diagram placeholders first (before block creation)
    for (const line of lines) {
      if (DIAGRAM_PLACEHOLDER_PATTERNS.some((p) => p.test(line))) {
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          sectionTitle: null,
          extractionMethod: 'not_integrated_yet',
          extractedAt: nowISO(),
          confidence: 0.3,
        };

        const blockId = generateBlockId(artifactId, order);
        const diagramBlock: ArtifactBlock = {
          blockId,
          artifactId,
          schoolId,
          kind: 'diagram',
          order,
          text: line,
          normalizedText: line.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          summary: line.length > 80 ? line.slice(0, 80) + '...' : line,
          headingPath: [],
          confidence: 0.3,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
          visibility: visibilityForBlockKind('diagram'),
        };
        blocks.push(diagramBlock);
        order++;

        diagrams.push({
          diagramId: `diag_${blockId}`,
          artifactId,
          blockId,
          caption: line,
          altText: null,
          diagramType: null,
          understandingStatus: 'not_integrated_yet',
          confidence: 0.3,
          provenance: { ...provenance, blockId },
        });
      }
    }

    // Detect and extract sections, paragraphs, questions, answer keys, worked examples
    let currentSection: string | null = null;
    let currentSectionHeadingPath: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip diagram placeholders already handled
      if (DIAGRAM_PLACEHOLDER_PATTERNS.some((p) => p.test(trimmed))) continue;

      // ── Detect section headings ──
      const isHeading = /^#{1,6}\s+/.test(trimmed) ||
        /^[A-Z0-9][A-Z0-9\s:,-]{5,}$/.test(trimmed) ||
        /^(section|topic|chapter|lesson|part)\s+\d+\s*[:.]?\s*/i.test(trimmed);

      if (isHeading) {
        inAnswerKeySection = false;
        inWorkedExampleSection = false;
        const headingText = trimmed.replace(/^#{1,6}\s+/, '').replace(/[:.]+$/, '').trim();
        currentSection = headingText;
        currentSectionHeadingPath = headingText ? [headingText] : [];

        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: headingText || null,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.8,
        };

        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'section',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          summary: headingText,
          headingPath: currentSectionHeadingPath,
          confidence: 0.8,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
        });
        order++;
        continue;
      }

      // ── Detect answer key sections ──
      if (ANSWER_KEY_HEADERS.some((p) => p.test(trimmed))) {
        hasDetectedAnswerKey = true;
        inAnswerKeySection = true;
        inWorkedExampleSection = false;

        // Create the answer key block
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.7,
        };

        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'answer_key',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          headingPath: currentSectionHeadingPath,
          confidence: 0.7,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
        });
        order++;
        continue;
      }

      // ── Detect other restricted teacher-only sections ──
      let matchedRestricted: ArtifactBlockKind | null = null;
      for (const entry of RESTRICTED_SECTION_HEADERS) {
        if (entry.patterns.some((p) => p.test(trimmed))) {
          matchedRestricted = entry.kind;
          break;
        }
      }
      if (matchedRestricted) {
        inAnswerKeySection = false;
        inWorkedExampleSection = false;
        inRestrictedSection = true;
        restrictedSectionKind = matchedRestricted;
        restrictedSectionText = [trimmed];

        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.7,
        };

        const blockId = generateBlockId(artifactId, order);
        restrictedSectionBlockId = blockId;
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: matchedRestricted,
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          headingPath: currentSectionHeadingPath,
          confidence: 0.7,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
        });
        order++;
        continue;
      }

      // ── Continue accumulating a restricted teacher-only section ──
      if (inRestrictedSection && restrictedSectionKind && restrictedSectionBlockId) {
        if (/^\s*$/.test(trimmed)) {
          // Empty line ends the restricted section; flush collected text.
          const idx = blocks.findIndex((b) => b.blockId === restrictedSectionBlockId);
          if (idx >= 0) {
            blocks[idx] = {
              ...blocks[idx],
              text: restrictedSectionText.join('\n'),
              normalizedText: restrictedSectionText
                .join('\n')
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, ' ')
                .replace(/\s+/g, ' ')
                .trim(),
            };
          }
          inRestrictedSection = false;
          restrictedSectionKind = null;
          restrictedSectionBlockId = null;
          restrictedSectionText = [];
        } else {
          restrictedSectionText.push(trimmed);
        }
        continue;
      }

      // ── Collect answer key entries ──
      if (inAnswerKeySection && hasDetectedAnswerKey) {
        const answerMatch = trimmed.match(/^(\d+|[A-Za-z])[\s.)]\s*(.+)/);
        if (answerMatch) {
          answerKeyEntries.push({
            questionRef: answerMatch[1],
            answer: answerMatch[2].trim(),
            confidence: 0.6,
          });
        } else if (/^\s*$/.test(trimmed)) {
          // Empty line ends answer key section
          inAnswerKeySection = false;
        }
        continue;
      }

      // ── Detect worked example sections ──
      if (WORKED_EXAMPLE_HEADERS.some((p) => p.test(trimmed))) {
        hasDetectedWorkedExample = true;
        inWorkedExampleSection = true;
        inAnswerKeySection = false;

        workedExampleProblem = trimmed;
        workedExampleSteps = [];
        continue;
      }

      // ── Collect worked example steps ──
      if (inWorkedExampleSection) {
        const stepMatch = trimmed.match(/^step\s+(\d+)\s*[:.)]\s*(.+)/i);
        if (stepMatch) {
          workedExampleSteps.push(stepMatch[2].trim());
        } else if (/^therefore\b/i.test(trimmed) || /^so\b/i.test(trimmed) || workedExampleSteps.length > 0) {
          workedExampleSteps.push(trimmed);
        } else {
          inWorkedExampleSection = false;
        }
        continue;
      }

      // ── Detect question lines ──
      let isQuestion = false;
      let questionNumber: string | null = null;

      for (const pattern of QUESTION_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match) {
          isQuestion = true;
          questionNumber = match[1];
          break;
        }
      }

      // Also detect questions ending with ?
      if (!isQuestion && trimmed.endsWith('?') && trimmed.length > 15) {
        isQuestion = true;
      }

      if (isQuestion) {
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.6,
        };

        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'question',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          sectionTitle: currentSection,
          headingPath: currentSectionHeadingPath,
          confidence: 0.6,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: { detectedQuestionNumber: questionNumber },
        });
        order++;

        questions.push({
          questionId: generateQuestionId(artifactId, blockId),
          artifactId,
          blockId,
          questionText: trimmed,
          choices: [],
          expectedAnswer: null,
          answerKeyBlockId: null,
          workedExampleBlockId: null,
          topic: currentSection,
          difficulty: 'unknown',
          confidence: 0.6,
          provenance: { ...provenance, blockId },
        });
        continue;
      }

      // ── Detect definitions ──
      if (DEFINITION_PATTERNS.some((p) => p.test(trimmed))) {
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.5,
        };

        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'definition',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          sectionTitle: currentSection,
          headingPath: currentSectionHeadingPath,
          confidence: 0.5,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
        });
        order++;
        continue;
      }

      // ── Detect theorems/formulas ──
      if (THEOREM_PATTERNS.some((p) => p.test(trimmed)) || /=.+=/.test(trimmed)) {
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.5,
        };

        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'theorem',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/s, ' ').trim(),
          sectionTitle: currentSection,
          headingPath: currentSectionHeadingPath,
          confidence: 0.5,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: {},
        });
        order++;
        continue;
      }

      // ── Detect markdown tables (do not invent missing cells) ──
      if (TABLE_ROW_PATTERN.test(trimmed) && !TABLE_SEPARATOR_PATTERN.test(trimmed)) {
        const cells = trimmed
          .replace(/^\s*\|/, '')
          .replace(/\|\s*$/, '')
          .split('|')
          .map((c) => c.trim());
        const provenance: ArtifactProvenance = {
          artifactId,
          blockId: null,
          sourceKind: kind,
          sourceName: null,
          pageNumber: null,
          sectionTitle: currentSection,
          extractionMethod,
          extractedAt: nowISO(),
          confidence: 0.6,
        };
        const blockId = generateBlockId(artifactId, order);
        blocks.push({
          blockId,
          artifactId,
          schoolId,
          kind: 'table',
          order,
          text: trimmed,
          normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
          summary: cells.join(' | '),
          sectionTitle: currentSection,
          headingPath: currentSectionHeadingPath,
          confidence: 0.6,
          provenance: { ...provenance, blockId },
          educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
          metadata: { cells, rowCount: 1 },
        });
        order++;
        continue;
      }

      // ── Fallback: paragraph / transcript_segment block ──
      const fallbackKind: ArtifactBlockKind = kind === 'transcript' ? 'transcript_segment' : 'paragraph';
      const provenance: ArtifactProvenance = {
        artifactId,
        blockId: null,
        sourceKind: kind,
        sourceName: null,
        pageNumber: null,
        sectionTitle: currentSection,
        extractionMethod,
        extractedAt: nowISO(),
        confidence: 0.4,
      };

      const blockId = generateBlockId(artifactId, order);
      blocks.push({
        blockId,
        artifactId,
        schoolId,
        kind: fallbackKind,
        order,
        text: trimmed,
        normalizedText: trimmed.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim(),
        sectionTitle: currentSection,
        headingPath: currentSectionHeadingPath,
        confidence: 0.4,
        provenance: { ...provenance, blockId },
        educationalTags: { subject: null, topic: null, skillIds: [], learningObjectives: [], difficulty: 'unknown' },
        metadata: {},
      });
      order++;
    }

    // ── Finalize answer key block ──
    if (hasDetectedAnswerKey && answerKeyEntries.length > 0) {
      const provenance: ArtifactProvenance = {
        artifactId,
        blockId: null,
        sourceKind: kind,
        sourceName: null,
        pageNumber: null,
        sectionTitle: currentSection,
        extractionMethod,
        extractedAt: nowISO(),
        confidence: 0.5,
      };

      const blockId = generateBlockId(artifactId, order);
      answerKeys.push({
        answerKeyId: `ak_${blockId}`,
        artifactId,
        blockId,
        answers: answerKeyEntries,
        confidence: 0.5,
        provenance: { ...provenance, blockId },
      });
    }

    // ── Finalize worked example blocks ──
    if (hasDetectedWorkedExample && workedExampleSteps.length > 0) {
      const provenance: ArtifactProvenance = {
        artifactId,
        blockId: null,
        sourceKind: kind,
        sourceName: null,
        pageNumber: null,
        sectionTitle: currentSection,
        extractionMethod,
        extractedAt: nowISO(),
        confidence: 0.5,
      };

      const blockId = generateBlockId(artifactId, order);
      workedExamples.push({
        exampleId: `we_${blockId}`,
        artifactId,
        blockId,
        problemText: workedExampleProblem,
        steps: workedExampleSteps,
        finalAnswer: workedExampleSteps.length > 0 ? workedExampleSteps[workedExampleSteps.length - 1] : null,
        confidence: 0.5,
        provenance: { ...provenance, blockId },
      });
    }

    // ── Honest low-confidence / unsupported degradation (R3.15) ──
    const lowerContent = content.toLowerCase();
    const looksLowConfidence =
      lowerContent.includes('low_confidence') ||
      lowerContent.includes('provider_needed') ||
      lowerContent.includes('ocr_required') ||
      lowerContent.includes('[ocr_required]') ||
      lowerContent.includes('__ocr_needed__');
    const looksUnsupported =
      lowerContent.includes('unsupported') && lowerContent.length < 200;

    // ── Determine parse status and quality ──
    const hasAnyStructure = blocks.length > 0;
    const hasSpecializedBlocks = questions.length > 0 || answerKeys.length > 0 || workedExamples.length > 0 || diagrams.length > 0;

    let parseStatus: ArtifactParseStatus = 'parsed';
    let structureQuality: ArtifactStructureQuality = 'high';

    if (!hasAnyStructure) {
      parseStatus = 'failed';
      structureQuality = 'unavailable';
      warnings.push('Parser produced no blocks from the provided text.');
    } else if (looksLowConfidence || looksUnsupported) {
      parseStatus = hasAnyStructure ? 'partial' : 'failed';
      structureQuality = hasSpecializedBlocks ? 'partial' : 'low';
      warnings.push('Extraction is low-confidence / provider needed — structure is partial and may be unavailable.');
      warnings.push('No fabricated extraction performed for unsupported/low-confidence content.');
    } else if (!hasSpecializedBlocks) {
      structureQuality = 'low';
      warnings.push('Only paragraph blocks were produced. No questions, answer keys, worked examples, or diagrams detected.');
    } else if (diagrams.length > 0 && diagrams.some((d) => d.understandingStatus === 'not_integrated_yet')) {
      warnings.push('Diagram blocks are placeholders only. Diagram understanding is not integrated in v1.');
    }

    if (kind === 'image' || kind === 'pdf') {
      if (!textContent && !transcriptText) {
        warnings.push('OCR is not integrated in v1. Parse relies on available text/transcript content.');
      }
    }

    if (hasDetectedAnswerKey && answerKeyEntries.length === 0) {
      warnings.push('Answer key header detected but no answer entries were parsed. Confidence is low.');
    }

    // Honest handling of curriculum/objective references.
    // They remain candidate (reference-only) and are never promoted to
    // governed academic truth without Knowledge Graph validation.
    if (curriculumRefs) {
      warnings.push(
        'Curriculum/objective references are candidate references only and were not validated against the accepted Knowledge Graph.',
      );
    }

    // Apply explicit visibility to every block (restricted kinds -> teacher_only).
    const finalBlocks: ArtifactBlock[] = blocks.map((b) => ({
      ...b,
      visibility: visibilityForBlockKind(b.kind),
    }));

    return {
      parseStatus,
      structureQuality,
      blocks: finalBlocks,
      questions,
      answerKeys,
      workedExamples,
      diagrams,
      warnings,
    };
  }
}

// Singleton
export const artifactParserService = new ArtifactParserService();
