import { randomUUID } from 'crypto';
import type { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import type { QuestionExposureHold, ExposureHoldType } from '../contracts/questionDuplicateExposureContracts';
import type { QuestionExposureHoldRepository } from '../contracts/questionDuplicateExposureContracts';
import type { AssessmentCommandContext } from '../../../assessment/contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily } from '../../../assessment/contracts/assessmentPolicyContracts';

export class QuestionExposureHoldService {
  constructor(
    private enforcementService: AssessmentCommandEnforcementService,
    private exposureHoldRepository: QuestionExposureHoldRepository,
  ) {}

  async placeExposureHold(params: {
    schoolId: string;
    questionId: string;
    questionVersionId: string;
    holdType: ExposureHoldType;
    reasonCode: string;
    safeSummary: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionExposureHold> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:exposure:place_hold',
      commandFingerprint: `exposure:place:${params.questionVersionId}:${Date.now()}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const hold: QuestionExposureHold = {
      exposureHoldId: randomUUID(),
      schoolId: params.schoolId,
      questionId: params.questionId,
      questionVersionId: params.questionVersionId,
      holdType: params.holdType,
      status: 'active',
      reasonCode: params.reasonCode,
      safeSummary: params.safeSummary,
      createdByActorId: params.context.actorId,
      createdAt: new Date().toISOString(),
      releasedByActorId: null,
      releasedAt: null,
      releaseReason: null,
    };

    return this.exposureHoldRepository.create(hold);
  }

  async releaseExposureHold(params: {
    exposureHoldId: string;
    releaseReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionExposureHold> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:exposure:release_hold',
      commandFingerprint: `exposure:release:${params.exposureHoldId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const released = await this.exposureHoldRepository.releaseHold(
      params.exposureHoldId,
      params.context.actorId,
      params.releaseReason,
      new Date().toISOString(),
    );
    if (!released) throw new Error('NOT_FOUND: exposure hold not found');
    return released;
  }

  async listActiveHoldsForQuestion(questionId: string): Promise<QuestionExposureHold[]> {
    return this.exposureHoldRepository.findActiveByQuestionId(questionId);
  }
}
