# Frontend Integration Guide

## Version: task-037-v1
## Integration Mode: mock-ready-integration-deferred

---

## 1. Overview

This guide explains how the frontend team should consume the API contract pack, use mock fixtures during development, and prepare for live backend integration.

The backend is fully built and tested. All endpoints are registered, guarded, and persistent. The frontend can build against mock fixtures now and wire to live endpoints later.

---

## 2. Contract Pack Structure

All contracts live under `contracts/frontend-api/`:

| File | Purpose |
|------|---------|
| `shared-error.contracts.ts` | Shared envelope types, error codes, role/school-context metadata |
| `student.contracts.ts` | All student-facing endpoint contracts |
| `teacher.contracts.ts` | Teacher-facing endpoint contracts |
| `admin.contracts.ts` | Admin-facing endpoint contracts |
| `operations.contracts.ts` | Operations/internal endpoint contracts |
| `index.ts` | Bundle export |

---

## 3. Using Mock Fixtures Before Live Integration

Mock fixtures live under `mocks/frontend-api/`:

| File | Contents |
|------|----------|
| `student.fixtures.json` | Student tutor session, practice, mastery, progress |
| `teacher.fixtures.json` | Teacher class/student summaries, interventions |
| `admin.fixtures.json` | School integration, content governance, deployment |
| `operations.fixtures.json` | Incidents, backup, health ops |
| `error.fixtures.json` | All error code examples |
| `content-gap.fixtures.json` | Missing source, Deen source required, scholar referral |

### How to use mock fixtures

During frontend development, create an API client that either:
1. Reads from mock fixture JSON files directly
2. Uses `MockFrontendApiClient` from `mocks/frontend-api/mockFrontendApiClient.ts`

**Important**: Never embed fixture data directly into frontend pages. Always route through a client abstraction that can be swapped to the real backend later.

```typescript
// Example: client abstraction pattern
if (isSteadfastMockMode()) {
  return mockClient.sessionStart(request);
} else {
  return liveClient.sessionStart(request);
}
```

---

## 4. Handling Loading States

Every data-fetching component should show a loading indicator while the request is in flight.

The mock client includes a 200ms simulated delay. The real backend responds within 500ms for most requests and up to 5s for streaming AI turns.

---

## 5. Handling Empty States

Some endpoints return empty arrays or zero counts. Display helpful empty states:

| Scenario | Frontend Behavior |
|----------|-------------------|
| No practice attempts yet | "Start your first practice session to see your progress" |
| No revision items due | "All caught up! Check back later for review items" |
| No mastery snapshots | "Complete a practice session to build your mastery profile" |
| No session history | "Start a learning session to build your history" |

---

## 6. Handling Denied States

| Error Code | Frontend Behavior |
|------------|-------------------|
| `UNAUTHENTICATED` | Redirect to login. Do not show protected content. |
| `FORBIDDEN` | Show "You do not have permission." Log the role mismatch. |
| `MISSING_VERIFIED_SCHOOL_CONTEXT` | Prompt user to re-authenticate through school login. Do not load tutor, memory, or AI features. |

---

## 7. Handling Missing School Context

This is the most critical frontend state to handle correctly.

If the backend returns `MISSING_VERIFIED_SCHOOL_CONTEXT`:
- Do NOT initialize a tutor session
- Do NOT load learner memory
- Do NOT call AI endpoints
- Do NOT create evidence/attempt records
- Show: "We need your verified school session before opening the tutor."
- Action: Redirect to school context refresh / login

---

## 8. Handling Content Gaps

When the backend returns `CONTENT_GAP` or the curriculum context shows `contentGap: true`:

- Inform the student that the topic does not have an approved source yet
- Offer alternative topics if available
- If a scholar referral is available, explain the referral process
- Never fabricate an answer or use unapproved sources

---

## 9. Handling Deen Source Unavailable / Scholar Referral

When a Deen-sensitive topic lacks an approved source:
- Display: "This topic requires a verified Islamic source. A scholar referral is being prepared."
- Show the scholar name and credentials if a referral exists
- Offer approved alternative topics
- Never attempt to answer Deen questions without approved sources

---

## 10. Handling Degraded Mode

If the backend returns `DEGRADED_MODE`:
- Show: "Some features are temporarily limited. Core learning is still available."
- Disable AI chat and advanced features
- Keep practice, revision, and progress viewable
- Check at intervals whether normal mode has been restored

---

## 11. Handling Rate Limits and Quota

| Code | Frontend Behavior |
|------|-------------------|
| `RATE_LIMITED` | Show retry-after duration. Disable submit buttons temporarily. |
| `QUOTA_EXCEEDED` | Show quota reset time. Do not allow new AI turns. Keep offline features functional. |

---

## 12. Teacher-Safe Summaries

Teacher-facing endpoints never return:
- Raw student chat messages
- Private learner memory entries
- Answer keys
- Safeguarding raw details
- Deen-sensitive private student text

Teachers see only:
- Privacy-guarded summaries
- Mastery levels and trends
- Safe practice attempt counts
- Intervention action recommendations

The frontend must never display raw chat or private memory in the teacher view.

---

## 13. Avoiding Answer-Key Leakage

The frontend must:
- Never display answer keys in student views
- Never allow a learner to access teacher-only routes
- Never expose answer evaluation rubrics in student-facing components
- Use `ANSWER_KEY_PROTECTED` error handling if a learner attempts access

---

## 14. Preparing for Live Backend Connection

When ready to connect to the live backend:

1. Replace mock client calls with real `fetch()` / `axios` calls
2. Ensure `Authorization: Bearer <token>` header is sent for all protected routes
3. Ensure verified school context is established before tutor/AI calls
4. Test all error states against the real backend
5. Verify empty states return the expected shapes
6. Run the `task-037-*` contract tests to verify frontend assumptions match backend behavior
7. Check `docs/frontend/API_CONTRACT_VERSIONING_AND_CHANGE_CONTROL.md` for contract stability guarantees
