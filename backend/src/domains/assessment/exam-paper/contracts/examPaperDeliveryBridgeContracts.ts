export type ExamPaperDeliveryBridgeStatus =
  | 'draft'
  | 'validated'
  | 'delivery_ready'
  | 'blocked'
  | 'superseded';

export type ExamPaperBridgeType =
  | 'exam_mode_contract'
  | 'paper_print_contract'
  | 'mock_delivery_contract';

export type ExamPaperCompatibleRuntime =
  | 'exam_mode_future'
  | 'print_packet_future'
  | 'manual_teacher_future';

export interface ExamPaperDeliveryBridge {
  deliveryBridgeId: string;
  schoolId: string;
  paperId: string;
  paperVersionId: string;
  status: ExamPaperDeliveryBridgeStatus;
  bridgeType: ExamPaperBridgeType;
  compatibleRuntime: ExamPaperCompatibleRuntime;
  contractVersion: string;
  safeContractSummary: string;
  blockedReasonCode: string | null;
  createdAt: string;
  validatedAt: string | null;
}

export interface ExamPaperDeliveryBridgeContract {
  bridgeType: ExamPaperBridgeType;
  compatibleRuntime: ExamPaperCompatibleRuntime;
  contractVersion: string;
  safeContractSummary: string;
  paperId: string;
  paperVersionId: string;
  schoolId: string;
  status: ExamPaperDeliveryBridgeStatus;
  hasAccessPolicy: boolean;
  hasApproval: boolean;
  hasVariants: boolean;
  questionCount: number;
  totalMarks: number;
  durationMinutes: number;
}
