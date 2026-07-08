import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Task 031 Canary Readiness Code', () => {
  const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
  const routeSource = fs.readFileSync(routePath, 'utf8');

  it('routes must not contain canary readiness endpoints', () => {
    expect(routeSource).not.toContain('canary_readiness');
    expect(routeSource).not.toContain('canaryReadiness');
    expect(routeSource).not.toContain('task031');
  });

  it('routes must not have canary activation endpoints', () => {
    expect(routeSource).not.toMatch(/\/canary/);
  });

  it('control action service must not implement canary readiness action', () => {
    const controlPath = path.resolve(__dirname, '../services/task029ControlActionService.ts');
    const controlSource = fs.readFileSync(controlPath, 'utf8');
    expect(controlSource).not.toContain('canary_readiness');
    expect(controlSource).not.toContain('canaryReadiness');
  });

  it('preflight must track actionIsCanary as forbidden but not implement it', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).toContain('actionIsCanary');
    expect(preflightSource).not.toContain('execute_canary');
  });

  it('contract must not have canary activation payload outside forbidden-output list', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    const forbiddenListIndex = contractSource.indexOf('TASK029_FORBIDDEN_FIELDS');
    const forbiddenOutputIndex = contractSource.indexOf('TASK029_FORBIDDEN_OUTPUT_PATTERNS');
    const needleIndex = contractSource.indexOf('canaryActivationPayload');
    if (needleIndex >= 0 && (needleIndex < forbiddenListIndex || needleIndex < forbiddenOutputIndex)) {
      throw new Error('canaryActivationPayload found outside forbidden-output list');
    }
    // OK if it only appears in the forbidden list declarations
  });
});
