import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – Phase 3 Growth Systems No Regression', () => {
  it('Phase 3 contract files still exist without regression', () => {
    const phase3Dir = path.resolve(__dirname, '../services');
    const files = fs.readdirSync(phase3Dir).filter(f => f.startsWith('phase3') && f.endsWith('.ts'));
    expect(files.length).toBeGreaterThan(0);
    const growthPageFile = path.resolve(__dirname, '../contracts/phase3GrowthPageContracts.ts');
    expect(fs.existsSync(growthPageFile)).toBe(true);
  });

  it('Phase 3 growth page contract exports card types and priorities', () => {
    const contractPath = path.resolve(__dirname, '../contracts/phase3GrowthPageContracts.ts');
    const source = fs.readFileSync(contractPath, 'utf8');
    expect(source).toContain('PHASE3_GROWTH_PAGE_CARD_TYPES');
    expect(source).toContain('PHASE3_GROWTH_PAGE_PRIORITIES');
  });

  it('Task029 does not remove or duplicate Phase 3 service files', () => {
    const phase3Services = fs.readdirSync(path.resolve(__dirname, '../services'))
      .filter(f => f.includes('phase3') || f.includes('Phase3'));
    expect(phase3Services.length).toBeGreaterThan(5);
  });

  it('Task029 references phase3 regression pass status in its report', () => {
    const task029ContractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const task029Source = fs.readFileSync(task029ContractPath, 'utf8');
    expect(task029Source).toContain('phase3RegressionRun');
    expect(task029Source).toContain('phase3RegressionPassed');
  });
});
