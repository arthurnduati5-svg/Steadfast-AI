import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 030 - No Private Data Leak Contract', () => {
  const baseDir = path.resolve(__dirname, '..');
  const serviceFiles = [
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
  ];

  it('should not contain raw student data strings in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\brawStudentData\b/);
    }
  });

  it('should not contain raw chat strings in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\brawChat\b/);
    }
  });

  it('should not contain raw message content in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\brawMessage\b/);
    }
  });

  it('should not contain chain of thought strings in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bchainOfThought\b/);
    }
  });

  it('should not contain parent phone or email patterns in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bparentPhone\b/);
      expect(content).not.toMatch(/\bparentEmail\b/);
    }
  });

  it('should not contain student phone or email patterns in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bstudentPhone\b/);
      expect(content).not.toMatch(/\bstudentEmail\b/);
    }
  });

  it('should not contain hiddenReasoning in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bhiddenReasoning\b/);
    }
  });

  it('should not contain modelAnswer in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bmodelAnswer\b/);
    }
  });

  it('should not contain rawNotificationPayload in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\brawNotificationPayload\b/);
    }
  });

  it('should not contain correctAnswer in service files', () => {
    for (const file of serviceFiles) {
      const content = fs.readFileSync(path.join(baseDir, file), 'utf8');
      expect(content).not.toMatch(/\bcorrectAnswer\b/);
    }
  });
});
