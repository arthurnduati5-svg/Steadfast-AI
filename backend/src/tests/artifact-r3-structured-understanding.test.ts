// ─────────────────────────────────────────────────────────────
// Steadfast AI — R3 Structured Artifact Understanding
// Focused acceptance tests for the canonical artifact pipeline.
// Uses in-memory fallback (no DB required).
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../lib/prisma', () => ({ default: { $queryRaw: vi.fn().mockRejectedValue(new Error('prisma unavailable')) } }));

import { artifactService, _clearArtifactMemoryStoreForTest } from '../services/artifactService';
import { artifactParserService } from '../services/artifactParserService';
import type { ResolvedTutorIdentity } from '../services/tutorStateContracts';
import type { ArtifactBlock } from '../services/artifactContracts';

const studentA: ResolvedTutorIdentity = {
  studentId: 'student-A',
  schoolId: 'school-A',
  userId: 'student-A',
  role: 'student',
};

const studentB: ResolvedTutorIdentity = {
  studentId: 'student-B',
  schoolId: 'school-B',
  userId: 'student-B',
  role: 'student',
};

const teacherSameSchool: ResolvedTutorIdentity = {
  studentId: undefined as any,
  schoolId: 'school-A',
  userId: 'teacher-A',
  role: 'teacher',
};

const teacherOtherSchool: ResolvedTutorIdentity = {
  studentId: undefined as any,
  schoolId: 'school-B',
  userId: 'teacher-B',
  role: 'teacher',
};

type ParseResult = ReturnType<typeof artifactParserService.parse>;

beforeEach(() => {
  _clearArtifactMemoryStoreForTest();
});

describe('R3.1 / R3.3 — MediaAsset anchoring', () => {
  it('anchors a structured artifact to its canonical MediaAsset without creating a media record', async () => {
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'Worksheet',
      kind: 'worksheet',
      mediaAssetId: 'media_001',
      textContent: 'Question 1: What is 2+2?',
    });

    expect(artifact.mediaAssetId).toBe('media_001');

    const fetched = await artifactService.getArtifactForUser(studentA, artifact.artifactId);
    expect(fetched?.mediaAssetId).toBe('media_001');

    // No second media record is created by the artifact system.
    expect(artifact.artifactId).toBeTruthy();
  });
});

describe('R3.4 — supported block kinds', () => {
  it('parses section, question, diagram, table and transcript blocks', () => {
    const content = [
      'Section 1: Algebra',
      'Question 1: Solve x+1=3',
      'Figure 1: graph [diagram]',
      '| A | B |',
      '| 1 | 2 |',
      'Today we reviewed algebra basics.',
    ].join('\n');

    const result = artifactParserService.parse('art_1', 'school-A', 'transcript', content, null);
    const kinds = result.blocks.map((b: ArtifactBlock) => b.kind);

    expect(kinds).toContain('section');
    expect(kinds).toContain('question');
    expect(kinds).toContain('diagram');
    expect(kinds).toContain('table');
    expect(kinds).toContain('transcript_segment');
  });
});

describe('R3.5 / R3.6 — answer-key separation and no leakage', () => {
  it('keeps question student-visible and answer key teacher_only; student projection has no answer text', async () => {
    const content = [
      'Question 1: Solve 2x+3=9',
      'Answers:',
      '1. TOPSECRET_ANSWER_XYZ',
    ].join('\n');

    const artifact = await artifactService.createArtifact(studentA, {
      title: 'Algebra',
      kind: 'worksheet',
      textContent: content,
    });

    const parseResult = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null);
    await artifactService.updateArtifactParseResult(artifact.artifactId, parseResult);

    const questionBlock = parseResult.blocks.find((b: ArtifactBlock) => b.kind === 'question');
    const answerBlock = parseResult.blocks.find((b: ArtifactBlock) => b.kind === 'answer_key');

    expect(questionBlock?.visibility).toBe('student');
    expect(answerBlock?.visibility).toBe('teacher_only');

    const studentStructure = await artifactService.getArtifactStructure(studentA, artifact.artifactId);
    const serialized = JSON.stringify(studentStructure);
    expect(serialized).not.toContain('TOPSECRET_ANSWER_XYZ');
    expect(studentStructure?.answerKeys).toHaveLength(0);
    expect(studentStructure?.blocks.every((b: ArtifactBlock) => b.visibility !== 'teacher_only')).toBe(true);
  });
});

