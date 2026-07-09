import { describe, it, expect, beforeEach } from 'vitest';
import { createTask030SyntheticSchoolFixture } from '../services/task030SyntheticSchoolFixtureService';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

describe('Task 030 - Synthetic School Fixture', () => {
  beforeEach(async () => {
    await task030ControlledStagingRehearsalRepository.clearTask030StoresForTests();
  });

  it('should create a fixture with default school', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.schoolId).toBeDefined();
    expect(fixture.schoolId).toMatch(/^synthetic_school_\d{6}$/);
  });

  it('should include admin and operator IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.adminId).toMatch(/^synthetic_admin_/);
    expect(fixture.operatorId).toMatch(/^synthetic_operator_/);
  });

  it('should have 3 teacher IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.teacherIds).toHaveLength(3);
    fixture.teacherIds.forEach(id => expect(id).toMatch(/^synthetic_teacher_/));
  });

  it('should have 12 learner IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.learnerIds).toHaveLength(12);
    fixture.learnerIds.forEach(id => expect(id).toMatch(/^synthetic_learner_/));
  });

  it('should have 3 parent IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.parentIds).toHaveLength(3);
  });

  it('should have 2 class IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.classIds).toHaveLength(2);
  });

  it('should have 4 subject IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.subjectIds).toHaveLength(4);
  });

  it('should have 2 cohort IDs', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.cohortIds).toHaveLength(2);
  });

  it('should have synthetic curriculum source', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.approvedCurriculumSource).toContain('synthetic');
  });

  it('should have safe metadata', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(fixture.safeLessonMetadata.source).toBe('synthetic');
    expect(fixture.safeObjectiveMetadata.source).toBe('synthetic');
  });

  it('should set createdAt as ISO string', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    expect(() => new Date(fixture.createdAt)).not.toThrow();
  });

  it('should use provided schoolId if given', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({ schoolId: 'custom_seed' });
    expect(fixture.schoolId).toBe('custom_seed');
  });

  it('should not contain real email patterns', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    const json = JSON.stringify(fixture);
    expect(json).not.toMatch(/@/);
  });

  it('should not contain real phone patterns', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    const json = JSON.stringify(fixture);
    expect(json).not.toMatch(/\+\d{10,}/);
  });

  it('should not contain raw student data', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    const json = JSON.stringify(fixture);
    expect(json).not.toContain('rawStudentData');
    expect(json).not.toContain('rawChat');
  });

  it('should validate fixture and not throw', async () => {
    await expect(createTask030SyntheticSchoolFixture({})).resolves.toBeDefined();
  });

  it('should persist fixture in repository', async () => {
    const fixture = await createTask030SyntheticSchoolFixture({});
    const stored = await task030ControlledStagingRehearsalRepository.getSyntheticSchoolFixture(fixture.schoolId);
    expect(stored).not.toBeNull();
  });
});
