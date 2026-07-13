const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const forbiddenPatterns = [
  'rawLearnerData', 'rawChat', 'rawAnswer', 'parentContact',
  'teacherPrivateNote', 'providerPayload', 'hiddenReasoning',
  'privateDeenText', 'answerKey', 'markingScheme', 'rawSafeguardingNote',
  'studentPhone', 'studentEmail', 'parentPhone', 'parentEmail',
];

const scanDirs = [
  'backend/src/contracts',
  'backend/src/lib',
  'backend/src/repositories',
  'backend/src/services',
  'backend/src/routes',
  'backend/src/tests',
  'scripts',
  'docs/ops/task-040',
  'reports',
];

let exitCode = 0;
const violations = [];

for (const dir of scanDirs) {
  const fullDir = path.resolve(ROOT, dir);
  if (!fs.existsSync(fullDir)) continue;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.includes('task040') && !entry.name.includes('task-040')) continue;
    const filePath = path.join(fullDir, entry.name);
    const ext = path.extname(entry.name);
    if (!['.ts', '.cjs', '.js', '.ps1', '.md', '.json'].includes(ext)) continue;

    const content = fs.readFileSync(filePath, 'utf-8');
    for (const pattern of forbiddenPatterns) {
      const idx = content.indexOf(pattern);
      if (idx !== -1) {
        const lineNum = content.substring(0, idx).split('\n').length;
        const relativePath = path.relative(ROOT, filePath).replace(/\\/g, '/');

        if (content.includes('forbidden') || content.includes('FORBIDDEN') ||
            content.includes('TASK040_FORBIDDEN') || content.includes('DENIED') ||
            content.includes('denylist') || content.includes('denyList')) {
          continue;
        }

        violations.push(`${relativePath}:${lineNum}:${pattern}`);
        exitCode = 1;
      }
    }
  }
}

if (violations.length === 0) {
  console.log('Privacy scan: PASS - no forbidden patterns found in source code');
} else {
  console.error(`Privacy scan: FAIL - ${violations.length} violation(s) found:`);
  for (const v of violations) {
    console.error(`  ${v}`);
  }
}

process.exit(exitCode);
