"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const handlers_1 = require("../tools/handlers");
(0, vitest_1.describe)('Tool Router & Handlers', () => {
    (0, vitest_1.it)('emotional_decoder returns structured emotion', async () => {
        const r = await (0, handlers_1.toolRouter)('emotional_decoder', { text: 'I hate this' });
        (0, vitest_1.expect)(r.emotion).toBeDefined();
    });
    (0, vitest_1.it)('tone_generator returns prefix', async () => {
        const r = await (0, handlers_1.toolRouter)('tone_generator', { emotion: 'confused' });
        (0, vitest_1.expect)(r.hintPrefix).toBeDefined();
    });
    (0, vitest_1.it)('teaching_micro_step generates the required fields', async () => {
        const r = await (0, handlers_1.toolRouter)('teaching_micro_step', {
            topic: 'fractions',
            studentLevel: 'primary',
            context: '',
            adaptMode: false
        });
        (0, vitest_1.expect)(r.microIdea).toBeTruthy();
        (0, vitest_1.expect)(r.example).toBeTruthy();
        (0, vitest_1.expect)(r.question).toBeTruthy();
    });
    (0, vitest_1.it)('math_validate_answer reports correctness', async () => {
        const r = await (0, handlers_1.toolRouter)('math_validate_answer', {
            question: '(10 - 3)',
            studentAnswer: '7'
        });
        (0, vitest_1.expect)(r.isCorrect).toBe(true);
    });
    (0, vitest_1.it)('formatting_polisher removes markdown emphasis without breaking plain text', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Here is **markdown** and __bold__',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText).not.toMatch(/\*\*|__/);
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('here is markdown and bold');
    });
    (0, vitest_1.it)('formatting_polisher wraps javascript snippets in fenced blocks', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Corrected Version\njavascript function findSecondLargest(arr) { let largest = -Infinity; return largest; }',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText).toContain('```javascript');
        (0, vitest_1.expect)(r.cleanedText).toContain('function findSecondLargest');
    });
    (0, vitest_1.it)('formatting_polisher wraps powershell commands in fenced blocks', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Run this command:\n\nGet-Process | Where-Object { $_.ProcessName -like "*node*" }',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText).toContain('```powershell');
        (0, vitest_1.expect)(r.cleanedText).toContain('Get-Process');
    });
    (0, vitest_1.it)('formatting_polisher preserves fenced code blocks without leaking placeholder tokens', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: '### Fixing the Code\n\n```javascript\nconst x = 1;\nconsole.log(x);\n```\n\nDone.',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText).toContain('```javascript');
        (0, vitest_1.expect)(r.cleanedText).toContain('console.log(x);');
        (0, vitest_1.expect)(r.cleanedText).not.toContain('CODE_BLOCK_TOKEN_');
        (0, vitest_1.expect)(r.cleanedText).not.toContain('CODE_BLOCK_0');
    });
    (0, vitest_1.it)('formatting_polisher unwraps prose accidentally wrapped in fenced code blocks', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: '```in\nStep one: We define a function called `calculate_remaining_balls`.\nStep two: We call the function with values.\nHow does this idea sound to you?\n```',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText).not.toContain('```');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('we define a function');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('how does this idea sound to you');
    });
    (0, vitest_1.it)('formatting_polisher does not convert numeric equation results into step labels', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Step one: (1/2) x 4 = 2. Step two: continue.',
            contextTopic: 'fractions',
            userInput: 'solve (1/2)/(3/4)',
            strictMathMode: true
        });
        (0, vitest_1.expect)(r.cleanedText).toContain('= 2.');
        (0, vitest_1.expect)(r.cleanedText).not.toContain('= Step two:');
    });
    (0, vitest_1.it)('formatting_polisher strips step labels for conceptual troubleshooting explanations', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Step one: Timeout settings can cause intermittent 502 errors behind Nginx. Step two: Insufficient upstream capacity can drop requests under load. Step three: Network issues between Nginx and upstream can break connectivity.',
            contextTopic: 'nginx 502 causes',
            userInput: 'What are other potential causes of intermittent 502 errors behind Nginx under load?',
            strictMathMode: false
        });
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).not.toMatch(/\bstep\s+(one|two|three|1|2|3)\b/);
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('timeout settings');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('insufficient upstream capacity');
    });
    (0, vitest_1.it)('formatting_polisher preserves step labels for explicit procedural debugging requests', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: '1. Check Nginx error logs first.\n2. Increase proxy_read_timeout and proxy_connect_timeout.\n3. Load test again.',
            contextTopic: 'nginx 502 troubleshooting',
            userInput: 'Show me step by step how to debug intermittent 502 errors in Nginx',
            strictMathMode: false
        });
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('step one');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('step two');
    });
    (0, vitest_1.it)('formatting_polisher removes internal-context and weak meta phrasing', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'The detailed mechanisms and full extent of photosynthesis processes are not fully specified here. (Context: We are discussing photosynthesis.)',
            languageMode: 'english'
        });
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).not.toContain('not fully specified here');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).not.toContain('(context: we are discussing');
    });
    (0, vitest_1.it)('formatting_polisher rewrites unrealistic math examples into realistic shareable objects', async () => {
        const r = await (0, handlers_1.toolRouter)('formatting_polisher', {
            rawText: 'Imagine you have one whole football and cut the football in half to get 1/2.',
            contextTopic: 'fractions',
            userInput: 'explain fractions',
            strictMathMode: true
        });
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).not.toContain('football');
        (0, vitest_1.expect)(r.cleanedText.toLowerCase()).toContain('pizza');
    });
    (0, vitest_1.it)('emoji_policy_check removes multiple emojis', async () => {
        const r = await (0, handlers_1.toolRouter)('emoji_policy_check', {
            text: 'Hello 😊😊😊',
            languageMode: 'english'
        });
        const count = (r.cleanedText.match(/😊/g) || []).length;
        (0, vitest_1.expect)(count).toBeLessThanOrEqual(1);
    });
});
//# sourceMappingURL=toolHandlers.test.js.map