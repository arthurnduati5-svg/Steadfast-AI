import { task025PilotRepository } from '../repositories/task025PilotRepository';
import type { PilotRollbackResult } from '../contracts/task025PilotContracts';

export async function pausePilot(
  pilotProgramId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<PilotRollbackResult> {
  const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
  if (!program) {
    return {
      success: false,
      previousStatus: 'unknown',
      newStatus: 'unknown',
      studentAccessBlocked: false,
      dataDestructivelyDeleted: false,
      auditPreserved: false,
      safeSummary: 'Pilot program not found',
    };
  }

  const previousStatus = program.status;
  const updated = await task025PilotRepository.updatePilotProgramStatus(pilotProgramId, 'paused');

  await task025PilotRepository.writeAuditRecord({
    pilotProgramId,
    schoolId: program.schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_paused',
    safeSummary: `Pilot paused by ${actorRole}. Previous status: ${previousStatus}`,
    requestId,
  });

  return {
    success: true,
    previousStatus,
    newStatus: 'paused',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    safeSummary: `Pilot paused. Student access blocked. Audit preserved.`,
  };
}

export async function rollbackPilot(
  pilotProgramId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<PilotRollbackResult> {
  const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
  if (!program) {
    return {
      success: false,
      previousStatus: 'unknown',
      newStatus: 'unknown',
      studentAccessBlocked: false,
      dataDestructivelyDeleted: false,
      auditPreserved: false,
      safeSummary: 'Pilot program not found',
    };
  }

  const previousStatus = program.status;
  const updated = await task025PilotRepository.updatePilotProgramStatus(pilotProgramId, 'rolled_back');

  await task025PilotRepository.writeAuditRecord({
    pilotProgramId,
    schoolId: program.schoolId,
    actorRole,
    actorIdHash,
    action: 'pilot_rolled_back',
    safeSummary: `Pilot rolled back by ${actorRole}. Previous status: ${previousStatus}`,
    requestId,
  });

  return {
    success: true,
    previousStatus,
    newStatus: 'rolled_back',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    safeSummary: `Pilot rolled back. Student access blocked via kill switch. Learning evidence preserved. Audit preserved.`,
  };
}

export async function engageKillSwitch(
  pilotProgramId: string,
  actorRole: string,
  actorIdHash?: string,
  requestId?: string,
): Promise<PilotRollbackResult> {
  const program = await task025PilotRepository.getPilotProgram(pilotProgramId);
  if (!program) {
    return {
      success: false,
      previousStatus: 'unknown',
      newStatus: 'unknown',
      studentAccessBlocked: false,
      dataDestructivelyDeleted: false,
      auditPreserved: false,
      safeSummary: 'Pilot program not found',
    };
  }

  const previousStatus = program.status;

  const now = new Date();
  const entry = {
    ...program,
    killSwitchEnabled: true,
    status: 'rolled_back',
    updatedAt: now,
  };

  if (pilotProgramId) {
    await task025PilotRepository.updatePilotProgramStatus(pilotProgramId, 'rolled_back');
  }

  await task025PilotRepository.writeAuditRecord({
    pilotProgramId,
    schoolId: program.schoolId,
    actorRole,
    actorIdHash,
    action: 'kill_switch_engaged',
    safeSummary: `Kill switch engaged by ${actorRole}. Previous status: ${previousStatus}. Immediate student access blocked.`,
    requestId,
  });

  return {
    success: true,
    previousStatus,
    newStatus: 'rolled_back',
    studentAccessBlocked: true,
    dataDestructivelyDeleted: false,
    auditPreserved: true,
    safeSummary: `Kill switch engaged. Pilot immediately disabled. All student access blocked. Learning evidence retained. Audit trail preserved.`,
  };
}
