# Task 040: Freeze Manifest Reference

## What Is the Freeze Manifest?
The freeze manifest is a comprehensive inventory of all frozen backend elements, compiled by `FreezeManifestService`. It includes all accepted tasks, all backend surface entries, all contracts, all services, all repositories, all tests, all scripts, all reports, dirty workspace entries, future contamination entries, out-of-scope entries, no-drift results, safety scan results, regression check results, change control requests, and the freeze decision.

## How to Generate
```bash
POST /api/task040/backend-freeze/freeze-manifest
```
Returns the full compiled manifest.

## How to Evaluate
```bash
POST /api/task040/backend-freeze/freeze-decision
```
Returns the decision with verdict and any remaining blockers.

## How to View Report
```bash
GET /api/task040/backend-freeze/freeze-report
```
Returns the structured report.

## Manifest Contents (from `gen-task040-report.cjs`)
The structured JSON report includes:
- taskId, taskName, scope
- task036DependencyVerified
- backendFreezeCreated, backendFrozenThroughTask036
- safeToStartFrontendIntegrationOrNextPhase, safeToModifyBackendWithoutChangeControl
- All boundary flags (newProductBehaviorCreated, frontendUiCreated, etc.)
- acceptedTaskLedgerTaskCount, acceptedTaskIds
- All inventory created flags
- All scan results
- changeControlPolicyCreated, freezeManifestCreated, freezeDecisionPassed
- finalDecision, verdict
- commandsRun, filesCreated, filesModified
- remainingBlockers
- generatedAt

## Static Artifacts (on disk)
- `reports/task-040-final-backend-logic-freeze-v1.json`
- `reports/task-040-final-backend-logic-freeze-v1.md`
- `docs/ops/task-040/TASK_040_FINAL_BACKEND_LOGIC_FREEZE_REPORT.md`
- `docs/ops/task-040/task-040-final-backend-logic-freeze-report.json`
