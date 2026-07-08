import { describe, it, expect } from 'vitest';

describe('Task 029 - Routes Admin Scope (Contract)', () => {
  it('should have expansion operations routes registered in index.ts', () => {
    const fs = require('fs');
    const indexPath = require('path').resolve(__dirname, '../index.ts');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain('task029ExpansionOperationsRoutes');
    expect(content).toContain('Expansion Operations Console Routes');
  });

  it('should mount routes with schoolAuthMiddleware', () => {
    const fs = require('fs');
    const indexPath = require('path').resolve(__dirname, '../index.ts');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain("app.use('/api', schoolAuthMiddleware, task029ExpansionOperationsRoutes)");
  });

  it('should have dashboard endpoint defined with admin guard', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('/pilot/expansion/operations/dashboard');
    expect(content).toContain('adminGuard');
  });

  it('should have status endpoint defined', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('/pilot/expansion/operations/status');
  });

  it('should have all required control endpoints', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('/pilot/expansion/operations/pause');
    expect(content).toContain('/pilot/expansion/operations/resume');
    expect(content).toContain('/pilot/expansion/operations/kill-switch/enable');
    expect(content).toContain('/pilot/expansion/operations/kill-switch/disable');
    expect(content).toContain('/pilot/expansion/operations/rollback');
    expect(content).toContain('/pilot/expansion/operations/completion-review/generate');
    expect(content).toContain('/pilot/expansion/operations/student/own-status');
  });

  it('should use safe error envelopes', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain('safeErrorEnvelope');
  });

  it('should call Task 028 services for control actions', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("from '../services/task028ExpansionInterventionService'");
    expect(content).toContain("from '../services/task028ExpansionRollbackExecutionService'");
    expect(content).toContain("from '../services/task028ExpansionCompletionReviewService'");
  });
});
