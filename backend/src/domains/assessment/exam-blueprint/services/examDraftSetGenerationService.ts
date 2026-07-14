import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../../assessmentCommandEnforcementService';
import { AssessmentGovernedCommand } from '../../contracts/assessmentCommandContext';
import {
  ExamBlueprintVersion, ExamBlueprintRequirement,
  ExamDraftSet, ExamDraft, ExamDraftQuestion,
  ExamBlueprint, SelectionStrategy,
} from '../contracts';
import { QuestionSelectionService } from './questionSelectionService';
import { ExamDraftRankingService } from './examDraftRankingService';
import { BlueprintCoverageGapService } from './blueprintCoverageGapService';
import { EligibleQuestion } from './questionPoolEligibilityService';
import {
  ExamBlueprintRepository, ExamBlueprintVersionRepository,
  ExamBlueprintRequirementRepository,
  ExamDraftSetRepository, ExamDraftRepository, ExamDraftQuestionRepository,
} from '../contracts/examBlueprintRepositoryContracts';

export interface DraftSetGenerationDependencies {
  enforcementService: AssessmentCommandEnforcementService;
  selectionService: QuestionSelectionService;
  rankingService: ExamDraftRankingService;
  coverageGapService: BlueprintCoverageGapService;
  blueprintRepo: ExamBlueprintRepository;
  blueprintVersionRepo: ExamBlueprintVersionRepository;
  requirementRepo: ExamBlueprintRequirementRepository;
  draftSetRepo: ExamDraftSetRepository;
  draftRepo: ExamDraftRepository;
  draftQuestionRepo: ExamDraftQuestionRepository;
}

export class ExamDraftSetGenerationService {
  constructor(private deps: DraftSetGenerationDependencies) {}

  async generateDraftSet(
    schoolId: string,
    blueprint: ExamBlueprint,
    blueprintVersion: ExamBlueprintVersion,
    requirements: ExamBlueprintRequirement[],
    requestedDraftCount: number,
    actorId: string,
    actorRole: string,
  ): Promise<{
    draftSet: ExamDraftSet;
    drafts: ExamDraft[];
    allQuestions: ExamDraftQuestion[][];
  }> {
    if (requestedDraftCount < 3 || requestedDraftCount > 10) {
      throw new Error(`VALIDATION_FAILED: requestedDraftCount must be between 3 and 10, got ${requestedDraftCount}`);
    }

    // Build eligible pool once
    const { eligible } = await this.deps.selectionService.buildEligibleQuestionPool(
      schoolId, blueprintVersion, requirements,
    );

    const now = new Date().toISOString();

    const draftSet: ExamDraftSet = {
      draftSetId: randomUUID(),
      schoolId,
      blueprintId: blueprint.blueprintId,
      blueprintVersionId: blueprintVersion.blueprintVersionId,
      status: 'generating',
      requestedDraftCount,
      generatedDraftCount: 0,
      selectionStrategy: blueprintVersion.selectionStrategy,
      createdByActorId: actorId,
      createdByRole: actorRole,
      safeSummary: '',
      coverageGapSummary: '',
      createdAt: now,
      updatedAt: now,
      completedAt: null,
    };

    await this.deps.draftSetRepo.create(draftSet);

    const allDrafts: ExamDraft[] = [];
    const allQuestions: ExamDraftQuestion[][] = [];

    for (let i = 0; i < requestedDraftCount; i++) {
      const { selected, gaps } = await this.deps.selectionService.selectQuestionsForBlueprint(
        schoolId, blueprintVersion, requirements,
        (blueprintVersion.selectionStrategy || 'balanced') as SelectionStrategy,
      );

      const draftTitle = `${blueprint.title} - Draft ${i + 1}`;
      const totalMarks = selected.reduce((sum, q) => sum + q.marksAvailable, 0);
      const totalTime = selected.reduce((sum, q) => sum + q.estimatedTimeSeconds, 0);

      const gapSummary = await this.deps.coverageGapService.summarizeCoverageGaps(gaps);

      const draft: ExamDraft = {
        draftId: randomUUID(),
        draftSetId: draftSet.draftSetId,
        schoolId,
        blueprintId: blueprint.blueprintId,
        blueprintVersionId: blueprintVersion.blueprintVersionId,
        rank: 0,
        status: 'candidate',
        draftTitle,
        totalMarks,
        estimatedDurationMinutes: Math.ceil(totalTime / 60),
        questionCount: selected.length,
        coverageScore: 0,
        difficultyBalanceScore: 0,
        securityScore: 0,
        freshnessScore: 0,
        overallScore: 0,
        recommendationReason: '',
        safeTeacherSummary: '',
        differenceFromPreviousDraft: '',
        warningCodesJson: '[]',
        createdAt: now,
        updatedAt: now,
      };

      const createdDraft = await this.deps.draftRepo.create(draft);
      const questions: ExamDraftQuestion[] = [];

      for (let pos = 0; pos < selected.length; pos++) {
        const q = selected[pos];
        const dq: ExamDraftQuestion = {
          draftQuestionId: randomUUID(),
          draftId: createdDraft.draftId,
          schoolId,
          questionId: q.questionId,
          questionVersionId: q.questionVersionId,
          position: pos + 1,
          sectionKey: 'default',
          marksAllocated: q.marksAvailable || 1,
          selectionReason: `Scored ${q.coverageScore} in selection`,
          requirementId: '',
          coverageTagsJson: '[]',
          warningCodesJson: '[]',
          createdAt: now,
        };

        const created = await this.deps.draftQuestionRepo.create(dq);
        questions.push(created);
      }

      allDrafts.push(createdDraft);
      allQuestions.push(questions);
    }

    const ranked = await this.deps.rankingService.rankDrafts(allDrafts, allQuestions);

    const finalDrafts: ExamDraft[] = [];

    for (let i = 0; i < ranked.length; i++) {
      const updated = await this.deps.draftRepo.update({
        ...ranked[i].draft,
        rank: i + 1,
        overallScore: ranked[i].overallScore,
        coverageScore: ranked[i].coverageScore,
        difficultyBalanceScore: ranked[i].difficultyBalanceScore,
        securityScore: ranked[i].securityScore,
        freshnessScore: ranked[i].freshnessScore,
        recommendationReason: ranked[i].recommendationReason,
        safeTeacherSummary: ranked[i].safeTeacherSummary,
        differenceFromPreviousDraft: ranked[i].differenceFromPreviousDraft,
        warningCodesJson: JSON.stringify(ranked[i].warningCodes),
      });
      if (updated) finalDrafts.push(updated);
    }

    const allGaps = allDrafts.map(() => []);

    const updatedDraftSet = await this.deps.draftSetRepo.update({
      ...draftSet,
      status: 'ready_for_teacher_review',
      generatedDraftCount: finalDrafts.length,
      safeSummary: `Generated ${finalDrafts.length} draft papers from blueprint "${blueprint.title}"`,
      coverageGapSummary: allGaps.length > 0 ? `${allGaps.length} coverage gap(s) detected` : 'No coverage gaps',
      updatedAt: now,
      completedAt: now,
    });

    return { draftSet: updatedDraftSet!, drafts: finalDrafts, allQuestions };
  }

