import { describe, it, expect, beforeEach } from 'vitest';
import {
  checkTask026Dependency,
  _setTestMode,
  _resetDependencyCache,
} from '../services/task027Task026ExecutionDependencyService';

beforeEach(() => {
  _resetDependencyCache();
});

const validInput = {
  schoolId: 'school-1',
  actorRole: 'school_admin',
  executionRunId: 'exec-1',
  commitHash: 'a2ebb29',
};

describe('task027Task026ExecutionDependencyService', () => {
  describe('checkTask026Dependency with test mode = pass', () => {
    it('returns ok:true when test mode is set to pass', async () => {
      _setTestMode(true, true);
      const result = await checkTask026Dependency(validInput);
      expect(result.ok).toBe(true);
      expect(result.commitVerified).toBe(true);
      expect(result.safeToStartTask027).toBe(true);
      expect(result.blockingIssues).toEqual([]);
      expect(result.safeMessage).toContain('verified');
    });
  });

  describe('checkTask026Dependency with wrong commit hash', () => {
    it('adds blocking issues when commit is wrong', async () => {
      const input = { ...validInput, commitHash: 'wronghash' };
      const result = await checkTask026Dependency(input);
      expect(result.ok).toBe(false);
      expect(result.commitVerified).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThan(0);
      expect(result.blockingIssues.some((i: string) => i.includes('commit hash'))).toBe(true);
    });
  });

  describe('checkTask026Dependency safeToStartTask027 is false', () => {
    it('blocks when safeToStartTask027 is false', async () => {
      _setTestMode(true, false);
      const result = await checkTask026Dependency(validInput);
      expect(result.ok).toBe(false);
      expect(result.safeToStartTask027).toBe(false);
      expect(result.blockingIssues.some((i: string) => i.includes('safeToStartTask027'))).toBe(true);
    });
  });

  describe('checkTask026Dependency missing executionRunId', () => {
    it('does not validate executionRunId presence (service expects it in input)', async () => {
      _setTestMode(true, true);
      const input = { ...validInput, executionRunId: '' };
      const result = await checkTask026Dependency(input);
      expect(result.ok).toBe(true);
    });
  });

  describe('checkTask026Dependency full failure scenario', () => {
    it('returns multiple blocking issues when commit is wrong', async () => {
      const input = { ...validInput, commitHash: 'bad' };
      const result = await checkTask026Dependency(input);
      expect(result.ok).toBe(false);
      expect(result.blockingIssues.length).toBeGreaterThanOrEqual(2);
      expect(result.safeMessage).toContain('failed');
    });
  });

  describe('_resetDependencyCache', () => {
    it('clears test mode after reset', async () => {
      _setTestMode(true, true);
      _resetDependencyCache();
      const result = await checkTask026Dependency(validInput);
      expect(result.commitVerified).toBe(true);
      expect(result.safeToStartTask027).toBe(false);
    });
  });
});
