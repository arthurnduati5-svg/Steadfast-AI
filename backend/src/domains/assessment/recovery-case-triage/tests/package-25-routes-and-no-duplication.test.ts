import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

describe('Package 25 - Routes and No Duplication', () => {
  const routePath = path.resolve(__dirname, '../../../../routes/recoveryCaseTriage.ts');
  const indexPath = path.resolve(__dirname, '../../../../index.ts');

  it('route file exists at backend/src/routes/recoveryCaseTriage.ts', () => {
    expect(fs.existsSync(routePath)).toBe(true);
  });

  it('route file has all 12 route groups', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const groups = [
      'GROUP 1: Triage Readiness',
      'GROUP 2: Priority Assessments',
      'GROUP 3: Fairness Checks',
      'GROUP 4: Capacity Snapshots',
      'GROUP 5: Queue Snapshots',
      'GROUP 6: Queue Items',
      'GROUP 7: Allocation Drafts',
      'GROUP 8: Escalation Drafts',
      'GROUP 9: Review Window Drafts',
      'GROUP 10: Queue Explanations',
      'GROUP 11: Duplicate Suppressions',
      'GROUP 12: Triage Summaries',
    ];
    for (const group of groups) {
      expect(content).toContain(group);
    }
  });

  it('route is mounted in backend/src/index.ts', () => {
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain("from './routes/recoveryCaseTriage'");
    expect(indexContent).toContain('recovery-case-triage');
  });

  it('route file does not contain forbidden route names', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const forbidden = ['/assign', '/dispatch', '/send', '/notify', '/publish', '/execute'];
    for (const route of forbidden) {
      const lines = content.split('\n').filter(l => l.includes("router.") && l.includes(route));
      expect(lines).toHaveLength(0);
    }
  });

  it('route file does not import from Package 24 service files', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const package24Imports = content.split('\n').filter(l =>
      l.includes('import') && l.includes('recovery-execution-readiness-board')
    );
    expect(package24Imports).toHaveLength(0);
  });

  it('route file does not import from TeacherIntervention service files', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const teacherInterventionImports = content.split('\n').filter(l =>
      l.includes('import') && (l.includes('teacherIntervention') || l.includes('teacher-intervention'))
    );
    expect(teacherInterventionImports).toHaveLength(0);
  });

  it('all POST routes require school context', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const postRoutes = content.split('\n').filter(l => l.includes("router.post("));
    for (const routeLine of postRoutes) {
      const handlerSection = content.split(routeLine)[1] || '';
      const handlerEnd = handlerSection.indexOf('});');
      const handler = handlerSection.substring(0, handlerEnd >= 0 ? handlerEnd + 2 : 50);
      const hasSchoolCheck = handler.includes("extractSchoolId(req)") || handler.includes("schoolId");
      expect(hasSchoolCheck).toBe(true);
    }
  });

  it('no AI scoring route exists', () => {
    const content = fs.readFileSync(routePath, 'utf-8');
    const forbiddenPatterns = ['/ai-scoring', '/ai-score', '/model-score', '/ai-priority', 'openai', 'anthropic', 'gemini'];
    for (const pattern of forbiddenPatterns) {
      expect(content).not.toContain(pattern);
    }
  });
});
