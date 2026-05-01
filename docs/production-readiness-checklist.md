# Production Readiness Checklist (Steadfast AI)

## Railway Split Deploy Topology
- Service 1: `frontend` (Next.js)
- Service 2: `backend` (Express + Prisma)
- Shared: managed Postgres, managed Redis

## Railway Build/Start Commands
### Frontend service (repo root)
- Build: `npm run build`
- Start: `npm run start`

### Backend service (repo root)
- Build: `npm --prefix backend run build`
- Start: `npm --prefix backend run start`

## Required Environment Variables
### Backend (`backend` service)
- `NODE_ENV=production`
- `PORT` (Railway injects this)
- `JWT_SECRET` (required)
- `COPILOT_JWT_SECRET` (optional if using handoff HS256 tokens)
- `COPILOT_PUBLIC_KEY` (optional if using RS256 handoff tokens)
- `OPENAI_API_KEY`
- `DATABASE_URL`
- `REDIS_URL`
- `ALLOWED_ORIGINS=https://<your-frontend-domain>`
- `REQUEST_TIMEOUT_MS=120000`
- `KEEP_ALIVE_TIMEOUT_MS=65000`
- `HEADERS_TIMEOUT_MS=66000`
- `JSON_LIMIT=1mb`

### Frontend (`frontend` service)
- `NODE_ENV=production`
- `NEXT_PUBLIC_BACKEND_URL=https://<your-backend-domain>`
- `BACKEND_INTERNAL_URL=https://<your-backend-domain>` (or Railway private URL)
- `JWT_SECRET` (for `/api/copilot/handoff` session verification)
- `COPILOT_JWT_SECRET` or `COPILOT_PRIVATE_KEY` (for handoff token signing)
- `COPILOT_SCHOOL_ID=<school-id>`
- `COPILOT_EMBED_ORIGIN=https://<school-system-domain>`

## Capacity Target
- Target: `1000` concurrent students with stable latency.
- SLO suggestion:
  - `p95` chat response start `< 2.5s`
  - `p95` voice TTS start `< 1.2s`
  - Error rate `< 1%`

## Backend Deployment
- Run backend behind a reverse proxy/load balancer (Nginx/ALB/Cloud Run LB).
- Use at least `2-4` backend instances (horizontal autoscaling enabled).
- Ensure `ALLOWED_ORIGINS` is configured (no wildcard in production).

## Data Layer
- Use managed Postgres with connection pooling (PgBouncer or provider pooler).
- Ensure Prisma datasource points to pooled DB URL in production.
- Redis must be highly available and low-latency (same region as backend).

## Caching and Cost Control
- Keep Redis enabled for:
  - rate limiting
  - repeated AI answer cache
  - voice quota checks
- Keep chat history bounded per request (already enforced).

## AI/Voice Performance
- Keep voice chunking strategy as:
  - fast first chunk
  - buffered remainder to reduce pause handoffs
- Keep TTS input normalization enabled (markdown/punctuation cleanup).
- Monitor OpenAI API latency and configure retries with exponential backoff at infrastructure layer.

## Observability
- Centralize logs (Cloud Logging/Datadog/ELK).
- Track:
  - request count, p50/p95 latency, 4xx/5xx rate
  - OpenAI request duration and failure rate
  - Redis latency and error rate
  - DB query latency and pool saturation
- Add alerting thresholds for sustained p95 and error spikes.
- Use persisted latency endpoints:
  - `POST /api/copilot/latency/turn` (ingest per-turn timings)
  - `GET /api/copilot/latency/dashboard` (admin p50/p95 dashboard)
  - `GET /api/copilot/latency/alerts` (admin threshold breaches)
  - `PATCH /api/copilot/latency/alerts/:id/ack` (admin acknowledge)
- Optional threshold env tuning:
  - `LATENCY_THRESHOLD_STT_WARN_MS`, `LATENCY_THRESHOLD_STT_CRITICAL_MS`
  - `LATENCY_THRESHOLD_FIRST_TOKEN_WARN_MS`, `LATENCY_THRESHOLD_FIRST_TOKEN_CRITICAL_MS`
  - `LATENCY_THRESHOLD_DONE_WARN_MS`, `LATENCY_THRESHOLD_DONE_CRITICAL_MS`
  - `LATENCY_THRESHOLD_TTS_START_WARN_MS`, `LATENCY_THRESHOLD_TTS_START_CRITICAL_MS`
  - `LATENCY_THRESHOLD_TOTAL_WARN_MS`, `LATENCY_THRESHOLD_TOTAL_CRITICAL_MS`

## Load Test Before Release
- Execute staged load test:
  1. `100` concurrent for 15 min
  2. `400` concurrent for 20 min
  3. `1000` concurrent for 30 min
- Include mixed traffic:
  - chat requests
  - voice session start/stop
  - tts/stt endpoints
- Verify no memory leak (flat heap trend) and no connection exhaustion.

## Security and Reliability
- Keep `helmet`, CORS restrictions, and per-student rate limits enabled.
- Verify auth token validation in all copilot/voice routes.
- Verify frontend CSP includes `frame-ancestors` for your school domain.
- Enable graceful shutdown and zero-downtime rolling deployments.
- Keep database backups and tested restore procedure.

## Integration with Existing School System
- Ensure school SSO/session token includes one of: `userId`, `studentId`, `id`, or `sub`.
- Pass bearer token from school app to Copilot iframe host page.
- For embedded mode, configure:
  - `COPILOT_EMBED_ORIGIN` on frontend
  - same origin in school app allowed iframe policy
- Validate handoff endpoint:
  - `GET /api/copilot/handoff` returns `200` + token for signed-in student.
- Validate backend auth:
  - `GET /api/health` returns `200`
  - authenticated `GET /api/copilot/preload` returns `200`.

## Release Gate
- Typecheck, lint, and tests pass.
- Load test meets SLO.
- Rollout with canary (5% -> 25% -> 100%) and active monitoring.
