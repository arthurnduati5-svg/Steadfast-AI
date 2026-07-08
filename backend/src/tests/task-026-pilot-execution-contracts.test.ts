import { describe, it, expect } from 'vitest';
import {
  PILOT_EXECUTION_STATUSES,
  PILOT_EXECUTION_EVENT_TYPES,
  PILOT_FEEDBACK_TYPES,
  PILOT_SAFETY_SIGNAL_TYPES,
  PILOT_SAFETY_SEVERITIES,
} from '../contracts/task026PilotExecutionContracts';

describe('Task 026 Pilot Execution Contracts', () => {
  it('should define all required execution statuses', () => {
    expect(PILOT_EXECUTION_STATUSES).toContain('not_started');
    expect(PILOT_EXECUTION_STATUSES).toContain('starting');
    expect(PILOT_EXECUTION_STATUSES).toContain('active');
    expect(PILOT_EXECUTION_STATUSES).toContain('paused');
    expect(PILOT_EXECUTION_STATUSES).toContain('resuming');
    expect(PILOT_EXECUTION_STATUSES).toContain('rollback_requested');
    expect(PILOT_EXECUTION_STATUSES).toContain('rolled_back');
    expect(PILOT_EXECUTION_STATUSES).toContain('completed');
    expect(PILOT_EXECUTION_STATUSES).toContain('blocked');
    expect(PILOT_EXECUTION_STATUSES).toContain('failed');
  });

  it('should define all required event types', () => {
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_start_requested');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_started');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_start_blocked');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_session_start_allowed');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_session_start_denied');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_session_completed');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_feedback_submitted');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_safety_signal_detected');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_paused');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_resumed');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_rollback_requested');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_rolled_back');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('pilot_completed');
    expect(PILOT_EXECUTION_EVENT_TYPES).toContain('post_pilot_review_generated');
  });

  it('should define all feedback types', () => {
    expect(PILOT_FEEDBACK_TYPES).toContain('learning_quality');
    expect(PILOT_FEEDBACK_TYPES).toContain('confusion');
    expect(PILOT_FEEDBACK_TYPES).toContain('too_easy');
    expect(PILOT_FEEDBACK_TYPES).toContain('too_hard');
    expect(PILOT_FEEDBACK_TYPES).toContain('socratic_quality');
    expect(PILOT_FEEDBACK_TYPES).toContain('unsafe_answer');
    expect(PILOT_FEEDBACK_TYPES).toContain('content_gap');
    expect(PILOT_FEEDBACK_TYPES).toContain('deen_concern');
    expect(PILOT_FEEDBACK_TYPES).toContain('privacy_concern');
    expect(PILOT_FEEDBACK_TYPES).toContain('technical_issue');
    expect(PILOT_FEEDBACK_TYPES).toContain('teacher_workload');
    expect(PILOT_FEEDBACK_TYPES).toContain('general');
  });

  it('should define all safety signal types', () => {
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('runtime_guard_denial');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('feedback_risk');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('event_pattern');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('privacy_scan');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('deen_concern_flag');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('socratic_regression');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('content_governance_block');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('operations_degradation');
    expect(PILOT_SAFETY_SIGNAL_TYPES).toContain('rate_limit_event');
  });

  it('should define all safety severities', () => {
    expect(PILOT_SAFETY_SEVERITIES).toContain('info');
    expect(PILOT_SAFETY_SEVERITIES).toContain('low');
    expect(PILOT_SAFETY_SEVERITIES).toContain('medium');
    expect(PILOT_SAFETY_SEVERITIES).toContain('high');
    expect(PILOT_SAFETY_SEVERITIES).toContain('critical');
  });
});
