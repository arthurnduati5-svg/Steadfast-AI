// ─────────────────────────────────────────────────────────────
// R3 REPAIR — Durability + MediaAsset anchor + curriculum authority
// Focused proof for the four connected production defects:
//   A. Production persistence fails closed (no Map authority)
//   B. Structured repository uses canonical storage in production
//   C. Canonical MediaAsset verified before linking
//   D. Fake curriculum prefixes not trusted in production
// ─────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const { prismaMock } = vi.hoisted(() => {
  const prismaMock: any = {
    $queryRaw: vi.fn(),
    $queryRawUnsafe: vi.fn(),
    $executeRawUnsafe: vi.fn(),
    learningArtifact: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    learningArtifactBlock: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      createMany: vi.fn(),
    },
    mediaAsset: { findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prismaMock };
});

vi.mock('../lib/prisma', () => ({ default: prismaMock }));

import prisma from '../lib/prisma';
import {
  artifactService,
  _clearArtifactMemoryStoreForTest,
  _resetArtifactServicePrismaAvailability,
  resolveAuthorizedMediaAsset,
  ArtifactPersistenceError,
} from '../services/artifactService';
import {
  structuredArtifactRepository,
  _clearStructuredRepositoryMirrorForTest,
  _resetStructuredRepositoryPrismaAvailability,
} from '../services/artifactStructuredRepository';
import {
  artifactCurriculumReferenceService,
  _resetCurriculumPrismaAvailability,
} from '../services/artifactCurriculumReferenceService';
import { topicSkillPrerequisiteMapService } from '../services/task022TopicSkillPrerequisiteMapService';

const ORIGINAL_ENV = process.env.NODE_ENV;

function setPrismaAvailable() {
  prismaMock.$queryRaw = vi.fn().mockResolvedValue([{ '?column?': 1 }]);
  prismaMock.$queryRawUnsafe = vi.fn().mockResolvedValue([]);
}
function setPrismaUnavailable() {
  prismaMock.$queryRaw = vi.fn().mockRejectedValue(new Error('prisma unavailable'));
  prismaMock.$queryRawUnsafe = vi.fn().mockRejectedValue(new Error('prisma unavailable'));
}
function txRunner() {
  const tx = {
    learningArtifact: { upsert: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) },
    learningArtifactBlock: { deleteMany: vi.fn().mockResolvedValue({}), createMany: vi.fn().mockResolvedValue({}) },
  };
  return tx;
}

function makeStudent(schoolId: string, studentId: string) {
  return { studentId, schoolId, userId: studentId, role: 'student' as const, grade: undefined, ageBand: undefined };
}
function makeTeacher(schoolId: string, teacherId: string) {
  return { studentId: teacherId, schoolId, userId: teacherId, role: 'teacher' as const, grade: undefined, ageBand: undefined };
}

function artifactRow(artifactId: string, schoolId: string, ownerStudentId: string | null) {
  return {
    id: artifactId,
    schoolId,
    ownerStudentId,
    ownerTeacherId: null,
    classId: null,
    mediaAssetId: null,
    kind: 'worksheet',
    accessScope: 'student_private',
    title: 'Repair Artifact',
    description: null,
    originalFileName: null,
    mimeType: null,
    sizeBytes: null,
    source: 'text_registration',
    parseStatus: 'not_parsed',
    structureQuality: 'unavailable',
    contentFingerprint: 'fp',
    curriculumRefs: {},
    warnings: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    parsedAt: null,
  };
}

function blockRow(artifactId: string, schoolId: string, id: string, text: string) {
  return {
    id,
    artifactId,
    schoolId,
    kind: 'section',
    visibility: 'student',
    order: 0,
    text,
    normalizedText: null,
    summary: null,
    pageNumber: null,
    sectionTitle: null,
    headingPath: [],
    confidence: 0.5,
    provenance: {},
    educationalTags: {},
    metadata: {},
  };
}

