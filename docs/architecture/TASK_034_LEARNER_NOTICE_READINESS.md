# Task 034 — Learner Notice Readiness

## Purpose

The learner notice readiness gate ensures that learners (or their guardians) have been notified about the controlled limited rollout and that notice records are in place.

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

## Gate: LearnerNoticeReadinessService

The `LearnerNoticeReadinessService` verifies that learners have been notified according to the notice policy before they are activated in the limited rollout.

## Readiness Checks

| Check | Method | Pass Condition |
|---|---|---|
| Notice sent | Verify notice record exists for each learner | All eligible learners have notice records |
| Notice acknowledged | Verify acknowledgment record (if required) | All required acknowledgments received |
| Notice timestamp | Verify notice was sent within valid window | Notice sent within configured window |
| Opt-out processed | Verify opt-out requests are honored | Opt-out learners excluded |
| Guardian consent | Verify guardian consent where required | Guardian consent on file |

## Notice Readiness Flow

```
Notice Readiness Check -> LearnerNoticeReadinessService
  -> Load learner notice records (aggregate only)
  -> Check notice sent status
  -> Check acknowledgment status
  -> Check notice timestamps
  -> Check opt-out registry
  -> Check guardian consent
  -> Return readiness status (aggregate: pass/fail + count)
```

## Important Distinction

Task 034 does **not** send real notifications. The learner notice readiness gate checks that notice records already exist — it does not create or transmit new notices. Real notification delivery is deferred to Task 035.

## Verification

Learner notice readiness is verified by:
1. Unit tests for notice readiness logic
2. Integration tests with synthetic notice records
3. Privacy scan confirming no raw learner notice data exposed
4. No-real-notification scan confirming no notification delivery logic
