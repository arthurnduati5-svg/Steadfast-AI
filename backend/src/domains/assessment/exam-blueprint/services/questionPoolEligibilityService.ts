import {
  QuestionBankItemRepository,
  QuestionVersionRepository,
  QuestionGovernanceRepository,
} from '../../question-bank/contracts/questionBankRepositoryContracts';
import {
  QuestionExposureHoldRepository,
} from '../../question-bank/contracts/questionDuplicateExposureContracts';
import { ExamBlueprintVersion, ExamBlueprintRequirement } from '../contracts';

export interface EligibleQuestion {
  questionId: string;
  questionVersionId: string;
  subjectId: string;
  topicId: string;
  skillId: string;
  objectiveId: string;
  questionType: string;
  difficultyBand: string;
  estimatedTimeSeconds: number;
  securityClass: string;
  marksAvailable: number;
  sourceType: string;
  createdAt: string;
  coverageScore: number;
}

export interface EligibilityDependencies {
  questionBankItemRepo: QuestionBankItemRepository;
  questionVersionRepo: QuestionVersionRepository;
  questionGovernanceRepo: QuestionGovernanceRepository;
  usageEligibilityRepo: QuestionGovernanceRepository;
  exposureHoldRepo: QuestionExposureHoldRepository;
}

export class QuestionPoolEligibilityService {
  constructor(private deps: EligibilityDependencies) {}

  async buildEligiblePool(
    schoolId: string,
    blueprintVersion: ExamBlueprintVersion,
    requirements: ExamBlueprintRequirement[],
  ): Promise<{ eligible: EligibleQuestion[]; reasons: string[] }> {
    const reasons: string[] = [];

    const items = await this.deps.questionBankItemRepo.findBySchoolId(schoolId);
    const approvedItems = items.filter(i => i.status === 'approved');

    if (approvedItems.length === 0) {
      reasons.push('NO_APPROVED_QUESTIONS: no approved question items found');
      return { eligible: [], reasons };
    }

    const eligible: EligibleQuestion[] = [];

    for (const item of approvedItems) {
      const version = await this.deps.questionVersionRepo.findCurrentByQuestionId(item.questionId);
      if (!version || version.status !== 'approved') continue;

      const eligibility = await this.deps.usageEligibilityRepo.findUsageEligibility(version.questionVersionId, 'exam');
      if (!eligibility || !eligibility.eligible) continue;

      if (blueprintVersion.securityClassRequirement === 'exam_secure') {
        const review = await this.deps.questionGovernanceRepo.findContentSafetyReview(version.questionVersionId);
        if (!review || review.reviewState !== 'approved') continue;
      }

      const activeHolds = await this.deps.exposureHoldRepo.findActiveByQuestionId(item.questionId);
      if (activeHolds.length > 0) continue;

      if (item.curriculumVersionId !== blueprintVersion.curriculumVersionId) continue;

      if (['teacher_only', 'restricted'].includes(item.securityClass)) continue;

      const partVersions = await this.deps.questionVersionRepo.findByQuestionId(item.questionId);
      const totalMarks = (partVersions as any[]).length || 0;

      eligible.push({
        questionId: item.questionId,
        questionVersionId: version.questionVersionId,
        subjectId: item.subjectId,
        topicId: item.topicId,
        skillId: item.skillId,
        objectiveId: item.primaryObjectiveId,
        questionType: version.questionType,
        difficultyBand: version.difficultyBand,
        estimatedTimeSeconds: version.estimatedTimeSeconds,
        securityClass: item.securityClass,
        marksAvailable: totalMarks,
        sourceType: item.sourceType,
        createdAt: item.createdAt,
        coverageScore: 0,
      });
    }

    return { eligible, reasons };
  }
}
