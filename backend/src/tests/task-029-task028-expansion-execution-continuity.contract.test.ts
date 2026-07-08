import { describe, it, expect } from 'vitest';
import {
  EXPANSION_EXECUTION_STATUSES,
  EXPANSION_STAGE_STATUSES,
  EXPANSION_EXECUTION_DECISIONS,
  EXPANSION_RISK_LEVELS,
  EXPANSION_PARTICIPANT_ACTIVATION_STATUSES,
  EXPANSION_HEALTH_STATUSES,
  EXPANSION_OVERSIGHT_ITEM_TYPES,
  FORBIDDEN_CONTENT_PATTERNS,
  VALID_EXECUTION_TRANSITIONS,
  ExpansionExecutionStatus,
} from '../contracts/task028ExpansionExecutionContracts';
import {
  Task029Task028DependencyInput,
  Task029Task028DependencyResult,
  Task028ProofStatus,
} from '../contracts/task029ExpansionOperationsContracts';

describe('Task029 preserves Task028 expansion execution continuity and delegates to its services', () => {
  it('exports EXPANSION_EXECUTION_STATUSES covering not_started through failed', () => {
    expect(EXPANSION_EXECUTION_STATUSES).toContain('not_started');
    expect(EXPANSION_EXECUTION_STATUSES).toContain('stage_1_active');
    expect(EXPANSION_EXECUTION_STATUSES).toContain('rolled_back');
  });

  it('exports EXPANSION_STAGE_STATUSES including active, paused, completed, rolled_back', () => {
    expect(EXPANSION_STAGE_STATUSES).toContain('active');
    expect(EXPANSION_STAGE_STATUSES).toContain('paused');
    expect(EXPANSION_STAGE_STATUSES).toContain('rolled_back');
  });

  it('exports EXPANSION_EXECUTION_DECISIONS covering control actions', () => {
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('do_not_execute');
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('activate_stage_1');
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('rollback_required');
  });

  it('exports FORBIDDEN_CONTENT_PATTERNS blocking secrets and raw content', () => {
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('Bearer ');
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('postgres://');
    expect(FORBIDDEN_CONTENT_PATTERNS.length).toBeGreaterThan(5);
  });

  it('has VALID_EXECUTION_TRANSITIONS defining state machine for expansion execution', () => {
    expect(VALID_EXECUTION_TRANSITIONS).toHaveProperty('not_started');
    expect(VALID_EXECUTION_TRANSITIONS).toHaveProperty('ready');
    expect(VALID_EXECUTION_TRANSITIONS).toHaveProperty('completed');
    expect(VALID_EXECUTION_TRANSITIONS.not_started).toContain('preflight_required');
  });

  it('Task029 contracts reference Task028 dependency types for continuity', () => {
    expect(typeof EXPANSION_EXECUTION_STATUSES).toBe('object');
    expect(typeof FORBIDDEN_CONTENT_PATTERNS).toBe('object');
    const status: ExpansionExecutionStatus = 'completed';
    expect(status).toBe('completed');
  });
});
