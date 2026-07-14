import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 12 — No Duplication', () => {
  const schemaPath = path.resolve(__dirname, '../../../../../../backend/prisma/schema.prisma');

  it('schema file exists', () => {
    expect(fs.existsSync(schemaPath)).toBe(true);
  });

  const schema = fs.readFileSync(schemaPath, 'utf-8');

  function countOccurrences(text: string, pattern: string): number {
    let count = 0;
    let idx = 0;
    while ((idx = text.indexOf(pattern, idx)) !== -1) {
      count++;
      idx += pattern.length;
    }
    return count;
  }

  it('model ResultDeliveryJobRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryJobRecord {');
  });

  it('model ResultDeliveryRecipientRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryRecipientRecord {');
  });

  it('model ResultDeliveryChannelEnvelopeRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryChannelEnvelopeRecord {');
  });

  it('model ResultDeliverySuppressionRecord exists', () => {
    expect(schema).toContain('model ResultDeliverySuppressionRecord {');
  });

  it('model ResultDeliveryAttemptRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryAttemptRecord {');
  });

  it('model ResultDeliveryReceiptRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryReceiptRecord {');
  });

  it('model ResultDeliveryRetryPlanRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryRetryPlanRecord {');
  });

  it('model ResultDeliveryMockProviderRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryMockProviderRecord {');
  });

  it('model ResultDeliveryAuditRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryAuditRecord {');
  });

  it('model ResultDeliveryIdempotencyRecord exists', () => {
    expect(schema).toContain('model ResultDeliveryIdempotencyRecord {');
  });

  // Verify existing models exist (Package 11 models)
  it('model ResultReleaseDeliveryIntentRecord exists once', () => {
    const count = countOccurrences(schema, 'model ResultReleaseDeliveryIntentRecord {');
    expect(count).toBe(1);
  });

  it('model ResultReleasePacketRecord exists', () => {
    expect(schema).toContain('model ResultReleasePacketRecord {');
  });

  it('model ResultReleaseApprovalRecord exists', () => {
    expect(schema).toContain('model ResultReleaseApprovalRecord {');
  });

  it('model ResultAudienceProjectionRecord exists', () => {
    expect(schema).toContain('model ResultAudienceProjectionRecord {');
  });

  it('model ParentSafeResultSummaryRecord exists', () => {
    expect(schema).toContain('model ParentSafeResultSummaryRecord {');
  });

  it('model StudentSafeResultSummaryRecord exists', () => {
    expect(schema).toContain('model StudentSafeResultSummaryRecord {');
  });

  it('model StudentResultReportSnapshotRecord exists', () => {
    expect(schema).toContain('model StudentResultReportSnapshotRecord {');
  });

  // Verify forbidden live models do NOT exist
  it('model LiveEmailProviderRecord does NOT exist', () => {
    expect(schema).not.toContain('model LiveEmailProviderRecord {');
  });

  it('model LiveSmsProviderRecord does NOT exist', () => {
    expect(schema).not.toContain('model LiveSmsProviderRecord {');
  });

  it('model LivePushProviderRecord does NOT exist', () => {
    expect(schema).not.toContain('model LivePushProviderRecord {');
  });

  it('model LiveWhatsAppProviderRecord does NOT exist', () => {
    expect(schema).not.toContain('model LiveWhatsAppProviderRecord {');
  });

  it('model ParentNotificationDeliveryRecord does NOT exist', () => {
    expect(schema).not.toContain('model ParentNotificationDeliveryRecord {');
  });

  it('model StudentNotificationDeliveryRecord does NOT exist', () => {
    expect(schema).not.toContain('model StudentNotificationDeliveryRecord {');
  });

  it('model ParentPortalPublicationRecord does NOT exist', () => {
    expect(schema).not.toContain('model ParentPortalPublicationRecord {');
  });

  it('model StudentPortalPublicationRecord does NOT exist', () => {
    expect(schema).not.toContain('model StudentPortalPublicationRecord {');
  });

  it('model ExternalSchoolSyncRecord does NOT exist', () => {
    expect(schema).not.toContain('model ExternalSchoolSyncRecord {');
  });

  it('model PdfReportExportRecord does NOT exist', () => {
    expect(schema).not.toContain('model PdfReportExportRecord {');
  });

  it('model ReportCardExportRecord does NOT exist', () => {
    expect(schema).not.toContain('model ReportCardExportRecord {');
  });

  it('model AIReportNarrativeRecord does NOT exist', () => {
    expect(schema).not.toContain('model AIReportNarrativeRecord {');
  });

  it('model OCRResultRecord does NOT exist', () => {
    expect(schema).not.toContain('model OCRResultRecord {');
  });
});
