import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Live School Connector Write Code', () => {
  const task029Files = [
    'routes/task029ExpansionOperationsRoutes.ts',
    'services/task029ExpansionOperationsAggregatorService.ts',
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

    it(`${file} must not call school connector write operations`, () => {
      expect(source).not.toMatch(/schoolConnector/i);
      expect(source).not.toMatch(/schoolIntegration\.(write|send|push|sync)/i);
    });
  }

  it('must not import school integration service for writes', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/schoolIntegration/i);
  });

  it('must not import task021 school services for writing', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/task021/i);
  });
});
