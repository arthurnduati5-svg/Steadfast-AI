"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMathTool = validateMathTool;
const mathjs_1 = require("mathjs");
const math = (0, mathjs_1.create)(mathjs_1.all, {});
async function validateMathTool(input) {
    if (!input || typeof input.expression !== 'string') {
        return { valid: false, error: 'Missing expression' };
    }
    const expr = input.expression.trim();
    if (!expr) {
        return { valid: false, error: 'Expression is empty' };
    }
    const safePattern = /^[0-9\s()+\-*/.^%]+$/;
    if (!safePattern.test(expr)) {
        return { valid: false, error: 'Expression contains forbidden characters' };
    }
    try {
        const result = math.evaluate(expr);
        if (typeof result === 'number' && Number.isFinite(result)) {
            return { valid: true, computed: String(result) };
        }
        if (typeof result === 'string') {
            return { valid: true, computed: result };
        }
        if (Array.isArray(result)) {
            return { valid: false, error: 'Expression must evaluate to a single value' };
        }
        return { valid: true, computed: String(result) };
    }
    catch {
        return { valid: false, error: 'Could not compute expression' };
    }
}
//# sourceMappingURL=validateMath.js.map