beforeEach(() => {
  _resetArtifactServicePrismaAvailability();
  _resetStructuredRepositoryPrismaAvailability();
  _resetCurriculumPrismaAvailability();
  _clearArtifactMemoryStoreForTest();
  _clearStructuredRepositoryMirrorForTest();
  topicSkillPrerequisiteMapService.reset();
  // Default: production + available; individual tests override.
  process.env.NODE_ENV = 'production';
  setPrismaAvailable();
  prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(null);
  prismaMock.learningArtifact.upsert = vi.fn().mockResolvedValue({});
  prismaMock.learningArtifact.update = vi.fn().mockResolvedValue({});
  prismaMock.learningArtifactBlock.findMany = vi.fn().mockResolvedValue([]);
  prismaMock.learningArtifactBlock.deleteMany = vi.fn().mockResolvedValue({});
  prismaMock.learningArtifactBlock.createMany = vi.fn().mockResolvedValue({});
  prismaMock.mediaAsset.findUnique = vi.fn().mockResolvedValue(null);
  prismaMock.$transaction = vi.fn().mockImplementation(async (cb: any) => cb(txRunner()));
});

afterEach(() => {
  process.env.NODE_ENV = ORIGINAL_ENV;
});

describe('R3 REPAIR — Defect A: production persistence fails closed', () => {
  it('TEST A: production create rejects when Prisma is unavailable (no Map success)', async () => {
    setPrismaUnavailable();
    const student = makeStudent('school_A', 'student_A');
    const promise = artifactService.createArtifact(student, { title: 'X', kind: 'worksheet', textContent: 'hi' });
    await expect(promise).rejects.toThrow(ArtifactPersistenceError);
    // No durable row, no memory entry, nothing to read back.
    const fetched = await artifactService.getArtifactForUser(student, 'art_does_not_exist');
    expect(fetched).toBeNull();
  });

  it('TEST B: production parse transaction failure does not succeed; old projection unchanged', async () => {
    const artifactId = 'art_prod_b';
    const schoolId = 'school_A';
    const student = makeStudent(schoolId, 'student_A');
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, schoolId, 'student_A'));
    prismaMock.learningArtifactBlock.findMany = vi.fn().mockResolvedValue([blockRow(artifactId, schoolId, 'old_b', 'Old durable section')]);
    prismaMock.$transaction = vi.fn().mockRejectedValue(new Error('transaction failed'));

    // Create persists first (upsert resolves).
    await artifactService.createArtifact(student, { title: 'B', kind: 'worksheet', textContent: 'content' });
    // Reparse should fail closed.
    await expect(
      artifactService.updateArtifactParseResult(artifactId, {
        parseStatus: 'parsed',
        structureQuality: 'high',
        blocks: [{ blockId: 'new_b', artifactId, schoolId, kind: 'section', visibility: 'student', order: 0, text: 'New' } as any],
        questions: [],
        answerKeys: [],
        workedExamples: [],
        diagrams: [],
        warnings: [],
      } as any),
    ).rejects.toThrow(ArtifactPersistenceError);

    // Previous durable projection must remain logically unchanged.
    const blocks = await artifactService.listArtifactBlocks(artifactId);
    expect(blocks.map((b) => b.text)).toContain('Old durable section');
    expect(blocks.map((b) => b.text)).not.toContain('New');
  });

  it('TEST C: restart/empty-memory production reads from durable persistence', async () => {
    const artifactId = 'art_prod_c';
    const schoolId = 'school_A';
    const student = makeStudent(schoolId, 'student_A');
    _clearArtifactMemoryStoreForTest(); // simulate restart
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, schoolId, 'student_A'));
    prismaMock.learningArtifactBlock.findMany = vi.fn().mockResolvedValue([blockRow(artifactId, schoolId, 'c_b', 'Restarted block')]);

    const art = await artifactService.getArtifactForUser(student, artifactId);
    expect(art).not.toBeNull();
    expect(art!.artifactId).toBe(artifactId);
    const blocks = await artifactService.listArtifactBlocks(artifactId);
    expect(blocks.map((b) => b.text)).toContain('Restarted block');
  });
});

