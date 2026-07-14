import { randomUUID } from 'crypto';
import type { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import type { QuestionDuplicateCandidate, DuplicateCandidateStatus } from '../contracts/questionDuplicateExposureContracts';
import type { QuestionDuplicateCandidateRepository } from '../contracts/questionDuplicateExposureContracts';
import type { AssessmentCommandContext } from '../../../assessment/contracts/assessmentCommandContext';
import type { AssessmentPolicyFamily } from '../../../assessment/contracts/assessmentPolicyContracts';

export class QuestionDuplicateCandidateService {
  constructor(
    private enforcementService: AssessmentCommandEnforcementService,
    private duplicateCandidateRepository: QuestionDuplicateCandidateRepository,
  ) {}

  async recordDuplicateCandidate(params: {
    schoolId: string;
    sourceQuestionVersionId: string;
    candidateQuestionVersionId: string;
    contentHash: string;
    similarityReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionDuplicateCandidate> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:duplicate:record_candidate',
      commandFingerprint: `duplicate:record:${params.sourceQuestionVersionId}:${params.candidateQuestionVersionId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const candidate: QuestionDuplicateCandidate = {
      duplicateCandidateId: randomUUID(),
      schoolId: params.schoolId,
      sourceQuestionVersionId: params.sourceQuestionVersionId,
      candidateQuestionVersionId: params.candidateQuestionVersionId,
      contentHash: params.contentHash,
      similarityReason: params.similarityReason,
      status: 'suspected',
      createdAt: new Date().toISOString(),
      resolvedAt: null,
      resolvedByActorId: null,
      resolutionReason: null,
    };

    return this.duplicateCandidateRepository.create(candidate);
  }

  async resolveDuplicateCandidate(params: {
    duplicateCandidateId: string;
    status: Exclude<DuplicateCandidateStatus, 'suspected'>;
    resolutionReason: string;
    context: AssessmentCommandContext;
  }): Promise<QuestionDuplicateCandidate> {
    const enforcement = await this.enforcementService.enforceGovernedCommand({
      context: params.context,
      commandType: 'question:duplicate:resolve_candidate',
      commandFingerprint: `duplicate:resolve:${params.duplicateCandidateId}`,
      body: {},
    }, {
      requiredPolicies: ['QUESTION_DRAFT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) throw new Error(`POLICY_BLOCKED: ${enforcement.safeMessage}`);

    const resolved = await this.duplicateCandidateRepository.updateStatus(
      params.duplicateCandidateId,
      params.status,
      new Date().toISOString(),
      params.context.actorId,
      params.resolutionReason,
    );
    if (!resolved) throw new Error('NOT_FOUND: duplicate candidate not found');
    return resolved;
  }
}
