import { ManifestValidationError } from './errors.mjs';
import { SCHEMA_VERSION, STATES } from './constants.mjs';
import { isAbsolutePath, isPathTraversal } from './repository-root.mjs';

const VALID_STATE_NAMES = new Set(Object.values(STATES));

export function validateManifest(manifest) {
  const errors = [];

  if (!manifest || typeof manifest !== 'object') {
    throw new ManifestValidationError('Manifest must be a non-null object');
  }

  if (manifest.schemaVersion !== SCHEMA_VERSION) {
    errors.push(`Unknown schema version: ${manifest.schemaVersion}. Expected ${SCHEMA_VERSION}.`);
  }

  if (!manifest.taskId || typeof manifest.taskId !== 'string') {
    errors.push('Missing or invalid manifest.taskId');
  }

  if (!manifest.title || typeof manifest.title !== 'string') {
    errors.push('Missing or invalid manifest.title');
  }

  if (!manifest.description || typeof manifest.description !== 'string') {
    errors.push('Missing or invalid manifest.description');
  }

  if (manifest.acceptance) {
    if (!manifest.acceptance.sentinel || typeof manifest.acceptance.sentinel !== 'string' || manifest.acceptance.sentinel.trim() === '') {
      errors.push('acceptance.sentinel must be a non-empty string');
    }
    if (manifest.acceptance.requiredState && !VALID_STATE_NAMES.has(manifest.acceptance.requiredState)) {
      errors.push(`Invalid acceptance.requiredState: ${manifest.acceptance.requiredState}`);
    }
  } else {
    errors.push('Missing manifest.acceptance section');
  }

  if (manifest.scope) {
    if (manifest.scope.allowedPaths) {
      for (const p of manifest.scope.allowedPaths) {
        if (isAbsolutePath(p)) {
          errors.push(`Absolute machine-specific path in allowedPaths: ${p}`);
        }
        if (isPathTraversal(p) && !p.startsWith('.task-governor/')) {
          errors.push(`Path traversal in allowedPaths: ${p}`);
        }
      }
    }
    if (manifest.scope.protectedPaths) {
      for (const p of manifest.scope.protectedPaths) {
        if (isAbsolutePath(p)) {
          errors.push(`Absolute machine-specific path in protectedPaths: ${p}`);
        }
      }
    }
    if (manifest.scope.accountabilityDocument) {
      const doc = manifest.scope.accountabilityDocument;
      if (isAbsolutePath(doc)) {
        errors.push(`Absolute machine-specific path in accountabilityDocument: ${doc}`);
      }
      if (manifest.scope.allowedPaths && !manifest.scope.allowedPaths.some(a => doc.startsWith(a))) {
        errors.push(`accountabilityDocument ${doc} is outside allowedPaths`);
      }
    }
  } else {
    errors.push('Missing manifest.scope section');
  }

  if (manifest.todos) {
    const todoIds = new Set();
    for (const todo of manifest.todos) {
      if (!todo.id) {
        errors.push('Todo missing id');
        continue;
      }
      if (todoIds.has(todo.id)) {
        errors.push(`Duplicate todo ID: ${todo.id}`);
      }
      todoIds.add(todo.id);

      if (todo.dependsOn) {
        for (const dep of todo.dependsOn) {
          if (!manifest.todos.some(t => t.id === dep)) {
            errors.push(`Todo ${todo.id} depends on unknown todo: ${dep}`);
          }
        }
      }
    }

    const visited = new Set();
    const inStack = new Set();
    function detectCycle(todoId) {
      if (inStack.has(todoId)) return true;
      if (visited.has(todoId)) return false;
      const todo = manifest.todos.find(t => t.id === todoId);
      if (!todo || !todo.dependsOn) return false;
      visited.add(todoId);
      inStack.add(todoId);
      for (const dep of todo.dependsOn) {
        if (detectCycle(dep)) return true;
      }
      inStack.delete(todoId);
      return false;
    }
    for (const todo of manifest.todos) {
      if (detectCycle(todo.id)) {
        errors.push(`Cyclic dependency detected involving todo: ${todo.id}`);
        break;
      }
    }
  }

  if (manifest.gates) {
    const gateIds = new Set();
    for (const gate of manifest.gates) {
      if (!gate.id) {
        errors.push('Gate missing id');
        continue;
      }
      if (gateIds.has(gate.id)) {
        errors.push(`Duplicate gate ID: ${gate.id}`);
      }
      gateIds.add(gate.id);

      if (gate.type === 'command' || !gate.type) {
        if (!gate.executable) {
          errors.push(`Gate ${gate.id} is missing executable`);
        }
        if (gate.args && !Array.isArray(gate.args)) {
          errors.push(`Gate ${gate.id} args must be an array`);
        }
        if (gate.cwd && isAbsolutePath(gate.cwd)) {
          errors.push(`Gate ${gate.id} has absolute cwd: ${gate.cwd}`);
        }
        if (gate.timeoutMs == null || gate.timeoutMs <= 0) {
          errors.push(`Gate ${gate.id} has missing or non-positive timeoutMs`);
        }
        if (gate.timeoutMs > 3600000) {
          errors.push(`Gate ${gate.id} timeoutMs exceeds 1 hour maximum`);
        }
      }

      if (gate.phases && !Array.isArray(gate.phases)) {
        errors.push(`Gate ${gate.id} phases must be an array`);
      }
    }

    if (manifest.todos) {
      for (const todo of manifest.todos) {
        if (todo.requiredGateIds) {
          for (const gid of todo.requiredGateIds) {
            if (!gateIds.has(gid)) {
              errors.push(`Todo ${todo.id} references unknown gate: ${gid}`);
            }
          }
        }
      }
    }
    if (manifest.acceptance && manifest.acceptance.requiredGateIds) {
      for (const gid of manifest.acceptance.requiredGateIds) {
        if (!gateIds.has(gid)) {
          errors.push(`Acceptance references unknown gate: ${gid}`);
        }
      }
    }
  }

  if (manifest.commitPolicy) {
    if (manifest.commitPolicy.implementationMessagePattern && typeof manifest.commitPolicy.implementationMessagePattern !== 'string') {
      errors.push('commitPolicy.implementationMessagePattern must be a string');
    }
    if (manifest.commitPolicy.accountabilityMessagePattern && typeof manifest.commitPolicy.accountabilityMessagePattern !== 'string') {
      errors.push('commitPolicy.accountabilityMessagePattern must be a string');
    }
  }

  if (errors.length > 0) {
    throw new ManifestValidationError(`Manifest validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`);
  }

  return true;
}
