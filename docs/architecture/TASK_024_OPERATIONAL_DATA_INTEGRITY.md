# Task 024 Operational Data Integrity

## Integrity Checks
- School identity integrity
- Roster mapping integrity
- Task 020 governance integrity
- Task 021 school integration integrity
- Task 022 content governance integrity
- Task 023 readiness integrity
- Phase 3 metadata integrity
- Audit event integrity
- No orphaned critical records

## Rules
- Checks are metadata-only
- Must not expose raw learner data
- Must detect missing schoolId
- Must detect cross-school mismatch
- Must detect missing source refs
- Must detect missing audit reason codes
- Must detect stale readiness dependency
