import { v4 as uuid } from 'uuid';
import {
  ExamDeliverySession,
  ExamDeliverySessionStatus,
  ExamDeliverySessionMode,
  ExamDeliveryActivationMode,
} from '../contracts/examDeliverySessionContracts';
import { ExamDeliveryCommandContext, ExamDeliveryPolicyDecision } from '../contracts/examDeliveryContracts';
import { ExamDeliveryAllRepositories } from '../contracts/examDeliveryRepositoryContracts';
import { assertDeliverySessionPolicy } from '../policies/examDeliveryPolicyDefinitions';

export class ExamDeliverySessionService {
  constructor(private repos: ExamDeliveryAllRepositories) {}

  async createDeliverySession(
    ctx: ExamDeliveryCommandContext,
    params: {
      paperId: string;
      paperVersionId: string;
      deliveryBridgeId: string;
      accessPolicyId: string;
      title: string;
      safeInstructions: string;
      intendedAudienceType: string;
      sessionMode: ExamDeliverySessionMode;
      activationMode: ExamDeliveryActivationMode;
      classScopeRefsJson?: Record<string, unknown>;
      roleScopeRefsJson?: Record<string, unknown>;
    },
  ): Promise<{ session: ExamDeliverySession; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertDeliverySessionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null as unknown as ExamDeliverySession, policy };

    const deliverySessionId = uuid();
    const session = await this.repos.sessionRepository.create({
      deliverySessionId,
      schoolId: ctx.schoolId,
      paperId: params.paperId,
      paperVersionId: params.paperVersionId,
      deliveryBridgeId: params.deliveryBridgeId,
      accessPolicyId: params.accessPolicyId,
      status: 'draft',
      sessionMode: params.sessionMode,
      title: params.title,
      safeInstructions: params.safeInstructions,
      intendedAudienceType: params.intendedAudienceType,
      classScopeRefsJson: params.classScopeRefsJson ?? null,
      roleScopeRefsJson: params.roleScopeRefsJson ?? null,
      activationMode: params.activationMode,
      createdByActorId: ctx.actorId,
      createdByRole: ctx.actorRole,
      openedAt: null,
      closedAt: null,
      archivedAt: null,
    });

    await this.repos.sessionStateRepository.create({
      sessionStateId: uuid(),
      schoolId: ctx.schoolId,
      deliverySessionId: session.deliverySessionId,
      status: 'draft',
      activeAttemptCount: 0,
      submittedAttemptCount: 0,
      pausedAttemptCount: 0,
      blockedAttemptCount: 0,
      lastStateChangeReason: 'Session created',
      safeStateSummary: `Delivery session created for paper ${params.paperId}`,
      version: 1,
    });

    return { session, policy };
  }

  async getDeliverySession(deliverySessionId: string): Promise<ExamDeliverySession | null> {
    return this.repos.sessionRepository.getById(deliverySessionId);
  }

  async listDeliverySessionsForSchool(schoolId: string, status?: ExamDeliverySessionStatus): Promise<ExamDeliverySession[]> {
    if (status) return this.repos.sessionRepository.listBySchoolAndStatus(schoolId, status);
    return this.repos.sessionRepository.listBySchool(schoolId);
  }

  async configureDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
    params: {
      title?: string;
      safeInstructions?: string;
      sessionMode?: ExamDeliverySessionMode;
      activationMode?: ExamDeliveryActivationMode;
    },
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertDeliverySessionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const existing = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!existing || existing.schoolId !== ctx.schoolId) {
      return { session: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_FOUND', safeMessage: 'Session not found' } };
    }

    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'configured');
    return { session, policy };
  }

  async blockDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertDeliverySessionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const existing = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!existing || existing.schoolId !== ctx.schoolId) return { session: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_FOUND', safeMessage: 'Session not found' } };

    const session = await this.repos.sessionRepository.updateStatus(deliverySessionId, 'blocked');
    return { session, policy };
  }

  async archiveDeliverySession(
    ctx: ExamDeliveryCommandContext,
    deliverySessionId: string,
  ): Promise<{ session: ExamDeliverySession | null; policy: ExamDeliveryPolicyDecision }> {
    const policy = assertDeliverySessionPolicy({ schoolId: ctx.schoolId, actorRole: ctx.actorRole });
    if (!policy.allowed) return { session: null, policy };

    const existing = await this.repos.sessionRepository.getById(deliverySessionId);
    if (!existing || existing.schoolId !== ctx.schoolId) return { session: null, policy: { ...policy, allowed: false, reasonCode: 'NOT_FOUND', safeMessage: 'Session not found' } };

    const session = await this.repos.sessionRepository.archive(deliverySessionId);
    return { session, policy };
  }
}
