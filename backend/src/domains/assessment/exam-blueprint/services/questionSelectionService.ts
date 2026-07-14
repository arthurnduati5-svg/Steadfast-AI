import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../../assessmentCommandEnforcementService';
import { AssessmentGovernedCommand } from '../../contracts/assessmentCommandContext';
import {
  ExamBlueprintVersion, ExamBlueprintRequirement,
  QuestionSelectionRun, QuestionSelectionCandidate,
  SelectionStrategy, DraftRecommendationSummary,
} from '../contracts';
import { EligibleQuestion, QuestionPoolEligibilityService } from './questionPoolEligibilityService';
import { BlueprintCoverageGapService } from './blueprintCoverageGapService';
import {
  QuestionSelectionRunRepository,
  QuestionSelectionCandidateRepository,
} from '../contracts/examBlueprintRepositoryContracts';

export interface QuestionSelectionDependencies {
  enforcementService: AssessmentCommandEnforcementService;
  eligibilityService: QuestionPoolEligibilityService;
  coverageGapService: BlueprintCoverageGapService;
  selectionRunRepo: QuestionSelectionRunRepository;
  selectionCandidateRepo: QuestionSelectionCandidateRepository;
}

export class QuestionSelectionService {
  constructor(private deps: QuestionSelectionDependencies) {}

  async buildEligibleQuestionPool(
    schoolId: string,
    blueprintVersion: ExamBlueprintVersion,
    requirements: ExamBlueprintRequirement[],
  ) {
    return this.deps.eligibilityService.buildEligiblePool(schoolId, blueprintVersion, requirements);
  }

  scoreSelectionCandidate(
    question: EligibleQuestion,
    requirements: ExamBlueprintRequirement[],
    alreadySelectedIds: Set<string>,
  ): { score: number; coverageContribution: string[]; riskFlags: string[] } {
    let score = 50;
    const coverageContribution: string[] = [];
    const riskFlags: string[] = [];

    for (const req of requirements) {
      if (req.objectiveId && question.objectiveId === req.objectiveId) {
        score += 20;
        coverageContribution.push(`objective:${req.objectiveId}`);
      }
      if (req.topicId && question.topicId === req.topicId) {
        score += 10;
        coverageContribution.push(`topic:${req.topicId}`);
      }
      if (req.skillId && question.skillId === req.skillId) {
        score += 10;
        coverageContribution.push(`skill:${req.skillId}`);
      }
      if (req.questionType && question.questionType === req.questionType) {
        score += 5;
        coverageContribution.push(`type:${req.questionType}`);
      }
    }

    const difficultyOrder = ['recall', 'understanding', 'application', 'analysis', 'evaluation', 'creation'];
    const qIdx = difficultyOrder.indexOf(question.difficultyBand);
    for (const req of requirements) {
      const minIdx = difficultyOrder.indexOf(req.minimumDifficulty);
      const maxIdx = difficultyOrder.indexOf(req.maximumDifficulty);
      if (minIdx >= 0 && maxIdx >= 0 && qIdx >= minIdx && qIdx <= maxIdx) {
        score += 5;
        coverageContribution.push(`difficulty:${question.difficultyBand}`);
        break;
      }
    }

    if (alreadySelectedIds.has(question.questionId)) {
      score -= 30;
      riskFlags.push('duplicate_risk');
    }

    if (question.securityClass === 'practice_safe') {
      score -= 5;
    }

    const questionAge = Date.now() - new Date(question.createdAt).getTime();
    const ageDays = questionAge / (1000 * 60 * 60 * 24);
    if (ageDays > 365) {
      score -= 10;
      riskFlags.push('low_freshness');
    }

    return { score: Math.max(0, Math.min(100, score)), coverageContribution, riskFlags };
  }

  async selectQuestionsForBlueprint(
    schoolId: string,
    blueprintVersion: ExamBlueprintVersion,
    requirements: ExamBlueprintRequirement[],
    strategy: SelectionStrategy,
  ): Promise<{
    selected: EligibleQuestion[];
    candidates: QuestionSelectionCandidate[];
    gaps: import('../contracts').BlueprintCoverageGap[];
    run: QuestionSelectionRun;
  }> {
    const { eligible, reasons } = await this.deps.eligibilityService.buildEligiblePool(schoolId, blueprintVersion, requirements);

    const now = new Date().toISOString();
    const run: QuestionSelectionRun = {
      selectionRunId: randomUUID(),
      schoolId,
      blueprintId: blueprintVersion.blueprintId,
      blueprintVersionId: blueprintVersion.blueprintVersionId,
      draftSetId: '',
      status: 'started',
      strategy,
      candidatePoolSize: eligible.length,
      eligiblePoolSize: eligible.length,
      selectedCount: 0,
      rejectedCount: 0,
      gapCount: 0,
      safeSummary: '',
      createdAt: now,
      completedAt: null,
    };

    await this.deps.selectionRunRepo.create(run);

    const scored: { question: EligibleQuestion; score: number; coverage: string[]; risks: string[] }[] = [];
    const alreadySelected = new Set<string>();

    for (const q of eligible) {
      const { score, coverageContribution, riskFlags } = this.scoreSelectionCandidate(q, requirements, alreadySelected);
      scored.push({ question: q, score, coverage: coverageContribution, risks: riskFlags });
    }

    scored.sort((a, b) => b.score - a.score);

    const candidates: QuestionSelectionCandidate[] = [];
    const selected: EligibleQuestion[] = [];
    let remaining = blueprintVersion.targetQuestionCount;

    for (const s of scored) {
      const candidate: QuestionSelectionCandidate = {
        selectionCandidateId: randomUUID(),
        selectionRunId: run.selectionRunId,
        schoolId,
        questionId: s.question.questionId,
        questionVersionId: s.question.questionVersionId,
        eligible: true,
        selected: false,
        rejectionReasonCode: '',
        score: s.score,
        coverageContributionJson: JSON.stringify(s.coverage),
        riskFlagsJson: JSON.stringify(s.risks),
        createdAt: now,
      };

      if (remaining > 0 && !alreadySelected.has(s.question.questionId) && s.score >= 30) {
        candidate.selected = true;
        selected.push(s.question);
        alreadySelected.add(s.question.questionId);
        remaining--;
      } else {
        candidate.rejectionReasonCode = remaining <= 0 ? 'MAX_SELECTED_REACHED' : 'LOW_SCORE';
      }

      candidates.push(candidate);
      await this.deps.selectionCandidateRepo.create(candidate);
    }

    const gaps = await this.deps.coverageGapService.detectCoverageGaps(
      requirements, selected, eligible, reasons,
    );

    const completedRun = await this.deps.selectionRunRepo.update({
      ...run,
      status: gaps.length > 0 ? 'partial' : 'completed',
      selectedCount: selected.length,
      rejectedCount: candidates.length - selected.length,
      gapCount: gaps.length,
      safeSummary: `Selected ${selected.length}/${blueprintVersion.targetQuestionCount} questions. ${gaps.length} gaps detected.`,
      completedAt: now,
    });

    return { selected, candidates, gaps, run: completedRun! };
  }

  async recordSelectionRun(
    command: AssessmentGovernedCommand<{ run: QuestionSelectionRun }>,
  ): Promise<{ ok: boolean; data?: QuestionSelectionRun; error?: string }> {
    const created = await this.deps.selectionRunRepo.create(command.body.run);
    return { ok: true, data: created };
  }
}
