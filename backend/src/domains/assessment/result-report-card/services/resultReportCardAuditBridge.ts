import type { ResultReportCardCommandContext } from '../contracts/resultReportCardContracts';
import type { ResultReportCardTemplate, ResultReportCardTemplateVersion } from '../contracts/resultReportCardTemplateContracts';
import type { ResultReportCardAssembly } from '../contracts/resultReportCardAssemblyContracts';
import type { ResultReportCardSection } from '../contracts/resultReportCardSectionContracts';
import type { ResultReportCardEvidenceLink } from '../contracts/resultReportCardEvidenceContracts';
import type { ResultReportCardAudienceProjection } from '../contracts/resultReportCardProjectionContracts';
import type { ResultReportCardReview } from '../contracts/resultReportCardReviewContracts';
import type { ResultReportCardExportIntent } from '../contracts/resultReportCardExportContracts';
import type { ResultReportCardRenderManifest } from '../contracts/resultReportCardRenderContracts';
import type { ResultReportCardAuditRepository, ResultReportCardAuditEvent } from '../contracts/resultReportCardRepositoryContracts';
import { evaluateReportCardAuditPolicy } from '../policies/resultReportCardPolicyDefinitions';

function now(): string {
  return new Date().toISOString();
}

export class ResultReportCardAuditBridge {
  constructor(private auditRepo: ResultReportCardAuditRepository) {}

  private async record(ctx: ResultReportCardCommandContext, event: Omit<ResultReportCardAuditEvent, 'resultReportCardAuditId' | 'createdAt'>): Promise<void> {
    const policyCheck = evaluateReportCardAuditPolicy({ schoolId: ctx.schoolId });
    if (!policyCheck.allowed) return;
    try {
      await this.auditRepo.create(event);
    } catch {
    }
  }

