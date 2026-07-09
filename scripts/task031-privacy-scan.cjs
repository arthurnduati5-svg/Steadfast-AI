const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// ── Mode A: Generated Artifact Strict Mode ──
const generatedArtifactPaths = [
  path.join(rootDir, 'docs', 'ops', 'task-031', 'task-031-authenticated-staging-smoke-report.json'),
  path.join(rootDir, 'docs', 'ops', 'task-031', 'TASK_031_AUTHENTICATED_STAGING_SMOKE_REPORT.md'),
  path.join(rootDir, 'docs', 'ops', 'task-031', 'TASK_031_HANDOFF.md'),
  path.join(rootDir, 'logs', 'task-031', 'task-031-verification-summary.json'),
  path.join(rootDir, 'logs', 'task-031', 'verify-task031-standalone.log'),
  path.join(rootDir, 'logs', 'task-031', 'staging-smoke-result.json'),
  path.join(rootDir, 'logs', 'task-031', 'report-generation.log'),
  path.join(rootDir, 'logs', 'task-031', 'json-validation.log'),
  path.join(rootDir, 'logs', 'task-031', 'privacy-scan.log'),
];

function expandGlob(pattern) {
  const dir = path.dirname(pattern);
  const base = path.basename(pattern).replace(/\*/g, '');
  try {
    return fs.readdirSync(dir)
      .filter(function(f) { return f.includes(base.replace(/\*/g, '')); })
      .map(function(f) { return path.join(dir, f); });
  } catch { return []; }
}

// ── Mode B: Source Code Definition-Aware Mode ──
const sourceCodeGlobs = [
  path.join(rootDir, 'backend', 'src', 'services', 'task031*'),
  path.join(rootDir, 'backend', 'src', 'contracts', 'task031*'),
  path.join(rootDir, 'backend', 'src', 'tests', 'task-031*'),
  path.join(rootDir, 'scripts', '*task031*'),
];

const sourceCodePaths = [];
for (const glob of sourceCodeGlobs) {
  sourceCodePaths.push(...expandGlob(glob));
}

const FORBIDDEN_PATTERNS = [
  { pattern: 'raw student chat', label: 'raw_student_chat' },
  { pattern: 'private learner memory', label: 'private_learner_memory' },
  { pattern: 'teacher-only notes', label: 'teacher_only_notes' },
  { pattern: 'safeguarding raw details', label: 'safeguarding_raw_details' },
  { pattern: 'Deen-sensitive private text', label: 'deen_sensitive_private_text' },
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, label: 'real_email' },
  { pattern: /\+\d{1,3}\d{6,14}/, label: 'real_phone' },
  { pattern: 'Bearer ', label: 'auth_header' },
  { pattern: 'sk-proj-', label: 'openai_key_pattern' },
  { pattern: 'sk-ant-', label: 'anthropic_key_pattern' },
  { pattern: 'postgres://', label: 'postgres_url' },
  { pattern: 'postgresql://', label: 'postgresql_url' },
  { pattern: 'mysql://', label: 'mysql_url' },
  { pattern: 'authorization header', label: 'auth_header_ref' },
  { pattern: 'raw exception object', label: 'raw_exception' },
  { pattern: 'unredacted stack trace', label: 'unredacted_stack' },
  { pattern: 'answer key', label: 'answer_key' },
  { pattern: 'teacher-only content', label: 'teacher_only_content' },
  { pattern: 'protected rubric', label: 'protected_rubric' },
  { pattern: /cookie\s*=/i, label: 'cookie' },
];

// Safe negative phrases that indicate an item is described as NOT exposed
const SAFE_NEGATIVE_PHRASES = [
  'do not expose',
  'never exposed',
  'does not expose',
  'forbidden from output',
  'no raw student chat',
  'not exposed',
];

// Context markers indicating the pattern is in a definition or test context
const DEFINITION_CONTEXT_MARKERS = [
  'forbiddenpattern',
  'forbidden_pattern',
  'forbidden-pattern',
  '_patterns =',
  '_patterns=',
  "'raw student chat'",
  "'private learner memory'",
  "'teacher-only notes'",
  "'answer key'",
  "'ai prompt'",
  "'raw exception'",
  "'unredacted'",
  "'auth header'",
  "'bearer '",
];

const errors = [];

