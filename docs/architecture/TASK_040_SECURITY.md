# Task 040 Security Architecture

## Authentication
All Task 040 routes are protected by:
1. `schoolAuthMiddleware` — verifies school JWT/auth token
2. `requireVerifiedSchoolContext` — ensures school context exists

## Authorization
- Role-based access is enforced in the route handler via role guards (admin, teacher, student, etc.)
- Only authenticated school users can access freeze endpoints
- Read endpoints are more permissive; write endpoints (change-control, freeze-decision) are restricted

## Privacy Protections
- No raw learner data stored or transmitted
- No private Deen text in any freeze artifact
- No safeguarding raw notes
- No hidden reasoning or provider payloads
- All forbidden patterns are actively scanned

## Data Isolation
- All freeze data is in-memory only (no persistence)
- No Prisma/PostgreSQL reads or writes
- No external API calls
- No logging of sensitive data

## Boundary Enforcement
- Safety scans run across all source code every time
- Change control policy creates an audit trail for any post-freeze modification
- Privacy scan script runs as a secondary check
- Regression checks ensure existing tests still pass
