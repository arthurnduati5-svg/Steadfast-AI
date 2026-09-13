import type {
  Task022CambridgeAcademicContentDecision,
  Task022SourceType,
  Task022SourceApprovalStatus,
  CurriculumFamily,
} from '../contracts/task022CurriculumGovernanceContracts';

export class CambridgeAcademicContentPolicyService {
  decideCambridgeContentUse(request: {
    curriculumFamily: string;
    subject?: string;
    topic?: string;
    sourceType: string;
    learnerFacing: boolean;
  }): Task022CambridgeAcademicContentDecision {
    const reasons: string[] = [];

    if (!this.requiresCambridgeApprovedSource(request.curriculumFamily, request.sourceType)) {
      reasons.push('cambridge-approved-source-not-required');
      return this.buildCambridgeAcademicContentDecision({
        subject: request.subject,
        topic: request.topic,
        learnerFacing: request.learnerFacing,
        decision: 'allow',
        safeContentContext: 'Cambridge curriculum content does not require an approved source for this type.',
        approvedSourceIds: [],
        reasonCodes: reasons,
      });
    }

    if (this.blockCambridgeMarkSchemeLearnerExposure(request.sourceType, request.learnerFacing)) {
      reasons.push('cambridge-mark-scheme-learner-exposure-blocked');
      return this.buildCambridgeAcademicContentDecision({
        subject: request.subject,
        topic: request.topic,
        learnerFacing: request.learnerFacing,
        decision: 'deny',
        gapReason: 'Mark schemes and answer keys are not available for learner-facing routes.',
        approvedSourceIds: [],
        reasonCodes: reasons,
      });
    }

    if (this.blockUnsupportedCambridgeClaim(request.sourceType, request.curriculumFamily)) {
      reasons.push('unsupported-cambridge-claim-blocked');
      return this.buildCambridgeAcademicContentDecision({
        subject: request.subject,
        topic: request.topic,
        learnerFacing: request.learnerFacing,
        decision: 'deny',
        gapReason: 'Unsupported Cambridge syllabus claims cannot be used without an approved source.',
        approvedSourceIds: [],
        reasonCodes: reasons,
      });
    }

    if (!this.canUseCambridgeSyllabusRef(request.sourceType, 'approved')) {
      reasons.push('cambridge-syllabus-ref-not-approved');
    }

    if (!this.canUseCambridgeTextbookRef(request.sourceType, 'approved')) {
      reasons.push('cambridge-textbook-ref-not-approved');
    }

    if (!this.canUseCambridgePastPaperRef(request.sourceType, 'approved', request.learnerFacing)) {
      reasons.push('cambridge-past-paper-ref-not-available');
    }

    reasons.push('cambridge-content-allowed-with-approved-source');
    return this.buildCambridgeAcademicContentDecision({
      subject: request.subject,
      topic: request.topic,
      learnerFacing: request.learnerFacing,
      decision: 'allow',
      safeContentContext: 'Cambridge content approved with appropriate source references.',
      approvedSourceIds: [],
      reasonCodes: reasons,
    });
  }

  requiresCambridgeApprovedSource(curriculumFamily: string, sourceType: string): boolean {
    if (curriculumFamily !== 'cambridge_academic') {
      return false;
    }
    const cambridgeRequiringTypes = [
      'curriculum_specification',
      'teacher_note',
      'school_approved_material',
      'exercise_bank',
      'rubric',
      'lesson_plan',
      'external_link_reference',
    ];
    return cambridgeRequiringTypes.includes(sourceType);
  }

  canUseCambridgeSyllabusRef(sourceType: string, approvalStatus: string): boolean {
    if (sourceType !== 'curriculum_specification') {
      return false;
    }
    return approvalStatus === 'approved';
  }

  canUseCambridgeTextbookRef(sourceType: string, approvalStatus: string): boolean {
    if (sourceType !== 'school_approved_material') {
      return false;
    }
    return approvalStatus === 'approved';
  }

  canUseCambridgePastPaperRef(sourceType: string, approvalStatus: string, learnerFacing: boolean): boolean {
    if (sourceType !== 'exercise_bank') {
      return false;
    }
    if (approvalStatus !== 'approved') {
      return false;
    }
    return learnerFacing === true;
  }

  blockCambridgeMarkSchemeLearnerExposure(sourceType: string, learnerFacing: boolean): boolean {
    const markSchemeTypes = ['rubric', 'teacher_note'];
    if (!markSchemeTypes.includes(sourceType)) {
      return false;
    }
    return learnerFacing === true;
  }

  blockUnsupportedCambridgeClaim(sourceType: string, curriculumFamily: string): boolean {
    if (curriculumFamily !== 'cambridge_academic') {
      return false;
    }
    const unsupportedTypes = ['external_link_reference', 'teacher_note'];
    return unsupportedTypes.includes(sourceType);
  }

  buildCambridgeAcademicContentDecision(params: {
    subject?: string;
    topic?: string;
    learnerFacing: boolean;
    decision: string;
    safeContentContext?: string;
    approvedSourceIds?: string[];
    learningObjectiveIds?: string[];
    gapReason?: string;
    reasonCodes: string[];
  }): Task022CambridgeAcademicContentDecision {
    return {
      id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      subject: params.subject,
      topic: params.topic,
      learnerFacing: params.learnerFacing,
      decision: params.decision,
      safeContentContext: params.safeContentContext,
      approvedSourceIds: params.approvedSourceIds,
      learningObjectiveIds: params.learningObjectiveIds,
      gapReason: params.gapReason,
      reasonCodes: params.reasonCodes,
      createdAt: new Date().toISOString(),
    };
  }
}

export const cambridgeAcademicContentPolicyService = new CambridgeAcademicContentPolicyService();
