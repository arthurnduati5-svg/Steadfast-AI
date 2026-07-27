# task-status

## Behavior
- Print authoritative machine status
- Print current state
- Print manifest hash
- Print task HEAD
- Print active failures
- Print last passing gate
- Print next allowed action
- Do not print acceptance claim unless state is ACCEPTED

## Usage
node scripts/task-governor.mjs status --task <task-id>
