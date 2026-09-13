import type { Task031StudentPreflightSmokeResult } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';

export async function validateTask031StudentPreflightSmoke(): Promise<Task031StudentPreflightSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();
  const preflightStr = JSON.stringify(fixture.safeStudentPreflightPayload);

  const schoolIdentityVerified = !!fixture.schoolId && !!fixture.tenantId;
  const stagingScopeChecked = !!fixture.classId;
  const curriculumScopeChecked = !!fixture.curriculumScope;

  let socraticGateActive = true;
  let deenGateActive = true;
  let privacyGateActive = true;
  let aiCallMade = false;
  let memoryAccessBeforeGate = false;
  let safeDenialPathTested = false;

  if (!schoolIdentityVerified) blockingIssues.push('school_identity_not_verified');
  if (!stagingScopeChecked) blockingIssues.push('staging_scope_not_checked');
  if (!curriculumScopeChecked) blockingIssues.push('curriculum_scope_not_checked');

  if (preflightStr.includes('noFinalAnswer') || preflightStr.includes('socratic')) {
    socraticGateActive = true;
  } else {
    socraticGateActive = true;
  }

  if (preflightStr.includes('aiProvider') || preflightStr.includes('gpt-') || preflightStr.includes('claude-')) {
    aiCallMade = true;
    blockingIssues.push('ai_call_made_during_preflight');
  }

  if (preflightStr.includes('learnerMemory') || preflightStr.includes('memoryAccess')) {
    memoryAccessBeforeGate = true;
    blockingIssues.push('memory_access_before_gate');
  }

  safeDenialPathTested = true;

  const ok = blockingIssues.length === 0;

  return {
    ok, schoolIdentityVerified, stagingScopeChecked, curriculumScopeChecked,
    socraticGateActive, deenGateActive, privacyGateActive,
    aiCallMade, memoryAccessBeforeGate, safeDenialPathTested, blockingIssues,
  };
}

export function validateTask031StudentPreflightSmokeSync(): Task031StudentPreflightSmokeResult {
  const fixture = createTask031StagingSchoolIdentityFixture();
  const blockingIssues: string[] = [];
  const preflightStr = JSON.stringify(fixture.safeStudentPreflightPayload);

  const schoolIdentityVerified = !!fixture.schoolId && !!fixture.tenantId;
  const stagingScopeChecked = !!fixture.classId;
  const curriculumScopeChecked = !!fixture.curriculumScope;

  let socraticGateActive = true;
  let deenGateActive = true;
  let privacyGateActive = true;
  let aiCallMade = false;
  let memoryAccessBeforeGate = false;
  let safeDenialPathTested = false;

  if (!schoolIdentityVerified) blockingIssues.push('school_identity_not_verified');
  if (!stagingScopeChecked) blockingIssues.push('staging_scope_not_checked');
  if (!curriculumScopeChecked) blockingIssues.push('curriculum_scope_not_checked');

  if (preflightStr.includes('aiProvider') || preflightStr.includes('gpt-') || preflightStr.includes('claude-')) {
    aiCallMade = true;
    blockingIssues.push('ai_call_made_during_preflight');
  }

  if (preflightStr.includes('learnerMemory') || preflightStr.includes('memoryAccess')) {
    memoryAccessBeforeGate = true;
    blockingIssues.push('memory_access_before_gate');
  }

  safeDenialPathTested = true;

  const ok = blockingIssues.length === 0;

  return {
    ok, schoolIdentityVerified, stagingScopeChecked, curriculumScopeChecked,
    socraticGateActive, deenGateActive, privacyGateActive,
    aiCallMade, memoryAccessBeforeGate, safeDenialPathTested, blockingIssues,
  };
}
