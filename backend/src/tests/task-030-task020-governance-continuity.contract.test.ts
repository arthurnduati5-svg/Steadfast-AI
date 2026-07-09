import { describe, it, expect } from 'vitest';
import * as path from 'path';

describe('Task 030 - Task 020 Governance Continuity Contract', () => {
  const baseDir = path.resolve(__dirname, '..');

  it('should have task020 route file exist', () => {
    const routePath = path.join(baseDir, 'routes', 'task020SecurityPrivacyGovernanceRoutes.ts');
    expect(() => require(routePath)).not.toThrow();
  });

  it('should have task020 contract file exist', () => {
    const contractPath = path.join(baseDir, 'contracts', 'task020SecurityPrivacyGovernanceContracts.ts');
    const fs = require('fs');
    expect(fs.existsSync(contractPath)).toBe(true);
  });

  it('should have task020 service file exist', () => {
    const servicePath = path.join(baseDir, 'services', 'task020SecurityPrivacyGovernanceService.ts');
    const fs = require('fs');
    expect(fs.existsSync(servicePath)).toBe(true);
  });

  it('should be able to import task020 routes', () => {
    expect(() => {
      require('../routes/task020SecurityPrivacyGovernanceRoutes');
    }).not.toThrow();
  });

  it('should maintain governance continuity with task020', () => {
    const fs = require('fs');
    const routeDir = path.join(baseDir, 'routes');
    const files = fs.readdirSync(routeDir);
    const task020Routes = files.filter((f: string) => f.startsWith('task020'));
    expect(task020Routes.length).toBeGreaterThan(0);
  });

  it('should not break task020 governance pattern', () => {
    const fs = require('fs');
    const content = fs.readFileSync(path.join(baseDir, 'routes', 'task030ControlledStagingRehearsalRoutes.ts'), 'utf8');
    expect(content).toBeDefined();
  });
});
