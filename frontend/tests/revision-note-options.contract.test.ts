import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Revision note options contract', () => {
  it('keeps three-dot actions available on preview cards and notebook chapter cards', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('aria-label={`Note options for ${item.title}`}');
    expect(revisionTabTsx).toContain('aria-label={`Actions for ${item.title}`}');
    expect(revisionTabTsx).toContain('Note options');
    expect(revisionTabTsx).toContain('Note actions');
    expect(revisionTabTsx).toContain('Quick notes (');
    expect(revisionTabTsx).toContain('Move note');
    expect(revisionTabTsx).toContain('Start slideshow here');
  });

  it('tracks slideshow launch context and supports note-origin slideshow starts', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('const [notebookSlideshowDocumentId, setNotebookSlideshowDocumentId] = React.useState<string | null>(null);');
    expect(revisionTabTsx).toContain('const [notebookSlideshowNoteIds, setNotebookSlideshowNoteIds] = React.useState<string[]>([]);');
    expect(revisionTabTsx).toContain('const [notebookSlideshowStartNoteId, setNotebookSlideshowStartNoteId] = React.useState<string | null>(null);');
    expect(revisionTabTsx).toContain('const [notebookSlideshowSource, setNotebookSlideshowSource] = React.useState<NotebookSlideshowSource | null>(null);');
    expect(revisionTabTsx).toContain('const handleStartNotebookSlideshowFromItem = React.useCallback(');
    expect(revisionTabTsx).toContain('source: \'note_menu\'');
    expect(revisionTabTsx).toContain('if (event.key === \'Home\')');
    expect(revisionTabTsx).toContain('if (event.key === \'End\')');
  });

  it('supports quick-note persistence and ordering operations from the options flow', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('const handleAddQuickNote = React.useCallback(async () => {');
    expect(revisionTabTsx).toContain('const handleRemoveQuickNote = React.useCallback(async (');
    expect(revisionTabTsx).toContain('const handleReorderQuickNote = React.useCallback(async (');
    expect(revisionTabTsx).toContain('[REVISION_QUICK_NOTES_KEY]: nextQuickNotes');
    expect(revisionTabTsx).toContain('No quick notes yet. Add your first one below.');
    expect(revisionTabTsx).toContain('Up');
    expect(revisionTabTsx).toContain('Down');
  });

  it('surfaces actionable UI feedback for move, reorder, and destructive notebook actions', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('const [notebookMoveError, setNotebookMoveError] = React.useState(\'\');');
    expect(revisionTabTsx).toContain('const [notebookOrderError, setNotebookOrderError] = React.useState(\'\');');
    expect(revisionTabTsx).toContain('const [notebookDeleteError, setNotebookDeleteError] = React.useState(\'\');');
    expect(revisionTabTsx).toContain('const [quickNotesError, setQuickNotesError] = React.useState(\'\');');
    expect(revisionTabTsx).toContain('const [singleMoveError, setSingleMoveError] = React.useState(\'\');');
  });

  it('shows per-notebook file counts on preview cards when a note belongs to a notebook', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('const collectionItemCountByCollectionId = React.useMemo(() => {');
    expect(revisionTabTsx).toContain("file${collectionItemCount === 1 ? '' : 's'}");
    expect(revisionTabTsx).toContain(
      'collectionItemCount={item.collectionId ? collectionItemCountByCollectionId.get(item.collectionId) || 0 : 0}'
    );
  });

  it('keeps preview-card dates clear of the floating options trigger', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');
    const globalsCss = readRepoFile('frontend/app/globals.css');

    expect(revisionTabTsx).toContain("data-has-quick-actions={hasQuickActions ? 'true' : 'false'}");
    expect(globalsCss).toContain(".copilot-revision-preview-card-date[data-has-quick-actions='true']");
    expect(globalsCss).toContain('margin-inline-end: 2.35rem;');
  });

  it('keeps focus-note position near the title and uses chevron icon navigation controls', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('className="copilot-revision-note-meta-main"');
    expect(revisionTabTsx).toContain('copilot-revision-breadcrumb-badge');
    expect(revisionTabTsx).toContain('aria-label="Navigate notebooks"');
    expect(revisionTabTsx).toContain('copilot-revision-note-nav-icon-btn');
    expect(revisionTabTsx).toContain('aria-label={`Previous note (${navigation.currentIndex + 1} of ${navigation.total})`}');
    expect(revisionTabTsx).toContain('aria-label={`Next note (${navigation.currentIndex + 1} of ${navigation.total})`}');
    expect(revisionTabTsx).toContain('aria-label={`Previous notebook (${notebookNavigation.currentIndex + 1} of ${notebookNavigation.total})`}');
    expect(revisionTabTsx).toContain('aria-label={`Next notebook (${notebookNavigation.currentIndex + 1} of ${notebookNavigation.total})`}');
    expect(revisionTabTsx).toContain('const selectedItemNavigationItems = React.useMemo(() => {');
    expect(revisionTabTsx).toContain('if (!selectedItem.collectionId) return [selectedItem];');
    expect(revisionTabTsx).toContain('allWorkspaceItems.filter((entry) => entry.collectionId === selectedItem.collectionId)');
  });

  it('returns Back to notebook to the remembered notebook entry note instead of the summary fallback view', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(revisionTabTsx).toContain('const notebookEntryItemIdByCollectionRef = React.useRef<Record<string, string>>({});');
    expect(revisionTabTsx).toContain('const notebookBrowseOriginRef = React.useRef<{');
    expect(revisionTabTsx).toContain("mode: 'browse' | 'return';");
    expect(revisionTabTsx).toContain('const showBackToNotebookOrigin = Boolean(');
    expect(revisionTabTsx).toContain('notebookBrowseOriginRef.current.collectionId !== selectedCollection.id');
    expect(revisionTabTsx).toContain('const handleReturnToNotebookEntry = React.useCallback(() => {');
    expect(revisionTabTsx).toContain('const targetCollectionId = notebookBrowseOriginRef.current?.collectionId || selectedCollection.id;');
    expect(revisionTabTsx).toContain('navigateToNotebookCollectionAndItem(targetCollectionId, targetItemId, \'return\');');
    expect(revisionTabTsx).toContain('showBackToNotebookOrigin');
    expect(revisionTabTsx).toContain("? handleReturnToNotebookEntry\n                : undefined");
    expect(revisionTabTsx).toContain("backToCollectionLabel={showBackToNotebookOrigin ? 'Back to notebook' : undefined}");
    expect(revisionTabTsx).not.toContain("selectedCollection\n                ? () => {\n                    setEffectiveSelectedItemId(null);");
  });
});
