import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const routesDir = path.resolve(__dirname, '../../../../routes');
const indexFile = path.resolve(__dirname, '../../../../index.ts');
const routeFilePath = path.join(routesDir, 'recoveryOutcome.ts');
const repoFilePath = path.resolve(__dirname, '../repositories/inMemoryRecoveryOutcomeRepositories.ts');
const prismaSchemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');

describe('Package 19 — Routes and No Duplication', () => {
  it('route file exists at backend/src/routes/recoveryOutcome.ts', () => {
    expect(fs.existsSync(routeFilePath)).toBe(true);
  });

  it('index.ts has import for recoveryOutcomeRoutes', () => {
    const content = fs.readFileSync(indexFile, 'utf-8');
    expect(content).toContain("import recoveryOutcomeRoutes from './routes/recoveryOutcome'");
  });

  it('index.ts mounts recoveryOutcomeRoutes at /api/question-bank/recovery-outcome', () => {
    const content = fs.readFileSync(indexFile, 'utf-8');
    expect(content).toContain("recoveryOutcomeRoutes");
    expect(content).toContain("'/api/question-bank/recovery-outcome'");
  });

  it('route file contains all expected route groups', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const expectedGroups = [
      'decision-readiness',
      'exit-criteria',
      'exit-criteria-evaluations',
      'continuation-drafts',
      'intensification-drafts',
      'pause-drafts',
      'closure-drafts',
      'teacher-review-packets',
      'student-next-step-drafts',
      'parent-update-drafts',
      'summaries',
    ];
    for (const group of expectedGroups) {
      expect(content).toContain(group);
    }
  });

  it('each route group has POST create route definition', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const postRoutes = ['/decision-readiness', '/exit-criteria', '/exit-criteria-evaluations', '/continuation-drafts', '/intensification-drafts', '/pause-drafts', '/closure-drafts', '/teacher-review-packets', '/student-next-step-drafts', '/parent-update-drafts', '/summaries'];
    for (const route of postRoutes) {
      expect(content).toContain(`router.post('${route}'`);
    }
  });

  it('each route group has GET list route definition', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    const getRoutes = ['/decision-readiness', '/exit-criteria', '/exit-criteria-evaluations', '/continuation-drafts', '/intensification-drafts', '/pause-drafts', '/closure-drafts', '/teacher-review-packets', '/student-next-step-drafts', '/parent-update-drafts', '/summaries'];
    for (const route of getRoutes) {
      expect(content).toContain(`router.get('${route}'`);
    }
  });

  it('in-memory repo file does not import from recovery-progress', () => {
    const content = fs.readFileSync(repoFilePath, 'utf-8');
    const importLines = content.split('\n').filter(l => l.trim().startsWith('import '));
    expect(content).not.toContain('recovery-progress');
    for (const line of importLines) {
      expect(line).not.toMatch(/recoveryProgress/);
    }
  });

  it('route file does not import from recoveryProgress or recovery-progress', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).not.toContain('recoveryProgress');
    expect(content).not.toContain('recovery-progress');
  });

  it('route file does not import AI or notification services', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('notification');
    expect(content).not.toContain('emailService');
    expect(content).not.toContain('smsService');
  });

  it('route file does not import frontend services', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).not.toContain('react');
    expect(content).not.toContain('frontend');
    expect(content).not.toContain('render');
  });

  it('in-memory repo file uses only Package 19 contracts', () => {
    const content = fs.readFileSync(repoFilePath, 'utf-8');
    expect(content).toContain('recoveryOutcomeDecisionReadinessContracts');
    expect(content).toContain('recoveryExitCriteriaContracts');
    expect(content).toContain('recoveryDecisionDraftContracts');
    expect(content).toContain('recoveryOutcomeTeacherReviewPacketContracts');
    expect(content).toContain('recoveryOutcomeStudentNextStepDraftContracts');
    expect(content).toContain('recoveryOutcomeParentUpdateDraftContracts');
    expect(content).toContain('recoveryOutcomeSummaryContracts');
  });

  it('prisma schema has no forbidden Package 18 model name duplication in Package 19', () => {
    const content = fs.readFileSync(prismaSchemaPath, 'utf-8');
    const p19Models = ['recoveryOutcomeDecisionReadiness', 'recoveryExitCriteria', 'recoveryExitCriteriaEvaluation',
      'recoveryContinuationDecisionDraft', 'recoveryIntensificationDecisionDraft',
      'recoveryPauseDecisionDraft', 'recoveryClosureDecisionDraft',
      'recoveryOutcomeTeacherReviewPacket', 'recoveryOutcomeStudentNextStepDraft',
      'recoveryOutcomeParentUpdateDraft', 'recoveryOutcomeDecisionSummary',
      'recoveryOutcomeAuditEvent', 'recoveryOutcomeIdempotencyEntry'];
    for (const model of p19Models) {
      expect(content).not.toContain(`model ${model}`);
    }
  });

  it('route file exports default router', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain('export default router');
  });

  it('route file has all status transition endpoints for closure-drafts', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("'/closure-drafts/:id/review-ready'");
    expect(content).toContain("'/closure-drafts/:id/approve-future-use'");
    expect(content).toContain("'/closure-drafts/:id/suppress'");
    expect(content).toContain("'/closure-drafts/:id/block'");
    expect(content).toContain("'/closure-drafts/:id/void'");
  });

  it('route file has summary status transition endpoints', () => {
    const content = fs.readFileSync(routeFilePath, 'utf-8');
    expect(content).toContain("'/summaries/:id/refresh'");
    expect(content).toContain("'/summaries/:id/mark-stale'");
  });
});
