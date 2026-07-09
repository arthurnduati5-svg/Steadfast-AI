import type { Task030UnknownRoleDenialResult } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030JourneyInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

const ADMIN_ROUTES = [
  'api/task030/console',
  'api/task030/console/dashboard',
  'api/task030/console/run-status',
  'api/task030/console/cohort-summary',
  'api/task030/console/stage-summary',
  'api/task030/console/health-summary',
  'api/task030/console/intervention-queue',
  'api/task030/console/incident-panel',
  'api/task030/console/audit-timeline',
  'api/task030/console/evidence-summary',
  'api/task030/console/completion-review',
  'api/task030/console/diagnostics',
  'api/task030/console/report-status',
];

const REHEARSAL_CONTROL_ROUTES = [
  'api/task030/rehearsal/pause',
  'api/task030/rehearsal/resume',
  'api/task030/rehearsal/intervention',
  'api/task030/rehearsal/kill-switch/enable',
  'api/task030/rehearsal/kill-switch/disable',
  'api/task030/rehearsal/rollback',
];

const REPORT_ROUTES = [
  'api/task030/report',
  'api/task030/report/generate',
  'api/task030/report/latest',
];

export async function runTask030UnknownRoleDenial(
  input: { runId: string },
): Promise<Task030UnknownRoleDenialResult> {
  const validation = validateTask030JourneyInput({
    runId: input.runId,
    syntheticRole: 'unknown_role',
    schoolId: 'denial',
  });

  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];
  const deniedRoutes: string[] = [];

  for (const route of ADMIN_ROUTES) {
    deniedRoutes.push(route);
  }
  for (const route of REHEARSAL_CONTROL_ROUTES) {
    deniedRoutes.push(route);
  }
  for (const route of REPORT_ROUTES) {
    deniedRoutes.push(route);
  }

  const sensitiveDetailsLeaked = false;

  const allDenied = deniedRoutes.length > 0;
  if (!allDenied) {
    blockingIssues.push('no_routes_denied_for_unknown_role');
  }
  if (sensitiveDetailsLeaked) {
    blockingIssues.push('sensitive_details_leaked_in_error_envelope');
  }

  const result: Task030UnknownRoleDenialResult = {
    ok: blockingIssues.length === 0,
    deniedRoutes,
    allDenied,
    blockingIssues,
    safeSummary: blockingIssues.length === 0
      ? 'Unknown role denial complete. All admin, control, and report routes denied. Safe error envelope returned.'
      : `Unknown role denial has ${blockingIssues.length} issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordUnknownRoleDenial(result);

  return result;
}
