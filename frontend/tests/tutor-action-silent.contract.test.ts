import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('silent tutor action contract', () => {
  it('keeps assistant-card actions hidden while routing highlighted ask into composer context', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain('displayUserMessage?: boolean;');
    expect(copilotTsx).toContain('persistUserMessage?: boolean;');
    expect(copilotTsx).toContain('const shouldDisplayUserMessage = options?.displayUserMessage !== false;');
    expect(copilotTsx).toContain('const shouldPersistUserMessage = options?.persistUserMessage !== false;');
    expect(copilotTsx).toContain('displayUserMessage: false,');
    expect(copilotTsx).toContain('persistUserMessage: false,');
    expect(copilotTsx).toContain('buildHiddenTutorActionPrompt(');
    expect(copilotTsx).toContain('if (action === \'ask\') {');
    expect(copilotTsx).toContain('setPreparedSelectionContext(nextPreparedSelectionContext);');
    expect(copilotTsx).toContain('setComposerFocusSignal((prev) => prev + 1);');
    expect(copilotTsx).toContain("composerIntent: 'selection_context_ask'");
    expect(copilotTsx).toContain('const contextualTutorAction: TutorActionRequest | undefined =');
    expect(copilotTsx).toContain("invokedFrom: 'composer'");
    expect(copilotTsx).not.toContain('Ask Steadfast AI for help with this highlighted text:');
  });

  it('filters historical synthetic tutor-action prompts out of loaded sessions', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain('function isSyntheticTutorActionMessage(message: Message | null | undefined): boolean');
    expect(copilotTsx).toContain('.filter((message: Message) => !isSyntheticTutorActionMessage(message))');
    expect(copilotTsx).toContain("Continue from Practice Pad. Ask me one short question for the next step, then wait for my attempt.");
  });
});
