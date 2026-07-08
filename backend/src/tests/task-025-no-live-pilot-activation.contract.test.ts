import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import { resolve, sep } from 'path';

const servicesDir = resolve(__dirname, '..', 'services');
const routesDir = resolve(__dirname, '..', 'routes');
const libDir = resolve(__dirname, '..', 'lib');
const contractsDir = resolve(__dirname, '..', 'contracts');

const LIVE_ACTIVATION_PATTERNS: RegExp[] = [
  /\blivePilotActivation\b/,
  /\bactivatePilot\b/,
  /\bexecutePilot\b/,
  /\bstartPilotExecution\b/,
  /\btriggerPilotLive\b/,
  /\blaunchPilot\b/,
  /\bpilotActivationCallback\b/,
  /\bliveInvitationSend\b/,
  /\binviteParticipantsToLive\b/,
  /\bpilotGoLive\b/,
  /\btask026\b.*activate/,
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

describe('task025NoLivePilotActivationContract', () => {
  const allTask025Files = getTask025Files(SOURCE_DIRS);

  it('at least one task025 source file exists to scan', () => {
    expect(allTask025Files.length).toBeGreaterThan(0);
  });

  it('no task025 file contains livePilotActivation field', () => {
    const violations = allTask025Files.flatMap((f) => scanFile(f, [/\blivePilotActivation\b/]));
    expect(violations).toEqual([]);
  });

  it('no task025 file contains activatePilot or executePilot calls', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bactivatePilot\b/, /\bexecutePilot\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains live invitation send patterns', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bliveInvitationSend\b/, /\binviteParticipantsToLive\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains pilotGoLive or launchPilot triggers', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bpilotGoLive\b/, /\blaunchPilot\b/]),
    );
    expect(violations).toEqual([]);
  });

  it('no task025 file contains pilotActivationCallback or triggerPilotLive', () => {
    const violations = allTask025Files.flatMap((f) =>
      scanFile(f, [/\bpilotActivationCallback\b/, /\btriggerPilotLive\b/]),
    );
    expect(violations).toEqual([]);
  });
});
