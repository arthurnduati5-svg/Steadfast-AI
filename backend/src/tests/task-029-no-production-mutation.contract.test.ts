import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Production Data Mutation Code', () => {
  const task029Sources = [
    'routes/task029ExpansionOperationsRoutes.ts',
    'services/task029ExpansionOperationsAggregatorService.ts',
    'services/task029ControlActionService.ts',
    'services/task029RollbackCommandService.ts',
    'services/task029LearnerOwnStatusService.ts',
    'services/task029Task028ProofLoaderService.ts',
    'repositories/task029ExpansionOperationsRepository.ts',
  ];

  for (const file of task029Sources) {
    const fullPath = path.resolve(__dirname, '..', file);
    if (!fs.existsSync(fullPath)) continue;
    const source = fs.readFileSync(fullPath, 'utf8');

    it(`${file} must not directly mutate production database`, () => {
      expect(source).not.toMatch(/prisma\.[a-z]+\.(create|update|delete|upsert)/i);
      expect(source).not.toMatch(/db\.[a-z]+\.(create|update|delete|upsert)/i);
    });
  }

  it('contract must have productionDataMutationExecuted boolean', () => {
    const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
    const contractSource = fs.readFileSync(contractPath, 'utf8');
    expect(contractSource).toContain('productionDataMutationExecuted');
  });

  it('no task029 service should import prisma client directly', () => {
    const serviceFiles = fs.readdirSync(path.resolve(__dirname, '../services'))
      .filter(f => f.startsWith('task029') && f.endsWith('.ts'));
    for (const sf of serviceFiles) {
      const content = fs.readFileSync(path.resolve(__dirname, '../services', sf), 'utf8');
      expect(content).not.toMatch(/@prisma\/client/);
    }
  });
});
