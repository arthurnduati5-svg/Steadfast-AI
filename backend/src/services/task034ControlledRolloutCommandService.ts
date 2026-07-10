import { task034Repository } from '../repositories/task034ControlledLimitedRolloutRepository';
import { transitionTask034RolloutStatus } from './task034ControlledRolloutStateMachineService';

export async function executeTask034RolloutCommand(
  command: string,
  sessionId: string,
): Promise<{ ok: boolean; message: string }> {
  const session = await task034Repository.getRolloutSession(sessionId);
  if (!session) {
    return { ok: false, message: `Session not found: ${sessionId}` };
  }

  switch (command) {
    case 'pause': {
      const validFromStatuses = ['limited_rollout_active_internal'];
      if (!validFromStatuses.includes(session.status)) {
        return { ok: false, message: `Cannot pause from status: ${session.status}` };
      }
      await transitionTask034RolloutStatus(session, 'limited_rollout_paused');
      return { ok: true, message: 'Rollout paused' };
    }

    case 'resume': {
      const validFromStatuses = ['limited_rollout_paused'];
      if (!validFromStatuses.includes(session.status)) {
        return { ok: false, message: `Cannot resume from status: ${session.status}` };
      }
      await transitionTask034RolloutStatus(session, 'limited_rollout_active_internal');
      return { ok: true, message: 'Rollout resumed' };
    }

    case 'kill_switch': {
      const validFromStatuses = ['limited_rollout_active_internal', 'limited_rollout_paused'];
      if (!validFromStatuses.includes(session.status)) {
        return { ok: false, message: `Cannot enable kill switch from status: ${session.status}` };
      }
      await transitionTask034RolloutStatus(session, 'kill_switch_enabled');
      return { ok: true, message: 'Kill switch enabled' };
    }

    case 'rollback': {
      const validFromStatuses = ['limited_rollout_active_internal', 'limited_rollout_paused'];
      if (!validFromStatuses.includes(session.status)) {
        return { ok: false, message: `Cannot request rollback from status: ${session.status}` };
      }
      await transitionTask034RolloutStatus(session, 'rollback_requested');
      return { ok: true, message: 'Rollback requested' };
    }

    default:
      return { ok: false, message: `Unknown command: ${command}` };
  }
}
