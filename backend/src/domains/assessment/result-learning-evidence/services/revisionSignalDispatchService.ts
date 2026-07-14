import { randomUUID } from 'crypto';
import type { ResultRevisionSignal, CreateRevisionSignalRequest } from '../contracts/revisionGrowthSignalContracts';
import type { ResultRevisionSignalRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class RevisionSignalDispatchService {
  constructor(
    private signalRepo: ResultRevisionSignalRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async createRevisionSignalsFromPlan(params: CreateRevisionSignalRequest): Promise<ResultRevisionSignal> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.learningObjectiveId) throw new Error('VALIDATION_FAILED: learningObjectiveId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_REVISION_SIGNAL_DISPATCH', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const signal: ResultRevisionSignal = {
      resultRevisionSignalId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      studentRef: params.studentRef,
      learningObjectiveId: params.learningObjectiveId,
      signalStatus: 'draft',
      signalType: params.signalType || 'revise_objective',
      priority: params.priority ?? 0,
      safeSignalSummary: params.safeSignalSummary,
      recommendedActionRefsJson: params.recommendedActionRefs,
      sourceRefsJson: params.sourceRefs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.signalRepo.create(signal);
  }

  async getRevisionSignal(signalId: string): Promise<ResultRevisionSignal | null> {
    return this.signalRepo.getById(signalId);
  }

  async listRevisionSignalsForBridge(bridgeId: string): Promise<ResultRevisionSignal[]> {
    return this.signalRepo.listByBridge(bridgeId);
  }

  async listRevisionSignalsForPlan(planId: string): Promise<ResultRevisionSignal[]> {
    return this.signalRepo.listByPlan(planId);
  }

  async listRevisionSignalsForStudent(schoolId: string, studentRef: string): Promise<ResultRevisionSignal[]> {
    return this.signalRepo.listByStudentRef(schoolId, studentRef);
  }

  async markRevisionSignalReady(signalId: string, actorRole: string): Promise<ResultRevisionSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_REVISION_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'ready');
  }

  async dispatchRevisionSignal(signalId: string, actorRole: string): Promise<ResultRevisionSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_REVISION_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    // Check if safe adapter exists - for now, mark dispatch deferred
    const signal = await this.signalRepo.getById(signalId);
    if (!signal) throw new Error('NOT_FOUND: revision signal not found');

    return this.signalRepo.updateStatus(signalId, signal.signalStatus === 'ready' ? 'dispatched' : 'blocked');
  }

  async blockRevisionSignal(signalId: string, actorRole: string): Promise<ResultRevisionSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_REVISION_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'blocked');
  }

  async voidRevisionSignal(signalId: string, actorRole: string): Promise<ResultRevisionSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_REVISION_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'void');
  }
}
