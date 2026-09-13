import type { ContentGovernanceDiagnostics } from './task022ContentGovernanceContracts';
import { curriculumVersioningService } from './task022CurriculumVersioningService';
import { approvedSourceRegistryService } from './task022ApprovedSourceRegistryService';
import { contentGapDetectionService } from './task022ContentGapDetectionService';
import { contentGovernanceAuditService } from './task022ContentGovernanceAuditService';
import { contentItemGovernanceService } from './task022ContentItemGovernanceService';

export class ContentGovernanceDiagnosticsService {
  getDiagnostics(): ContentGovernanceDiagnostics {
    const versionCount = curriculumVersioningService.getVersionCount();
    const approvedSources = approvedSourceRegistryService.getApprovedCount();
    const pendingReview = approvedSourceRegistryService.getPendingReviewCount();
    const blockedSources = approvedSourceRegistryService.getBlockedCount();
    const deprecatedSources = approvedSourceRegistryService.getDeprecatedCount();

    const gapSummary = contentGapDetectionService.getGapSummary();
    const eventCounts = contentGovernanceAuditService.getEventCountByType();

    const deenReferralCount = eventCounts['deen_referral_required'] || 0;
    const groundingSuccessCount = eventCounts['content_grounding_allowed'] || 0;
    const groundingFailureCount = eventCounts['content_grounding_denied'] || 0;

    return {
      activeCurriculumVersions: versionCount,
      approvedSourceCount: approvedSources,
      pendingReviewCount: pendingReview,
      contentGapsByType: gapSummary,
      blockedSourceCount: blockedSources,
      deprecatedSourceCount: deprecatedSources,
      deenReferralCountByCategory: [{ category: 'all', count: deenReferralCount }],
      contentGroundingSuccessCount: groundingSuccessCount,
      contentGroundingFailureCount: groundingFailureCount,
    };
  }

  getSafeSummary(): Record<string, unknown> {
    const diag = this.getDiagnostics();
    return {
      activeCurriculumVersions: diag.activeCurriculumVersions,
      approvedSourceCount: diag.approvedSourceCount,
      pendingReviewCount: diag.pendingReviewCount,
      contentGapsByType: diag.contentGapsByType.map(g => ({ gapType: g.gapType, count: g.count })),
      blockedSourceCount: diag.blockedSourceCount,
      deprecatedSourceCount: diag.deprecatedSourceCount,
      deenReferralCountByCategory: diag.deenReferralCountByCategory.map(c => ({ category: c.category, count: c.count })),
      contentGroundingSuccessCount: diag.contentGroundingSuccessCount,
      contentGroundingFailureCount: diag.contentGroundingFailureCount,
    };
  }
}

export const contentGovernanceDiagnosticsService = new ContentGovernanceDiagnosticsService();
