import { ExamDraft, ExamDraftQuestion } from '../contracts';

export interface RankedDraftResult {
  draft: ExamDraft;
  overallScore: number;
  coverageScore: number;
  difficultyBalanceScore: number;
  securityScore: number;
  freshnessScore: number;
  recommendationReason: string;
  safeTeacherSummary: string;
  differenceFromPreviousDraft: string;
  warningCodes: string[];
}

export class ExamDraftRankingService {
  private difficultyOrder = ['recall', 'understanding', 'application', 'analysis', 'evaluation', 'creation'];

  async rankDrafts(
    drafts: ExamDraft[],
    allQuestions: ExamDraftQuestion[][],
  ): Promise<RankedDraftResult[]> {
    const results: RankedDraftResult[] = drafts.map((draft, i) => {
      const questions = allQuestions[i] || [];
      const scores = this.scoreDraft(draft, questions);

      return {
        draft,
        ...scores,
        recommendationReason: scores.recommendationReason,
        safeTeacherSummary: scores.safeTeacherSummary,
        differenceFromPreviousDraft: '',
        warningCodes: scores.warningCodes,
      };
    });

    results.sort((a, b) => b.overallScore - a.overallScore);

    for (let i = 0; i < results.length; i++) {
      if (i > 0) {
        const prev = results[i - 1];
        const diff = this.compareDrafts(results[i].draft, prev.draft);
        results[i].differenceFromPreviousDraft = diff;
      }
    }

    return results;
  }

  scoreDraft(
    draft: ExamDraft,
    questions: ExamDraftQuestion[],
  ): {
    overallScore: number;
    coverageScore: number;
    difficultyBalanceScore: number;
    securityScore: number;
    freshnessScore: number;
    recommendationReason: string;
    safeTeacherSummary: string;
    warningCodes: string[];
  } {
    const warningCodes: string[] = [];
    let coverageScore = 0;
    let difficultyBalanceScore = 0;
    let securityScore = 0;
    let freshnessScore = 0;

    if (draft.questionCount > 0) {
      coverageScore = Math.min(100, (draft.questionCount / Math.max(draft.questionCount, 1)) * 80 + 20);

      const uniqueTypes = new Set(questions.map(q => q.sectionKey || 'default')).size;
      if (uniqueTypes >= 3) difficultyBalanceScore = 80;
      else if (uniqueTypes >= 2) difficultyBalanceScore = 60;
      else difficultyBalanceScore = 40;
    }

    securityScore = 70;
    if (draft.questionCount > 0) {
      const hasAgeWarnings = questions.some(q => {
        const ageDays = (Date.now() - new Date(q.createdAt).getTime()) / (1000 * 60 * 60 * 24);
        return ageDays > 365;
      });
      if (hasAgeWarnings) {
        freshnessScore = 50;
        warningCodes.push('LOW_FRESHNESS');
      } else {
        freshnessScore = 80;
      }
    }

    const overallScore = Math.round(
      coverageScore * 0.35 +
      difficultyBalanceScore * 0.25 +
      securityScore * 0.20 +
      freshnessScore * 0.20,
    );

    const recommendationReason = this.explainDraftRank(
      overallScore, coverageScore, difficultyBalanceScore, securityScore, freshnessScore, warningCodes,
    );

    const safeTeacherSummary =
      `Draft "${draft.draftTitle}" contains ${draft.questionCount} questions totaling ${draft.totalMarks} marks, estimated ${draft.estimatedDurationMinutes} minutes. Coverage: ${coverageScore.toFixed(0)}%, Balance: ${difficultyBalanceScore.toFixed(0)}%, Security: ${securityScore.toFixed(0)}%, Freshness: ${freshnessScore.toFixed(0)}%. Overall: ${overallScore}/100.`;

    return {
      overallScore,
      coverageScore,
      difficultyBalanceScore,
      securityScore,
      freshnessScore,
      recommendationReason,
      safeTeacherSummary,
      warningCodes,
    };
  }

  explainDraftRank(
    overallScore: number,
    coverageScore: number,
    difficultyBalanceScore: number,
    securityScore: number,
    freshnessScore: number,
    warningCodes: string[],
  ): string {
    const parts: string[] = [];

    if (overallScore >= 80) parts.push('Strong draft candidate.');
    else if (overallScore >= 60) parts.push('Adequate draft with room for improvement.');
    else parts.push('Low-scoring draft; consider regenerating.');

    if (coverageScore < 50) parts.push('Coverage is weak.');
    if (difficultyBalanceScore < 50) parts.push('Difficulty balance needs adjustment.');
    if (securityScore < 50) parts.push('Security concerns detected.');
    if (freshnessScore < 50) parts.push('Some questions are aged.');

    if (warningCodes.includes('LOW_FRESHNESS')) parts.push('Contains older questions; verify currency.');

    if (parts.length === 0) parts.push('Draft meets minimum quality thresholds.');

    return parts.join(' ');
  }

  compareDrafts(draftA: ExamDraft, draftB: ExamDraft): string {
    const diffs: string[] = [];
    if (draftA.questionCount !== draftB.questionCount) {
      diffs.push(`${Math.abs(draftA.questionCount - draftB.questionCount)} more/less questions`);
    }
    if (Math.abs(draftA.totalMarks - draftB.totalMarks) > 0) {
      diffs.push(`marks differ by ${Math.abs(draftA.totalMarks - draftB.totalMarks)}`);
    }
    if (Math.abs(draftA.overallScore - draftB.overallScore) >= 5) {
      diffs.push(`overall score differs by ${Math.abs(draftA.overallScore - draftB.overallScore)} points`);
    }
    return diffs.length > 0 ? diffs.join('; ') : 'Similar composition';
  }
}
