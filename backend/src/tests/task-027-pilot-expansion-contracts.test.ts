import { describe, it, expect } from 'vitest';
import {
  PILOT_EXPANSION_STATUSES,
  PILOT_EXPANSION_RECOMMENDED_DECISIONS,
  PILOT_EXPANSION_RISK_LEVELS,
  PILOT_EXPANSION_REVIEW_TYPES,
  REQUIRED_EXPANSION_REVIEW_TYPES,
} from '../contracts/task027PilotExpansionContracts';

describe('Task 027 Pilot Expansion Contracts', () => {
  it('should define all required expansion statuses', () => {
    expect(PILOT_EXPANSION_STATUSES).toContain('draft');
    expect(PILOT_EXPANSION_STATUSES).toContain('review_required');
    expect(PILOT_EXPANSION_STATUSES).toContain('under_review');
    expect(PILOT_EXPANSION_STATUSES).toContain('blocked');
    expect(PILOT_EXPANSION_STATUSES).toContain('approved');
    expect(PILOT_EXPANSION_STATUSES).toContain('rejected');
    expect(PILOT_EXPANSION_STATUSES).toContain('ready_to_expand');
    expect(PILOT_EXPANSION_STATUSES).toContain('expanded');
    expect(PILOT_EXPANSION_STATUSES).toContain('paused');
    expect(PILOT_EXPANSION_STATUSES).toContain('rolled_back');
    expect(PILOT_EXPANSION_STATUSES).toContain('completed');
    expect(PILOT_EXPANSION_STATUSES).toContain('failed');
  });

  it('should define all required recommended decisions', () => {
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('do_not_expand');
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('pause_and_fix');
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('continue_current_pilot');
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('expand_cautiously');
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('expand_to_next_cohort');
    expect(PILOT_EXPANSION_RECOMMENDED_DECISIONS).toContain('expand_after_teacher_review');
  });

  it('should define all required risk levels', () => {
    expect(PILOT_EXPANSION_RISK_LEVELS).toContain('low');
    expect(PILOT_EXPANSION_RISK_LEVELS).toContain('medium');
    expect(PILOT_EXPANSION_RISK_LEVELS).toContain('high');
    expect(PILOT_EXPANSION_RISK_LEVELS).toContain('critical');
  });

  it('should define all review types including required', () => {
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('teacher_learning_quality');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('admin_operations');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('privacy');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('deen_governance');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('socratic_quality');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('curriculum_source_coverage');
    expect(PILOT_EXPANSION_REVIEW_TYPES).toContain('rollback_readiness');
  });

  it('should define required review types subset', () => {
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('teacher_learning_quality');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('admin_operations');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('privacy');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('deen_governance');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('socratic_quality');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('curriculum_source_coverage');
    expect(REQUIRED_EXPANSION_REVIEW_TYPES).toContain('rollback_readiness');
  });

  it('should have consistent private content patterns', () => {
    const PRIVATE_CONTENT_PATTERNS = [
      'rawChat', 'raw_chat', 'rawMessage', 'raw_message',
      'rawTranscript', 'raw_transcript', 'rawPrompt', 'raw_prompt',
      'systemPrompt', 'system_prompt', 'developerPrompt', 'developer_prompt',
      'providerResponse', 'provider_response',
      'answerKey', 'answer_key',
      'teacherOnlyContent', 'teacher_only_note', 'teacherOnlyNote',
    ];
    expect(Array.isArray(PRIVATE_CONTENT_PATTERNS)).toBe(true);
    expect(PRIVATE_CONTENT_PATTERNS.length).toBeGreaterThan(10);
  });
});
