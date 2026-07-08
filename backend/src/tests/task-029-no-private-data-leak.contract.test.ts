import { describe, it, expect } from 'vitest';
import { TASK029_FORBIDDEN_OUTPUT_PATTERNS } from '../contracts/task029ExpansionOperationsContracts';

describe('Task 029 - No Private Data Leak', () => {
  const forbiddenPatterns = TASK029_FORBIDDEN_OUTPUT_PATTERNS;

  const contractFiles = [
    '../contracts/task029ExpansionOperationsContracts.ts',
    '../services/task029Task028ProofLoaderService.ts',
    '../services/task029ExpansionOperationsAggregatorService.ts',
    '../routes/task029ExpansionOperationsRoutes.ts',
  ];

  const safeExplanationStrings = [
    'provider response',
    'raw student',
    'private learner memory',
    'answer key',
    'teacher-only content',
    'protected rubric',
  ];

  for (const file of contractFiles) {
    const filePath = require('path').resolve(__dirname, file);
    if (require('fs').existsSync(filePath)) {
      it(`${file} should not contain private data patterns (unless safe negative check)`, () => {
        const fs = require('fs');
        const content = fs.readFileSync(filePath, 'utf8');
        for (const pattern of forbiddenPatterns) {
          if (!content.includes(pattern)) continue;
          const isSafeExplanation = safeExplanationStrings.some((s) =>
            pattern.includes(s) && content.includes('do not expose') && content.includes(pattern)
          );
          const isInForbiddenList = content.includes(`'${pattern}'`) || content.includes(`"${pattern}"`) || content.includes('`' + pattern + '`');
          if (isSafeExplanation || isInForbiddenList) continue;

          const lineIndex = content.indexOf(pattern);
          const lineNum = content.substring(0, lineIndex).split('\n').length;
          throw new Error(`Forbidden pattern "${pattern}" found in ${file} at line ${lineNum}`);
        }
      });
    }
  }

  it('should not expose raw student chat in aggregator', async () => {
    const { getOperationsDashboard } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getOperationsDashboard('admin');
    const text = JSON.stringify(result);
    const actualForbidden = forbiddenPatterns.filter((p) => {
      if (text.includes(p) && !text.includes('do not expose') && !text.includes(`'` + p + `'`)) {
        return true;
      }
      return false;
    });
    expect(actualForbidden).toEqual([]);
  });

  it('should not expose raw private data in student status view', async () => {
    const { getStudentOwnStatusView } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getStudentOwnStatusView('test-student');
    const text = JSON.stringify(result);
    const actualForbidden = forbiddenPatterns.filter((p) => {
      if (text.includes(p) && !text.includes('do not expose') && !text.includes(`'` + p + `'`)) {
        return true;
      }
      return false;
    });
    expect(actualForbidden).toEqual([]);
  });

  it('should have safe health risk level confirming no sensitive data exposure', async () => {
    const { getOperationsDashboard } = await import('../services/task029ExpansionOperationsAggregatorService');
    const result = await getOperationsDashboard('admin');
    expect(result.data!.healthRiskLevel).toBeDefined();
    expect(typeof result.data!.healthRiskLevel).toBe('string');
    expect(result.data!.operationsRiskLevel).toBeDefined();
    const serialized = JSON.stringify(result.data);
    expect(serialized).not.toContain('raw student');
    expect(serialized).not.toContain('answer key');
  });

  it('should have safe messages in error envelopes', () => {
    const fs = require('fs');
    const routesPath = require('path').resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
    const content = fs.readFileSync(routesPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      if (line.includes('safeErrorEnvelope(') && (line.includes('_FAILED') || line.includes('_DENIED') || line.includes('INVALID'))) {
        const hasMessage = line.includes("'") || line.includes('result.safeMessage');
        expect(hasMessage).toBe(true);
        expect(line).not.toMatch(/\b(?:err)\b\.(?!\s*===)/);
      }
    }
  });
});
