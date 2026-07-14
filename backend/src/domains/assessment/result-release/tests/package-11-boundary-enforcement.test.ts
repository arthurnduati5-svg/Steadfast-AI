import { describe, it, expect } from 'vitest';
import type { ResultReleaseCommandContext } from '../contracts/resultReleaseContracts';
import { ResultReleaseBoundaryEnforcementService } from '../services/resultReleaseBoundaryEnforcementService';
import { ResultReleaseProjectionSafetyService } from '../services/resultReleaseProjectionSafetyService';

function makeCtx(overrides?: Partial<ResultReleaseCommandContext>): ResultReleaseCommandContext {
  return {
    schoolId: 'test-school',
    actorId: 'test-actor',
    actorRole: 'admin',
    correlationId: 'test-correlation',
    idempotencyKey: 'test-ik',
    ...overrides,
  };
}

describe('Package 11 - Boundary Enforcement', () => {
  const boundaryService = new ResultReleaseBoundaryEnforcementService();
  const safetyService = new ResultReleaseProjectionSafetyService();
  const ctx = makeCtx();

  it('should allow student audience', async () => {
    const result = await boundaryService.assertBoundaryAllowsAudience(ctx, 'student');
    expect(result.ok).toBe(true);
    expect((result as any).data.allowed).toBe(true);
  });

  it('should allow parent audience', async () => {
    const result = await boundaryService.assertBoundaryAllowsAudience(ctx, 'parent');
    expect(result.ok).toBe(true);
    expect((result as any).data.allowed).toBe(true);
  });

  it('should allow teacher audience', async () => {
    const result = await boundaryService.assertBoundaryAllowsAudience(ctx, 'teacher');
    expect(result.ok).toBe(true);
    expect((result as any).data.allowed).toBe(true);
  });

  it('should allow admin audience', async () => {
    const result = await boundaryService.assertBoundaryAllowsAudience(ctx, 'admin');
    expect(result.ok).toBe(true);
    expect((result as any).data.allowed).toBe(true);
  });

  it('should reject invalid audience', async () => {
    const result = await boundaryService.assertBoundaryAllowsAudience(ctx, 'invalid_role');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('INVALID_AUDIENCE');
  });

  it('should block student field access for forbidden fields', async () => {
    const result = await boundaryService.assertFieldAllowedForAudience(ctx, 'student', 'answerKeyText');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('FIELD_BLOCKED');
  });

  it('should allow student field access for allowed fields', async () => {
    const result = await boundaryService.assertFieldAllowedForAudience(ctx, 'student', 'studentRef');
    expect(result.ok).toBe(true);
  });

  it('should block parent field access for forbidden fields', async () => {
    const result = await boundaryService.assertFieldAllowedForAudience(ctx, 'parent', 'rubricInternal');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('FIELD_BLOCKED');
  });

  it('should allow parent field access for allowed fields', async () => {
    const result = await boundaryService.assertFieldAllowedForAudience(ctx, 'parent', 'safeProgressSummary');
    expect(result.ok).toBe(true);
  });

  it('should redact forbidden fields for student audience', async () => {
    const result = await boundaryService.redactForStudentAudience(ctx, {
      studentRef: 'st1', answerKeyText: 'secret', rubricInternal: 'rubric',
      hiddenReasoning: 'reason', rawStudentAnswer: 'answer',
    });
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.studentRef).toBe('st1');
    expect(data).not.toHaveProperty('answerKeyText');
    expect(data).not.toHaveProperty('rubricInternal');
    expect(data).not.toHaveProperty('hiddenReasoning');
    expect(data).not.toHaveProperty('rawStudentAnswer');
  });

  it('should redact forbidden fields for parent audience', async () => {
    const result = await boundaryService.redactForParentAudience(ctx, {
      studentRef: 'st1', scoreBeforeFinalization: '80', parentDeliveryPayload: 'payload',
      pdfPayload: 'pdf', portalPayload: 'portal',
    });
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.studentRef).toBe('st1');
    expect(data).not.toHaveProperty('scoreBeforeFinalization');
    expect(data).not.toHaveProperty('parentDeliveryPayload');
    expect(data).not.toHaveProperty('pdfPayload');
    expect(data).not.toHaveProperty('portalPayload');
  });

  it('should preserve all fields for teacher audience', async () => {
    const payload = { studentRef: 'st1', internalNote: 'note', score: 85 };
    const result = await boundaryService.redactForTeacherAudience(ctx, payload);
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.studentRef).toBe('st1');
    expect(data.internalNote).toBe('note');
    expect(data.score).toBe(85);
  });

  it('should preserve all fields for admin audience', async () => {
    const payload = { studentRef: 'st1', auditData: 'data', fullAccess: true };
    const result = await boundaryService.redactForAdminAudience(ctx, payload);
    expect(result.ok).toBe(true);
    const data = (result as any).data;
    expect(data.studentRef).toBe('st1');
    expect(data.auditData).toBe('data');
    expect(data.fullAccess).toBe(true);
  });

  it('should assertBoundaryAllowsAudience block missing schoolId', async () => {
    const badCtx = makeCtx({ schoolId: '' });
    const result = await boundaryService.assertBoundaryAllowsAudience(badCtx, 'student');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should assertFieldAllowedForAudience block missing schoolId', async () => {
    const badCtx = makeCtx({ schoolId: '' });
    const result = await boundaryService.assertFieldAllowedForAudience(badCtx, 'student', 'studentRef');
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should redactForStudentAudience block missing schoolId', async () => {
    const badCtx = makeCtx({ schoolId: '' });
    const result = await boundaryService.redactForStudentAudience(badCtx, { studentRef: 'st1' });
    expect(result.ok).toBe(false);
    expect(result.reasonCode).toBe('SCHOOL_CONTEXT_REQUIRED');
  });

  it('should blockPacketForBoundaryViolation return blocked status', async () => {
    const result = await boundaryService.blockPacketForBoundaryViolation(ctx, 'packet-1', 'Forbidden field leaked');
    expect(result.status).toBe('blocked');
    expect(result.reasonCode).toBe('BOUNDARY_VIOLATION');
  });

  it('should not leak forbidden fields in student-safe projection', async () => {
    const result = await safetyService.toStudentSafeProjection(ctx, {
      studentRef: 'st1', answerKeyText: 'leak', rubricText: 'leak',
      rawRubric: 'leak', markingNotesTeacherOnly: 'leak',
    });
    const data = (result as any).data;
    expect(data).not.toHaveProperty('answerKeyText');
    expect(data).not.toHaveProperty('rubricText');
    expect(data).not.toHaveProperty('rawRubric');
    expect(data).not.toHaveProperty('markingNotesTeacherOnly');
    expect(data.blockedFieldNames).toContain('answerKeyText');
  });

  it('should not leak forbidden fields in parent-boundary projection', async () => {
    const result = await safetyService.toParentBoundaryProjection(ctx, {
      studentRef: 'st1', auditInternals: 'leak', teacherOverrideInternal: 'leak',
      markingAlgorithmInternals: 'leak', moderationDecisionInternal: 'leak',
    });
    const data = (result as any).data;
    expect(data).not.toHaveProperty('auditInternals');
    expect(data).not.toHaveProperty('teacherOverrideInternal');
    expect(data).not.toHaveProperty('markingAlgorithmInternals');
    expect(data).not.toHaveProperty('moderationDecisionInternal');
    expect(data.blockedFieldNames).toContain('auditInternals');
  });
});
