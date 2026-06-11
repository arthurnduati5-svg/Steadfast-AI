import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Copilot dark-mode toggle contract', () => {
  it('keeps a dedicated dark-mode switch in preferences', () => {
    const preferencesForm = readRepoFile('frontend/components/copilot/PreferencesForm.tsx');

    expect(preferencesForm).toContain('Chat Theme');
    expect(preferencesForm).toContain('Copilot-only. Does not change school system theme.');
    expect(preferencesForm).toContain('chatDarkModeEnabled');
    expect(preferencesForm).toContain('onChatDarkModeChange');
  });

  it('persists copilot theme locally and scopes it to copilot UI', () => {
    const steadfastCopilot = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(steadfastCopilot).toContain("const COPILOT_THEME_STORAGE_KEY = 'copilot:theme'");
    expect(steadfastCopilot).toContain('window.localStorage.getItem(COPILOT_THEME_STORAGE_KEY)');
    expect(steadfastCopilot).toContain('window.localStorage.setItem(COPILOT_THEME_STORAGE_KEY, copilotTheme)');
    expect(steadfastCopilot).toContain('copilot-theme-scope');
    expect(steadfastCopilot).toContain('copilot-theme-dark');
  });

  it('defines standalone theme scope variables in steadfast-default.css', () => {
    const themeCss = readRepoFile('frontend/styles/themes/steadfast-default.css');

    expect(themeCss).toContain('.copilot-theme-scope');
    expect(themeCss).toContain('.copilot-theme-scope.copilot-theme-dark');
  });

  it('defines app-level tokens in app-tokens.css', () => {
    const appTokens = readRepoFile('frontend/styles/foundations/app-tokens.css');

    expect(appTokens).toContain('--sf-cream-bg');
    expect(appTokens).toContain('--background');
  });

  it('defines copilot component styles in the extracted CSS files', () => {
    const chatCss = readRepoFile('frontend/styles/copilot/copilot-chat.css');
    expect(chatCss).toContain('--copilot-user-bubble-bg');
    expect(chatCss).toContain('.copilot-user-bubble');

    const markdownCss = readRepoFile('frontend/styles/copilot/copilot-markdown.css');
    expect(markdownCss).toContain('--copilot-chat-text');
    expect(markdownCss).toContain('--copilot-input-text');
    expect(markdownCss).toContain('.copilot-md-link');
  });

  it('uses copilot-specific bubble and link styles for chat readability', () => {
    const compactChat = readRepoFile('frontend/components/chat-tab.tsx');
    const fullscreenChat = readRepoFile('frontend/components/copilot/fullscreen/FullscreenChatView.tsx');
    const fullscreenComposer = readRepoFile('frontend/components/copilot/fullscreen/FullscreenComposer.tsx');

    expect(compactChat).toContain('copilot-user-bubble');
    expect(compactChat).toContain('copilot-assistant-bubble');
    expect(compactChat).toContain('copilot-md-link');
    expect(fullscreenChat).toContain('copilot-user-bubble');
    expect(fullscreenChat).toContain('copilot-assistant-text');
    expect(fullscreenChat).toContain('prose-p:text-inherit');
    expect(fullscreenComposer).toContain('var(--copilot-input-text)');
    expect(fullscreenComposer).toContain('var(--copilot-input-placeholder)');
  });
});
