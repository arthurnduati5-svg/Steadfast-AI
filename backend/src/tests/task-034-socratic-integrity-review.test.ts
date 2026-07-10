import { describe, it, expect } from 'vitest';
import { reviewTask034SocraticIntegrity } from '../services/task034SocraticIntegrityReviewService';

describe('Task034 Socratic Integrity Review', () => {
  it('All socratic integrity fields pass by default', () => {
    const result = reviewTask034SocraticIntegrity();
    expect(result.ok).toBe(true);
    expect(result.socraticGuidancePreserved).toBe(true);
    expect(result.noFinalAnswerBotBehavior).toBe(true);
    expect(result.cheatingPreventionPreserved).toBe(true);
    expect(result.hintLadderPreserved).toBe(true);
    expect(result.studentReasoningFirstPreserved).toBe(true);
    expect(result.teacherEscalationAvailable).toBe(true);
  });

  it('socraticGuidancePreserved false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ socraticGuidancePreserved: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('socratic_guidance_not_preserved');
  });

  it('noFinalAnswerBotBehavior false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ noFinalAnswerBotBehavior: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('final_answer_bot_behavior_detected');
  });

  it('cheatingPreventionPreserved false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ cheatingPreventionPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('cheating_prevention_not_preserved');
  });

  it('hintLadderPreserved false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ hintLadderPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('hint_ladder_not_preserved');
  });

  it('studentReasoningFirstPreserved false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ studentReasoningFirstPreserved: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('student_reasoning_first_not_preserved');
  });

  it('teacherEscalationAvailable false blocks', () => {
    const result = reviewTask034SocraticIntegrity({ teacherEscalationAvailable: false });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues).toContain('teacher_escalation_not_available');
  });

  it('Multiple failures aggregate blocking issues', () => {
    const result = reviewTask034SocraticIntegrity({
      socraticGuidancePreserved: false,
      noFinalAnswerBotBehavior: false,
      hintLadderPreserved: false,
    });
    expect(result.ok).toBe(false);
    expect(result.blockingIssues.length).toBe(3);
  });

  it('Partial override preserves remaining defaults', () => {
    const result = reviewTask034SocraticIntegrity({ cheatingPreventionPreserved: false });
    expect(result.socraticGuidancePreserved).toBe(true);
    expect(result.hintLadderPreserved).toBe(true);
  });

  it('All fields false returns 6 blocking issues', () => {
    const result = reviewTask034SocraticIntegrity({
      socraticGuidancePreserved: false, noFinalAnswerBotBehavior: false,
      cheatingPreventionPreserved: false, hintLadderPreserved: false,
      studentReasoningFirstPreserved: false, teacherEscalationAvailable: false,
    });
    expect(result.blockingIssues.length).toBe(6);
  });
});
