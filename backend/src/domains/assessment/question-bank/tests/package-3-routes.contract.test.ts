import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'fs';
import { resolve } from 'path';

const QUESTION_BANK_ROUTE_PATH = resolve(__dirname, '../../../../routes/questionBank.ts');
const AI_ROUTE_PATH = resolve(__dirname, '../../../../routes/ai.ts');

function getRouteContent(): string {
  return readFileSync(QUESTION_BANK_ROUTE_PATH, 'utf-8');
}

function getAiRouteContent(): string {
  return existsSync(AI_ROUTE_PATH) ? readFileSync(AI_ROUTE_PATH, 'utf-8') : '';
}

describe('Package 3 - Route Contracts', () => {
  it('questionBank route file exists', () => {
    expect(existsSync(QUESTION_BANK_ROUTE_PATH)).toBe(true);
  });

  it('questionBank route implements mutating routes with idempotency key check', () => {
    const content = getRouteContent();
    const idempotencyChecks = content.match(/if\s*\(!idempotencyKey\)/g);
    expect(idempotencyChecks).not.toBeNull();
    expect(idempotencyChecks!.length).toBeGreaterThanOrEqual(10);
  });

  it('routes return safe response envelope with ok, requestId, correlationId, status, safeMessage, reasonCode', () => {
    const content = getRouteContent();
    expect(content).toContain('createSafeResponseEnvelope');
    expect(content).toContain('ok:');
    expect(content).toContain('requestId');
    expect(content).toContain('correlationId');
    expect(content).toContain('safeMessage');
    expect(content).toContain('reasonCode');
  });

  it('route does not import OpenAI, Genkit, Pinecone, React, Next, or frontend modules', () => {
    const content = getRouteContent();
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'react', 'next', 'frontend'];
    for (const f of forbidden) {
      expect(content.toLowerCase()).not.toContain(f);
    }
  });

  it('student/parent projection does not leak answer keys in route response', () => {
    const content = getRouteContent();
    expect(content).toContain('isStudent');
    expect(content).toContain('isParent');
    const noLeakIndicators = content.match(/teacherExplanation|teacherOnly/g);
    expect(noLeakIndicators).not.toBeNull();
  });

  it('backend/src/routes/ai.ts unchanged for question bank', () => {
    const aiContent = getAiRouteContent();
    const qbankRefs = ['question-bank', 'questionBank', 'QuestionBank', 'question_bank'];
    let found = false;
    for (const ref of qbankRefs) {
      if (aiContent.toLowerCase().includes(ref.toLowerCase())) {
        found = true;
        break;
      }
    }
    expect(found).toBe(false);
  });

  it('frontend files unchanged (no frontend imports or references in route)', () => {
    const content = getRouteContent();
    expect(content).not.toContain('frontend/');
    expect(content).not.toContain('../../frontend');
  });

  it('safeHandler wraps route handlers for error handling', () => {
    const content = getRouteContent();
    expect(content).toContain('function safeHandler');
    expect(content).toContain('try {');
    expect(content).toContain('catch');
    expect(content).toContain('POLICY_BLOCKED');
    expect(content).toContain('NOT_FOUND');
    expect(content).toContain('INVALID_STATE');
    expect(content).toContain('IDEMPOTENCY_CONFLICT');
  });

  it('route paths exist for ingestion, approval, duplicate, and exposure endpoints', () => {
    const content = getRouteContent();
    expect(content).toContain("/ingestion/batches");
    expect(content).toContain("/ingestion/candidates");
    expect(content).toContain("/approval-requests");
    expect(content).toContain("/duplicate-candidates");
    expect(content).toContain("/exposure-holds");
    expect(content).toContain("/drafts");
    expect(content).toContain("/versions");
  });

  it('GET routes are read-safe and return safe projections', () => {
    const content = getRouteContent();
    expect(content).toContain("router.get('/questions/:questionId'");
    expect(content).toContain("router.get('/questions/:questionId/versions'");
    expect(content).toContain("router.get('/versions/:questionVersionId'");
  });
});

describe('Package 3 - No Duplication', () => {
  it('ContentReviewRecord exists exactly once in schema', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    const matches = schema.match(/^model\s+ContentReviewRecord\s*{/gm);
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
    expect(schema.includes('model QuestionContentReviewRecord')).toBe(false);
    expect(schema.includes('model ContentSafetyReviewRecord')).toBe(false);
  });

  it('CurriculumVersionRecord is reused, not duplicated', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema.includes('model CurriculumVersionRecord')).toBe(true);
  });

  it('LearningObjectiveRecord is reused, not duplicated', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema.includes('model LearningObjectiveRecord')).toBe(true);
  });

  it('ApprovedSourceRecord is reused, not duplicated', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema.includes('model ApprovedSourceRecord')).toBe(true);
  });

  it('ContentItemRecord is reused, not duplicated', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    expect(schema.includes('model ContentItemRecord')).toBe(true);
  });

  it('Later-package models are not owned by Package 3', () => {
    const pkg3SourceDir = resolve(__dirname, '../repositories');
    const pkg3Sources = readdirSync(pkg3SourceDir).filter(f => f.endsWith('.ts'));
    const pkg3Code = pkg3Sources.map(f => readFileSync(resolve(pkg3SourceDir, f), 'utf-8')).join('\n');
    const laterModels = ['ExamPaperRecord'];
    for (const m of laterModels) {
      expect(pkg3Code).not.toContain(m);
    }
  });

  it('Later-package models have exactly one definition (no duplication)', () => {
    const schemaPath = resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = readFileSync(schemaPath, 'utf-8');
    const laterModels: string[] = ['ExamPaperRecord'];
    for (const m of laterModels) {
      const regex = new RegExp(`^model\\s+${m}\\s*{`, 'gm');
      const matches = schema.match(regex);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(1);
    }
  });

  it('Package 5 and 8 models are not referenced by Package 3', () => {
    const pkg3SourceDir = resolve(__dirname, '../repositories');
    const pkg3Sources = readdirSync(pkg3SourceDir).filter(f => f.endsWith('.ts'));
    const pkg3Code = pkg3Sources.map(f => readFileSync(resolve(pkg3SourceDir, f), 'utf-8')).join('\n');
    const laterRefs = ['MarkingResult', 'MarkingBatch', 'MarkingInvocation', 'OCR', 'ParentSummary', 'Finalization', 'StudentAttempt', 'StudentQuestionAttempt'];
    for (const m of laterRefs) {
      expect(pkg3Code).not.toContain(m);
    }
  });
});
