import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const GROWTH_WORKSPACE_PATH = path.resolve(
  process.cwd(),
  'frontend/components/copilot/fullscreen/GrowthWorkspace.tsx'
);

describe('growth workspace section rendering contract', () => {
  const source = fs.readFileSync(GROWTH_WORKSPACE_PATH, 'utf8');

  it('loads growth snapshots for overview, weak topics, mistakes, plans, trends, and daily feed together', () => {
    expect(source).toContain('api.growth.getOverview().catch(() => null)');
    expect(source).toContain('api.growth.getWeakTopics().catch(() => null)');
    expect(source).toContain('api.growth.getMistakeJournal().catch(() => null)');
    expect(source).toContain('api.growth.getStudyPlans().catch(() => null)');
    expect(source).toContain('api.growth.getMasteryTrends().catch(() => null)');
    expect(source).toContain('api.growth.getDailyFeed()');

    expect(source).toContain('const validatedOverview = isGrowthOverviewResponse(overviewData) ? overviewData : null;');
    expect(source).toContain('const validatedWeakTopics = isGrowthWeakTopicsResponse(weakTopicsData) ? weakTopicsData : null;');
    expect(source).toContain('const validatedMistakeJournal = isGrowthMistakeJournalResponse(mistakeJournalData) ? mistakeJournalData : null;');
    expect(source).toContain('const validatedGrowthPlans = isGrowthStudyPlansResponse(growthPlansData) ? growthPlansData : null;');
    expect(source).toContain('const validatedMasteryTrends = isGrowthMasteryTrendsResponse(masteryTrendsData) ? masteryTrendsData : null;');
    expect(source).toContain('const validatedFeed = isGrowthDailyFeedSnapshot(feed) ? feed : null;');
    expect(source).toContain('const validatedFunnel = isGrowthActionFunnelSummary(funnel) ? funnel : null;');

    expect(source).toContain('setOverviewSnapshot(validatedOverview);');
    expect(source).toContain('setWeakTopicsSnapshot(validatedWeakTopics);');
    expect(source).toContain('setMistakeJournalSnapshot(validatedMistakeJournal);');
    expect(source).toContain('setStudyPlansSnapshot(validatedGrowthPlans);');
    expect(source).toContain('setMasteryTrendsSnapshot(validatedMasteryTrends);');
    expect(source).toContain('setGrowthFunnel(validatedFunnel || demoBundle.funnel);');
  });

  it('declares all growth sections and renders explicit active-section branches', () => {
    expect(source).toContain("{ id: 'overview', label: 'Overview'");
    expect(source).toContain("{ id: 'weak_topics', label: 'Weak topics'");
    expect(source).toContain("{ id: 'mistake_journal', label: 'Mistake journal'");
    expect(source).toContain("{ id: 'daily_feed', label: 'Daily feed'");
    expect(source).toContain("{ id: 'study_plans', label: 'Study plans'");
    expect(source).toContain("{ id: 'mastery_trends', label: 'Mastery trends'");

    expect(source).toContain("props.activeSection === 'overview' ? (");
    expect(source).toContain("props.activeSection === 'weak_topics' ? (");
    expect(source).toContain("props.activeSection === 'mistake_journal' ? (");
    expect(source).toContain("props.activeSection === 'daily_feed' ? (");
    expect(source).toContain("props.activeSection === 'study_plans' ? (");
    expect(source).toContain("props.activeSection === 'mastery_trends' ? (");
  });

  it('renders section-specific intelligence blocks and empty-state messaging paths', () => {
    expect(source).toContain('overviewSnapshot?.recommendedNextMove?.title');
    expect(source).toContain('overviewSnapshot?.dueNowQueue || []');
    expect(source).toContain('overviewSnapshot?.weakPatternSpotlight || []');
    expect(source).toContain('overviewSnapshot?.supportPatterns || []');

    expect(source).toContain('if (weakTopicsSnapshot?.items?.length) return weakTopicsSnapshot.items;');
    expect(source).toContain('No urgent weak topics right now');

    expect(source).toContain('mistakeJournalSnapshot?.patterns?.length');
    expect(source).toContain('No recurring mistake pattern is currently dominant.');

    expect(source).toContain('(dailyFeed?.items || []).length ? (');
    expect(source).toContain('Daily queue is warming up');

    expect(source).toContain('studyPlansSnapshot?.plans?.find((entry) => entry.id === plan.id)');
    expect(source).toContain('No plans yet');

    expect(source).toContain('masteryTrendsSnapshot.overall.status.replace');
    expect(source).toContain('masteryTrendsSnapshot?.topicTrends?.length');
  });
});
