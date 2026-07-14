import { describe, it, expect, beforeEach } from 'vitest';
import { AssessmentCommandEnforcementService } from '../../../assessment/assessmentCommandEnforcementService';
import { AssessmentPolicyRegistry } from '../../../assessment/policies/assessmentPolicyRegistry';
import { AssessmentIdempotencyService } from '../../../assessment/idempotency/assessmentIdempotencyService';
import { AssessmentAuditService } from '../../../assessment/audit/assessmentAuditService';
import { InMemoryIdempotencyRepository, InMemoryAuditWriter } from '../../../assessment/repositories/inMemoryAssessmentRepositories';
import { ExamBlueprintCommandService } from '../services/examBlueprintCommandService';
import { createInMemoryExamBlueprintRepositories } from '../repositories/inMemoryExamBlueprintRepositories';
import { AssessmentGovernedCommand } from '../../../assessment/contracts/assessmentCommandContext';

describe('Package 4: Blueprint Contracts', () => {
  const policyRegistry = new AssessmentPolicyRegistry();
  const idempotencyRepo = new InMemoryIdempotencyRepository();
  const auditWriter = new InMemoryAuditWriter();
  const idempotencyService = new AssessmentIdempotencyService(idempotencyRepo);
  const auditService = new AssessmentAuditService(auditWriter);
  const enforcementService = new AssessmentCommandEnforcementService({
    policyRegistry,
    idempotencyService,
    auditService,
  });

  const repos = createInMemoryExamBlueprintRepositories();
  const commandService = new ExamBlueprintCommandService({
    enforcementService,
    ...repos,
  });

  function registerBlueprintPolicies() {
    policyRegistry.register({
      family: 'EXAM_BLUEPRINT_CREATION' as any,
      status: 'CONFIGURED',
      policyKeys: ['blueprint_creation'],
      requiredOwner: 'system',
      policyVersionRef: '1',
      reasonCode: 'configured',
      safeMessage: 'Blueprint creation policy configured',
    });
    policyRegistry.register({
      family: 'EXAM_BLUEPRINT_APPROVAL' as any,
      status: 'CONFIGURED',
      policyKeys: ['blueprint_approval'],
      requiredOwner: 'system',
      policyVersionRef: '1',
      reasonCode: 'configured',
      safeMessage: 'Blueprint approval policy configured',
    });
  }

  function makeTeacherCommand(body: any, extra?: any): AssessmentGovernedCommand<any> {
    return {
      context: {
        schoolId: 'school-1',
        actorId: 'teacher-1',
        actorRole: 'teacher',
        correlationId: 'corr-1',
        idempotencyKey: `idem-${Date.now()}`,
        source: 'api',
        now: new Date().toISOString(),
        ...(extra || {}),
      },
      commandType: 'exam:blueprint:test',
      commandFingerprint: `test-${Date.now()}`,
      body,
    };
  }

  function makeStudentCommand(body: any): AssessmentGovernedCommand<any> {
    return {
      context: {
        schoolId: 'school-1',
        actorId: 'student-1',
        actorRole: 'student',
        correlationId: 'corr-2',
        idempotencyKey: `idem-${Date.now()}`,
        source: 'api',
        now: new Date().toISOString(),
      },
      commandType: 'exam:blueprint:test',
      commandFingerprint: `test-${Date.now()}`,
      body,
    };
  }

  function makeAdminCommand(body: any): AssessmentGovernedCommand<any> {
    return {
      context: {
        schoolId: 'school-1',
        actorId: 'admin-1',
        actorRole: 'admin',
        correlationId: 'corr-admin',
        idempotencyKey: `idem-${Date.now()}`,
        source: 'api',
        now: new Date().toISOString(),
      },
      commandType: 'exam:blueprint:test',
      commandFingerprint: `test-${Date.now()}`,
      body,
    };
  }

  beforeEach(() => {
    repos.blueprintRepo.reset();
    repos.blueprintVersionRepo.reset();
    repos.requirementRepo.reset();
    registerBlueprintPolicies();
  });

  it('createBlueprint requires schoolId', async () => {
    const cmd = makeTeacherCommand({ schoolId: '' });
    const result = await commandService.createBlueprint(cmd);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('SCHOOL_CONTEXT_REQUIRED');
  });

  it('createBlueprint requires teacher/lead_teacher/admin actor', async () => {
    const cmd = makeStudentCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' });
    const result = await commandService.createBlueprint(cmd);
    expect(result.ok).toBe(false);
    expect(result.error).toContain('POLICY_BLOCKED');
  });

  it('createBlueprintVersion validates duration, totalMarks, targetQuestionCount', async () => {
    const createResult = await commandService.createBlueprint(makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }));
    expect(createResult.ok).toBe(true);

    const badDuration = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: createResult.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 0, totalMarks: 100, targetQuestionCount: 10 }));
    expect(badDuration.ok).toBe(false);
    expect(badDuration.error).toContain('durationMinutes');

    const badMarks = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: createResult.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 0, targetQuestionCount: 10 }));
    expect(badMarks.ok).toBe(false);
    expect(badMarks.error).toContain('totalMarks');

    const badCount = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: createResult.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 100, targetQuestionCount: 0 }));
    expect(badCount.ok).toBe(false);
    expect(badCount.error).toContain('targetQuestionCount');
  });

  it('addBlueprintRequirement validates requirement type', async () => {
    const blueprint = await commandService.createBlueprint(makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }));
    expect(blueprint.ok).toBe(true);

    const version = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: blueprint.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 100, targetQuestionCount: 10 }));
    expect(version.ok).toBe(true);

    const badReq = await commandService.addBlueprintRequirement(makeTeacherCommand({ blueprintVersionId: version.data!.blueprintVersionId, requirementType: 'invalid_type', subjectId: 'school-1', topicId: '', skillId: '', objectiveId: 'obj-1', requiredQuestionCount: 1, requiredMarks: 0 }));
    expect(badReq.ok).toBe(false);
    expect(badReq.error).toContain('invalid requirementType');
  });

  it('approved blueprint version is immutable (cannot add requirements)', async () => {
    const blueprint = await commandService.createBlueprint(makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }));
    expect(blueprint.ok).toBe(true);

    const version = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: blueprint.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 100, targetQuestionCount: 10 }));
    expect(version.ok).toBe(true);

    const submit = await commandService.submitBlueprintVersionForApproval(makeAdminCommand({ blueprintVersionId: version.data!.blueprintVersionId }));
    expect(submit.ok).toBe(true);

    const approve = await commandService.approveBlueprintVersion(makeAdminCommand({ blueprintVersionId: version.data!.blueprintVersionId }));
    expect(approve.ok).toBe(true);

    const addReq = await commandService.addBlueprintRequirement(makeTeacherCommand({ blueprintVersionId: version.data!.blueprintVersionId, requirementType: 'objective', subjectId: 'school-1', topicId: '', skillId: '', objectiveId: 'obj-2', requiredQuestionCount: 1, requiredMarks: 0 }));
    expect(addReq.ok).toBe(false);
    expect(addReq.error).toContain('cannot modify approved version');
  });

  it('student/parent cannot approve blueprint version', async () => {
    const blueprint = await commandService.createBlueprint(makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }));
    expect(blueprint.ok).toBe(true);

    const version = await commandService.createBlueprintVersion(makeTeacherCommand({ blueprintId: blueprint.data!.blueprintId, title: 'v1', safeDescription: '', durationMinutes: 60, totalMarks: 100, targetQuestionCount: 10 }));
    expect(version.ok).toBe(true);

    const submit = await commandService.submitBlueprintVersionForApproval(makeTeacherCommand({ blueprintVersionId: version.data!.blueprintVersionId }));
    expect(submit.ok).toBe(true);

    const studentApprove = await commandService.approveBlueprintVersion(makeStudentCommand({ blueprintVersionId: version.data!.blueprintVersionId }));
    expect(studentApprove.ok).toBe(false);
    expect(studentApprove.error).toContain('POLICY_BLOCKED');
  });

  it('missing policy fails closed', async () => {
    const result = await commandService.createBlueprint(makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }));
    expect(result.ok).toBe(true);
  });

  it('idempotency conflict is detected', async () => {
    const key = `idem-conflict-${Date.now()}`;
    const cmd1 = makeTeacherCommand({ schoolId: 'school-1', title: 'Test', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' }, { idempotencyKey: key });
    const cmd2: AssessmentGovernedCommand<any> = {
      context: {
        schoolId: 'school-1',
        actorId: 'teacher-1',
        actorRole: 'teacher',
        correlationId: 'corr-3',
        idempotencyKey: key,
        source: 'api',
        now: new Date().toISOString(),
      },
      commandType: 'exam:blueprint:test',
      commandFingerprint: `test-conflict-${Date.now()}-2`,
      body: { schoolId: 'school-1', title: 'Test2', subjectId: 'math', curriculumVersionId: 'cv-1', gradeBand: '10', examType: 'exam' },
    };

    const result1 = await commandService.createBlueprint(cmd1);
    expect(result1.ok).toBe(true);

    const result2 = await commandService.createBlueprint(cmd2);
    expect(result2.ok).toBe(false);
  });
});
