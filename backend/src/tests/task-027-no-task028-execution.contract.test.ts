import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const SERVICES_DIR = resolve(__dirname, '../services');
const ROUTES_DIR = resolve(__dirname, '../routes');

function getTask027ServiceFiles(): string[] {
  return readdirSync(SERVICES_DIR)
    .filter(f => f.startsWith('task027') && f.endsWith('.ts'))
    .map(f => resolve(SERVICES_DIR, f));
}

function getTask027RouteFiles(): string[] {
  return readdirSync(ROUTES_DIR)
    .filter(f => f.startsWith('task027') && f.endsWith('.ts'))
    .map(f => resolve(ROUTES_DIR, f));
}

describe('task027NoTask028ExecutionContract', () => {
  it('no service file imports a task028 module', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const importLines = lines.filter(l =>
        l.includes('from') && l.includes('task028')
      );
      expect(importLines.length).toBe(0);
    }
  });

  it('task028 references in service files are only safeToStartTask028 or approved_for_task028', () => {
    const decisionPath = resolve(SERVICES_DIR, 'task027GovernanceDecisionService.ts');
    const content = readFileSync(decisionPath, 'utf-8');
    const lines = content.split('\n');
    const task028Lines = lines.filter(l => l.includes('task028'));
    for (const line of task028Lines) {
      const hasSafeProperty = line.includes('safeToStartTask028');
      const hasDecisionValue = line.includes('approved_for_task028');
      const isTypeAnnotation = line.includes('Task028');
      expect(
        hasSafeProperty || hasDecisionValue || isTypeAnnotation
      ).toBe(true);
    }
  });

  it('route files contain no expansion execution endpoints', () => {
    const routeFiles = getTask027RouteFiles();
    for (const filePath of routeFiles) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/router\.(post|get|put|delete)\(.*\/execute/);
      expect(content).not.toMatch(/router\.(post|get|put|delete)\(.*\/activate/);
    }
  });

  it('decision service sets safeToStartTask028 but has no execution logic', () => {
    const decisionPath = resolve(SERVICES_DIR, 'task027GovernanceDecisionService.ts');
    const content = readFileSync(decisionPath, 'utf-8');
    expect(content).toContain('safeToStartTask028');
    expect(content).not.toContain('executeTask028');
    expect(content).not.toContain('activateExpansion');
    expect(content).not.toContain('startTask028');
    expect(content).not.toContain('runTask028');
  });

  it('no service file exports a function named executeTask028 or activateExpansion', () => {
    const files = getTask027ServiceFiles();
    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content).not.toMatch(/export\s+(async\s+)?function\s+executeTask028/);
      expect(content).not.toMatch(/export\s+(async\s+)?function\s+activateExpansion/);
      expect(content).not.toMatch(/export\s+(async\s+)?function\s+startTask028/);
    }
  });
});
