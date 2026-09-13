import * as fs from 'fs';

export interface NoLiveStudentGuardResult {
  ok: boolean;
  liveStudentDataDetected: boolean;
  productionDataTouched: boolean;
  allowedFixtureMode: string;
  blockingIssues: string[];
  safeSummary: string;
}

const LIVE_DATA_PATTERNS = [
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, label: 'email_address' },
  { pattern: /\+\d{1,3}\d{6,14}/, label: 'phone_number' },
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/, label: 'us_phone_number' },
];

const FORBIDDEN_CONTENT_PATTERNS = [
  'raw student chat',
  'private learner memory',
  'teacher-only notes',
  'safeguarding raw details',
  'Deen-sensitive private text',
  'AI prompt',
  'provider response',
  'answer key',
  'teacher-only content',
  'protected rubric',
];

const SAFE_IDENTIFIER_MARKER = 'task030_safe';

function hasLiveDataInString(content: string): string[] {
  const found: string[] = [];
  for (const { pattern, label } of LIVE_DATA_PATTERNS) {
    if (pattern.test(content)) {
      const match = content.match(pattern);
      if (match) {
        const candidate = match[0];
        if (!candidate.includes(SAFE_IDENTIFIER_MARKER) && !candidate.includes('example.com') && !candidate.includes('.test')) {
          found.push(label);
        }
      }
    }
  }
  return found;
}

function hasForbiddenContent(content: string): string[] {
  const found: string[] = [];
  for (const pattern of FORBIDDEN_CONTENT_PATTERNS) {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      const contextStart = Math.max(0, content.toLowerCase().indexOf(pattern.toLowerCase()) - 60);
      const contextEnd = Math.min(content.length, content.toLowerCase().indexOf(pattern.toLowerCase()) + pattern.length + 60);
      const context = content.substring(contextStart, contextEnd).toLowerCase();
      const isSafeNegative = context.includes('do not expose') ||
        context.includes('not exposed') ||
        context.includes('no ') ||
        context.includes('never ') ||
        context.includes('forbidden');
      if (!isSafeNegative) {
        found.push(pattern);
      }
    }
  }
  return found;
}

export async function checkNoLiveStudentGuard(
  fixtureContent: Record<string, unknown>,
  additionalStrings: string[] = [],
): Promise<NoLiveStudentGuardResult> {
  const blockingIssues: string[] = [];
  const allStrings = [...additionalStrings, JSON.stringify(fixtureContent)];

  for (const str of allStrings) {
    const liveDataFound = hasLiveDataInString(str);
    if (liveDataFound.length > 0) {
      blockingIssues.push(`live_data_pattern_detected: ${liveDataFound.join(', ')}`);
    }
    const forbiddenFound = hasForbiddenContent(str);
    if (forbiddenFound.length > 0) {
      blockingIssues.push(`forbidden_content_detected: ${forbiddenFound.join(', ')}`);
    }
  }

  const liveStudentDataDetected = blockingIssues.some(i => i.includes('live_data_pattern'));
  const productionDataTouched = blockingIssues.some(i => i.includes('forbidden_content'));
  const ok = blockingIssues.length === 0;

  return {
    ok,
    liveStudentDataDetected,
    productionDataTouched,
    allowedFixtureMode: 'safe_synthetic_staging_rehearsal',
    blockingIssues,
    safeSummary: ok
      ? 'No live student data detected in Task 030 rehearsal artifacts.'
      : `No-live-student guard blocked: ${blockingIssues.length} issue(s).`,
  };
}

export function checkNoLiveStudentGuardSync(
  fixtureContent: Record<string, unknown>,
  additionalStrings: string[] = [],
): NoLiveStudentGuardResult {
  const blockingIssues: string[] = [];
  const allStrings = [...additionalStrings, JSON.stringify(fixtureContent)];

  for (const str of allStrings) {
    const liveDataFound = hasLiveDataInString(str);
    if (liveDataFound.length > 0) {
      blockingIssues.push(`live_data_pattern_detected: ${liveDataFound.join(', ')}`);
    }
    const forbiddenFound = hasForbiddenContent(str);
    if (forbiddenFound.length > 0) {
      blockingIssues.push(`forbidden_content_detected: ${forbiddenFound.join(', ')}`);
    }
  }

  const liveStudentDataDetected = blockingIssues.some(i => i.includes('live_data_pattern'));
  const productionDataTouched = blockingIssues.some(i => i.includes('forbidden_content'));
  const ok = blockingIssues.length === 0;

  return {
    ok,
    liveStudentDataDetected,
    productionDataTouched,
    allowedFixtureMode: 'safe_synthetic_staging_rehearsal',
    blockingIssues,
    safeSummary: ok
      ? 'No live student data detected in Task 030 rehearsal artifacts.'
      : `No-live-student guard blocked: ${blockingIssues.length} issue(s).`,
  };
}

export function scanFileForLiveData(filePath: string): string[] {
  try {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const issues: string[] = [];
    issues.push(...hasLiveDataInString(content));
    issues.push(...hasForbiddenContent(content));
    return [...new Set(issues)];
  } catch {
    return [];
  }
}
