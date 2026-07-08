import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Answer Artifact Leak', () => {
  const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  it('FORBIDDEN_FIELDS must include answer and marking patterns', () => {
    expect(contractSource).toContain('answerKey');
    expect(contractSource).toContain('correctAnswer');
    expect(contractSource).toContain('modelAnswer');
    expect(contractSource).toContain('markingScheme');
    expect(contractSource).toContain('teacherOnlyContent');
  });

  it('no response interface must include answer key fields', () => {
    const interfaces = ['Task029LearnerOwnStatus', 'Task029OperationsDashboard', 'Task029HealthOperationsSummary'];
    for (const iface of interfaces) {
      const idx = contractSource.indexOf(`export interface ${iface}`);
      if (idx === -1) continue;
      const endIdx = contractSource.indexOf('export interface', idx + 10);
      const block = endIdx === -1 ? contractSource.slice(idx) : contractSource.slice(idx, endIdx);
      expect(block).not.toContain('answerKey');
      expect(block).not.toContain('correctAnswer');
    }
  });

  it('aggregator must not include answer artifacts', () => {
    const aggPath = path.resolve(__dirname, '../services/task029ExpansionOperationsAggregatorService.ts');
    const aggSource = fs.readFileSync(aggPath, 'utf8');
    expect(aggSource).not.toMatch(/answerKey|correctAnswer|modelAnswer|markingScheme/i);
  });

  it('learner own status must not expose answer data', () => {
    const learnerPath = path.resolve(__dirname, '../services/task029LearnerOwnStatusService.ts');
    const learnerSource = fs.readFileSync(learnerPath, 'utf8');
    expect(learnerSource).not.toMatch(/answerKey|correctAnswer|rawStudentAnswer|rawStudentWork/i);
  });

  it('health and status routes must not leak answer artifacts', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/answerKey|correctAnswer/i);
  });
});
