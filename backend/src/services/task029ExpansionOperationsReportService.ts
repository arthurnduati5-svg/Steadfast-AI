import { task028ExpansionExecutionRepository } from '../repositories/task028ExpansionExecutionRepository';

export interface GenerateReportInput {
  schoolId: string;
  actorId: string;
  actorRole: string;
  expansionRunId?: string;
}

export interface GenerateReportResult {
  ok: boolean;
  reportId: string;
  safeMessage: string;
  blockingIssues: string[];
}

export async function generateTask029Report(input: GenerateReportInput): Promise<GenerateReportResult> {
  const blockingIssues: string[] = [];

  if (!input.schoolId) {
    blockingIssues.push('school_context_missing');
    return { ok: false, reportId: '', safeMessage: 'School context is required.', blockingIssues };
  }

  if (input.expansionRunId) {
    const run = await task028ExpansionExecutionRepository.getExecutionRun(input.expansionRunId);
    if (!run) {
      blockingIssues.push('expansion_run_not_found');
      return { ok: false, reportId: '', safeMessage: 'Expansion run not found.', blockingIssues };
    }
    if (run.schoolId !== input.schoolId) {
      blockingIssues.push('cross_school_access_denied');
      return { ok: false, reportId: '', safeMessage: 'Cross-school access denied.', blockingIssues };
    }
  }

  const reportId = `report_029_${Date.now()}`;

  return {
    ok: true,
    reportId,
    safeMessage: 'Task 029 report generation is delegated to the gen-task029-report pipeline. This endpoint acknowledges the request.',
    blockingIssues: [],
  };
}
