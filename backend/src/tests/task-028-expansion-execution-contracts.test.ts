import { describe, it, expect } from 'vitest';
import {
  EXPANSION_EXECUTION_STATUSES,
  EXPANSION_STAGE_STATUSES,
  EXPANSION_EXECUTION_DECISIONS,
  EXPANSION_RISK_LEVELS,
  EXPANSION_PARTICIPANT_ACTIVATION_STATUSES,
  EXPANSION_HEALTH_STATUSES,
  EXPANSION_OVERSIGHT_ITEM_TYPES,
  EXPANSION_COMPLETION_REVIEW_DECISIONS,
  VALID_EXECUTION_TRANSITIONS,
  EXPANSION_MONITORING_EVENT_TYPES,
  FORBIDDEN_CONTENT_PATTERNS,
  nowISO,
} from '../contracts/task028ExpansionExecutionContracts';

describe('Task 028 Expansion Execution Contracts', () => {
  it('should have all execution statuses defined', () => {
    const expected = [
      'not_started', 'preflight_required', 'preflight_failed', 'ready',
      'stage_1_active', 'stage_1_paused', 'stage_2_active', 'stage_2_paused',
      'stage_3_active', 'stage_3_paused', 'paused', 'rollback_requested', 'rolled_back',
      'completed', 'blocked', 'failed',
    ];
    expect(EXPANSION_EXECUTION_STATUSES).toEqual(expected);
    expect(EXPANSION_EXECUTION_STATUSES.length).toBe(16);
  });

  it('should have all stage statuses defined', () => {
    expect(EXPANSION_STAGE_STATUSES).toEqual(['pending', 'active', 'paused', 'completed', 'blocked', 'rolled_back']);
    expect(EXPANSION_STAGE_STATUSES.length).toBe(6);
  });

  it('should have all execution decisions defined', () => {
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('do_not_execute');
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('activate_stage_1');
    expect(EXPANSION_EXECUTION_DECISIONS).toContain('complete_expansion');
    expect(EXPANSION_EXECUTION_DECISIONS.length).toBe(7);
  });

  it('should have all risk levels defined', () => {
    expect(EXPANSION_RISK_LEVELS).toEqual(['low', 'medium', 'high', 'critical']);
  });

  it('should have all participant activation statuses defined', () => {
    expect(EXPANSION_PARTICIPANT_ACTIVATION_STATUSES).toEqual(['pending', 'active', 'blocked', 'removed', 'rolled_back']);
  });

  it('should have all health statuses defined', () => {
    expect(EXPANSION_HEALTH_STATUSES).toEqual(['healthy', 'watch', 'degraded', 'critical']);
  });

  it('should have all oversight item types defined', () => {
    expect(EXPANSION_OVERSIGHT_ITEM_TYPES).toContain('teacher_review_needed');
    expect(EXPANSION_OVERSIGHT_ITEM_TYPES).toContain('critical_safety_signal');
    expect(EXPANSION_OVERSIGHT_ITEM_TYPES).toContain('rollback_recommendation');
    expect(EXPANSION_OVERSIGHT_ITEM_TYPES.length).toBe(11);
  });

  it('should have all completion review decisions defined', () => {
    expect(EXPANSION_COMPLETION_REVIEW_DECISIONS).toContain('continue_controlled_expansion');
    expect(EXPANSION_COMPLETION_REVIEW_DECISIONS).toContain('ready_for_larger_school_rollout');
    expect(EXPANSION_COMPLETION_REVIEW_DECISIONS).toContain('do_not_expand_further');
    expect(EXPANSION_COMPLETION_REVIEW_DECISIONS.length).toBe(5);
  });

  it('should have valid transitions for every status', () => {
    for (const status of EXPANSION_EXECUTION_STATUSES) {
      expect(VALID_EXECUTION_TRANSITIONS).toHaveProperty(status);
      expect(Array.isArray(VALID_EXECUTION_TRANSITIONS[status])).toBe(true);
    }
  });

  it('should allow transition from not_started to preflight_required', () => {
    expect(VALID_EXECUTION_TRANSITIONS.not_started).toContain('preflight_required');
  });

  it('should allow transition from ready to stage_1_active', () => {
    expect(VALID_EXECUTION_TRANSITIONS.ready).toContain('stage_1_active');
  });

  it('should allow transition from stage_1_active to stage_2_active', () => {
    expect(VALID_EXECUTION_TRANSITIONS.stage_1_active).toContain('stage_2_active');
  });

  it('should allow transition from stage_2_active to stage_3_active', () => {
    expect(VALID_EXECUTION_TRANSITIONS.stage_2_active).toContain('stage_3_active');
  });

  it('should allow transition from stage_3_active to completed', () => {
    expect(VALID_EXECUTION_TRANSITIONS.stage_3_active).toContain('completed');
  });

  it('should have blocked and failed as terminal states with no outgoing transitions', () => {
    expect(VALID_EXECUTION_TRANSITIONS.blocked).toEqual([]);
    expect(VALID_EXECUTION_TRANSITIONS.failed).toEqual([]);
  });

  it('should have all monitoring event types defined', () => {
    expect(EXPANSION_MONITORING_EVENT_TYPES).toContain('expansion_preflight_requested');
    expect(EXPANSION_MONITORING_EVENT_TYPES).toContain('rollback_completed');
    expect(EXPANSION_MONITORING_EVENT_TYPES).toContain('completion_review_generated');
    expect(EXPANSION_MONITORING_EVENT_TYPES.length).toBeGreaterThan(20);
  });

  it('should have forbidden content patterns defined', () => {
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('raw student chat');
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('Bearer ');
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('sk-proj-');
    expect(FORBIDDEN_CONTENT_PATTERNS).toContain('postgres://');
    expect(FORBIDDEN_CONTENT_PATTERNS.length).toBeGreaterThanOrEqual(14);
  });

  it('should return ISO string from nowISO', () => {
    const iso = nowISO();
    expect(typeof iso).toBe('string');
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
