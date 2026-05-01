"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalOutputCheckerTool = finalOutputCheckerTool;
function sentenceCount(text) {
    return text.split(/[.?!]+/).map((s) => s.trim()).filter(Boolean).length;
}
async function finalOutputCheckerTool(input) {
    const failures = [];
    const msg = (input.candidateMessage || '').trim();
    if (!msg) {
        failures.push('Candidate message is empty.');
        return { passed: false, failures };
    }
    const forbiddenTokens = ['```', '\\frac', '\\sqrt', '{', '}', '[', ']'];
    for (const token of forbiddenTokens) {
        if (msg.includes(token)) {
            failures.push(`Contains forbidden token: ${token}`);
        }
    }
    if ((msg.match(/\?/g) || []).length > 1) {
        failures.push('Use at most one question mark.');
    }
    if (sentenceCount(msg) > 6) {
        failures.push('Response is too long for step-by-step tutoring.');
    }
    if (/as an ai|i cannot browse|i am unable to|language model/i.test(msg)) {
        failures.push('Contains meta-assistant phrasing.');
    }
    if (/not fully specified here|based on (the )?(information|details|context) provided|we are discussing/i.test(msg)) {
        failures.push('Contains internal or weak meta phrasing.');
    }
    if (!/[A-Za-z\u0600-\u06FF]/.test(msg)) {
        failures.push('Message lacks readable language content.');
    }
    return { passed: failures.length === 0, failures };
}
//# sourceMappingURL=finalOutputChecker.js.map