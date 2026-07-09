import { describe, it, expect } from 'vitest';
import { executeTask032ControlAction } from '../services/task032CanaryControlActionService';

describe('Task 032 - Control Actions', () => {
  it('should allow admin to pause canary', async () => {
    const result = await executeTask032ControlAction({
      action: 'pause_canary',
      currentState: 'active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: 'scheduled_pause',
    });
    expect(result.ok).toBe(true);
    expect(result.nextState).toBe('paused');
    expect(result.runtimeAccessBlocked).toBe(true);
  });

  it('should allow admin to enable kill switch', async () => {
    const result = await executeTask032ControlAction({
      action: 'enable_kill_switch',
      currentState: 'active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: 'emergency_stop',
    });
    expect(result.ok).toBe(true);
    expect(result.nextState).toBe('kill_switch_active');
    expect(result.runtimeAccessBlocked).toBe(true);
  });

  it('should allow admin to start rollback', async () => {
    const result = await executeTask032ControlAction({
      action: 'start_rollback',
      currentState: 'active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: 'issues_found',
    });
    expect(result.ok).toBe(true);
    expect(result.nextState).toBe('rollback_in_progress');
    expect(result.runtimeAccessBlocked).toBe(true);
  });

  it('should require explicit reason for resume', async () => {
    const result = await executeTask032ControlAction({
      action: 'resume_canary',
      currentState: 'paused',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('resume_requires_fresh_gate_review');
  });

  it('should require explicit reason for disable kill switch', async () => {
    const result = await executeTask032ControlAction({
      action: 'disable_kill_switch',
      currentState: 'kill_switch_active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: '',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('disable_kill_switch_requires_explicit_reason');
  });

  it('should block student from control actions', async () => {
    const result = await executeTask032ControlAction({
      action: 'pause_canary',
      currentState: 'active',
      actorRole: 'student',
      actorHash: 'student_hash_task032_safe_001',
      reasonCode: 'student_request',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('student_cannot_perform_control_action');
  });

  it('should block unknown role from control actions', async () => {
    const result = await executeTask032ControlAction({
      action: 'pause_canary',
      currentState: 'active',
      actorRole: 'unknown',
      actorHash: 'unknown_hash_task032_safe_001',
      reasonCode: 'unknown',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('unknown_role_cannot_perform_control_action');
  });

  it('should block teacher from kill switch', async () => {
    const result = await executeTask032ControlAction({
      action: 'enable_kill_switch',
      currentState: 'active',
      actorRole: 'teacher',
      actorHash: 'teacher_hash_task032_safe_001',
      reasonCode: 'teacher_concern',
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('teacher_cannot_perform_control_action');
  });

  it('should allow operator to pause', async () => {
    const result = await executeTask032ControlAction({
      action: 'pause_canary',
      currentState: 'active',
      actorRole: 'operator',
      actorHash: 'operator_hash_task032_safe_001',
      reasonCode: 'operator_pause',
    });
    expect(result.ok).toBe(true);
  });

  it('should preserve safe audit summary', async () => {
    const result = await executeTask032ControlAction({
      action: 'pause_canary',
      currentState: 'active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: 'admin_pause',
    });
    expect(result.safeAuditSummary).toBeTruthy();
    expect(result.safeAuditSummaryWritten).toBe(true);
    expect(result.rawPrivateDataExposed).toBe(false);
  });

  it('should block invalid transition', async () => {
    const result = await executeTask032ControlAction({
      action: 'complete_rollback',
      currentState: 'active',
      actorRole: 'admin',
      actorHash: 'admin_hash_task032_safe_001',
      reasonCode: 'force_complete',
    });
    expect(result.ok).toBe(false);
  });
});
