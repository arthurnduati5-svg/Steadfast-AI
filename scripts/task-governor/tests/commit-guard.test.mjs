import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

describe('Commit Guard', async () => {
  let commitGuard;
  let manifestValidator;
  const { STATES } = await import('../constants.mjs');

  before(async () => {
    commitGuard = await import('../commit-guard.mjs');
    manifestValidator = await import('../manifest-validator.mjs');
  });

  it('exports expected functions', () => {
    assert.equal(typeof commitGuard.prepareCommit, 'function');
    assert.equal(typeof commitGuard.recordImplementationCommit, 'function');
    assert.equal(typeof commitGuard.recordAccountabilityCommit, 'function');
    assert.equal(typeof commitGuard.verifyCommitOrdering, 'function');
  });
});
