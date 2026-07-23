import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GROWTH_ROUTE_PATH = path.resolve(__dirname, 'ai/ai-growth.routes.ts');
const HUB_ROUTE_PATH = path.resolve(__dirname, 'ai.ts');

describe('ai growth endpoints wiring contract', () => {
  const hubSource = fs.readFileSync(HUB_ROUTE_PATH, 'utf8');
  const growthSource = fs.readFileSync(GROWTH_ROUTE_PATH, 'utf8');

  it('hub imports growth intelligence service handlers for overview, weak topics, mistakes, plans, and trends', () => {
    expect(hubSource).toContain('getGrowthOverview');
    expect(hubSource).toContain('getGrowthWeakTopics');
    expect(hubSource).toContain('getGrowthMistakeJournal');
    expect(hubSource).toContain('getGrowthStudyPlans');
    expect(hubSource).toContain('getGrowthMasteryTrends');
  });

  it('exposes all growth intelligence GET routes behind school auth middleware', () => {
    const expectedRoutes = [
      '/growth/overview',
      '/growth/weak-topics',
      '/growth/mistake-journal',
      '/growth/study-plans',
      '/growth/mastery-trends',
    ];

    for (const route of expectedRoutes) {
      const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      expect(growthSource).toMatch(new RegExp(`router\\.get\\('${escaped}',\\s*schoolAuthMiddleware,`));
    }
  });

  it('passes authenticated user id to each growth intelligence handler', () => {
    expect(growthSource).toMatch(
      /getGrowthOverview\(req\.user!\.id\)/
    );
    expect(growthSource).toMatch(
      /getGrowthWeakTopics\(req\.user!\.id\)/
    );
    expect(growthSource).toMatch(
      /getGrowthMistakeJournal\(req\.user!\.id\)/
    );
    expect(growthSource).toMatch(
      /getGrowthStudyPlans\(req\.user!\.id\)/
    );
    expect(growthSource).toMatch(
      /getGrowthMasteryTrends\(req\.user!\.id\)/
    );
  });
});
