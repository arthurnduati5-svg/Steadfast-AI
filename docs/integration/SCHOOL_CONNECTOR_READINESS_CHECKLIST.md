# School Connector Readiness Checklist

## Current Status (Task 039)

**Live activation status: BLOCKED / DEFERRED**

All items below are marked with their current status as of Task 039. Live connector activation requires all items to pass in a future integration task.

---

## 1. School-System Provider Selection

| Property | Value |
|----------|-------|
| Status | ❌ Not complete |
| Required evidence | Documented provider selection decision |
| Owner | Future integration task |
| Future activation phase | Step 2 |
| Blocking if missing? | Yes |

## 2. Identity Payload Contract

| Property | Value |
|----------|-------|
| Status | ✅ Contract defined (Task 039) |
| Required evidence | `ExternalSchoolIdentityPayload` type matches provider response |
| Owner | Future integration task |
| Future activation phase | Step 3 |
| Blocking if missing? | Yes |

## 3. Role Claim Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Contract defined (Task 039) |
| Required evidence | Mapping table between provider roles and `SchoolRoleClaim` |
| Owner | Future integration task |
| Future activation phase | Step 4 |
| Blocking if missing? | Yes |

## 4. Student Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Service built (Task 039) |
| Required evidence | `tutorLearnerMappingService` tested with mock data |
| Owner | Future integration task |
| Future activation phase | Step 10 |
| Blocking if missing? | Yes |

## 5. Teacher Scope Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Service built (Task 039) |
| Required evidence | `teacherScopeMappingService` tested with mock data |
| Owner | Future integration task |
| Future activation phase | Step 9 |
| Blocking if missing? | Yes |

## 6. Admin Scope Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Service built (Task 039) |
| Required evidence | `schoolAdminScopeMappingService` tested with mock data |
| Owner | Future integration task |
| Future activation phase | Step 4 |
| Blocking if missing? | Yes |

## 7. Roster Sync Dry-Run

| Property | Value |
|----------|-------|
| Status | ✅ Service built (Task 039) |
| Required evidence | `rosterSyncDryRunService` tested with mock data |
| Owner | Future integration task |
| Future activation phase | Step 8 |
| Blocking if missing? | Yes |

## 8. Class/Subject Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Contracts defined (Task 039) |
| Required evidence | `ExternalClassRecord` and `ExternalSubjectRecord` types verified |
| Owner | Future integration task |
| Future activation phase | Step 8 |
| Blocking if missing? | Yes |

## 9. Enrollment Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Contracts defined (Task 039) |
| Required evidence | `ExternalEnrollmentRecord` type verified |
| Owner | Future integration task |
| Future activation phase | Step 8 |
| Blocking if missing? | Yes |

## 10. Teacher Assignment Mapping

| Property | Value |
|----------|-------|
| Status | ✅ Contracts defined (Task 039) |
| Required evidence | `ExternalTeacherAssignmentRecord` type verified |
| Owner | Future integration task |
| Future activation phase | Step 8 |
| Blocking if missing? | Yes |

## 11. Credential Storage

| Property | Value |
|----------|-------|
| Status | ❌ Not configured (Task 039 does not require credentials) |
| Required evidence | Secure credential storage configured (e.g., AWS Secrets Manager, Vault) |
| Owner | Future integration task |
| Future activation phase | Step 5 |
| Blocking if missing? | Yes |

## 12. Signature/Webhook Verification

| Property | Value |
|----------|-------|
| Status | ❌ Not configured (Task 039 does not configure provider integration) |
| Required evidence | Signature verification middleware tested |
| Owner | Future integration task |
| Future activation phase | Step 6 |
| Blocking if missing? | Yes |

## 13. Privacy Scan

| Property | Value |
|----------|-------|
| Status | ✅ Scan built (Task 039) |
| Required evidence | Privacy leak scan tests pass |
| Owner | Task 039 |
| Future activation phase | Step 11 |
| Blocking if missing? | Yes |

## 14. Audit Readiness

| Property | Value |
|----------|-------|
| Status | ✅ Audit service built (Task 039) |
| Required evidence | `schoolConnectorNoBypassAuditService` runs and passes |
| Owner | Task 039 |
| Future activation phase | Step 12 |
| Blocking if missing? | Yes |

## 15. Rollback Readiness

| Property | Value |
|----------|-------|
| Status | ❌ Plan documented but not tested with live connector (Task 039) |
| Required evidence | Rollback plan exists and has been tested |
| Owner | Future integration task |
| Future activation phase | Post-activation |
| Blocking if missing? | Yes |

## 16. Staging Smoke Readiness

| Property | Value |
|----------|-------|
| Status | ❌ Not executed (Task 039 does not connect live school system) |
| Required evidence | Staging smoke test passed with live connector |
| Owner | Future integration task |
| Future activation phase | Step 13 |
| Blocking if missing? | Yes |

## 17. Manual Approval Readiness

| Property | Value |
|----------|-------|
| Status | ❌ Not recorded (Task 039 does not require school owner approval) |
| Required evidence | School owner signed approval recorded |
| Owner | Future integration task |
| Future activation phase | Step 14 |
| Blocking if missing? | Yes |

---

## Summary

| Item | Task 039 Status | Live Activation Required |
|------|----------------|-------------------------|
| Provider selection | ❌ Not complete | Yes |
| Identity payload contract | ✅ Defined | Yes |
| Role claim mapping | ✅ Defined | Yes |
| Student mapping | ✅ Service built | Yes |
| Teacher scope mapping | ✅ Service built | Yes |
| Admin scope mapping | ✅ Service built | Yes |
| Roster sync dry-run | ✅ Service built | Yes |
| Class/subject mapping | ✅ Contracts defined | Yes |
| Enrollment mapping | ✅ Contracts defined | Yes |
| Teacher assignment mapping | ✅ Contracts defined | Yes |
| Credential storage | ❌ Not configured | Yes |
| Signature/webhook verification | ❌ Not configured | Yes |
| Privacy scan | ✅ Built | Yes |
| Audit readiness | ✅ Built | Yes |
| Rollback readiness | ❌ Plan documented | Yes |
| Staging smoke readiness | ❌ Not executed | Yes |
| Manual approval readiness | ❌ Not recorded | Yes |

**Overall Live Activation Status: BLOCKED / DEFERRED**

14 of 17 items have contracts, services, or plans ready. 3 items (credential storage, signature verification, staging smoke test, manual approval) require a future task with school-system provider integration.
