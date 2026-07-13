# Task 036: Controlled Live School Launch Runtime

## Identity

- **Task:** 036
- **Name:** Controlled Live School Launch Runtime
- **Type:** Backend-only operating runtime
- **Scope:** Controlled single-school live launch

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Provide a safe, gated, observable runtime that enables a single approved school to launch live with the Steadfast AI Socratic tutor. All runtime behavior is controlled by launch gates, environment flags, a launch window, monitoring, health checks, pause/kill/rollback mechanisms, and strict privacy/content/Deen/Socratic boundaries.

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                    Task 036 Launch Runtime                        │
│                                                                  │
│  ┌──────────────────────┐   ┌────────────────────────────────┐  │
│  │ Task 035 Dependency  │──▶│ Launch Environment Gate        │  │
│  │ Gate                 │   │ (env flags, boundaries)        │  │
│  └──────────────────────┘   └──────────┬─────────────────────┘  │
│                                        ▼                        │
│                             ┌──────────────────────┐            │
│                             │ Launch Window Control │            │
│                             │ (scheduled window)    │            │
│                             └──────────┬───────────┘            │
│                                        ▼                        │
│                             ┌──────────────────────┐            │
│                             │ Launch Approval Gate  │            │
│                             │ (multi-role approval) │            │
│                             └──────────┬───────────┘            │
│                                        ▼                        │
│                             ┌──────────────────────┐            │
│                             │ Single School Scope  │            │
│                             │ Guard                 │            │
│                             └──────────┬───────────┘            │
│                                        ▼                        │
│              ┌──────────────────────────────────────┐           │
│              │         Runtime Monitoring            │           │
│              │  ┌────────┐ ┌────────┐ ┌──────────┐  │           │
│              │  │ Health │ │Metrics │ │ Observab.│  │           │
│              │  └────────┘ └────────┘ └──────────┘  │           │
│              └────────────────┬─────────────────────┘           │
│                               │                                 │
│              ┌────────────────▼─────────────────────┐           │
│              │ Health/Incident/Pause/Rollback/       │           │
│              │ Kill-Switch Runtime                   │           │
│              └────────────────┬─────────────────────┘           │
│                               │                                 │
│              ┌────────────────▼─────────────────────┐           │
│              │ Privacy/Content/Socratic/Deen         │           │
│              │ Boundary Enforcement                  │           │
│              └────────────────┬─────────────────────┘           │
│                               │                                 │
│              ┌────────────────▼─────────────────────┐           │
│              │ Safe Launch Read Model                │           │
│              │ (read-only, no data mutation)         │           │
│              └──────────────────────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

## Key Design Decisions

1. **No backend freeze** — Task 036 does not freeze the backend. The backend continues to accept changes. Only the launch runtime is gated.
2. **No production deployment** — Task 036 does not deploy. Deployment happens in a separate pipeline.
3. **No real external notifications** — All notifications are simulated or suppressed.
4. **No live AI provider expansion** — AI provider configuration remains as-is from Task 034/035.
5. **No live connector write expansion** — Connector writes remain at their existing level.
6. **Read-model only** — The launch read model does not mutate production data.
7. **Safe to start Task 040** — Task 036 enables safe progression to Task 040 (backend freeze) after launch verification.

## Verification Strategy

All gates are verified through the verification script (`scripts/verify-task036.ps1`), the runner script (`scripts/run-task036-live-school-launch.cjs`), and the report generator (`scripts/gen-task036-report.cjs`). Each gate produces a pass/fail result. All gates must pass for acceptance.

## Dependencies

- **Task 035** — Must have passed with `safeToStartTask036: true` before Task 036 begins.

## Out of Scope (Explicitly Blocked)

- Public SaaS launch
- Multi-school rollout
- Frontend UI changes
- Backend freeze
- Production deployment
- Real external notifications
- Live AI provider expansion
- Live connector write expansion
- Raw learner data exposure
- Private Deen/safeguarding/answer/provider/reasoning data exposure
