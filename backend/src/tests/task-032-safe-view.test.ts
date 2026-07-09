import { describe, it, expect, beforeEach } from 'vitest';
import { createTask032CanarySafeView, getTask032CanarySafeViewByActivationId } from '../services/task032CanaryViewService';
import { task032ControlledCanaryActivationRepository } from '../repositories/task032ControlledCanaryActivationRepository';
import type { Task032CanarySafeView } from '../contracts/task032ControlledCanaryActivationContracts';

describe('Task 032 - Safe View', () => {
  beforeEach(async () => {
    await task032ControlledCanaryActivationRepository.clearTask032StoresForTests();
  });

  const validInput = {
    activationId: 'act_task032_safe_view_001',
    schoolId: 'school_task032_canary_safe',
    status: 'activated_internal',
    configuredCohortSize: 25,
    safeStage: 'activated_internal',
    healthBudgetStatus: 'passed',
    privacyBoundaryStatus: 'passed',
    rollbackReadinessStatus: 'passed',
    incidentBridgeStatus: 'passed',
    safeToStartTask033: true,
    reasonCodes: ['all_gates_passed', 'safe_to_start_task033'],
    createdAt: new Date().toISOString()
  };

  function createSafeViewInput(overrides: Record<string, unknown> = {}) {
    return { ...validInput, ...overrides };
  }

  it('should create safe view with activationId', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    expect(view.activationId).toBe(validInput.activationId);
    expect(view.viewId).toContain('view_');
  });

  it('should not expose student names', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('studentName');
    expect(json).not.toContain('studentFirstName');
    expect(json).not.toContain('studentLastName');
  });

  it('should not expose student emails', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('studentEmail');
    expect(json).not.toContain('@');
  });

  it('should not expose student phone numbers', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('studentPhone');
    expect(json).not.toContain('phoneNumber');
  });

  it('should not expose raw work or raw chat', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('rawWork');
    expect(json).not.toContain('rawChat');
    expect(json).not.toContain('rawStudentAnswer');
  });

  it('should not expose safeguarding raw notes', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('safeguardingRaw');
    expect(json).not.toContain('safeguardingNote');
  });

  it('should not expose private Deen text', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('privateDeenText');
    expect(json).not.toContain('deenSensitive');
  });

  it('should not expose answer keys', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('answerKey');
    expect(json).not.toContain('answerKeys');
    expect(json).not.toContain('markingScheme');
  });

  it('should not expose teacher notes', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('teacherNotes');
    expect(json).not.toContain('teacherPrivateNote');
    expect(json).not.toContain('teacherOnlyContent');
  });

  it('should not expose AI prompts/responses', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('aiPrompt');
    expect(json).not.toContain('providerResponse');
    expect(json).not.toContain('hiddenReasoning');
  });

  it('should not expose hidden reasoning', async () => {
    const view = await createTask032CanarySafeView(createSafeViewInput());
    const json = JSON.stringify(view);
    expect(json).not.toContain('hiddenReasoning');
    expect(json).not.toContain('chainOfThought');
  });

  it('should return correct view via getTask032CanarySafeViewByActivationId', async () => {
    await createTask032CanarySafeView(createSafeViewInput());
    const found = await getTask032CanarySafeViewByActivationId(validInput.activationId);
    expect(found).not.toBeNull();
    expect(found!.activationId).toBe(validInput.activationId);
    expect(found!.safeToStartTask033).toBe(true);
    expect(found!.schoolId).toBe(validInput.schoolId);
  });

  it('should return null for non-existent activationId', async () => {
    const found = await getTask032CanarySafeViewByActivationId('non_existent_activation');
    expect(found).toBeNull();
  });
});
