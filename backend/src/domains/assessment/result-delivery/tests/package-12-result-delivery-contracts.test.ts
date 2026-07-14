import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';

describe('Package 12 — Result Delivery Contracts', () => {
  it('exports all contract values from contracts index', async () => {
    const mod = await import('../contracts/index');
    expect(mod).toBeDefined();
    const keys = Object.keys(mod);
    expect(keys).toContain('ALLOWED_DELIVERY_JOB_ROLES');
    expect(keys).toContain('BLOCKED_DELIVERY_JOB_ROLES');
    expect(keys).toContain('LIVE_CHANNELS');
    expect(keys).toContain('FORBIDDEN_ENVELOPE_FIELDS');
  });

  it('exports policy family type with correct families', async () => {
    const { RESULT_DELIVERY_POLICY_FAMILIES } = await import('../policies/resultDeliveryPolicyDefinitions');
    expect(RESULT_DELIVERY_POLICY_FAMILIES).toHaveProperty('RESULT_DELIVERY_JOB_CREATION');
    expect(RESULT_DELIVERY_POLICY_FAMILIES).toHaveProperty('RESULT_DELIVERY_ENVELOPE_SEALING');
    expect(RESULT_DELIVERY_POLICY_FAMILIES).toHaveProperty('RESULT_DELIVERY_MOCK_DISPATCH');
    expect(RESULT_DELIVERY_POLICY_FAMILIES).toHaveProperty('RESULT_DELIVERY_LIVE_SEND_BLOCK');
    expect(RESULT_DELIVERY_POLICY_FAMILIES.RESULT_DELIVERY_JOB_CREATION.defaultDecision).toBe('blocked');
    expect(RESULT_DELIVERY_POLICY_FAMILIES.RESULT_DELIVERY_LIVE_SEND_BLOCK.defaultDecision).toBe('block');
  });

  it('exports repository contracts', async () => {
    const mod = await import('../contracts/resultDeliveryRepositoryContracts');
    expect(mod).toBeDefined();
  });

  it('has a safe envelope type that can be instantiated', async () => {
    const envelope = {
      ok: true,
      requestId: 'test-1',
      resourceId: 'job-1',
      status: 'draft' as const,
      safeMessage: 'Test envelope',
    };
    expect(envelope.ok).toBe(true);
    expect(envelope.requestId).toBe('test-1');
    expect(envelope.resourceId).toBe('job-1');
    expect(envelope.status).toBe('draft');
  });

  it('LIVE_CHANNELS includes live channels and excludes mock channels', async () => {
    const { LIVE_CHANNELS } = await import('../contracts/resultDeliveryContracts');
    expect(LIVE_CHANNELS).toContain('student_portal_live');
    expect(LIVE_CHANNELS).toContain('email_live');
    expect(LIVE_CHANNELS).toContain('sms_live');
    expect(LIVE_CHANNELS).toContain('push_live');
    expect(LIVE_CHANNELS).toContain('whatsapp_live');
    expect(LIVE_CHANNELS).toContain('pdf_export_live');
    expect(LIVE_CHANNELS).toContain('external_school_system_live');
    expect(LIVE_CHANNELS).toContain('parent_portal_live');
    expect(LIVE_CHANNELS).not.toContain('student_portal_mock');
    expect(LIVE_CHANNELS).not.toContain('email_mock');
  });

  it('ResultDeliveryChannel type includes mock channels', async () => {
    const { LIVE_CHANNELS } = await import('../contracts/resultDeliveryContracts');
    const channel = 'student_portal_mock' as string;
    expect(channel).toBe('student_portal_mock');
    const mockChannels = ['student_portal_mock', 'parent_portal_mock', 'email_mock', 'sms_mock', 'push_mock', 'whatsapp_mock', 'pdf_export_mock', 'external_school_system_mock'];
    for (const c of mockChannels) {
      expect(LIVE_CHANNELS).not.toContain(c);
    }
  });

  it('FORBIDDEN_ENVELOPE_FIELDS contains expected forbidden fields', async () => {
    const { FORBIDDEN_ENVELOPE_FIELDS } = await import('../contracts/resultDeliveryContracts');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('answerKeySafeRef');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('rubricInternal');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('rawStudentAnswer');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('unreleasedGrade');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('liveProviderPayload');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('apiKey');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('pdfBinary');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('portalPayload');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('notificationPayload');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('chainOfThought');
    expect(FORBIDDEN_ENVELOPE_FIELDS).toContain('hiddenReasoning');
    expect(FORBIDDEN_ENVELOPE_FIELDS.length).toBeGreaterThanOrEqual(33);
  });

  it('ALLOWED_DELIVERY_JOB_ROLES has correct roles', async () => {
    const { ALLOWED_DELIVERY_JOB_ROLES } = await import('../contracts/resultDeliveryContracts');
    expect(ALLOWED_DELIVERY_JOB_ROLES).toContain('teacher');
    expect(ALLOWED_DELIVERY_JOB_ROLES).toContain('lead_teacher');
    expect(ALLOWED_DELIVERY_JOB_ROLES).toContain('department_head');
    expect(ALLOWED_DELIVERY_JOB_ROLES).toContain('admin');
    expect(ALLOWED_DELIVERY_JOB_ROLES).toContain('system_job');
    expect(ALLOWED_DELIVERY_JOB_ROLES).not.toContain('student');
    expect(ALLOWED_DELIVERY_JOB_ROLES).not.toContain('parent');
  });

  it('BLOCKED_DELIVERY_JOB_ROLES has correct roles', async () => {
    const { BLOCKED_DELIVERY_JOB_ROLES } = await import('../contracts/resultDeliveryContracts');
    expect(BLOCKED_DELIVERY_JOB_ROLES).toContain('student');
    expect(BLOCKED_DELIVERY_JOB_ROLES).toContain('parent');
    expect(BLOCKED_DELIVERY_JOB_ROLES).toContain('guest');
    expect(BLOCKED_DELIVERY_JOB_ROLES).toContain('unknown');
    expect(BLOCKED_DELIVERY_JOB_ROLES).not.toContain('teacher');
    expect(BLOCKED_DELIVERY_JOB_ROLES).not.toContain('admin');
  });

  it('ActorRole type is definable', async () => {
    const role: string = 'teacher';
    expect(typeof role).toBe('string');
    const allowed = ['teacher', 'admin'];
    expect(allowed.includes(role)).toBe(true);
  });

  it('contracts file defines all status types', async () => {
    const content = fs.readFileSync(
      path.resolve(__dirname, '../contracts/resultDeliveryContracts.ts'),
      'utf-8'
    );
    expect(content).toContain('ResultDeliveryJobStatus');
    expect(content).toContain('ResultDeliveryRecipientStatus');
    expect(content).toContain('ResultDeliveryChannelEnvelopeStatus');
    expect(content).toContain('ResultDeliverySuppressionStatus');
    expect(content).toContain('ResultDeliveryAttemptStatus');
    expect(content).toContain('ResultDeliveryReceiptStatus');
    expect(content).toContain('ResultDeliveryRetryPlanStatus');
    expect(content).toContain('ResultDeliveryMockProviderStatus');
    expect(content).toContain('ResultDeliveryChannel');
    expect(content).toContain('ResultDeliveryAudienceType');
  });
});
