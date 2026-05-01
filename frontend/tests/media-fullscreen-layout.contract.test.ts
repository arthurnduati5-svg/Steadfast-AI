import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8').replace(/\r\n/g, '\n');
}

describe('Media fullscreen layout contract', () => {
  it('keeps fullscreen media height owned by the shell instead of viewport math', () => {
    const globalsCss = readRepoFile('frontend/app/globals.css');
    const studyStreamModuleCss = readRepoFile('frontend/components/copilot/fullscreen/StudyStreamSurface.module.css');
    const fullscreenUi = readRepoFile('frontend/components/copilot/fullscreen/FullscreenCopilotUI.tsx');

    expect(globalsCss).toContain(".copilot-workspace-scroll.copilot-media-stream-shell {\n  display: flex;");
    expect(globalsCss).toContain('  height: 100%;');
    expect(globalsCss).toContain('  min-height: 0;');
    expect(globalsCss).toContain(".copilot-workspace-scroll.copilot-media-stream-shell[data-stream-window='fullscreen'][data-stream-tier='desktop'] {");
    expect(globalsCss).toContain("  overflow-y: hidden;");
    expect(globalsCss).toContain(".copilot-workspace-scroll.copilot-media-stream-shell[data-stream-window='fullscreen'][data-stream-tier='laptop'] {");
    expect(globalsCss).toContain(".copilot-media-stream-panel-study[data-layout='stage'] .copilot-media-stream-lane {\n  display: flex;");
    expect(globalsCss).toContain(".copilot-media-stream-panel-study[data-layout='stage'] .copilot-media-stream-viewport {\n  width: 100%;");
    expect(globalsCss).not.toContain("min-height: clamp(32rem, calc(100dvh - 13rem), 48rem);");
    expect(globalsCss).not.toContain(".copilot-workspace-scroll.copilot-media-workspace[data-stream-window='fullscreen'] .copilot-media-stream-panel-study[data-layout='stage'] {\n  --copilot-stream-viewport-height:");
    expect(globalsCss).toContain(
      ".copilot-workspace-scroll.copilot-media-workspace:not([data-study-layout='flow'])[data-stream-window='fullscreen'] .copilot-media-stream-layout-study {\n  align-items: stretch;\n  grid-template-rows: minmax(0, 1fr);"
    );
    expect(globalsCss).toContain(
      ".copilot-workspace-scroll.copilot-media-workspace:not([data-study-layout='flow'])[data-stream-window='fullscreen'] .copilot-media-stream-panel,\n.copilot-workspace-scroll.copilot-media-workspace:not([data-study-layout='flow'])[data-stream-window='fullscreen'] .copilot-media-stream-lane,\n.copilot-workspace-scroll.copilot-media-workspace:not([data-study-layout='flow'])[data-stream-window='fullscreen'] .copilot-media-stream-viewport {\n  min-height: 0;"
    );
    expect(studyStreamModuleCss).toContain(":global(.copilot-media-stream-panel-study[data-layout='stage']).studyStreamSurface");
    expect(studyStreamModuleCss).toContain('  height: 100% !important;');
    expect(studyStreamModuleCss).toContain(":global(.copilot-media-stream-panel-study[data-layout='stage']) .studyStreamViewport");
    expect(studyStreamModuleCss).toContain(".studyStreamCard[data-layout='stage'] {\n  min-height: 100% !important;");
    expect(studyStreamModuleCss).not.toContain(".studyStreamCard {\n  min-height: auto !important;");
    expect(fullscreenUi).toContain('scrollMediaOwnerToAnchor({');
    expect(fullscreenUi).not.toContain('scrollIntoView(');
  });
});
