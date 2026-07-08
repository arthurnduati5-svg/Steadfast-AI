import { existsSync } from 'fs';
import { resolve } from 'path';

interface GovernanceCheck {
  label: string;
  requiredReportPaths: string[];
}

const GOVERNANCE_CHECKS: GovernanceCheck[] = [
  {
    label: 'task020',
    requiredReportPaths: [
      'docs/ops/task-020/task-020-privacy-governance-report.json',
      'docs/ops/task-020/TASK_020_PRIVACY_REPORT.md',
    ],
  },
  {
    label: 'task021',
    requiredReportPaths: [
      'docs/ops/task-021/task-021-school-identity-report.json',
      'docs/ops/task-021/TASK_021_SCHOOL_IDENTITY_REPORT.md',
    ],
  },
  {
    label: 'task022',
    requiredReportPaths: [
      'docs/ops/task-022/task-022-content-governance-report.json',
      'docs/ops/task-022/TASK_022_CONTENT_REPORT.md',
    ],
  },
  {
    label: 'task023',
    requiredReportPaths: [
      'docs/ops/task-023/task-023-deployment-report.json',
      'docs/ops/task-023/TASK_023_DEPLOYMENT_REPORT.md',
    ],
  },
  {
    label: 'task024',
    requiredReportPaths: [
      'docs/ops/task-024/task-024-operations-report.json',
      'docs/ops/task-024/TASK_024_OPERATIONS_REPORT.md',
    ],
  },
  {
    label: 'task025',
    requiredReportPaths: [
      'docs/ops/task-025/task-025-pilot-readiness-report.json',
      'docs/ops/task-025/TASK_025_PILOT_READINESS_REPORT.md',
    ],
  },
  {
    label: 'task026',
    requiredReportPaths: [
      'docs/ops/task-026/task-026-controlled-pilot-execution-runtime-report.json',
      'docs/ops/task-026/TASK_026_EXECUTION_REPORT.md',
    ],
  },
  {
    label: 'task027',
    requiredReportPaths: [
      'docs/ops/task-027/task-027-pilot-expansion-report.json',
      'docs/ops/task-027/TASK_027_PILOT_EXPANSION_REPORT.md',
    ],
  },
];

export async function verifyGovernanceContinuity(schoolId: string): Promise<{
  ok: boolean;
  reasonCodes: string[];
  safeMessage: string;
  continuityStatuses: Record<string, boolean>;
}> {
  const reasonCodes: string[] = [];
  const continuityStatuses: Record<string, boolean> = {};
  const baseDir = resolve(__dirname, '../../..');

  for (const check of GOVERNANCE_CHECKS) {
    const allFound = check.requiredReportPaths.every((p) =>
      existsSync(resolve(baseDir, p)),
    );
    continuityStatuses[check.label] = allFound;
    if (!allFound) {
      reasonCodes.push(`${check.label}_continuity_missing`);
    }
  }

  const ok = reasonCodes.length === 0;

  return {
    ok,
    reasonCodes,
    safeMessage: ok
      ? `Governance continuity verified for school ${schoolId}. All tasks 020-027 artifacts present.`
      : `Governance continuity check failed for school ${schoolId}: ${reasonCodes.join(', ')}.`,
    continuityStatuses,
  };
}
