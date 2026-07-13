import {
  Task040ChangeControlPolicy,
  Task040ChangeControlRule,
} from '../contracts/task040BackendFreezeContracts';
import { task040Repository } from '../repositories/task040BackendFreezeRepository';

export function buildChangeControlPolicy(): Task040ChangeControlPolicy {
  const rules: Task040ChangeControlRule[] = [
    {
      ruleName: 'no_unapproved_backend_change',
      description: 'No backend code changes are allowed without a new explicit task prompt.',
      required: true,
    },
    {
      ruleName: 'no_silent_drift',
      description: 'No accepted route/contract/service behavior may drift silently.',
      required: true,
    },
    {
      ruleName: 'no_production_deployment_by_freeze',
      description: 'No production deployment command is allowed by Task 040.',
      required: true,
    },
    {
      ruleName: 'no_live_expansion_by_freeze',
      description: 'No live AI/connector/notification expansion is allowed by Task 040.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_identify_task',
      description: 'Any future backend modification must identify the affected task owner.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_update_ledger',
      description: 'Any future backend modification must update the accepted task ledger.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_update_surface_manifest',
      description: 'Any future backend modification must update the backend surface manifest.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_run_targeted_tests',
      description: 'Any future backend modification must run targeted tests.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_run_full_suite',
      description: 'Any future backend modification must run the full backend suite when behavior changes.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_update_reports',
      description: 'Any future backend modification must update reports truthfully.',
      required: true,
    },
    {
      ruleName: 'future_modification_must_preserve_boundaries',
      description: 'Any future backend modification must preserve privacy/school identity/content/Socratic/Deen boundaries.',
      required: true,
    },
  ];

  return {
    policyName: 'Task 040 Backend Change Control Policy',
    createdAt: new Date().toISOString(),
    backendFrozen: true,
    rules,
    statement: 'After Task 040, backend logic is frozen. No backend code changes are allowed without a new explicit task prompt. No accepted route/contract/service behavior may drift silently. No production deployment command is allowed by Task 040. No live AI/connector/notification expansion is allowed by Task 040. Any future backend modification must: identify affected task owner, update accepted task ledger, update backend surface manifest, run targeted tests, run full backend suite when behavior changes, update reports truthfully, and preserve privacy/school identity/content/Socratic/Deen boundaries.',
  };
}

export function getChangeControlPolicy(): Task040ChangeControlPolicy {
  const existing = task040Repository.getChangeControlPolicy();
  if (existing) return existing;
  const policy = buildChangeControlPolicy();
  task040Repository.saveChangeControlPolicy(policy);
  return policy;
}
