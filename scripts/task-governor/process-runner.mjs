import { spawn } from 'node:child_process';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { getRepositoryRoot } from './repository-root.mjs';
import { getGovernorRuntimeDir } from './repository-root.mjs';
import crypto from 'node:crypto';

const SECRET_PATTERNS = [
  /(?:password|secret|token|key|api[_-]?key|auth[_-]?token|bearer)[=:]\s*\S+/gi,
  /(?:"|')?(?:eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)(?:"|')?/g,
  /(?:-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----)/g,
];

function redactSecrets(text) {
  let result = text;
  for (const pattern of SECRET_PATTERNS) {
    result = result.replace(pattern, (match) => {
      const parts = match.split(/[=:]\s*/);
      if (parts.length >= 2) {
        return `${parts[0]}=***REDACTED***`;
      }
      return '***REDACTED***';
    });
  }
  return result;
}

function ensureDir(filePath) {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

export function runCommand(opts) {
  const {
    executable,
    args = [],
    cwd,
    timeoutMs = 120000,
    taskId = 'unknown',
    env = {},
  } = opts;

  const repoRoot = getRepositoryRoot();
  const resolvedCwd = cwd ? resolve(repoRoot, cwd) : repoRoot;
  const startTime = Date.now();

  const stdoutParts = [];
  const stderrParts = [];

  return new Promise((resolvePromise) => {
    const child = spawn(executable, args, {
      cwd: resolvedCwd,
      shell: false,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: { ...process.env, ...env },
      windowsHide: true,
    });

    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGTERM');
      setTimeout(() => {
        try { child.kill('SIGKILL'); } catch {}
      }, 2000);
    }, timeoutMs);

    child.stdout.on('data', (data) => {
      stdoutParts.push(data.toString());
    });

    child.stderr.on('data', (data) => {
      stderrParts.push(data.toString());
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      resolvePromise({
        exitCode: -1,
        signal: null,
        timedOut: false,
        duration,
        stdout: stdoutParts.join(''),
        stderr: stderrParts.join('') || err.message,
      });
    });

    child.on('close', (code, signal) => {
      clearTimeout(timer);
      const duration = Date.now() - startTime;
      resolvePromise({
        exitCode: code,
        signal,
        timedOut,
        duration,
        stdout: stdoutParts.join(''),
        stderr: stderrParts.join(''),
      });
    });
  });
}

export async function runAndRecord(opts) {
  const {
    executable, args, cwd, timeoutMs, taskId, gateId, env,
  } = opts;

  const result = await runCommand({
    executable, args, cwd, timeoutMs, taskId, env,
  });

  const runtimeDir = getGovernorRuntimeDir(taskId);
  const logsDir = `${runtimeDir}/logs`;
  ensureDir(logsDir);

  const timestamp = Date.now();
  const stdoutPath = `${logsDir}/${gateId}-${timestamp}-stdout.log`;
  const stderrPath = `${logsDir}/${gateId}-${timestamp}-stderr.log`;

  const redactedStdout = redactSecrets(result.stdout);
  const redactedStderr = redactSecrets(result.stderr);

  writeFileSync(stdoutPath, redactedStdout, 'utf-8');
  writeFileSync(stderrPath, redactedStderr, 'utf-8');

  const stdoutHash = crypto.createHash('sha256').update(redactedStdout).digest('hex');
  const stderrHash = crypto.createHash('sha256').update(redactedStderr).digest('hex');

  return {
    exitCode: result.exitCode,
    signal: result.signal,
    timedOut: result.timedOut,
    duration: result.duration,
    stdoutPath: stdoutPath.replace(/\\/g, '/'),
    stderrPath: stderrPath.replace(/\\/g, '/'),
    stdoutHash,
    stderrHash,
  };
}

export function checkOutputForFailures(stdout, stderr, warningPatterns) {
  const combined = `${stdout}\n${stderr}`;
  const findings = [];
  for (const pattern of warningPatterns) {
    const re = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    let match;
    while ((match = re.exec(combined)) !== null) {
      findings.push({ pattern, match: match[0], index: match.index });
    }
  }
  return findings;
}
