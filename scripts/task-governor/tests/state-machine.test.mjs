import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

async function getStateMachine() {
  return await import('../state-machine.mjs');
}

async function getConstants() {
  return await import('../constants.mjs');
}

describe('State Machine', async () => {
  it('allows valid transitions', async () => {
    const { isValidTransition } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isValidTransition(STATES.PREFLIGHT, STATES.IMPLEMENTING), true);
    assert.equal(isValidTransition(STATES.IMPLEMENTING, STATES.TODO_VERIFICATION), true);
    assert.equal(isValidTransition(STATES.TODO_VERIFICATION, STATES.PRE_COMMIT_VERIFICATION), true);
    assert.equal(isValidTransition(STATES.ERROR_REPAIR, STATES.TODO_VERIFICATION), true);
  });

  it('rejects invalid transitions', async () => {
    const { isValidTransition } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isValidTransition(STATES.PREFLIGHT, STATES.ACCEPTED_READY), false);
    assert.equal(isValidTransition(STATES.IMPLEMENTING, STATES.ACCEPTED_READY), false);
    assert.equal(isValidTransition(STATES.ACCEPTED_READY, STATES.IMPLEMENTING), false);
  });

  it('identifies terminal states', async () => {
    const { isTerminal } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isTerminal(STATES.ACCEPTED_READY), true);
    assert.equal(isTerminal(STATES.BLOCKED), true);
    assert.equal(isTerminal(STATES.IMPLEMENTING), false);
  });

  it('fails a gate and enters ERROR_REPAIR', async () => {
    const { isValidTransition } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isValidTransition(STATES.IMPLEMENTING, STATES.ERROR_REPAIR), true);
  });

  it('recovery from ERROR_REPAIR goes to TODO_VERIFICATION', async () => {
    const { isValidTransition } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isValidTransition(STATES.ERROR_REPAIR, STATES.TODO_VERIFICATION), true);
    assert.equal(isValidTransition(STATES.ERROR_REPAIR, STATES.IMPLEMENTING), false);
  });

  it('prevents state from skipping forward', async () => {
    const { isValidTransition } = await getStateMachine();
    const { STATES } = await getConstants();

    assert.equal(isValidTransition(STATES.PREFLIGHT, STATES.POST_COMMIT_VERIFICATION), false);
    assert.equal(isValidTransition(STATES.IMPLEMENTING, STATES.IMPLEMENTATION_COMMITTED), false);
  });
});
