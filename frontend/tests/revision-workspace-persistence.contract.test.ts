import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function countOccurrences(source: string, token: string): number {
  return (source.match(new RegExp(escapeRegExp(token), 'g')) || []).length;
}

describe('Revision workspace state persistence contract', () => {
  it('keeps revision search + collection + item selection shared across compact and expanded workspace views', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain("const [revisionSearchQuery, setRevisionSearchQuery] = useState('')");
    expect(copilotTsx).toContain(
      'const [selectedRevisionCollection, setSelectedRevisionCollection] = useState<RevisionCollection | null>(null);'
    );
    expect(copilotTsx).toContain(
      'const [selectedRevisionItemId, setSelectedRevisionItemId] = useState<string | null>(null);'
    );

    expect(countOccurrences(copilotTsx, 'searchQuery={revisionSearchQuery}')).toBeGreaterThanOrEqual(3);
    expect(countOccurrences(copilotTsx, 'selectedCollection={selectedRevisionCollection}')).toBeGreaterThanOrEqual(3);
    expect(countOccurrences(copilotTsx, 'selectedItemId={selectedRevisionItemId}')).toBeGreaterThanOrEqual(3);
    expect(countOccurrences(copilotTsx, 'onSelectItemId={setSelectedRevisionItemId}')).toBeGreaterThanOrEqual(3);

    expect(copilotTsx).toContain('open={isOpen && isRevisionWorkspaceOpen}');
    expect(copilotTsx).toContain('onClose={() => setIsRevisionWorkspaceOpen(false)}');
  });

  it('captures and restores fullscreen revision workspace scroll state', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');

    expect(copilotTsx).toContain(
      'const [revisionWorkspaceScrollState, setRevisionWorkspaceScrollState] = useState<RevisionWorkspaceScrollState>({'
    );
    expect(copilotTsx).toContain('workspaceScrollState={revisionWorkspaceScrollState}');
    expect(copilotTsx).toContain('onWorkspaceScrollStateChange={setRevisionWorkspaceScrollState}');

    expect(revisionTabTsx).toContain('workspaceScrollState?: RevisionWorkspaceScrollState | null;');
    expect(revisionTabTsx).toContain(
      'onWorkspaceScrollStateChange?: (state: RevisionWorkspaceScrollState) => void;'
    );
    expect(revisionTabTsx).toContain('const workspaceLibraryRef = React.useRef<HTMLDivElement | null>(null);');
    expect(revisionTabTsx).toContain('const workspaceDetailRef = React.useRef<HTMLDivElement | null>(null);');
    expect(revisionTabTsx).toContain("if (layoutMode !== 'workspace' || !workspaceScrollState) return;");
    expect(revisionTabTsx).toContain('const target = workspaceScrollState.libraryScrollTop || 0;');
    expect(revisionTabTsx).toContain('const target = workspaceScrollState.detailScrollTop || 0;');
    expect(revisionTabTsx).toContain('Math.abs(workspaceLibraryRef.current.scrollTop - target) > 1');
    expect(revisionTabTsx).toContain('Math.abs(workspaceDetailRef.current.scrollTop - target) > 1');
    expect(countOccurrences(revisionTabTsx, 'onScroll={emitWorkspaceScrollState}')).toBeGreaterThanOrEqual(2);
  });

  it('keeps note-mutation callbacks wired across compact and fullscreen revision surfaces', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');
    const fullscreenTsx = readRepoFile('frontend/components/copilot/fullscreen/FullscreenCopilotUI.tsx');

    expect(countOccurrences(copilotTsx, 'onUpdateItem={handleUpdateRevisionItem}')).toBeGreaterThanOrEqual(2);
    expect(countOccurrences(copilotTsx, 'onUpdateItemsBatch={handleUpdateRevisionItemsBatch}')).toBeGreaterThanOrEqual(2);
    expect(countOccurrences(copilotTsx, 'onDeleteItem={handleDeleteRevisionItem}')).toBeGreaterThanOrEqual(2);
    expect(countOccurrences(copilotTsx, 'onUpdateCollection={handleUpdateRevisionCollection}')).toBeGreaterThanOrEqual(2);

    expect(fullscreenTsx).toContain('onUpdateItem={props.onUpdateRevisionItem}');
    expect(fullscreenTsx).toContain('onUpdateItemsBatch={props.onUpdateRevisionItemsBatch}');
    expect(fullscreenTsx).toContain('onDeleteItem={props.onDeleteRevisionItem}');
    expect(fullscreenTsx).toContain('onUpdateCollection={props.onUpdateRevisionCollection}');
  });

  it('keeps workspace filters global and shows note headers as subject tag plus notebook name', () => {
    const revisionTabTsx = readRepoFile('frontend/components/revision-tab.tsx');
    const globalsCss = readRepoFile('frontend/app/globals.css');

    expect(revisionTabTsx).toContain('const workspaceFilterBaseItems = allWorkspaceItems;');
    expect(revisionTabTsx).toContain("return normalized ? 'general' : null;");
    expect(revisionTabTsx).toContain("if (token === 'general') return 'General';");
    expect(revisionTabTsx).toContain('const workspaceNoteBreadcrumbs = React.useMemo(');
    expect(revisionTabTsx).toContain('label: workspaceNoteNotebookLabel,');
    expect(revisionTabTsx).toContain('breadcrumbSubjectLabel={workspaceNoteSubjectLabel}');
    expect(revisionTabTsx).toContain('breadcrumbs={workspaceNoteBreadcrumbs}');
    expect(revisionTabTsx).toContain('Matching notes');
    expect(revisionTabTsx).toContain('Keep this note open while you filter for the next one you want to review.');
    expect(globalsCss).toContain('.copilot-revision-breadcrumb-subject-tag');
  });
});
