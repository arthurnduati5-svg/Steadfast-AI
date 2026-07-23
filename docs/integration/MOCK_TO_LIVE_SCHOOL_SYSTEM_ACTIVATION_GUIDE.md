# Mock-to-Live School System Activation Guide

## Important Notice

**Task 039 does not activate the live school-system connector.**

This guide documents the future steps required to safely activate the live school-system connector. All steps must be completed in a future integration task, after Task 039 verification is complete.

---

## Current State (Task 039)

| Item | Status |
|------|--------|
| School-system identity bridge contracts | Built |
| School context verification service | Built |
| Tutor learner mapping service | Built |
| Teacher scope mapping service | Built |
| School admin scope mapping service | Built |
| Mock school-system adapter | Built and active |
| Disabled live school-system adapter shell | Built |
| School connector activation guard | Built (blocks live activation) |
| Roster sync dry-run service | Built |
| Identity conflict detection service | Built |
| School connector no-bypass audit service | Built |
| School context failure policy | Documented |
| School connector readiness checklist | Documented |
| **Live school-system connector** | **Disabled. Not activated.** |
| **Real school credentials** | **Not read. Not stored.** |
| **Real school API calls** | **Not performed.** |

---

## Future Activation Steps

### Step 1: Complete Frontend Runtime Wiring

- Wire frontend API client to backend endpoints
- Verify school auth middleware passes with frontend-sent tokens
- Run frontend-backend integration tests
- **Prerequisite**: Frontend integration task (separate from Task 039)

### Step 2: Identify School-System Provider

- Choose the school-system provider (SIS/LMS/Google Classroom/Microsoft Education/custom)
- Update `SchoolSystemProviderName` type in `schoolSystemBridgeContracts.ts` if needed
- Update `backend/src/contracts/schoolSystemBridgeContracts.ts` with provider metadata

### Step 3: Agree Identity Payload Contract

- Work with school-system provider to define the identity payload shape
- Ensure `ExternalSchoolIdentityPayload` matches the provider's response
- Test with sample payloads from the provider

### Step 4: Agree Role Claim Mapping

- Map school-system roles to `SchoolRoleClaim` types
- Document the mapping table in the integration docs
- Test with each role type

### Step 5: Configure Secure Credential Storage

- Set `SCHOOL_CONNECTOR_MODE` to `activation_pending` or `live_ready_not_enabled`
- Set `SCHOOL_CONNECTOR_PROVIDER` to the provider name
- Set `SCHOOL_CONNECTOR_BASE_URL` to the school-system API base URL
- Store `SCHOOL_CONNECTOR_CLIENT_ID` and `SCHOOL_CONNECTOR_CLIENT_SECRET` in secure secret storage
- Store `SCHOOL_CONNECTOR_WEBHOOK_SECRET` in secure secret storage
- Never log, commit, or expose these values

### Step 6: Configure Signature / Webhook Verification

- Implement identity payload signature verification
- Configure webhook endpoint for roster change notifications
- Add signature validation middleware

### Step 7: Run Mock Identity Tests

- Run all Task 039 contract tests to verify the bridge layer works
- Ensure `schoolContextVerificationService` correctly validates mock payloads
- Ensure mock adapter returns expected synthetic data

### Step 8: Run Roster Sync Dry-Run

- Use `rosterSyncDryRunService` to validate the school-system roster data
- Fix any conflicts detected
- Verify no write is performed during dry-run

### Step 9: Run Teacher Scope Dry-Run

- Use `teacherScopeMappingService` with sample data
- Verify teachers can only see their assigned classes/subjects/students
- Verify access outside scope is blocked

### Step 10: Run Student Mapping Dry-Run

- Use `tutorLearnerMappingService` with sample student data
- Verify duplicate detection
- Verify inactive enrollment detection

### Step 11: Run Privacy Scan

- Run the Task 039 privacy leak scan tests
- Verify no real student/teacher/school data is exposed
- Verify no credentials, tokens, or secrets are leaked

### Step 12: Run No-Bypass Audit

- Run `schoolConnectorNoBypassAuditService`
- Verify no route bypasses school context verification
- Verify no direct live connector calls
- Verify mock adapter is network-free
- Verify disabled live adapter is network-free

### Step 13: Run Staging-Only Live Connector Smoke Test

- Deploy to staging environment (not production)
- Set `SCHOOL_CONNECTOR_MODE=live_enabled` (staging only)
- Verify identity verification works with real payloads (staging credentials)
- Verify roster sync works (staging data)
- Verify teacher scope enforcement
- Verify student mapping
- If any test fails, roll back to `mock_only` and fix

### Step 14: Get School Owner Approval

- Present staging test results to school administrators
- Get signed approval for live activation
- Record approval in audit log

### Step 15: Enable Live Connector in Future Activation Task

- Only after all previous steps pass
- Set `SCHOOL_CONNECTOR_MODE=live_enabled` in production
- Set `SCHOOL_CONNECTOR_PROVIDER` to the correct provider
- Set required env vars in production secret store
- Monitor for 48 hours before considering activation stable

---

## Rollback Plan

If live connector activation causes issues:

1. Set `SCHOOL_CONNECTOR_MODE=mock_only` (immediate rollback)
2. Verify mock adapter handles all requests without data loss
3. Investigate root cause
4. Run full no-bypass audit before re-enabling

---

## Security Notes

- Never commit `SCHOOL_CONNECTOR_CLIENT_ID`, `SCHOOL_CONNECTOR_CLIENT_SECRET`, or `SCHOOL_CONNECTOR_WEBHOOK_SECRET` to the repository
- Never log raw school-system API responses
- Never expose school-system credentials in error messages
- All school-system API calls must pass through the verified school context check
- All school-system API responses must pass through the privacy boundary
