import { describe, expect, it } from 'vitest';
import {
  getRevisionPreviewCollectionDetail,
  getRevisionPreviewOverview,
  isPreviewRevisionEntityId,
} from '@/lib/revision-preview-data';

describe('Revision preview fallback contract', () => {
  it('returns sample overview content for the revision workspace', () => {
    const overview = getRevisionPreviewOverview();

    expect(overview.totalItems).toBeGreaterThan(0);
    expect(overview.totalCollections).toBeGreaterThan(0);
    expect(overview.collections[0]?.id).toMatch(/^preview-/);
    expect(overview.recentItems.length).toBeGreaterThan(0);
    expect(overview.queuePreview?.dueNow.length || 0).toBeGreaterThan(0);
    expect(overview.queuePreview?.needsAttention.length || 0).toBeGreaterThan(0);
    expect(overview.queuePreview?.recentlyImproved.length || 0).toBeGreaterThan(0);
  });

  it('returns sample collection detail for preview collections', () => {
    const overview = getRevisionPreviewOverview();
    const firstCollection = overview.collections[0];
    expect(firstCollection).toBeTruthy();

    const detail = getRevisionPreviewCollectionDetail(firstCollection.id);
    expect(detail).toBeTruthy();
    expect(detail?.items.length).toBeGreaterThan(0);
    expect(isPreviewRevisionEntityId(detail?.collection.id)).toBe(true);
    expect(detail?.items.every((item) => isPreviewRevisionEntityId(item.id))).toBe(true);
  });

  it('includes a multi-note UI refinement notebook for card-density regression checks', () => {
    const detail = getRevisionPreviewCollectionDetail('preview-col-ui-refinement');
    expect(detail).toBeTruthy();
    expect(detail?.collection.title).toBe('Revision UI refinement lab');
    expect(detail?.collection.itemCount).toBeGreaterThanOrEqual(4);
    expect(detail?.items.length).toBeGreaterThanOrEqual(4);
    expect(detail?.items.every((item) => item.collectionId === 'preview-col-ui-refinement')).toBe(true);
  });
});
