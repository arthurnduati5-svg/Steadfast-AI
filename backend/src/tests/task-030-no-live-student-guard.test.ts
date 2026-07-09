import { describe, it, expect } from 'vitest';
import { checkNoLiveStudentGuardSync, scanFileForLiveData } from '../services/task030NoLiveStudentGuardService';
import * as path from 'path';

describe('Task 030 - No Live Student Guard', () => {
  it('should pass with safe fixture data', () => {
    const fixture = {
      schoolId: 'school_task030_staging_safe',
      studentHash: 'student_hash_task030_safe',
    };
    const result = checkNoLiveStudentGuardSync(fixture);
    expect(result.ok).toBe(true);
    expect(result.liveStudentDataDetected).toBe(false);
  });

  it('should fail when real-looking email appears', () => {
    const fixture = { email: 'student@school.edu' };
    const result = checkNoLiveStudentGuardSync(fixture);
    expect(result.ok).toBe(false);
    expect(result.liveStudentDataDetected).toBe(true);
  });

  it('should fail when forbidden content patterns appear', () => {
    const fixture = { chat: 'raw student chat exposed' };
    const result = checkNoLiveStudentGuardSync(fixture);
    expect(result.ok).toBe(false);
  });

  it('should allow fixture with task030_safe identifiers', () => {
    const fixture = { email: 'test@task030_safe.staging' };
    const result = checkNoLiveStudentGuardSync(fixture);
    expect(result.ok).toBe(true);
  });

  it('should detect private learner memory in content', () => {
    const result = checkNoLiveStudentGuardSync({}, ['this contains private learner memory data']);
    expect(result.ok).toBe(false);
    expect(result.productionDataTouched).toBe(true);
  });

  it('should scan service files for live data without throwing', () => {
    const servicesDir = path.resolve(__dirname, '../services');
    const filePath = path.join(servicesDir, 'task030ControlledStagingRehearsalService.ts');
    const issues = scanFileForLiveData(filePath);
    expect(Array.isArray(issues)).toBe(true);
  });
});
