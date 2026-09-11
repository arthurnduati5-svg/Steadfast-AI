import type { TutorTurnRequest, TutorTurnContext } from '../contracts/tutorTurnRuntimeContracts';

export function buildTutorTurnContext(request: TutorTurnRequest): TutorTurnContext {
  return {
    schoolId: request.schoolId,
    studentId: request.studentId,
    conversationId: request.conversationId,
    tutorSessionId: request.tutorSessionId,
    turnKind: request.turnKind,
    turnIntent: request.turnIntent,
    turnSource: request.turnSource || request.sourceSurface,
    requestedMode: request.requestedMode,
    activeMode: request.activeMode,
    modeSessionId: request.modeSessionId,
    growthActionPlanId: request.growthActionPlanId,
    approvedContentRef: request.approvedContentRef,
    subjectId: request.subjectId,
    topicId: request.topicId,
    skillId: request.skillId,
    targetType: request.targetType,
    targetRef: request.targetRef,
    inputFingerprint: request.inputFingerprint,
    inputSafetyFlags: request.inputSafetyFlags,
    safeEvidenceRefs: request.safeEvidenceRefs || [],
    safeReasonCodes: request.safeReasonCodes || [],
    sourceSurface: request.sourceSurface || request.turnSource,
    execute: request.execute ?? false,
    dryRun: request.dryRun ?? false,
  };
}

export function buildEmptyTutorTurnContext(schoolId: string, studentId: string): TutorTurnContext {
  return {
    schoolId,
    studentId,
    turnKind: 'state_sync_turn',
    turnIntent: 'no_action_available',
    safeEvidenceRefs: [],
    safeReasonCodes: [],
    execute: false,
    dryRun: true,
  };
}
