import { ResultRecoveryTeacherReviewPacketStatus } from './resultRecoveryContracts';

export interface ResultRecoveryTeacherReviewPacket {
  resultRecoveryTeacherReviewPacketId: string;
  schoolId: string;
  resultRecoveryPlanId: string;
  studentRef: string;
  teacherRef: string;
  packetStatus: ResultRecoveryTeacherReviewPacketStatus;
  packetMode: string;
  safePacketSummary: string;
  caseRefsJson: Record<string, unknown> | null;
  objectiveRefsJson: Record<string, unknown> | null;
  stepRefsJson: Record<string, unknown> | null;
  practiceDraftRefsJson: Record<string, unknown> | null;
  resourceRecommendationRefsJson: Record<string, unknown> | null;
  reviewQuestionsJson: Record<string, unknown> | null;
  blockedReasonCodesJson: string[] | null;
  createdByActorId: string;
  createdByRole: string;
  createdAt: string;
  updatedAt: string;
  reviewReadyAt: string | null;
  acknowledgedMockAt: string | null;
  approvedForFutureUseAt: string | null;
  suppressedAt: string | null;
  voidedAt: string | null;
}

export interface CreateTeacherReviewPacketInput {
  resultRecoveryPlanId: string;
  studentRef: string;
  teacherRef: string;
  packetMode?: string;
  safePacketSummary: string;
  caseRefsJson?: Record<string, unknown>;
  objectiveRefsJson?: Record<string, unknown>;
  stepRefsJson?: Record<string, unknown>;
  practiceDraftRefsJson?: Record<string, unknown>;
  resourceRecommendationRefsJson?: Record<string, unknown>;
  reviewQuestionsJson?: Record<string, unknown>;
}

export interface ResultRecoveryTeacherReviewPacketPreview {
  resultRecoveryTeacherReviewPacketId: string;
  resultRecoveryPlanId: string;
  teacherRef: string;
  packetStatus: string;
  safePacketSummary: string;
  reviewReadyAt: string | null;
  acknowledgedMockAt: string | null;
  createdAt: string;
}

export interface UpdateRecoveryTeacherReviewPacketStatusInput {
  packetStatus: string;
  reasonCode: string;
  safeMessage: string;
}
