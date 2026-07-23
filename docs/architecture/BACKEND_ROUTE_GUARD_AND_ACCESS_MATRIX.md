# Backend Route Guard and Access Matrix

## Auth Middleware

### schoolAuthMiddleware
- **File**: `backend/src/middleware/schoolAuthMiddleware.ts`
- **Behavior**: Extracts JWT from `Authorization: Bearer <token>`, verifies against `JWT_SECRET`, `COPILOT_JWT_SECRET`, or `COPILOT_PUBLIC_KEY`. Sets `req.user = { id, role }`.
- **Applied**: To all learner, teacher, and admin routes
- **If unauthorized**: Returns 401 with `{ success: false, message }`

### requireVerifiedSchoolContext
- **File**: `backend/src/middleware/schoolContextGuardMiddleware.ts`  
- **Behavior**: Ensures the request has a verified school identity context before allowing tutor runtime / AI calls
- **Applied**: To tutor conversation routes, teacher reports, learner sessions, privacy governance, content governance
- **If missing**: Returns 403

### requireRole
- **File**: `backend/src/lib/rbac.ts`
- **Behavior**: Ensures user has one of the specified roles
- **Applied**: To admin/internal routes (operations, deployment, pilot management)

## Route Access Matrix

### Public / No Auth
| Endpoint | Notes |
|----------|-------|
| `GET /api/health/live` | Liveness probe |
| `GET /api/health/ready` | Readiness probe |
| `GET /api/health/dependencies` | Dependency check |
| `GET /api/health/routes` | Route contract check |
| `GET /api/ready` | Legacy readiness |

### schoolAuthMiddleware Only
| Route Group | Endpoints |
|-------------|-----------|
| `/api/copilot/tutor-state` | GET /, POST /resolve, PATCH / |
| `/api/copilot/tutor-state/v2` | GET /v2, GET /v2/summary, GET /v2/history, POST /v2/resolve, PATCH /v2/patch, POST /v2/reset, POST /v2/snapshot, POST /v2/validate |
| `/api/copilot/learner-memory` | GET /, POST /events, POST /resolve, PATCH /:memoryId, DELETE /:memoryId |
| `/api/copilot/practice-mastery` | POST /attempts, GET /attempts, POST /next, GET /mastery, POST /mastery/resolve, PATCH /mastery/:id, GET /review-due |
| `/api/learner/recommendations` | GET /recommendations/next, GET /recommendations/:id/explanation, GET /revision/:id/why, GET /progress/narrative, GET /privacy/visibility, POST /recommendations/preference |
| `/api/learner/recommendations` | POST /:id/feedback, POST /:id/interaction, GET /profile, GET /tuning-context, PATCH /preferences |
| `/api/learner/challenges` | GET /challenges/next, POST /challenges, GET /challenges/:id, POST /:id/attempt, GET /:id/hint, GET /remediation/path, POST /remediation/:id/steps/:idx/complete, GET /difficulty/calibration |
| `/api/copilot/chat-pipeline` | POST routes |
| `/api/copilot/live-chat` | POST/GET routes |
| `/api/copilot/artifacts` | GET/POST routes |

### schoolAuthMiddleware + requireVerifiedSchoolContext
| Route Group | Endpoints |
|-------------|-----------|
| `/api/teacher/reports` | GET /students/:id/summary, GET /classes/:id/summary, GET /students/:id/evidence, GET /classes/:id/revision-due, GET /classes/:id/next-actions, GET /students/:id/next-actions, GET /audit |
| `/api/learner/sessions` | POST /sessions/start, GET /sessions/:id/state, POST /sessions/:id/step, POST /sessions/:id/transition, POST /sessions/:id/pause, POST /sessions/:id/complete, GET /sessions/:id/summary, GET /sessions/:id/events |
| `/api/tutor/conversation` | POST /conversation/turn, POST /conversation/stream |
| `/api/governance` | All privacy governance routes |

### schoolAuthMiddleware + requireRole('admin', 'counselor')
| Route Group | Endpoints |
|-------------|-----------|
| `/api/ops/*` | All operations routes (health, readiness, metrics, incidents, backup, restore, hardening, audit, reports) |
| `/api/deployment/*` | All deployment readiness routes |
| `/api/admin/rate-limits` | Rate limit admin routes |

### schoolAuthMiddleware + internal role checks
| Route Group | Role Requirements |
|-------------|------------------|
| `/api/content-governance/*` | Teacher/admin for most, admin/deen_reviewer for deen-sensitive |
| `/api/integrations/school/*` | School admin |
| `/api/pilot/*` | Admin/internal (tasks 025-035) |

## Learner-Protected Routes
Learners must **never** access:
- `/api/ops/*` — Operations/internal routes
- `/api/deployment/*` — Deployment readiness
- `/api/admin/*` — Admin diagnostics
- `/api/pilot/*` — Pilot management (except own status in task 029)
- `/api/content-governance/diagnostics` — Content governance diagnostics
- `/api/teacher/reports/*` — Teacher reports
- `/api/content-governance/sources/*/review` — Source approval actions
- `/api/content-governance/import/*` — Curriculum import
