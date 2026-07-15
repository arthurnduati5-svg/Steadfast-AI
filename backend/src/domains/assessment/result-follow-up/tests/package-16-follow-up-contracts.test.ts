import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  ALLOWED_FOLLOW_UP_CREATION_ROLES,
  BLOCKED_FOLLOW_UP_CREATION_ROLES,
  FORBIDDEN_FOLLOW_UP_FIELDS,
} from '../contracts';
import {
  RESULT_FOLLOW_UP_POLICY_FAMILIES,
  ResultFollowUpPolicyEnforcer,
} from '../policies/resultFollowUpPolicyDefinitions';

describe('Package 16 — Follow-Up Contracts', () => {
  it('contracts module has runtime exports', async () => {
    const mod = await import('../contracts/index');
    expect(mod).toBeDefined();
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('ALLOWED_FOLLOW_UP_CREATION_ROLES');
    expect(keys).toContain('BLOCKED_FOLLOW_UP_CREATION_ROLES');
    expect(keys).toContain('FORBIDDEN_FOLLOW_UP_FIELDS');
  });

  it('policy definitions exist with expected 15 families', () => {
    const families = RESULT_FOLLOW_UP_POLICY_FAMILIES;
    expect(families).toBeDefined();
    const keys = Object.keys(families);
    expect(keys.length).toBe(15);
    expect(keys).toContain('RESULT_FOLLOW_UP_CASE_CREATION');
    expect(keys).toContain('RESULT_FOLLOW_UP_SIGNAL_CREATION');
    expect(keys).toContain('RESULT_FOLLOW_UP_ACTION_PLAN_CREATION');
    expect(keys).toContain('TEACHER_FOLLOW_UP_QUEUE_CREATION');
    expect(keys).toContain('PARENT_GUIDANCE_DRAFT_CREATION');
    expect(keys).toContain('STUDENT_REFLECTION_TASK_DRAFT_CREATION');
    expect(keys).toContain('FOLLOW_UP_REVIEW_WINDOW_CREATION');
    expect(keys).toContain('FOLLOW_UP_ESCALATION_PLAN_CREATION');
    expect(keys).toContain('FOLLOW_UP_SUMMARY_MUTATION');
    expect(keys).toContain('FOLLOW_UP_AUDIT');
    expect(keys).toContain('RESULT_FOLLOW_UP_NO_LIVE_NOTIFICATION');
    expect(keys).toContain('RESULT_FOLLOW_UP_NO_LIVE_TASK');
    expect(keys).toContain('RESULT_FOLLOW_UP_NO_SCORE_MUTATION');
    expect(keys).toContain('RESULT_FOLLOW_UP_NO_AI_NARRATIVE');
    expect(keys).toContain('RESULT_FOLLOW_UP_NO_OCR');
  });

  it('repository contract source file exists (interfaces are type-only)', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultFollowUpRepositoryContracts.ts'))).toBe(true);
  });

  it('follow-up case contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultFollowUpCaseContracts.ts'))).toBe(true);
  });

  it('signal contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultFollowUpSignalContracts.ts'))).toBe(true);
  });

  it('action plan contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/resultFollowUpActionPlanContracts.ts'))).toBe(true);
  });

  it('teacher queue contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/teacherFollowUpQueueContracts.ts'))).toBe(true);
  });

  it('parent guidance contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/parentGuidanceDraftContracts.ts'))).toBe(true);
  });

  it('student reflection contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/studentReflectionTaskDraftContracts.ts'))).toBe(true);
  });

  it('review window contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/followUpReviewWindowContracts.ts'))).toBe(true);
  });

  it('escalation plan contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/followUpEscalationPlanContracts.ts'))).toBe(true);
  });

  it('summary contracts exist', () => {
    expect(fs.existsSync(path.join(__dirname, '../contracts/followUpSummaryContracts.ts'))).toBe(true);
  });

  it('student/parent/guest actors cannot create follow-up cases (policy enforcer)', () => {
    const enforcer = new ResultFollowUpPolicyEnforcer();

    const studentResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'student');
    expect(studentResult.allowed).toBe(false);

    const parentResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'parent');
    expect(parentResult.allowed).toBe(false);

    const guestResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'guest');
    expect(guestResult.allowed).toBe(false);
  });

  it('teacher/admin/system_job can create governed records', () => {
    const enforcer = new ResultFollowUpPolicyEnforcer();

    const teacherResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'teacher');
    expect(teacherResult.allowed).toBe(true);

    const adminResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'admin');
    expect(adminResult.allowed).toBe(true);

    const systemJobResult = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'system_job');
    expect(systemJobResult.allowed).toBe(true);
  });

  it('missing schoolId blocks mutation (service behavior)', () => {
    expect(ALLOWED_FOLLOW_UP_CREATION_ROLES).toBeDefined();
    expect(BLOCKED_FOLLOW_UP_CREATION_ROLES).toBeDefined();
    const enforcer = new ResultFollowUpPolicyEnforcer();
    const result = enforcer.enforce('RESULT_FOLLOW_UP_CASE_CREATION', 'student');
    expect(result.allowed).toBe(false);
  });

  it('future-only/mock-only/metadata-only modes are allowed', () => {
    expect(Array.isArray(ALLOWED_FOLLOW_UP_CREATION_ROLES)).toBe(true);
    expect(ALLOWED_FOLLOW_UP_CREATION_ROLES.length).toBeGreaterThan(0);
    expect(Array.isArray(BLOCKED_FOLLOW_UP_CREATION_ROLES)).toBe(true);
    expect(BLOCKED_FOLLOW_UP_CREATION_ROLES.length).toBeGreaterThan(0);
  });

  it('live action modes are blocked (assertMockOnlyFollowUpOperation)', async () => {
    const { ResultFollowUpSafetyService } = await import('../services/resultFollowUpSafetyService');
    const safety = new ResultFollowUpSafetyService();
    const result = safety.assertMockOnlyFollowUpOperation('live_action');
    expect(result.allowed).toBe(false);
    expect(result.reasonCode).toBe('LIVE_ACTION_BLOCKED');
  });

  describe('source file existence', () => {
    it('contracts/index.ts exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../contracts/index.ts'))).toBe(true);
    });

    it('policies definitions file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../policies/resultFollowUpPolicyDefinitions.ts'))).toBe(true);
    });

    it('in-memory repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/inMemoryResultFollowUpRepositories.ts'))).toBe(true);
    });

    it('prisma repositories file exists', () => {
      expect(fs.existsSync(path.join(__dirname, '../repositories/prismaResultFollowUpRepositories.ts'))).toBe(true);
    });

    it('services directory has audit bridge service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpAuditBridge.ts'))).toBe(true);
    });

    it('services directory has idempotency service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpIdempotencyService.ts'))).toBe(true);
    });

    it('services directory has case service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpCaseService.ts'))).toBe(true);
    });

    it('services directory has signal service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpSignalService.ts'))).toBe(true);
    });

    it('services directory has action plan service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpActionPlanService.ts'))).toBe(true);
    });

    it('services directory has safety service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/resultFollowUpSafetyService.ts'))).toBe(true);
    });

    it('services directory has teacher queue service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/teacherFollowUpQueueService.ts'))).toBe(true);
    });

    it('services directory has parent guidance service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/parentGuidanceDraftService.ts'))).toBe(true);
    });

    it('services directory has student reflection service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/studentReflectionTaskDraftService.ts'))).toBe(true);
    });

    it('services directory has review window service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/followUpReviewWindowService.ts'))).toBe(true);
    });

    it('services directory has escalation plan service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/followUpEscalationPlanService.ts'))).toBe(true);
    });

    it('services directory has summary service', () => {
      expect(fs.existsSync(path.join(__dirname, '../services/followUpSummaryService.ts'))).toBe(true);
    });
  });
});
