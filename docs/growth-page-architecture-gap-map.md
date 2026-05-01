# Growth Page Architecture Gap Map

Last updated: 2026-04-09
Scope owner: Product Engineering

## Snapshot (now)

- Growth in-page runtime now has executable destination routing support (`revision`, `media`, `new_session`, `growth`, `exam`, `focus`) through `frontend/lib/growth-action-routing.ts`.
- Fullscreen growth UI is wired to execute resolved plans end-to-end through the workspace shell callback.
- Integration coverage exists for routing behavior in `frontend/tests/growth-action-routing.integration.test.ts`.
- Demo fallback data is still active as resilience for missing growth endpoints.

## Learning Orbit Tracking Logic (Implemented)

This is now tracked with executable state logic in the frontend runtime (`frontend/lib/study-orbit-tracking.ts`) and wired into the Study Stream orbit panel (`frontend/components/copilot/fullscreen/FullscreenCopilotUI.tsx`).

### What gets tracked per orbit card

- `opens`: student opened a challenge or teach-back surface.
- `quickChecks`: student submitted a quick challenge answer for feedback.
- `teachBackChecks`: student submitted a teach-back explanation for feedback.
- `reflections`: reflection signal detected from student text.
- `strongChecks` / `closeChecks` / `retryChecks`: feedback quality distribution.
- `keepCount`: student explicitly kept an anchor/explanation.
- `stage`: computed stage (`orienting`, `attempting`, `reflecting`, `solidifying`, `ready_to_unlock`).
- `progressPercent`: computed 0-100 progress score.

### How reflection is detected (not manual tagging)

Reflection is auto-detected from the student draft text using heuristics:

- Minimum answer length gate (word-count threshold).
- Reasoning connectors (`because`, `therefore`, `means`, etc.).
- Self-monitoring language (`I realized`, `I was wrong`, `I used`, etc.).
- Correction language (`mistake`, `instead`, `next time`, etc.).
- Transfer language (`apply`, `similar`, `same pattern`, etc.).

If enough signals are present, `lastReflectionEvidence.detected` is set and counted in `reflections`.

### How stage + progress are computed

- Stage is derived from tracked evidence, not from static UI labels.
- Progress is a weighted score from engagement (opens/checks), reflection evidence, feedback quality, and consolidation (`keep` actions).
- `ready_to_unlock` requires both consolidation (`keep`) and learning evidence (`reflection` or `strong` check).

### UI behavior powered by this logic

- Learning Orbit panel now renders:
  - live stage label,
  - progress percentage + bar,
  - reflection status (`detected` vs `pending`),
  - unlock gate messaging based on tracked evidence.
- Queue cards show per-card stage/progress/reflection readiness.

### Persistence

- Tracking state is persisted in session storage under `steadfast.media.study.orbit-tracking.v1`.
- State is hydrated on load and pruned to active stream entries.

## Actionable Checklist + Owners

Legend:
- Priority: `P0` (blocker), `P1` (next), `P2` (hardening)
- Status: `[ ]` not started, `[-]` in progress, `[x]` done

### P0: Growth Runtime Execution Integrity

- [x] `P0` Implement shared action execution router for Growth plans.  
Owner: Frontend (Copilot Workspace)  
Done when: all supported destinations route through one utility entrypoint with deterministic fallbacks.

- [x] `P0` Wire Growth runtime panel to execute resolved plans from UI action state.  
Owner: Frontend (Copilot Workspace)  
Done when: runtime shows resolvable destination and can open it directly.

- [x] `P0` Preserve media-mode routing (`study_stream`, `creative_stream`, etc.) during execution.  
Owner: Frontend (Media Workspace)  
Done when: plan `mediaMode` is honored for both item-linked and destination-only media routes.

- [ ] `P0` Add route execution telemetry event (`growth_action_routed`) tied to plan intent + destination.  
Owner: Frontend + Backend Analytics  
Done when: dashboard can answer “which Growth actions were resolved vs executed vs dropped”.

### P0: Test Coverage (Real Behavior)

- [x] `P0` Add integration tests for growth action execution routing (not source-string contracts).  
Owner: QA Automation + Frontend  
Done when: tests assert handler calls and outputs for revision/media/new-session/growth flows.

- [ ] `P0` Add UI integration test for runtime CTA path (`resolve -> execute`) in Growth panel.  
Owner: QA Automation  
Done when: test validates button states (`Resolving`, `Opening`) and destination side effects.

- [ ] `P0` Add backend integration matrix for `/api/copilot/growth/action` intent-to-plan mapping.  
Owner: Backend (Growth Intelligence)  
Done when: each intent has a deterministic destination plan test with fallback behavior.

### P1: Growth Intelligence Data Reliability

- [-] `P1` Keep demo fallback data but gate it with explicit diagnostics banner + payload source tag.  
Owner: Frontend (Growth UI)  
Done when: every card declares `live` vs `demo` source and QA can force either mode.

- [ ] `P1` Backfill growth aggregates for users with sparse revision histories.  
Owner: Backend Data  
Done when: weak-topic/mistake/feed endpoints return stable empty-safe structures without UI synthesis.

- [ ] `P1` Align action-plan resolver with all Growth intents (`open_study_stream`, `open_creative_stream`, `view_worked_step`).  
Owner: Backend + AI Orchestration  
Done when: no intent silently downgrades to generic destination unless fallback is explicitly intended.

### P1: Cross-Project Integration Gaps

- [ ] `P1` Mount typed but not yet surfaced learning-intelligence endpoints in user UI (`why-this-next`, `intervention-*`, `mastery-pathway`).  
Owner: Frontend Platform  
Done when: API/UI map no longer lists these as “ready-for-UI but not mounted”.

- [ ] `P1` Unify Growth + Revision + Media cross-navigation persistence in workspace context state.  
Owner: Frontend Platform  
Done when: switching destinations preserves active target/context IDs consistently.

- [ ] `P1` Resolve port conflict in frontend local/dev loop (`EADDRINUSE :::9000`) with scripted fallback port strategy.  
Owner: DevEx / Tooling  
Done when: `npm run dev` auto-recovers or clearly instructs with one-command fix.

### P2: Hardening and Readiness

- [ ] `P2` Add responsive regression tests for Growth runtime/action rail (mobile + desktop).  
Owner: QA Automation  
Done when: key breakpoints are screenshot/asserted with no clipped controls.

- [ ] `P2` Add accessibility pass for Growth action controls (keyboard focus, ARIA labels, contrast).  
Owner: Frontend Accessibility  
Done when: no critical axe violations on growth destination.

- [ ] `P2` Add production SLOs for Growth endpoints (p95 latency, error rate, resolver success rate).  
Owner: Backend + SRE  
Done when: alerts fire on sustained degradation and feed into release gates.

## Ownership Map

- Frontend (Copilot Workspace): runtime panel, action execution UX, responsiveness.
- Frontend (Media Workspace): media-mode handling, destination consistency.
- Backend (Growth Intelligence): action resolver correctness, aggregate payload quality.
- AI Orchestration: intent quality and fallback intent semantics.
- QA Automation: integration and regression tests.
- DevEx / SRE: local reliability, CI checks, production observability.
