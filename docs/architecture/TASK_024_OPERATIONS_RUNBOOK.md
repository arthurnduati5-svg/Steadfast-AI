# Task 024 Operations Runbook

## Monitoring Runbook
- Owner: operations_team
- Trigger: scheduled health check
- Steps: run monitoring evaluation, check probes, verify alert policies
- Forbidden: accessing raw student data, exposing secrets
- Privacy: metadata only
- Escalation: degraded status → team lead

## Incident Runbook
- Owner: incident_response_team
- Trigger: detected incident signal
- Steps: detect, classify, contain, mitigate, resolve, postmortem
- Forbidden: raw learner data in logs, secrets in incident artifacts
- Privacy: safe summaries only

## Backup Runbook
- Owner: operations_team
- Trigger: scheduled or manual backup readiness check
- Steps: evaluate scope, owner, schedule, integrity, privacy boundary
- Forbidden: raw database dumps, real production backup
- Privacy: metadata only

## Restore Runbook
- Owner: operations_team
- Trigger: scheduled or manual restore drill
- Steps: dry-run only, verify plan, integrity, privacy boundary, rollback
- Forbidden: real restore, overwriting production data
- Privacy: metadata only

## Data Integrity Runbook
- Owner: operations_team
- Trigger: scheduled integrity check
- Steps: verify school identity, roster, governance, audit
- Forbidden: exposing raw learner data
- Privacy: metadata only

## Load Simulation Runbook
- Owner: performance_team
- Trigger: scheduled or manual simulation
- Steps: create plan, run dry-run, record metrics
- Forbidden: live AI calls, live connector calls
- Privacy: safe mock data only

## Privacy Escalation Runbook
- Owner: privacy_team
- Trigger: detected forbidden field or privacy event
- Steps: evaluate payload, strip forbidden fields, report
- Forbidden: exposing raw secrets or private data
- Escalation: privacy lead
