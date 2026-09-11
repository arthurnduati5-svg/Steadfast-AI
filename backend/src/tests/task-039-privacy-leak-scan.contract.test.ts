import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';

const TASK039_FILES = [
  'backend/src/contracts/schoolSystemBridgeContracts.ts',
  'backend/src/services/schoolContextVerificationService.ts',
  'backend/src/services/tutorLearnerMappingService.ts',
  'backend/src/services/teacherScopeMappingService.ts',
  'backend/src/services/schoolAdminScopeMappingService.ts',
  'backend/src/services/mockSchoolSystemAdapter.ts',
  'backend/src/services/disabledLiveSchoolSystemAdapter.ts',
  'backend/src/services/schoolConnectorActivationGuard.ts',
  'backend/src/services/rosterSyncDryRunService.ts',
  'backend/src/services/schoolIdentityConflictDetectionService.ts',
  'backend/src/services/schoolConnectorNoBypassAuditService.ts',
];

const TASK039_DOCS = [
  'docs/architecture/SCHOOL_CONTEXT_FAILURE_POLICY.md',
  'docs/integration/MOCK_TO_LIVE_SCHOOL_SYSTEM_ACTIVATION_GUIDE.md',
  'docs/integration/SCHOOL_CONNECTOR_READINESS_CHECKLIST.md',
];

const ALL_TASK039_FILES = [...TASK039_FILES, ...TASK039_DOCS];

