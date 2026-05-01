import { describe, it, expect } from 'vitest';
import { toolRouter } from '../tools/handlers';

describe('Tool Router & Handlers', () => {

  it('emotional_decoder returns structured emotion', async () => {
    const r = await toolRouter('emotional_decoder', { text: 'I hate this' });
    expect(r.emotion).toBeDefined();
  });

  it('tone_generator returns prefix', async () => {
    const r = await toolRouter('tone_generator', { emotion: 'confused' });
    expect(r.hintPrefix).toBeDefined();
  });

  it('teaching_micro_step generates the required fields', async () => {
    const r = await toolRouter('teaching_micro_step', {
      topic: 'fractions',
      studentLevel: 'primary',
      context: '',
      adaptMode: false
    });

    expect(r.microIdea).toBeTruthy();
    expect(r.example).toBeTruthy();
    expect(r.question).toBeTruthy();
  });

  it('math_validate_answer reports correctness', async () => {
    const r = await toolRouter('math_validate_answer', {
      question: '(10 - 3)',
      studentAnswer: '7'
    });

    expect(r.isCorrect).toBe(true);
  });

  it('formatting_polisher removes markdown emphasis without breaking plain text', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText: 'Here is **markdown** and __bold__',
      languageMode: 'english'
    });

    expect(r.cleanedText).not.toMatch(/\*\*|__/);
    expect(r.cleanedText.toLowerCase()).toContain('here is markdown and bold');
  });

  it('formatting_polisher wraps javascript snippets in fenced blocks', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        'Corrected Version\njavascript function findSecondLargest(arr) { let largest = -Infinity; return largest; }',
      languageMode: 'english'
    });

    expect(r.cleanedText).toContain('```javascript');
    expect(r.cleanedText).toContain('function findSecondLargest');
  });

  it('formatting_polisher wraps powershell commands in fenced blocks', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        'Run this command:\n\nGet-Process | Where-Object { $_.ProcessName -like "*node*" }',
      languageMode: 'english'
    });

    expect(r.cleanedText).toContain('```powershell');
    expect(r.cleanedText).toContain('Get-Process');
  });

  it('formatting_polisher preserves fenced code blocks without leaking placeholder tokens', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '### Fixing the Code\n\n```javascript\nconst x = 1;\nconsole.log(x);\n```\n\nDone.',
      languageMode: 'english'
    });

    expect(r.cleanedText).toContain('```javascript');
    expect(r.cleanedText).toContain('console.log(x);');
    expect(r.cleanedText).not.toContain('CODE_BLOCK_TOKEN_');
    expect(r.cleanedText).not.toContain('CODE_BLOCK_0');
  });

  it('formatting_polisher unwraps prose accidentally wrapped in fenced code blocks', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '```in\nStep one: We define a function called `calculate_remaining_balls`.\nStep two: We call the function with values.\nHow does this idea sound to you?\n```',
      languageMode: 'english'
    });

    expect(r.cleanedText).not.toContain('```');
    expect(r.cleanedText.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
    expect(r.cleanedText.toLowerCase()).toContain('we define a function');
    expect(r.cleanedText.toLowerCase()).toContain('how does this idea sound to you');
  });

  it('formatting_polisher does not convert numeric equation results into step labels', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText: 'Step one: (1/2) x 4 = 2. Step two: continue.',
      contextTopic: 'fractions',
      userInput: 'solve (1/2)/(3/4)',
      strictMathMode: true
    });

    expect(r.cleanedText).toContain('= 2.');
    expect(r.cleanedText).not.toContain('= Step two:');
  });

  it('formatting_polisher strips step labels for conceptual troubleshooting explanations', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        'Step one: Timeout settings can cause intermittent 502 errors behind Nginx. Step two: Insufficient upstream capacity can drop requests under load. Step three: Network issues between Nginx and upstream can break connectivity.',
      contextTopic: 'nginx 502 causes',
      userInput: 'What are other potential causes of intermittent 502 errors behind Nginx under load?',
      strictMathMode: false
    });

    expect(r.cleanedText.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
    expect(r.cleanedText.toLowerCase()).toContain('timeout settings');
    expect(r.cleanedText.toLowerCase()).toContain('insufficient upstream capacity');
  });

  it('formatting_polisher preserves step labels for explicit procedural debugging requests', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        '1. Check Nginx error logs first.\n2. Increase proxy_read_timeout and proxy_connect_timeout.\n3. Load test again.',
      contextTopic: 'nginx 502 troubleshooting',
      userInput: 'Show me step by step how to debug intermittent 502 errors in Nginx',
      strictMathMode: false
    });

    expect(r.cleanedText.toLowerCase()).toContain('step one');
    expect(r.cleanedText.toLowerCase()).toContain('step two');
  });

  it('formatting_polisher removes internal-context and weak meta phrasing', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText:
        'The detailed mechanisms and full extent of photosynthesis processes are not fully specified here. (Context: We are discussing photosynthesis.)',
      languageMode: 'english'
    });

    expect(r.cleanedText.toLowerCase()).not.toContain('not fully specified here');
    expect(r.cleanedText.toLowerCase()).not.toContain('(context: we are discussing');
  });

  it('formatting_polisher rewrites unrealistic math examples into realistic shareable objects', async () => {
    const r = await toolRouter('formatting_polisher', {
      rawText: 'Imagine you have one whole football and cut the football in half to get 1/2.',
      contextTopic: 'fractions',
      userInput: 'explain fractions',
      strictMathMode: true
    });

    expect(r.cleanedText.toLowerCase()).not.toContain('football');
    expect(r.cleanedText.toLowerCase()).toContain('pizza');
  });

  it('emoji_policy_check removes multiple emojis', async () => {
    const r = await toolRouter('emoji_policy_check', {
      text: 'Hello 😊😊😊',
      languageMode: 'english'
    });

    const count = (r.cleanedText.match(/😊/g) || []).length;
    expect(count).toBeLessThanOrEqual(1);
  });

});
