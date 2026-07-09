# TASK 031 — Observability and Latency Budget

**This doc is backend-only and staging-only. No live production traffic.**

## Observability Baseline

Safe observability metadata for:
- Request correlation
- School context denial
- Role denial
- Route smoke pass/fail
- Latency bucket
- Error count bucket
- Blocked reason codes
- Privacy guard result

No raw request bodies, raw learner text, or secrets are collected.

## Latency/Error Budget

Deterministic synthetic metrics with budgets:
- `routeSmokeP95Ms <= 1500`
- `copilotBootstrapP95Ms <= 2000`
- `tutorContextP95Ms <= 2000`
- `operationsSmokeP95Ms <= 1500`
- `errorRate <= 0.01`
- `criticalErrorCount === 0`
- `timeoutCount === 0`