describe('R3 REPAIR — Defect B: structured repository production authority', () => {
  it('TEST D: production upsert/block ops do not succeed from Map mirrors when Prisma unavailable', async () => {
    setPrismaUnavailable();
    const scope = { artifactId: 'art_repo_d', schoolId: 'school_A', studentId: 'student_A' };
    await expect(
      structuredArtifactRepository.upsertArtifactBlocks(scope, [{ id: 'b1', artifactId: 'art_repo_d', blockType: 'section' as any, visibility: 'learner_visible' as any, text: 'x', orderIndex: 0, confidence: 'high' as any, provenance: { artifactId: 'art_repo_d', parserSource: 't', warnings: [] } as any, safetyFlags: [], metadata: {} } as any]),
    ).rejects.toThrow(ArtifactPersistenceError);
    // No mirror authority: reading returns null, not a fabricated record.
    const got = await structuredArtifactRepository.getStructuredArtifact(scope);
    expect(got).toBeNull();
  });

  it('TEST D2: production structured read derives from canonical storage', async () => {
    const artifactId = 'art_repo_d2';
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, 'school_A', 'student_A'));
    const got = await structuredArtifactRepository.getStructuredArtifact({ artifactId, schoolId: 'school_A', studentId: 'student_A' });
    expect(got).not.toBeNull();
    expect(got!.artifactId).toBe(artifactId);
  });
});

describe('R3 REPAIR — Defect C: canonical MediaAsset verification', () => {
  it('TEST E: valid owner student may anchor to own MediaAsset', async () => {
    const artifactId = 'art_media_e';
    const student = makeStudent('school_A', 'student_A');
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, 'school_A', 'student_A'));
    prismaMock.mediaAsset.findUnique = vi.fn().mockResolvedValue({ id: 'media-A', userId: 'student_A' });

    const anchored = await artifactService.anchorToMediaAsset(student, artifactId, 'media-A');
    expect(anchored).not.toBeNull();
    expect(anchored!.mediaAssetId).toBe('media-A');
    expect(prismaMock.learningArtifact.update).toHaveBeenCalled();
  });

  it('TEST F: cross-user MediaAsset is denied and not mutated', async () => {
    const artifactId = 'art_media_f';
    // Artifact owned by student-B; MediaAsset owned by student-A.
    const studentB = makeStudent('school_A', 'student_B');
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, 'school_A', 'student_B'));
    prismaMock.mediaAsset.findUnique = vi.fn().mockResolvedValue({ id: 'media-A', userId: 'student-A' });

    await expect(artifactService.anchorToMediaAsset(studentB, artifactId, 'media-A')).rejects.toThrow();
    expect(prismaMock.learningArtifact.update).not.toHaveBeenCalled();
  });

  it('TEST G: unknown MediaAsset is never anchored', async () => {
    const artifactId = 'art_media_g';
    const student = makeStudent('school_A', 'student_A');
    prismaMock.learningArtifact.findUnique = vi.fn().mockResolvedValue(artifactRow(artifactId, 'school_A', 'student_A'));
    prismaMock.mediaAsset.findUnique = vi.fn().mockResolvedValue(null);

    await expect(artifactService.anchorToMediaAsset(student, artifactId, 'media-unknown')).rejects.toThrow();
    expect(prismaMock.learningArtifact.update).not.toHaveBeenCalled();
  });

  it('TEST G2: resolveAuthorizedMediaAsset fails closed for teacher linkage to a learner asset', async () => {
    const teacher = makeTeacher('school_A', 'teacher_1');
    prismaMock.mediaAsset.findUnique = vi.fn().mockResolvedValue({ id: 'media-A', userId: 'student-A' });
    await expect(resolveAuthorizedMediaAsset(teacher, 'media-A')).rejects.toThrow();
  });
});

