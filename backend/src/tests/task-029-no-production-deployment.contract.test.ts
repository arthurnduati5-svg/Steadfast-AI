import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Production Deployment Code', () => {
  it('routes must not contain deployment commands', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/kubectl/i);
    expect(routeSource).not.toMatch(/prisma migrate deploy/i);
    expect(routeSource).not.toMatch(/docker/i);
  });

  it('contract must report productionDeploymentIntroduced as boolean', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('productionDeploymentIntroduced');
  });

  it('no service file must import deployment tools', () => {
    const serviceDir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(serviceDir).filter(f => f.startsWith('task029') && f.endsWith('.ts'));
    for (const f of files) {
      const source = fs.readFileSync(path.resolve(serviceDir, f), 'utf8');
      expect(source).not.toMatch(/from ['"]child_process['"]/);
      expect(source).not.toMatch(/exec\(|execSync\(/);
    }
  });

  it('repository must not contain production deployment logic', () => {
    const repoPath = path.resolve(__dirname, '../repositories/task029ExpansionOperationsRepository.ts');
    const repoSource = fs.readFileSync(repoPath, 'utf8');
    expect(repoSource).not.toContain('productionDeploymentCommand');
    expect(repoSource).not.toContain('productionRollbackCommand');
  });
});
