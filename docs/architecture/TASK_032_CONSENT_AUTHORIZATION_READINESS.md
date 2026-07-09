# TASK 032 — Consent & Authorization Readiness

**This service is backend-only. No real consent data is collected or stored.**

## Purpose

The consent authorization service (`task032CanaryConsentAuthorizationService.ts`) validates that all required consent and authorization policies are satisfied before canary activation proceeds.

## Authorization Checks

| Check | Description |
|-------|-------------|
| School authorized | School administration has approved canary participation |
| Admin approved | System admin has authorized the canary run |
| Teacher notified | Assigned teachers have been notified of canary activation |
| Student notice ready | Notice to students is prepared and available |
| Guardian policy satisfied | Guardian consent policy is met or deemed not required |
| Rollback owner assigned | A named owner is responsible for rollback if needed |
| Safeguarding contact assigned | Safeguarding lead is identified |
| Deen review contact assigned | Deen sensitivity reviewer is assigned if needed |

## Guardian Consent

Guardian consent policy is determined by school configuration:
- `required` — explicit guardian opt-in required for each student
- `not_required_by_school_policy` — school policy deems canary within standard terms
- `opt_out` — guardians must explicitly opt out

## Data Flow

```
ConsentAuthorizationGate
  -> Validate school authorization
  -> Validate admin approval
  -> Validate teacher notification readiness
  -> Validate student notice readiness
  -> Check guardian policy status
  -> Verify rollback owner assigned
  -> Verify safeguarding contact assigned
  -> Pass/Fail
```

## Boundaries

- No actual consent communications are sent (deferred to Task 035)
- No guardian contact data is stored or processed
- No real student consent records are created
- Authorization state is in-memory only for Task 032
