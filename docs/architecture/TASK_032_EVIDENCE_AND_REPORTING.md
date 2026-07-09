# TASK 032 — Evidence and Reporting

**This report is backend-only. No raw student data in any report.**

## Purpose

The evidence and reporting system collects verification results into a structured JSON report and a human-readable markdown report. These artifacts serve as the official evidence of Task 032 completion and gate results.

## Report Artifacts

| Artifact | Path | Format |
|----------|------|--------|
| JSON report | `reports/task-032-controlled-canary-activation-v1.json` | JSON |
| Markdown report | `reports/task-032-controlled-canary-activation-v1.md` | Markdown |
| Ops JSON | `docs/ops/task-032/task-032-controlled-canary-activation-v1.json` | JSON |
| Ops Markdown | `docs/ops/task-032/task-032-controlled-canary-activation-v1.md` | Markdown |
| Verification summary | `logs/task-032/task-032-verification-summary.json` | JSON |
| Handoff | `docs/ops/task-032/TASK_032_HANDOFF.md` | Markdown |

## Report Structure

### JSON Report Sections

| Section | Content |
|---------|---------|
| `task031Dependency` | Task 031 dependency gate results |
| `canaryEnvironmentGate` | Environment flag validation |
| `approvedSchoolCanaryConfig` | School config validation |
| `consentAuthorizationMatrix` | Consent/authorization readiness |
| `cohortEligibility` | Cohort and canary cap validation |
| `liveStudentPrivacyBoundary` | Privacy boundary gate results |
| `activationStateMachine` | State machine transition validation |
| `runtimeGuard` | Runtime access gate results |
| `controlActions` | Pause/resume/kill/rollback validation |
| `healthBudget` | Health budget consumption |
| `incidentBridge` | Incident logging results |
| `safeViews` | Role-based view validation |
| `privacyLeakChecks` | All privacy leak flags |
| `securityGateChecks` | Security gate integrity flags |
| `deenGateChecks` | Deen gate integrity flags |
| `socraticGateChecks` | Socratic gate integrity flags |
| `curriculumGateChecks` | Curriculum gate integrity flags |

## Validation

Every JSON report is validated by `task032-json-validate.cjs` which checks:
- Required sections exist
- No stale template tokens
- All privacy leak fields are `false`
- All gate weakened fields are `false`
- `safeToStartTask033` consistent with `verdict`
- `blockingIssues` empty when safe
- No forbidden private data patterns

## Privacy Requirements

- No raw student data in any report or log
- No tokens, secrets, or database URLs
- No AI prompts or provider responses
- All private data references must be in safe-negative context only

## Report Lifecycle

```
Verification Steps Complete
  -> Generate JSON report (gen-task032-report.cjs)
  -> Validate JSON report (task032-json-validate.cjs)
  -> Privacy scan generated artifacts (task032-privacy-scan.cjs)
  -> Copy to docs/ops/task-032/
  -> Generate handoff
```
