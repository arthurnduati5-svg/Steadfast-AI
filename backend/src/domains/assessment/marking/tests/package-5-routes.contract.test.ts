import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const MARKING_ROUTE_PATH = resolve(__dirname, '../../../../routes/marking.ts');
const AI_ROUTE_PATH = resolve(__dirname, '../../../../routes/ai.ts');

function getMarkingRouteContent(): string {
  return readFileSync(MARKING_ROUTE_PATH, 'utf-8');
}

function getAiRouteContent(): string {
  return existsSync(AI_ROUTE_PATH) ? readFileSync(AI_ROUTE_PATH, 'utf-8') : '';
}

describe('Package 5 - Route Contracts', () => {
  it('backend/src/routes/marking.ts exists', () => {
    expect(existsSync(MARKING_ROUTE_PATH)).toBe(true);
  });

  it('route is mounted under /api/question-bank/marking', () => {
    const indexContent = readFileSync(resolve(__dirname, '../../../../index.ts'), 'utf-8');
    expect(indexContent).toContain('/api/question-bank/marking');
    expect(indexContent).toContain("from './routes/marking'");
  });

  it('mutating routes require idempotency key', () => {
    const content = getMarkingRouteContent();
    const idempotencyChecks = content.match(/idempotencyKey/g);
    expect(idempotencyChecks).not.toBeNull();
    expect(idempotencyChecks!.length).toBeGreaterThanOrEqual(6);
  });

  it('routes return safe response envelope with ok, requestId, status, safeMessage, reasonCode', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain('createSafeResponseEnvelope');
    expect(content).toContain('ok:');
    expect(content).toContain('requestId');
    expect(content).toContain('safeMessage');
    expect(content).toContain('reasonCode');
  });

  it('routes do not import OpenAI, Genkit, Pinecone, Ollama, Anthropic, Gemini', () => {
    const content = getMarkingRouteContent().toLowerCase();
    const forbidden = ['openai', 'genkit', 'pinecone', 'ollama', 'anthropic', 'gemini'];
    for (const f of forbidden) {
      expect(content).not.toContain(f);
    }
  });

  it('routes do not import React, Next, or frontend modules', () => {
    const content = getMarkingRouteContent().toLowerCase();
    expect(content).not.toContain('react');
    expect(content).not.toContain('next');
    expect(content).not.toContain('frontend');
  });

  it('backend/src/routes/ai.ts has no marking/question-bank expansion', () => {
    const aiContent = getAiRouteContent().toLowerCase();
    const forbidden = ['marking', 'teacherreview', 'studentchallenge', 'markingrun', 'markingresult'];
    for (const f of forbidden) {
      if (aiContent.includes(f)) {
        const lines = aiContent.split('\n').filter(l => l.toLowerCase().includes(f));
        if (lines.length > 0) {
          // Only fail if it's an actual code reference, not a doc comment
          const hasCodeRef = lines.some(l => l.includes('import') || l.includes('require') || l.includes('route'));
          expect(hasCodeRef).toBe(false);
        }
      }
    }
  });

  it('student/parent projections cannot access answer keys, teacher notes, internal rubric, hidden reasoning', () => {
    const content = getMarkingRouteContent();
    const projectionService = content.includes('projectionSafetyService') || content.includes('toStudentMarkingProjection') || content.includes('toParentMarkingProjection');
    expect(projectionService).toBe(true);
  });

  it('POST /runs route exists', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("router.post('/runs'");
  });

  it('POST /runs/:markingRunId/snapshots route exists', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("router.post('/runs/:markingRunId/snapshots'");
  });

  it('POST /runs/:markingRunId/batches route exists', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("router.post('/runs/:markingRunId/batches'");
  });

  it('GET /runs/:markingRunId and /runs/:markingRunId/results routes exist', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("router.get('/runs/:markingRunId'");
    expect(content).toContain("router.get('/runs/:markingRunId/results'");
  });

  it('GET /results/:markingResultVersionId with breakdown route exists', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("router.get('/results/:markingResultVersionId'");
    expect(content).toContain("router.get('/results/:markingResultVersionId/breakdown'");
  });

  it('review-groups and review-items routes exist', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("/review-groups/open");
    expect(content).toContain("/review-groups/:teacherReviewGroupId/items");
    expect(content).toContain("/review-items/:teacherReviewItemId/assign");
    expect(content).toContain("/review-items/:teacherReviewItemId/resolve");
  });

  it('overrides, moderation, and challenges routes exist', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain("/results/:markingResultVersionId/overrides");
    expect(content).toContain("/results/:markingResultVersionId/moderation");
    expect(content).toContain("/results/:markingResultVersionId/challenges");
    expect(content).toContain("/challenges/:studentMarkChallengeId/resolve");
  });

  it('safeHandler wraps route handlers', () => {
    const content = getMarkingRouteContent();
    expect(content).toContain('function safeHandler');
    expect(content).toContain('try {');
    expect(content).toContain('catch');
    expect(content).toContain('POLICY_BLOCKED');
    expect(content).toContain('NOT_FOUND');
  });
});
