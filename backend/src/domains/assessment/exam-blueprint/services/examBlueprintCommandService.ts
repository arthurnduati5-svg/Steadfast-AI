import { randomUUID } from 'crypto';
import { AssessmentCommandEnforcementService } from '../../assessmentCommandEnforcementService';
import { AssessmentCommandContext, AssessmentGovernedCommand } from '../../contracts/assessmentCommandContext';
import { AssessmentPolicyFamily } from '../../contracts/assessmentPolicyContracts';
import {
  ExamBlueprint, ExamBlueprintVersion, ExamBlueprintRequirement,
  BlueprintStatus, BlueprintVersionStatus,
} from '../contracts';
import {
  ExamBlueprintRepository, ExamBlueprintVersionRepository,
  ExamBlueprintRequirementRepository,
} from '../contracts/examBlueprintRepositoryContracts';

const ALLOWED_BLUEPRINT_ROLES = ['teacher', 'lead_teacher', 'department_head', 'admin', 'system_job'];
const ALLOWED_APPROVAL_ROLES = ['lead_teacher', 'department_head', 'admin'];

export interface ExamBlueprintCommandServices {
  enforcementService: AssessmentCommandEnforcementService;
  blueprintRepo: ExamBlueprintRepository;
  blueprintVersionRepo: ExamBlueprintVersionRepository;
  requirementRepo: ExamBlueprintRequirementRepository;
}

export class ExamBlueprintCommandService {
  constructor(private services: ExamBlueprintCommandServices) {}

