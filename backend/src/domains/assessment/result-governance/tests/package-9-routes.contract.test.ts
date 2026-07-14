import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 9 - Route Contract', () => {
  const routePath = path.resolve('backend/src/routes/resultGovernance.ts');
  const exists = fs.existsSync(routePath);

  it('should have route file backend/src/routes/resultGovernance.ts', () => {
    expect(exists).toBe(true);
  });

  if (exists) {
    const content = fs.readFileSync(routePath, 'utf-8');

    it('should be mounted under /api/question-bank/result-governance', () => {
      // Check that routes start with expected patterns
      expect(content).toContain("router.post('/finalization-reviews'");
      expect(content).toContain("router.get('/finalization-reviews");
    });

    it('should have POST routes for finalization-reviews', () => {
      expect(content).toContain("router.post('/finalization-reviews'");
    });

    it('should have GET routes for finalization-reviews', () => {
      expect(content).toContain("router.get('/finalization-reviews/:resultFinalizationReviewId'");
    });

    it('should have routes for decisions', () => {
      expect(content).toContain("/decisions/");
    });

    it('should have routes for release-readiness', () => {
      expect(content).toContain("/release-readiness/");
    });

    it('should have routes for boundaries', () => {
      expect(content).toContain("/boundaries/");
    });

    it('should have routes for regrade-requests', () => {
      expect(content).toContain("/regrade-requests");
    });

    it('should have routes for regrade-intakes', () => {
      expect(content).toContain("/regrade-intakes");
    });

    it('should have student-safe projection route', () => {
      expect(content).toContain('/projection/student-safe');
    });

    it('should have parent-boundary projection route', () => {
      expect(content).toContain('/projection/parent-boundary');
    });

    it('should have teacher projection route', () => {
      expect(content).toContain('/projection/teacher');
    });

    it('should have admin projection route', () => {
      expect(content).toContain('/projection/admin');
    });

    it('should have idempotency key requirement', () => {
      expect(content).toContain('idempotencyKey');
    });

    it('should have safe response envelope', () => {
      expect(content).toContain('SafeResponseEnvelope');
    });

    it('should not import OpenAI', () => {
      expect(content).not.toMatch(/openai/i);
    });

    it('should not import Genkit', () => {
      expect(content).not.toMatch(/genkit/i);
    });

    it('should not import Pinecone', () => {
      expect(content).not.toMatch(/pinecone/i);
    });

    it('should not import Ollama', () => {
      expect(content).not.toMatch(/ollama/i);
    });

    it('should not import Anthropic', () => {
      expect(content).not.toMatch(/anthropic/i);
    });

    it('should not import Gemini', () => {
      expect(content).not.toMatch(/gemini/i);
    });

    it('should not import React', () => {
      expect(content).not.toMatch(/react/i);
    });

    it('should not import Next.js', () => {
      expect(content).not.toMatch(/from ['"]next/);
    });

    it('should not import frontend modules', () => {
      expect(content).not.toMatch(/frontend/);
    });

    it('should not import OCR libraries', () => {
      expect(content).not.toMatch(/tesseract/i);
      expect(content).not.toMatch(/import.*ocr/i);
    });

    it('should not mutate mastery', () => {
      expect(content).not.toMatch(/mutateMastery/);
      expect(content).not.toMatch(/SkillMasterySnapshot/);
    });

    it('should not perform regrade execution', () => {
      expect(content).not.toMatch(/executeRegrade/);
      expect(content).not.toMatch(/performRegrade/);
    });

    it('should not send parent notifications', () => {
      expect(content).not.toMatch(/sendEmail/);
      expect(content).not.toMatch(/notifyParent/);
      expect(content).not.toMatch(/parentNotification/);
    });

    it('should not publish to parent portal', () => {
      expect(content).not.toMatch(/publishToParent/);
      expect(content).not.toMatch(/parentPortal/);
    });
  }

  it('should have route mounted in index.ts with schoolAuthMiddleware', () => {
    const indexPath = path.resolve('backend/src/index.ts');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain("import resultGovernanceRoutes from './routes/resultGovernance'");
    expect(indexContent).toContain('result-governance');
    expect(indexContent).toContain('schoolAuthMiddleware');
    expect(indexContent).toContain('requireVerifiedSchoolContext');
  });

  it('should not expand ai.ts with result-governance', () => {
    const aiPath = path.resolve('backend/src/routes/ai.ts');
    if (fs.existsSync(aiPath)) {
      const aiContent = fs.readFileSync(aiPath, 'utf-8');
      expect(aiContent).not.toMatch(/resultGovernance|result-governance|ResultGovernance|FinalizationReview|ReleaseReadiness|RegradeRequest/);
    }
  });
});
