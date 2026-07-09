import { describe, it, expect } from 'vitest';
import { checkTask031NoLiveStudentGuardSync } from '../services/task031NoLiveStudentGuardService';
import { createTask031StagingSchoolIdentityFixture } from '../services/task031StagingSchoolIdentityFixtureService';

describe('Task 031 - POST /guards/no-live-student contract', () => {
  it('should pass guard with clean fixture data', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = checkTask031NoLiveStudentGuardSync(fixture);
    expect(result.ok).toBe(true);
    expect(result.liveStudentEmailDetected).toBe(false);
    expect(result.liveStudentNameDetected).toBe(false);
    expect(result.livePhoneNumberDetected).toBe(false);
    expect(result.rawStudentChatUsed).toBe(false);
    expect(result.privateLearnerMemoryUsed).toBe(false);
  });

  it('should detect real email addresses', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = checkTask031NoLiveStudentGuardSync(fixture, ['john.doe@gmail.com']);
    expect(result.ok).toBe(false);
    expect(result.liveStudentEmailDetected).toBe(true);
  });

  it('should detect raw student chat content', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = checkTask031NoLiveStudentGuardSync(fixture, ['raw student chat from live session']);
    expect(result.ok).toBe(false);
    expect(result.rawStudentChatUsed).toBe(true);
  });

  it('should detect private learner memory', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = checkTask031NoLiveStudentGuardSync(fixture, ['Accessing private learner memory storage']);
    expect(result.ok).toBe(false);
    expect(result.privateLearnerMemoryUsed).toBe(true);
  });

  it('should detect live phone numbers', () => {
    const fixture = createTask031StagingSchoolIdentityFixture();
    const result = checkTask031NoLiveStudentGuardSync(fixture, ['Call +12025551234']);
    expect(result.ok).toBe(false);
    expect(result.livePhoneNumberDetected).toBe(true);
  });
});
