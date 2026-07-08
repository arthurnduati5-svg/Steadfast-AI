import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Task 029 – No Hidden Reasoning Leak', () => {
  const contractPath = path.resolve(__dirname, '../contracts/task029ExpansionOperationsContracts.ts');
  const contractSource = fs.readFileSync(contractPath, 'utf8');

  it('FORBIDDEN_FIELDS must include hidden reasoning patterns', () => {
    expect(contractSource).toContain('chainOfThought');
    expect(contractSource).toContain('hiddenReasoning');
    expect(contractSource).toContain('scratchpad');
  });

  it('no response interface must expose chain of thought', () => {
    const interfaces = ['Task029LearnerOwnStatus', 'Task029OperationsDashboard', 'Task029HealthOperationsSummary'];
    for (const iface of interfaces) {
      const idx = contractSource.indexOf(`export interface ${iface}`);
      if (idx === -1) continue;
      const endIdx = contractSource.indexOf('export interface', idx + 10);
      const block = endIdx === -1 ? contractSource.slice(idx) : contractSource.slice(idx, endIdx);
      expect(block).not.toContain('chainOfThought');
      expect(block).not.toContain('hiddenReasoning');
    }
  });

  it('aggregator must not include hidden reasoning', () => {
    const aggPath = path.resolve(__dirname, '../services/task029ExpansionOperationsAggregatorService.ts');
    const aggSource = fs.readFileSync(aggPath, 'utf8');
    expect(aggSource).not.toMatch(/chainOfThought|hiddenReasoning|scratchpad/i);
  });

  it('route must not return provider prompts or responses', () => {
    const routePath = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const routeSource = fs.readFileSync(routePath, 'utf8');
    expect(routeSource).not.toMatch(/providerPrompt|providerResponse|rawProviderResponse/i);
  });

  it('learner own status must not leak hidden reasoning', () => {
    const learnerPath = path.resolve(__dirname, '../services/task029LearnerOwnStatusService.ts');
    const learnerSource = fs.readFileSync(learnerPath, 'utf8');
    expect(learnerSource).not.toMatch(/chainOfThought|hiddenReasoning|scratchpad/i);
  });
});
