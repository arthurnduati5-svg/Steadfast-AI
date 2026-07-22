import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Finalizer', async () => {
  let finalizer;

  before(async () => {
    finalizer = await import('../finalizer.mjs');
  });

  it('exports finalizeTask', () => {
    assert.equal(typeof finalizer.finalizeTask, 'function');
  });
});
