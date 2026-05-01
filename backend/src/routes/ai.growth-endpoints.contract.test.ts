import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const AI_ROUTE_PATH = path.resolve(process.cwd(), 'backend/src/routes/ai.ts');

describe('ai growth endpoints wiring contract', () => {
  const source = fs.readFileSync(AI_ROUTE_PATH, 'utf8');

  it('imports growth intelligence service handlers for overview, weak topics, mistakes, plans, and trends', () => {
    expect(source).toContain('getGrowthOverview');
    expect(source).toContain('getGrowthWeakTopics');
    expect(source).toContain('getGrowthMistakeJournal');
    expect(source).toContain('getGrowthStudyPlans');
    expect(source).toContain('getGrowthMasteryTrends');
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
      expect(source).toMatch(new RegExp(`router\\.get\\('${escaped}',\\s*schoolAuthMiddleware,`));
    }
  });

  it('passes authenticated user id and normalized optional subject to each growth intelligence handler', () => {
    expect(source).toMatch(
      /await getGrowthOverview\(req\.user!\.id,\s*safeString\(req\.query\?\.subject\)\.trim\(\)\s*\|\|\s*null\)/
    );
    expect(source).toMatch(
      /await getGrowthWeakTopics\(req\.user!\.id,\s*safeString\(req\.query\?\.subject\)\.trim\(\)\s*\|\|\s*null\)/
    );
    expect(source).toMatch(
      /await getGrowthMistakeJournal\(req\.user!\.id,\s*safeString\(req\.query\?\.subject\)\.trim\(\)\s*\|\|\s*null\)/
    );
    expect(source).toMatch(
      /await getGrowthStudyPlans\(req\.user!\.id,\s*safeString\(req\.query\?\.subject\)\.trim\(\)\s*\|\|\s*null\)/
    );
    expect(source).toMatch(
      /await getGrowthMasteryTrends\(req\.user!\.id,\s*safeString\(req\.query\?\.subject\)\.trim\(\)\s*\|\|\s*null\)/
    );
  });
});
