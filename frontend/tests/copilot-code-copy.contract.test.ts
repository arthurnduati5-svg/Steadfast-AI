import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Copilot code copy contract', () => {
  it('keeps inline code copy controls wired in compact and fullscreen chat', () => {
    const chatTabTsx = readRepoFile('frontend/components/chat-tab.tsx');
    const fullscreenChatTsx = readRepoFile('frontend/components/copilot/fullscreen/FullscreenChatView.tsx');

    expect(chatTabTsx).toContain('const CopyableInlineCode');
    expect(chatTabTsx).toContain('aria-label="Copy inline code"');
    expect(chatTabTsx).toContain('<CopyableInlineCode');

    expect(fullscreenChatTsx).toContain('const CopyableInlineCode');
    expect(fullscreenChatTsx).toContain('aria-label="Copy inline code"');
    expect(fullscreenChatTsx).toContain('<CopyableInlineCode');
  });

  it('keeps shared inline copy button styles available', () => {
    const globalsCss = readRepoFile('frontend/app/globals.css');

    expect(globalsCss).toContain('.md-inline-code-wrap');
    expect(globalsCss).toContain('.md-inline-copy-btn');
  });
});

