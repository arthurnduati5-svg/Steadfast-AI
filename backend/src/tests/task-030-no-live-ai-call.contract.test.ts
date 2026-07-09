import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Live AI Call Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should not import openai in task030 source files', () => {
    const files = [
      'services/task030ControlledStagingRehearsalService.ts',
      'services/task030Task029ProofLoaderService.ts',
      'services/task030StagingEnvironmentGateService.ts',
      'services/task030SyntheticSchoolFixtureService.ts',
      'services/task030RoleTokenMatrixService.ts',
      'services/task030StagingPreflightService.ts',
      'services/task030RehearsalRunService.ts',
      'services/task030AdminOperatorJourneyService.ts',
      'services/task030TeacherJourneyService.ts',
      'services/task030StudentJourneyService.ts',
      'services/task030UnknownRoleDenialService.ts',
      'services/task030OperationsConsoleRehearsalService.ts',
      'services/task030ControlActionRehearsalService.ts',
      'services/task030RollbackDrillService.ts',
      'services/task030StaffTrainingPackService.ts',
      'services/task030RehearsalEvidenceLedgerService.ts',
      'services/task030ControlledStagingDiagnosticsService.ts',
      'services/task030ControlledStagingReportService.ts',
      'routes/task030ControlledStagingRehearsalRoutes.ts',
    ];
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toContain('openai');
    }
  });

  it('should not import anthropic in task030 source files', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('anthropic');
    }
  });

  it('should not use provider.generate in task030 source files', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('provider.generate');
    }
  });

  it('should not contain generateContent in task030 source files', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('generateContent');
    }
  });

  it('should not contain chat.completions in task030 source files', () => {
    const files = fs.readdirSync(path.join(baseDir, 'services')).filter(f => f.startsWith('task030'));
    for (const file of files) {
      const content = fs.readFileSync(path.join(baseDir, 'services', file), 'utf8');
      expect(content).not.toContain('chat.completions');
    }
  });

  it('should not directly call AI provider from task030 routes', () => {
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).not.toContain('openai');
    expect(content).not.toContain('anthropic');
    expect(content).not.toContain('gemini');
  });
});
