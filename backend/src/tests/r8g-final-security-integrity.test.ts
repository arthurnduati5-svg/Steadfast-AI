import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@genkit-ai/flow', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@genkit-ai/flow')>();
  return {
    ...actual,
    runFlow: vi.fn(async (flow: unknown, params: Record<string, unknown>) => {
      if (params && typeof params.query === 'string') {
        return [
          {
            videoId: 'vid123',
            title: 'Khan Academy Fractions Lesson',
            channelTitle: 'Khan Academy',
            thumbnailUrl: null,
          },
        ];
      }
      return 'Could not fetch transcript';
    }),
  };
});

import { task024OpsRepository } from '../repositories/task024OpsRepository';
import { kernelSourceTrustService } from '../services/sourceTrustService';
import { videoRecommendationService } from '../services/videoRecommendationService';
import { requireRole, resolveRequestRole } from '../lib/rbac';

describe('R8-G final security integrity closure', () => {
  beforeEach(() => {
    task024OpsRepository._clearMemory();
  });

  describe('Task024 school isolation (R8-G-added records)', () => {
    it('School A creates backup check and ops report; School A retrieves, School B cannot', async () => {
      await task024OpsRepository.createBackupCheck({
        schoolId: 'SCHOOL_A',
        backupConfigured: true,
        lastBackupStatus: 'ready',
      });
      await task024OpsRepository.createOpsReport({
        schoolId: 'SCHOOL_A',
        taskId: '024',
        taskName: 'ops',
        status: 'pass',
        safeSummary: 'ok',
      });

      const ownReport = await task024OpsRepository.getLatestOpsReport(undefined, 'SCHOOL_A');
      expect(ownReport).not.toBeNull();
      expect(ownReport.schoolId).toBe('SCHOOL_A');

      const ownChecks = await task024OpsRepository.listBackupChecks('SCHOOL_A');
      expect(ownChecks.length).toBe(1);

      const foreignReport = await task024OpsRepository.getLatestOpsReport(undefined, 'SCHOOL_B');
      expect(foreignReport).toBeNull();

      const foreignChecks = await task024OpsRepository.listBackupChecks('SCHOOL_B');
      expect(foreignChecks.length).toBe(0);
    });

    it('scoped reads never leak across taskIds either', async () => {
      await task024OpsRepository.createOpsReport({ schoolId: 'SCHOOL_A', taskId: '024', status: 'pass' });
      const missing = await task024OpsRepository.getLatestOpsReport('other-task', 'SCHOOL_A');
      expect(missing).toBeNull();
    });
  });

  describe('Video recommendation verified-context authorization', () => {
    it('valid verified context produces school-scoped, fail-closed recommendation', async () => {
      const response = await videoRecommendationService.recommend(
        { schoolId: 'SCHOOL_A', studentId: 'STU_1' },
        { query: 'fractions', maxResults: 3 },
      );
      expect(response.ok).toBe(true);
      expect(response.meta.schoolId).toBe('SCHOOL_A');
      expect(response.recommendations.length).toBeGreaterThan(0);
      const first = response.recommendations[0];
      expect(first.recommendationId.startsWith('SCHOOL_A:')).toBe(true);
      expect(first.safety.status).toBe('needs_review');
      expect(first.suitability.islamicAppropriateness.needsTeacherReview).toBe(true);
      expect(first.cachePolicy.cacheAllowed).toBe(false);
      expect(first.evidence[0].score).toBe(0);
    });

    it('cross-school identity cannot mint another school scope', async () => {
      const response = await videoRecommendationService.recommend(
        { schoolId: 'SCHOOL_B', studentId: 'STU_9' },
        { query: 'fractions', maxResults: 3 },
      );
      expect(response.meta.schoolId).toBe('SCHOOL_B');
      expect(response.meta.schoolId).not.toBe('SCHOOL_A');
      for (const rec of response.recommendations) {
        expect(rec.recommendationId.startsWith('SCHOOL_B:')).toBe(true);
      }
    });

    it('empty or whitespace identity is rejected before any provider use', async () => {
      await expect(
        videoRecommendationService.recommend({ schoolId: '', studentId: 'STU_1' }, { query: 'x' }),
      ).rejects.toThrow();
      await expect(
        videoRecommendationService.recommend({ schoolId: 'SCHOOL_A', studentId: '  ' }, { query: 'x' }),
      ).rejects.toThrow();
      await expect(
        videoRecommendationService.recommend({ schoolId: '', studentId: '' }, { query: 'x' }),
      ).rejects.toThrow();
    });
  });

  describe('Source trust fail-closed and tenant scope', () => {
    it('verified high-trust source resolves as verified with verified_only citations', () => {
      const decision = kernelSourceTrustService.resolve({
        schoolId: 'SCHOOL_A',
        studentId: 'STU_1',
        retrievalRecords: [{ title: 'Khan Academy lesson', url: 'https://www.khanacademy.org/math/arithmetic' }],
      });
      expect(decision.verifiedSources.length).toBe(1);
      expect(decision.verifiedSources[0].trustStatus).toBe('verified');
      expect(decision.verifiedSources[0].schoolId).toBe('SCHOOL_A');
      expect(decision.citationPolicy).toBe('verified_only');
      expect(decision.unsupportedSourcesBlocked).toBe(false);
    });

    it('unreviewed/unsupported source is withheld, never learner-visible by default', () => {
      const decision = kernelSourceTrustService.resolve({
        schoolId: 'SCHOOL_A',
        retrievalRecords: [{ title: 'Random upload', url: 'https://untrusted-random-example.invalid/video' }],
      });
      expect(decision.verifiedSources.length).toBe(0);
      expect(decision.unsupportedCount).toBe(1);
      expect(decision.unsupportedSourcesBlocked).toBe(true);
      expect(decision.status).toBe('unsupported');
    });

    it('missing retrieval record is blocked, not defaulted to visible', () => {
      const decision = kernelSourceTrustService.resolve({
        schoolId: 'SCHOOL_A',
        requestedSources: [{ title: 'No URL source', url: null }],
      });
      expect(decision.verifiedSources.length).toBe(0);
      expect(decision.unsupportedCount).toBe(1);
      expect(decision.unsupportedSources[0].reason).toBe('missing_retrieval_record');
    });

    it('blank schoolId normalizes to null and never forges another school scope', () => {
      const decision = kernelSourceTrustService.resolve({
        schoolId: '   ',
        retrievalRecords: [{ title: 'Khan Academy lesson', url: 'https://www.khanacademy.org/math/arithmetic' }],
      });
      expect(decision.verifiedSources[0].schoolId).toBeNull();
      const other = kernelSourceTrustService.resolve({
        schoolId: 'SCHOOL_B',
        retrievalRecords: [{ title: 'Khan Academy lesson', url: 'https://www.khanacademy.org/math/arithmetic' }],
      });
      expect(other.verifiedSources[0].schoolId).toBe('SCHOOL_B');
      expect(other.verifiedSources[0].schoolId).not.toBe('SCHOOL_A');
    });
  });

  describe('RBAC both invocation forms preserve authorization', () => {
    const adminReq = { user: { id: 'a1', role: 'admin' } } as never;
    const studentReq = { user: { id: 's1', role: 'student' } } as never;
    const teacherReq = { user: { id: 't1', role: 'teacher' } } as never;

    it('imperative form allows admin and forbids student', () => {
      const calls: number[] = [];
      const res = { status: (code: number) => ({ send: () => { calls.push(code); } }) } as never;
      expect(requireRole(adminReq, res, ['admin'])).toBe('admin');
      expect(requireRole(studentReq, res, ['admin'])).toBeNull();
      expect(calls).toContain(403);
    });

    it('middleware-factory form allows counselor and forbids student/teacher', () => {
      const guard = requireRole('admin', 'counselor') as (req: unknown, res: unknown, next: () => void) => void;
      let nextCalls = 0;
      let statusCode = 0;
      const res = { status: (code: number) => ({ send: () => { statusCode = code; } }) };
      guard({ user: { id: 'c1', role: 'counselor' } }, res, () => { nextCalls += 1; });
      expect(nextCalls).toBe(1);
      guard(studentReq, res, () => { nextCalls += 1; });
      expect(statusCode).toBe(403);
      expect(nextCalls).toBe(1);
      expect(resolveRequestRole(teacherReq)).toBe('student');
    });
  });
});
