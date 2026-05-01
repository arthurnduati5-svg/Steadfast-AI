import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('highlight-to-composer contract', () => {
  it('captures selection metadata and range offsets from the floating action menu', () => {
    const selectionMenu = readRepoFile('frontend/components/copilot/SelectionActionMenu.tsx');

    expect(selectionMenu).toContain('function deriveSelectionRange(');
    expect(selectionMenu).toContain('sourceType: sourceElement?.getAttribute(\'data-selection-source-type\') || undefined');
    expect(selectionMenu).toContain('sourceDocumentId: sourceElement?.getAttribute(\'data-selection-document-id\') || undefined');
    expect(selectionMenu).toContain('selectionRange: selectionState.selectionRange');
  });

  it('shows removable selected-context preview in the composer', () => {
    const inputBar = readRepoFile('frontend/components/chat-input-bar.tsx');

    expect(inputBar).toContain('data-testid="composer-selected-context"');
    expect(inputBar).toContain('data-testid="composer-selected-context-clear"');
    expect(inputBar).toContain('inputPlaceholderOverride');
    expect(inputBar).toContain('focusSignal');
  });

  it('sends prepared selection context as structured tutorAction and clears it only on success', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain('const contextualTutorAction: TutorActionRequest | undefined =');
    expect(copilotTsx).toContain('tutorAction: contextualTutorAction,');
    expect(copilotTsx).toContain('selectionRange: preparedSelectionForSend.selectionRange');
    expect(copilotTsx).toContain('if (isCurrentRequest && requestSucceeded && usedPreparedSelectionContext) {');
  });
});

