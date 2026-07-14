export type ExamPaperApprovalDecision =
  | 'approve_for_delivery_bridge'
  | 'return_for_revision'
  | 'block_paper'
  | 'archive_paper';

export interface ExamPaperApproval {
  paperApprovalId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  decision: ExamPaperApprovalDecision;
  decisionReasonCode: string;
  safeReason: string;
  decidedByActorId: string;
  decidedByRole: string;
  createdAt: string;
}
