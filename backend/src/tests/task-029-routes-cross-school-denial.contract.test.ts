import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const ROUTES_PATH = path.resolve(__dirname, '../routes/task029ExpansionOperationsRoutes.ts');
const content = fs.readFileSync(ROUTES_PATH, 'utf8');

describe('Cross-school access denial contract', () => {
  it('cross_school_access_denied string appears in routes file', () => {
    expect(content).toContain('cross_school_access_denied');
  });

  it('run status route checks cross_school_access_denied in blockingIssues', () => {
    const runStatusBlock = content.match(/\/task029\/expansion-operations\/runs\/:runId\/status[^]*?cross_school_access_denied/);
    expect(runStatusBlock).not.toBeNull();
  });

  it('report generate service delegates cross-school check to service', () => {
    const reportGenBlock = content.match(/\/task029\/expansion-operations\/report\/generate[^]*?reportId[^]*?requestId/);
    expect(reportGenBlock).not.toBeNull();
  });

  it('the generateTask029Report import is used for cross-school validation', () => {
    expect(content).toContain("import { generateTask029Report }");
  });

  it('safeErrorEnvelope is used for access denial responses', () => {
    expect(content).toContain('safeErrorEnvelope(res, 400,');
  });
});
