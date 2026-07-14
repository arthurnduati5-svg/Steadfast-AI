import { randomUUID } from 'crypto';
import { ExamPaperApproval, ExamPaperApprovalDecision } from '../contracts/examPaperApprovalContracts';
import { ExamPaperCommandContext, ExamPaperPolicyDecision } from '../contracts/examPaperContracts';

const ALLOWED_APPROVER_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin'];
const FORBIDDEN_ROLES = ['student', 'parent', 'guest', 'unknown'];

export class ExamPaperApprovalService {
  public validateApprovalContext(ctx: ExamPaperCommandContext): ExamPaperPolicyDecision {
    if (!ctx.schoolId) return { allowed: false, reasonCode: 'SCHOOL_CONTEXT_REQUIRED', safeMessage: 'School ID required', blockedOperation: 'approveForDeliveryBridge' };
    if (FORBIDDEN_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_NOT_ALLOWED', safeMessage: `Role ${ctx.actorRole} cannot approve papers`, blockedOperation: 'approveForDeliveryBridge' };
    if (!ALLOWED_APPROVER_ROLES.includes(ctx.actorRole)) return { allowed: false, reasonCode: 'ROLE_CANNOT_APPROVE', safeMessage: `Role ${ctx.actorRole} is not authorized to approve`, blockedOperation: 'approveForDeliveryBridge' };
    return { allowed: true, reasonCode: 'OK', safeMessage: 'Approval context validated', blockedOperation: '' };
  }

  public async approveForDeliveryBridge(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      decision: ExamPaperApprovalDecision;
      decisionReasonCode: string;
      safeReason: string;
      decidedByActorId: string;
      decidedByRole: string;
    },
  ): Promise<ExamPaperApproval> {
    return {
      paperApprovalId: randomUUID(),
      ...data,
      createdAt: new Date().toISOString(),
    };
  }

  public async returnForRevision(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      safeReason: string;
      decidedByActorId: string;
      decidedByRole: string;
    },
  ): Promise<ExamPaperApproval> {
    return this.approveForDeliveryBridge({ ...data, decision: 'return_for_revision', decisionReasonCode: 'RETURN_FOR_REVISION' });
  }

  public async blockPaper(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      safeReason: string;
      decidedByActorId: string;
      decidedByRole: string;
    },
  ): Promise<ExamPaperApproval> {
    return this.approveForDeliveryBridge({ ...data, decision: 'block_paper', decisionReasonCode: 'BLOCK_PAPER' });
  }

  public async archivePaper(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      safeReason: string;
      decidedByActorId: string;
      decidedByRole: string;
    },
  ): Promise<ExamPaperApproval> {
    return this.approveForDeliveryBridge({ ...data, decision: 'archive_paper', decisionReasonCode: 'ARCHIVE_PAPER' });
  }

  public async listApprovalsForPaperVersion(paperVersionId: string, approvals: ExamPaperApproval[]): Promise<ExamPaperApproval[]> {
    return approvals.filter((a) => a.paperVersionId === paperVersionId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
}
