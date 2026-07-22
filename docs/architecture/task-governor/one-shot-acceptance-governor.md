# One-Shot Acceptance Governor

## Purpose

The One-Shot Acceptance Governor is a permanent, executable, fail-closed acceptance mechanism for Steadfast AI. It replaces the previous prompt-only completion model where an AI agent could self-certify work as accepted without mechanical verification.

## Problem Solved

The previous workflow failed because the coding agent was allowed to:

- Maintain task state only in conversation memory
- Interpret its own evidence
- Call failures pre-existing and continue
- Move forward after red checks
- Delete or weaken tests
- Reuse pre-commit results as post-commit proof
- Type the accepted sentinel manually
- Return incomplete progress as completion

The governor makes these behaviors mechanically impossible.

## Architecture

The governor is a lightweight Node.js ESM command-line system with no production dependencies. It uses:

- Node standard library for all core operations
- Git for repository state queries
- SHA-256 hashing for evidence integrity
- JSON for manifest and state serialization
- JSONL for append-only evidence ledger

Components:
- **CLI** (`task-governor.mjs`): Entry point for all commands
- **Constants**: Locked state machine definitions, exit codes, gate types
- **Manifest Loader/Validator**: Loads and validates task manifests
- **State Machine**: Enforces valid state transitions
- **State Store**: Persists runtime state under Git path
- **Evidence Ledger**: Append-only SHA-256 hash-chained record
- **Workspace Guard**: Tracks and validates file system state
- **Process Runner**: Safe child process execution with argument arrays
- **Test Inventory**: Vitest JSON output parsing and comparison
- **Test Integrity Analyzer**: AST-level scan for fake passes, skips, todos
- **Scan Runner**: Pattern-based code scans
- **Gate Runner**: Executes gates and records results
- **Commit Guard**: Validates staging and commit policies
- **Finalizer**: Independent verification before acceptance

## Trusted and Untrusted Boundaries

- **Trusted**: The governor CLI, its modules, the manifest file committed in `.task-governor/tasks/`, the Git binary
- **Untrusted**: The coding agent's claims, prior test summaries, handwritten acceptance documents, user-provided evidence

## State Machine

PREFLIGHT → IMPLEMENTING → TODO_VERIFICATION → PRE_COMMIT_VERIFICATION → STAGING → IMPLEMENTATION_COMMITTED → POST_COMMIT_VERIFICATION → ACCOUNTABILITY_COMMITTED → FINAL_REPOSITORY_PROOF → ACCEPTED_READY

Failure path from any executable state: → ERROR_REPAIR
Recovery path: ERROR_REPAIR → TODO_VERIFICATION (only when the failed check passes)

## Runtime Storage

Runtime data is stored under `git rev-parse --git-path task-governor/<task-id>/`:
- `state.json` — current task state
- `ledger.jsonl` — append-only evidence ledger
- `baseline-workspace.json` — initial workspace snapshot
- `inventories/` — test inventory results
- `logs/` — command stdout/stderr
- `final-receipt.json` — acceptance receipt

## Evidence Model

- Append-only JSONL file
- Each record contains: schema version, task ID, state transitions, HEAD, command, exit code, output hashes, timestamps
- Records are SHA-256 hash-chained: each record includes the hash of the previous record
- Verification detects tampering, reordering, or missing records

## Workspace Model

- Baseline captured at bootstrap
- Paths classified as: TASK_ALLOWED, PROTECTED_UNRELATED, GENERATED_RUNTIME, NEW_UNAUTHORIZED_CHANGE
- Unauthorized changes, staging, or untracked files cause gate failure
- Finalization requires task-owned scope to be clean while preserving unrelated baseline dirt

## Inventory Model

- Per-suite identity with exact command, arguments, and cwd
- Uses Vitest JSON reporter
- Compares file list, test names, counts, and statuses
- Detects disappeared files, tests, new skips, and todos
- Approved rename mappings in manifest

## Commit Model

- prepare-commit validates staging scope
- record-implementation-commit validates the implementation commit
- record-accountability-commit validates docs-only accountability
- Post-commit verification invalidates if code changes after verification
- No git add, amend, push, or history rewrite

## Finalization Model

- Independently verifies every gate, inventory, scan, integrity check, workspace state, and commit ordering
- Rejects handwritten sentinels and self-referential accountability hashes
- Writes final receipt to runtime storage
- Only emits the configured sentinel as the final output line of finalize

## Recovery After Interruption

Use `resume <task-id>` after context compaction, agent restart, or interrupted session. It prints the exact next required action.

## Security and Privacy

- All command output is redacted for common secret patterns before storage
- No secrets are serialized to evidence
- The evidence ledger is an integrity mechanism, not cryptographic proof
- A malicious repository administrator can tamper with Git-path storage

## Limitations

- Does not prevent a compromised Git binary from reporting false state
- Does not replace CI/CD pipeline gates
- Does not verify business logic correctness — only structural and behavioral gates
- Hash chain detects accidental tampering but not adversarial re-computation
- Test inventory depends on Vitest JSON reporter output format

## How Future Tasks Use the Governor

1. Create a manifest in `.task-governor/tasks/<task-id>.json`
2. Run `bootstrap <task-id>` to start
3. Follow the state machine via `resume <task-id>`
4. Run gates with `run-gate <task-id> <gate-id>`
5. Use `prepare-commit`, `record-implementation-commit`, `verify-post-commit`, `record-accountability-commit`
6. Run `finalize <task-id>` for acceptance
