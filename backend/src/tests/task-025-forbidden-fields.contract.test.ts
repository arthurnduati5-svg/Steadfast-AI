import { describe, it, expect } from 'vitest';
import { rejectTask025ForbiddenFields, createSafeTask025ValidationError } from '../lib/task025ControlledPilotReadinessValidation';
import { TASK025_FORBIDDEN_FIELDS } from '../contracts/task025ControlledPilotReadinessContracts';

describe('TASK025_FORBIDDEN_FIELDS contract enforcement', () => {
  describe('rejectTask025ForbiddenFields — clean objects pass', () => {
    it('returns null for a clean flat object', () => {
      const result = rejectTask025ForbiddenFields({
        schoolId: 's1',
        pilotPurpose: 'evaluate ai tutor',
        cohortSize: 25,
      });
      expect(result).toBeNull();
    });

    it('returns null for an empty object', () => {
      expect(rejectTask025ForbiddenFields({})).toBeNull();
    });

    it('returns null for a clean object with nested safe fields', () => {
      const result = rejectTask025ForbiddenFields({
        schoolId: 's1',
        meta: {
          scopeStatus: 'scope_defined',
          riskLevel: 'low',
        },
        items: [
          { name: 'teacher_a', validated: true },
          { name: 'teacher_b', validated: false },
        ],
      });
      expect(result).toBeNull();
    });
  });

  describe('rejectTask025ForbiddenFields — top-level field detection', () => {
    const categories: { label: string; field: string }[] = [
      { label: 'raw student data', field: 'rawStudentData' },
      { label: 'raw learner data', field: 'rawLearnerData' },
      { label: 'raw parent data', field: 'rawParentData' },
      { label: 'raw teacher data', field: 'rawTeacherData' },
      { label: 'raw safeguarding note', field: 'rawSafeguardingNote' },
      { label: 'raw safeguarding case', field: 'rawSafeguardingCase' },
      { label: 'safeguarding raw', field: 'safeguardingRaw' },
      { label: 'private deen text', field: 'privateDeenText' },
      { label: 'deen sensitive raw', field: 'deenSensitiveRaw' },
      { label: 'raw chat', field: 'rawChat' },
      { label: 'raw message', field: 'rawMessage' },
      { label: 'raw student answer', field: 'rawStudentAnswer' },
      { label: 'raw student work', field: 'rawStudentWork' },
      { label: 'answer key', field: 'answerKey' },
      { label: 'correct answer', field: 'correctAnswer' },
      { label: 'model answer', field: 'modelAnswer' },
      { label: 'marking scheme', field: 'markingScheme' },
      { label: 'teacher only content', field: 'teacherOnlyContent' },
      { label: 'teacher only note', field: 'teacherOnlyNote' },
      { label: 'provider prompt', field: 'providerPrompt' },
      { label: 'provider response', field: 'providerResponse' },
      { label: 'raw provider response', field: 'rawProviderResponse' },
      { label: 'chain of thought', field: 'chainOfThought' },
      { label: 'hidden reasoning', field: 'hiddenReasoning' },
      { label: 'scratchpad', field: 'scratchpad' },
      { label: 'raw notification payload', field: 'rawNotificationPayload' },
      { label: 'raw email body', field: 'rawEmailBody' },
      { label: 'raw sms body', field: 'rawSmsBody' },
      { label: 'parent phone', field: 'parentPhone' },
      { label: 'parent email', field: 'parentEmail' },
      { label: 'student phone', field: 'studentPhone' },
      { label: 'student email', field: 'studentEmail' },
      { label: 'live pilot activation', field: 'livePilotActivation' },
      { label: 'live invitation send', field: 'liveInvitationSend' },
    ];

    categories.forEach(({ label, field }) => {
      it(`detects forbidden field "${field}" (${label}) at top level`, () => {
        const result = rejectTask025ForbiddenFields({ schoolId: 's1', [field]: 'leaked' });
        expect(result).not.toBeNull();
        if (result) {
          expect(result.code).toBe('FORBIDDEN_FIELD');
          expect(result.safeMessage).toContain(field);
          expect(result.reasonCodes).toContain('forbidden_field');
          expect(result.reasonCodes).toContain(`field:${field}`);
        }
      });
    });
  });

  describe('rejectTask025ForbiddenFields — null and undefined values', () => {
    it('detects forbidden field set to null', () => {
      const result = rejectTask025ForbiddenFields({ schoolId: 's1', rawStudentData: null });
      expect(result).not.toBeNull();
    });

    it('detects forbidden field set to undefined', () => {
      const result = rejectTask025ForbiddenFields({ schoolId: 's1', rawStudentData: undefined });
      expect(result).not.toBeNull();
    });

    it('detects forbidden field set to empty string', () => {
      const result = rejectTask025ForbiddenFields({ schoolId: 's1', rawStudentData: '' });
      expect(result).not.toBeNull();
    });

    it('detects forbidden field set to zero', () => {
      const result = rejectTask025ForbiddenFields({ schoolId: 's1', rawStudentData: 0 });
      expect(result).not.toBeNull();
    });
  });

  describe('rejectTask025ForbiddenFields — nested object detection', () => {
    it('detects forbidden field one level deep', () => {
      const result = rejectTask025ForbiddenFields({
        meta: { hiddenReasoning: 'hidden' },
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.code).toBe('FORBIDDEN_FIELD');
        expect(result.reasonCodes).toContain('field:hiddenReasoning');
      }
    });

    it('detects forbidden field three levels deep', () => {
      const result = rejectTask025ForbiddenFields({
        level1: {
          level2: {
            answerKey: 'secret',
          },
        },
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.reasonCodes).toContain('field:answerKey');
      }
    });

    it('detects first forbidden field in object with multiple forbidden fields', () => {
      const result = rejectTask025ForbiddenFields({
        rawSafeguardingNote: 'note',
        parentPhone: '123',
        chainOfThought: 'think',
      });
      expect(result).not.toBeNull();
    });
  });

  describe('rejectTask025ForbiddenFields — array element detection', () => {
    it('detects forbidden field in array of objects', () => {
      const result = rejectTask025ForbiddenFields({
        items: [
          { name: 'item1', rawStudentAnswer: 'leaked' },
        ],
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.code).toBe('FORBIDDEN_FIELD');
        expect(result.reasonCodes).toContain('field:rawStudentAnswer');
      }
    });

    it('detects forbidden field in later array element', () => {
      const result = rejectTask025ForbiddenFields({
        items: [
          { name: 'safe' },
          { teacherOnlyContent: 'restricted' },
        ],
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.reasonCodes).toContain('field:teacherOnlyContent');
      }
    });

    it('detects forbidden field in nested object inside array element', () => {
      const result = rejectTask025ForbiddenFields({
        entries: [
          {
            id: 1,
            details: { providerPrompt: 'internal' },
          },
        ],
      });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.reasonCodes).toContain('field:providerPrompt');
      }
    });
  });

  describe('rejectTask025ForbiddenFields — error shape', () => {
    it('returns a Task025ValidationError with expected shape', () => {
      const result = rejectTask025ForbiddenFields({ rawChat: 'hello' });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.valid).toBe(false);
        expect(result.code).toBe('FORBIDDEN_FIELD');
        expect(typeof result.safeMessage).toBe('string');
        expect(Array.isArray(result.reasonCodes)).toBe(true);
        expect(result.reasonCodes.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('safeMessage describes which field was forbidden', () => {
      const result = rejectTask025ForbiddenFields({ parentEmail: 'p@example.com' });
      expect(result).not.toBeNull();
      if (result) {
        expect(result.safeMessage).toContain('parentEmail');
        expect(result.safeMessage).toContain('forbidden');
      }
    });
  });

  describe('route-level integration pattern', () => {
    it('scope/evaluate route would reject body with forbidden fields', () => {
      const body = {
        schoolId: 's1',
        pilotPurpose: 'test',
        cohortSize: 25,
        pilotDurationWeeks: 12,
        adminOwner: 'a',
        supportOwner: 's',
        monitoringOwner: 'm',
        pauseOwner: 'p',
        rollbackOwner: 'r',
        rawLearnerData: 'should not be here',
      };
      const forbiddenCheck = rejectTask025ForbiddenFields(body);
      expect(forbiddenCheck).not.toBeNull();
      if (forbiddenCheck) {
        expect(forbiddenCheck.code).toBe('FORBIDDEN_FIELD');
        expect(forbiddenCheck.reasonCodes).toContain('field:rawLearnerData');
      }
    });

    it('cohorts/candidates route would reject body with forbidden fields', () => {
      const body = {
        schoolId: 's1',
        cohortId: 'c1',
        cohortSize: 20,
        teacherOwner: 't',
        supportOwner: 's',
        rawSafeguardingCase: 'leaked',
      };
      const forbiddenCheck = rejectTask025ForbiddenFields(body);
      expect(forbiddenCheck).not.toBeNull();
      if (forbiddenCheck) {
        expect(forbiddenCheck.reasonCodes).toContain('field:rawSafeguardingCase');
      }
    });

    it('stakeholders/readiness route would reject body with nested forbidden fields', () => {
      const body = {
        schoolId: 's1',
        teacherIds: ['t1'],
        adminIds: ['a1'],
        safeguardingOwnerId: 'so',
        metadata: { privateDeenText: 'sensitive' },
      };
      const forbiddenCheck = rejectTask025ForbiddenFields(body);
      expect(forbiddenCheck).not.toBeNull();
      if (forbiddenCheck) {
        expect(forbiddenCheck.reasonCodes).toContain('field:privateDeenText');
      }
    });

    it('decision/evaluate route would reject body with array-of-objects forbidden fields', () => {
      const body = {
        scopeGatePassed: true,
        cohortReadinessPassed: true,
        teacherWorkflowPassed: true,
        adminAcceptancePassed: true,
        parentCommunicationPassed: true,
        supportingData: [
          { note: 'safe' },
          { modelAnswer: 'exposed' },
        ],
      };
      const forbiddenCheck = rejectTask025ForbiddenFields(body);
      expect(forbiddenCheck).not.toBeNull();
      if (forbiddenCheck) {
        expect(forbiddenCheck.reasonCodes).toContain('field:modelAnswer');
      }
    });
  });

  describe('TASK025_FORBIDDEN_FIELDS constant completeness', () => {
    it('contains all expected categories of forbidden fields', () => {
      const allForbidden = new Set(TASK025_FORBIDDEN_FIELDS);
      const expectedCategories = [
        'rawStudentData', 'rawLearnerData', 'rawParentData', 'rawTeacherData',
        'rawSafeguardingNote', 'rawSafeguardingCase', 'safeguardingRaw',
        'privateDeenText', 'deenSensitiveRaw',
        'rawChat', 'rawMessage', 'rawStudentAnswer', 'rawStudentWork',
        'answerKey', 'correctAnswer', 'modelAnswer', 'markingScheme',
        'teacherOnlyContent', 'teacherOnlyNote',
        'providerPrompt', 'providerResponse', 'rawProviderResponse',
        'chainOfThought', 'hiddenReasoning', 'scratchpad',
        'rawNotificationPayload', 'rawEmailBody', 'rawSmsBody',
        'parentPhone', 'parentEmail', 'studentPhone', 'studentEmail',
        'livePilotActivation', 'liveInvitationSend',
      ];
      for (const field of expectedCategories) {
        expect(allForbidden.has(field)).toBe(true);
      }
      expect(TASK025_FORBIDDEN_FIELDS.length).toBe(34);
    });
  });
});
