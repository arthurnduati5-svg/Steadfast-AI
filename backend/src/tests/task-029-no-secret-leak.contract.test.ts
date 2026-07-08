import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Hardcoded Secrets', () => {
  const task029Files = [
    'routes/task029ExpansionOperationsRoutes.ts',
    'contracts/task029ExpansionOperationsContracts.ts',
    'services/task029ExpansionOperationsAggregatorService.ts',
    'services/task029ControlActionPreflightService.ts',
    'services/task029ControlActionService.ts',
    'services/task029RollbackCommandService.ts',
    'services/task029LearnerOwnStatusService.ts',
    'services/task029Task028ProofLoaderService.ts',
    'repositories/task029ExpansionOperationsRepository.ts',
  ];

  for (const file of task029Files) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');

    it(`${file} must not hardcode API keys`, () => {
      expect(source).not.toMatch(/sk-[A-Za-z0-9]{20,}/);
      expect(source).not.toMatch(/apiKey\s*[:=]\s*['"][A-Za-z0-9]{10,}['"]/);
    });

    it(`${file} must not hardcode JWT secrets`, () => {
      expect(source).not.toMatch(/jwtSecret\s*[:=]\s*['"][A-Za-z0-9]{10,}['"]/i);
      expect(source).not.toMatch(/JWT_SECRET\s*[:=]/);
    });
  }

  it('contract FORBIDDEN_FIELDS must include secrets patterns', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('rawSsoToken');
    expect(contractSource).toContain('apiKey');
    expect(contractSource).toContain('privateKey');
    expect(contractSource).toContain('DATABASE_URL');
    expect(contractSource).toContain('REDIS_URL');
  });

  it('route must read secrets from env, not hardcode them', () => {
    const authPath = path.resolve(__dirname, '../middleware/schoolAuthMiddleware.ts');
    const authSource = fs.readFileSync(authPath, 'utf8');
    expect(authSource).toContain('process.env.JWT_SECRET');
    expect(authSource).toContain('process.env.COPILOT_JWT_SECRET');
    expect(authSource).not.toMatch(/JWT_SECRET\s*[:=]\s*['"]/);
  });
});
