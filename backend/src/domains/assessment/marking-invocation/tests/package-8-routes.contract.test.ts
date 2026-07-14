import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 8 Route Contracts', () => {
  const routePath = path.resolve(__dirname, '../../../../routes/markingInvocation.ts');

  it('backend/src/routes/markingInvocation.ts exists', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route is mounted under /api/question-bank/marking-invocation', () => {
    const indexPath = path.resolve(__dirname, '../../../../index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('marking-invocation');
    expect(content).toContain('markingInvocationRoutes');
  });

  it('mount uses schoolAuthMiddleware', () => {
    const indexPath = path.resolve(__dirname, '../../../../index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('schoolAuthMiddleware');
  });

  it('mount uses requireVerifiedSchoolContext', () => {
    const indexPath = path.resolve(__dirname, '../../../../index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('requireVerifiedSchoolContext');
  });

  it('route file contains POST /requests', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("router.post('/requests'");
  });

  it('route file contains GET /requests', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain("router.get('/requests'");
  });

  it('route file contains POST /requests/:id/intake-snapshots', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/intake-snapshots');
  });

  it('route file contains POST /requests/:id/readiness-checks', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/readiness-checks');
  });

  it('route file contains POST /requests/:id/batches', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/batches');
  });

  it('route file contains POST /batches/:id/execute-deterministic', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/execute-deterministic');
  });

  it('route file contains POST /batch-items/:id/dispatch-teacher-review', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/dispatch-teacher-review');
  });

  it('route file contains /projection/student-safe', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/projection/student-safe');
  });

  it('route file contains /projection/teacher', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/projection/teacher');
  });

  it('route file contains /projection/admin', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('/projection/admin');
  });

  it('routes do not import OpenAI', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('OpenAI');
  });

  it('routes do not import Genkit', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('genkit');
    expect(content).not.toContain('Genkit');
  });

  it('routes do not import frontend modules', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('react');
    expect(content).not.toMatch(/from ['"]next['"]/);
  });

  it('routes do not import OCR libraries', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('tesseract');
    expect(content).not.toContain('ocr');
  });

  it('backend/src/routes/ai.ts has no marking-invocation expansion', () => {
    const aiPath = path.resolve(__dirname, '../../../../routes/ai.ts');
    if (fs.existsSync(aiPath)) {
      const content = fs.readFileSync(aiPath, 'utf-8');
      expect(content).not.toContain('markingInvocation');
      expect(content).not.toContain('marking-invocation');
    }
  });

  it('no route finalizes result', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('finalize');
  });

  it('no route parent-releases result', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('parentRelease');
    expect(content).not.toContain('parent_release');
  });

  it('no route mutates mastery', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).not.toContain('mutateMastery');
    expect(content).not.toContain('SkillMasterySnapshot');
  });
});