  async generateSingleDraft(
    schoolId: string,
    blueprintVersion: ExamBlueprintVersion,
    requirements: ExamBlueprintRequirement[],
    seed: string,
  ): Promise<{ draft: ExamDraft; questions: ExamDraftQuestion[] }> {
    const { eligible, reasons } = await this.deps.selectionService.buildEligibleQuestionPool(
      schoolId, blueprintVersion, requirements,
    );

    const now = new Date().toISOString();
    const draftId = randomUUID();

    const draft: ExamDraft = {
      draftId,
      draftSetId: '',
      schoolId,
      blueprintId: blueprintVersion.blueprintId,
      blueprintVersionId: blueprintVersion.blueprintVersionId,
      rank: 0,
      status: 'candidate',
      draftTitle: `Single Draft - ${seed}`,
      totalMarks: 0,
      estimatedDurationMinutes: 0,
      questionCount: 0,
      coverageScore: 0,
      difficultyBalanceScore: 0,
      securityScore: 0,
      freshnessScore: 0,
      overallScore: 0,
      recommendationReason: '',
      safeTeacherSummary: '',
      differenceFromPreviousDraft: '',
      warningCodesJson: '[]',
      createdAt: now,
      updatedAt: now,
    };

    const createdDraft = await this.deps.draftRepo.create(draft);

    const questions: ExamDraftQuestion[] = [];
    const alreadySelected = new Set<string>();
    let count = 0;

    for (const q of eligible) {
      if (alreadySelected.has(q.questionId)) continue;
      if (count >= blueprintVersion.targetQuestionCount) break;

      count++;
      alreadySelected.add(q.questionId);

      const dq: ExamDraftQuestion = {
        draftQuestionId: randomUUID(),
        draftId: createdDraft.draftId,
        schoolId,
        questionId: q.questionId,
        questionVersionId: q.questionVersionId,
        position: count,
        sectionKey: 'default',
        marksAllocated: q.marksAvailable || 1,
        selectionReason: `Selected from eligible pool for ${seed}`,
        requirementId: '',
        coverageTagsJson: '[]',
        warningCodesJson: '[]',
        createdAt: now,
      };

      const created = await this.deps.draftQuestionRepo.create(dq);
      questions.push(created);
    }

    const updatedDraft = await this.deps.draftRepo.update({
      ...createdDraft,
      questionCount: count,
      totalMarks: questions.reduce((s, q) => s + q.marksAllocated, 0),
    });

    return { draft: updatedDraft!, questions };
  }

  async listDraftsForSet(draftSetId: string): Promise<ExamDraft[]> {
    return this.deps.draftRepo.findByDraftSetId(draftSetId);
  }

  async getDraftSet(draftSetId: string): Promise<ExamDraftSet | null> {
    return this.deps.draftSetRepo.findById(draftSetId);
  }
}
