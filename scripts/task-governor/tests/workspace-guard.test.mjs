import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Workspace Guard', async () => {
  let guard;

  before(async () => {
    guard = await import('../workspace-guard.mjs');
  });

  it('gets current HEAD', () => {
    const head = guard.getCurrentHead();
    assert.ok(head);
    assert.equal(head.length, 40);
  });

  it('classifies allowed paths', () => {
    const manifest = {
      scope: {
        allowedPaths: ['src/test'],
        protectedPaths: ['src/protected'],
        generatedPaths: ['.task-governor'],
      },
    };

    assert.equal(guard.classifyPath('src/test/foo.ts', manifest), 'TASK_ALLOWED');
    assert.equal(guard.classifyPath('src/protected/bar.ts', manifest), 'PROTECTED_UNRELATED');
    assert.equal(guard.classifyPath('.task-governor/state.json', manifest), 'GENERATED_RUNTIME');
    assert.equal(guard.classifyPath('src/other/baz.ts', manifest), 'NEW_UNAUTHORIZED_CHANGE');
  });

  it('captures baseline', () => {
    const manifest = {
      scope: { allowedPaths: ['src'] },
    };
    const baseline = guard.captureBaseline(manifest.scope);
    assert.ok(baseline.head);
    assert.ok(baseline.timestamp);
    assert.ok(baseline.status);
  });
});
