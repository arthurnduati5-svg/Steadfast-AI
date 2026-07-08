import { describe, it, expect } from 'vitest';

describe('Task 029 - No School Auth Bypass (Contract)', () => {
  it('all Task 029 routes should use schoolAuthMiddleware', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("schoolAuthMiddleware");
  });

  it('all Task 029 routes should use requireRole guards', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).toContain("requireRole");
    expect(content).toContain("adminGuard");
    expect(content).toContain("studentGuard");
  });

  it('routes file should not skip auth for any route', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');

    const lines = content.split('\n');
    const routeLines = lines.filter(l => l.includes('router.') && l.includes('/pilot/expansion/operations/'));
    for (const route of routeLines) {
      expect(route).toMatch(/adminGuard|studentGuard/);
    }
  });

  it('mount in index.ts should require schoolAuthMiddleware', () => {
    const fs = require('fs');
    const indexPath = require('path').resolve(__dirname, '../index.ts');
    const content = fs.readFileSync(indexPath, 'utf8');
    expect(content).toContain("app.use('/api', schoolAuthMiddleware, task029ExpansionOperationsRoutes)");
  });

  it('should not expose authorization headers in safe error envelopes', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    expect(content).not.toContain("req.headers.authorization");
    expect(content).not.toContain("Bearer");
  });
});
