import { describe, it, expect, beforeEach } from 'vitest';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from '../services/task025PilotReadinessService';
import { checkPilotAccess } from '../services/task025PilotAccessGateService';
import { runPilotDryRun } from '../services/task025PilotDryRunService';
import { PRIVATE_CONTENT_PATTERNS } from '../contracts/task025PilotContracts';

const FORBIDDEN_PATTERNS = [
  'rawChat', 'raw_chat', 'privateMemory', 'private_memory',
  'teacherOnlyNotes', 'teacher_only_notes', 'safeguardingRaw', 'safeguarding_raw',
  'deenSensitive', 'deen_sensitive', 'aiPrompt', 'ai_prompt',
  'providerResponse', 'provider_response', 'answerKey', 'answer_key',
  'teacherOnlyContent', 'teacher_only_content', 'protectedRubrics', 'protected_rubrics',
  'authorization', 'bearer ', 'databaseUrl', 'database_url',
];

describe('task025NoPrivateDataLeakContract', () => {
  beforeEach(() => {
    task025PilotRepository._clearMemory();
  });

  const SCHOOL_ID = 'school-001';

  let PROGRAM_ID: string = '';

  async function setupFullPilot() {
    const program = await task025PilotRepository.createPilotProgram({
      schoolId: SCHOOL_ID,
      name: 'Leak Test Pilot',
      scopeSummarySafe: 'Leak test scope',
      allowedSubjects: ['Math'],
      allowedCurriculumTracks: ['cambridge_igcse'],
      allowedRoles: ['student', 'teacher'],
      createdByRole: 'admin',
    });
    PROGRAM_ID = (program as any).id;
    await task025PilotRepository.updatePilotProgramStatus(PROGRAM_ID, 'active', 'admin');
    await task025PilotRepository.createCohort({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      name: 'Leak Test Cohort',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'student',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.addParticipant({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'teacher-hash',
      role: 'teacher',
      eligibilityStatus: 'eligible',
    });
    await task025PilotRepository.writeDryRun({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      status: 'passed',
      scenarioName: 'pre-test',
      checksPassed: ['all'],
      checksFailed: [],
      safeSummary: 'Passed',
    });
  }

  function scanForLeaks(obj: unknown, path = ''): string[] {
    const violations: string[] = [];
    if (typeof obj === 'string') {
      const lower = obj.toLowerCase();
      for (const pattern of FORBIDDEN_PATTERNS) {
        if (lower.includes(pattern.toLowerCase())) {
          violations.push(`Pattern "${pattern}" found at ${path}`);
        }
      }
    } else if (Array.isArray(obj)) {
      obj.forEach((item, i) => {
        violations.push(...scanForLeaks(item, `${path}[${i}]`));
      });
    } else if (obj && typeof obj === 'object') {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        const lowerKey = key.toLowerCase();
        for (const pattern of FORBIDDEN_PATTERNS) {
          if (lowerKey.includes(pattern.toLowerCase())) {
            violations.push(`Key "${key}" matches forbidden pattern "${pattern}" at ${path}`);
          }
        }
        violations.push(...scanForLeaks((obj as Record<string, unknown>)[key], `${path}.${key}`));
      }
    }
    return violations;
  }

  it('pilot readiness response contains no private data', async () => {
    await setupFullPilot();
    const readiness = await evaluatePilotReadiness(PROGRAM_ID, SCHOOL_ID);
    const violations = scanForLeaks(readiness);
    expect(violations).toEqual([]);
  });

  it('pilot access gate response contains no private data', async () => {
    await setupFullPilot();
    const result = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorIdHash: 'student-hash',
      role: 'student',
    });
    const violations = scanForLeaks(result);
    expect(violations).toEqual([]);
  });

  it('pilot dry run output contains no private data', async () => {
    await setupFullPilot();
    const dryRun = await runPilotDryRun(PROGRAM_ID, SCHOOL_ID, 'leak-check-dry-run');
    const violations = scanForLeaks(dryRun);
    expect(violations).toEqual([]);
  });

  it('pilot audit records contain no private data', async () => {
    await setupFullPilot();
    await task025PilotRepository.writeAuditRecord({
      pilotProgramId: PROGRAM_ID,
      schoolId: SCHOOL_ID,
      actorRole: 'admin',
      action: 'test',
      safeSummary: 'Test audit',
    });
    const records = await task025PilotRepository.listAuditRecords(PROGRAM_ID);
    const violations = scanForLeaks(records);
    expect(violations).toEqual([]);
  });

  it('pilot error responses use safe messages', async () => {
    await setupFullPilot();
    const deniedResult = await checkPilotAccess({
      pilotProgramId: PROGRAM_ID,
      schoolId: 'wrong-school',
      actorIdHash: 'student-hash',
      role: 'student',
    });
    expect(deniedResult.safeMessage).not.toContain('internal');
    expect(deniedResult.safeMessage).not.toContain('stack');
    expect(deniedResult.safeMessage).not.toContain('token');
    expect(deniedResult.safeMessage).not.toContain('secret');
  });

  it('forbidden patterns list is comprehensive', () => {
    expect(PRIVATE_CONTENT_PATTERNS).toContain('rawChat');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('answerKey');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('databaseUrl');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('authorization');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('aiPrompt');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('deenSensitive');
    expect(PRIVATE_CONTENT_PATTERNS).toContain('safeguardingRaw');
  });
});
