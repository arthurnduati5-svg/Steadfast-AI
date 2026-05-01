"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const serverTeacher_1 = __importDefault(require("../flows/serverTeacher"));
(0, vitest_1.describe)('serverTeacher - deterministic plain text output', () => {
    (0, vitest_1.it)('produces clean, plain student text', async () => {
        const r = await (0, serverTeacher_1.default)({
            text: 'explain algebra basics',
            preferences: {
                userId: 'u77',
                preferredLanguage: 'english',
                interests: []
            },
            state: {
                awaitingPracticeQuestionAnswer: false,
                validationAttemptCount: 0,
                correctAnswers: [],
                adaptMode: 'normal'
            }
        });
        (0, vitest_1.expect)(typeof r.text).toBe('string');
        (0, vitest_1.expect)(r.text.length).toBeGreaterThan(5);
        (0, vitest_1.expect)(r.text.includes('*')).toBe(false);
        (0, vitest_1.expect)(r.text.includes('`')).toBe(false);
        (0, vitest_1.expect)(r.text.includes('\\')).toBe(false);
        (0, vitest_1.expect)(r.text.endsWith('?')).toBe(true);
    });
});
//# sourceMappingURL=serverTeacher.test.js.map