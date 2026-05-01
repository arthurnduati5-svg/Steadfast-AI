import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

function getCssRule(css: string, selector: string): string {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ruleRegex = new RegExp(`${escapedSelector}\\s*\\{([\\s\\S]*?)\\}`, 'm');
  const match = css.match(ruleRegex);
  if (!match?.[1]) {
    throw new Error(`Missing CSS rule for selector: ${selector}`);
  }
  return match[1];
}

describe('Copilot message overflow contract', () => {
  it('keeps markdown and code blocks constrained inside bubbles', () => {
    const globalsCss = readRepoFile('frontend/app/globals.css');

    const markdownBubbleRule = getCssRule(globalsCss, '.markdown-bubble');
    expect(markdownBubbleRule).toContain('width: 100%');
    expect(markdownBubbleRule).toContain('overflow-x: hidden');
    expect(markdownBubbleRule).toContain('overflow-wrap: anywhere');
    expect(markdownBubbleRule).toContain('word-break: break-word');

    const preScrollRule = getCssRule(globalsCss, '.md-pre-scroll');
    expect(preScrollRule).toContain('overflow-x: hidden');
    expect(preScrollRule).toContain('white-space: pre-wrap');
    expect(preScrollRule).toContain('overflow-wrap: anywhere');
    expect(preScrollRule).toContain('word-break: break-word');

    const preScrollCodeRule = getCssRule(globalsCss, '.md-pre-scroll code');
    expect(preScrollCodeRule).toContain('white-space: inherit');
    expect(preScrollCodeRule).toContain('overflow-wrap: anywhere');
    expect(preScrollCodeRule).toContain('word-break: break-word');

    const inlineCodeRule = getCssRule(globalsCss, '.md-inline-code');
    expect(inlineCodeRule).toContain('white-space: break-spaces');
    expect(inlineCodeRule).toContain('overflow-wrap: anywhere');
  });

  it('keeps compact copilot bubble width guardrails for small screens', () => {
    const chatTabTsx = readRepoFile('frontend/components/chat-tab.tsx');

    expect(chatTabTsx).toContain('flex items-start gap-3 w-full min-w-0');
    expect(chatTabTsx).toContain('[overflow-wrap:anywhere]');
    expect(chatTabTsx).toContain('overflow-hidden');
    expect(chatTabTsx).toContain('max-w-[calc(100%-2.75rem)] md:max-w-[75%]');
  });

  it('keeps fullscreen bubble width guardrails for small screens', () => {
    const fullscreenChatTsx = readRepoFile('frontend/components/copilot/fullscreen/FullscreenChatView.tsx');

    expect(fullscreenChatTsx).toContain('[overflow-wrap:anywhere]');
    expect(fullscreenChatTsx).toContain('overflow-hidden max-w-[calc(100%-2.75rem)] md:max-w-[70%]');
  });
});

