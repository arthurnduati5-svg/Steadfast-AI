import { describe, it, expect } from 'vitest';

describe('Task 029 - Control Actions Call Task 028 Services', () => {
  it('pause endpoint imports from Task 028 intervention service', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("from '../services/task028ExpansionInterventionService'");
    expect(content).toContain('pauseExpansion');
  });

  it('resume endpoint imports from Task 028 intervention service', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('resumeExpansion');
  });

  it('kill switch endpoints import from Task 028 intervention service', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('enableKillSwitch');
    expect(content).toContain('disableKillSwitch');
  });

  it('rollback endpoint imports from Task 028 rollback service', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("from '../services/task028ExpansionRollbackExecutionService'");
    expect(content).toContain('executeRollback');
  });

  it('completion review endpoint imports from Task 028 completion service', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("from '../services/task028ExpansionCompletionReviewService'");
    expect(content).toContain('generateCompletionReview');
  });

  it('should use Task 028 repository for data access', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("task028ExpansionExecutionRepository");
  });

  it('should not directly mutate backend state without Task 028 services', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).not.toContain("prisma.executionRun");
    expect(content).not.toContain("prisma.executionStage");
  });
});
