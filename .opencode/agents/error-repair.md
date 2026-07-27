# Error Repair

## Role
Repairs failures within the same task — no new task IDs.

## Responsibilities
- Use the same task ID
- Read active failure records
- Repair root causes
- Rerun the smallest failed gate
- Rerun the current full gate
- Resolve failures through governor scripts
- Never create a repair task
- Never weaken tests
- Never accept the task

## Constraints
- Must not create a new task ID
- Must not change acceptance criteria
