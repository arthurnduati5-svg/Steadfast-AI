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

describe('Task 032 - Routes / Cohort Eligibility Contract', () => {
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

  const validInput = {
    schoolId: 'school_task032_canary_safe',
    cohortId: 'cohort_task032_safe_001',
    actorRole: 'school_admin',
    config: validConfig
  };

  it('POST /cohort/eligibility should pass with valid inputs', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('POST /cohort/eligibility should reject non-approved cohort', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send({ ...validInput, cohortId: 'unapproved_cohort' });
    expect(res.body.ok).toBe(false);
    expect(res.body.cohortApproved).toBe(false);
  });

  it('POST /cohort/eligibility should reject mismatched schoolId', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send({ ...validInput, schoolId: 'wrong_school' });
    expect(res.body.ok).toBe(false);
    expect(res.body.schoolVerified).toBe(false);
  });

  it('POST /cohort/eligibility should return cohortSizeWithinCap', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.cohortSizeWithinCap).toBe(true);
  });

  it('POST /cohort/eligibility should return noCrossSchoolLearner', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.noCrossSchoolLearner).toBe(true);
  });

  it('POST /cohort/eligibility should return noExcludedLearners true', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.noExcludedLearners).toBe(true);
  });

  it('POST /cohort/eligibility should return noParentContactData true', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.noParentContactData).toBe(true);
  });

  it('POST /cohort/eligibility should return noRealIdentifierLeakage true', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.noRealIdentifierLeakage).toBe(true);
  });

  it('POST /cohort/eligibility should return classBoundariesMatch', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.classBoundariesMatch).toBe(true);
  });

  it('POST /cohort/eligibility should return subjectBoundariesMatch', async () => {
    const res = await request(app)
      .post('/api/task-032/cohort/eligibility')
      .send(validInput);
    expect(res.body.subjectBoundariesMatch).toBe(true);
  });
});
