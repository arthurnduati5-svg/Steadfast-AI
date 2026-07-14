export type ApprovalRequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'cancelled'
  | 'blocked';

export interface QuestionApprovalRequest {
  approvalRequestId: string;
  schoolId: string;
  questionId: string;
  questionVersionId: string;
  requestedByActorId: string;
  requestedByRole: string;
  status: ApprovalRequestStatus;
  requestReason: string;
  policyVersionRefsJson: string[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export type ApprovalDecision =
  | 'approved'
  | 'rejected'
  | 'changes_requested'
  | 'revoked'
  | 'blocked';

export interface QuestionApprovalRecord {
  approvalRecordId: string;
  schoolId: string;
  approvalRequestId: string;
  questionId: string;
  questionVersionId: string;
  decision: ApprovalDecision;
  decidedByActorId: string;
  decidedByRole: string;
  decisionReason: string;
  reasonCodesJson: string[];
  createdAt: string;
}

export interface QuestionApprovalRequestRepository {
  create(request: QuestionApprovalRequest): Promise<QuestionApprovalRequest>;
  findById(approvalRequestId: string): Promise<QuestionApprovalRequest | null>;
  findBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]>;
  findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRequest[]>;
  findPendingBySchoolId(schoolId: string): Promise<QuestionApprovalRequest[]>;
  updateStatus(approvalRequestId: string, status: ApprovalRequestStatus, closedAt: string | null): Promise<QuestionApprovalRequest | null>;
}

export interface QuestionApprovalRecordRepository {
  create(record: QuestionApprovalRecord): Promise<QuestionApprovalRecord>;
  findByApprovalRequestId(approvalRequestId: string): Promise<QuestionApprovalRecord[]>;
  findByQuestionVersionId(questionVersionId: string): Promise<QuestionApprovalRecord[]>;
}
