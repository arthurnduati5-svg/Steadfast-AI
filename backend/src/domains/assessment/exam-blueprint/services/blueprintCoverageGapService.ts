import { ExamBlueprintRequirement, BlueprintCoverageGap } from '../contracts';
import { EligibleQuestion } from './questionPoolEligibilityService';

export class BlueprintCoverageGapService {
  async detectCoverageGaps(
    requirements: ExamBlueprintRequirement[],
    selected: EligibleQuestion[],
    eligible: EligibleQuestion[],
    reasons: string[],
  ): Promise<BlueprintCoverageGap[]> {
    const gaps: BlueprintCoverageGap[] = [];

    for (const req of requirements) {
      if (!req.isMandatory) continue;

      const matchingSelected = selected.filter(q =>
        this.matchesRequirement(q, req),
      );

      if (matchingSelected.length < req.requiredQuestionCount) {
        const matchingEligible = eligible.filter(q =>
          this.matchesRequirement(q, req),
        );
        const shortfall = req.requiredQuestionCount - matchingSelected.length;
        let reasonCode = 'OBJECTIVE_UNDER_COVERED';
        let safeMessage = `Only ${matchingSelected.length}/${req.requiredQuestionCount} questions selected for requirement`;

        if (matchingEligible.length === 0) {
          reasonCode = 'NO_EXAM_ELIGIBLE_QUESTIONS';
          safeMessage = `No exam-eligible questions found for requirement ${req.requirementId}`;
        } else if (matchingEligible.length < req.requiredQuestionCount) {
          reasonCode = 'INSUFFICIENT_POOL';
          safeMessage = `Only ${matchingEligible.length} eligible questions available, need ${req.requiredQuestionCount}`;
        }

        gaps.push({
          reasonCode,
          requirementId: req.requirementId,
          requirementType: req.requirementType,
          subjectId: req.subjectId,
          topicId: req.topicId,
          skillId: req.skillId,
          objectiveId: req.objectiveId,
          questionType: req.questionType,
          requiredCount: req.requiredQuestionCount,
          availableCount: matchingEligible.length,
          gapCount: shortfall,
          safeMessage,
        });
      }
    }

    return gaps;
  }

  async summarizeCoverageGaps(gaps: BlueprintCoverageGap[]): Promise<string> {
    if (gaps.length === 0) return 'No coverage gaps detected.';
    const summaries = gaps.map(g =>
      `[${g.reasonCode}] ${g.safeMessage} (gap: ${g.gapCount})`,
    );
    return summaries.join('; ');
  }

  async explainInsufficientPool(gaps: BlueprintCoverageGap[]): Promise<string[]> {
    const uniqueReasons = new Set(gaps.map(g => g.reasonCode));
    const explanations: string[] = [];
    for (const code of uniqueReasons) {
      switch (code) {
        case 'NO_APPROVED_QUESTIONS':
          explanations.push('No approved questions exist in the question bank for this subject.');
          break;
        case 'NO_EXAM_ELIGIBLE_QUESTIONS':
          explanations.push('Questions exist but are not marked as exam-eligible.');
          break;
        case 'OBJECTIVE_UNDER_COVERED':
          explanations.push('Some objectives have fewer questions selected than required.');
          break;
        case 'DIFFICULTY_BAND_MISSING':
          explanations.push('Required difficulty bands are not represented in the eligible pool.');
          break;
        case 'QUESTION_TYPE_MISSING':
          explanations.push('Required question types are missing from the eligible pool.');
          break;
        case 'SECURITY_CLASS_MISMATCH':
          explanations.push('Question security classes do not match blueprint requirements.');
          break;
        case 'CONTENT_REVIEW_MISSING':
          explanations.push('Required content safety reviews are pending for some eligible questions.');
          break;
        case 'EXPOSURE_HOLD_ACTIVE':
          explanations.push('Some questions are blocked by active exposure holds.');
          break;
        case 'CURRICULUM_VERSION_MISMATCH':
          explanations.push('Question curriculum versions do not match the blueprint.');
          break;
        default:
          explanations.push(`Unknown gap reason: ${code}`);
      }
    }
    return explanations;
  }

  private matchesRequirement(q: EligibleQuestion, req: ExamBlueprintRequirement): boolean {
    if (req.requirementType === 'objective' && req.objectiveId && q.objectiveId !== req.objectiveId) return false;
    if (req.requirementType === 'topic' && req.topicId && q.topicId !== req.topicId) return false;
    if (req.requirementType === 'skill' && req.skillId && q.skillId !== req.skillId) return false;
    if (req.requirementType === 'question_type' && req.questionType && q.questionType !== req.questionType) return false;
    if (req.requirementType === 'difficulty_band') {
      const diffOrder = ['recall', 'understanding', 'application', 'analysis', 'evaluation', 'creation'];
      const qIdx = diffOrder.indexOf(q.difficultyBand);
      const minIdx = diffOrder.indexOf(req.minimumDifficulty);
      const maxIdx = diffOrder.indexOf(req.maximumDifficulty);
      if (minIdx >= 0 && maxIdx >= 0 && (qIdx < minIdx || qIdx > maxIdx)) return false;
    }
    return true;
  }
}
