import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 24 - Routes and No-Duplication', () => {
  it('route file exists at src/routes/recoveryExecutionReadinessBoard.ts', () => {
    const routePath = path.resolve(__dirname, '../../../../routes/recoveryExecutionReadinessBoard.ts');
    const exists = fs.existsSync(routePath);
    expect(exists).toBe(true);
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('router');
    expect(content).toContain('express');
  });

  it('route is mounted in index.ts with /api/question-bank/recovery-execution-readiness-board', () => {
    const indexPath = path.resolve(__dirname, '../../../../index.ts');
    const content = fs.readFileSync(indexPath, 'utf-8');
    expect(content).toContain('recovery-execution-readiness-board');
  });

  it('does not duplicate Package 23 authorization-preview logic (no imports from Package 23)', () => {
    const servicesDir = path.resolve(__dirname, '../../../../domains/assessment/recovery-execution-readiness-board/services');
    if (fs.existsSync(servicesDir)) {
      for (const file of fs.readdirSync(servicesDir)) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
        const importLines = content.split('\n').filter(l => l.trim().startsWith('import'));
        for (const line of importLines) {
          expect(line).not.toMatch(/recovery-execution-authorization-preview/);
        }
      }
    }
  });

  it('does not duplicate Package 22 lifecycle-closure code (only references by field name)', () => {
    const servicesDir = path.resolve(__dirname, '../../../../domains/assessment/recovery-execution-readiness-board/services');
    if (fs.existsSync(servicesDir)) {
      for (const file of fs.readdirSync(servicesDir)) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
        expect(content).not.toContain('RecoveryLifecycleClosure');
      }
    }
  });

  it('does not duplicate Package 21 simulation code (only references by field name)', () => {
    const servicesDir = path.resolve(__dirname, '../../../../domains/assessment/recovery-execution-readiness-board/services');
    if (fs.existsSync(servicesDir)) {
      for (const file of fs.readdirSync(servicesDir)) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
        expect(content).not.toContain('RecoveryOutcomeExecutionSimulationRunId');
      }
    }
  });

  it('does not duplicate Package 20 action-preparation, Pkg 19, Pkg 18, Pkg 17 logic', () => {
    const servicesDir = path.resolve(__dirname, '../../../../domains/assessment/recovery-execution-readiness-board/services');
    if (fs.existsSync(servicesDir)) {
      for (const file of fs.readdirSync(servicesDir)) {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
        expect(content).not.toContain('RecoveryOutcomeActionBundle');
        expect(content).not.toContain('RecoveryOutcomeDecisionSummary');
        expect(content).not.toContain('RecoveryProgressObservation');
      }
    }
  });
});
