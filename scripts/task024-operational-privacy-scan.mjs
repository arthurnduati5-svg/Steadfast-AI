#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

const FORBIDDEN_PATTERNS = [
  /DATABASE_URL/, /REDIS_URL/, /JWT_SECRET/, /SESSION_SECRET/, /COOKIE_SECRET/,
  /OPENAI_API_KEY/, /ANTHROPIC_API_KEY/, /GEMINI_API_KEY/, /GOOGLE_API_KEY/,
  /PINECONE_API_KEY/, /PRIVATE_KEY/, /ACCESS_TOKEN/, /REFRESH_TOKEN/, /ID_TOKEN/,
  /AUTHORIZATION/, /COOKIE/,
  /rawBackupFile/, /rawDatabaseDump/, /rawRestorePayload/, /rawEnv/, /rawSecret/,
  /rawConnectionString/, /rawStudentData/, /rawLearnerData/, /rawParentData/,
  /rawTeacherData/, /rawChat/, /rawMessage/, /rawStudentAnswer/, /rawStudentWork/,
  /safeguardingRaw/, /safeguardingCaseNote/, /privateDeenText/, /deenSensitiveRaw/,
  /providerPrompt/, /providerResponse/, /rawProviderResponse/,
  /chainOfThought/, /hiddenReasoning/, /scratchpad/,
  /answerKey/, /correctAnswer/, /modelAnswer/, /markingScheme/,
  /incidentRawLog/, /stackTraceWithSecrets/,
];

const ALLOWED_FILE_PATTERNS = [
  /Contracts\.ts$/,
  /Validation\.ts$/,
  /PrivacyGuardService\.ts$/,
  /RedactionAndLeakDetectionService\.ts$/,
  /SafeTelemetryService\.ts$/,
  /ReportService\.ts$/,
  /IncidentDetectionService\.ts$/,
  /OperationalHardeningChecklistService\.ts$/,
  /OperationalHealthAggregator\.ts$/,
  /OpsRepository\.ts$/,
  /\.test\.ts$/,
  /\.spec\.ts$/,
  /\.md$/,
  /\.json$/,
  /\.mjs$/,
];

function isTask024File(filePath) {
  const normalizedPath = filePath.replace(/\\/g, '/');
  return /task024|task-024/i.test(normalizedPath);
}

function scanFile(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf-8');
  const violations = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    const matches = content.match(new RegExp(pattern.source, 'gi'));
    if (matches) {
      const isAllowed = ALLOWED_FILE_PATTERNS.some(a => a.test(filePath));
      if (!isAllowed) {
        violations.push({ file: filePath, pattern: pattern.source, count: matches.length });
      }
    }
  }

  return violations;
}

const DIRS_TO_SCAN = [
  'backend/src',
  'docs/architecture',
  'scripts',
  'reports',
];

let allViolations = [];
for (const dir of DIRS_TO_SCAN) {
  const dirPath = join(ROOT, dir);
  if (!existsSync(dirPath)) continue;
  const entries = readdirSync(dirPath, { recursive: true, encoding: 'utf-8' });
  for (const entry of entries) {
    const fullPath = join(dirPath, entry);
    if (!isTask024File(fullPath)) continue;
    if (fullPath.endsWith('.ts') || fullPath.endsWith('.mjs') || fullPath.endsWith('.md') || fullPath.endsWith('.json')) {
      const violations = scanFile(fullPath);
      if (violations && violations.length > 0) {
        allViolations.push(...violations);
      }
    }
  }
}

if (allViolations.length > 0) {
  console.error('OPERATIONAL PRIVACY SCAN FAILED');
  console.error('Forbidden fields detected in Task 024 files:');
  for (const v of allViolations) {
    console.error(`  ${v.file}: pattern "${v.pattern}" found ${v.count} time(s)`);
  }
  process.exit(1);
} else {
  console.log('OPERATIONAL PRIVACY SCAN PASSED');
  console.log('No forbidden fields found in Task 024 source files.');
  process.exit(0);
}
