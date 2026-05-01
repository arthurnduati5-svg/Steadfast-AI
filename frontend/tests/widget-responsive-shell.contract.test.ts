import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Widget responsive shell contract', () => {
  it('keeps progressive compact navigation affordances across widget profiles', () => {
    const fullscreenShell = readRepoFile('frontend/components/copilot/fullscreen/FullscreenCopilotUI.tsx');

    expect(fullscreenShell).toContain('data-copilot-widget-shell');
    expect(fullscreenShell).toContain('data-copilot-surface-profile={effectiveSurfaceProfile}');
    expect(fullscreenShell).toContain('data-copilot-navigation-style={DEFAULT_WIDGET_NAVIGATION_STYLE}');
    expect(fullscreenShell).toContain('SheetContent side="bottom"');
    expect(fullscreenShell).toContain('copilot-widget-rail');
    expect(fullscreenShell).toContain('copilot-widget-rail-settings-slot');
    expect(fullscreenShell).toContain("{renderWorkspaceStage('widget', effectiveSurfaceProfile)}");
  });

  it('keeps the shared widget composer and chat surfaces container-aware', () => {
    const composer = readRepoFile('frontend/components/copilot/fullscreen/FullscreenComposer.tsx');
    const chatView = readRepoFile('frontend/components/copilot/fullscreen/FullscreenChatView.tsx');
    const inputBar = readRepoFile('frontend/components/chat-input-bar.tsx');

    expect(composer).toContain('data-copilot-surface-profile={resolvedSurfaceProfile}');
    expect(composer).toContain('overflow-x-auto');

    expect(chatView).toContain('data-copilot-surface-profile={surfaceProfile}');
    expect(chatView).toContain('max-w-[calc(100%-2.75rem)]');

    expect(inputBar).toContain('data-copilot-surface-kind={resolvedSurfaceKind}');
    expect(inputBar).toContain('data-copilot-surface-profile={resolvedSurfaceProfile}');
    expect(inputBar).toContain('supportsExternalRecentFilesSheet');
  });

  it('routes the in-app widget dialog through the shared shell implementation', () => {
    const copilot = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilot).toContain('shellVariant="widget"');
    expect(copilot).toContain('onSurfaceProfileChange={setWidgetSurfaceProfile}');
    expect(copilot).toContain("surfaceKind: isFullscreen ? 'fullscreen' : 'widget'");
    expect(copilot).toContain('surfaceProfile: isFullscreen ? \'expanded\' : widgetSurfaceProfile');
    expect(copilot).toContain('navigationStyle: DEFAULT_WIDGET_NAVIGATION_STYLE');
  });

  it('mirrors the widget surface contract through the external iframe launcher handshake', () => {
    const widgetLauncher = readRepoFile('frontend/components/CopilotWidget.tsx');

    expect(widgetLauncher).toContain("type: 'COPILOT_INIT'");
    expect(widgetLauncher).toContain("type: 'COPILOT_SURFACE_CONTRACT'");
    expect(widgetLauncher).toContain("surfaceKind: 'widget'");
    expect(widgetLauncher).toContain('surfaceProfile');
    expect(widgetLauncher).toContain('navigationStyle: DEFAULT_WIDGET_NAVIGATION_STYLE');
    expect(widgetLauncher).toContain('resolveCopilotSurfaceProfile(width)');
  });
});