describe('R3 REPAIR — Defect D: curriculum reference authority', () => {
  it('TEST H: real registered Knowledge Graph IDs are verified', async () => {
    process.env.NODE_ENV = 'test';
    topicSkillPrerequisiteMapService.registerTopic({ topicId: 'topic_real_1', title: 'Algebra' } as any);
    topicSkillPrerequisiteMapService.registerSkill({ skillId: 'skill_real_1', curriculumTopicId: 'topic_real_1', title: 'Solve' } as any);
    topicSkillPrerequisiteMapService.registerObjective({ objectiveId: 'obj_real_1', curriculumSkillId: 'skill_real_1', title: 'Obj' } as any);

    const res = await artifactCurriculumReferenceService.validate({
      topicId: 'topic_real_1',
      skillIds: ['skill_real_1'],
      objectiveIds: ['obj_real_1'],
    });
    expect(res.verified.topicId).toBe('topic_real_1');
    expect(res.verified.skillIds).toContain('skill_real_1');
    expect(res.verified.objectiveIds).toContain('obj_real_1');
  });

  it('TEST I: fake valid_* prefixes are NOT trusted in production', async () => {
    process.env.NODE_ENV = 'production';
    setPrismaUnavailable();
    const res = await artifactCurriculumReferenceService.validate({
      topicId: 'valid_fake_topic',
      skillIds: ['skill_valid_fake'],
      objectiveIds: ['obj_valid_fake'],
    });
    expect(res.verified.topicId).toBeUndefined();
    expect(res.verified.skillIds).toBeUndefined();
    expect(res.verified.objectiveIds).toBeUndefined();

    const persisted = await artifactCurriculumReferenceService.resolveForPersistence({
      topicId: 'valid_fake_topic',
      skillIds: ['skill_valid_fake'],
      objectiveIds: ['obj_valid_fake'],
    });
    expect(persisted.persisted.topicId).toBeUndefined();
    expect(persisted.persisted.skillIds).toBeUndefined();
    expect(persisted.persisted.objectiveIds).toBeUndefined();
  });

  it('TEST I2: unresolved real-looking IDs remain candidate only in production', async () => {
    process.env.NODE_ENV = 'production';
    setPrismaUnavailable();
    const res = await artifactCurriculumReferenceService.validate({ skillIds: ['skill_not_in_graph_xyz'] });
    expect(res.verified.skillIds).toBeUndefined();
    expect(res.candidate.skillIds).toContain('skill_not_in_graph_xyz');
  });
});

describe('R3 REPAIR — Defect D/J/K: existing student-safety & replay regressions', () => {
  function makeFixtureWithAnswers() {
    return `
# Worksheet: Linear Equations
1. Solve 2x + 3 = 9
2. Solve 5y - 2 = 13

Answer Key
1. x = 3
2. y = 3

Marking Scheme
Q1: 2 marks for correct isolation, 1 mark for final answer.

Rubric
Excellent: shows all steps.

Teacher Notes
This is for teacher eyes only: emphasize balancing method.
`;
  }

  it('TEST J: student projection never leaks restricted content (regression)', async () => {
    process.env.NODE_ENV = 'test';
    const student = makeStudent('school_A', 'student_A');
    const artifact = await artifactService.createArtifact(student, { title: 'Leak', kind: 'worksheet', textContent: makeFixtureWithAnswers() });
    const parsed = (await import('../services/artifactParserService')).artifactParserService.parse(
      artifact.artifactId,
      'school_A',
      'worksheet',
      makeFixtureWithAnswers(),
      null,
      {},
    );
    await artifactService.updateArtifactParseResult(artifact.artifactId, parsed as any);
    const view = await artifactService.getArtifactStructure(student, artifact.artifactId);
    const serialized = JSON.stringify(view);
    expect(serialized.includes('x = 3')).toBe(false);
    expect(serialized.toLowerCase().includes('teacher eyes only')).toBe(false);
    expect(serialized.includes('marking scheme')).toBe(false);
  });

  it('TEST K: repeated parse with same fingerprint does not duplicate structured blocks', async () => {
    process.env.NODE_ENV = 'test';
    const student = makeStudent('school_A', 'student_A');
    const content = 'Stable replay content. Solve 2x+3=9';
    const artifact = await artifactService.createArtifact(student, { title: 'Replay', kind: 'worksheet', textContent: content });
    const { artifactParserService } = await import('../services/artifactParserService');
    const first = artifactParserService.parse(artifact.artifactId, 'school_A', 'worksheet', content, null, {});
    const u1 = await artifactService.updateArtifactParseResult(artifact.artifactId, first as any);
    const b1 = await artifactService.listArtifactBlocks(artifact.artifactId);

    const second = artifactParserService.parse(artifact.artifactId, 'school_A', 'worksheet', content, null, {});
    const u2 = await artifactService.updateArtifactParseResult(artifact.artifactId, second as any);
    const b2 = await artifactService.listArtifactBlocks(artifact.artifactId);

    expect(u2.contentFingerprint).toBe(u1.contentFingerprint);
    expect(b2.length).toBe(b1.length);
    expect(u2.artifactId).toBe(artifact.artifactId);
  });
});
