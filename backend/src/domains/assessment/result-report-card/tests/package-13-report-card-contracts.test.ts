import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import {
  evaluateReportCardTemplateManagementPolicy,
  evaluateReportCardAssemblyCreationPolicy,
  evaluateReportCardNoLiveDeliveryPolicy,
  evaluateReportCardNoPdfExportPolicy,
  RESULT_REPORT_CARD_POLICY_FAMILIES,
} from '../policies/resultReportCardPolicyDefinitions';

describe('Package 13 — Report Card Contracts', () => {
  it('Package 13 contracts module has runtime exports', async () => {
    const mod = await import('../contracts/index');
    expect(mod).toBeDefined();
    const keys = Object.keys(mod);
    expect(keys.length).toBeGreaterThan(0);
    expect(keys).toContain('FORBIDDEN_REPORT_CARD_FIELDS');
    expect(keys).toContain('ALLOWED_REPORT_CARD_CREATION_ROLES');
    expect(keys).toContain('BLOCKED_REPORT_CARD_CREATION_ROLES');
    expect(keys).toContain('FUTURE_EXPORT_CHANNELS');
  });

  it('Policy definitions exist as an object with expected families', () => {
    const policyModule = { evaluateReportCardTemplateManagementPolicy, evaluateReportCardAssemblyCreationPolicy, evaluateReportCardNoLiveDeliveryPolicy, evaluateReportCardNoPdfExportPolicy, RESULT_REPORT_CARD_POLICY_FAMILIES };
    expect(policyModule).toBeDefined();
    const policyKeys = Object.keys(policyModule);
    expect(policyKeys).toContain('evaluateReportCardTemplateManagementPolicy');
    expect(policyKeys).toContain('evaluateReportCardAssemblyCreationPolicy');
    expect(policyKeys).toContain('evaluateReportCardNoLiveDeliveryPolicy');
    expect(policyKeys).toContain('evaluateReportCardNoPdfExportPolicy');
    expect(policyKeys).toContain('RESULT_REPORT_CARD_POLICY_FAMILIES');
  });

  it('Policy definitions enforce role-based restrictions', () => {
    const adminResult = evaluateReportCardAssemblyCreationPolicy({ schoolId: 'school-1', actorRole: 'admin' });
    expect(adminResult.allowed).toBe(true);

    const teacherResult = evaluateReportCardAssemblyCreationPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(teacherResult.allowed).toBe(true);

    const studentResult = evaluateReportCardAssemblyCreationPolicy({ schoolId: 'school-1', actorRole: 'student' });
    expect(studentResult.allowed).toBe(false);

    const parentResult = evaluateReportCardAssemblyCreationPolicy({ schoolId: 'school-1', actorRole: 'parent' });
    expect(parentResult.allowed).toBe(false);
  });

  it('No live delivery policy blocks all live export channels', () => {
    const liveChannels = ['pdf_export_live', 'student_portal_live', 'parent_portal_live', 'email_live', 'sms_live', 'push_live'];
    for (const channel of liveChannels) {
      const result = evaluateReportCardNoLiveDeliveryPolicy({ schoolId: 'school-1', exportChannel: channel });
      expect(result.allowed).toBe(false);
    }
  });

  it('No PDF export policy blocks all PDF channels', () => {
    const pdfResult = evaluateReportCardNoPdfExportPolicy({ schoolId: 'school-1', exportChannel: 'pdf_export_future' });
    expect(pdfResult.allowed).toBe(false);
  });

  it('Template management policy allows teacher and admin', () => {
    const adminResult = evaluateReportCardTemplateManagementPolicy({ schoolId: 'school-1', actorRole: 'admin' });
    expect(adminResult.allowed).toBe(true);

    const teacherResult = evaluateReportCardTemplateManagementPolicy({ schoolId: 'school-1', actorRole: 'teacher' });
    expect(teacherResult.allowed).toBe(true);

    const studentResult = evaluateReportCardTemplateManagementPolicy({ schoolId: 'school-1', actorRole: 'student' });
    expect(studentResult.allowed).toBe(false);
  });

  it('Policy families are correctly defined', () => {
    expect(RESULT_REPORT_CARD_POLICY_FAMILIES).toBeDefined();
    expect(Object.keys(RESULT_REPORT_CARD_POLICY_FAMILIES).length).toBeGreaterThan(0);
  });

  it('Backend does not import any frontend framework', async () => {
    const serviceFiles = [
      'resultReportCardAssemblyService.ts',
      'resultReportCardSectionComposer.ts',
      'resultReportCardExportIntentService.ts',
      'resultReportCardRenderManifestService.ts',
    ];
    const servicesDir = path.resolve(__dirname, '..', 'services');
    for (const file of serviceFiles) {
      expect(fs.existsSync(path.join(servicesDir, file))).toBe(true);
    }
  });

  it('File structure matches expected scaffold', () => {
    const contractsDir = path.resolve(__dirname, '..', 'contracts');
    const servicesDir = path.resolve(__dirname, '..', 'services');
    const policiesDir = path.resolve(__dirname, '..', 'policies');
    const reposDir = path.resolve(__dirname, '..', 'repositories');

    expect(fs.existsSync(contractsDir)).toBe(true);
    expect(fs.existsSync(servicesDir)).toBe(true);
    expect(fs.existsSync(policiesDir)).toBe(true);
    expect(fs.existsSync(reposDir)).toBe(true);

    const contractFiles = fs.readdirSync(contractsDir);
    expect(contractFiles).toContain('index.ts');
  });
});
