# Task 034 — Expanded Cohort Eligibility

## Purpose

The expanded cohort eligibility service determines which learners within the Task 032 canary cohort are eligible to participate in the controlled limited rollout. Eligibility is based on pre-approved criteria only.

## Core Constraints

- Task 034 is backend-only
- Task 034 is limited rollout only
- Task 034 does not launch school-wide
- Task 034 does not run 100 percent rollout
- Task 034 does not freeze backend
- Task 034 does not create frontend UI
- Task 034 does not deploy
- Task 034 does not send real notifications
- Task 034 does not call live AI
- Task 034 does not write live connectors
- Task 034 does not expose raw learner data
- Task 034 does not expose raw Deen/private/safeguarding/answer/provider data

## Eligibility Criteria

| Criterion | Requirement | Source |
|---|---|---|
| Task 032 canary approval | Learner was part of approved canary cohort | Task 032 cohort list |
| School readiness | School has completed readiness checks | School readiness flags |
| Staff readiness | Staff have completed training/acknowledgment | Staff readiness status |
| Learner consent | Learner or guardian consent on file | Consent records |
| No opt-out | Learner has not opted out of limited rollout | Opt-out registry |
| Within rollout cap | Learner falls within the rollout percentage cap | Cap calculation |

## Eligibility Flow

```
Eligibility Request -> ExpandedCohortEligibility Service
  -> Load Task 032 canary cohort list
  -> Check school readiness
  -> Check staff readiness
  -> Check learner consent
  -> Check opt-out status
  -> Check rollout cap
  -> Return eligibility result (aggregate yes/no + count)
```

## Forbidden Operations

- No individual student data exposed in eligibility output
- No real student names, emails, or identifiers in logs
- No new schools added beyond the Task 032 canary cohort
- No bypass of consent or opt-out checks

## Verification

Eligibility is verified by:
1. Unit tests for eligibility logic
2. Integration tests with synthetic cohort data
3. Privacy scan confirming no raw learner data in eligibility artifacts
4. Cap enforcement tests ensuring no overflow beyond limit
