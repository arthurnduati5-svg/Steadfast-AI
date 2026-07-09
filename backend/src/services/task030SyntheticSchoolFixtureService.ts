import type { Task030SyntheticSchoolFixture } from '../contracts/task030ControlledStagingRehearsalContracts';
import { createTask030SafeId } from '../contracts/task030ControlledStagingRehearsalContracts';
import { validateTask030SyntheticSchoolFixture } from '../lib/task030ControlledStagingRehearsalValidation';
import { task030ControlledStagingRehearsalRepository } from '../repositories/task030ControlledStagingRehearsalRepository';

export async function createTask030SyntheticSchoolFixture(
  input: { schoolId?: string },
): Promise<Task030SyntheticSchoolFixture> {
  const seed = input.schoolId || 'default';
  const schoolId = input.schoolId || createTask030SafeId('school', seed);
  const adminId = createTask030SafeId('admin', seed);
  const operatorId = createTask030SafeId('operator', seed);
  const teacherIds = Array.from({ length: 3 }, (_, i) => createTask030SafeId(`teacher_${i + 1}`, seed));
  const learnerIds = Array.from({ length: 12 }, (_, i) => createTask030SafeId(`learner_${i + 1}`, seed));
  const parentIds = Array.from({ length: 3 }, (_, i) => createTask030SafeId(`parent_${i + 1}`, seed));
  const classIds = Array.from({ length: 2 }, (_, i) => createTask030SafeId(`class_${i + 1}`, seed));
  const subjectIds = Array.from({ length: 4 }, (_, i) => createTask030SafeId(`subject_${i + 1}`, seed));
  const cohortIds = Array.from({ length: 2 }, (_, i) => createTask030SafeId(`cohort_${i + 1}`, seed));

  const fixture: Task030SyntheticSchoolFixture = {
    schoolId,
    adminId,
    operatorId,
    teacherIds,
    learnerIds,
    parentIds,
    classIds,
    subjectIds,
    cohortIds,
    approvedCurriculumSource: 'synthetic_cambridge_igcse_math',
    safeLessonMetadata: { source: 'synthetic', rehearsal: 'true' },
    safeObjectiveMetadata: { source: 'synthetic', rehearsal: 'true' },
    createdAt: new Date().toISOString(),
  };

  const validation = validateTask030SyntheticSchoolFixture(fixture);
  if (!validation.ok) {
    throw new Error(`Fixture validation failed: ${validation.errors.join(', ')}`);
  }

  await task030ControlledStagingRehearsalRepository.recordSyntheticSchoolFixture(fixture);

  return fixture;
}
