# Task 036: Safe Launch Read Model

## Identity

- **Task:** 036
- **Component:** Safe Launch Read Model
- **Type:** Backend-only read-only data model

## Scope Boundaries

Task 036 is backend-only. Task 036 is a controlled single-school live launch only. Task 036 does not launch public SaaS. Task 036 does not launch multiple schools. Task 036 does not build frontend UI. Task 036 does not freeze backend. Task 036 does not deploy. Task 036 does not send real external notifications. Task 036 does not expand live AI providers. Task 036 does not expand live connector writes. Task 036 does not expose raw learner data. Task 036 does not expose private Deen, safeguarding, answer, provider, or hidden reasoning data.

## Purpose

Provide a read-only data model for the launch runtime. The read model is used to serve launch status, gate results, and monitoring data without mutating any production data.

## Design Principles

1. **Read-only** — The read model does not create, update, or delete production data.
2. **Safe summaries only** — All data served through the read model uses safe summaries, not raw data.
3. **No raw private data** — The read model never exposes raw learner data, Deen text, safeguarding details, or hidden reasoning.
4. **Derived from gates** — Read model data is derived from gate results and monitoring, not from production queries.
5. **No production data mutation** — `productionDataMutationExecuted` must be `false`.

## Read Model Structure

```typescript
interface SafeLaunchReadModel {
  taskId: '036';
  gates: {
    task035DependencyGatePassed: boolean;
    launchEnvironmentGatePassed: boolean;
    launchWindowPassed: boolean;
    launchApprovalPassed: boolean;
    singleSchoolScopePassed: boolean;
    runtimeMonitoringReady: boolean;
    healthIncidentPauseRollbackReady: boolean;
    privacyContentSocraticDeenBoundariesPassed: boolean;
  };
  launchStatus: 'pending' | 'active' | 'paused' | 'rolled_back' | 'killed';
  safeSummary: string;
  generatedAt: string;
}
```

## Constraints

- `productionDataMutationExecuted` MUST be `false`
- No write operations to production tables
- No real external API calls
- No live connector writes beyond existing scope
- No live AI provider expansion

## Verification

The read model is validated by:
1. `scripts/run-task036-live-school-launch.cjs` — confirms read-only behavior
2. `scripts/task036-json-validate.cjs` — validates report structure confirms no mutation
3. `scripts/verify-task036.ps1` — includes read model verification
