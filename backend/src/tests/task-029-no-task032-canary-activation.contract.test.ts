import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Task 032 Canary Activation Code', () => {
  const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
  const routeSource = fs.readFileSync(routePath, 'utf8');

  it('routes must not contain canary activation endpoints', () => {
    expect(routeSource).not.toContain('canary_activation');
    expect(routeSource).not.toContain('canaryActivation');
    expect(routeSource).not.toContain('task032');
  });

  it('routes must not have canary execution endpoints', () => {
    expect(routeSource).not.toMatch(/\/canary/);
    expect(routeSource).not.toContain('execute_canary');
  });

  it('control action service must not implement canary activation action', () => {
    const controlPath = path.resolve(__dirname, '../services/task029ControlActionService.ts');
    const controlSource = fs.readFileSync(controlPath, 'utf8');
    expect(controlSource).not.toContain('canary_activation');
    expect(controlSource).not.toContain('canaryActivation');
  });

  it('preflight must block canary activation as not allowed in task029', () => {
    const preflightPath = path.resolve(__dirname, '../services/task029ControlActionPreflightService.ts');
    const preflightSource = fs.readFileSync(preflightPath, 'utf8');
    expect(preflightSource).not.toContain('canaryActivationPayload');
    expect(preflightSource).not.toContain('execute_canary_activation');
  });

  it('contract must not reference canary activation in active code', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).not.toContain('canaryActivationPayload');
  });
});