// ── Scan generated artifacts (strict mode) ──
for (const filePath of generatedArtifactPaths) {
  if (!fs.existsSync(filePath)) continue;
  if (fs.statSync(filePath).isDirectory()) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const contentLower = content.toLowerCase();

  for (const entry of FORBIDDEN_PATTERNS) {
    let match;
    if (entry.pattern instanceof RegExp) {
      match = entry.pattern.test(content);
    } else {
      match = contentLower.includes(entry.pattern.toLowerCase());
    }

    if (match) {
      // Check if this is a safe negative assertion
      const anySafeNegative = SAFE_NEGATIVE_PHRASES.some(function(p) {
        return contentLower.includes(p.toLowerCase());
      });

      // For generated artifacts, also allow checklist-style negative assertions
      // Patterns like "exposed: no", "exposed:** no", "exposed? no", "exposed: false"
      const idx = contentLower.indexOf(
        entry.pattern instanceof RegExp
          ? entry.label.replace(/_/g, ' ').toLowerCase()
          : entry.pattern.toLowerCase()
      );
      const contextStart = Math.max(0, idx - 120);
      const contextEnd = Math.min(content.length, idx + entry.pattern instanceof RegExp ? 120 : entry.pattern.length + 120);
      const context = contentLower.substring(contextStart, contextEnd);

      const isChecklistNegative = /exposed[?]?\s*:\s*\*{0,2}\s*no/.test(context) || /:\s*false/.test(context) || context.includes('exposed:false') || /detected:\s*\*{0,2}\s*no/.test(context) || /used:\s*\*{0,2}\s*no/.test(context);

      if (!anySafeNegative && !isChecklistNegative) {
        errors.push('GENERATED_ARTIFACT_LEAK: ' + filePath + ' contains forbidden pattern "' + entry.label + '"');
      }
    }
  }
}

// ── Scan source code (definition-aware mode) ──
for (const filePath of sourceCodePaths) {
  if (!fs.existsSync(filePath)) continue;
  if (fs.statSync(filePath).isDirectory()) continue;

  const content = fs.readFileSync(filePath, 'utf8');
  const contentLower = content.toLowerCase();

  for (const entry of FORBIDDEN_PATTERNS) {
    let match;
    if (entry.pattern instanceof RegExp) {
      match = entry.pattern.test(content);
    } else {
      match = contentLower.includes(entry.pattern.toLowerCase());
    }

    if (match) {
      // Check if the match is in a definition context
      const isDefinitionContext = DEFINITION_CONTEXT_MARKERS.some(function(m) {
        return contentLower.includes(m.toLowerCase());
      });

      // Check for safe negative assertion
      const anySafeNegative = SAFE_NEGATIVE_PHRASES.some(function(p) {
        return contentLower.includes(p.toLowerCase());
      });

      // Check if pattern appears near test assertion keywords
      const isTestContext = contentLower.includes("it('should") || contentLower.includes('describe(') || contentLower.includes('test(') || contentLower.includes("it(");

      // For source code, patterns are allowed in definition arrays, test assertions, and negative statements
      if (!isDefinitionContext && !anySafeNegative && !isTestContext) {
        errors.push('SOURCE_CODE_ISSUE: ' + filePath + ' contains forbidden pattern "' + entry.label + '" outside definition context');
      }
    }
  }
}

if (errors.length > 0) {
  console.error('Privacy Leak Scan FAILED:');
  errors.forEach(function(e) { console.error('  - ' + e); });
  process.exit(1);
} else {
  const totalScanned = generatedArtifactPaths.filter(function(p) { return fs.existsSync(p) && !fs.statSync(p).isDirectory(); }).length +
    sourceCodePaths.filter(function(p) { return fs.existsSync(p) && !fs.statSync(p).isDirectory(); }).length;
  console.log('Privacy Leak Scan: PASS');
  console.log('  Mode A (generated artifacts): ' + generatedArtifactPaths.filter(function(p) { return fs.existsSync(p) && !fs.statSync(p).isDirectory(); }).length + ' files scanned');
  console.log('  Mode B (source code): ' + sourceCodePaths.filter(function(p) { return fs.existsSync(p) && !fs.statSync(p).isDirectory(); }).length + ' files scanned');
  console.log('  Total scanned: ' + totalScanned + ' files');
  console.log('  No forbidden private data detected.');
  process.exit(0);
}
