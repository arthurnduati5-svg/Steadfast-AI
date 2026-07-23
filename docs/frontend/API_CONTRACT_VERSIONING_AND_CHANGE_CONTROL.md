# API Contract Versioning and Change Control

## Version: task-037-v1
## Current Contract Bundle Version: task-037-v1
## Integration Mode: mock-ready-integration-deferred

---

## 1. Contract Version

All contracts in `contracts/frontend-api/` carry a `CONTRACT_VERSION` constant:

```typescript
export const CONTRACT_VERSION = "task-037-v1";
```

The bundle version is exported from `index.ts`:

```typescript
export const API_CONTRACT_BUNDLE_VERSION = "task-037-v1";
```

---

## 2. How Breaking Changes Are Recorded

A breaking change is any change that:
- Removes or renames an existing endpoint path
- Changes the HTTP method of an existing endpoint
- Removes a required field from a request body
- Changes the type of an existing field in request or response
- Removes an error code from the shared error set
- Changes the role requirement of an existing endpoint
- Changes the school context requirement of an existing endpoint

Breaking changes must be:
1. Recorded in a `BREAKING_CHANGES.md` file under `contracts/frontend-api/`
2. New contract version (e.g., `task-038-v1` or `task-037-v2`)
3. Old contracts preserved for at least one version cycle

---

## 3. Frontend/Backend Contract Changes Review Process

| Phase | Action |
|-------|--------|
| Proposed change | Document in issue/PR with before/after contract diff |
| Impact analysis | Identify all affected frontend screens and workflows |
| Backend review | Confirm backend implementation matches new contract |
| Frontend review | Confirm frontend can consume new contract |
| Version bump | Increment contract version |
| Fixture update | Update mock fixtures to match new contracts |
| Test update | Update contract consistency tests |

---

## 4. Mock Fixture Update Policy

When contracts change:
1. Update `contracts/frontend-api/*.contracts.ts` types first
2. Update `mocks/frontend-api/*.fixtures.json` to match new shapes
3. Verify all fixtures still parse as valid JSON
4. Verify fixtures still pass privacy/leak scan
5. Update any tests that reference specific fixture values

---

## 5. Error Envelope Changes

Error codes follow a strict lifecycle:

| Stage | Meaning |
|-------|---------|
| `active` | Fully documented and implemented |
| `deprecated` | Still valid but should not be used in new code |
| `removed` | No longer in the contract pack |

When adding a new error code:
1. Add to `shared-error.contracts.ts` `ApiErrorCode` union
2. Add to `ERROR_STATUS_MAP`
3. Add to `ERROR_SAFE_MESSAGES`
4. Add example to `error.fixtures.json`
5. Add to `FRONTEND_ERROR_STATE_PLAYBOOK.md`

---

## 6. Route Deprecations

When deprecating a route:
1. Mark as `deprecated` in the frontend workflow map
2. Keep the route functional for at least one version cycle
3. Document the replacement route
4. Update `STUDENT_ENDPOINT_INTEGRATION_STATUS` or equivalent
5. Add a deprecation warning header in the backend response

---

## 7. Integration-Deferred Endpoint Promotion

When an integration-deferred endpoint is ready for live use:

1. Update `IntegrationStatus` from `"integration-deferred"` to `"backend-ready"`
2. Verify the endpoint exists in the backend route inventory
3. Verify it has proper auth, role, and school context guards
4. Add/update contract consistency tests
5. Update the frontend workflow map
6. Announce in the integration channel

---

## 8. Frontend Integration Verification Later

When the frontend team connects to the live backend:

1. Run `task-037-*` contract tests against the backend
2. Verify all documented endpoint paths resolve
3. Verify all error codes return expected HTTP status codes
4. Verify role guards work as documented
5. Verify school context guards work as documented
6. Run privacy/leak scan against the integrated frontend

---

## 9. Contract File Change Log

| File | Version | Last Updated | Change |
|------|---------|-------------|--------|
| `contracts/frontend-api/shared-error.contracts.ts` | task-037-v1 | 2026-06-30 | Initial creation |
| `contracts/frontend-api/student.contracts.ts` | task-037-v1 | 2026-06-30 | Initial creation |
| `contracts/frontend-api/teacher.contracts.ts` | task-037-v1 | 2026-06-30 | Initial creation |
| `contracts/frontend-api/admin.contracts.ts` | task-037-v1 | 2026-06-30 | Initial creation |
| `contracts/frontend-api/operations.contracts.ts` | task-037-v1 | 2026-06-30 | Initial creation |
| `contracts/frontend-api/index.ts` | task-037-v1 | 2026-06-30 | Initial creation |
