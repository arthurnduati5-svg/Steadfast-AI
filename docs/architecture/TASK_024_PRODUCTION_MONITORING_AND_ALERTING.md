# Task 024 Production Monitoring and Alerting

## Monitoring Coverage
Required monitoring probes:
- health probe
- readiness probe
- school auth gate
- Task 020 governance
- Task 021 school integration
- Task 022 content governance
- Task 023 readiness
- error rate
- latency
- AI egress block
- privacy events
- backup/restore readiness
- data integrity

## Alert Categories
- school_auth_denial_spike
- cross_school_attempt_spike
- task020_governance_block_spike
- task021_identity_mapping_failure_spike
- task022_source_gap_spike
- task023_readiness_gate_failure
- ai_egress_block_event
- provider_disabled_event
- safeguarding_boundary_event
- privacy_boundary_event
- backup_readiness_failure
- restore_drill_failure
- data_integrity_failure
- latency_threshold_exceeded
- error_rate_threshold_exceeded
- load_simulation_failure

## Alert Severities
info, warning, error, critical, security, safeguarding, privacy, blocked, unknown

## Rules
- Critical privacy/safeguarding/auth failures must have owner and escalation
- Alerts must not contain raw payloads, secrets, or raw learner data
- Missing critical probe blocks operations readiness
