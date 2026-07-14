import { describe, it, expect } from 'vitest';
import type { ResultReleaseCommandContext } from '../contracts/resultReleaseContracts';
import {
  InMemoryStudentResultReportSnapshotRepository,
  InMemoryParentSafeResultSummaryRepository,
  InMemoryStudentSafeResultSummaryRepository,
  InMemoryResultAudienceProjectionRepository,
  InMemoryResultReleasePacketRepository,
  InMemoryResultReleaseAuditRepository,
  InMemoryResultReleaseIdempotencyRepository,
} from '../repositories/inMemoryResultReleaseRepositories';
import { ResultReleaseAuditBridge } from '../services/resultReleaseAuditBridge';
import { ResultReleaseIdempotencyService } from '../services/resultReleaseIdempotencyService';
import { ResultReportSnapshotService } from '../services/resultReportSnapshotService';
import { ParentSafeResultSummaryService } from '../services/parentSafeResultSummaryService';
import { StudentSafeResultSummaryService } from '../services/studentSafeResultSummaryService';

function makeCtx(overrides?: Partial<ResultReleaseCommandContext>): ResultReleaseCommandContext {
  return {
    schoolId: 'test-school',
    actorId: 'test-actor',
    actorRole: 'admin',
    correlationId: 'test-correlation',
    idempotencyKey: `ik-${Date.now()}-${Math.random()}`,
    ...overrides,
  };
}

