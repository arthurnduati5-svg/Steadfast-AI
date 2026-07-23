# Integration Deferred Boundary

## Rule
This project phase explicitly defers three types of integration:

1. **Frontend integration** — No frontend UI pages are built. Only backend API contracts, mocks, and tests exist for frontend consumers.
2. **Live school-system integration** — No real school-system API credentials are connected. School integration uses test fixtures, mocks, and contracts.
3. **Live AI provider integration** — No real AI provider API keys are connected. AI gateway uses adapters, mocks, and contracts.

## What Is Built
- Backend API endpoints (fully functional)
- Prisma persistence (all production models)
- Service logic (all core algorithms)
- Middleware guards (auth, school context, role)
- Route registration (all 50 route files)
- Endpoint contracts (full request/response schemas)
- API contract map (frontend-facing endpoints documented)
- Behavioral tests (existing 1100+ test files)
- Test fixtures and mocks

## What Is Deferred
| Item | Deferred To |
|------|-------------|
| Frontend UI page rendering | Task 037 |
| Frontend API client codegen | Task 037 |
| Live AI provider API key setup | Live AI integration phase |
| Live school-system OAuth/API keys | Live school-system integration phase |
| Production deployment (DNS/SSL/CDN) | Launch phase |
| Real pilot user onboarding | Pilot launch phase |
| Public SaaS onboarding/payment | Post-launch |

## Contract Stability
- Backend endpoint paths, methods, request schemas, response envelopes are frozen
- Any changes during integration must be backwards-compatible or explicitly versioned (v2)
- `schoolAuthMiddleware` and `requireVerifiedSchoolContext` are required for all learner/teacher routes
- Error envelopes follow a standardized `{ ok, error: { code, message } }` pattern

## Security During Deferred Integration
- No API keys, tokens, or secrets are stored in the codebase
- Database URLs are read from environment variables only
- AI provider calls pass through test adapters (not live providers)
- School-system calls use mock resolvers (not live APIs)
