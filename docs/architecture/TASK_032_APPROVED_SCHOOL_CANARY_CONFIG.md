# TASK 032 — Approved School Canary Config

**This service is backend-only. No real school data is loaded.**

## Purpose

The approved school canary config service (`task032ApprovedSchoolCanaryConfigService.ts`) validates that the school requesting canary activation has an approved configuration on file.

## Configuration Requirements

| Field | Requirement |
|-------|-------------|
| `schoolId` | Must be a known approved school identity |
| `cohortId` | Must belong to the approved school |
| `curriculumScopes` | One or more approved curriculum scopes |
| `sourceScopes` | One or more approved source scopes |
| `subjectScopes` | One or more approved subject scopes |

## Safe Identifiers

All identifiers use the `task032_safe` prefix to distinguish from real data:

- `school_task032_canary_safe` — approved school
- `canary_cohort_task032_safe` — approved cohort
- `curriculum_scope_task032_safe_001` — approved curriculum scope

## Gate Flow

```
ApprovedSchoolConfigGate
  -> Lookup schoolId in approved config
  -> Validate cohortId belongs to school
  -> Validate curriculum scopes
  -> Validate source scopes
  -> Pass/Fail with blocking issues
```

## Boundaries

- No real school rosters are loaded
- No real student identities are accessed
- No production school connectors are invoked
- Config is fixture-based for Task 032; real config integration deferred to Task 035