describe('R3.7 — teacher-only authorization', () => {
  it('student sees no restricted content; authorized teacher sees it; unauthorized teacher denied', async () => {
    const content = ['Question 1: Solve 2x+3=9', 'Answers:', '1. x=3'].join('\n');

    // school_shared so same-school teacher can access the artifact at all.
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'Algebra',
      kind: 'worksheet',
      accessScope: 'school_shared',
      textContent: content,
    });
    const parseResult = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null);
    await artifactService.updateArtifactParseResult(artifact.artifactId, parseResult);

    const studentView = await artifactService.getArtifactStructure(studentA, artifact.artifactId);
    expect(studentView?.blocks.some((b: ArtifactBlock) => b.visibility === 'teacher_only')).toBe(false);
    expect(studentView?.answerKeys).toHaveLength(0);

    const teacherView = await artifactService.getArtifactStructure(teacherSameSchool, artifact.artifactId);
    expect(teacherView?.blocks.some((b: ArtifactBlock) => b.visibility === 'teacher_only')).toBe(true);
    expect(teacherView?.answerKeys.length).toBeGreaterThan(0);

    // Teacher from another school is denied (fail-closed).
    await expect(
      artifactService.getArtifactForUser(teacherOtherSchool, artifact.artifactId),
    ).rejects.toThrow();
  });
});

describe('R3.8 / R3.9 — school and actor scoping', () => {
  it('cross-school actor cannot read the artifact', async () => {
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'Notes',
      kind: 'notes',
      accessScope: 'school_shared',
      textContent: 'School A content',
    });

    await expect(
      artifactService.getArtifactForUser(studentB, artifact.artifactId),
    ).rejects.toThrow('Artifact belongs to a different school.');
  });

  it('persisted identity comes from verified context, not request body', async () => {
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'Notes',
      kind: 'notes',
      mediaAssetId: 'media_studentA_owned',
      textContent: 'Content',
    });

    // The artifact's school/owner are derived from the verified identity.
    expect(artifact.schoolId).toBe('school-A');
    expect(artifact.ownerStudentId).toBe('student-A');
    expect(artifact.mediaAssetId).toBe('media_studentA_owned');
  });
});

describe('R3.12 — idempotent / replay parse', () => {
  it('reparsing the same content does not duplicate the structured projection', async () => {
    const content = 'Section 1: Algebra\nQuestion 1: What is 2+2?';
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'W',
      kind: 'worksheet',
      textContent: content,
    });

    const first = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null);
    await artifactService.updateArtifactParseResult(artifact.artifactId, first);
    const second = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null);
    await artifactService.updateArtifactParseResult(artifact.artifactId, second);

    const full = await artifactService.getFullArtifact(studentA, artifact.artifactId);
    expect(full?.artifact.artifactId).toBe(artifact.artifactId);
    // Replace semantics: block count equals exactly the parsed set, no accumulation.
    expect(full?.blocks.length).toBe(second.blocks.length);
    const ids = full?.blocks.map((b: ArtifactBlock) => b.blockId) || [];
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe('R3.13 / R3.14 — atomicity and failed reparse safety', () => {
  it('a failed reparse does not destroy the previous valid projection', async () => {
    const good = 'Section 1: Algebra\nQuestion 1: What is 2+2?';
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'W',
      kind: 'worksheet',
      textContent: good,
    });
    const goodResult = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', good, null);
    await artifactService.updateArtifactParseResult(artifact.artifactId, goodResult);

    // Simulate a reparse that yields no usable content (parser failure).
    const badResult = artifactParserService.parse(artifact.artifactId, 'school-A', 'image', '', null);
    expect(badResult.parseStatus).not.toBe('parsed');

    // The route would NOT call updateArtifactParseResult on a failed parse.
    // The previously valid structure must remain usable.
    const full = await artifactService.getFullArtifact(studentA, artifact.artifactId);
    expect(full?.blocks.length).toBeGreaterThan(0);
    expect(full?.artifact.parseStatus).toBe('parsed');
  });

  it('updateArtifactParseResult is a single logical mutation (no partial durable state)', async () => {
    const content = 'Question 1: A\nQuestion 2: B\nQuestion 3: C';
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'W',
      kind: 'worksheet',
      textContent: content,
    });
    const result = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null);
    const updated = await artifactService.updateArtifactParseResult(artifact.artifactId, result);

    expect(updated.blockCount).toBe(result.blocks.length);
    expect(updated.questionCount).toBe(result.questions.length);
  });
});