describe('Package 11 - Report Snapshots', () => {
  const snapshotRepo = new InMemoryStudentResultReportSnapshotRepository();
  const parentSummaryRepo = new InMemoryParentSafeResultSummaryRepository();
  const studentSummaryRepo = new InMemoryStudentSafeResultSummaryRepository();
  const projectionRepo = new InMemoryResultAudienceProjectionRepository();
  const packetRepo = new InMemoryResultReleasePacketRepository();
  const auditRepo = new InMemoryResultReleaseAuditRepository();
  const idempotencyRepo = new InMemoryResultReleaseIdempotencyRepository();
  const auditBridge = new ResultReleaseAuditBridge(auditRepo);
  const idempotencyService = new ResultReleaseIdempotencyService(idempotencyRepo);
  const snapshotService = new ResultReportSnapshotService(snapshotRepo, auditBridge, idempotencyService);
  const parentSummaryService = new ParentSafeResultSummaryService(parentSummaryRepo, auditBridge, idempotencyService);
  const studentSummaryService = new StudentSafeResultSummaryService(studentSummaryRepo, auditBridge, idempotencyService);

  it('should create student result report snapshot from audience projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-snap-${Date.now()}` });
    const result = await snapshotService.createStudentResultReportSnapshot(ctx, {
      resultReleasePacketId: 'packet-1',
      resultAudienceProjectionId: 'proj-1',
      studentRef: 'student-1',
      snapshotType: 'student_safe_exam_result',
      safeReportTitle: 'Exam Result Report',
      safeReportSummary: 'Student performed well',
      safeStrengthsJson: { strengths: ['algebra'] },
      safeGrowthAreasJson: { growth: ['geometry'] },
      safeNextStepsJson: { steps: ['practice geometry'] },
      safeSupportGuidanceJson: { guidance: ['tutoring'] },
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('generated');
  });

  it('should create parent-safe summary from parent-boundary projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-parent-sum-${Date.now()}` });
    const result = await parentSummaryService.generateParentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-1',
      resultAudienceProjectionId: 'proj-1',
      studentRef: 'student-1',
      safeProgressSummary: 'Student is making progress',
      safeSupportSummary: 'Needs support in geometry',
      safeStrengthsJson: { strengths: ['reading'] },
      safeGrowthAreasJson: { growth: ['math'] },
      safeRecommendedSupportJson: { support: ['extra tutoring'] },
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('generated');
  });

  it('should create student-safe summary from student-safe projection', async () => {
    const ctx = makeCtx({ idempotencyKey: `create-student-sum-${Date.now()}` });
    const result = await studentSummaryService.generateStudentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-1',
      resultAudienceProjectionId: 'proj-1',
      studentRef: 'student-1',
      safeAchievementSummary: 'You scored well',
      safeLearningProgressSummary: 'You are improving',
      safeNextPracticeSummary: 'Practice geometry',
      safeConfidenceGuidanceJson: { confidence: 'high' },
      safeRevisionGuidanceJson: { revision: ['chapter 5'] },
    });
    expect(result.ok).toBe(true);
    expect(result.resourceId).toBeTruthy();
    expect(result.status).toBe('generated');
  });

  it('should approve report snapshot for internal use', async () => {
    const ctx = makeCtx({ idempotencyKey: `approve-int-${Date.now()}` });
    const created = await snapshotService.createStudentResultReportSnapshot(ctx, {
      resultReleasePacketId: 'packet-2',
      resultAudienceProjectionId: 'proj-2',
      studentRef: 'student-2',
      snapshotType: 'teacher_operational_summary',
      safeReportTitle: 'Teacher Summary',
      safeReportSummary: 'Operational view',
    });
    const snapId = created.resourceId!;
    const result = await snapshotService.approveReportSnapshotForInternalUse(ctx, snapId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved_for_internal_use');
  });

  it('should approve parent-safe summary for future delivery', async () => {
    const ctx = makeCtx({ idempotencyKey: `approve-parent-future-${Date.now()}` });
    const created = await parentSummaryService.generateParentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-3',
      resultAudienceProjectionId: 'proj-3',
      studentRef: 'student-3',
      safeProgressSummary: 'Good',
      safeSupportSummary: 'OK',
    });
    const sumId = created.resourceId!;
    const result = await parentSummaryService.approveParentSafeSummaryForFutureDelivery(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved_for_future_delivery');
  });

  it('should approve student-safe summary for future delivery', async () => {
    const ctx = makeCtx({ idempotencyKey: `approve-student-future-${Date.now()}` });
    const created = await studentSummaryService.generateStudentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-4',
      resultAudienceProjectionId: 'proj-4',
      studentRef: 'student-4',
      safeAchievementSummary: 'Great',
      safeLearningProgressSummary: 'Progressing',
      safeNextPracticeSummary: 'Practice more',
    });
    const sumId = created.resourceId!;
    const result = await studentSummaryService.approveStudentSafeSummaryForFutureDelivery(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('approved_for_future_delivery');
  });

  it('should block report snapshot', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-snap-${Date.now()}` });
    const created = await snapshotService.createStudentResultReportSnapshot(ctx, {
      resultReleasePacketId: 'packet-5',
      resultAudienceProjectionId: 'proj-5',
      studentRef: 'student-5',
      snapshotType: 'admin_audit_summary',
      safeReportTitle: 'Audit',
      safeReportSummary: 'Audit summary',
    });
    const snapId = created.resourceId!;
    const result = await snapshotService.blockReportSnapshot(ctx, snapId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void report snapshot', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-snap-${Date.now()}` });
    const created = await snapshotService.createStudentResultReportSnapshot(ctx, {
      resultReleasePacketId: 'packet-6',
      resultAudienceProjectionId: 'proj-6',
      studentRef: 'student-6',
      snapshotType: 'student_safe_exam_result',
      safeReportTitle: 'To void',
      safeReportSummary: 'Void test',
    });
    const snapId = created.resourceId!;
    const result = await snapshotService.voidReportSnapshot(ctx, snapId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should block parent-safe summary', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-parent-sum-${Date.now()}` });
    const created = await parentSummaryService.generateParentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-7',
      resultAudienceProjectionId: 'proj-7',
      studentRef: 'student-7',
      safeProgressSummary: 'Progress',
      safeSupportSummary: 'Support',
    });
    const sumId = created.resourceId!;
    const result = await parentSummaryService.blockParentSafeSummary(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void parent-safe summary', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-parent-sum-${Date.now()}` });
    const created = await parentSummaryService.generateParentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-8',
      resultAudienceProjectionId: 'proj-8',
      studentRef: 'student-8',
      safeProgressSummary: 'Progress',
      safeSupportSummary: 'Support',
    });
    const sumId = created.resourceId!;
    const result = await parentSummaryService.voidParentSafeSummary(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should block student-safe summary', async () => {
    const ctx = makeCtx({ idempotencyKey: `block-student-sum-${Date.now()}` });
    const created = await studentSummaryService.generateStudentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-9',
      resultAudienceProjectionId: 'proj-9',
      studentRef: 'student-9',
      safeAchievementSummary: 'Achievement',
      safeLearningProgressSummary: 'Progress',
      safeNextPracticeSummary: 'Practice',
    });
    const sumId = created.resourceId!;
    const result = await studentSummaryService.blockStudentSafeSummary(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('blocked');
  });

  it('should void student-safe summary', async () => {
    const ctx = makeCtx({ idempotencyKey: `void-student-sum-${Date.now()}` });
    const created = await studentSummaryService.generateStudentSafeSummary(ctx, {
      resultReleasePacketId: 'packet-10',
      resultAudienceProjectionId: 'proj-10',
      studentRef: 'student-10',
      safeAchievementSummary: 'A',
      safeLearningProgressSummary: 'P',
      safeNextPracticeSummary: 'N',
    });
    const sumId = created.resourceId!;
    const result = await studentSummaryService.voidStudentSafeSummary(ctx, sumId);
    expect(result.ok).toBe(true);
    expect(result.status).toBe('void');
  });

  it('should not create PDF in report snapshot service', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/services/resultReportSnapshotService.ts', 'utf-8');
    expect(content).not.toContain('pdf');
    expect(content).not.toContain('PDF');
  });

  it('should not send email/SMS/push/WhatsApp in report snapshot service', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/services/resultReportSnapshotService.ts', 'utf-8');
    expect(content).not.toContain('email');
    expect(content).not.toContain('sms');
    expect(content).not.toContain('push');
    expect(content).not.toContain('whatsapp');
    expect(content).not.toContain('notify');
  });

  it('should not create portal publication in parent summary service', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/services/parentSafeResultSummaryService.ts', 'utf-8');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('publish');
  });

  it('should not create portal publication in student summary service', async () => {
    const fs = await import('fs');
    const content = fs.readFileSync('backend/src/domains/assessment/result-release/services/studentSafeResultSummaryService.ts', 'utf-8');
    expect(content).not.toContain('portal');
    expect(content).not.toContain('publish');
  });
});
