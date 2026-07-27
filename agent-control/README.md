# Steadfast Agent Execution Control Plane

## Purpose
A deterministic, repository-local control plane that governs OpenCode task execution for Steadfast AI.

## Trust Boundary
- **OpenCode builds** — implements features, runs commands, captures evidence
- **Repository scripts determine truth** — validate scope, tests, evidence, staging, commits
- **finalize-task.mjs alone accepts** — no agent-authored acceptance is valid

## Why Agents Cannot Accept
Agent prose is non-authoritative. Only machine-validated gates prove completion.
A sentence like "all tests passed" has no acceptance value unless the control plane independently proves it.

## Runtime Storage
Mutable task state lives under `.git/steadfast-agent-control/` — outside the tracked worktree.

## How to Create a Task
1. Create manifest JSON (see `schemas/task-manifest.schema.json`)
2. Create original prompt file (exact content)
3. `node scripts/bootstrap-task.mjs create --manifest <path> --prompt <path>`
4. `node scripts/workspace-guard.mjs capture-baseline --task <task-id>`
5. `node scripts/task-governor.mjs advance --task <task-id> --to AUDITING`

## How to Write a Manifest
See `agent-control/schemas/task-manifest.schema.json` for the required schema.
At minimum include: taskId, title, taskType, riskProfile, ownerAcceptanceCriteria, requiredTestCommands, taskOwnedPaths.

## How to Finalize a Task
After all gates pass and tests are verified:
1. Stage exact paths: `node scripts/task-governor.mjs stage --task <task-id> --paths-file <file>`
2. Commit: `git commit -m "<expected message>"`
3. Run post-commit: `node scripts/post-commit-verifier.mjs run --task <task-id>`
4. Finalize: `node scripts/finalize-task.mjs --task <task-id>`

## How to Adopt a Current Task
`node scripts/bootstrap-task.mjs adopt --task-id <id> --prompt <path> --report <path>`

## Upgrade Control Plane
Update `agent-control/VERSION` and increment the version number. Update `controlPlaneVersion` in new manifests.
