import { ValidateMathInput, ValidateMathOutput } from './toolSchemas';

// Very strict parser for plain parentheses arithmetic only, safe and deterministic
export async function validateMathTool(input: ValidateMathInput): Promise<ValidateMathOutput> {
  if (!input || typeof input.expression !== 'string') {
    return { valid: false, error: 'Missing expression' };
  }
  // Basic safety: allow only digits, spaces, parentheses and operators + - * /
  const safePattern = /^[0-9\s\(\)\+\-\*\/\.]+$/;
  const expr = input.expression.trim();
  if (!safePattern.test(expr)) {
    return { valid: false, error: 'Expression contains forbidden characters' };
  }
  try {
    // Evaluate using a tiny safe evaluator: remove surrounding parentheses then compute with Function
    // NOTE: run this server-side with caution; prefer a math parser lib in production
    // For stub we use eval-like safe path:
    const sanitized = expr.replace(/[^\d\+\-\*\/\.\(\)\s]/g, '');
    // eslint-disable-next-line no-new-func
    const computed = Function(`"use strict"; return (${sanitized});`)();
    return { valid: true, computed: String(computed) };
  } catch (err) {
    return { valid: false, error: 'Could not compute expression' };
  }
}
