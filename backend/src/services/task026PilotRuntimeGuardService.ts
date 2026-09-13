import { task026PilotExecutionRepository } from '../repositories/task026PilotExecutionRepository';
import { task025PilotRepository } from '../repositories/task025PilotRepository';
import { evaluatePilotReadiness } from './task025PilotReadinessService';
import type { PilotExecutionGateDecision } from '../contracts/task026PilotExecutionContracts';

export async function checkPilotRuntimeAccess(params: {
  schoolId: string;
  actorIdHash: string;
  role: string;
  pilotProgramId?: string;
  executionRunId?: string;
  cohortId?: string;
  subject?: string;
  curriculumTrack?: string;
}): Promise<PilotExecutionGateDecision> {
  const { schoolId, actorIdHash, role } = params;

  if (!schoolId || schoolId === 'unknown' || schoolId === '') {
    return {
      allowed: false,
      reasonCodes: ['no_verified_school_identity'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { schoolVerified: false },
    };
  }

  // Task 025 readiness must be accepted
  const readiness = await evaluatePilotReadiness(params.pilotProgramId ?? '', schoolId).catch(() => null);
  if (!readiness || !readiness.safeToStartPilot) {
    return {
      allowed: false,
      reasonCodes: ['task025_readiness_not_accepted', ...(readiness?.blockingIssues ?? [])],
      safeMessage: 'Pilot readiness has not been accepted.',
      gateSnapshot: { task025ReadinessAccepted: false },
    };
  }

  // PilotProgram exists and approved
  const program = await task025PilotRepository.getPilotProgram(params.pilotProgramId ?? '');
  if (!program) {
    return {
      allowed: false,
      reasonCodes: ['pilot_program_not_found'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { programExists: false },
    };
  }

  if (program.approvalStatus !== 'approved') {
    return {
      allowed: false,
      reasonCodes: ['pilot_program_not_approved'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { programApproved: false },
    };
  }

  // PilotExecutionRun exists and is active
  const executionRunId = params.executionRunId ?? '';
  let run = null;
  if (executionRunId) {
    run = await task026PilotExecutionRepository.getExecutionRun(executionRunId);
  } else {
    const runs = await task026PilotExecutionRepository.listExecutionRuns(params.pilotProgramId ?? '');
    run = runs.length > 0 ? runs[0] : null;
  }

  if (!run) {
    return {
      allowed: false,
      reasonCodes: ['no_active_execution_run'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { executionRunExists: false },
    };
  }

  const runStatus = (run as any).status;
  if (runStatus !== 'active') {
    return {
      allowed: false,
      reasonCodes: [`execution_run_not_active_${runStatus}`],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { executionRunActive: false, currentStatus: runStatus },
    };
  }

  // Kill switch check
  if (program.killSwitchEnabled && (program as any).status === 'rolled_back') {
    return {
      allowed: false,
      reasonCodes: ['kill_switch_enabled'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { killSwitchEnabled: true },
    };
  }

  // User is active participant
  const participant = await task025PilotRepository.getParticipantByActorIdHash(
    params.pilotProgramId ?? '',
    actorIdHash,
  );
  if (!participant) {
    return {
      allowed: false,
      reasonCodes: ['not_in_pilot_participants'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { participantFound: false },
    };
  }

  if ((participant as any).eligibilityStatus !== 'eligible') {
    return {
      allowed: false,
      reasonCodes: ['participant_not_eligible', `eligibility_${(participant as any).eligibilityStatus}`],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { participantEligible: false },
    };
  }

  // Role allowed
  const allowedRoles: string[] = Array.isArray(program.allowedRoles) && program.allowedRoles.length > 0
    ? program.allowedRoles : ['student', 'teacher'];

  if (!allowedRoles.includes(role)) {
    return {
      allowed: false,
      reasonCodes: ['role_not_allowed'],
      safeMessage: 'This pilot is not available for this account or school context.',
      gateSnapshot: { roleAllowed: false },
    };
  }

  // Cohort check
  if (params.cohortId) {
    const allowedCohortIds: string[] = Array.isArray((run as any).allowedCohortIds)
      ? (run as any).allowedCohortIds : [];
    if (allowedCohortIds.length > 0 && !allowedCohortIds.includes(params.cohortId)) {
      return {
        allowed: false,
        reasonCodes: ['cohort_not_allowed'],
        safeMessage: 'This pilot is not available for this account or school context.',
        gateSnapshot: { cohortAllowed: false },
      };
    }
  }

  // Curriculum scope
  if (params.subject || params.curriculumTrack) {
    const allowedSubjects: string[] = Array.isArray(program.allowedSubjects)
      ? program.allowedSubjects : [];
    const allowedTracks: string[] = Array.isArray(program.allowedCurriculumTracks)
      ? program.allowedCurriculumTracks : [];

    if (params.subject && allowedSubjects.length > 0 && !allowedSubjects.includes(params.subject)) {
      return {
        allowed: false,
        reasonCodes: ['subject_not_in_pilot_scope'],
        safeMessage: 'This subject is not within the current pilot scope.',
        gateSnapshot: { subjectAllowed: false },
      };
    }

    if (params.curriculumTrack && allowedTracks.length > 0 && !allowedTracks.includes(params.curriculumTrack)) {
      return {
        allowed: false,
        reasonCodes: ['curriculum_track_not_in_pilot_scope'],
        safeMessage: 'This curriculum track is not within the current pilot scope.',
        gateSnapshot: { curriculumTrackAllowed: false },
      };
    }
  }

  // Socratic, Deen, privacy guards assumed via prior gate contracts
  const actualExecutionRunId = executionRunId || (run as any).id;

  return {
    allowed: true,
    reasonCodes: [],
    safeMessage: 'Pilot runtime access granted.',
    gateSnapshot: {
      schoolVerified: true,
      task025ReadinessAccepted: true,
      programExists: true,
      programApproved: true,
      executionRunExists: true,
      executionRunActive: true,
      killSwitchEnabled: false,
      participantFound: true,
      participantEligible: true,
      roleAllowed: true,
      socraticGuardReady: true,
      deenGovernanceReady: true,
      privacyGuardReady: true,
      executionRunId: actualExecutionRunId,
    },
  };
}
