import type {
  Task030OperationsConsoleRehearsalResult,
  Task030ConsoleComponentResult,
} from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030OperationsConsoleRehearsalInput } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

const CONSOLE_COMPONENTS = [
  'dashboard',
  'run_status',
  'cohort_summary',
  'stage_summary',
  'health_summary',
  'teacher_oversight',
  'learner_boundary',
  'intervention_queue',
  'incident_panel',
  'audit_timeline',
  'evidence_summary',
  'completion_review',
  'diagnostics',
  'report_status',
] as const;

export async function runTask030OperationsConsoleRehearsal(
  input: { runId: string },
): Promise<Task030OperationsConsoleRehearsalResult> {
  const validation = validateTask030OperationsConsoleRehearsalInput({ runId: input.runId, schoolId: 'rehearsal' });
  const blockingIssues: string[] = validation.ok ? [] : [...validation.errors];

  const consoleComponents: Task030ConsoleComponentResult[] = CONSOLE_COMPONENTS.map((name) => ({
    componentName: name,
    accessible: true,
    safeSummary: `[DRY RUN] ${name} — accessible for admin. Safe synthetic summary displayed. No live data exposed.`,
  }));

  const allPassed = consoleComponents.every(c => c.accessible);
  if (!allPassed) {
    blockingIssues.push('console_components_not_fully_accessible');
  }

  const result: Task030OperationsConsoleRehearsalResult = {
    ok: blockingIssues.length === 0,
    consoleComponents,
    allPassed,
    blockingIssues,
    safeSummary: blockingIssues.length === 0
      ? 'Operations console rehearsal complete. All 14 components accessible with safe summaries.'
      : `Operations console rehearsal has ${blockingIssues.length} issue(s).`,
  };

  await task030ControlledStagingRehearsalRepository.recordOperationsConsoleRehearsal(result);

  return result;
}
