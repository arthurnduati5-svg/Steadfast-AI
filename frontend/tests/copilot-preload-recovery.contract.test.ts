import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('copilot preload recovery contract', () => {
  it('keeps bootstrap retryable until preload or fallback session recovery actually succeeds', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain('let bootstrapRecovered = false;');
    expect(copilotTsx).toContain('bootstrapRecovered = applyPreloadData(cached.data, true, { hydrateLastSession: true }) || bootstrapRecovered;');
    expect(copilotTsx).toContain('bootstrapRecovered = hydratedLastSession || bootstrapRecovered;');
    expect(copilotTsx).toContain('bootstrapRecovered = await handleNewChat(false);');
    expect(copilotTsx).toContain('setHasInitialized(');
    expect(copilotTsx).toContain('messagesRef.current.length > 0');
    expect(copilotTsx).toContain('historyRef.current.length > 0');
  });

  it('does not show a destructive fallback toast for silent bootstrap recovery attempts', () => {
    const copilotTsx = readRepoFile('frontend/components/steadfast-copilot.tsx');

    expect(copilotTsx).toContain('if (showToast) {');
    expect(copilotTsx).toContain('description: "Could not start a new session."');
  });
});
