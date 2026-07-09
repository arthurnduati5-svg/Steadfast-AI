import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import task032Router from '../routes/task032ControlledCanaryActivationRoutes';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/task-032', task032Router);
  return app;
}

describe('Task 032 - Routes / Config Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validConfig = {
    schoolId: 'school_task032_canary_safe',
    approvedByRole: 'school_admin',
    activationMode: 'internal_controlled_activation',
    maxCanaryLearners: 25,
    allowedClassIds: ['class_task032_safe_001'],
    allowedSubjectIds: ['subject_task032_safe_math_001'],
    allowedCohortIds: ['cohort_task032_safe_001'],
    canaryStartWindow: '2026-06-01T00:00:00Z',
    canaryEndWindow: '2026-06-30T23:59:59Z',
    rollbackPolicyId: 'rollback_policy_001',
    incidentPolicyId: 'incident_policy_001',
    privacyBoundaryId: 'privacy_boundary_001',
    healthBudgetId: 'health_budget_001',
    consentAuthorizationPolicyId: 'consent_policy_001',
    sourceGovernancePolicyId: 'source_governance_001',
    deenBoundaryPolicyId: 'deen_boundary_001',
    socraticIntegrityPolicyId: 'socratic_integrity_001'
  };

  it('POST /config/approved-school-canary should succeed with valid config', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send(validConfig);
    expect(res.status).toBe(200);
    expect(res.body.configId).toBeTruthy();
  });

  it('POST /config/approved-school-canary should reject missing schoolId', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, schoolId: undefined });
    expect(res.status).toBe(200);
    expect(res.body.blockingIssues).toContain('missing_schoolId');
  });

  it('POST /config/approved-school-canary should reject missing approvedByRole', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, approvedByRole: undefined });
    expect(res.body.blockingIssues).toContain('missing_approvedByRole');
  });

  it('POST /config/approved-school-canary should reject missing allowedClassIds', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, allowedClassIds: [] });
    expect(res.body.blockingIssues).toContain('missing_or_empty_allowedClassIds');
  });

  it('POST /config/approved-school-canary should reject missing allowedSubjectIds', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, allowedSubjectIds: undefined });
    expect(res.body.blockingIssues).toContain('missing_or_empty_allowedSubjectIds');
  });

  it('POST /config/approved-school-canary should reject maxCanaryLearners exceeding cap', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, maxCanaryLearners: 100 });
    expect(res.body.blockingIssues.some((b: string) => b.includes('maxCanaryLearners_exceeds_cap'))).toBe(true);
  });

  it('POST /config/approved-school-canary should reject school-wide cohort wildcard', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, allowedCohortIds: ['*'] });
    expect(res.body.blockingIssues).toContain('school_wide_cohort_not_allowed');
  });

  it('POST /config/approved-school-canary should reject unknown approval role', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, approvedByRole: 'student' });
    expect(res.body.blockingIssues).toContain('unknown_approval_role');
  });

  it('POST /config/approved-school-canary should reject missing rollback policy', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, rollbackPolicyId: undefined });
    expect(res.body.blockingIssues).toContain('missing_rollback_policy');
  });

  it('POST /config/approved-school-canary should reject missing incident policy', async () => {
    const res = await request(app)
      .post('/api/task-032/config/approved-school-canary')
      .send({ ...validConfig, incidentPolicyId: undefined });
    expect(res.body.blockingIssues).toContain('missing_incident_policy');
  });
});
