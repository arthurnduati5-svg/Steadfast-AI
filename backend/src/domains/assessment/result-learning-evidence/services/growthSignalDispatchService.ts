import { randomUUID } from 'crypto';
import type { ResultGrowthSignal, CreateGrowthSignalRequest } from '../contracts/revisionGrowthSignalContracts';
import type { ResultGrowthSignalRepository } from '../contracts/resultLearningEvidenceRepositoryContracts';
import type { ResultLearningEvidencePolicyRegistry } from '../policies/resultLearningEvidencePolicyDefinitions';

export class GrowthSignalDispatchService {
  constructor(
    private signalRepo: ResultGrowthSignalRepository,
    private policyRegistry: ResultLearningEvidencePolicyRegistry,
  ) {}

  async createGrowthSignalsFromPlan(params: CreateGrowthSignalRequest): Promise<ResultGrowthSignal> {
    if (!params.schoolId) throw new Error('SCHOOL_CONTEXT_REQUIRED: schoolId is required');
    if (!params.learningObjectiveId) throw new Error('VALIDATION_FAILED: learningObjectiveId is required');

    const policyCheck = this.policyRegistry.checkPolicy('RESULT_GROWTH_SIGNAL_DISPATCH', params.actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const signal: ResultGrowthSignal = {
      resultGrowthSignalId: randomUUID(),
      schoolId: params.schoolId,
      resultLearningEvidenceBridgeId: params.resultLearningEvidenceBridgeId,
      resultMasteryMutationPlanId: params.resultMasteryMutationPlanId,
      studentRef: params.studentRef,
      learningObjectiveId: params.learningObjectiveId,
      signalStatus: 'draft',
      signalType: params.signalType || 'evidence_only_no_action',
      safeGrowthSummary: params.safeGrowthSummary,
      growthMetricRefsJson: params.growthMetricRefs,
      sourceRefsJson: params.sourceRefs,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.signalRepo.create(signal);
  }

  async getGrowthSignal(signalId: string): Promise<ResultGrowthSignal | null> {
    return this.signalRepo.getById(signalId);
  }

  async listGrowthSignalsForBridge(bridgeId: string): Promise<ResultGrowthSignal[]> {
    return this.signalRepo.listByBridge(bridgeId);
  }

  async listGrowthSignalsForPlan(planId: string): Promise<ResultGrowthSignal[]> {
    return this.signalRepo.listByPlan(planId);
  }

  async listGrowthSignalsForStudent(schoolId: string, studentRef: string): Promise<ResultGrowthSignal[]> {
    return this.signalRepo.listByStudentRef(schoolId, studentRef);
  }

  async markGrowthSignalReady(signalId: string, actorRole: string): Promise<ResultGrowthSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_GROWTH_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'ready');
  }

  async dispatchGrowthSignal(signalId: string, actorRole: string): Promise<ResultGrowthSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_GROWTH_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);

    const signal = await this.signalRepo.getById(signalId);
    if (!signal) throw new Error('NOT_FOUND: growth signal not found');

    return this.signalRepo.updateStatus(signalId, signal.signalStatus === 'ready' ? 'dispatched' : 'blocked');
  }

  async blockGrowthSignal(signalId: string, actorRole: string): Promise<ResultGrowthSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_GROWTH_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'blocked');
  }

  async voidGrowthSignal(signalId: string, actorRole: string): Promise<ResultGrowthSignal | null> {
    const policyCheck = this.policyRegistry.checkPolicy('RESULT_GROWTH_SIGNAL_DISPATCH', actorRole);
    if (!policyCheck.allowed) throw new Error(`POLICY_BLOCKED: ${policyCheck.safeMessage}`);
    return this.signalRepo.updateStatus(signalId, 'void');
  }
}
