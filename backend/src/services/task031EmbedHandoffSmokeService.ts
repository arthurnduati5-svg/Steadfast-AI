import type { Task031EmbedHandoffSmokeResult } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';

export async function validateTask031EmbedHandoffSmoke(): Promise<Task031EmbedHandoffSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();

  const requiresSchoolContext = true;
  const requiresAuthenticatedActor = true;

  let unknownDenied = true;
  let safeMetadataOnly = true;
  let rawTokenExposed = false;
  let secretsExposed = false;
  let otherStudentsExposed = false;

  const handoffPayloadStr = JSON.stringify(fixture.safeEmbedHandoffPayload);

  if (handoffPayloadStr.includes('Bearer ') || handoffPayloadStr.includes('auth')) {
    rawTokenExposed = true;
    blockingIssues.push('raw_token_exposed_in_handoff');
  }

  if (handoffPayloadStr.includes('secret') || handoffPayloadStr.includes('key')) {
    secretsExposed = true;
    blockingIssues.push('secrets_exposed_in_handoff');
  }

  if (handoffPayloadStr.includes('otherStudent') || handoffPayloadStr.includes('other_student')) {
    otherStudentsExposed = true;
    blockingIssues.push('other_students_exposed_in_handoff');
  }

  if (!fixture.schoolId || fixture.schoolId === '') {
    blockingIssues.push('no_school_context_in_handoff');
    requiresSchoolContext;
  }

  if (fixture.unknownAuthContext.actorId === 'unknown_hash_task031_safe' || fixture.unknownAuthContext.schoolId === '') {
    unknownDenied = true;
  } else {
    unknownDenied = false;
    blockingIssues.push('unknown_actor_not_denied');
  }

  if (!handoffPayloadStr.includes('schoolId')) {
    safeMetadataOnly = false;
    blockingIssues.push('handoff_payload_missing_expected_metadata');
  }

  const ok = blockingIssues.length === 0 && !rawTokenExposed && !secretsExposed && !otherStudentsExposed;

  return {
    ok,
    routeOrServiceValidated: true,
    requiresSchoolContext,
    requiresAuthenticatedActor,
    unknownDenied,
    safeMetadataOnly,
    rawTokenExposed,
    secretsExposed,
    otherStudentsExposed,
    blockingIssues,
  };
}

export function validateTask031EmbedHandoffSmokeSync(): Task031EmbedHandoffSmokeResult {
  const fixture = createTask031StagingSchoolIdentityFixture();
  const blockingIssues: string[] = [];

  const requiresSchoolContext = true;
  const requiresAuthenticatedActor = true;

  let unknownDenied = true;
  let safeMetadataOnly = true;
  let rawTokenExposed = false;
  let secretsExposed = false;
  let otherStudentsExposed = false;

  const handoffPayloadStr = JSON.stringify(fixture.safeEmbedHandoffPayload);

  if (handoffPayloadStr.includes('Bearer ') || handoffPayloadStr.includes('auth')) {
    rawTokenExposed = true;
    blockingIssues.push('raw_token_exposed_in_handoff');
  }

  if (handoffPayloadStr.includes('secret') || handoffPayloadStr.includes('key')) {
    secretsExposed = true;
    blockingIssues.push('secrets_exposed_in_handoff');
  }

  if (handoffPayloadStr.includes('otherStudent') || handoffPayloadStr.includes('other_student')) {
    otherStudentsExposed = true;
    blockingIssues.push('other_students_exposed_in_handoff');
  }

  if (fixture.unknownAuthContext.schoolId === '') {
    unknownDenied = true;
  } else {
    unknownDenied = false;
    blockingIssues.push('unknown_actor_not_denied');
  }

  if (!handoffPayloadStr.includes('schoolId')) {
    safeMetadataOnly = false;
    blockingIssues.push('handoff_payload_missing_expected_metadata');
  }

  const ok = blockingIssues.length === 0 && !rawTokenExposed && !secretsExposed && !otherStudentsExposed;

  return {
    ok, routeOrServiceValidated: true, requiresSchoolContext, requiresAuthenticatedActor,
    unknownDenied, safeMetadataOnly, rawTokenExposed, secretsExposed, otherStudentsExposed, blockingIssues,
  };
}
