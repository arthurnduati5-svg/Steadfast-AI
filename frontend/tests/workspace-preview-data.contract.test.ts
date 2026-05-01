import { describe, expect, it } from 'vitest';
import {
  buildWorkspacePreviewPreload,
  getWorkspacePreviewHistoryPage,
  getWorkspacePreviewSession,
  mergeMetacognitiveProfileWithPreview,
} from '@/lib/workspace-preview-data';

describe('Workspace preview data contract', () => {
  it('backfills empty preload payloads with rich preview history and revision data', () => {
    const preload = buildWorkspacePreviewPreload({
      ready: true,
      studentId: '',
      lastSession: null,
      revisionOverview: null,
      history: [],
    });

    expect(preload.history.length).toBeGreaterThan(0);
    expect(preload.revisionOverview).toBeTruthy();
    expect(preload.revisionOverview?.totalItems).toBeGreaterThan(0);
    expect(preload.lastSession).toBeNull();
  });

  it('returns paginated preview history and full session detail for demo sessions', () => {
    const page = getWorkspacePreviewHistoryPage({ page: 1, limit: 4 });

    expect(page.sessions).toHaveLength(4);
    expect(page.pagination.totalPages).toBeGreaterThan(1);

    const firstSession = getWorkspacePreviewSession(page.sessions[0]?.id);
    expect(firstSession).toBeTruthy();
    expect(firstSession?.messages?.length || 0).toBeGreaterThan(0);
  });

  it('merges live metacognitive data with preview patterns when the profile is sparse', () => {
    const merged = mergeMetacognitiveProfileWithPreview({
      recurringErrorPatterns: ['Graph scaling slips'],
      preferredSupportPatterns: ['Worked example first'],
    });

    expect(merged.recurringErrorPatterns).toContain('Graph scaling slips');
    expect(merged.recurringErrorPatterns?.length || 0).toBeGreaterThan(1);
    expect(merged.preferredSupportPatterns).toContain('Worked example first');
    expect(merged.recentSnapshot).toBeTruthy();
  });
});
