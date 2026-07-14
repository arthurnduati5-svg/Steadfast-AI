import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliverySession, ExamDeliverySessionStatus } from '../contracts/examDeliverySessionContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertActivationPolicy } from '../policies/examDeliveryPolicyDefinitions';

export class ExamDeliveryActivationService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async openDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertActivationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole, sessionStatus: 'draft' });
    if (!policy.allowed) return { session: null, policy };

    const existing = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!existing || existing.schoolId !== ctx.schoolId) {
      return { session: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_FOUND', safeMessage: 'Session not found' } };
    }

    const readiness = await this.validateActivationReadiness(ctx, deliverySessionId);
    if (!readiness.ready) {
      return { session: null, policy: { ...policy, allowed: false, reasonCode: 'READINESS_CHECK_FAILED', safeMessage: readiness.reason } };
    }

    const now = new Date().toISOString();
    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'open', now, null);

    const state = await this.repos.sessionStateRepository.getByDeliverySessionId(deliverySessionId);
    if (state) {
      await this.repos.sessionStateRepository.update(deliverySessionId, {
        status: 'open',
        lastStateChangeReason: 'Session opened by activation',
        safeStateSummary: 'Session opened successfully',
      }, state.version);
    }

    return { session, policy };
  }

  async pauseDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertActivationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'paused');
    return { session, policy };
  }

  async resumeDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertActivationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'open');
    return { session, policy };
  }

  async closeDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertActivationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const now = new Date().toISOString();
    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'closed', null, now);
    return { session, policy };
  }

  async cancelDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertActivationPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'cancelled');
    return { session, policy };
  }

  async validateActivationReadiness(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ ready: boolean; reason: string }> {
    const session = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!session) return { ready: false, reason: 'Session not found' };
    if (session.schoolId !== ctx.schoolId) return { ready: false, reason: 'School mismatch' };
    if (session.status === 'open') return { ready: false, reason: 'Session already open' };
    if (session.status === 'closed') return { ready: false, reason: 'Session is closed' };
    if (session.status === 'cancelled') return { ready: false, reason: 'Session is cancelled' };
    if (session.status === 'blocked') return { ready: false, reason: 'Session is blocked' };
    if (session.status === 'archived') return { ready: false, reason: 'Session is archived' };
    return { ready: true, reason: 'Ready to open' };
  }
}
