import { randomUUID } from 'crypto';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../contracts/examPaperContracts';
import { ExamPaperVersion, ExamPaperVersionStatus } from '../contracts/examPaperVersionContracts';

const ALLOWED_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const FORBIDDEN_ROLES = ['student', 'parent', 'guest', 'unknown'];

export class ExamPaperVersionService {
  public validateContext(ctx: ExamPaperCommandContext): ExamPaperPolicyDecision {
    if (!ctx.schoolId) return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID required', blockedOperation: 'createPaperVersion' };
    if (FORBIDDEN_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_NOT_ALLOWED', safeMessage: `Role ${ctx.actorRole} cannot manage versions`, blockedOperation: 'createPaperVersion' };
    if (!ALLOWED_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_NOT_RECOGNIZED', safeMessage: `Role ${ctx.actorRole} not recognized`, blockedOperation: 'createPaperVersion' };
    if (!ctx.idempotencyKey) return { allowed: false, reasonCode: 'IDEMPOTENCY_REQUIRED', safeMessage: 'Idempotency key required', blockedOperation: 'createPaperVersion' };
    return { allowed: true, reasonCode: 'OK', safeMessage: 'Context validated', blockedOperation: '' };
  }

  public async createPaperVersion(
    data: Omit<ExamPaperVersion, 'paperVersionId' | 'createdAt' | 'approvedAt' | 'supersededAt'>,
  ): Promise<ExamPaperVersion> {
    return {
      paperVersionId: randomUUID(),
      ...data,
      approvedAt: null,
      supersededAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  public async getPaperVersion(versionId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion | null> {
    return versions.find((v) => v.paperVersionId === versionId) || null;
  }

  public async listPaperVersions(paperId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion[]> {
    return versions.filter((v) => v.paperId === paperId).sort((a, b) => b.versionNumber - a.versionNumber);
  }

  public async supersedePaperVersion(versionId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion | null> {
    const v = versions.find((x) => x.paperVersionId === versionId);
    if (!v) return null;
    return { ...v, status: 'superseded' as ExamPaperVersionStatus, supersededAt: new Date().toISOString() };
  }

  public async markVersionReviewReady(versionId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion | null> {
    const v = versions.find((x) => x.paperVersionId === versionId);
    if (!v) return null;
    return { ...v, status: 'review_ready' as ExamPaperVersionStatus };
  }

  public async markVersionDeliveryReady(versionId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion | null> {
    const v = versions.find((x) => x.paperVersionId === versionId);
    if (!v) return null;
    if (v.status !== 'approved') return null;
    return { ...v, status: 'delivery_ready' as ExamPaperVersionStatus };
  }

  public async blockPaperVersion(versionId: string, versions: ExamPaperVersion[]): Promise<ExamPaperVersion | null> {
    const v = versions.find((x) => x.paperVersionId === versionId);
    if (!v) return null;
    return { ...v, status: 'blocked' as ExamPaperVersionStatus };
  }
}