  async recordTemplateCreated(ctx: ResultReportCardCommandContext, template: ResultReportCardTemplate): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: template.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: null,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'TEMPLATE_CREATED',
      decision: 'created',
      safeSummary: `Report card template created: ${template.templateName}`,
      reasonCodesJson: null,
      metadataJson: { templateId: template.resultReportCardTemplateId, templateKey: template.templateKey, templateStatus: template.templateStatus },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordTemplateVersionCreated(ctx: ResultReportCardCommandContext, version: ResultReportCardTemplateVersion): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: version.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: version.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: null,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'TEMPLATE_VERSION_CREATED',
      decision: 'created',
      safeSummary: `Template version ${version.templateVersion} created`,
      reasonCodesJson: null,
      metadataJson: { versionId: version.resultReportCardTemplateVersionId, templateId: version.resultReportCardTemplateId, layoutMode: version.layoutMode },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAssemblyCreated(ctx: ResultReportCardCommandContext, assembly: ResultReportCardAssembly): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: assembly.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: assembly.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: assembly.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ASSEMBLY_CREATED',
      decision: 'created',
      safeSummary: `Assembly created for student ${assembly.studentRef}`,
      reasonCodesJson: null,
      metadataJson: { assemblyId: assembly.resultReportCardAssemblyId, assemblyStatus: assembly.assemblyStatus, assemblyMode: assembly.assemblyMode, audienceType: assembly.audienceType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAssemblySourceChecked(ctx: ResultReportCardCommandContext, assembly: ResultReportCardAssembly): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: assembly.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: assembly.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: assembly.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ASSEMBLY_SOURCE_CHECKED',
      decision: 'assembled',
      safeSummary: `Assembly source checks completed for ${assembly.safeReportTitle}`,
      reasonCodesJson: null,
      metadataJson: { assemblyId: assembly.resultReportCardAssemblyId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAssemblySafetyChecked(ctx: ResultReportCardCommandContext, assembly: ResultReportCardAssembly): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: assembly.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: assembly.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: assembly.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ASSEMBLY_SAFETY_CHECKED',
      decision: 'safety_checked',
      safeSummary: `Assembly safety checked for ${assembly.safeReportTitle}`,
      reasonCodesJson: null,
      metadataJson: { assemblyId: assembly.resultReportCardAssemblyId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAssemblySealed(ctx: ResultReportCardCommandContext, assembly: ResultReportCardAssembly): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: assembly.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: assembly.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: assembly.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ASSEMBLY_SEALED',
      decision: 'sealed',
      safeSummary: `Assembly sealed for ${assembly.safeReportTitle}`,
      reasonCodesJson: null,
      metadataJson: { assemblyId: assembly.resultReportCardAssemblyId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAssemblyReadyForReview(ctx: ResultReportCardCommandContext, assembly: ResultReportCardAssembly): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: assembly.resultReportCardTemplateId,
      resultReportCardTemplateVersionId: assembly.resultReportCardTemplateVersionId,
      resultReportCardAssemblyId: assembly.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'ASSEMBLY_READY_FOR_REVIEW',
      decision: 'ready_for_review',
      safeSummary: `Assembly ready for review: ${assembly.safeReportTitle}`,
      reasonCodesJson: null,
      metadataJson: { assemblyId: assembly.resultReportCardAssemblyId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSectionComposed(ctx: ResultReportCardCommandContext, section: ResultReportCardSection): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: section.resultReportCardAssemblyId,
      resultReportCardSectionId: section.resultReportCardSectionId,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SECTION_COMPOSED',
      decision: 'composed',
      safeSummary: `Section ${section.sectionType} composed for assembly`,
      reasonCodesJson: null,
      metadataJson: { sectionId: section.resultReportCardSectionId, sectionType: section.sectionType, sectionKey: section.sectionKey },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSectionSealed(ctx: ResultReportCardCommandContext, section: ResultReportCardSection): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: section.resultReportCardAssemblyId,
      resultReportCardSectionId: section.resultReportCardSectionId,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SECTION_SEALED',
      decision: 'sealed',
      safeSummary: `Section ${section.sectionType} sealed`,
      reasonCodesJson: null,
      metadataJson: { sectionId: section.resultReportCardSectionId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordEvidenceLinked(ctx: ResultReportCardCommandContext, evidenceLink: ResultReportCardEvidenceLink): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: evidenceLink.resultReportCardAssemblyId,
      resultReportCardSectionId: evidenceLink.resultReportCardSectionId,
      resultReportCardEvidenceLinkId: evidenceLink.resultReportCardEvidenceLinkId,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'EVIDENCE_LINKED',
      decision: 'linked',
      safeSummary: `Evidence linked: ${evidenceLink.safeEvidenceSummary}`,
      reasonCodesJson: null,
      metadataJson: { evidenceLinkId: evidenceLink.resultReportCardEvidenceLinkId, sourceRecordType: evidenceLink.sourceRecordType, evidenceUse: evidenceLink.evidenceUse },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordAudienceProjectionGenerated(ctx: ResultReportCardCommandContext, projection: ResultReportCardAudienceProjection): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: projection.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: projection.resultReportCardAudienceProjectionId,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'AUDIENCE_PROJECTION_GENERATED',
      decision: 'generated',
      safeSummary: `Audience projection generated for ${projection.audienceType}`,
      reasonCodesJson: null,
      metadataJson: { projectionId: projection.resultReportCardAudienceProjectionId, audienceType: projection.audienceType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReviewCreated(ctx: ResultReportCardCommandContext, review: ResultReportCardReview): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: review.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: review.resultReportCardReviewId,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'REVIEW_CREATED',
      decision: 'created',
      safeSummary: `Review created: ${review.reviewType}`,
      reasonCodesJson: null,
      metadataJson: { reviewId: review.resultReportCardReviewId, reviewType: review.reviewType },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordReviewDecision(ctx: ResultReportCardCommandContext, review: ResultReportCardReview, decision: string): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: review.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: review.resultReportCardReviewId,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'REVIEW_DECISION',
      decision,
      safeSummary: `Review decision: ${decision}`,
      reasonCodesJson: null,
      metadataJson: { reviewId: review.resultReportCardReviewId, decision },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordExportIntentCreated(ctx: ResultReportCardCommandContext, exportIntent: ResultReportCardExportIntent): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: exportIntent.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: exportIntent.resultReportCardExportIntentId,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'EXPORT_INTENT_CREATED',
      decision: 'created',
      safeSummary: `Export intent created for channel ${exportIntent.exportChannel}`,
      reasonCodesJson: null,
      metadataJson: { exportIntentId: exportIntent.resultReportCardExportIntentId, exportChannel: exportIntent.exportChannel, exportMode: exportIntent.exportMode },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordExportIntentEligible(ctx: ResultReportCardCommandContext, exportIntent: ResultReportCardExportIntent): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: exportIntent.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: exportIntent.resultReportCardExportIntentId,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'EXPORT_INTENT_ELIGIBLE',
      decision: 'eligible',
      safeSummary: `Export intent eligible for future export on ${exportIntent.exportChannel}`,
      reasonCodesJson: null,
      metadataJson: { exportIntentId: exportIntent.resultReportCardExportIntentId, exportChannel: exportIntent.exportChannel },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordRenderManifestCreated(ctx: ResultReportCardCommandContext, manifest: ResultReportCardRenderManifest): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: manifest.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: manifest.resultReportCardRenderManifestId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RENDER_MANIFEST_CREATED',
      decision: 'created',
      safeSummary: `Render manifest created for mode ${manifest.renderMode}`,
      reasonCodesJson: null,
      metadataJson: { manifestId: manifest.resultReportCardRenderManifestId, renderMode: manifest.renderMode },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordRenderManifestSealed(ctx: ResultReportCardCommandContext, manifest: ResultReportCardRenderManifest): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: manifest.resultReportCardAssemblyId,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: manifest.resultReportCardRenderManifestId,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'RENDER_MANIFEST_SEALED',
      decision: 'sealed',
      safeSummary: `Render manifest sealed for mode ${manifest.renderMode}`,
      reasonCodesJson: null,
      metadataJson: { manifestId: manifest.resultReportCardRenderManifestId },
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordPolicyBlocked(ctx: ResultReportCardCommandContext, details: { policyFamily: string; reasonCode: string; safeSummary: string }): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: null,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'POLICY_BLOCKED',
      decision: 'blocked',
      safeSummary: details.safeSummary,
      reasonCodesJson: { policyFamily: details.policyFamily, reasonCode: details.reasonCode },
      metadataJson: null,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }

  async recordSafeError(ctx: ResultReportCardCommandContext, error: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.record(ctx, {
      schoolId: ctx.schoolId,
      resultReportCardTemplateId: null,
      resultReportCardTemplateVersionId: null,
      resultReportCardAssemblyId: null,
      resultReportCardSectionId: null,
      resultReportCardEvidenceLinkId: null,
      resultReportCardAudienceProjectionId: null,
      resultReportCardReviewId: null,
      resultReportCardExportIntentId: null,
      resultReportCardRenderManifestId: null,
      actorId: ctx.actorId,
      actorRole: ctx.actorRole,
      eventType: 'SAFE_ERROR',
      decision: 'error',
      safeSummary: error,
      reasonCodesJson: null,
      metadataJson: metadata ?? null,
      requestId: ctx.correlationId,
      correlationId: ctx.correlationId,
    });
  }
}