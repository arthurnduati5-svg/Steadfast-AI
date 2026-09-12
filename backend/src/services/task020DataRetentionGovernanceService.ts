// ─────────────────────────────────────────────────────────────
// Steadfast AI — Task 020 Data Retention Governance Service v1
// Provides retention category decisions per data category.
// ─────────────────────────────────────────────────────────────

import type {
  DataCategory,
  RetentionCategory,
  RetentionDecision,
  RetentionSummaryEntry,
} from '../contracts/task020GovernanceContracts';
import { dataClassificationRegistryService } from './task020DataClassificationRegistryService';

const RETENTION_METADATA: Record<RetentionCategory, {
  recommendedRetention: string;
  deleteEligible: boolean;
  exportEligible: boolean;
  requiresRedaction: boolean;
  requiresSafeguardingReview: boolean;
}> = {
  active_learning: {
    recommendedRetention: 'until_session_completion_plus_30_days',
    deleteEligible: true,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  long_term_learning_evidence: {
    recommendedRetention: 'academic_year_plus_1_year',
    deleteEligible: true,
    exportEligible: true,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  safe_memory_summary: {
    recommendedRetention: 'academic_year_plus_1_year',
    deleteEligible: true,
    exportEligible: true,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  conversation_archive: {
    recommendedRetention: 'academic_year_plus_30_days',
    deleteEligible: true,
    exportEligible: false,
    requiresRedaction: true,
    requiresSafeguardingReview: true,
  },
  operational_audit: {
    recommendedRetention: '1_year',
    deleteEligible: false,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  security_audit: {
    recommendedRetention: '3_years',
    deleteEligible: false,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  safeguarding_restricted: {
    recommendedRetention: '7_years',
    deleteEligible: false,
    exportEligible: false,
    requiresRedaction: true,
    requiresSafeguardingReview: true,
  },
  diagnostic_telemetry: {
    recommendedRetention: '90_days',
    deleteEligible: true,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  idempotency_short_lived: {
    recommendedRetention: '24_hours',
    deleteEligible: true,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
  rate_limit_short_lived: {
    recommendedRetention: '1_hour',
    deleteEligible: true,
    exportEligible: false,
    requiresRedaction: false,
    requiresSafeguardingReview: false,
  },
};

export class DataRetentionGovernanceService {
  getRetentionDecision(category: DataCategory): RetentionDecision {
    const classification = dataClassificationRegistryService.getClassification(category);
    if (!classification) {
      return {
        category: 'security_audit',
        recommendedRetention: 'deny_default',
        deleteEligible: false,
        exportEligible: false,
        requiresRedaction: true,
        requiresSafeguardingReview: false,
        reasonCodes: ['unknown-category-denied-default'],
      };
    }

    const meta = RETENTION_METADATA[classification.retentionCategory];
    if (!meta) {
      return {
        category: classification.retentionCategory,
        recommendedRetention: 'unknown',
        deleteEligible: false,
        exportEligible: false,
        requiresRedaction: true,
        requiresSafeguardingReview: false,
        reasonCodes: ['unknown-retention-category'],
      };
    }

    return {
      category: classification.retentionCategory,
      recommendedRetention: meta.recommendedRetention,
      deleteEligible: meta.deleteEligible,
      exportEligible: meta.exportEligible,
      requiresRedaction: meta.requiresRedaction,
      requiresSafeguardingReview: meta.requiresSafeguardingReview,
      reasonCodes: [`retention:${classification.retentionCategory}`],
    };
  }

  getAllRetentionDecisions(): RetentionDecision[] {
    const categories = dataClassificationRegistryService.getAllCategories();
    return categories.map(cat => this.getRetentionDecision(cat));
  }

  getRetentionSummary(): RetentionSummaryEntry[] {
    const summaries: RetentionSummaryEntry[] = [];
    for (const [retCat, meta] of Object.entries(RETENTION_METADATA)) {
      const dataCats = dataClassificationRegistryService
        .getAllCategories()
        .filter(cat => dataClassificationRegistryService.getRetentionCategory(cat) === retCat);
      summaries.push({
        category: retCat as RetentionCategory,
        recommendedRetention: meta.recommendedRetention,
        deleteEligible: meta.deleteEligible,
        exportEligible: meta.exportEligible,
        requiresRedaction: meta.requiresRedaction,
        requiresSafeguardingReview: meta.requiresSafeguardingReview,
        dataCategories: dataCats,
      });
    }
    return summaries;
  }

  getRetentionMetadataForCategory(retCat: RetentionCategory) {
    return RETENTION_METADATA[retCat] || null;
  }
}

export const dataRetentionGovernanceService = new DataRetentionGovernanceService();
