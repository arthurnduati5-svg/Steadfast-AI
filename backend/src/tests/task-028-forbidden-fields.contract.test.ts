import { describe, it, expect } from 'vitest';
import { TASK028_FORBIDDEN_FIELDS } from '../contracts/task028ControlledExpansionExecutionContracts';
import { rejectTask028ForbiddenFields } from '../lib/task028ControlledExpansionExecutionValidation';

describe('Task 028 Forbidden Fields Contract', () => {
  it('should reject rawStudentData', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawStudentData: 'some value' }, errors);
    expect(errors).toContain('forbidden_field_rawStudentData');
  });

  it('should reject rawLearnerData', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawLearnerData: 'some value' }, errors);
    expect(errors).toContain('forbidden_field_rawLearnerData');
  });

  it('should reject parentEmail', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ parentEmail: 'test@test.com' }, errors);
    expect(errors).toContain('forbidden_field_parentEmail');
  });

  it('should reject answerKey', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ answerKey: 'answer' }, errors);
    expect(errors).toContain('forbidden_field_answerKey');
  });

  it('should reject chainOfThought', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ chainOfThought: 'thinking steps' }, errors);
    expect(errors).toContain('forbidden_field_chainOfThought');
  });

  it('should reject rawSsoToken', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawSsoToken: 'token' }, errors);
    expect(errors).toContain('forbidden_field_rawSsoToken');
  });

  it('should reject DATABASE_URL', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ DATABASE_URL: 'postgres://...' }, errors);
    expect(errors).toContain('forbidden_field_DATABASE_URL');
  });

  it('should reject providerPrompt', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ providerPrompt: 'prompt' }, errors);
    expect(errors).toContain('forbidden_field_providerPrompt');
  });

  it('should reject teacherOnlyContent', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ teacherOnlyContent: 'private' }, errors);
    expect(errors).toContain('forbidden_field_teacherOnlyContent');
  });

  it('should reject authorization header', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ authorization: 'Bearer token' }, errors);
    expect(errors).toContain('forbidden_field_authorization');
  });

  it('should reject rawChat', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ rawChat: 'chat content' }, errors);
    expect(errors).toContain('forbidden_field_rawChat');
  });

  it('should reject productionDeploymentCommand', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ productionDeploymentCommand: 'deploy' }, errors);
    expect(errors).toContain('forbidden_field_productionDeploymentCommand');
  });

  it('should reject liveAiProviderPayload', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ liveAiProviderPayload: 'payload' }, errors);
    expect(errors).toContain('forbidden_field_liveAiProviderPayload');
  });

  it('should reject schoolWideActivationPayload', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({ schoolWideActivationPayload: 'payload' }, errors);
    expect(errors).toContain('forbidden_field_schoolWideActivationPayload');
  });

  it('should reject all fields listed in the constant', () => {
    const errors: string[] = [];
    const obj: Record<string, string> = {};
    for (const field of TASK028_FORBIDDEN_FIELDS) {
      obj[field] = 'test';
    }
    rejectTask028ForbiddenFields(obj, errors);
    expect(errors.length).toBe(TASK028_FORBIDDEN_FIELDS.length);
  });

  it('should not reject safe fields', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({
      safeSummary: 'safe',
      schoolId: 'school-1',
      runId: 'run-1',
      actorRole: 'admin',
      reasonCodes: [],
    }, errors);
    expect(errors).toEqual([]);
  });

  it('should not reject empty objects', () => {
    const errors: string[] = [];
    rejectTask028ForbiddenFields({}, errors);
    expect(errors).toEqual([]);
  });
});
