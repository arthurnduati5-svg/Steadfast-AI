import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 6 - Route Contracts', () => {
  const routesPath = path.resolve(__dirname, '../../../../routes/examPaper.ts');
  const indexTsPath = path.resolve(__dirname, '../../../../index.ts');
  const aiRoutesPath = path.resolve(__dirname, '../../../../routes/ai.ts');

  it('backend/src/routes/examPaper.ts exists', () => {
    expect(fs.existsSync(routesPath)).toBe(true);
  });

  it('Route file contains POST / handler', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes("router.post('/'")).toBe(true);
  });

  it('Route file contains POST from-draft handler', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes("router.post('/from-draft/:draftId'")).toBe(true);
  });

  it('Route file contains GET paper by ID', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes("router.get('/:paperId'")).toBe(true);
  });

  it('Route file contains version list handler', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('versions')).toBe(true);
  });

  it('Route file contains variant handlers', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('/variants')).toBe(true);
  });

  it('Route file contains access-policy handlers', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('access-policy')).toBe(true);
  });

  it('Route file contains approve handler', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('/approve')).toBe(true);
  });

  it('Route file contains delivery-bridge handlers', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('delivery-bridge')).toBe(true);
  });

  it('Route file contains projection handlers', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('/projection')).toBe(true);
  });

  it('Route is mounted under /api/question-bank/exam-papers in index.ts', () => {
    const indexContent = fs.readFileSync(indexTsPath, 'utf-8');
    expect(indexContent.includes("'/api/question-bank/exam-papers'")).toBe(true);
  });

  it('Mutating routes require idempotency key', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    const idempotencyCalls = (content.match(/requireIdempotencyKey/g) || []).length;
    const postRoutes = (content.match(/router\.post\(/g) || []).length;
    expect(idempotencyCalls).toBeGreaterThanOrEqual(postRoutes - 1);
  });

  it('Safe response envelope keys exist', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('SafeResponseEnvelope')).toBe(true);
    expect(content.includes('ok:')).toBe(true);
    expect(content.includes('requestId')).toBe(true);
    expect(content.includes('safeMessage')).toBe(true);
    expect(content.includes('reasonCode')).toBe(true);
  });

  it('Routes do not import OpenAI', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('openai')).toBe(false);
  });

  it('Routes do not import Genkit', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('genkit')).toBe(false);
  });

  it('Routes do not import Pinecone', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('pinecone')).toBe(false);
  });

  it('Routes do not import Ollama', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('ollama')).toBe(false);
  });

  it('Routes do not import Anthropic', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('anthropic')).toBe(false);
  });

  it('Routes do not import Gemini', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('gemini')).toBe(false);
  });

  it('Routes do not import React', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('react')).toBe(false);
  });

  it('Routes do not import Next', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(/from ['"]next['"]/.test(content)).toBe(false);
    expect(/require\(['"]next['"]\)/.test(content)).toBe(false);
  });

  it('Routes do not import frontend modules', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('frontend')).toBe(false);
  });

  it('backend/src/routes/ai.ts has no exam-paper expansion', () => {
    if (fs.existsSync(aiRoutesPath)) {
      const content = fs.readFileSync(aiRoutesPath, 'utf-8');
      expect(content.includes('examPaper')).toBe(false);
      expect(content.includes('ExamPaper')).toBe(false);
      expect(content.includes('ExamVariant')).toBe(false);
      expect(content.includes('deliveryBridge')).toBe(false);
    }
  });

  it('Student preview route does not access answer keys (GET projection/student-preview)', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('answerKey')).toBe(false);
    expect(content.includes('correctAnswerSummary')).toBe(false);
  });

  it('Parent preview route does not access answer keys (GET projection/parent-preview)', () => {
    const content = fs.readFileSync(routesPath, 'utf-8');
    expect(content.includes('correctAnswerSummary')).toBe(false);
  });
});
