import { MarkingBreakdownItem } from '../contracts/markingResultContracts';
import { TeacherReviewItem } from '../contracts/teacherReviewContracts';

const TEACHER_REVIEW_DEFAULT_TYPES = ['essay', 'oral', 'practical', 'structured_working', 'multi_part'];

export class RubricMarkingService {
  canUseRubric(questionType: string, rubricVersionId?: string): boolean {
    if (TEACHER_REVIEW_DEFAULT_TYPES.includes(questionType)) {
      return false;
    }
    return !!rubricVersionId;
  }

  createRubricBreakdown(resultVersionId: string, rubricCriteria: Array<{ key: string; label: string; marksAvailable: number }>, schoolId: string): MarkingBreakdownItem[] {
    const now = new Date().toISOString();
    return rubricCriteria.map(c => ({
      breakdownItemId: crypto.randomUUID(),
      schoolId,
      markingResultVersionId: resultVersionId,
      criterionKey: c.key,
      criterionLabel: c.label,
      marksAwarded: 0,
      marksAvailable: c.marksAvailable,
      confidence: 0,
      decision: 'teacher_required',
      safeReason: 'Awaiting teacher assessment.',
      teacherOnlyNotes: '',
      createdAt: now,
    }));
  }

  async routeRubricToTeacherReview(
    _resultVersionId: string,
    _reasonCode: string,
  ): Promise<TeacherReviewItem> {
    const now = new Date().toISOString();
    return {
      teacherReviewItemId: crypto.randomUUID(),
      schoolId: '',
      teacherReviewGroupId: '',
      markingRunId: '',
      markingResultVersionId: _resultVersionId,
      status: 'open',
      reviewReasonCode: _reasonCode,
      priority: 1,
      safeSummary: 'Rubric-based review required.',
      createdAt: now,
      updatedAt: now,
    };
  }
}
