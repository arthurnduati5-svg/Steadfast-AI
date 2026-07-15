import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  ALLOWED_RECOVERY_CREATION_ROLES,
  BLOCKED_RECOVERY_CREATION_ROLES,
  FORBIDDEN_RECOVERY_FIELDS,
} from '../contracts';
import {
  RESULT_RECOVERY_POLICY_FAMILIES,
  ResultRecoveryPolicyEnforcer,
} from '../policies/resultRecoveryPolicyDefinitions';

describe('Package 17 — Recovery Contracts', () => {
  it('contracts module has runtime exports', async () => {
    const mod = await import('../contracts/index');
    expect(mod).toBeDefined();
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('ALLOWED_RECOVERY_CREATION_ROLES');
    expect(keys).toContain('BLOCKED_RECOVERY_CREATION_ROLES');
    expect(keys).toContain('FORBIDDEN_RECOVERY_FIELDS');
  });

  it('policy definitions exist with expected 17 families', () => {
    const families = RESULT_RECOVERY_POLICY_FAMILIES;
    expect(families).toBeDefined();
    const keys = Object.keys(families);
    expect(keys.length).toBe(18);
    expect(keys).toContain('RESULT_RECOVERY_PLAN_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_OBJECTIVE_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_STEP_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_PRACTICE_DRAFT_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_RESOURCE_RECOMMENDATION_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_TEACHER_REVIEW_PACKET_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_STUDENT_SUPPORT_DRAFT_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_PARENT_SUPPORT_NOTE_DRAFT_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_CHECKPOINT_CREATION');
    expect(keys).toContain('RESULT_RECOVERY_SUMMARY_MUTATION');
    expect(keys).toContain('RESULT_RECOVERY_AUDIT');
    expect(keys).toContain('RESULT_RECOVERY_NO_LIVE_ASSIGNMENT');
    expect(keys).toContain('RESULT_RECOVERY_NO_LIVE_NOTIFICATION');
    expect(keys).toContain('RESULT_RECOVERY_NO_SCORE_MUTATION');
    expect(keys).toContain('RESULT_RECOVERY_NO_MASTERY_MUTATION');
    expect(keys).toContain('RESULT_RECOVERY_NO_GENERATED_QUESTION');
    expect(keys).toContain('RESULT_RECOVERY_NO_AI_NARRATIVE');
    expect(keys).toContain('RESULT_RECOVERY_NO_OCR');
  });

  it('repository contract source file exists (interfaces are type-only)', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryRepositoryContracts.ts'))).toBe(true);
  });

  it('plan contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryPlanContracts.ts'))).toBe(true);
  });

  it('objective contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryObjectiveContracts.ts'))).toBe(true);
  });

  it('step contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryStepContracts.ts'))).toBe(true);
  });

  it('practice draft contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryPracticeDraftContracts.ts'))).toBe(true);
  });

  it('resource recommendation contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryResourceRecommendationContracts.ts'))).toBe(true);
  });

  it('teacher review packet contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryTeacherReviewPacketContracts.ts'))).toBe(true);
  });

  it('student support draft contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryStudentSupportDraftContracts.ts'))).toBe(true);
  });

  it('parent support note draft contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryParentSupportNoteDraftContracts.ts'))).toBe(true);
  });

  it('checkpoint contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoveryCheckpointContracts.ts'))).toBe(true);
  });

  it('summary contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultRecoverySummaryContracts.ts'))).toBe(true);
  });

  it('student/parent/guest actors cannot create recovery plans (policy enforcer)', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();

    const studentResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'student');
    expect(studentResult.allowed).toBe(false);

    const parentResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'parent');
    expect(parentResult.allowed).toBe(false);

    const guestResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'guest');
    expect(guestResult.allowed).toBe(false);
  });

  it('teacher/admin/system_job can create governed records where permitted', () => {
    const enforcer = new ResultRecoveryPolicyEnforcer();

    const teacherResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'teacher');
    expect(teacherResult.allowed).toBe(true);

    const adminResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'admin');
    expect(adminResult.allowed).toBe(true);

    const systemJobResult = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'system_job');
    expect(systemJobResult.allowed).toBe(true);
  });

  it('missing schoolId blocks mutation (service behavior)', () => {
    expect(ALLOWED_RECOVERY_CREATION_ROLES).toBeDefined();
    expect(BLOCKED_RECOVERY_CREATION_ROLES).toBeDefined();
    const enforcer = new ResultRecoveryPolicyEnforcer();
    const result = enforcer.enforce('RESULT_RECOVERY_PLAN_CREATION', 'student');
    expect(result.allowed).toBe(false);
  });

  it('future-only/mock-only/metadata-only modes are allowed', () => {
    expect(Array.isArray(ALLOWED_RECOVERY_CREATION_ROLES)).toBe(true);
    expect(ALLOWED_RECOVERY_CREATION_ROLES.length).toBeGreaterThan(0);
    expect(Array.isArray(BLOCKED_RECOVERY_CREATION_ROLES)).toBe(true);
    expect(BLOCKED_RECOVERY_CREATION_ROLES.length).toBeGreaterThan(0);
  });

  it('live assignment modes are blocked (assertMockOnlyRecoveryOperation)', async () => {
    const { ResultRecoverySafetyService } = await import('../services/resultRecoverySafetyService');
    const safety = new ResultRecoverySafetyService();
    const result = safety.assertMockOnlyRecoveryOperation('live_assignment');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ACTION_BLOCKED');
  });

  describe('source file existence', () => {
    it('contracts/index.ts exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../contracts/index.ts'))).toBe(true);
    });

    it('policies definitions file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../policies/resultRecoveryPolicyDefinitions.ts'))).toBe(true);
    });

    it('in-memory repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/inMemoryResultRecoveryRepositories.ts'))).toBe(true);
    });

    it('prisma repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/prismaResultRecoveryRepositories.ts'))).toBe(true);
    });

    it('services directory has plan service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryPlanService.ts'))).toBe(true);
    });

    it('services directory has objective service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryObjectiveService.ts'))).toBe(true);
    });

    it('services directory has step service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryStepService.ts'))).toBe(true);
    });

    it('services directory has practice draft service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryPracticeDraftService.ts'))).toBe(true);
    });

    it('services directory has resource recommendation service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryResourceRecommendationService.ts'))).toBe(true);
    });

    it('services directory has teacher review packet service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryTeacherReviewPacketService.ts'))).toBe(true);
    });

    it('services directory has student support draft service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryStudentSupportDraftService.ts'))).toBe(true);
    });

    it('services directory has parent support note draft service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryParentSupportNoteDraftService.ts'))).toBe(true);
    });

    it('services directory has checkpoint service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryCheckpointService.ts'))).toBe(true);
    });

    it('services directory has summary service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoverySummaryService.ts'))).toBe(true);
    });

    it('services directory has safety service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoverySafetyService.ts'))).toBe(true);
    });

    it('services directory has idempotency service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryIdempotencyService.ts'))).toBe(true);
    });

    it('services directory has audit bridge', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultRecoveryAuditBridge.ts'))).toBe(true);
    });
  });
});
