# Task 036: Runtime Monitoring

## Identity

- **Task:** 036
- **Component:** Runtime Monitoring
- **Type:** Backend-only observability and monitoring

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Provide real-time monitoring of the live single-school launch runtime. Monitoring covers health, performance, privacy, security, and operational metrics.

## Monitoring Dimensions

| Dimension | Metrics | Alert Threshold |
|-----------|---------|-----------------|
| Health | Uptime, process health, DB connectivity | Any failure |
| Performance | Latency p50/p95/p99, error rate | p99 > 5s, error rate > 1% |
| Auth | Auth success/failure rate, token validity | Failure rate > 5% |
| Privacy | Privacy gate pass/fail count | Any privacy gate failure |
| Socratic | Socratic gate pass/fail count | Any Socratic gate failure |
| Deen | Deen gate pass/fail count | Any Deen gate failure |
| Safety | Safety gate pass/fail count | Any safety gate failure |
| AI Provider | Provider call count, error rate, latency | Error rate > 5% |
| Memory | Memory read/write count, error rate | Error rate > 2% |
| Evidence | Evidence write count, error rate | Error rate > 2% |

## Monitoring Implementation

Monitoring is implemented through:
1. Structured logging with correlation IDs
2. Health check endpoints
3. Metric collection (synthetic budget-based)
4. Audit event recording
5. Runtime gate pass/fail tracking

## Verification

Runtime monitoring readiness is validated by:
1. `scripts/verify-task036.ps1` — checks monitoring flags and readiness
2. `scripts/run-task036-live-school-launch.cjs` — verifies monitoring is operational
