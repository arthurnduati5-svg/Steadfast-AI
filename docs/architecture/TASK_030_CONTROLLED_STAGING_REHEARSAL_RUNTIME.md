# Task 030 — Controlled Staging Rehearsal Runtime

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** build canary readiness/activation
> - Task 030 does **NOT** build rollout
> - Task 030 does **NOT** build school-wide launch
> - Task 030 does **NOT** deploy
> - Task 030 does **NOT** send real communication
> - Task 030 does **NOT** call live AI
> - Task 030 does **NOT** write live school connectors
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Overview

The Controlled Staging Rehearsal Runtime is a backend-only orchestration layer that validates synthetic dry-run rehearsal of expansion operations before any canary or rollout. It enforces a no-live-student guard, a staging environment gate, role-token authentication, and a complete state machine for rehearsal progression. All data is synthetic; all actions are dry-run; all outputs are safe metadata.

## Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Controlled Staging Rehearsal Runtime                 │
│                                                                      │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐  │
│  │     Dependency Gate          │  │     Staging Environment Gate │  │
│  │  (Task 029 Proof Loader)     │  │  (env vars, no-live-student) │  │
│  └──────────────┬───────────────┘  └──────────────┬───────────────┘  │
│                 │                                 │                  │
│  ┌──────────────┴─────────────────────────────────┴──────────────┐  │
│  │             Rehearsal State Machine                             │  │
│  │  created → preflight_running → preflight_passed →              │  │
│  │  journeys_running → operations_rehearsal_running →             │  │
│  │  rollback_drill_running → training_pack_generated →           │  │
│  │  report_generated → accepted_ready | blocked                    │  │
│  └──────────────────────────────┬─────────────────────────────────┘  │
│                                 │                                    │
│  ┌──────────────────────────────┴──────────────┐                    │
│  │          Rehearsal Sub-Systems              │                    │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │                    │
│  │  │ Synthetic │ │ Role     │ │ Journey     │  │                    │
│  │  │ School    │ │ Token    │ │ Rehearsals  │  │                    │
│  │  │ Fixture   │ │ Matrix   │ │ (4 roles)   │  │                    │
│  │  ├──────────┤ ├─────────-┤ ├─────────────┤  │                    │
│  │  │ Operations│ │ Control  │ │ Staff       │  │                    │
│  │  │ Console   │ │ Action & │ │ Training    │  │                    │
│  │  │ Rehearsal │ │ Rollback │ │ Pack        │  │                    │
│  │  │           │ │ Drills   │ │ Generator   │  │                    │
│  │  └──────────┘ └──────────┘ └─────────────┘  │                    │
│  └──────────────────────────────────────────────┘                    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Evidence Ledger & Reporting Engine                            │    │
│  │  (safe metadata only → report.json → safeToStartTask031)      │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  Operations Runbook                                           │    │
│  │  (step-by-step dry-run rehearsal guide)                      │    │
│  └──────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Task 029 Backend Services                       │
│            (expansion operations console runtime contracts)          │
└──────────────────────────────────────────────────────────────────────┘
```

## Key Services and Roles

### Task 029 Dependency Gate
Validates that Task 029 proof exists, its acceptance commit (`2ef56aa`) and implementation commit (`4e3ed4c`) are verified, `safeToStartTask030` is `true`, and `finalDecision` matches. Without acceptance, the rehearsal is blocked and returns `DEPENDENCY_GATE_BLOCKED`.

### Staging Environment Gate
Checks environment configuration: `TASK030_STAGING_REHEARSAL=1`, `TASK030_NO_LIVE_STUDENTS=1`, `NODE_ENV` is not `production`, database URL is not production-like, `LIVE_ROLLOUT_ENABLED` is not `true`. If any check fails, the gate returns `STAGING_GATE_BLOCKED`.

### Synthetic School Fixture
Generates a completely synthetic school data set: 1 school (`staging_rehearsal_school_task030_safe`), 1 admin, 1 operator, 3 teachers, 12 learners, 1 synthetic cohort. All IDs use the `task030_safe_` prefix. No real data is used.

### Role Token Matrix
Defines 5 roles with synthetic tokens in format `task030_synthetic_token_<role>_<uuid_fragment>`. Stores role definitions, token format, and a permission matrix.

### Rehearsal State Machine
Orchestrates rehearsal progression through defined states. Each transition requires validation. Terminal states: `accepted_ready` (all gates pass) or `blocked` (any gate fails).

### Journey Rehearsals
Four journey paths: admin/operator (full console + control actions), teacher (restricted oversight only), student (self-only status), unknown role (complete denial). All journey data is synthetic.

### Operations Console Rehearsal
Dry-run reads of all console read models (dashboard, stages, health, timeline, oversight). No live state mutation occurs. Rehearsed outputs are compared against expected safe shapes.

### Control Action and Rollback Drills
Dry-run simulations of pause, resume, kill-switch, and rollback. All operations are synthetic-only; no production effectors are invoked. Rollback drill verifies audit preservation and safe summary generation.

### Staff Training Pack
Generates training documentation set: staff training pack, admin/operator runbook, teacher quick-start, student-safe message template, rollback/kill-switch drill guide, rehearsal day checklist. All docs are privacy-safe and synthetic-only.

### Evidence and Reporting
Append-only evidence ledger recording safe metadata (timestamps, state transitions, gate results, role journey outcomes, drill outcomes). No PII, no raw data, no AI prompts, no provider responses. Report engine produces structured JSON and Markdown reports. `safeToStartTask031` is computed honestly from all gate and rehearsal results.

## Security Boundaries

| Boundary | Rule |
|----------|------|
| **No live data** | All fixtures use `task030_safe_` prefix. No real student names, emails, phones, or rosters. |
| **No real comms** | No email, SMS, or push notifications are sent. |
| **No AI calls** | No live AI inference or model calls. |
| **No production mutation** | No CREATE, UPDATE, DELETE on production database. No production school connectors. |
| **No secrets exposure** | Evidence ledger excludes tokens, keys, URLs, and passwords. |
| **No role escalation** | Unknown role denied all access. Teacher cannot escalate to admin. Student cannot escalate to teacher. |
| **No privacy leak** | Evidence and reports contain aggregate/safe metadata only. Raw chat, learner memory, safeguarding data, and teacher-only notes are excluded. |