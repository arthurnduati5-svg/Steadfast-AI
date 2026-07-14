import type { ResultReleaseCommandContext } from '../contracts';
import type { ResultReleasePacket } from '../contracts/resultReleasePacketContracts';
import type { ResultReleaseApproval } from '../contracts/resultReleaseApprovalContracts';
import type { ResultAudienceProjection } from '../contracts/resultAudienceProjectionContracts';
import type { StudentResultReportSnapshot, ParentSafeResultSummary, StudentSafeResultSummary } from '../contracts/resultReportSnapshotContracts';
import type { ResultReleaseDeliveryIntent } from '../contracts/resultReleaseDeliveryIntentContracts';
import type { ResultReleaseAuditRepository, ResultReleaseAuditEvent } from '../contracts/resultReleaseRepositoryContracts';
import { evaluateAuditPolicy } from '../policies/resultReleasePolicyDefinitions';

function now(): string {
  return new Date().toISOString();
}

export class ResultReleaseAuditBridge {
  constructor(private auditRepo: ResultReleaseAuditRepository) {}

  private async record(ctx: ResultReleaseCommandContext, event: Omit<ResultReleaseAuditEvent, 'createdAt'>): Promise<void> {
    const policyCheck = evaluateAuditPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return;
    try {
      await this.auditRepo.create({ ...event, createdAt: now() });
    } catch {
    }
  }

