import { create, all } from 'mathjs';
import { ValidateMathInput, ValidateMathOutput } from './toolSchemas';

const math = create(all, {});

export async function validateMathTool(input: ValidateMathInput): Promise<ValidateMathOutput> {
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
  } catch {
    return { valid: false, error: 'Could not compute expression' };
  }
}
