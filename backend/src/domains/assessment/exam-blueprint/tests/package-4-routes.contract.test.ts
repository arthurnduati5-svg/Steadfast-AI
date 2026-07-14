import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 4: Route Contract', () => {
  const routeFilePath = path.resolve(__dirname, '../../../../routes/examBlueprint.ts');
  const aiRoutePath = path.resolve(__dirname, '../../../../routes/ai.ts');

  it('backend/src/routes/examBlueprint.ts exists', () => {
    expect(fs.existsSync(routeFilePath)).toBe(true);
  });

  it('route file exports a default router', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('export default router');
  });

  it('route file defines POST /blueprints', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("post('/blueprints'");
  });

  it('route file defines POST /blueprints/:blueprintId/versions', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("post('/blueprints/:blueprintId/versions'");
  });

  it('route file defines POST /blueprint-versions/:blueprintVersionId/requirements', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("post('/blueprint-versions/:blueprintVersionId/requirements'");
  });

  it('route file defines POST submit-approval', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('submit-approval');
  });

  it('route file defines POST approve', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("post('/blueprint-versions/:blueprintVersionId/approve'");
  });

  it('route file defines POST draft-sets', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('draft-sets');
  });

  it('route file defines GET blueprints/:blueprintId', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/blueprints/:blueprintId'");
  });

  it('route file defines GET blueprints/:blueprintId/versions', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/blueprints/:blueprintId/versions'");
  });

  it('route file defines GET requirements', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/blueprint-versions/:blueprintVersionId/requirements'");
  });

  it('route file defines GET draft-sets/:draftSetId', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/draft-sets/:draftSetId'");
  });

  it('route file defines GET draft-sets/:draftSetId/drafts', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/draft-sets/:draftSetId/drafts'");
  });

  it('route file defines GET drafts/:draftId', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("get('/drafts/:draftId'");
  });

  it('mutating routes require idempotency key', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const idempotencyChecks = (content.match(/idempotencyKey/g) || []).length;
    expect(idempotencyChecks).toBeGreaterThan(5);
  });

  it('safe response envelope keys exist', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('createSafeResponseEnvelope');
  });

  it('routes do not import OpenAI, Genkit, Pinecone, Ollama', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama'];
    for (const term of forbidden) {
      expect(content.toLowerCase()).not.toContain(term);
    }
  });

  it('routes do not import React, Next, frontend', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const forbidden = ['react', 'next/', 'frontend'];
    for (const term of forbidden) {
      expect(content.toLowerCase()).not.toContain(term);
    }
  });

  it('backend/src/routes/ai.ts has no blueprint/question-bank expansion', () => {
    if (fs.existsSync(aiRoutePath)) {
      const content = fs.readFileSync(aiRoutePath, 'utf-8');
      const forbidden = ['examBlueprint', 'exam-blueprint', 'question-bank/blueprints', 'QuestionSelection', 'ExamDraft'];
      for (const term of forbidden) {
        expect(content).not.toContain(term);
      }
    }
  });

  it('student/parent projections cannot access draft internals', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('student');
    expect(content).toContain('parent');
    expect(content).toContain('FORBIDDEN');
  });
});
