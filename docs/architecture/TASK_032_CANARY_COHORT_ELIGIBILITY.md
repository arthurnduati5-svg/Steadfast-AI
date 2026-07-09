# TASK 032 — Canary Cohort Eligibility

**This service is backend-only. No real student data is processed.**

## Purpose

The cohort eligibility service (`task032CanaryCohortEligibilityService.ts`) validates that the requested cohort and student count meet the canary activation criteria before any runtime access is granted.

## Eligibility Criteria

| Check | Description |
|-------|-------------|
| Approved school | School must be in approved school list |
| Approved cohort | Cohort must be registered for canary |
| Cohort size | `requestedStudentCount <= eligibleStudentCount` |
| Canary cap | `requestedStudentCount <= maxCanaryStudents (25)` |
| Canary percent | `requestedStudentCount / totalSchoolStudents <= maxCanaryPercent (5%)` |

## Canary Cap

- Hard cap: 25 students maximum
- Percentage cap: 5% of total school enrollment
- Effective cap: `min(maxCanaryStudents, floor(totalSchoolStudents * maxCanaryPercent / 100))`

## Data Flow

```
CohortEligibilityGate
  -> Verify school approval
  -> Verify cohort registration
  -> Compare requested vs eligible student count
  -> Apply canary percentage cap
  -> Apply canary absolute cap
  -> Pass/Fail
```

## Boundaries

- No raw student identities are exposed
- No real student emails, names, or contact data
- Cohort membership is validated by ID only
- Eligible student counts are fixture values for Task 032
