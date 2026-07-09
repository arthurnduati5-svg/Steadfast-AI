# TASK 032 — Live Student Privacy Boundary

**This service is backend-only. It is the primary privacy enforcement gate.**

## Purpose

The live student privacy boundary service (`task032LiveStudentPrivacyBoundaryService.ts`) is a runtime content inspection gate that blocks any response containing raw student private data. It is the last gate before runtime access is granted to a canary member.

## Forbidden Patterns (Critical)

| Pattern | Example | Action |
|---------|---------|--------|
| Student emails | `student@example.com` | Block |
| Student phone numbers | `+1234567890` | Block |
| Raw student chat | Full chat transcript | Block |
| Private learner memory | Learner model snapshot | Block |
| Teacher-only notes | Internal teacher notes | Block |
| Safeguarding details | Raw safeguarding records | Block |
| Deen-sensitive text | Private religious content | Block |
| Auth tokens | `Bearer eyJ...` | Block |
| Database URLs | `postgres://user:pass@host/db` | Block |
| API keys | `sk-proj-...` | Block |
| Answer keys | Protected answer keys | Block |
| Real rosters | Full student roster | Block |
| AI prompts | Raw prompts sent to provider | Block |
| Provider responses | Raw AI responses | Block |

## Safe Negative Detection

The service uses explicit safe-negative phrases to distinguish legitimate privacy check results from actual data leaks:
- `do not expose`
- `not exposed`
- `never exposed`
- `forbidden`
- Redacted/false markers

The phrase `should be blocked` does **not** qualify as a safe-negative — a pattern like `student@example.com should be blocked` is correctly flagged as a violation.

## Data Flow

```
PrivacyBoundaryGate
  -> Inspect outbound response content
  -> Scan for each forbidden pattern
  -> Check safe-negative context
  -> Block if unsafe content detected
  -> Allow if clean
```

## Forbidden Operations

- No raw student identifiers in responses
- No raw chat or learner memory in logs
- No secrets or credentials in any output
- No real roster data exposed at any stage
