import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import task034LimitedRolloutRoutes from '../routes/task034ControlledLimitedRolloutRoutes';
import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';

describe('Task034RoutesCohortEligibilityContract', () => {
  let app: express.Express;
  const validInput = {
    schoolId: 'school_task034_limited_rollout_safe',
    tenantId: 'tenant_task034_limited_rollout_safe',
    cohortId: 'cohort_task034_limited_rollout_safe',
    classIds: ['class_1', 'class_2'],
    studentCount: 50,
    hashedStudentIds: ['hash_long_string_that_is_over_30_chars_total_xyz', 'hash_another_long_string_exceeding_30_chars_limit'],
    approvedSchoolConfig: true,
    staffCoverage: true,
    rollbackCoverage: true,
    healthBudgetCoverage: true,
    contentGovernanceCoverage: true,
  };

  beforeAll(() => {
    app = express();
    app.use(express.json());
    app.use(task034LimitedRolloutRoutes);
  });

  beforeEach(() => {
    task034Repository.clearTask034StoresForTests();
  });

  it('POST /cohort/eligibility returns 403 without admin role', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'student')
      .send(validInput);
    expect(res.status).toBe(403);
    expect(res.body.error).toBe('access_denied');
  });

  it('POST /cohort/eligibility returns 200 with valid input', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.schoolVerified).toBe(true);
    expect(res.body.tenantVerified).toBe(true);
  });

  it('POST /cohort/eligibility saves to repository', async () => {
    await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send(validInput);
    const saved = await task034Repository.getExpandedCohortEligibility();
    expect(saved).not.toBeNull();
    expect(saved?.ok).toBe(true);
  });

  it('POST /cohort/eligibility rejects unapproved school', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, schoolId: 'unknown_school' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.schoolVerified).toBe(false);
  });

  it('POST /cohort/eligibility rejects unapproved tenant', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, tenantId: 'unknown_tenant' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.tenantVerified).toBe(false);
  });

  it('POST /cohort/eligibility rejects empty classIds', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, classIds: [] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.classIdsValid).toBe(false);
  });

  it('POST /cohort/eligibility rejects raw private fields in hashed student ids', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'internal_operator')
      .send({ ...validInput, hashedStudentIds: ['student@school.com'] });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(false);
    expect(res.body.hashedOnlyNoRawPrivateFields).toBe(false);
  });

  it('POST /cohort/eligibility returns 403 for denied role', async () => {
    const res = await supertest(app)
      .post('/cohort/eligibility')
      .set('x-actor-role', 'learner')
      .send(validInput);
    expect(res.status).toBe(403);
  });
});
