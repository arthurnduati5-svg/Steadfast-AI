import { readFileSync, existsSync } from 'node:fs';

export function validateAgainstSchema(data, schema) {
  const errors = [];
  validateRequired(data, schema, errors, '#');
  return { valid: errors.length === 0, errors };
}

function validateRequired(data, schema, errors, path) {
  if (!schema || typeof schema !== 'object') return;
  if (schema.required && Array.isArray(schema.required)) {
    for (const req of schema.required) {
      if (data === undefined || data === null || data[req] === undefined || data[req] === null) {
        errors.push(`${path}: missing required field "${req}"`);
      } else if (typeof schema.properties?.[req]?.type === 'string' && data[req] === '') {
        errors.push(`${path}: required string field "${req}" is empty`);
      }
    }
  }
  if (schema.properties && typeof data === 'object' && data !== null) {
    for (const [key, propSchema] of Object.entries(schema.properties)) {
      const value = data[key];
      if (value !== undefined && value !== null) {
        validateType(key, value, propSchema, errors, `${path}/${key}`);
        if (propSchema.enum && !propSchema.enum.includes(value)) {
          errors.push(`${path}/${key}: value "${value}" not in enum [${propSchema.enum.join(', ')}]`);
        }
        if (propSchema.pattern && typeof value === 'string') {
          const re = new RegExp(propSchema.pattern);
          if (!re.test(value)) errors.push(`${path}/${key}: does not match pattern ${propSchema.pattern}`);
        }
        if (propSchema.minimum !== undefined && typeof value === 'number' && value < propSchema.minimum) {
          errors.push(`${path}/${key}: ${value} is less than minimum ${propSchema.minimum}`);
        }
        if (propSchema.minItems !== undefined && Array.isArray(value) && value.length < propSchema.minItems) {
          errors.push(`${path}/${key}: array has ${value.length} items, minimum ${propSchema.minItems}`);
        }
        if (propSchema.minLength !== undefined && typeof value === 'string' && value.length < propSchema.minLength) {
          errors.push(`${path}/${key}: string length ${value.length} < minimum ${propSchema.minLength}`);
        }
        if (propSchema.type === 'object' && propSchema.properties) {
          validateRequired(value, propSchema, errors, `${path}/${key}`);
        }
        if (propSchema.type === 'array' && propSchema.items && Array.isArray(value)) {
          value.forEach((item, idx) => {
            validateRequired(item, { required: propSchema.items.required, properties: propSchema.items.properties }, errors, `${path}/${key}[${idx}]`);
            if (propSchema.items.type === 'object' && propSchema.items.properties) {
              for (const [ik, ip] of Object.entries(propSchema.items.properties)) {
                if (item[ik] !== undefined && item[ik] !== null) {
                  validateType(ik, item[ik], ip, errors, `${path}/${key}[${idx}]/${ik}`);
                  if (ip.enum && !ip.enum.includes(item[ik])) {
                    errors.push(`${path}/${key}[${idx}]/${ik}: value not in enum`);
                  }
                }
              }
            }
          });
        }
      }
    }
  }
}

function validateType(name, value, propSchema, errors, path) {
  if (!propSchema.type) return;
  const expected = propSchema.type;
  let actual = typeof value;
  if (expected === 'array') actual = Array.isArray(value) ? 'array' : typeof value;
  if (expected === 'integer') {
    if (typeof value !== 'number' || !Number.isInteger(value)) {
      errors.push(`${path}: expected integer, got ${typeof value}`);
      return;
    }
    return;
  }
  if (actual !== expected) {
    errors.push(`${path}: expected ${expected}, got ${actual}`);
  }
}

export function loadAndValidateSchema(schemaPath) {
  if (!existsSync(schemaPath)) throw new Error(`Schema not found: ${schemaPath}`);
  return JSON.parse(readFileSync(schemaPath, 'utf-8'));
}

export function validateJSONFile(filePath, schemaPath) {
  if (!existsSync(filePath)) return { valid: false, errors: [`File not found: ${filePath}`] };
  const data = JSON.parse(readFileSync(filePath, 'utf-8'));
  const schema = loadAndValidateSchema(schemaPath);
  return validateAgainstSchema(data, schema);
}
