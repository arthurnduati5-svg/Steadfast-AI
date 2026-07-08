import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const NOTIFICATION_PATTERNS: RegExp[] = [
  /\bsendEmail\b/,
  /\bsendSms\b/,
  /\bsendPush\b/,
  /\bdispatchNotification\b/,
  /\bsendNotification\b/,
  /\bemailClient\b/,
  /\bsmsClient\b/,
  /\bpushNotification\b/,
  /\bqueueNotificationSend\b/,
  /\brawNotificationPayload\b/,
  /\brawEmailBody\b/,
  /\brawSmsBody\b/,
  /\bparentPhone\b/,
  /\bparentEmail\b/,
  /\bstudentPhone\b/,
  /\bstudentEmail\b/,
];

function getTask025Files(dirs: string[]): string[] {
  const files: string[] = [];
  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        if (entry.startsWith('task025') && entry.endsWith('.ts')) {
          files.push(resolve(dir, entry));
        }
      }
    } catch {
      // directory does not exist
    }
  }
  return files;
}

function scanFile(filePath: string, patterns: RegExp[]): string[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const matches: string[] = [];
    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (match) {
        matches.push(`Pattern "${pattern.source}" matched "${match[0]}" in ${filePath.split(sep).pop()}`);
      }
    }
    return matches;
  } catch {
    return [];
  }
}

const SOURCE_DIRS = [servicesDir, routesDir, libDir];

describe('task025NoLiveNotificationSendContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains raw notification payload fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\brawNotificationPayload\b/, /\brawEmailBody\b/, /\brawSmsBody\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains email or SMS sending calls', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bsendEmail\b/, /\bsendSms\b/, /\bemailClient\b/, /\bsmsClient\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains push notification dispatch', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bsendPush\b/, /\bpushNotification\b/, /\bdispatchNotification\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains sendNotification or queueNotificationSend', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bsendNotification\b/, /\bqueueNotificationSend\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains parent or student contact fields', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bparentPhone\b/, /\bparentEmail\b/, /\bstudentPhone\b/, /\bstudentEmail\b/]),
    );
    expect(violations).toEqual([]);
  });
});
