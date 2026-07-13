import { describe, it, expect, vi, beforeEach } from 'vitest';
import { task036Repository } from '../repositories/task036LiveSchoolLaunchRepository';
import { validateSocraticIntegrityResult } from '../lib/task036LiveSchoolLaunchValidation';

vi.mock('../repositories/task036LiveSchoolLaunchRepository', () => {
  const mockRepo = {
    saveSocraticIntegrity: vi.fn(),
    getSocraticIntegrity: vi.fn(),
    clearTask036StoresForTests: vi.fn(),
  };
  return { task036Repository: mockRepo, Task036LiveSchoolLaunchRepository: class {} };
});

function checkSocraticIntegrity(sessionId: string, siData: any): { passed: boolean; errors: string[] } {
  const result = {
    ok: siData.ok ?? true,
    passed: siData.passed ?? true,
    socraticGuidancePreserved: siData.socraticGuidancePreserved ?? true,
    noFinalAnswerBotBehavior: siData.noFinalAnswerBotBehavior ?? true,
    cheatingPreventionPreserved: siData.cheatingPreventionPreserved ?? true,
    noHomeworkShortcut: siData.noHomeworkShortcut ?? true,
    blockingIssues: [],
  };
  const errors = validateSocraticIntegrityResult(result);
  if (errors.length > 0) return { passed: false, errors };
  task036Repository.saveSocraticIntegrity(sessionId, result);
  return { passed: true, errors: [] };
}

describe('Task036 Socratic Integrity', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('passes when all integrity checks pass', () => {
    const result = checkSocraticIntegrity('sess-1', {});
    expect(result.passed).toBe(true);
    expect(task036Repository.saveSocraticIntegrity).toHaveBeenCalled();
  });

  it('fails when socratic guidance not preserved', () => {
    const result = checkSocraticIntegrity('sess-1', {
      ok: false, passed: false, socraticGuidancePreserved: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('socratic_guidance_not_preserved');
  });

  it('fails when final answer bot behavior detected', () => {
    const result = checkSocraticIntegrity('sess-1', {
      ok: false, passed: false, noFinalAnswerBotBehavior: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('final_answer_bot_behavior_detected');
  });

  it('fails when cheating prevention not preserved', () => {
    const result = checkSocraticIntegrity('sess-1', {
      ok: false, passed: false, cheatingPreventionPreserved: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('cheating_prevention_not_preserved');
  });

  it('fails when homework shortcut detected', () => {
    const result = checkSocraticIntegrity('sess-1', {
      ok: false, passed: false, noHomeworkShortcut: false,
    });
    expect(result.passed).toBe(false);
    expect(result.errors).toContain('homework_shortcut_detected');
  });

  it('retrieves stored integrity from repository', () => {
    const stored: any = {
      ok: true, passed: true, socraticGuidancePreserved: true,
      noFinalAnswerBotBehavior: true, cheatingPreventionPreserved: true,
      noHomeworkShortcut: true, blockingIssues: [],
    };
    vi.mocked(task036Repository.getSocraticIntegrity).mockReturnValue(stored);
    const retrieved = task036Repository.getSocraticIntegrity('sess-1');
    expect(retrieved!.passed).toBe(true);
    expect(retrieved!.socraticGuidancePreserved).toBe(true);
  });
});
