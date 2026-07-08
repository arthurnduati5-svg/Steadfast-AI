import { task025PilotRepository } from '../repositories/task025PilotRepository';
import type { PilotAccessGateResult } from '../contracts/task025PilotContracts';

export async function checkPilotAccess(params: {
  pilotProgramId: string;
  schoolId: string;
  actorIdHash: string;
  role: string;
  subject?: string;
  curriculumTrack?: string;
}): Promise<PilotAccessGateResult> {
  const { pilotProgramId, schoolId, actorIdHash, role } = params;

  if (!schoolId || schoolId === 'unknown' || schoolId === '') {
    return {
      allowed: false,
      reasonCodes: ['no_verified_school_identity'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
  if (!program) {
    return {
      allowed: false,
      reasonCodes: ['pilot_program_not_found'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  if (program.killSwitchEnabled === true && program.status === 'rolled_back') {
    return {
      allowed: false,
      reasonCodes: ['pilot_rolled_back'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  if (program.status !== 'active' && program.status !== 'ready') {
    return {
      allowed: false,
      reasonCodes: ['pilot_not_active', `pilot_status_${program.status}`],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  if (schoolId !== program.schoolId) {
    return {
      allowed: false,
      reasonCodes: ['school_mismatch'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  const allowedRoles: string[] = program.allowedRoles && Array.isArray(program.allowedRoles)
    ? program.allowedRoles : ['student', 'teacher'];
  if (!allowedRoles.includes(role)) {
    return {
      allowed: false,
      reasonCodes: ['role_not_allowed'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  const participant = await task025PilotRepository.getParticipantByActorIdHash(pilotProgramId, actorIdHash);
  if (!participant) {
    return {
      allowed: false,
      reasonCodes: ['not_in_pilot_participants'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  if (participant.eligibilityStatus !== 'eligible') {
    return {
      allowed: false,
      reasonCodes: ['participant_not_eligible', `eligibility_${participant.eligibilityStatus}`],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  if (params.subject || params.curriculumTrack) {
    const allowedSubjects: string[] = program.allowedSubjects && Array.isArray(program.allowedSubjects)
      ? program.allowedSubjects : [];
    const allowedTracks: string[] = program.allowedCurriculumTracks && Array.isArray(program.allowedCurriculumTracks)
      ? program.allowedCurriculumTracks : [];

    if (params.subject && allowedSubjects.length > 0 && !allowedSubjects.includes(params.subject)) {
      return {
        allowed: false,
        reasonCodes: ['subject_not_in_pilot_scope'],
        safeMessage: 'This subject is not within the current pilot scope.',
      };
    }

    if (params.curriculumTrack && allowedTracks.length > 0 && !allowedTracks.includes(params.curriculumTrack)) {
      return {
        allowed: false,
        reasonCodes: ['curriculum_track_not_in_pilot_scope'],
        safeMessage: 'This curriculum track is not within the current pilot scope.',
      };
    }
  }

  return {
    allowed: true,
    reasonCodes: [],
    safeMessage: 'Pilot access granted.',
  };
}

export async function checkPilotAccessForTutorSession(params: {
  pilotProgramId: string;
  schoolId: string;
  actorIdHash: string;
  role: string;
}): Promise<PilotAccessGateResult> {
  const result = await checkPilotAccess(params);

  if (!result.allowed) {
    return result;
  }

  const program = await task025PilotRepository.getPilotProgram(params.pilotProgramId);

  if (program?.killSwitchEnabled && program.status === 'rolled_back') {
    return {
      allowed: false,
      reasonCodes: ['kill_switch_engaged'],
      safeMessage: 'This pilot is not available for this account or school context.',
    };
  }

  return result;
}
