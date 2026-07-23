# School Context Failure Policy

## Scope

This policy defines the behavior of the Steadfast AI tutor backend when school context verification fails for any reason. It applies to all routes, services, and runtime components that depend on verified school identity.

---

## Failure Scenarios

### 1. Missing School Context

| Property | Value |
|----------|-------|
| Backend result | `blocked_missing_school` — API returns 403 with error code `school_context_missing` |
| Safe frontend message | "School identity is not verified. Please sign in through your school account." |
| Allowed retry? | Yes, after re-authentication with valid school context |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_missing_school`, `reasonCodes: ['school_id_missing']` |
| Privacy note | No private data exposed. Failure is safe to return to frontend. |

### 2. Expired School Context

| Property | Value |
|----------|-------|
| Backend result | `blocked_expired_identity` — API returns 403 with error code `school_context_expired` |
| Safe frontend message | "Your school session has expired. Please sign in again." |
| Allowed retry? | Yes, after re-authentication with fresh school context |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_expired_identity`, `reasonCodes: ['identity_expired']` |
| Privacy note | Expiry timestamp is safe to log. No raw personal data exposed. |

### 3. Revoked Identity

| Property | Value |
|----------|-------|
| Backend result | `blocked_revoked_identity` — API returns 403 with error code `identity_revoked` |
| Safe frontend message | "Your school identity has been revoked. Please contact your school administrator." |
| Allowed retry? | No. The identity is permanently revoked. |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_revoked_identity`, `reasonCodes: ['identity_expired']` |
| Privacy note | Do not expose the reason for revocation. Log only that revocation was detected. |

### 4. Invalid Role

| Property | Value |
|----------|-------|
| Backend result | `blocked_invalid_role` — API returns 403 with error code `invalid_role` |
| Safe frontend message | "Your account role is not recognized. Please contact your school administrator." |
| Allowed retry? | Yes, after role claim is corrected in the school system |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_invalid_role`, `reasonCodes: ['role_not_recognized']` |
| Privacy note | The raw role value is safe to log for diagnostics. Do not expose in frontend messages. |

### 5. Missing Role

| Property | Value |
|----------|-------|
| Backend result | `blocked_missing_role` — API returns 403 with error code `missing_role` |
| Safe frontend message | "Your account does not have a role assigned. Please contact your school administrator." |
| Allowed retry? | Yes, after role claim is added in the school system |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_missing_role`, `reasonCodes: ['role_missing']` |
| Privacy note | Safe to return to frontend. |

### 6. Teacher Scope Missing

| Property | Value |
|----------|-------|
| Backend result | `blocked_missing_scope` — API returns 403 with error code `teacher_scope_missing` |
| Safe frontend message | "You do not have any classes or subjects assigned. Please contact your school administrator." |
| Allowed retry? | Yes, after class/subject scope is assigned |
| Tutor session can start? | No (teacher scope required for teacher routes) |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_missing_scope`, `reasonCodes: ['no_class_scope_defined']` |
| Privacy note | Do not expose which classes/subjects are missing. |

### 7. Student Enrollment Inactive

| Property | Value |
|----------|-------|
| Backend result | `blocked_inactive_enrollment` — tutor learner mapping returns `blocked_inactive_enrollment` |
| Safe frontend message | "Your enrollment is no longer active. Please contact your school administrator." |
| Allowed retry? | Yes, after enrollment is reactivated |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `decision: blocked_inactive_enrollment`, `reasonCodes: ['inactive_enrollment']` |
| Privacy note | Do not expose enrollment details. |

### 8. School Mismatch

| Property | Value |
|----------|-------|
| Backend result | `blocked_tenant_mismatch` — API returns 403 with error code `tenant_mismatch` |
| Safe frontend message | "Your account does not match the current school. Please sign in with the correct school account." |
| Allowed retry? | Yes, after signing in with the correct school |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `verificationStatus: blocked_tenant_mismatch`, `reasonCodes: ['school_mismatch']` |
| Privacy note | Both school IDs are safe to log for diagnostics. |

### 9. Roster Conflict

| Property | Value |
|----------|-------|
| Backend result | Roster sync returns `blocked: true` with conflict details |
| Safe frontend message | "Roster synchronization detected conflicts. Please resolve before proceeding." |
| Allowed retry? | Yes, after conflicts are resolved in the school system |
| Tutor session can start? | No (roster sync must pass before new sessions) |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | Dry-run mode. Conflicts logged with severity level. |
| Privacy note | Only conflict type and severity are returned. No raw student/teacher data exposed. |

### 10. Connector Unavailable

| Property | Value |
|----------|-------|
| Backend result | `blocked_live_connector_disabled` — school connector returns blocked |
| Safe frontend message | "School system connection is not available yet. Please try again later." |
| Allowed retry? | Yes, after the connector is enabled in a future task |
| Tutor session can start? | No |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `activationState: blocked` or `disabled_live`, `reasonCodes: ['live_connector_disabled']` |
| Privacy note | Safe to return. No credential information exposed. |

### 11. Live Connector Disabled

| Property | Value |
|----------|-------|
| Backend result | `blocked_live_connector_disabled` — same as connector unavailable |
| Safe frontend message | "School system integration is not yet active. Please use mock mode or wait for activation." |
| Allowed retry? | Yes, after connector activation task completes |
| Tutor session can start? | No (live mode) |
| Memory can load? | No |
| Evidence can be created? | No |
| AI can be called? | No |
| Audit metadata | `mode: disabled_live`, `reasonCodes: ['live_connector_disabled']` |
| Privacy note | Safe to return. |

---

## System-Wide Rule

```
No verified school identity → no tutor learner context → no tutor session → no memory access → no conversation access → no evidence creation → no AI call
```

This rule must remain true at all times. The school context failure policy ensures that every failure case enforces this rule.

## Rollback

If the live school-system connector is ever enabled and a failure cascade occurs:

1. Immediately disable the live connector (`SCHOOL_CONNECTOR_MODE=mock_only`)
2. Verify that mock adapter takes over without data loss
3. Run the full no-bypass audit
4. Do not re-enable until all failure causes are resolved
