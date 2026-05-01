import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  applyWorkspacePlusAction,
  DEFAULT_WORKSPACE_RUNTIME_STATE,
} from '@/lib/copilot-workspace-machine';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('Recent files modal behavior contract', () => {
  it('opens recent files as an in-place modal action instead of redirecting destinations', () => {
    const result = applyWorkspacePlusAction(
      {
        ...DEFAULT_WORKSPACE_RUNTIME_STATE,
        destination: 'growth',
      },
      'recent_files',
      ''
    );

    expect(result.state.destination).toBe('growth');
    expect(result.state.recentFilesModalOpen).toBe(true);
    expect(result.effects).toEqual([{ type: 'toggle_recent_files', open: true }]);
  });

  it('keeps recent files copy anchored to current workspace continuity', () => {
    const inputBar = readRepoFile('frontend/components/chat-input-bar.tsx');

    expect(inputBar).toContain('onRecentFilesModalOpenChange');
    expect(inputBar).toContain('Reuse files from this study session without leaving your current workspace.');
    expect(inputBar).toContain('supportsExternalRecentFilesSheet');
  });
});
