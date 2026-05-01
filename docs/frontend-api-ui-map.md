# Frontend API UI Map

Source of truth:
- [frontend/lib/api.ts](/c:/Users/HP/Steadfast-AI/frontend/lib/api.ts)
- `FRONTEND_API_ENDPOINTS`
- `FRONTEND_UI_SURFACES`
- `FRONTEND_UI_ENDPOINT_MAP`
- `FRONTEND_COMPONENT_ENDPOINT_MAP`

This file is a reading guide for the live UI integration. The authoritative transport contract lives in `api.ts`.

## Component-level mapping

For endpoint-to-UI ownership by component, use `FRONTEND_COMPONENT_ENDPOINT_MAP` from `frontend/lib/api.ts`.
It is generated from the endpoint registry touchpoints and is intended to prevent drift when we add or move UI logic.

## Live user surfaces

### Widget embed
- `GET /api/copilot/handoff`
  Used by [CopilotWidget.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/CopilotWidget.tsx)

### Study workspace bootstrap
- `GET /api/copilot/preload`
- `GET /api/copilot/preferences`
- `GET /api/copilot/memory/student`
  Used by [steadfast-copilot.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/steadfast-copilot.tsx)

### Recent Study
- `GET /api/copilot/history`
- `GET /api/copilot/session/:id`
- `POST /api/copilot/session/:id/delete`
  Driven by [steadfast-copilot.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/steadfast-copilot.tsx) and rendered in [history-tab.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/history-tab.tsx)

### Study chat
- `POST /api/copilot/new-session`
- `POST /api/copilot/chat`
- `POST /api/copilot/message`
- `POST /api/copilot/research`
- `POST /api/copilot/video-recommend`
- `GET /api/copilot/video/:id/context`
- `PATCH /api/copilot/session/:id`
- `POST /api/copilot/messages/:id/edit`
- `POST /api/copilot/artifacts/parse`
- `POST /api/copilot/latency/turn`
  Used by [steadfast-copilot.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/steadfast-copilot.tsx)

### Learning-quality instrumentation
- `POST /api/copilot/learning-effect-event`
  Used by [steadfast-copilot.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/steadfast-copilot.tsx)

### Revision
- `GET /api/copilot/revision`
- `GET /api/copilot/revision/collections/:id`
- `PATCH /api/copilot/revision/:id`
- `POST /api/copilot/revision/:id/action`
- `GET /api/copilot/revision/group-suggestions`
- `POST /api/copilot/revision/group-suggestions/:id/apply`
- `POST /api/copilot/revision`
  Driven by [steadfast-copilot.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/steadfast-copilot.tsx) and rendered in [revision-tab.tsx](/c:/Users/HP/Steadfast-AI/frontend/components/revision-tab.tsx)

### Voice concierge
- `GET /api/copilot/voice/balance`
- `POST /api/copilot/voice/session/start`
- `POST /api/copilot/voice/session/stop`
- `POST /voice/stt`
- `POST /voice/tts`
  Used by [useVoiceController.ts](/c:/Users/HP/Steadfast-AI/AI/useVoiceController.ts)

### Safety console
- `GET /api/copilot/safety/alerts`
- `GET /api/copilot/safety/alerts/:id`
- `PATCH /api/copilot/safety/alerts/:id/status`
- `GET /api/copilot/safety/chats`
  Used by [page.tsx](/c:/Users/HP/Steadfast-AI/frontend/app/safety/page.tsx)

### Founder-quality admin surfaces
- `GET /api/copilot/effectiveness-summary`
- `GET /api/copilot/constitution-health`
- `GET /api/copilot/founder-truth`
  Admin-only payloads documented in [api.ts](/c:/Users/HP/Steadfast-AI/frontend/lib/api.ts) for internal founder/ops use.

## Ready-for-UI bridge coverage

These endpoints are documented and typed in `api.ts`, but they are not yet mounted in the current user-facing UI:

- Study planning
  - `/api/copilot/study-plans`
  - `/api/copilot/study-goals`
  - `/api/copilot/progress-summary`
  - `/api/copilot/weak-topics`
- Learning intelligence
  - `/api/copilot/learning-profile`
  - `/api/copilot/academic-memory`
  - `/api/copilot/concept-dependencies`
  - `/api/copilot/intervention-suggestions`
  - `/api/copilot/tutor-policy`
  - `/api/copilot/why-this-next`
  - `/api/copilot/intervention-effect`
  - `/api/copilot/intervention-effectiveness`
  - `/api/copilot/semester-plan`
  - `/api/copilot/semester-plans`
  - `/api/copilot/mastery-pathway`
  - `/api/copilot/school-safe-report`

## Boundary rule

Browser UI code should use `frontend/lib/api.ts` only.

Allowed bridge layers:
- `frontend/app/api/copilot/[...path]/route.ts`
- `frontend/app/api/copilot/chat/route.ts`
- `frontend/app/api/copilot/handoff/route.ts` (local token issuer, not backend proxy)
- `frontend/app/voice/*`

Excluded from the browser bridge rule:
- `frontend/lib/mock-auth.ts`
- [actions.ts](/c:/Users/HP/Steadfast-AI/frontend/app/actions.ts) for the remaining server-only daily objectives helper
