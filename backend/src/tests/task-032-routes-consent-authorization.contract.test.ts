import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import task032Router from '../routes/task032ControlledCanaryActivationRoutes';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import type { Task032ApprovedSchoolCanaryConfig } from '../contracts/task032ControlledCanaryActivationContracts';

function createApp(): express.Express {
  const app = express();
  app.use(express.json());
  app.use('/api/task-032', task032Router);
  return app;
}

describe('Task 032 - Routes / Consent Authorization Contract', () => {
  const app = createApp();

  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validConfig: Task032ApprovedSchoolCanaryConfig = {
    configId: 'config_001',
    schoolId: 'school_task032_canary_safe',
    approvedByRole: 'school_admin',
    activationMode: 'internal_controlled_activation',
    maxCanaryLearners: 25,
    allowedClassIds: ['class_task032_safe_001'],
    allowedSubjectIds: ['subject_task032_safe_math_001'],
    allowedCohortIds: ['cohort_task032_safe_001'],
    canaryStartWindow: '2026-06-01T00:00:00Z',
    canaryEndWindow: '2026-06-30T23:59:59Z',
    rollbackPolicyId: 'rollback_001',
    incidentPolicyId: 'incident_001',
    privacyBoundaryId: 'privacy_001',
    healthBudgetId: 'budget_001',
    consentAuthorizationPolicyId: 'consent_001',
    sourceGovernancePolicyId: 'source_001',
    deenBoundaryPolicyId: 'deen_001',
    socraticIntegrityPolicyId: 'socratic_001',
    blockingIssues: []
  };

  it('POST /consent-authorization/readiness should pass with admin role', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'school_admin'
      });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /consent-authorization/readiness should pass with system_admin role', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'system_admin'
      });
    expect(res.body.ok).toBe(true);
    expect(res.body.adminOperatorAuthorizationRecorded).toBe(true);
  });

  it('POST /consent-authorization/readiness should reject student role', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'student'
      });
    expect(res.body.ok).toBe(false);
    expect(res.body.adminOperatorAuthorizationRecorded).toBe(false);
  });

  it('POST /consent-authorization/readiness should reject teacher role', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'teacher'
      });
    expect(res.body.ok).toBe(false);
  });

  it('POST /consent-authorization/readiness should set noRealNoticeSent true', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'school_admin'
      });
    expect(res.body.noRealNoticeSent).toBe(true);
  });

  it('POST /consent-authorization/readiness should set noSMSSent true', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'school_admin'
      });
    expect(res.body.noSMSSent).toBe(true);
  });

  it('POST /consent-authorization/readiness should set noWhatsAppSent true', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'school_admin'
      });
    expect(res.body.noWhatsAppSent).toBe(true);
  });

  it('POST /consent-authorization/readiness should set noEmailSent true', async () => {
    const res = await request(app)
      .post('/api/task-032/consent-authorization/readiness')
      .send({
        schoolId: 'school_task032_canary_safe',
        config: validConfig,
        actorRole: 'school_admin'
      });
    expect(res.body.noEmailSent).toBe(true);
  });
});
