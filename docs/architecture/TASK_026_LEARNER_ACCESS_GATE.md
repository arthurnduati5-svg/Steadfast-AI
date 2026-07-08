# Task 026 — Learner Access Gate

## Purpose

Verify that each learner attempting to participate in the pilot meets all eligibility criteria. The gate runs before session creation and periodically during execution.

## Scope

- Learner identity verification
- Pilot eligibility criteria matching
- Consent status validation
- Active enrollment check
- Duplicate participation prevention
- Eligibility revocation handling

## Architecture

```
Learner Access Gate
  ├── verifyLearnerIdentity()
  ├── checkEligibilityCriteria()
  ├── validateConsentStatus()
  ├── checkEnrollmentActive()
  └── preventDuplicateParticipation()
         │
         v
  GRANT / DENY with reason
```

Denied access is logged with a non-identifying reason code. Eligibility revocation during execution triggers session pause and notification to monitoring bridge.

## Key Components

- `LearnerAccessValidator` — eligibility evaluation engine
- `EligibilityCriteria` — configurable criteria set from pilot config
- Access grant/deny event emitter

## Security

- Learner identity is verified against verified school identity (preserved from prior tasks)
- No raw learner PII is logged in access events
- Consent status is checked without exposing consent details
- Duplicate check prevents session injection

## Dependencies

- Task 025 pilot configuration (eligibility criteria)
- Verified school identity system (preserved boundary)
- Consent registry

## Non-Goals

- Task 026 does NOT build Task 027 expansion
- Task 026 does NOT expand the pilot
- Task 026 does NOT deploy
- Task 026 does NOT send real communication
- Task 026 does NOT call live AI
- Task 026 does NOT write live school connectors
- Task 026 preserves verified school identity
- Task 026 preserves content governance
- Task 026 preserves privacy and safeguarding boundaries
- Task 026 preserves Socratic tutor behavior
