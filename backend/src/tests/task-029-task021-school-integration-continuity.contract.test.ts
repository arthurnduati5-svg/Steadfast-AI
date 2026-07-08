import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task021 school integration continuity', () => {
  it('Task021 contract file exists with school integration types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task021SchoolIntegrationContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('Task021ExternalIdentityProvider');
    expect(source).toContain('Task021RosterRecordStatus');
  });

  it('Task029 routes do not import Task021 services for write operations', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/task021/i);
    expect(routeSource).not.toMatch(/schoolIntegration/i);
  });

  it('Task029 uses school context verification consistent with Task021', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).toContain('schoolAuthMiddleware');
    expect(routeSource).toContain('verifiedSchoolIdentity');
  });

  it('Task021 contract exports identity mapping status types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task021SchoolIntegrationContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('Task021IdentityMappingStatus');
    expect(source).toContain('mapped');
    expect(source).toContain('cross_school_rejected');
  });
});
