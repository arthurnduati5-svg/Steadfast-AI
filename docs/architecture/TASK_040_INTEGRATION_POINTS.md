# Task 040 Integration Points

## Mount Point
In `backend/src/index.ts`:
```
/api/task040/backend-freeze/...
```
Protected by `schoolAuthMiddleware` and `requireVerifiedSchoolContext`.

## Endpoint Summary

| Method | Endpoint | Service |
|--------|----------|---------|
| GET | `/task-proof` | Task036ProofLoader |
| GET | `/accepted-tasks` | AcceptedTaskLedger |
| GET | `/surface-inventory` | BackendSurfaceInventory |
| GET | `/contract-inventory` | ContractInventory |
| GET | `/service-inventory` | ServiceInventory |
| GET | `/repository-inventory` | RepositoryInventory |
| GET | `/test-inventory` | TestInventory |
| GET | `/script-inventory` | ScriptInventory |
| GET | `/report-inventory` | ReportInventory |
| GET | `/dirty-workspace` | DirtyWorkspaceClassifier |
| GET | `/future-contamination` | FutureTaskContamination |
| GET | `/out-of-scope` | OutOfScopeManifest |
| GET | `/safety-scans/:scanName` | SafetyScan |
| GET | `/no-drift` | NoDriftCheck |
| GET | `/regression` | RegressionCheck |
| GET | `/change-control/requests` | ChangeControlPolicy |
| POST | `/change-control/register` | ChangeControlPolicy |
| POST | `/change-control/approve/:id` | ChangeControlPolicy |
| POST | `/change-control/reject/:id` | ChangeControlPolicy |
| GET | `/change-control/manifest/:id` | ChangeControlPolicy |
| POST | `/freeze-manifest` | FreezeManifest |
| POST | `/freeze-decision` | FreezeDecision |
| GET | `/freeze-report` | FreezeReport |
| GET | `/diagnostics` | Diagnostics |

## Dependencies
- `express` (already in project)
- `schoolAuthMiddleware` (must be importable from auth middleware)
- `requireVerifiedSchoolContext` (must be importable)
- No new npm packages required
