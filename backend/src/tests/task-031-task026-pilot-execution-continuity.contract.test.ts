import { describe, it, expect } from 'vitest';
import { validateTask031StudentPreflightSmokeSync } from '../services/task031StudentPreflightSmokeService';
import { validateTask031TeacherOversightSmokeSync } from '../services/task031TeacherOversightSmokeService';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';

describe('Task 031 - Task 026 Pilot Execution Continuity Contract', () => {
  it('should verify school identity during student preflight for pilot execution', () => {
    const result = validateTask031StudentPreflightSmokeSync();
    expect(result.schoolIdentityVerified).toBe(true);
  });

  it('should confirm staging scope is checked during pilot execution', () => {
    const result = validateTask031StudentPreflightSmokeSync();
    expect(result.stagingScopeChecked).toBe(true);
  });

  it('should confirm teacher oversight has valid staging context', () => {
    const result = validateTask031TeacherOversightSmokeSync();
    expect(result.teacherStagingContextValid).toBe(true);
  });

  it('should confirm teacher oversight hides raw private data', () => {
    const result = validateTask031TeacherOversightSmokeSync();
    expect(result.rawPrivateDataHidden).toBe(true);
  });
});
