import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkTask025Dependency,
  _setTestMode,
  _resetDependencyCache,
} from '../services/task027Task025ReadinessDependencyService';

beforeEach(() => {
  _resetDependencyCache();
});

describe('task027Task025ReadinessDependencyService', () => {
  describe('checkTask025Dependency pass scenario', () => {
    it('returns ok:true when in pass test mode', async () => {
      _setTestMode(true, true, true);
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(true);
      expect(result.blockingIssues).toEqual([]);
      expect(result.safeMessage).toContain('verified');
    });
  });

  describe('checkTask025Dependency fail scenario', () => {
    it('returns blocking issues when readiness not accepted', async () => {
      _setTestMode(false, true, true);
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThan(0);
      expect(result.blockingIssues.some((i: string) => i.includes('readiness not accepted'))).toBe(true);
    });

    it('returns blocking issues when safeToStartTask026 is false', async () => {
      _setTestMode(true, false, true);
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.some((i: string) => i.includes('safeToStartTask026'))).toBe(true);
    });

    it('returns blocking issues when pilot readiness gates not passed', async () => {
      _setTestMode(true, true, false);
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.some((i: string) => i.includes('pilot readiness gates'))).toBe(true);
    });

    it('accumulates multiple blocking issues', async () => {
      _setTestMode(false, false, false);
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.length).toBe(3);
      expect(result.safeMessage).toContain('failed');
    });
  });

  describe('_resetDependencyCache', () => {
    it('clears test mode and defaults to pass', async () => {
      _setTestMode(false, false, false);
      _resetDependencyCache();
      const result = await checkTask025Dependency({ schoolId: 'school-1' });
      expect(result.ok).toBe(true);
      expect(result.blockingIssues).toEqual([]);
    });
  });
});