  async createBlueprint(command: AssessmentGovernedCommand<{
    schoolId: string;
    title: string;
    subjectId: string;
    curriculumVersionId: string;
    gradeBand: string;
    examType: string;
  }>) {
    if (!command.body.schoolId) return { ok: false as const, enforcementResult: null, error: 'SCHOOL_CONTEXT_REQUIRED' };
    if (!ALLOWED_BLUEPRINT_ROLES.includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: actor role not allowed to create blueprints' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    const now = new Date().toISOString();
    const blueprint: ExamBlueprint = {
      blueprintId: randomUUID(),
      schoolId: command.body.schoolId,
      status: 'draft' as BlueprintStatus,
      title: command.body.title,
      subjectId: command.body.subjectId,
      curriculumVersionId: command.body.curriculumVersionId,
      gradeBand: command.body.gradeBand,
      examType: command.body.examType,
      createdByActorId: command.context.actorId,
      createdByRole: command.context.actorRole,
      currentVersionId: null,
      createdAt: now,
      updatedAt: now,
      archivedAt: null,
    };

    const created = await this.services.blueprintRepo.create(blueprint);
    return { ok: true as const, data: created, enforcementResult: enforcement };
  }

  async createBlueprintVersion(command: AssessmentGovernedCommand<{
    blueprintId: string;
    title: string;
    safeDescription: string;
    durationMinutes: number;
    totalMarks: number;
    targetQuestionCount: number;
    difficultyMixJson?: string;
    questionTypeMixJson?: string;
    securityClassRequirement?: string;
    coveragePolicy?: string;
    selectionStrategy?: string;
  }>) {
    if (!ALLOWED_BLUEPRINT_ROLES.includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: actor role not allowed to create blueprint versions' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    if (command.body.durationMinutes <= 0) return { ok: false as const, enforcementResult: enforcement, error: 'VALIDATION_FAILED: durationMinutes must be positive' };
    if (command.body.totalMarks <= 0) return { ok: false as const, enforcementResult: enforcement, error: 'VALIDATION_FAILED: totalMarks must be positive' };
    if (command.body.targetQuestionCount <= 0) return { ok: false as const, enforcementResult: enforcement, error: 'VALIDATION_FAILED: targetQuestionCount must be positive' };

    const existing = await this.services.blueprintRepo.findById(command.body.blueprintId);
    if (!existing) return { ok: false as const, enforcementResult: enforcement, error: 'NOT_FOUND: blueprint not found' };

    const versions = await this.services.blueprintVersionRepo.findByBlueprintId(command.body.blueprintId);
    const versionNumber = versions.length > 0 ? Math.max(...versions.map(v => v.versionNumber)) + 1 : 1;

    const now = new Date().toISOString();
    const blueprintVersion: ExamBlueprintVersion = {
      blueprintVersionId: randomUUID(),
      blueprintId: command.body.blueprintId,
      versionNumber,
      status: 'draft' as BlueprintVersionStatus,
      title: command.body.title,
      safeDescription: command.body.safeDescription,
      durationMinutes: command.body.durationMinutes,
      totalMarks: command.body.totalMarks,
      targetQuestionCount: command.body.targetQuestionCount,
      difficultyMixJson: command.body.difficultyMixJson || '{}',
      questionTypeMixJson: command.body.questionTypeMixJson || '{}',
      securityClassRequirement: command.body.securityClassRequirement || 'practice_safe',
      coveragePolicy: (command.body.coveragePolicy || 'balanced_weighted') as any,
      selectionStrategy: (command.body.selectionStrategy || 'balanced') as any,
      createdByActorId: command.context.actorId,
      createdAt: now,
      approvedAt: null,
      supersededAt: null,
    };

    const created = await this.services.blueprintVersionRepo.create(blueprintVersion);

    await this.services.blueprintRepo.update({
      ...existing,
      currentVersionId: created.blueprintVersionId,
      updatedAt: now,
    });

    return { ok: true as const, data: created, enforcementResult: enforcement };
  }

  async addBlueprintRequirement(command: AssessmentGovernedCommand<{
    blueprintVersionId: string;
    requirementType: string;
    subjectId: string;
    topicId: string;
    skillId: string;
    objectiveId: string;
    requiredQuestionCount: number;
    requiredMarks: number;
    minimumDifficulty?: string;
    maximumDifficulty?: string;
    questionType?: string;
    weight?: number;
    isMandatory?: boolean;
  }>) {
    if (!ALLOWED_BLUEPRINT_ROLES.includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: actor role not allowed to add requirements' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    if (!['objective', 'skill', 'topic', 'section', 'question_type', 'difficulty_band', 'security'].includes(command.body.requirementType)) {
      return { ok: false as const, enforcementResult: enforcement, error: 'VALIDATION_FAILED: invalid requirementType' };
    }

    const version = await this.services.blueprintVersionRepo.findById(command.body.blueprintVersionId);
    if (!version) return { ok: false as const, enforcementResult: enforcement, error: 'NOT_FOUND: blueprint version not found' };
    if (version.status === 'approved') return { ok: false as const, enforcementResult: enforcement, error: 'FORBIDDEN_FIELD: cannot modify approved version' };

    const now = new Date().toISOString();
    const requirement: ExamBlueprintRequirement = {
      requirementId: randomUUID(),
      blueprintVersionId: command.body.blueprintVersionId,
      schoolId: command.context.schoolId,
      requirementType: command.body.requirementType as any,
      subjectId: command.body.subjectId,
      topicId: command.body.topicId,
      skillId: command.body.skillId,
      objectiveId: command.body.objectiveId,
      requiredQuestionCount: command.body.requiredQuestionCount,
      requiredMarks: command.body.requiredMarks,
      minimumDifficulty: command.body.minimumDifficulty || 'recall',
      maximumDifficulty: command.body.maximumDifficulty || 'creation',
      questionType: command.body.questionType || 'multiple_choice',
      weight: command.body.weight ?? 1,
      isMandatory: command.body.isMandatory ?? true,
      createdAt: now,
    };

    const created = await this.services.requirementRepo.create(requirement);
    return { ok: true as const, data: created, enforcementResult: enforcement };
  }

  async submitBlueprintVersionForApproval(command: AssessmentGovernedCommand<{
    blueprintVersionId: string;
  }>) {
    if (!ALLOWED_BLUEPRINT_ROLES.includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: actor role not allowed to submit for approval' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    const version = await this.services.blueprintVersionRepo.findById(command.body.blueprintVersionId);
    if (!version) return { ok: false as const, enforcementResult: enforcement, error: 'NOT_FOUND: blueprint version not found' };
    if (version.status !== 'draft') return { ok: false as const, enforcementResult: enforcement, error: 'INVALID_STATE: only draft versions can be submitted for approval' };

    const updated = await this.services.blueprintVersionRepo.update({
      ...version,
      status: 'pending_approval' as BlueprintVersionStatus,
    });

    return { ok: true as const, data: updated, enforcementResult: enforcement };
  }

  async approveBlueprintVersion(command: AssessmentGovernedCommand<{
    blueprintVersionId: string;
  }>) {
    if (!ALLOWED_APPROVAL_ROLES.includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: actor role not allowed to approve' };
    if (['student', 'parent'].includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: student/parent cannot approve blueprint version' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_APPROVAL' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    const version = await this.services.blueprintVersionRepo.findById(command.body.blueprintVersionId);
    if (!version) return { ok: false as const, enforcementResult: enforcement, error: 'NOT_FOUND: blueprint version not found' };
    if (version.status !== 'pending_approval') return { ok: false as const, enforcementResult: enforcement, error: 'INVALID_STATE: only pending_approval versions can be approved' };

    const now = new Date().toISOString();
    const approved = await this.services.blueprintVersionRepo.update({
      ...version,
      status: 'approved' as BlueprintVersionStatus,
      approvedAt: now,
    });

    const blueprint = await this.services.blueprintRepo.findById(version.blueprintId);
    if (blueprint) {
      await this.services.blueprintRepo.update({
        ...blueprint,
        status: 'active',
        updatedAt: now,
      });
    }

    return { ok: true as const, data: approved, enforcementResult: enforcement };
  }

  async archiveBlueprint(command: AssessmentGovernedCommand<{
    blueprintId: string;
  }>) {
    if (!['admin', 'department_head'].includes(command.context.actorRole)) return { ok: false as const, enforcementResult: null, error: 'POLICY_BLOCKED: only admin/department_head can archive blueprints' };

    const enforcement = await this.services.enforcementService.enforceGovernedCommand(command, {
      requiredPolicies: ['EXAM_BLUEPRINT_CREATION' as AssessmentPolicyFamily],
    });
    if (!enforcement.ok) return { ok: false as const, enforcementResult: enforcement, error: enforcement.safeMessage };

    const blueprint = await this.services.blueprintRepo.findById(command.body.blueprintId);
    if (!blueprint) return { ok: false as const, enforcementResult: enforcement, error: 'NOT_FOUND: blueprint not found' };

    const now = new Date().toISOString();
    const updated = await this.services.blueprintRepo.update({
      ...blueprint,
      status: 'archived' as BlueprintStatus,
      archivedAt: now,
      updatedAt: now,
    });

    return { ok: true as const, data: updated, enforcementResult: enforcement };
  }
}
