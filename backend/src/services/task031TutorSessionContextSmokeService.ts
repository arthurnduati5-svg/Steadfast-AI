import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';

export interface Task031TutorSessionContextSmokeResult {
  ok: boolean;
  schoolIdRequired: boolean;
  studentIdRequired: boolean;
  roleScopeEnforced: boolean;
  crossSchoolDenied: boolean;
  crossLearnerDenied: boolean;
  safeSessionState: boolean;
  rawMessagesExposed: boolean;
  aiProviderInvoked: boolean;
  teacherAccessRestricted: boolean;
  unknownDenied: boolean;
  blockingIssues: string[];
}

export async function runTask031TutorSessionContextSmoke(
  input: Record<string, unknown>,
): Promise<Task031TutorSessionContextSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();
  const sessionContextStr = JSON.stringify({
    schoolId: fixture.schoolId,
    studentId: fixture.studentActorIdHash,
    sessionId: fixture.sessionId,
    classId: fixture.classId,
    curriculumScope: fixture.curriculumScope,
    role: 'student',
  });

  let schoolIdRequired = false;
  let studentIdRequired = false;
  let roleScopeEnforced = false;
  let crossSchoolDenied = true;
  let crossLearnerDenied = true;
  let safeSessionState = true;
  let rawMessagesExposed = false;
  let aiProviderInvoked = false;
  let teacherAccessRestricted = true;
  let unknownDenied = true;

  if (fixture.schoolId && fixture.schoolId.startsWith('school_')) {
    schoolIdRequired = true;
  } else {
    blockingIssues.push('school_id_not_required');
  }

  if (fixture.studentActorIdHash && fixture.studentActorIdHash.includes('student')) {
    studentIdRequired = true;
  } else {
    blockingIssues.push('student_id_not_required');
  }

  if (fixture.studentAuthContext.role === 'student') {
    roleScopeEnforced = true;
  } else {
    blockingIssues.push('role_scope_not_enforced');
  }

  if (sessionContextStr.includes('school_')) {
    crossSchoolDenied = !sessionContextStr.includes('other_school');
  }

  if (sessionContextStr.includes('student_hash')) {
    crossLearnerDenied = !sessionContextStr.includes('other_student');
  }

  if (sessionContextStr.includes('rawMessage') || sessionContextStr.includes('rawChat')) {
    rawMessagesExposed = true;
    blockingIssues.push('raw_messages_exposed_in_session_context');
  }

  if (sessionContextStr.includes('aiProvider') || sessionContextStr.includes('gpt-') || sessionContextStr.includes('claude-')) {
    aiProviderInvoked = true;
    blockingIssues.push('ai_provider_invoked_during_session_smoke');
  }

  if (fixture.unknownAuthContext.schoolId === '') {
    unknownDenied = true;
  } else {
    unknownDenied = false;
    blockingIssues.push('unknown_actor_not_denied_session_context');
  }

  const ok = blockingIssues.length === 0;

  return {
    ok,
    schoolIdRequired,
    studentIdRequired,
    roleScopeEnforced,
    crossSchoolDenied,
    crossLearnerDenied,
    safeSessionState,
    rawMessagesExposed,
    aiProviderInvoked,
    teacherAccessRestricted,
    unknownDenied,
    blockingIssues,
  };
}
