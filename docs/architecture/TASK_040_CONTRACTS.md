# Task 040 Contracts Reference

## Core Types (from `task040BackendFreezeContracts.ts`)

### Enums
- `Task040FreezeStatus` — values: `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`, `ACCEPTED`, `REJECTED`
- `Task040SafetyScanType` — values: `privacy`, `production_mutation`, `live_ai_connector`, `live_notification`, `frontend_ui`, `future_task`, `false_pass`

### Interfaces
- `Task040BackendFreezeState` — root state object
- `Task040AcceptedTaskEntry` — one accepted task
- `Task040BackendSurfaceEntry` — one backend route entry
- `Task040ContractEntry` — one contract entry
- `Task040ServiceEntry` — one service entry
- `Task040RepositoryEntry` — one repository entry
- `Task040TestEntry` — one test file entry
- `Task040ScriptEntry` — one script entry
- `Task040ReportEntry` — one report entry
- `Task040DirtyEntry` — one dirty workspace entry
- `Task040FutureContaminationEntry` — one contamination entry
- `Task040OutOfScopeEntry` — one out-of-scope entry
- `Task040NoDriftResult` — drift check result
- `Task040RegressionCheckResult` — regression check result
- `Task040SafetyScanResult` — safety scan result
- `Task040ChangeControlRequest` — change control request
- `Task040FreezeManifest` — compiled freeze manifest
- `Task040FreezeDecision` — freeze decision
- `Task040FreezeReport` — comprehensive report
- `Task040DiagnosticsResult` — diagnostics output

### Constants
- `ACCEPTED_TASK_IDS` — array of all task IDs from 020 to 036
- `OUT_OF_SCOPE_CATEGORIES` — array of out-of-scope categories
- `CHANGE_CONTROL_IMPLICATIONS` — change policy statements

### Helper Functions
- `createEmptyState()` — initial state factory
- `isTask040BoundarySafe()` — boundary safety check
- `formatTask040Decision()` — verdict formatter
