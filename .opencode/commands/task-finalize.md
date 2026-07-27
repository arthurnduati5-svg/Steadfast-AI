# task-finalize

## Behavior
- Call finalize-task.mjs
- Do not write sentinel directly
- Return the exact finalizer result
- Return ERROR_REPAIR when a task-owned gate fails
- Return OWNER_INPUT_REQUIRED when owner input is genuinely missing

## Usage
node scripts/finalize-task.mjs --task <task-id>
