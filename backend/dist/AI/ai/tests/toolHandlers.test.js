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
    it('formatting_polisher removes markdown', async () => {
        const r = await toolRouter('formatting_polisher', {
            rawText: 'Here is *markdown* and `code`',
            languageMode: 'english'
        });
        expect(r.cleanedText).not.toMatch(/[*`]/);
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
//# sourceMappingURL=toolHandlers.test.js.map