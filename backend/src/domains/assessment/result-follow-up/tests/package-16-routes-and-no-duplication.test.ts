import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const followUpDir = path.resolve(__dirname, '..');
const routesDir = path.resolve(__dirname, '../../../../routes');

describe('Package 16 — Routes and No Duplication', () => {
  it('route file resultFollowUp.ts exists at backend/src/routes/resultFollowUp.ts', () => {
    const routePath = path.join(routesDir, 'resultFollowUp.ts');
    const exists = fs.existsSync(routePath);
    expect(exists).toBe(true);
  });

  it('route file imports from follow-up domain (not access domain)', () => {
    const routePath = path.join(routesDir, 'resultFollowUp.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('result-follow-up');
    expect(content).not.toContain('result-report-card-access');
  });

  it('route file does not re-implement business logic', () => {
    const routePath = path.join(routesDir, 'resultFollowUp.ts');
    const content = fs.readFileSync(routePath, 'utf-8');
    expect(content).toContain('Router');
    expect(content).toContain('express');
  });

  describe('No forbidden imports in follow-up domain files', () => {
    const domainFiles = [
      'contracts/resultFollowUpContracts.ts',
      'contracts/resultFollowUpCaseContracts.ts',
      'contracts/resultFollowUpSignalContracts.ts',
      'contracts/resultFollowUpActionPlanContracts.ts',
      'contracts/teacherFollowUpQueueContracts.ts',
      'contracts/parentGuidanceDraftContracts.ts',
      'contracts/studentReflectionTaskDraftContracts.ts',
      'contracts/followUpReviewWindowContracts.ts',
      'contracts/followUpEscalationPlanContracts.ts',
      'contracts/followUpSummaryContracts.ts',
      'contracts/resultFollowUpRepositoryContracts.ts',
      'policies/resultFollowUpPolicyDefinitions.ts',
    ];

    for (const file of domainFiles) {
      it(`${file} does not import from access domain`, () => {
        const fullPath = path.join(followUpDir, file);
        if (fs.existsSync(fullPath)) {
          const content = fs.readFileSync(fullPath, 'utf-8');
          expect(content).not.toContain('result-report-card-access');
        }
      });
    }
  });

  describe('No Package 15 model duplication in schema (check Prisma models)', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    it('ResultFollowUpCaseRecord exists but resultReportCard models are separate', () => {
      expect(schema).toContain('model ResultFollowUpCaseRecord');
      expect(schema).toContain('model ResultReportCardAccessGrantRecord');
    });

    it('no duplicate resultReportCardAccess models in follow-up section', () => {
      const followUpStart = schema.indexOf('model ResultFollowUpCaseRecord');
      const followUpSection = schema.slice(followUpStart);
      expect(followUpSection).not.toContain('model ResultReportCard');
    });
  });

  describe('No forbidden models in schema (follow-up section)', () => {
    const schemaPath = path.resolve(__dirname, '../../../../../prisma/schema.prisma');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    const followUpStart = schema.indexOf('model ResultFollowUpCaseRecord');
    const followUpEnd = schema.indexOf('model FollowUpAuditRecord') !== -1
      ? schema.indexOf('model FollowUpAuditRecord') + 200
      : schema.length;
    const followUpSection = schema.slice(followUpStart, followUpEnd);

    const forbiddenPatterns = ['liveToken', 'portalUrl', 'accessToken', 'signedUrl', 'jwt', 'sessionCookie'];
    for (const pattern of forbiddenPatterns) {
      it(`no ${pattern} in follow-up schema models`, () => {
        expect(followUpSection).not.toContain(pattern);
      });
    }
  });
});