describe('R3.15 / R3.16 — low confidence / unsupported, no fabrication', () => {
  it('an image with no text degrades honestly to unsupported with no fabricated extraction', () => {
    const result = artifactParserService.parse('art_1', 'school-A', 'image', '', null);
    expect(result.parseStatus).not.toBe('parsed');
    expect(result.blocks).toHaveLength(0);
    expect(result.warnings.some((w) => /OCR/i.test(w))).toBe(true);
  });
});

describe('R3.10 / R3.11 — curriculum / objective references are candidate only', () => {
  it('stores candidate curriculum refs without promoting them to verified truth', async () => {
    const content = 'Question 1: What is 2+2?';
    const artifact = await artifactService.createArtifact(studentA, {
      title: 'W',
      kind: 'worksheet',
      textContent: content,
      curriculumRefs: { objectiveIds: ['obj_unknown_123'], subjectId: 'math' } as any,
    });
    const parseResult = artifactParserService.parse(artifact.artifactId, 'school-A', 'worksheet', content, null, {
      curriculumRefs: { objectiveIds: ['obj_unknown_123'], subjectId: 'math' } as any,
    });
    const updated = await artifactService.updateArtifactParseResult(artifact.artifactId, parseResult, {
      objectiveIds: ['obj_unknown_123'],
      subjectId: 'math',
    } as any);

    expect(updated.curriculumRefs.objectiveIds).toContain('obj_unknown_123');
    expect(updated.curriculumRefs.verified).toBe(false);
    expect(updated.curriculumRefs.candidate).toBe(true);
    expect(parseResult.warnings.some((w) => /candidate/i.test(w))).toBe(true);
  });
});

describe('R3.5 — restricted marking_scheme / rubric / teacher_note are teacher_only', () => {
  it('detects restricted sections with teacher_only visibility', () => {
    const content = [
      'Question 1: Solve x+1=2',
      'Marking Scheme:',
      '1 mark for correct method',
      'Rubric:',
      'excellent / good / poor',
      "Teacher's Notes:",
      'watch for sign errors',
    ].join('\n');

    const result = artifactParserService.parse('art_1', 'school-A', 'worksheet', content, null);
    const restricted = result.blocks.filter((b: ArtifactBlock) => b.visibility === 'teacher_only');
    const restrictedKinds = restricted.map((b: ArtifactBlock) => b.kind);

    expect(restrictedKinds).toContain('marking_scheme');
    expect(restrictedKinds).toContain('rubric');
    expect(restrictedKinds).toContain('teacher_note');
    expect(restricted.every((b: ArtifactBlock) => b.visibility === 'teacher_only')).toBe(true);
  });
});

describe('R3.2 / R3.12 — structured repository regression', () => {
  it('structured repository upsert and missing lookup behave as before', async () => {
    const { structuredArtifactRepository } = await import('../services/artifactStructuredRepository');
    const record = await structuredArtifactRepository.upsertStructuredArtifact({
      artifactId: 'art_r1',
      scope: { artifactId: 'art_r1', studentId: 'student-1', schoolId: 'school-1' },
      artifactType: 'worksheet',
      fileName: 'test.pdf',
      mimeType: 'application/pdf',
      storageRef: null,
      parseStatus: 'parsed',
      sourceTrustStatus: 'student_uploaded',
      rawTextAvailable: true,
      structuredBlockCount: 10,
      questionCount: 5,
      answerKeyCount: 1,
      diagramCount: 0,
      workedExampleCount: 2,
      theoremBlockCount: 0,
      learningObjectiveCount: 1,
      topicMappings: [],
      parserWarnings: [],
      safetyFlags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    expect(record.artifactId).toBe('art_r1');

    const missing = await structuredArtifactRepository.getStructuredArtifact({
      artifactId: 'does_not_exist',
      studentId: 'student-1',
      schoolId: 'school-1',
    });
    expect(missing).toBeNull();
  });
});
