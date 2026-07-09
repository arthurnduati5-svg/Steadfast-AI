# Task 030 — Operations Console Rehearsal

> **Scope Boundary**
> - Task 030 is backend-only, dry-run, synthetic staging rehearsal only
> - Task 030 does **NOT** touch production data
> - Task 030 does **NOT** mutate live state

---

## Purpose

The Operations Console Rehearsal validates that all console components (inherited from Task 029) return safe, aggregate-only data when queried during the staging rehearsal. No live state mutation occurs. All console data shapes are verified against expected safe patterns.

## Console Components

### Dashboard Read Model
- **Rehearsal**: Request the full dashboard read model with synthetic admin token.
- **Validation**: All data fields contain aggregate/safe summaries. No raw student identities. No raw chat. No private memory.
- **Expected shape**: Run status, stage progression, health status, cohort counts — all using synthetic IDs.

### Stage Panel
- **Rehearsal**: Request stage progress with synthetic admin token.
- **Validation**: Returns aggregate counts only. No raw student names or IDs beyond safe synthetic identifiers. No stage internals beyond safe summaries.

### Health Panel
- **Rehearsal**: Request health snapshot with synthetic admin token.
- **Validation**: Returns aggregate metrics only (uptime %, error count, service status). No raw error details. No private data.
- **Safe explanation**: Health panel includes a safe explanation present field.

### Monitoring Timeline
- **Rehearsal**: Request timeline events with synthetic admin token.
- **Validation**: Returns safe event summaries only (event type, timestamp, safe description). No raw identities. No operational secrets.

### Oversight Queue
- **Rehearsal**: Request oversight items with synthetic admin token.
- **Validation**: Returns safe summaries with severity, category, and safe title. No raw student data. No private details. Critical items are highlighted.

### Control Panel
- **Rehearsal**: Simulate each control action (pause, resume, kill-switch enable/disable, rollback).
- **Validation**: Each action runs preflight in simulation mode. No actual Task 028 effectors are called. All actions return confirmation of dry-run.

### Rollback Panel
- **Rehearsal**: Simulate rollback initiation and confirmation.
- **Validation**: Audit events are recorded. Student access is marked blocked (in simulation). Learning evidence is not destructively deleted. Confirmation dialog is represented.

### Completion Review Panel
- **Rehearsal**: Generate completion review from synthetic data.
- **Validation**: Review includes honest `safeToStartTask031` decision based on all rehearsal outcomes. Blocking issues are truthfully reported.
- **Expected**: `safeToStartTask031: true` only if all gates and rehearsals pass.

### Report Panel
- **Rehearsal**: List report artifacts.
- **Validation**: Shows artifact paths and safe summaries. No raw logs in output.

## No Live State Mutation

| Operation | Rehearsal Behavior |
|-----------|--------------------|
| Pause expansion | Returns dry-run confirmation. No actual pause executed. |
| Resume expansion | Returns dry-run confirmation. No actual resume executed. |
| Enable kill switch | Returns dry-run confirmation. No actual kill invoked. Student status returns "blocked" in simulation only. |
| Disable kill switch | Returns dry-run confirmation. No actual kill switch disabled. Student status restored in simulation only. |
| Execute rollback | Returns dry-run confirmation. No actual rollback. Audit preserved in simulation. |
| Generate completion review | Computes result from synthetic data only. No persistent state change. |

## Validation Checklist

- [ ] Dashboard data shape is aggregate-only
- [ ] Stage panel shows aggregate counts, no raw identities
- [ ] Health panel shows aggregate metrics with safe explanation
- [ ] Timeline shows safe summaries, no raw identities
- [ ] Oversight shows safe summaries with severity
- [ ] Control panel actions run in dry-run mode only
- [ ] Rollback panel simulates correctly, audit preserved
- [ ] Completion review computes honest safeToStart
- [ ] Report panel shows paths only, no raw logs
- [ ] No live state mutation occurred