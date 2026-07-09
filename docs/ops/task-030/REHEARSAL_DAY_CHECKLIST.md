# Steadfast AI — Rehearsal Day Checklist

## Before Rehearsal

- [ ] Task 029 proof is accepted (`safeToStartTask030: true`)
- [ ] Task 029 final decision is `TASK_029_PASS_SAFE_TO_START_TASK_030`
- [ ] `TASK030_STAGING_REHEARSAL=1` is set
- [ ] `TASK030_NO_LIVE_STUDENTS=1` is set
- [ ] `NODE_ENV` is not `production` (or explicit staging override documented)
- [ ] Database URL is not production-like
- [ ] `LIVE_ROLLOUT_ENABLED` is not `true`
- [ ] All fixture identifiers use `*_task030_safe` suffix
- [ ] No live student data is present in fixtures
- [ ] Synthetic school fixture data is loaded
- [ ] Staff training pack is available

## During Rehearsal

- [ ] Admin journey: Load operations dashboard
- [ ] Admin journey: View stage summary
- [ ] Admin journey: View health summary
- [ ] Admin journey: View monitoring timeline
- [ ] Admin journey: View oversight queue
- [ ] Admin journey: Pause expansion
- [ ] Admin journey: Resume expansion after gate refresh
- [ ] Admin journey: Enable kill switch
- [ ] Admin journey: Verify student access blocked after kill switch
- [ ] Admin journey: Disable kill switch after recheck
- [ ] Admin journey: Execute rollback
- [ ] Admin journey: Verify expanded access blocked after rollback
- [ ] Admin journey: Generate completion review
- [ ] Admin journey: View reports
- [ ] Teacher journey: Denied dashboard access
- [ ] Teacher journey: View assigned oversight items
- [ ] Teacher journey: Denied pause/resume/kill-switch/rollback
- [ ] Student journey: View own status
- [ ] Student journey: Denied operations dashboard
- [ ] Student journey: Denied health internals
- [ ] Student journey: Denied oversight queue
- [ ] Student journey: Denied control actions
- [ ] Unknown role: Denied all access

## After Rehearsal

- [ ] Privacy scan passes
- [ ] JSON report validation passes
- [ ] Verification script exits 0
- [ ] Reports generated (`task-030-staging-rehearsal-report.json`, markdown, handoff)
- [ ] Logs archived to `logs/task-030/`
- [ ] No live student data was used
- [ ] No production data was modified
- [ ] No real school rollout was performed
- [ ] `safeToStartTask031` is honestly computed
- [ ] Final decision is recorded
