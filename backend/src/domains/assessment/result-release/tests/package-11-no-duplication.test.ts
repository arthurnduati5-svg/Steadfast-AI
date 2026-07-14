import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

describe('Package 11 - No Duplication', () => {
  const schemaPath = path.resolve('backend/prisma/schema.prisma');
  const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

  it('ResultReleasePacketRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultReleasePacketRecord');
  });

  it('ResultReleaseApprovalRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultReleaseApprovalRecord');
  });

  it('ResultAudienceProjectionRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultAudienceProjectionRecord');
  });

  it('StudentResultReportSnapshotRecord should exist in schema', () => {
    expect(schemaContent).toContain('model StudentResultReportSnapshotRecord');
  });

  it('ParentSafeResultSummaryRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ParentSafeResultSummaryRecord');
  });

  it('StudentSafeResultSummaryRecord should exist in schema', () => {
    expect(schemaContent).toContain('model StudentSafeResultSummaryRecord');
  });

  it('ResultReleaseDeliveryIntentRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultReleaseDeliveryIntentRecord');
  });

  it('ResultReleaseAuditRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultReleaseAuditRecord');
  });

  it('ResultReleaseIdempotencyRecord should exist in schema', () => {
    expect(schemaContent).toContain('model ResultReleaseIdempotencyRecord');
  });

  it('Existing ResultFinalizationDecisionRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model ResultFinalizationDecisionRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing ResultReleaseReadinessRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model ResultReleaseReadinessRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing ResultReleaseBoundaryRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model ResultReleaseBoundaryRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing ResultLearningEvidenceBridgeRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model ResultLearningEvidenceBridgeRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing MarkingResultVersionRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model MarkingResultVersionRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing SkillMasterySnapshot should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model SkillMasterySnapshot/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('Existing SafeLearningEvidenceRecord should not be duplicated', () => {
    const occurrences = (schemaContent.match(/model SafeLearningEvidenceRecord/g) || []).length;
    expect(occurrences).toBe(1);
  });

  it('ResultFinalizationDecisionRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('ResultFinalizationDecisionRecordDuplicate');
  });

  it('ResultReleaseReadinessRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('ResultReleaseReadinessRecordDuplicate');
  });

  it('ResultReleaseBoundaryRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('ResultReleaseBoundaryRecordDuplicate');
  });

  it('ResultLearningEvidenceBridgeRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('ResultLearningEvidenceBridgeRecordDuplicate');
  });

  it('MarkingResultVersionRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('MarkingResultVersionRecordDuplicate');
  });

  it('SkillMasterySnapshotDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('SkillMasterySnapshotDuplicate');
  });

  it('SafeLearningEvidenceRecordDuplicate should NOT exist', () => {
    expect(schemaContent).not.toContain('SafeLearningEvidenceRecordDuplicate');
  });

  it('ParentNotificationDeliveryRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model ParentNotificationDeliveryRecord');
  });

  it('StudentNotificationDeliveryRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model StudentNotificationDeliveryRecord');
  });

  it('EmailDeliveryRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model EmailDeliveryRecord');
  });

  it('SmsDeliveryRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model SmsDeliveryRecord');
  });

  it('PushNotificationRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model PushNotificationRecord');
  });

  it('WhatsAppDeliveryRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model WhatsAppDeliveryRecord');
  });

  it('ParentPortalPublicationRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model ParentPortalPublicationRecord');
  });

  it('StudentPortalPublicationRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model StudentPortalPublicationRecord');
  });

  it('ExternalSchoolSyncRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model ExternalSchoolSyncRecord');
  });

  it('PdfReportExportRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model PdfReportExportRecord');
  });

  it('OCRResultRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model OCRResultRecord');
  });

  it('AIReportNarrativeRecord should NOT exist', () => {
    expect(schemaContent).not.toContain('model AIReportNarrativeRecord');
  });
});
