# TASK 031 — Staging Smoke / Canary Readiness Runtime

**Task 031 is backend-only.**
**Task 031 is staging-only.**
**Task 031 is synthetic-only.**
**Task 031 is smoke-check-only.**
**Task 031 is canary-readiness-only.**
**Task 031 does not activate canary.**
**Task 031 does not observe canary.**
**Task 031 does not roll out.**
**Task 031 does not modify frontend UI.**
**Task 031 does not deploy.**
**Task 031 does not use real students.**

## Purpose

Create a safe backend runtime that proves the system is ready to prepare for a controlled canary, without activating any canary traffic.

## Scope

- Task 030 accepted proof loader
- Staging environment gate
- No-live-student guard
- Synthetic staging school identity fixture
- Staging role matrix
- Smoke run state machine
- Backend route smoke runner
- Copilot bootstrap smoke
- Tutor session/context smoke
- Embed handoff smoke
- Student preflight smoke
- Teacher oversight smoke
- Admin/operator monitoring smoke
- Operations console smoke
- Observability baseline
- Latency/error budget
- Canary readiness decision
- Safe evidence ledger
- Diagnostics
- Report generation
- Backend routes
- Tests
- Safety scans

## Non-Scope

- Task 032 controlled canary activation
- Task 033 canary observation
- Task 034 controlled limited rollout
- Task 035 school-wide launch readiness
- Task 040 backend freeze
- Canary traffic routing
- Frontend UI
- Production deployment

## Architecture

All services are synthetic-only. No real student data is used. All identifiers use safe prefixes (`synthetic_*`). No live AI providers are called. Routes require school auth middleware and verified school context.