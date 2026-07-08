import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task029 preserves Task023 deployment readiness continuity', () => {
  it('Task023 contract file exists with deployment readiness types', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task023DeploymentReadinessContracts.ts');
    expect(fs.existsSync(contractPath)).toBe(true);
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('DeploymentReadinessStatus');
    expect(source).toContain('DeploymentEnvironment');
  });

  it('Task023 exports environment types including production and staging', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task023DeploymentReadinessContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('production');
    expect(source).toContain('staging');
  });

  it('Task023 exports FORBIDDEN_REPORT_FIELDS consistent with Task029 FORBIDDEN_FIELDS', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task023DeploymentReadinessContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('rawStudentData');
    expect(source).toContain('privateDeenText');
  });

  it('Task029 does not duplicate deployment command logic already in Task023', () => {
    const task029RoutePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(task029RoutePath, 'utf8');
    expect(routeSource).not.toMatch(/prisma migrate deploy/i);
  });
});