  async recordReleasePacketCreated(ctx: ResultReleaseCommandContext, packet: ResultReleasePacket): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: packet.resultReleasePacketId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RELEASE_PACKET_CREATED',
      decision: 'created',
      safeSummary: `Release packet created for student ${packet.studentRef}`,
      metadataJson: { packetId: packet.resultReleasePacketId, packetStatus: packet.packetStatus, packetAudience: packet.packetAudience, packetMode: packet.packetMode },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReleaseSourceChecked(ctx: ResultReleaseCommandContext, packet: ResultReleasePacket, allChecksPassed: boolean, blockingReasonCodes: string[]): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: packet.resultReleasePacketId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RELEASE_SOURCE_CHECKED',
      decision: allChecksPassed ? 'passed' : 'failed',
      safeSummary: allChecksPassed ? 'Source checks passed' : 'Source checks failed: ' + blockingReasonCodes.join(', '),
      reasonCodesJson: { blockingReasonCodes },
      metadataJson: { allChecksPassed },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordBoundaryChecked(ctx: ResultReleaseCommandContext, packet: ResultReleasePacket): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: packet.resultReleasePacketId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'BOUNDARY_CHECKED',
      decision: 'passed',
      safeSummary: 'Boundary enforcement checks passed',
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReleasePacketReadyForApproval(ctx: ResultReleaseCommandContext, packet: ResultReleasePacket): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: packet.resultReleasePacketId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RELEASE_PACKET_READY_FOR_APPROVAL',
      decision: 'ready',
      safeSummary: 'Release packet marked ready for approval',
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReleaseApprovalCreated(ctx: ResultReleaseCommandContext, approval: ResultReleaseApproval): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: approval.resultReleasePacketId,
      resultReleaseApprovalId: approval.resultReleaseApprovalId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RELEASE_APPROVAL_CREATED',
      decision: 'created',
      safeSummary: `Release approval created by ${ctx.actorRole}`,
      metadataJson: { approvalId: approval.resultReleaseApprovalId, approvalType: approval.approvalType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReleasePacketApproved(ctx: ResultReleaseCommandContext, approval: ResultReleaseApproval, approvedByActorId: string, approvedByRole: string): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: approval.resultReleasePacketId,
      resultReleaseApprovalId: approval.resultReleaseApprovalId,
      actorId: approvedByActorId,
      actorRole: approvedByRole,
      eventType: 'RELEASE_PACKET_APPROVED',
      decision: 'approved',
      safeSummary: `Release packet approved by ${approvedByRole}`,
      metadataJson: { approvalId: approval.resultReleaseApprovalId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReleasePacketRejected(ctx: ResultReleaseCommandContext, approval: ResultReleaseApproval, rejectedByActorId: string, rejectedByRole: string, reasonCode?: string): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: approval.resultReleasePacketId,
      resultReleaseApprovalId: approval.resultReleaseApprovalId,
      actorId: rejectedByActorId,
      actorRole: rejectedByRole,
      eventType: 'RELEASE_PACKET_REJECTED',
      decision: 'rejected',
      safeSummary: `Release packet rejected by ${rejectedByRole}`,
      reasonCodesJson: { reasonCode },
      metadataJson: { approvalId: approval.resultReleaseApprovalId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAudienceProjectionGenerated(ctx: ResultReleaseCommandContext, projection: ResultAudienceProjection): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: projection.resultReleasePacketId,
      resultAudienceProjectionId: projection.resultAudienceProjectionId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'AUDIENCE_PROJECTION_GENERATED',
      decision: 'generated',
      safeSummary: `Audience projection generated for ${projection.audienceType}`,
      metadataJson: { projectionId: projection.resultAudienceProjectionId, audienceType: projection.audienceType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReportSnapshotCreated(ctx: ResultReleaseCommandContext, snapshot: StudentResultReportSnapshot): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: snapshot.resultReleasePacketId,
      studentResultReportSnapshotId: snapshot.studentResultReportSnapshotId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'REPORT_SNAPSHOT_CREATED',
      decision: 'created',
      safeSummary: `Report snapshot created: ${snapshot.safeReportTitle}`,
      metadataJson: { snapshotId: snapshot.studentResultReportSnapshotId, snapshotType: snapshot.snapshotType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordParentSafeSummaryGenerated(ctx: ResultReleaseCommandContext, summary: ParentSafeResultSummary): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: summary.resultReleasePacketId,
      parentSafeResultSummaryId: summary.parentSafeResultSummaryId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'PARENT_SAFE_SUMMARY_GENERATED',
      decision: 'generated',
      safeSummary: 'Parent safe summary generated',
      metadataJson: { summaryId: summary.parentSafeResultSummaryId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordStudentSafeSummaryGenerated(ctx: ResultReleaseCommandContext, summary: StudentSafeResultSummary): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: summary.resultReleasePacketId,
      studentSafeResultSummaryId: summary.studentSafeResultSummaryId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'STUDENT_SAFE_SUMMARY_GENERATED',
      decision: 'generated',
      safeSummary: 'Student safe summary generated',
      metadataJson: { summaryId: summary.studentSafeResultSummaryId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordDeliveryIntentCreated(ctx: ResultReleaseCommandContext, intent: ResultReleaseDeliveryIntent): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: intent.resultReleasePacketId,
      resultReleaseDeliveryIntentId: intent.resultReleaseDeliveryIntentId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'DELIVERY_INTENT_CREATED',
      decision: 'created',
      safeSummary: `Delivery intent created for channel ${intent.deliveryChannel}`,
      metadataJson: { intentId: intent.resultReleaseDeliveryIntentId, deliveryChannel: intent.deliveryChannel },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordDeliveryIntentEligible(ctx: ResultReleaseCommandContext, intent: ResultReleaseDeliveryIntent): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReleasePacketId: intent.resultReleasePacketId,
      resultReleaseDeliveryIntentId: intent.resultReleaseDeliveryIntentId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'DELIVERY_INTENT_ELIGIBLE',
      decision: 'eligible',
      safeSummary: `Delivery intent marked eligible for ${intent.deliveryChannel}`,
      metadataJson: { intentId: intent.resultReleaseDeliveryIntentId, deliveryChannel: intent.deliveryChannel },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordPolicyBlocked(ctx: ResultReleaseCommandContext, details: { policyFamily: string; reasonCode: string; safeSummary: string }): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'POLICY_BLOCKED',
      decision: 'blocked',
      safeSummary: details.safeSummary,
      reasonCodesJson: { policyFamily: details.policyFamily, reasonCode: details.reasonCode },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSafeError(ctx: ResultReleaseCommandContext, errorSummary: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SAFE_ERROR',
      decision: 'error',
      safeSummary: errorSummary,
      metadataJson: metadata,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }
}
