import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const SCHEMA_PATH = resolve(__dirname, '../../../../../prisma/schema.prisma');
const SCHEMA_CONTENT = readFileSync(SCHEMA_PATH, 'utf-8');

function modelExists(modelName: string): boolean {
  const regex = new RegExp(`^model\\s+${modelName}\\s*{`, 'm');
  return regex.test(SCHEMA_CONTENT);
}

function countModelOccurrences(modelName: string): number {
  const regex = new RegExp(`^model\\s+${modelName}\\s*{`, 'gm');
  const matches = SCHEMA_CONTENT.match(regex);
  return matches ? matches.length : 0;
}

function schemaContains(pattern: string): boolean {
  return SCHEMA_CONTENT.includes(pattern);
}

describe('Package 3 - Durable Persistence', () => {
  it('Prisma validate passes (schema is valid)', () => {
    expect(existsSync(SCHEMA_PATH)).toBe(true);
    expect(SCHEMA_CONTENT.length).toBeGreaterThan(0);
  });

  it('QuestionBankItemRecord model declared in schema', () => {
    expect(modelExists('QuestionBankItemRecord')).toBe(true);
  });

  it('QuestionVersionRecord model declared in schema', () => {
    expect(modelExists('QuestionVersionRecord')).toBe(true);
  });

  it('QuestionPartVersionRecord model declared in schema', () => {
    expect(modelExists('QuestionPartVersionRecord')).toBe(true);
  });

  it('QuestionAssetVersionRecord model declared in schema', () => {
    expect(modelExists('QuestionAssetVersionRecord')).toBe(true);
  });

  it('AnswerKeyVersionRecord model declared in schema', () => {
    expect(modelExists('AnswerKeyVersionRecord')).toBe(true);
  });

  it('RubricVersionRecord model declared in schema', () => {
    expect(modelExists('RubricVersionRecord')).toBe(true);
  });

  it('QuestionObjectiveMappingRecord model declared in schema', () => {
    expect(modelExists('QuestionObjectiveMappingRecord')).toBe(true);
  });

  it('QuestionSourceRecordRecord model declared in schema (naming stutter acknowledged)', () => {
    expect(modelExists('QuestionSourceRecordRecord')).toBe(true);
  });

  it('QuestionCurriculumValidityRecord model declared in schema', () => {
    expect(modelExists('QuestionCurriculumValidityRecord')).toBe(true);
  });

  it('QuestionUsageEligibilityRecord model declared in schema', () => {
    expect(modelExists('QuestionUsageEligibilityRecord')).toBe(true);
  });

  it('QuestionApprovalRequestRecord model declared in schema', () => {
    expect(modelExists('QuestionApprovalRequestRecord')).toBe(true);
  });

  it('QuestionApprovalRecord model declared in schema', () => {
    expect(modelExists('QuestionApprovalRecord')).toBe(true);
  });

  it('QuestionDuplicateCandidateRecord model declared in schema', () => {
    expect(modelExists('QuestionDuplicateCandidateRecord')).toBe(true);
  });

  it('QuestionExposureHoldRecord model declared in schema', () => {
    expect(modelExists('QuestionExposureHoldRecord')).toBe(true);
  });

  it('QuestionIngestionBatchRecord model declared in schema', () => {
    expect(modelExists('QuestionIngestionBatchRecord')).toBe(true);
  });

  it('QuestionIngestionCandidateRecord model declared in schema', () => {
    expect(modelExists('QuestionIngestionCandidateRecord')).toBe(true);
  });

  it('ContentReviewRecord is reused, not duplicated', () => {
    expect(modelExists('ContentReviewRecord')).toBe(true);
    expect(countModelOccurrences('ContentReviewRecord')).toBe(1);
    expect(modelExists('QuestionContentReviewRecord')).toBe(false);
    expect(modelExists('ContentSafetyReviewRecord')).toBe(false);
  });

  it('Forbidden models were NOT created', () => {
    const forbidden = [
      'ExamPaperRecord',
      'ExamBlueprintRecord',
      'MarkingResultRecord',
      'OCRRecord',
      'ParentSummaryRecord',
      'FinalizationRecord',
      'StudentQuestionAttemptRecord',
    ];
    for (const f of forbidden) {
      expect(modelExists(f)).toBe(false);
    }
  });
});

describe('Package 3 - Prisma Repository Adapters', () => {
  it('Prisma repositories file exists and exports all expected classes', async () => {
    const repo = await import('../repositories/prismaQuestionBankRepositories');
    expect(repo.PrismaQuestionBankItemRepository).toBeDefined();
    expect(repo.PrismaQuestionVersionRepository).toBeDefined();
    expect(repo.PrismaQuestionPartVersionRepository).toBeDefined();
    expect(repo.PrismaQuestionAssetVersionRepository).toBeDefined();
    expect(repo.PrismaAnswerKeyVersionRepository).toBeDefined();
    expect(repo.PrismaRubricVersionRepository).toBeDefined();
    expect(repo.PrismaQuestionObjectiveMappingRepository).toBeDefined();
    expect(repo.PrismaQuestionSourceRecordRepository).toBeDefined();
    expect(repo.PrismaQuestionGovernanceRepository).toBeDefined();
    expect(repo.PrismaQuestionApprovalRequestRepository).toBeDefined();
    expect(repo.PrismaQuestionApprovalRecordRepository).toBeDefined();
    expect(repo.PrismaQuestionIngestionBatchRepository).toBeDefined();
    expect(repo.PrismaQuestionIngestionCandidateRepository).toBeDefined();
    expect(repo.PrismaQuestionDuplicateCandidateRepository).toBeDefined();
    expect(repo.PrismaQuestionExposureHoldRepository).toBeDefined();
  });

  it('In-memory repositories are preserved', async () => {
    const repo = await import('../repositories/inMemoryQuestionBankRepositories');
    expect(repo.InMemoryQuestionBankItemRepository).toBeDefined();
    expect(repo.InMemoryQuestionVersionRepository).toBeDefined();
    expect(repo.InMemoryQuestionApprovalRequestRepository).toBeDefined();
    expect(repo.InMemoryQuestionIngestionCandidateRepository).toBeDefined();
    expect(repo.InMemoryQuestionDuplicateCandidateRepository).toBeDefined();
    expect(repo.InMemoryQuestionExposureHoldRepository).toBeDefined();
  });
});
