import { randomUUID } from 'crypto';
import { ExamPaperDeliveryBridge, ExamPaperDeliveryBridgeStatus, ExamPaperDeliveryBridgeContract, ExamPaperBridgeType, ExamPaperCompatibleRuntime } from '../contracts/examPaperDeliveryBridgeContracts';

export class ExamPaperDeliveryBridgeService {
  public async createDeliveryBridgeContract(
    data: {
      schoolId: string;
      paperId: string;
      paperVersionId: string;
      bridgeType: ExamPaperBridgeType;
      compatibleRuntime: ExamPaperCompatibleRuntime;
      contractVersion: string;
      safeContractSummary: string;
    },
  ): Promise<ExamPaperDeliveryBridge> {
    return {
      deliveryBridgeId: randomUUID(),
      ...data,
      status: 'draft' as ExamPaperDeliveryBridgeStatus,
      blockedReasonCode: null,
      createdAt: new Date().toISOString(),
      validatedAt: null,
    };
  }

  public async validateExamModeBridgeContract(bridge: ExamPaperDeliveryBridge): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    if (bridge.bridgeType !== 'exam_mode_contract') warnings.push('Bridge type is not exam_mode_contract');
    if (bridge.compatibleRuntime !== 'exam_mode_future') warnings.push('Compatible runtime is not exam_mode_future');
    if (!bridge.safeContractSummary) warnings.push('Contract summary is empty');
    return { valid: warnings.length === 0, warnings };
  }

  public async validatePrintPacketBridgeContract(bridge: ExamPaperDeliveryBridge): Promise<{ valid: boolean; warnings: string[] }> {
    const warnings: string[] = [];
    if (bridge.bridgeType !== 'paper_print_contract') warnings.push('Bridge type is not paper_print_contract');
    if (bridge.compatibleRuntime !== 'print_packet_future') warnings.push('Compatible runtime is not print_packet_future');
    return { valid: warnings.length === 0, warnings };
  }

  public async markBridgeDeliveryReady(bridge: ExamPaperDeliveryBridge): Promise<ExamPaperDeliveryBridge> {
    return { ...bridge, status: 'delivery_ready' as ExamPaperDeliveryBridgeStatus, validatedAt: new Date().toISOString() };
  }

  public async blockBridge(bridge: ExamPaperDeliveryBridge, reasonCode: string): Promise<ExamPaperDeliveryBridge> {
    return { ...bridge, status: 'blocked' as ExamPaperDeliveryBridgeStatus, blockedReasonCode: reasonCode };
  }

  public async getBridgeForPaperVersion(paperVersionId: string, bridges: ExamPaperDeliveryBridge[]): Promise<ExamPaperDeliveryBridge | null> {
    return bridges.find((b) => b.paperVersionId === paperVersionId) || null;
  }

  public buildContractSummary(bridge: ExamPaperDeliveryBridge, metadata: { hasAccessPolicy: boolean; hasApproval: boolean; hasVariants: boolean; questionCount: number; totalMarks: number; durationMinutes: number }): ExamPaperDeliveryBridgeContract {
    return {
      bridgeType: bridge.bridgeType,
      compatibleRuntime: bridge.compatibleRuntime,
      contractVersion: bridge.contractVersion,
      safeContractSummary: bridge.safeContractSummary,
      paperId: bridge.paperId,
      paperVersionId: bridge.paperVersionId,
      schoolId: bridge.schoolId,
      status: bridge.status,
      ...metadata,
    };
  }
}
