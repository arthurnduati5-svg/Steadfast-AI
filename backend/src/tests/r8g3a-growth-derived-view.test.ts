import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

// R8-G.3A Growth — DERIVED_VIEW classification proof.
// The /api/phase3/growth-page chain must not own Growth* canonical truth:
// no file in the route closure may reference the five Growth* Prisma
// models, and the canonical Growth* writer service must stay outside
// this route's import closure.
const SRC = path.resolve(__dirname, '..');
const GROWTH_MODELS = [
  'GrowthMasteryTrendState',
  'GrowthMistakePatternState',
  'GrowthProofRecord',
  'GrowthRecommendationState',
  'GrowthWeakTopicState',
];
const CHAIN_FILES = [
  'routes/phase3GrowthPageRoutes.ts',
  'services/phase3GrowthPageLearnerResponseService.ts',
  'services/phase3GrowthPageTeacherOverviewService.ts',
  'services/phase3GrowthPageDueNowService.ts',
  'services/phase3WeakTopicLaneService.ts',
  'services/phase3MistakeJournalReadModelService.ts',
  'services/phase3WhatHelpsMeLearnBestService.ts',
  'services/phase3GrowthPageAuditService.ts',
  'services/phase3GrowthPageReadModelService.ts',
  'services/phase3GrowthPageRepository.ts',
  'services/phase3GrowthPageDailyFeedAdapterService.ts',
  'services/phase3GrowthPageStudyPlanAdapterService.ts',
  'services/phase3GrowthPageEvidenceAdapterService.ts',
];

describe('R8-G.3A growth-page derived-view contract', () => {
  it('no growth-page chain file references any Growth* canonical model', () => {
    for (const rel of CHAIN_FILES) {
      const content = fs.readFileSync(path.join(SRC, rel), 'utf-8');
      for (const model of GROWTH_MODELS) {
        expect(content, `${rel} must not reference ${model}`).not.toContain(model);
      }
    }
  });

  it('growth-page route does not import the canonical Growth* writer service', () => {
    const route = fs.readFileSync(path.join(SRC, 'routes/phase3GrowthPageRoutes.ts'), 'utf-8');
    expect(route).not.toContain('growthIntelligenceService');
  });

  it('growth-page read model aggregates safe signals (feed/plan/evidence adapters)', () => {
    const readModel = fs.readFileSync(
      path.join(SRC, 'services/phase3GrowthPageReadModelService.ts'),
      'utf-8',
    );
    expect(readModel).toContain('DailyFeed');
    expect(readModel).toContain('StudyPlan');
  });
});
