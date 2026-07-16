import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { RecoveryCaseAdjudicationSafetyService } from '../services/recoveryCaseAdjudicationSafetyService';

const safetyServicePath = path.resolve(__dirname, '../services/recoveryCaseAdjudicationSafetyService.ts');
const routeFilePath = path.resolve(__dirname, '../../../../routes/recoveryCaseAdjudication.ts');

describe('Package 26 - No Live Action Safety', () => {
  const safety = new RecoveryCaseAdjudicationSafetyService();

  describe('RecoveryCaseAdjudicationSafetyService methods deny all roles', () => {
    const testCases = [
      ['checkNoLiveAssignment', 'no_live_assignment'],
      ['checkNoNotification', 'no_notification'],
      ['checkNoPriorityMutation', 'no_priority_mutation'],
      ['checkNoQueueMutation', 'no_queue_mutation'],
    ];

    for (const [methodName, expectedReasonCode] of testCases) {
      it(`${methodName} denies all roles`, () => {
        const result = (safety as any)[methodName]('school-1', 'actor-1', 'admin', 'corr-1');
        expect(result.allowed).toBe(false);
        expect(result.denied).toBe(true);
        expect(result.reasonCodes).toContain(expectedReasonCode);
      });
    }

    it('checkAllNoLiveActions returns denied for all', () => {
      const result = safety.checkAllNoLiveActions('school-1', 'actor-1', 'admin', 'corr-1');
      expect(result.allowed).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.reasonCodes.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Service file does not import forbidden libraries', () => {
    const forbidden = ['openai', 'anthropic', 'notification', 'calendar', 'portal'];
    const content = fs.readFileSync(safetyServicePath, 'utf-8');

    for (const lib of forbidden) {
      it(`does not import from ${lib}`, () => {
        const importLines = content.split('\n').filter(l => l.startsWith('import'));
        for (const line of importLines) {
          expect(line.toLowerCase()).not.toContain(lib);
        }
      });
    }

    it('only imports from contracts', () => {
      const importLines = content.split('\n').filter(l => l.startsWith('import'));
      for (const line of importLines) {
        expect(line).toMatch(/\.\.\/contracts/);
      }
    });
  });

  describe('Route file does not contain forbidden action words', () => {
    const forbiddenWords = ['assign', 'reassign', 'dispatch', 'send', 'notify', 'publish', 'execute', 'activate', 'sync', 'calendar', 'regrade'];
    const routeContent = fs.readFileSync(routeFilePath, 'utf-8');
    const routePaths = routeContent.match(/router\.(get|post|put|patch|delete)\(['"][^'"]+['"]/g) || [];

    for (const word of forbiddenWords) {
      it(`no route path contains "${word}"`, () => {
        for (const r of routePaths) {
          expect(r.toLowerCase()).not.toContain(word);
        }
      });
    }
  });
});
