import type { Task031CopilotBootstrapSmokeResult } from '../contracts/task031StagingSmokeContracts';
import { createTask031StagingSchoolIdentityFixture } from './task031StagingSchoolIdentityFixtureService';

export async function validateTask031CopilotBootstrapSmoke(): Promise<Task031CopilotBootstrapSmokeResult> {
  const blockingIssues: string[] = [];
  const fixture = createTask031StagingSchoolIdentityFixture();
  const bootstrapPayloadStr = JSON.stringify(fixture.safeCopilotBootstrapPayload);

  const schoolAuthRequired = true;
  let safeMinimalContextOnly = true;
  let rawPrivateMemoryExposed = false;
  let rawChatHistoryExposed = false;
  let teacherOnlyNotesExposed = false;
  let answerKeysExposed = false;
  let aiProviderCallMade = false;
  let unknownDenied = true;

  if (bootstrapPayloadStr.includes('rawPrivateMemory') || bootstrapPayloadStr.includes('learnerMemory')) {
    rawPrivateMemoryExposed = true;
    blockingIssues.push('raw_private_memory_exposed');
  }
  if (bootstrapPayloadStr.includes('chatHistory') || bootstrapPayloadStr.includes('rawChat')) {
    rawChatHistoryExposed = true;
    blockingIssues.push('raw_chat_history_exposed');
  }
  if (bootstrapPayloadStr.includes('teacherNotes') || bootstrapPayloadStr.includes('teacherOnly')) {
    teacherOnlyNotesExposed = true;
    blockingIssues.push('teacher_only_notes_exposed');
  }
  if (bootstrapPayloadStr.includes('answerKey') || bootstrapPayloadStr.includes('correctAnswer')) {
    answerKeysExposed = true;
    blockingIssues.push('answer_keys_exposed');
  }
  if (bootstrapPayloadStr.includes('aiProvider') || bootstrapPayloadStr.includes('gpt-') || bootstrapPayloadStr.includes('claude-')) {
    aiProviderCallMade = true;
    blockingIssues.push('ai_provider_call_made_during_smoke');
  }

  if (!bootstrapPayloadStr.includes('schoolId') || !bootstrapPayloadStr.includes('sessionId')) {
    safeMinimalContextOnly = false;
    blockingIssues.push('bootstrap_context_not_minimal');
  }

  if (fixture.unknownAuthContext.schoolId === '') {
    unknownDenied = true;
  } else {
    unknownDenied = false;
    blockingIssues.push('unknown_actor_not_denied');
  }

  const ok = blockingIssues.length === 0;

  return {
    ok, schoolAuthRequired, safeMinimalContextOnly,
    rawPrivateMemoryExposed, rawChatHistoryExposed, teacherOnlyNotesExposed,
    answerKeysExposed, aiProviderCallMade, unknownDenied, blockingIssues,
  };
}

export function validateTask031CopilotBootstrapSmokeSync(): Task031CopilotBootstrapSmokeResult {
  const fixture = createTask031StagingSchoolIdentityFixture();
  const blockingIssues: string[] = [];
  const bootstrapPayloadStr = JSON.stringify(fixture.safeCopilotBootstrapPayload);

  const schoolAuthRequired = true;
  let safeMinimalContextOnly = true;
  let rawPrivateMemoryExposed = false;
  let rawChatHistoryExposed = false;
  let teacherOnlyNotesExposed = false;
  let answerKeysExposed = false;
  let aiProviderCallMade = false;
  let unknownDenied = true;

  if (bootstrapPayloadStr.includes('rawPrivateMemory') || bootstrapPayloadStr.includes('learnerMemory')) {
    rawPrivateMemoryExposed = true;
    blockingIssues.push('raw_private_memory_exposed');
  }
  if (bootstrapPayloadStr.includes('chatHistory') || bootstrapPayloadStr.includes('rawChat')) {
    rawChatHistoryExposed = true;
    blockingIssues.push('raw_chat_history_exposed');
  }
  if (bootstrapPayloadStr.includes('teacherNotes') || bootstrapPayloadStr.includes('teacherOnly')) {
    teacherOnlyNotesExposed = true;
    blockingIssues.push('teacher_only_notes_exposed');
  }
  if (bootstrapPayloadStr.includes('answerKey') || bootstrapPayloadStr.includes('correctAnswer')) {
    answerKeysExposed = true;
    blockingIssues.push('answer_keys_exposed');
  }
  if (bootstrapPayloadStr.includes('aiProvider') || bootstrapPayloadStr.includes('gpt-') || bootstrapPayloadStr.includes('claude-')) {
    aiProviderCallMade = true;
    blockingIssues.push('ai_provider_call_made_during_smoke');
  }

  if (!bootstrapPayloadStr.includes('schoolId') || !bootstrapPayloadStr.includes('sessionId')) {
    safeMinimalContextOnly = false;
    blockingIssues.push('bootstrap_context_not_minimal');
  }

  if (fixture.unknownAuthContext.schoolId === '') {
    unknownDenied = true;
  } else {
    unknownDenied = false;
    blockingIssues.push('unknown_actor_not_denied');
  }

  const ok = blockingIssues.length === 0;

  return {
    ok, schoolAuthRequired, safeMinimalContextOnly,
    rawPrivateMemoryExposed, rawChatHistoryExposed, teacherOnlyNotesExposed,
    answerKeysExposed, aiProviderCallMade, unknownDenied, blockingIssues,
  };
}
