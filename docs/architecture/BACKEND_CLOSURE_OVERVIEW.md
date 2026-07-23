# Backend Closure Overview

## Mode
**Backend closure** — all backend logic is being audited, closed, proven persistent, route-registered, documented, and cleaned. Frontend integration is deferred. Live AI provider integration is deferred. Live school-system integration is deferred.

## Scope
| Area | Status |
|------|--------|
| Route registration | All 50 route files imported and mounted in `backend/src/index.ts` |
| Endpoint inventory | Complete (see `BACKEND_FRONTEND_API_CONTRACT_MAP.md`) |
| Frontend API contract map | Complete |
| Route guard & access control | Verified — `schoolAuthMiddleware` on all learner/teacher routes, `requireVerifiedSchoolContext` on tutor runtime routes, `requireRole` on admin/internal routes |
| Persistence closure | All critical state is Prisma-backed or documented dev/test-only fallback |
| Backend gap map | Complete (see `BACKEND_CLOSURE_GAP_MAP.md`) |
| Stale file cleanup | Complete (see `BACKEND_STALE_FILE_CLEANUP_REPORT.md`) |
| Docs updated | Yes |

## Route Count by Category
- **Health/Readiness**: 5 endpoints
- **Deployment Readiness**: 6 endpoints (all admin/internal)
- **Operations**: 17 endpoints (all admin/internal)
- **Conversation/Tutor Runtime**: 4 endpoints
- **Tutor State**: 13 endpoints
- **Learner Sessions**: 7 endpoints
- **Learner Memory**: 6 endpoints
- **Practice/Mastery/Revision**: 7 endpoints
- **Learner Recommendations**: 6 endpoints
- **Learner Preferences**: 5 endpoints
- **Adaptive Challenges**: 9 endpoints
- **Teacher Reports**: 7 endpoints (require verified school context)
- **Teacher Interventions**: 8 endpoints
- **Content Governance**: 14 endpoints
- **School Integration**: multiple endpoints
- **Admin Diagnostics**: multiple endpoints
- **Rate Limits**: multiple endpoints
- **Privacy/Governance**: multiple endpoints
- **Pilot Programs**: routes for tasks 025-035 (all admin/internal)
- **Total**: 200+ endpoints

## Persistence Strategy
- **Prisma-first**: All production models are in `backend/prisma/schema.prisma` (105 models)
- **In-memory fallback**: Repositories for tasks 024-028 use in-memory fallback with Prisma-backed production mode — `NODE_ENV=production` forces real Prisma
- **Cache stores**: Rate limit windows, circuit breaker states, budget guards use in-memory Maps (acceptable — cache-like, backed by config/deterministic logic)
- **No production-critical memory-only state**: All learner records, sessions, memory, evidence, mastery, curriculum governance are Prisma-backed

## Integration-Deferred Items
- Frontend UI wiring
- Live AI provider API key connection
- Live school-system API credential connection
- Real production deployment
- Production DNS/SSL/CDN setup
- Real pilot users
- Public SaaS onboarding/payment

## Key Files
- `backend/src/index.ts` — Express app with all routes mounted
- `backend/src/middleware/schoolAuthMiddleware.ts` — JWT auth guard
- `backend/src/middleware/schoolContextGuardMiddleware.ts` — Verified school context guard
- `backend/prisma/schema.prisma` — 105 production models
- `backend/src/repositories/` — Prisma-backed repositories with in-memory fallback
