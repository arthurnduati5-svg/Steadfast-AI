# Tasks

## Purpose
This directory documents governed tasks executed through the Steadfast Agent Execution Control Plane.

## How to Create a Task
1. Define a task manifest following agent-control/schemas/task-manifest.schema.json
2. Provide the exact original prompt
3. Run: `node scripts/bootstrap-task.mjs create --manifest <path> --prompt <path>`
4. Run: `node scripts/workspace-guard.mjs capture-baseline --task <task-id>`
5. Run: `node scripts/task-governor.mjs advance --task <task-id> --to AUDITING`

## How to Resume a Task
Run the resume command stored in the runtime directory, or:
`node scripts/task-governor.mjs resume --task <task-id>`

## How to View Status
`node scripts/task-governor.mjs status --task <task-id>`

## How ERROR_REPAIR Works
When a gate fails, the task moves to ERROR_REPAIR. The same task ID is used.
Failures are recorded with ID, originating state, return state, and command.
After repair, failures are resolved: `node scripts/task-governor.mjs resolve --task <task-id> --failure <id>`

## How Finalization Works
After all gates pass, run: `node scripts/finalize-task.mjs --task <task-id>`
Only finalize-task.mjs can transition a task to ACCEPTED.

## Task Types
- **frontend**: Operates only in frontend-owned paths
- **backend**: Operates only in backend-owned paths
- **ai**: Operates only in AI-owned paths
- **integration**: Cross-boundary when authorized
- **governance**: Control plane changes
- **documentation**: Documentation-only changes

## Important
- Agent prose is non-authoritative for acceptance
- All evidence must be machine-generated
- Broad staging (git add ., -A, --all) is forbidden
- All tasks require post-commit verification
