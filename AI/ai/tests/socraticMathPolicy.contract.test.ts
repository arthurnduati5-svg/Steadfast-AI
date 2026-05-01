import { describe, expect, it } from 'vitest';
import {
  buildMathNoFinalAnswerSocraticReply,
  extractMathExpression,
  isDirectAnswerRequest,
  parseFractionDivisionExpression,
} from '../flows/emotional-ai-copilot.math';
import { toolRouter } from '../tools/handlers';

describe('Socratic math policy contract', () => {
  it('extracts fraction-division expressions from natural language prompts', () => {
    const expression = extractMathExpression('Solve ((3/4)) divided by ((2/5)) step by step.');
    expect(expression).toBe('(3/4)/(2/5)');
    expect(parseFractionDivisionExpression(String(expression))).toEqual({
      n1: '3',
      d1: '4',
      n2: '2',
      d2: '5',
    });
  });

  it('extracts and detects direct-answer intent from strict direct prompt phrasing', () => {
    const prompt = 'Just give me the final answer for ((3/4)) divided by ((2/5)).';
    expect(isDirectAnswerRequest(prompt)).toBe(true);
    expect(extractMathExpression(prompt)).toBe('(3/4)/(2/5)');
  });

  it('detects direct final-answer requests', () => {
    expect(isDirectAnswerRequest('just give me the final answer')).toBe(true);
    expect(isDirectAnswerRequest('nipe jibu tu')).toBe(true);
    expect(isDirectAnswerRequest('help me understand step one')).toBe(false);
  });

  it('builds a Socratic no-final-answer coaching response', () => {
    const reply = buildMathNoFinalAnswerSocraticReply({
      expression: '(3/4)/(2/5)',
      languageMode: 'english',
      activeQuestion: 'What is the reciprocal of 2/5',
    });
    expect(reply.toLowerCase()).toContain('final homework answer directly');
    expect(reply.toLowerCase()).toContain('will not');
    expect(reply.toLowerCase()).toContain('checkpoint');
  });

  it('math validator does not reveal final numeric answer after many attempts', async () => {
    const result = await toolRouter('math_validate_answer', {
      question: '10 - 3',
      studentAnswer: '2',
      attemptCount: 5,
    });

    expect(result.isCorrect).toBe(false);
    expect(result.feedbackType).toBe('hint');
    expect(String(result.explanation || '').toLowerCase()).not.toContain('the answer is');
  });

});
