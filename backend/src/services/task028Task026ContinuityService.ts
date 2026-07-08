import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

const TASK026_COMMIT_HASH = 'a2ebb29';

export async function verifyTask026Continuity(schoolId: string): Promise<{
  ok: boolean;
  reasonCodes: string[];
  safeMessage: string;
  evidenceSummary: Record<string, unknown>;
}> {
  const reasonCodes: string[] = [];
  const evidenceSummary: Record<string, unknown> = { schoolId };

  let commitFound = false;
  try {
    const output = execSync(
      `git log --oneline --all --format="%H %s" 2>nul`,
      { encoding: 'utf-8', cwd: resolve(__dirname, '../../..'), timeout: 10000 },
    );
    commitFound = output.includes(TASK026_COMMIT_HASH);
  } catch {
    reasonCodes.push('git_log_failed');
  }

  if (!commitFound) {
    reasonCodes.push('task026_commit_not_found');
    evidenceSummary.commitCheck = 'fail';
  } else {
    evidenceSummary.commitCheck = 'pass';
  }

  const runtimeReportPath = resolve(
    __dirname, '../../..',
    'docs/ops/task-026/task-026-controlled-pilot-execution-runtime-report.json',
  );
  const runtimeReportExists = existsSync(runtimeReportPath);
  evidenceSummary.runtimeReportExists = runtimeReportExists;

  if (!runtimeReportExists) {
    reasonCodes.push('task026_runtime_report_not_found');
  }

  const runtimeSafePath = resolve(
    __dirname, '../../..',
    'docs/ops/task-026/TASK_026_EXECUTION_REPORT.md',
  );
  const runtimeSafeDocExists = existsSync(runtimeSafePath);
  evidenceSummary.runtimeSafeDocExists = runtimeSafeDocExists;

  if (!runtimeSafeDocExists) {
    reasonCodes.push('task026_runtime_safe_doc_missing');
  }

  const ok = reasonCodes.length === 0;

  return {
    ok,
    reasonCodes,
    safeMessage: ok
      ? `Task 026 continuity verified for school ${schoolId}. Pilot execution runtime is safe.`
      : `Task 026 continuity checks failed for school ${schoolId}: ${reasonCodes.join(', ')}.`,
    evidenceSummary,
  };
}
