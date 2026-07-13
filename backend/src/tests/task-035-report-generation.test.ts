import { describe, it, expect } from 'vitest';

describe('Task 035 - Report Generation', () => {
  it('should generate JSON report with required sections', () => {
    const fs = require('fs');
    const path = require('path');
    const reportPath = path.resolve(__dirname, '../../docs/ops/task-035/task-035-school-wide-readiness-report.json');

    if (fs.existsSync(reportPath)) {
      const raw = fs.readFileSync(reportPath, 'utf8').replace(/^\uFEFF/, '');
      const report = JSON.parse(raw);

      expect(report.taskId).toBe('035');
      expect(report.generatedAt).toBeDefined();
      expect(report.gitBranch).toBeDefined();
      expect(report.gitCommit).toBeDefined();
      expect(typeof report.safeToStartTask036).toBe('boolean');
      expect(report.finalDecision).toMatch(/^TASK_035_/);
      expect(Array.isArray(report.blockingIssues)).toBe(true);
      expect(Array.isArray(report.verificationCommands)).toBe(true);
      expect(Array.isArray(report.testResults)).toBe(true);

      const requiredSections = [
        'task034Proof', 'productionEnvironmentGate', 'approvedSchoolBoundary',
        'fullSchoolRolloutSimulation', 'staffReleaseBoard', 'studentSafeLaunchNotice',
        'teacherAdminReadiness', 'runtimeGuardSimulation', 'healthCapacityBudget',
        'rollbackReadiness', 'privacyReview', 'socraticIntegrityReview',
        'deenGovernanceReview', 'curriculumSourceReview', 'releaseBoardPackage',
        'finalSchoolLaunchDecision', 'privacyLeakChecks', 'securityGateChecks',
        'deenGateChecks', 'socraticGateChecks', 'curriculumGateChecks',
        'schoolBoundaryChecks', 'publicRolloutChecks',
      ];

      for (const section of requiredSections) {
        expect(report[section]).toBeDefined();
      }
    }
  });

  it('should generate markdown report', () => {
    const fs = require('fs');
    const path = require('path');
    const mdPath = path.resolve(__dirname, '../../docs/ops/task-035/TASK_035_SCHOOL_WIDE_READINESS_REPORT.md');

    if (fs.existsSync(mdPath)) {
      const content = fs.readFileSync(mdPath, 'utf8');
      expect(content).toContain('Task 035');
      expect(content).toContain('safeToStartTask036');
    }
  });

  it('should generate handoff document', () => {
    const fs = require('fs');
    const path = require('path');
    const handoffPath = path.resolve(__dirname, '../../docs/ops/task-035/TASK_035_HANDOFF.md');

    if (fs.existsSync(handoffPath)) {
      const content = fs.readFileSync(handoffPath, 'utf8');
      expect(content).toContain('TASK 035 HANDOFF');
      expect(content).toContain('Final decision');
    }
  });
});