describe('Task 039 — Privacy Leak Scan', () => {
  for (const file of TASK039_FILES) {
    it(`${file} has no real names`, () => {
      const source = readFileSync(file, 'utf-8');
      const lines = source.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const hasRealName = /name\s*[:=]\s*["'](?!Fake\s|mock-|task-|SCHOOL_)[A-Z][a-z]+ [A-Z][a-z]+["']/.test(line);
        if (hasRealName) {
          const match = line.match(/name\s*[:=]\s*["']([^"']+)["']/);
          if (match && !match[1].startsWith('Fake ') && !match[1].startsWith('mock-')) {
            expect(`Line ${i + 1}: ${line.trim()}`).toBe('no real names');
          }
        }
      }
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no real emails`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no real phone numbers`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/\+?\d{10,15}/);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no database URLs`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/postgresql:\/\//);
      expect(source).not.toMatch(/mysql:\/\//);
      expect(source).not.toMatch(/mongodb:\/\//);
      expect(source).not.toMatch(/redis:\/\//);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no bearer tokens`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/bearer\s+/i);
    });
  }

  for (const file of TASK039_FILES) {
    if (file.includes('schoolConnectorNoBypassAuditService')) continue;
    it(`${file} has no API keys`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/api[_-]?key/i);
    });
  }

  it('schoolConnectorNoBypassAuditService API key references are expected string literals for pattern detection', () => {
    const source = readFileSync('backend/src/services/schoolConnectorNoBypassAuditService.ts', 'utf-8');
    const apiKeyRefs = source.match(/api[_-]?key/gi);
    expect(apiKeyRefs).not.toBeNull();
    expect(source).toContain('SCHOOL_CONNECTOR_API_KEY');
  });

  for (const file of TASK039_FILES) {
    it(`${file} has no JWT patterns`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+/);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no private keys`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/-----BEGIN (RSA |EC )?PRIVATE KEY-----/);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no authorization headers (as data)`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/['"]authorization['"]\s*[:=]/i);
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no cookies (as data)`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/['"]cookie['"]\s*[:=]/i);
    });
  }

  for (const file of ALL_TASK039_FILES) {
    it(`${file} has no raw AI prompts`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('system_prompt');
      expect(source).not.toContain('user_prompt');
    });
  }

  for (const file of TASK039_FILES) {
    it(`${file} has no raw provider responses`, () => {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('provider_response');
      expect(source).not.toContain('rawResponse');
    });
  }

  it('mock adapter uses only synthetic data', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const roster = mockSchoolSystemAdapter.getFullMockRosterInput();
    for (const student of roster.students) {
      if (student.name) expect(student.name).toMatch(/^Fake /);
    }
    for (const teacher of roster.teachers) {
      if (teacher.name) expect(teacher.name).toMatch(/^Fake /);
    }
    for (const cls of roster.classes) {
      if (cls.name) expect(cls.name).toMatch(/^Fake /);
    }
    for (const subject of roster.subjects) {
      if (subject.name) expect(subject.name).toMatch(/^Fake /);
    }
  });

  it('all synthetic IDs are clearly fake', async () => {
    const { mockSchoolSystemAdapter } = await import('../services/mockSchoolSystemAdapter');
    const roster = mockSchoolSystemAdapter.getFullMockRosterInput();
    for (const student of roster.students) {
      expect(student.externalStudentId).toMatch(/^mock-/);
    }
    for (const teacher of roster.teachers) {
      expect(teacher.externalTeacherId).toMatch(/^mock-/);
    }
  });

  it('no answer key markers in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('answer_key');
      expect(source).not.toContain('correct_answer');
    }
  });

  it('no teacher-only raw content markers in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('teacher_notes');
      expect(source).not.toContain('teacher_only');
    }
  });

  it('no safeguarding raw details in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('safeguarding_detail');
      expect(source).not.toContain('safeguarding_raw');
    }
  });

  it('no Deen-sensitive raw text in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('deen_sensitive');
      expect(source).not.toContain('fatwa');
    }
  });

  it('no raw chat in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      const rawChatMatch = source.match(/raw_chat/i);
      const studentChatMatch = source.match(/student_chat/i);
      const learnerChatMatch = source.match(/learner_chat/i);
      if (rawChatMatch && !source.substring(Math.max(0, rawChatMatch.index - 40), rawChatMatch.index).includes("reasonCode")) {
        expect(rawChatMatch).toBeNull();
      }
      if (studentChatMatch && !source.substring(Math.max(0, studentChatMatch.index - 40), studentChatMatch.index).includes("must_not_access_")) {
        expect(studentChatMatch).toBeNull();
      }
      if (learnerChatMatch) {
        expect(learnerChatMatch).toBeNull();
      }
    }
  });

  it('no private learner memory in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/private_memory|learner_memory_private/i);
    }
  });

  it('no database URL in any Task 039 source', () => {
    for (const file of TASK039_FILES) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toMatch(/DATABASE_URL|DIRECT_URL/i);
    }
  });

  it('no credential env vars in Task 039 services', () => {
    const filesWithoutDisabled = TASK039_FILES.filter(f => !f.includes('disabledLive') && !f.includes('schoolConnectorNoBypassAuditService'));
    for (const file of filesWithoutDisabled) {
      const source = readFileSync(file, 'utf-8');
      expect(source).not.toContain('process.env');
    }
  });

  it('schoolConnectorNoBypassAuditService process.env references are expected string literals', () => {
    const source = readFileSync('backend/src/services/schoolConnectorNoBypassAuditService.ts', 'utf-8');
    expect(source).toContain('process.env.SCHOOL_CONNECTOR_CLIENT_SECRET');
    expect(source).toContain('process.env.SCHOOL_CONNECTOR_WEBHOOK_SECRET');
    expect(source).toContain('process.env.SCHOOL_CONNECTOR_API_KEY');
  });

  it('all Task 039 files exist', () => {
    for (const file of ALL_TASK039_FILES) {
      expect(existsSync(file)).toBe(true);
    }
  });

  it('all test files exist', () => {
    const testFiles = [
      'backend/src/tests/task-039-school-system-contracts.test.ts',
      'backend/src/tests/task-039-school-context-verification-service.test.ts',
      'backend/src/tests/task-039-tutor-learner-mapping-service.test.ts',
      'backend/src/tests/task-039-teacher-scope-mapping-service.test.ts',
      'backend/src/tests/task-039-school-admin-scope-mapping-service.test.ts',
      'backend/src/tests/task-039-mock-school-system-adapter.test.ts',
      'backend/src/tests/task-039-disabled-live-school-system-adapter.test.ts',
      'backend/src/tests/task-039-school-connector-activation-guard.test.ts',
      'backend/src/tests/task-039-roster-sync-dry-run-service.test.ts',
      'backend/src/tests/task-039-school-identity-conflict-detection.test.ts',
      'backend/src/tests/task-039-school-connector-no-bypass-audit.test.ts',
      'backend/src/tests/task-039-no-live-school-system-call.contract.test.ts',
      'backend/src/tests/task-039-no-tutor-before-school-context.contract.test.ts',
      'backend/src/tests/task-039-role-scope-boundary.contract.test.ts',
      'backend/src/tests/task-039-privacy-leak-scan.contract.test.ts',
    ];
    for (const file of testFiles) {
      expect(existsSync(file)).toBe(true);
    }
  });
});
